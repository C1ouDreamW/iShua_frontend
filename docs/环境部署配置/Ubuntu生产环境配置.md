# Ubuntu 生产环境配置

本文档面向 **Linux 服务器**（推荐 **Ubuntu 22.04 LTS**），指导将 **iShua 前端**以生产标准部署：构建静态资源、配置 `VITE_API_BASE_URL`、Nginx 托管 SPA、TLS、缓存与安全基线，并与 Atlas 后端（`ishua-backend`）协同上线。

配置事实来源：`package.json`、`vite.config.ts`、`src/api/client.ts`、`.env.development`、后端 `CorsConfig` 等。

同目录可参考：[Windows开发环境配置.md](./Windows开发环境配置.md)。  
后端生产见：`../backend/docs/环境部署配置/Linux生产环境部署指南.md`（monorepo 根目录 `Shua/backend`）。

---

## 1. 适用范围与生产目标

| 项 | 说明 |
|----|------|
| 部署形态 | 静态站点（`dist/`）+ **Nginx**（推荐） |
| 构建机 | 可在 CI、本机或服务器上执行 `npm run build` |
| 运行时 | **无需** Node 常驻进程（仅构建阶段需要 Node） |
| 路由 | React Router `createBrowserRouter`，需 **SPA 回退** |
| API | 构建时注入 `VITE_API_BASE_URL`（Vite 环境变量在 build 时固化） |

生产环境**不要**把 Vite 开发服务器（`npm run dev`）暴露到公网。

完成本指南后，你应能：

- 在 Ubuntu 上安装 Node 18+ 并完成可重复构建；
- 使用 `.env.production` 指向正式 API（同域或子域）；
- 用 Nginx 提供 HTTPS、gzip/brotli、静态缓存与 `try_files`；
- 与已部署的 `ishua-backend`（8080 + 可选 Nginx 反代）联调通过；
- 按需更新前端而不影响后端进程（仅替换 `dist/`）。

---

## 2. 生产架构

### 2.1 推荐：同域部署（免改 CORS）

```text
                    Internet
                        │
                        ▼
                 ┌─────────────┐
                 │   Nginx     │  :443 TLS
                 │  example.com│
                 └──────┬──────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
   /  → dist/index.html          /api/ → 127.0.0.1:8080
   (SPA 静态资源)                 (反代 ishua-backend)
```

浏览器请求 `https://example.com/api/v1/...` 与页面 `https://example.com/` **同源**，无需浏览器跨域，后端 `CorsConfig` 可保持仅开发域或后续再收紧。

构建时示例：

```env
VITE_API_BASE_URL=https://example.com
```

前端请求 `${API_BASE_URL}/api/v1/...` → 实际为 `https://example.com/api/v1/...`（须在 Nginx 将 `/api` 转发到后端）。

### 2.2 备选：前后端不同域

```text
  https://app.example.com     ──►  Nginx → /var/www/ishua/dist
  https://api.example.com     ──►  Nginx → 127.0.0.1:8080
```

构建时：

```env
VITE_API_BASE_URL=https://api.example.com
```

**必须**修改后端 `CorsConfig.FRONTEND_ORIGIN` 为 `https://app.example.com`（或改为配置化），重新打包部署后端，否则浏览器会拦截跨域。

当前代码（须上线前处理）：

```java
// backend CorsConfig.java
private static final String FRONTEND_ORIGIN = "http://localhost:5173";
```

---

## 3. 服务器准备

### 3.1 硬件建议

| 资源 | 仅静态前端 | 前后端同机 |
|------|------------|------------|
| CPU | 1 核 | 2 核+ |
| 内存 | 1 GB | 4 GB+（另见后端指南） |
| 磁盘 | 10 GB+ | 40 GB+ |
| OS | Ubuntu 22.04 LTS | 同左 |

### 3.2 系统更新与工具

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ca-certificates nginx
```

### 3.3 时区

```bash
sudo timedatectl set-timezone Asia/Shanghai
```

---

## 4. 安装 Node.js（构建用）

生产服务器若仅在 CI 构建，可跳过本节；若在服务器本地构建，安装 Node 20 LTS：

### 4.1 NodeSource（推荐）

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
npm -v
```

### 4.2 或使用 nvm（多版本）

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 4.3 构建依赖（sharp）

Logo 预构建脚本依赖 `sharp`，在 Linux 上一般 `npm install` 即可；若报错：

```bash
sudo apt install -y build-essential python3
npm rebuild sharp
```

---

## 5. 部署目录与用户

建议专用用户托管静态文件（与后端 `atlas` 用户可同可不同）：

```bash
sudo useradd -r -m -s /bin/bash ishua
sudo mkdir -p /opt/ishua/frontend /var/www/ishua
sudo chown -R ishua:ishua /opt/ishua /var/www/ishua
```

| 路径 | 用途 |
|------|------|
| `/opt/ishua/frontend/` | 源码、`package.json`、构建产物临时目录 |
| `/var/www/ishua/dist/` | Nginx `root` 指向的线上静态文件 |

---

## 6. 获取代码与环境变量

### 6.1 拉取代码

```bash
sudo -u ishua -i
cd /opt/ishua/frontend
git clone <你的前端仓库地址> .
# 或从 monorepo 只同步 frontend 子目录
```

### 6.2 生产环境变量（构建前必配）

在仓库根目录创建 **`.env.production`**（勿提交含密钥的私有文件；可放在服务器 `/etc/ishua/frontend.env` 再复制）：

**同域方案：**

```env
VITE_API_BASE_URL=https://example.com
```

**API 子域方案：**

```env
VITE_API_BASE_URL=https://api.example.com
```

> **重要：** Vite 在 `npm run build` 时将 `VITE_*` **编译进 JS**，部署后改 Nginx 无法改 API 地址，必须重新构建并覆盖 `dist/`。

### 6.3 从环境文件构建（可选）

```bash
# 若使用 /etc/ishua/frontend.env
set -a
source /etc/ishua/frontend.env
set +a
npm ci
npm run build
```

`frontend.env` 示例：

```bash
VITE_API_BASE_URL=https://example.com
```

```bash
sudo mkdir -p /etc/ishua
sudo nano /etc/ishua/frontend.env
sudo chmod 600 /etc/ishua/frontend.env
sudo chown root:ishua /etc/ishua/frontend.env
```

---

## 7. 构建与发布静态资源

### 7.1 安装依赖并构建

```bash
cd /opt/ishua/frontend
npm ci
npm run build
```

成功产物目录：`dist/`（含 `index.html`、哈希命名的 JS/CSS/assets）。

### 7.2 发布到 Nginx 目录

```bash
rsync -a --delete dist/ /var/www/ishua/dist/
# 或
rm -rf /var/www/ishua/dist/*
cp -a dist/* /var/www/ishua/dist/
sudo chown -R www-data:www-data /var/www/ishua/dist
```

### 7.3 仅构建机 + scp（常见 CI 流程）

在 CI 或开发机：

```bash
npm ci
npm run build
tar -czf ishua-dist.tar.gz -C dist .
scp ishua-dist.tar.gz deploy@your-server:/tmp/
```

在服务器：

```bash
sudo tar -xzf /tmp/ishua-dist.tar.gz -C /var/www/ishua/dist
sudo chown -R www-data:www-data /var/www/ishua/dist
```

---

## 8. Nginx 配置

### 8.1 方案 A：同域 — 静态 + API 反代（推荐）

`/etc/nginx/sites-available/ishua`：

```nginx
upstream ishua_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    root /var/www/ishua/dist;
    index index.html;

    # 与后端 multipart 对齐（AI 导入上传）
    client_max_body_size 12m;

    # API → Spring Boot
    location /api/ {
        proxy_pass http://ishua_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
    }

    # OpenAPI / Swagger（生产建议限制访问，见 8.4）
    location /v3/api-docs {
        proxy_pass http://ishua_backend;
        proxy_set_header Host $host;
    }
    location /swagger-ui.html {
        proxy_pass http://ishua_backend;
        proxy_set_header Host $host;
    }
    location /swagger-ui/ {
        proxy_pass http://ishua_backend;
        proxy_set_header Host $host;
    }

    # 带哈希的静态资源长期缓存
    location /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # SPA：其余路径回退 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
}
```

启用：

```bash
sudo ln -sf /etc/nginx/sites-available/ishua /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

构建环境变量须为：

```env
VITE_API_BASE_URL=https://example.com
```

（前端请求 `/api/v1/...` 时拼在根 URL 后，得到 `https://example.com/api/v1/...`。）

### 8.2 方案 B：仅静态 — API 在独立域名

`/etc/nginx/sites-available/ishua-app`：

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate     /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

    root /var/www/ishua/dist;
    index index.html;

    location /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

构建：

```env
VITE_API_BASE_URL=https://api.example.com
```

后端 Nginx（`api.example.com`）见后端 [Linux生产环境部署指南.md](../../backend/docs/环境部署配置/Linux生产环境部署指南.md) 第 13 节，并**务必**更新 `CorsConfig`。

### 8.3 HTTPS（Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
# 或 -d app.example.com -d api.example.com
```

### 8.4 生产 Swagger / 文档暴露

同域配置下，`/swagger-ui.html` 会随 Nginx 暴露。建议：

- IP 白名单；或
- `location /swagger-ui` 仅 `allow` 内网；或
- 后端关闭 `springdoc.swagger-ui.enabled`（需改后端配置重新发布）。

---

## 9. 与后端协同上线清单

| 步骤 | 前端 | 后端 |
|------|------|------|
| 1 | 创建 `.env.production` | 配置 `/etc/atlas/ishua-backend.env` |
| 2 | `npm run build` | `mvn package` + systemd 启动 |
| 3 | 同步 `dist/` 到 `/var/www/ishua/dist` | 监听 127.0.0.1:8080 |
| 4 | Nginx `root` + `try_files` | Nginx `/api/` 反代（同域时） |
| 5 | — | MySQL DDL 已执行、Redis 密码已设 |
| 6 | 跨域：同域可不改 CORS | 异域须改 `CorsConfig` |
| 7 | 验证登录、刷题、上传 | AI Worker 可选 |

后端 systemd、防火墙、备份见后端 Linux 指南。

---

## 10. 防火墙

仅托管前端静态且 API 同机经 Nginx 转发时：

```bash
sudo ufw default deny incoming
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**不要**对公网开放 5173（Vite）、4173（preview）、8080（应只监听 127.0.0.1 或由 Nginx 反代）。

---

## 11. 发布与回滚流程

### 11.1 常规发布

```bash
cd /opt/ishua/frontend
git pull
source /etc/ishua/frontend.env   # 若使用
npm ci
npm run build
sudo rsync -a --delete dist/ /var/www/ishua/dist/
sudo nginx -t && sudo systemctl reload nginx
```

### 11.2 回滚

保留上一版 `dist` 备份：

```bash
sudo cp -a /var/www/ishua/dist /var/backups/ishua-dist-$(date +%F-%H%M)
# 回滚时
sudo rsync -a --delete /var/backups/ishua-dist-YYYY-MM-DD-HHMM/ /var/www/ishua/dist/
```

若回滚版本依赖不同 `VITE_API_BASE_URL`，须用对应 `.env.production` **重新构建**，不能只换静态文件。

### 11.3 可选：发布脚本

`/opt/ishua/frontend/scripts/deploy.sh`（示例，按团队调整）：

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/ishua/frontend
source /etc/ishua/frontend.env
npm ci
npm run build
rsync -a --delete dist/ /var/www/ishua/dist/
nginx -t
```

---

## 12. 安全清单（生产必查）

- [ ] 公网不运行 `npm run dev` / `vite preview`
- [ ] `VITE_API_BASE_URL` 使用 **HTTPS** 正式域
- [ ] `.env.production` / `/etc/ishua/frontend.env` 权限 **600**，不含后端密钥
- [ ] Nginx TLS 1.2+，证书自动续期（certbot timer）
- [ ] SPA `try_files` 已配置，避免刷新 404
- [ ] 异域部署已更新后端 **CORS**
- [ ] Swagger 不对公网裸奔（同域时尤其注意）
- [ ] 静态 `index.html` 使用较短缓存或 `no-cache`，带 hash 的 `/assets/*` 长期缓存（见 8.1）
- [ ] `ishua_token` 存于 localStorage：须依赖 HTTPS 防窃听；考虑 CSP（按需）

---

## 13. 功能验证

1. **静态页**：`curl -I https://example.com/` 返回 200，`Content-Type: text/html`。
2. **SPA 路由**：浏览器直接打开 `https://example.com/login` 不出现 Nginx 404。
3. **API**：开发者工具 Network 中请求为 `https://example.com/api/v1/...`（同域）或 `https://api.example.com/api/v1/...`（异域），响应 JSON `code === 200` 表示业务成功。
4. **公开接口**：未登录访问大厅，公开题库列表正常。
5. **登录态**：注册 → 登录 → 刷新仍登录；`Application → Local Storage` 有 `ishua_token`。
6. **401**：清除 token 后访问需登录功能，跳转 `/login` 并提示过期。
7. **构建资源**：`index.html` 引用的 JS/CSS 返回 200，无 Mixed Content（全站 HTTPS）。
8. **PREMIUM / AI 导入（可选）**：上传文件 ≤ 10MB，任务轮询正常（依赖后端 Worker）。

---

## 14. 常见问题

### 14.1 刷新子路由 404

未配置 `try_files $uri $uri/ /index.html;`，补上后 `sudo nginx -t && sudo systemctl reload nginx`。

### 14.2 接口仍指向 localhost:8080

生产包是在未设置 `.env.production` 时构建的，使用了代码默认或开发值。修正 env 后 **重新 `npm run build`** 并覆盖 `dist/`。

### 14.3 跨域错误（浏览器控制台 CORS）

异域部署时检查 `CorsConfig.FRONTEND_ORIGIN` 与页面 origin 完全一致（含 `https`、无尾斜杠）。同域部署不应出现 CORS，若出现请检查是否误将 API 指到另一域。

### 14.4 413 Request Entity Too Large

Nginx `client_max_body_size` 至少 **12m**（与后端 `max-request-size` 一致）。

### 14.5 静态资源 404

确认 `rsync` 目标为 `dist` **内容**而非嵌套 `dist/dist`；`root` 指向含 `index.html` 的目录。

### 14.6 `npm run build` 失败（tsc / sharp）

- 查看完整报错；`npm rebuild sharp`。
- 在构建机安装 `build-essential`。
- Node 版本 ≥ 18。

### 14.7 登录后接口 401

- 后端 `JWT_SECRET` 与部署环境一致。
- 同域反代时确认 `Authorization` 头未被 Nginx 丢弃（默认会转发）。
- 系统时间同步：`timedatectl`。

### 14.8 更新 API 类型后构建失败

在后端更新 OpenAPI 后，将 `api-docs-v3.json` 同步到前端并执行 `npm run generate:api` 再构建。

---

## 15. 与 Windows 开发环境对照

| 项 | Windows 开发 | Ubuntu 生产 |
|----|--------------|-------------|
| 启动命令 | `npm run dev` | 无（仅 Nginx 提供静态） |
| 环境文件 | `.env.development` | `.env.production`（构建前） |
| 端口 | 5173 | 443（80 跳转 HTTPS） |
| API | `http://localhost:8080` | `https://example.com` 或 API 子域 |
| 路由回退 | Vite 内置 | Nginx `try_files` |
| CORS | 后端允许 5173 | 同域免 CORS 或改后端 |

---

## 16. 相关文档

| 文档 | 说明 |
|------|------|
| [README.md](../../README.md) | 脚本与 API 约定 |
| [Windows开发环境配置.md](./Windows开发环境配置.md) | 本地开发一条龙 |
| `backend/docs/环境部署配置/Linux生产环境部署指南.md` | 后端 systemd、MySQL、Redis、API Nginx |
| [docs/known-gaps.md](../known-gaps.md) | 已知限制 |
| `api-docs-v3.json` | OpenAPI 真源 |

---

## 17. 关键配置摘要

| 类别 | 值 |
|------|-----|
| 包名 | `ishua-frontend` |
| Node | ≥ 18（推荐 20 LTS） |
| 开发端口 | 5173（Vite） |
| 构建输出 | `dist/` |
| 环境变量 | `VITE_API_BASE_URL`（build 时注入） |
| Token 存储 | `localStorage` → `ishua_token` |
| 路由模式 | `createBrowserRouter`（需服务端 SPA 回退） |
| Logo | `prebuild` → `scripts/optimize-logo.mjs`（sharp） |

---

*生产部署请以当前分支代码为准；若改为环境变量配置 CORS 或增加 `base` 路径部署，须同步更新本文档与 Nginx `location`。*
