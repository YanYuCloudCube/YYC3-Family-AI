---
file: YYC3-提示词-FigmaAI-UIUX设计-20260403.md
description: YYC³ Family AI UI/UX 设计 Figma AI 提示词，用于智能体化界面设计
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-03
updated: 2026-04-03
status: stable
tags: [prompt],[figma],[ui-design],[ux-design],[multi-agent]
category: design
language: zh-CN
audience: designers,developers
complexity: intermediate
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ Family AI - Figma AI UI/UX 设计提示词

## 一、设计背景与目标

### 1.1 项目背景

YYC³ Family AI 是一款 AI 驱动的智能编程助手平台，正在进行 **Phase 1: 智能体化基础** 升级。需要设计 Multi-Agent 工作流的可视化界面，支持用户与多个智能体（规划/编码/测试/评审）协作。

### 1.2 设计目标

| 目标 | 描述 |
|------|------|
| **智能体可视化** | 展示 4 类智能体状态、任务进度、协作关系 |
| **任务流程可视化** | 展示任务分解、执行、验收的完整流程 |
| **用户交互优化** | 简化用户与智能体的交互方式 |
| **状态反馈清晰** | 实时展示智能体工作状态和结果 |

---

## 二、Figma AI 设计提示词

### 2.1 智能体面板设计提示词

**Prompt 1: Multi-Agent 状态面板**

```
Design a Multi-Agent Status Panel for an AI-powered coding assistant platform.

Requirements:
1. Panel Layout:
   - Left sidebar: Agent list with 4 agents (Planner, Coder, Tester, Reviewer)
   - Main area: Selected agent's task details and progress
   - Right sidebar: Agent collaboration graph

2. Agent Card Design:
   - Agent icon with role-specific color (Planner: blue, Coder: green, Tester: orange, Reviewer: purple)
   - Status indicator (idle/running/waiting/completed/error)
   - Current task preview (max 2 lines)
   - Progress bar with percentage
   - Quick action buttons (pause/resume/cancel)

3. Status Indicators:
   - Idle: Gray circle with pause icon
   - Running: Animated spinner with agent color
   - Waiting: Yellow circle with clock icon
   - Completed: Green checkmark
   - Error: Red circle with alert icon

4. Interaction:
   - Click agent card to expand details
   - Hover to show task summary tooltip
   - Drag to reorder agent priority

Style:
- Modern, clean, professional
- Dark theme primary (light theme variant needed)
- Consistent with VS Code / Cursor aesthetic
- Use glassmorphism for panel backgrounds
- Smooth animations (200-300ms transitions)

Output: Desktop view (1440px), Tablet view (768px), Mobile view (375px)
```

---

### 2.2 任务流程可视化提示词

**Prompt 2: Task Flow Visualization**

```
Design a Task Flow Visualization component for Multi-Agent workflow.

Requirements:
1. Flow Diagram:
   - Horizontal timeline showing task stages
   - Each stage: Analysis → Planning → Coding → Testing → Review → Complete
   - Current stage highlighted with glow effect
   - Completed stages: solid color with checkmark
   - Pending stages: outlined, gray

2. Task Node Design:
   - Circular node with stage icon
   - Connected by animated dashed lines (flow direction)
   - Node size: 48px diameter
   - Active node: pulsing animation, 1.2x scale

3. Task Details Card (appears on node click):
   - Task name and description
   - Assigned agent with avatar
   - Start time and estimated completion
   - Input/Output preview
   - Dependencies list
   - Action buttons (view details, rerun, skip)

4. Progress Indicators:
   - Overall progress bar at top
   - Time elapsed / estimated remaining
   - Agent utilization percentage

5. Error State:
   - Failed node: red border with error icon
   - Error message tooltip on hover
   - Retry button visible

Style:
- Gradient background (dark blue to purple)
- Neon glow effects for active elements
- Monospace font for code snippets
- Card shadows: 0 4px 24px rgba(0,0,0,0.3)

Output: Full-width component (responsive), Error state variant, Loading state variant
```

---

### 2.3 智能体协作图提示词

**Prompt 3: Agent Collaboration Graph**

```
Design an Agent Collaboration Graph showing how multiple AI agents work together.

Requirements:
1. Graph Structure:
   - Central node: Orchestrator (hub)
   - Connected nodes: 4 agents (Planner, Coder, Tester, Reviewer)
   - Dynamic edges showing message flow
   - Edge thickness: based on message frequency

2. Node Design:
   - Orchestrator: Larger hexagon, gold color
   - Agent nodes: Circles with role-specific colors
   - Node labels: Agent name + current task count
   - Mini status ring around each node

3. Edge Animation:
   - Dotted lines with flowing particles
   - Particle direction: message sender → receiver
   - Particle color: matches sender agent
   - Speed: based on message priority

4. Interaction Panel (on node click):
   - Agent details card
   - Recent messages list (last 5)
   - Performance metrics (tasks completed, avg time)
   - Configuration options

5. Real-time Updates:
   - Smooth position transitions when layout changes
   - Pulse effect on new message
   - Fade in/out for agent status changes

Style:
- Dark theme with subtle grid background
- Glowing nodes and edges
- Minimalist labels
- Floating panel design

Output: Interactive component, Static overview, Compact sidebar variant
```

---

### 2.4 代码应用预览提示词

**Prompt 4: Code Application Preview**

```
Design a Code Application Preview interface for AI-generated code changes.

Requirements:
1. Split View Layout:
   - Left: Original code (read-only)
   - Right: Modified code (with changes highlighted)
   - Center: Unified diff view option

2. Diff Visualization:
   - Added lines: Green background, + prefix
   - Removed lines: Red background, - prefix
   - Modified lines: Yellow background, ~ prefix
   - Unchanged lines: Default background

3. File Header:
   - File path with folder icon
   - Language badge (TypeScript, React, etc.)
   - Change statistics (+X -Y lines)
   - File actions (open in editor, copy, download)

4. Change Navigation:
   - Mini-map showing change locations
   - Previous/Next change buttons
   - Change counter (e.g., "3 of 7")

5. Action Bar:
   - Accept All button (primary, green)
   - Reject All button (secondary, red)
   - Accept Selected button
   - Request Revision button (with comment input)

6. AI Explanation Panel:
   - Collapsible panel below diff
   - AI's explanation of changes
   - Reasoning and alternatives considered
   - Confidence score

Style:
- Monospace font for code (JetBrains Mono or Fira Code)
- Line numbers visible
- Syntax highlighting
- Smooth scroll animations

Output: Desktop full view, Compact modal variant, Side-by-side mobile view
```

---

### 2.5 持久记忆面板提示词

**Prompt 5: Persistent Memory Panel**

```
Design a Persistent Memory Panel for storing and managing AI agent knowledge.

Requirements:
1. Panel Layout:
   - Top: Search bar with filters
   - Left: Memory categories tree
   - Right: Memory items grid/list

2. Memory Categories:
   - Project Knowledge (architecture, conventions)
   - Code Patterns (reusable snippets)
   - Debug History (solved issues)
   - User Preferences (customizations)
   - Conversation History (past interactions)

3. Memory Item Card:
   - Title and summary
   - Category badge
   - Creation/update timestamp
   - Relevance score
   - Quick actions (edit, delete, pin)

4. Memory Detail View:
   - Full content display
   - Related memories links
   - Usage statistics
   - Source attribution (which agent created it)

5. Search & Filter:
   - Full-text search
   - Filter by category, date range, agent
   - Sort by relevance, recency, usage

6. Memory Insights:
   - Total memories count
   - Storage usage
   - Most used memories
   - Knowledge gaps suggestions

Style:
- Card-based layout
- Subtle shadows and borders
- Category-specific accent colors
- Empty state illustrations

Output: Full panel view, Compact widget, Mobile-friendly list
```

---

### 2.6 任务调度队列提示词

**Prompt 6: Task Scheduler Queue**

```
Design a Task Scheduler Queue interface for managing long-running AI tasks.

Requirements:
1. Queue Overview:
   - Active tasks section (currently running)
   - Pending tasks section (waiting)
   - Completed tasks section (history)
   - Failed tasks section (needs attention)

2. Task Card Design:
   - Task name and type icon
   - Progress bar with percentage
   - Estimated time remaining
   - Priority badge (high/medium/low)
   - Assigned agent avatar
   - Status chip

3. Queue Controls:
   - Add new task button
   - Pause/Resume queue
   - Clear completed
   - Retry failed
   - Queue settings (concurrency, timeout)

4. Task Detail Modal:
   - Full task description
   - Input parameters
   - Execution log (collapsible)
   - Output preview
   - Error details (if failed)
   - Retry/Cancel actions

5. Timeline View (optional):
   - Gantt-style timeline
   - Task duration bars
   - Dependencies arrows
   - Current time indicator

6. Notifications:
   - Task completion toast
   - Error alert
   - Queue status changes

Style:
- Kanban-inspired layout
- Drag-and-drop support
- Color-coded priorities
- Smooth animations for task transitions

Output: Desktop queue view, Timeline variant, Mobile compact view
```

---

## 三、设计系统规范

### 3.1 颜色系统

```
Primary Colors:
- Planner Agent: #3B82F6 (Blue 500)
- Coder Agent: #10B981 (Emerald 500)
- Tester Agent: #F59E0B (Amber 500)
- Reviewer Agent: #8B5CF6 (Violet 500)
- Orchestrator: #FBBF24 (Amber 400)

Status Colors:
- Idle: #6B7280 (Gray 500)
- Running: #3B82F6 (Blue 500)
- Waiting: #F59E0B (Amber 500)
- Completed: #10B981 (Emerald 500)
- Error: #EF4444 (Red 500)

Background Colors (Dark Theme):
- Primary: #0F172A (Slate 900)
- Secondary: #1E293B (Slate 800)
- Tertiary: #334155 (Slate 700)
- Surface: rgba(255,255,255,0.05)
```

### 3.2 字体系统

```
Font Family:
- Primary: Inter (UI text)
- Code: JetBrains Mono (code snippets)
- Display: Plus Jakarta Sans (headings)

Font Sizes:
- xs: 12px
- sm: 14px
- base: 16px
- lg: 18px
- xl: 20px
- 2xl: 24px
- 3xl: 30px

Font Weights:
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700
```

### 3.3 间距系统

```
Spacing Scale (4px base):
- 1: 4px
- 2: 8px
- 3: 12px
- 4: 16px
- 5: 20px
- 6: 24px
- 8: 32px
- 10: 40px
- 12: 48px
- 16: 64px
```

### 3.4 动画规范

```
Transition Durations:
- Fast: 150ms (hover states)
- Normal: 200-300ms (panel transitions)
- Slow: 500ms (page transitions)

Easing Functions:
- Default: cubic-bezier(0.4, 0, 0.2, 1)
- Ease-in: cubic-bezier(0.4, 0, 1, 1)
- Ease-out: cubic-bezier(0, 0, 0.2, 1)
- Bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

## 四、设计交付清单

### 4.1 必需交付物

| 组件 | 格式 | 数量 |
|------|------|------|
| Multi-Agent 状态面板 | Figma Component | 3 (Desktop/Tablet/Mobile) |
| 任务流程可视化 | Figma Component | 3 (Normal/Error/Loading) |
| 智能体协作图 | Figma Component | 3 (Interactive/Static/Compact) |
| 代码应用预览 | Figma Component | 3 (Full/Modal/Mobile) |
| 持久记忆面板 | Figma Component | 3 (Full/Widget/Mobile) |
| 任务调度队列 | Figma Component | 3 (Queue/Timeline/Mobile) |

### 4.2 可选交付物

| 组件 | 格式 | 说明 |
|------|------|------|
| 设计系统文档 | Figma Page | 颜色/字体/间距规范 |
| 交互原型 | Figma Prototype | 关键流程演示 |
| 动效规范 | Lottie/GIF | 动画效果参考 |
| 图标库 | Figma Components | 智能体/状态图标 |

---

## 五、使用说明

### 5.1 如何使用这些提示词

1. **复制提示词**: 选择需要设计的组件提示词
2. **粘贴到 Figma AI**: 在 Figma 的 AI 功能中粘贴
3. **调整参数**: 根据实际需求微调细节
4. **生成设计**: 让 Figma AI 生成初步设计
5. **迭代优化**: 基于生成结果进行人工优化

### 5.2 设计优先级

| 优先级 | 组件 | 原因 |
|--------|------|------|
| **P0** | Multi-Agent 状态面板 | Phase 1 核心界面 |
| **P0** | 任务流程可视化 | 用户核心交互 |
| **P1** | 代码应用预览 | 已有基础，需升级 |
| **P1** | 智能体协作图 | 增强可视化 |
| **P2** | 持久记忆面板 | Phase 1 后期 |
| **P2** | 任务调度队列 | Phase 1 后期 |

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-04-03 | 初始版本，完成 Figma AI 设计提示词 | YanYuCloudCube Team |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
