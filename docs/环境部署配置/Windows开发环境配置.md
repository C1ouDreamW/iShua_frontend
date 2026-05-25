# Windows 开发环境配置

本文档面向 **Windows 10/11** 本地开发机，帮助你在单机上一站式跑通 **iShua 前端**（Vite + React），并与同仓库旁的 Atlas 后端（`ishua-backend`，默认 `http://localhost:8080`）联调。

同目录可参考：[Ubuntu生产环境配置.md](./Ubuntu生产环境配置.md)。  
后端环境见：`../backend/docs/环境部署配置/Windows开发环境部署指南.md`（路径相对于 monorepo 根目录 `Shua/`）。

---

## 1. 适用范围与目标

| 项 | 说明 |
|----|------|
| 操作系统 | Windows 10 / 11（64 位） |
| 终端 | PowerShell 5.1+ 或 Windows Terminal |
| 用途 | 本地开发、UI 调试、与 Atlas API 联调 |
| 前端开发端口 | **5173**（Vite 默认，可在 `vite.config.ts` 中改 `server.port`） |
| 后端 API 端口 | **8080**（Spring Boot 默认） |
| 跨域 | 后端 `CorsConfig` 当前仅放行 `http://localhost:5173` |

完成本指南后，你应能：

- 安装 Node.js 18+ 与 npm，拉取依赖并成功 `npm run dev`；
- 通过 `.env.development` 指向本机后端；
- 在浏览器完成注册/登录、刷题、错题本等主流程；
- （可选）从 `api-docs-v4.json` 重新生成 TypeScript API 类型；
- 与后端、MySQL、Redis 组成完整本地链路（后端步骤见后端文档）。

---

## 2. 部署架构速览

```text
┌──────────────────────┐     HTTP API      ┌─────────────────────────┐
│  iShua 前端 (Vite)    │ ────────────────► │  ishua-backend (Java)     │
│  http://localhost:   │   :8080 /api/v1   │  http://localhost:8080   │
│       5173           │                   └───────────┬─────────────┘
└──────────────────────┘                               │
        │                                                │
        │  静态资源、HMR                                  ▼
        │                                    MySQL + Redis（后端依赖）
        ▼
  浏览器 localStorage
  键 ishua_token / ishua_user
```

**说明：**

- 前端为纯 SPA，**无 Node 服务端**；开发时 Vite 提供 HMR，生产为 `dist/` 静态文件。
- API 基址由环境变量 **`VITE_API_BASE_URL`** 注入，在 `src/api/client.ts` 中读取。
- 鉴权 Token 存于 `localStorage`（键 `ishua_token`），请求自动带 `Authorization: Bearer`。

---

## 3. 前置软件清单

| 软件 | 版本要求 | 用途 |
|------|----------|------|
| Node.js | **≥ 18**（推荐 20 LTS） | 运行 Vite、构建、脚本 |
| npm | 随 Node 安装（≥ 9） | 依赖安装与脚本 |
| Git | 较新版本 | 拉取代码 |
| 编辑器（推荐） | VS Code / Cursor | 开发；建议装 ESLint 扩展 |
| 浏览器 | Chrome / Edge 最新 | 调试；需允许 localhost |
| 后端栈（联调必备） | JDK 17、Maven、MySQL 8、Redis | 见后端 Windows 指南 |

可选：

| 软件 | 用途 |
|------|------|
| Bruno / Postman | 不启前端时直接调 API |
| nvm-windows | 多版本 Node 切换 |

---

## 4. 安装 Node.js

### 4.1 下载与安装

1. 打开 [Node.js 官网](https://nodejs.org/)，下载 **LTS**（当前推荐 20.x）Windows x64 **.msi**。
2. 安装时勾选 **Add to PATH**，可选安装 **Tools for Native Modules**（`sharp` 等原生模块在部分环境需要）。
3. 安装路径避免含中文与空格，例如：`C:\Program Files\nodejs\`。

### 4.2 验证

```powershell
node -v
# 应显示 v18.x 或 v20.x

npm -v
# 应显示 9.x 或 10.x
```

### 4.3 使用 nvm-windows（可选）

若需多项目切换 Node 版本：

1. 安装 [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)。
2. 以**管理员** PowerShell 执行：

```powershell
nvm install 20
nvm use 20
node -v
```

---

## 5. 获取项目代码

Monorepo 典型布局：

```text
D:\C1ouD\Shua\
  ├── frontend\          ← 本文档所在仓库（ishua-frontend）
  ├── backend\           ← Atlas API
  └── ...
```

```powershell
cd D:\C1ouD\Shua\frontend   # 替换为你的实际路径
git status
```

关键路径：

| 路径 | 说明 |
|------|------|
| `package.json` | 脚本与依赖 |
| `.env.development` | 开发环境 API 地址（已提交示例） |
| `api-docs-v4.json` | OpenAPI 真源，用于 `generate:api` |
| `src/api/client.ts` | `API_BASE_URL`、鉴权与白名单 |
| `assets/logo/logo.png` | Logo 源图；构建前会生成 `logo.webp` |

---

## 6. 环境变量

Vite 仅将 **`VITE_` 前缀**的变量暴露给客户端；修改后需**重启** `npm run dev`。生产构建时变量会**写入打包产物**，生产须在 **build 之前** 配置 `.env.production`。

### 6.1 变量说明

| 变量 | 说明 | 开发示例 |
|------|------|----------|
| `VITE_API_BASE_URL` | Atlas API 根地址（无末尾 `/`） | `http://localhost:8080` |

代码默认值（未设置时）：`http://localhost:8080`（见 `src/api/client.ts`）。

### 6.2 开发环境文件

仓库已包含 `.env.development`：

```env
VITE_API_BASE_URL=http://localhost:8080
```

若后端改端口（例如 `8081`），同步修改该文件并重启 Vite。

### 6.3 本地覆盖（可选，不提交）

创建 `.env.local` 或 `.env.development.local`（已被 `.gitignore` 忽略），用于个人机器差异，例如：

```env
VITE_API_BASE_URL=http://127.0.0.1:8080
```

优先级（高 → 低）：`.env.development.local` > `.env.development` > `.env`。

### 6.4 PowerShell 临时覆盖（单次启动）

```powershell
$env:VITE_API_BASE_URL = "http://localhost:8081"
npm run dev
```

---

## 7. 安装依赖与启动

### 7.1 安装

```powershell
cd D:\C1ouD\Shua\frontend
npm install
```

首次安装会拉取 `sharp`（Logo 优化脚本）。若报错与 Visual Studio Build Tools 相关，可安装 [windows-build-tools](https://github.com/nodejs/node-gyp#on-windows) 或使用 Node 官方安装包自带的 native tools 选项。

### 7.2 启动开发服务器

```powershell
npm run dev
```

终端会输出本地地址，通常为：

```text
  ➜  Local:   http://localhost:5173/
```

浏览器打开该地址。若端口被占用，Vite 会自动尝试下一端口；**若非常 5173，须同步修改后端 `CorsConfig.FRONTEND_ORIGIN`** 并重启后端。

### 7.3 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 + HMR |
| `npm run build` | `tsc -b` + 生产构建（会先执行 `prebuild` 优化 Logo） |
| `npm run preview` | 本地预览 `dist/`（默认另一端口，如 4173） |
| `npm run lint` | ESLint |
| `npm run generate:api` | 从 `api-docs-v4.json` 生成 `src/types/api.d.ts` |
| `npm run optimize:logo` | 从 `assets/logo/logo.png` 生成 256px `logo.webp` |

---

## 8. 与后端联调（一条龙顺序）

建议按以下顺序操作，避免「前端已开、后端未就绪」的 401/CORS/网络错误。

### 8.1 启动后端依赖

按后端文档完成：

1. MySQL：库 `ishua_atlas` + 执行 `backend/sql/schema/init_core_tables.sql`
2. Redis：本机 `6379` 可 `PING`
3. 配置 `DB_*`、`REDIS_*`、`JWT_SECRET` 等环境变量
4. `mvn spring-boot:run` 或 IDEA 运行 `ishuaBackendApplication`

确认：浏览器可打开 http://localhost:8080/swagger-ui.html

### 8.2 启动前端

```powershell
cd D:\C1ouD\Shua\frontend
npm run dev
```

确认 `.env.development` 中 `VITE_API_BASE_URL=http://localhost:8080`。

### 8.3 CORS 与凭证

后端 `CorsConfig` 允许：

- 来源：`http://localhost:5173`
- `allowCredentials: true`

前端 `fetch` 使用同源策略下的跨域请求；Token 走 Header，不依赖 Cookie 跨域。

### 8.4 测试账号建议

| 角色 | 用途 |
|------|------|
| `USER` | 公开刷题、错题本 |
| `PREMIUM` | 私有题库、试题管理、AI 导入 |
| `ADMIN` | 管理占位页 |

可通过 Swagger 注册，或由后端种子数据准备；新用户默认 `USER`。

### 8.5 API 约定（联调必读）

- 业务成功以响应 JSON 的 **`code === 200`** 为准，勿只看 HTTP 状态码。
- `code === 401`：前端清除 `ishua_token` 并跳转 `/login?redirect=...`。
- 无需 Token 的接口（白名单）：注册、登录、公开题库列表、`hot-practice-detail`（见 `src/api/client.ts`）。

---

## 9. 编辑器与工程配置

### 9.1 VS Code / Cursor 推荐

| 扩展 | 用途 |
|------|------|
| ESLint | 与 `npm run lint` 一致 |
| TypeScript | 类型检查 |
| Tailwind CSS IntelliSense | `@tailwindcss/vite` 类名提示 |

### 9.2 路径别名

`vite.config.ts` 中 `@` → `src/`。`tsconfig` 已配置对应 paths，IDE 跳转应正常。

### 9.3 同步 OpenAPI 类型

后端接口变更后，将最新 `api-docs` 放到仓库根目录 `api-docs-v4.json`，然后：

```powershell
npm run generate:api
```

提交更新后的 `src/types/api.d.ts`（若团队约定由 PR 统一生成）。

---

## 10. 本地生产构建预览

在不部署服务器的情况下验证打包结果：

```powershell
# 使用与开发相同的后端地址（preview 不会读 .env.development，需 .env.production 或命令行）
@"
VITE_API_BASE_URL=http://localhost:8080
"@ | Out-File -Encoding utf8 .env.production

npm run build
npm run preview
```

浏览器访问 preview 输出的地址（通常 http://localhost:4173）。  
**注意：** `preview` 仍从浏览器直连 `VITE_API_BASE_URL`；后端 CORS 仍须包含该前端源，或改用第 11 节「同域反代」思路在本地用 Nginx 模拟。

---

## 11. Logo 资源流水线

| 文件 | 说明 |
|------|------|
| `assets/logo/logo.png` | 源图，换标只改此文件 |
| `assets/logo/logo.webp` | 构建用 256px WebP，**勿手改** |

`npm run build` 前自动执行 `prebuild` → `optimize:logo`（依赖 `sharp`）。单独执行：

```powershell
npm run optimize:logo
```

---

## 12. 功能验证清单

按顺序自检：

1. **依赖**：`npm install` 无报错。
2. **开发服务**：`npm run dev`，http://localhost:5173 可打开首页。
3. **公开接口**：未登录可浏览访客大厅 / 公开题库（请求 `GET /api/v1/question-banks/public`）。
4. **注册登录**：注册 → 登录 → 刷新后仍保持登录（`localStorage` 有 `ishua_token`）。
5. **刷题**：登录后进入刷题流，`code === 200` 时题目与提交正常。
6. **401**：手动删除 `ishua_token` 后访问需登录页，应跳转登录并提示过期文案。
7. **PREMIUM（可选）**：私有题库、试题 CRUD、AI 导入页（需后端 + Redis + 可选 Python Worker）。
8. **构建**：`npm run build` 生成 `dist/`，`npm run preview` 可访问。

---

## 13. 常见问题

### 13.1 `npm install` / `sharp` 失败

- 确认 Node 为 64 位 LTS，重装 Node 并勾选 native tools。
- 在项目目录执行：`npm rebuild sharp`。
- 公司代理下配置：`npm config set proxy / https-proxy`（按需）。

### 13.2 页面空白或模块加载失败

- 检查终端 Vite 是否报错；清除缓存：`Remove-Item -Recurse -Force node_modules; npm install`。
- 路径别名：导入使用 `@/...`，勿写错相对路径。

### 13.3 接口 `Failed to fetch` / 网络错误

- 后端是否监听 8080：`curl http://localhost:8080/v3/api-docs` 或在浏览器打开 Swagger。
- `VITE_API_BASE_URL` 是否与后端一致（无多余路径，如不要写成 `http://localhost:8080/api`）。
- 修改 `.env.development` 后是否**重启**了 `npm run dev`。

### 13.4 CORS 错误

- 前端必须是 `http://localhost:5173`（与 `CorsConfig` 一致）。
- 若 Vite 使用了其他端口，改 `backend` 中 `CorsConfig.FRONTEND_ORIGIN` 后重新编译后端。

### 13.5 业务 `code` 非 200 但 HTTP 200

- 属正常：阅读响应 `message`，对照 Swagger 参数与角色权限（`USER` / `PREMIUM` / `ADMIN`）。

### 13.6 登录后立即 401

- 后端 `JWT_SECRET` 是否稳定（重启后端未改 secret 时，旧 token 仍有效）。
- 请求头是否带 `Authorization: Bearer <token>`（可在浏览器开发者工具 Network 查看）。

### 13.7 端口 5173 被占用

```powershell
netstat -ano | findstr :5173
taskkill /PID <pid> /F
```

或在 `vite.config.ts` 增加：

```ts
export default defineConfig({
  // ...
  server: { port: 5174 },
});
```

并同步后端 CORS。

### 13.8 `npm run build` 类型错误

- 先 `npm run lint`，根据 `tsc -b` 输出修复类型；API 变更时运行 `npm run generate:api`。

### 13.9 环境变量修改不生效

- 开发：必须重启 `npm run dev`。
- 生产：`VITE_*` 在 **build 时** 固化，改环境变量后需重新 `npm run build`。

---

## 14. 与生产环境的差异

| 项 | 开发 (Windows) | 生产 (Ubuntu) |
|----|----------------|---------------|
| 命令 | `npm run dev` | `npm run build` + Nginx 托管 `dist/` |
| API 地址 | `.env.development` | `.env.production`（构建前写入） |
| 跨域 | 后端允许 `localhost:5173` | 建议同域反代或改 `CorsConfig` |
| 路由 | Vite 默认支持 SPA | Nginx 需 `try_files` 回退 `index.html` |
| 热更新 | 有 | 无 |

生产步骤详见：[Ubuntu生产环境配置.md](./Ubuntu生产环境配置.md)。

---

## 15. 相关文档

| 文档 | 说明 |
|------|------|
| [README.md](../../README.md) | 项目概览与脚本 |
| [docs/implementation-plan.md](../implementation-plan.md) | 分阶段实施 |
| [docs/design/ishua-ui-spec.md](../design/ishua-ui-spec.md) | UI 规格 |
| `backend/docs/环境部署配置/Windows开发环境部署指南.md` | 后端 Windows 一条龙 |
| `api-docs-v4.json` | OpenAPI 真源 |

---

*文档版本与仓库实现同步；若 `CorsConfig`、环境变量或脚本变更，请以代码为准并更新本文档。*
