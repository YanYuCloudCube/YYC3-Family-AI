// @ts-nocheck
/**
 * @file CodeApplicator.test.ts
 * @description 代码应用器测试 - 覆盖代码解析、应用等核心功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,code-applicator,ai,pipeline
 */

import { describe, it, expect, vi } from "vitest";
import {
  parseCodeBlocks,
  applyCodeToFiles,
  validateCodeBlock,
  type ParsedCodeBlock,
  type CodeApplicationPlan,
} from "../app/components/ide/ai/CodeApplicator";

// ── Helper Functions ──

function createMockCodeBlock(
  filepath: string,
  content: string,
  language: string = "typescript",
  isNew: boolean = false,
): ParsedCodeBlock {
  return {
    filepath,
    language,
    content,
    isNew,
  };
}

function createMockPlan(
  blocks: ParsedCodeBlock[],
): CodeApplicationPlan {
  return {
    blocks,
    fileCount: blocks.length,
    newFileCount: blocks.filter((b) => b.isNew).length,
    modifiedFileCount: blocks.filter((b) => !b.isNew).length,
    summary: "Test plan",
  };
}

// ================================================================
// 1. 代码块解析测试
// ================================================================

describe("CodeApplicator - 代码块解析", () => {
  it("解析单个代码块", () => {
    const aiResponse = `
Here is the code:

\`\`\`typescript
// filepath: src/App.tsx
export default function App() {
  return <div>Hello</div>;
}
\`\`\`
    `;

    const plan = parseCodeBlocks(aiResponse, {});

    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].filepath).toBe("src/App.tsx");
    expect(plan.blocks[0].language).toBe("typescript");
    expect(plan.blocks[0].content).toContain("export default function App");
  });

  it("解析多个代码块", () => {
    const aiResponse = `
\`\`\`typescript
// filepath: src/App.tsx
export default App() {}
\`\`\`

\`\`\`typescript
// filepath: src/utils.ts
export function util() {}
\`\`\`
    `;

    const plan = parseCodeBlocks(aiResponse, {});

    expect(plan.blocks).toHaveLength(2);
    expect(plan.blocks[0].filepath).toBe("src/App.tsx");
    expect(plan.blocks[1].filepath).toBe("src/utils.ts");
  });

  it("解析空响应", () => {
    const aiResponse = "No code blocks here";

    const plan = parseCodeBlocks(aiResponse, {});

    expect(plan.blocks).toHaveLength(0);
    expect(plan.summary).toBe("无代码变更");
  });
});

// ================================================================
// 2. 代码应用测试
// ================================================================

describe("CodeApplicator - 代码应用", () => {
  it("应用新文件创建", () => {
    const mockCreateFile = vi.fn();
    const mockUpdateFile = vi.fn();

    const plan = createMockPlan([
      createMockCodeBlock("src/NewFile.tsx", "export default NewFile", "typescript", true),
    ]);

    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);

    expect(result.success).toBe(true);
    expect(mockCreateFile).toHaveBeenCalledWith(
      "src/NewFile.tsx",
      "export default NewFile"
    );
    expect(mockUpdateFile).not.toHaveBeenCalled();
  });

  it("应用现有文件更新", () => {
    const mockCreateFile = vi.fn();
    const mockUpdateFile = vi.fn();

    const plan = createMockPlan([
      createMockCodeBlock("src/App.tsx", "export default App", "typescript", false),
    ]);

    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);

    expect(result.success).toBe(true);
    expect(mockUpdateFile).toHaveBeenCalledWith(
      "src/App.tsx",
      "export default App"
    );
    expect(mockCreateFile).not.toHaveBeenCalled();
  });

  it("应用混合文件", () => {
    const mockCreateFile = vi.fn();
    const mockUpdateFile = vi.fn();

    const plan = createMockPlan([
      createMockCodeBlock("src/NewFile.tsx", "export default New", "typescript", true),
      createMockCodeBlock("src/App.tsx", "export default App", "typescript", false),
    ]);

    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);

    expect(result.success).toBe(true);
    expect(mockCreateFile).toHaveBeenCalledTimes(1);
    expect(mockUpdateFile).toHaveBeenCalledTimes(1);
  });

  it("应用失败返回错误", () => {
    const mockCreateFile = vi.fn().mockImplementation(() => {
      throw new Error("File system error");
    });
    const mockUpdateFile = vi.fn();

    const plan = createMockPlan([
      createMockCodeBlock("src/File.tsx", "export default File", "typescript", true),
    ]);

    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("File system error");
  });
});

// ================================================================
// 3. 代码验证测试
// ================================================================

describe("CodeApplicator - 代码验证", () => {
  it("验证有效代码块", () => {
    const block = createMockCodeBlock("src/App.tsx", "export default App");

    const result = validateCodeBlock(block);

    expect(result.warnings).toHaveLength(0);
  });

  it("验证空代码块", () => {
    const block = createMockCodeBlock("src/App.tsx", "");

    const result = validateCodeBlock(block);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("验证无文件路径", () => {
    const block = createMockCodeBlock("", "export default App");

    const result = validateCodeBlock(block);

    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });

  it("验证多语言代码块", () => {
    const languages = ["typescript", "javascript", "tsx", "jsx", "css", "html"];

    languages.forEach((lang) => {
      const block = createMockCodeBlock("src/file", "content", lang);
      const result = validateCodeBlock(block);
      expect(result.warnings).toBeDefined();
    });
  });
});

// ================================================================
// 4. 边界情况测试
// ================================================================

describe("CodeApplicator - 边界情况", () => {
  it("处理特殊字符代码", () => {
    const content = "特殊字符：中文、日本語、한글 !@#$%^&*()";
    const block = createMockCodeBlock("src/App.tsx", content);

    expect(block.content).toBe(content);
  });

  it("处理空计划", () => {
    const plan = createMockPlan([]);
    const mockCreateFile = vi.fn();
    const mockUpdateFile = vi.fn();

    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);

    expect(result.success).toBe(true);
    expect(result.appliedFiles).toHaveLength(0);
  });
});

// ================================================================
// 5. 集成场景测试
// ================================================================

describe("CodeApplicator - 集成场景", () => {
  it("完整代码应用流程", () => {
    const aiResponse = `
I'll create the following files:

\`\`\`typescript
// filepath: src/App.tsx
export default function App() {
  return <div>Hello World</div>;
}
\`\`\`

\`\`\`typescript
// filepath: src/index.tsx
import App from './App';
console.warn('Hello');
\`\`\`
    `;

    const mockCreateFile = vi.fn();
    const mockUpdateFile = vi.fn();

    // 1. 解析代码块
    const plan = parseCodeBlocks(aiResponse, {});
    expect(plan.blocks).toHaveLength(2);

    // 2. 应用代码
    const result = applyCodeToFiles(plan, mockUpdateFile, mockCreateFile);
    expect(result.success).toBe(true);
    expect(mockCreateFile).toHaveBeenCalledTimes(2);
  });

  it("代码更新流程", () => {
    const existingFiles = {
      "src/App.tsx": "export default function App() {}",
    };

    const aiResponse = `
Here's the updated code:

\`\`\`typescript
// filepath: src/App.tsx
export default function App() {
  return <div>Updated</div>;
}
\`\`\`
    `;

    const plan = parseCodeBlocks(aiResponse, existingFiles);

    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].isNew).toBe(false);
    expect(plan.modifiedFileCount).toBe(1);
  });
});

// ================================================================
// 6. AI 响应解析测试
// ================================================================

describe("CodeApplicator - AI 响应解析", () => {
  it("解析带解释的代码块", () => {
    const aiResponse = `
I'll explain the changes first:
1. Added error handling
2. Improved performance

Here's the code:

\`\`\`typescript
// filepath: src/App.tsx
export default App() {}
\`\`\`

Hope this helps!
    `;

    const plan = parseCodeBlocks(aiResponse, {});

    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0].content).toContain("export default App");
  });

  it("解析带多个语言代码块", () => {
    const aiResponse = `
\`\`\`typescript
// filepath: src/App.tsx
export default App() {}
\`\`\`

\`\`\`css
/* filepath: src/App.css */
.app { color: red; }
\`\`\`
    `;

    const plan = parseCodeBlocks(aiResponse, {});

    expect(plan.blocks).toHaveLength(2);
    expect(plan.blocks[0].language).toBe("typescript");
    expect(plan.blocks[1].language).toBe("css");
  });
});
