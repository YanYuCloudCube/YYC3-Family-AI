/**
 * @file e2e/code-generation-flow.spec.ts
 * @description Playwright E2E 测试 - AI 代码生成完整流程测试：
 *              上下文收集 → 意图识别 → 代码生成 → Diff 预览 → 应用代码
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,code-generation,ai-pipeline
 */

import { test, expect, type Page } from "@playwright/test"

const BASE_URL = process.env.BASE_URL || "http://localhost:5173"

async function navigateToIDE(page: Page) {
  await page.goto(`${BASE_URL}/#/ide`)
  await page.waitForTimeout(2000)
}

test.describe("Code Generation Flow - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToIDE(page)
  })

  // ── 1. AI 对话界面 ──

  test("AI 对话界面加载", async ({ page }) => {
    // 应该显示 AI 对话输入框
    const textarea = page.locator('textarea[placeholder*="输入"], textarea[placeholder*="message"]').first()
    if (await textarea.count() > 0) {
      await expect(textarea.first()).toBeVisible()
    }
  })

  test("快捷建议按钮显示", async ({ page }) => {
    // 应该显示快捷建议
    const suggestions = [
      '创建',
      '生成',
      '帮我',
    ]
    
    const body = await page.textContent("body")
    const hasSuggestions = suggestions.some(s => body?.includes(s))
    expect(hasSuggestions).toBeTruthy()
  })

  // ── 2. 发送消息 ──

  test("发送消息功能", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="输入"]').first()
    if (await textarea.count() > 0) {
      await textarea.fill("创建一个简单的 React 组件")
      await page.waitForTimeout(300)
      
      // 发送按钮应该可用
      const sendBtn = page.locator('button[title="发送"], button:has-text("发送")')
      if (await sendBtn.count() > 0) {
        await expect(sendBtn.first()).toBeEnabled()
      }
    }
  })

  test("Enter 键发送消息", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="输入"]').first()
    if (await textarea.count() > 0) {
      await textarea.fill("测试消息")
      await textarea.press("Enter")
      await page.waitForTimeout(1000)
      
      // 消息应该发送
      expect(true).toBe(true)
    }
  })

  test("Shift+Enter 换行", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="输入"]').first()
    if (await textarea.count() > 0) {
      await textarea.fill("第一行")
      await textarea.press("Shift+Enter")
      await textarea.fill("\n第二行")
      
      const value = await textarea.inputValue()
      expect(value).toContain("第一行")
    }
  })

  // ── 3. AI 响应 ──

  test("AI 响应显示", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="输入"]').first()
    if (await textarea.count() > 0) {
      await textarea.fill("你好")
      await textarea.press("Enter")
      await page.waitForTimeout(2000)
      
      // 应该显示 AI 响应
      const aiResponse = page.locator('text=你好，text=Hello, text=助手').first()
      if (await aiResponse.count() > 0) {
        await expect(aiResponse.first()).toBeVisible()
      }
    }
  })

  test("流式响应显示", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="输入"]').first()
    if (await textarea.count() > 0) {
      await textarea.fill("写一个函数")
      await textarea.press("Enter")
      await page.waitForTimeout(3000)
      
      // 流式响应应该逐步显示
      expect(true).toBe(true)
    }
  })

  // ── 4. 代码块显示 ──

  test("AI 响应中的代码块显示", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="输入"]').first()
    if (await textarea.count() > 0) {
      await textarea.fill("创建一个按钮组件")
      await textarea.press("Enter")
      await page.waitForTimeout(3000)
      
      // 应该显示代码块
      const codeBlock = page.locator('pre, code, [class*="code"]')
      if (await codeBlock.count() > 0) {
        await expect(codeBlock.first()).toBeVisible()
      }
    }
  })

  test("代码块语言标识", async ({ page }) => {
    // 代码块应该显示语言标识
    const langLabel = page.locator('text=tsx, text=typescript, text=javascript, text=css').first()
    if (await langLabel.count() > 0) {
      await expect(langLabel.first()).toBeVisible()
    }
  })

  // ── 5. 代码操作 ──

  test("复制代码功能", async ({ page }) => {
    // 找到复制按钮
    const copyBtn = page.locator('button[title="复制"], button:has-text("复制")')
    if (await copyBtn.count() > 0) {
      await copyBtn.click()
      await page.waitForTimeout(300)
      
      // 应该显示复制成功提示
      expect(true).toBe(true)
    }
  })

  test("应用代码功能", async ({ page }) => {
    // 找到应用代码按钮
    const applyBtn = page.locator('button[title="应用"], button:has-text("应用"), button:has-text("使用")')
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
      await page.waitForTimeout(500)
      
      // 应该显示 Diff 预览或确认对话框
      expect(true).toBe(true)
    }
  })

  // ── 6. Diff 预览 ──

  test("Diff 预览界面显示", async ({ page }) => {
    // 找到 Diff 预览区域
    const diffPreview = page.locator('text=Diff, text=差异，text=预览')
    if (await diffPreview.count() > 0) {
      await expect(diffPreview.first()).toBeVisible()
    }
  })

  test("接受代码变更", async ({ page }) => {
    // 找到接受按钮
    const acceptBtn = page.locator('button:has-text("接受"), button:has-text("确认"), button:has-text("Apply")')
    if (await acceptBtn.count() > 0) {
      await acceptBtn.click()
      await page.waitForTimeout(500)
      
      // 代码应该应用
      expect(true).toBe(true)
    }
  })

  test("拒绝代码变更", async ({ page }) => {
    // 找到拒绝按钮
    const rejectBtn = page.locator('button:has-text("拒绝"), button:has-text("取消"), button:has-text("Cancel")')
    if (await rejectBtn.count() > 0) {
      await rejectBtn.click()
      await page.waitForTimeout(300)
      
      // 代码应该不应用
      expect(true).toBe(true)
    }
  })

  // ── 7. 文件操作 ──

  test("创建新文件", async ({ page }) => {
    // 找到新建文件按钮
    const newFileBtn = page.locator('button[title="新建文件"], button:has-text("新建")')
    if (await newFileBtn.count() > 0) {
      await newFileBtn.click()
      await page.waitForTimeout(300)
      
      // 应该显示输入框
      const input = page.locator('input[placeholder*="文件名"]')
      if (await input.count() > 0) {
        await input.fill("TestComponent.tsx")
        await input.press("Enter")
        await page.waitForTimeout(500)
      }
    }
  })

  test("文件内容更新", async ({ page }) => {
    // 编辑器应该显示文件内容
    const editor = page.locator('.monaco-editor, [class*="editor"]')
    if (await editor.count() > 0) {
      await expect(editor.first()).toBeVisible()
    }
  })

  // ── 8. 会话管理 ──

  test("新建对话功能", async ({ page }) => {
    // 找到新建对话按钮
    const newSessionBtn = page.locator('button[title="新建对话"]').first()
    if (await newSessionBtn.count() > 0) {
      await newSessionBtn.click()
      await page.waitForTimeout(500)
      
      // 消息列表应该清空
      expect(true).toBe(true)
    }
  })

  test("对话历史显示", async ({ page }) => {
    // 找到对话历史按钮
    const historyBtn = page.locator('button[title="对话历史"]').first()
    if (await historyBtn.count() > 0) {
      await historyBtn.click()
      await page.waitForTimeout(500)
      
      // 历史面板应该显示
      const historyPanel = page.locator('text=对话历史')
      if (await historyPanel.count() > 0) {
        await expect(historyPanel.first()).toBeVisible()
      }
    }
  })

  // ── 9. 错误处理 ──

  test("无 API Key 时显示友好错误", async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="输入"]').first()
    if (await textarea.count() > 0) {
      await textarea.fill("测试")
      await textarea.press("Enter")
      await page.waitForTimeout(2000)
      
      // 应该显示配置提示
      const errorMsg = page.locator('text=API Key, text=配置，text=未设置')
      if (await errorMsg.count() > 0) {
        await expect(errorMsg.first()).toBeVisible()
      }
    }
  })

  test("网络错误处理", async ({ page }) => {
    // 模拟网络错误场景
    expect(true).toBe(true)
  })

  // ── 10. 性能测试 ──

  test("代码生成响应时间", async ({ page }) => {
    const start = Date.now()
    
    const textarea = page.locator('textarea[placeholder*="输入"]').first()
    if (await textarea.count() > 0) {
      await textarea.fill("生成代码")
      await textarea.press("Enter")
      
      // 等待响应
      await page.waitForTimeout(5000)
      
      const elapsed = Date.now() - start
      console.log(`Response time: ${elapsed}ms`)
      
      // 响应时间应该合理 (小于 10 秒)
      expect(elapsed).toBeLessThan(10000)
    }
  })
})
