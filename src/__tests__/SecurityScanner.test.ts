// ================================================================
// SecurityScanner 单元测试
// 覆盖: 全部 22 条安全扫描规则 + scanFile + scanProject +
//       applySecurityFix + buildSecurityFixPrompt +
//       getSecurityRuleDescriptions
// ================================================================

import { describe, it, expect } from "vitest";
import {
  scanFile,
  scanProject,
  applySecurityFix,
  buildSecurityFixPrompt,
  getSecurityRuleDescriptions,
  type SecurityFinding,
} from "../app/components/ide/ai/SecurityScanner";

// ── Helper ──

function getFindings(
  filepath: string,
  content: string,
  ruleId?: string,
): SecurityFinding[] {
  const report = scanFile(filepath, content);
  if (ruleId) return report.findings.filter((f) => f.ruleId === ruleId);
  return report.findings;
}

// ================================================================
//  XSS Rules
// ================================================================

describe("xss-dangerously-set-html", () => {
  it("检测 dangerouslySetInnerHTML", () => {
    const code = `<div dangerouslySetInnerHTML={{ __html: userContent }} />`;
    const f = getFindings("test.tsx", code, "xss-dangerously-set-html");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("high");
    expect(f[0].cweId).toBe("CWE-79");
    expect(f[0].category).toBe("xss");
  });
});

describe("xss-innerhtml-assignment", () => {
  it("检测 .innerHTML = ...", () => {
    const code = `element.innerHTML = userInput`;
    const f = getFindings("test.ts", code, "xss-innerhtml-assignment");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("critical");
  });

  it("检测 .outerHTML = ...", () => {
    const f = getFindings(
      "test.ts",
      `el.outerHTML = data`,
      "xss-innerhtml-assignment",
    );
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  it("注释中不报", () => {
    const f = getFindings(
      "test.ts",
      `// element.innerHTML = x`,
      "xss-innerhtml-assignment",
    );
    expect(f).toHaveLength(0);
  });
});

describe("xss-url-javascript", () => {
  it('检测 href="javascript:..."', () => {
    const code = `<a href="javascript:alert(1)">click</a>`;
    const f = getFindings("test.tsx", code, "xss-url-javascript");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("critical");
  });
});

describe("xss-document-write", () => {
  it("检测 document.write()", () => {
    const f = getFindings(
      "test.ts",
      `document.write(html)`,
      "xss-document-write",
    );
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("high");
  });

  it("检测 document.writeln()", () => {
    const f = getFindings(
      "test.ts",
      `document.writeln(html)`,
      "xss-document-write",
    );
    expect(f.length).toBeGreaterThanOrEqual(1);
  });
});

// ================================================================
//  Injection Rules
// ================================================================

describe("injection-eval", () => {
  it("检测 eval()", () => {
    const f = getFindings(
      "test.ts",
      `const result = eval(expr)`,
      "injection-eval",
    );
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("critical");
    expect(f[0].cweId).toBe("CWE-94");
  });

  it("检测 new Function()", () => {
    const f = getFindings(
      "test.ts",
      `const fn = new Function(code)`,
      "injection-eval",
    );
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  it("注释中不报", () => {
    const f = getFindings("test.ts", `// eval is bad`, "injection-eval");
    expect(f).toHaveLength(0);
  });
});

describe("injection-sql-template", () => {
  it("检测 SQL 模板字符串拼接", () => {
    const code = "db.query(`SELECT * FROM users WHERE id = ${userId}`)";
    const f = getFindings("test.ts", code, "injection-sql-template");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("critical");
    expect(f[0].cweId).toBe("CWE-89");
  });

  it("参数化查询不报", () => {
    const code = `db.query('SELECT * FROM users WHERE id = $1', [userId])`;
    const f = getFindings("test.ts", code, "injection-sql-template");
    expect(f).toHaveLength(0);
  });
});

// ================================================================
//  Sensitive Data Rules
// ================================================================

describe("sensitive-hardcoded-secret", () => {
  it("检测硬编码 OpenAI 密钥", () => {
    const code = `const key = "sk-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdef"`;
    const f = getFindings("test.ts", code, "sensitive-hardcoded-secret");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("critical");
    expect(f[0].cweId).toBe("CWE-798");
  });

  it("检测 GitHub Token", () => {
    const code = `const token = "ghp_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdef"`;
    const f = getFindings("test.ts", code, "sensitive-hardcoded-secret");
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  it("检测 AWS Key", () => {
    const code = `const awsKey = "AKIAIOSFODNN7EXAMPLE"`;
    const f = getFindings("test.ts", code, "sensitive-hardcoded-secret");
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  it("不误报占位符", () => {
    const code = `const apiKey = "YOUR_API_KEY_HERE"`;
    const f = getFindings("test.ts", code, "sensitive-hardcoded-secret");
    expect(f).toHaveLength(0);
  });

  it("不误报 .example 文件", () => {
    const code = `API_KEY=sk-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`;
    const f = getFindings(".env.example", code, "sensitive-hardcoded-secret");
    expect(f).toHaveLength(0);
  });
});

describe("sensitive-console-secrets", () => {
  it("检测 console.log 输出密码", () => {
    const code = `console.log("password:", password)`;
    const f = getFindings("test.ts", code, "sensitive-console-secrets");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].autoFixable).toBe(true);
  });

  it("检测 console.log 输出 token", () => {
    const f = getFindings(
      "test.ts",
      `console.debug(token)`,
      "sensitive-console-secrets",
    );
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  it("普通 console.log 不报", () => {
    const f = getFindings(
      "test.ts",
      `console.log("hello world")`,
      "sensitive-console-secrets",
    );
    expect(f).toHaveLength(0);
  });
});

describe("sensitive-localstorage", () => {
  it("检测 localStorage 存储 token", () => {
    const code = `localStorage.setItem('authToken', jwt)`;
    const f = getFindings("test.ts", code, "sensitive-localstorage");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("high");
  });

  it("检测 sessionStorage 存储 password", () => {
    const code = `sessionStorage.setItem('password', pwd)`;
    const f = getFindings("test.ts", code, "sensitive-localstorage");
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  it("存储非敏感数据不报", () => {
    const code = `localStorage.setItem('theme', 'dark')`;
    const f = getFindings("test.ts", code, "sensitive-localstorage");
    expect(f).toHaveLength(0);
  });
});

describe("sensitive-error-leak", () => {
  it("检测 catch 中暴露 error.stack", () => {
    const code = `try { foo() } catch (err) {\n  res.json({ error: err.stack })\n}`;
    const f = getFindings("test.ts", code, "sensitive-error-leak");
    expect(f.length).toBeGreaterThanOrEqual(1);
  });
});

// ================================================================
//  Auth Rules
// ================================================================

describe("auth-weak-comparison", () => {
  it("检测 password == ...", () => {
    const code = `if (password == inputPwd) { grant() }`;
    const f = getFindings("test.ts", code, "auth-weak-comparison");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("high");
  });

  it("=== 比较不报", () => {
    const code = `if (password === inputPwd) { grant() }`;
    const f = getFindings("test.ts", code, "auth-weak-comparison");
    expect(f).toHaveLength(0);
  });
});

describe("auth-no-csrf-token", () => {
  it("检测 POST 表单无 CSRF", () => {
    const code = `<form method="post" action="/api">\n  <input name="data" />\n</form>`;
    const f = getFindings("test.tsx", code, "auth-no-csrf-token");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].category).toBe("csrf");
  });

  it("有 csrf token 不报", () => {
    const code = `<form method="post">\n  <input type="hidden" name="_csrf" value={csrfToken} />\n</form>`;
    const f = getFindings("test.tsx", code, "auth-no-csrf-token");
    expect(f).toHaveLength(0);
  });
});

// ================================================================
//  Crypto Rules
// ================================================================

describe("crypto-weak-hash", () => {
  it("检测 MD5", () => {
    const code = `crypto.createHash('md5').update(data).digest('hex')`;
    const f = getFindings("test.ts", code, "crypto-weak-hash");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("high");
    expect(f[0].title).toContain("MD5");
  });

  it("检测 SHA-1", () => {
    const code = `crypto.createHash('sha1').update(data).digest('hex')`;
    const f = getFindings("test.ts", code, "crypto-weak-hash");
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  it("SHA-256 不报", () => {
    const code = `crypto.createHash('sha256').update(data).digest('hex')`;
    const f = getFindings("test.ts", code, "crypto-weak-hash");
    expect(f).toHaveLength(0);
  });
});

describe("crypto-math-random", () => {
  it("检测 Math.random() 生成 token", () => {
    const code = `const token = Math.random().toString(36)`;
    const f = getFindings("test.ts", code, "crypto-math-random");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("medium");
  });

  it("非安全上下文不报", () => {
    const code = `const delay = Math.random() * 1000`;
    const f = getFindings("test.ts", code, "crypto-math-random");
    expect(f).toHaveLength(0);
  });
});

// ================================================================
//  Config Rules
// ================================================================

describe("config-cors-wildcard", () => {
  it("检测 CORS origin: '*'", () => {
    const code = `cors({ origin: '*' })`;
    const f = getFindings("test.ts", code, "config-cors-wildcard");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("medium");
  });

  it("具体域名不报", () => {
    const code = `cors({ origin: 'https://example.com' })`;
    const f = getFindings("test.ts", code, "config-cors-wildcard");
    expect(f).toHaveLength(0);
  });
});

describe("config-http-no-https", () => {
  it("检测 http:// API 调用", () => {
    const code = `fetch("http://api.example.com/data")`;
    const f = getFindings("test.ts", code, "config-http-no-https");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].autoFixable).toBe(true);
  });

  it("localhost 不报", () => {
    const code = `fetch("http://localhost:3000/api")`;
    const f = getFindings("test.ts", code, "config-http-no-https");
    expect(f).toHaveLength(0);
  });

  it("https 不报", () => {
    const code = `fetch("https://api.example.com/data")`;
    const f = getFindings("test.ts", code, "config-http-no-https");
    expect(f).toHaveLength(0);
  });
});

describe("config-unsafe-regex", () => {
  it("检测 new RegExp(userInput)", () => {
    const code = `const re = new RegExp(userInput)`;
    const f = getFindings("test.ts", code, "config-unsafe-regex");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("medium");
  });

  it("字符串字面量 RegExp 不报", () => {
    const code = `const re = new RegExp("^test$")`;
    const f = getFindings("test.ts", code, "config-unsafe-regex");
    expect(f).toHaveLength(0);
  });
});

// ================================================================
//  Access Control Rules
// ================================================================

describe("access-open-redirect", () => {
  it("检测未验证的 URL 重定向", () => {
    const code = `window.location.href = query.redirectUrl`;
    const f = getFindings("test.ts", code, "access-open-redirect");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("medium");
  });
});

describe("access-debug-enabled", () => {
  it("检测 debug: true", () => {
    const code = `const config = { debug: true }`;
    const f = getFindings("test.ts", code, "access-debug-enabled");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("low");
  });
});

// ================================================================
//  Dependency Rules
// ================================================================

describe("dep-prototype-pollution", () => {
  it("检测动态属性赋值", () => {
    const code = `obj[key] = value`;
    const f = getFindings("test.ts", code, "dep-prototype-pollution");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("high");
  });
});

describe("dep-postmessage-no-origin", () => {
  it("检测 postMessage 目标为 '*'", () => {
    const code = `iframe.contentWindow.postMessage(data, '*')`;
    const f = getFindings("test.ts", code, "dep-postmessage-no-origin");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("high");
  });

  it("检测 message 监听器无 origin 验证", () => {
    const code = `window.addEventListener('message', (e) => {\n  processData(e.data)\n})`;
    const f = getFindings("test.ts", code, "dep-postmessage-no-origin");
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  it("有 origin 检查不报", () => {
    const code = `window.addEventListener('message', (e) => {\n  if (e.origin !== 'https://trusted.com') return\n  processData(e.data)\n})`;
    const f = getFindings("test.ts", code, "dep-postmessage-no-origin");
    // The postMessage target check doesn't apply; message listener should pass
    const listenerFindings = f.filter((x) => x.title.includes("message 事件"));
    expect(listenerFindings).toHaveLength(0);
  });
});

// ================================================================
//  Supply Chain Rules
// ================================================================

describe("supply-unpinned-deps", () => {
  it("检测 package.json 中 * 版本", () => {
    const code = `{\n  "dependencies": {\n    "lodash": "*"\n  }\n}`;
    const f = getFindings("package.json", code, "supply-unpinned-deps");
    expect(f.length).toBeGreaterThanOrEqual(1);
    expect(f[0].severity).toBe("info");
  });

  it("检测 latest 版本", () => {
    const code = `{\n  "dependencies": {\n    "react": "latest"\n  }\n}`;
    const f = getFindings("package.json", code, "supply-unpinned-deps");
    expect(f.length).toBeGreaterThanOrEqual(1);
  });

  it("固定版本不报", () => {
    const code = `{\n  "dependencies": {\n    "react": "18.2.0"\n  }\n}`;
    const f = getFindings("package.json", code, "supply-unpinned-deps");
    expect(f).toHaveLength(0);
  });
});

// ================================================================
//  scanFile — 综合测试
// ================================================================

describe("scanFile", () => {
  it("返回正确结构", () => {
    const report = scanFile("test.ts", `const x = 1`);
    expect(report.filepath).toBe("test.ts");
    expect(report.analyzedAt).toBeGreaterThan(0);
    expect(report.riskScore).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(report.findings)).toBe(true);
  });

  it("安全文件风险分为 0", () => {
    const report = scanFile(
      "test.ts",
      `export const add = (a: number, b: number) => a + b`,
    );
    expect(report.riskScore).toBe(0);
    expect(report.findings).toHaveLength(0);
  });

  it("结果按 severity 排序 (critical first)", () => {
    const code = `
element.innerHTML = userInput
console.log("password:", password)
const config = { debug: true }
`;
    const report = scanFile("test.ts", code);
    if (report.findings.length >= 2) {
      const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      for (let i = 1; i < report.findings.length; i++) {
        expect(order[report.findings[i].severity]).toBeGreaterThanOrEqual(
          order[report.findings[i - 1].severity],
        );
      }
    }
  });

  it("每条发现有唯一 id", () => {
    const code = `eval("1")\neval("2")\neval("3")`;
    const report = scanFile("test.ts", code);
    const ids = report.findings.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("非代码文件返回空", () => {
    const report = scanFile("image.png", "binary data");
    expect(report.findings).toHaveLength(0);
    expect(report.riskScore).toBe(0);
  });

  it("risk score 上限 100", () => {
    // Many critical findings
    const lines = Array(20).fill(`element.innerHTML = userInput`).join("\n");
    const report = scanFile("test.ts", lines);
    expect(report.riskScore).toBeLessThanOrEqual(100);
  });
});

// ================================================================
//  scanProject
// ================================================================

describe("scanProject", () => {
  it("分析多个文件", () => {
    const files = {
      "a.ts": `eval("x")`,
      "b.tsx": `<div dangerouslySetInnerHTML={{ __html: data }} />`,
      "readme.md": "# safe",
    };
    const result = scanProject(files);
    expect(result.files.length).toBeGreaterThanOrEqual(2);
    expect(result.analyzedAt).toBeGreaterThan(0);
    expect(result.criticalCount).toBeGreaterThanOrEqual(1);
  });

  it("跳过非代码文件", () => {
    const result = scanProject({ "a.png": "bin" });
    expect(result.files).toHaveLength(0);
  });

  it("空项目不崩溃", () => {
    const result = scanProject({});
    expect(result.files).toHaveLength(0);
    expect(result.overallRiskScore).toBe(0);
  });

  it("统计 categoryBreakdown", () => {
    const result = scanProject({
      "a.ts": `eval("x")`,
      "b.ts": `document.write(html)`,
    });
    expect(result.categoryBreakdown.injection).toBeGreaterThanOrEqual(1);
    expect(result.categoryBreakdown.xss).toBeGreaterThanOrEqual(1);
  });

  it("topFindings 只含 critical/high", () => {
    const result = scanProject({
      "a.ts": `eval("x")\nconsole.log("password:", p)\nconst config = { debug: true }`,
    });
    for (const f of result.topFindings) {
      expect(["critical", "high"]).toContain(f.severity);
    }
  });
});

// ================================================================
//  applySecurityFix
// ================================================================

describe("applySecurityFix", () => {
  it("删除指定行", () => {
    const content = `line1\nconsole.log("password:", pw)\nline3`;
    const result = applySecurityFix(content, {
      range: { startLine: 2, endLine: 2 },
      replacement: "",
    });
    expect(result).toBe("line1\nline3");
  });

  it("替换指定行", () => {
    const content = `line1\nhttp://api.example.com\nline3`;
    const result = applySecurityFix(content, {
      range: { startLine: 2, endLine: 2 },
      replacement: "https://api.example.com",
    });
    expect(result).toBe("line1\nhttps://api.example.com\nline3");
  });
});

// ================================================================
//  buildSecurityFixPrompt
// ================================================================

describe("buildSecurityFixPrompt", () => {
  it("生成包含安全信息的 prompt", () => {
    const finding: SecurityFinding = {
      id: "test-1",
      ruleId: "injection-eval",
      filepath: "src/utils.ts",
      line: 5,
      column: 1,
      severity: "critical",
      category: "injection",
      cweId: "CWE-94",
      owaspCategory: "A03:2021-Injection",
      title: "eval() 可执行任意代码",
      description: "eval 危险",
      remediation: "使用 JSON.parse",
      autoFixable: false,
    };
    const content = `import { foo } from 'bar'\n\nfunction process(expr: string) {\n  return eval(expr)\n}\n`;
    const prompt = buildSecurityFixPrompt(finding, content);

    expect(prompt).toContain("src/utils.ts");
    expect(prompt).toContain("CWE-94");
    expect(prompt).toContain("CRITICAL");
    expect(prompt).toContain("injection-eval");
    expect(prompt).toContain("eval");
    expect(prompt).toContain("JSON.parse");
    expect(prompt).toContain("代码片段");
  });
});

// ================================================================
//  getSecurityRuleDescriptions
// ================================================================

describe("getSecurityRuleDescriptions", () => {
  it("返回所有规则", () => {
    const rules = getSecurityRuleDescriptions();
    expect(rules.length).toBeGreaterThanOrEqual(20);
  });

  it("每条有 id, title, category, severity", () => {
    for (const r of getSecurityRuleDescriptions()) {
      expect(r.id).toBeTruthy();
      expect(r.title).toBeTruthy();
      expect(r.category).toBeTruthy();
      expect(r.severity).toBeTruthy();
    }
  });

  it("覆盖多个 OWASP 类别", () => {
    const owasp = new Set(
      getSecurityRuleDescriptions()
        .filter((r) => r.owaspCategory)
        .map((r) => r.owaspCategory),
    );
    expect(owasp.size).toBeGreaterThanOrEqual(5);
  });

  it("覆盖多个 CWE", () => {
    const cwes = new Set(
      getSecurityRuleDescriptions()
        .filter((r) => r.cweId)
        .map((r) => r.cweId),
    );
    expect(cwes.size).toBeGreaterThanOrEqual(8);
  });
});

// ================================================================
//  Edge Cases
// ================================================================

describe("Edge Cases", () => {
  it("空文件不崩溃", () => {
    const report = scanFile("test.ts", "");
    expect(report.findings).toHaveLength(0);
  });

  it("性能 (<500ms for 200 files)", () => {
    const files: Record<string, string> = {};
    for (let i = 0; i < 200; i++) {
      files[`src/file${i}.ts`] = `const x = ${i}`;
    }
    const start = Date.now();
    scanProject(files);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("CSS 文件不触发 JS 规则", () => {
    const report = scanFile("styles.css", `.foo { color: red; }`);
    expect(report.findings).toHaveLength(0);
  });

  it("package.json 只触发 supply-chain 规则", () => {
    const report = scanFile(
      "package.json",
      `{\n  "dependencies": { "react": "*" }\n}`,
    );
    for (const f of report.findings) {
      expect(f.category).toBe("supply-chain");
    }
  });
});
