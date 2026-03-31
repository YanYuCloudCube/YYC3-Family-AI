# YYC3 Family AI — MVP Feature Expansion Report

> **Version**: 1.0  
> **Date**: 2026-03-14  
> **Role**: Product Manager + Technical Architect  

---

## Part I: Current State Analysis

### 1.1 Existing MVP Feature Matrix

| Module | Component(s) | Maturity | Notes |
|--------|-------------|----------|-------|
| **Homepage / Routing** | `HomePage.tsx`, `routes.ts` | Production | Smart intent routing (regex + AI), recent projects, quick actions |
| **IDE Core** | `IDEPage.tsx`, `PanelManager.tsx` | Production | 13-panel DnD layout, split/merge/maximize, localStorage persistence |
| **AI Chat (IDE)** | `LeftPanel.tsx` | Production | Real LLM streaming, multi-session, code extraction, model switching |
| **AI Chat (Standalone)** | `AIChatPage.tsx` | Production | Full-screen chat, Markdown/code rendering, history |
| **File System** | `FileStore.tsx`, `CenterPanel.tsx` | Production | Virtual file tree, multi-tab editing, CRUD, search |
| **Code Editor** | `MonacoWrapper.tsx`, `RightPanel.tsx` | Production | Monaco Editor, syntax highlighting, minimap, theme-aware |
| **Terminal** | `Terminal.tsx` | Prototype | Simulated shell, basic command support |
| **Git Integration** | `GitPanel.tsx` | Prototype | Branch management, staging, commit log (mock data) |
| **LLM Service** | `LLMService.ts` | Production | 6 providers (Ollama/OpenAI/Claude/Zhipu/Qwen/DeepSeek), SSE streaming |
| **Model Registry** | `ModelRegistry.tsx` | Production | Dynamic model registration, connectivity ping, heartbeat |
| **Model Settings** | `ModelSettings.tsx` | Production | 5-tab config (Providers/Ollama/MCP/Proxy/Diagnostics) |
| **Theme System** | `ThemeStore.tsx`, `ThemeCustomizer.tsx`, `CustomThemeStore.ts` | Production | Navy/Cyberpunk switch, 6 presets, OKLch, WCAG contrast |
| **Token System** | `useThemeTokens.ts` | In Progress | Structured tokens (page/btn/status/text/gradients), partial migration |
| **Event Bus** | `WorkflowEventBus.tsx` | Production | 60+ event types, stage mapping |
| **Workflow Pipeline** | `WorkflowPipeline.tsx` | Prototype | 5-loop visualization (Design/Code/Preview/AI/Collab) |
| **Agent Orchestrator** | `AgentOrchestrator.tsx` | Prototype | Visual workflow builder, node types, mock execution |
| **Agent Market** | `AgentMarket.tsx` | Prototype | Agent catalog, categories, ratings |
| **Knowledge Base** | `KnowledgeBase.tsx` | Prototype | Document collections, chunk/vector metadata |
| **RAG Chat** | `RAGChat.tsx` | Prototype | Citation-aware chat, knowledge base selection |
| **Collab Panel** | `CollabPanel.tsx` | Prototype | User presence, cursors, event log (mock data) |
| **Ops Panel** | `OpsPanel.tsx` | Prototype | System metrics, alerts, heartbeat, proxy config |
| **Settings Page** | `SettingsPage.tsx` | Production | Full settings (General/AI/Shortcuts/Theme/Account) |
| **Templates Page** | `TemplatesPage.tsx` | Prototype | Template catalog, categories, filtering |
| **Docs Page** | `DocsPage.tsx` | Prototype | Documentation sections, article metadata |
| **Share Dialog** | `ShareDialog.tsx` | Prototype | Link sharing, permissions |
| **Project Wizard** | `ProjectCreateWizard.tsx` | Prototype | Multi-step project creation |
| **Notifications** | `NotificationDrawer.tsx` | Prototype | Notification list, categories |
| **Proxy Service** | `ProxyService.ts` | Production | CORS proxy config, health check |
| **Zustand Stores** | `stores/` (3 files) | Production | File, Model, Proxy stores |
| **Test Suite** | `__tests__/` (10 files) | In Progress | Vitest, Testing Library, unit tests |

### 1.2 Technology Stack Summary

- **Framework**: React 18.3 + TypeScript + Vite 6.3
- **Styling**: Tailwind CSS 4.1 + CSS Variables + Custom OKLch token system
- **State**: React Context (primary) + Zustand 5 (stores) + Immer
- **Routing**: React Router 7.13 (data mode, lazy loading)
- **Editor**: Monaco Editor (via @monaco-editor/react)
- **DnD**: react-dnd 16 + HTML5 backend
- **Animation**: Motion (framer-motion successor)
- **Charts**: Recharts 2.15
- **UI Primitives**: Radix UI (full suite), cmdk, sonner
- **Testing**: Vitest 4.1 + @testing-library/react + jsdom

### 1.3 Identified Gaps & Pain Points

| # | Gap | Impact | Severity |
|---|-----|--------|----------|
| G1 | Terminal is fully simulated (no real command execution) | Users cannot run npm/git commands | High |
| G2 | Git panel uses mock data, no real VCS integration | No version control capability | High |
| G3 | File system is in-memory, no persistence across sessions | Work lost on refresh | Critical |
| G4 | Collab panel is UI-only, no WebSocket/CRDT | No real-time collaboration | Medium |
| G5 | Knowledge Base has no real embedding/vector storage | RAG is non-functional | Medium |
| G6 | Agent Orchestrator is visual-only, no execution engine | Cannot run agent workflows | Medium |
| G7 | Templates page uses static data, no backend | Cannot save/share templates | Low |
| G8 | Live preview (iframe) not implemented | Cannot see real-time output | High |
| G9 | No project export/deploy pipeline | Cannot ship generated code | High |
| G10 | `isCyber` theme migration incomplete (AIChatPage 71, NotificationDrawer 16) | Maintenance burden | Low |

---

## Part II: Feature Expansion Plan

### 2.1 Feature Expansion Overview

Based on MVP gaps, market analysis (Cursor, Bolt.new, v0.dev, Windsurf), and user value, features are organized into **5 expansion waves**:

```
Wave 1 (Foundation)     -> File persistence + Live preview + Real terminal
Wave 2 (Intelligence)   -> AI code generation pipeline + Context-aware AI
Wave 3 (Collaboration)  -> Real-time collab + Project sharing + Deploy
Wave 4 (Ecosystem)      -> Plugin system + Template marketplace + MCP tools
Wave 5 (Enterprise)     -> Team management + Analytics + Self-hosting
```

---

### 2.2 Wave 1: Foundation (Weeks 1-4)

> **Goal**: Make the IDE actually usable for real development work.

#### F1.1 File System Persistence Layer

| Attribute | Detail |
|-----------|--------|
| **Priority** | P0 (Critical) |
| **Value** | Users can save work and return later |
| **Effort** | 1 week |
| **Dependencies** | Supabase or IndexedDB |

**User Stories**:
- As a developer, I want my files to persist across browser sessions
- As a developer, I want to create/rename/delete files and see changes saved immediately
- As a developer, I want to export my project as a ZIP file

**Technical Design**:
```
Current: FileStore (React Context, in-memory Map)
    |
    v
Target:  FileStore -> IndexedDB (local) + Supabase Storage (cloud)
         |
         +-> useFileStoreZustand.ts (extend with persistence middleware)
         +-> zustand/middleware: persist + immer
         +-> IndexedDB adapter for large file content
         +-> Supabase Storage adapter for cloud sync (optional)
```

**Implementation Path**:
1. Add `zustand` `persist` middleware to `useFileStoreZustand.ts` with IndexedDB storage
2. Create `FileSystemAdapter` interface (`save`, `load`, `delete`, `list`, `export`)
3. Implement `IndexedDBAdapter` for offline-first storage
4. Add project export (ZIP download using `jszip`)
5. Add file import (drag-and-drop folders, ZIP upload)
6. Migrate `FileStore.tsx` context consumers to Zustand store

**Key Files**:
- `stores/useFileStoreZustand.ts` (extend)
- `adapters/IndexedDBAdapter.ts` (new)
- `adapters/FileSystemAdapter.ts` (new interface)

---

#### F1.2 Live Preview Engine

| Attribute | Detail |
|-----------|--------|
| **Priority** | P0 (Critical) |
| **Value** | See real-time output of generated code |
| **Effort** | 2 weeks |
| **Dependencies** | F1.1 (file persistence) |

**User Stories**:
- As a developer, I want to see a live preview of my React components as I edit
- As a developer, I want hot-reload on file save
- As a developer, I want to interact with the preview (click, scroll, navigate)

**Technical Design**:
```
Monaco Editor (file change)
    |
    v
FileStore.updateFile()
    |
    v
Debounced Build Trigger (300ms)
    |
    v
In-Browser Bundler (esbuild-wasm / Sandpack)
    |
    v
Sandbox iframe (preview)
    |
    v
PostMessage API (bidirectional)
    |
    +-> Error overlay (compilation errors)
    +-> Console capture (console.log forwarding)
    +-> Element inspector (click-to-select)
```

**Implementation Options**:

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Sandpack** (CodeSandbox) | Battle-tested, React-native, npm support | Bundle size ~2MB, limited customization | Best for MVP |
| **esbuild-wasm** | Fast, small, configurable | No npm resolution out-of-box | Best for long-term |
| **WebContainers** (StackBlitz) | Full Node.js in browser | License restrictions, large | Overkill for MVP |

**Recommended**: Start with **Sandpack** for rapid integration, migrate to **esbuild-wasm** in Wave 3.

**Implementation Path**:
1. Install `@codesandbox/sandpack-react`
2. Create `PreviewPanel.tsx` component wrapping Sandpack
3. Bridge `FileStore` -> Sandpack file system via `useEffect` sync
4. Add error boundary and error overlay
5. Add console output forwarding to Terminal panel
6. Wire into `WorkflowEventBus` (`preview-updated`, `preview-refreshed`)

**Key Files**:
- `ide/PreviewPanel.tsx` (new)
- `ide/PreviewBridge.ts` (new — FileStore <-> Sandpack sync)

---

#### F1.3 Enhanced Terminal

| Attribute | Detail |
|-----------|--------|
| **Priority** | P1 (High) |
| **Value** | Run commands, see build output, npm operations |
| **Effort** | 1 week |
| **Dependencies** | F1.2 (preview engine for build output) |

**User Stories**:
- As a developer, I want to see build output and compilation errors
- As a developer, I want to run simulated npm commands
- As a developer, I want command history and auto-complete

**Technical Design**:
```
Current: Terminal.tsx (simulated echo, basic commands)
    |
    v
Target:  Terminal.tsx
         +-> CommandRegistry (extensible command system)
         +-> Built-in commands: ls, cat, echo, clear, help
         +-> Npm-like commands: npm install, npm run build (simulated)
         +-> Git-like commands: git status, git log (bridge to GitPanel)
         +-> Build output stream (from PreviewPanel build events)
         +-> xterm.js integration (proper terminal emulator)
```

**Implementation Path**:
1. Install `xterm` + `xterm-addon-fit` + `xterm-addon-web-links`
2. Create `CommandRegistry.ts` with extensible command pattern
3. Implement built-in commands (ls, cat, echo, clear, pwd, help)
4. Bridge build output from PreviewPanel -> Terminal
5. Add command history (up/down arrow) and tab completion
6. Wire git commands to GitPanel state

**Key Files**:
- `ide/Terminal.tsx` (rewrite)
- `ide/CommandRegistry.ts` (new)

---

### 2.3 Wave 2: Intelligence (Weeks 5-8)

> **Goal**: Make AI code generation actually produce working code.

#### F2.1 AI Code Generation Pipeline

| Attribute | Detail |
|-----------|--------|
| **Priority** | P0 (Critical) |
| **Value** | Core product value — AI generates real, working code |
| **Effort** | 3 weeks |
| **Dependencies** | F1.1, F1.2 (files + preview to verify output) |

**User Stories**:
- As a user, I want to describe an app in natural language and get working code
- As a user, I want to iterate on generated code through conversation
- As a user, I want AI to understand my existing project context

**Technical Design**:
```
User Prompt (LeftPanel chat)
    |
    v
Context Collector
    +-> Current file content
    +-> File tree structure
    +-> Open tabs
    +-> Recent edits
    +-> Error messages
    |
    v
System Prompt Builder
    +-> Role: "You are a React/TypeScript expert..."
    +-> Context: project files, errors, user history
    +-> Constraints: use existing components, follow project conventions
    |
    v
LLM Service (streaming)
    |
    v
Response Parser
    +-> Extract code blocks (```tsx ... ```)
    +-> Extract file paths
    +-> Detect multi-file changes
    |
    v
Code Applicator
    +-> Create/update files in FileStore
    +-> Trigger preview rebuild
    +-> Show diff before applying
    |
    v
Verification Loop
    +-> Check TypeScript errors
    +-> Check preview rendering
    +-> Report results back to chat
```

**Implementation Path**:
1. Create `ContextCollector.ts` — gathers project state for LLM context
2. Create `SystemPromptBuilder.ts` — constructs system prompts with project context
3. Extend `LeftPanel.tsx` chat to parse multi-file code responses
4. Create `CodeApplicator.ts` — applies code changes to FileStore with diff preview
5. Create `VerificationLoop.ts` — checks TypeScript compilation and preview rendering
6. Wire into WorkflowEventBus (design-input -> code-generation -> preview loops)
7. Add "Apply Code" / "Reject" buttons to assistant messages

**Key Files**:
- `ide/ai/ContextCollector.ts` (new)
- `ide/ai/SystemPromptBuilder.ts` (new)
- `ide/ai/CodeApplicator.ts` (new)
- `ide/ai/VerificationLoop.ts` (new)
- `ide/LeftPanel.tsx` (extend)

---

#### F2.2 Inline Code Actions (AI-powered)

| Attribute | Detail |
|-----------|--------|
| **Priority** | P1 (High) |
| **Value** | Cursor-like inline AI editing experience |
| **Effort** | 2 weeks |
| **Dependencies** | F2.1 (code gen pipeline) |

**User Stories**:
- As a developer, I want to select code and ask AI to refactor/explain/fix it
- As a developer, I want inline code suggestions as I type
- As a developer, I want to see AI-generated diffs before accepting

**Technical Design**:
```
Monaco Editor
    |
    +-> Context Menu: "Ask AI to..." (refactor/explain/fix/optimize)
    +-> Cmd+K inline prompt bar (Cursor-style)
    +-> Selection -> AI -> Diff view -> Accept/Reject
    |
    v
LLM Service
    |
    v
Inline Diff Renderer (Monaco decorations)
    +-> Green: additions
    +-> Red: deletions
    +-> Accept (Tab) / Reject (Esc)
```

**Implementation Path**:
1. Add Monaco editor actions (context menu items)
2. Create `InlinePromptBar.tsx` — floating input at cursor position
3. Create `DiffRenderer.ts` — Monaco decoration-based diff visualization
4. Implement accept/reject flow with undo support
5. Add keyboard shortcuts (Cmd+K, Tab, Esc)

**Key Files**:
- `ide/ai/InlinePromptBar.tsx` (new)
- `ide/ai/DiffRenderer.ts` (new)
- `ide/MonacoWrapper.tsx` (extend with actions)

---

#### F2.3 Smart Error Diagnosis

| Attribute | Detail |
|-----------|--------|
| **Priority** | P1 (High) |
| **Value** | AI automatically diagnoses and fixes errors |
| **Effort** | 1 week |
| **Dependencies** | F2.1, F1.2 |

**User Stories**:
- As a developer, when my preview shows an error, I want AI to diagnose and suggest fixes
- As a developer, I want one-click error resolution

**Technical Design**:
```
Preview iframe error / TypeScript diagnostic
    |
    v
Error Collector
    +-> Parse error message, file, line, column
    +-> Collect surrounding code context
    |
    v
AI Diagnosis (LLM)
    +-> System prompt: "You are a debugging expert..."
    +-> Error message + code context
    |
    v
Fix Suggestion
    +-> Show in chat with "Apply Fix" button
    +-> Or inline diff in editor
```

---

### 2.4 Wave 3: Collaboration & Deployment (Weeks 9-14)

#### F3.1 Real-time Collaboration (CRDT)

| Attribute | Detail |
|-----------|--------|
| **Priority** | P2 (Medium) |
| **Value** | Multi-user editing, pair programming |
| **Effort** | 4 weeks |
| **Dependencies** | Supabase Realtime or custom WebSocket server |

**Technical Design**:
```
User A edits file
    |
    v
Yjs CRDT Document
    |
    v
y-websocket provider
    |
    v
WebSocket Server (Supabase Realtime / custom)
    |
    v
User B receives update
    |
    v
Monaco binding (y-monaco)
    +-> Cursor awareness
    +-> Selection awareness
    +-> User presence indicators
```

**Implementation Path**:
1. Install `yjs`, `y-websocket`, `y-monaco`
2. Create `CollabProvider.tsx` — manages Yjs document and WebSocket connection
3. Integrate `y-monaco` with MonacoWrapper for synchronized editing
4. Add cursor/selection awareness decorations
5. Implement user presence (avatars, cursors, status)
6. Add conflict resolution UI
7. Wire into existing `CollabPanel.tsx` (replace mock data)

---

#### F3.2 Project Export & Deployment

| Attribute | Detail |
|-----------|--------|
| **Priority** | P1 (High) |
| **Value** | Ship generated code to production |
| **Effort** | 2 weeks |
| **Dependencies** | F1.1 |

**User Stories**:
- As a user, I want to download my project as a ZIP
- As a user, I want to deploy to Vercel/Netlify with one click
- As a user, I want to push to GitHub

**Technical Design**:
```
Export Options:
    +-> ZIP download (jszip)
    +-> GitHub push (GitHub API + OAuth)
    +-> Vercel deploy (Vercel API)
    +-> Netlify deploy (Netlify API)
    +-> Docker export (Dockerfile generation)
```

**Implementation Path**:
1. Install `jszip`, `file-saver`
2. Create `ProjectExporter.ts` — generates ZIP from FileStore
3. Add `package.json`, `tsconfig.json`, `vite.config.ts` auto-generation
4. Create `DeployPanel.tsx` — deployment wizard
5. Integrate GitHub OAuth for repository creation/push
6. Integrate Vercel/Netlify deploy APIs

---

### 2.5 Wave 4: Ecosystem (Weeks 15-20)

#### F4.1 Plugin System

| Attribute | Detail |
|-----------|--------|
| **Priority** | P2 (Medium) |
| **Value** | Extensibility, community contributions |
| **Effort** | 4 weeks |

**Technical Design**:
```typescript
interface YYC3Plugin {
  id: string
  name: string
  version: string
  // Lifecycle hooks
  onActivate: (api: PluginAPI) => void
  onDeactivate: () => void
}

interface PluginAPI {
  // Panel registration
  registerPanel: (panel: PanelDefinition) => void
  // Command registration
  registerCommand: (command: CommandDefinition) => void
  // Menu items
  registerMenuItem: (item: MenuItemDefinition) => void
  // File system access
  files: FileSystemAPI
  // AI access
  ai: AIAPI
  // Event bus
  events: EventBusAPI
  // UI primitives
  ui: UIAPI
}
```

---

#### F4.2 Template Marketplace

| Attribute | Detail |
|-----------|--------|
| **Priority** | P2 (Medium) |
| **Value** | Faster project bootstrapping, community sharing |
| **Effort** | 2 weeks |
| **Dependencies** | Supabase (template storage) |

**Implementation Path**:
1. Define `TemplateManifest` schema (name, description, files, dependencies, preview)
2. Create template upload/download API (Supabase Storage + Postgres)
3. Extend `TemplatesPage.tsx` with real data from backend
4. Add "Save as Template" action from IDE
5. Add ratings, downloads, categories

---

#### F4.3 MCP (Model Context Protocol) Integration

| Attribute | Detail |
|-----------|--------|
| **Priority** | P1 (High) |
| **Value** | Connect AI to external tools (databases, APIs, files) |
| **Effort** | 3 weeks |
| **Dependencies** | F2.1 (AI pipeline) |

**Technical Design**:
```
LLM Response with tool_call
    |
    v
MCP Router
    +-> Built-in tools: file_read, file_write, terminal_exec, web_search
    +-> External tools: database_query, api_call, image_gen
    +-> Custom tools: user-defined via plugin API
    |
    v
Tool Execution
    |
    v
Result fed back to LLM
    |
    v
Continue generation
```

**Implementation Path**:
1. Define `MCPTool` interface and `MCPToolRegistry`
2. Implement built-in tools (file_read, file_write, web_search)
3. Add tool_call parsing to LLM response handler
4. Create tool execution sandbox
5. Add tool result display in chat UI
6. Extend ModelSettings MCP tab with tool management

---

### 2.6 Wave 5: Enterprise (Weeks 21-28)

#### F5.1 Team & Project Management

- Multi-user workspaces
- Role-based access control (owner/admin/editor/viewer)
- Project activity log and audit trail
- Team billing and usage tracking

#### F5.2 Analytics & Insights

- AI usage analytics (tokens, latency, costs)
- Code generation quality metrics
- User behavior analytics
- Project complexity metrics

#### F5.3 Self-Hosting & Enterprise Deployment

- Docker Compose deployment
- Environment variable configuration
- SSO integration (SAML/OIDC)
- Private LLM endpoint support (already partially supported via Ollama)

---

## Part III: Implementation Roadmap

### 3.1 Timeline Overview

```
Week  1-2:  F1.1 File Persistence (IndexedDB)
Week  2-4:  F1.2 Live Preview (Sandpack)
Week  3-4:  F1.3 Enhanced Terminal (xterm.js)
Week  5-7:  F2.1 AI Code Generation Pipeline
Week  7-8:  F2.2 Inline Code Actions
Week  8:    F2.3 Smart Error Diagnosis
Week  9-12: F3.1 Real-time Collaboration
Week 11-12: F3.2 Project Export & Deploy
Week 13-15: F4.1 Plugin System
Week 14-15: F4.2 Template Marketplace
Week 15-17: F4.3 MCP Integration
Week 18-20: F5.1 Team Management
Week 21-24: F5.2 Analytics + F5.3 Self-hosting
```

### 3.2 Priority Matrix

```
                    High Value
                       |
         F2.1 AI Gen   |   F1.2 Preview
         F2.2 Inline   |   F1.1 Persistence
                       |   F1.3 Terminal
    ───────────────────+───────────────────
                       |   F3.2 Deploy
         F4.3 MCP      |   F2.3 Error Diag
         F4.1 Plugins   |   F4.2 Templates
                       |
                    Low Value
         High Effort       Low Effort
```

### 3.3 Milestone Definitions

| Milestone | Target | Deliverables | Success Criteria |
|-----------|--------|-------------|------------------|
| **M1: Usable IDE** | Week 4 | File persistence + Live preview + Terminal | User can write code, see preview, files survive refresh |
| **M2: AI-Powered** | Week 8 | Code generation + Inline actions + Error diagnosis | User can describe app -> get working code -> iterate |
| **M3: Collaborative** | Week 14 | Real-time collab + Deploy + Export | Multi-user editing, one-click deploy to Vercel |
| **M4: Ecosystem** | Week 20 | Plugins + Templates + MCP | Community can extend IDE, share templates |
| **M5: Enterprise** | Week 28 | Teams + Analytics + Self-hosting | Enterprise deployment with SSO and audit |

---

## Part IV: Technical Architecture Evolution

### 4.1 Architecture Migration Path

```
Current (MVP):
    React Context + Zustand (local state)
    In-memory file system
    Direct LLM API calls
    No persistence
    
M1 Target:
    Zustand + persist middleware (IndexedDB)
    Sandpack preview engine
    xterm.js terminal
    
M2 Target:
    AI pipeline (ContextCollector -> SystemPrompt -> LLM -> CodeApplicator)
    Monaco inline actions
    Error diagnosis loop
    
M3 Target:
    Yjs CRDT + WebSocket (collab)
    Supabase (auth + storage + realtime)
    Deploy integrations (Vercel/Netlify API)
    
M4 Target:
    Plugin system (dynamic module loading)
    MCP tool registry
    Template marketplace (Supabase)
    
M5 Target:
    Multi-tenant architecture
    RBAC + SSO
    Usage metering
    Self-hosting (Docker)
```

### 4.2 Directory Structure Evolution

```
src/app/components/ide/
    |-- ai/                      # NEW: AI pipeline
    |   |-- ContextCollector.ts
    |   |-- SystemPromptBuilder.ts
    |   |-- CodeApplicator.ts
    |   |-- VerificationLoop.ts
    |   |-- InlinePromptBar.tsx
    |   |-- DiffRenderer.ts
    |   +-- ErrorDiagnosis.ts
    |
    |-- adapters/                # NEW: Storage adapters
    |   |-- FileSystemAdapter.ts
    |   |-- IndexedDBAdapter.ts
    |   +-- SupabaseAdapter.ts
    |
    |-- preview/                 # NEW: Preview engine
    |   |-- PreviewPanel.tsx
    |   |-- PreviewBridge.ts
    |   +-- ErrorOverlay.tsx
    |
    |-- collab/                  # NEW: Collaboration
    |   |-- CollabProvider.tsx
    |   |-- CursorAwareness.tsx
    |   +-- ConflictResolver.tsx
    |
    |-- plugins/                 # NEW: Plugin system
    |   |-- PluginHost.tsx
    |   |-- PluginAPI.ts
    |   +-- PluginRegistry.ts
    |
    |-- mcp/                     # NEW: MCP tools
    |   |-- MCPToolRegistry.ts
    |   |-- MCPRouter.ts
    |   +-- built-in/
    |       |-- FileTools.ts
    |       |-- WebSearchTool.ts
    |       +-- TerminalTool.ts
    |
    |-- deploy/                  # NEW: Deployment
    |   |-- DeployPanel.tsx
    |   |-- ProjectExporter.ts
    |   |-- VercelDeploy.ts
    |   +-- GitHubPush.ts
    |
    |-- constants/               # Existing
    |-- hooks/                   # Existing
    |-- stores/                  # Existing (extend)
    +-- ... (existing files)
```

### 4.3 New Package Dependencies (by Wave)

**Wave 1**:
- `idb` (IndexedDB wrapper)
- `@codesandbox/sandpack-react` (live preview)
- `xterm` + `xterm-addon-fit` + `xterm-addon-web-links` (terminal)
- `jszip` + `file-saver` (export)

**Wave 2**:
- No new packages (uses existing Monaco + LLM)

**Wave 3**:
- `yjs` + `y-websocket` + `y-monaco` (CRDT collab)
- `@supabase/supabase-js` (if using Supabase)

**Wave 4**:
- `@anthropic-ai/sdk` or custom MCP client

**Wave 5**:
- Enterprise auth libraries (TBD)

### 4.4 State Management Evolution

```
Current:
    FileStore (Context)  -----> useFileStoreZustand (Zustand)
    ModelRegistry (Context) --> useModelStoreZustand (Zustand)
    ProxyService (module) ----> useProxyStoreZustand (Zustand)
    PanelManager (Context)
    WorkflowEventBus (Context)
    ThemeStore (Context)
    ChatHistoryStore (module)

Target (M2):
    All stores -> Zustand with persist middleware
    New stores:
        useAISessionStore   -> AI chat sessions + context
        usePreviewStore     -> Preview state, build status, errors
        useDeployStore      -> Deployment configs and history
    
    Provider nesting (simplified):
        DndProvider
            > ThemeProvider (CSS variables only)
                > StoreProvider (single Zustand store provider)
                    > EventBusProvider
                        > App
```

---

## Part V: Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Sandpack bundle size too large (~2MB) | Medium | Medium | Tree-shake, lazy-load preview panel |
| LLM API costs for code generation | High | High | Token usage tracking, rate limiting, local model fallback |
| CRDT complexity for real-time collab | Medium | High | Start with simple conflict resolution, use battle-tested yjs |
| Monaco editor performance with large files | Low | Medium | Virtual document, file size limits |
| IndexedDB storage limits (~50MB-2GB varies) | Low | Medium | LRU eviction, cloud sync for large projects |
| Plugin system security (arbitrary code) | Medium | High | Sandboxed execution, CSP, code review for marketplace |
| Token system migration breaking existing styles | Low | Low | Gradual migration, visual regression tests |

---

## Part VI: Quality Assurance Plan

### 6.1 Testing Strategy

| Layer | Tool | Coverage Target | Notes |
|-------|------|----------------|-------|
| **Unit** | Vitest | 80% for stores/services | Already 10 test files |
| **Component** | Testing Library | 60% for UI components | Add snapshot tests |
| **Integration** | Vitest + MSW | Key flows (AI gen, file ops) | Mock LLM responses |
| **E2E** | Playwright | Critical paths (5-10 flows) | Add in Wave 2 |
| **Visual Regression** | Storybook + Chromatic | All theme variants | Add in Wave 2 |

### 6.2 Performance Budgets

| Metric | Target | Current (est.) |
|--------|--------|----------------|
| First Contentful Paint | < 1.5s | ~2s |
| Largest Contentful Paint | < 2.5s | ~3.5s |
| Time to Interactive | < 3s | ~4s |
| Bundle size (initial) | < 500KB gzipped | ~800KB |
| Monaco load time | < 1s (lazy) | ~1.5s |
| Preview rebuild time | < 500ms | N/A |

### 6.3 Immediate Technical Debt

| Item | Effort | Priority |
|------|--------|----------|
| Complete `isCyber` -> token migration (AIChatPage, NotificationDrawer) | 2 days | P2 |
| Eliminate `APIKeySettings.tsx` wrapper | 30 min | P3 |
| Run `tsc --noEmit` and fix type errors | 1 day | P1 |
| Run `vitest run` and fix failing tests | 1 day | P1 |
| Standardize comment style | 2 hours | P3 |
| Document z-index layering in constants | 1 hour | P3 |
| Add error boundaries to all panel components | 1 day | P2 |

---

## Part VII: Competitive Analysis

| Feature | YYC3 (Current) | Cursor | Bolt.new | v0.dev | Windsurf |
|---------|---------------|--------|----------|--------|----------|
| Multi-panel IDE layout | Yes (DnD) | Yes (fixed) | No | No | Yes |
| AI code generation | Partial | Yes | Yes | Yes | Yes |
| Live preview | No | No | Yes | Yes | No |
| Multi-LLM support | Yes (6 providers) | Partial (3) | No (1) | No (1) | Partial (2) |
| Local model support | Yes (Ollama) | No | No | No | No |
| Real-time collab | No | No | No | No | No |
| Agent workflows | Prototype | No | No | No | No |
| Knowledge base / RAG | Prototype | No | No | No | No |
| Theme customization | Yes (advanced) | Minimal | No | No | Minimal |
| Plugin system | No | Yes | No | No | No |
| Self-hosting | Planned | No | No | No | No |

**YYC3 Differentiators**:
1. **Multi-LLM + Local Model**: Only platform supporting 6 cloud providers + Ollama local
2. **Multi-panel DnD Layout**: Most flexible IDE layout system
3. **Agent Orchestrator**: Visual agent workflow builder (unique)
4. **Knowledge Base / RAG**: Built-in RAG pipeline (unique)
5. **Advanced Theming**: OKLch + WCAG + custom themes (unique depth)

---

## Summary

This expansion plan transforms YYC3 from a **UI prototype with real LLM integration** into a **fully functional AI-powered IDE** through 5 progressive waves. The highest-priority items (Wave 1-2) focus on making the IDE actually usable: file persistence, live preview, and AI code generation pipeline. These 4 features alone would bring YYC3 to competitive parity with tools like Bolt.new while leveraging YYC3's unique multi-LLM and multi-panel architecture as differentiators.

**Recommended immediate next steps**:
1. Start F1.1 (File Persistence) — prerequisite for everything else
2. In parallel, prototype F1.2 (Sandpack Preview) in an isolated branch
3. Fix immediate tech debt (tsc, vitest, token migration)
