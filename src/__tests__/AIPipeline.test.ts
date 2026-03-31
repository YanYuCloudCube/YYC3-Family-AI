// ================================================================
// AI Pipeline 单元测试
// 覆盖: ContextCollector, SystemPromptBuilder, CodeApplicator
// (AIPipeline.ts 本身是编排层，依赖 LLM 调用，不在此单测)
// ================================================================

import { describe, it, expect, vi } from "vitest";

// ── ContextCollector ──
import {
  collectContext,
  estimateTokens,
  compressContext,
  type ContextCollectorInput,
} from "../app/components/ide/ai/ContextCollector";

// ── SystemPromptBuilder ──
import {
  detectIntent,
  buildSystemPrompt,
  buildChatMessages,
  type UserIntent,
} from "../app/components/ide/ai/SystemPromptBuilder";

// ── CodeApplicator ──
import {
  parseCodeBlocks,
  applyCodeToFiles,
  generateSimpleDiff,
  validateCodeBlock,
  type ParsedCodeBlock,
} from "../app/components/ide/ai/CodeApplicator";

// ================================================================
// 1. ContextCollector
// ================================================================

describe("ContextCollector — 上下文收集", () => {
  const baseInput: ContextCollectorInput = {
    fileContents: {
      "src/app/App.tsx":
        "export default function App() { return <div>Hello</div> }",
      "src/utils/helper.ts":
        "export function add(a: number, b: number) { return a + b }",
      "package.json": '{ "name": "test" }',
    },
    activeFile: "src/app/App.tsx",
    openTabs: [
      { path: "src/app/App.tsx", modified: true },
      { path: "src/utils/helper.ts", modified: false },
    ],
    gitBranch: "feature/test",
    gitChanges: [
      { path: "src/app/App.tsx", status: "modified", staged: false },
      { path: "new-file.ts", status: "added", staged: true },
    ],
  };

  it("收集文件树", () => {
    const ctx = collectContext(baseInput);
    expect(ctx.fileTree).toContain("src");
    expect(ctx.fileTree).toContain("App.tsx");
    expect(ctx.fileTree).toContain("package.json");
  });

  it("收集活跃文件", () => {
    const ctx = collectContext(baseInput);
    expect(ctx.activeFile).not.toBeNull();
    expect(ctx.activeFile!.path).toBe("src/app/App.tsx");
    expect(ctx.activeFile!.content).toContain("Hello");
  });

  it("activeFile 不存在时返回 null", () => {
    const input = { ...baseInput, activeFile: "nonexistent.ts" };
    const ctx = collectContext(input);
    expect(ctx.activeFile).toBeNull();
  });

  it("收集打开的标签页 (最多 5 个)", () => {
    const ctx = collectContext(baseInput);
    expect(ctx.openTabs).toHaveLength(2);
  });

  it("收集已修改文件列表", () => {
    const ctx = collectContext(baseInput);
    expect(ctx.modifiedFiles).toContain("src/app/App.tsx");
    expect(ctx.modifiedFiles).not.toContain("src/utils/helper.ts");
  });

  it("收集 Git 摘要", () => {
    const ctx = collectContext(baseInput);
    expect(ctx.gitSummary.branch).toBe("feature/test");
    expect(ctx.gitSummary.changedFiles).toBe(2);
    expect(ctx.gitSummary.stagedFiles).toBe(1);
  });

  it("收集相关文件内容 (排除 activeFile)", () => {
    const ctx = collectContext(baseInput);
    expect(ctx.selectedFilesContent["src/utils/helper.ts"]).toBeDefined();
    expect(ctx.selectedFilesContent["src/app/App.tsx"]).toBeUndefined();
  });

  it("统计总文件数和路径列表", () => {
    const ctx = collectContext(baseInput);
    expect(ctx.totalFiles).toBe(3);
    expect(ctx.allFilePaths).toHaveLength(3);
  });

  it("空项目返回 (empty project) 文件树", () => {
    const ctx = collectContext({
      ...baseInput,
      fileContents: {},
      openTabs: [],
      gitChanges: [],
    });
    expect(ctx.fileTree).toBe("(empty project)");
  });
});

describe("estimateTokens — token 估算", () => {
  it("英文文本约 4 chars/token", () => {
    const tokens = estimateTokens("hello world test string");
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(20);
  });

  it("空字符串返回 0 或 1", () => {
    expect(estimateTokens("")).toBeLessThanOrEqual(1);
  });
});

describe("compressContext — 上下文压缩", () => {
  it("包含文件树和活跃文件", () => {
    const ctx = collectContext({
      fileContents: { "a.ts": "code" },
      activeFile: "a.ts",
      openTabs: [{ path: "a.ts", modified: false }],
      gitBranch: "main",
      gitChanges: [],
    });
    const compressed = compressContext(ctx);
    expect(compressed).toContain("项目文件结构");
    expect(compressed).toContain("当前编辑文件");
    expect(compressed).toContain("Git 状态");
  });

  it("低 maxTokens 时不附加额外文件", () => {
    const ctx = collectContext({
      fileContents: {
        "a.ts": "x".repeat(5000),
        "b.ts": "y".repeat(5000),
      },
      activeFile: "a.ts",
      openTabs: [
        { path: "a.ts", modified: false },
        { path: "b.ts", modified: false },
      ],
      gitBranch: "main",
      gitChanges: [],
    });
    const compressed = compressContext(ctx, 100);
    // With very low token limit, should still have file tree
    expect(compressed).toContain("项目文件结构");
  });
});

// ================================================================
// 2. SystemPromptBuilder
// ================================================================

describe("detectIntent — 意图检测", () => {
  const cases: [string, UserIntent][] = [
    ["创建一个 React 组件", "generate"],
    ["Create a button component", "generate"],
    ["修改这个函数的参数", "modify"],
    ["修复这个 bug", "fix"],
    ["解释这段代码", "explain"],
    ["重构优化这个组件", "refactor"],
    ["生成单元测试", "test"],
    ["帮我 review 这段代码", "review"],
    ["你好", "general"],
    ["今天天气怎么样", "general"],
  ];

  for (const [input, expected] of cases) {
    it(`"${input}" → ${expected}`, () => {
      expect(detectIntent(input)).toBe(expected);
    });
  }
});

describe("buildSystemPrompt — 系统提示词构建", () => {
  it("包含角色定义", () => {
    const prompt = buildSystemPrompt("general", null);
    expect(prompt).toContain("YYC³ Family AI");
  });

  it("generate 意图包含代码生成指令", () => {
    const prompt = buildSystemPrompt("generate", null);
    expect(prompt).toContain("代码生成");
  });

  it("fix 意图包含错误修复指令", () => {
    const prompt = buildSystemPrompt("fix", null);
    expect(prompt).toContain("错误修复");
  });

  it("包含技术栈参考", () => {
    const prompt = buildSystemPrompt("general", null);
    expect(prompt).toContain("React 18");
    expect(prompt).toContain("TypeScript");
    expect(prompt).toContain("Tailwind CSS");
  });

  it("非 explain/general 意图包含代码输出格式", () => {
    const prompt = buildSystemPrompt("generate", null);
    expect(prompt).toContain("代码输出格式");
  });

  it("explain 意图不包含代码输出格式", () => {
    const prompt = buildSystemPrompt("explain", null);
    expect(prompt).not.toContain("代码输出格式");
  });

  it("包含项目上下文", () => {
    const ctx = collectContext({
      fileContents: { "a.ts": "code" },
      activeFile: "a.ts",
      openTabs: [{ path: "a.ts", modified: false }],
      gitBranch: "main",
      gitChanges: [],
    });
    const prompt = buildSystemPrompt("generate", ctx);
    expect(prompt).toContain("项目上下文");
    expect(prompt).toContain("a.ts");
  });

  it("自定义指令被附加", () => {
    const prompt = buildSystemPrompt("general", null, {
      customInstructions: "请用英文回答",
    });
    expect(prompt).toContain("请用英文回答");
  });
});

describe("buildChatMessages — 构建 LLM 消息", () => {
  it("生成 system + history + user 消息", () => {
    const messages = buildChatMessages(
      "创建一个按钮",
      [
        { role: "user", content: "你好" },
        { role: "assistant", content: "你好!" },
      ],
      null,
    );
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toBe("你好");
    expect(messages[2].role).toBe("assistant");
    expect(messages[messages.length - 1].role).toBe("user");
    expect(messages[messages.length - 1].content).toBe("创建一个按钮");
  });

  it("截取最近 N 条历史", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      role: "user" as const,
      content: `msg ${i}`,
    }));
    const messages = buildChatMessages("new", history, null, {
      maxHistoryMessages: 5,
    });
    // system + 5 history + 1 current = 7
    expect(messages).toHaveLength(7);
  });
});

// ================================================================
// 3. CodeApplicator
// ================================================================

describe("parseCodeBlocks — 代码块解析", () => {
  it("解析带 filepath 注释的代码块", () => {
    const response = `Here is the code:

\`\`\`tsx
// filepath: src/Button.tsx
import React from 'react'
export function Button() { return <button>Click</button> }
\`\`\`
`;
    const plan = parseCodeBlocks(response, {});
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].filepath).toBe("src/Button.tsx");
    expect(plan.blocks[0].content).toContain("Button");
    expect(plan.blocks[0].isNew).toBe(true);
  });

  it("解析多个代码块", () => {
    const response = `
\`\`\`tsx
// filepath: src/A.tsx
export function A() {}
\`\`\`

\`\`\`tsx
// filepath: src/B.tsx
export function B() {}
\`\`\`
`;
    const plan = parseCodeBlocks(response, {});
    expect(plan.blocks).toHaveLength(2);
    expect(plan.fileCount).toBe(2);
    expect(plan.newFileCount).toBe(2);
  });

  it("已存在的文件标记为 isNew=false", () => {
    const response = `
\`\`\`tsx
// filepath: src/Existing.tsx
export function Existing() {}
\`\`\`
`;
    const plan = parseCodeBlocks(response, { "src/Existing.tsx": "old" });
    expect(plan.blocks[0].isNew).toBe(false);
    expect(plan.modifiedFileCount).toBe(1);
  });

  it("跳过 bash/shell 代码块", () => {
    const response = `
\`\`\`bash
npm install react
\`\`\`

\`\`\`tsx
// filepath: src/App.tsx
export default function App() {}
\`\`\`
`;
    const plan = parseCodeBlocks(response, {});
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].filepath).toBe("src/App.tsx");
  });

  it("同名文件取最后一个", () => {
    const response = `
\`\`\`tsx
// filepath: src/A.tsx
export function A_v1() {}
\`\`\`

\`\`\`tsx
// filepath: src/A.tsx
export function A_v2() {}
\`\`\`
`;
    const plan = parseCodeBlocks(response, {});
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].content).toContain("A_v2");
  });

  it("从上下文推断文件路径", () => {
    const response = `修改文件 \`src/utils.ts\`:

\`\`\`ts
export function helper() {}
\`\`\`
`;
    const plan = parseCodeBlocks(response, { "src/utils.ts": "old" });
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].filepath).toBe("src/utils.ts");
  });

  it("从 export 推断组件名和文件路径", () => {
    const response = `
\`\`\`tsx
export default function Dashboard() { return <div /> }
\`\`\`
`;
    const plan = parseCodeBlocks(response, {});
    if (plan.blocks.length > 0) {
      expect(plan.blocks[0].filepath).toContain("Dashboard");
    }
  });

  it("无代码块返回空 plan", () => {
    const plan = parseCodeBlocks("Just some text without code", {});
    expect(plan.blocks).toHaveLength(0);
    expect(plan.summary).toBe("无代码变更");
  });
});

describe("applyCodeToFiles — 代码应用", () => {
  it("创建新文件", () => {
    const updateFile = vi.fn();
    const createFile = vi.fn();
    const plan = {
      blocks: [
        {
          filepath: "new.tsx",
          language: "tsx",
          content: "content",
          isNew: true,
        },
      ],
      summary: "",
      fileCount: 1,
      newFileCount: 1,
      modifiedFileCount: 0,
    };
    const result = applyCodeToFiles(plan, updateFile, createFile);
    expect(result.success).toBe(true);
    expect(result.appliedFiles).toContain("new.tsx");
    expect(createFile).toHaveBeenCalledWith("new.tsx", "content");
  });

  it("更新已有文件", () => {
    const updateFile = vi.fn();
    const createFile = vi.fn();
    const plan = {
      blocks: [
        {
          filepath: "existing.tsx",
          language: "tsx",
          content: "new content",
          isNew: false,
        },
      ],
      summary: "",
      fileCount: 1,
      newFileCount: 0,
      modifiedFileCount: 1,
    };
    const result = applyCodeToFiles(plan, updateFile, createFile);
    expect(result.success).toBe(true);
    expect(updateFile).toHaveBeenCalledWith("existing.tsx", "new content");
  });

  it("错误时记录到 errors", () => {
    const updateFile = vi.fn().mockImplementation(() => {
      throw new Error("write failed");
    });
    const createFile = vi.fn();
    const plan = {
      blocks: [
        { filepath: "fail.tsx", language: "tsx", content: "x", isNew: false },
      ],
      summary: "",
      fileCount: 1,
      newFileCount: 0,
      modifiedFileCount: 1,
    };
    const result = applyCodeToFiles(plan, updateFile, createFile);
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("write failed");
  });
});

describe("generateSimpleDiff — Diff 预览", () => {
  it("新文件全部为 added", () => {
    const diff = generateSimpleDiff(undefined, "line1\nline2");
    expect(diff).toHaveLength(2);
    expect(diff.every((d) => d.type === "added")).toBe(true);
  });

  it("相同内容全部为 unchanged", () => {
    const diff = generateSimpleDiff("same\nlines", "same\nlines");
    expect(diff).toHaveLength(2);
    expect(diff.every((d) => d.type === "unchanged")).toBe(true);
  });

  it("变更行标记为 removed + added", () => {
    const diff = generateSimpleDiff("old line\nkeep", "new line\nkeep");
    expect(diff.some((d) => d.type === "removed")).toBe(true);
    expect(diff.some((d) => d.type === "added")).toBe(true);
    expect(diff.some((d) => d.type === "unchanged")).toBe(true);
  });
});

describe("validateCodeBlock — 代码验证", () => {
  it("空内容触发警告", () => {
    const block: ParsedCodeBlock = {
      filepath: "empty.tsx",
      language: "tsx",
      content: "",
      isNew: true,
    };
    const warnings = validateCodeBlock(block);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain("为空");
  });

  it("过短的 TSX 文件触发警告", () => {
    const block: ParsedCodeBlock = {
      filepath: "short.tsx",
      language: "tsx",
      content: "x",
      isNew: true,
    };
    const warnings = validateCodeBlock(block);
    expect(warnings.some((w) => w.includes("异常短"))).toBe(true);
  });

  it("缺少 import 的 TSX 触发警告", () => {
    const block: ParsedCodeBlock = {
      filepath: "no-import.tsx",
      language: "tsx",
      content: "export function Comp() { return <div /> }",
      isNew: true,
    };
    const warnings = validateCodeBlock(block);
    expect(warnings.some((w) => w.includes("import"))).toBe(true);
  });

  it("正常代码无警告", () => {
    const block: ParsedCodeBlock = {
      filepath: "ok.tsx",
      language: "tsx",
      content:
        "import React from 'react'\nexport function Comp() { return <div>OK</div> }",
      isNew: true,
    };
    const warnings = validateCodeBlock(block);
    expect(warnings).toHaveLength(0);
  });
});

// ================================================================
// 4. Import/Export integration (sanity check)
// ================================================================

describe("ProjectExporter — getProjectStats", () => {
  it("统计项目文件信息", async () => {
    const { getProjectStats } =
      await import("../app/components/ide/adapters/ProjectExporter");
    const stats = getProjectStats({
      "src/a.tsx": "abc",
      "src/b.ts": "def",
      "style.css": ".x { }",
    });
    expect(stats.fileCount).toBe(3);
    expect(stats.totalSize).toBeGreaterThan(0);
    expect(stats.byExtension["tsx"]).toBe(1);
    expect(stats.byExtension["ts"]).toBe(1);
    expect(stats.byExtension["css"]).toBe(1);
    expect(stats.largestFile).not.toBeNull();
  });
});
