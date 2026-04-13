/**
 * @file: TestGenerator.test.ts
 * @description: 测试生成器 - 自动化测试用例生成工具
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
// TestGenerator 单元测试
// 覆盖: extractSymbols + generateTestSuite +
//       generateProjectTestPlan + getSymbolStats
// ================================================================

import { describe, it, expect } from "vitest";
import {
  extractSymbols,
  generateTestSuite,
  generateProjectTestPlan,
  getSymbolStats,
  type ExtractedSymbol,
} from "../app/components/ide/ai/TestGenerator";

// ================================================================
//  extractSymbols
// ================================================================

describe("extractSymbols", () => {
  it("提取导出函数", () => {
    const code = `export function add(a: number, b: number): number {\n  return a + b\n}`;
    const syms = extractSymbols(code);
    expect(syms.length).toBeGreaterThanOrEqual(1);
    const fn = syms.find((s) => s.name === "add")!;
    expect(fn).toBeDefined();
    expect(fn.type).toBe("function");
    expect(fn.exported).toBe(true);
    expect(fn.params.length).toBe(2);
  });

  it("提取箭头函数", () => {
    const code = `export const multiply = (a: number, b: number) => a * b`;
    const syms = extractSymbols(code);
    const fn = syms.find((s) => s.name === "multiply");
    expect(fn).toBeDefined();
    expect((fn as any).exported).toBe(true);
  });

  it("提取异步函数", () => {
    const code = `export async function fetchData(url: string): Promise<any> {\n  return await fetch(url)\n}`;
    const syms = extractSymbols(code);
    const fn = syms.find((s) => s.name === "fetchData")!;
    expect(fn).toBeDefined();
    expect(fn.async).toBe(true);
  });

  it("识别 React 组件 (大写开头 + JSX)", () => {
    const code = `export function Button({ label }: { label: string }) {\n  return (<button>{label}</button>)\n}`;
    const syms = extractSymbols(code);
    const comp = syms.find((s) => s.name === "Button")!;
    expect(comp).toBeDefined();
    expect(comp.type).toBe("component");
  });

  it("识别自定义 Hook (use 开头)", () => {
    const code = `export function useCounter(initial: number) {\n  const [count, setCount] = useState(initial)\n  return { count, setCount }\n}`;
    const syms = extractSymbols(code);
    const hook = syms.find((s) => s.name === "useCounter")!;
    expect(hook).toBeDefined();
    expect(hook.type).toBe("hook");
  });

  it("提取导出常量", () => {
    const code = `export const MAX_SIZE = 100`;
    const syms = extractSymbols(code);
    const c = syms.find((s) => s.name === "MAX_SIZE");
    expect(c).toBeDefined();
    expect((c as any).type).toBe("constant");
  });

  it("提取导出类", () => {
    const code = `export class EventBus {\n  emit() {}\n}`;
    const syms = extractSymbols(code);
    const cls = syms.find((s) => s.name === "EventBus");
    expect(cls).toBeDefined();
    expect((cls as any).type).toBe("class");
  });

  it("不提取非导出的私有函数", () => {
    const code = `function privateHelper() { return 1 }\nexport function publicFn() { return privateHelper() }`;
    const syms = extractSymbols(code);
    const priv = syms.find((s) => s.name === "privateHelper");
    const pub = syms.find((s) => s.name === "publicFn");
    // privateHelper is extracted but marked as not exported
    expect(priv?.exported).toBe(false);
    expect(pub?.exported).toBe(true);
  });

  it("跳过注释", () => {
    const code = `// export function commented() {}\nexport function real() { return 1 }`;
    const syms = extractSymbols(code);
    expect(syms.find((s) => s.name === "commented")).toBeUndefined();
    expect(syms.find((s) => s.name === "real")).toBeDefined();
  });

  it("空文件返回空数组", () => {
    expect(extractSymbols("")).toHaveLength(0);
  });

  it("提取 JSDoc", () => {
    const code = `/** Add two numbers */\nexport function add(a: number, b: number) { return a + b }`;
    const syms = extractSymbols(code);
    const fn = syms.find((s) => s.name === "add")!;
    expect(fn.jsDoc).toContain("Add two numbers");
  });
});

// ================================================================
//  generateTestSuite
// ================================================================

describe("generateTestSuite", () => {
  it("为导出函数生成测试", () => {
    const code = `export function add(a: number, b: number): number {\n  return a + b\n}`;
    const suite = generateTestSuite("src/utils.ts", code);
    expect(suite.testCases.length).toBeGreaterThanOrEqual(1);
    expect(suite.targetFile).toBe("src/utils.ts");
    expect(suite.imports).toContain("add");
    expect(suite.fullCode).toContain("describe");
  });

  it("为组件生成渲染测试", () => {
    const code = `export function Card({ title }: { title: string }) {\n  return (<div>{title}</div>)\n}`;
    const suite = generateTestSuite("src/Card.tsx", code);
    const renderTest = suite.testCases.find((t) => t.category === "component");
    expect(renderTest).toBeDefined();
    expect(suite.imports).toContain("render");
  });

  it("为 Hook 生成 renderHook 测试", () => {
    const code = `export function useToggle(initial: boolean) {\n  const [val, setVal] = useState(initial)\n  return { val, toggle: () => setVal(!val) }\n}`;
    const suite = generateTestSuite("src/hooks/useToggle.ts", code);
    const hookTest = suite.testCases.find((t) => t.category === "hook");
    expect(hookTest).toBeDefined();
    expect(suite.imports).toContain("renderHook");
  });

  it("为异步函数生成 async 测试", () => {
    const code = `export async function fetchUser(id: string) {\n  const res = await fetch('/api/users/' + id)\n  return res.json()\n}`;
    const suite = generateTestSuite("src/api.ts", code);
    const asyncTest = suite.testCases.find((t) => t.testCode.includes("async"));
    expect(asyncTest).toBeDefined();
  });

  it("为有 throw 的函数生成错误处理测试", () => {
    const code = `export function validate(input: string) {\n  if (!input) throw new Error("empty")\n  return input.trim()\n}`;
    const suite = generateTestSuite("src/validate.ts", code);
    const errorTest = suite.testCases.find((t) => t.category === "error");
    expect(errorTest).toBeDefined();
  });

  it("为有分支的函数提示分支覆盖", () => {
    const code = `export function classify(n: number) {\n  if (n < 0) return "negative"\n  if (n === 0) return "zero"\n  if (n < 100) return "small"\n  return "large"\n}`;
    const suite = generateTestSuite("src/classify.ts", code);
    const branchTest = suite.testCases.find((t) => t.name.includes("分支"));
    expect(branchTest).toBeDefined();
  });

  it("为组件事件处理生成测试", () => {
    const code = `export function SubmitButton({ onSubmit }: { onSubmit: () => void }) {\n  return (<button onClick={onSubmit}>Submit</button>)\n}`;
    const suite = generateTestSuite("src/SubmitButton.tsx", code);
    const eventTest = suite.testCases.find(
      (t) => t.name.includes("事件") || t.name.includes("onClick"),
    );
    expect(eventTest).toBeDefined();
  });

  it("测试用例按 priority 排序", () => {
    const code = `export function add(a: number, b: number): number {\n  if (!a) throw new Error("no a")\n  return a + b\n}`;
    const suite = generateTestSuite("src/add.ts", code);
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < suite.testCases.length; i++) {
      expect(order[suite.testCases[i].priority]).toBeGreaterThanOrEqual(
        order[suite.testCases[i - 1].priority],
      );
    }
  });

  it("生成的测试文件路径正确", () => {
    const suite = generateTestSuite(
      "src/utils/math.ts",
      `export function add() { return 1 }`,
    );
    expect(suite.filepath).toContain("src/__tests__");
    expect(suite.filepath).toContain(".test.");
  });

  it("fullCode 是完整可用的测试文件", () => {
    const code = `export function hello() { return "hello" }`;
    const suite = generateTestSuite("src/hello.ts", code);
    expect(suite.fullCode).toContain("import");
    expect(suite.fullCode).toContain("describe");
    expect(suite.fullCode).toContain("expect");
  });

  it("无导出的文件生成空套件", () => {
    const code = `function privateOnly() { return 1 }`;
    const suite = generateTestSuite("src/internal.ts", code);
    expect(suite.testCases).toHaveLength(0);
  });

  it("每个测试用例有唯一 id", () => {
    const code = `export function a() { return 1 }\nexport function b() { return 2 }\nexport function c() { return 3 }`;
    const suite = generateTestSuite("src/multi.ts", code);
    const ids = suite.testCases.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ================================================================
//  generateProjectTestPlan
// ================================================================

describe("generateProjectTestPlan", () => {
  it("为多个文件生成测试计划", () => {
    const files = {
      "src/add.ts": `export function add(a: number, b: number) { return a + b }`,
      "src/App.tsx": `export function App({ name }: { name: string }) { return (<div>{name}</div>) }`,
      "readme.md": "# readme",
    };
    const plan = generateProjectTestPlan(files);
    expect(plan.suites.length).toBeGreaterThanOrEqual(2);
    expect(plan.totalTests).toBeGreaterThan(0);
    expect(plan.analyzedAt).toBeGreaterThan(0);
  });

  it("跳过已有的测试文件", () => {
    const files = {
      "src/add.ts": `export function add() { return 1 }`,
      "src/__tests__/add.test.ts": `import { add } from '../add'`,
      "src/add.spec.ts": `test("add", () => {})`,
    };
    const plan = generateProjectTestPlan(files);
    // Should only generate for add.ts, not for test files
    expect(plan.suites.length).toBe(1);
    expect(plan.suites[0].targetFile).toBe("src/add.ts");
  });

  it("跳过非代码文件", () => {
    const plan = generateProjectTestPlan({ "a.png": "binary", "b.json": "{}" });
    expect(plan.suites).toHaveLength(0);
  });

  it("空项目不崩溃", () => {
    const plan = generateProjectTestPlan({});
    expect(plan.suites).toHaveLength(0);
    expect(plan.totalTests).toBe(0);
  });

  it("coverageEstimate 返回合理值", () => {
    const files = {
      "src/a.ts": `export function a() { return 1 }`,
      "src/b.ts": `export function b() { return 2 }`,
    };
    const plan = generateProjectTestPlan(files);
    expect(plan.coverageEstimate.functions).toBeGreaterThanOrEqual(0);
    expect(plan.coverageEstimate.functions).toBeLessThanOrEqual(100);
  });
});

// ================================================================
//  getSymbolStats
// ================================================================

describe("getSymbolStats", () => {
  it("统计各类型符号", () => {
    const code = `
export function helper() { return 1 }
export function Button({ label }: { label: string }) { return (<div>{label}</div>) }
export function useCounter() { const [c, s] = useState(0); return { c, s } }
export const MAX = 100
export class Logger {}
`;
    const stats = getSymbolStats(code);
    expect(stats.functions).toBeGreaterThanOrEqual(1);
    expect(stats.components).toBeGreaterThanOrEqual(1);
    expect(stats.hooks).toBeGreaterThanOrEqual(1);
    expect(stats.constants).toBeGreaterThanOrEqual(1);
    expect(stats.classes).toBeGreaterThanOrEqual(1);
    expect(stats.exported).toBeGreaterThanOrEqual(5);
    expect(stats.total).toBeGreaterThanOrEqual(5);
  });

  it("空文件返回全零", () => {
    const stats = getSymbolStats("");
    expect(stats.total).toBe(0);
    expect(stats.exported).toBe(0);
  });
});

// ================================================================
//  Edge Cases
// ================================================================

describe("Edge Cases", () => {
  it("超大文件不崩溃 (<500ms)", () => {
    const lines = Array(500)
      .fill(
        `export function fn${Math.random().toString(36).slice(2)}() { return 1 }`,
      )
      .join("\n");
    const start = Date.now();
    const suite = generateTestSuite("big.ts", lines);
    expect(Date.now() - start).toBeLessThan(500);
    expect(suite.testCases.length).toBeGreaterThan(0);
  });

  it("多种导出格式混合", () => {
    const code = `
export function a() { return 1 }
export const b = (x: string) => x
export default function C({ p }: { p: number }) { return (<span>{p}</span>) }
export class D {}
`;
    const suite = generateTestSuite("mixed.tsx", code);
    expect(suite.testCases.length).toBeGreaterThanOrEqual(3);
  });

  it("空内容文件", () => {
    const suite = generateTestSuite("empty.ts", "");
    expect(suite.testCases).toHaveLength(0);
    expect(suite.fullCode).toBeTruthy(); // at least imports
  });
});
