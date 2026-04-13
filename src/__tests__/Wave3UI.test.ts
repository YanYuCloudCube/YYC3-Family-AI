// @ts-nocheck
/**
 * @file: Wave3UI.test.ts
 * @description: Wave 3 UI 逻辑单元测试——
 *              CommandPalette 模糊搜索、KeyboardShortcutsHelp 过滤逻辑、
 *              PanelMinimap 颜色/标签映射
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-03-14
 * @updated: 2026-03-14
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,vitest,wave3,command-palette,shortcuts,minimap
 */

import { describe, it, expect } from "vitest";

// ── Test the fuzzy match algorithm from CommandPalette ──
// Reimplemented here since it's a private function

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

describe("CommandPalette — fuzzy match", () => {
  it("should match exact substring", () => {
    expect(fuzzyMatch("AI", "打开 AI 对话")).toBe(true);
  });

  it("should match case-insensitively", () => {
    expect(fuzzyMatch("git", "Git 版本控制")).toBe(true);
    expect(fuzzyMatch("GIT", "Git 版本控制")).toBe(true);
  });

  it("should fuzzy match character sequence", () => {
    expect(fuzzyMatch("ag", "Agent 编排")).toBe(true);
    expect(fuzzyMatch("ae", "Agent 编排")).toBe(true); // a...e
  });

  it("should not match when characters are out of order", () => {
    expect(fuzzyMatch("gta", "Git")).toBe(false); // g-t-a not in order
  });

  it("should match empty query to everything", () => {
    expect(fuzzyMatch("", "anything")).toBe(true);
  });

  it("should not match when query is longer than text", () => {
    expect(fuzzyMatch("verylongquery", "abc")).toBe(false);
  });

  it("should match Chinese characters", () => {
    expect(fuzzyMatch("代码", "代码编辑")).toBe(true);
    expect(fuzzyMatch("文件", "文件管理")).toBe(true);
  });

  it("should match mixed Chinese and English", () => {
    expect(fuzzyMatch("ai对", "AI 对话")).toBe(true);
  });
});

// ── Test KeyboardShortcutsHelp filter logic ──

interface ShortcutDef {
  keys: string;
  label: string;
  category: string;
}

const SHORTCUTS: ShortcutDef[] = [
  { keys: "Ctrl+Shift+P", label: "打开命令面板", category: "命令" },
  { keys: "Ctrl+/", label: "显示快捷键帮助", category: "命令" },
  { keys: "Ctrl+1", label: "切换到预览视图", category: "视图切换" },
  { keys: "Ctrl+2", label: "切换代码/默认视图", category: "视图切换" },
  { keys: "Ctrl+Shift+F", label: "全局搜索", category: "视图切换" },
  { keys: "Ctrl+`", label: "切换终端", category: "终端" },
  { keys: "Ctrl+S", label: "保存文件", category: "编辑器" },
  { keys: "Ctrl+Z", label: "撤销", category: "编辑器" },
];

function filterShortcuts(query: string): ShortcutDef[] {
  if (!query.trim()) return SHORTCUTS;
  const q = query.toLowerCase();
  return SHORTCUTS.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      s.keys.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q),
  );
}

describe("KeyboardShortcutsHelp — filter", () => {
  it("should return all shortcuts for empty query", () => {
    expect(filterShortcuts("")).toHaveLength(SHORTCUTS.length);
    expect(filterShortcuts("   ")).toHaveLength(SHORTCUTS.length);
  });

  it("should filter by label", () => {
    const results = filterShortcuts("撤销");
    expect(results).toHaveLength(1);
    expect(results[0].keys).toBe("Ctrl+Z");
  });

  it("should filter by key combination", () => {
    const results = filterShortcuts("Ctrl+Shift+P");
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe("打开命令面板");
  });

  it("should filter by category", () => {
    const results = filterShortcuts("命令");
    expect(results).toHaveLength(2);
  });

  it("should be case insensitive", () => {
    const results = filterShortcuts("ctrl+shift+p");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("should return empty for non-matching query", () => {
    const results = filterShortcuts("zzzznonexistent");
    expect(results).toHaveLength(0);
  });
});

// ── Test PanelMinimap label/color mappings ──

import type { PanelId } from "../app/components/ide/PanelManager";

const PANEL_COLORS: Record<PanelId, string> = {
  ai: "#818cf8",
  files: "#f87171",
  code: "#60a5fa",
  preview: "#34d399",
  terminal: "#a3a3a3",
  git: "#fb923c",
  agents: "#a78bfa",
  market: "#fbbf24",
  knowledge: "#4ade80",
  rag: "#38bdf8",
  collab: "#f472b6",
  ops: "#c084fc",
  workflow: "#2dd4bf",
  diagnostics: "#ef4444",
  performance: "#facc15",
  security: "#f97316",
  "test-gen": "#a3e635",
  quality: "#06b6d4",
  "document-editor": "#8b5cf6",
  taskboard: "#10b981",
  "multi-instance": "#f59e0b",
};

const PANEL_SHORT_LABELS: Record<PanelId, string> = {
  ai: "AI",
  files: "文件",
  code: "代码",
  preview: "预览",
  terminal: "终端",
  git: "Git",
  agents: "Agent",
  market: "市场",
  knowledge: "知识",
  rag: "RAG",
  collab: "协作",
  ops: "运维",
  workflow: "流程",
  diagnostics: "诊断",
  performance: "性能",
  security: "安全",
  "test-gen": "测试",
  quality: "质量",
  "document-editor": "文档",
  taskboard: "任务",
  "multi-instance": "多实例",
};

describe("PanelMinimap — mappings", () => {
  const allPanelIds: PanelId[] = [
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

  it("should have a color for every panel ID", () => {
    for (const pid of allPanelIds) {
      expect(PANEL_COLORS[pid]).toBeDefined();
      expect(PANEL_COLORS[pid]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("should have a short label for every panel ID", () => {
    for (const pid of allPanelIds) {
      expect(PANEL_SHORT_LABELS[pid]).toBeDefined();
      expect(PANEL_SHORT_LABELS[pid].length).toBeGreaterThan(0);
    }
  });

  it("should have unique colors for each panel", () => {
    const colors = Object.values(PANEL_COLORS);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });

  it("should have 21 panel IDs mapped", () => {
    expect(Object.keys(PANEL_COLORS).length).toBe(21);
    expect(Object.keys(PANEL_SHORT_LABELS).length).toBe(21);
  });
});
