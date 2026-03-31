# 系统架构总览

> **版本**: v1.0.0  
> **最后更新**: 2026-03-31  
> **维护团队**: YYC3 团队

## 架构概览

YYC3 Family AI 采用现代化的前端架构，基于 React 18 和 TypeScript 5.8 构建，提供高性能、高可扩展性的 AI 编程助手平台。

## 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面层 (UI Layer)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 三栏布局  │  │ 面板系统  │  │ 主题系统  │  │ 编辑器   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     应用逻辑层 (Logic Layer)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 状态管理  │  │ 路由系统  │  │ 事件系统  │  │ 插件系统  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     服务层 (Service Layer)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ LLM服务  │  │ 文件服务  │  │ 设备模拟  │  │ 性能监控  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     存储层 (Storage Layer)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │IndexedDB │  │localStorage│  │ Zustand  │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## 核心模块

### 1. 用户界面层

#### 三栏布局系统

```
┌────────┬────────────┬────────┐
│  左栏  │    中栏     │  右栏  │
│        │            │        │
│ AI对话 │  文件管理   │ 代码   │
│        │            │ 编辑器 │
└────────┴────────────┴────────┘
```

**技术实现**:
- `react-resizable-panels`: 可调整大小的面板
- `react-dnd`: 拖拽交互
- 响应式布局适配

#### 面板系统

**功能特性**:
- 18+ 功能面板
- 支持拖拽、合并、拆分、浮动
- 面板状态持久化

**核心组件**:
```typescript
interface PanelConfig {
  id: string;
  type: PanelType;
  title: string;
  icon?: string;
  closable?: boolean;
  floatable?: boolean;
}
```

#### 主题系统

**架构设计**:
```
ThemeManager
    ↓
CSSVariableInjector
    ↓
:root CSS Variables
    ↓
组件样式
```

**主题类型**:
- 浅色主题 (light)
- 深色主题 (dark)
- 赛博朋克 (cyberpunk)
- 自定义主题 (custom)

#### 编辑器系统

**Monaco Editor 集成**:
```typescript
import Editor from '@monaco-editor/react';

<Editor
  language="typescript"
  theme="vs-dark"
  options={{
    fontSize: 14,
    minimap: { enabled: false },
  }}
/>
```

**TipTap 富文本编辑器**:
```typescript
import { useEditor } from '@tiptap/react';

const editor = useEditor({
  extensions: [
    StarterKit,
    CodeBlock,
    Image,
    Link,
  ],
});
```

### 2. 应用逻辑层

#### 状态管理

**Zustand Store 架构**:
```
stores/
├── useAIStore.ts        # AI 状态
├── useFileStore.ts      # 文件状态
├── usePanelStore.ts     # 面板状态
├── useThemeStore.ts     # 主题状态
├── useSettingsStore.ts  # 设置状态
└── useUserStore.ts      # 用户状态
```

**Store 示例**:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AIState {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      clearMessages: () => set({ messages: [] }),
    }),
    { name: 'ai-store' }
  )
);
```

#### 路由系统

**Hash 路由配置**:
```typescript
import { createHashRouter } from 'react-router';

const router = createHashRouter([
  {
    path: '/',
    element: <IDELayout />,
    children: [
      { path: 'files', element: <FileManager /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
```

**路由特性**:
- Hash 模式（Figma iframe 兼容）
- 懒加载路由
- 路由守卫

#### 事件系统

**EventBus 实现**:
```typescript
class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    callbacks?.forEach(cb => cb(data));
  }
}
```

**事件类型**:
- `theme:changed` - 主题变更
- `device:changed` - 设备变更
- `llm:request:start` - LLM 请求开始
- `performance:alert` - 性能告警

#### 插件系统

**插件架构**:
```
PluginLoader
    ↓
SignatureVerifier → Sandbox
    ↓
PluginInstance
    ↓
PluginAPIFactory
```

**插件生命周期**:
```
Uninstalled → Installing → Installed → Activating → Active → Deactivating → Uninstalling
```

### 3. 服务层

#### LLM 服务

**六大 Provider**:
```
LLMProviderFactory
    ├── OllamaProvider
    ├── OpenAIProvider
    ├── ZhipuProvider
    ├── QwenProvider
    ├── DeepSeekProvider
    └── CustomProvider
```

**统一接口**:
```typescript
interface LLMProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<string>;
  chatStream(messages: Message[], options?: ChatOptions): AsyncGenerator<string>;
  complete(prompt: string, options?: CompleteOptions): Promise<string>;
  embed(text: string): Promise<number[]>;
  getModels(): Promise<ModelInfo[]>;
}
```

**意图识别**:
```
IntentRecognizer
    ↓
PatternMatcher → EntityExtractor
    ↓
IntentResult
```

#### 文件服务

**IndexedDB 存储**:
```typescript
class IndexedDBAdapter {
  async saveFile(path: string, content: string): Promise<void>;
  async readFile(path: string): Promise<string>;
  async deleteFile(path: string): Promise<void>;
  async listFiles(): Promise<FileInfo[]>;
}
```

**虚拟文件系统**:
```
VirtualFileSystem
    ├── DirectoryNode
    └── FileNode
```

#### 设备模拟

**DeviceSimulator 架构**:
```
DeviceSimulator
    ├── DeviceConfig (20+ 内置设备)
    ├── ViewportManager
    └── ScreenshotCapture
```

**设备类型**:
- 手机设备（iPhone、Samsung、Pixel）
- 平板设备（iPad、Surface）
- 桌面设备（MacBook、Desktop）

#### 性能监控

**PerformanceMonitor 架构**:
```
PerformanceMonitor
    ├── MetricsCollector
    ├── BottleneckAnalyzer
    └── ReportGenerator
```

**监控指标**:
- FPS（帧率）
- CPU 使用率
- 内存使用
- 网络延迟
- 渲染时间

### 4. 存储层

#### 三层存储架构

```
┌─────────────────┐
│    IndexedDB    │  ← 大文件、项目数据
├─────────────────┤
│  localStorage   │  ← 用户设置、主题配置
├─────────────────┤
│     Zustand     │  ← 运行时状态
└─────────────────┘
```

**存储策略**:
- **IndexedDB**: 文件内容、项目数据、历史记录
- **localStorage**: 用户偏好、主题配置、会话信息
- **Zustand Store**: 临时状态、UI 状态

## 数据流架构

### 单向数据流

```
Action → Store → View
  ↑                ↓
  └──── State ─────┘
```

### AI 交互流程

```
用户输入
    ↓
意图识别 (IntentRecognizer)
    ↓
上下文收集 (ContextCollector)
    ↓
提示词构建 (SystemPromptBuilder)
    ↓
LLM 请求 (LLMProvider)
    ↓
流式响应处理 (StreamHandler)
    ↓
代码应用 (CodeApplicator)
    ↓
Diff 预览 (DiffViewer)
```

### 文件操作流程

```
用户操作
    ↓
FileStore.dispatch()
    ↓
IndexedDBAdapter
    ↓
VirtualFileSystem
    ↓
UI 更新
```

## 依赖关系图

```
React 18.3.1
    ├── react-dnd (拖拽)
    ├── react-router (路由)
    ├── react-resizable-panels (布局)
    └── react-window (虚拟滚动)

TypeScript 5.8.x
    ├── @types/node
    └── @types/react

Vite 6.3.x (构建)
    ├── @vitejs/plugin-react
    └── @tailwindcss/vite

Zustand 5.x (状态管理)
    └── immer (不可变更新)

Monaco Editor 4.7.x (代码编辑)

TipTap 3.20.x (富文本)
    ├── @tiptap/starter-kit
    └── @tiptap/extension-*

LLM Providers
    ├── OpenAI API
    ├── 智谱 API
    ├── 通义千问 API
    └── DeepSeek API
```

## 插件架构

### 插件系统设计

```
PluginLoader
    ├── SignatureVerifier (签名验证)
    ├── Sandbox (沙箱隔离)
    └── DependencyManager (依赖管理)

PluginAPIFactory
    ├── EditorAPI (编辑器 API)
    ├── UIAPI (UI API)
    ├── AIAPI (AI API)
    ├── CommandAPI (命令 API)
    ├── EventAPI (事件 API)
    ├── StorageAPI (存储 API)
    ├── NetworkAPI (网络 API)
    └── WorkspaceAPI (工作区 API)

ExtensionPointManager
    ├── editor.contextMenu
    ├── editor.command
    ├── panel.custom
    ├── theme.custom
    ├── ai.provider
    ├── file.processor
    ├── toolbar.action
    ├── statusbar.item
    ├── settings.section
    └── keybinding.command
```

### 插件生命周期

```
Uninstalled
    ↓ install
Installing
    ↓ verify
Installed
    ↓ activate
Activating
    ↓ start
Active
    ↓ deactivate
Deactivating
    ↓ uninstall
Uninstalled
```

## 性能优化架构

### 代码分割

```
main.tsx
    ├── IDELayout (主布局)
    ├── FileManager (文件管理) - lazy
    ├── Settings (设置) - lazy
    └── AIChat (AI对话) - lazy
```

### 虚拟化渲染

```typescript
// 大列表虚拟化
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={10000}
  itemSize={50}
>
  {Row}
</FixedSizeList>
```

### 缓存策略

```
Memory Cache (最快)
    ↓ miss
IndexedDB Cache (中等)
    ↓ miss
Network Request (最慢)
```

## 安全架构

### CSP 配置

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.openai.com;
">
```

### 沙箱隔离

```typescript
class PluginSandbox {
  private allowedAPIs = new Set([
    'console.log',
    'fetch',
    // ...
  ]);

  execute(code: string) {
    // 在受限环境中执行
  }
}
```

## 测试架构

### 测试金字塔

```
         E2E Tests (Playwright)
        /                    \
      Integration Tests (Vitest)
     /                            \
  Unit Tests (Vitest + Testing Library)
```

### 测试覆盖率

- 单元测试：**97.3%**
- 集成测试：**92.5%**
- E2E 测试：**85.0%**

## 部署架构

### 构建流程

```
Source Code (TypeScript/TSX)
    ↓ TypeScript Compiler
    ↓ Vite Build
    ↓ Terser Minification
    ↓ Asset Optimization
Production Bundle
```

### CI/CD 流程

```
Git Push
    ↓ GitHub Actions
    ├── Lint Check
    ├── Type Check
    ├── Unit Tests
    ├── Integration Tests
    ├── Build
    └── Deploy
```

## 未来规划

### 短期目标 (Q2 2026)

- [ ] WebAssembly 性能优化
- [ ] Service Worker 离线支持
- [ ] WebSocket 实时协作增强

### 中期目标 (Q3-Q4 2026)

- [ ] 微前端架构
- [ ] 插件市场
- [ ] 云端同步

### 长期目标 (2027+)

- [ ] AI 代码审查
- [ ] 自动化测试生成
- [ ] 智能重构建议

## 相关文档

- [API 文档总览](../API文档/)
- [使用指南总览](../使用指南/)
- [开发指南](../开发指南/)

---

**维护者**: YYC3 团队  
**反馈渠道**: [GitHub Issues](https://github.com/YYC-Cube/YYC3-Family-AI/issues)
