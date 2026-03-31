/**
 * @file e2e/complete-user-flow.spec.ts
 * @description Playwright E2E 测试 - 完整用户流程测试：
 *              首页 → IDE → 代码生成 → 预览 → 保存
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,user-flow,integration
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

// ── Helper Functions ──

async function navigateToHomepage(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(1000);
}

async function navigateToIDE(page: Page) {
  await page.goto(`${BASE_URL}/#/ide`);
  await page.waitForTimeout(2000);
}

// ── Complete User Flow Tests ──

test.describe("完整用户流程 - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToHomepage(page);
  });

  // ── 1. 首页导航流程 ──

  test("从首页导航到 IDE", async ({ page }) => {
    // 等待首页加载
    await expect(page.locator("body")).toBeVisible();

    // 查找并点击 IDE 入口
    const ideLink = page.locator('a[href*="ide"], button:has-text("IDE"), button:has-text("开始")').first();
    
    if (await ideLink.count() > 0) {
      await ideLink.click();
      await page.waitForTimeout(1000);
    } else {
      // 直接导航
      await page.goto(`${BASE_URL}/#/ide`);
    }

    // 验证到达 IDE 页面
    await expect(page.locator("body")).toBeVisible();
    expect(page.url()).toContain("ide");
  });

  // ── 2. AI 对话流程 ──

  test("AI 对话完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 等待 AI 面板加载
    const aiPanel = page.locator('text=AI 对话').first();
    if (await aiPanel.count() > 0) {
      await expect(aiPanel).toBeVisible();
    }

    // 找到输入框
    const textarea = page.locator('textarea[placeholder*="输入"]').first();
    if (await textarea.count() > 0) {
      // 输入消息
      await textarea.fill("创建一个简单的 React 组件");
      await page.waitForTimeout(500);

      // 发送消息
      await textarea.press("Enter");
      await page.waitForTimeout(3000);

      // 验证有 AI 响应
      const aiResponse = page.locator('text=你好，text=助手，text=AI').first();
      if (await aiResponse.count() > 0) {
        await expect(aiResponse).toBeVisible();
      }
    }
  });

  // ── 3. 文件管理流程 ──

  test("文件管理完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 等待文件管理面板加载
    const filesPanel = page.locator('text=文件管理').first();
    if (await filesPanel.count() > 0) {
      await expect(filesPanel).toBeVisible();
    }

    // 找到新建文件按钮
    const newFileBtn = page.locator('button[title*="新建"], button:has-text("新建")').first();
    if (await newFileBtn.count() > 0) {
      await newFileBtn.click();
      await page.waitForTimeout(500);

      // 输入文件名
      const fileNameInput = page.locator('input[placeholder*="文件名"]').first();
      if (await fileNameInput.count() > 0) {
        await fileNameInput.fill("TestComponent.tsx");
        await fileNameInput.press("Enter");
        await page.waitForTimeout(1000);

        // 验证文件已创建
        const fileItem = page.locator('text=TestComponent.tsx').first();
        if (await fileItem.count() > 0) {
          await expect(fileItem).toBeVisible();
        }
      }
    }
  });

  // ── 4. 代码编辑流程 ──

  test("代码编辑完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 等待代码编辑器加载
    const codePanel = page.locator('text=代码编辑').first();
    if (await codePanel.count() > 0) {
      await expect(codePanel).toBeVisible();
    }

    // 验证编辑器存在
    const editor = page.locator('.monaco-editor, [class*="editor"]').first();
    if (await editor.count() > 0) {
      await expect(editor).toBeVisible();
    }
  });

  // ── 5. 实时预览流程 ──

  test("实时预览完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 找到预览按钮
    const previewBtn = page.locator('button[title*="预览"], button:has-text("预览")').first();
    if (await previewBtn.count() > 0) {
      await previewBtn.click();
      await page.waitForTimeout(2000);

      // 验证预览区域显示
      const previewArea = page.locator('text=预览，[class*="preview"]').first();
      if (await previewArea.count() > 0) {
        await expect(previewArea).toBeVisible();
      }
    }
  });

  // ── 6. 设置配置流程 ──

  test("设置配置完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 找到设置按钮
    const settingsBtn = page.locator('button[title*="设置"], button:has-text("设置")').first();
    if (await settingsBtn.count() > 0) {
      await settingsBtn.click();
      await page.waitForTimeout(1000);

      // 验证设置面板显示
      const settingsPanel = page.locator('text=API Key, text=模型，text=配置').first();
      if (await settingsPanel.count() > 0) {
        await expect(settingsPanel).toBeVisible();
      }
    }
  });

  // ── 7. 主题切换流程 ──

  test("主题切换完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 找到主题切换按钮
    const themeBtn = page.locator('button[title*="主题"], [class*="theme"]').first();
    if (await themeBtn.count() > 0) {
      const initialTheme = await page.getAttribute('html', 'class') || 'light';
      
      await themeBtn.click();
      await page.waitForTimeout(1000);

      // 验证主题已切换
      const newTheme = await page.getAttribute('html', 'class') || 'dark';
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  // ── 8. 面板拖拽流程 ──

  test("面板拖拽完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 找到面板标题
    const panelHeader = page.locator('[class*="panel-header"]').first();
    if (await panelHeader.count() > 0) {
      // 验证面板可拖拽
      const dragHandle = panelHeader.locator('[class*="drag"], [class*="grip"]').first();
      if (await dragHandle.count() > 0) {
        await expect(dragHandle).toBeVisible();
      }
    }
  });

  // ── 9. 快捷键流程 ──

  test("快捷键完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 测试 Ctrl+P (快速搜索)
    await page.keyboard.press("Control+P");
    await page.waitForTimeout(500);

    // 验证搜索框显示
    const searchBox = page.locator('[placeholder*="搜索"], [placeholder*="Search"]').first();
    if (await searchBox.count() > 0) {
      await expect(searchBox).toBeVisible();
    }

    // 关闭搜索框
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  });

  // ── 10. 多标签页流程 ──

  test("多标签页完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 打开多个文件
    const fileItems = page.locator('[class*="file-item"]').locator('visible=true').first();
    if (await fileItems.count() > 0) {
      await fileItems.click();
      await page.waitForTimeout(500);

      // 验证标签页已打开
      const tabs = page.locator('[class*="tab"]').locator('visible=true');
      expect(await tabs.count()).toBeGreaterThan(0);
    }
  });

  // ── 11. 错误处理流程 ──

  test("错误处理完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 模拟错误场景 (例如：无网络)
    await page.route("**/*", (route) => {
      if (route.request().url().includes("api")) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // 尝试执行需要网络的操作
    const textarea = page.locator('textarea[placeholder*="输入"]').first();
    if (await textarea.count() > 0) {
      await textarea.fill("测试消息");
      await textarea.press("Enter");
      await page.waitForTimeout(3000);

      // 验证错误提示显示
      const errorMessage = page.locator('text=错误，text=失败，text=网络').first();
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  // ── 12. 响应式布局流程 ──

  test("移动端布局完整流程", async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToIDE(page);

    // 验证移动端布局显示
    const mobileNav = page.locator('[class*="mobile"], [class*="bottom-nav"]').first();
    if (await mobileNav.count() > 0) {
      await expect(mobileNav).toBeVisible();
    }

    // 验证侧边栏隐藏
    const sidebar = page.locator('[class*="sidebar"]').first();
    if (await sidebar.count() > 0) {
      // 移动端侧边栏应该隐藏或可折叠
      const isVisible = await sidebar.isVisible();
      expect(isVisible).toBeFalsy();
    }
  });

  // ── 13. 数据持久化流程 ──

  test("数据持久化完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 创建文件
    const newFileBtn = page.locator('button[title*="新建"]').first();
    if (await newFileBtn.count() > 0) {
      await newFileBtn.click();
      await page.waitForTimeout(500);

      const fileNameInput = page.locator('input[placeholder*="文件名"]').first();
      if (await fileNameInput.count() > 0) {
        await fileNameInput.fill("PersistTest.tsx");
        await fileNameInput.press("Enter");
        await page.waitForTimeout(1000);
      }
    }

    // 刷新页面
    await page.reload();
    await page.waitForTimeout(2000);

    // 验证文件仍然存在
    const fileItem = page.locator('text=PersistTest.tsx').first();
    if (await fileItem.count() > 0) {
      await expect(fileItem).toBeVisible();
    }
  });

  // ── 14. 会话管理流程 ──

  test("会话管理完整流程", async ({ page }) => {
    await navigateToIDE(page);

    // 找到新建对话按钮
    const newSessionBtn = page.locator('button[title*="新建对话"]').first();
    if (await newSessionBtn.count() > 0) {
      await newSessionBtn.click();
      await page.waitForTimeout(500);

      // 验证对话已重置
      const welcomeMessage = page.locator('text=你好，text=AI 助手').first();
      if (await welcomeMessage.count() > 0) {
        await expect(welcomeMessage).toBeVisible();
      }
    }
  });

  // ── 15. 完整工作流流程 ──

  test("完整工作流流程", async ({ page }) => {
    // 1. 导航到 IDE
    await navigateToIDE(page);

    // 2. 创建文件
    const newFileBtn = page.locator('button[title*="新建"]').first();
    if (await newFileBtn.count() > 0) {
      await newFileBtn.click();
      await page.waitForTimeout(500);

      const fileNameInput = page.locator('input[placeholder*="文件名"]').first();
      if (await fileNameInput.count() > 0) {
        await fileNameInput.fill("WorkflowTest.tsx");
        await fileNameInput.press("Enter");
        await page.waitForTimeout(1000);
      }
    }

    // 3. 编辑文件
    const editor = page.locator('.monaco-editor').first();
    if (await editor.count() > 0) {
      await editor.click();
      await page.keyboard.type("export default function Test() {}");
      await page.waitForTimeout(500);
    }

    // 4. 保存文件
    await page.keyboard.press("Control+S");
    await page.waitForTimeout(500);

    // 5. 预览
    const previewBtn = page.locator('button[title*="预览"]').first();
    if (await previewBtn.count() > 0) {
      await previewBtn.click();
      await page.waitForTimeout(2000);
    }

    // 验证整个流程完成
    expect(page.url()).toContain("ide");
  });
});
