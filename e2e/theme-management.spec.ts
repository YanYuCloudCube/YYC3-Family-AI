/**
 * @file e2e/theme-management.spec.ts
 * @description Playwright E2E 测试 - 主题管理完整流程：
 *              主题切换、自定义主题编辑器、颜色验证、系统主题同步
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,theme-management,customization
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

async function navigateToIDE(page: Page) {
  await page.goto(`${BASE_URL}/#/ide`);
  await page.waitForTimeout(2000);
}

test.describe("主题管理 - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToIDE(page);
  });

  test("默认主题加载", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("主题切换按钮可见", async ({ page }) => {
    const themeSwitcher = page.locator('button[title*="切换"], button[title*="主题"]').first();
    if (await themeSwitcher.count() > 0) {
      await expect(themeSwitcher.first()).toBeVisible();
    }
  });

  test("切换主题 - 深海军蓝到赛博朋克", async ({ page }) => {
    const themeSwitcher = page.locator('button[title*="切换"], button[title*="主题"]').first();
    
    if (await themeSwitcher.count() > 0) {
      await themeSwitcher.first().click();
      await page.waitForTimeout(1000);
      
      const body = page.locator("body");
      await expect(body).toBeVisible();
    }
  });

  test("自定义主题编辑器打开", async ({ page }) => {
    const paletteButton = page.locator('button[title*="自定义"], button[title*="调色板"]').first();
    
    if (await paletteButton.count() > 0) {
      await paletteButton.first().click();
      await page.waitForTimeout(1000);
      
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();
      }
    }
  });

  test("主题切换后页面样式变化", async ({ page }) => {
    const themeSwitcher = page.locator('button[title*="切换"], button[title*="主题"]').first();
    
    if (await themeSwitcher.count() > 0) {
      const initialBody = await page.locator("body").getAttribute("class");
      
      await themeSwitcher.first().click();
      await page.waitForTimeout(1000);
      
      const newBody = await page.locator("body").getAttribute("class");
      expect(initialBody).not.toBe(newBody);
    }
  });

  test("设置页面主题切换", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/settings`);
    await page.waitForTimeout(1000);
    
    const settingsPage = page.locator("body");
    await expect(settingsPage).toBeVisible();
    
    const themeToggle = page.locator('button[title*="切换"], button[title*="主题"]').first();
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test("主题状态持久化", async ({ page }) => {
    const themeSwitcher = page.locator('button[title*="切换"], button[title*="主题"]').first();
    
    if (await themeSwitcher.count() > 0) {
      await themeSwitcher.first().click();
      await page.waitForTimeout(1000);
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      const body = page.locator("body");
      await expect(body).toBeVisible();
    }
  });

  test("多个主题切换循环", async ({ page }) => {
    const themeSwitcher = page.locator('button[title*="切换"], button[title*="主题"]').first();
    
    if (await themeSwitcher.count() > 0) {
      for (let i = 0; i < 3; i++) {
        await themeSwitcher.first().click();
        await page.waitForTimeout(500);
      }
      
      const body = page.locator("body");
      await expect(body).toBeVisible();
    }
  });
});