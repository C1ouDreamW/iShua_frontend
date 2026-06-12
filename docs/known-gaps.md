# 阶段验收遗留与缺陷清单

> **用途**：汇总 P0–P9 各阶段静态验收中记录的**当前仍未完善**或**仅部分完成**的项，便于二期排期与联调跟踪。  
> **依据**：`docs/implementation-plan.md` 各阶段「遗留」、分阶段验收结论（2026-05-20）。  
> **说明**：阶段功能已勾选完成（☑），本清单描述的是与规格/体验的差距，不代表阻塞发布演示。

**图例**

| 标记 | 含义 |
|------|------|
| 🔴 | 建议优先修复（安全、联调阻塞、明显规格偏差） |
| 🟡 | 体验/一致性优化，首版可接受 |
| 🟢 | 可选增强或明确二期 |
| ✅ | 曾在早期验收中提出，已在后续阶段修复（保留记录便于追溯） |

---

## 跨阶段（全局）

| 优先级 | 状态 | 缺陷 | 建议 |
|--------|------|------|------|
| ✅ | 已修复 | **导航 IA 重构**（发现/题库/管理拆分、路由迁移） | 见 `docs/plans/navigation-and-banks-ia.md`；提交 `5152e20` |
| 🟡 | 未完善 | **双 Toast 体系**：全局 `AppToastViewport`（z-index 100）与刷题专用 `PracticeToast`（z-index 50）并存 | 收敛为单一 Toast 或明确分工文档 |
| 🟡 | 未完善 | **部分页面仍用页内错误文案**，未全部改为 `useAppToast`（如刷题 `submitError` 在 Player 内展示） | 统一错误呈现策略 |
| 🟢 | 未完善 | **无 E2E / 关键路径自动化测试**（P9-6 明确不纳入首版） | 二期 Playwright 等 |
| 🟢 | 未完善 | **`npm run lint` 存在告警**（如未使用 import、`react-hooks/set-state-in-effect` 等） | 单独 PR 清理 |
| 🟡 | 未完善 | **`ishua-ui-spec.md` §10 勾选框**未随验收更新为已勾 | 文档维护 |
| 🟢 | 未完善 | **§11 审美终检**未做正式 UI 评审，仅代码走查 | 设计评审一轮 |
| 🟢 | 未完善 | **`implementation-plan.md` §1.1** M3/M4/M5 里程碑未标 ✅（功能已实现） | 文档同步 |
| ✅ | 已修复 | **大厅顶栏「昵称 ▾」+「进入学习」**（导航 IA 重构） | `LobbyAccountMenu`、`HomePage`（2026-05-21） |
| 🟡 | 未完善 | **`TagQuestionType` 未按 §4.1 分色**（SINGLE/MULTI/JUDGE 统一 `brand-muted`） | 按规格补题型色 |
| ✅ | 已修复 | **`findMyBank` 分页 100 上限** | Phase 4：`getBankNode`（`GET /bank-nodes/{id}`） |
| 🟢 | 二期 | 随机顺序、深色模式、Dashboard、ADMIN 用户管理真页、Cookie 鉴权、试题 PATCH | 见 `implementation-plan.md` §5 |

**已在后续阶段修复（追溯）**

| 原阶段 | 项 | 修复于 |
|--------|-----|--------|
| P1/P2/P5 | 大厅/空态 Logo 占位「刷」字块 | **P9** `LogoMark` |
| P2/P5 | `?redirect=` 开放重定向 | **P9** `sanitizeRedirect` / `buildLoginRedirect` |
| P2 | 大厅刷新闪「登录/注册」 | **P9** `HomePage` 顶栏 `authLoading` 骨架 |
| P2/P5 | USER 登录默认 `/`、发现指向大厅 | **导航 IA** `5152e20` → `/app/banks`、`/app/discover` |
| P5 | 大厅无昵称下拉 | **导航 IA** `LobbyAccountMenu` |
| P1 | `PracticeComplete` 英文副标题 | 已改为中文「练习完成✅」（含 emoji，可再润色） |

---

## P0 — 项目基建

| 优先级 | 缺陷 | 说明 |
|--------|------|------|
| 🟢 | 无 `gradeAnswer` / `parseOptionsJson` 单测 | P0-8 允许占位；判分已在 P0 超前实现，缺回归测试 |
| 🟢 | 未做可选 API 健康检查 | 计划允许对公开 GET 试连，当前无封装调用 |
| 🟢 | `vite-env.d.ts` 未声明 `ImportMetaEnv` | 不影响运行，IDE 类型提示可补 |
| 🟡 | 早期 `AppShell` 仅为极简顶栏占位 | 已由 **P5** 完整壳层替代，无单独遗留 |

---

## P1 — 公开大厅 + 访客刷题（M1）

| 优先级 | 缺陷 | 说明 |
|--------|------|------|
| 🟡 | **未拆独立 `GuestPracticePlayer` 组件** | 逻辑均在 `GuestPracticePage.tsx`；与 P3 `PracticePlayer` 分离策略一致即可，非功能缺失 |
| 🟡 | **`BankCard` 除标题+描述外有「公开题库」标签** | 略多于规格「仅标题+描述」 |
| 🟡 | **窗口 resize 改变 `pageSize` 时，大厅 `current` 未重置** | 断点切换后可能出现空页 |
| 🔴 | **判断题 `optionsJson` 与 T/F 映射需联调** | 有自定义选项时按索引 0→T、1→F；顺序与后端不一致会判错 |
| 🟢 | 无访客路径 E2E | 依赖后端公开题库数据 |
| 🟢 | **`PracticeComplete` 副标题含「✅」** | 文案可改为纯中文无 emoji |

---

## P2 — 登录注册 + Auth（M2 前半）

| 优先级 | 缺陷 | 说明 |
|--------|------|------|
| ✅ | **USER 登录默认落地** | 现为 `/app/banks`（导航 IA 重构，2026-05-21） |
| 🟡 | **已登录访问 `/login` 无自动重定向** | 可跳到默认落地页 |
| 🟡 | **401 使用 `window.location.assign` 全页跳转** | 功能正确，SPA 体验略硬；登录页 Toast 已接 `authFlash` |
| 🟡 | **部分 `/app` 子页仍有页内登录守卫** | 与 `AppShell` 统一守卫重复但无害（如早期 `PracticePage` 逻辑） |
| ✅ | `?redirect=` 开放重定向 | **P9 已修复** |

---

## P3 — 登录刷题（M2 核心）

| 优先级 | 缺陷 | 说明 |
|--------|------|------|
| 🟡 | **刷题页标题常显示「题库练习」** | 依赖可选 `getHotPracticeDetail` 取标题，失败则回退文案 |
| 🟡 | **提交失败以页内 `submitError` 为主** | P9 在 `PracticePage` 可对 `submitError` 调全局 Toast，Player 内仍保留行内展示 |
| 🟡 | **答错 Toast 仍用 `PracticeToast`** | 与全局 Toast 双轨，见跨阶段 |
| 🟢 | 主观题仅占位「跳过」，无提交 | 与后端能力一致时为首版预期 |

---

## P4 — 错题本 + 错题重刷（M2 闭环）

| 优先级 | 缺陷 | 说明 |
|--------|------|------|
| 🟡 | **错题本题库筛选项不完整** | 主要来自 `pagePublicBanks` + 当前页记录；仅私有库错题可能显示「题库 {id}」 |
| 🟡 | **移出错题无「不再提示」** | §7.16 的「不再提示」仅用于删题；移出每次仍确认 |
| 🟢 | **列表行未展示题库名称** | 规格未强制，信息略少 |
| 🟢 | 「答错后出现于列表」依赖 **P3 submit** + 后端 | 需端到端联调验证 |

---

## P5 — AppShell、导航与 RBAC

| 优先级 | 缺陷 | 说明 |
|--------|------|------|
| 🟡 | **API `code=403` 不弹 `UpgradePrompt`** | 路由层已挡 USER；若直调 API 仅返回业务错误文案 |
| ✅ | App 内「发现」指向 `/` | **已修复**：`/app/discover` 占位；「题库」→ `/app/banks` |
| ✅ | 侧栏「我的题库」实为管理页 | **已修复**：「题库」刷题选题 +「管理题库」`/app/manage/banks` |
| ✅ | `?redirect=` 未校验 | **P9 已修复** |

---

## P6 — 我的题库（M3 前半）

> **路径变更**：列表与 CRUD 在 `/app/manage/banks`；刷题选题在 `/app/banks`（`PracticeBanksPage`）。

| 优先级 | 缺陷 | 说明 |
|--------|------|------|
| 🟡 | **Drawer 403/404 与列表错误形态不统一** | Drawer 内联错误 + Toast；列表用 `ErrorState`，P9 已部分统一文案 |
| 🟢 | **删库确认无 Spinner 组件** | 仅「删除中…」文案，符合可用标准 |

---

## P7 — 题库详情与试题管理（M3）

| 优先级 | 缺陷 | 说明 |
|--------|------|------|
| ✅ | **`findMyBank` 分页 100 上限** | Phase 4 已改为 `getBankNode` |
| 🟡 | **`TagQuestionType` 未分色** | 见跨阶段 |
| 🟢 | 试题表单与预览导入表单逻辑部分重复 | 可抽公共表单项（二期重构） |

---

## P8 — AI 智能导入（M4）

| 优先级 | 缺陷 | 说明 |
|--------|------|------|
| 🔴 | **依赖后端 AI Worker 联调** | 无 Worker 时仅能验证上传/失败态，无法走通 PARSED→预览→入库 |
| 🟡 | **轮询无显式「取消解析」按钮** | 离开页面停止前端轮询；可通过 `GET /ai-import/tasks` 恢复（见 `docs/plans/ai-import-recovery-v4.md`） |
| 🟡 | **轮询若直接得到 `IMPORTED`** | 未点「确认导入」也可能进完成页（边界态，视后端行为） |
| 🟡 | **`PARSED` 但 `questions` 为空** | 预览区提示并禁用确认；支持「重新拉取预览」 |
| 🟢 | **403 不弹 Upgrade** | 路由 PREMIUM 已挡，同 P5 |

**已修复（2026-05-25，v4 API）**：关页/切路由后无法恢复预览 — `pageMyImportTasks` + `ImportRecoveryBanner` + `EXPIRED` 处理。

---

## P9 — 收尾与质量（M5）

| 优先级 | 缺陷 | 说明 |
|--------|------|------|
| 🟢 | **未做 E2E** | 计划明确可选、不纳入首版 |
| 🟡 | **Toast 未 100% 收敛** | 见跨阶段 |
| 🟡 | **Lint 未清零** | 见跨阶段 |
| 🟡 | **`ishua-ui-spec.md` 验收清单未回写** | 代码走查已通过，规格文档勾选未同步 |

---

## 联调与运维提醒

| 项 | 说明 |
|----|------|
| CORS / 端口 | 确保 `VITE_API_BASE_URL` 与后端一致 |
| `Result.code` | 业务成败以 body.code 为准，非 HTTP 状态 |
| 访客答案 | 禁止 `console.log` 题目；`hot-practice-detail` 响应在 DevTools 可见属预期 |
| 测试账号 | 需 USER / PREMIUM / ADMIN 各一（见 `README.md`） |
| PREMIUM 账号 | 建库、AI 导入、私有库刷题联调前需准备 |

---

## 建议修复优先级（二期 backlog）

1. **判断题选项与 T/F 联调**（P1 访客 + P3/P4 登录刷题）  
2. **AI 导入全链路 + Worker**（P8）  
3. ~~**`findMyBank` 改为按 ID 查询**~~（Phase 4 已完成）  
4. **Toast 体系统一**（P9 延续）  
5. **大厅 resize 分页校正、已登录访问 `/login` 重定向**（P1/P2 小改）  
6. **E2E 关键路径**（P9-6）  
7. **Lint 清理 + `ishua-ui-spec` §10 文档勾选同步**

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [implementation-plan.md](./implementation-plan.md) | 分阶段执行与完成状态 |
| [design/ishua-ui-spec.md](./design/ishua-ui-spec.md) | UI/组件/验收规格 |
| [plans/navigation-and-banks-ia.md](./plans/navigation-and-banks-ia.md) | 入口与题库 IA（已实施） |
| [../README.md](../README.md) | 本地启动与环境变量 |

---

*清单版本：1.1 · 2026-05-21 · 含导航 IA 重构文档同步*
