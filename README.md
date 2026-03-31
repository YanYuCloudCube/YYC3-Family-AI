# YYC³ Family AI 智能编程助手

<div align="center">

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

[![YYC³ Version](https://img.shields.io/badge/YYC³-v1.0.0-6366f1?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBvbHlnb24gcG9pbnRzPSIxMiAyIDIyIDguNSAyMiAxNS41IDEyIDIyIDIgMTUuNSAyIDguNSAxMiAyIi8+PC9zdmc+)](https://github.com/YYC-Cube/YYC3-Family-AI/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-3b82f6)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3.x-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.x-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-5.x-f5a623?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZjVhNjIzIj48cGF0aCBkPSJNMTIgMkw0IDd2MTBsOCA1IDgtNSA4LTVWN2wtOC01eiIvPjwvc3ZnPg==)](https://zustand-demo.pmnd.rs/)

[![Tests 2312](https://img.shields.io/badge/Tests-2312-22c55e?logo=vitest&logoColor=white)](https://github.com/YYC-Cube/YYC3-Family-AI/actions)
[![Test Files 85](https://img.shields.io/badge/Test_Files-85-8b5cf6)](https://github.com/YYC-Cube/YYC3-Family-AI/actions)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088ff?logo=githubactions&logoColor=white)](https://github.com/YYC-Cube/YYC3-Family-AI/actions)
[![GitHub Stars](https://img.shields.io/github/stars/YYC-Cube/YYC3-Family-AI?style=social)](https://github.com/YYC-Cube/YYC3-Family-AI/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/YYC-Cube/YYC3-Family-AI?style=social)](https://github.com/YYC-Cube/YYC3-Family-AI/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/YYC-Cube/YYC3-Family-AI)](https://github.com/YYC-Cube/YYC3-Family-AI/issues)

**[🌐 在线体验](https://code.yyccube.xin)** · **[📖 文档中心](docs/00-YYC3-项目总览-目录索引/001-项目总览索引-文档索引手册.md)** · **[🐛 报告问题](https://github.com/YYC-Cube/YYC3-Family-AI/issues)** · **[💡 功能建议](https://github.com/YYC-Cube/YYC3-Family-AI/issues)**

</div>

<div align="center">
  <img src="public/Family-AI-001.png" alt="YYC³ Family AI 智能编程助手" width="800" />
</div>

## 📋 目录

- [项目简介](#项目简介)
- [项目仓库](#项目仓库)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [存储架构设计](#存储架构设计)
- [核心功能](#核心功能)
- [开发指南](#开发指南)
- [文档导航](#文档导航)
- [测试覆盖](#测试覆盖)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 项目简介

YYC³（YanYuCloudCube）Family AI 是一个基于 React/TypeScript 的多联式低码智能编程平台，通过集成六大主流 LLM Provider，提供智能代码生成、实时预览、任务管理等全方位的 AI 辅助编程体验。

**项目愿景**：打造下一代 AI 驱动的智能编程环境，让每一位开发者都能享受 AI 带来的编程效率提升。

**核心理念**：
- **五高**：高可用性、高性能、高安全性、高可扩展性、高可维护性
- **五标**：标准化、规范化、自动化、智能化、可视化
- **五化**：流程化、文档化、工具化、数字化、生态化

**技术架构**：
- 采用**三层混合存储架构**（IndexedDB + localStorage + Zustand）
- 基于**React 18** 和 **TypeScript 5.8** 构建现代化前端
- 集成 **Zustand** 状态管理和 **react-dnd** 拖拽系统
- 支持 **六大 LLM Provider**（Ollama / OpenAI / 智谱 GLM / 通义千问 / DeepSeek / 自定义）
- 提供 **18+ 功能面板**的灵活布局系统
- 实现 **AI 代码生成流水线**和 **TaskBoard AI 任务推理**
- 基于 **Yjs CRDT** 的实时协作编辑
- 完整的 **CI/CD 流水线**（GitHub Actions + 4 级 Workflow）

**适用场景**：
- 快速原型开发
- 代码辅助生成
- 实时协作编程
- 任务管理与追踪
- 插件扩展开发

### 核心特性

| 特性 | 说明 |
|------|------|
| **三栏 IDE 布局** | 左栏 AI 对话 / 中栏文件管理 / 右栏代码编辑，可自由调整 |
| **六大 LLM Provider** | Ollama / OpenAI / 智谱 GLM / 通义千问 / DeepSeek / 自定义 |
| **18+ 功能面板** | react-dnd 拖拽系统，支持合并/拆分/浮动 |
| **AI 代码生成流水线** | Context → SystemPrompt → LLM SSE → CodeApplicator → Diff Preview |
| **TaskBoard AI 任务推理** | 从 AI 响应自动提取候选任务 |
| **实时协作** | 基于 Yjs 的 CRDT 协同编辑 |
| **插件系统** | 可扩展的插件架构 |
| **主题系统** | Navy / Cyberpunk 双主题 + 自定义主题支持 |

## 项目仓库

**GitHub 仓库地址**：https://github.com/YYC-Cube/YYC3-Family-AI.git

**克隆仓库**：
```bash
git clone https://github.com/YYC-Cube/YYC3-Family-AI.git
cd YYC3-Family-AI
```

## 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| UI 框架 | React + TypeScript | 18.3.1 / 5.8.x | 用户界面 |
| 构建工具 | Vite | 6.3.5 | 开发服务器 / 构建 |
| 样式 | Tailwind CSS v4 | 4.1.12 | UI 样式 |
| 状态管理 | Zustand | 5.x | 全局状态管理 |
| 路由 | react-router (Hash mode) | 7.13.0 | 路由导航 |
| 拖拽 | react-dnd + HTML5 Backend | 16.0.1 | 面板拖拽 |
| 编辑器 | Monaco Editor | 4.7.x | 代码编辑 |
| 富文本 | TipTap | 3.20.x | 富文本编辑 |
| 动画 | Motion (Framer Motion) | 12.x | UI 动画 |
| 测试 | Vitest + @testing-library/react | 4.x / 16.x | 单元测试 |
| 协作 | Yjs | 13.6.x | CRDT 协同编辑 |
| 数据库 | IndexedDB (idb) | 8.x | 文件存储 |
| 持久化 | localStorage | - | 配置存储 |
| UI 组件 | Radix UI + MUI | 2.x / 7.3.x | 基础组件 |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 运行测试

```bash
pnpm test
```

## 项目结构

```
src/app/
├── App.tsx                          # 应用入口
├── routes.ts                        # 路由配置（懒加载 + Suspense）
├── components/
│   ├── HomePage.tsx                  # 首页
│   ├── IDEPage.tsx                   # IDE 主页面
│   ├── AIChatPage.tsx                # 全屏 AI 对话
│   ├── SettingsPage.tsx              # 设置页面
│   ├── TemplatesPage.tsx             # 模板市场
│   ├── DocsPage.tsx                  # 文档中心
│   ├── IconAssetsPage.tsx            # 图标资源
│   ├── ProjectCreateWizard.tsx       # 项目创建向导
│   ├── ErrorBoundary.tsx             # 错误边界
│   ├── RouteErrorFallback.tsx        # 路由错误回退
│   ├── ide/                          # IDE 核心模块
│   │   ├── LeftPanel.tsx             # AI 对话面板
│   │   ├── CenterPanel.tsx           # 文件管理面板
│   │   ├── RightPanel.tsx            # 代码编辑面板
│   │   ├── PanelManager.tsx          # 面板管理系统
│   │   ├── FileStore.tsx             # 文件系统 Context Provider
│   │   ├── ModelRegistry.tsx         # 模型注册 Context Provider
│   │   ├── ThemeStore.tsx            # 主题系统 Context Provider
│   │   ├── CustomThemeStore.ts       # 自定义主题管理
│   │   ├── LLMService.ts             # LLM API 调用层
│   │   ├── ProxyService.ts           # 代理服务器服务
│   │   ├── CryptoService.ts          # 加密服务
│   │   ├── CollabService.ts          # 实时协作服务
│   │   ├── ChatHistoryStore.ts       # 聊天历史存储
│   │   ├── SettingsBridge.ts         # 设置桥接器
│   │   │
│   │   ├── adapters/                 # 数据适配器层
│   │   │   ├── IndexedDBAdapter.ts   # IndexedDB 操作封装
│   │   │   └── ...
│   │   │
│   │   ├── ai/                       # AI Pipeline 模块
│   │   │   ├── ContextBuilder.ts     # 上下文构建器
│   │   │   ├── SystemPrompt.ts       # 系统提示词
│   │   │   ├── CodeApplicator.ts     # 代码应用器
│   │   │   ├── DiffPreview.ts        # Diff 预览
│   │   │   ├── SecurityScanner.ts    # 安全扫描器
│   │   │   └── ...
│   │   │
│   │   ├── stores/                   # Zustand 状态管理
│   │   │   ├── index.ts              # Store Hub（统一导出）
│   │   │   ├── useFileStoreZustand.ts      # 文件状态
│   │   │   ├── useModelStoreZustand.ts     # 模型状态
│   │   │   ├── useProxyStoreZustand.ts     # 代理状态
│   │   │   ├── usePreviewStore.ts          # 预览状态
│   │   │   ├── usePanelPinStore.ts         # 面板固定
│   │   │   ├── usePanelTabGroupStore.ts    # 面板分组
│   │   │   ├── useFloatingPanelStore.ts    # 浮动面板
│   │   │   ├── useSettingsStore.ts         # 设置状态
│   │   │   ├── useQuickActionsStore.ts     # 快捷操作
│   │   │   ├── useTaskBoardStore.ts        # 任务看板
│   │   │   ├── usePreviewHistoryStore.ts   # 预览历史
│   │   │   ├── useScrollSyncStore.ts       # 滚动同步
│   │   │   ├── useAIFixStore.ts            # AI 修复
│   │   │   ├── useWindowStore.ts           # 窗口管理
│   │   │   ├── useWorkspaceStore.ts        # 工作空间
│   │   │   ├── useSessionStore.ts          # 会话管理
│   │   │   └── useIPCStore.ts              # IPC 通信
│   │   │
│   │   ├── services/                 # 业务服务层
│   │   │   ├── ErrorReportingService.ts  # 错误上报
│   │   │   ├── SnapshotService.ts        # 快照服务
│   │   │   ├── VersioningService.ts      # 版本控制
│   │   │   ├── CloudSyncService.ts       # 云同步
│   │   │   ├── StorageCleanup.ts      # 存储清理
│   │   │   ├── DataImporter.ts        # 数据导入
│   │   │   ├── DataExporter.ts        # 数据导出
│   │   │   ├── StorageMonitor.ts      # 存储监控
│   │   │   └── ...
│   │   │
│   │   ├── hooks/                     # 自定义 Hooks
│   │   │   ├── useWorkspaceFileSync.ts  # 工作空间同步
│   │   │   ├── useSettingsSync.ts       # 设置同步
│   │   │   ├── useMultiInstanceSync.ts  # 多实例同步
│   │   │   ├── useChatSessionSync.ts    # 聊天会话同步
│   │   │   └── ...
│   │   │
│   │   ├── plugins/                 # 插件系统
│   │   │   ├── FileExplorerPlusPlugin.ts
│   │   │   ├── ThemeSwitcherPlugin.ts
│   │   │   └── ...
│   │   │
│   │   ├── constants/                # 常量定义
│   │   │   ├── storage-keys.ts       # 存储键名统一管理
│   │   │   └── ...
│   │   │
│   │   └── bridge/                  # 桥接层
│   │       └── host.ts              # Figma 桥接
│   │
│   └── settings/                    # 设置页面模块
│       ├── SettingsShared.tsx       # 设置共享组件
│       ├── AgentSection.tsx         # 智能体配置
│       ├── MCPModelSection.tsx      # MCP + 模型配置
│       ├── ConversationContextSection.tsx  # 对话 + 上下文
│       ├── RulesSkillsSection.tsx   # 规则 + 技能
│       └── KeybindingsEditor.tsx    # 快捷键编辑
│
└── ide/                          # IDE 相关类型定义
    └── fileData.ts               # 文件数据类型
```

## 存储架构设计

### 存储层次

YYC3 采用**三层混合存储架构**，根据数据类型和访问模式选择最优存储方案：

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (React Components)           │
├─────────────────────────────────────────────────────────────┤
│              状态管理层 (Zustand + Context)          │
├─────────────────────────────────────────────────────────────┤
│           数据适配层 (IndexedDB + localStorage)        │
├─────────────────────────────────────────────────────────────┤
│              浏览器存储层 (Browser Storage)           │
└─────────────────────────────────────────────────────────────┘
```

### 存储策略

| 存储类型 | 使用场景 | 数据类型 | 持久化 | 访问速度 |
|---------|---------|---------|---------|---------|
| **IndexedDB** | 文件内容、文件树、标签页、Git 状态 | ✅ 是 | 🟡 中 |
| **localStorage** | 配置、设置、主题、面板布局、模型配置 | ✅ 是 | 🟢 快 |
| **Zustand** | 全局状态（文件、模型、代理、预览、面板等） | ✅ 是（通过 persist） | 🟢 快 |

### 存储键名规范

**命名格式：** `yyc3_{module}_{key}`

**示例：**
```typescript
// 主题系统
yyc3-theme
yyc3_custom_themes
yyc3_active_theme_id

// 模型配置
yyc3-provider-api-keys
yyc3-provider-urls
yyc3-custom-providers
yyc3-mcp-servers
yyc3_active_model

// 面板布局
yyc3_panel_layout
yyc3_panel_tab_groups
yyc3_panel_pins

// 代理配置
yyc3_proxy_config

// 项目管理
yyc3_projects
yyc3_project_{projectId}
```

### Zustand Stores

项目使用 Zustand 进行全局状态管理，所有 Store 通过 `stores/index.ts` 统一导出：

| Store | 用途 | 持久化 |
|-------|------|---------|
| `useFileStoreZustand` | 文件内容、标签页、Git 状态 | ✅ |
| `useModelStoreZustand` | 模型配置、连接状态、心跳 | ✅ |
| `useProxyStoreZustand` | 代理服务器配置 | ✅ |
| `usePreviewStore` | 预览模式、设备预设 | ✅ |
| `usePanelPinStore` | 面板固定状态 | ✅ |
| `usePanelTabGroupStore` | 面板分组 | ✅ |
| `useFloatingPanelStore` | 浮动面板配置 | ✅ |
| `useSettingsStore` | 设置（通用、账号、智能体、MCP、模型等） | ✅ |
| `useQuickActionsStore` | 快捷操作历史 | ✅ |
| `useTaskBoardStore` | 任务看板 | ✅ |
| `usePreviewHistoryStore` | 预览历史快照 | ✅ |
| `useScrollSyncStore` | 滚动位置同步 | ✅ |
| `useAIFixStore` | AI 修复建议 | ✅ |
| `useWindowStore` | 窗口状态 | ✅ |
| `useWorkspaceStore` | 工作空间 | ✅ |
| `useSessionStore` | 会话管理 | ✅ |
| `useIPCStore` | IPC 通信 | ✅ |

### Context Providers

部分功能仍使用 React Context Provider（向后兼容）：

| Provider | 用途 | 状态 |
|---------|------|------|
| `FileStoreProvider` | 文件系统 Context（IndexedDB 封装） | 文件内容、文件树、标签页 |
| `ModelRegistryProvider` | 模型注册 Context | 模型列表、连接状态 |
| `ThemeStore` | 主题系统 Context | 当前主题、自定义主题 |
| `DndProvider` | 拖拽系统 Context | HTML5 Backend |
| `WorkflowEventBusProvider` | 工作流事件总线 | 面板间通信 |
| `PanelManagerProvider` | 面板管理 Context | 面板布局、状态 |

### IndexedDB 数据库

**数据库名称：** `YYC3FileDB`

**主要对象存储：**
- `fileContents`: 文件内容（路径 → 内容映射）
- `fileTree`: 文件树结构
- `tabs`: 打开的标签页
- `gitChanges`: Git 变更记录
- `gitLog`: Git 日志
- `snapshots`: 快照数据

**适配器封装：** `IndexedDBAdapter.ts` 提供统一的 CRUD 接口

## 核心功能

### AI 代码生成

完整的 AI 代码生成流水线，支持：
- 上下文收集与压缩
- 智能提示词构建
- 流式 LLM 响应
- 代码块解析与应用
- Diff 预览确认

**Pipeline 流程：**
```
用户输入
  ↓
ContextBuilder（上下文构建）
  ↓
SystemPrompt（系统提示词）
  ↓
LLMService（LLM 调用）
  ↓
CodeApplicator（代码应用）
  ↓
DiffPreview（Diff 预览）
  ↓
用户确认
```

### 面板管理系统

基于 react-dnd 的灵活布局系统：
- 18+ 功能面板
- 拖拽合并/拆分
- 面板固定/锁定
- 浮动窗口支持
- 布局持久化

**面板类型：**
- AI 对话面板
- 文件管理面板
- 代码编辑面板
- 预览面板
- 任务看板
- 快捷操作面板
- 浮动面板

### 任务看板

AI 驱动的任务管理系统：
- 自动任务提取
- 任务状态流转
- 优先级管理
- 子任务支持
- 提醒系统

**看板列：**
- 待处理
- 进行中
- 已完成
- 已归档

### 设置系统

完整的设置页面，包括：
- **通用设置**: 主题、语言、编辑器、快捷键
- **账号信息**: 个人资料、头像、偏好
- **智能体配置**: AI 智能体管理
- **MCP 工具**: MCP Server 配置（添加/编辑/删除/启用/禁用）
- **模型配置**: 模型列表、服务商配置、Ollama 本地模型
- **智能诊断**: 连通性测试、延迟监控、诊断建议
- **代理配置**: 代理服务器配置、健康检查
- **上下文设置**: 上下文管理、标签页设置
- **对话流设置**: 对话流配置、历史记录
- **规则技能**: 规则配置、技能管理
- **导入导出**: 配置导入/导出、数据管理

## 开发指南

### 代码规范

所有代码文件必须包含完整的文件头注释：

```typescript
/**
 * @file {filename}
 * @description {description}
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v{x.y.z}
 * @created {YYYY-MM-DD}
 * @updated {YYYY-MM-DD}
 * @status {dev|stable}
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags {comma,separated,tags}
 */
```

### 可用命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build           # 构建生产版本
pnpm typecheck       # TypeScript 类型检查
pnpm lint            # 代码检查
pnpm format          # 代码格式化

# 测试
pnpm test            # 运行测试
pnpm test:watch      # 监听模式测试
pnpm test:coverage   # 生成覆盖率报告
pnpm test:e2e        # E2E 测试
```

### 架构约束

### Provider 嵌套顺序

```tsx
<DndProvider backend={HTML5Backend}>
  <WorkflowEventBusProvider>
    <FileStoreProvider>
      <ModelRegistryProvider>
        <PanelManagerProvider>
          {/* IDE 内容 */}
        </PanelManagerProvider>
      </ModelRegistryProvider>
    </FileStoreProvider>
  </WorkflowEventBusProvider>
</DndProvider>
```

### 路由约束

- **必须使用** `react-router`，**禁止** `react-router-dom`
- **必须使用** `createHashRouter`（Figma iframe 环境兼容性）
- **懒加载组件必须用 `Suspense` 包裹**

### 模型配置

- **禁止硬编码模型名称** — 所有模型通过 `ModelRegistry` 动态注册
- Provider 配置声明在 `LLMService.ts` 的 `PROVIDER_CONFIGS`

### 存储规范

- **localStorage 键名**必须使用 `yyc3_` 前缀
- **使用 `constants/storage-keys.ts` 统一管理所有键名**
- **使用 `loadJSON` / `saveJSON` 辅助函数进行安全读写**
- **Zustand Store**必须使用 persist 中间件进行自动持久化

### 状态管理规范

- **新功能优先使用 Zustand** Store
- **旧功能保持 Context Provider**（向后兼容）
- **所有 Store 通过 `stores/index.ts` 统一导出**
- **使用 Immer 支持直接 mutation 写法**

## 📚 文档导航

### 项目文档索引

完整的文档索引和导航，请访问：**[项目文档索引](docs/00-YYC3-项目总览-目录索引/001-项目总览索引-文档索引手册.md)**

### 核心文档

| 文档类型 | 文档名称 | 说明 |
|---------|---------|------|
| **项目总览** | [项目实施方案v2.0](docs/00-YYC3-项目总览-目录索引/YYC3-项目总览-实施方案v2.md) | 12个月完整实施方案 |
| **团队规范** | [代码标头规范](docs/01-YYC3-团队规范-标准规范/YYC3-团队规范-代码标头.md) | 代码文件标头规范 |
| **团队规范** | [文档格式规范](docs/01-YYC3-团队规范-标准规范/YYC3-团队规范-文档格式.md) | 文档编写格式规范 |
| **团队规范** | [文档命名规范](docs/01-YYC3-团队规范-标准规范/YYC3-团队文档-命名规范.md) | 文档命名规范标准 |
| **开发指南** | [本地开发衔接](docs/02-YYC3-开发指南-实施阶段/YYC3-开发指南-本地开发衔接.md) | 本地开发环境衔接指南 |
| **合规文档** | [贡献指南](docs/07-YYC3-项目合规-安全保障/CONTRIBUTING.md) | 如何为项目贡献代码 |
| **合规文档** | [行为准则](docs/07-YYC3-项目合规-安全保障/CODE_OF_CONDUCT.md) | 贡献者行为准则 |
| **合规文档** | [安全政策](docs/07-YYC3-项目合规-安全保障/SECURITY.md) | 安全漏洞报告流程 |
| **标准文档** | [环境变量配置](docs/10-YYC3-项目模版-标准规范/ENVIRONMENT.md) | 环境变量配置文档 |
| **项目分析** | [项目深度分析报告](docs/08-YYC3-项目整合-实施阶段/项目分析报告/YYC3-项目深度分析报告-v2.md) | 项目技术架构分析 |
| **项目总结** | [项目交付清单](docs/08-YYC3-项目整合-实施阶段/项目总结报告/YYC3-项目报告-交付清单.md) | 项目交付物清单 |

### 快速导航

- **🚀 快速开始**: 查看 [本地开发衔接](docs/02-YYC3-开发指南-实施阶段/YYC3-开发指南-本地开发衔接.md)
- **📖 了解规范**: 查看 [团队规范文档](docs/01-YYC3-团队规范-标准规范/)
- **🤝 贡献代码**: 查看 [贡献指南](docs/07-YYC3-项目合规-安全保障/CONTRIBUTING.md)
- **🔒 安全问题**: 查看 [安全政策](docs/07-YYC3-项目合规-安全保障/SECURITY.md)
- **📊 项目分析**: 查看 [项目深度分析报告](docs/08-YYC3-项目整合-实施阶段/项目分析报告/YYC3-项目深度分析报告-v2.md)
- **📋 实施计划**: 查看 [项目实施方案v2.0](docs/00-YYC3-项目总览-目录索引/YYC3-项目总览-实施方案v2.md)

### 旧版文档

- [开发指南(旧版)](docs/README-Development-Guide.md) - 详细的开发环境配置和架构说明
- [团队规范(旧版)](guidelines/YYC3.md) - YYC3 团队开发规范
- [代码标头规范(旧版)](guidelines/YYC3-Code-header.md) - 文件头注释标准
- [设计指南(旧版)](guidelines/Guidelines.md) - Figma AI 编码指南

## 测试覆盖

| 指标 | 数值 |
|------|------|
| **测试文件** | 85 个 |
| **测试用例** | 2,312 个 |
| **通过** | 2,179 个 |
| **通过率** | 94.3% |

## 贡献指南

我们欢迎并感谢所有形式的贡献！请遵循以下步骤：

1. **Fork** 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 安装依赖 (`pnpm install`)
4. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
5. 推送到分支 (`git push origin feature/AmazingFeature`)
6. 开启 **Pull Request**

详细的贡献规范请参阅 [CONTRIBUTING.md](docs/07-YYC3-项目合规-安全保障/CONTRIBUTING.md)。

## 许可证

本项目采用 [MIT 许可证](https://opensource.org/licenses/MIT) - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- **团队**: YanYuCloudCube Team
- **邮箱**: admin@0379.email
- **GitHub**: [YYC-Cube](https://github.com/YYC-Cube)
- **在线体验**: [https://code.yyccube.xin](https://code.yyccube.xin)

---

**项目版本**: v1.0.0  
**最后更新**: 2026-04-01  
**维护团队**: YanYuCloudCube Team  
**文档状态**: ✅ 已完善  
**在线地址**: [https://code.yyccube.xin](https://code.yyccube.xin)

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

<br />

**Built with ❤️ by [YanYuCloudCube Team](https://github.com/YYC-Cube)**

</div>

</div>
