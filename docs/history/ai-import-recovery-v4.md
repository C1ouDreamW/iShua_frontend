# AI 导入任务恢复 — 前端升级方案（v4 API）

> **版本**：1.0 · 2026-05-25  
> **状态**：已实施（2026-05-25）  
> **OpenAPI 源**：`api-docs-v4.json`（仓库根目录，后端 main @ ca0126b 起）  
> **目标**：彻底解决「关页 / 切路由后无法回到预览与确认」；以服务端 MySQL 持久化 + 任务列表为主恢复手段。

---

## 1. 背景与问题

### 1.1 现状（v3 前端）

| 项 | 现状 |
|----|------|
| 状态存储 | `ImportWizard` 内 `useState`（`step`、`taskId`、`previewQuestions` 等） |
| 轮询 | 仅 `step === "parsing"` 时 `GET .../tasks/{taskId}/status`，卸载即 cleanup |
| 恢复 | 无；再次进入 `/app/manage/banks/:bankId/import` 恒为「上传」步 |
| 类型/API | `src/api/aiImport.ts` 仅 `submitImport`、`getTaskStatus`；`src/types/api.d.ts` 来自 v3 |

### 1.2 用户可见缺陷

- 提交文件进入「解析中」后离开 → 后台可能已到 `PARSED`，前端丢失 `taskId`，无法预览/确认。
- 预览页未确认即离开 → 本地编辑丢失；无「继续上次导入」入口。
- `isTerminalImportStatus` 未含 `EXPIRED`；过期态文案与 batch 400 未统一处理。

### 1.3 后端已提供的能力（v4）

- **持久化**：任务写入 MySQL；`GET .../status` 以 DB 为准，`PARSED` 时 `questions` 可恢复。
- **列表恢复**：`GET /api/v1/ai-import/tasks`（分页 + `bankId` + `status` + 可选 `includePreview`）。
- **新终态**：`EXPIRED`（长时间未确认 / 管理端清理）。
- **batch 增强**：预览来源 DB > Redis > body；`EXPIRED` / 非 `PARSED` 返回明确 400。

**结论**：前端不必强依赖 `localStorage`；**列表接口是主恢复手段**，`taskId` 本地缓存仅作可选加速。

---

## 2. API 契约摘要（联调对照）

### 2.1 新增

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/api/v1/ai-import/tasks` | 当前用户任务分页；导入页/题库页恢复 |
| POST | `/api/v1/admin/ai-import/tasks/cleanup` | 管理端清理（**本方案不实现 UI**） |

**推荐查询（导入页 onMounted）**：

```http
GET /api/v1/ai-import/tasks?current=1&pageSize=10&bankId={bankId}&status=PARSED,PROCESSING,SUBMITTED
```

可选：对唯一 `PARSED` 任务拉预览时再加 `includePreview=true`（`pageSize≤10`）。

### 2.2 变更（路径不变）

| 接口 | 前端需适配 |
|------|------------|
| `GET .../tasks/{taskId}/status` | 终态含 `EXPIRED`；`data=null` → 任务不存在；轮询 2~5s，终态停止 |
| `POST .../question-banks/{bankId}/questions/batch` | `EXPIRED` / 非 `PARSED` 400 文案；已 `IMPORTED` 幂等 `data=null` |
| `POST .../ai-import/submit` | 无破坏性变更；提交后继续用返回的 `taskId` 轮询 |

### 2.3 状态机（展示与分支）

```text
SUBMITTED → PROCESSING → PARSED →（用户 batch）→ IMPORTED
                ↓           ↓
              FAILED      EXPIRED
```

| status | 向导步骤 | 行为 |
|--------|----------|------|
| SUBMITTED / PROCESSING | parsing | 展示进度，轮询 status |
| PARSED | preview | 展示/编辑 questions，可确认 batch |
| IMPORTED | complete | 成功页，停止轮询 |
| FAILED | upload + 错误 | 展示 message，引导重新上传 |
| EXPIRED | upload + 过期提示 | 禁用 batch，引导重新 submit |

---

## 3. 目标与原则

### 3.1 用户可感知目标（验收一句话）

> 用户在任意时刻关闭标签页或离开导入页，只要服务端任务仍为 `PARSED`（或未终态），再次进入**同一题库**的 AI 导入页，应能看到「待确认 / 解析中」任务并可一键继续到预览或轮询，直至确认导入或任务失败/过期。

### 3.2 设计原则

1. **服务端为真相源**：恢复逻辑以 `GET /ai-import/tasks` + `GET .../status` 为准，不假设本地仍有 `taskId`。
2. **最小侵入**：优先改 `ImportWizard` / `ImportPage` / `aiImport` API 层；题库详情页仅加轻量提示（可选 P1）。
3. **单任务主路径**：同一 `bankId` 同时存在多个 `PARSED` 时，列表选择器或按 `parsedAt` 取最新一条（需 UX 明确）。
4. **幂等与终态**：`IMPORTED` 再进导入页显示成功或提示「已完成」；`EXPIRED` 统一文案，与 batch 400 一致。
5. **契约同步**：`generate:api` 切换至 `api-docs-v4.json`，避免手写类型漂移。

---

## 4. 信息架构与交互设计

### 4.1 导入页（`ImportPage` + `ImportWizard`）

#### 进入时（onMounted / bankId 变化）

1. 并行或串行调用 `pageMyImportTasks({ bankId, status: 'PARSED,PROCESSING,SUBMITTED', current: 1, pageSize: 10 })`。
2. 根据 `records` 渲染 **「进行中的导入」** 区域（位于步骤条下方、上传区上方）：
   - **1 条 PARSED**：主按钮「继续确认导入（{fileName}，{questionCount} 题）」→ 直接进入 `preview`（见 4.2）。
   - **多条 PARSED**：下拉或卡片列表，用户选一条再进入 `preview`。
   - **仅有 PROCESSING / SUBMITTED**：文案「正在解析：{fileName}」+ 按钮「查看进度」→ 进入 `parsing` 并绑定 `taskId` 轮询。
   - **无记录**：不展示横幅，保持原上传流程。

#### 上传新文件

- 若当前 `bankId` 已有 `PARSED` 未确认任务，上传前 **ConfirmDialog**（可选 P1）：「继续上次导入」/「仍要上传新文件」（新 submit 不自动作废旧任务，除非产品要求；默认允许并存，列表展示多条）。

#### 解析中（parsing）

- 保留 3s 轮询（规格 2~5s，可保持 3000ms）。
- 轮询分支补充：`EXPIRED` → 停轮询，回 upload，文案「任务已过期，请重新上传」。
- `isTerminalImportStatus` 扩展为 `IMPORTED | FAILED | EXPIRED`。

#### 预览（preview）

- `questions` 加载顺序：
  1. 列表恢复且 `includePreview=true` 时直接用 `summary.questions`；
  2. 否则 `getTaskStatus(taskId)` 的 `questions`（DB 优先）；
  3. 空数组时展示 Error +「重新拉取」按钮（再调 status）。
- 「返回上传」改为「取消并重新上传」语义：仅重置向导本地态，**不**删除服务端任务（避免误伤）；或保留「返回上传」且不清 taskId（实现时二选一，建议保留列表入口即可回到 PARSED）。

#### 完成（complete）

- 与现有一致；完成后可 `refetch` 任务列表，横幅消失。

### 4.2 恢复进入预览的两种路径

| 路径 | 触发 | 实现要点 |
|------|------|----------|
| A. 列表直进 | 用户点「继续确认」 | `setTaskId` + `setStep('preview')` + `createEditableList(questions)`；若无 questions 再 `getTaskStatus` |
| B. 轮询到达 | 仍在 parsing 页 | 现有 poll → `PARSED` 逻辑不变 |

### 4.3 题库详情页（可选，建议 P1）

在 `BankDetailPage` 头部或 AI 导入按钮旁：

- 轻量查询：`status=PARSED` + `bankId`，`pageSize=1`。
- 若存在：`AI 导入` 按钮旁 Badge「待确认」或副文案链接「有待确认的导入 →」链到 import 页（可带 `?resume=1` 自动展开横幅）。

**P0 可只做导入页内恢复**；题库页提示可后置。

### 4.4 URL 与本地缓存（可选 P2）

| 手段 | 说明 |
|------|------|
| `?taskId=` | 深链恢复单任务；进入时若 query 有值且属于当前 bank，优先恢复该任务 |
| `sessionStorage` | key：`ishua_ai_import_active:{bankId}` → `taskId`；提交成功后写入，完成/过期清除；**列表失败时的降级**，非必须 |

---

## 5. 技术方案

### 5.1 类型与 API 层

| 任务 | 文件 | 内容 |
|------|------|------|
| T0-1 | `package.json` | `generate:api` 改为 `openapi-typescript api-docs-v4.json -o src/types/api.d.ts` |
| T0-2 | `src/api/aiImport.ts` | 新增 `pageMyImportTasks(query)`；导出 `AiImportTaskSummary` 等类型别名 |
| T0-3 | `src/lib/aiImport.ts` | `ImportTaskStatus` 联合类型；`isTerminalImportStatus` 含 `EXPIRED`；`resolveImportError` 识别 batch 过期文案；`statusToWizardStep` 纯函数（可测） |

**`pageMyImportTasks` 签名建议**：

```ts
export type PageMyImportTasksQuery = {
  current: number;
  pageSize: number;
  bankId?: number;
  status?: string; // 逗号分隔，如 "PARSED,PROCESSING"
  includePreview?: boolean;
};

export function pageMyImportTasks(query: PageMyImportTasksQuery) {
  return request<PageResult<AiImportTaskSummary>>("/api/v1/ai-import/tasks", {
    query,
  });
}
```

### 5.2 状态管理：抽 hook（推荐）

新建 `src/hooks/useAiImportRecovery.ts`（或 `useImportWizard.ts`），职责：

| 职责 | 说明 |
|------|------|
| `recoverableTasks` | 列表 API 结果 + loading/error |
| `refreshTasks()` | 提交/完成/失败后刷新 |
| `resumeTask(summary)` | 按 status 设置 step、taskId、previewQuestions |
| `activeTaskId` | 当前向导绑定的 taskId |

`ImportWizard` 变薄：UI + 文件上传 + 调用 hook 动作。

### 5.3 `ImportWizard` 改造要点

1. **挂载**：`bankId` 有效时 `refreshTasks()`。
2. **新 UI 组件**（可内联或拆文件）：
   - `ImportRecoveryBanner.tsx`：展示 recoverable 列表与 CTA。
3. **轮询 effect**：依赖 `taskId` + `step === 'parsing'`；处理 `EXPIRED`。
4. **confirm batch**：捕获 400，若 message 含「过期」→ 同步 `refreshTasks` + 回 upload。
5. **submit 成功**：`refreshTasks()`；进入 parsing（与现逻辑一致）。

### 5.4 错误与文案统一

| 场景 | 用户文案 |
|------|----------|
| status `data=null` | 任务不存在或已失效，请重新上传 |
| status / 列表 `EXPIRED` | 任务已过期，请重新上传文件 |
| batch 400 过期 | 同上（`resolveImportError` 解析 message 关键字） |
| batch 非 PARSED | 展示服务端 message 或「任务当前状态不可导入：{status}」 |
| 列表 403 | 沿用 PREMIUM `RoleGate`；API 403 走 `resolveImportError` |
| 多条 PARSED | 「请选择要确认的导入任务」 |

### 5.5 不在范围内

- 管理端 `POST /admin/ai-import/tasks/cleanup` 页面（仅文档注明 EXPIRED 来源）。
- 全局「导入任务中心」跨题库列表（可二期）；本期仅按 `bankId` 过滤。
- E2E（与 P9 一致，联调清单手测即可）。

---

## 6. 任务拆分与排期

### Phase 0 — 契约同步（阻塞联调）

| ID | 任务 | 产出 | 验收 |
|----|------|------|------|
| P0-1 | 以 v4 重新 `npm run generate:api` | 更新 `src/types/api.d.ts` | 含 `pageMyTasks`、`AiImportTaskSummaryVO`、`EXPIRED` 枚举说明 |
| P0-2 | 实现 `pageMyImportTasks` | `src/api/aiImport.ts` | 本地 mock 或 Swagger 可调通 |
| P0-3 | 扩展 `aiImport` 工具函数 | `src/lib/aiImport.ts` | 单元可选手测：`isTerminal`/`EXPIRED` |

**建议 PR**：`chore: sync api types v4 and ai-import list client`

---

### Phase 1 — 导入页恢复（核心，解决主问题）

| ID | 任务 | 产出 | 验收 |
|----|------|------|------|
| P1-1 | `useAiImportRecovery` hook | `src/hooks/useAiImportRecovery.ts` | 进入导入页能拉到 PARSED/PROCESSING 列表 |
| P1-2 | `ImportRecoveryBanner` | `src/components/import/ImportRecoveryBanner.tsx` | 单条 PARSED 可一键进预览 |
| P1-3 | 改造 `ImportWizard` 轮询与终态 | 同上文件 | `EXPIRED` 停止轮询并提示；`FAILED` 不变 |
| P1-4 | 预览题加载策略 | `ImportWizard` | 关页后重进 → 点继续 → 表格有题；batch 成功进 complete |
| P1-5 | batch 错误处理 | `resolveImportError` | 对过期任务 batch 显示统一文案并刷新列表 |
| P1-6 | 完成后刷新列表 | hook | 成功页返回后横幅不出现已完成任务（列表筛掉 IMPORTED 或仅查 PARSED,PROCESSING,SUBMITTED） |

**建议 PR**：`feat: ai import task recovery via task list`

**手测清单（必须全过）**：

1. 提交文件 → parsing → 刷新浏览器 → 进入导入页 → 见「解析中」或自动继续轮询至 preview。  
2. 至 PARSED 后刷新 → 见「待确认」→ 进入 preview → 确认导入 → complete。  
3. 模拟 EXPIRED（管理端 cleanup 或等待）→ 横幅/轮询提示过期，batch 不可用。  
4. 同一 bank 两个 PARSED（若后端允许）→ 用户可选择其一恢复。  
5. 已 IMPORTED 任务不再出现在待办横幅；再次 batch 幂等不报错（或静默成功）。

---

### Phase 2 — 体验增强（可选，可同 PR 或跟进）

| ID | 任务 | 说明 |
|----|------|------|
| P2-1 | `BankDetailPage` 待确认 Badge | 链到 import 页 |
| P2-2 | `?taskId=` 深链 | `ImportPage` 读 searchParams 自动 `resumeTask` |
| P2-3 | `sessionStorage` 降级 | 列表 API 失败时尝试上次 taskId + status |
| P2-4 | 新上传与已有 PARSED 冲突确认框 | 产品确认后做 |

**建议 PR**：`feat: ai import recovery hints on bank detail`

---

### Phase 3 — 文档与债务清理

| ID | 任务 | 文件 |
|----|------|------|
| P3-1 | 更新 `docs/known-gaps.md` | 关闭「关页无法恢复」；记录 EXPIRED |
| P3-2 | 更新 `docs/design/ishua-ui-spec.md` §7.17 | 补充恢复横幅与 EXPIRED |
| P3-3 | 更新 `docs/implementation-plan.md` | P8 遗留项、API 表增加 list 接口 |
| P3-4 | README 联调说明 | `generate:api` 指向 v4 |

---

## 7. 文件变更清单（预估）

| 路径 | 变更类型 |
|------|----------|
| `api-docs-v4.json` | 已存在，作为 generate 源 |
| `package.json` | 修改 generate 脚本 |
| `src/types/api.d.ts` | 自动生成 |
| `src/api/aiImport.ts` | 扩展 |
| `src/lib/aiImport.ts` | 扩展 |
| `src/hooks/useAiImportRecovery.ts` | 新增 |
| `src/components/import/ImportRecoveryBanner.tsx` | 新增 |
| `src/components/import/ImportWizard.tsx` | 重构 |
| `src/pages/ImportPage.tsx` | 可能传入 initialTaskId（P2） |
| `src/pages/BankDetailPage.tsx` | 可选 P2 |
| `docs/plans/ai-import-recovery-v4.md` | 本文档 |

---

## 8. 风险与对策

| 风险 | 对策 |
|------|------|
| `includePreview=true` 响应过大 | 默认 false；仅 resume 单条 PARSED 时 true 或走 status |
| 多 PARSED 用户困惑 | 列表选择 + 显示 `fileName` / `parsedAt` |
| v4 类型生成破坏其他 API 引用 | Phase 0 全量 `tsc` / `npm run build` |
| 轮询与列表状态不一致 | resume 后仍以 status 轮询为准；列表仅入口 |
| 旧后端无 list 接口 | 环境检测失败时 Toast「无法加载历史任务」，降级仅上传（保留可选 sessionStorage） |

---

## 9. 联调依赖

| 项 | 说明 |
|----|------|
| 后端 | main ≥ ca0126b；MySQL 任务表；Worker 正常 |
| 账号 | PREMIUM+ JWT |
| Swagger | `/swagger-ui.html` → AI 智能导入 |
| 关键链路 | ① PARSED 列表恢复 + preview ② EXPIRED 后 batch 400 ③ 关页重进 PROCESSING 轮询 |

---

## 10. 完成定义（Definition of Done）

- [x] `generate:api` 使用 `api-docs-v4.json`，构建通过  
- [x] 导入页进入可展示并恢复 `PARSED` / `PROCESSING` / `SUBMITTED` 任务  
- [x] 关页或路由离开后再进入，可预览并 batch 确认（PARSED 链路）  
- [x] `EXPIRED` / `FAILED` / `IMPORTED` 行为符合 §2.3 表  
- [x] `known-gaps` / `ishua-ui-spec` 已同步（Phase 3）  
- [ ] 手测 §6 Phase 1 清单 5 条（需联调后端 Worker 与 MySQL 任务表）  

---

## 11. 相关文档

| 文档 | 说明 |
|------|------|
| `api-docs-v4.json` | OpenAPI 真源 |
| `docs/known-gaps.md` | P8 遗留项 |
| `docs/design/ishua-ui-spec.md` | ImportWizard 规格 |
| `docs/implementation-plan.md` | P8 里程碑 |

---

*规划版本：1.0 · 待评审后按 Phase 0 → 1 → 2 → 3 实施*
