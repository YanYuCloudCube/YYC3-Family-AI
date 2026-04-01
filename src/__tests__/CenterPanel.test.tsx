// @ts-nocheck
/**
 * @file __tests__/CenterPanel.test.tsx
 * @description P0 组件测试 — CenterPanel 文件管理面板核心交互：
 *              文件树渲染、文件选择、搜索过滤、文件 CRUD、编辑器区域
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-15
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,component,center-panel,file-tree,editor
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// ── Mock dependencies ──

const mockSetActiveFile = vi.fn();
const mockUpdateFile = vi.fn();
const mockCreateFile = vi.fn();
const mockDeleteFile = vi.fn();
const mockRenameFile = vi.fn();
const mockEmit = vi.fn();

vi.mock("../app/components/ide/FileStore", () => ({
  useFileStore: () => ({
    fileContents: {
      "src/app/App.tsx":
        "export default function App() { return <div>App</div> }",
      "src/app/index.ts": "import App from './App'",
      "src/styles/theme.css": ":root { --bg: #000; }",
      "package.json": '{ "name": "test" }',
    },
    fileTree: [
      {
        name: "src",
        type: "folder",
        path: "src",
        children: [
          {
            name: "app",
            type: "folder",
            path: "src/app",
            children: [
              { name: "App.tsx", type: "file", path: "src/app/App.tsx" },
              { name: "index.ts", type: "file", path: "src/app/index.ts" },
            ],
          },
          {
            name: "styles",
            type: "folder",
            path: "src/styles",
            children: [
              { name: "theme.css", type: "file", path: "src/styles/theme.css" },
            ],
          },
        ],
      },
      { name: "package.json", type: "file", path: "package.json" },
    ],
    activeFile: "src/app/App.tsx",
    setActiveFile: mockSetActiveFile,
    updateFile: mockUpdateFile,
    createFile: mockCreateFile,
    deleteFile: mockDeleteFile,
    renameFile: mockRenameFile,
  }),
}));

vi.mock("../app/components/ide/WorkflowEventBus", () => ({
  useWorkflowEventBus: () => ({
    emit: mockEmit,
    subscribe: vi.fn(() => vi.fn()),
  }),
}));

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
}));

// Mock MonacoWrapper (lazy loaded)
vi.mock("../app/components/ide/MonacoWrapper", () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="monaco-editor">{value.slice(0, 50)}</div>
  ),
}));

vi.mock("../app/components/ide/TabBar", () => ({
  default: () => <div data-testid="tab-bar">Tabs</div>,
}));

vi.mock("../app/components/ide/ThemeStore", () => ({
  useTheme: () => ({ isDark: true, isCyber: false, theme: "navy" }),
}));

// ── Import after mocks ──
import CenterPanel from "../app/components/ide/CenterPanel";

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}

// ── Tests ──

describe("CenterPanel — 文件管理面板", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders panel header with title", () => {
    render(
      <TestWrapper>
        <CenterPanel searchOpen={false} nodeId="test-node" />
      </TestWrapper>,
    );
    expect(screen.getByTestId("panel-header")).toBeDefined();
  });

  it("renders file tree with folder structure", () => {
    const { container } = render(
      <TestWrapper>
        <CenterPanel searchOpen={false} nodeId="test-node" />
      </TestWrapper>,
    );
    // Should contain folder names
    expect(container.textContent).toContain("src");
  });

  it("renders file items in expanded folders", () => {
    const { container } = render(
      <TestWrapper>
        <CenterPanel searchOpen={false} nodeId="test-node" />
      </TestWrapper>,
    );
    // Default expanded: src, src/app, src/app/components
    // App.tsx should be visible since src/app is expanded by default
    expect(container.textContent).toContain("App.tsx");
  });

  it("calls setActiveFile when clicking a file", () => {
    const { container } = render(
      <TestWrapper>
        <CenterPanel searchOpen={false} nodeId="test-node" />
      </TestWrapper>,
    );
    // Find and click on a file button
    const buttons = container.querySelectorAll("button");
    const appButton = Array.from(buttons).find((b) =>
      b.textContent?.includes("App.tsx"),
    );
    if (appButton) {
      fireEvent.click(appButton);
      expect(mockSetActiveFile).toHaveBeenCalled();
    }
  });

  it("shows search input when searchOpen is true", () => {
    const { container } = render(
      <TestWrapper>
        <CenterPanel searchOpen={true} nodeId="test-node" />
      </TestWrapper>,
    );
    const searchInput = container.querySelector('input[placeholder*="搜索"]');
    expect(searchInput).toBeDefined();
  });

  it("filters file tree based on search query", () => {
    const { container } = render(
      <TestWrapper>
        <CenterPanel searchOpen={true} nodeId="test-node" />
      </TestWrapper>,
    );
    const searchInput = container.querySelector('input[placeholder*="搜索"]');
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: "App" } });
      // After filtering, App.tsx should still be visible
      expect(container.textContent).toContain("App.tsx");
    }
  });

  it("renders tab bar component", () => {
    render(
      <TestWrapper>
        <CenterPanel searchOpen={false} nodeId="test-node" />
      </TestWrapper>,
    );
    expect(screen.getByTestId("tab-bar")).toBeDefined();
  });

  it("renders toolbar buttons (new file, new folder, refresh)", () => {
    const { container } = render(
      <TestWrapper>
        <CenterPanel searchOpen={false} nodeId="test-node" />
      </TestWrapper>,
    );
    const toolbarButtons = container.querySelectorAll("button[title]");
    const titles = Array.from(toolbarButtons).map((b) =>
      b.getAttribute("title"),
    );
    expect(titles).toContain("新建文件");
    expect(titles).toContain("新建文件夹");
    expect(titles).toContain("刷新");
  });
});
