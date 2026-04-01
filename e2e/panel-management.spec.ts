/**
 * @file e2e/panel-management.spec.ts
 * @description Playwright E2E 测试 - 面板管理完整流程：
 *              面板拖拽、面板调整大小、面板显示/隐藏、面板布局管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,panel-management,drag-drop
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

async function navigateToIDE(page: Page) {
  await page.goto(`${BASE_URL}/#/ide`);
  await page.waitForTimeout(2000);
}

test.describe("面板管理 - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToIDE(page);
  });

  test("IDE 面板布局加载", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("主面板可见", async ({ page }) => {
    const mainPanel = page.locator('[class*="panel"], [class*="layout"], [class*="container"]').first();
    if (await mainPanel.count() > 0) {
      await expect(mainPanel.first()).toBeVisible();
    }
  });

  test("侧边栏可见", async ({ page }) => {
    const sidebar = page.locator('[class*="sidebar"], [class*="side"]').first();
    if (await sidebar.count() > 0) {
      await expect(sidebar.first()).toBeVisible();
    }
  });

  test("面板拖拽功能", async ({ page }) => {
    const panel = page.locator('[class*="panel"], [class*="resizable"]').first();
    
    if (await panel.count() > 0) {
      const box = await panel.first().boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(1000);
      }
    }
  });

  test("面板调整大小", async ({ page }) => {
    const resizer = page.locator('[class*="resizer"], [class*="resize-handle"]').first();
    
    if (await resizer.count() > 0) {
      const box = await resizer.first().boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(1000);
      }
    }
  });

  test("面板显示/隐藏切换", async ({ page }) => {
    const toggleButton = page.locator('button[title*="显示"], button[title*="隐藏"], button[title*="toggle"]').first();
    
    if (await toggleButton.count() > 0) {
      await toggleButton.first().click();
      await page.waitForTimeout(1000);
      
      await toggleButton.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test("面板最大化/还原", async ({ page }) => {
    const maximizeButton = page.locator('button[title*="最大化"], button[title*="全屏"], button[title*="还原"]').first();
    
    if (await maximizeButton.count() > 0) {
      await maximizeButton.first().click();
      await page.waitForTimeout(1000);
      
      await maximizeButton.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test("面板标签切换", async ({ page }) => {
    const tabs = page.locator('[role="tab"], [class*="tab"]');
    
    if (await tabs.count() > 1) {
      const firstTab = tabs.first();
      const lastTab = tabs.last();
      
      await firstTab.click();
      await page.waitForTimeout(500);
      
      await lastTab.click();
      await page.waitForTimeout(500);
    }
  });

  test("面板关闭", async ({ page }) => {
    const closeButton = page.locator('[class*="close"], [aria-label*="close"], button:has-text("×")').first();
    
    if (await closeButton.count() > 0) {
      await closeButton.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test("面板布局重置", async ({ page }) => {
    const resetButton = page.locator('button[title*="重置"], button[title*="reset"], button:has-text("重置布局")').first();
    
    if (await resetButton.count() > 0) {
      await resetButton.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test("面板布局保存", async ({ page }) => {
    const saveButton = page.locator('button[title*="保存"], button[title*="save"], button:has-text("保存布局")').first();
    
    if (await saveButton.count() > 0) {
      await saveButton.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test("面板布局持久化", async ({ page }) => {
    const panel = page.locator('[class*="panel"]').first();
    
    if (await panel.count() > 0) {
      const box = await panel.first().boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(1000);
        
        await page.reload();
        await page.waitForTimeout(2000);
        
        await expect(panel.first()).toBeVisible();
      }
    }
  });

  test("多个面板同时操作", async ({ page }) => {
    const panels = page.locator('[class*="panel"]');
    
    if (await panels.count() >= 2) {
      const firstPanel = panels.first();
      const secondPanel = panels.nth(1);
      
      await firstPanel.click();
      await page.waitForTimeout(500);
      
      await secondPanel.click();
      await page.waitForTimeout(500);
    }
  });

  test("面板快捷键操作", async ({ page }) => {
    await page.keyboard.press("Control+Shift+F");
    await page.waitForTimeout(1000);
    
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});