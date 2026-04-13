/**
 * @file: ProxyService.test.ts
 * @description: 代理服务测试 - 测试代理请求、超时和重试逻辑
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
// ProxyService 单元测试
// 覆盖: 配置读写、代理请求转发、健康检查
// ================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadProxyConfig,
  saveProxyConfig,
  proxyFetch,
  checkProxyHealth,
  DEFAULT_PROXY_CONFIG,
  type ProxyConfig,
  type ProxyRequest,
} from "../app/components/ide/ProxyService";

function mockFetchResponse(body: any, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    clone: () => mockFetchResponse(body, status),
    formData: () => Promise.resolve(new FormData()),
    redirected: false,
    type: "basic" as ResponseType,
    url: "",
    statusText: "",
    bytes: () => Promise.resolve(new Uint8Array()),
  } as Response;
}

// ================================================================
// 1. 配置读写
// ================================================================

describe("ProxyConfig 读写", () => {
  beforeEach(() => localStorage.clear());

  it("loadProxyConfig — 无存储时返回默认配置", () => {
    const config = loadProxyConfig();
    expect(config.enabled).toBe(false);
    expect(config.baseUrl).toBe(DEFAULT_PROXY_CONFIG.baseUrl);
    expect(config.timeout).toBe(30000);
    expect(config.retries).toBe(2);
    expect(config.rateLimitPerMin).toBe(60);
  });

  it("saveProxyConfig + loadProxyConfig — 持久化往返", () => {
    saveProxyConfig({ enabled: true, baseUrl: "http://proxy.example.com/api" });

    const loaded = loadProxyConfig();
    expect(loaded.enabled).toBe(true);
    expect(loaded.baseUrl).toBe("http://proxy.example.com/api");
    // 未修改的字段保持默认值
    expect(loaded.timeout).toBe(DEFAULT_PROXY_CONFIG.timeout);
  });

  it("saveProxyConfig — 合并而非覆盖", () => {
    saveProxyConfig({ enabled: true });
    saveProxyConfig({ timeout: 10000 });

    const loaded = loadProxyConfig();
    expect(loaded.enabled).toBe(true); // 第一次设置的值保留
    expect(loaded.timeout).toBe(10000); // 第二次设置的值生效
  });

  it("loadProxyConfig — localStorage 损坏时返回默认", () => {
    localStorage.setItem("yyc3_proxy_config", "invalid-json{{{");
    const config = loadProxyConfig();
    expect(config.enabled).toBe(DEFAULT_PROXY_CONFIG.enabled);
  });
});

// ================================================================
// 2. 代理请求转发
// ================================================================

describe("proxyFetch", () => {
  const config: ProxyConfig = {
    enabled: true,
    baseUrl: "http://localhost:3001/api/proxy",
    authToken: "test-token-123",
    timeout: 5000,
    retries: 1,
    rateLimitPerMin: 60,
    allowedProviders: ["openai"],
    corsOrigins: [],
  };

  it("构建正确的代理 URL", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({ ok: true }));

    const request: ProxyRequest = {
      provider: "openai",
      endpoint: "/v1/chat/completions",
      method: "POST",
      body: { model: "gpt-4o", messages: [] },
    };

    await proxyFetch(config, request);

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(
      "http://localhost:3001/api/proxy/openai/v1/chat/completions",
    );
  });

  it("设置 X-Proxy-Auth header", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}));

    await proxyFetch(config, {
      provider: "openai",
      endpoint: "/v1/chat/completions",
      method: "POST",
    });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    expect(headers["X-Proxy-Auth"]).toBe("test-token-123");
  });

  it("流式请求 — 设置 Accept: text/event-stream", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}));

    await proxyFetch(config, {
      provider: "openai",
      endpoint: "/v1/chat/completions",
      method: "POST",
      stream: true,
    });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    expect(headers["Accept"]).toBe("text/event-stream");
  });

  it("无 authToken — 不设置 X-Proxy-Auth", async () => {
    const noAuthConfig = { ...config, authToken: undefined };
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}));

    await proxyFetch(noAuthConfig, {
      provider: "openai",
      endpoint: "/test",
      method: "GET",
    });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    expect(headers["X-Proxy-Auth"]).toBeUndefined();
  });

  it("baseUrl 末尾斜杠 — 正确处理", async () => {
    const trailingSlash = {
      ...config,
      baseUrl: "http://localhost:3001/api/proxy/",
    };
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}));

    await proxyFetch(trailingSlash, {
      provider: "deepseek",
      endpoint: "/v1/chat",
      method: "POST",
    });

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("http://localhost:3001/api/proxy/deepseek/v1/chat");
  });

  it("网络错误 — 正确抛出", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("ECONNREFUSED"));

    await expect(
      proxyFetch(config, {
        provider: "openai",
        endpoint: "/test",
        method: "GET",
      }),
    ).rejects.toThrow("ECONNREFUSED");
  });
});

// ================================================================
// 3. 健康检查
// ================================================================

describe("checkProxyHealth", () => {
  it("代理服务正常 — 返回 healthy", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ status: "ok", version: "1.2.0" }),
    );

    const result = await checkProxyHealth("http://localhost:3001/api/proxy");
    expect(result.healthy).toBe(true);
    expect(result.version).toBe("1.2.0");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("代理服务返回非 200 — 返回 unhealthy", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}, 503));

    const result = await checkProxyHealth("http://localhost:3001/api/proxy");
    expect(result.healthy).toBe(false);
    expect(result.error).toContain("503");
  });

  it("代理服务不可达 — 返回 unhealthy + error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("fetch failed"));

    const result = await checkProxyHealth("http://localhost:3001/api/proxy");
    expect(result.healthy).toBe(false);
    expect(result.error).toBe("fetch failed");
  });

  it("URL 末尾斜杠 — 正确拼接 /health", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({ status: "ok" }));

    await checkProxyHealth("http://proxy.example.com///");

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("http://proxy.example.com/health");
  });
});
