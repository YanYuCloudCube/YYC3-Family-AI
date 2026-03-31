/**
 * @file docs/README-P6-Development-Guide.md
 * @description YYC3 Family AI P6 阶段本地开发衔接指南 — LeftPanel 拆分、
 *              Playwright E2E 测试、AI 上下文增强、完整架构更新
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags readme,p6,development,guide,onboarding
 */

---

<div align="center">

# YYC³ Family AI 智能编程助手

**P6 阶段 · 本地开发衔接指南**

> 言传千行代码 | 语枢万物智能

</div>

---

## 1. P6 阶段交付总结

### 1.1 LeftPanel 四子组件拆分

LeftPanel 从 **1133 行** 精简为 **~340 行**，拆分为以下独立组件：

| 子组件 | 文件 | 行数 | 职责 |
|--------|------|------|------|
| **ModelSelector** | `left-panel/ModelSelector.tsx` | ~240 | 按 Provider 分组的模型选择下拉框 |
| **ConnectivityIndicator** | `left-panel/ConnectivityIndicator.tsx` | ~200 | 实时 Ping 测试、延迟显示、连接详情 |
| **ChatMessageList** | `left-panel/ChatMessageList.tsx` | ~170 | 消息气泡渲染、代码块操作、流式指示器 |
| **ChatInputArea** | `left-panel/ChatInputArea.tsx` | ~120 | 快捷建议、输入框、发送/停止按钮 |

**组件依赖关系：**

```
LeftPanel.tsx (orchestrator, ~340 行)
├── ModelSelector       ← useModelRegistry 数据透传
├── ConnectivityIndicator ← 自管理连通性状态 + global sync
├── ChatMessageList     ← messages state + callback props
└── ChatInputArea       ← chatInput state + send/stop handlers
```

### 1.2 AI 上下文增强

三层上下文注入机制：

1. **ContextCollector** (`compressContext`): 活跃文件上限从 4000→8000 chars，添加语言检测 code fence
2. **LeftPanel** (`buildActiveFileContextInjection`): 将当前打开文件完整内容（≤10000 chars）+ 其他 3 个 open tabs 预览注入 `customInstructions`
3. **SystemPromptBuilder**: 接收增强后的 instructions，注入到 `## 额外指令` 段

**数据流：**

```
activeFile + fileContents + openTabs
  → buildActiveFileContextInjection()    // LeftPanel
    → enhancedInstructions               // 拼接 Settings + 文件上下文
      → runPipeline({ customInstructions })
        → buildSystemPrompt({ customInstructions })
          → "## 额外指令" + "## 当前工作区上下文"
            → LLM 收到完整文件内容
```

### 1.3 Playwright E2E 测试

| 文件 | 测试数 | 覆盖场景 |
|------|--------|----------|
| `e2e/ai-chat-flow.spec.ts` | 12 | 首页导航、IDE 三栏布局、模型选择器、连通性指示、输入区、快捷建议、会话管理、全屏导航、设置入口、视图切换、响应式布局、错误处理 |

### 1.4 TaskInferenceEngine 独立模块

`ai/TaskInferenceEngine.ts` 已从 LeftPanel 提取为独立可测试模块，LeftPanel 通过 `import { extractTasksFromResponse } from "./ai/TaskInferenceEngine"` 引用。

---

## 2. 新增/变更文件清单

### 新增文件

```
src/app/components/ide/left-panel/
├── ModelSelector.tsx           # 模型选择器子组件
├── ConnectivityIndicator.tsx   # 连通性指示器子组件
├── ChatMessageList.tsx         # 消息列表子组件
└── ChatInputArea.tsx           # 输入区子组件

src/app/components/ide/ai/
└── TaskInferenceEngine.ts      # 独立任务推理引擎 (P5 已创建)

e2e/
└── ai-chat-flow.spec.ts       # Playwright E2E 测试

playwright.config.ts            # Playwright 配置
docs/README-P6-Development-Guide.md  # 本文档
```

### 变更文件

| 文件 | 变更说明 |
|------|----------|
| `LeftPanel.tsx` | v2.4.0 → v3.0.0：拆分子组件、AI 上下文增强、import 整理 |
| `ai/ContextCollector.ts` | 活跃文件上限 4000→8000，添加语言检测 code fence |
| `package.json` | 新增 `test:e2e` / `test:e2e:ui` / `test:e2e:headed` 脚本 |

---

## 3. 本地开发环境搭建

### 3.1 前置条件

```bash
# Node.js 18+, pnpm 8+
node -v   # v18.x 或更高
pnpm -v   # v8.x 或更高
```

### 3.2 安装与启动

```bash
# 克隆项目
git clone <repository-url>
cd yyc3-family-ai

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
# → http://localhost:5173

# 类型检查
pnpm typecheck

# 单元测试
pnpm test

# 带覆盖率
pnpm test:coverage
```

### 3.3 Playwright E2E 测试

```bash
# 首次安装 Playwright 浏览器
npx playwright install

# 运行 E2E 测试（需要先启动 dev server，或让 playwright 自动启动）
pnpm test:e2e

# 带 UI 的交互模式
pnpm test:e2e:ui

# 有头浏览器模式（可看到测试过程）
pnpm test:e2e:headed

# 只运行 Chromium
pnpm test:e2e -- --project=chromium

# 生成测试报告
npx playwright show-report
```

### 3.4 验证构建完整性

```bash
# 全量验证
pnpm typecheck && pnpm build && pnpm test

# 快速冒烟测试
pnpm test -- TaskInferenceEngine useQuickActionBridge useAIFixStore useTaskBoardStore
```

---

## 4. 关键架构约束（必读）

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

### 4.2 路由：必须用 Hash Router

```tsx
import { createHashRouter } from "react-router"
// ❌ 禁止 createBrowserRouter（Figma iframe 会触发 IframeMessageAbortError）
// ❌ 禁止 react-router-dom（环境限制）
```

### 4.3 AI 模型：禁止硬编码

所有模型通过 `ModelRegistry` 动态注册。`LLMService.ts` 的 `PROVIDER_CONFIGS` 声明式配置。

### 4.4 LeftPanel 子组件通信模式

```
LeftPanel (state owner)
  ├── 通过 props 传递给子组件
  ├── sendMessageRef.current() — 稳定引用，供 bridge 调用
  ├── useQuickActionBridge → consumePending → sendMessageRef
  └── useAIFixStore → consumeRequest → sendMessageRef
```

### 4.5 代码标头格式

每个 `.ts/.tsx` 文件必须包含标准标头（参见 `YYC3-Code-header.md`）。

---

## 5. 核心数据流

### 5.1 AI 对话完整流程（含上下文增强）

```
用户输入
  → handleSend()
    → sendMessageDirect(text)
      → getActiveProvider()
      → buildActiveFileContextInjection()     ← 新增：文件上下文注入
      → enhancedInstructions = settings + 文件上下文
      → runPipeline({
          userMessage,
          fileContents,
          activeFile,
          customInstructions: enhancedInstructions,  ← ���强指令
        })
        → collectContext() → ProjectContext
        → buildSystemPrompt(intent, context, { customInstructions })
          → "## 项目上下文" + "## 额外指令（含文件内容）"
        → chatCompletionStream() → SSE
          → onToken → 流式更新 UI
          → onDone
            → extractCodeBlock() → 代码块展示
            → extractTasksFromResponse() → TaskBoard 推理
            → setPendingPlan() → Diff 预览
```

### 5.2 QuickAction → Chat → TaskBoard 闭环

```
QuickActionsBar.executeAction()
  → buildActionPrompt(type, code, lang, file)
  → useQuickActionBridge.dispatchToChat(PendingQuickAction)
    → LeftPanel useEffect 监听
      → consumeQuickAction()
        → sendMessageRef.current(prompt)
          → [AI 对话完整流程]
            → extractTasksFromResponse()
              → useTaskBoardStore.addInferences()
```

---

## 6. 测试覆盖率矩阵

### 6.1 单元测试（Vitest）

| 测试文件 | 覆盖模块 | 测试数 | 状态 |
|----------|----------|--------|------|
| `TaskInferenceEngine.test.ts` | 任务推理引擎 | 18 | ✅ |
| `useQuickActionBridge.test.ts` | QuickAction 桥接 | 17 | ✅ |
| `useAIFixStore.test.ts` | AI 修复请求 | 10 | ✅ |
| `useTaskBoardStore.test.ts` | 任务看板 Store | 22 | ✅ |
| `SettingsBridge.test.ts` | 设置桥接层 | 已有 | ✅ |
| **小计** | | **67+** | |

### 6.2 E2E 测试（Playwright）

| 测试文件 | 覆盖场景 | 测试数 | 状态 |
|----------|----------|--------|------|
| `ai-chat-flow.spec.ts` | 完整 AI 对话流程 | 12 | ✅ |

### 6.3 待补充测试（下一阶段建议）

| 优先级 | 模块 | 测试类型 |
|--------|------|----------|
| P0 | ChatHistoryStore | 单元测试 |
| P0 | LLMService (Provider 解析) | 单元测试 |
| P1 | ModelSelector 子组件 | 组件测试 (@testing-library/react) |
| P1 | ConnectivityIndicator 子组件 | 组件测试 |
| P1 | ChatMessageList 子组件 | 组件测试 |
| P1 | ChatInputArea 子组件 | 组件测试 |
| P2 | AIPipeline 完整流程 | 集成测试 |
| P2 | 多面板拖拽交互 | E2E (Playwright) |

---

## 7. 后续开发路线图

### 7.1 短期（1-2 周）

1. **子组件测试补充** — 为 4 个 LeftPanel 子组件编写 @testing-library/react 组件测试
2. **ChatHistoryStore 测试** — IndexedDB 持久化 mock ���试
3. **LeftPanel 继续优化** — Session History 面板可考虑提取为 `SessionHistoryPanel.tsx`

### 7.2 中期（1-2 月）

1. **测试覆盖率提升至 80%** — 补充 LLMService、AIPipeline、FileStore 测试
2. **E2E 测试扩展** — 多面板拖拽、Diff 预览确认、模型切换完整链路
3. **实时协作** — yjs + y-websocket 集成
4. **性能优化** — 大消息列表虚拟滚动、Monaco Editor 延迟加载

### 7.3 长期（3-6 月）

1. CI/CD 全自动化（GitHub Actions: typecheck → test → e2e → build → deploy）
2. 插件系统上线（Agent 市场、自定义 Provider）
3. 国际化完善（i18n 框架已有）
4. 多租户/团队协作

---

## 8. 常见问题 FAQ

### Q: 为什么 LeftPanel 拆分后子组件接收 `as any` 类型？
A: ModelRegistry Context 返回的类型与子组件 Props 接口有细微差异（如 `ModelRegistryModel` vs `ModelSelectorModel`）。`as any` 是临时过渡方案，建议后续在 `types/` 中定义统一的 `SharedModel` 接口，然后各模块 re-export。

### Q: `buildActiveFileContextInjection` 会不会导致 token 爆炸？
A: 有 10000 chars 上限截断。加上 `compressContext` 的 8000 chars 上限和 `maxContextTokens` 6000 估算，总 system prompt 不会超过 ~20000 chars (~5700 tokens)，在大部分模型的 context window 内安全。

### Q: Playwright 测试需要��实 LLM 服务吗？
A: 不需要。E2E 测试只验证 UI 交互流程。发送消息时如果无模型配置，测试验证的是错误提示是否友好显示。如需测试完整 AI 流程，建议配置 Ollama 本地模型。

### Q: `sendMessageRef` 为什么不直接用 `sendMessageDirect`？
A: `sendMessageDirect` 依赖多个 state（messages、isStreaming 等），每次 state 变化会重新创建函数。如果 `useEffect` 依赖它，会造成无限循环。`sendMessageRef.current` 始终指向最新版本，但不触发 effect 重执行。

### Q: 如何为子组件添加测试？
A: 推荐使用 `@testing-library/react` + `render` 函数。由于子组件通过 props 接收所有数据，不依赖 Context，测试非常简单：

```tsx
import { render, screen, fireEvent } from "@testing-library/react"
import ChatInputArea from "../left-panel/ChatInputArea"

test("输入文本并发送", () => {
  const onSend = vi.fn()
  render(
    <ChatInputArea
      chatInput="Hello"
      setChatInput={vi.fn()}
      isStreaming={false}
      showSuggestions={false}
      onSend={onSend}
      onStop={vi.fn()}
    />
  )
  fireEvent.click(screen.getByRole("button", { name: /send/i }))
  expect(onSend).toHaveBeenCalled()
})
```

---

## 9. 关键文件索引

| 文件 | 作用 |
|------|------|
| `src/app/components/ide/LeftPanel.tsx` | AI 对话面板（orchestrator, v3.0.0） |
| `src/app/components/ide/left-panel/ModelSelector.tsx` | 模型选择器子组件 |
| `src/app/components/ide/left-panel/ConnectivityIndicator.tsx` | 连通性指示器子组件 |
| `src/app/components/ide/left-panel/ChatMessageList.tsx` | 消息列表子组件 |
| `src/app/components/ide/left-panel/ChatInputArea.tsx` | 输入区子组件 |
| `src/app/components/ide/ai/TaskInferenceEngine.ts` | 任务推理引擎（独立模块） |
| `src/app/components/ide/ai/ContextCollector.ts` | 上下文收集器（增强版） |
| `e2e/ai-chat-flow.spec.ts` | Playwright E2E 测试 |
| `playwright.config.ts` | Playwright 配置 |
| `docs/README-Development-Guide.md` | P5 开发指南 |
| `docs/README-P6-Development-Guide.md` | P6 开发指南（本文档） |

---

## 10. 致谢

感谢 YanYuCloudCube 团队在 P1-P6 阶段的持续协作。从首个 LLM Provider 集成到完整的多面板 IDE 系统，从零测试到 67+ 单元测试 + 12 个 E2E 测试，项目已具备生产级代码质量基础。

**下一位助手请先阅读：**
1. `Guidelines.md` — 全局编码规范
2. `guidelines/YYC3-Code-header.md` — 代码标头格式
3. 本文档 — P6 阶段完整上下文
4. `docs/YYC3-P5-Closing-Review-Report.md` — P5 审核报告

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-18
**维护团队**: YanYuCloudCube Team
