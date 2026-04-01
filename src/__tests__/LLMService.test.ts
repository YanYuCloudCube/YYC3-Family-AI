/**
 * @file LLMService.test.ts
 * @description LLM 服务测试 - 测试 LLM API 调用、流式响应和错误处理
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
// LLMService 单元测试
// 覆盖: API Key 管理、Ollama 探测、连通性测试、聊天完成、代码提取、意图分析
// ================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getApiKey,
  setApiKey,
  hasApiKey,
  detectOllama,
  testModelConnectivity,
  chatCompletion,
  extractCodeBlock,
  PROVIDER_CONFIGS,
  type ProviderConfig,
  type ProviderId,
} from "../app/components/ide/LLMService";

// ── Helper: 创建 mock Response ──
function mockFetchResponse(body: any, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers(),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    clone: () => mockFetchResponse(body, status),
    formData: () => Promise.resolve(new FormData()),
    redirected: false,
    type: "basic" as ResponseType,
    url: "",
    bytes: () => Promise.resolve(new Uint8Array()),
  } as Response;
}

// ================================================================
// 1. API Key 存储管理
// ================================================================

describe("API Key 管理", () => {
  it("getApiKey — 未设置时返回空字符串", () => {
    expect(getApiKey("openai")).toBe("");
  });

  it("setApiKey + getApiKey — 正常存取", () => {
    setApiKey("openai", "sk-test-123");
    expect(getApiKey("openai")).toBe("sk-test-123");
  });

  it("setApiKey 空字符串 — 删除 key", () => {
    setApiKey("zhipu", "zhipu-key-abc");
    expect(getApiKey("zhipu")).toBe("zhipu-key-abc");
    setApiKey("zhipu", "");
    expect(getApiKey("zhipu")).toBe("");
  });

  it("hasApiKey — 正确反映存在状态", () => {
    expect(hasApiKey("deepseek")).toBe(false);
    setApiKey("deepseek", "ds-key");
    expect(hasApiKey("deepseek")).toBe(true);
  });

  it("不同 Provider 的 key 互不干扰", () => {
    setApiKey("openai", "openai-key");
    setApiKey("zhipu", "zhipu-key");
    expect(getApiKey("openai")).toBe("openai-key");
    expect(getApiKey("zhipu")).toBe("zhipu-key");
    expect(getApiKey("deepseek")).toBe("");
  });
});

// ================================================================
// 2. PROVIDER_CONFIGS 静态配置验证
// ================================================================

describe("PROVIDER_CONFIGS 验证", () => {
  it("包含所有 6 个 Provider", () => {
    const ids = PROVIDER_CONFIGS.map((p) => p.id);
    expect(ids).toContain("ollama");
    expect(ids).toContain("openai");
    expect(ids).toContain("zhipu");
    expect(ids).toContain("dashscope");
    expect(ids).toContain("deepseek");
    expect(ids).toContain("custom");
    expect(PROVIDER_CONFIGS).toHaveLength(6);
  });

  it("Ollama 为本地 provider、无需 auth", () => {
    const ollama = PROVIDER_CONFIGS.find((p) => p.id === "ollama")!;
    expect(ollama.isLocal).toBe(true);
    expect(ollama.authType).toBe("none");
    expect(ollama.models).toHaveLength(0); // 动态获取
  });

  it("OpenAI 需要 bearer auth", () => {
    const openai = PROVIDER_CONFIGS.find((p) => p.id === "openai")!;
    expect(openai.authType).toBe("bearer");
    expect(openai.isLocal).toBe(false);
    expect(openai.models.length).toBeGreaterThan(0);
  });

  it("每个 cloud provider 的模型都有有效字段", () => {
    const cloudProviders = PROVIDER_CONFIGS.filter(
      (p) => !p.isLocal && p.id !== "custom",
    );
    for (const provider of cloudProviders) {
      for (const model of provider.models) {
        expect(model.id).toBeTruthy();
        expect(model.name).toBeTruthy();
        expect(["llm", "code", "vision", "embedding"]).toContain(model.type);
        expect(model.maxTokens).toBeGreaterThan(0);
      }
    }
  });
});

// ================================================================
// 3. detectOllama — 本地探测
// ================================================================

describe("detectOllama", () => {
  it("Ollama 在线 — 返回模型列表", async () => {
    const mockModels = {
      models: [
        {
          name: "llama3.1:8b",
          model: "llama3.1:8b",
          details: { family: "llama", parameter_size: "8B" },
        },
        {
          name: "deepseek-coder:6.7b",
          model: "deepseek-coder:6.7b",
          details: { family: "deepseek" },
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(mockModels));

    const result = await detectOllama();
    expect(result.available).toBe(true);
    expect(result.models).toHaveLength(2);
    expect(result.models[0].id).toBe("llama3.1:8b");
    expect(result.models[0].type).toBe("llm");
    expect(result.models[1].type).toBe("code"); // deepseek-coder 应被检测为 code 类型
  });

  it("Ollama 离线 — 返回不可用", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Connection refused"));

    const result = await detectOllama();
    expect(result.available).toBe(false);
    expect(result.models).toHaveLength(0);
  });

  it("Ollama 返回非 200 — 返回不可用", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}, 500));

    const result = await detectOllama();
    expect(result.available).toBe(false);
    expect(result.models).toHaveLength(0);
  });

  it("Ollama 返回空模型列表 — 可用但无模型", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({ models: [] }));

    const result = await detectOllama();
    expect(result.available).toBe(true);
    expect(result.models).toHaveLength(0);
  });
});

// ================================================================
// 4. testModelConnectivity — 连通性测试
// ================================================================

describe("testModelConnectivity", () => {
  const openaiConfig = PROVIDER_CONFIGS.find((p) => p.id === "openai")!;

  it("无 API Key — 立即返回 NO_API_KEY 错误", async () => {
    const result = await testModelConnectivity(openaiConfig, "gpt-4o");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NO_API_KEY");
    expect(result.providerId).toBe("openai");
    expect(result.modelId).toBe("gpt-4o");
  });

  it("有 API Key 且连通成功", async () => {
    setApiKey("openai", "sk-test-key");

    const mockResponse = {
      choices: [{ message: { content: "Hello!" } }],
    };
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(mockResponse));

    const result = await testModelConnectivity(openaiConfig, "gpt-4o");
    expect(result.success).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.reply).toBe("Hello!");
    expect(result.error).toBeUndefined();
  });

  it("HTTP 401 — 认证失败", async () => {
    setApiKey("openai", "sk-bad-key");

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ error: { message: "Invalid API key" } }, 401),
    );

    const result = await testModelConnectivity(openaiConfig, "gpt-4o");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("HTTP_401");
    expect(result.error).toContain("认证失败");
  });

  it("HTTP 404 — 模型不存在", async () => {
    setApiKey("openai", "sk-test");

    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}, 404));

    const result = await testModelConnectivity(openaiConfig, "gpt-nonexist");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("HTTP_404");
    expect(result.error).toContain("gpt-nonexist");
  });

  it("HTTP 429 — 频率超限", async () => {
    setApiKey("openai", "sk-test");

    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}, 429));

    const result = await testModelConnectivity(openaiConfig, "gpt-4o");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("HTTP_429");
    expect(result.error).toContain("频率超限");
  });

  it("HTTP 500 — 服务端错误", async () => {
    setApiKey("openai", "sk-test");

    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}, 500));

    const result = await testModelConnectivity(openaiConfig, "gpt-4o");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("HTTP_500");
    expect(result.error).toContain("服务端错误");
  });

  it("网络错误 — NETWORK 错误码", async () => {
    setApiKey("openai", "sk-test");

    vi.mocked(fetch).mockRejectedValueOnce(new Error("Failed to fetch"));

    const result = await testModelConnectivity(openaiConfig, "gpt-4o");
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NETWORK");
    expect(result.error).toContain("网络连接失败");
  });

  it("超时 — TIMEOUT 错误码", async () => {
    setApiKey("openai", "sk-test");

    const abortError = new DOMException("Aborted", "AbortError");
    vi.mocked(fetch).mockRejectedValueOnce(abortError);

    const result = await testModelConnectivity(openaiConfig, "gpt-4o", {
      timeoutMs: 1000,
    });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("TIMEOUT");
  });

  it("Ollama provider — 无需 API Key", async () => {
    const ollamaConfig = PROVIDER_CONFIGS.find((p) => p.id === "ollama")!;

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ message: { content: "Hi there!" } }),
    );

    const result = await testModelConnectivity(ollamaConfig, "llama3.1:8b");
    expect(result.success).toBe(true);
    expect(result.reply).toBe("Hi there!");
  });

  it("结果包含 timestamp", async () => {
    const ollamaConfig = PROVIDER_CONFIGS.find((p) => p.id === "ollama")!;
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ message: { content: "" } }),
    );

    const before = Date.now();
    const result = await testModelConnectivity(ollamaConfig, "test");
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
  });
});

// ================================================================
// 5. chatCompletion — 非流式调用
// ================================================================

describe("chatCompletion", () => {
  it("OpenAI 格式 — 正确解析 choices 响应", async () => {
    setApiKey("openai", "sk-test");
    const config = PROVIDER_CONFIGS.find((p) => p.id === "openai")!;

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({
        choices: [{ message: { content: "Generated code here" } }],
      }),
    );

    const result = await chatCompletion(config, "gpt-4o", [
      { role: "user", content: "Write hello world" },
    ]);
    expect(result).toBe("Generated code here");
  });

  it("Ollama 格式 �� 正确解析 message.content 响应", async () => {
    const config = PROVIDER_CONFIGS.find((p) => p.id === "ollama")!;

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ message: { content: "Ollama reply" } }),
    );

    const result = await chatCompletion(config, "llama3.1:8b", [
      { role: "user", content: "Hello" },
    ]);
    expect(result).toBe("Ollama reply");
  });

  it("API 错误 — 抛出带 provider 名称的 Error", async () => {
    setApiKey("deepseek", "ds-key");
    const config = PROVIDER_CONFIGS.find((p) => p.id === "deepseek")!;

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse("Rate limit exceeded", 429),
    );

    await expect(
      chatCompletion(config, "deepseek-chat", [
        { role: "user", content: "test" },
      ]),
    ).rejects.toThrow(/DeepSeek/);
  });

  it("支持自定义 temperature 和 maxTokens", async () => {
    setApiKey("openai", "sk-test");
    const config = PROVIDER_CONFIGS.find((p) => p.id === "openai")!;

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse({ choices: [{ message: { content: "ok" } }] }),
    );

    await chatCompletion(
      config,
      "gpt-4o",
      [{ role: "user", content: "test" }],
      {
        temperature: 0.2,
        maxTokens: 1024,
      },
    );

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.temperature).toBe(0.2);
    expect(body.max_tokens).toBe(1024);
  });
});

// ================================================================
// 6. extractCodeBlock — 代码块提取
// ================================================================

describe("extractCodeBlock", () => {
  it("提取带语言标记的代码块", () => {
    const text = "Here is the code:\n```typescript\nconst x = 1\n```\nDone.";
    const result = extractCodeBlock(text);
    expect(result).not.toBeNull();
    expect((result as any).lang).toBe("typescript");
    expect((result as any).code).toBe("const x = 1");
  });

  it("无语言标记 — 默认 tsx", () => {
    const text = "```\nconst y = 2\n```";
    const result = extractCodeBlock(text);
    expect(result).not.toBeNull();
    expect((result as any).lang).toBe("tsx");
    expect((result as any).code).toBe("const y = 2");
  });

  it("无代码块 — 返回 null", () => {
    const text = "No code block here";
    expect(extractCodeBlock(text)).toBeNull();
  });

  it("多行代码块 — 正确提取", () => {
    const text = "```jsx\nfunction App() {\n  return <div>Hello</div>\n}\n```";
    const result = extractCodeBlock(text);
    expect((result as any).lang).toBe("jsx");
    expect((result as any).code).toContain("function App()");
    expect((result as any).code).toContain("return <div>Hello</div>");
  });

  it("多个代码块 — 提取第一个", () => {
    const text =
      '```python\nprint("hello")\n```\n\n```javascript\nconsole.log("world")\n```';
    const result = extractCodeBlock(text);
    expect((result as any).lang).toBe("python");
    expect((result as any).code).toContain("print");
  });
});
