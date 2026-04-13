// @ts-nocheck
/**
 * @file: Wave3Components.test.ts
 * @description: Wave 3 组件与 Store 单元测试——
 *              PanelTabGroupStore、PanelPinStore、FloatingPanelStore
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-03-14
 * @updated: 2026-03-14
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,vitest,wave3,stores,tab-groups,pin,floating
 */

import { describe, it, expect, beforeEach } from "vitest";
import { usePanelTabGroupStore } from "../app/components/ide/stores/usePanelTabGroupStore";
import { usePanelPinStore } from "../app/components/ide/stores/usePanelPinStore";
import { useFloatingPanelStore } from "../app/components/ide/stores/useFloatingPanelStore";

// ── Helper: reset Zustand stores between tests ──

function resetTabGroupStore() {
  usePanelTabGroupStore.setState({
    groups: [
      {
        id: "grp_test_dev",
        name: "开发核心",
        color: "#60a5fa",
        panelIds: ["ai", "files", "code"],
        collapsed: false,
      },
    ],
  });
}

function resetPinStore() {
  usePanelPinStore.setState({
    pinnedPanels: new Set(),
    lockedPanels: new Set(),
  });
}

function resetFloatingStore() {
  useFloatingPanelStore.setState({
    floatingPanels: [],
    nextZIndex: 1000,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tab Group Store
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("usePanelTabGroupStore", () => {
  beforeEach(() => {
    resetTabGroupStore();
  });

  it("should have initial groups", () => {
    const state = usePanelTabGroupStore.getState();
    expect(state.groups.length).toBe(1);
    expect(state.groups[0].name).toBe("开发核心");
  });

  it("should create a new group", () => {
    const { createGroup } = usePanelTabGroupStore.getState();
    const id = createGroup("测试分组");
    const state = usePanelTabGroupStore.getState();
    expect(state.groups.length).toBe(2);
    expect(state.groups[1].name).toBe("测试分组");
    expect(id).toBeTruthy();
  });

  it("should remove a group", () => {
    const { removeGroup } = usePanelTabGroupStore.getState();
    removeGroup("grp_test_dev");
    const state = usePanelTabGroupStore.getState();
    expect(state.groups.length).toBe(0);
  });

  it("should rename a group", () => {
    const { renameGroup } = usePanelTabGroupStore.getState();
    renameGroup("grp_test_dev", "新名称");
    const state = usePanelTabGroupStore.getState();
    expect(state.groups[0].name).toBe("新名称");
  });

  it("should toggle group collapse", () => {
    const { toggleGroupCollapse } = usePanelTabGroupStore.getState();
    expect(usePanelTabGroupStore.getState().groups[0].collapsed).toBe(false);
    toggleGroupCollapse("grp_test_dev");
    expect(usePanelTabGroupStore.getState().groups[0].collapsed).toBe(true);
    toggleGroupCollapse("grp_test_dev");
    expect(usePanelTabGroupStore.getState().groups[0].collapsed).toBe(false);
  });

  it("should add panel to group", () => {
    const { addPanelToGroup } = usePanelTabGroupStore.getState();
    addPanelToGroup("grp_test_dev", "git");
    const state = usePanelTabGroupStore.getState();
    expect(state.groups[0].panelIds).toContain("git");
  });

  it("should remove panel from group", () => {
    const { removePanelFromGroup } = usePanelTabGroupStore.getState();
    removePanelFromGroup("grp_test_dev", "ai");
    const state = usePanelTabGroupStore.getState();
    expect(state.groups[0].panelIds).not.toContain("ai");
  });

  it("should move panel between groups", () => {
    const { createGroup, movePanelBetweenGroups } =
      usePanelTabGroupStore.getState();
    const newId = createGroup("目标分组");
    movePanelBetweenGroups("grp_test_dev", newId, "ai");
    const state = usePanelTabGroupStore.getState();
    expect(state.groups[0].panelIds).not.toContain("ai");
    const targetGroup = state.groups.find((g) => g.id === newId);
    expect(targetGroup?.panelIds).toContain("ai");
  });

  it("should set group color", () => {
    const { setGroupColor } = usePanelTabGroupStore.getState();
    setGroupColor("grp_test_dev", "#ff0000");
    expect(usePanelTabGroupStore.getState().groups[0].color).toBe("#ff0000");
  });

  it("should reorder groups", () => {
    const { createGroup, reorderGroups } = usePanelTabGroupStore.getState();
    createGroup("第二分组");
    reorderGroups(0, 1);
    const state = usePanelTabGroupStore.getState();
    expect(state.groups[0].name).toBe("第二分组");
    expect(state.groups[1].name).toBe("开发核心");
  });

  it("should find group for panel", () => {
    const { getGroupForPanel } = usePanelTabGroupStore.getState();
    const group = getGroupForPanel("ai");
    expect(group).not.toBeNull();
    expect(group?.id).toBe("grp_test_dev");
  });

  it("should return null for ungrouped panel", () => {
    const { getGroupForPanel } = usePanelTabGroupStore.getState();
    const group = getGroupForPanel("terminal");
    expect(group).toBeNull();
  });

  it("should reset groups", () => {
    const { createGroup, resetGroups } = usePanelTabGroupStore.getState();
    createGroup("临时分组");
    resetGroups();
    const state = usePanelTabGroupStore.getState();
    // After reset, should have default groups
    expect(state.groups.length).toBeGreaterThanOrEqual(1);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Panel Pin Store
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("usePanelPinStore", () => {
  beforeEach(() => {
    resetPinStore();
  });

  it("should start with no pinned or locked panels", () => {
    const state = usePanelPinStore.getState();
    expect(state.pinnedPanels.size).toBe(0);
    expect(state.lockedPanels.size).toBe(0);
  });

  it("should toggle pin on a panel", () => {
    const { togglePin, isPinned } = usePanelPinStore.getState();
    expect(isPinned("node_left")).toBe(false);
    togglePin("node_left");
    expect(usePanelPinStore.getState().isPinned("node_left")).toBe(true);
    usePanelPinStore.getState().togglePin("node_left");
    expect(usePanelPinStore.getState().isPinned("node_left")).toBe(false);
  });

  it("should toggle lock on a panel", () => {
    const { toggleLock, isLocked } = usePanelPinStore.getState();
    expect(isLocked("node_center")).toBe(false);
    toggleLock("node_center");
    expect(usePanelPinStore.getState().isLocked("node_center")).toBe(true);
    usePanelPinStore.getState().toggleLock("node_center");
    expect(usePanelPinStore.getState().isLocked("node_center")).toBe(false);
  });

  it("should pin and unpin explicitly", () => {
    const { pinPanel, unpinPanel, isPinned } = usePanelPinStore.getState();
    pinPanel("node_a");
    expect(usePanelPinStore.getState().isPinned("node_a")).toBe(true);
    usePanelPinStore.getState().unpinPanel("node_a");
    expect(usePanelPinStore.getState().isPinned("node_a")).toBe(false);
  });

  it("should lock and unlock explicitly", () => {
    const { lockPanel, unlockPanel } = usePanelPinStore.getState();
    lockPanel("node_b");
    expect(usePanelPinStore.getState().isLocked("node_b")).toBe(true);
    usePanelPinStore.getState().unlockPanel("node_b");
    expect(usePanelPinStore.getState().isLocked("node_b")).toBe(false);
  });

  it("should clear all pins and locks", () => {
    const { pinPanel, lockPanel, clearAll } = usePanelPinStore.getState();
    pinPanel("n1");
    pinPanel("n2");
    lockPanel("n3");
    usePanelPinStore.getState().clearAll();
    const state = usePanelPinStore.getState();
    expect(state.pinnedPanels.size).toBe(0);
    expect(state.lockedPanels.size).toBe(0);
  });

  it("should handle multiple pins independently", () => {
    const { pinPanel } = usePanelPinStore.getState();
    pinPanel("a");
    pinPanel("b");
    pinPanel("c");
    const state = usePanelPinStore.getState();
    expect(state.isPinned("a")).toBe(true);
    expect(state.isPinned("b")).toBe(true);
    expect(state.isPinned("c")).toBe(true);
    expect(state.isPinned("d")).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Floating Panel Store
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("useFloatingPanelStore", () => {
  beforeEach(() => {
    resetFloatingStore();
  });

  it("should start with no floating panels", () => {
    const state = useFloatingPanelStore.getState();
    expect(state.floatingPanels.length).toBe(0);
  });

  it("should detach a panel as floating", () => {
    const { detachPanel } = useFloatingPanelStore.getState();
    const id = detachPanel("ai", 100, 200);
    const state = useFloatingPanelStore.getState();
    expect(state.floatingPanels.length).toBe(1);
    expect(state.floatingPanels[0].panelId).toBe("ai");
    expect(state.floatingPanels[0].x).toBe(100);
    expect(state.floatingPanels[0].y).toBe(200);
    expect(id).toBeTruthy();
  });

  it("should attach (remove) a floating panel", () => {
    const { detachPanel } = useFloatingPanelStore.getState();
    const id = detachPanel("code");
    const panelId = useFloatingPanelStore.getState().attachPanel(id);
    expect(panelId).toBe("code");
    expect(useFloatingPanelStore.getState().floatingPanels.length).toBe(0);
  });

  it("should return null when attaching non-existent panel", () => {
    const result = useFloatingPanelStore.getState().attachPanel("nonexistent");
    expect(result).toBeNull();
  });

  it("should move a floating panel", () => {
    const { detachPanel } = useFloatingPanelStore.getState();
    const id = detachPanel("files");
    useFloatingPanelStore.getState().movePanel(id, 300, 400);
    const panel = useFloatingPanelStore.getState().floatingPanels[0];
    expect(panel.x).toBe(300);
    expect(panel.y).toBe(400);
  });

  it("should resize a floating panel with minimum bounds", () => {
    const { detachPanel } = useFloatingPanelStore.getState();
    const id = detachPanel("git");
    useFloatingPanelStore.getState().resizePanel(id, 100, 100); // Below min
    const panel = useFloatingPanelStore.getState().floatingPanels[0];
    expect(panel.width).toBe(240); // min width
    expect(panel.height).toBe(180); // min height
  });

  it("should resize a floating panel to valid size", () => {
    const { detachPanel } = useFloatingPanelStore.getState();
    const id = detachPanel("git");
    useFloatingPanelStore.getState().resizePanel(id, 600, 500);
    const panel = useFloatingPanelStore.getState().floatingPanels[0];
    expect(panel.width).toBe(600);
    expect(panel.height).toBe(500);
  });

  it("should toggle minimize", () => {
    const { detachPanel } = useFloatingPanelStore.getState();
    const id = detachPanel("terminal");
    expect(useFloatingPanelStore.getState().floatingPanels[0].minimized).toBe(
      false,
    );
    useFloatingPanelStore.getState().toggleMinimize(id);
    expect(useFloatingPanelStore.getState().floatingPanels[0].minimized).toBe(
      true,
    );
    useFloatingPanelStore.getState().toggleMinimize(id);
    expect(useFloatingPanelStore.getState().floatingPanels[0].minimized).toBe(
      false,
    );
  });

  it("should bring a panel to front", () => {
    const { detachPanel } = useFloatingPanelStore.getState();
    const id1 = detachPanel("ai");
    const id2 = detachPanel("code");
    const z1before = useFloatingPanelStore.getState().floatingPanels[0].zIndex;
    useFloatingPanelStore.getState().bringToFront(id1);
    const z1after = useFloatingPanelStore.getState().floatingPanels[0].zIndex;
    expect(z1after).toBeGreaterThan(z1before);
  });

  it("should check isFloating", () => {
    const { detachPanel, isFloating } = useFloatingPanelStore.getState();
    expect(isFloating("ai")).toBe(false);
    detachPanel("ai");
    expect(useFloatingPanelStore.getState().isFloating("ai")).toBe(true);
  });

  it("should close all floating panels", () => {
    const { detachPanel } = useFloatingPanelStore.getState();
    detachPanel("ai");
    detachPanel("code");
    detachPanel("files");
    useFloatingPanelStore.getState().closeAll();
    expect(useFloatingPanelStore.getState().floatingPanels.length).toBe(0);
  });

  it("should cascade positions for multiple detached panels", () => {
    const { detachPanel } = useFloatingPanelStore.getState();
    detachPanel("ai");
    detachPanel("code");
    const panels = useFloatingPanelStore.getState().floatingPanels;
    // Second panel should be offset from first
    expect(panels[1].x).toBeGreaterThan(panels[0].x);
    expect(panels[1].y).toBeGreaterThan(panels[0].y);
  });
});
