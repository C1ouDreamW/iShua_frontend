# iShua 前端

考纲手札风格的刷题 Web 应用，对接 Atlas API（`api-docs-v3.json`）。

## 环境要求

- Node.js 18+
- npm
- 本地可访问的后端（默认 `http://localhost:8080`），且 CORS 已放行前端开发源

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 Vite 提示的地址（通常为 `http://localhost:5173`）。

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | Atlas API 根地址 | `http://localhost:8080` |

开发环境可在 `.env.development` 中配置：

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查并生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run generate:api` | 从 `api-docs-v3.json` 生成 `src/types/api.d.ts` |

## API 与错误约定

- 业务响应统一为 `Result<T>`，以 **body 中的 `code`** 为准（`code === 200` 为成功），不要仅依赖 HTTP 状态码。
- 鉴权：token 存于 `localStorage` 键 `ishua_token`，非白名单请求自动附加 `Authorization: Bearer`。
- 白名单（不加 Bearer）：注册、登录、公开题库列表、`hot-practice-detail`。
- `code === 401`：清除 token 与用户信息，跳转 `/login?redirect=...`（仅允许站内路径），并提示「登录已过期，请重新登录」。

## 测试账号（联调建议）

联调前请在后端准备至少以下角色各一：

| 角色 | 用途 |
|------|------|
| `USER` | 公开刷题、错题本 |
| `PREMIUM` | 我的题库、试题管理、AI 导入 |
| `ADMIN` | 管理占位页 |

PREMIUM 可通过管理员改角色或使用种子数据；普通用户注册默认为 `USER`。

## 文档

| 文档 | 说明 |
|------|------|
| `docs/design/ishua-ui-spec.md` | UI / 组件 / 验收规格 |
| `docs/implementation-plan.md` | 分阶段实施与进度 |
| `docs/known-gaps.md` | 各阶段验收遗留缺陷与二期 backlog |
| `api-docs-v3.json` | OpenAPI 真源 |

## 里程碑（当前）

- **M1** 访客大厅 + 访客刷题（本地判分）
- **M2** 登录、刷题 submit、错题本
- **M3** PREMIUM 题库与试题管理
- **M4** AI 智能导入
- **M5** 体验收尾（Toast / 错误文案 / 无障碍 / README）
