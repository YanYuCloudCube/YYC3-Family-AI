/**
 * @file: ErrorAnalyzer.test.ts
 * @description: 错误分析器测试 - 测试错误分类、分析和建议生成
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
// ErrorAnalyzer 单元测试
// 覆盖: 全部 27 条静态分析规则 + analyzeFile + analyzeProject
//       + applyAutoFix + buildFixPromptContext + getRuleDescriptions
// ================================================================

import { describe, it, expect } from "vitest";
import {
  analyzeFile,
  analyzeProject,
  applyAutoFix,
  buildFixPromptContext,
  getRuleDescriptions,
  type Diagnostic,
  type AutoFix,
} from "../app/components/ide/ai/ErrorAnalyzer";

// ── Helper: 从分析结果中提取特定规则的诊断 ──

function getDiags(
  filepath: string,
  content: string,
  ruleId?: string,
): Diagnostic[] {
  const result = analyzeFile(filepath, content);
  if (ruleId) return result.diagnostics.filter((d) => d.ruleId === ruleId);
  return result.diagnostics;
}

// ================================================================
//  TypeScript Rules
// ================================================================

describe("ts-any-usage", () => {
  it("检测 : any 类型注解", () => {
    const diags = getDiags("test.ts", `const x: any = 5`, "ts-any-usage");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("warning");
    expect(diags[0].category).toBe("typescript");
  });

  it("检测 as any 断言", () => {
    const diags = getDiags("test.ts", `const x = foo as any`, "ts-any-usage");
    expect(diags.length).toBeGreaterThanOrEqual(1);
  });

  it("不检测注释中的 any", () => {
    const diags = getDiags("test.ts", `// const x: any = 5`, "ts-any-usage");
    expect(diags).toHaveLength(0);
  });

  it("不对非 TS 文件运行", () => {
    const diags = getDiags("test.css", `/* any */`, "ts-any-usage");
    expect(diags).toHaveLength(0);
  });
});

describe("ts-non-null-assertion", () => {
  it("检测非空断言 foo!", () => {
    const diags = getDiags(
      "test.ts",
      `const x = foo!`,
      "ts-non-null-assertion",
    );
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("info");
  });

  it("不误报 !== 操作符", () => {
    const diags = getDiags(
      "test.ts",
      `if (a !== b) {}`,
      "ts-non-null-assertion",
    );
    expect(diags).toHaveLength(0);
  });
});

describe("ts-console-log", () => {
  it("检测 console.log", () => {
    const diags = getDiags("test.ts", `console.log("hello")`, "ts-console-log");
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("info");
    expect(diags[0].autoFix).toBeDefined();
  });

  it("检测 console.debug", () => {
    const diags = getDiags("test.ts", `console.debug("hello")`, "ts-console-log");
    expect(diags).toHaveLength(1);
  });

  it("检测 console.info", () => {
    const diags = getDiags("test.ts", `console.info("hello")`, "ts-console-log");
    expect(diags).toHaveLength(1);
  });

  it("不检测注释中的 console.log", () => {
    const diags = getDiags(
      "test.ts",
      `// console.log("test")`,
      "ts-console-log",
    );
    expect(diags).toHaveLength(0);
  });

  it("autoFix 删除该行", () => {
    const diags = getDiags("test.ts", `console.log("hello")`, "ts-console-log");
    expect((diags[0].autoFix as any).replacement).toBe("");
  });
});

describe("ts-todo-fixme", () => {
  it("检测 TODO 注释", () => {
    const diags = getDiags("test.ts", `// TODO: fix later`, "ts-todo-fixme");
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("hint");
  });

  it("检测 FIXME 注释", () => {
    const diags = getDiags(
      "test.ts",
      `// FIXME: broken logic`,
      "ts-todo-fixme",
    );
    expect(diags).toHaveLength(1);
  });

  it("检测 HACK 注释", () => {
    const diags = getDiags("test.ts", `// HACK: workaround`, "ts-todo-fixme");
    expect(diags).toHaveLength(1);
  });

  it("不误报普通注释", () => {
    const diags = getDiags("test.ts", `// This is normal`, "ts-todo-fixme");
    expect(diags).toHaveLength(0);
  });
});

// ================================================================
//  React Rules
// ================================================================

describe("react-missing-key", () => {
  it("检测 .map() 返回 JSX 无 key", () => {
    const code = `items.map(item => <div>{item}</div>)`;
    const diags = getDiags("test.tsx", code, "react-missing-key");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("error");
    expect(diags[0].category).toBe("react");
  });

  it("有 key 时不报错", () => {
    const code = `items.map(item => <div key={item.id}>{item}</div>)`;
    const diags = getDiags("test.tsx", code, "react-missing-key");
    expect(diags).toHaveLength(0);
  });
});

describe("react-direct-state-mutation", () => {
  it("检测 state.xxx = ...", () => {
    const code = `state.count = 5`;
    const diags = getDiags("test.tsx", code, "react-direct-state-mutation");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("error");
  });

  it("不误报 state 相等比较", () => {
    const code = `if (state.count === 5) {}`;
    const diags = getDiags("test.tsx", code, "react-direct-state-mutation");
    expect(diags).toHaveLength(0);
  });
});

describe("react-missing-deps", () => {
  it("检测 useEffect 空依赖数组但引用外部变量", () => {
    const code = `
function App() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    setCount(props.value)
  }, [])
}`;
    const diags = getDiags("test.tsx", code, "react-missing-deps");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("warning");
    expect(diags[0].category).toBe("hooks");
  });

  it("有依赖时不报错", () => {
    const code = `useEffect(() => { console.warn(count) }, [count])`;
    const diags = getDiags("test.tsx", code, "react-missing-deps");
    expect(diags).toHaveLength(0);
  });
});

describe("react-hooks-conditional", () => {
  it("检测条件语句中调用 Hook", () => {
    const code = `
if (condition) {
  const [x, setX] = useState(0)
}`;
    const diags = getDiags("test.tsx", code, "react-hooks-conditional");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("error");
    expect(diags[0].category).toBe("hooks");
  });
});

describe("react-inline-style-object", () => {
  it("检测内联 style 对象", () => {
    const code = `<div style={{ color: "red" }} />`;
    const diags = getDiags("test.tsx", code, "react-inline-style-object");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("info");
    expect(diags[0].category).toBe("performance");
  });
});

describe("react-fragment-unnecessary", () => {
  it("检测不必要的 Fragment", () => {
    const code = `<>\n  <div>hello</div>\n</>`;
    const diags = getDiags("test.tsx", code, "react-fragment-unnecessary");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("hint");
  });
});

// ================================================================
//  Import Rules
// ================================================================

describe("import-duplicate", () => {
  it("检测重复导入", () => {
    const code = `import { A } from 'react'\nimport { B } from 'react'`;
    const diags = getDiags("test.ts", code, "import-duplicate");
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("warning");
    expect(diags[0].category).toBe("imports");
  });

  it("不同模块不报错", () => {
    const code = `import { A } from 'react'\nimport { B } from 'zustand'`;
    const diags = getDiags("test.ts", code, "import-duplicate");
    expect(diags).toHaveLength(0);
  });
});

describe("import-no-default-react", () => {
  it("检测 import React from 'react'", () => {
    const code = `import React from 'react'`;
    const diags = getDiags("test.tsx", code, "import-no-default-react");
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("hint");
  });

  it("命名导入不报错", () => {
    const code = `import { useState } from 'react'`;
    const diags = getDiags("test.tsx", code, "import-no-default-react");
    expect(diags).toHaveLength(0);
  });
});

// ================================================================
//  Performance Rules
// ================================================================

describe("perf-anonymous-component", () => {
  it("检测 JSX 属性中的匿名渲染函数", () => {
    const code = `<Route render={() => <Home />} />`;
    const diags = getDiags("test.tsx", code, "perf-anonymous-component");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("warning");
    expect(diags[0].category).toBe("performance");
  });
});

describe("perf-index-as-key", () => {
  it("检测 key={index}", () => {
    const code = `items.map((item, index) => <div key={index}>{item}</div>)`;
    const diags = getDiags("test.tsx", code, "perf-index-as-key");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("warning");
  });

  it("检测 key={i}", () => {
    const code = `items.map((item, i) => <li key={i}>{item}</li>)`;
    const diags = getDiags("test.tsx", code, "perf-index-as-key");
    expect(diags.length).toBeGreaterThanOrEqual(1);
  });

  it("使用 id 作为 key 不报错", () => {
    const code = `items.map(item => <div key={item.id}>{item.name}</div>)`;
    const diags = getDiags("test.tsx", code, "perf-index-as-key");
    expect(diags).toHaveLength(0);
  });
});

describe("perf-large-inline-array", () => {
  it("检测 JSX 中的大型内联数组", () => {
    const filler = Array(60)
      .fill('  { id: 1, name: "test", value: 42 },')
      .join("\n");
    const code = `function Comp() {\n  return (\n    <Select options={[\n${filler}\n    ]} />\n  )\n}`;
    const diags = getDiags("test.tsx", code, "perf-large-inline-array");
    expect(diags.length).toBeGreaterThanOrEqual(1);
  });
});

// ================================================================
//  Accessibility Rules
// ================================================================

describe("a11y-img-alt", () => {
  it("检测 <img> 缺少 alt", () => {
    const code = `<img src="photo.jpg" />`;
    const diags = getDiags("test.tsx", code, "a11y-img-alt");
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("warning");
    expect(diags[0].category).toBe("accessibility");
  });

  it("有 alt 时不报错", () => {
    const code = `<img src="photo.jpg" alt="A photo" />`;
    const diags = getDiags("test.tsx", code, "a11y-img-alt");
    expect(diags).toHaveLength(0);
  });
});

describe("a11y-button-type", () => {
  it("检测 <button> 缺少 type", () => {
    const code = `<button onClick={handleClick}>Click</button>`;
    const diags = getDiags("test.tsx", code, "a11y-button-type");
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("hint");
  });

  it("有 type 时不报错", () => {
    const code = `<button type="button" onClick={handleClick}>Click</button>`;
    const diags = getDiags("test.tsx", code, "a11y-button-type");
    expect(diags).toHaveLength(0);
  });
});

describe("a11y-click-handler-no-keyboard", () => {
  it("检测 div onClick 无键盘事件", () => {
    const code = `<div onClick={handleClick}>Clickable div</div>`;
    const diags = getDiags("test.tsx", code, "a11y-click-handler-no-keyboard");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].category).toBe("accessibility");
  });

  it("有 role + tabIndex 时不报错", () => {
    const code = `<div onClick={handleClick} role="button" tabIndex={0}>Click</div>`;
    const diags = getDiags("test.tsx", code, "a11y-click-handler-no-keyboard");
    expect(diags).toHaveLength(0);
  });

  it("button 元素不受影响", () => {
    const code = `<button onClick={handleClick}>Click</button>`;
    const diags = getDiags("test.tsx", code, "a11y-click-handler-no-keyboard");
    expect(diags).toHaveLength(0);
  });
});

// ================================================================
//  Style Rules
// ================================================================

describe("style-hardcoded-color", () => {
  it("检测硬编码颜色值", () => {
    const code = `<div className="text-[#ff0000]" />`;
    const diags = getDiags("test.tsx", code, "style-hardcoded-color");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("info");
    expect(diags[0].category).toBe("style");
  });

  it("CSS 变量不报错", () => {
    const code = `<div style={{ color: "var(--primary)" }} />`;
    const diags = getDiags("test.tsx", code, "style-hardcoded-color");
    expect(diags).toHaveLength(0);
  });
});

describe("style-important", () => {
  it("检测 !important", () => {
    const diags = getDiags(
      "test.css",
      `.foo { color: red !important; }`,
      "style-important",
    );
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("warning");
  });

  it("在 TSX 中也检测", () => {
    const code = `const style = "color: red !important"`;
    const diags = getDiags("test.tsx", code, "style-important");
    expect(diags).toHaveLength(1);
  });
});

// ================================================================
//  Security Rules
// ================================================================

describe("sec-dangerouslySetInnerHTML", () => {
  it("检测 dangerouslySetInnerHTML", () => {
    const code = `<div dangerouslySetInnerHTML={{ __html: userInput }} />`;
    const diags = getDiags("test.tsx", code, "sec-dangerouslySetInnerHTML");
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("warning");
    expect(diags[0].category).toBe("security");
  });
});

describe("sec-eval-usage", () => {
  it("检测 eval()", () => {
    const code = `const result = eval("1 + 1")`;
    const diags = getDiags("test.ts", code, "sec-eval-usage");
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("error");
  });

  it("检测 new Function()", () => {
    const code = `const fn = new Function("return 42")`;
    const diags = getDiags("test.ts", code, "sec-eval-usage");
    expect(diags).toHaveLength(1);
  });

  it("不检测注释中的 eval", () => {
    const code = `// eval is dangerous`;
    const diags = getDiags("test.ts", code, "sec-eval-usage");
    expect(diags).toHaveLength(0);
  });
});

describe("sec-hardcoded-secret", () => {
  it("检测硬编码 API Key", () => {
    const code = `const apiKey = "sk-AbCdEfGhIjKlMnOpQrStUvWxYz123456"`;
    const diags = getDiags("test.ts", code, "sec-hardcoded-secret");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("error");
    expect(diags[0].category).toBe("security");
  });

  it("不误报短值", () => {
    const code = `const api_key = "test"`;
    const diags = getDiags("test.ts", code, "sec-hardcoded-secret");
    expect(diags).toHaveLength(0);
  });
});

// ================================================================
//  Best Practice Rules
// ================================================================

describe("bp-empty-catch", () => {
  it("检测空 catch 块", () => {
    const code = `try { foo() } catch (e) { /* empty */ }`;
    const diags = getDiags("test.ts", code, "bp-empty-catch");
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("warning");
    expect(diags[0].category).toBe("best-practice");
  });

  it("非空 catch 不报错", () => {
    const code = `try { foo() } catch (e) { console.error(e) }`;
    const diags = getDiags("test.ts", code, "bp-empty-catch");
    expect(diags).toHaveLength(0);
  });
});

describe("bp-magic-number", () => {
  it("检测魔法数字 (3位+)", () => {
    const code = `const timeout = 3000`;
    const diags = getDiags("test.ts", code, "bp-magic-number");
    // 3000 is a 4-digit number, should trigger
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("hint");
  });

  it("不误报 0, 1, 100", () => {
    const code = `const a = 0\nconst b = 1\nconst c = 100`;
    const diags = getDiags("test.ts", code, "bp-magic-number");
    expect(diags).toHaveLength(0);
  });
});

describe("bp-nested-ternary", () => {
  it("检测嵌套三元表达式", () => {
    const code = `const x = a ? b ? 1 : 2 : 3`;
    const diags = getDiags("test.ts", code, "bp-nested-ternary");
    expect(diags).toHaveLength(1);
    expect(diags[0].severity).toBe("warning");
  });

  it("单层三元不报错", () => {
    const code = `const x = a ? 1 : 2`;
    const diags = getDiags("test.ts", code, "bp-nested-ternary");
    expect(diags).toHaveLength(0);
  });
});

describe("bp-function-length", () => {
  it("检测过长函数 (>80行)", () => {
    const lines = Array(90).fill("  const x = 1").join("\n");
    const code = `function bigFunc() {\n${lines}\n}`;
    const diags = getDiags("test.ts", code, "bp-function-length");
    expect(diags.length).toBeGreaterThanOrEqual(1);
    expect(diags[0].severity).toBe("info");
    expect(diags[0].message).toContain("bigFunc");
  });

  it("短函数不报错", () => {
    const code = `function small() {\n  return 1\n}`;
    const diags = getDiags("test.ts", code, "bp-function-length");
    expect(diags).toHaveLength(0);
  });
});

// ================================================================
//  analyzeFile — 综合测试
// ================================================================

describe("analyzeFile", () => {
  it("返回正确的结构", () => {
    const result = analyzeFile("test.ts", `const x = 1`);
    expect(result.filepath).toBe("test.ts");
    expect(result.analyzedAt).toBeGreaterThan(0);
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });

  it("多条规则同时触发", () => {
    const code = `
console.log("debug")
const x: any = eval("1+1")
// TODO: fix this
`;
    const result = analyzeFile("test.ts", code);
    const ruleIds = new Set(result.diagnostics.map((d) => d.ruleId));
    expect(ruleIds.has("ts-console-log")).toBe(true);
    expect(ruleIds.has("ts-any-usage")).toBe(true);
    expect(ruleIds.has("sec-eval-usage")).toBe(true);
    expect(ruleIds.has("ts-todo-fixme")).toBe(true);
  });

  it("结果按 severity 排序 (errors first)", () => {
    const code = `
console.warn("x")
const y = eval("z")
// TODO: check
`;
    const result = analyzeFile("test.ts", code);
    if (result.diagnostics.length >= 2) {
      const severityOrder = { error: 0, warning: 1, info: 2, hint: 3 };
      for (let i = 1; i < result.diagnostics.length; i++) {
        expect(
          severityOrder[result.diagnostics[i].severity],
        ).toBeGreaterThanOrEqual(
          severityOrder[result.diagnostics[i - 1].severity],
        );
      }
    }
  });

  it("对非代码文件返回空诊断", () => {
    const result = analyzeFile("image.png", "binary data");
    expect(result.diagnostics).toHaveLength(0);
  });

  it("每条诊断有唯一 id", () => {
    const code = `
console.warn("a")
console.warn("b")
console.warn("c")
`;
    const result = analyzeFile("test.ts", code);
    const ids = result.diagnostics.map((d) => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ================================================================
//  analyzeProject — 项目级分析
// ================================================================

describe("analyzeProject", () => {
  it("分析多个文件", () => {
    const files: Record<string, string> = {
      "src/a.ts": `console.log("a")`,
      "src/b.tsx": `<img src="x" />`,
      "readme.md": `# hello`,
    };
    const result = analyzeProject(files);
    expect(result.files.length).toBeGreaterThanOrEqual(2); // .ts and .tsx files
    expect(result.analyzedAt).toBeGreaterThan(0);
    expect(
      result.totalErrors +
        result.totalWarnings +
        result.totalInfos +
        result.totalHints,
    ).toBeGreaterThan(0);
  });

  it("跳过非代码文件", () => {
    const result = analyzeProject({ "image.png": "binary", "data.json": "{}" });
    // json not in the analyzed extensions list, png either
    expect(result.files).toHaveLength(0);
  });

  it("统计正确分类", () => {
    const files: Record<string, string> = {
      "a.ts": `eval("x")`, // error (security)
      "b.ts": `console.log("y")`, // info
    };
    const result = analyzeProject(files);
    expect(result.totalErrors).toBeGreaterThanOrEqual(1);
    expect(result.totalInfos).toBeGreaterThanOrEqual(1);
  });
});

// ================================================================
//  applyAutoFix
// ================================================================

describe("applyAutoFix", () => {
  it("删除指定行", () => {
    const content = `line1\nconsole.log("test")\nline3`;
    const fix: AutoFix = {
      description: "删除此行",
      range: { startLine: 2, endLine: 2 },
      replacement: "",
    };
    const result = applyAutoFix(content, fix);
    expect(result).toBe("line1\nline3");
  });

  it("替换指定行", () => {
    const content = `line1\nold line\nline3`;
    const fix: AutoFix = {
      description: "替换",
      range: { startLine: 2, endLine: 2 },
      replacement: "new line",
    };
    const result = applyAutoFix(content, fix);
    expect(result).toBe("line1\nnew line\nline3");
  });

  it("替换多行范围", () => {
    const content = `line1\nline2\nline3\nline4\nline5`;
    const fix: AutoFix = {
      description: "替换中间",
      range: { startLine: 2, endLine: 4 },
      replacement: "replaced",
    };
    const result = applyAutoFix(content, fix);
    expect(result).toBe("line1\nreplaced\nline5");
  });
});

// ================================================================
//  buildFixPromptContext
// ================================================================

describe("buildFixPromptContext", () => {
  it("生成包含诊断信息的 prompt", () => {
    const diag: Diagnostic = {
      id: "test-1",
      ruleId: "ts-any-usage",
      filepath: "src/App.tsx",
      line: 5,
      column: 10,
      severity: "warning",
      category: "typescript",
      message: "避免使用 any",
      suggestion: "使用 unknown 替代",
    };
    const fileContent = `import React from 'react'\n\nfunction App() {\n  const data: any = {}\n  return <div />\n}`;
    const prompt = buildFixPromptContext(diag, fileContent);

    expect(prompt).toContain("src/App.tsx");
    expect(prompt).toContain("ts-any-usage");
    expect(prompt).toContain("warning");
    expect(prompt).toContain("避免使用 any");
    expect(prompt).toContain("使用 unknown 替代");
    expect(prompt).toContain("代码片段");
  });
});

// ================================================================
//  getRuleDescriptions
// ================================================================

describe("getRuleDescriptions", () => {
  it("返回所有规则描述", () => {
    const rules = getRuleDescriptions();
    expect(rules.length).toBeGreaterThanOrEqual(25);
  });

  it("每条规则有 id, name, category, severity", () => {
    const rules = getRuleDescriptions();
    for (const r of rules) {
      expect(r.id).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(r.category).toBeTruthy();
      expect(r.severity).toBeTruthy();
    }
  });

  it("覆盖所有 9 个类别", () => {
    const rules = getRuleDescriptions();
    const categories = new Set(rules.map((r) => r.category));
    expect(categories.has("typescript")).toBe(true);
    expect(categories.has("react")).toBe(true);
    expect(categories.has("hooks")).toBe(true);
    expect(categories.has("imports")).toBe(true);
    expect(categories.has("performance")).toBe(true);
    expect(categories.has("accessibility")).toBe(true);
    expect(categories.has("style")).toBe(true);
    expect(categories.has("security")).toBe(true);
    expect(categories.has("best-practice")).toBe(true);
  });
});

// ================================================================
//  Edge Cases
// ================================================================

describe("Edge Cases", () => {
  it("空文件不崩溃", () => {
    const result = analyzeFile("test.ts", "");
    expect(result.diagnostics).toHaveLength(0);
  });

  it("空项目不崩溃", () => {
    const result = analyzeProject({});
    expect(result.files).toHaveLength(0);
    expect(result.totalErrors).toBe(0);
  });

  it("CSS 文件只触发 CSS 相关规则", () => {
    const result = analyzeFile("styles.css", `.foo { color: red !important; }`);
    const categories = new Set(result.diagnostics.map((d) => d.category));
    // CSS files should only trigger style rules
    for (const cat of categories) {
      expect(["style", "best-practice"]).toContain(cat);
    }
  });

  it("大量诊断不超时 (性能)", () => {
    // Generate code with many issues
    const lines = Array(100).fill(`console.log("test")`).join("\n");
    const start = Date.now();
    const result = analyzeFile("test.ts", lines);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000); // should be well under 1 second
    expect(result.diagnostics.length).toBe(100);
  });
});
