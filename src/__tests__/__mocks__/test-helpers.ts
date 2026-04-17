/**
 * @file: test-helpers.ts
 * @description: 通用测试辅助工具 - 异步等待、DOM操作、数据生成等
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-15
 * @status: dev
 * @license: MIT
 */

import { vi, type MockInstance } from 'vitest';

// ── Async Utilities ─────────────────────────────────────

export async function waitFor<T>(
  condition: () => T | Promise<T>,
  options?: { timeout?: number; interval?: number }
): Promise<T> {
  const { timeout = 1000, interval = 50 } = options || {};
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result) return result;
    } catch {
      // Ignore errors in condition check
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`waitFor timed out after ${timeout}ms`);
}

export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

// ── DOM Utilities ───────────────────────────────────────

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    attributes?: Record<string, string>;
    children?: (string | HTMLElement)[];
    events?: Record<string, EventListener>;
    className?: string;
    id?: string;
  }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (options?.id) element.id = options.id;
  if (options?.className) element.className = options.className;

  if (options?.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (options?.children) {
    options.children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
  }

  if (options?.events) {
    Object.entries(options.events).forEach(([event, handler]) => {
      element.addEventListener(event, handler);
    });
  }

  return element;
}

export function querySelector<T extends Element = Element>(
  selector: string,
  container: Element | Document = document
): T | null {
  return container.querySelector(selector) as T | null;
}

export function querySelectorAll<T extends Element = Element>(
  selector: string,
  container: Element | Document = document
): T[] {
  return Array.from(container.querySelectorAll(selector)) as T[];
}

// ── Data Generation ─────────────────────────────────────

export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateTestData<T>(factory: (index: number) => T, count: number): T[] {
  return Array.from({ length: count }, (_, index) => factory(index));
}

export function generateFileData(overrides?: Partial<{
  name: string;
  content: string;
  language: string;
  path: string;
}>): { name: string; content: string; language: string; path: string } {
  return {
    name: overrides?.name || `test-file-${generateRandomString(6)}.ts`,
    content: overrides?.content || `export function testFunction() {\n  return 'test';\n}\n`,
    language: overrides?.language || 'typescript',
    path: overrides?.path || `/src/test-file-${generateRandomString(6)}.ts`,
  };
}

// ── Mock Management ─────────────────────────────────────

export function createSpyTracker(): {
  track(spy: MockInstance): void;
  reset(): void;
  getCallCount(): number;
  getAllCalls(): Array<{ spy: MockInstance; calls: number }>;
} {
  const spies: Map<string, MockInstance> = new Map();
  let callCount = 0;

  return {
    track(spy: MockInstance) {
      const id = generateUUID();
      spies.set(id, spy);
      
      const originalFn = spy.mockImplementation as (...args: any[]) => any || (() => {});
      spy.mockImplementation((...args: any[]) => {
        callCount++;
        return originalFn(...args);
      });
    },

    reset() {
      spies.forEach(spy => spy.mockReset());
      spies.clear();
      callCount = 0;
    },

    getCallCount() {
      return callCount;
    },

    getAllCalls() {
      return Array.from(spies.entries()).map(([id, spy]) => ({
        id,
        spy,
        calls: spy.mock.calls.length,
      }));
    },
  };
}

// ── Assertion Helpers ───────────────────────────────────

export function expectToBeCalledTimes(mock: MockInstance, times: number): void {
  expect(mock).toHaveBeenCalledTimes(times);
}

export function expectToBeCalledWith(mock: MockInstance, ...args: any[]): void {
  expect(mock).toHaveBeenCalledWith(...(args as [any]));
}

export function expectToHaveBeenCalled(mock: MockInstance): void {
  expect(mock).toHaveBeenCalled();
}

export function expectError<TError extends Error = Error>(
  fn: () => any,
  errorType?: new (...args: any[]) => TError,
  errorMessage?: string | RegExp
): void {
  if (errorType) {
    expect(fn).toThrow(errorType);
  } else {
    expect(fn).toThrow();
  }

  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(fn).toThrow(errorMessage);
    } else {
      expect(fn).toThrow(errorMessage);
    }
  }
}

// ── Console Suppression ─────────────────────────────────

export function suppressConsoleWarnings(): { restore: () => void } {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = vi.fn();
  console.error = vi.fn();

  return {
    restore: () => {
      console.warn = originalWarn;
      console.error = originalError;
    },
  };
}

// ── Timer Utilities ─────────────────────────────────────

export function advanceTimersByTime(ms: number): void {
  vi.advanceTimersByTime(ms);
}

export async function runAllTimersAsync(): Promise<void> {
  await vi.runAllTimersAsync();
}

export function useFakeTimers(): { clear: () => void } {
  vi.useFakeTimers();
  return {
    clear: () => {
      vi.useRealTimers();
    },
  };
}

// ── Export All ──────────────────────────────────────────

export default {
  waitFor,
  wait,
  flushPromises,
  createElement,
  querySelector,
  querySelectorAll,
  generateRandomString,
  generateUUID,
  generateTestData,
  generateFileData,
  createSpyTracker,
  expectToBeCalledTimes,
  expectToBeCalledWith,
  expectToHaveBeenCalled,
  expectError,
  suppressConsoleWarnings,
  advanceTimersByTime,
  runAllTimersAsync,
  useFakeTimers,
};
