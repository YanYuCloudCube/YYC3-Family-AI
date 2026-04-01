// @ts-nocheck
/**
 * @file LLMServiceAdvanced.test.ts
 * @description LLM Service 核心功能高级测试 - 覆盖流式响应、错误处理、边界情况
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,llm,streaming,error-handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  chatCompletionStream,
  extractCodeBlock,
  analyzeIntentAI,
  type ChatMessage,
} from "../app/components/ide/LLMService";
import {
  detectIntent,
  buildSystemPrompt,
  buildChatMessages,
} from "../app/components/ide/ai/SystemPromptBuilder";
import {
  parseCodeBlocks,
  applyCodeToFiles,
  validateCodeBlock,
  type ParsedCodeBlock,
} from "../app/components/ide/ai/CodeApplicator";
import {
  collectContext,
  compressContext,
} from "../app/components/ide/ai/ContextCollector";
import {
  extractTasksFromResponse,
} from "../app/components/ide/ai/TaskInferenceEngine";

// ================================================================
// 1. 流式响应测试
// ================================================================

describe("LLM Service - 流式响应", () => {
  let mockFetch: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockFetch = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it("OpenAI 格式流式响应处理", async () => {
    const mockStreamData = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}',
      'data: {"choices":[{"delta":{"content":" World"}}]}',
      'data: [DONE]',
    ];

    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(mockStreamData[0] + "\n"),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(mockStreamData[1] + "\n"),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(mockStreamData[2] + "\n"),
        })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    } as any);

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await chatCompletionStream(
      {
        id: "openai",
        name: "OpenAI",
        nameEn: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        authType: "bearer",
        apiKey: "test-key",
        models: [],
        isLocal: false,
        detected: false,
        description: "OpenAI",
        docsUrl: "https://openai.com",
      },
      "gpt-4o",
      [{ role: "user", content: "Hello" }],
      { onToken, onDone, onError }
    );

    expect(onToken).toHaveBeenCalledTimes(2);
    expect(onToken).toHaveBeenCalledWith("Hello");
    expect(onToken).toHaveBeenCalledWith(" World");
    expect(onDone).toHaveBeenCalledWith("Hello World");
    expect(onError).not.toHaveBeenCalled();
  });

  it("Ollama 格式流式响应处理", async () => {
    const mockStreamData = [
      '{"message":{"content":"Hello"},"done":false}',
      '{"message":{"content":" World"},"done":false}',
      '{"message":{"content":"!"},"done":true}',
    ];

    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(mockStreamData[0] + "\n"),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(mockStreamData[1] + "\n"),
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(mockStreamData[2] + "\n"),
        })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    } as any);

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await chatCompletionStream(
      {
        id: "ollama",
        name: "Ollama",
        nameEn: "Ollama",
        baseUrl: "http://localhost:11434",
        authType: "none",
        models: [],
        isLocal: true,
        detected: true,
        description: "Ollama",
        docsUrl: "https://ollama.com",
      },
      "llama3",
      [{ role: "user", content: "Hello" }],
      { onToken, onDone, onError }
    );

    expect(onToken).toHaveBeenCalledTimes(3);
    expect(onDone).toHaveBeenCalledWith("Hello World!");
  });

  it("流式响应错误处理", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: () => Promise.resolve("Invalid API key"),
    } as any);

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await chatCompletionStream(
      {
        id: "openai",
        name: "OpenAI",
        nameEn: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        authType: "bearer",
        apiKey: "invalid-key",
        models: [],
        isLocal: false,
        detected: false,
        description: "OpenAI",
        docsUrl: "https://openai.com",
      },
      "gpt-4o",
      [{ role: "user", content: "Hello" }],
      { onToken, onDone, onError }
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining("API 错误 401")
    );
  });

  it("网络错误处理", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await chatCompletionStream(
      {
        id: "openai",
        name: "OpenAI",
        nameEn: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        authType: "bearer",
        apiKey: "test-key",
        models: [],
        isLocal: false,
        detected: false,
        description: "OpenAI",
        docsUrl: "https://openai.com",
      },
      "gpt-4o",
      [{ role: "user", content: "Hello" }],
      { onToken, onDone, onError }
    );

    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining("网络错误")
    );
  });
});

// ================================================================
// 2. 代码提取测试
// ================================================================

describe("代码提取功能", () => {
  it("提取单语言代码块", () => {
    const text = `
Here is the code:

\`\`\`typescript
function add(a: number, b: number): number {
  return a + b;
}
\`\`\`
    `;

    const result = extractCodeBlock(text);
    expect(result).not.toBeNull();
    expect(result?.lang).toBe("typescript");
    expect(result?.code).toContain("function add");
  });

  it("提取无语言标识代码块", () => {
    const text = `
\`\`\`
function hello() {
  console.warn("Hello");
}
\`\`\`
    `;

    const result = extractCodeBlock(text);
    expect(result).not.toBeNull();
    expect(result?.lang).toBe("tsx"); // 默认语言
    expect(result?.code).toContain("function hello");
  });

  it("提取多个代码块中的第一个", () => {
    const text = `
First block:

\`\`\`typescript
const a = 1;
\`\`\`

Second block:

\`\`\`javascript
const b = 2;
\`\`\`
    `;

    const result = extractCodeBlock(text);
    expect(result?.lang).toBe("typescript");
    expect(result?.code).toContain("const a = 1");
  });

  it("无代码块返回 null", () => {
    const text = "This is just plain text";
    const result = extractCodeBlock(text);
    expect(result).toBeNull();
  });
});

// ================================================================
// 3. 意图识别测试
// ================================================================

describe("意图识别功能", () => {
  it("识别创建意图", () => {
    const request = "帮我创建一个登录页面";
    const intent = detectIntent(request);
    expect(intent).toBe("generate");
  });

  it("识别修改意图", () => {
    const request = "修改这个组件的样式";
    const intent = detectIntent(request);
    expect(intent).toBe("modify");
  });

  it("识别解释意图", () => {
    const request = "解释一下这段代码的作用";
    const intent = detectIntent(request);
    expect(intent).toBe("explain");
  });

  it("识别优化意图", () => {
    const request = "重构这个函数，提升性能";
    const intent = detectIntent(request);
    expect(intent).toBe("refactor");
  });

  it("识别调试意图", () => {
    const request = "帮我修复这个报错";
    const intent = detectIntent(request);
    expect(intent).toBe("fix");
  });
});

// ================================================================
// 4. 系统提示词构建测试
// ================================================================

describe("系统提示词构建", () => {
  it("构建带上下文的系统提示词", () => {
    const context = {
      fileTree: "src/\n  App.tsx\n  index.tsx",
      activeFile: {
        path: "src/App.tsx",
        content: "export default function App() {}",
      },
      totalFiles: 2,
      totalLines: 50,
      gitSummary: null,
      openTabs: [],
      selectedFilesContent: {},
    };

    const prompt = buildSystemPrompt("modify", context);
    expect(prompt).toContain("YYC³ Family AI");
    expect(prompt).toContain("修改");
  });

  it("构建不带上下文的系统提示词", () => {
    const prompt = buildSystemPrompt("generate", null);
    expect(prompt).toContain("YYC³ Family AI");
    expect(prompt).toContain("生成");
  });
});

// ================================================================
// 5. 聊天消息构建测试
// ================================================================

describe("聊天消息构建", () => {
  it("构建带历史的消息", () => {
    const history: ChatMessage[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ];

    const messages = buildChatMessages("How are you?", history, null);
    expect(messages).toHaveLength(4); // system + 2 history + 1 current
    expect(messages[messages.length - 1].content).toBe("How are you?");
  });

  it("构建不带历史的消息", () => {
    const messages = buildChatMessages("Hello", [], null);
    expect(messages).toHaveLength(2); // system + 1 current
  });

  it("限制历史消息数量", () => {
    const history: ChatMessage[] = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i}`,
    }));

    const messages = buildChatMessages("New message", history, null, {
      maxHistoryMessages: 5,
    });

    // system + 5 history + 1 current = 7
    expect(messages).toHaveLength(7);
  });
});

// ================================================================
// 6. 代码块解析测试
// ================================================================

describe("代码块解析", () => {
  it("解析带文件路径的代码块", () => {
    const aiResponse = `
\`\`\`typescript
// filepath: src/utils/helper.ts
export function add(a: number, b: number): number {
  return a + b;
}
\`\`\`
    `;

    const plan = parseCodeBlocks(aiResponse, {});
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].filepath).toBe("src/utils/helper.ts");
    expect(plan.blocks[0].isNew).toBe(true);
  });

  it("解析更新现有文件的代码块", () => {
    const fileContents = {
      "src/App.tsx": "export default function App() {}",
    };

    const aiResponse = `
\`\`\`typescript
// filepath: src/App.tsx
export default function App() {
  return <div>Updated</div>;
}
\`\`\`
    `;

    const plan = parseCodeBlocks(aiResponse, fileContents);
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].isNew).toBe(false);
  });

  it("解析多个代码块", () => {
    const aiResponse = `
\`\`\`typescript
// filepath: src/a.ts
export const a = 1;
\`\`\`

\`\`\`typescript
// filepath: src/b.ts
export const b = 2;
\`\`\`
    `;

    const plan = parseCodeBlocks(aiResponse, {});
    expect(plan.blocks).toHaveLength(2);
    expect(plan.fileCount).toBe(2);
    expect(plan.newFileCount).toBe(2);
  });
});

// ================================================================
// 7. 代码应用测试
// ================================================================

describe("代码应用", () => {
  it("应用新文件创建", () => {
    const mockCreateFile = vi.fn();
    const mockUpdateFile = vi.fn();

    const plan: ParsedCodeBlock = {
      blocks: [
        {
          filepath: "src/NewComponent.tsx",
          language: "tsx",
          content: "export function NewComponent() {}",
          isNew: true,
        },
      ],
      fileCount: 1,
      newFileCount: 1,
      modifiedFileCount: 0,
      summary: "创建新组件",
    };

    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);
    expect(result.success).toBe(true);
    expect(mockCreateFile).toHaveBeenCalledWith(
      "src/NewComponent.tsx",
      "export function NewComponent() {}"
    );
    expect(mockUpdateFile).not.toHaveBeenCalled();
  });

  it("应用现有文件更新", () => {
    const mockCreateFile = vi.fn();
    const mockUpdateFile = vi.fn();

    const plan: ParsedCodeBlock = {
      blocks: [
        {
          filepath: "src/App.tsx",
          language: "tsx",
          content: "export default function App() {}",
          isNew: false,
        },
      ],
      fileCount: 1,
      newFileCount: 0,
      modifiedFileCount: 1,
      summary: "更新 App 组件",
    };

    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);
    expect(result.success).toBe(true);
    expect(mockUpdateFile).toHaveBeenCalledWith(
      "src/App.tsx",
      "export default function App() {}"
    );
    expect(mockCreateFile).not.toHaveBeenCalled();
  });
});

// ================================================================
// 8. 代码验证测试
// ================================================================

describe("代码验证", () => {
  it("验证有效代码块", () => {
    const block: ParsedCodeBlock = {
      filepath: "src/Valid.tsx",
      language: "tsx",
      content: "export function Valid() {}",
      isNew: true,
    };

    const result = validateCodeBlock(block);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("验证过长代码块", () => {
    const block: ParsedCodeBlock = {
      filepath: "src/Long.tsx",
      language: "tsx",
      content: "x".repeat(10001),
      isNew: true,
    };

    const result = validateCodeBlock(block);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("代码过长");
  });

  it("验证空代码块", () => {
    const block: ParsedCodeBlock = {
      filepath: "src/Empty.tsx",
      language: "tsx",
      content: "",
      isNew: true,
    };

    const result = validateCodeBlock(block);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("代码为空");
  });
});

// ================================================================
// 9. 任务提取测试
// ================================================================

describe("任务提取", () => {
  it("提取 TODO 格式任务", () => {
    const response = `
好的，我来帮你：

TODO: 创建登录页面
TODO: 添加表单验证
    `;

    const tasks = extractTasksFromResponse(response, "帮我创建登录页面", "msg-123");
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].task.title).toContain("创建登录页面");
  });

  it("提取编号列表任务", () => {
    const response = `
我来帮你完成以下任务：

1. 创建用户管理界面，包含注册和登录功能
2. 实现数据持久化，使用本地存储保存用户数据
3. 添加全局错误处理机制，提升应用稳定性
    `;

    const tasks = extractTasksFromResponse(response, "帮我开发功能", "msg-123");
    expect(tasks.length).toBeGreaterThan(0);
  });

  it("过滤过短的任务", () => {
    const response = `
TODO: 好
TODO: 创建完整的用户管理系统
    `;

    const tasks = extractTasksFromResponse(response, "开发功能", "msg-123");
    // 第一个任务太短应该被过滤
    expect(tasks.every(t => t.task.title.length >= 5)).toBe(true);
  });

  it("限制返回任务数量", () => {
    const response = Array.from({ length: 10 }, (_, i) => 
      `TODO: 任务 ${i + 1}`
    ).join("\n");

    const tasks = extractTasksFromResponse(response, "开发功能", "msg-123");
    expect(tasks.length).toBeLessThanOrEqual(5); // 最多 5 个
  });
});

// ================================================================
// 10. 上下文收集测试
// ================================================================

describe("上下文收集", () => {
  it("收集完整上下文", () => {
    const input = {
      fileContents: {
        "src/App.tsx": "export default function App() {}",
        "src/index.tsx": "console.warn('Hello')",
      },
      activeFile: "src/App.tsx",
      openTabs: [
        { path: "src/App.tsx", modified: true },
        { path: "src/index.tsx", modified: false },
      ],
      gitBranch: "feature/test",
      gitChanges: [
        { path: "src/App.tsx", status: "modified", staged: false },
      ],
    };

    const context = collectContext(input);
    expect(context.fileTree).toContain("src/");
    expect(context.fileTree).toContain("App.tsx");
    expect(context.activeFile).not.toBeNull();
    expect(context.activeFile?.path).toBe("src/App.tsx");
    expect(context.totalFiles).toBe(2);
  });

  it("处理空项目", () => {
    const input = {
      fileContents: {},
      activeFile: "",
      openTabs: [],
      gitBranch: "",
      gitChanges: [],
    };

    const context = collectContext(input);
    expect(context.fileTree).toBe("(empty project)");
    expect(context.activeFile).toBeNull();
    expect(context.totalFiles).toBe(0);
  });

  it("处理不存在的活跃文件", () => {
    const input = {
      fileContents: {
        "src/App.tsx": "export default function App() {}",
      },
      activeFile: "src/NonExistent.tsx",
      openTabs: [],
      gitBranch: "main",
      gitChanges: [],
    };

    const context = collectContext(input);
    expect(context.activeFile).toBeNull();
  });
});

// ================================================================
// 11. 上下文压缩测试
// ================================================================

describe("上下文压缩", () => {
  it("压缩大文件内容", () => {
    const largeContent = "x".repeat(20000);
    const context = {
      fileTree: "src/\n  App.tsx",
      activeFile: {
        path: "src/App.tsx",
        content: largeContent,
      },
      totalFiles: 1,
      totalLines: 20000,
      gitSummary: null,
      openTabs: [],
      selectedFilesContent: {},
    };

    const compressed = compressContext(context, 10000);
    expect(compressed.length).toBeLessThan(15000);
  });

  it("小内容不压缩", () => {
    const context = {
      fileTree: "src/\n  App.tsx",
      activeFile: {
        path: "src/App.tsx",
        content: "Small content",
      },
      totalFiles: 1,
      totalLines: 1,
      gitSummary: null,
      openTabs: [],
      selectedFilesContent: {},
    };

    const compressed = compressContext(context, 10000);
    expect(compressed).toContain("Small content");
  });
});
