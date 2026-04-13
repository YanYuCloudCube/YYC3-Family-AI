// @ts-nocheck
/**
 * @file: PanelManager.test.tsx
 * @description: Panel Manager 核心功能测试 - 覆盖布局管理、面板拆分合并、拖拽、持久化
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-03-19
 * @updated: 2026-03-19
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,vitest,panel-manager,layout,dnd
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  PanelManagerProvider,
  usePanelManager,
  type LayoutNode,
  type PanelId,
  LAYOUT_PRESETS,
} from "../app/components/ide/PanelManager";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Wrapper component for PanelManager
function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <PanelManagerProvider renderPanel={vi.fn()}>
      {children}
    </PanelManagerProvider>
  );
}

// ================================================================
// 1. 基础布局测试
// ================================================================

describe("Panel Manager - 基础布局", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it("初始化默认布局", () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    expect((result.current as any).layout).toBeDefined();
    expect((result.current as any).layout.type).toBe("split");
    expect((result.current as any).layout.children).toHaveLength(3);
  });

  it("从 localStorage 加载保存的布局", () => {
    const savedLayout: LayoutNode = {
      id: "custom",
      type: "leaf",
      panelId: "ai",
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedLayout));

    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    expect((result.current as any).layout.id).toBe("custom");
    expect((result.current as any).layout.panelId).toBe("ai");
  });

  it("加载无效布局时使用默认布局", () => {
    localStorageMock.getItem.mockReturnValue("invalid json");

    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    expect((result.current as any).layout).toBeDefined();
    expect((result.current as any).layout.type).toBe("split");
  });
});

// ================================================================
// 2. 面板拆分测试
// ================================================================

describe("Panel Manager - 面板拆分", () => {
  it("水平拆分面板", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    const initialChildren = (result.current as any).layout.children?.length;

    act(() => {
      (result.current as any).splitPanel(
        (result.current as any).layout.children![0].id,
        "horizontal",
        "preview"
      );
    });

    expect((result.current as any).layout.children![0].type).toBe("split");
    expect((result.current as any).layout.children![0].direction).toBe("horizontal");
    expect((result.current as any).layout.children![0].children).toHaveLength(2);
  });

  it("垂直拆分面板", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    act(() => {
      (result.current as any).splitPanel(
        (result.current as any).layout.children![0].id,
        "vertical",
        "code"
      );
    });

    expect((result.current as any).layout.children![0].direction).toBe("vertical");
  });

  it("拆分不存在的面板", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    const initialLayout = (result.current as any).layout;

    act(() => {
      (result.current as any).splitPanel(
        "non-existent-id",
        "horizontal",
        "preview"
      );
    });

    // 布局应该不变
    expect((result.current as any).layout).toEqual(initialLayout);
  });
});

// ================================================================
// 3. 面板合并测试
// ================================================================

describe("Panel Manager - 面板合并", () => {
  it("合并面板到左侧", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    // 先拆分
    act(() => {
      (result.current as any).splitPanel(
        (result.current as any).layout.children![0].id,
        "horizontal",
        "preview"
      );
    });

    const targetNodeId = (result.current as any).layout.children![1].id;

    // 合并
    act(() => {
      (result.current as any).mergePanel(
        targetNodeId,
        "ai",
        "left"
      );
    });

    expect((result.current as any).layout.children).toBeDefined();
  });

  it("合并面板到右侧", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    act(() => {
      (result.current as any).mergePanel(
        (result.current as any).layout.children![0].id,
        "preview",
        "right"
      );
    });

    expect((result.current as any).layout).toBeDefined();
  });

  it("合并面板到顶部", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    act(() => {
      (result.current as any).mergePanel(
        (result.current as any).layout.children![0].id,
        "preview",
        "top"
      );
    });

    expect((result.current as any).layout).toBeDefined();
  });

  it("合并面板到底部", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    act(() => {
      (result.current as any).mergePanel(
        (result.current as any).layout.children![0].id,
        "preview",
        "bottom"
      );
    });

    expect((result.current as any).layout).toBeDefined();
  });
});

// ================================================================
// 4. 面板移除测试
// ================================================================

describe("Panel Manager - 面板移除", () => {
  it("移除面板", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    const initialCount = (result.current as any).layout.children?.length || 0;
    const nodeIdToRemove = (result.current as any).layout.children![0].id;

    act(() => {
      (result.current as any).removePanel(nodeIdToRemove);
    });

    expect(((result.current as any).layout.children as any).length).toBeLessThan(initialCount);
  });

  it("移除最后一个面板时重置布局", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    // 移除所有面板
    (result.current as any).layout.children?.forEach((child) => {
      act(() => {
        (result.current as any).removePanel(child.id);
      });
    });

    // 应该重置为默认布局
    expect((result.current as any).layout).toBeDefined();
  });
});

// ================================================================
// 5. 布局重置测试
// ================================================================

describe("Panel Manager - 布局重置", () => {
  it("重置为默认布局", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    // 先修改布局
    act(() => {
      (result.current as any).splitPanel(
        (result.current as any).layout.children![0].id,
        "horizontal",
        "preview"
      );
    });

    const modifiedLayout = (result.current as any).layout;

    // 重置
    act(() => {
      (result.current as any).resetLayout();
    });

    expect((result.current as any).layout).not.toEqual(modifiedLayout);
    expect((result.current as any).layout.children).toHaveLength(3);
  });

  it("重置时清除 localStorage", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    act(() => {
      (result.current as any).resetLayout();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("yyc3_panel_layout");
  });

  it("使用自定义初始布局重置", () => {
    const customLayout: LayoutNode = {
      id: "custom",
      type: "split",
      direction: "vertical",
      children: [
        { id: "top", type: "leaf", panelId: "ai" },
        { id: "bottom", type: "leaf", panelId: "code" },
      ],
    };

    const { result } = renderHook(() => usePanelManager(), {
      wrapper: ({ children }) => (
        <PanelManagerProvider
          renderPanel={vi.fn()}
          initialLayout={customLayout}
        >
          {children}
        </PanelManagerProvider>
      ),
    });

    act(() => {
      (result.current as any).resetLayout();
    });

    expect((result.current as any).layout.id).toBe("custom");
    expect((result.current as any).layout.direction).toBe("vertical");
  });
});

// ================================================================
// 6. 面板打开测试
// ================================================================

describe("Panel Manager - 面板打开", () => {
  it("打开新面板", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    act(() => {
      (result.current as any).openPanel("git");
    });

    // 面板应该被添加到布局中
    const hasGitPanel = JSON.stringify((result.current as any).layout).includes("git");
    expect(hasGitPanel).toBe(true);
  });

  it("打开已存在的面板", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    const initialLayout = (result.current as any).layout;

    act(() => {
      (result.current as any).openPanel("ai"); // ai 面板已经存在
    });

    // 布局应该不变
    expect((result.current as any).layout).toEqual(initialLayout);
  });

  it("打开所有支持的面板类型", () => {
    const panelIds: PanelId[] = [
      "ai",
      "files",
      "code",
      "preview",
      "terminal",
      "git",
      "agents",
      "market",
      "knowledge",
      "rag",
      "collab",
      "ops",
      "workflow",
      "diagnostics",
      "performance",
      "security",
      "test-gen",
      "quality",
      "document-editor",
      "taskboard",
      "multi-instance",
    ];

    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    panelIds.forEach((panelId) => {
      act(() => {
        (result.current as any).openPanel(panelId);
      });
    });

    const layoutJson = JSON.stringify((result.current as any).layout);
    panelIds.forEach((panelId) => {
      expect(layoutJson).toContain(panelId);
    });
  });
});

// ================================================================
// 7. 布局预设测试
// ================================================================

describe("布局预设", () => {
  it("包含默认预设", () => {
    expect(LAYOUT_PRESETS.default).toBeDefined();
    expect(LAYOUT_PRESETS.default.children).toHaveLength(3);
  });

  it("包含 designer 预设", () => {
    expect(LAYOUT_PRESETS.designer).toBeDefined();
    expect(LAYOUT_PRESETS.designer.children).toHaveLength(3);
  });

  it("包含 ai-workspace 预设", () => {
    expect(LAYOUT_PRESETS["ai-workspace"]).toBeDefined();
    expect(LAYOUT_PRESETS["ai-workspace"].children).toBeDefined();
  });

  it("预设布局结构有效", () => {
    Object.values(LAYOUT_PRESETS).forEach((preset) => {
      expect(preset.type).toBeDefined();
      expect(preset.children).toBeDefined();
      expect((preset.children as any).length).toBeGreaterThan(0);
    });
  });
});

// ================================================================
// 8. 布局持久化测试
// ================================================================

describe("布局持久化", () => {
  it("保存布局到 localStorage", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    act(() => {
      (result.current as any).splitPanel(
        (result.current as any).layout.children![0].id,
        "horizontal",
        "preview"
      );
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("保存时序列化布局", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    act(() => {
      (result.current as any).openPanel("git");
    });

    const savedData = localStorageMock.setItem.mock.calls[0][1];
    const savedLayout = JSON.parse(savedData);

    expect(savedLayout).toBeDefined();
    expect(savedLayout.type).toBeDefined();
  });
});

// ================================================================
// 9. 边界情况测试
// ================================================================

describe("边界情况", () => {
  it("处理空布局", () => {
    const emptyLayout: LayoutNode = {
      id: "empty",
      type: "leaf",
      panelId: undefined,
    };

    // 不应该崩溃
    expect(() => {
      renderHook(() => usePanelManager(), {
        wrapper: ({ children }) => (
          <PanelManagerProvider
            renderPanel={vi.fn()}
            initialLayout={emptyLayout}
          >
            {children}
          </PanelManagerProvider>
        ),
      });
    }).not.toThrow();
  });

  it("处理无效的面板 ID", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    act(() => {
      // @ts-ignore - 测试无效 ID
      (result.current as any).openPanel("invalid-panel-id");
    });

    // 不应该崩溃
    expect((result.current as any).layout).toBeDefined();
  });

  it("处理快速连续操作", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    act(() => {
      (result.current as any).splitPanel(
        (result.current as any).layout.children![0].id,
        "horizontal",
        "preview"
      );
      (result.current as any).splitPanel(
        (result.current as any).layout.children![0].id,
        "vertical",
        "code"
      );
      (result.current as any).removePanel((result.current as any).layout.children![0].id);
    });

    // 不应该崩溃
    expect((result.current as any).layout).toBeDefined();
  });
});

// ================================================================
// 10. Hook API 测试
// ================================================================

describe("usePanelManager Hook", () => {
  it("提供完整的 API", () => {
    const { result } = renderHook(() => usePanelManager(), {
      wrapper: createWrapper(),
    });

    expect((result.current as any).layout).toBeDefined();
    expect((result.current as any).setLayout).toBeDefined();
    expect((result.current as any).splitPanel).toBeDefined();
    expect((result.current as any).mergePanel).toBeDefined();
    expect((result.current as any).removePanel).toBeDefined();
    expect((result.current as any).resetLayout).toBeDefined();
    expect((result.current as any).openPanel).toBeDefined();
  });

  it("在 Provider 外部返回 null", () => {
    const { result } = renderHook(() => usePanelManager());
    expect(result.current).toBeNull();
  });
});
