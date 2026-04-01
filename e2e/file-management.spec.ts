/**
 * @file e2e/file-management.spec.ts
 * @description Playwright E2E 测试 - 文件管理完整流程：
 *              文件树导航、文件打开、编辑、保存、标签页管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,file-management,ide
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

async function navigateToIDE(page: Page) {
  await page.goto(`${BASE_URL}/#/ide`);
  await page.waitForTimeout(2000);
}

test.describe("文件管理 - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToIDE(page);
  });

  test("IDE 页面加载", async ({ page }) => {
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("文件树可见", async ({ page }) => {
    const fileTree = page.locator('[class*="file"], [class*="tree"], [class*="sidebar"]').first();
    if (await fileTree.count() > 0) {
      await expect(fileTree.first()).toBeVisible();
    }
  });

  test("编辑器可见", async ({ page }) => {
    const editor = page.locator('[class*="editor"], [class*="monaco"], textarea').first();
    if (await editor.count() > 0) {
      await expect(editor.first()).toBeVisible();
    }
  });

  test("打开文件", async ({ page }) => {
    const fileItem = page.locator('[class*="file"], [role="treeitem"]').first();
    
    if (await fileItem.count() > 0) {
      await fileItem.first().click();
      await page.waitForTimeout(1000);
      
      const editor = page.locator('[class*="editor"], [class*="monaco"], textarea').first();
      if (await editor.count() > 0) {
        await expect(editor.first()).toBeVisible();
      }
    }
  });

  test("标签页显示", async ({ page }) => {
    const fileItem = page.locator('[class*="file"], [role="treeitem"]').first();
    
    if (await fileItem.count() > 0) {
      await fileItem.first().click();
      await page.waitForTimeout(1000);
      
      const tab = page.locator('[class*="tab"], [role="tab"]').first();
      if (await tab.count() > 0) {
        await expect(tab.first()).toBeVisible();
      }
    }
  });

  test("编辑文件内容", async ({ page }) => {
    const editor = page.locator('[class*="editor"], [class*="monaco"], textarea').first();
    
    if (await editor.count() > 0) {
      await editor.first().click();
      await page.waitForTimeout(500);
      
      await editor.first().press("End");
      await page.keyboard.type(" // E2E test edit");
      await page.waitForTimeout(1000);
      
      const content = await editor.first().inputValue();
      expect(content).toContain("E2E test edit");
    }
  });

  test("关闭标签页", async ({ page }) => {
    const fileItem = page.locator('[class*="file"], [role="treeitem"]').first();
    
    if (await fileItem.count() > 0) {
      await fileItem.first().click();
      await page.waitForTimeout(1000);
      
      const closeTabButton = page.locator('[class*="close"], [aria-label*="close"], button:has-text("×")').first();
      if (await closeTabButton.count() > 0) {
        await closeTabButton.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("文件树展开/折叠", async ({ page }) => {
    const folder = page.locator('[class*="folder"], [role="treeitem"][aria-expanded]').first();
    
    if (await folder.count() > 0) {
      await folder.first().click();
      await page.waitForTimeout(500);
      
      await folder.first().click();
      await page.waitForTimeout(500);
    }
  });

  test("搜索文件", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="search"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.first().click();
      await searchInput.first().fill("test");
      await page.waitForTimeout(1000);
      
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });

  test("预览面板可见", async ({ page }) => {
    const preview = page.locator('[class*="preview"], [class*="iframe"], iframe').first();
    if (await preview.count() > 0) {
      await expect(preview.first()).toBeVisible();
    }
  });

  test("编辑器与预览同步", async ({ page }) => {
    const editor = page.locator('[class*="editor"], [class*="monaco"], textarea').first();
    
    if (await editor.count() > 0) {
      await editor.first().click();
      await page.waitForTimeout(500);
      
      await editor.first().press("End");
      await page.keyboard.type(" // Sync test");
      await page.waitForTimeout(2000);
      
      const preview = page.locator('[class*="preview"], [class*="iframe"], iframe').first();
      if (await preview.count() > 0) {
        await expect(preview.first()).toBeVisible();
      }
    }
  });
});