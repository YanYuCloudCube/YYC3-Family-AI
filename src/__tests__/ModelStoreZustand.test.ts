/**
 * @file ModelStoreZustand.test.ts
 * @description 模型状态管理测试 - 测试模型注册、连接状态和心跳监控
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
// ModelStore Zustand 单元测试
// 覆盖: 活跃模型选择、自定义模型管理、连通性状态、心跳配置、
//       延迟历史、Ollama 检测、性能数据同步
// ================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { useModelStoreZustand } from "../app/components/ide/stores/useModelStoreZustand";

const store = () => useModelStoreZustand.getState();
const reset = () => {
  useModelStoreZustand.setState({
    activeModelId: "",
    customModels: [],
    connectivityResults: {},
    heartbeatEnabled: true,
    heartbeatIntervalMs: 60000,
    latencyHistory: [],
    ollamaStatus: "checking",
    ollamaDetectedModels: [],
    importedOllamaIds: [],
    showSettings: false,
  });
};

describe("ModelStore — 活跃模型选择", () => {
  beforeEach(reset);

  it("初始状态 — activeModelId 为空", () => {
    expect(store().activeModelId).toBe("");
  });

  it("setActiveModelId — 正确设置", () => {
    store().setActiveModelId("gpt-4o");
    expect(store().activeModelId).toBe("gpt-4o");
  });
});

describe("ModelStore — 自定义模型管理", () => {
  beforeEach(reset);

  it("addCustomModel — 创建自定义模型", () => {
    store().addCustomModel(
      "my-model",
      "Custom Provider",
      "http://localhost:8080",
      "key-123",
    );

    expect(store().customModels).toHaveLength(1);
    const model = store().customModels[0];
    expect(model.name).toBe("my-model");
    expect(model.provider).toBe("Custom Provider");
    expect(model.providerId).toBe("custom");
    expect(model.endpoint).toBe("http://localhost:8080");
    expect(model.apiKey).toBe("key-123");
    expect(model.type).toBe("llm");
    expect(model.status).toBe("active");
    expect(model.id).toMatch(/^custom::/);
  });

  it("addCustomModel — 无 API Key 时默认空字符串", () => {
    store().addCustomModel("no-key-model", "Provider", "http://example.com");
    expect(store().customModels[0].apiKey).toBe("");
  });

  it("removeCustomModel — 删除指定模型", () => {
    store().addCustomModel("model-a", "P1", "http://a.com");
    store().addCustomModel("model-b", "P2", "http://b.com");

    const idA = store().customModels[0].id;
    store().removeCustomModel(idA);

    expect(store().customModels).toHaveLength(1);
    expect(store().customModels[0].name).toBe("model-b");
  });

  it("removeCustomModel — 删除的是 active model 时重置 activeModelId", () => {
    store().addCustomModel("active-model", "P", "http://x.com");
    const id = store().customModels[0].id;
    store().setActiveModelId(id);

    store().removeCustomModel(id);
    expect(store().activeModelId).toBe("");
  });

  it("updateCustomModel — 部分更新字段", () => {
    store().addCustomModel("test", "P", "http://old.com");
    const id = store().customModels[0].id;

    store().updateCustomModel(id, {
      endpoint: "http://new.com",
      name: "updated",
    });

    expect(store().customModels[0].endpoint).toBe("http://new.com");
    expect(store().customModels[0].name).toBe("updated");
    expect(store().customModels[0].provider).toBe("P"); // 未变
  });

  it("updateCustomModel — 不存在的 ID 不操作", () => {
    store().addCustomModel("test", "P", "http://x.com");
    store().updateCustomModel("nonexistent", { name: "nope" });
    expect(store().customModels[0].name).toBe("test");
  });
});

describe("ModelStore — 连通性状态", () => {
  beforeEach(reset);

  it("setConnectivityResult — 设置测试结果", () => {
    store().setConnectivityResult("gpt-4o", {
      status: "success",
      latencyMs: 150,
      error: null,
      timestamp: Date.now(),
    });

    expect(store().connectivityResults["gpt-4o"]).toBeDefined();
    expect(store().connectivityResults["gpt-4o"].status).toBe("success");
    expect(store().connectivityResults["gpt-4o"].latencyMs).toBe(150);
  });

  it("setConnectivityResult — 覆盖旧结果", () => {
    store().setConnectivityResult("gpt-4o", {
      status: "success",
      latencyMs: 100,
      error: null,
          });
    store().setConnectivityResult("gpt-4o", {
      status: "fail",
      latencyMs: null,
      error: "Timeout",
          });

    expect(store().connectivityResults["gpt-4o"].status).toBe("fail");
    expect(store().connectivityResults["gpt-4o"].error).toBe("Timeout");
  });

  it("clearConnectivityResults — 清空所有结果", () => {
    store().setConnectivityResult("a", {
      status: "success",
      latencyMs: 50,
      error: null,
          });
    store().setConnectivityResult("b", {
      status: "fail",
      latencyMs: null,
      error: "err",
          });

    store().clearConnectivityResults();
    expect(Object.keys(store().connectivityResults)).toHaveLength(0);
  });
});

describe("ModelStore — 心跳配置", () => {
  beforeEach(reset);

  it("默认开启心跳、间隔 60 秒", () => {
    expect(store().heartbeatEnabled).toBe(true);
    expect(store().heartbeatIntervalMs).toBe(60000);
  });

  it("toggleHeartbeat — 切换开关", () => {
    store().toggleHeartbeat(false);
    expect(store().heartbeatEnabled).toBe(false);
    store().toggleHeartbeat(true);
    expect(store().heartbeatEnabled).toBe(true);
  });

  it("setHeartbeatIntervalMs — 正常设置", () => {
    store().setHeartbeatIntervalMs(30000);
    expect(store().heartbeatIntervalMs).toBe(30000);
  });

  it("setHeartbeatIntervalMs — 下限 10 秒", () => {
    store().setHeartbeatIntervalMs(1000);
    expect(store().heartbeatIntervalMs).toBe(10000);
  });

  it("setHeartbeatIntervalMs — 上限 10 分钟", () => {
    store().setHeartbeatIntervalMs(999999);
    expect(store().heartbeatIntervalMs).toBe(600000);
  });
});

describe("ModelStore — 延迟历史", () => {
  beforeEach(reset);

  it("addLatencyRecord — 添加记录", () => {
    store().addLatencyRecord({
      timestamp: Date.now(),
      latencyMs: 200,
      status: "success",
      modelId: "gpt-4o",
    });
    expect(store().latencyHistory).toHaveLength(1);
    expect(store().latencyHistory[0].latencyMs).toBe(200);
  });

  it("addLatencyRecord — 超过 50 条自动裁剪", () => {
    for (let i = 0; i < 60; i++) {
      store().addLatencyRecord({
        timestamp: i,
        latencyMs: i * 10,
        status: "success",
        modelId: "test",
      });
    }
    expect(store().latencyHistory.length).toBeLessThanOrEqual(50);
    // 保留最近 50 条
    expect(store().latencyHistory[0].timestamp).toBe(10);
  });

  it("clearLatencyHistory — 清空记录", () => {
    store().addLatencyRecord({
            latencyMs: 100,
      status: "success",
      modelId: "a",
    });
    store().clearLatencyHistory();
    expect(store().latencyHistory).toHaveLength(0);
  });
});

describe("ModelStore — Ollama 检测", () => {
  beforeEach(reset);

  it("setOllamaStatus — 更新状态", () => {
    store().setOllamaStatus("available");
    expect(store().ollamaStatus).toBe("available");
  });

  it("setOllamaDetectedModels — 设置探测到的模型", () => {
    store().setOllamaDetectedModels([
      { id: "llama3", name: "Llama3", type: "llm", maxTokens: 4096 },
    ]);
    expect(store().ollamaDetectedModels).toHaveLength(1);
    expect(store().ollamaDetectedModels[0].id).toBe("llama3");
  });

  it("importOllamaModel — 记录已导入的模型 ID", () => {
    store().importOllamaModel("llama3:8b");
    expect(store().importedOllamaIds).toContain("llama3:8b");
  });

  it("importOllamaModel — 不重复导入", () => {
    store().importOllamaModel("llama3:8b");
    store().importOllamaModel("llama3:8b");
    expect(
      store().importedOllamaIds.filter((id) => id === "llama3:8b"),
    ).toHaveLength(1);
  });
});

describe("ModelStore — 设置��窗", () => {
  beforeEach(reset);

  it("setShowSettings — 切换显示", () => {
    expect(store().showSettings).toBe(false);
    store().setShowSettings(true);
    expect(store().showSettings).toBe(true);
  });
});

describe("ModelStore — 性能数据同步", () => {
  beforeEach(reset);

  it("syncPerfData — 写入 localStorage", () => {
    store().syncPerfData({
      modelId: "gpt-4o",
      modelName: "GPT-4o",
      providerId: "openai",
      latencyMs: 200,
      success: true,
      timestamp: Date.now(),
      source: "heartbeat",
    });

    const raw = localStorage.getItem("yyc3_model_perf_data");
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw as any);
    expect(data).toHaveLength(1);
    expect(data[0].modelId).toBe("gpt-4o");
  });

  it("syncPerfData — 最多保留 200 条", () => {
    for (let i = 0; i < 210; i++) {
      store().syncPerfData({
        modelId: `model-${i}`,
        modelName: `Model ${i}`,
        providerId: "openai",
        latencyMs: i,
        success: true,
        timestamp: i,
        source: "manual",
      });
    }

    const raw = localStorage.getItem("yyc3_model_perf_data");
    const data = JSON.parse(raw as any);
    expect(data.length).toBeLessThanOrEqual(200);
  });
});
