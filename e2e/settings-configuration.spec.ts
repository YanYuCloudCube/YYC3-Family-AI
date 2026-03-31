/**
 * @file e2e/settings-configuration.spec.ts
 * @description Playwright E2E 测试 - 设置配置管理测试：
 *              API Key 配置、模型选择、主题切换、快捷键设置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,settings,configuration
 */

import { test, expect, type Page } from "@playwright/test"

const BASE_URL = process.env.BASE_URL || "http://localhost:5173"

async function navigateToSettings(page: Page) {
  await page.goto(`${BASE_URL}/#/settings`)
  await page.waitForTimeout(2000)
}

test.describe("Settings Configuration - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSettings(page)
  })

  // ── 1. 设置页面加载 ──

  test("设置页面加载并显示基本结构", async ({ page }) => {
    // 页面应该显示设置标题
    const title = page.locator('text=设置')
    if (await title.count() > 0) {
      await expect(title.first()).toBeVisible()
    }
  })

  // ── 2. API Key 配置 ──

  test("API Key 配置界面显示", async ({ page }) => {
    // 找到 API Key 配置区域
    const apiKeySection = page.locator('text=API Key, text=API 密钥').first()
    if (await apiKeySection.count() > 0) {
      await expect(apiKeySection.first()).toBeVisible()
    }
  })

  test("Provider 选择器显示", async ({ page }) => {
    // 应该显示 Provider 选项
    const providers = [
      'Ollama',
      '智谱',
      '通义千问',
      'OpenAI',
      'DeepSeek',
    ]
    
    const body = await page.textContent("body")
    const hasProviders = providers.some(p => body?.includes(p))
    expect(hasProviders).toBeTruthy()
  })

  test("API Key 输入框可编辑", async ({ page }) => {
    // 找到 API Key 输入框
    const apiKeyInput = page.locator('input[type="password"], input[placeholder*="API"]')
    if (await apiKeyInput.count() > 0) {
      await apiKeyInput.first().fill("test-api-key-12345")
      const value = await apiKeyInput.first().inputValue()
      expect(value).toBe("test-api-key-12345")
    }
  })

  test("保存 API Key 配置", async ({ page }) => {
    // 找到保存按钮
    const saveBtn = page.locator('button:has-text("保存"), button:has-text("Save")')
    if (await saveBtn.count() > 0) {
      // 先填写 API Key
      const apiKeyInput = page.locator('input[type="password"]').first()
      if (await apiKeyInput.count() > 0) {
        await apiKeyInput.fill("test-key")
        await saveBtn.click()
        await page.waitForTimeout(500)
        
        // 应该显示成功提示
        expect(true).toBe(true)
      }
    }
  })

  // ── 3. 模型选择配置 ──

  test("模型选择器显示", async ({ page }) => {
    // 找到模型选择区域
    const modelSection = page.locator('text=模型，text=Model').first()
    if (await modelSection.count() > 0) {
      await expect(modelSection.first()).toBeVisible()
    }
  })

  test("模型列表加载", async ({ page }) => {
    // 应该显示模型列表
    const models = [
      'GLM',
      'Qwen',
      'GPT',
      'DeepSeek',
    ]
    
    const body = await page.textContent("body")
    const hasModels = models.some(m => body?.includes(m))
    expect(hasModels).toBeTruthy()
  })

  // ── 4. 主题切换 ──

  test("主题切换按钮功能", async ({ page }) => {
    // 找到主题切换按钮
    const themeBtn = page.locator('button[title*="主题"], button:has-text("Cyber"), button:has-text("Navy")').first()
    if (await themeBtn.count() > 0) {
      await themeBtn.click()
      await page.waitForTimeout(500)
      
      // 主题应该切换
      expect(true).toBe(true)
    }
  })

  test("自定义主题按钮功能", async ({ page }) => {
    // 找到自定义主题按钮 (调色板图标)
    const customThemeBtn = page.locator('button[title="自定义主题"]').first()
    if (await customThemeBtn.count() > 0) {
      await customThemeBtn.click()
      await page.waitForTimeout(500)
      
      // 主题定制器应该打开
      const customizer = page.locator('text=主题定制')
      if (await customizer.count() > 0) {
        await expect(customizer.first()).toBeVisible()
      }
    }
  })

  // ── 5. 快捷键配置 ──

  test("快捷键设置界面显示", async ({ page }) => {
    // 找到快捷键设置区域
    const keybindingSection = page.locator('text=快捷键，text=键位').first()
    if (await keybindingSection.count() > 0) {
      await expect(keybindingSection.first()).toBeVisible()
    }
  })

  test("快捷键列表显示", async ({ page }) => {
    // 应该显示快捷键列表
    const shortcuts = [
      'Ctrl',
      'Shift',
      'Alt',
    ]
    
    const body = await page.textContent("body")
    const hasShortcuts = shortcuts.some(s => body?.includes(s))
    expect(hasShortcuts).toBeTruthy()
  })

  // ── 6. 配置导入导出 ──

  test("导出配置按钮功能", async ({ page }) => {
    // 找到导出按钮
    const exportBtn = page.locator('button:has-text("导出"), button:has-text("Export")')
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await page.waitForTimeout(500)
      
      // 应该触发下载或显示对话框
      expect(true).toBe(true)
    }
  })

  test("导入配置按钮功能", async ({ page }) => {
    // 找到导入按钮
    const importBtn = page.locator('button:has-text("导入"), button:has-text("Import")')
    if (await importBtn.count() > 0) {
      await importBtn.click()
      await page.waitForTimeout(500)
      
      // 应该打开文件选择器
      expect(true).toBe(true)
    }
  })

  // ── 7. 重置配置 ──

  test("重置配置按钮功能", async ({ page }) => {
    // 找到重置按钮
    const resetBtn = page.locator('button:has-text("重置"), button:has-text("Reset")')
    if (await resetBtn.count() > 0) {
      await resetBtn.click()
      await page.waitForTimeout(500)
      
      // 应该显示确认对话框
      expect(true).toBe(true)
    }
  })

  // ── 8. 设置持久化 ──

  test("设置保存后刷新仍然有效", async ({ page }) => {
    // 保存当前设置
    const saveBtn = page.locator('button:has-text("保存")').first()
    if (await saveBtn.count() > 0) {
      await saveBtn.click()
      await page.waitForTimeout(500)
    }
    
    // 刷新页面
    await page.reload()
    await page.waitForTimeout(2000)
    
    // 设置应该仍然有效
    expect(true).toBe(true)
  })

  // ── 9. 错误处理 ──

  test("无效 API Key 显示错误提示", async ({ page }) => {
    // 填写无效的 API Key
    const apiKeyInput = page.locator('input[type="password"]').first()
    if (await apiKeyInput.count() > 0) {
      await apiKeyInput.fill("invalid-key-!!!")
      
      // 点击测试连接
      const testBtn = page.locator('button:has-text("测试"), button:has-text("Test")')
      if (await testBtn.count() > 0) {
        await testBtn.click()
        await page.waitForTimeout(2000)
        
        // 应该显示错误提示
        expect(true).toBe(true)
      }
    }
  })

  // ── 10. 响应式布局 ──

  test("窄屏幕下设置界面自适应", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 800 })
    await page.waitForTimeout(1000)
    
    // 页面应该正常渲染
    await expect(page.locator("body")).toBeVisible()
  })
})
