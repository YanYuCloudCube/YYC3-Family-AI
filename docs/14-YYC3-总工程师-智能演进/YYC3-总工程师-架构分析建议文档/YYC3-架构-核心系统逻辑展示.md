---
file: YYC3-架构-核心系统逻辑展示.md
description: YYC³ Family AI 核心系统架构逻辑全景展示文档，含准确注释与模块关系说明
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-02
updated: 2026-04-02
status: stable
tags: [architecture],[system-design],[core-logic],[module-map]
category: technical
language: zh-CN
audience: developers,architects
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ Family AI 核心系统架构逻辑展示

## 一、项目概览

### 1.1 项目定位

**YYC³ Family AI** 是一款基于 AI 驱动的智能编程助手平台，采用现代化前端架构，提供高性能、高可扩展性的代码生成、智能对话、实时预览等核心能力。

### 1.2 技术栈总览

| 技术领域 | 技术选型 | 版本 | 用途说明 |
|----------|----------|------|----------|
| **框架核心** | React | 18.3.1 | UI 组件化框架 |
| | TypeScript | 5.8.3 | 类型安全开发 |
| | Vite | 6.3.5 | 构建工具与开发服务器 |
| **状态管理** | Zustand | 5.0.11 | 轻量级状态管理 |
| | Immer | 11.1.4 | 不可变数据处理 |
| **UI 组件** | Radix UI | 多版本 | 无障碍组件原语 |
| | MUI | 7.3.5 | Material Design 组件 |
| | Tailwind CSS | 4.1.12 | 原子化 CSS 框架 |
| | Lucide React | 0.487.0 | 图标库 |
| **代码编辑** | Monaco Editor | 4.7.0 | VS Code 编辑器内核 |
| | TipTap | 3.21.0 | 富文本编辑器 |
| | Sandpack | 2.20.0 | 在线代码运行环境 |
| **数据存储** | IndexedDB (idb) | 8.0.3 | 浏览器端大容量存储 |
| | localStorage | 原生 | 轻量配置持久化 |
| **测试框架** | Vitest | 4.1.0 | 单元测试 |
| | Playwright | E2E | 端到端测试 |
| **监控告警** | Sentry | 10.45.0 | 错误追踪与性能监控 |

### 1.3 端口配置

```
项目端口: 3126 (固定端口，strictPort: true)
范围归属: 3100-3199 辅助工具端口段
配置文件: vite.config.ts → server.port
```

---

## 二、系统架构全景图

### 2.1 四层架构模型

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         YYC³ Family AI 系统架构                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    🎨 表现层 (Presentation Layer)                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   页面路由   │ │  面板系统   │ │  主题系统   │ │  编辑器系统  │   │   │
│  │  │  routes.ts  │ │PanelManager │ │ThemeStore   │ │MonacoWrapper│   │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │   │
│  └─────────┼───────────────┼───────────────┼───────────────┼───────────┘   │
│            │               │               │               │               │
│  ┌─────────┼───────────────┼───────────────┼───────────────┼───────────┐   │
│  │         │          🧠 业务逻辑层 (Business Logic Layer)  │           │   │
│  │  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐   │   │
│  │  │ AI Pipeline │ │PreviewMode  │ │ Snapshot    │ │ CodeValidator│   │   │
│  │  │ 流水线引擎  │ │Controller   │ │ Manager     │ │ 代码验证器   │   │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │   │
│  │         │               │               │               │           │   │
│  │  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐   │   │
│  │  │ContextColl- │ │SystemPrompt │ │ TaskInfer   │ │ ErrorAnalyzer│   │   │
│  │  │ector 上下文 │ │Builder 提示 │ │Engine 任务  │ │ 错误分析器   │   │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │   │
│  └─────────┼───────────────┼───────────────┼───────────────┼───────────┘   │
│            │               │               │               │               │
│  ┌─────────┼───────────────┼───────────────┼───────────────┼───────────┐   │
│  │         │          🔌 服务层 (Service Layer)            │           │   │
│  │  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐   │   │
│  │  │ LLMService  │ │ MCPClient   │ │ ProxyService│ │ SentryService│   │   │
│  │  │ LLM 调用层  │ │ MCP 协议    │ │ API 代理    │ │ 错误上报    │   │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │   │
│  │         │               │               │               │           │   │
│  │  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐   │   │
│  │  │ CloudSync   │ │ DataExport  │ │ StorageMon  │ │ Versioning  │   │   │
│  │  │ 云同步服务  │ │ 数据导出    │ │ 存储监控    │ │ 版本管理    │   │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │   │
│  └─────────┼───────────────┼───────────────┼───────────────┼───────────┘   │
│            │               │               │               │               │
│  ┌─────────┼───────────────┼───────────────┼───────────────┼───────────┐   │
│  │         │          💾 数据层 (Data Layer)               │           │   │
│  │  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐   │   │
│  │  │ IndexedDB   │ │ localStorage│ │ Zustand     │ │ SessionStore│   │   │
│  │  │ 文件持久化  │ │ 配置存储    │ │ 状态管理    │ │ 会话缓存    │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 架构层级职责说明

| 层级 | 职责范围 | 核心模块 | 设计原则 |
|------|----------|----------|----------|
| **表现层** | 用户交互、界面渲染、路由导航 | 路由系统、面板系统、主题系统、编辑器 | 组件化、响应式、无障碍 |
| **业务逻辑层** | 核心功能实现、数据处理、AI 流水线 | AI Pipeline、预览控制、快照管理、代码验证 | 单一职责、高内聚低耦合 |
| **服务层** | 外部服务集成、API 调用、协议处理 | LLM 服务、MCP 客户端、代理服务、监控上报 | 接口抽象、错误隔离 |
| **数据层** | 数据持久化、状态管理、缓存策略 | IndexedDB、localStorage、Zustand | 离线优先、数据一致性 |

---

## 三、核心模块架构详解

### 3.1 AI Pipeline 流水线引擎

**文件位置**: `src/app/components/ide/ai/AIPipeline.ts`

**架构图**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI Pipeline 流水线引擎                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Stage 1: 上下文收集 (ContextCollector)                           │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │   │
│  │  │ 文件内容收集  │ │ 活跃文件检测  │ │ Git 状态获取  │             │   │
│  │  │ fileContents │ │ activeFile   │ │ gitChanges   │             │   │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘             │   │
│  └─────────┼────────────────┼────────────────┼───────────────────────┘   │
│            │                │                │                           │
│            ▼                ▼                ▼                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Stage 2: 意图识别与提示词构建 (SystemPromptBuilder)              │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │   │
│  │  │ 意图分类      │ │ 上下文压缩    │ │ 消息构建      │             │   │
│  │  │ detectIntent │ │ compressCtx  │ │ buildMessages│             │   │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘             │   │
│  │         │                │                │                       │   │
│  │  意图类型: codegen | refactor | debug | explain | chat           │   │
│  └─────────┼────────────────┼────────────────┼───────────────────────┘   │
│            │                │                │                           │
│            ▼                ▼                ▼                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Stage 3: LLM 流式调用 (LLMService)                               │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │   │
│  │  │ Provider选择 │ │ SSE 流式响应  │ │ Token 回调   │             │   │
│  │  │ ProviderConfig│ chatCompletion│ │ onToken      │             │   │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘             │   │
│  │         │                │                │                       │   │
│  │  支持提供商: Ollama | OpenAI | 智谱GLM | 通义千问 | DeepSeek      │   │
│  └─────────┼────────────────┼────────────────┼───────────────────────┘   │
│            │                │                │                           │
│            ▼                ▼                ▼                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Stage 4: 代码解析与应用 (CodeApplicator)                         │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │   │
│  │  │ 代码块解析    │ │ Diff 生成    │ │ 文件应用      │             │   │
│  │  │ parseBlocks  │ │ generateDiff │ │ applyToFiles │             │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**核心接口定义**:

```typescript
// 流水线输入参数
interface PipelineInput {
  userMessage: string;                    // 用户输入消息
  conversationHistory: ChatMessage[];     // 对话历史
  fileContents: Record<string, string>;   // 文件系统内容
  activeFile: string;                     // 当前活跃文件
  openTabs: TabInfo[];                    // 打开的标签页
  gitBranch: string;                      // Git 分支
  gitChanges: GitChange[];                // Git 变更
  provider: ProviderConfig;               // LLM 提供商配置
  modelId: string;                        // 模型 ID
  customInstructions?: string;            // 自定义指令
}

// 流式回调接口
interface PipelineStreamCallbacks {
  onToken: (token: string) => void;       // Token 流回调
  onDone: (fullText: string, codePlan: CodeApplicationPlan | null) => void;
  onError: (error: string) => void;       // 错误回调
  onContextReady?: (ctx: ProjectContext, intent: UserIntent) => void;
}
```

**关键特性**:
- ✅ 四阶段流水线处理
- ✅ SSE 流式响应
- ✅ 上下文智能压缩（maxContextTokens: 6000）
- ✅ 多 Provider 统一接口
- ✅ 代码块自动解析与 Diff 预览

---

### 3.2 LLM 多提供商服务

**文件位置**: `src/app/components/ide/LLMService.ts`

**提供商配置矩阵**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LLM Provider 配置矩阵                              │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│   Provider   │   本地/云端   │   认证方式   │   接口类型   │   状态     │
├──────────────┼──────────────┼──────────────┼──────────────┼────────────┤
│   Ollama     │    本地      │    无认证    │   原生 API   │  自动探测   │
│   OpenAI     │    云端      │   Bearer    │ OpenAI 兼容  │  需配置    │
│   智谱 GLM   │    云端      │   Bearer    │ OpenAI 兼容  │  需配置    │
│   通义千问   │    云端      │   Bearer    │ OpenAI 兼容  │  需配置    │
│   DeepSeek   │    云端      │   Bearer    │ OpenAI 兼容  │  需配置    │
│   自定义     │    可配置    │   可配置     │ OpenAI 兼容  │  需配置    │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────┘
```

**模型配置详情**:

```typescript
// 智谱 GLM 模型配置
{
  id: "zhipu",
  name: "智谱 BigModel",
  baseUrl: "https://open.bigmodel.cn/api/paas/v4",
  authType: "bearer",
  models: [
    { id: "glm-4-plus", name: "GLM-4.7 (Plus)", contextWindow: 128000 },
    { id: "glm-4-flash", name: "GLM-4.5 Flash", contextWindow: 128000 },
    { id: "glm-4-long", name: "GLM-4 Long", contextWindow: 1000000 },
    { id: "codegeex-4", name: "CodeGeeX-4", contextWindow: 128000 },
  ]
}

// 通义千问模型配置
{
  id: "dashscope",
  name: "通义千问",
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  authType: "bearer",
  models: [
    { id: "qwen-max", name: "Qwen3-Max", contextWindow: 32768 },
    { id: "qwen-plus", name: "Qwen3.5-Plus", contextWindow: 131072 },
    { id: "qwen-turbo", name: "Qwen3-Turbo", contextWindow: 131072 },
    { id: "qwen-coder-plus", name: "Qwen Coder Plus", contextWindow: 131072 },
  ]
}

// DeepSeek 模型配置
{
  id: "deepseek",
  name: "DeepSeek",
  baseUrl: "https://api.deepseek.com",
  authType: "bearer",
  models: [
    { id: "deepseek-chat", name: "DeepSeek Chat", contextWindow: 64000 },
    { id: "deepseek-reasoner", name: "DeepSeek R1", contextWindow: 64000 },
  ]
}
```

**代理配置** (vite.config.ts):

```typescript
proxy: {
  '/api/zhipu': {
    target: 'https://open.bigmodel.cn/api/paas/v4',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/zhipu/, ''),
  },
  '/api/deepseek': {
    target: 'https://api.deepseek.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
  },
  '/api/dashscope': {
    target: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/dashscope/, ''),
  },
}
```

---

### 3.3 面板管理系统

**文件位置**: `src/app/components/ide/PanelManager.tsx`

**面板类型定义**:

```typescript
type PanelId =
  | "ai"              // AI 对话面板
  | "files"           // 文件管理面板
  | "code"            // 代码编辑面板
  | "preview"         // 实时预览面板
  | "terminal"        // 终端面板
  | "git"             // Git 版本控制面板
  | "agents"          // 智能体管理面板
  | "market"          // 插件市场面板
  | "knowledge"       // 知识库面板
  | "rag"             // RAG 检索面板
  | "collab"          // 协作面板
  | "ops"             // 运维面板
  | "workflow"        // 工作流面板
  | "diagnostics"     // 诊断面板
  | "performance"     // 性能监控面板
  | "security"        // 安全面板
  | "test-gen"        // 测试生成面板
  | "quality"         // 代码质量面板
  | "document-editor" // 文档编辑器
  | "taskboard"       // 任务看板
  | "multi-instance"; // 多实例面板
```

**布局节点结构**:

```typescript
interface LayoutNode {
  id: string;                    // 节点唯一标识
  type: "leaf" | "split";        // 节点类型
  panelId?: PanelId;             // 面板 ID（leaf 节点）
  direction?: SplitDirection;    // 分割方向（split 节点）
  children?: LayoutNode[];       // 子节点（split 节点）
  size?: number;                 // 尺寸百分比
}
```

**默认布局配置**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          默认三栏布局                                 │
├────────────────┬────────────────────────┬───────────────────────────┤
│                │                        │                           │
│    AI 对话     │      文件管理          │       代码编辑器          │
│    (35%)       │       (35%)            │         (30%)             │
│                │                        │                           │
│   LeftPanel    │     CenterPanel        │       MonacoWrapper       │
│                │                        │                           │
└────────────────┴────────────────────────┴───────────────────────────┘
```

**布局预设**:

```typescript
const LAYOUT_PRESETS = {
  designer: DEFAULT_LAYOUT,
  "ai-workspace": {
    direction: "horizontal",
    children: [
      { panelId: "ai", size: 40 },
      {
        direction: "vertical",
        children: [
          { panelId: "code", size: 60 },
          { panelId: "preview", size: 40 },
        ],
      },
    ],
  },
};
```

**核心能力**:
- ✅ 面板拖拽排序
- ✅ 面板拆分/合并
- ✅ 面板最大化/最小化
- ✅ 面板固定/锁定
- ✅ 浮动面板窗口
- ✅ 布局持久化（localStorage）
- ✅ 预设布局切换

---

### 3.4 状态管理架构

**Store 模块矩阵**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Zustand Store 架构                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  useFileStore    │  │  useModelStore   │  │  useSettingsStore │      │
│  │  文件状态管理     │  │  模型配置管理    │  │  全局设置管理     │      │
│  │  ─────────────   │  │  ─────────────   │  │  ─────────────   │      │
│  │  fileContents    │  │  providers       │  │  userProfile     │      │
│  │  fileTree        │  │  activeModel     │  │  general         │      │
│  │  activeFile      │  │  apiKeys         │  │  agents          │      │
│  │  openTabs        │  │  modelSettings   │  │  mcpConfigs      │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
│           │                     │                     │                 │
│  ┌────────▼─────────┐  ┌────────▼─────────┐  ┌────────▼─────────┐      │
│  │  useThemeStore   │  │  usePreviewStore │  │  usePanelStore   │      │
│  │  主题状态管理     │  │  预览状态管理    │  │  面板状态管理     │      │
│  │  ─────────────   │  │  ─────────────   │  │  ─────────────   │      │
│  │  theme           │  │  previewMode     │  │  layout          │      │
│  │  themeMode       │  │  previewContent  │  │  activePanel     │      │
│  │  customTheme     │  │  previewHistory  │  │  panelStates     │      │
│  │  cssVariables    │  │  snapshots       │  │  floatingPanels  │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
│           │                     │                     │                 │
│  ┌────────▼─────────┐  ┌────────▼─────────┐  ┌────────▼─────────┐      │
│  │  useAIFixStore   │  │  useTaskBoard    │  │  useSessionStore │      │
│  │  AI 修复状态      │  │  任务看板状态    │  │  会话状态管理     │      │
│  │  ─────────────   │  │  ─────────────   │  │  ─────────────   │      │
│  │  fixRequests     │  │  tasks           │  │  sessionId       │      │
│  │  fixResults      │  │  taskStatus      │  │  messages        │      │
│  │  pendingFixes    │  │  taskPriority    │  │  context         │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**核心 Store 定义**:

```typescript
// 文件状态管理
interface FileStore {
  fileContents: Record<string, string>;
  fileTree: FileNode[];
  activeFile: string | null;
  openTabs: TabInfo[];
  setActiveFile: (path: string) => void;
  updateFile: (path: string, content: string) => void;
  createFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
}

// 设置状态管理
interface SettingsStore {
  userProfile: UserProfile;
  general: GeneralSettings;
  agents: AgentConfig[];
  mcpConfigs: MCPConfig[];
  models: ModelConfig[];
  context: ContextSettings;
  conversation: ConversationSettings;
  rules: RuleConfig[];
  skills: SkillConfig[];
}

// 主题状态管理
interface ThemeStore {
  theme: ThemeMode;
  themeMode: "light" | "dark" | "cyberpunk" | "custom";
  customTheme: CustomThemeConfig;
  cssVariables: Record<string, string>;
  setTheme: (theme: ThemeMode) => void;
  updateCustomTheme: (config: Partial<CustomThemeConfig>) => void;
}
```

---

### 3.5 数据持久化架构

**存储层级设计**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        数据持久化架构                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Level 1: 内存缓存 (Memory Cache)                                 │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  Zustand Store (运行时状态)                                │   │   │
│  │  │  - 快速访问，无需序列化                                    │   │   │
│  │  │  - 页面刷新后丢失                                          │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Level 2: 本地存储 (Local Storage)                                │   │
│  │  ┌──────────────────────┐ ┌──────────────────────┐             │   │
│  │  │  localStorage        │ │  sessionStorage      │             │   │
│  │  │  ──────────────      │ │  ──────────────      │             │   │
│  │  │  - 用户设置          │ │  - 临时会话数据      │             │   │
│  │  │  - 主题配置          │ │  - 导航状态          │             │   │
│  │  │  - 面板布局          │ │  - 表单草稿          │             │   │
│  │  │  - API Keys (加密)   │ │                      │             │   │
│  │  │  容量: ~5MB          │ │  容量: ~5MB          │             │   │
│  │  └──────────────────────┘ └──────────────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Level 3: IndexedDB (大容量存储)                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │  yyc3-filestore 数据库                                    │   │   │
│  │  │  ─────────────────────────────────────────────────────   │   │   │
│  │  │  Object Stores:                                           │   │   │
│  │  │  ├── files (文件内容存储)                                  │   │   │
│  │  │  │   ├── path (主键)                                      │   │   │
│  │  │  │   ├── content (文件内容)                                │   │   │
│  │  │  │   ├── updatedAt (更新时间)                              │   │   │
│  │  │  │   ├── size (文件大小)                                   │   │   │
│  │  │  │   └── projectId (项目 ID)                               │   │   │
│  │  │  ├── projects (项目元数据)                                  │   │   │
│  │  │  │   ├── id (主键)                                        │   │   │
│  │  │  │   ├── name (项目名称)                                   │   │   │
│  │  │  │   ├── createdAt (创建时间)                              │   │   │
│  │  │  │   └── fileCount (文件数量)                              │   │   │
│  │  │  └── snapshots (快照存储)                                   │   │   │
│  │  │      ├── id (主键)                                        │   │   │
│  │  │      ├── projectId (项目 ID)                               │   │   │
│  │  │      ├── label (快照标签)                                  │   │   │
│  │  │      └── files (文件快照)                                  │   │   │
│  │  │                                                          │   │   │
│  │  │  容量: 无限制 (用户配额)                                   │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**IndexedDB 适配器接口**:

```typescript
// 文件存储接口
interface StoredFile {
  path: string;          // 文件路径 (主键)
  content: string;       // 文件内容
  updatedAt: number;     // 最后更新时间戳
  size: number;          // 内容大小 (bytes)
  projectId: string;     // 所属项目 ID
}

// 项目存储接口
interface StoredProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  fileCount: number;
  totalSize: number;
}

// 快照存储接口
interface StoredSnapshot {
  id: string;
  projectId: string;
  label: string;
  createdAt: number;
  files: Record<string, string>;  // path -> content
}

// 核心操作函数
async function saveFile(projectId: string, path: string, content: string): Promise<void>;
async function loadFile(projectId: string, path: string): Promise<string | null>;
async function loadAllFiles(projectId: string): Promise<Record<string, string>>;
async function deleteFile(projectId: string, path: string): Promise<void>;
async function createSnapshot(projectId: string, label: string): Promise<string>;
async function restoreSnapshot(snapshotId: string): Promise<void>;
```

---

## 四、路由与页面架构

### 4.1 路由配置

**文件位置**: `src/app/routes.ts`

```typescript
const routes: RouteObject[] = [
  { path: "/",              Component: HomePage,         loader: navBreadcrumb("/") },
  { path: "/ide",           Component: IDEPage,          loader: navBreadcrumb("/ide") },
  { path: "/ide/:projectId", Component: IDEPage,         loader: navBreadcrumb("/ide/:projectId") },
  { path: "/ai-chat",       Component: AIChatPage,       loader: navBreadcrumb("/ai-chat") },
  { path: "/templates",     Component: TemplatesPage,    loader: navBreadcrumb("/templates") },
  { path: "/docs",          Component: DocsPage,         loader: navBreadcrumb("/docs") },
  { path: "/settings",      Component: SettingsPage,     loader: navBreadcrumb("/settings") },
  { path: "/icon-assets",   Component: IconAssetsPage,   loader: navBreadcrumb("/icon-assets") },
  { path: "*",              Component: NotFoundPage },
];
```

### 4.2 页面组件映射

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          页面路由映射                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │    /         │    │    /ide      │    │   /ai-chat   │              │
│  │  HomePage    │    │   IDEPage    │    │ AIChatPage   │              │
│  │  ──────────  │    │  ──────────  │    │  ──────────  │              │
│  │  欢迎页面    │    │  IDE 主界面  │    │  AI 对话页   │              │
│  │  项目入口    │    │  三栏布局    │    │  独立对话    │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  /templates  │    │    /docs     │    │  /settings   │              │
│  │TemplatesPage │    │  DocsPage    │    │SettingsPage  │              │
│  │  ──────────  │    │  ──────────  │    │  ──────────  │              │
│  │  模板中心    │    │  文档中心    │    │  设置页面    │              │
│  │  项目模板    │    │  使用指南    │    │  全局配置    │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 五、依赖关系图

### 5.1 模块依赖关系

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          模块依赖关系图                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│                          ┌─────────────┐                                 │
│                          │    App.tsx   │                                │
│                          └──────┬──────┘                                 │
│                                 │                                         │
│              ┌──────────────────┼──────────────────┐                     │
│              │                  │                  │                     │
│              ▼                  ▼                  ▼                     │
│     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐            │
│     │   routes.ts    │ │  ErrorBoundary │ │ ThemeCustomizer│            │
│     └───────┬────────┘ └────────────────┘ └───────┬────────┘            │
│             │                                    │                       │
│     ┌───────┼────────────────────────────────────┼───────┐              │
│     │       │                                    │       │              │
│     ▼       ▼                                    ▼       ▼              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │HomePage │ │ IDEPage │ │AIChatPag│ │DocsPage │ │SettingsP│            │
│ └─────────┘ └────┬────┘ └─────────┘ └─────────┘ └─────────┘            │
│                  │                                                       │
│                  ▼                                                       │
│     ┌────────────────────────────────────────────────────────┐          │
│     │                    IDEPage 核心依赖                      │          │
│     │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │          │
│     │  │PanelMgr  │  │ FileStore│  │WorkflowEB│              │          │
│     │  └────┬─────┘  └────┬─────┘  └────┬─────┘              │          │
│     │       │             │             │                     │          │
│     │       ▼             ▼             ▼                     │          │
│     │  ┌─────────────────────────────────────────┐           │          │
│     │  │            面板组件集合                   │           │          │
│     │  │  LeftPanel │ CenterPanel │ RightPanel   │           │          │
│     │  │  Terminal  │ GitPanel    │ PreviewPanel │           │          │
│     │  └─────────────────────────────────────────┘           │          │
│     │       │             │             │                     │          │
│     │       ▼             ▼             ▼                     │          │
│     │  ┌─────────────────────────────────────────┐           │          │
│     │  │            AI Pipeline                   │           │          │
│     │  │  AIPipeline │ LLMService │ CodeApplctr  │           │          │
│     │  └─────────────────────────────────────────┘           │          │
│     └────────────────────────────────────────────────────────┘          │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 数据流向图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          数据流向图                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  用户输入                                                                 │
│     │                                                                     │
│     ▼                                                                     │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐          │
│  │  LeftPanel   │ ───▶ │ AIPipeline   │ ───▶ │ LLMService   │          │
│  │  (用户交互)  │      │ (流水线处理) │      │ (LLM 调用)   │          │
│  └──────────────┘      └──────────────┘      └──────────────┘          │
│         │                     │                     │                   │
│         │                     ▼                     │                   │
│         │              ┌──────────────┐             │                   │
│         │              │ContextCollect│             │                   │
│         │              │ (上下文收集) │             │                   │
│         │              └──────────────┘             │                   │
│         │                     │                     │                   │
│         ▼                     ▼                     ▼                   │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                      Zustand Store                            │      │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐               │      │
│  │  │ useFileStore│ │useModelStore│ │useSettings│               │      │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘               │      │
│  └────────┼──────────────┼──────────────┼───────────────────────┘      │
│           │              │              │                               │
│           ▼              ▼              ▼                               │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    持久化层                                    │      │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐               │      │
│  │  │ IndexedDB  │ │localStorage│ │ sessionStorage│              │      │
│  │  │ (文件存储) │ │ (配置存储) │ │ (会话缓存) │               │      │
│  │  └────────────┘ └────────────┘ └────────────┘               │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 六、关键配置文件

### 6.1 构建配置 (vite.config.ts)

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3126,
    strictPort: true,
    hmr: { clientPort: 3126, overlay: true },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          'editor-vendor': ['@monaco-editor/react'],
        },
      },
    },
  },
});
```

### 6.2 TypeScript 配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "types": ["vitest/globals"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

---

## 七、总结

### 7.1 架构优势

| 维度 | 优势说明 |
|------|----------|
| **高可用** | 离线优先设计，IndexedDB 本地存储，无网络依赖 |
| **高性能** | 虚拟滚动、懒加载、代码分割、缓存策略 |
| **高安全** | CSP 配置、API Key 加密存储、输入验证 |
| **高扩展** | 插件系统、MCP 协议、模块化设计 |
| **高智能** | AI Pipeline、多 Provider 支持、意图识别 |

### 7.2 技术亮点

1. **AI Pipeline 流水线**: 四阶段处理，上下文智能压缩，SSE 流式响应
2. **多 Provider 统一接口**: 支持 6+ LLM 提供商，OpenAI 兼容协议
3. **面板系统**: 21 个功能面板，拖拽/拆分/合并/浮动全支持
4. **状态管理**: Zustand 轻量化方案，persist 中间件持久化
5. **存储架构**: 三级存储设计，IndexedDB 大容量支持

### 7.3 后续优化方向

1. **性能优化**: 进一步优化首屏加载时间，减少 bundle 体积
2. **AI 增强**: 引入 RAG 检索增强，提升代码生成质量
3. **协作能力**: 实时协作编辑，WebSocket 同步
4. **移动端适配**: 响应式布局优化，PWA 离线能力

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0.0 | 2026-04-02 | 初始版本，完成核心架构文档 | YanYuCloudCube Team |
