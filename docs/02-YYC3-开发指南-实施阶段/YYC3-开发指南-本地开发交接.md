---
@file: 02-YYC3-开发指南-本地开发交接.md
@description: YYC³ Family AI 本地开发交接指南，包含项目架构、开发环境、测试策略、模块详解
@author: YanYuCloudCube Team <admin@0379.email>
@version: v1.0.0
@created: 2026-03-18
@updated: 2026-03-18
@status: stable
@tags: development,handoff,guide,local-dev
---

# YYC3 Family AI - Local Development Handoff Guide

> **Version:** P7 Final Closure  
> **Date:** 2026-03-18  
> **Author:** YanYuCloudCube Team  
> **Status:** Ready for local development & testing

---

## 1. Project Overview

YYC3 Family AI is a multi-panel low-code intelligent programming assistant built with React/TypeScript. The IDE features a three-column layout system with 21 functional panels, real LLM API integration (6 providers), Monaco Editor, drag-and-drop panel management, multi-tab editing, Git integration, enhanced terminal, and AI code assistant.

### Architecture Stack

| Layer | Technology |
|-------|-----------|
| **UI Framework** | React 18 + TypeScript |
| **Styling** | Tailwind CSS v4 + CSS Variables |
| **Routing** | react-router (Hash mode for iframe compat) |
| **State Management** | Zustand (persist) + React Context |
| **Code Editor** | Monaco Editor (@monaco-editor/react) |
| **Drag & Drop** | react-dnd + HTML5Backend |
| **Animation** | motion (Framer Motion) |
| **Build Tool** | Vite |
| **Testing** | Vitest (unit) + Playwright (E2E) |

### Provider Nesting Order

```
DndProvider > WorkflowEventBusProvider > FileStoreProvider > ModelRegistryProvider > PanelManagerProvider
```

---

## 2. Quick Start

```bash
# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Run unit tests
pnpm test

# Build
pnpm build

# E2E tests (requires build first)
pnpm test:e2e
```

---

## 3. Project Structure

```
src/
  app/
    App.tsx                    # Root component (ThemeProvider + RouterProvider)
    routes.ts                  # Hash-based routing configuration
    components/
      HomePage.tsx             # Landing page with intent analysis
      IDEPage.tsx              # Main IDE page (21 panels)
      AIChatPage.tsx           # Full-screen AI chat
      TemplatesPage.tsx        # Template gallery
      DocsPage.tsx             # Documentation viewer
      SettingsPage.tsx         # Global settings
      IconAssetsPage.tsx       # Icon asset browser
      NotFoundPage.tsx         # 404 page
      ErrorBoundary.tsx        # Global error boundary
      ProjectCreateWizard.tsx  # New project wizard
      ide/
        # ── Core Panels ──
        LeftPanel.tsx           # AI chat panel (LLM streaming)
        CenterPanel.tsx         # File tree + editor
        RightPanel.tsx          # Code editor detail
        TopBar.tsx              # Top navigation bar
        ViewSwitcher.tsx        # View mode toggle (default/preview/code)
        Terminal.tsx             # Integrated terminal
        TabBar.tsx               # File tab bar
        
        # ── AI & Agent Panels ──
        AgentOrchestrator.tsx    # Agent workflow orchestration
        AgentMarket.tsx          # Agent marketplace
        KnowledgeBase.tsx        # Knowledge base
        RAGChat.tsx              # RAG-enhanced Q&A
        
        # ── Dev Tool Panels ──
        GitPanel.tsx             # Git integration
        ErrorDiagnosticsPanel.tsx # Error diagnostics
        PerformancePanel.tsx     # Performance monitoring
        SecurityPanel.tsx        # Security scanning
        TestGeneratorPanel.tsx   # Test generation
        CodeQualityDashboard.tsx # Code quality metrics
        DocumentEditor.tsx       # Markdown editor
        TaskBoardPanel.tsx       # Kanban task board
        MultiInstancePanel.tsx   # Multi-instance management
        
        # ── Collaboration ──
        CollabPanel.tsx          # Real-time collaboration
        OpsPanel.tsx             # DevOps panel
        WorkflowPipeline.tsx     # Workflow pipeline
        
        # ── Panel System ──
        PanelManager.tsx         # Panel layout engine
        PanelQuickAccess.tsx     # Quick panel access bar
        PanelMinimap.tsx         # Panel minimap
        FloatingPanelContainer.tsx
        TabGroupBar.tsx          # Tab group management
        LayoutPresets.tsx        # Layout preset selector
        CommandPalette.tsx       # Global command palette (Ctrl+Shift+P)
        KeyboardShortcutsHelp.tsx
        
        # ── LLM Integration ──
        LLMService.ts            # LLM API service (SSE streaming)
        ModelRegistry.tsx        # Model registry context
        ModelSettings.tsx        # Model settings UI
        APIKeySettingsUI.tsx     # API key configuration
        ProxyService.ts          # CORS proxy
        
        # ── AI Pipeline ──
        ai/
          AIPipeline.ts          # Code generation pipeline
          SystemPromptBuilder.ts # System prompt construction
          CodeApplicator.ts      # Code application engine
          TaskInferenceEngine.ts # Task auto-inference
        
        # ── Zustand Stores ──
        stores/
          index.ts               # Store hub (unified exports)
          useFileStoreZustand.ts
          useModelStoreZustand.ts
          useWindowStore.ts      # P2: Window instance management
          useWorkspaceStore.ts   # P2: Workspace management
          useSessionStore.ts     # P2: Session management
          useIPCStore.ts         # P2: IPC BroadcastChannel
          useAIFixStore.ts
          useTaskBoardStore.ts
          useQuickActionsStore.ts
          useSettingsStore.ts
          usePreviewStore.ts
          useFloatingPanelStore.ts
          usePanelTabGroupStore.ts
          usePanelPinStore.ts
          usePreviewHistoryStore.ts
          useScrollSyncStore.ts
          useProxyStoreZustand.ts
          useQuickActionBridge.ts
        
        # ── Sync Hooks ──
        hooks/
          useMultiInstanceSync.ts  # Cross-tab BroadcastChannel sync
          useWorkspaceFileSync.ts  # Workspace <-> FileStore linkage
          useChatSessionSync.ts    # Chat history <-> Session bidirectional sync
          useSettingsSync.ts       # Global settings sync
          useThemeTokens.ts        # Theme token accessor
          useErrorDiagnostics.ts   # Error diagnostics hook
        
        # ── Left Panel Sub-components ──
        left-panel/
          ModelSelector.tsx
          ConnectivityIndicator.tsx
          ChatMessageList.tsx
          ChatInputArea.tsx
        
        # ── Type Definitions ──
        types/
          index.ts
          multi-instance.ts      # Multi-instance type system
        
        # ── Other ──
        constants/               # Brand, config, providers, storage keys
        adapters/                # IndexedDB adapter
        plugins/                 # Plugin system
        i18n/                    # Internationalization
        utils/                   # Utility functions
        __tests__/               # Unit tests
        
        FileStore.tsx            # File system context provider
        ChatHistoryStore.ts      # Chat history localStorage persistence
        ThemeStore.tsx            # Theme context provider
        ThemeCustomizer.tsx       # Theme customization UI
        WorkflowEventBus.tsx     # Event bus for cross-panel communication
        SettingsBridge.ts        # Settings <-> AI instruction bridge
        CryptoService.ts         # Encryption for API keys
```

---

## 4. Key Features Implemented

### P1-P6 Completed Features

1. **Three-column IDE layout** with drag-and-drop panel management
2. **Real LLM API integration** - 6 providers (Ollama, ZhiPu GLM, Tongyi Qwen, OpenAI, DeepSeek, custom)
3. **SSE streaming** with abort support
4. **Code generation pipeline** - intent detection, system prompt building, code parsing, Diff preview
5. **21 functional panels** including AI chat, file tree, code editor, Git, terminal, agents, RAG, etc.
6. **Multi-tab editing** with Monaco Editor
7. **AI context enhancement** - auto-inject active file content into system prompts
8. **Task inference engine** - auto-extract tasks from AI responses
9. **Quick Actions bar** (Ctrl+Shift+A) with AI-bridged actions
10. **Command Palette** (Ctrl+Shift+P)
11. **Theme system** - light/dark/cyberpunk with CSS variable tokens
12. **Error boundary** with graceful fallback
13. **IndexedDB persistence** for file contents
14. **Playwright E2E test framework**
15. **LeftPanel 4-subcomponent architecture** (ModelSelector, ConnectivityIndicator, ChatMessageList, ChatInputArea)

### P7 Final Features (This Session)

16. **Cross-tab instance list auto-sync** (`useMultiInstanceSync`)
    - BroadcastChannel + storage event dual-channel sync
    - Automatic rehydration of Window/Workspace/Session stores
    - Bidirectional: local changes broadcast to other tabs, remote changes auto-pulled

17. **Workspace <-> FileStore linkage** (`useWorkspaceFileSync`)
    - Workspace activation saves/restores open tabs and active file
    - Periodic auto-save of workspace file state (5s interval)

18. **AI chat history <-> Session bidirectional sync** (`useChatSessionSync`)
    - ChatHistoryStore changes auto-create/update SessionStore entries
    - Initial mount syncs existing chat sessions into SessionStore
    - Linked to active workspace

19. **Sidebar navigation fix for Figma iframe**
    - try/catch guards on all `navigate()`, `scrollTo()`, `scrollIntoView()` calls
    - Fallback hash-based navigation for iframe environments

---

## 5. Multi-Instance System (P2)

### Stores

| Store | Storage Key | Purpose |
|-------|-------------|---------|
| `useWindowStore` | `yyc3-window-storage` | Window instances CRUD |
| `useWorkspaceStore` | `yyc3-workspace-storage` | Workspace management |
| `useSessionStore` | `yyc3-session-storage` | Session lifecycle |
| `useIPCStore` | (in-memory) | IPC BroadcastChannel |

### Sync Architecture

```
Tab A                           Tab B
  |                               |
  | useWindowStore.setState()     |
  |  -> Zustand persist -> localStorage
  |  -> BroadcastChannel.postMessage()
  |                               |
  |                      storage event / onmessage
  |                               |
  |                      rehydrateFromStorage()
  |                      useWindowStore.setState()
```

### Panel Access

Open "Multi-Instance" panel via:
- ViewSwitcher -> PanelQuickAccess dropdown -> "Application Multi-open"
- Command Palette (Ctrl+Shift+P) -> search "multi"

---

## 6. LLM Provider Configuration

| Provider | Auth Type | Endpoint | Models |
|----------|-----------|----------|--------|
| Ollama | None | `http://localhost:11434` | Auto-detected |
| ZhiPu GLM | Bearer | `https://open.bigmodel.cn/api/paas/v4/chat/completions` | GLM-4.5/4.6/4.7 |
| Tongyi Qwen | Bearer | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | Qwen3 |
| OpenAI | Bearer | `https://api.openai.com/v1/chat/completions` | GPT-4o |
| DeepSeek | Bearer | `https://api.deepseek.com/v1/chat/completions` | V3/R1 |

API keys are encrypted via CryptoService and stored in localStorage.

---

## 7. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+Shift+A` | Quick Actions Bar |
| `Ctrl+/` | Keyboard Shortcuts Help |
| `Ctrl+1` | Preview mode |
| `Ctrl+2` | Toggle code/default view |
| `Ctrl+Shift+F` | Global search |
| `` Ctrl+` `` | Toggle terminal |

---

## 8. Local Development Recommendations

### First Run Checklist

1. `pnpm install` - Install all dependencies
2. `pnpm typecheck` - Verify TypeScript compilation
3. `pnpm test` - Run unit tests (Vitest)
4. `pnpm build` - Verify production build
5. Open in browser, navigate to IDE page, test panel operations

### Testing Multi-Instance Sync

1. Open 2+ browser tabs to the same URL
2. In Tab A: Open MultiInstancePanel -> create a window instance
3. In Tab B: Verify the instance appears automatically
4. Test workspace/session creation similarly

### Testing AI Chat <-> Session Sync

1. Open IDE, start an AI conversation in the left panel
2. Open MultiInstancePanel -> Sessions tab
3. Verify the AI chat session appears as a "AI Chat" session
4. The session data includes the conversation messages

### Common Issues & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `IframeMessageAbortError` | Figma platform iframe lifecycle | Not a code bug, transient Figma error |
| Sidebar buttons error in Figma | `navigate()` or `scrollTo()` in sandboxed iframe | Added try/catch guards (P7 fix) |
| BroadcastChannel not available | Some browser security policies | Falls back to storage events |
| Monaco Editor blank | Lazy loading race condition | Refresh the page |

### Quality Scores (P5 Audit)

- Code Quality: **92/100**
- Feature Completeness: **93/100**
- Security: **91/100**

---

## 9. File Header Format

All `.ts`/`.tsx` files must follow this header format:

```typescript
/**
 * @file filename.tsx
 * @description Brief description
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created YYYY-MM-DD
 * @updated YYYY-MM-DD
 * @status dev|stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags comma,separated,tags
 */
```

---

## 10. Next Steps Suggestions

1. **Local E2E testing** - Run `pnpm test:e2e` with Playwright to verify all page flows
2. **Real LLM testing** - Configure actual API keys and test streaming responses
3. **Performance profiling** - Use React DevTools Profiler on the IDE page
4. **Mobile responsiveness** - Test on tablet/mobile viewports
5. **Plugin system** - Extend the plugin architecture in `ide/plugins/`
6. **Collaborative editing** - Implement real WebSocket + CRDT sync (currently mocked)

---

*Generated on 2026-03-18 by YYC3 AI Assistant. Good luck with local development!*
