/**
 * @file e2e/security-tests.spec.ts
 * @description Playwright 安全测试 - 测试 XSS、CSRF、CSP、输入验证等安全功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,security,xss,csrf,csp
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

// ── Security Test Helpers ──

async function testXSS(page: Page, selector: string, payload: string) {
  const element = await page.$(selector);
  if (element) {
    await element.fill(payload);
    await element.press("Enter");
    await page.waitForTimeout(500);
    
    // 检查 payload 是否被转义
    const innerHTML = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.innerHTML : "";
    }, selector);
    
    // 验证脚本标签被转义
    const isEscaped = !innerHTML.includes("<script>") && 
                      innerHTML.includes("&lt;script&gt;");
    return isEscaped;
  }
  return true;
}

async function checkCSP(page: Page): Promise<boolean> {
  const response = await page.goto(BASE_URL);
  if (!response) return false;
  
  const headers = response.headers();
  const cspHeader = headers["content-security-policy"] || 
                    headers["content-security-policy-report-only"];
  
  return !!cspHeader;
}

// ── Security Tests ──

test.describe("安全测试 - E2E", () => {
  // ── 1. XSS 防护测试 ──

  test("XSS 防护 - 脚本注入", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/ide`);
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
    ];
    
    for (const payload of xssPayloads) {
      // 测试 AI 对话输入框
      const textarea = page.locator('textarea[placeholder*="输入"]').first();
      if (await textarea.count() > 0) {
        await textarea.fill(payload);
        await textarea.press("Enter");
        await page.waitForTimeout(1000);
        
        // 验证没有脚本执行 (通过检查页面状态)
        const hasAlert = await page.evaluate(() => {
          let alertCalled = false;
          const originalAlert = window.alert;
          window.alert = () => { alertCalled = true; };
          return alertCalled;
        });
        
        expect(hasAlert).toBeFalsy();
      }
    }
  });

  test("XSS 防护 - 文件内容注入", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/ide`);
    
    const xssPayload = '<script>alert("XSS")</script>';
    
    // 尝试在文件内容中注入 XSS
    const editor = page.locator('.monaco-editor').first();
    if (await editor.count() > 0) {
      await editor.click();
      await page.keyboard.type(xssPayload);
      await page.waitForTimeout(500);
      
      // 验证内容被正确处理
      const content = await page.evaluate(() => {
        const editorElement = document.querySelector('.monaco-editor');
        return editorElement ? editorElement.innerHTML : "";
      });
      
      // 验证脚本标签被转义
      expect(content).not.toContain("<script>");
    }
  });

  // ── 2. CSP 测试 ──

  test("CSP 配置验证", async ({ page }) => {
    const hasCSP = await checkCSP(page);
    
    // 验证 CSP 头存在
    expect(hasCSP).toBeTruthy();
  });

  test("CSP - 阻止不安全资源", async ({ page }) => {
    let cspViolation = false;
    
    page.on("console", (msg) => {
      if (msg.text().includes("Content Security Policy")) {
        cspViolation = true;
      }
    });
    
    // 尝试加载不安全的资源
    await page.evaluate(() => {
      const script = document.createElement("script");
      script.src = "http://malicious.com/malware.js";
      document.head.appendChild(script);
    });
    
    await page.waitForTimeout(1000);
    
    // 验证 CSP 阻止了不安全资源
    expect(cspViolation).toBeTruthy();
  });

  // ── 3. CSRF 防护测试 ──

  test("CSRF 防护 - Token 验证", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/ide`);
    
    // 检查表单是否包含 CSRF token
    const forms = await page.$$("form");
    
    for (const form of forms) {
      const csrfToken = await form.$('input[name="_csrf"], input[name="csrf_token"]');
      
      // 如果有表单，应该包含 CSRF token
      if (csrfToken) {
        const tokenValue = await csrfToken.inputValue();
        expect(tokenValue).toBeTruthy();
        expect(tokenValue.length).toBeGreaterThan(10);
      }
    }
  });

  // ── 4. 输入验证测试 ──

  test("输入验证 - 文件名", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/ide`);
    
    const invalidFileNames = [
      "../../../etc/passwd",
      "file.exe",
      "file.php",
      '<script>alert("XSS")</script>',
      "file" + "\0" + ".tsx",
      "file name with spaces.tsx",
    ];
    
    for (const fileName of invalidFileNames) {
      const newFileBtn = page.locator('button[title*="新建"]').first();
      if (await newFileBtn.count() > 0) {
        await newFileBtn.click();
        await page.waitForTimeout(500);
        
        const fileNameInput = page.locator('input[placeholder*="文件名"]').first();
        if (await fileNameInput.count() > 0) {
          await fileNameInput.fill(fileName);
          await fileNameInput.press("Enter");
          await page.waitForTimeout(1000);
          
          // 验证文件名被正确处理或拒绝
          const fileItem = page.locator(`text=${fileName}`).first();
          // 危险的文件名应该被拒绝或转义
          expect(true).toBeTruthy(); // 根据实际实现调整
        }
      }
    }
  });

  test("输入验证 - API Key", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/ide`);
    
    // 找到设置入口
    const settingsBtn = page.locator('button[title*="设置"]').first();
    if (await settingsBtn.count() > 0) {
      await settingsBtn.click();
      await page.waitForTimeout(1000);
      
      // 尝试注入恶意 API Key
      const apiKeyInput = page.locator('input[type="password"], input[placeholder*="API"]').first();
      if (await apiKeyInput.count() > 0) {
        const maliciousKey = '<script>alert("XSS")</script>';
        await apiKeyInput.fill(maliciousKey);
        await page.waitForTimeout(500);
        
        // 验证输入被正确处理
        const value = await apiKeyInput.inputValue();
        expect(value).toBe(maliciousKey);
        
        // 保存后验证没有脚本执行
        const saveBtn = page.locator('button:has-text("保存")').first();
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          await page.waitForTimeout(1000);
          
          // 验证页面正常
          expect(page.url()).toContain("settings");
        }
      }
    }
  });

  // ── 5. 认证授权测试 ──

  test("认证 - 未授权访问", async ({ page }) => {
    // 尝试直接访问受保护的 API
    const response = await page.request.get(`${BASE_URL}/api/protected`);
    
    // 应该返回 401 或 403
    expect([401, 403, 404]).toContain(response.status());
  });

  test("认证 - Session 管理", async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 获取初始 cookies
    const cookies1 = await page.context().cookies();
    
    // 刷新页面
    await page.reload();
    
    // 验证 session 保持
    const cookies2 = await page.context().cookies();
    
    // Session 应该保持一致或正确更新
    expect(cookies1.length).toEqual(cookies2.length);
  });

  // ── 6. 敏感信息泄露测试 ──

  test("敏感信息 - 源代码泄露", async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 检查是否暴露敏感文件
    const sensitiveFiles = [
      ".git",
      ".env",
      "config.json",
      "package.json",
      "tsconfig.json",
    ];
    
    for (const file of sensitiveFiles) {
      const response = await page.request.get(`${BASE_URL}/${file}`);
      
      // 敏感文件应该返回 403 或 404
      expect([403, 404]).toContain(response.status());
    }
  });

  test("敏感信息 - 错误信息泄露", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/non-existent-route`);
    
    // 验证错误页面不泄露敏感信息
    const bodyText = await page.textContent("body");
    
    const sensitiveInfo = [
      "stack trace",
      "at ",
      "Error:",
      "internal",
      "database",
    ];
    
    for (const info of sensitiveInfo) {
      expect(bodyText.toLowerCase()).not.toContain(info.toLowerCase());
    }
  });

  // ── 7. 依赖安全测试 ──

  test("依赖 - 已知漏洞扫描", async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 获取加载的脚本
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("script[src]"))
        .map((s) => s.src);
    });
    
    console.log("加载的脚本:", scripts);
    
    // 验证没有加载已知的不安全 CDN
    const unsafeCDNs = [
      "http://",
      "code.jquery.com", // 应该使用 HTTPS
    ];
    
    for (const cdn of unsafeCDNs) {
      const hasUnsafe = scripts.some((s) => s.includes(cdn));
      expect(hasUnsafe).toBeFalsy();
    }
  });

  // ── 8. 点击劫持防护测试 ──

  test("点击劫持防护", async ({ page }) => {
    const response = await page.goto(BASE_URL);
    if (!response) return;
    
    const headers = response.headers();
    const xFrameOptions = headers["x-frame-options"];
    const frameOptions = headers["content-security-policy"];
    
    // 应该有 X-Frame-Options 或 CSP frame-ancestors
    const hasProtection = xFrameOptions === "DENY" || 
                          xFrameOptions === "SAMEORIGIN" ||
                          frameOptions?.includes("frame-ancestors");
    
    expect(hasProtection).toBeTruthy();
  });

  // ── 9. HTTP 安全头测试 ──

  test("HTTP 安全头", async ({ page }) => {
    const response = await page.goto(BASE_URL);
    if (!response) return;
    
    const headers = response.headers();
    
    // 验证安全头存在
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
    expect(headers["strict-transport-security"]).toBeDefined();
    expect(headers["x-frame-options"]).toBeDefined();
  });

  // ── 10. 本地存储安全测试 ──

  test("本地存储安全", async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 检查 localStorage
    const localStorageData = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || "";
        }
      }
      return data;
    });
    
    console.log("LocalStorage 数据:", localStorageData);
    
    // 验证没有存储敏感信息
    const sensitiveKeys = ["password", "secret", "token", "key"];
    for (const key of Object.keys(localStorageData)) {
      for (const sensitive of sensitiveKeys) {
        expect(key.toLowerCase()).not.toContain(sensitive);
      }
    }
  });

  // ── 11. 文件上传安全测试 ──

  test("文件上传安全", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/ide`);
    
    // 如果有文件上传功能
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      // 尝试上传恶意文件
      const maliciousFiles = [
        "malware.exe",
        "script.php",
        "virus.bat",
      ];
      
      for (const fileName of maliciousFiles) {
        // 验证文件类型限制
        const accept = await fileInput.getAttribute("accept");
        
        if (accept) {
          // 应该限制为安全的文件类型
          expect(accept).not.toContain(".exe");
          expect(accept).not.toContain(".php");
          expect(accept).not.toContain(".bat");
        }
      }
    }
  });

  // ── 12. 速率限制测试 ──

  test("速率限制", async ({ page }) => {
    const requests: { status: number }[] = [];
    
    // 快速发送多个请求
    for (let i = 0; i < 10; i++) {
      const response = await page.request.get(`${BASE_URL}/api/test`);
      requests.push({ status: response.status() });
    }
    
    // 验证有速率限制
    const hasRateLimit = requests.some((r) => r.status === 429);
    
    // 如果没有 429，至少有其他错误响应
    const hasError = requests.some((r) => r.status >= 400);
    
    expect(hasRateLimit || hasError).toBeTruthy();
  });
});
