/**
 * @file: setup.ts
 * @description: 测试环境配置 - Vitest 测试环境初始化和全局设置
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-01
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,vitest,unit-test
 */

import "@testing-library/jest-dom/vitest";

// ── Mock localStorage ──
const store: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = String(value);
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((key) => delete store[key]);
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (index: number) => Object.keys(store)[index] ?? null,
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// ── Mock fetch ──
globalThis.fetch = vi.fn();

// ── Mock AbortSignal.timeout ──
if (!AbortSignal.timeout) {
  AbortSignal.timeout = (ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

// ── Ensure Web Crypto API is available in test environment ──
const setupWebCrypto = async () => {
  try {
    const { webcrypto } = await import('node:crypto');
    if (typeof globalThis.crypto === 'undefined' || !(globalThis as any).crypto?.subtle) {
      (globalThis as any).crypto = webcrypto;
    }
  } catch {
    console.warn('Web Crypto API not available in test environment');
  }
};
await setupWebCrypto();

// ── Clear mocks between tests ──
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
