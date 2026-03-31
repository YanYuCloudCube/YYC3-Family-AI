/**
 * @file __tests__/ZustandOptimization.test.tsx
 * @description Zustand Store 订阅优化性能测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-30
 * @updated 2026-03-30
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags tests,zustand,performance,optimization
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { useFileStoreZustand } from "../app/components/ide/stores/useFileStoreZustand";
import { useSettingsStore } from "../app/components/ide/stores/useSettingsStore";
import {
  useFileContent,
  useActiveFilePath,
  useOpenTabs,
  useGitState,
  useGeneralSettings,
  useAgents,
  useThemeSettings,
} from "../app/components/ide/stores/optimizedHooks";

// ===== 测试工具 =====

/**
 * 重渲染计数器 Hook
 */
function useRenderCounter() {
  const countRef = React.useRef(0);
  React.useEffect(() => {
    countRef.current += 1;
  });
  return countRef.current + 1; // 初始渲染计为1
}

/**
 * 创建测试组件
 */
function createTestComponent(
  useHook: () => unknown,
  displayName: string,
): React.FC {
  const Component = () => {
    const data = useHook();
    const renderCount = useRenderCounter();
    return (
      <div data-testid={displayName}>
        <span data-testid="render-count">{renderCount}</span>
        <span data-testid="data">{JSON.stringify(data)}</span>
      </div>
    );
  };
  Component.displayName = displayName;
  return Component;
}

// ===== File Store 优化测试 =====

describe("File Store 订阅优化测试", () => {
  beforeEach(() => {
    // 重置 store 状态
    useFileStoreZustand.setState({
      fileContents: {
        "src/app/App.tsx": "// App",
        "src/app/main.tsx": "// Main",
      },
      openTabs: [{ path: "src/app/App.tsx", modified: false }],
      activeFile: "src/app/App.tsx",
      gitBranch: "main",
      gitChanges: [],
      gitLog: [],
    });
  });

  it("优化Hook应该减少重渲染次数", () => {
    // 测试优化后的 Hook
    const OptimizedComponent = createTestComponent(
      useActiveFilePath,
      "optimized",
    );
    const { unmount: unmountOptimized } = render(<OptimizedComponent />);

    // 初始渲染
    expect(screen.getByTestId("optimized").querySelector('[data-testid="render-count"]')?.textContent).toBe("1");

    // 更新无关状态（fileContents）
    act(() => {
      useFileStoreZustand.getState().updateFile("src/app/main.tsx", "// Updated Main");
    });

    // 优化组件不应该重渲染
    expect(screen.getByTestId("optimized").querySelector('[data-testid="render-count"]')?.textContent).toBe("1");

    unmountOptimized();
  });

  it("useFileContent 应该只在特定文件变化时重渲染", () => {
    const useFileContentHook = () => useFileContent("src/app/App.tsx");
    const TestComponent = createTestComponent(useFileContentHook, "file-content");
    render(<TestComponent />);

    // 初始渲染
    expect(screen.getByTestId("file-content").querySelector('[data-testid="render-count"]')?.textContent).toBe("1");

    // 更新其他文件（不应该重渲染）
    act(() => {
      useFileStoreZustand.getState().updateFile("src/app/main.tsx", "// Updated");
    });
    expect(screen.getByTestId("file-content").querySelector('[data-testid="render-count"]')?.textContent).toBe("1");

    // 更新目标文件（应该重渲染）
    act(() => {
      useFileStoreZustand.getState().updateFile("src/app/App.tsx", "// Updated App");
    });
    expect(screen.getByTestId("file-content").querySelector('[data-testid="render-count"]')?.textContent).toBe("2");
  });

  it("useOpenTabs 应该只在标签页变化时重渲染", () => {
    const TestComponent = createTestComponent(useOpenTabs, "open-tabs");
    render(<TestComponent />);

    // 初始渲染
    expect(screen.getByTestId("open-tabs").querySelector('[data-testid="render-count"]')?.textContent).toBe("1");

    // 打开新文件（应该重渲染）
    act(() => {
      useFileStoreZustand.getState().openFile("src/app/main.tsx");
    });
    expect(screen.getByTestId("open-tabs").querySelector('[data-testid="render-count"]')?.textContent).toBe("2");
  });
});

// ===== Settings Store 优化测试 =====

describe("Settings Store 订阅优化测试", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: {
        userProfile: {
          id: "1",
          username: "test",
          email: "test@example.com",
        },
        general: {
          theme: "dark",
          language: "zh-CN",
          editorFont: "Fira Code",
          editorFontSize: 14,
          wordWrap: true,
          keybindingScheme: "vscode",
          customKeybindings: {},
          localLinkOpenMode: "system",
          markdownOpenMode: "preview",
          nodeVersion: "20.11.0",
        },
        agents: [
          {
            id: "agent-1",
            name: "Test Agent",
            systemPrompt: "You are a test agent",
            model: "gpt-4",
            temperature: 0.7,
            maxTokens: 4096,
            isBuiltIn: false,
            isCustom: true,
          },
        ],
        mcpConfigs: [],
        models: [],
        context: {
          indexStatus: "idle",
          ignoreRules: [],
          documentSets: [],
        },
        conversation: {
          useTodoList: true,
          autoCollapseNodes: false,
          autoFixCodeIssues: true,
          agentProactiveQuestion: false,
          codeReviewScope: "all",
          jumpAfterReview: true,
          autoRunMCP: false,
          commandRunMode: "sandbox",
          whitelistCommands: [],
          notificationTypes: ["banner"],
          volume: 50,
          soundConfig: {
            complete: "default",
            waiting: "default",
            interrupt: "default",
          },
        },
        rules: [],
        skills: [],
        importSettings: {
          includeAgentsMD: true,
          includeClaudeMD: false,
        },
      },
    });
  });

  it("useGeneralSettings 应该只在通用设置变化时重渲染", () => {
    const TestComponent = createTestComponent(
      useGeneralSettings,
      "general-settings",
    );
    render(<TestComponent />);

    // 初始渲染
    expect(screen.getByTestId("general-settings").querySelector('[data-testid="render-count"]')?.textContent).toBe("1");

    // 更新无关状态（userProfile）
    act(() => {
      useSettingsStore.getState().updateUserProfile({ username: "new-user" });
    });
    expect(screen.getByTestId("general-settings").querySelector('[data-testid="render-count"]')?.textContent).toBe("1");

    // 更新通用设置（应该重渲染）
    act(() => {
      useSettingsStore.getState().updateGeneralSettings({ theme: "light" });
    });
    expect(screen.getByTestId("general-settings").querySelector('[data-testid="render-count"]')?.textContent).toBe("2");
  });

  it("useThemeSettings 应该只订阅主题相关设置", () => {
    const TestComponent = createTestComponent(
      useThemeSettings,
      "theme-settings",
    );
    render(<TestComponent />);

    // 初始渲染
    expect(screen.getByTestId("theme-settings").querySelector('[data-testid="render-count"]')?.textContent).toBe("1");

    // 更新主题设置（应该重渲染）
    act(() => {
      useSettingsStore.getState().updateGeneralSettings({ theme: "light" });
    });
    expect(screen.getByTestId("theme-settings").querySelector('[data-testid="render-count"]')?.textContent).toBe("2");
  });

  it("useAgents 应该只在代理列表变化时重渲染", () => {
    const TestComponent = createTestComponent(useAgents, "agents");
    render(<TestComponent />);

    // 初始渲染
    expect(screen.getByTestId("agents").querySelector('[data-testid="render-count"]')?.textContent).toBe("1");

    // 更新无关设置
    act(() => {
      useSettingsStore.getState().updateGeneralSettings({ theme: "light" });
    });
    expect(screen.getByTestId("agents").querySelector('[data-testid="render-count"]')?.textContent).toBe("1");

    // 添加代理（应该重渲染）
    act(() => {
      useSettingsStore.getState().addAgent({
        name: "New Agent",
        systemPrompt: "Test",
        model: "gpt-3.5",
        temperature: 0.5,
        maxTokens: 2048,
        isBuiltIn: false,
        isCustom: true,
      });
    });
    expect(screen.getByTestId("agents").querySelector('[data-testid="render-count"]')?.textContent).toBe("2");
  });
});

// ===== 性能基准测试 =====

describe("性能基准测试", () => {
  it("优化后的订阅应该在 100 次状态更新中减少至少 30% 的重渲染", () => {
    // 测试传统方式
    const TraditionalComponent = () => {
      const state = useFileStoreZustand();
      const renderCount = useRenderCounter();
      return <div data-testid="traditional-count">{renderCount}</div>;
    };
    const { unmount: unmountTraditional } = render(<TraditionalComponent />);
    const traditionalInitial = parseInt(
      screen.getByTestId("traditional-count").textContent || "0",
    );

    // 执行 100 次无关状态更新
    for (let i = 0; i < 100; i++) {
      act(() => {
        useFileStoreZustand.setState({
          gitBranch: `branch-${i}`,
        });
      });
    }

    const traditionalFinal = parseInt(
      screen.getByTestId("traditional-count").textContent || "0",
    );
    const traditionalRerenders = traditionalFinal - traditionalInitial;
    unmountTraditional();

    // 测试优化方式
    const OptimizedComponent = createTestComponent(
      useActiveFilePath,
      "optimized-perf",
    );
    render(<OptimizedComponent />);
    const optimizedInitial = parseInt(
      screen.getByTestId("optimized-perf").querySelector('[data-testid="render-count"]')?.textContent || "0",
    );

    // 执行相同的 100 次更新
    for (let i = 0; i < 100; i++) {
      act(() => {
        useFileStoreZustand.setState({
          gitBranch: `branch-${i}`,
        });
      });
    }

    const optimizedFinal = parseInt(
      screen.getByTestId("optimized-perf").querySelector('[data-testid="render-count"]')?.textContent || "0",
    );
    const optimizedRerenders = optimizedFinal - optimizedInitial;

    // 验证优化效果（至少减少 30%）
    const improvement =
      ((traditionalRerenders - optimizedRerenders) / traditionalRerenders) *
      100;
    console.log(
      `重渲染减少: ${improvement.toFixed(1)}% (传统: ${traditionalRerenders}, 优化: ${optimizedRerenders})`,
    );
    expect(improvement).toBeGreaterThanOrEqual(30);
  });

  it("大量数据场景下应该显著减少重渲染", () => {
    // 准备大量文件数据
    const largeFileContents: Record<string, string> = {};
    for (let i = 0; i < 1000; i++) {
      largeFileContents[`src/file-${i}.tsx`] = `// File ${i}`;
    }

    act(() => {
      useFileStoreZustand.setState({ fileContents: largeFileContents });
    });

    // 测试单文件订阅
    const useSingleFileHook = () => useFileContent("src/file-0.tsx");
    const TestComponent = createTestComponent(
      useSingleFileHook,
      "single-file",
    );
    render(<TestComponent />);

    const initialCount = parseInt(
      screen.getByTestId("single-file").querySelector('[data-testid="render-count"]')?.textContent || "0",
    );

    // 更新其他 999 个文件
    for (let i = 1; i < 1000; i++) {
      act(() => {
        useFileStoreZustand
          .getState()
          .updateFile(`src/file-${i}.tsx`, `// Updated File ${i}`);
      });
    }

    const finalCount = parseInt(
      screen.getByTestId("single-file").querySelector('[data-testid="render-count"]')?.textContent || "0",
    );

    // 应该只渲染初始那一次，999 次无关更新不应该触发重渲染
    expect(finalCount - initialCount).toBe(0);
  });
});

// ===== 边界情况测试 =====

describe("边界情况测试", () => {
  it("不存在的文件路径应该返回 undefined", () => {
    const useNonExistentHook = () => useFileContent("non-existent.ts");
    const TestComponent = createTestComponent(
      useNonExistentHook,
      "non-existent",
    );
    render(<TestComponent />);

    const dataText = screen.getByTestId("non-existent").querySelector('[data-testid="data"]')?.textContent;
    // JSON.stringify(undefined) 返回空字符串或undefined
    expect(dataText).toMatch(/^(|undefined)$/);
  });

  it("空数组应该正确处理", () => {
    useFileStoreZustand.setState({ openTabs: [] });
    const TestComponent = createTestComponent(useOpenTabs, "empty-tabs");
    render(<TestComponent />);

    const dataText = screen.getByTestId("empty-tabs").querySelector('[data-testid="data"]')?.textContent;
    expect(dataText).toContain("[]");
  });

});
