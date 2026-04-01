/**
 * @file ProxyStoreZustand.test.ts
 * @description 代理状态管理测试 - 测试代理服务器配置和健康检查
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,unit-test
 */

// @ts-nocheck
// ================================================================
// ProxyStore Zustand 单元测试
// 覆盖: 配置更新、重置、健康状态管理
// ================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { useProxyStoreZustand } from "../app/components/ide/stores/useProxyStoreZustand";
import { DEFAULT_PROXY_CONFIG } from "../app/components/ide/ProxyService";

const store = () => useProxyStoreZustand.getState();
const reset = () => {
  useProxyStoreZustand.setState({
    config: { ...DEFAULT_PROXY_CONFIG },
    healthStatus: "unknown",
    healthLatencyMs: null,
    healthVersion: null,
    healthError: null,
  });
};

describe("ProxyStore — 配置管理", () => {
  beforeEach(reset);

  it("初始状态 — 默认配置", () => {
    expect(store().config.enabled).toBe(false);
    expect(store().config.baseUrl).toBe(DEFAULT_PROXY_CONFIG.baseUrl);
    expect(store().config.timeout).toBe(30000);
  });

  it("updateConfig — 部分更新", () => {
    store().updateConfig({ enabled: true, baseUrl: "http://new-proxy.com" });

    expect(store().config.enabled).toBe(true);
    expect(store().config.baseUrl).toBe("http://new-proxy.com");
    expect(store().config.timeout).toBe(30000); // 未改变
  });

  it("updateConfig — 多次更新合并", () => {
    store().updateConfig({ enabled: true });
    store().updateConfig({ timeout: 10000 });

    expect(store().config.enabled).toBe(true);
    expect(store().config.timeout).toBe(10000);
  });

  it("resetConfig — 恢复默认并重置健康状态", () => {
    store().updateConfig({ enabled: true, baseUrl: "http://custom.com" });
    store().setHealthStatus("healthy", { latencyMs: 50, version: "2.0" });

    store().resetConfig();

    expect(store().config.enabled).toBe(false);
    expect(store().config.baseUrl).toBe(DEFAULT_PROXY_CONFIG.baseUrl);
    expect(store().healthStatus).toBe("unknown");
    expect(store().healthLatencyMs).toBeNull();
    expect(store().healthVersion).toBeNull();
  });
});

describe("ProxyStore — 健康状态", () => {
  beforeEach(reset);

  it("setHealthStatus — 设置为 healthy 带详情", () => {
    store().setHealthStatus("healthy", { latencyMs: 45, version: "1.5.0" });

    expect(store().healthStatus).toBe("healthy");
    expect(store().healthLatencyMs).toBe(45);
    expect(store().healthVersion).toBe("1.5.0");
  });

  it("setHealthStatus — 设置为 unhealthy 带错误", () => {
    store().setHealthStatus("unhealthy", { error: "Connection refused" });

    expect(store().healthStatus).toBe("unhealthy");
    expect(store().healthError).toBe("Connection refused");
  });

  it("setHealthStatus — checking 状态", () => {
    store().setHealthStatus("checking");
    expect(store().healthStatus).toBe("checking");
  });

  it("setHealthStatus — 无详情时不修改之前的值", () => {
    store().setHealthStatus("healthy", { latencyMs: 100, version: "1.0" });
    store().setHealthStatus("checking"); // 无详情

    expect(store().healthStatus).toBe("checking");
    // 之前的详情应保持 (因为没传新值)
    expect(store().healthLatencyMs).toBe(100);
  });
});
