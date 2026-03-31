/**
 * @file LeftPanel.test.ts
 * @description LeftPanel 组件逻辑单元测试——
 *              AI 上下文增强、会话历史、消息处理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,leftpanel,ai,chat
 */

import { describe, it, expect } from "vitest";

// ── Test AI Context Enhancement logic ──
// Reimplemented from LeftPanel.tsx for testing

function buildActiveFileContextInjection(
  activeFile: string,
  fileContents: Record<string, string>,
  openTabs: { path: string; modified: boolean }[],
): string {
  const parts: string[] = [];

  // 1. Current active file — full content (up to 10000 chars)
  const activeContent = fileContents[activeFile];
  if (activeContent) {
    const ext = activeFile.split(".").pop() || "";
    const langMap: Record<string, string> = {
      tsx: "tsx",
      ts: "typescript",
      jsx: "jsx",
      js: "javascript",
      css: "css",
      json: "json",
      md: "markdown",
      html: "html",
    };
    const lang = langMap[ext] || ext;
    const truncated =
      activeContent.length > 10000
        ? activeContent.slice(0, 10000) +
          "\n// ... (truncated, " +
          activeContent.length +
          " chars total)"
        : activeContent;
    parts.push(
      `[当前编辑文件] ${activeFile} (${activeContent.length} chars):\n\`\`\`${lang}\n${truncated}\n\`\`\``,
    );
  }

  // 2. Other open tabs — first 200 chars preview each (max 3 tabs)
  const otherTabs = openTabs
    .filter((t) => t.path !== activeFile && fileContents[t.path])
    .slice(0, 3)
    .map((t) => {
      const content = fileContents[t.path] || "";
      const preview =
        content.length > 200 ? content.slice(0, 200) + "..." : content;
      return `[预览] ${t.path} (${content.length} chars):\n${preview}`;
    });

  if (otherTabs.length > 0) {
    parts.push(otherTabs.join("\n\n"));
  }

  return parts.join("\n\n");
}

// ── Test Chat Message Processing ──

function processChatMessage(content: string): {
  hasCode: boolean;
  codeBlocks: string[];
} {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const codeBlocks: string[] = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push(match[2]);
  }

  return {
    hasCode: codeBlocks.length > 0,
    codeBlocks,
  };
}

// ── Test Session Management ──

function createSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test Suites
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("LeftPanel — AI 上下文增强", () => {
  it("should build context with active file", () => {
    const fileContents = {
      "src/app/App.tsx":
        "export default function App() { return <div>Hello</div> }",
    };
    const openTabs = [{ path: "src/app/App.tsx", modified: false }];

    const context = buildActiveFileContextInjection(
      "src/app/App.tsx",
      fileContents,
      openTabs,
    );

    expect(context).toContain("src/app/App.tsx");
    expect(context).toContain("export default function App()");
    expect(context).toContain("```tsx");
  });

  it("should truncate large files", () => {
    const largeContent = "x".repeat(15000);
    const fileContents = {
      "src/app/App.tsx": largeContent,
    };
    const openTabs = [{ path: "src/app/App.tsx", modified: false }];

    const context = buildActiveFileContextInjection(
      "src/app/App.tsx",
      fileContents,
      openTabs,
    );

    expect(context).toContain("(truncated, 15000 chars total)");
    expect(context.length).toBeLessThan(15000);
  });

  it("should include other open tabs", () => {
    const fileContents = {
      "src/app/App.tsx":
        "export default function App() { return <div>Hello</div> }",
      "src/utils/helper.ts":
        "export function add(a: number, b: number) { return a + b }",
    };
    const openTabs = [
      { path: "src/app/App.tsx", modified: false },
      { path: "src/utils/helper.ts", modified: false },
    ];

    const context = buildActiveFileContextInjection(
      "src/app/App.tsx",
      fileContents,
      openTabs,
    );

    expect(context).toContain("[预览] src/utils/helper.ts");
    expect(context).toContain("export function add");
  });

  it("should handle missing active file", () => {
    const fileContents: Record<string, string> = {};
    const openTabs: { path: string; modified: boolean }[] = [];

    const context = buildActiveFileContextInjection(
      "nonexistent.ts",
      fileContents,
      openTabs,
    );

    expect(context).toBe("");
  });

  it("should detect language correctly", () => {
    const testCases = [
      { file: "test.tsx", expected: "tsx" },
      { file: "test.ts", expected: "typescript" },
      { file: "test.jsx", expected: "jsx" },
      { file: "test.js", expected: "javascript" },
      { file: "test.css", expected: "css" },
      { file: "test.json", expected: "json" },
      { file: "test.md", expected: "markdown" },
      { file: "test.html", expected: "html" },
    ];

    testCases.forEach(({ file, expected }) => {
      const fileContents = { [file]: "content" };
      const openTabs = [{ path: file, modified: false }];
      const context = buildActiveFileContextInjection(
        file,
        fileContents,
        openTabs,
      );
      expect(context).toContain(`\`\`\`${expected}`);
    });
  });
});

describe("LeftPanel — 消息处理", () => {
  it("should detect code blocks in messages", () => {
    const message =
      "Here is some code:\n```typescript\nconst x = 1;\n```\nAnd more text.";
    const result = processChatMessage(message);

    expect(result.hasCode).toBe(true);
    expect(result.codeBlocks).toHaveLength(1);
    expect(result.codeBlocks[0]).toContain("const x = 1;");
  });

  it("should detect multiple code blocks", () => {
    const message =
      "```typescript\nconst x = 1;\n```\nSome text\n```javascript\nconst y = 2;\n```";
    const result = processChatMessage(message);

    expect(result.hasCode).toBe(true);
    expect(result.codeBlocks).toHaveLength(2);
  });

  it("should handle messages without code", () => {
    const message = "This is just plain text without any code blocks.";
    const result = processChatMessage(message);

    expect(result.hasCode).toBe(false);
    expect(result.codeBlocks).toHaveLength(0);
  });

  it("should handle empty messages", () => {
    const message = "";
    const result = processChatMessage(message);

    expect(result.hasCode).toBe(false);
    expect(result.codeBlocks).toHaveLength(0);
  });
});

describe("LeftPanel — 会话管理", () => {
  it("should create unique session IDs", () => {
    const id1 = createSessionId();
    const id2 = createSessionId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
    expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/);
  });

  it("should include timestamp in session ID", () => {
    const beforeTime = Date.now();
    const sessionId = createSessionId();
    const afterTime = Date.now();

    const timestampMatch = sessionId.match(/session_(\d+)_/);
    expect(timestampMatch).not.toBeNull();

    if (timestampMatch) {
      const timestamp = parseInt(timestampMatch[1]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    }
  });

  it("should include random suffix in session ID", () => {
    const sessionId = createSessionId();
    const suffixMatch = sessionId.match(/session_\d+_([a-z0-9]+)$/);

    expect(suffixMatch).not.toBeNull();
    if (suffixMatch) {
      const suffix = suffixMatch[1];
      expect(suffix.length).toBeGreaterThan(0);
      expect(suffix.length).toBeLessThanOrEqual(9);
    }
  });
});

describe("LeftPanel — 集成场景", () => {
  it("should handle typical AI chat workflow", () => {
    const fileContents: Record<string, string> = {
      "src/app/App.tsx":
        "export default function App() { return <div>Hello</div> }",
    };
    const openTabs: { path: string; modified: boolean }[] = [
      { path: "src/app/App.tsx", modified: false },
    ];

    const context = buildActiveFileContextInjection(
      "src/app/App.tsx",
      fileContents,
      openTabs,
    );
    const aiResponse =
      "Here's the fix:\n```typescript\nexport default function App() { return <div>Fixed</div> }\n```";
    const processed = processChatMessage(aiResponse);

    expect(context).toContain("src/app/App.tsx");
    expect(processed.hasCode).toBe(true);
    expect(processed.codeBlocks[0]).toContain("Fixed");
  });

  it("should handle multi-file context", () => {
    const fileContents: Record<string, string> = {
      "src/app/App.tsx":
        "export default function App() { return <div>Hello</div> }",
      "src/utils/helper.ts":
        "export function add(a: number, b: number) { return a + b }",
      "src/components/Button.tsx":
        "export function Button() { return <button>Click</button> }",
    };
    const openTabs: { path: string; modified: boolean }[] = [
      { path: "src/app/App.tsx", modified: false },
      { path: "src/utils/helper.ts", modified: false },
      { path: "src/components/Button.tsx", modified: false },
    ];

    const context = buildActiveFileContextInjection(
      "src/app/App.tsx",
      fileContents,
      openTabs,
    );

    expect(context).toContain("[当前编辑文件] src/app/App.tsx");
    expect(context).toContain("[预览] src/utils/helper.ts");
    expect(context).toContain("[预览] src/components/Button.tsx");
  });
});
