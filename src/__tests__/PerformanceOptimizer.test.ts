/**
 * @file PerformanceOptimizer.test.ts
 * @description 性能优化器测试 - 测试性能分析、瓶颈识别和优化建议
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
// PerformanceOptimizer 单元测试
// 覆盖: 全部 18 条性能优化规则 + analyzeFilePerformance +
//       analyzeProjectPerformance + getPerfRuleDescriptions
// ================================================================

import { describe, it, expect } from "vitest";
import {
  analyzeFilePerformance,
  analyzeProjectPerformance,
  getPerfRuleDescriptions,
  type PerformanceSuggestion,
} from "../app/components/ide/ai/PerformanceOptimizer";

// ── Helper ──

function getSuggestions(
  filepath: string,
  content: string,
  ruleId?: string,
): PerformanceSuggestion[] {
  const report = analyzeFilePerformance(filepath, content);
  if (ruleId) return report.suggestions.filter((s) => s.ruleId === ruleId);
  return report.suggestions;
}

// ================================================================
//  渲染优化 (render)
// ================================================================

describe("render-no-memo", () => {
  it("检测接收 props 但未用 React.memo 的导出组件", () => {
    const code = `export function Card({ title }: { title: string }) {\n  return <div>{title}</div>\n}`;
    const s = getSuggestions("Card.tsx", code, "render-no-memo");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("medium");
    expect(s[0].category).toBe("render");
    expect(s[0].codeExample).toBeDefined();
  });

  it("无 props 的组件不报", () => {
    const code = `export function Logo() {\n  return <div>Logo</div>\n}`;
    const s = getSuggestions("Logo.tsx", code, "render-no-memo");
    expect(s).toHaveLength(0);
  });

  it("已用 memo 包裹不报", () => {
    const code = `function Card({ title }: Props) { return <div>{title}</div> }\nexport default memo(Card)`;
    const s = getSuggestions("Card.tsx", code, "render-no-memo");
    expect(s).toHaveLength(0);
  });
});

describe("render-object-literal-prop", () => {
  it("检测 return 中的数组字面量 prop", () => {
    const code = `function Comp() {\n  return (\n    <Child data={[1,2,3]} />\n  )\n}`;
    const s = getSuggestions("Comp.tsx", code, "render-object-literal-prop");
    expect(s.length).toBeGreaterThanOrEqual(1);
  });

  it("style= 不报", () => {
    const code = `function Comp() {\n  return (\n    <div style={{ color: "red" }} />\n  )\n}`;
    const s = getSuggestions("Comp.tsx", code, "render-object-literal-prop");
    expect(s).toHaveLength(0);
  });
});

describe("render-anonymous-fn-prop", () => {
  it("检测 onChange 内联箭头函数", () => {
    const code = `function Comp() {\n  return (\n    <Input onChange={(e) => setValue(e.target.value)} />\n  )\n}`;
    const s = getSuggestions("Comp.tsx", code, "render-anonymous-fn-prop");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("low");
  });
});

// ================================================================
//  状态管理 (state)
// ================================================================

describe("state-too-many-usestate", () => {
  it("检测 7+ 个 useState", () => {
    const states = Array(8)
      .fill(0)
      .map((_, i) => `const [s${i}, set${i}] = useState(0)`)
      .join("\n");
    const code = `function Form() {\n${states}\n  return <div />\n}`;
    const s = getSuggestions("Form.tsx", code, "state-too-many-usestate");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("medium");
    expect(s[0].title).toContain("8");
  });

  it("6 个以下不报", () => {
    const states = Array(5)
      .fill(0)
      .map((_, i) => `const [s${i}, set${i}] = useState(0)`)
      .join("\n");
    const code = `function Form() {\n${states}\n  return <div />\n}`;
    const s = getSuggestions("Form.tsx", code, "state-too-many-usestate");
    expect(s).toHaveLength(0);
  });
});

describe("state-derived-state", () => {
  it("检测 useEffect + setState 派生模式", () => {
    const code = `function Comp() {
  const [items] = useState([])
  const [filtered, setFiltered] = useState([])
  useEffect(() => {
    setFiltered(items.filter(x => x.active))
  }, [items])
  return <div />
}`;
    const s = getSuggestions("Comp.tsx", code, "state-derived-state");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("high");
  });
});

describe("state-context-rerenders", () => {
  it("检测 Provider value 内联对象", () => {
    const code = `function Provider({ children }) {
  const [data, setData] = useState(0)
  return <Ctx.Provider value={{ data, setData }}>{children}</Ctx.Provider>
}`;
    const s = getSuggestions("Provider.tsx", code, "state-context-rerenders");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("high");
  });

  it("使用变量传递不报", () => {
    const code = `function Provider({ children }) {
  const val = useMemo(() => ({ data }), [data])
  return <Ctx.Provider value={val}>{children}</Ctx.Provider>
}`;
    const s = getSuggestions("Provider.tsx", code, "state-context-rerenders");
    expect(s).toHaveLength(0);
  });
});

// ================================================================
//  缓存策略 (memoization)
// ================================================================

describe("memo-expensive-computation", () => {
  it("检测 return 中未缓存的 .filter().sort()", () => {
    const code = `function List({ items }) {
  const sorted = items.filter(x => x).sort((a,b) => a - b)
  return (
    <ul>{sorted.map(x => <li key={x}>{x}</li>)}</ul>
  )
}`;
    const s = getSuggestions("List.tsx", code, "memo-expensive-computation");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("high");
  });
});

describe("memo-missing-callback", () => {
  it("检测未 useCallback 但传给子组件的 handler", () => {
    const code = `function Parent() {
  const handleClick = (e) => { console.warn(e) }
  return <Child onClick={handleClick} />
}`;
    const s = getSuggestions("Parent.tsx", code, "memo-missing-callback");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("low");
  });

  it("已用 useCallback 不报", () => {
    const code = `function Parent() {
  const handleClick = useCallback((e) => { console.warn(e) }, [])
  return <Child onClick={handleClick} />
}`;
    const s = getSuggestions("Parent.tsx", code, "memo-missing-callback");
    expect(s).toHaveLength(0);
  });
});

// ================================================================
//  代码分割 (code-split)
// ================================================================

describe("split-large-component", () => {
  it("检测超过 300 行的组件文件", () => {
    const lines = Array(350).fill("  const x = 1").join("\n");
    const code = `function BigComp() {\n${lines}\n  return <div />\n}`;
    const s = getSuggestions("Big.tsx", code, "split-large-component");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("medium");
  });

  it("短文件不报", () => {
    const code = `function Small() { return <div /> }`;
    const s = getSuggestions("Small.tsx", code, "split-large-component");
    expect(s).toHaveLength(0);
  });
});

describe("split-heavy-import", () => {
  it("检测顶层导入 monaco-editor", () => {
    const code = `import { Editor } from 'monaco-editor'\nfunction Comp() { return <Editor /> }`;
    const s = getSuggestions("Editor.tsx", code, "split-heavy-import");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("high");
    expect(s[0].title).toContain("monaco-editor");
  });

  it("检测 chart.js", () => {
    const code = `import { Chart } from 'chart.js'\nexport default Chart`;
    const s = getSuggestions("Chart.tsx", code, "split-heavy-import");
    expect(s.length).toBeGreaterThanOrEqual(1);
  });

  it("轻量库不报", () => {
    const code = `import { useState } from 'react'\nexport function Comp() { return <div /> }`;
    const s = getSuggestions("Comp.tsx", code, "split-heavy-import");
    expect(s).toHaveLength(0);
  });
});

// ================================================================
//  资源优化 (resource)
// ================================================================

describe("resource-img-no-lazy", () => {
  it("检测 <img> 缺少 loading 属性", () => {
    const code = `<img src="photo.jpg" alt="pic" />`;
    const s = getSuggestions("Page.tsx", code, "resource-img-no-lazy");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("medium");
  });

  it("有 loading 不报", () => {
    const code = `<img src="photo.jpg" alt="pic" loading="lazy" />`;
    const s = getSuggestions("Page.tsx", code, "resource-img-no-lazy");
    expect(s).toHaveLength(0);
  });
});

describe("resource-no-width-height", () => {
  it("检测 <img> 缺少 width/height", () => {
    const code = `<img src="photo.jpg" alt="pic" />`;
    const s = getSuggestions("Page.tsx", code, "resource-no-width-height");
    expect(s.length).toBeGreaterThanOrEqual(1);
  });

  it("有 width 和 height 不报", () => {
    const code = `<img src="photo.jpg" alt="pic" width={200} height={150} />`;
    const s = getSuggestions("Page.tsx", code, "resource-no-width-height");
    expect(s).toHaveLength(0);
  });
});

// ================================================================
//  内存管理 (memory)
// ================================================================

describe("memory-no-cleanup", () => {
  it("检测 useEffect 中 addEventListener 无清理", () => {
    const code = `function Comp() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)
  }, [])
  return <div />
}`;
    const s = getSuggestions("Comp.tsx", code, "memory-no-cleanup");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("high");
    expect(s[0].docsUrl).toBeDefined();
  });

  it("有 return 清理不报", () => {
    const code = `function Comp() {
  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return <div />
}`;
    const s = getSuggestions("Comp.tsx", code, "memory-no-cleanup");
    expect(s).toHaveLength(0);
  });

  it("检测 setInterval 无清理", () => {
    const code = `function Comp() {
  useEffect(() => {
    setInterval(() => console.warn('tick'), 1000)
  }, [])
  return <div />
}`;
    const s = getSuggestions("Comp.tsx", code, "memory-no-cleanup");
    expect(s.length).toBeGreaterThanOrEqual(1);
  });
});

describe("memory-ref-in-closure", () => {
  it("检测空依赖闭包捕获大数据引用", () => {
    const code = `function Comp({ allData }) {
  useEffect(() => {
    process(allData)
  }, [])
  return <div />
}`;
    const s = getSuggestions("Comp.tsx", code, "memory-ref-in-closure");
    expect(s.length).toBeGreaterThanOrEqual(1);
  });
});

// ================================================================
//  网络优化 (network)
// ================================================================

describe("network-no-debounce", () => {
  it("检测 onChange 直接调用 fetch", () => {
    const code = `function Search() {
  return (
    <input onChange={(e) => {
      fetch('/api/search?q=' + e.target.value)
    }} />
  )
}`;
    const s = getSuggestions("Search.tsx", code, "network-no-debounce");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("high");
  });
});

describe("network-fetch-in-render", () => {
  it("检测渲染逻辑中直接 fetch", () => {
    const code = `function Dashboard() {
  const data = fetch('/api/data')
  return <div>{data}</div>
}`;
    const s = getSuggestions("Dashboard.tsx", code, "network-fetch-in-render");
    expect(s.length).toBeGreaterThanOrEqual(1);
  });
});

// ================================================================
//  打包优化 (bundle)
// ================================================================

describe("bundle-barrel-import", () => {
  it("检测 lodash 桶导入", () => {
    const code = `import { debounce } from 'lodash'`;
    const s = getSuggestions("utils.ts", code, "bundle-barrel-import");
    expect(s.length).toBeGreaterThanOrEqual(1);
    expect(s[0].impact).toBe("medium");
  });

  it("子路径导入不报", () => {
    const code = `import debounce from 'lodash/debounce'`;
    const s = getSuggestions("utils.ts", code, "bundle-barrel-import");
    expect(s).toHaveLength(0);
  });

  it("检测 @mui/material 桶导入", () => {
    const code = `import { Button } from '@mui/material'`;
    const s = getSuggestions("Comp.tsx", code, "bundle-barrel-import");
    expect(s.length).toBeGreaterThanOrEqual(1);
  });
});

describe("bundle-dynamic-import-string", () => {
  it("检测模板字符串动态 import", () => {
    const code = "const mod = import(`./pages/${name}`)";
    const s = getSuggestions("router.ts", code, "bundle-dynamic-import-string");
    expect(s.length).toBeGreaterThanOrEqual(1);
  });

  it("固定路径不报", () => {
    const code = `const mod = import('./pages/Home')`;
    const s = getSuggestions("router.ts", code, "bundle-dynamic-import-string");
    expect(s).toHaveLength(0);
  });
});

// ================================================================
//  analyzeFilePerformance — 综合测试
// ================================================================

describe("analyzeFilePerformance", () => {
  it("返回正确结构", () => {
    const report = analyzeFilePerformance(
      "test.tsx",
      `function Comp() { return <div /> }`,
    );
    expect(report.filepath).toBe("test.tsx");
    expect(report.analyzedAt).toBeGreaterThan(0);
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(report.suggestions)).toBe(true);
  });

  it("无问题文件得分 100", () => {
    const report = analyzeFilePerformance(
      "test.tsx",
      `function Comp() { return <div /> }`,
    );
    expect(report.score).toBe(100);
  });

  it("high impact 扣分多于 low impact", () => {
    // high impact: memory-no-cleanup
    const highCode = `function A() {
  useEffect(() => { window.addEventListener('resize', f) }, [])
  return <div />
}`;
    // low impact: resource-no-width-height
    const lowCode = `function B() { return <img src="x" alt="y" /> }`;
    const highReport = analyzeFilePerformance("a.tsx", highCode);
    const lowReport = analyzeFilePerformance("b.tsx", lowCode);
    expect(highReport.score).toBeLessThan(lowReport.score);
  });

  it("建议按 impact 排序 (high first)", () => {
    const code = `function Comp() {
  useEffect(() => { window.addEventListener('resize', f) }, [])
  return (
    <img src="x" alt="y" />
  )
}`;
    const report = analyzeFilePerformance("test.tsx", code);
    if (report.suggestions.length >= 2) {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < report.suggestions.length; i++) {
        expect(
          impactOrder[report.suggestions[i].impact],
        ).toBeGreaterThanOrEqual(impactOrder[report.suggestions[i - 1].impact]);
      }
    }
  });

  it("每条建议有唯一 id", () => {
    const code = `function Comp() {
  return (
    <div>
      <img src="a" alt="a" />
      <img src="b" alt="b" />
      <img src="c" alt="c" />
    </div>
  )
}`;
    const report = analyzeFilePerformance("test.tsx", code);
    const ids = report.suggestions.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("非 TSX 文件跳过 TSX 规则", () => {
    const code = `export function helper() { return 1 }`;
    const report = analyzeFilePerformance("utils.ts", code);
    // render-no-memo only runs on .tsx/.jsx
    const memoSuggestions = report.suggestions.filter(
      (s) => s.ruleId === "render-no-memo",
    );
    expect(memoSuggestions).toHaveLength(0);
  });

  it("非代码文件返回空", () => {
    const report = analyzeFilePerformance("image.png", "binary");
    expect(report.suggestions).toHaveLength(0);
    expect(report.score).toBe(100);
  });
});

// ================================================================
//  analyzeProjectPerformance
// ================================================================

describe("analyzeProjectPerformance", () => {
  it("分析多个文件", () => {
    const files = {
      "src/A.tsx": `function A() {
  useEffect(() => { window.addEventListener('resize', f) }, [])
  return <div />
}`,
      "src/B.tsx": `function B() { return <img src="x" alt="y" /> }`,
      "readme.md": "# readme",
    };
    const result = analyzeProjectPerformance(files);
    expect(result.files.length).toBeGreaterThanOrEqual(1);
    expect(result.analyzedAt).toBeGreaterThan(0);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("跳过非代码文件", () => {
    const result = analyzeProjectPerformance({
      "a.png": "bin",
      "b.json": "{}",
    });
    expect(result.files).toHaveLength(0);
    expect(result.overallScore).toBe(100);
  });

  it("统计 categoryBreakdown", () => {
    const files = {
      "a.tsx": `function A() {
  useEffect(() => { window.addEventListener('resize', f) }, [])
  return <img src="x" alt="y" />
}`,
    };
    const result = analyzeProjectPerformance(files);
    expect(result.categoryBreakdown.memory).toBeGreaterThanOrEqual(1);
    expect(result.categoryBreakdown.resource).toBeGreaterThanOrEqual(1);
  });

  it("topIssues 只包含 high impact", () => {
    const files = {
      "a.tsx": `function A() {
  useEffect(() => { setInterval(() => {}, 100) }, [])
  return <img src="x" alt="y" />
}`,
    };
    const result = analyzeProjectPerformance(files);
    for (const issue of result.topIssues) {
      expect(issue.impact).toBe("high");
    }
  });

  it("空项目不崩溃", () => {
    const result = analyzeProjectPerformance({});
    expect(result.files).toHaveLength(0);
    expect(result.overallScore).toBe(100);
  });
});

// ================================================================
//  getPerfRuleDescriptions
// ================================================================

describe("getPerfRuleDescriptions", () => {
  it("返回所有规则", () => {
    const rules = getPerfRuleDescriptions();
    expect(rules.length).toBe(18);
  });

  it("每条有 id, title, category, impact", () => {
    for (const r of getPerfRuleDescriptions()) {
      expect(r.id).toBeTruthy();
      expect(r.title).toBeTruthy();
      expect(r.category).toBeTruthy();
      expect(r.impact).toBeTruthy();
    }
  });

  it("覆盖所有 8 个类别", () => {
    const categories = new Set(
      getPerfRuleDescriptions().map((r) => r.category),
    );
    expect(categories.size).toBe(8);
    expect(categories.has("render")).toBe(true);
    expect(categories.has("state")).toBe(true);
    expect(categories.has("code-split")).toBe(true);
    expect(categories.has("memoization")).toBe(true);
    expect(categories.has("resource")).toBe(true);
    expect(categories.has("memory")).toBe(true);
    expect(categories.has("network")).toBe(true);
    expect(categories.has("bundle")).toBe(true);
  });
});

// ================================================================
//  Edge Cases
// ================================================================

describe("Edge Cases", () => {
  it("空文件不崩溃", () => {
    const report = analyzeFilePerformance("test.tsx", "");
    expect(report.suggestions).toHaveLength(0);
  });

  it("大文件性能 (<500ms)", () => {
    const lines = Array(200).fill(`  const x = useState(0)`).join("\n");
    const code = `function Big() {\n${lines}\n  return <div />\n}`;
    const start = Date.now();
    analyzeFilePerformance("big.tsx", code);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("CSS 文件不触发任何规则", () => {
    const report = analyzeFilePerformance("styles.css", `.foo { color: red; }`);
    expect(report.suggestions).toHaveLength(0);
  });
});
