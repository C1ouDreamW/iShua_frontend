<div align="center">

# iShua

### AI 驱动的智能题库与刷题平台 — 前端

把 PDF、Word、TXT 中的题目变成可编辑、可练习、可复习的在线题库。

<p>
  <a href="https://ishua.cloud"><img src="https://img.shields.io/badge/在线体验-ishua.cloud-6C63FF?style=for-the-badge&amp;logo=googlechrome&amp;logoColor=white" alt="在线体验"></a>
  <a href="https://github.com/C1ouDreamW/iShua_frontend/actions/workflows/deploy-frontend.yml"><img src="https://img.shields.io/github/actions/workflow/status/C1ouDreamW/iShua_frontend/deploy-frontend.yml?branch=main&amp;style=for-the-badge&amp;label=Deploy&amp;logo=github" alt="Deploy"></a>
</p>

<p>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&amp;logo=react&amp;logoColor=black" alt="React 19"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-latest-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="TypeScript"></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-latest-646CFF?style=flat-square&amp;logo=vite&amp;logoColor=white" alt="Vite"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&amp;logo=tailwindcss&amp;logoColor=white" alt="Tailwind CSS v4"></a>
  <a href="https://ui.shadcn.com/"><img src="https://img.shields.io/badge/shadcn/ui-New_York-000000?style=flat-square&amp;logo=shadcnui&amp;logoColor=white" alt="shadcn/ui"></a>
</p>

[在线体验](https://ishua.cloud) · [快速开始](#快速开始) · [设计文档](docs/design/ishua-ui-spec.md)

</div>

---

iShua 前端是面向大学生备考与日常复习场景的单页应用，提供**一页一题、沉浸刷题**的交互体验。项目基于 React 19 + TypeScript + Vite，使用 Tailwind CSS v4 与 shadcn/ui 构建「考纲手札」风格界面，通过 React Router v7 实现访客大厅与登录后 App Shell 双模式路由。

## 核心能力

| 能力 | 说明 |
| --- | --- |
| **访客大厅与公开刷题** | 无需登录即可浏览公开题库树，支持顺序/随机刷题，本地判分反馈。 |
| **登录刷题与错题本** | JWT 登录态，服务端判分并自动归档错题，支持错题重刷。 |
| **树形题库管理** | PREMIUM+ 可创建 FOLDER / LEAF 题库节点，拖拽排序，支持试题增删改查。 |
| **AI 智能导入** | 上传文档异步解析为标准化题目，预览确认后批量入库。 |
| **AI 智能解答** | 对缺少答案的客观题发起 AI 解答请求，返回答案与置信度。 |
| **沉浸式练习模式** | 一页一题全屏刷题体验，支持答题交卷、答案揭示、自动进入下一题。 |
| **朗读模式** | 闪卡式背诵，直接展示正确答案，适合考前快速过题。 |
| **纸感视觉风格** | 纸张纹理背景、横线稿纸刷题区、温暖中性色系与品牌绿 `#2d6a4f`。 |
| **响应式适配** | 桌面侧边导航 + 移动底部 Tab 栏，安全区适配与触摸反馈。 |
| **Turnstile 人机验证** | 注册页集成 Cloudflare Turnstile，防止机器批量注册。 |

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 框架与语言 | React 19、TypeScript 5 |
| 构建工具 | Vite、`@vitejs/plugin-react` |
| 样式方案 | Tailwind CSS v4、`@tailwindcss/vite`、shadcn/ui (New York) |
| 路由 | React Router v7 (`createBrowserRouter`) |
| 动画 | Motion (Framer Motion) |
| 公式渲染 | KaTeX |
| 图标 | Lucide React |
| 拖拽排序 | @dnd-kit (core + sortable) |
| HTTP 客户端 | 原生 fetch 封装 + JWT 拦截器 |
| API 类型生成 | openapi-typescript（从 `api-docs-v5.json` 生成） |
| 题型判分 | 客户端本地判分（访客）/ 服务端判分（登录用户） |
| 人机验证 | Cloudflare Turnstile |
| 测试 | Vitest |
| 代码检查 | ESLint + typescript-eslint |
| 部署 | GitHub Actions + rsync |

## 快速开始

### 1. 准备环境

- Node.js 18+
- 本地可访问的后端 API（默认 `http://localhost:8080`），需放行前端开发源 CORS

### 2. 启动开发服务器

```bash
git clone https://github.com/C1ouDreamW/iShua_frontend.git
cd iShua_frontend

npm install
npm run dev
```

浏览器打开 Vite 提示的地址（通常 `http://localhost:5173`）。

### 3. 环境变量

在 `.env.development` 中配置：

```env
# 后端 API 根地址
VITE_API_BASE_URL=http://localhost:8080

# Cloudflare Turnstile 站点 Key（留空使用测试 Key）
VITE_TURNSTILE_SITE_KEY=
```

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Atlas API 根地址 | `http://localhost:8080` |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile 站点 Key | 留空使用 CF 测试 Key |

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | TypeScript 类型检查 + 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 运行 Vitest 测试 |
| `npm run generate:api` | 从 `api-docs-v5.json` 生成 `src/types/api.d.ts` |
| `npm run optimize:logo` | 从 `assets/logo/logo.png` 生成 256px `logo.webp`（`build` 前自动执行） |
| `npm run generate:spine-mascot` | 生成 Spine 吉祥物动画数据 |

## API 约定

- 业务响应统一为 `Result<T>`，以 **body 中的 `code`** 为准（`code === 200` 为成功），不依赖 HTTP 状态码。
- 鉴权：token 存于 `localStorage` 键 `ishua_token`，非白名单请求自动附加 `Authorization: Bearer`。
- 白名单（不加 Bearer）：注册、登录、公开题库列表、`hot-practice-detail`。
- `code === 401`：清除 token 与用户信息，跳转 `/login?redirect=...`（仅允许站内路径），并提示「登录已过期，请重新登录」。

## 项目结构

```text
.
├── src/
│   ├── api/                # HTTP 客户端与各模块 API 封装
│   ├── components/         # 可复用组件
│   │   ├── ui/             # shadcn/ui 基础组件
│   │   ├── auth/           # 认证相关组件
│   │   ├── bank-tree/      # 题库树组件（递归树、拖拽排序）
│   │   ├── import/         # AI 导入向导、预览表、AI 解答面板
│   │   ├── question/       # 试题列表、类型标签、答案标签
│   │   └── motion/         # 动画包装组件
│   ├── hooks/              # 自定义 Hooks（认证、刷题、朗诵、AI 导入等）
│   ├── layouts/            # 布局组件（AppShell 侧边栏 + 移动导航）
│   ├── lib/                # 工具库（判分、RBAC、导航、错误处理等）
│   ├── pages/              # 页面组件（首页、刷题、管理、管理等）
│   ├── styles/             # 全局样式（设计令牌、纸张主题）
│   └── types/              # TypeScript 类型定义（API 类型自动生成）
├── assets/logo/            # Logo 源文件与生成脚本
├── scripts/                # 构建辅助脚本
├── docs/                   # 设计与实施文档
├── api-docs-v5.json        # OpenAPI 规范（类型生成真源）
└── public/                 # 静态资源
```

| 想了解的内容 | 文档 |
| --- | --- |
| UI 组件与验收规格 | [UI Spec](docs/design/ishua-ui-spec.md) |
| 分阶段实施与进度 | [实施计划](docs/implementation-plan.md) |
| 已知缺陷与 backlog | [已知缺口](docs/known-gaps.md) |
| UX 审查待修复项 | [UX 审查](docs/ux-audit-pending-fixes.md) |

## 里程碑

| 阶段 | 内容 |
| --- | --- |
| **M1** | 访客大厅 + 访客刷题（本地判分） |
| **M2** | 登录、刷题 submit、错题本 |
| **M3** | PREMIUM 题库与试题管理 |
| **M4** | AI 智能导入 |
| **M5** | 体验收尾（Toast / 错误文案 / 无障碍 / README） |

## 测试

```bash
npm run test
```

测试框架为 [Vitest](https://vitest.dev/)，测试文件位于 `src/**/*.test.ts`。

---

<div align="center">

如果 iShua 对你有帮助，欢迎 Star，或向[后端](https://github.com/C1ouDreamW/iShua_backend) / [前端](https://github.com/C1ouDreamW/iShua_frontend)提交 Issue 或 Pull Request。

</div>
