---
file: YYC3-提示词-FigmaAI-完整设计指南-20260403.md
description: YYC³ Family AI 完整 Figma AI 设计提示词指南 - 整合 UI/UX 设计与全局设置重构
author: YanYuCloudCube Team <admin@0379.email>
version: v2.0.0
created: 2026-04-03
updated: 2026-04-03
status: production
tags: [prompt],[figma],[ui-design],[ux-design],[multi-agent],[settings],[orchestrator]
category: design
language: zh-CN
audience: designers,developers
complexity: advanced
recommended_model: Claude Opus 4.6
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ Family AI - Figma AI 完整设计指南

## 📋 目录

- [一、项目背景与设计目标](#一项目背景与设计目标)
- [二、大模型选择建议](#二大模型选择建议)
- [三、核心架构设计](#三核心架构设计)
- [四、UI/UX 设计提示词](#四uiux-设计提示词)
- [五、全局设置重构提示词](#五全局设置重构提示词)
- [六、设计系统规范](#六设计系统规范)
- [七、实施优先级与路线图](#七实施优先级与路线图)
- [八、交付清单](#八交付清单)

---

## 一、项目背景与设计目标

### 1.1 项目背景

YYC³ Family AI 是一款 AI 驱动的智能编程助手平台,正在进行 **Phase 1: 智能体化基础** 升级。本次设计需要实现两大核心目标:

| 目标维度 | 具体内容 |
|---------|---------|
| **智能体可视化** | Multi-Agent 工作流界面,支持规划/编码/测试/评审智能体协作 |
| **设置系统重构** | 基于编排器模式的模块化设置系统,实现高可复用架构 |

### 1.2 设计目标矩阵

| 设计目标 | 描述 | 优先级 | 依赖模块 |
|---------|------|--------|---------|
| **智能体状态可视化** | 展示 4 类智能体状态、任务进度、协作关系 | P0 | AgentOrchestrator |
| **任务流程可视化** | 展示任务分解、执行、验收的完整流程 | P0 | TaskBoardPanel |
| **用户交互优化** | 简化用户与智能体的交互方式 | P0 | 全局交互系统 |
| **状态反馈清晰** | 实时展示智能体工作状态和结果 | P0 | WorkflowEventBus |
| **设置模块化** | SettingsOrchestrator 编排器架构 | P0 | ModelManagement |
| **智能搜索** | 全局搜索支持跨模块查找设置项 | P1 | SettingsSearchBar |
| **代码预览优化** | AI 生成代码的 Diff 可视化 | P1 | DiffPreviewModal |
| **持久记忆管理** | AI 知识库可视化管理 | P2 | KnowledgeBase |

---

## 二、大模型选择建议

### 2.1 推荐配置

基于项目复杂度和设计需求,推荐以下大模型配置:

| 设计任务类型 | 推荐模型 | 理由 | 预计效果 |
|------------|---------|------|---------|
| **整体架构设计** | **Claude Opus 4.6** | 复杂系统设计,需要深度理解架构模式 | ⭐⭐⭐⭐⭐ |
| **智能体界面设计** | Claude Opus 4.6 | Multi-Agent 交互逻辑复杂 | ⭐⭐⭐⭐⭐ |
| **设置系统重构** | Claude Opus 4.6 | 编排器模式需要架构设计能力 | ⭐⭐⭐⭐⭐ |
| **组件细节设计** | Claude Sonnet 4.6 | 日常组件设计,性价比高 | ⭐⭐⭐⭐ |
| **创意界面探索** | Gemini 3.1 Pro | 多模态创意设计 | ⭐⭐⭐⭐ |
| **快速迭代原型** | Gemini 3 Flash | 简单组件快速生成 | ⭐⭐⭐ |

### 2.2 分阶段使用策略

```
Phase 1: 架构设计阶段 (Week 1-2)
├─ Claude Opus 4.6: 核心架构、编排器设计
├─ Claude Sonnet 4.6: 组件规范定义
└─ 输出: 架构图、接口定义、设计系统

Phase 2: 组件开发阶段 (Week 3-4)
├─ Claude Sonnet 4.6: 日常组件开发
├─ Gemini 3 Flash: 快速原型迭代
└─ 输出: 组件库、交互原型

Phase 3: 创意优化阶段 (Week 5)
├─ Gemini 3.1 Pro: 创意界面探索
├─ Claude Sonnet 4.6: 细节优化
└─ 输出: 最终设计稿、动效规范
```

---

## 三、核心架构设计

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      应用层 (Application Layer)                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  IDEPage / SettingsPage / AdminDashboard / TaskBoardPanel   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      编排层 (Orchestration Layer)                │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ SettingsOrchestrator │  │   AgentOrchestrator              │ │
│  │  • 配置驱动渲染      │  │   • Multi-Agent 工作流编排       │ │
│  │  • 统一状态管理      │  │   • 任务调度与分配               │ │
│  │  • 模块动态加载      │  │   • 智能体协作管理               │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      模块层 (Module Layer)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Model    │  │ Plugin   │  │   MCP    │  │  Agent           │ │
│  │ Module   │  │ Module   │  │ Module   │  │  Module          │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ TaskFlow │  │ CodeDiff │  │ Memory   │  │  Scheduler       │ │
│  │ Module   │  │ Module   │  │ Module   │  │  Module          │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      核心层 (Core Layer)                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  • ISettingsModule 接口                                      │ │
│  │  • BaseModule 抽象类                                         │ │
│  │  • ModuleRegistry 注册中心                                   │ │
│  │  • ThemeAdapter 主题适配器                                   │ │
│  │  • StorageAdapter 存储适配器                                 │ │
│  │  • WorkflowEventBus 事件总线                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流设计

```
用户交互 → 编排器 → 模块层 → 核心层 → 存储/服务
    ↓          ↓         ↓         ↓
  状态更新 ← 事件总线 ← 状态变更 ← 数据持久化
```

---

## 四、UI/UX 设计提示词

### 4.1 Multi-Agent 状态面板

**Prompt: Multi-Agent Status Panel**

```
Design a Multi-Agent Status Panel for an AI-powered coding assistant platform.

Context:
- Platform: YYC³ Family AI - AI 驱动的智能编程助手
- Phase: Phase 1 智能体化基础
- Target Users: 开发者、技术团队
- Tech Stack: React + TypeScript + Tailwind CSS

Requirements:

1. Panel Layout (Desktop 1440px):
   - Left sidebar (240px): Agent list with 4 agents
     • Planner (规划智能体) - Blue #3B82F6
     • Coder (编码智能体) - Green #10B981
     • Tester (测试智能体) - Orange #F59E0B
     • Reviewer (评审智能体) - Purple #8B5CF6
   - Main area (flexible): Selected agent's task details and progress
   - Right sidebar (300px): Agent collaboration graph

2. Agent Card Design:
   Each agent card contains:
   - Agent icon (48x48px) with role-specific color
   - Agent name (CN + EN)
   - Status indicator (idle/running/waiting/completed/error)
   - Current task preview (max 2 lines, truncate with ellipsis)
   - Progress bar (height: 4px, animated)
   - Progress percentage (right aligned)
   - Quick action buttons (pause/resume/cancel)

3. Status Indicators:
   - Idle: Gray circle (#6B7280) with pause icon
   - Running: Animated spinner with agent color (rotation 1s linear infinite)
   - Waiting: Yellow circle (#F59E0B) with clock icon
   - Completed: Green checkmark (#10B981) with fade-in animation
   - Error: Red circle (#EF4444) with alert icon + shake animation

4. Interaction Behaviors:
   - Click agent card: Expand details in main area
   - Hover: Show task summary tooltip (delay 300ms)
   - Drag agent card: Reorder agent priority
   - Double-click: Open agent configuration modal
   - Right-click: Context menu (pause/resume/configure/logs)

5. Main Area Content:
   - Agent header with avatar + name + status
   - Current task details:
     • Task name and description
     • Input parameters (collapsible)
     • Execution log (real-time, auto-scroll)
     • Output preview (syntax highlighted)
   - Performance metrics:
     • Tasks completed (last 24h)
     • Success rate (%)
     • Average execution time
   - Action buttons: View Logs, Export Results, Rerun

6. Collaboration Graph (Right Sidebar):
   - Central node: Orchestrator (hexagon, gold #FBBF24)
   - Connected nodes: 4 agents (circles with role colors)
   - Dynamic edges: Animated dotted lines showing message flow
   - Edge thickness: Based on message frequency
   - Particle animation: Flowing particles along edges (color = sender)
   - Click node: Show agent details card

Style Guidelines:
- Dark theme primary (Slate 900 #0F172A background)
- Glassmorphism for panel backgrounds (rgba(255,255,255,0.05) + blur 10px)
- Consistent with VS Code / Cursor aesthetic
- Smooth animations (200-300ms transitions, cubic-bezier(0.4, 0, 0.2, 1))
- Monospace font for code snippets (JetBrains Mono)
- Line height: 1.6 for text, 1.4 for code

Responsive Variants:
- Desktop (1440px): Full layout with all panels
- Tablet (768px): Sidebar collapses to icons (48px), collaboration graph hidden
- Mobile (375px): Full-screen modal, tab navigation between agents

Accessibility:
- ARIA labels for all interactive elements
- Keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Screen reader support for status updates
- High contrast mode support

Output:
1. Desktop view (1440px) - Full layout
2. Tablet view (768px) - Collapsed sidebar
3. Mobile view (375px) - Tab navigation
4. Agent card component (all states)
5. Collaboration graph component
6. Interaction prototype (key flows)
```

---

### 4.2 任务流程可视化

**Prompt: Task Flow Visualization**

```
Design a Task Flow Visualization component for Multi-Agent workflow.

Context:
- Purpose: Visualize task decomposition, execution, and acceptance process
- Integration: Embedded in IDEPage main content area
- Data Source: WorkflowEventBus real-time events

Requirements:

1. Flow Diagram (Horizontal Timeline):
   - Stages: Analysis → Planning → Coding → Testing → Review → Complete
   - Stage nodes:
     • Circular node (48px diameter)
     • Stage icon inside (16x16px)
     • Stage label below (14px, medium weight)
   - Current stage: Highlighted with glow effect (box-shadow: 0 0 20px {stage-color})
   - Completed stages: Solid color fill + checkmark icon
   - Pending stages: Outlined (2px border), gray (#6B7280)
   - Failed stages: Red border (#EF4444) + error icon

2. Connection Lines:
   - Animated dashed lines between nodes
   - Line style: 2px dashed, color = previous stage color
   - Animation: Flow direction arrow (CSS animation, 2s duration)
   - Active flow: Particles moving along line

3. Task Node Details (Click to expand):
   - Task name and description
   - Assigned agent with avatar (clickable to agent details)
   - Start time and estimated completion (countdown timer)
   - Input/Output preview (collapsible cards)
   - Dependencies list (clickable links)
   - Action buttons:
     • View Details (opens modal)
     • Rerun (with confirmation)
     • Skip (with reason input)

4. Progress Indicators:
   - Overall progress bar at top:
     • Height: 8px
     • Gradient fill (blue → green)
     • Percentage text (right aligned)
   - Time elapsed / estimated remaining:
     • Format: "已用时 12m 34s / 预计剩余 5m 20s"
     • Color: Gray for elapsed, Blue for remaining
   - Agent utilization percentage:
     • Mini bar chart (4 bars, one per agent)
     • Real-time updates

5. Error State Design:
   - Failed node: Red border (#EF4444, 3px) + error icon
   - Error message tooltip on hover:
     • Red background (#FEE2E2)
     • Error details (max 3 lines)
     • Timestamp
   - Retry button visible (red outline, white text)
   - "View Error Log" link

6. Loading State:
   - Skeleton loader for task nodes
   - Pulsing animation for progress bar
   - "Loading tasks..." text with spinner

Style Guidelines:
- Gradient background (dark blue #0F172A to purple #1E1B4B)
- Neon glow effects for active elements
- Monospace font for code snippets (JetBrains Mono)
- Card shadows: 0 4px 24px rgba(0,0,0,0.3)
- Border radius: 8px for cards, 24px for nodes

Animations:
- Node entrance: Scale from 0.8 to 1.0 (300ms, ease-out)
- Progress bar fill: Width transition (500ms, ease-in-out)
- Error shake: Transform translateX (200ms, 3 times)
- Particle flow: CSS animation along path (2s, linear infinite)

Responsive:
- Desktop (1440px): Horizontal timeline
- Tablet (768px): Vertical timeline (stages stacked)
- Mobile (375px): Compact list view (expandable items)

Output:
1. Full-width component (responsive)
2. Error state variant
3. Loading state variant
4. Task detail modal
5. Animation specifications (CSS/Lottie)
```

---

### 4.3 智能体协作图

**Prompt: Agent Collaboration Graph**

```
Design an Agent Collaboration Graph showing how multiple AI agents work together.

Context:
- Purpose: Visualize agent communication and task delegation
- Integration: Right sidebar of Multi-Agent Status Panel
- Real-time: Updates via WorkflowEventBus

Requirements:

1. Graph Structure:
   - Central node: Orchestrator (hub)
     • Shape: Hexagon (64px diameter)
     • Color: Gold (#FBBF24)
     • Label: "调度中心"
   - Connected nodes: 4 agents
     • Shape: Circle (48px diameter)
     • Colors: Role-specific (Blue/Green/Orange/Purple)
     • Labels: Agent name + current task count
   - Dynamic edges: Message flow visualization
     • Thickness: Based on message frequency (1-5px)
     • Style: Dotted line
     • Animation: Flowing particles

2. Node Design:
   - Orchestrator node:
     • Hexagon shape (6 sides)
     • Gold gradient fill (#FBBF24 → #F59E0B)
     • Glow effect (box-shadow: 0 0 30px rgba(251,191,36,0.5))
     • Icon: Hub/Network icon (24x24px)
   - Agent nodes:
     • Circle shape
     • Role-specific color fill
     • Mini status ring around node (3px width)
       - Idle: Gray ring
       - Running: Animated gradient ring
       - Error: Red ring
     • Icon: Agent role icon (20x20px)
   - Node labels:
     • Agent name (12px, medium weight)
     • Task count badge (e.g., "3 tasks")

3. Edge Animation:
   - Dotted lines with flowing particles:
     • Particle size: 4px diameter
     • Particle color: Matches sender agent
     • Animation: Move along path (2s duration, linear)
     • Direction: Sender → Receiver
   - Edge labels (on hover):
     • Message type (e.g., "Task Assigned", "Result Returned")
     • Timestamp
     • Message count

4. Interaction Panel (on node click):
   - Agent details card:
     • Agent avatar and name
     • Current status
     • Active tasks list (last 5)
   - Recent messages list:
     • Message type icon
     • Timestamp (relative, e.g., "2m ago")
     • Preview (max 50 chars)
     • Click to view full message
   - Performance metrics:
     • Tasks completed (last 24h)
     • Average execution time
     • Success rate (%)
   - Configuration options:
     • Pause/Resume button
     • Configure link
     • View logs link

5. Real-time Updates:
   - Smooth position transitions (500ms, ease-out) when layout changes
   - Pulse effect on new message (scale 1.1 → 1.0, 300ms)
   - Fade in/out for agent status changes (200ms)
   - Particle speed increases for high-priority messages

6. Graph Layout Algorithm:
   - Force-directed layout (d3-force or similar)
   - Orchestrator fixed at center
   - Agents arranged in circle around center
   - Collision detection to prevent overlap
   - Smooth animation on layout changes

Style Guidelines:
- Dark theme with subtle grid background (rgba(255,255,255,0.02))
- Glowing nodes and edges
- Minimalist labels (no background)
- Floating panel design (glassmorphism)
- Consistent with overall design system

Accessibility:
- Keyboard navigation between nodes (Tab, Arrow keys)
- Screen reader announcements for graph updates
- High contrast mode support
- Reduced motion option (disables animations)

Output:
1. Interactive component (with animations)
2. Static overview (for documentation)
3. Compact sidebar variant (for smaller screens)
4. Node detail panel component
5. Animation specifications (CSS/Lottie)
```

---

### 4.4 代码应用预览

**Prompt: Code Application Preview**

```
Design a Code Application Preview interface for AI-generated code changes.

Context:
- Purpose: Preview and accept/reject AI-generated code modifications
- Integration: Modal or embedded panel in IDEPage
- Data Source: CodeApplicator service

Requirements:

1. Split View Layout:
   - Left panel: Original code (read-only)
   - Right panel: Modified code (with changes highlighted)
   - Center option: Unified diff view (toggle button)
   - Panel width: Equal split (50/50) or adjustable divider

2. Diff Visualization:
   - Added lines: Green background (#10B981, opacity 0.1), + prefix in green
   - Removed lines: Red background (#EF4444, opacity 0.1), - prefix in red
   - Modified lines: Yellow background (#F59E0B, opacity 0.1), ~ prefix in yellow
   - Unchanged lines: Default background (transparent)
   - Line numbers: Gray (#6B7280), right-aligned in gutter

3. File Header:
   - File path with folder icon (clickable to open in editor)
   - Language badge (e.g., "TypeScript", "React") with icon
   - Change statistics: "+X -Y lines" (green/red badges)
   - File actions:
     • Open in Editor (icon button)
     • Copy (icon button)
     • Download (icon button)

4. Change Navigation:
   - Mini-map (right side, 20px width):
     • Shows change locations as colored bars
     • Click to jump to change
     • Current viewport highlighted
   - Previous/Next change buttons:
     • Position: Top-right corner
     • Icons: ChevronUp / ChevronDown
     • Keyboard shortcuts: F7 / Shift+F7
   - Change counter: "3 of 7 changes"

5. Action Bar (Bottom):
   - Accept All button:
     • Primary style (green background #10B981)
     • Icon: Check
     • Text: "接受全部"
   - Reject All button:
     • Secondary style (red outline)
     • Icon: X
     • Text: "拒绝全部"
   - Accept Selected button:
     • Tertiary style (blue outline)
     • Icon: CheckCircle
     • Text: "接受选中"
     • Disabled if no lines selected
   - Request Revision button:
     • Ghost style (transparent background)
     • Icon: MessageSquare
     • Text: "请求修订"
     • Opens comment input modal

6. AI Explanation Panel (Collapsible):
   - Position: Below diff view
   - Collapsed state: Show header only ("AI 说明 ▼")
   - Expanded state:
     • AI's explanation of changes (markdown rendered)
     • Reasoning and alternatives considered
     • Confidence score (progress bar, 0-100%)
     • Potential impact warnings (if any)

7. Line Selection:
   - Click line number to select/deselect
   - Shift+Click to select range
   - Selected lines: Blue border (#3B82F6, 2px)
   - Selection counter: "已选择 5 行"

Style Guidelines:
- Monospace font for code (JetBrains Mono, 14px)
- Line numbers visible (right-aligned, gray)
- Syntax highlighting (language-specific)
- Smooth scroll animations (200ms)
- Dark theme primary (Slate 900 background)

Responsive:
- Desktop (1440px): Split view
- Tablet (768px): Unified diff view only
- Mobile (375px): Stacked view (original above, modified below)

Accessibility:
- Keyboard navigation (Arrow keys, Page Up/Down)
- Screen reader support for diff announcements
- High contrast mode support

Output:
1. Desktop full view (split view)
2. Compact modal variant (unified diff)
3. Side-by-side mobile view (stacked)
4. AI explanation panel component
5. Action bar component
```

---

### 4.5 持久记忆面板

**Prompt: Persistent Memory Panel**

```
Design a Persistent Memory Panel for storing and managing AI agent knowledge.

Context:
- Purpose: Manage AI agent's long-term memory and knowledge base
- Integration: Standalone panel or embedded in KnowledgeBase component
- Data Source: RAG (Retrieval-Augmented Generation) system

Requirements:

1. Panel Layout:
   - Top: Search bar with filters (height: 56px)
   - Left: Memory categories tree (width: 240px)
   - Right: Memory items grid/list (flexible width)

2. Memory Categories Tree:
   - Project Knowledge:
     • Architecture decisions
     • Coding conventions
     • API documentation
   - Code Patterns:
     • Reusable snippets
     • Best practices
     • Design patterns
   - Debug History:
     • Solved issues
     • Error patterns
     • Solutions database
   - User Preferences:
     • Customizations
     • Frequently used settings
     • Personal shortcuts
   - Conversation History:
     • Past interactions
     • Context from previous sessions
     • User feedback

3. Memory Item Card:
   - Title (bold, 16px)
   - Summary (gray, 14px, max 2 lines)
   - Category badge (colored pill)
   - Creation/update timestamp (relative, e.g., "2 hours ago")
   - Relevance score (progress bar, 0-100%)
   - Quick actions:
     • Edit (pencil icon)
     • Delete (trash icon)
     • Pin (pin icon, toggle)

4. Memory Detail View (on card click):
   - Full content display (markdown rendered)
   - Related memories links (clickable chips)
   - Usage statistics:
     • Times accessed
     • Last accessed
     • Average relevance score
   - Source attribution:
     • Which agent created it
     • Creation context
     • Related task/conversation

5. Search & Filter:
   - Full-text search:
     • Search input with icon
     • Debounce 300ms
     • Highlight matches in results
   - Filters:
     • Category (multi-select dropdown)
     • Date range (date picker)
     • Agent (multi-select dropdown)
     • Relevance score (slider, 0-100%)
   - Sort options:
     • Relevance (default)
     • Recency
     • Usage frequency
     • Alphabetical

6. Memory Insights (Dashboard):
   - Total memories count
   - Storage usage (progress bar, MB/GB)
   - Most used memories (top 5 list)
   - Knowledge gaps suggestions:
     • "Missing: Error handling patterns"
     • "Outdated: API documentation (last updated 30 days ago)"

7. Memory Operations:
   - Add new memory:
     • Button: "+ New Memory"
     • Modal with form:
       - Title input
       - Category dropdown
       - Content textarea (markdown supported)
       - Tags input
   - Bulk operations:
     • Select multiple items
     • Delete selected
     • Export selected (JSON/Markdown)
     • Move to category

Style Guidelines:
- Card-based layout (padding: 16px, border-radius: 8px)
- Subtle shadows (0 2px 8px rgba(0,0,0,0.1))
- Category-specific accent colors:
  • Project Knowledge: Blue
  • Code Patterns: Green
  • Debug History: Orange
  • User Preferences: Purple
  • Conversation History: Gray
- Empty state illustrations (friendly, helpful)
- Hover effects (subtle scale, shadow increase)

Animations:
- Card entrance: Fade in + slide up (200ms)
- Category expand/collapse: Height transition (150ms)
- Search results: Staggered fade in (50ms delay per item)

Responsive:
- Desktop (1440px): Full layout with tree and grid
- Tablet (768px): Tree collapses to dropdown, grid becomes list
- Mobile (375px): Single column list, search bar sticky at top

Accessibility:
- Keyboard navigation (Tab, Arrow keys, Enter)
- Screen reader support for memory content
- High contrast mode support

Output:
1. Full panel view (desktop)
2. Compact widget (for sidebar)
3. Mobile-friendly list view
4. Memory detail modal
5. Add memory form
```

---

### 4.6 任务调度队列

**Prompt: Task Scheduler Queue**

```
Design a Task Scheduler Queue interface for managing long-running AI tasks.

Context:
- Purpose: Manage and monitor long-running AI tasks (code generation, testing, etc.)
- Integration: Standalone panel or embedded in TaskBoardPanel
- Data Source: Task queue service (priority queue)

Requirements:

1. Queue Overview (Kanban-inspired):
   - Active tasks section (currently running):
     • Header: "运行中 (X)"
     • Background: Blue tint (#3B82F6, opacity 0.05)
   - Pending tasks section (waiting):
     • Header: "等待中 (X)"
     • Background: Gray tint (#6B7280, opacity 0.05)
   - Completed tasks section (history):
     • Header: "已完成 (X)"
     • Background: Green tint (#10B981, opacity 0.05)
   - Failed tasks section (needs attention):
     • Header: "失败 (X)"
     • Background: Red tint (#EF4444, opacity 0.05)

2. Task Card Design:
   - Task name (bold, 14px)
   - Task type icon (16x16px):
     • Code Generation: Code icon
     • Testing: Flask icon
     • Review: CheckCircle icon
     • Deployment: Rocket icon
   - Progress bar (height: 4px, animated)
   - Progress percentage (right aligned, 12px)
   - Estimated time remaining (e.g., "约 5 分钟")
   - Priority badge:
     • High: Red (#EF4444)
     • Medium: Yellow (#F59E0B)
     • Low: Gray (#6B7280)
   - Assigned agent avatar (24x24px, bottom-right)
   - Status chip (top-right):
     • Running: Blue, animated spinner
     • Pending: Gray, clock icon
     • Completed: Green, checkmark
     • Failed: Red, alert icon

3. Queue Controls (Top Bar):
   - Add new task button:
     • Primary style (blue background)
     • Icon: Plus
     • Text: "新建任务"
   - Pause/Resume queue:
     • Toggle button
     • Icon: Pause / Play
   - Clear completed:
     • Ghost button
     • Icon: Trash
     • Text: "清除已完成"
   - Retry failed:
     • Ghost button (red outline if failed tasks exist)
     • Icon: RefreshCw
     • Text: "重试失败"
   - Queue settings:
     • Icon button (gear icon)
     • Modal with settings:
       - Max concurrent tasks (slider, 1-10)
       - Task timeout (input, minutes)
       - Auto-retry failed tasks (toggle)
       - Priority rules (drag-and-drop list)

4. Task Detail Modal (on card click):
   - Full task description
   - Input parameters (collapsible JSON viewer)
   - Execution log (collapsible, real-time updates):
     • Timestamp
     • Log level (INFO/WARN/ERROR)
     • Message
     • Auto-scroll toggle
   - Output preview (if completed):
     • Syntax highlighted
     • Copy button
     • Download button
   - Error details (if failed):
     • Error message (red background)
     • Stack trace (collapsible)
     • Suggested fixes (if available)
   - Actions:
     • Retry (if failed)
     • Cancel (if running/pending)
     • Duplicate (create new task with same params)
     • Export log

5. Timeline View (Optional, toggle button):
   - Gantt-style timeline:
     • Horizontal time axis (hours)
     • Task duration bars (colored by status)
     • Current time indicator (vertical line)
   - Dependencies arrows:
     • Show task dependencies
     • Click arrow to see dependency details
   - Zoom controls:
     • Hour / Day / Week view
     • Zoom in/out buttons

6. Notifications:
   - Task completion toast:
     • Green background
     • Icon: CheckCircle
     • Message: "任务完成: {task name}"
     • Action: "View Results" button
   - Error alert:
     • Red background
     • Icon: AlertCircle
     • Message: "任务失败: {task name}"
     • Action: "View Error" button
   - Queue status changes:
     • "Queue paused"
     • "Queue resumed"
     • "Max concurrent tasks reached"

Style Guidelines:
- Kanban-inspired layout (columns)
- Drag-and-drop support (HTML5 drag API)
- Color-coded priorities (consistent with design system)
- Smooth animations for task transitions (300ms, ease-out)
- Card shadows: 0 2px 8px rgba(0,0,0,0.1)
- Border radius: 8px for cards

Animations:
- Task card entrance: Fade in + slide from right (200ms)
- Status change: Color transition (150ms)
- Progress bar fill: Width transition (500ms, linear)
- Drag ghost: Scale 1.05 + opacity 0.8

Responsive:
- Desktop (1440px): 4 columns (Active/Pending/Completed/Failed)
- Tablet (768px): 2 columns (Active+Pending / Completed+Failed)
- Mobile (375px): Single column with tabs

Accessibility:
- Keyboard navigation (Tab, Arrow keys, Enter)
- Drag-and-drop keyboard alternative (context menu)
- Screen reader announcements for queue updates
- High contrast mode support

Output:
1. Desktop queue view (4 columns)
2. Timeline variant (Gantt chart)
3. Mobile compact view (single column)
4. Task detail modal
5. Queue settings modal
```

---

## 五、全局设置重构提示词

### 5.1 SettingsOrchestrator 主框架

**Prompt: Settings Orchestrator Layout**

```
Design a Settings Orchestrator layout for an AI-powered coding assistant platform.

Context:
- Purpose: Configuration-driven settings page orchestrator
- Architecture: Modular design with dynamic module rendering
- Tech Stack: React + TypeScript + Zustand + Tailwind CSS

Requirements:

1. Layout Structure (Desktop 1440px):
   - Top bar (height: 56px):
     • Left: Back button (arrow icon) + Page title "全局设置"
     • Center: Search input (width: 400px, with icon)
     • Right: Save button (checkmark icon, green when saved)
     • Background: Subtle gradient (dark: #1E293B → #0F172A)
   - Left sidebar (width: 240px):
     • Module navigation list (vertical tabs)
     • Active state: Left border accent + background highlight
     • Hover state: Subtle background change
   - Main content (flexible width):
     • Module title with description
     • Scrollable content area
     • Card-based sections within modules

2. Module Navigation Items:
   - Model (模型配置):
     • Icon: Bot (blue #3B82F6)
     • Label: "模型配置"
     • Description: "管理 AI 模型提供商和参数"
   - Plugin (插件管理):
     • Icon: Puzzle (green #10B981)
     • Label: "插件管理"
     • Description: "管理 IDE 插件和扩展"
   - MCP (MCP 服务器):
     • Icon: Server (purple #8B5CF6)
     • Label: "MCP 服务器"
     • Description: "管理 Model Context Protocol 连接"
   - Agent (智能体配置):
     • Icon: Sparkles (orange #F59E0B)
     • Label: "智能体配置"
     • Description: "配置 AI 智能体行为和能力"

3. Top Bar Design:
   - Back button:
     • Icon: ArrowLeft (20x20px)
     • Style: Ghost button (transparent background)
     • Hover: Background highlight
     • Action: Navigate to previous page
   - Page title:
     • Text: "全局设置"
     • Font: Plus Jakarta Sans, 20px, semibold
     • Color: White (#FFFFFF)
   - Search input:
     • Width: 400px
     • Placeholder: "搜索设置项..."
     • Icon: Search (left, gray)
     • Clear button: X icon (right, appears when text exists)
     • Style: Dark background (#0F172A), border (#334155)
   - Save button:
     • Icon: Check (20x20px)
     • Text: "保存"
     • Style: Primary button (green background #10B981)
     • States:
       - Default: Green background
       - Saving: Spinner animation
       - Saved: Checkmark animation (2s duration)
       - Error: Red background, shake animation

4. Sidebar Design:
   - Module items:
     • Icon (20x20px, left aligned)
     • Label (14px, medium weight)
     • Active indicator: Left border (4px, module color)
     • Background on active: rgba({module-color}, 0.1)
   - Hover state:
     • Background: rgba(255,255,255,0.05)
     • Cursor: pointer
   - Active state:
     • Left border: 4px solid {module-color}
     • Background: rgba({module-color}, 0.1)
     • Label color: {module-color}
   - Scrollable if many modules

5. Main Content Area:
   - Module header:
     • Title: Module name (24px, bold)
     • Description: Module description (14px, gray)
     • Quick actions: Module-specific buttons (e.g., "Add Provider", "Test All")
   - Content sections:
     • Card-based layout (padding: 16px, border-radius: 8px)
     • Section headers (16px, semibold)
     • Form controls (inputs, toggles, sliders)
     • Action buttons (primary, secondary, ghost)

6. Responsive Behavior:
   - Desktop (1440px): Full layout with sidebar
   - Tablet (768px):
     • Sidebar collapses to icons (48px width)
     • Tooltips on hover for module names
   - Mobile (375px):
     • Full-screen modal
     • Tab navigation at top (horizontal scroll)
     • Back button closes modal

Style Guidelines:
- Dark theme primary (Slate 900 #0F172A background)
- Glassmorphism for cards (rgba(255,255,255,0.05) + blur 10px)
- Smooth transitions (200ms, cubic-bezier(0.4, 0, 0.2, 1))
- Consistent with VS Code / Cursor aesthetic
- Font family: Inter (UI text), Plus Jakarta Sans (headings)

Accessibility:
- ARIA labels for all interactive elements
- Keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Screen reader support for module descriptions
- High contrast mode support

Output:
1. Desktop view (1440px) - Full layout
2. Tablet view (768px) - Collapsed sidebar
3. Mobile view (375px) - Tab navigation
4. Module navigation component
5. Search component with results dropdown
```

---

### 5.2 ModelModule 模型配置模块

**Prompt: Model Configuration Module**

```
Design a Model Configuration Module for managing AI model providers and settings.

Context:
- Purpose: Manage AI model providers, API keys, and model parameters
- Integration: Module within SettingsOrchestrator
- Data Source: ModelStoreZustand, LLMService

Requirements:

1. Module Header:
   - Title: "模型配置"
   - Description: "管理 AI 模型提供商、API 密钥和模型参数"
   - Quick actions:
     • Add Provider (primary button, blue)
     • Test All (ghost button)
     • Refresh (icon button)

2. Provider Cards (Expandable):
   Each provider card contains:
   - Provider logo/icon (left, 48x48px):
     • Ollama: Local server icon
     • OpenAI: OpenAI logo
     • Zhipu GLM: GLM logo
     • Tongyi Qwen: Qwen logo
     • DeepSeek: DeepSeek logo
     • Custom: Gear icon
   - Provider name (bold, 16px)
   - Status badge (top-right):
     • Connected: Green badge (#10B981), "已连接"
     • Disconnected: Gray badge (#6B7280), "未连接"
     • Testing: Yellow badge (#F59E0B), "测试中..."
     • Error: Red badge (#EF4444), "连接失败"
   - Model count badge (e.g., "5 models")
   - Expand/collapse chevron (right, 20x20px)
   
   On expand:
   - API Key input:
     • Label: "API 密钥"
     • Type: Password (masked)
     • Show/hide toggle (eye icon)
     • Validation: Required for cloud providers
   - Base URL input:
     • Label: "Base URL"
     • Placeholder: "https://api.example.com"
     • Required for custom providers
   - Model list:
     • Model name with type badge (LLM/Code/Vision)
     • Context window info (e.g., "128K tokens")
     • Max tokens info (e.g., "4K output")
     • Checkbox for active/inactive
     • Drag handle for reordering
   - Test connection button:
     • Style: Secondary button
     • Text: "测试连接"
     • On click: Show loading spinner, then result
   - Latency indicator:
     • Format: "延迟: 234ms"
     • Color: Green (<500ms), Yellow (500-1000ms), Red (>1000ms)

3. Provider Types:
   - Ollama (local, auto-detected):
     • No API key required
     • Base URL: http://localhost:11434
     • Status: Auto-detect on load
   - OpenAI (cloud, API key required):
     • API key input required
     • Base URL: https://api.openai.com (default)
   - Zhipu GLM (cloud, API key required):
     • API key input required
     • Base URL: https://open.bigmodel.cn
   - Tongyi Qwen (cloud, API key required):
     • API key input required
     • Base URL: https://dashscope.aliyuncs.com
   - DeepSeek (cloud, API key required):
     • API key input required
     • Base URL: https://api.deepseek.com
   - Custom (user-defined):
     • API key input optional
     • Base URL required
     • Custom headers support

4. Model Selection:
   - Model list (scrollable, max-height: 300px):
     • Each model item:
       - Checkbox (left)
       - Model name (14px, medium)
       - Type badge (pill, colored):
         • LLM: Blue
         • Code: Green
         • Vision: Purple
       - Context window (gray, 12px)
       - Max tokens (gray, 12px)
       - Info icon (hover to see details)
   - Drag handle for reordering (6 dots icon)
   - Select all / Deselect all buttons

5. Connectivity Status:
   - Green dot + "已连接" (working)
   - Yellow dot + "测试中..." (checking, animated spinner)
   - Red dot + "连接失败" (failed, error message on hover)
   - Gray dot + "未配置" (no API key)

6. Performance Metrics (Optional Panel):
   - Toggle button: "显示性能指标"
   - Metrics:
     • Average latency chart (last 24h, line chart)
     • Success rate percentage (progress bar)
     • Token usage summary (bar chart by model)
     • Cost estimation (if applicable)

Style Guidelines:
- Card-based layout (padding: 16px, border-radius: 8px)
- Status indicators with glow effects
- Form inputs with clear labels (14px, medium)
- Error states with red accents (#EF4444)
- Success states with green accents (#10B981)
- Border: 1px solid rgba(255,255,255,0.1)
- Shadow: 0 2px 8px rgba(0,0,0,0.2)

Animations:
- Card expand/collapse: Height transition (200ms, ease-out)
- Status change: Color transition (150ms)
- Test connection: Spinner rotation (1s, linear infinite)

Responsive:
- Desktop (1440px): Full card layout
- Tablet (768px): Stacked cards
- Mobile (375px): Accordion style (one expanded at a time)

Accessibility:
- Form labels associated with inputs
- Error messages linked to inputs (aria-describedby)
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support for status updates

Output:
1. Expanded view (provider with models)
2. Collapsed view (provider summary)
3. Error state (connection failed)
4. Loading state (testing connection)
5. Performance metrics panel
```

---

### 5.3 PluginModule 插件管理模块

**Prompt: Plugin Management Module**

```
Design a Plugin Management Module for managing IDE plugins and extensions.

Context:
- Purpose: Manage IDE plugins, extensions, and workflows
- Integration: Module within SettingsOrchestrator
- Data Source: PluginSystem, PluginStore

Requirements:

1. Module Header:
   - Title: "插件管理"
   - Description: "管理 IDE 插件和扩展功能"
   - Actions:
     • Install Plugin (primary button, green)
     • Refresh List (icon button)

2. Plugin Cards (Grid Layout):
   Each plugin card contains:
   - Plugin icon (left, 48x48px, rounded corners)
   - Plugin name (bold, 16px)
   - Version badge (pill, gray, e.g., "v2.1.0")
   - Short description (gray, 14px, max 2 lines, truncate with ellipsis)
   - Enable/Disable toggle (right, switch style)
   - Settings gear icon (if configurable, bottom-right)
   - Status indicator (bottom-left):
     • Active: Green dot (#10B981)
     • Inactive: Gray dot (#6B7280)
     • Error: Red dot (#EF4444)

3. Plugin Categories (Filter Tabs):
   - All (default)
   - Code Quality (linters, formatters)
   - AI Tools (assistants, generators)
   - Git Integration (version control)
   - Themes (UI customizations)
   - Productivity (snippets, shortcuts)

4. Plugin Details (Expandable):
   On card click or expand button:
   - Full description (markdown rendered)
   - Author + repository link (clickable)
   - Installation date (gray, 12px)
   - Last updated (gray, 12px)
   - Dependencies list (chips)
   - Configuration options:
     • Form inputs (specific to plugin)
     • Save button
     • Reset to defaults button

5. Plugin Marketplace (Optional):
   - Tab: "Marketplace" (separate from "Installed")
   - Search plugins (search bar at top)
   - Filter by category (dropdown)
   - Plugin cards:
     • Install button (primary, green)
     • Rating (stars, 0-5)
     • Reviews count (e.g., "128 reviews")
     • Downloads count (e.g., "12.5K downloads")
   - Install progress:
     • Progress bar
     • "Installing..." text
     • Cancel button

6. Bulk Actions:
   - Select multiple plugins (checkboxes)
   - Enable All (primary button)
   - Disable All (secondary button)
   - Update All (if updates available)
   - Check for Updates (ghost button)

Style Guidelines:
- Grid layout for plugin cards (3 columns on desktop)
- Toggle switches with smooth animation (200ms)
- Category badges with distinct colors:
  • Code Quality: Blue
  • AI Tools: Green
  • Git Integration: Orange
  • Themes: Purple
  • Productivity: Pink
- Hover effects: Scale 1.02, shadow increase
- Border radius: 8px for cards

Animations:
- Toggle switch: Slide animation (150ms)
- Card hover: Scale + shadow (200ms)
- Install progress: Width transition (linear)

Responsive:
- Desktop (1440px): 3 columns
- Tablet (768px): 2 columns
- Mobile (375px): 1 column (list view)

Accessibility:
- Toggle switches keyboard accessible (Space to toggle)
- Plugin details expandable via keyboard (Enter)
- Screen reader support for plugin status

Output:
1. Grid view (installed plugins)
2. List view (alternative layout)
3. Plugin detail modal
4. Marketplace view
5. Bulk actions bar
```

---

### 5.4 MCPModule MCP服务器模块

**Prompt: MCP Server Management Module**

```
Design an MCP (Model Context Protocol) Server Management Module.

Context:
- Purpose: Manage MCP server connections for extended AI capabilities
- Integration: Module within SettingsOrchestrator
- Data Source: MCPServerConfig, MCPStore

Requirements:

1. Module Header:
   - Title: "MCP 服务器"
   - Description: "管理 Model Context Protocol 服务器连接"
   - Actions:
     • Add Server (primary button, purple)
     • Test All (ghost button)

2. Server Cards:
   Each server card contains:
   - Server icon (left, 40x40px):
     • Filesystem: Folder icon
     • Fetch: Globe icon
     • Git: Git-branch icon
     • Database: Database icon
     • Custom: Server icon
   - Server name (bold, 16px)
   - Status badge (top-right):
     • Online: Green badge (#10B981), "在线"
     • Offline: Gray badge (#6B7280), "离线"
     • Error: Red badge (#EF4444), "错误"
     • Starting: Yellow badge (#F59E0B), "启动中..."
   - Command preview (gray, 12px, monospace, truncated):
     • e.g., "npx -y @modelcontextprotocol/server-filesystem"
   - Enable/Disable toggle (right)
   - Expand for details (chevron icon)

3. Server Configuration (Expanded):
   - Server ID (readonly, gray, 12px)
   - Display name (input, required)
   - Description (textarea, optional)
   - Command (input, monospace font):
     • Label: "启动命令"
     • Placeholder: "npx -y @modelcontextprotocol/server-filesystem"
     • Validation: Required
   - Arguments list (editable):
     • Add argument button
     • Remove argument button (per item)
     • Drag to reorder
   - Environment variables (key-value pairs):
     • Add variable button
     • Key input + Value input (per pair)
     • Remove button (per pair)
   - Working directory (input, folder picker)

4. Server Status Details:
   - Online:
     • Green badge
     • Uptime: "运行时间: 2h 34m"
     • Last heartbeat: "最后心跳: 5s ago"
   - Offline:
     • Gray badge
     • Last seen: "最后在线: 1h ago"
   - Error:
     • Red badge
     • Error message: "Connection refused"
     • Retry button
   - Starting:
     • Yellow badge
     • Spinner animation
     • "正在启动..."

5. Built-in Servers:
   - Filesystem (file read/write):
     • Icon: Folder
     • Command: Pre-filled
     • Args: Path to allow
   - Fetch (HTTP requests):
     • Icon: Globe
     • Command: Pre-filled
     • Args: Allowed domains
   - Git (version control):
     • Icon: Git-branch
     • Command: Pre-filled
     • Args: Repository path
   - Database (query execution):
     • Icon: Database
     • Command: Pre-filled
     • Args: Connection string

6. Custom Servers:
   - Add custom server button:
     • Opens modal with form
     • Command input with validation
     • Test connection before saving
   - Test connection:
     • Button: "测试连接"
     • Loading: Spinner + "测试中..."
     • Success: Green checkmark + "连接成功"
     • Failure: Red X + error message

Style Guidelines:
- Terminal-inspired aesthetic (dark background, monospace font for commands)
- Status badges with glow effects
- Code editor style for command input (syntax highlighting optional)
- Dark theme with subtle borders
- Border radius: 8px for cards

Animations:
- Status change: Color transition (150ms)
- Test connection: Spinner rotation (1s, linear infinite)
- Expand/collapse: Height transition (200ms, ease-out)

Responsive:
- Desktop (1440px): Card grid (2 columns)
- Tablet (768px): Single column
- Mobile (375px): Accordion style

Accessibility:
- Command inputs with monospace font
- Error messages linked to inputs
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support for status updates

Output:
1. Server list view (collapsed cards)
2. Server detail view (expanded)
3. Add server modal
4. Error state (connection failed)
5. Built-in server presets
```

---

### 5.5 AgentModule 智能体配置模块

**Prompt: Agent Configuration Module**

```
Design an Agent Configuration Module for managing AI agents.

Context:
- Purpose: Configure AI agent behavior, capabilities, and parameters
- Integration: Module within SettingsOrchestrator
- Data Source: AgentOrchestrator, AgentStore

Requirements:

1. Module Header:
   - Title: "智能体配置"
   - Description: "配置 AI 智能体行为和能力"
   - Actions:
     • Create Agent (primary button, orange)
     • Import Config (ghost button)

2. Agent Cards:
   Each agent card contains:
   - Agent avatar/icon (left, 48x48px, with role color):
     • Planner: Blue avatar
     • Coder: Green avatar
     • Tester: Orange avatar
     • Reviewer: Purple avatar
   - Agent name (bold, 16px)
   - Role badge (pill, colored by role):
     • Planner: "规划智能体" (blue)
     • Coder: "编码智能体" (green)
     • Tester: "测试智能体" (orange)
     • Reviewer: "评审智能体" (purple)
   - Status indicator (bottom-left):
     • Idle: Gray dot
     • Running: Animated blue dot
     • Error: Red dot
   - Quick actions (right):
     • Edit (pencil icon)
     • Duplicate (copy icon)
     • Delete (trash icon, with confirmation)
   - Expand for configuration (chevron icon)

3. Agent Roles:
   - Planner (规划智能体):
     • Color: Blue (#3B82F6)
     • Icon: Brain icon
     • Description: "负责任务分解、规划和调度"
   - Coder (编码智能体):
     • Color: Green (#10B981)
     • Icon: Code icon
     • Description: "负责代码生成、重构和优化"
   - Tester (测试智能体):
     • Color: Orange (#F59E0B)
     • Icon: Flask icon
     • Description: "负责测试生成、执行和分析"
   - Reviewer (评审智能体):
     • Color: Purple (#8B5CF6)
     • Icon: CheckCircle icon
     • Description: "负责代码审查、质量检查"

4. Agent Configuration (Expanded):
   - Basic Settings:
     • Agent name (input, required)
     • Role selection (dropdown, required)
     • Description (textarea, optional)
   - Model Settings:
     • Model selection (dropdown, from ModelModule)
     • Temperature slider (0.0 - 2.0, default: 0.7):
       - Label: "创造性 (Temperature)"
       - Tooltip: "值越高,输出越随机;值越低,输出越确定"
       - Value preview: "0.7"
     • Max tokens input (number, default: 4096)
   - System Prompt:
     • Multi-line text area (markdown supported)
     • Character limit: 4000
     • Counter: "1234 / 4000"
     • Variables support: {{variable}}
   - Tools/Abilities Checklist:
     • File read/write (checkbox)
     • Code execution (checkbox)
     • Web search (checkbox)
     • Git operations (checkbox)
     • Terminal access (checkbox)
     • Database access (checkbox)
   - Memory Settings:
     • Enable persistent memory (toggle)
     • Memory retention period (dropdown):
       - 1 day
       - 7 days
       - 30 days
       - Forever
     • Max memory items (input, default: 100)

5. Agent Capabilities Matrix:
   - Table view (optional):
     • Rows: Agents
     • Columns: Capabilities
     • Cells: Checkmarks or X marks
   - Filter by capability (dropdown)
   - Sort by name, role, status

6. Agent Metrics (Optional):
   - Performance dashboard:
     • Tasks completed (last 24h, number)
     • Success rate (percentage, progress bar)
     • Average execution time (minutes)
     • Last activity (timestamp)
   - Charts:
     • Tasks over time (line chart)
     • Success rate by agent type (bar chart)

Style Guidelines:
- Role-specific color coding (consistent throughout)
- Avatar with animated status indicator (pulse for running)
- Configuration panels with clear sections (dividers)
- Sliders with value preview (tooltip or inline)
- Checkboxes with descriptions (gray text below)

Animations:
- Status indicator pulse: Scale 1.0 → 1.2 → 1.0 (1s, infinite)
- Slider value update: Fade in (150ms)
- Expand/collapse: Height transition (200ms, ease-out)

Responsive:
- Desktop (1440px): Card grid (2 columns)
- Tablet (768px): Single column
- Mobile (375px): Accordion style

Accessibility:
- Form labels associated with inputs
- Sliders keyboard accessible (Arrow keys)
- Screen reader support for role descriptions
- High contrast mode support

Output:
1. Agent list view (collapsed cards)
2. Agent detail view (expanded)
3. Create agent modal
4. Role selection component
5. Agent metrics dashboard
```

---

### 5.6 SettingsSearchBar 全局搜索

**Prompt: Settings Global Search**

```
Design a Settings Global Search component with intelligent filtering.

Context:
- Purpose: Global search across all settings modules
- Integration: Top bar of SettingsOrchestrator
- Data Source: All modules' metadata and settings

Requirements:

1. Search Input:
   - Width: 400px (desktop), full-width (mobile)
   - Height: 40px
   - Search icon (left, gray, 20x20px)
   - Placeholder: "搜索设置项..."
   - Clear button (right, X icon, appears when text exists)
   - Style:
     • Background: Dark (#0F172A)
     • Border: 1px solid #334155
     • Border radius: 8px
     • Focus: Border color = blue (#3B82F6), box-shadow

2. Search Results Dropdown:
   - Appears below input when typing (debounce 300ms)
   - Max height: 400px (scrollable)
   - Background: Dark (#1E293B)
   - Border: 1px solid #334155
   - Border radius: 8px
   - Shadow: 0 4px 16px rgba(0,0,0,0.3)
   - Grouped by module:
     • Group header: Module name + icon (colored by module)
     • Divider line between groups
   - Each result item:
     • Setting name (highlighted match in yellow)
     • Module badge (pill, colored by module)
     • Setting path (breadcrumbs, gray, 12px)
     • Hover: Background highlight
     • Active (keyboard navigation): Blue border

3. Search Categories:
   - Model settings:
     • API keys, providers, models
     • Example: "OpenAI API Key", "Ollama Base URL"
   - Plugin settings:
     • Enable/disable, configuration
     • Example: "Code Assistant Plugin", "Git Integration"
   - MCP settings:
     • Servers, connections, commands
     • Example: "Filesystem Server", "Database Connection"
   - Agent settings:
     • Prompts, capabilities, parameters
     • Example: "Planner System Prompt", "Coder Temperature"

4. Keyboard Navigation:
   - Up/Down arrows: Navigate results
   - Enter: Select result
   - Escape: Close dropdown
   - Tab: Move focus to next element

5. Recent Searches:
   - Show when input is focused (before typing)
   - Label: "最近搜索"
   - Last 5 searches (clickable)
   - Clear history button (ghost button, right)

6. No Results State:
   - Icon: Search X icon (large, gray)
   - Message: "未找到相关设置"
   - Suggestions:
     • "您是否在找: {similar term 1}?"
     • "您是否在找: {similar term 2}?"
   - Link to help documentation: "查看设置帮助"

7. Search Highlighting:
   - Match text highlighted in yellow (#FBBF24)
   - Case-insensitive matching
   - Partial matches supported
   - Fuzzy search enabled (optional)

Style Guidelines:
- Dropdown with subtle shadow
- Highlighted text in yellow (high contrast)
- Module badges with distinct colors (consistent with design system)
- Smooth open/close animation (200ms, ease-out)
- Border radius: 8px for dropdown

Animations:
- Dropdown open: Fade in + slide down (200ms)
- Result hover: Background transition (150ms)
- Keyboard navigation: Border transition (100ms)

Responsive:
- Desktop (1440px): 400px width
- Tablet (768px): Full-width (calc(100% - 32px))
- Mobile (375px): Full-width, overlay mode

Accessibility:
- ARIA labels for search input and results
- Keyboard navigation fully supported
- Screen reader announcements for results count
- High contrast mode support

Output:
1. Default state (input focused, recent searches)
2. Typing state (results dropdown)
3. No results state
4. Keyboard navigation states
5. Mobile overlay variant
```

---

## 六、设计系统规范

### 6.1 颜色系统

#### 6.1.1 主题色

```css
/* Primary Brand Colors */
--color-brand-primary: #3B82F6;    /* Blue 500 */
--color-brand-secondary: #10B981;  /* Emerald 500 */
--color-brand-accent: #F59E0B;     /* Amber 500 */

/* Agent Role Colors */
--color-agent-planner: #3B82F6;    /* Blue 500 */
--color-agent-coder: #10B981;      /* Emerald 500 */
--color-agent-tester: #F59E0B;     /* Amber 500 */
--color-agent-reviewer: #8B5CF6;   /* Violet 500 */
--color-agent-orchestrator: #FBBF24; /* Amber 400 */

/* Module Colors */
--color-module-model: #3B82F6;     /* Blue 500 */
--color-module-plugin: #10B981;    /* Emerald 500 */
--color-module-mcp: #8B5CF6;       /* Violet 500 */
--color-module-agent: #F59E0B;     /* Amber 500 */
```

#### 6.1.2 状态色

```css
/* Status Colors */
--color-status-idle: #6B7280;      /* Gray 500 */
--color-status-running: #3B82F6;   /* Blue 500 */
--color-status-waiting: #F59E0B;   /* Amber 500 */
--color-status-completed: #10B981; /* Emerald 500 */
--color-status-error: #EF4444;     /* Red 500 */

/* Connectivity Colors */
--color-connected: #10B981;        /* Emerald 500 */
--color-disconnected: #6B7280;     /* Gray 500 */
--color-testing: #F59E0B;          /* Amber 500 */
--color-error: #EF4444;            /* Red 500 */
```

#### 6.1.3 背景色 (Dark Theme)

```css
/* Background Colors (Dark Theme) */
--bg-primary: #0F172A;             /* Slate 900 */
--bg-secondary: #1E293B;           /* Slate 800 */
--bg-tertiary: #334155;            /* Slate 700 */
--bg-surface: rgba(255,255,255,0.05);
--bg-card: rgba(255,255,255,0.05);
--bg-hover: rgba(255,255,255,0.1);
```

#### 6.1.4 文本色

```css
/* Text Colors */
--text-primary: #FFFFFF;
--text-secondary: #CBD5E1;         /* Slate 300 */
--text-tertiary: #94A3B8;          /* Slate 400 */
--text-muted: #64748B;             /* Slate 500 */
--text-accent: #3B82F6;            /* Blue 500 */
```

---

### 6.2 字体系统

#### 6.2.1 字体族

```css
/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'Plus Jakarta Sans', 'Inter', sans-serif;
--font-code: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

#### 6.2.2 字体大小

```css
/* Font Sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;
```

#### 6.2.3 字重

```css
/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### 6.2.4 行高

```css
/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

---

### 6.3 间距系统

#### 6.3.1 基础间距 (4px base)

```css
/* Spacing Scale (4px base) */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

#### 6.3.2 组件间距

```css
/* Component Spacing */
--padding-card: 16px;
--padding-section: 24px;
--padding-page: 32px;
--gap-grid: 16px;
--gap-flex: 8px;
```

---

### 6.4 圆角系统

```css
/* Border Radius */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-2xl: 16px;
--radius-full: 9999px;
```

---

### 6.5 阴影系统

```css
/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
--shadow-md: 0 2px 8px rgba(0,0,0,0.2);
--shadow-lg: 0 4px 16px rgba(0,0,0,0.3);
--shadow-xl: 0 8px 24px rgba(0,0,0,0.4);

/* Glow Effects */
--glow-blue: 0 0 20px rgba(59,130,246,0.5);
--glow-green: 0 0 20px rgba(16,185,129,0.5);
--glow-purple: 0 0 20px rgba(139,92,246,0.5);
--glow-gold: 0 0 30px rgba(251,191,36,0.5);
```

---

### 6.6 动画规范

#### 6.6.1 过渡时长

```css
/* Transition Durations */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

#### 6.6.2 缓动函数

```css
/* Easing Functions */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

#### 6.6.3 常用动画

```css
/* Common Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

---

## 七、实施优先级与路线图

### 7.1 开发优先级矩阵

| 优先级 | 组件类别 | 组件名称 | 开发周期 | 依赖关系 | 风险等级 |
|--------|---------|---------|---------|---------|---------|
| **P0** | 核心架构 | SettingsOrchestrator 主框架 | Week 1-2 | 无 | 低 |
| **P0** | 核心架构 | AgentOrchestrator 智能体编排 | Week 1-2 | 无 | 低 |
| **P0** | UI 组件 | Multi-Agent 状态面板 | Week 2-3 | AgentOrchestrator | 中 |
| **P0** | UI 组件 | 任务流程可视化 | Week 2-3 | WorkflowEventBus | 中 |
| **P0** | 设置模块 | ModelModule 模型配置 | Week 2-3 | SettingsOrchestrator | 低 |
| **P1** | UI 组件 | 智能体协作图 | Week 3-4 | Multi-Agent 面板 | 中 |
| **P1** | UI 组件 | 代码应用预览 | Week 3-4 | CodeApplicator | 低 |
| **P1** | 设置模块 | AgentModule 智能体配置 | Week 3-4 | ModelModule | 低 |
| **P1** | 搜索功能 | SettingsSearchBar 全局搜索 | Week 4 | SettingsOrchestrator | 低 |
| **P2** | 设置模块 | PluginModule 插件管理 | Week 4-5 | PluginSystem | 低 |
| **P2** | 设置模块 | MCPModule MCP服务器 | Week 4-5 | MCPStore | 中 |
| **P2** | UI 组件 | 持久记忆面板 | Week 5 | KnowledgeBase | 中 |
| **P2** | UI 组件 | 任务调度队列 | Week 5 | TaskBoardPanel | 中 |

### 7.2 实施路线图

```
Week 1-2: 核心架构搭建
├─ Claude Opus 4.6
├─ SettingsOrchestrator 主框架设计与实现
├─ AgentOrchestrator 编排器设计
├─ 核心层接口定义 (ISettingsModule, BaseModule)
├─ ModuleRegistry 注册中心实现
└─ 适配器层实现 (ThemeAdapter, StorageAdapter)

Week 2-3: 核心UI组件开发
├─ Claude Opus 4.6 + Claude Sonnet 4.6
├─ Multi-Agent 状态面板
├─ 任务流程可视化
├─ ModelModule 模型配置模块
└─ 响应式布局适配

功能完善与优化
├─ Claude Sonnet 4.6
├─ 智能体协作图
├─ 代码应用预览
├─ AgentModule 智能体配置
├─ SettingsSearchBar 全局搜索
└─ 交互细节优化

Week 4-5: 扩展功能开发
├─ Claude Sonnet 4.6 + Gemini 3 Flash
├─ PluginModule 插件管理
├─ MCPModule MCP服务器
├─ 持久记忆面板
├─ 任务调度队列
└─ 性能优化

Week 5: 创意优化与交付
├─ Gemini 3.1 Pro + Claude Sonnet 4.6
├─ 创意界面探索与优化
├─ 动效规范完善
├─ 无障碍功能增强
├─ 文档完善
└─ 最终交付
```

---

## 八、交付清单

### 8.1 必需交付物

| 组件类别 | 组件名称 | 格式 | 数量 | 优先级 |
|---------|---------|------|------|--------|
| **核心架构** | SettingsOrchestrator 主框架 | Figma Component | 3 (Desktop/Tablet/Mobile) | P0 |
| **核心架构** | AgentOrchestrator 编排器 | Figma Component | 3 (Desktop/Tablet/Mobile) | P0 |
| **UI 组件** | Multi-Agent 状态面板 | Figma Component | 3 (Desktop/Tablet/Mobile) | P0 |
| **UI 组件** | 任务流程可视化 | Figma Component | 3 (Normal/Error/Loading) | P0 |
| **UI 组件** | 智能体协作图 | Figma Component | 3 (Interactive/Static/Compact) | P1 |
| **UI 组件** | 代码应用预览 | Figma Component | 3 (Full/Modal/Mobile) | P1 |
| **UI 组件** | 持久记忆面板 | Figma Component | 3 (Full/Widget/Mobile) | P2 |
| **UI 组件** | 任务调度队列 | Figma Component | 3 (Queue/Timeline/Mobile) | P2 |
| **设置模块** | ModelModule 模型配置 | Figma Component | 4 (Expanded/Collapsed/Error/Loading) | P0 |
| **设置模块** | PluginModule 插件管理 | Figma Component | 3 (Grid/List/Detail) | P2 |
| **设置模块** | MCPModule MCP服务器 | Figma Component | 3 (List/Detail/Add Modal) | P2 |
| **设置模块** | AgentModule 智能体配置 | Figma Component | 3 (List/Detail/Create) | P1 |
| **搜索功能** | SettingsSearchBar 全局搜索 | Figma Component | 4 (Default/Typing/No Results/Mobile) | P1 |

### 8.2 可选交付物

| 组件 | 格式 | 说明 |
|------|------|------|
| 设计系统文档 | Figma Page | 颜色/字体/间距/圆角/阴影规范 |
| 交互原型 | Figma Prototype | 关键流程演示 (Multi-Agent 协作、设置配置) |
| 动效规范 | Lottie/GIF | 动画效果参考 (状态转换、进度更新) |
| 图标库 | Figma Components | 智能体图标、状态图标、模块图标 |
| 组件库 | Figma Library | 可复用的基础组件 (Button, Input, Toggle, Card) |
| 响应式示例 | Figma Frames | 各组件在不同屏幕尺寸下的表现 |

### 8.3 文档交付物

| 文档类型 | 文件名 | 说明 |
|---------|--------|------|
| 设计提示词 | YYC3-提示词-FigmaAI-完整设计指南-20260403.md | 本文档 |
| 架构设计 | 架构设计文档 | 核心架构、数据流、模块关系 |
| 组件规范 | 组件设计规范 | 各组件的详细设计说明 |
| 交互规范 | 交互设计规范 | 交互行为、动画效果、状态管理 |
| 无障碍规范 | 无障碍设计规范 | ARIA 标签、键盘导航、屏幕阅读器支持 |

---

## 九、使用说明

### 9.1 如何使用这些提示词

1. **选择合适的提示词**:
   - 根据设计任务类型选择对应的提示词
   - 参考第二章的大模型选择建议

2. **复制提示词**:
   - 复制完整的 Prompt 内容
   - 包括 Context、Requirements、Style Guidelines 等所有部分

3. **粘贴到 Figma AI**:
   - 在 Figma 的 AI 功能中粘贴提示词
   - 确保选择推荐的大模型 (Claude Opus 4.6 用于复杂设计)

4. **调整参数**:
   - 根据实际需求微调细节
   - 可以添加项目特定的约束条件

5. **生成设计**:
   - 让 Figma AI 生成初步设计
   - 检查是否符合设计系统规范

6. **迭代优化**:
   - 基于生成结果进行人工优化
   - 确保与现有组件的一致性
   - 测试响应式布局和无障碍功能

### 9.2 设计优先级建议

基于 Phase 1 的目标,建议按以下顺序进行设计:

**第一阶段 (Week 1-2): 核心架构**
1. SettingsOrchestrator 主框架 (P0)
2. AgentOrchestrator 编排器 (P0)
3. 核心层接口和适配器 (P0)

**第二阶段 (Week 2-3): 核心UI**
1. Multi-Agent 状态面板 (P0)
2. 任务流程可视化 (P0)
3. ModelModule 模型配置 (P0)

**第三阶段 (Week 3-4): 功能完善**
1. 智能体协作图 (P1)
2. 代码应用预览 (P1)
3. AgentModule 智能体配置 (P1)
4. SettingsSearchBar 全局搜索 (P1)

**第四阶段 (Week 4-5): 扩展功能**
1. PluginModule 插件管理 (P2)
2. MCPModule MCP服务器 (P2)
3. 持久记忆面板 (P2)
4. 任务调度队列 (P2)

### 9.3 大模型使用技巧

#### Claude Opus 4.6 使用建议

**适用场景**:
- 整体架构设计
- 复杂交互逻辑
- Multi-Agent 工作流设计
- 编排器模式实现

**提示词优化**:
- 提供详细的上下文信息
- 明确架构约束和设计模式
- 强调模块化和可扩展性
- 要求输出详细的设计决策说明

**示例提示词结构**:
```
Context: [详细的项目背景和技术栈]
Architecture: [架构模式和设计原则]
Requirements: [详细的功能需求]
Constraints: [技术约束和限制]
Output: [期望的输出格式和详细程度]
```

#### Claude Sonnet 4.6 使用建议

**适用场景**:
- 日常组件设计
- 表单控件设计
- 列表和卡片布局
- 响应式适配

**提示词优化**:
- 聚焦具体的组件功能
- 提供清晰的设计规范
- 强调用户体验和交互细节
- 要求输出多种状态变体

#### Gemini 3.1 Pro 使用建议

**适用场景**:
- 创意界面探索
- 多模态设计
- 视觉效果优化
- 动画和过渡效果

**提示词优化**:
- 鼓励创新和实验性设计
- 提供视觉参考和灵感
- 强调美学和品牌一致性
- 要求输出多种设计方案

#### Gemini 3 Flash 使用建议

**适用场景**:
- 快速原型迭代
- 简单组件生成
- 布局调整
- 样式微调

**提示词优化**:
- 保持简洁明了
- 聚焦单一功能
- 提供明确的尺寸和间距
- 要求快速输出

---

## 十、质量检查清单

### 10.1 设计一致性检查

- [ ] 所有组件使用统一的设计系统规范
- [ ] 颜色、字体、间距符合第六章规范
- [ ] 图标风格一致 (Lucide React 图标库)
- [ ] 圆角、阴影、边框样式统一
- [ ] 动画时长和缓动函数一致

### 10.2 响应式设计检查

- [ ] 所有组件提供 Desktop (1440px) 版本
- [ ] 所有组件提供 Tablet (768px) 版本
- [ ] 所有组件提供 Mobile (375px) 版本
- [ ] 布局在不同屏幕尺寸下合理适配
- [ ] 文本在小屏幕上可读性良好

### 10.3 交互设计检查

- [ ] 所有交互元素有明确的视觉反馈
- [ ] Hover、Active、Disabled 状态完整
- [ ] 动画流畅自然 (200-300ms)
- [ ] 过渡效果符合设计规范
- [ ] 错误状态有清晰的提示

### 10.4 无障碍设计检查

- [ ] 所有交互元素有 ARIA 标签
- [ ] 键盘导航完整支持
- [ ] 屏幕阅读器兼容性良好
- [ ] 颜色对比度符合 WCAG 标准
- [ ] 高对比度模式支持

### 10.5 性能优化检查

- [ ] 组件结构简洁,避免过度嵌套
- [ ] 动画性能优化 (使用 transform 和 opacity)
- [ ] 图片和图标优化
- [ ] 避免不必要的重绘和重排
- [ ] 懒加载和虚拟滚动 (长列表)

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-04-03 | 初始版本,完成 UI/UX 设计提示词 | YanYuCloudCube Team |
| v1.0.0 | 2026-04-03 | 初始版本,完成全局设置重构提示词 | YanYuCloudCube Team |
| v2.0.0 | 2026-04-03 | 合并两份文档,整合架构设计,添加大模型选择建议 | YanYuCloudCube Team |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>