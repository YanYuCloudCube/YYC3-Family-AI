/**
 * @file: StorageKeys.test.ts
 * @description: 存储键名测试 - 测试存储键名规范和一致性
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-01
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,vitest,unit-test
 */

// @ts-nocheck
// ================================================================
// Storage Keys 单元测试
// 覆盖: loadJSON, saveJSON, clearAllYYC3Storage
// ================================================================

import { describe, it, expect, beforeEach } from "vitest";
import {
  loadJSON,
  saveJSON,
  clearAllYYC3Storage,
  SK_THEME,
  SK_PROVIDER_API_KEYS,
  SK_PANEL_LAYOUT,
  SK_PROVIDER_URLS,
  SK_PROXY_CONFIG,
  SK_CUSTOM_THEMES,
} from "../app/components/ide/constants/storage-keys";

describe("loadJSON", () => {
  beforeEach(() => localStorage.clear());

  it("returns fallback when key does not exist", () => {
    expect(loadJSON("nonexistent", { x: 1 })).toEqual({ x: 1 });
  });

  it("parses stored JSON correctly", () => {
    localStorage.setItem("test-key", JSON.stringify({ a: "hello", b: 42 }));
    expect(loadJSON("test-key", {})).toEqual({ a: "hello", b: 42 });
  });

  it("returns fallback for invalid JSON", () => {
    localStorage.setItem("test-key", "not-json{{{");
    expect(loadJSON("test-key", "default")).toBe("default");
  });

  it("returns fallback for null stored value", () => {
    expect(loadJSON("test-key", [1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe("saveJSON", () => {
  beforeEach(() => localStorage.clear());

  it("saves JSON to localStorage", () => {
    saveJSON("test-key", { hello: "world" });
    expect(localStorage.getItem("test-key")).toBe('{"hello":"world"}');
  });

  it("overwrites existing values", () => {
    saveJSON("test-key", "first");
    saveJSON("test-key", "second");
    expect(JSON.parse(localStorage.getItem("test-key")!)).toBe("second");
  });
});

describe("clearAllYYC3Storage", () => {
  beforeEach(() => localStorage.clear());

  it("clears keys with yyc3_ prefix (underscore)", () => {
    localStorage.setItem(SK_PANEL_LAYOUT, "data1");
    localStorage.setItem(SK_CUSTOM_THEMES, "data2");
    localStorage.setItem("other_key", "data3");

    const cleared = clearAllYYC3Storage();

    expect(cleared).toBe(2);
    expect(localStorage.getItem(SK_PANEL_LAYOUT)).toBeNull();
    expect(localStorage.getItem(SK_CUSTOM_THEMES)).toBeNull();
    expect(localStorage.getItem("other_key")).toBe("data3");
  });

  it("clears keys with yyc3- prefix (hyphen)", () => {
    localStorage.setItem(SK_THEME, "navy");
    localStorage.setItem(SK_PROVIDER_API_KEYS, "{}");
    localStorage.setItem("unrelated", "keep");

    const cleared = clearAllYYC3Storage();

    expect(cleared).toBe(2);
    expect(localStorage.getItem(SK_THEME)).toBeNull();
    expect(localStorage.getItem(SK_PROVIDER_API_KEYS)).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });

  it("clears mixed prefix keys in one call", () => {
    localStorage.setItem(SK_PANEL_LAYOUT, "layout");
    localStorage.setItem(SK_THEME, "cyberpunk");
    localStorage.setItem(SK_PROVIDER_URLS, "{}");
    localStorage.setItem(SK_PROXY_CONFIG, "{}");
    localStorage.setItem("foreign_key", "keep");

    const cleared = clearAllYYC3Storage();

    expect(cleared).toBe(4);
    expect(localStorage.getItem("foreign_key")).toBe("keep");
  });

  it("returns 0 when no yyc3 keys exist", () => {
    localStorage.setItem("other", "value");
    expect(clearAllYYC3Storage()).toBe(0);
  });
});

describe("Storage key constants", () => {
  it("SK_THEME has correct value", () => {
    expect(SK_THEME).toBe("yyc3-theme");
  });

  it("SK_PROVIDER_API_KEYS has correct value", () => {
    expect(SK_PROVIDER_API_KEYS).toBe("yyc3-provider-api-keys");
  });

  it("SK_PANEL_LAYOUT has correct value", () => {
    expect(SK_PANEL_LAYOUT).toBe("yyc3_panel_layout");
  });
});
