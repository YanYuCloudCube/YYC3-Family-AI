---
file: YYC3-提示词-FigmaAI-全局设置页面重构-20260403.md
description: YYC³ Family AI 全局设置页面重构 Figma AI 设计提示词
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-03
updated: 2026-04-03
status: stable
tags: [prompt],[figma],[settings],[refactor],[modular]
category: design
language: zh-CN
audience: designers,developers
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ Family AI - 全局设置页面重构 Figma AI 设计提示词

## 一、交付产物说明

### 1.1 设计目标

基于现有 ModelSettings.tsx 进行**模块化重构**，采用 **SettingsOrchestrator 编排器模式**，实现：

| 目标 | 说明 |
|------|------|
| **模块化架构** | 设置页面拆分为独立模块（Plugin/MCP/Model/Agent） |
| **动态编排** | SettingsOrchestrator 根据配置动态渲染模块 |
| **统一体验** | 所有模块遵循统一的设计规范和交互模式 |
| **智能搜索** | 全局搜索支持跨模块查找设置项 |
| **状态持久化** | 设置变更自动保存，支持撤销/重做 |

### 1.2 交付产物清单

| 产物 | 类型 | 说明 |
|------|------|------|
| **SettingsOrchestrator 主框架** | 新增组件 | 配置驱动的设置页面编排器 |
| **ModuleCard 模块卡片** | 新增组件 | 统一的模块展示卡片 |
| **SettingsSearchBar 搜索栏** | 新增组件 | 全局设置搜索组件 |
| **ModelModule 模型模块** | 重构组件 | 基于 ModelSettings.tsx 重构 |
| **PluginModule 插件模块** | 新增组件 | 插件管理模块 |
| **MCPModule MCP模块** | 新增组件 | MCP 服务器管理模块 |
| **AgentModule 智能体模块** | 新增组件 | 智能体配置模块 |

### 1.3 集成方式

```
现有 ModelSettings.tsx
        │
        ▼ 重构为
┌─────────────────────────────────────────────────────────────────┐
│                    SettingsOrchestrator                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  TopBar: 搜索 + 保存 + 返回                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌────────────┐ ┌────────────────────────────────────────────┐  │
│  │  Sidebar   │ │              Main Content                  │  │
│  │  ┌──────┐  │ │  ┌──────────────────────────────────────┐  │  │
│  │  │Model │  │ │  │  ModulePanel (动态渲染)               │  │  │
│  │  ├──────┤  │ │  │  • ModelModule (模型配置)             │  │  │
│  │  │Plugin│  │ │  │  • PluginModule (插件管理)            │  │  │
│  │  ├──────┤  │ │  │  • MCPModule (MCP服务器)              │  │  │
│  │  │MCP   │  │ │  │  • AgentModule (智能体配置)           │  │  │
│  │  ├──────┤  │ │  └──────────────────────────────────────┘  │  │
│  │  │Agent │  │ │                                            │  │
│  │  └──────┘  │ │                                            │  │
│  └────────────┘ └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、Figma AI 设计提示词

### 2.1 SettingsOrchestrator 主框架

**Prompt 1: Settings Orchestrator Layout**

```
Design a Settings Orchestrator layout for an AI-powered coding assistant platform.

Requirements:
1. Layout Structure:
   - Top bar: Search input, Save button, Back button
   - Left sidebar: Module navigation list (vertical tabs)
   - Main content: Dynamic module panel

2. Top Bar Design:
   - Height: 56px
   - Left: Back button (arrow icon) + Page title "全局设置"
   - Center: Search input with icon (width: 400px)
   - Right: Save button with checkmark icon
   - Background: Subtle gradient (dark theme: #1E293B → #0F172A)

3. Sidebar Design:
   - Width: 240px
   - Module items with icon + label
   - Active state: Left border accent + background highlight
   - Hover state: Subtle background change
   - Module icons:
     • Model: Bot icon (blue)
     • Plugin: Puzzle icon (green)
     • MCP: Server icon (purple)
     • Agent: Sparkles icon (orange)

4. Main Content Area:
   - Flexible width (fills remaining space)
   - Module title with description
   - Scrollable content area
   - Card-based sections within modules

5. Responsive Behavior:
   - Sidebar collapses to icons on tablet (< 1024px)
   - Full-screen modal on mobile (< 768px)

Style:
- Dark theme primary (Slate 900 background)
- Glassmorphism for cards
- Smooth transitions (200ms)
- Consistent with VS Code / Cursor aesthetic

Output: Desktop view (1440px), Tablet view (768px), Mobile view (375px)
```

---

### 2.2 ModelModule 模型配置模块

**Prompt 2: Model Configuration Module**

```
Design a Model Configuration Module for managing AI model providers and settings.

Requirements:
1. Module Header:
   - Title: "模型配置"
   - Description: "管理 AI 模型提供商、API 密钥和模型参数"
   - Quick actions: Add Provider, Test All, Refresh

2. Provider Cards (expandable):
   Each provider card contains:
   - Provider logo/icon (left)
   - Provider name + status badge (connected/disconnected)
   - Model count badge
   - Expand/collapse chevron (right)
   - On expand:
     • API Key input (masked with show/hide toggle)
     • Base URL input (for custom providers)
     • Model list with checkboxes
     • Test connection button
     • Latency indicator

3. Provider Types:
   - Ollama (local, auto-detected)
   - OpenAI (cloud, API key required)
   - Zhipu GLM (cloud, API key required)
   - Tongyi Qwen (cloud, API key required)
   - DeepSeek (cloud, API key required)
   - Custom (user-defined)

4. Model Selection:
   - Model name with type badge (LLM/Code/Vision)
   - Context window info
   - Max tokens info
   - Checkbox for active/inactive
   - Drag handle for reordering

5. Connectivity Status:
   - Green dot + "Connected" (working)
   - Yellow dot + "Testing..." (checking)
   - Red dot + "Error" (failed)
   - Gray dot + "Not configured" (no API key)

6. Performance Metrics (optional panel):
   - Average latency chart (last 24h)
   - Success rate percentage
   - Token usage summary

Style:
- Card-based layout with subtle shadows
- Status indicators with glow effects
- Form inputs with clear labels
- Error states with red accents
- Success states with green accents

Output: Expanded view, Collapsed view, Error state, Loading state
```

---

### 2.3 PluginModule 插件管理模块

**Prompt 3: Plugin Management Module**

```
Design a Plugin Management Module for managing IDE plugins and extensions.

Requirements:
1. Module Header:
   - Title: "插件管理"
   - Description: "管理 IDE 插件和扩展功能"
   - Actions: Install Plugin, Refresh List

2. Plugin Cards:
   Each plugin card contains:
   - Plugin icon (left, 48x48px)
   - Plugin name + version badge
   - Short description (max 2 lines)
   - Enable/Disable toggle (right)
   - Settings gear icon (if configurable)
   - Status indicator (active/inactive/error)

3. Plugin Categories:
   - Code Quality (linters, formatters)
   - AI Tools (assistants, generators)
   - Git Integration (version control)
   - Themes (UI customizations)
   - Productivity (snippets, shortcuts)

4. Plugin Details (expandable):
   - Full description
   - Author + repository link
   - Installation date
   - Last updated
   - Dependencies list
   - Configuration options

5. Plugin Marketplace (optional):
   - Search plugins
   - Filter by category
   - Install button
   - Rating + reviews

6. Bulk Actions:
   - Enable All
   - Disable All
   - Update All
   - Check for Updates

Style:
- Grid layout for plugin cards (3 columns on desktop)
- Toggle switches with smooth animation
- Category badges with distinct colors
- Hover effects for interactive elements

Output: Grid view, List view, Plugin detail modal, Marketplace view
```

---

### 2.4 MCPModule MCP服务器模块

**Prompt 4: MCP Server Management Module**

```
Design an MCP (Model Context Protocol) Server Management Module.

Requirements:
1. Module Header:
   - Title: "MCP 服务器"
   - Description: "管理 Model Context Protocol 服务器连接"
   - Actions: Add Server, Test All

2. Server Cards:
   Each server card contains:
   - Server icon (left)
   - Server name + status badge
   - Command preview (truncated)
   - Enable/Disable toggle (right)
   - Expand for details

3. Server Configuration (expanded):
   - Server ID (readonly)
   - Display name
   - Description
   - Command (e.g., "npx -y @modelcontextprotocol/server-filesystem")
   - Arguments list (editable)
   - Environment variables (key-value pairs)
   - Working directory

4. Server Status:
   - Online: Green badge + uptime
   - Offline: Gray badge + last seen
   - Error: Red badge + error message
   - Starting: Yellow badge + spinner

5. Built-in Servers:
   - Filesystem (file read/write)
   - Fetch (HTTP requests)
   - Git (version control)
   - Database (query execution)

6. Custom Servers:
   - Add custom server button
   - Command input with validation
   - Test connection before saving

Style:
- Terminal-inspired aesthetic (monospace font for commands)
- Status badges with glow effects
- Code editor style for command input
- Dark theme with syntax highlighting

Output: Server list view, Server detail view, Add server modal, Error state
```

---

### 2.5 AgentModule 智能体配置模块

**Prompt 5: Agent Configuration Module**

```
Design an Agent Configuration Module for managing AI agents.

Requirements:
1. Module Header:
   - Title: "智能体配置"
   - Description: "配置 AI 智能体行为和能力"
   - Actions: Create Agent, Import Config

2. Agent Cards:
   Each agent card contains:
   - Agent avatar/icon (with role color)
   - Agent name + role badge
   - Status indicator (idle/running/error)
   - Quick actions: Edit, Duplicate, Delete
   - Expand for configuration

3. Agent Roles:
   - Planner (规划智能体) - Blue
   - Coder (编码智能体) - Green
   - Tester (测试智能体) - Orange
   - Reviewer (评审智能体) - Purple

4. Agent Configuration (expanded):
   - Agent name
   - Role selection (dropdown)
   - System prompt (multi-line text area)
   - Model selection (dropdown)
   - Temperature slider (0.0 - 2.0)
   - Max tokens input
   - Tools/abilities checklist
   - Memory settings

5. Agent Capabilities:
   - File read/write
   - Code execution
   - Web search
   - Git operations
   - Terminal access

6. Agent Metrics (optional):
   - Tasks completed
   - Success rate
   - Average execution time
   - Last activity

Style:
- Role-specific color coding
- Avatar with animated status indicator
- Configuration panels with clear sections
- Sliders with value preview
- Checkboxes with descriptions

Output: Agent list view, Agent detail view, Create agent modal, Role selection
```

---

### 2.6 SettingsSearchBar 全局搜索

**Prompt 6: Settings Global Search**

```
Design a Settings Global Search component with intelligent filtering.

Requirements:
1. Search Input:
   - Width: 400px (desktop), full-width (mobile)
   - Search icon (left)
   - Clear button (right, when text exists)
   - Placeholder: "搜索设置项..."

2. Search Results Dropdown:
   - Appears below input when typing
   - Grouped by module (Model, Plugin, MCP, Agent)
   - Each result shows:
     • Setting name (highlighted match)
     • Module badge
     • Setting path (breadcrumbs)
   - Keyboard navigation (up/down arrows)
   - Enter to select

3. Search Categories:
   - Model settings (API keys, providers, models)
   - Plugin settings (enable/disable, configuration)
   - MCP settings (servers, connections)
   - Agent settings (prompts, capabilities)

4. Recent Searches:
   - Show last 5 searches when input is focused
   - Clear history option

5. No Results State:
   - Friendly message
   - Suggestions for similar terms
   - Link to help documentation

Style:
- Dropdown with subtle shadow
- Highlighted text in yellow
- Module badges with distinct colors
- Smooth open/close animation

Output: Default state, Typing state, Results state, No results state
```

---

## 三、设计系统规范补充

### 3.1 模块颜色编码

```
Module Colors:
- Model Module: #3B82F6 (Blue 500)
- Plugin Module: #10B981 (Emerald 500)
- MCP Module: #8B5CF6 (Violet 500)
- Agent Module: #F59E0B (Amber 500)

Status Colors:
- Active/Online: #10B981 (Emerald 500)
- Inactive/Offline: #6B7280 (Gray 500)
- Error: #EF4444 (Red 500)
- Warning: #F59E0B (Amber 500)
- Loading: #3B82F6 (Blue 500)
```

### 3.2 模块卡片规范

```
Card Structure:
- Padding: 16px
- Border radius: 8px
- Background: rgba(255, 255, 255, 0.05)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Shadow: 0 2px 8px rgba(0, 0, 0, 0.2)

Card States:
- Default: No border accent
- Hover: Subtle glow + border highlight
- Active: Left border accent (module color)
- Error: Red border + error icon
```

### 3.3 表单控件规范

```
Input Fields:
- Height: 40px
- Border radius: 6px
- Background: rgba(0, 0, 0, 0.3)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Focus: Border color = module color

Toggle Switches:
- Width: 44px, Height: 24px
- Active: Module color
- Inactive: Gray 600
- Transition: 200ms ease

Sliders:
- Track height: 4px
- Thumb size: 16px
- Active track: Module color
- Inactive track: Gray 700
```

---

## 四、实施优先级

| 优先级 | 组件 | 说明 |
|--------|------|------|
| **P0** | SettingsOrchestrator 主框架 | 核心编排器，其他模块依赖 |
| **P0** | ModelModule 模型配置 | 现有功能重构，用户最常用 |
| **P1** | SettingsSearchBar 全局搜索 | 提升用户体验 |
| **P1** | AgentModule 智能体配置 | Phase 1 核心功能 |
| **P2** | PluginModule 插件管理 | 扩展功能 |
| **P2** | MCPModule MCP服务器 | 高级功能 |

---

## 五、与现有代码的对应关系

| Figma 组件 | 现有代码文件 | 重构方式 |
|------------|--------------|----------|
| SettingsOrchestrator | 新增 | `ModelManagement/modules/orchestrator/SettingsOrchestrator.tsx` |
| ModelModule | `ModelSettings.tsx` | 拆分重构为模块 |
| PluginModule | 新增 | 基于 PluginSystem.ts 扩展 |
| MCPModule | 新增 | 基于 MCPServerConfig 扩展 |
| AgentModule | 新增 | 基于 AgentOrchestrator.tsx 扩展 |

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-04-03 | 初始版本，完成全局设置页面重构提示词 | YanYuCloudCube Team |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
