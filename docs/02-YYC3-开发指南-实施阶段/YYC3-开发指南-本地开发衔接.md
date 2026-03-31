/**
 * @file docs/README-Development-Guide.md
 * @description YYC3 Family AI 本地开发衔接指南 — 项目架构、开发环境、测试策略、
 *              模块详解、后续开发建议
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags readme,development,guide,onboarding
 */

---

<div align="center">

# YYC3 Family AI 智能编程助手

**本地开发衔接指南**

> 言传千行代码 | 语枢万物智能

</div>

---

## 1. 项目概述

YYC3 Family AI 是一个基于 React/TypeScript 的多联式低码智能编程平台，运行于 Figma iframe 环境。核心特性：

- **三栏 IDE 布局**: 左栏 AI 对话 / 中栏文件管理 / 右栏代码编辑
- **六大 LLM Provider**: Ollama / OpenAI / 智谱 GLM / 通义千问 / DeepSeek / Custom
- **18+ 功能面板**: react-dnd 拖拽系统，支持合并/拆分/浮动
- **AI 代码生成流水线**: Context → SystemPrompt → LLM SSE → CodeApplicator → Diff Preview
- **TaskBoard AI 任务推理**: 从 AI 响应自动提取候选任务

---

## 2. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| UI 框架 | React + TypeScript | 18.x / 5.8.x |
| 构建工具 | Vite | 6.3.x |
| 样式 | Tailwind CSS v4 | 4.1.x |
| 状态管理 | Zustand (15 stores) | 5.x |
| 路由 | react-router (Hash mode) | 7.13.x |
| 拖拽 | react-dnd + HTML5 Backend | 16.x |
| 编辑器 | Monaco Editor (@monaco-editor/react) | 4.7.x |
| 富文本 | TipTap | 3.20.x |
| 动画 | Motion (Framer Motion) | 12.x |
| 测试 | Vitest + @testing-library/react | 4.x / 16.x |
| 加密 | Web Crypto API (AES-GCM) | 原生 |
| 持久化 | IndexedDB (idb) + localStorage | - |

---

## 3. 项目结构

```
src/app/
├── App.tsx                          # 入口，RouterProvider
├── routes.ts                        # 路由配置 (createHashRouter)
├── components/
│   ├── HomePage.tsx                  # 首页
│   ├── IDEPage.tsx                   # IDE 主页面
│   ├── AIChatPage.tsx                # 全屏 AI 对话
│   ├── SettingsPage.tsx              # 设置页面
│   ├── TemplatesPage.tsx             # 模板市场
│   ├── DocsPage.tsx                  # 文档中心
│   └── ide/
│       ├── LeftPanel.tsx             # AI 对话面板 (核心)
│       ├── CenterPanel.tsx           # 文件管理面板
│       ├── RightPanel.tsx            # 代码编辑面板
│       ├── TopBar.tsx                # 顶部导航栏
│       ├── ViewSwitcher.tsx          # 视图切换栏
│       ├── PanelManager.tsx          # 面板管理系统
│       ├── FileStore.tsx             # 文件系统 Context Provider
│       ├── ModelRegistry.tsx         # AI 模型注册 Context Provider
│       ├── WorkflowEventBus.tsx      # 事件总线 Context Provider
│       ├── LLMService.ts            # LLM API 调用层
│       ├── CryptoService.ts         # 加密服务
│       ├── SettingsBridge.ts        # 设置桥接层
│       ├── ChatHistoryStore.ts      # 会话历史管理
│       ├── DiffPreviewModal.tsx     # Diff 预览确认弹窗
│       ├── ai/
│       │   ├── AIPipeline.ts        # AI 代码生成流水线
│       │   ├── ContextCollector.ts  # 上下文收集器
│       │   ├── SystemPromptBuilder.ts # 系统提示词构建
│       │   ├── CodeApplicator.ts    # 代码应用器
│       │   ├── TaskInferenceEngine.ts # 任务推理引擎
│       │   ├── ErrorAnalyzer.ts     # 错误分析器
│       │   ├── SecurityScanner.ts   # 安全扫描器
│       │   └── TestGenerator.ts     # 测试生成器
│       ├── stores/
│       │   ├── useTaskBoardStore.ts  # 任务看板 Store
│       │   ├── useQuickActionBridge.ts # QuickAction 桥接 Store
│       │   ├── useAIFixStore.ts     # AI 修复请求 Store
│       │   ├── useQuickActionsStore.ts # QuickActions 配置 Store
│       │   ├── useSettingsStore.ts  # 全局设置 Store
│       │   └── ...
│       ├── __tests__/
│       │   ├── TaskInferenceEngine.test.ts
│       │   ├── useQuickActionBridge.test.ts
│       │   ├── useAIFixStore.test.ts
│       │   ├── useTaskBoardStore.test.ts
│       │   └── SettingsBridge.test.ts
│       └── ...
```

---

## 4. 关键架构约束

> **必须严格遵守，违反会导致运行时错误**

### 4.1 Provider 嵌套顺序

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

### 4.2 路由约束

- **必须使用** `react-router`，**禁止** `react-router-dom`
- **必须使用** `createHashRouter`（Figma iframe 环境，History API 触发 `IframeMessageAbortError`）

### 4.3 AI 模型配置

- **禁止硬编码模型名称** — 所有模型通过 `ModelRegistry` 动态注册
- Provider 配置声明在 `LLMService.ts` 的 `PROVIDER_CONFIGS`

### 4.4 Zustand Store 文件位置

- 所有 Store 文件位于 `/src/app/components/ide/stores/`
- 命名规范: `use{Name}Store.ts`

### 4.5 代码标头格式

每个 `.ts/.tsx` 文件必须包含标头（参见 `docs/05-B-YYC3-技术规范-代码标头.md`）:

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

---

## 5. 本地开发

### 5.1 环境要求

- Node.js >= 18
- pnpm >= 8

### 5.2 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm typecheck

# 构建生产版本
pnpm build

# 运行测试
pnpm test

# 监听模式测试
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage

# 代码检查
pnpm lint
pnpm lint:fix

# 代码格式化
pnpm format
pnpm format:check
```

### 5.3 验证构建

```bash
pnpm typecheck && pnpm build && pnpm test
```

---

## 6. 核心数据流

### 6.1 AI 对话流程

```
用户输入 → handleSend()
  → sendMessageDirect(text)
    → getActiveProvider() 获取 LLM Provider
    → runPipeline() 启动 AI Pipeline
      → collectContext() 收集项目上下文
      → buildSystemPrompt() 构建系统提示词
      → chatCompletionStream() SSE 流式调用 LLM
        → onToken(token) → 实时更新 UI
        → onDone(fullText, codePlan)
          → extractCodeBlock() → 展示代码块
          → extractTasksFromResponse() → TaskBoard 推理
          → setPendingPlan() → Diff 预览弹窗
```

### 6.2 QuickAction 桥接流程

```
QuickActionsBar → buildActionPrompt() 构建提示词
  → useQuickActionBridge.dispatchToChat(PendingQuickAction)
    → LeftPanel useEffect 监听 pendingQuickAction
      → consumeQuickAction() 消费
        → sendMessageRef.current(prompt) 零延迟发送
```

### 6.3 AI Fix 桥接流程

```
ErrorDiagnosticsPanel → useAIFixStore.requestFix(prompt, filepath)
  → LeftPanel useEffect 监听 aiFixRequest
    → consumeAIFixRequest() 消费
      → sendMessageRef.current(prompt) 发送
```

---

## 7. 测试策略

### 7.1 当前测试覆盖

| 测试文件 | 覆盖模块 | 测试数 |
|----------|----------|--------|
| `TaskInferenceEngine.test.ts` | 任务推理引擎 | 18 |
| `useQuickActionBridge.test.ts` | QuickAction 桥接 | 17 |
| `useAIFixStore.test.ts` | AI 修复请求 | 10 |
| `useTaskBoardStore.test.ts` | 任务看板 Store | 22 |
| `SettingsBridge.test.ts` | 设置桥接层 | 已有 |

### 7.2 运行测试

```bash
# 全量测试
pnpm test

# 指定文件
pnpm test -- TaskInferenceEngine

# 监听模式
pnpm test:watch

# 覆盖率
pnpm test:coverage
```

### 7.3 后续测试计划

| 优先级 | 模块 | 测试类型 |
|--------|------|----------|
| P0 | ChatHistoryStore | 单元测试 |
| P0 | LLMService (Provider 解析) | 单元测试 |
| P1 | LeftPanel | 组件测试 (需 mock Providers) |
| P1 | AIPipeline | 集成测试 |
| P2 | 完整 AI 对话流程 | E2E (Playwright) |

---

## 8. 后续开发建议

### 8.1 短期 (1-2 周)

1. **LeftPanel 拆分子组件**
   - `ModelSelector.tsx` — 模型选择下拉框
   - `ConnectivityIndicator.tsx` — 连通性状态指示器
   - `ChatMessageList.tsx` — 消息列表渲染
   - `ChatInputArea.tsx` — 输入区域
   - 目标：LeftPanel 从 ~1133 行降至 ~300 行

2. **补充 P1 测试**
   - `ChatHistoryStore` 持久化测试
   - `LLMService` Provider 配置解析测试

3. **添加 vitest.config.ts**
   ```typescript
   import { defineConfig } from 'vitest/config'
   export default defineConfig({
     test: {
       environment: 'jsdom',
       globals: true,
       coverage: {
         reporter: ['text', 'html'],
         thresholds: { lines: 80, branches: 70 },
         exclude: ['**/node_modules/**', '**/dist/**'],
       },
     },
   })
   ```

### 8.2 中期 (1-2 月)

1. **引入 Playwright E2E 测试**
   - 首页 → IDE 页面导航
   - AI 对话完整流程 (mock LLM)
   - QuickAction → TaskBoard 链路

2. **实时协作** (yjs 已安装)
   - 集成 y-websocket
   - 文档协同编辑

3. **插件系统上线**
   - PluginSystem 框架已有
   - Agent 市场集成

### 8.3 长期 (3-6 月)

1. CI/CD 全自动化（GitHub Actions）
2. 性能 profiling（React DevTools Profiler + Lighthouse）
3. 国际化完善（i18n 模块已有框架）
4. 多租户/团队协作

---

## 9. 关键文件参考

| 文件 | 作用 |
|------|------|
| `guidelines/YYC3.md` | 项目总体架构设计 |
| `Guidelines.md` | Figma AI 编码指南 |
| `docs/05-B-YYC3-技术规范-代码标头.md` | 代码标头规范 |
| `guidelines/YYC3-P1-left-panel.md` | 左栏面板设计规范 |
| `guidelines/YYC3-P1-AI-quick-actions.md` | QuickActions 设计规范 |
| `ai-task-board-interaction.md` | TaskBoard 交互规范 |
| `ModelSettings.md` | 模型设置规范 |
| `Theme.md` / `Cyberpunk.md` | 主题设计规范 |
| `docs/YYC3-P5-Closing-Review-Report.md` | P5 收尾审核报告 |

---

## 10. 常见问题

### Q: 为什么必须用 `createHashRouter`?
A: 应用运行在 Figma iframe 内，`history.pushState` 会触发 `IframeMessageAbortError`。Hash 路由避免此问题。

### Q: 如何添加新的 LLM Provider?
A: 在 `LLMService.ts` 的 `PROVIDER_CONFIGS` 数组添加新条目，`ModelRegistry` 会自动注册。

### Q: Store 为什么不用 Context?
A: Zustand Store 支持 `getState()` 在 React 树外调用（如 `onDone` 回调中），避免闭包陈旧问题。Context 用于需要 Provider 嵌套的场景（FileStore/ModelRegistry/EventBus）。

### Q: `sendMessageRef` 为什么用 ref 而不是直接调用?
A: 避免 `useEffect` 依赖中 `sendMessageDirect` 频繁变化导致的无限循环。Ref 保证始终调用最新版本。

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-18
**维护团队**: YanYuCloudCube Team
