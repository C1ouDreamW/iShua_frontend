# iShua — UI 设计规格（终稿）

> 由 **UI 设计工坊**（阶段 5 组件规格 + 阶段 6 终稿）生成  
> 日期：2026-05-19  
> API 依据：根目录 `api-docs-v4.json`  
> 粗稿参考：`docs/design/atlas-ui-design-draft.md`（本文不替代草稿，为可开发交付规格）

---

## 1. 立项摘要

**iShua** 是学生自用的在线刷题产品（内部工程代号：Shua / Pleione / Atlas）。核心路径：访客在大厅浏览公开题库并刷题 → 注册登录后同步错题、管理自建题库（PREMIUM）、AI 导入题目。

| 维度 | 说明 |
|------|------|
| **目的** | 低干扰刷题 + 错题巩固 + 题库管理（高阶） |
| **用户** | 仅学生自学 |
| **主任务** | 刷公开/自有题库；复习错题；PREMIUM 建库与导题 |
| **约束** | React + Vite + React Router + shadcn/ui；`localStorage` + Bearer；仅中文；首版无深色模式、无随机顺序、无 ADMIN 业务页 |
| **记忆点** | 提交后解析如手札页边批注滑入，对错一眼可辨 |

---

## 2. Design Brief

**概念：「考纲手札」** — 可翻阅、可批注的备考笔记本，非冷冰冰后台。

| 维度 | 定稿 |
|------|------|
| **情绪** | 专注、克制、书卷气；长时阅读不刺眼 |
| **主色** | 墨绿 `#2D6A4F`（护眼、学习信任） |
| **背景** | 暖米白 `#F7F5F0`（纸感） |
| **标题字体** | **Noto Serif SC**（或 Source Serif 4），Web 字体，`font-display: swap` |
| **正文字体** | **Noto Sans SC**，回退 `system-ui, sans-serif` |
| **布局** | 刷题单题沉浸窄栏 720px；管理页 1120px；大厅卡片目录 |
| **动效** | 150–250ms；解析区展开 250ms；`prefers-reduced-motion: reduce` 时仅颜色/边框变化 |

**Slogan 摆放**

- 大厅 `/` Logo 下副标题：**「一页一题，沉浸刷完」**
- 登录 `/login`、注册 `/register` 表单上方：**「今天，也刷一点」**

---

## 3. 主题与功能结合

| 视觉决策 | 如何支持任务 |
|----------|----------------|
| 墨绿主色 + 米白底 | 长时间刷题减轻视觉疲劳 |
| 刷题页隐藏侧栏/底栏 | 题干与选项占满视线，符合「沉浸刷完」 |
| 公开大厅卡片仅标题+描述 | 快速选题库，无无效信息 |
| 解析区左侧墨绿竖线 + 批注式排版 | 强化「手札批注」记忆点 |
| 错题与题库练习分页分组件 | 心智模型清晰，避免模式混淆 |
| UpgradePrompt 含可复制邮箱 | USER 明确如何升 PREMIUM |
| 空态 Logo 淡色 + 文案 | 首版不依赖插画资产 |

---

## 4. 设计系统

> **修订（2026-05-26 · V1.1 纸页视觉）**：色板、圆角与纸质 utility 以 `src/styles/tokens.css`、`src/styles/paper.css` 为准；详见 `docs/design/ui-visual-upgrade-plan.md`。练习单页新增 `bg-sheet`、`.paper-sheet` / `.paper-panel`；选项选中改为左边线 + 浅底，不再大面积 `brand-muted` 药丸底。

### 4.1 Color

| Token | 值 | 使用场景 |
|-------|-----|----------|
| `bg-canvas` | `#F0EBE3` | 页面背景（纸堆） |
| `bg-surface` | `#F7F4EC` | 卡片、抽屉、模态 |
| `bg-sheet` | `#FFFEF9` | 练习单页 |
| `text-primary` | `#1A1814` | 题干、标题 |
| `text-secondary` | `#5C564C` | 描述、辅助 |
| `text-muted` | `#8A8478` | 占位、禁用文案 |
| `brand` | `#2D6A4F` | 主按钮、链接、进度条、选中左边框 |
| `brand-hover` | `#245A43` | 主按钮 hover |
| `brand-muted` | `#E8F0EC` | 轻提示、导航选中（选项选中已不用满铺） |
| `success` | `#2D8A5E` | 答对、完成态 |
| `success-bg` | `#EAF5EF` | 答对区域背景 |
| `error` | `#C45C4A` | 答错、破坏性操作 |
| `error-bg` | `#FBF0EE` | 答错区域背景 |
| `warning` | `#B8860B` | 409/429 提示 |
| `border` | `#D4CFC4` | 分割、输入框边框 |

**题型标签色（`TagQuestionType`）**

| 类型 | 背景 | 文字 |
|------|------|------|
| SINGLE | `#E8F0EC` | `#2D6A4F` |
| MULTI | `#EDE8F5` | `#5C4A8A` |
| JUDGE | `#F5F0E8` | `#8A6A4A` |

### 4.2 Typography

| 级别 | 字体 | 字号 | 行高 | 用途 |
|------|------|------|------|------|
| Display | Noto Serif SC | 32px | 1.25 | 大厅主标题 |
| H1 | Noto Serif SC | 24px | 1.3 | 页面标题 |
| H2 | Noto Serif SC | 20px | 1.35 | 区块/题库名 |
| Body | Noto Sans SC | 17px | 1.7 | 题干、选项 |
| Body-sm | Noto Sans SC | 15px | 1.6 | 列表摘要 |
| Caption | Noto Sans SC | 12px | 1.5 | 标签、时间 |
| Progress | Noto Sans SC | 14px | 1.4 | `3 / 12`，`font-variant-numeric: tabular-nums` |

### 4.3 Spacing & Layout

- **间距阶梯**：4 / 8 / 12 / 16 / 24 / 32 / 48 px  
- **栅格**：12 列；gutter 16px（桌面 24px）  
- **容器**：刷题 `max-width: 720px`；管理 `max-width: 1120px`；大厅卡片网格 `minmax(280px, 1fr)`  
- **断点**：`sm 640` / `md 768` / `lg 1024` / `xl 1280`  
- **分页 pageSize**（列表 API，非刷题）：`sm→8`，`md→10`，`lg+→12`（实现可用 `usePagination` 监听 `matchMedia`）

### 4.4 Shape & Depth

| 元素 | 规格 |
|------|------|
| 卡片 | `radius: 12px`；`border: 1px solid border` 或 `shadow-sm` |
| 主按钮 | `radius: 8px`；高 40px（刷题底栏 44px） |
| 输入框 | `radius: 8px`；focus `ring-2 ring-brand/30` |
| 刷题选项行 | `radius: 8px`；选中 `border-left: 3px solid brand` + `brand-muted` 底 |
| 解析区 | 左竖线 3px `brand`；`padding-left: 16px` |

### 4.5 Motion

| 触发 | 效果 | 时长 | reduced-motion |
|------|------|------|----------------|
| 路由进入 | opacity 0→1 | 200ms | 无动画 |
| 提交后解析 | max-height 展开 | 250ms ease-out | 即时显示 |
| Toast | 自底滑入 | 200ms | 仅淡入 |
| Drawer | 右侧滑入 | 250ms | 即时 |
| 骨架屏 | pulse | — | 静态灰块 |

---

## 5. 页面结构

### 5.1 路由总表

| 路径 | 页面 | 壳层 | 最低角色 |
|------|------|------|----------|
| `/` | 公开大厅 | 简易顶栏（无侧栏） | 无 |
| `/practice/guest/:bankId` | 访客刷题 | 极简顶栏 | 无 |
| `/login`, `/register` | 鉴权 | 无壳 | 无 |
| `/app/*` | 登录后业务 | `AppShell` | USER+（按路由再限） |
| `/app`（index） | 重定向 | — | → `/app/banks` |
| `/app/discover` | 发现（占位） | AppShell | USER |
| `/app/banks` | 题库（刷题选题：公共 \| 私有 Tab） | AppShell | USER |
| `/app/manage/banks` | 管理题库（左树 + 右预览） | AppShell | PREMIUM |
| `/app/manage/banks/:bankId` | 题库详情（**仅 LEAF**；路由参数为节点 ID） | AppShell | PREMIUM |
| `/app/manage/banks/:bankId/questions/new` | 新建试题 | AppShell | PREMIUM |
| `/app/manage/banks/:bankId/questions/:id/edit` | 编辑试题 | AppShell | PREMIUM |
| `/app/manage/banks/:bankId/import` | AI 导入 | AppShell | PREMIUM |
| `/app/practice/:bankId` | 题库练习 | **无底栏/无侧栏** | USER |
| `/app/wrong-questions` | 错题列表 | AppShell | USER |
| `/app/wrong-questions/practice` | 错题重刷 | **无底栏/无侧栏** | USER |
| `/app/admin/users` | 管理占位 | AppShell | ADMIN |

**登录默认落地**（无 `?redirect=`）：`USER` / `PREMIUM+` / `ADMIN` → **`/app/banks`**。旧路径 `/app/banks/:bankId` 等**不保留**（见 `docs/plans/navigation-and-banks-ia.md`）。

### 5.2 导航（AppShell）

**桌面 `lg+` 左侧栏宽 240px**

1. 发现 → `/app/discover`（首版占位，二期扩展）  
2. 错题本 → `/app/wrong-questions`（USER+）  
3. 题库 → `/app/banks`（USER+；私有 Tab 对 USER 置灰，点击 UpgradePrompt）  
4. 管理题库 → `/app/manage/banks`（PREMIUM+；USER 侧栏项点击 → UpgradePrompt）  
5. 用户管理 → `/app/admin/users`（ADMIN）  
6. 底栏：头像/昵称、`role` 小标签、退出  

**移动 `<lg` 底栏高 56px**（下列路由**不显示**底栏：`/app/practice/*`、`/practice/guest/*`、`/app/wrong-questions/practice`）

| Tab | 图标意图 | 路径 |
|-----|----------|------|
| 发现 | compass | `/app/discover` |
| 错题 | bookmark-x | `/app/wrong-questions` |
| 题库 | library | `/app/banks` |
| 我的 | user | 打开 Sheet |

**我的 Sheet 内容**：昵称、用户名；USER 显示升级说明 + 邮箱按钮；PREMIUM+ 可选链「管理题库」；退出。

**壳外大厅 `/`**：不作为 App Tab；侧栏 Logo 可链回 `/`。

---

## 6. 线框说明

### 6.1 公开大厅 `/`

```
┌────────────────────────────────────────────────────────┐
│ [Logo 64px]                                            │
│ 一页一题，沉浸刷完   [进入学习]  [昵称 ▾]               │
├────────────────────────────────────────────────────────┤
│ 发现公开题库                                            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │ 标题 H2      │ │             │ │             │       │
│ │ 描述 2行截断 │ │             │ │             │       │
│ │ [开始刷题]   │ │             │ │             │       │
│ └─────────────┘ └─────────────┘ └─────────────┘       │
│                    < 分页 >                             │
└────────────────────────────────────────────────────────┘
```

- 访客：顶栏「登录」「注册」。
- 已登录：主按钮 **「进入学习」** → `/app/banks`；**昵称 ▾** 下拉：用户资料（占位，disabled）、退出。大厅卡片「开始刷题」仍可 → `/app/practice/:bankId`（公开库）。已登录访问 `/` **不强制**跳转 App。

### 6.1.1 App 发现（占位）`/app/discover`

- 标题「发现功能开发中」；说明探索能力二期开放。
- 主操作：**前往题库** → `/app/banks`。
- **无**题库列表、刷题 CTA、新建题库。

### 6.1.2 App 题库（刷题选题）`/app/banks`

- Tab：**公共** | **私有**（`USER` 可见私有 Tab 但置灰，点击 UpgradePrompt）。
- 列表：`BankCard` `lobby`；主操作「开始刷题」。
- **无**「新建题库」；文案引导 PREMIUM 使用侧栏「管理题库」。

### 6.2 刷题页（三种 Player 布局一致）

```
┌──────────────────────────────────────────┐
│ ← 退出   题库练习 / 错题重刷 / 访客刷题   │  进度 3/12
├──────────────────────────────────────────┤
│              max 720px 居中               │
│  [单选]                                   │
│  题干 Body 17px                           │
│  ┌────────────────────────────────────┐  │
│  │ A. 选项文案                         │  │
│  └────────────────────────────────────┘  │
│  ...                                      │
│  ┌─ 解析区（提交后）──────────────────┐  │
│  │ ✓ 回答正确  正确答案：A             │  │
│  │ 解析：...                           │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│      [上一题]    [提交]    [下一题]       │  fixed bottom
└──────────────────────────────────────────┘
```

访客顶栏额外文案链接：**登录以同步错题与记录** → `/login?redirect=...`。

### 6.3 完成页 `PracticeComplete`

```
┌─────────────────────────────┐
│     本次练习完成 / 错题重刷完成 │
│     正确率 75%               │
│     答对 9 · 答错 2 · 未答 1  │
│  [返回大厅]  [再刷一遍]        │
└─────────────────────────────┘
```

错题重刷：主按钮「返回错题本」、次按钮「再刷一遍」。

---

## 7. 组件规格

### 7.1 `AppShell`

| 项 | 规格 |
|----|------|
| **用途** | `/app` 下布局；注入导航与 `Outlet` |
| **变体** | `withSidebar`（默认） / `immersive`（刷题路由，无侧栏无底栏） |
| **default** | 左侧栏 + 内容区 `bg-canvas` |
| **响应式** | `<lg` 隐藏侧栏，显示底栏（`immersive` 时全无） |
| **a11y** | 当前 nav 项 `aria-current="page"`；跳过链接「跳到主内容」 |

---

### 7.2 `RoleGate`

| 项 | 规格 |
|----|------|
| **用途** | 路由或区块按 `role` 守卫 |
| **逻辑** | `ADMIN ≥ PREMIUM ≥ USER`；无 token → `/login` |
| **403 API** | 展示无权限页或 UpgradePrompt（按是否 PREMIUM 功能） |
| **文案** | 无权限页标题「暂无访问权限」；正文用 API `message` 或默认说明 |

---

### 7.3 `UpgradePrompt`（Dialog）

| 项 | 规格 |
|----|------|
| **触发** | USER 点击侧栏「管理题库」、题库页私有 Tab、AI 导入、创建题库等 |
| **标题** | 需要高级权限 |
| **正文** | 创建和管理题库、AI 导入题目等功能需要 **PREMIUM** 权限。请联系管理员开通。 |
| **邮箱** | `cloud_aaa@163.com`；按钮「复制邮箱」复制到剪贴板 → Toast「已复制」 |
| **按钮** | 主「知道了」关闭；无次要 destructive |
| **状态** | 复制成功 Toast 2s |

---

### 7.4 `AuthForm`

| 项 | 规格 |
|----|------|
| **字段** | 用户名（3–64）、密码（6–64）；注册加昵称（可选，0–64） |
| **default** | 空表单，主按钮「登录」/「注册」 |
| **loading** | 按钮 `disabled` + Spinner；防重复提交 |
| **error** | `401` → 用户名或密码错误；`409` → 用户名已被使用（字段下 `text-error`） |
| **success** | 存 `localStorage['ishua_token']`；可选缓存 `ishua_user`（`UserLoginVO`）；跳转见 §5.1 |
| **a11y** | `label` 关联；`autocomplete="username/password"` |

---

### 7.5 `BankCard`

| 项 | 规格 |
|----|------|
| **用途** | 大厅、题库页（`lobby`）、管理题库列表（`owned`） |
| **内容** | **仅** `title`（H2）、`description`（最多 2 行 `line-clamp-2`） |
| **不展示** | 题量、更新时间（大厅与题库选题列表） |
| **操作** | `lobby`：主按钮「开始刷题」→ `/app/practice/:id`；`owned`：主按钮「管理题库」→ `/app/manage/banks/:id`，次按钮「刷题」 |
| **hover** | `shadow-md`；边框 `brand/20` |
| **owned 角标** | 「公开」`brand-muted` / 「私有」`border` 描边 |

---

### 7.6 管理题库树 `/app/manage/banks`

| 项 | 规格 |
|----|------|
| **布局** | 桌面 `lg+`：左栏 `280px` 树 + 右栏预览/子路由 `Outlet`；移动纵向堆叠 |
| **数据** | `GET /api/v1/bank-nodes/tree?scope=mine`；扁平列表前端 `buildBankTree` 组嵌套 |
| **顶栏** | 「新建文件夹」「新建题库」→ `BankNodeFormDrawer` |
| **树节点** | `FOLDER` 图标 Folder；`LEAF` 图标 FileText；展开/折叠；选中 `brand-muted` |
| **点击 FOLDER** | 右栏预览：子节点统计、新建子文件夹/子题库、编辑、删除 |
| **点击 LEAF** | 导航 `/app/manage/banks/:nodeId` 进入详情（录题/导入/刷题） |
| **空态** | 树空：「还没有节点」；未选中：「选择左侧节点」 |

**API**：`bankNodes.ts` — `listBankTree`、`getBankNode`、`createBankNode`、`updateBankNode`、`deleteBankNode`。

---

### 7.7 `BankNodeForm`（Drawer）

| 项 | 规格 |
|----|------|
| **用途** | 新建/编辑 **FOLDER** 或 **LEAF**；无独立 `/edit` 路由 |
| **字段** | 类型（新建时由入口固定）、名称（必填）、描述、公开（仅 LEAF Switch） |
| **标题** | 新建文件夹 / 新建题库 / 编辑文件夹 / 编辑题库 |
| **footer** | 取消 + 保存 |
| **success** | 刷新树；新建 LEAF 跳转详情；新建 FOLDER 停留预览 |

---

### 7.8 `DeleteBankNodeDialog`

| 项 | 规格 |
|----|------|
| **触发** | 树预览或 LEAF 详情「删除」 |
| **FOLDER** | 额外提示「将同时删除所有子节点与题目」 |
| **确认** | 输入名称完全匹配后方可删除 |
| **API** | `DELETE /api/v1/bank-nodes/{id}` |

---

### 7.9 `BankForm`（Drawer，兼容）

| 项 | 规格 |
|----|------|
| **用途** | 旧扁平题库创建（`question-banks` alias）；管理页已改用 §7.7 |
| **字段** | 名称（必填）、描述（多行）、是否公开（Switch） |
| **标题** | 新建题库 / 编辑题库 |
| **footer** | 取消（次） + 保存（主） |
| **loading** | 保存中禁用 |
| **error** | `403` USER；`404` 关闭 Drawer 并 Toast |
| **success** | 关闭 Drawer；列表刷新；新建跳转 `/app/manage/banks/:id`（可选） |

---

### 7.10 `DeleteBankDialog`（兼容）

| 项 | 规格 |
|----|------|
| **触发** | 管理题库列表或详情「删除题库」 |
| **标题** | 确认删除题库 |
| **正文** | 此操作不可恢复。请输入题库名称「**{title}**」以确认。 |
| **输入** | 单行；主按钮「删除」仅当输入 **完全匹配** title 时可点 |
| **destructive** | 删除按钮 `error` 色 |
| **loading** | 删除中 Spinner |

---

### 7.11 `QuestionList` + `Pagination`

| 项 | 规格 |
|----|------|
| **列** | 题干摘要（1 行）、`TagQuestionType`、操作「编辑」「删除」 |
| **搜索** | 顶部 `keyword` debounce 300ms → 重置 `current=1` |
| **空态** | 「还没有题目」+ 按钮「添加题目」「AI 导入」 |
| **Pagination** | 展示「共 {total} 条」；上一页/下一页；页码简化（shadcn Pagination） |

---

### 7.9 `QuestionForm`（整页）

| 项 | 规格 |
|----|------|
| **用途** | 新建 `POST .../banks/{bankId}/questions`；编辑 `PUT /questions/{id}` 全量 |
| **字段** | 题型 Select（SINGLE/MULTI/JUDGE）、题干 textarea、选项列表（动态增删，入库转 `optionsJson` 字符串）、答案（单选 radio / 多选 checkbox / 判断）、解析 textarea、排序号 sortNo（可选） |
| **校验** | 前端：题干非空、至少 2 个选项（判断固定 2）、答案已选；提交前 `JSON.stringify` 选项与答案字母数组 |
| **default** | 编辑态拉 `GET /questions/{id}` 填充 |
| **loading** | 保存中；拉取详情 skeleton |
| **footer** | 固定底栏「取消」「保存」 |
| **取消** | 回题库详情 |

---

### 7.10 `TagQuestionType`

| 值 | 文案 |
|----|------|
| SINGLE | 单选 |
| MULTI | 多选 |
| JUDGE | 判断 |

- 形态：`Caption` 字号 pill，`rounded-full px-2 py-0.5`

---

### 7.11 `PracticePlayer`（`/app/practice/:bankId`）

| 项 | 规格 |
|----|------|
| **数据** | `GET /practice/banks/{bankId}/questions` → `PracticeQuestionVO[]`；`random` **不传** |
| **状态机** | `loading` → `ready` → `answered`（单题）→ `complete` |
| **选项** | 解析 `optionsJson` 为文案；展示 A/B/C…；选中 `brand-muted` + 左边框 |
| **提交** | 未选题时「提交」disabled；点击后 `POST submit`，按钮 loading |
| **提交后** | 展示对错图标+文案（**不仅颜色**：✓ 回答正确 / ✗ 回答错误）；展开 `analysis`；答错 Toast「已加入错题本」3s |
| **上一题/下一题** | 未提交也可下一题（记未答）；上一题保留已提交题的解析态 |
| **主观题** | `needsManualGrading`：无选项；文案「暂不支持自动批改」；提交 disabled |
| **403/404** | 全页 `ErrorState` + 返回大厅 |
| **完成** | 渲染 `PracticeComplete`，标题「本次练习完成」 |
| **键盘** | ↑↓ 切换选项焦点；Enter = 提交（已选题时） |
| **a11y** | `role="radiogroup"` / `checkbox`；进度 `aria-live="polite"` |

---

### 7.12 `GuestPracticePlayer`（`/practice/guest/:bankId`）

| 项 | 规格 |
|----|------|
| **数据** | `GET hot-practice-detail` → `QuestionVO[]`（含 `answerJson`, `analysis`） |
| **判分** | 本地比较 `userAnswer` 与 `JSON.parse(answerJson)`；不调用 submit |
| **差异** | 无错题 Toast；顶栏链「登录以同步错题与记录」 |
| **完成** | `PracticeComplete`，「返回大厅」「再刷一遍」 |
| **安全** | 不在控制台打印答案；开发环境亦避免 |

---

### 7.13 `WrongPracticePlayer`（`/app/wrong-questions/practice`）

| 项 | 规格 |
|----|------|
| **数据** | `GET /wrong-questions/practice?bankId=` → 列表；逐题 **同一** `submit` 接口 |
| **顶栏标题** | 错题重刷 |
| **空列表** | 「暂无错题」+ 返回错题本 |
| **完成** | `PracticeComplete` 文案「错题重刷完成」；主「返回错题本」 |
| **与 PracticePlayer** | **禁止**同一组件通过 prop 切换模式；独立页面与 hook |

---

### 7.14 `PracticeComplete`

| 项 | 规格 |
|----|------|
| **统计** | 正确率四舍五入整数；答对/答错/未答计数 |
| **主按钮** | 题库练习 →「返回大厅」`/``；错题 →「返回错题本」 |
| **次按钮** | 「再刷一遍」重置索引、清空作答态、重新拉题（若需） |

---

### 7.15 `WrongQuestionList`

| 项 | 规格 |
|----|------|
| **行** | 题干 1 行、`wrongCount`「错误 N 次」、`lastWrongTime` 相对时间 |
| **筛选** | 顶部 Select 题库（含「全部」）；变更重置分页 |
| **操作** | 「重刷」→ `/app/wrong-questions/practice?bankId=`；「移出」→ ConfirmDialog |
| **顶栏** | 全局「开始重刷」→ practice 无 bankId |

---

### 7.16 `ConfirmDialog`（删题）

| 项 | 规格 |
|----|------|
| **标题** | 删除这道题目？ |
| **正文** | 删除后不可恢复。 |
| **checkbox** | 「不再提示」→ `localStorage['ishua_skip_delete_question_confirm']=1` |
| **已勾选过** | 直接 DELETE + Toast「已删除」 |
| **按钮** | 取消 / 删除（destructive） |

---

### 7.17 `ImportWizard`

| 步骤 | UI | 行为 |
|------|-----|------|
| 0 恢复 | `ImportRecoveryBanner`（仅上传步） | `GET ai-import/tasks?bankId&status=PARSED,PROCESSING,SUBMITTED`；待确认 / 解析中可继续 |
| 1 上传 | 拖拽区 +「选择文件」；说明 .txt/.pdf/.docx ≤10MB | `POST ai-import/submit` → `taskId`（可选 sessionStorage 降级） |
| 2 解析 | Steps 高亮；文案「正在解析，请稍候…」；3s 轮询 `GET .../status` | 至 PARSED / FAILED / IMPORTED / **EXPIRED** |
| 3 预览 | `PreviewQuestionTable`；空预览可「重新拉取」 | 编辑后 `POST batch` + `taskId` + `questions[]` |
| 4 完成 | 成功图标 +「已导入 N 题」 | 跳转题库详情 |

| 异常 | 文案 |
|------|------|
| FAILED | 展示 `message` +「返回上传」 |
| EXPIRED | 任务已过期，请重新上传文件 |
| 任务不存在 | 任务不存在或已失效，请重新上传 |
| 429 | 导入过于频繁，请稍后再试（每小时上限） |
| 409 | 正在导入中，请稍候 |
| 403 | 无权限（USER）→ UpgradePrompt |

**深链**：`/app/manage/banks/:bankId/import?taskId={uuid}` 进入后自动恢复该任务。

---

### 7.18 `PreviewQuestionTable`

| 项 | 规格 |
|----|------|
| **列** | 序号、题型、题干（截断）、答案摘要、操作「展开编辑」 |
| **展开** | 下方面板：题干 textarea、选项列表、答案、解析；`QuestionPreviewVO` 数组字段 |
| **折叠** | 保存到本地 state，非自动 PATCH 服务端 |
| **确认导入** | `POST batch` + `taskId` + 编辑后 `questions[]` |

---

### 7.19 `AdminPlaceholder`

| 项 | 规格 |
|----|------|
| **标题** | 管理功能 |
| **正文** | 用户与权限管理功能开发中，敬请期待。 |
| **插图** | 无；可选 Logo 灰度 48px |
| **二期** | 替换为 `AdminUserTable`：`GET /admin/users`、改角色 `PUT .../role` |

---

### 7.20 全局 `Toast` / `Alert` / `ErrorState`

| 场景 | 类型 | 文案示例 |
|------|------|----------|
| 网络错误 | Toast destructive | 网络异常，请稍后重试 |
| 401 | 清 token + redirect | 登录已过期，请重新登录 |
| 业务失败 | Toast | 使用 API `message` |
| 全页错误 | ErrorState | 标题 + 说明 + 主返回按钮 |

---

## 8. 数据与鉴权（开发必读）

### 8.1 localStorage 键

| 键 | 内容 |
|----|------|
| `ishua_token` | JWT 字符串 |
| `ishua_user` | 可选，`{ userId, username, nickname, role }` |
| `ishua_skip_delete_question_confirm` | `"1"` 时跳过删题确认 |

### 8.2 请求拦截器

- 白名单路径不加 Header：注册、登录、public、hot-practice-detail  
- 其余：`Authorization: Bearer ${token}`  
- `Result.code !== 200`：reject 并带 `code`、`message`  
- `401`：清除 token → `/login?redirect=${encodeURIComponent(location)}`

### 8.3 关键 Schema 对照

| 场景 | 类型 | 含答案 |
|------|------|--------|
| 访客刷题 | `QuestionVO` | 是 |
| 登录刷题列表 | `PracticeQuestionVO` | 否 |
| 提交结果 | `AnswerSubmitResultVO` | 返回答案与解析 |
| 登录响应 | `UserLoginVO` | 含 `token`, `role` |
| AI 预览 | `QuestionPreviewVO` | `options`/`answer` 数组 |

### 8.4 RBAC 与菜单

| 能力 | USER | PREMIUM | ADMIN |
|------|------|---------|-------|
| 公开刷题 + submit | ✓ | ✓ | ✓ |
| 错题本 | ✓ | ✓ | ✓ |
| 题库页（公共 Tab）/ 发现占位 | ✓ | ✓ | ✓ |
| 题库私有 Tab 刷题 / 管理题库 / 试题 / AI | ✗ | ✓ | ✓ |
| 管理用户 | ✗ | ✗ | 占位 |

---

## 9. 开发交接

### 9.1 建议实现顺序

1. Vite + React + TS + Tailwind + shadcn 初始化；CSS 变量注入 §4 token  
2. `api/client` + `Result` 解析 + Bearer 拦截器 + `useAuth`  
3. 页面：`/` 大厅 + `BankCard` + `Pagination`  
4. `GuestPracticePlayer` + `/practice/guest/:bankId`  
5. `AuthForm` + 登录刷题 `PracticePlayer` + `PracticeComplete`  
6. `WrongQuestionList` + `WrongPracticePlayer`  
7. PREMIUM：`BankForm` Drawer、题库详情、`QuestionForm`、`ImportWizard`  
8. `UpgradePrompt`、`RoleGate`、`AdminPlaceholder`  

### 9.2 建议目录

```text
src/
  api/
    client.ts
    auth.ts
    banks.ts
    questions.ts
    practice.ts
    wrong.ts
    aiImport.ts
  components/
    layout/AppShell.tsx
    auth/AuthForm.tsx RoleGate.tsx UpgradePrompt.tsx
    bank/BankCard.tsx BankForm.tsx DeleteBankDialog.tsx
    question/QuestionList.tsx QuestionForm.tsx TagQuestionType.tsx
    practice/PracticePlayer.tsx GuestPracticePlayer.tsx
              WrongPracticePlayer.tsx PracticeComplete.tsx
    wrong/WrongQuestionList.tsx
    import/ImportWizard.tsx PreviewQuestionTable.tsx
    admin/AdminPlaceholder.tsx
    ui/   # shadcn
  pages/   # 与路由 1:1
  hooks/
    useAuth.ts usePagination.ts usePracticeSession.ts
  lib/
    parseOptionsJson.ts gradeAnswer.ts  # 访客判分
  styles/
    tokens.css
```

### 9.3 与 shadcn 映射

| 组件 | shadcn 基座 |
|------|-------------|
| BankForm / Upgrade | Dialog, Sheet(Drawer), Switch, Input |
| 刷题选项 | Button variant outline + custom selected |
| ImportWizard | Steps 自建或 Tabs |
| 表格预览 | Table + Collapsible |
| Toast | Sonner 或 shadcn Toast |

### 9.4 不在本文档范围

- 后端部署与环境变量命名  
- 随机顺序（二期，需与后端题目存储方案对齐）  
- ADMIN 用户管理完整 UI  
- 深色模式、国际化、移动端原生壳  
- 单元测试/E2E 用例（由开发计划另文档）  

### 9.5 类型生成

- 推荐从 `api-docs-v4.json` 用 `openapi-typescript` 生成 `src/types/api.d.ts`，与 `Result<T>` 包装层组合。

---

## 10. 验收清单

### 10.1 品牌与视觉

- [ ] Logo、双 Slogan 位置正确；墨绿 `#2D6A4F`、米白 `#F7F5F0` 全局一致  
- [ ] 标题衬线、正文无衬线已加载；非 Inter/Roboto 默认墙  
- [ ] 3 秒内能识别页面用途与主按钮  

### 10.2 访客与鉴权

- [ ] 访客刷公开库：不调 submit；本地判分；无错题写入  
- [ ] 登录刷题：`PracticeQuestionVO` 无答案；submit 后才显示解析  
- [ ] `localStorage` + Bearer；401 清 token 并带 redirect 登录  

### 10.3 刷题交互

- [ ] 单选/多选/判断均经底部「提交」；多选未选时提交 disabled  
- [ ] 可跳过未答题；完成页统计含未答  
- [ ] 答错 Toast 3s（仅登录 submit）  
- [ ] 题库练习与错题重刷为**不同 URL、不同 Player 组件**  
- [ ] 刷题全屏无移动底栏；题干区不被遮挡  
- [ ] 首版无「随机顺序」UI  

### 10.4 权限与 PREMIUM

- [ ] USER 见 UpgradePrompt + 邮箱可复制  
- [ ] PREMIUM 可 CRUD 题库/试题、AI 导入  
- [ ] ADMIN 可见管理占位页  

### 10.5 管理与删除

- [ ] 删库须输入题库名完全匹配  
- [ ] 删题 Confirm +「不再提示」写 localStorage  
- [ ] 试题整页表单 PUT 全量更新  

### 10.6 列表与导入

- [ ] 大厅卡片仅标题+描述  
- [ ] 分页 `records`/`total`；pageSize 随断点  
- [ ] AI 导入四步闭环；429/409/FAILED 有明确文案  
- [ ] 预览表格式展开编辑  

### 10.7 无障碍

- [ ] 刷题键盘可操作；对错有文案/图标  
- [ ] 正文对比度 ≥ 4.5:1；`prefers-reduced-motion` 生效  
- [ ] 模态/Drawer 焦点陷阱  

---

## 11. 审美终检

- [ ] 视觉概念可复述为「考纲手札」，非泛化「现代简约」  
- [ ] 配色有主次（米白底 / 墨绿主 / 语义色点缀）  
- [ ] 交互状态在 §7 中均有 default/loading/error 说明  
- [ ] 无紫渐变 hero、无对称无意义卡片墙  

---

*终稿 v1.0 · 对应粗稿 atlas-ui-design-draft v0.4 · API api-docs-v4.json*
