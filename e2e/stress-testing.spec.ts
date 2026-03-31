/**
 * @file e2e/stress-testing.spec.ts
 * @description Playwright 压力测试 - 大量快照、大文件验证、频繁模式切换
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-31
 * @updated 2026-03-31
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,stress,testing
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

// 压力测试参数
const STRESS_CONFIG = {
  snapshotCount: 50, // 50个快照
  largeFileLines: 10000, // 10000行代码
  modeSwitchCount: 100, // 100次模式切换
  concurrentOperations: 20, // 20个并发操作
};

// ── Helper Functions ──

async function navigateToIDE(page: Page) {
  await page.goto(`${BASE_URL}/#/ide`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
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

async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  return { result, duration };
}

// ── Stress Tests ──

test.describe("压力测试 - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToIDE(page);
  });

  // ── 1. 50个快照管理压力测试 ──

  test("压力: 管理50个快照", async ({ page }) => {
    console.log(`🧪 压力测试: 管理${STRESS_CONFIG.snapshotCount}个快照`);
    
    const initialMemory = await getMemoryUsage(page);
    const createBtn = page.locator('button:has-text("创建快照")').first();
    
    if (await createBtn.count() > 0) {
      console.log(`开始创建${STRESS_CONFIG.snapshotCount}个快照...`);
      const { duration } = await measureTime(async () => {
        for (let i = 0; i < STRESS_CONFIG.snapshotCount; i++) {
          await createBtn.click();
          await page.waitForTimeout(50);
          
          const labelInput = page.locator('input[placeholder*="快照"]').first();
          if (await labelInput.count() > 0) {
            await labelInput.fill(`压力测试快照-${i}`);
            await labelInput.press("Enter");
            await page.waitForTimeout(50);
          }
          
          if (i % 10 === 0) {
            console.log(`已创建 ${i}/${STRESS_CONFIG.snapshotCount} 个快照`);
          }
        }
      });
      
      console.log(`✅ ${STRESS_CONFIG.snapshotCount}个快照创建完成，耗时: ${duration}ms`);
      
      // 检查内存使用
      const finalMemory = await getMemoryUsage(page);
      const memoryIncrease = finalMemory - initialMemory;
      console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // 验证快照列表可正常显示
      const snapshotList = page.locator('[data-testid="snapshot-list"], .snapshot-list').first();
      if (await snapshotList.count() > 0) {
        console.log(`✅ 快照列表显示正常`);
      }
      
      // 内存增长应合理（< 50MB for 50 snapshots）
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      console.log(`✅ 内存使用合理`);
      
      // 平均每个快照创建时间应 < 200ms
      const avgCreationTime = duration / STRESS_CONFIG.snapshotCount;
      expect(avgCreationTime).toBeLessThan(200);
      console.log(`✅ 平均快照创建时间: ${avgCreationTime.toFixed(2)}ms`);
    }
  });

  test("压力: 快速删除大量快照", async ({ page }) => {
    console.log("🧪 压力测试: 快速删除大量快照");
    
    // 先创建快照
    const createBtn = page.locator('button:has-text("创建快照")').first();
    if (await createBtn.count() > 0) {
      for (let i = 0; i < 20; i++) {
        await createBtn.click();
        await page.waitForTimeout(50);
        
        const labelInput = page.locator('input[placeholder*="快照"]').first();
        if (await labelInput.count() > 0) {
          await labelInput.fill(`待删除快照-${i}`);
          await labelInput.press("Enter");
        }
      }
      
      console.log(`已创建20个快照，开始删除...`);
      
      const { duration } = await measureTime(async () => {
        // 批量删除
        const deleteBtns = await page.$$('button:has-text("删除")');
        for (let i = 0; i < Math.min(deleteBtns.length, 10); i++) {
          await deleteBtns[i].click();
          await page.waitForTimeout(100);
        }
      });
      
      console.log(`✅ 批量删除完成，耗时: ${duration}ms`);
      expect(duration).toBeLessThan(5000);
    }
  });

  // ── 2. 10000行代码验证压力测试 ──

  test("压力: 验证10000行代码", async ({ page }) => {
    console.log(`🧪 压力测试: 验证${STRESS_CONFIG.largeFileLines}行代码`);
    
    const editor = page.locator(".monaco-editor").first();
    if (await editor.count() > 0) {
      console.log(`生成${STRESS_CONFIG.largeFileLines}行代码...`);
      
      const { duration } = await measureTime(async () => {
        await editor.click();
        
        // 生成大量代码
        const batchSize = 100;
        const batches = STRESS_CONFIG.largeFileLines / batchSize;
        
        for (let batch = 0; batch < batches; batch++) {
          // 批量插入代码
          const code = Array(batchSize)
            .fill(null)
            .map((_, i) => `// Line ${batch * batchSize + i}: const test${batch * batchSize + i} = ${i};`)
            .join("\n");
          
          await page.keyboard.type(code);
          await page.keyboard.press("Enter");
          
          if (batch % 10 === 0) {
            console.log(`已生成 ${(batch + 1) * batchSize}/${STRESS_CONFIG.largeFileLines} 行代码`);
          }
        }
      });
      
      console.log(`✅ ${STRESS_CONFIG.largeFileLines}行代码生成完成，耗时: ${duration}ms`);
      
      // 检查编辑器是否仍然响应
      const { duration: editDuration } = await measureTime(async () => {
        await editor.click();
        await page.keyboard.type("// Test edit");
        await page.waitForTimeout(100);
      });
      
      console.log(`编辑响应时间: ${editDuration}ms`);
      expect(editDuration).toBeLessThan(500);
      console.log(`✅ 编辑器响应正常`);
      
      // 检查内存使用
      const memory = await getMemoryUsage(page);
      console.log(`内存使用: ${(memory / 1024 / 1024).toFixed(2)} MB`);
      
      // 内存应合理（< 200MB for 10000 lines）
      expect(memory).toBeLessThan(200 * 1024 * 1024);
      console.log(`✅ 内存使用合理`);
    }
  });

  test("压力: 大文件代码验证性能", async ({ page }) => {
    console.log("🧪 压力测试: 大文件代码验证性能");
    
    const editor = page.locator(".monaco-editor").first();
    if (await editor.count() > 0) {
      // 生成5000行代码
      await editor.click();
      for (let i = 0; i < 50; i++) {
        const code = Array(100)
          .fill(null)
          .map((_, j) => `const test${i * 100 + j} = ${j};`)
          .join("\n");
        await page.keyboard.type(code);
        await page.keyboard.press("Enter");
      }
      
      console.log(`已生成5000行代码，开始验证...`);
      
      const { duration } = await measureTime(async () => {
        // 触发验证（输入可能错误的代码）
        await page.keyboard.type("const errorTest = ");
        await page.waitForTimeout(500);
      });
      
      console.log(`大文件验证时间: ${duration}ms`);
      expect(duration).toBeLessThan(1000);
      console.log(`✅ 大文件验证性能达标`);
    }
  });

  // ── 3. 频繁切换模式无内存泄漏 ──

  test("压力: 100次模式切换无内存泄漏", async ({ page }) => {
    console.log(`🧪 压力测试: ${STRESS_CONFIG.modeSwitchCount}次模式切换`);
    
    const initialMemory = await getMemoryUsage(page);
    console.log(`初始内存: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
    
    const modeSelector = page.locator('[data-testid="preview-mode-selector"], select').first();
    if (await modeSelector.count() > 0) {
      const modes = ["实时", "手动", "延迟", "智能"];
      
      const { duration } = await measureTime(async () => {
        for (let i = 0; i < STRESS_CONFIG.modeSwitchCount; i++) {
          const randomMode = modes[i % modes.length];
          
          await modeSelector.click();
          await page.waitForTimeout(30);
          
          const modeOption = page.locator(`text=${randomMode}`).first();
          if (await modeOption.count() > 0) {
            await modeOption.click();
            await page.waitForTimeout(50);
          }
          
          if (i % 10 === 0) {
            const currentMemory = await getMemoryUsage(page);
            console.log(`已切换 ${i}/${STRESS_CONFIG.modeSwitchCount} 次，内存: ${(currentMemory / 1024 / 1024).toFixed(2)} MB`);
          }
        }
      });
      
      console.log(`✅ ${STRESS_CONFIG.modeSwitchCount}次模式切换完成，耗时: ${duration}ms`);
      
      // 检查内存增长
      const finalMemory = await getMemoryUsage(page);
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`最终内存: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // 内存增长应 < 10MB（表示无明显内存泄漏）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      console.log(`✅ 无明显内存泄漏`);
      
      // 平均每次切换时间应 < 50ms
      const avgSwitchTime = duration / STRESS_CONFIG.modeSwitchCount;
      expect(avgSwitchTime).toBeLessThan(50);
      console.log(`✅ 平均切换时间: ${avgSwitchTime.toFixed(2)}ms`);
    }
  });

  test("压力: 频繁编辑和预览切换", async ({ page }) => {
    console.log("🧪 压力测试: 频繁编辑和预览切换");
    
    const initialMemory = await getMemoryUsage(page);
    
    const editor = page.locator(".monaco-editor").first();
    const modeSelector = page.locator('[data-testid="preview-mode-selector"], select').first();
    
    if (await editor.count() > 0 && (await modeSelector.count()) > 0) {
      const modes = ["实时", "手动", "延迟"];
      
      const { duration } = await measureTime(async () => {
        for (let i = 0; i < 50; i++) {
          // 编辑代码
          await editor.click();
          await page.keyboard.type(`// Edit ${i}\n`);
          await page.waitForTimeout(50);
          
          // 切换模式
          const mode = modes[i % modes.length];
          await modeSelector.click();
          await page.waitForTimeout(30);
          
          const modeOption = page.locator(`text=${mode}`).first();
          if (await modeOption.count() > 0) {
            await modeOption.click();
            await page.waitForTimeout(50);
          }
        }
      });
      
      console.log(`✅ 频繁编辑和切换完成，耗时: ${duration}ms`);
      
      const finalMemory = await getMemoryUsage(page);
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
      console.log(`✅ 内存使用合理`);
    }
  });

  // ── 4. 并发操作压力测试 ──

  test("压力: 并发快照创建和删除", async ({ page }) => {
    console.log(`🧪 压力测试: 并发快照操作`);
    
    const initialMemory = await getMemoryUsage(page);
    const createBtn = page.locator('button:has-text("创建快照")').first();
    
    if (await createBtn.count() > 0) {
      const { duration } = await measureTime(async () => {
        // 并发创建和删除
        const operations = [];
        
        for (let i = 0; i < 10; i++) {
          operations.push(
            (async () => {
              // 创建快照
              await createBtn.click();
              await page.waitForTimeout(50);
              
              const labelInput = page.locator('input[placeholder*="快照"]').first();
              if (await labelInput.count() > 0) {
                await labelInput.fill(`并发快照-${i}`);
                await labelInput.press("Enter");
              }
              
              // 尝试删除
              await page.waitForTimeout(100);
              const deleteBtn = page.locator('button:has-text("删除")').first();
              if (await deleteBtn.count() > 0) {
                await deleteBtn.click();
              }
            })()
          );
        }
        
        await Promise.all(operations);
      });
      
      console.log(`✅ 并发操作完成，耗时: ${duration}ms`);
      
      const finalMemory = await getMemoryUsage(page);
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      expect(memoryIncrease).toBeLessThan(15 * 1024 * 1024);
      console.log(`✅ 并发操作内存使用合理`);
    }
  });

  test("压力: 并发编辑和AI请求", async ({ page }) => {
    console.log("🧪 压力测试: 并发编辑和AI请求");
    
    const initialMemory = await getMemoryUsage(page);
    const editor = page.locator(".monaco-editor").first();
    const textarea = page.locator('textarea[placeholder*="输入"]').first();
    
    if (await editor.count() > 0 && (await textarea.count()) > 0) {
      const { duration } = await measureTime(async () => {
        const operations = [];
        
        for (let i = 0; i < 5; i++) {
          operations.push(
            (async () => {
              // 编辑代码
              await editor.click();
              await page.keyboard.type(`// Concurrent edit ${i}\n`);
              await page.waitForTimeout(50);
              
              // 发送AI请求
              await textarea.fill(`测试消息${i}`);
              await textarea.press("Enter");
              await page.waitForTimeout(100);
            })()
          );
        }
        
        await Promise.all(operations);
      });
      
      console.log(`✅ 并发编辑和AI请求完成，耗时: ${duration}ms`);
      
      const finalMemory = await getMemoryUsage(page);
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
      console.log(`✅ 并发操作内存使用合理`);
    }
  });

  // ── 5. 长时间运行稳定性测试 ──

  test("压力: 长时间运行稳定性", async ({ page }) => {
    console.log("🧪 压力测试: 长时间运行稳定性");
    
    const initialMemory = await getMemoryUsage(page);
    const startTime = Date.now();
    
    const editor = page.locator(".monaco-editor").first();
    const createBtn = page.locator('button:has-text("创建快照")').first();
    const modeSelector = page.locator('[data-testid="preview-mode-selector"], select').first();
    
    const duration = 60000; // 运行60秒
    const iterationInterval = 1000; // 每秒一次操作
    
    let iterations = 0;
    
    while (Date.now() - startTime < duration) {
      // 随机选择操作
      const operation = Math.floor(Math.random() * 3);
      
      try {
        switch (operation) {
          case 0: // 编辑
            if (await editor.count() > 0) {
              await editor.click();
              await page.keyboard.type(`// Iteration ${iterations}\n`);
            }
            break;
            
          case 1: // 创建快照
            if (await createBtn.count() > 0) {
              await createBtn.click();
              await page.waitForTimeout(50);
              
              const labelInput = page.locator('input[placeholder*="快照"]').first();
              if (await labelInput.count() > 0) {
                await labelInput.fill(`长时间快照-${iterations}`);
                await labelInput.press("Enter");
              }
            }
            break;
            
          case 2: // 切换模式
            if (await modeSelector.count() > 0) {
              await modeSelector.click();
              await page.waitForTimeout(30);
            }
            break;
        }
        
        iterations++;
        
        if (iterations % 10 === 0) {
          const currentMemory = await getMemoryUsage(page);
          const elapsed = (Date.now() - startTime) / 1000;
          console.log(
            `运行 ${elapsed.toFixed(0)}s, 迭代 ${iterations}, 内存: ${(currentMemory / 1024 / 1024).toFixed(2)} MB`
          );
        }
        
        await page.waitForTimeout(iterationInterval);
      } catch (error) {
        console.log(`操作错误，继续运行: ${error}`);
      }
    }
    
    const finalMemory = await getMemoryUsage(page);
    const memoryIncrease = finalMemory - initialMemory;
    
    console.log(`✅ 长时间运行完成，迭代次数: ${iterations}`);
    console.log(`最终内存: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`内存增长: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    
    // 内存增长应 < 100MB（长时间运行允许更多增长）
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    console.log(`✅ 长时间运行稳定`);
  });
});
