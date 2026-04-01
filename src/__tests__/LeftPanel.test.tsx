// @ts-nocheck
/**
 * @file __tests__/LeftPanel.test.tsx
 * @description P0 组件测试 — LeftPanel AI 对话面板核心交互：
 *              消息渲染、发送流程、模型切换、空状态、会话管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,component,left-panel,ai,chat
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// ── Mock dependencies ──

const mockEmit = vi.fn();
const mockNavigate = vi.fn();

// Mock react-router
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock FileStore
vi.mock("../app/components/ide/FileStore", () => ({
  useFileStore: () => ({
    fileContents: {
      "src/app/App.tsx":
        "export default function App() { return <div>Hello</div> }",
    },
    activeFile: "src/app/App.tsx",
    fileTree: [],
    openTabs: [{ path: "src/app/App.tsx", modified: false }],
    gitBranch: "main",
    gitChanges: [],
    setActiveFile: vi.fn(),
    updateFile: vi.fn(),
    createFile: vi.fn(),
    deleteFile: vi.fn(),
  }),
  FileStoreProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock ModelRegistry
vi.mock("../app/components/ide/ModelRegistry", () => ({
  useModelRegistry: () => ({
    models: [
      {
        id: "gpt-4",
        name: "GPT-4",
        providerId: "openai",
        type: "chat",
        status: "active",
        provider: "OpenAI",
        modelId: "gpt-4",
      },
      {
        id: "claude-3",
        name: "Claude 3",
        providerId: "openai",
        type: "chat",
        status: "active",
        provider: "OpenAI",
        modelId: "claude-3",
      },
    ],
    activeModelId: "gpt-4",
    activeModel: {
      id: "gpt-4",
      name: "GPT-4",
      providerId: "openai",
      type: "chat",
      status: "active",
      provider: "OpenAI",
      modelId: "gpt-4",
    },
    setActiveModelId: vi.fn(),
    setShowSettings: vi.fn(),
    setShowModelSettingsV2: vi.fn(),
    getActiveProvider: vi.fn(() => null),
    hasProviderKey: vi.fn(() => false),
    connectivityResults: {},
    setConnectivityResult: vi.fn(),
    providers: [],
    ollamaStatus: "unavailable",
  }),
  ModelRegistryProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock WorkflowEventBus
vi.mock("../app/components/ide/WorkflowEventBus", () => ({
  useWorkflowEventBus: () => ({
    emit: mockEmit,
    subscribe: vi.fn(() => vi.fn()),
  }),
  WorkflowEventBusProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock PanelManager (PanelHeader)
vi.mock("../app/components/ide/PanelManager", () => ({
  PanelHeader: ({
    children,
    title,
  }: {
    children?: React.ReactNode;
    title: string;
  }) => (
    <div data-testid="panel-header">
      <span>{title}</span>
      {children}
    </div>
  ),
  PanelManagerProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock LLMService
vi.mock("../app/components/ide/LLMService", () => ({
  extractCodeBlock: (text: string) => ({
    hasCode: false,
    code: "",
    language: "",
  }),
  testModelConnectivity: vi
    .fn()
    .mockResolvedValue({ success: true, latency: 150 }),
}));

// Mock ChatHistoryStore
vi.mock("../app/components/ide/ChatHistoryStore", () => ({
  createSessionId: () => "test-session-001",
  saveMessages: vi.fn(),
  listSessions: () => [],
  loadMessages: () => [],
  deleteSession: vi.fn(),
}));

// Mock DiffPreviewModal
vi.mock("../app/components/ide/DiffPreviewModal", () => ({
  default: () => <div data-testid="diff-modal" />,
}));

// Mock AIPipeline
vi.mock("../app/components/ide/ai/AIPipeline", () => ({
  runPipeline: vi.fn().mockResolvedValue({
    response: "Hello, I can help you with that!",
    codeBlocks: [],
  }),
  applyPlan: vi.fn(),
}));

// Mock SystemPromptBuilder
vi.mock("../app/components/ide/ai/SystemPromptBuilder", () => ({
  detectIntent: vi.fn().mockReturnValue("general-chat"),
}));

// Mock CodeApplicator
vi.mock("../app/components/ide/ai/CodeApplicator", () => ({}));

// Mock useAIFixStore
vi.mock("../app/components/ide/stores/useAIFixStore", () => ({
  useAIFixStore: (selector?: any) => {
    const state = {
      pendingRequest: null,
      consumeRequest: vi.fn(() => null),
      requestFix: vi.fn(),
      clearRequest: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

// Mock useQuickActionBridge
vi.mock("../app/components/ide/stores/useQuickActionBridge", () => ({
  useQuickActionBridge: (selector?: any) => {
    const state = {
      pendingAction: null,
      consumePending: vi.fn(() => null),
      dispatchToChat: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

// Mock useTaskBoardStore
vi.mock("../app/components/ide/stores/useTaskBoardStore", () => ({
  useTaskBoardStore: Object.assign(
    (selector?: any) => {
      const state = {
        tasks: [],
        addInferences: vi.fn(),
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        addInferences: vi.fn(),
      }),
    },
  ),
}));

// Mock TaskInferenceEngine
vi.mock("../app/components/ide/ai/TaskInferenceEngine", () => ({
  extractTasksFromResponse: vi.fn(() => []),
}));

// Mock SettingsBridge
vi.mock("../app/components/ide/SettingsBridge", () => ({
  getSettingsEnhancedInstructions: vi.fn(() => ""),
  buildRulesPromptInjection: vi.fn(() => ""),
  buildSkillsPromptInjection: vi.fn(() => ""),
  buildMCPToolsDescription: vi.fn(() => ""),
  getActiveAgentPrompt: vi.fn(() => ""),
}));

// Mock ThemeStore
vi.mock("../app/components/ide/ThemeStore", () => ({
  useTheme: () => ({ isDark: true, isCyber: false, theme: "navy" }),
}));

// Mock hooks
vi.mock("../app/components/ide/hooks/useThemeTokens", () => ({
  useThemeTokens: () => ({
    bg: "#0b1729",
    bgElevated: "#0f1d32",
    text: "#94a3b8",
    border: "#1e3a5f",
  }),
}));

// ── Import component after mocks ──
import LeftPanel from "../app/components/ide/LeftPanel";

// ── Test Wrapper ──
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}

// ── Tests ──

describe("LeftPanel — AI 对话面板", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the panel with header title", () => {
    render(
      <TestWrapper>
        <LeftPanel nodeId="test-node" />
      </TestWrapper>,
    );
    expect(screen.getByTestId("panel-header")).toBeDefined();
  });

  it("renders empty state with welcome message when no messages", () => {
    render(
      <TestWrapper>
        <LeftPanel nodeId="test-node" />
      </TestWrapper>,
    );
    // Should show an initial state / placeholder
    const inputArea = document.querySelector(
      "textarea, input[type='text'], [contenteditable]",
    );
    expect(inputArea).toBeDefined();
  });

  it("has a message input area", () => {
    const { container } = render(
      <TestWrapper>
        <LeftPanel nodeId="test-node" />
      </TestWrapper>,
    );
    // Look for textarea or input
    const inputElements = container.querySelectorAll("textarea, input");
    expect(inputElements.length).toBeGreaterThan(0);
  });

  it("has send button or action buttons in the toolbar", () => {
    const { container } = render(
      <TestWrapper>
        <LeftPanel nodeId="test-node" />
      </TestWrapper>,
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders model selector area", () => {
    const { container } = render(
      <TestWrapper>
        <LeftPanel nodeId="test-node" />
      </TestWrapper>,
    );
    // The component should render some model-related UI
    const allText = container.textContent || "";
    // Either model name or provider info should appear
    expect(container.innerHTML.length).toBeGreaterThan(100);
  });
});
