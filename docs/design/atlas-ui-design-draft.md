# iShua · 前端 UI 设计说明（粗颗粒度草稿）

> **文档性质**：粗颗粒度设计草稿，供产品与开发对齐方向；细粒度组件规格与实现代码不在本文范围。  
> **依据**：`api-docs-v4.json`（Atlas 智能题库 API，含 RBAC 与完整 Response Schema）、前后端分离架构。  
> **代号（仅内部）**：整体 Shua · 后端 Atlas · 前端 Pleione · **用户可见品牌：iShua**

---

## 0. 已确认决策（工坊立项 + 视觉，2026-05-19）

| 维度 | 已确认 |
|------|--------|
| 品牌 | 产品名 **iShua**；Logo：`assets/logo/`（手札笔记本 + iShua 字样）；Slogan：「一页一题，沉浸刷完」/「今天，也刷一点」 |
| 用户 | 仅**学生自学**；访客先进大厅，**访客模式**仅公共题库，不记用户/错题；登录解锁全功能 |
| 视觉 | **考纲手札**；主色**墨绿**（护眼）；背景**暖米白** `#F7F5F0`；首版**无深色模式**；标题**衬线** + Web 字体 |
| 权限 | 三层角色 **USER / PREMIUM / ADMIN**（见 §0.1）；注册固定为 USER |
| 路由 | 大厅在 **`/`**；登录后默认仍可从大厅进入；Dashboard **首版不做** |
| 导航 | 桌面**左侧栏**；移动端非刷题页**底栏**；**刷题页隐藏底栏**（保视线） |
| 技术 | Token **`localStorage`** + 请求头 `Authorization: Bearer <token>`（后端暂无 Cookie 方案）；React + Vite + React Router + **shadcn/ui**；仅中文 |
| 删除 | 删库须**输入题库名称**二次确认；删题 Confirm + 可选「不再提示」（localStorage） |
| 分页 | `pageSize` 随视口/列表类型自适应，刷题列表**不分页**（一次拉全量） |
| PREMIUM 开通 | 「联系管理员开通 PREMIUM」+ 邮箱 **`cloud_aaa@163.com`**（可复制）；ADMIN 在后台改角色 |
| Slogan 摆放 | 大厅副标题：「**一页一题，沉浸刷完**」；登录/注册页：「**今天，也刷一点**」 |
| 大厅卡片 | 仅 **标题 + 描述**（`QuestionBankVO` 无题量字段） |
| 随机顺序 | **首版不做**（默认关；待项目稳定后与后端定题目存储再开发）；UI 不展示「随机」开关 |
| 管理端 | `/app/admin/users` **首版占位页**（「功能开发中」），后续再做 |
| 试题编辑 | **独立整页表单**；保存走 `PUT /questions/{id}` **全量更新**（`QuestionUpdateDTO`），后端暂无局部更新 |
| 刷题分页 | **题库练习** `/app/practice/:bankId` 与 **错题重刷** `/app/wrong-questions/practice` 为**不同页面**、不同数据源 |

### 0.1 角色与前端菜单（对齐 api-docs-v4.json）

| 角色 | 能力摘要 | 前端可见 |
|------|----------|----------|
| **访客**（无 JWT） | 公开大厅、`hot-practice-detail` 访客刷题（见 §0.2） | `/`、公开刷题；无错题本/我的题库 |
| **USER** | 刷公开库、错题本、`GET /users/me` | + `/app/banks` 公共 Tab；**无**私有 Tab 刷题、管理题库、试题、AI 导入 |
| **PREMIUM** | USER + 自建题库、试题 CRUD、AI 导入 | + `/app/manage/banks` 等管理入口 |
| **ADMIN** | PREMIUM + `/admin/users/**` | + 侧栏「管理」入口 → **占位页**（二期实现用户列表与改角色） |

- `403`：角色不足 → 升级提示或隐藏入口（非仅 Toast）。
- 角色以**每次请求**服务端为准；改角色后**下次请求**生效，无需重登。

### 0.2 访客刷题（已确认 · 对齐 Schema）

API **无**访客专用 `submit`；数据与判分分工如下：

| 模式 | 拉题接口 | 题目类型 | 含答案？ | 判分 |
|------|----------|----------|----------|------|
| **访客** | `GET .../hot-practice-detail` | `QuestionBankDetailBundleVO` → `questions[]` **`QuestionVO`** | **含** `answerJson`、`analysis` | **前端本地**比对 `userAnswer` 与 `answerJson` |
| **登录刷题** | `GET .../practice/.../questions` | **`PracticeQuestionVO`** | **不含** 答案/解析 | **`POST .../submit`** 服务端判分 |

访客路径：

1. `GET /question-banks/public` → 选题库  
2. `GET .../hot-practice-detail` → `{ bank, questions }` 全量  
3. **不调用** submit、不写错题本；解析展示用本地 `analysis`  
4. 顶栏常驻「登录以同步错题与记录」

> **安全说明**：访客模式下答案会出现在前端内存/网络响应中，属产品接受的公开库体验；登录刷题仍走防泄题链路。

登录用户（含 USER 刷公开库）：`PracticeQuestionVO` + `submit`，答错自动入错题本。

### 0.3 刷题交互与表单 UX（已确认）

| 项 | 规则 |
|----|------|
| 单选/多选/判断 | 一律点底部 **「提交」** 再判分/请求（多选防误触；三种题型交互一致） |
| 未作答 | **允许**「下一题」跳过，进度仍计数；跳过题在完成页计入「未答」 |
| 最后一题后 | **完成页**：正确率、答对/错/未答数量；主按钮「返回大厅」、次按钮「再刷一遍」（重载题目列表） |
| 答错反馈 | Toast「已加入错题本」，**约 3s** 自动消失（仅登录且走 submit 时） |
| 主观题 | 列表与管理端**不展示**未知题型；刷题遇到 `needsManualGrading` → 占位「暂不支持自动批改」，不提供选项提交 |
| 空态 | 首版 **纯文案 + Logo 淡色**，不做定制插画 |
| AI 预览 | **表格内联** + 行 **「展开编辑」** 面板 |
| 新建/编辑题库 | **抽屉（Drawer）**，无 `/edit` 路由 |

### 0.4 导航结构（已定稿）

**桌面（≥1024px）左侧栏**

| 顺序 | 文案 | 路径 | 可见 |
|------|------|------|------|
| 1 | 发现 | `/app/discover` | 登录 USER+（首版占位） |
| 2 | 错题本 | `/app/wrong-questions` | 登录 USER+ |
| 3 | 题库 | `/app/banks` | 登录 USER+（私有 Tab：USER 置灰 + Upgrade） |
| 4 | 管理题库 | `/app/manage/banks` | PREMIUM+（USER 点击 → UpgradePrompt） |
| 5 | 用户管理 | `/app/admin/users` | ADMIN（首版占位） |
| 底 | 账户区 | 昵称、`/users/me` 信息、退出 | 登录 |

**移动（&lt;1024px）底栏** — 刷题相关全屏页（`/app/practice/*`、`/practice/guest/*`、`/app/wrong-questions/practice`）**不展示底栏**。

| Tab | 路径 | 说明 |
|-----|------|------|
| 发现 | `/app/discover` | 首版占位 |
| 错题 | `/app/wrong-questions` | |
| 题库 | `/app/banks` | USER+ 刷题选题 |
| 我的 | 底部 Sheet | 昵称、升级说明+邮箱（USER）、管理题库链（PREMIUM+）、退出 |

壳外大厅 `/`：访客入口；侧栏 Logo 可回大厅。登录默认 **`/app/banks`**。

---

## 1. 设计方向（Design Brief）

**概念名：「考纲手札」** — 像一本可翻阅、可批注的备考笔记本，而不是冷冰冰的表单后台。

- **情绪**：专注、克制、略带书卷气；长时刷题不刺眼，关键反馈（对错、进度）清晰有力。
- **色彩**：暖米白纸感底；**墨绿** `#2D6A4F` 作主色（护眼、学习感）；琥珀/珊瑚作答对/警示点缀；避免紫渐变模板感。
- **字体气质**：标题**衬线**（如 Source Serif / 思源宋体，Web 字体）；正文高可读无衬线（Source Han Sans / 系统中文栈）；数字与进度 tabular nums。
- **布局**：刷题页「单题沉浸」居中窄栏；管理页「列表 + 侧栏/顶栏」双栏；公开大厅偏「卡片目录」浏览感。
- **动效**：短促（150–250ms）的状态切换；提交答案后解析区展开；`prefers-reduced-motion` 时仅保留颜色/边框变化。

**记忆点**：提交一题后，解析像手札页边批注一样滑入，对错一眼可辨。

---

## 2. 主题与功能结合

| 功能域 | 用户目标 | 视觉/体验如何支撑 |
|--------|----------|-------------------|
| 公开刷题大厅 | 未登录快速发现热门题库 | 卡片仅**标题+描述**；顶区 Slogan「一页一题…」；突出「开始刷题」 |
| 登录/注册 | 低摩擦进入个人空间 | 单栏表单 + Slogan「今天，也刷一点」；错误 inline（401/409） |
| 题库（刷题选题） | 选公开/私有库开刷 | Tab 公共 \| 私有；`BankCard` 主 CTA「开始刷题」 |
| 管理题库 | 建库、试题、AI 导入 | 列表区分「公开/私有」；「新建题库」入口 |
| 题库内试题管理 | 增删改查、搜索题干 | 表格/列表 + 关键词筛选；题型标签色编码（单选/多选/判断） |
| AI 智能导入 | 上传文件 → 等待 → 预览确认入库 | 步骤条（提交→解析→预览→入库）；轮询态用进度/骨架，非全屏阻塞 |
| 在线刷题 | 连续答题、即时反馈 | 单题沉浸；底部「上一题/提交/下一题」；随机顺序**二期** |
| 错题本 | 复习薄弱点、按题库筛选 | 列表与**错题重刷页**分离；重刷走 `/app/wrong-questions/practice` |
| 鉴权与错误 | Token 失效、业务 code 非 200 | 全局 Toast/横幅；401 引导重新登录；409/429 给出可理解文案 |

---

## 3. 信息架构与路由（粗颗粒度）

```text
/                          → 公开刷题大厅（访客/登录均可；GET public banks）
/practice/guest/:bankId    → 访客刷题（hot-practice-detail，本地判分，无 submit）
/login, /register          → 鉴权
/app                       → index 重定向 /app/banks；主壳（桌面左栏 / 移动底栏；刷题页无底栏）

/app/discover              → 发现（首版占位，二期扩展）
/app/banks                 → 题库：刷题选题（公共 | 私有 Tab）[USER+]
/app/manage/banks          → 管理题库列表 [PREMIUM+]
/app/manage/banks/:bankId  → 题库详情：试题列表、Drawer、AI 导入、开始刷题
/app/manage/banks/:bankId/questions/new
/app/manage/banks/:bankId/questions/:id/edit
/app/manage/banks/:bankId/import  → AI 导入向导
/app/practice/:bankId      → 题库练习（practice questions + submit）
/app/wrong-questions       → 错题本列表（可选 bankId 筛选）
/app/wrong-questions/practice → 错题重刷（**独立页**，`listWrongPractice` + submit）
/app/admin/users           → 管理端占位（仅 ADMIN，首版「开发中」）
```

**导航分组（已确认方向）**

| 分组 | 项 | 访客 | USER | PREMIUM | ADMIN |
|------|-----|------|------|---------|-------|
| 壳外 | 公开大厅 `/` | ✓ | ✓（可选） | ✓ | ✓ |
| 发现 | App `/app/discover` | — | 占位 | 占位 | 占位 |
| 学习 | 题库选题 `/app/banks`、刷题 | — | 公共 Tab | 公共+私有 | 同 PREMIUM |
| 复习 | 错题本 | — | ✓ | ✓ | ✓ |
| 管理 | 管理题库、试题、AI 导入 | — | — | ✓ | ✓ |
| 系统 | 用户管理（占位） | — | — | — | ✓ |
| 账户 | 登录/注册/退出 | 大厅 | App 壳 + 大厅下拉 | 同左 | 同左 |

- 登录后**默认落地**：**`/app/banks`**（全角色，无 `redirect` 时）；**不做** Dashboard。
- 旧路径 `/app/banks/:bankId` **不保留**；管理详情统一 `/app/manage/banks/:bankId`。
- 登录用户可从侧栏 Logo 或手动访问**回到大厅** `/`。

---

## 4. 设计系统（文档化 Token，粗粒度）

### 4.1 色彩（语义）

| Token | 用途 | 建议方向 |
|-------|------|----------|
| `bg-surface` | 卡片/面板 | 纯白或略提亮 |
| `text-primary` | 题干、标题 | 近黑 #1A1A1A |
| `text-secondary` | 辅助说明 | #5C5C5C |
| `brand` | 主按钮、链接、进度 | 墨绿 **#2D6A4F**（已确认） |
| `bg-canvas` | 页面背景 | 暖米白 **#F7F5F0**（已确认） |
| `success` | 答对、完成 | 青绿，非纯绿刺眼 |
| `error` | 答错、删除确认 | 珊瑚/砖红 |
| `warning` | 限流 429、导入冲突 409 | 琥珀 |
| `border` | 分割、输入框 | 低对比 #E5E2DC |

深色模式可作为二期；首版以浅色「纸感」为主，利于长时间阅读题干。

### 4.2 字体阶梯（逻辑名）

| 级别 | 场景 | 量级 |
|------|------|------|
| Display | 大厅标题、空态标题 | 28–32px |
| H1 | 页面标题 | 22–24px |
| H2 | 区块标题、题库名 | 18–20px |
| Body | 题干、选项 | 16–17px，行高 1.6–1.75 |
| Caption | 标签、分页、元信息 | 12–13px |
| Mono | 题号、进度 3/10 | 等宽或 tabular nums |

### 4.3 间距与布局

- **栅格**：12 列；内容区最大宽度刷题页 `720px`，管理页 `1120px`。
- **断点（建议）**：`sm 640` / `md 768` / `lg 1024` — 移动端底栏导航，桌面端左侧栏。
- **间距阶梯**：4 / 8 / 12 / 16 / 24 / 32 / 48（px）。

### 4.4 形状与深度

- 卡片：圆角 12px，浅阴影或 1px 边框（纸边感）。
- 按钮：主按钮实心圆角 8px；次按钮描边。
- 刷题选项：整行可点，选中态左边框或背景浅染，非仅 radio 小圆点。

### 4.5 动效原则

| 场景 | 意图 | 时长 |
|------|------|------|
| 路由切换 | 内容区淡入 | 200ms |
| 提交答案 | 解析区高度展开 | 250ms ease-out |
| 列表加载 | 骨架屏 | 直至 data 返回 |
| AI 轮询 | 步骤指示脉冲 | 2–5s 间隔由逻辑控制，非 CSS 循环 |

---

## 5. 页面与流程规格（粗颗粒度）

### 5.1 公开刷题大厅 `/`

**目标**：未登录用户浏览 `GET /api/v1/question-banks/public`。

```
+--------------------------------------------------+
| [Logo]  一页一题…  [进入学习] [昵称▾] 或 [登录][注册] |
+--------------------------------------------------+
|  发现公开题库                                     |
|  +----------+ +----------+ +----------+          |
|  | 题库卡片 | | 题库卡片 | | 题库卡片 |  ...     |
|  | 标题/描述| |          | |          |          |
|  | [刷题]   | |          | |          |          |
|  +----------+ +----------+          |
|  < 分页 >                                         |
+--------------------------------------------------+
```

- 卡片信息：标题、描述摘要、`isPublic` 已隐含为公开。
- 主操作：「开始刷题」→ 未登录 `/practice/guest/:bankId`；已登录 `/app/practice/:bankId`。
- USER 点击 PREMIUM 功能 → **`UpgradePrompt`**：说明 + 邮箱 **cloud_aaa@163.com**（可复制）。
- 空态：无公开题库时引导「登录后创建并公开你的题库」。

**API**：`pagePublicBanks(current, pageSize)`；分页字段 `total` + `records`。

---

### 5.2 登录 / 注册

**API**：`POST /users/login`、`POST /users/register`。

- 单列表单：用户名、密码；注册增加可选昵称。
- 页内品牌区展示 Slogan：「**今天，也刷一点**」。
- 成功：`token` 存 **`localStorage`**（键名实现时统一，如 `ishua_token`）；请求拦截器附加 `Authorization: Bearer`；默认跳转 **`/app/banks`**（全角色）；支持 `redirect`。
- 失败：`code=401` 账号密码错误；`code=409` 用户名已存在 — 字段下或顶部文案，不用技术术语。

---

### 5.3 App 发现（占位）`/app/discover`

- 文案说明二期开放；按钮「前往题库」→ `/app/banks`。
- 无列表、无刷题、无建库。

---

### 5.4 App 题库（刷题选题）`/app/banks`

**API**：公共 Tab `pagePublicBanks`；私有 Tab `pageMyBanks`（前端过滤 `isPublic !== 1`）。

| 区块 | 内容 |
|------|------|
| Tab | 公共 \| 私有（USER：私有置灰，点击 UpgradePrompt） |
| 列表 | `BankCard` `lobby`；「开始刷题」→ `/app/practice/:id` |
| 说明 | 引导 PREMIUM 使用「管理题库」建库 |

---

### 5.5 管理题库 `/app/manage/banks`

**API**：`GET/POST /question-banks`；`PUT/DELETE .../{bankId}`。`RoleGate` PREMIUM+。

| 区块 | 内容 |
|------|------|
| 顶栏操作 | 「新建题库」 |
| 列表项 | 标题、公开/私有标签、`BankCard` `owned`、删除（二次确认） |
| 新建/编辑 **抽屉** | title、description、isPublic（开关） |

---

### 5.6 题库详情（所有者）`/app/manage/banks/:bankId`

**API**：`GET .../questions`（分页+keyword）、试题 CRUD、`DELETE` 题库。

```
+--侧栏/顶栏导航-------------------------------------+
| 题库标题 [编辑] [AI导入] [开始刷题]                  |
| 搜索题干 [____________]                             |
| 试题列表 | 题型 | 操作(编辑/删除)                    |
| 分页                                                |
+----------------------------------------------------+
```

- 「开始刷题」→ `/app/practice/:bankId`（`GET practice/.../questions`；**不传** `random`，首版固定 `sortNo` 顺序）。
- 编辑题库：详情页 **Drawer**，无独立 `/edit` 路由。
- 「AI 导入」→ §5.9 流程。

**试题新建/编辑（整页）**

- 路由：`.../questions/new`、`.../questions/:id/edit`。
- 新建：`POST .../banks/{bankId}/questions`；编辑：**`PUT /api/v1/questions/{id}`** 全量提交 `QuestionUpdateDTO`（`optionsJson`、`answerJson` 等为 JSON 字符串）。
- 后端暂无 PATCH/部分字段更新；表单始终展示全部必填字段。

---

### 5.7 访客刷题 `/practice/guest/:bankId`

**API**：`GET .../hot-practice-detail` → `QuestionBankDetailBundleVO`。

- 布局与 §5.8 登录刷题一致，组件为 **`GuestPracticePlayer`**（本地判分，无 submit）。
- 题目顺序：接口返回的 `sortNo` 顺序（**首版不做**前端 shuffle）。
- 完成页规则同 §0.3（无错题 Toast）。

---

### 5.8 登录刷题会话 `/app/practice/:bankId`（核心）

**API**：
- `GET /practice/banks/{bankId}/questions`（`random` 首版不使用，默认 `false`）
- `POST .../questions/{questionId}/submit`

**布局（单题沉浸）**

```
+--------------------------------+
| 进度 3/12                       |
+--------------------------------+
| 题型标签                        |
| 题干（大字号）                  |
|                                 |
| ( ) 选项 A                      |
| ( ) 选项 B                      |
| ...                             |
+--------------------------------+
| [上一题]  [提交]  [下一题]      |
+--------------------------------+
| （提交后）解析区 · 对错标识      |
+--------------------------------+
```

**题型交互（与 API 对齐）**

| questionType | 展示 | userAnswer 提交格式 |
|--------------|------|---------------------|
| SINGLE | 单选 | `["A"]` |
| MULTI | 多选；须点 **「提交」** 后请求 submit | `["A","C"]` |
| JUDGE | 正确/错误两选项 | `["T"]` / `["F"]` |
| 其他/主观 | 占位「暂不支持自动批改」，无提交 | `needsManualGrading`，不进错题本 |

**导航**：未作答可 **下一题**；**上一题** 可回看（已提交题保留解析态）。

**提交后状态**（submit 响应）：
- 客观题：`correct` true/false — 绿/红框 + `answerJson`、`analysis`。
- 答错：Toast「已加入错题本」，**3s** 消失。
- 私有库无权限 / 404：整页错误态 + 返回列表。

**完成页**（§0.3）：统计正确率 →「返回大厅」「再刷一遍」。

**移动端**：刷题页**无底栏**；顶栏细条（Logo 缩小、进度、退出）。

---

### 5.9 AI 智能导入 `/app/manage/banks/:bankId/import`

**API 链**：
1. `POST /ai-import/submit`（multipart: file + bankId）
2. `GET /ai-import/tasks/{taskId}/status`（2–5s 轮询）
3. `POST /question-banks/{bankId}/questions/batch`（PARSED 后确认）

**步骤 UI**

```text
[1 上传] → [2 解析中] → [3 预览编辑] → [4 入库完成]
```

| 步骤 | UI | 异常 |
|------|-----|------|
| 上传 | 拖拽区，限制 .txt/.pdf/.docx ≤10MB | 400 格式/大小 |
| 解析中 | 步骤条 + 文案；轮询至 PARSED/FAILED/IMPORTED | FAILED 展示 message |
| 预览 | **表格内联** + 行 **展开编辑**；字段：题干、options、answer、解析 | `QuestionPreviewVO`（数组字段） |
| 确认入库 | 主按钮「确认导入」 | 409 导入中；幂等已导入则提示成功 |
| 完成 | 跳转试题列表 | — |

**限流**：`code=429` 明确提示「每小时导入次数已达上限」。

---

### 5.8 错题本 `/app/wrong-questions`

**API**：
- `GET /wrong-questions`（分页，可选 `bankId`）
- `DELETE /wrong-questions/{id}`

- 列表：题干摘要、所属题库、错误次数、最近做错时间。
- 筛选：按题库下拉（bankId）。
- 「重刷」→ 跳转 **`/app/wrong-questions/practice`**（可选 query `?bankId=`），与 §5.6 **不同路由、不同页面**。
- 「移出」→ DELETE。

---

### 5.8.1 错题重刷 `/app/wrong-questions/practice`（独立页）

**API**：
- `GET /wrong-questions/practice`（可选 `bankId`）→ 错题刷题列表
- 逐题仍用 `POST /practice/banks/{bankId}/questions/{questionId}/submit`

- 组件：**`WrongPracticePlayer`**（勿与 `PracticePlayer` 混为同页两种模式）。
- 布局与 §5.6 类似（单题沉浸、无底栏）；顶栏标题「错题重刷」。
- 完成页文案可区分「错题重刷完成」，操作：回错题列表 / 再刷一遍。

---

### 5.9 全局模式与异常

| 场景 | UI 处理 |
|------|---------|
| 加载中 | 路由级 skeleton；刷题页题目切换局部 loading |
| 空列表 | **文案 + Logo 淡色** + 主操作（创建题库 / 去大厅）；无定制插画 |
| `code=401` | 清除 token，跳转登录 |
| `code=403` | 无权限说明页 |
| `code=404` | 资源不存在 |
| HTTP 200 但 `code≠200` | 统一拦截器读 `message` |
| 分页 | `current` 从 1；每页 `pageSize` ≤100 |

---

## 6. 组件清单（逻辑层，不写实现）

| 组件 | 职责 | 复用场景 |
|------|------|----------|
| `AppShell` | 顶栏、侧栏/底栏、Outlet | 所有 `/app/*` |
| `AuthForm` | 登录/注册字段与校验展示 | login, register |
| `BankCard` | 题库卡片 | 大厅、题库选题（`lobby`）、管理列表（`owned`） |
| `BankForm` | 创建/编辑题库 | **Drawer** |
| `PracticeComplete` | 正确率、再刷一遍、回大厅 | 刷题结束 |
| `QuestionList` | 分页列表+搜索 | 题库详情 |
| `QuestionForm` | 整页全量字段；新建 POST、编辑 **PUT** `QuestionUpdateDTO` | `.../questions/new`、`.../edit` |
| `PracticePlayer` | 题库练习：practice 拉题 + submit | `/app/practice/:bankId` |
| `WrongPracticePlayer` | 错题重刷：wrong practice 拉题 + submit | `/app/wrong-questions/practice` |
| `GuestPracticePlayer` | 访客本地判分（`QuestionVO` + answerJson） | `/practice/guest` |
| `UpgradePrompt` | PREMIUM 说明 + **cloud_aaa@163.com** 可复制 | USER 触达 PREMIUM 功能 |
| `AdminPlaceholder` | 「管理功能开发中」 | `/app/admin/users` 首版 |
| `ImportWizard` | 四步导入 | AI 导入页 |
| `PreviewQuestionTable` | AI 预览可编辑行 | 导入步骤 3 |
| `WrongQuestionList` | 错题列表+筛选 | 错题本 |
| `Pagination` | current/pageSize/total | 所有分页 API |
| `Toast` / `Alert` | 全局反馈 | 拦截器、操作结果 |
| `ConfirmDialog` | 删题（可「不再提示」） | 题库详情 |
| `DeleteBankDialog` | 删库须输入题库名称匹配 | 管理题库 |
| `RoleGate` | 路由/菜单守卫 | 全局 |
| `TagQuestionType` | SINGLE/MULTI/JUDGE 标签 | 列表、刷题页 |

---

## 7. 与 API 的关键对接说明（开发交接）

1. **鉴权**：白名单同 API；`localStorage` 存 token；拦截器设置 `Authorization: Bearer <token>`。
2. **RBAC**：`login` / `GET /users/me` 的 `role` 控制菜单；`403` → 升级提示或隐藏。
3. **响应约定**：解析 `Result.code`；类型代码生成可参考 `api-docs-v4.json` 的 `components.schemas`。
4. **分页**：`PageResultVO` → `total` + `records`；列表 `pageSize` 按断点（如 8/12），刷题不分页。
5. **关键 Schema**：
   - `QuestionBankDetailBundleVO`：`{ bank: QuestionBankVO, questions: QuestionVO[] }`（访客，**含答案**）
   - `PracticeQuestionVO`：刷题列表（**无** `answerJson` / `analysis`）
   - `QuestionVO`：管理/详情/热点 bundle 全字段
   - `QuestionPreviewVO`：AI 预览（`options`/`answer` 为数组）
6. **刷题防泄题（登录）**：仅 `PracticeQuestionVO` + submit 返回答案。
7. **访客刷题**：`QuestionVO.answerJson` 本地判分，不调 submit。
8. **AI 轮询**：2–5s，终态 `IMPORTED` / `FAILED` 停止。
9. **技术栈**：React + Vite + React Router + shadcn/ui。

**建议实现顺序**

1. 脚手架 + iShua token（墨绿/米白）+ `AppShell`（含角色菜单）  
2. localStorage + Bearer 鉴权 + `RoleGate` + API 封装  
3. 大厅 `/` + **访客刷题**（guest player）  
4. 登录刷题 + submit + 错题本（USER）  
5. 管理题库 / 试题 / AI 导入（PREMIUM+）  
6. 管理端占位页（ADMIN，二期再接 API）  

**建议目录（命名参考，由开发创建）**

```text
src/
  api/          # 按 tag 分模块：auth, banks, questions, practice, wrong, aiImport
  components/   # 上表组件
  pages/        # 与路由对应
  hooks/        # useAuth, usePagination, usePracticeSession
  styles/       # tokens
```

---

## 8. 无障碍与体验底线

- 刷题选项支持键盘选择与 Enter 提交。
- 色彩对比：正文与背景 ≥ 4.5:1；对错不仅依赖红绿色，配合图标/文案。
- 焦点顺序：题干 → 选项 → 操作栏；模态框 trap focus。
- 图片/装饰性背景不阻挡文字；支持 `prefers-reduced-motion`。

---

## 9. 验收清单（粗颗粒度）

- [ ] 品牌 iShua：Logo、Slogan、墨绿/米白视觉一致。
- [ ] 访客可刷公开库且不调用 submit、无错题写入。
- [ ] USER 无 PREMIUM 入口或见升级提示；PREMIUM 可建库；ADMIN 可改角色。
- [ ] localStorage + Bearer；401 清 token 并跳转登录。
- [ ] 访客用 `QuestionVO` 本地判分；登录用 `PracticeQuestionVO` + submit，答案不提前泄露。
- [ ] 多选须提交；可跳过未答题；完成页统计 + 回大厅/再刷一遍。
- [ ] 答错 Toast 3s；主观题占位；空态无插画；AI 表格展开编辑；题库 Drawer。
- [ ] 刷题页移动端无底栏遮挡题干。
- [ ] 删库须输入名称；删题支持「不再提示」。
- [ ] 题库页公共/私有 Tab 与 USER 私有 Tab Upgrade 正确。
- [ ] 管理题库 CRUD（PREMIUM+）与公开/私有标签正确。
- [ ] 发现占位在 App 壳内，不跳转 `/`。
- [ ] 题库内试题分页、搜索、手工增删改可用。
- [ ] 刷题：单选/多选/判断交互与 `userAnswer` 格式正确；提交后展示解析与对错。
- [ ] 答错后可在错题本看到记录；**错题重刷为独立页** `/app/wrong-questions/practice`。
- [ ] UpgradePrompt 含邮箱 cloud_aaa@163.com；大厅卡片仅标题+描述；首版无随机顺序 UI。
- [ ] ADMIN 管理页为占位；试题编辑为整页 PUT 全量更新。
- [ ] AI 导入：上传→轮询→预览编辑→批量确认全链路；409/429 有友好提示。
- [ ] 所有分页使用 `records`/`total`，无字段名假设错误。
- [ ] 3 秒内可识别页面用途与主按钮（大厅刷题、会话提交）。
- [ ] 视觉符合「考纲手札」方向，无通用紫渐变模板感。

---

## 10. 工坊确认记录

| # | 结论 |
|---|------|
| A–H | 见 v0.3（访客答案、PREMIUM、刷题交互、Token 等） |
| 1 | 升级联系邮箱：**cloud_aaa@163.com** |
| 2 | Slogan 固定位置：大厅 / 登录页（见 §0） |
| 3 | 大厅卡片仅**标题+描述** |
| 4 | **随机顺序首版不做**（默认关，稳定后与后端定存储） |
| 5 | 导航见 **§0.4** |
| 6 | **ADMIN 管理页首版占位** |
| 7 | 试题**整页表单 + PUT 全量更新** |
| 8 | 题库练习与错题重刷为**不同页面/组件** |

**API 文档**：仓库仅保留根目录 **`api-docs-v4.json`**（旧版 `api-docs.json` 已删除）。

---

*文档版本：草稿 v0.4 · 2026-05-19 · API：`api-docs-v4.json`*
