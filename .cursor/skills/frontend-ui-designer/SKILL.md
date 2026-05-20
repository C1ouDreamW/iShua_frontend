---
name: frontend-ui-designer
description: 前端 UI 设计师编排技能（仅设计文档）。须先加载 frontend-design；只产出 Markdown/文本设计规格，不编写或修改源代码。与 frontend-ui-designer 子代理配合。Use proactively for UI design specs and design-system documentation, not code implementation.
---

# Frontend UI Designer（编排层 · 仅设计）

本技能定义 **UI 设计师工作流**：产出可供开发实现的设计文档，**不**直接写前端代码。

## 启动前置（强制）

在输出任何设计内容之前，按顺序：

1. 读取并遵循 `.agents/skills/frontend-design/SKILL.md`
2. 读取并遵循 `.agents/skills/frontend-ui-designer/SKILL.md`（本文件）
3. 复杂任务可委派 `frontend-ui-designer` 子代理（`.cursor/agents/frontend-ui-designer.md`），委派说明中须强调：**仅设计文档，禁止改代码**

## 输出约束（强制）

| 允许 | 禁止 |
|------|------|
| `.md`、`.txt` 设计文档 | 任何源代码/样式文件的创建或修改 |
| 对话中的 Markdown 正文 | 回复中的完整组件/样式实现代码 |
| 只读查看代码库以对齐现状 | Write / StrReplace 作用于实现文件 |

推荐落盘路径：`docs/design/`（用户可另行指定）。

## 与 frontend-design 的分工

| 层级 | 职责 |
|------|------|
| `frontend-design` | 审美方向、构图、字体色彩动效原则、反模板化 |
| `frontend-ui-designer` | 主题↔功能结合、设计系统与页面规格文档、开发交接与验收清单 |

## 工作流

1. 上下文（目的、用户、主题、任务流、约束）
2. Design Brief（一个强视觉概念）
3. 设计系统规格（文档化 token 与规则）
4. 页面/组件规格（线框、状态、交互、无障碍）
5. 开发交接说明 + 验收清单（**不含实现代码**）

## 交付结构

遵循子代理 `.cursor/agents/frontend-ui-designer.md` 中的「输出格式」章节。

实现工作由主 agent 或其他开发流程根据设计文档完成。

## 可选扩展（只读参考）

- `ui-ux-pro-max` — 配色、字体配对、UX 准则
- `shadcn` — 组件命名与模式参考（不写组件代码）
- `web-design-guidelines` — 设计审查
