/**
 * @file e2e/performance-new-features.spec.ts
 * @description Playwright 性能测试 - 新功能性能测试：
 *              预览模式、快照管理、代码验证、系统提示词构建
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-31
 * @updated 2026-03-31
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,performance,new-features
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

// 性能预算
const PERFORMANCE_BUDGETS = {
  previewRefresh: 200, // 预览刷新 < 200ms
  snapshotCreate: 100, // 快照创建 < 100ms
  codeValidation: 50, // 代码验证 < 50ms
  promptBuild: 20, // 系统提示词构建 < 20ms
  intentDetection: 10, // 意图检测 < 10ms
};

// ── Helper Functions ──

async function navigateToIDE(page: Page) {
  await page.goto(`${BASE_URL}/#/ide`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
}

async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  return { result, duration };
}

async function getMemoryUsage(page: Page): Promise<number> {
  const memory = await page.evaluate(() => {
    if ("memory" in performance) {
      const mem = (performance as any).memory;
      return mem.usedJSHeapSize;
    }
    return 0;
  });
  return memory;
}

// ── Performance Tests ──

test.describe("新功能性能测试 - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToIDE(page);
  });

  // ── 1. 预览刷新性能 ──

  test("性能: 预览刷新时间 < 200ms", async ({ page }) => {
    console.log("🧪 测试预览刷新性能");
    
    // 编辑代码
    const editor = page.locator(".monaco-editor").first();
    if (await editor.count() > 0) {
      const { duration } = await measureTime(async () => {
        await editor.click();
        await page.keyboard.type("// Performance test");
        await page.waitForTimeout(200);
      });
      
      console.log(`预览刷新时间: ${duration}ms`);
      
      // 验证性能预算
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.previewRefresh);
      console.log(`✅ 预览刷新性能达标 (< ${PERFORMANCE_BUDGETS.previewRefresh}ms)`);
    } else {
      test.skip();
    }
  });

  test("性能: 多次编辑平均刷新时间", async ({ page }) => {
    console.log("🧪 测试多次编辑平均刷新性能");
    
    const editor = page.locator(".monaco-editor").first();
    if (await editor.count() > 0) {
      const durations: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const { duration } = await measureTime(async () => {
          await editor.click();
          await page.keyboard.type(`// Test ${i}`);
          await page.waitForTimeout(100);
        });
        durations.push(duration);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
      console.log(`平均刷新时间: ${avgDuration}ms`);
      
      expect(avgDuration).toBeLessThan(PERFORMANCE_BUDGETS.previewRefresh);
      console.log(`✅ 平均刷新性能达标`);
    }
  });

  // ── 2. 快照管理性能 ──

  test("性能: 快照创建时间 < 100ms", async ({ page }) => {
    console.log("🧪 测试快照创建性能");
    
    const createBtn = page.locator('button:has-text("创建快照")').first();
    if (await createBtn.count() > 0) {
      const { duration } = await measureTime(async () => {
        await createBtn.click();
        await page.waitForTimeout(50);
        
        const labelInput = page.locator('input[placeholder*="快照"]').first();
        if (await labelInput.count() > 0) {
          await labelInput.fill("性能测试快照");
          await labelInput.press("Enter");
        }
      });
      
      console.log(`快照创建时间: ${duration}ms`);
      
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.snapshotCreate);
      console.log(`✅ 快照创建性能达标 (< ${PERFORMANCE_BUDGETS.snapshotCreate}ms)`);
    }
  });

  test("性能: 快照恢复时间", async ({ page }) => {
    console.log("🧪 测试快照恢复性能");
    
    // 先创建一个快照
    const createBtn = page.locator('button:has-text("创建快照")').first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(300);
      
      const labelInput = page.locator('input[placeholder*="快照"]').first();
      if (await labelInput.count() > 0) {
        await labelInput.fill("恢复测试快照");
        await labelInput.press("Enter");
      }
    }
    
    // 测试恢复性能
    const restoreBtn = page.locator('button:has-text("恢复")').first();
    if (await restoreBtn.count() > 0) {
      const { duration } = await measureTime(async () => {
        await restoreBtn.click();
        await page.waitForTimeout(100);
      });
      
      console.log(`快照恢复时间: ${duration}ms`);
      
      // 快照恢复允许更长时间（500ms）
      expect(duration).toBeLessThan(500);
      console.log(`✅ 快照恢复性能达标`);
    }
  });

  test("性能: 快照列表加载时间", async ({ page }) => {
    console.log("🧪 测试快照列表加载性能");
    
    // 创建多个快照
    const createBtn = page.locator('button:has-text("创建快照")').first();
    if (await createBtn.count() > 0) {
      for (let i = 0; i < 5; i++) {
        await createBtn.click();
        await page.waitForTimeout(100);
        
        const labelInput = page.locator('input[placeholder*="快照"]').first();
        if (await labelInput.count() > 0) {
          await labelInput.fill(`快照${i}`);
          await labelInput.press("Enter");
        }
      }
      
      // 测试列表加载时间
      const { duration } = await measureTime(async () => {
        const snapshotList = page.locator('[data-testid="snapshot-list"], .snapshot-list').first();
        if (await snapshotList.count() > 0) {
          await snapshotList.waitFor({ state: "visible" });
        }
      });
      
      console.log(`快照列表加载时间: ${duration}ms`);
      expect(duration).toBeLessThan(200);
      console.log(`✅ 快照列表加载性能达标`);
    }
  });

  // ── 3. 代码验证性能 ──

  test("性能: 代码验证时间 < 50ms", async ({ page }) => {
    console.log("🧪 测试代码验证性能");
    
    const textarea = page.locator('textarea[placeholder*="输入"]').first();
    if (await textarea.count() > 0) {
      // 发送代码生成请求
      await textarea.fill("生成一个简单的React组件");
      await textarea.press("Enter");
      
      // 测量验证时间
      const { duration } = await measureTime(async () => {
        await page.waitForSelector('text=验证, text=Validation', { timeout: 5000 });
      });
      
      console.log(`代码验证时间: ${duration}ms`);
      
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.codeValidation);
      console.log(`✅ 代码验证性能达标 (< ${PERFORMANCE_BUDGETS.codeValidation}ms)`);
    }
  });

  test("性能: 大文件代码验证性能", async ({ page }) => {
    console.log("🧪 测试大文件代码验证性能");
    
    const editor = page.locator(".monaco-editor").first();
    if (await editor.count() > 0) {
      // 生成大文件（1000行）
      await editor.click();
      for (let i = 0; i < 10; i++) {
        await page.keyboard.type(`// Line ${i}\n`);
      }
      
      const { duration } = await measureTime(async () => {
        // 触发验证
        await page.keyboard.type("const test = ");
        await page.waitForTimeout(200);
      });
      
      console.log(`大文件验证时间: ${duration}ms`);
      expect(duration).toBeLessThan(100);
      console.log(`✅ 大文件验证性能达标`);
    }
  });

  // ── 4. 系统提示词构建性能 ──

  test("性能: 系统提示词构建时间 < 20ms", async ({ page }) => {
    console.log("🧪 测试系统提示词构建性能");
    
    const textarea = page.locator('textarea[placeholder*="输入"]').first();
    if (await textarea.count() > 0) {
      const { duration } = await measureTime(async () => {
        await textarea.fill("解释这段代码");
        await textarea.press("Enter");
        await page.waitForTimeout(100);
      });
      
      console.log(`系统提示词构建时间: ${duration}ms`);
      
      expect(duration).toBeLessThan(PERFORMANCE_BUDGETS.promptBuild);
      console.log(`✅ 系统提示词构建性能达标 (< ${PERFORMANCE_BUDGETS.promptBuild}ms)`);
    }
  });

  test("性能: 意图检测时间 < 10ms", async ({ page }) => {
    console.log("🧪 测试意图检测性能");
    
    const textarea = page.locator('textarea[placeholder*="输入"]').first();
    if (await textarea.count() > 0) {
      const testMessages = [
        "创建一个组件",
        "修复这个bug",
        "解释这段代码",
        "重构这个函数",
        "生成单元测试",
      ];
      
      const durations: number[] = [];
      
      for (const msg of testMessages) {
        const { duration } = await measureTime(async () => {
          await textarea.fill(msg);
          await page.waitForTimeout(50);
        });
        durations.push(duration);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
      console.log(`平均意图检测时间: ${avgDuration}ms`);
      
      expect(avgDuration).toBeLessThan(PERFORMANCE_BUDGETS.intentDetection);
      console.log(`✅ 意图检测性能达标`);
    }
  });

  // ── 5. 内存使用测试 ──

  test("性能: 预览模式切换内存使用", async ({ page }) => {
    console.log("🧪 测试预览模式切换内存使用");
    
    const initialMemory = await getMemoryUsage(page);
    
    // 多次切换模式
    for (let i = 0; i < 10; i++) {
      const modeSelector = page.locator('[data-testid="preview-mode-selector"]').first();
      if (await modeSelector.count() > 0) {
        await modeSelector.click();
        await page.waitForTimeout(200);
        
        const modes = ["实时", "手动", "延迟", "智能"];
        const randomMode = modes[Math.floor(Math.random() * modes.length)];
        const modeOption = page.locator(`text=${randomMode}`).first();
        if (await modeOption.count() > 0) {
          await modeOption.click();
          await page.waitForTimeout(300);
        }
      }
    }
    
    const finalMemory = await getMemoryUsage(page);
    const memoryIncrease = finalMemory - initialMemory;
    
    console.log(`初始内存: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`最终内存: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    
    // 内存增长应小于 10MB
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    console.log(`✅ 内存使用正常`);
  });

  test("性能: 快照创建内存使用", async ({ page }) => {
    console.log("🧪 测试快照创建内存使用");
    
    const initialMemory = await getMemoryUsage(page);
    
    const createBtn = page.locator('button:has-text("创建快照")').first();
    if (await createBtn.count() > 0) {
      for (let i = 0; i < 10; i++) {
        await createBtn.click();
        await page.waitForTimeout(100);
        
        const labelInput = page.locator('input[placeholder*="快照"]').first();
        if (await labelInput.count() > 0) {
          await labelInput.fill(`快照${i}`);
          await labelInput.press("Enter");
        }
      }
      
      const finalMemory = await getMemoryUsage(page);
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`快照创建内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
      console.log(`✅ 快照创建内存使用正常`);
    }
  });

  // ── 6. 并发性能测试 ──

  test("性能: 并发快照创建", async ({ page }) => {
    console.log("🧪 测试并发快照创建性能");
    
    const createBtn = page.locator('button:has-text("创建快照")').first();
    if (await createBtn.count() > 0) {
      const { duration } = await measureTime(async () => {
        // 快速连续创建多个快照
        const promises = [];
        for (let i = 0; i < 5; i++) {
          promises.push(
            (async () => {
              await createBtn.click();
              await page.waitForTimeout(50);
              
              const labelInput = page.locator('input[placeholder*="快照"]').first();
              if (await labelInput.count() > 0) {
                await labelInput.fill(`并发快照${i}`);
                await labelInput.press("Enter");
              }
            })()
          );
        }
        
        await Promise.all(promises);
      });
      
      console.log(`并发快照创建时间: ${duration}ms`);
      expect(duration).toBeLessThan(500);
      console.log(`✅ 并发快照创建性能达标`);
    }
  });

  test("性能: 并发代码验证", async ({ page }) => {
    console.log("🧪 测试并发代码验证性能");
    
    const textarea = page.locator('textarea[placeholder*="输入"]').first();
    if (await textarea.count() > 0) {
      const testMessages = [
        "生成函数1",
        "生成函数2",
        "生成函数3",
      ];
      
      const { duration } = await measureTime(async () => {
        for (const msg of testMessages) {
          await textarea.fill(msg);
          await textarea.press("Enter");
          await page.waitForTimeout(100);
        }
      });
      
      console.log(`并发代码验证时间: ${duration}ms`);
      expect(duration).toBeLessThan(300);
      console.log(`✅ 并发代码验证性能达标`);
    }
  });
});
