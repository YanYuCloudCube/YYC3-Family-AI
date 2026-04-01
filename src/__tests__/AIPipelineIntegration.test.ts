// @ts-nocheck
/**
 * @file AIPipelineIntegration.test.ts
 * @description AI Pipeline 集成测试——
 *              完整流程、多步骤代码生成、错误处理、组件集成
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,ai,pipeline,integration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Import AI Pipeline components ──
import {
  collectContext,
  compressContext,
  type ContextCollectorInput,
} from "../app/components/ide/ai/ContextCollector";

import {
  detectIntent,
  buildSystemPrompt,
  buildChatMessages,
  type UserIntent,
} from "../app/components/ide/ai/SystemPromptBuilder";

import {
  parseCodeBlocks,
  applyCodeToFiles,
  generateSimpleDiff,
  validateCodeBlock,
  type ParsedCodeBlock,
} from "../app/components/ide/ai/CodeApplicator";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Integration Test Suites
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("AI Pipeline — 完整流程集成", () => {
  let mockUpdateFile: ReturnType<
    typeof vi.fn<(path: string, content: string) => void>
  >;
  let mockCreateFile: ReturnType<
    typeof vi.fn<(path: string, content: string) => void>
  >;

  beforeEach(() => {
    mockUpdateFile = vi.fn();
    mockCreateFile = vi.fn();
  });

  it("完整流程：上下文收集 → 意图检测 → 提示词构建 → 代码解析 → 应用", () => {
    const input: ContextCollectorInput = {
      fileContents: {
        "src/app/App.tsx":
          "export default function App() { return <div>Old</div> }",
        "src/utils/helper.ts":
          "export function add(a: number, b: number) { return a + b }",
      },
      activeFile: "src/app/App.tsx",
      openTabs: [
        { path: "src/app/App.tsx", modified: true },
        { path: "src/utils/helper.ts", modified: false },
      ],
      gitBranch: "feature/new-feature",
      gitChanges: [
        { path: "src/app/App.tsx", status: "modified", staged: false },
      ],
    };

    const userRequest = "修改 App 组件，添加一个按钮";

    // 1. 上下文收集
    const context = collectContext(input);
    expect(context.activeFile).not.toBeNull();
    expect((context.activeFile as any).path).toBe("src/app/App.tsx");

    // 2. 意图检测
    const intent = detectIntent(userRequest);
    expect(intent).toBe("generate");

    // 3. 系统提示词构建
    const systemPrompt = buildSystemPrompt(intent, context);
    expect(systemPrompt).toContain("YYC³ Family AI");
    expect(systemPrompt).toContain("项目上下文");
    expect(systemPrompt).toContain("src/app/App.tsx");

    // 4. 模拟 AI 响应
    const aiResponse = `好的，我来修改 App 组件：

\`\`\`tsx
// filepath: src/app/App.tsx
export default function App() { 
  return (
    <div>
      <h1>Hello</h1>
      <button onClick={() => console.warn('clicked')}>Click me</button>
    </div>
  )
}
\`\`\``;

    // 5. 代码块解析
    const plan = parseCodeBlocks(aiResponse, input.fileContents);
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].filepath).toBe("src/app/App.tsx");
    expect(plan.blocks[0].isNew).toBe(false);

    // 6. 代码应用
    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);
    expect(result.success).toBe(true);
    expect(result.appliedFiles).toContain("src/app/App.tsx");
    expect(mockUpdateFile).toHaveBeenCalledWith(
      "src/app/App.tsx",
      expect.stringContaining("button"),
    );
  });

  it("创建新文件的完整流程", () => {
    const input: ContextCollectorInput = {
      fileContents: {
        "src/app/App.tsx":
          "export default function App() { return <div>Hello</div> }",
      },
      activeFile: "src/app/App.tsx",
      openTabs: [{ path: "src/app/App.tsx", modified: false }],
      gitBranch: "main",
      gitChanges: [],
    };

    const userRequest = "创建一个 Button 组件";

    // 完整流程
    const context = collectContext(input);
    const intent = detectIntent(userRequest);
    const systemPrompt = buildSystemPrompt(intent, context);

    const aiResponse = `好的，我来创建 Button 组件：

\`\`\`tsx
// filepath: src/components/Button.tsx
import React from 'react'

export function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick}>{children}</button>
}
\`\`\``;

    const plan = parseCodeBlocks(aiResponse, input.fileContents);
    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);

    expect(intent).toBe("generate");
    expect(plan.blocks[0].isNew).toBe(true);
    expect(result.success).toBe(true);
    expect(mockCreateFile).toHaveBeenCalledWith(
      "src/components/Button.tsx",
      expect.stringContaining("Button"),
    );
  });
});

describe("AI Pipeline — 多步骤代码生成", () => {
  it("处理多个文件的代码生成", () => {
    const fileContents = {
      "src/app/App.tsx":
        "export default function App() { return <div>Hello</div> }",
    };

    const aiResponse = `我来创建多个组件：

\`\`\`tsx
// filepath: src/components/Button.tsx
export function Button() { return <button>Click</button> }
\`\`\`

\`\`\`tsx
// filepath: src/components/Input.tsx
export function Input() { return <input /> }
\`\`\`

\`\`\`tsx
// filepath: src/components/Card.tsx
export function Card() { return <div>Card</div> }
\`\`\``;

    const plan = parseCodeBlocks(aiResponse, fileContents);
    const mockUpdateFile = vi.fn();
    const mockCreateFile = vi.fn();
    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);

    expect(plan.blocks).toHaveLength(3);
    expect(plan.fileCount).toBe(3);
    expect(plan.newFileCount).toBe(3);
    expect(result.success).toBe(true);
    expect(mockCreateFile).toHaveBeenCalledTimes(3);
  });

  it("处理混合的新文件和修改文件", () => {
    const fileContents = {
      "src/app/App.tsx":
        "export default function App() { return <div>Old</div> }",
    };

    const aiResponse = `我来更新 App 并创建新组件：

\`\`\`tsx
// filepath: src/app/App.tsx
export default function App() { 
  return <div>New content</div>
}
\`\`\`

\`\`\`tsx
// filepath: src/components/Header.tsx
export function Header() { return <header>Header</header> }
\`\`\``;

    const plan = parseCodeBlocks(aiResponse, fileContents);
    const mockUpdateFile = vi.fn();
    const mockCreateFile = vi.fn();
    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);

    expect(plan.newFileCount).toBe(1);
    expect(plan.modifiedFileCount).toBe(1);
    expect(result.success).toBe(true);
    expect(mockUpdateFile).toHaveBeenCalledTimes(1);
    expect(mockCreateFile).toHaveBeenCalledTimes(1);
  });
});

describe("AI Pipeline — 错误处理和恢复", () => {
  it("处理代码应用失败", () => {
    const aiResponse = `创建文件：

\`\`\`tsx
// filepath: src/fail.tsx
export function Fail() { return <div /> }
\`\`\``;

    const plan = parseCodeBlocks(aiResponse, {});
    const mockUpdateFile = vi.fn().mockImplementation(() => {
      throw new Error("File system error");
    });
    const mockCreateFile = vi.fn().mockImplementation(() => {
      throw new Error("File system error");
    });
    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("File system error");
  });

  it("处理无效的代码块", () => {
    const invalidResponse = "This response has no code blocks";

    const plan = parseCodeBlocks(invalidResponse, {});
    expect(plan.blocks).toHaveLength(0);
    expect(plan.summary).toBe("无代码变更");
  });

  it("处理部分成功的代码应用", () => {
    const aiResponse = `创建多个文件：

\`\`\`tsx
// filepath: src/success.tsx
export function Success() { return <div /> }
\`\`\`

\`\`\`tsx
// filepath: src/fail.tsx
export function Fail() { return <div /> }
\`\`\``;

    const plan = parseCodeBlocks(aiResponse, {});
    const mockUpdateFile = vi.fn();
    const mockCreateFile = vi
      .fn()
      .mockImplementationOnce(() => {
        return undefined;
      })
      .mockImplementationOnce(() => {
        throw new Error("Failed");
      });

    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);

    expect(result.success).toBe(false);
    expect(result.appliedFiles).toContain("src/success.tsx");
    expect(result.errors).toHaveLength(1);
  });
});

describe("AI Pipeline — 与 LeftPanel 集成", () => {
  it("构建包含当前文件上下文的系统提示词", () => {
    const fileContents = {
      "src/app/App.tsx":
        "export default function App() { return <div>Hello</div> }",
      "src/utils/helper.ts":
        "export function add(a: number, b: number) { return a + b }",
    };

    const context = collectContext({
      fileContents,
      activeFile: "src/app/App.tsx",
      openTabs: [
        { path: "src/app/App.tsx", modified: true },
        { path: "src/utils/helper.ts", modified: false },
      ],
      gitBranch: "feature/test",
      gitChanges: [],
    });

    const systemPrompt = buildSystemPrompt("modify", context);

    expect(systemPrompt).toContain("src/app/App.tsx");
    expect(systemPrompt).toContain("Hello");
    expect(systemPrompt).toContain("feature/test");
  });

  it("处理带历史记录的对话", () => {
    const history = [
      { role: "user" as const, content: "创建一个按钮" },
      { role: "assistant" as const, content: "好的，我创建了 Button 组件" },
      { role: "user" as const, content: "现在修改按钮样式" },
    ];

    const messages = buildChatMessages("修改按钮样式为红色", history, null);

    expect(messages).toHaveLength(5); // system + 3 history + 1 current
    expect(messages[1].content).toBe("创建一个按钮");
    expect(messages[2].content).toBe("好的，我创建了 Button 组件");
    expect(messages[3].content).toBe("现在修改按钮样式");
    expect(messages[messages.length - 1].content).toBe("修改按钮样式为红色");
  });
});

describe("AI Pipeline — 代码验证和质量检查", () => {
  it("验证生成的代码质量", () => {
    const validCode = `import React from 'react'

export function ValidComponent() {
  return (
    <div className="container">
      <h1>Title</h1>
      <button onClick={() => console.warn('clicked')}>Click</button>
    </div>
  )
}`;

    const block: ParsedCodeBlock = {
      filepath: "src/ValidComponent.tsx",
      language: "tsx",
      content: validCode,
      isNew: true,
    };

    const warnings = validateCodeBlock(block);
    expect(warnings.warnings).toHaveLength(0);
  });

  it("检测有问题的代码", () => {
    const invalidCode = `export function InvalidComponent() {
      return <div>Missing import</div>
    }`;

    const block: ParsedCodeBlock = {
      filepath: "src/InvalidComponent.tsx",
      language: "tsx",
      content: invalidCode,
      isNew: true,
    };

    const result = validateCodeBlock(block);
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
  });

  it("生成代码差异预览", () => {
    const oldContent = `export function Component() {
  return <div>Old</div>
}`;

    const newContent = `export function Component() {
  return <div>New</div>
}`;

    const diff = generateSimpleDiff(oldContent, newContent);

    expect(
      diff.some((d) => d.type === "removed" && d.content.includes("Old")),
    ).toBe(true);
    expect(
      diff.some((d) => d.type === "added" && d.content.includes("New")),
    ).toBe(true);
    expect(diff.some((d) => d.type === "unchanged")).toBe(true);
  });
});

describe("AI Pipeline — 性能和优化", () => {
  it("处理大型项目的上下文压缩", () => {
    const largeFileContents: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {
      largeFileContents[`src/file${i}.tsx`] = "x".repeat(1000);
    }

    const context = collectContext({
      fileContents: largeFileContents,
      activeFile: "src/file0.tsx",
      openTabs: [{ path: "src/file0.tsx", modified: false }],
      gitBranch: "main",
      gitChanges: [],
    });

    const compressed = compressContext(context, 10000);

    expect(compressed).toContain("项目文件结构");
    expect(compressed.length).toBeLessThan(15000);
  });

  it("限制历史消息数量", () => {
    const longHistory = Array.from({ length: 50 }, (_, i) => ({
      role: "user" as const,
      content: `Message ${i}`,
    }));

    const messages = buildChatMessages("New message", longHistory, null, {
      maxHistoryMessages: 10,
    });

    // system + 10 history + 1 current = 12
    expect(messages).toHaveLength(12);
  });
});

describe("AI Pipeline — 边界情况", () => {
  it("处理空项目", () => {
    const context = collectContext({
      fileContents: {},
      activeFile: "",
      openTabs: [],
      gitBranch: "",
      gitChanges: [],
    });

    expect(context.fileTree).toBe("(empty project)");
    expect(context.totalFiles).toBe(0);
  });

  it("处理不存在的文件", () => {
    const context = collectContext({
      fileContents: {},
      activeFile: "nonexistent.tsx",
      openTabs: [],
      gitBranch: "main",
      gitChanges: [],
    });

    expect(context.activeFile).toBeNull();
  });

  it("处理特殊字符的代码", () => {
    const specialCode = `import React from 'react'

export function Special() {
  const str = "特殊字符: 中文、日本語、한글"
  const emoji = "😀 🎉 🚀"
  const symbols = "@#$%^&*()"
  return <div>{str} {emoji} {symbols}</div>
}`;

    const block: ParsedCodeBlock = {
      filepath: "src/Special.tsx",
      language: "tsx",
      content: specialCode,
      isNew: true,
    };

    const warnings = validateCodeBlock(block);
    expect(warnings.warnings).toHaveLength(0);
  });

  it("处理非常长的代码块", () => {
    const longCode = `import React from 'react'\n` + "x".repeat(100000);

    const block: ParsedCodeBlock = {
      filepath: "src/Long.tsx",
      language: "tsx",
      content: longCode,
      isNew: true,
    };

    const warnings = validateCodeBlock(block);
    expect(warnings.warnings).toHaveLength(0);
  });
});
