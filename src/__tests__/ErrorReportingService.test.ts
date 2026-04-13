// @ts-nocheck
/**
 * @file: ErrorReportingService.test.ts
 * @description: 错误上报服务测试 - 覆盖错误捕获、面包屑、用户上下文等核心功能
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-03-19
 * @updated: 2026-03-19
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,vitest,error-reporting,service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { errorReporting, initErrorReporting } from "../app/components/ide/services/ErrorReportingService";

// Mock console.error
const originalConsoleError = console.error;
const mockConsoleError = vi.fn();

// ── Helper Functions ──

function createMockError(message: string = "Test error"): Error {
  const error = new Error(message);
  error.stack = `Error: ${message}\n    at testFn (test.ts:10:5)`;
  return error;
}

function createMockBreadcrumb() {
  return {
    type: "click" as const,
    category: "ui",
    message: "Clicked button",
    timestamp: Date.now(),
    data: { element: "button" },
  };
}

// ================================================================
// 1. 错误捕获测试
// ================================================================

describe("ErrorReportingService - 错误捕获", () => {
  beforeEach(() => {
    console.error = mockConsoleError;
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("捕获普通错误", () => {
    const error = createMockError("Test error");
    
    const eventId = errorReporting.captureError(error, {
      category: "unknown",
      severity: "error",
    });
    
    expect(eventId).toBeDefined();
    expect(typeof eventId).toBe("string");
  });

  it("捕获错误带自定义消息", () => {
    const error = createMockError("Custom error message");
    
    const eventId = errorReporting.captureError(error, {
      category: "unknown",
    });
    
    expect(eventId).toBeDefined();
  });

  it("捕获错误带分类", () => {
    const categories = ["route", "render", "network", "unknown"] as const;
    
    categories.forEach((category) => {
      const error = createMockError(`${category} error`);
      const eventId = errorReporting.captureError(error, { category });
      expect(eventId).toBeDefined();
    });
  });

  it("捕获错误带严重级别", () => {
    const severities = ["fatal", "error", "warning", "info", "debug"] as const;
    
    severities.forEach((severity) => {
      const error = createMockError(`${severity} error`);
      const eventId = errorReporting.captureError(error, { severity });
      expect(eventId).toBeDefined();
    });
  });

  it("捕获错误带额外上下文", () => {
    const error = createMockError("Error with context");
    const context = { userId: "123", action: "test" };
    
    const eventId = errorReporting.captureError(error, {
      context,
      category: "unknown",
    });
    
    expect(eventId).toBeDefined();
  });

  it("捕获渲染错误", () => {
    const error = createMockError("Render error");
    const componentStack = "at Component (Component.tsx:10:1)";
    
    const eventId = errorReporting.captureRenderError(error, {
      componentStack,
    });
    
    expect(eventId).toBeDefined();
  });
});

// ================================================================
// 2. 面包屑管理测试
// ================================================================

describe("ErrorReportingService - 面包屑管理", () => {
  beforeEach(() => {
    console.error = mockConsoleError;
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("添加面包屑", () => {
    const breadcrumb = createMockBreadcrumb();
    
    expect(() => {
      errorReporting.addBreadcrumb(breadcrumb);
    }).not.toThrow();
  });

  it("添加导航面包屑", () => {
    expect(() => {
      errorReporting.addBreadcrumb({
        type: "navigation",
        category: "route",
        message: "Navigated to /home",
        data: { from: "/", to: "/home" },
      });
    }).not.toThrow();
  });

  it("添加点击面包屑", () => {
    expect(() => {
      errorReporting.addBreadcrumb({
        type: "click",
        category: "ui",
        message: "Clicked button",
        data: { element: "button", id: "test-btn" },
      });
    }).not.toThrow();
  });

  it("添加 HTTP 面包屑", () => {
    expect(() => {
      errorReporting.addBreadcrumb({
        type: "http",
        category: "network",
        message: "GET /api/data",
        data: {
          url: "https://api.example.com/data",
          method: "GET",
          status: 200,
        },
      });
    }).not.toThrow();
  });

  it("添加多个面包屑", () => {
    expect(() => {
      for (let i = 0; i < 10; i++) {
        errorReporting.addBreadcrumb(createMockBreadcrumb());
      }
    }).not.toThrow();
  });
});

// ================================================================
// 3. 初始化测试
// ================================================================

describe("ErrorReportingService - 初始化", () => {
  beforeEach(() => {
    console.error = mockConsoleError;
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("初始化错误上报服务", () => {
    expect(() => {
      initErrorReporting({
        appVersion: "1.0.0",
        environment: "test",
        sampleRate: 1.0,
      });
    }).not.toThrow();
  });

  it("初始化带 DSN", () => {
    expect(() => {
      initErrorReporting({
        dsn: "https://test@sentry.io/123",
        appVersion: "1.0.0",
        environment: "production",
      });
    }).not.toThrow();
  });

  it("服务实例存在", () => {
    expect(errorReporting).toBeDefined();
    expect(errorReporting.captureError).toBeDefined();
    expect(errorReporting.captureRenderError).toBeDefined();
    expect(errorReporting.addBreadcrumb).toBeDefined();
  });
});

// ================================================================
// 4. 集成场景测试
// ================================================================

describe("ErrorReportingService - 集成场景", () => {
  beforeEach(() => {
    console.error = mockConsoleError;
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("服务可以正常调用", () => {
    // 初始化
    initErrorReporting({
      appVersion: "1.0.0",
      environment: "test",
    });
    
    // 验证服务存在
    expect(errorReporting).toBeDefined();
  });

  it("React 错误边界集成", () => {
    const error = createMockError("React error");
    const componentStack = "at TestComponent (TestComponent.tsx:10:1)";
    
    const eventId = errorReporting.captureRenderError(error, {
      componentStack,
    });
    
    expect(eventId).toBeDefined();
  });

  it("多次初始化不冲突", () => {
    expect(() => {
      initErrorReporting({ appVersion: "1.0.0", environment: "test" });
      initErrorReporting({ appVersion: "2.0.0", environment: "production" });
    }).not.toThrow();
  });
});
