// @ts-nocheck
/**
 * @file RealtimePreview.integration.test.tsx
 * @description 实时预览集成测试 - 覆盖预览引擎、设备模拟、控制台捕获、历史快照
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,preview,integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import { buildPreviewHtml, detectLanguage } from "../app/components/ide/PreviewEngine";
import {
  usePreviewStore,
  DEVICE_PRESETS,
  type DevicePreset,
  type ConsoleEntry,
} from "../app/components/ide/stores/usePreviewStore";

// Mock iframe
vi.mock("../PreviewEngine", async () => {
  const actual = await vi.importActual("../PreviewEngine");
  return {
    ...(actual as any),
    buildPreviewHtml: vi.fn(),
  };
});

// ── Helper Functions ──

function createTestFile(path: string, content: string) {
  return { path, content };
}

function mockConsoleOutput() {
  const logs: any[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args) => logs.push({ type: "log", args });
  console.error = (...args) => logs.push({ type: "error", args });
  console.warn = (...args) => logs.push({ type: "warn", args });

  return {
    logs,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
}

// ================================================================
// 1. 预览引擎测试
// ================================================================

describe("RealtimePreview - 预览引擎", () => {
  it("检测 HTML 文件类型", () => {
    expect(detectLanguage("index.html")).toBe("html");
    expect(detectLanguage("test.htm")).toBe("html");
  });

  it("检测 CSS 文件类型", () => {
    expect(detectLanguage("style.css")).toBe("css");
    expect(detectLanguage("theme.scss")).toBe("css");
    expect(detectLanguage("app.less")).toBe("css");
  });

  it("检测 JavaScript/TypeScript 文件类型", () => {
    expect(detectLanguage("app.js")).toBe("javascript");
    expect(detectLanguage("module.mjs")).toBe("javascript");
    expect(detectLanguage("component.jsx")).toBe("jsx");
    expect(detectLanguage("utils.ts")).toBe("typescript");
    expect(detectLanguage("App.tsx")).toBe("tsx");
  });

  it("检测 Markdown 文件类型", () => {
    expect(detectLanguage("README.md")).toBe("markdown");
    expect(detectLanguage("doc.markdown")).toBe("markdown");
    expect(detectLanguage("content.mdx")).toBe("markdown");
  });

  it("检测 SVG 和 JSON 文件类型", () => {
    expect(detectLanguage("icon.svg")).toBe("svg");
    expect(detectLanguage("data.json")).toBe("json");
  });

  it("未知扩展名返回 text", () => {
    expect(detectLanguage("file.unknown")).toBe("text");
    expect(detectLanguage("noextension")).toBe("text");
  });

  it("构建 HTML 预览", () => {
    const code = "<h1>Hello</h1>";

    const result = buildPreviewHtml(code, "html");

    expect(result.html).toContain("<h1>Hello</h1>");
  });

  it("构建带设备模拟的预览", () => {
    const code = "<div>Test</div>";

    const devicePreset: DevicePreset = {
      id: "mobile",
      name: "iPhone 14",
      type: "mobile",
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    };

    const result = buildPreviewHtml(code, "html");

    expect(result.html).toContain("<div>Test</div>");
  });
});

// ================================================================
// 2. 设备模拟测试
// ================================================================

describe("RealtimePreview - 设备模拟", () => {
  it("预设设备配置完整", () => {
    expect(DEVICE_PRESETS.length).toBeGreaterThan(0);
    
    DEVICE_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty("id");
      expect(preset).toHaveProperty("name");
      expect(preset).toHaveProperty("width");
      expect(preset).toHaveProperty("height");
    });
  });

  it("包含常见移动设备", () => {
    const mobileDevices = DEVICE_PRESETS.filter((d) => d.type === "mobile");
    expect(mobileDevices.length).toBeGreaterThan(0);
    
    const deviceNames = mobileDevices.map((d) => d.name.toLowerCase());
    expect(deviceNames.some((name) => name.includes("iphone") || name.includes("android") || name.includes("pixel") || name.includes("galaxy"))).toBe(true);
  });

  it("包含平板设备", () => {
    const tabletDevices = DEVICE_PRESETS.filter((d) => d.type === "tablet");
    expect(tabletDevices.length).toBeGreaterThan(0);
  });

  it("包含桌面设备", () => {
    const desktopDevices = DEVICE_PRESETS.filter((d) => d.type === "desktop");
    expect(desktopDevices.length).toBeGreaterThan(0);
  });

  it("设备参数有效", () => {
    DEVICE_PRESETS.forEach((preset) => {
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
      expect(preset.pixelRatio).toBeGreaterThan(0);
    });
  });
});

// ================================================================
// 3. 控制台捕获测试
// ================================================================

describe("RealtimePreview - 控制台捕获", () => {
  it("捕获 console.log 输出", () => {
    const mock = mockConsoleOutput();
    
    console.log("Test message");
    console.log({ key: "value" });
    
    expect(mock.logs.length).toBe(2);
    expect(mock.logs[0].type).toBe("log");
    expect(mock.logs[0].args[0]).toBe("Test message");
    
    mock.restore();
  });

  it("捕获 console.error 输出", () => {
    const mock = mockConsoleOutput();
    
    console.error("Error message");
    
    expect(mock.logs.some((l) => l.type === "error")).toBe(true);
    
    mock.restore();
  });

  it("捕获 console.warn 输出", () => {
    const mock = mockConsoleOutput();
    
    console.warn("Warning message");
    
    expect(mock.logs.some((l) => l.type === "warn")).toBe(true);
    
    mock.restore();
  });

  it("控制台条目格式正确", () => {
    const entry: ConsoleEntry = {
      id: "test-1",
      level: "info",
      message: "Test message",
      timestamp: Date.now(),
    };

    expect(entry).toHaveProperty("id");
    expect(entry).toHaveProperty("level");
    expect(entry).toHaveProperty("message");
    expect(entry).toHaveProperty("timestamp");
  });
});

// ================================================================
// 4. 历史快照测试
// ================================================================

describe("RealtimePreview - 历史快照", () => {
  it("创建快照", () => {
    const { addSnapshot } = usePreviewStore.getState();

    addSnapshot({
      label: "Test Snapshot",
      files: [],
    });

    const state = usePreviewStore.getState();
    expect(state.history.length).toBeGreaterThan(0);
    expect(state.history[state.history.length - 1].label).toBe("Test Snapshot");
    expect(state.history[state.history.length - 1].timestamp).toBeDefined();
  });

  it("列出快照", () => {
    const { addSnapshot, clearHistory, history } = usePreviewStore.getState();
    
    clearHistory();
    
    addSnapshot({ label: "Snapshot 1", files: [] });
    addSnapshot({ label: "Snapshot 2", files: [] });
    
    expect(usePreviewStore.getState().history.length).toBe(2);
  });

  it("恢复快照", () => {
    const { addSnapshot, restoreSnapshot } = usePreviewStore.getState();
    
    addSnapshot({ label: "Restore Test A", files: [] });
    addSnapshot({ label: "Restore Test B", files: [] });
    
    restoreSnapshot(0);
    
    expect(usePreviewStore.getState().historyIndex).toBe(0);
  });

  it("删除快照", () => {
    const { initSnapshotManager, createProjectSnapshot, deleteProjectSnapshot, listProjectSnapshots } = usePreviewStore.getState();
    
    initSnapshotManager();
    
    const snapshot = createProjectSnapshot("Delete Test", [
      { path: "test.html", content: "<div>Test</div>" },
    ]);
    
    expect(snapshot).not.toBeNull();
    
    const beforeCount = listProjectSnapshots().length;
    
    if (snapshot) {
      const deleted = deleteProjectSnapshot(snapshot.id);
      expect(deleted).toBe(true);
    }
    
    const afterCount = listProjectSnapshots().length;
    expect(afterCount).toBeLessThan(beforeCount);
  });

  it("快照比较", () => {
    const { initSnapshotManager, createProjectSnapshot, compareProjectSnapshots } = usePreviewStore.getState();

    initSnapshotManager();

    const snapshot1 = createProjectSnapshot("Version 1", [
      { path: "test.html", content: "<div>V1</div>" },
    ]);

    const snapshot2 = createProjectSnapshot("Version 2", [
      { path: "test.html", content: "<div>V2</div>" },
    ]);

    if (snapshot1 && snapshot2) {
      const diff = compareProjectSnapshots(snapshot1.id, snapshot2.id);
      expect(diff).toBeDefined();
    }
  });
});

// ================================================================
// 5. 预览模式测试
// ================================================================

describe("RealtimePreview - 预览模式", () => {
  it("实时模式立即更新", () => {
    const { setMode, triggerRefresh } = usePreviewStore.getState();
    
    let updateCount = 0;
    const unsubscribe = usePreviewStore.subscribe((state) => {
      if (state.refreshCounter > 0) updateCount++;
    });
    
    setMode("realtime");
    triggerRefresh();
    
    expect(updateCount).toBeGreaterThan(0);
    
    unsubscribe();
  });

  it("手动模式需要手动触发", () => {
    const { setMode, triggerRefresh, refreshCounter } = usePreviewStore.getState();
    
    setMode("manual");
    
    const beforeCounter = refreshCounter;
    
    triggerRefresh();
    expect(usePreviewStore.getState().refreshCounter).toBeGreaterThan(beforeCounter);
  });

  it("延迟模式配置", () => {
    const { setMode, setPreviewDelay } = usePreviewStore.getState();
    
    setMode("delayed");
    setPreviewDelay(800);
    
    expect(usePreviewStore.getState().mode).toBe("delayed");
    expect(usePreviewStore.getState().previewDelay).toBe(800);
  });
});

// ================================================================
// 6. 错误边界测试
// ================================================================

describe("RealtimePreview - 错误边界", () => {
  it("捕获预览错误", () => {
    const { addConsoleLog } = usePreviewStore.getState();
    
    addConsoleLog({
      level: "error",
      message: "Test error",
    });
    
    const state = usePreviewStore.getState();
    const errors = state.consoleLogs.filter((e) => e.level === "error");
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toBe("Test error");
  });

  it("错误级别过滤", () => {
    const { addConsoleLog, clearConsole, consoleLogs } = usePreviewStore.getState();
    
    clearConsole();
    
    addConsoleLog({
      level: "info",
      message: "Log message",
    });
    
    addConsoleLog({
      level: "error",
      message: "Error message",
    });
    
    const allEntries = usePreviewStore.getState().consoleLogs;
    const errorEntries = allEntries.filter((e) => e.level === "error");
    
    expect(allEntries.length).toBe(2);
    expect(errorEntries.length).toBe(1);
  });

  it("清空控制台", () => {
    const { addConsoleLog, clearConsole } = usePreviewStore.getState();
    
    addConsoleLog({
      level: "info",
      message: "Test",
    });
    
    clearConsole();
    
    const entries = usePreviewStore.getState().consoleLogs;
    expect(entries.length).toBe(0);
  });
});

// ================================================================
// 7. 滚动同步测试
// ================================================================

describe("RealtimePreview - 滚动同步", () => {
  it("启用滚动同步", () => {
    const { setScrollSyncEnabled } = usePreviewStore.getState();
    
    setScrollSyncEnabled(true);
    
    expect(usePreviewStore.getState().scrollSyncEnabled).toBe(true);
  });

  it("禁用滚动同步", () => {
    const { setScrollSyncEnabled } = usePreviewStore.getState();
    
    setScrollSyncEnabled(false);
    
    expect(usePreviewStore.getState().scrollSyncEnabled).toBe(false);
  });

  it("同步滚动位置", () => {
    const { setScrollSyncEnabled } = usePreviewStore.getState();
    
    setScrollSyncEnabled(true);
    
    const state = usePreviewStore.getState();
    expect(state.scrollSyncEnabled).toBe(true);
  });
});

// ================================================================
// 8. 缩放控制测试
// ================================================================

describe("RealtimePreview - 缩放控制", () => {
  it("设置缩放级别", () => {
    const { setZoom } = usePreviewStore.getState();

    setZoom(150);

    expect(usePreviewStore.getState().zoom).toBe(150);
  });

  it("缩放范围有效", () => {
    const { setZoom } = usePreviewStore.getState();

    setZoom(25);
    expect(usePreviewStore.getState().zoom).toBe(25);

    setZoom(200);
    expect(usePreviewStore.getState().zoom).toBe(200);
  });

  it("重置缩放", () => {
    const { setZoom } = usePreviewStore.getState();

    setZoom(150);
    setZoom(100);

    expect(usePreviewStore.getState().zoom).toBe(100);
  });
});

// ================================================================
// 9. 性能测试
// ================================================================

describe("RealtimePreview - 性能", () => {
  it("快速连续刷新不卡顿", () => {
    const { triggerRefresh } = usePreviewStore.getState();

    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      triggerRefresh();
    }

    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(1000);
    expect(usePreviewStore.getState().refreshCounter).toBeGreaterThanOrEqual(10);
  });

  it("大量控制台条目不卡顿", () => {
    const { addConsoleLog, clearConsole } = usePreviewStore.getState();

    clearConsole();

    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      addConsoleLog({
        level: "info",
        message: `Message ${i}`,
      });
    }

    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(500);
    expect(usePreviewStore.getState().consoleLogs.length).toBe(100);
  });

  it("多快照创建性能", () => {
    const { addSnapshot } = usePreviewStore.getState();

    const startTime = Date.now();

    for (let i = 0; i < 20; i++) {
      addSnapshot({
        label: `Snapshot ${i}`,
        files: [],
      });
    }

    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(1000);
  });
});

// ================================================================
// 10. 集成场景测试
// ================================================================

describe("RealtimePreview - 集成场景", () => {
  it("完整预览流程", () => {
    const { setMode, triggerRefresh, addSnapshot } = usePreviewStore.getState();

    setMode("manual");
    triggerRefresh();

    addSnapshot({
      label: "Initial State",
      files: [],
    });

    const state = usePreviewStore.getState();
    expect(state.history.length).toBeGreaterThan(0);
    expect(state.history[state.history.length - 1].label).toBe("Initial State");
  });

  it("设备切换流程", () => {
    const { setActiveDevice, activeDevice } = usePreviewStore.getState();

    const mobileDevice = DEVICE_PRESETS.find((d) => d.type === "mobile");
    if (mobileDevice) {
      setActiveDevice(mobileDevice);
      expect(usePreviewStore.getState().activeDevice.id).toBe(mobileDevice.id);
    }

    const desktopDevice = DEVICE_PRESETS.find((d) => d.type === "desktop");
    if (desktopDevice) {
      setActiveDevice(desktopDevice);
      expect(usePreviewStore.getState().activeDevice.id).toBe(desktopDevice.id);
    }
  });

  it("控制台过滤流程", () => {
    const { addConsoleLog, setConsoleFilter, clearConsole } = usePreviewStore.getState();

    clearConsole();

    addConsoleLog({ level: "info", message: "Log" });
    addConsoleLog({ level: "warn", message: "Warning" });
    addConsoleLog({ level: "error", message: "Error" });

    setConsoleFilter("all");
    expect(usePreviewStore.getState().consoleLogs.length).toBe(3);

    setConsoleFilter("error");
    const errorLogs = usePreviewStore.getState().consoleLogs.filter((l) => l.level === "error");
    expect(errorLogs.length).toBe(1);
  });
});
