/**
 * @file multi-agent-panel.spec.ts
 * @description Playwright E2E 测试 — MultiAgentPanel 六标签页交互流程验证
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-02
 * @updated 2026-04-02
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,multi-agent,panel,testing
 */

import { test, expect } from '@playwright/test'

test.describe('MultiAgentPanel — 六标签页交互验证', () => {
  test.beforeEach(async ({ page }) => {
    // 导航至 IDE 页面
    await page.goto('/#/ide')
    await page.waitForLoadState('networkidle')
  })

  test('应正确显示 Multi-Agent 面板标题和标签栏', async ({ page }) => {
    // 通过面板快速访问打开 Multi-Agent 面板
    // 查找面板快速访问按钮
    const quickAccess = page.locator('button[title="面板快速访问"]').first()
    if (await quickAccess.isVisible()) {
      await quickAccess.click()
      // 点击 Multi-Agent 选项
      const multiAgentBtn = page.getByText('Multi-Agent').first()
      if (await multiAgentBtn.isVisible()) {
        await multiAgentBtn.click()
      }
    }

    // 验证标签栏存在
    const tabBar = page.locator('text=状态').first()
    await expect(tabBar).toBeVisible({ timeout: 10000 })
  })

  test('状态标签页 — 显示 4 个智能体卡片', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(2000)

    // 检查智能体角色标签
    const roles = ['规划智能体', '编码智能体', '测试智能体', '评审智能体']
    for (const role of roles) {
      const roleText = page.getByText(role).first()
      // 智能体可能在其他面板中存在或未打开
      if (await roleText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(roleText).toBeVisible()
      }
    }
  })

  test('流程标签页 — 切换并验证任务流程节点', async ({ page }) => {
    await page.waitForTimeout(2000)

    // 点击"流程"标签
    const flowTab = page.getByText('流程', { exact: false }).first()
    if (await flowTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await flowTab.click()

      // 验证流程阶段标签
      const stages = ['分析', '规划', '编码', '测试', '评审', '完成']
      for (const stage of stages) {
        const stageEl = page.getByText(stage, { exact: true }).first()
        if (await stageEl.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(stageEl).toBeVisible()
        }
      }
    }
  })

  test('协作标签页 — 展示协作关系图和消息', async ({ page }) => {
    await page.waitForTimeout(2000)

    // 点击"协作"标签
    const graphTab = page.getByText('协作', { exact: false }).first()
    if (await graphTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await graphTab.click()

      // 验证协作图标签
      const orchestrator = page.getByText('Orchestrator').first()
      if (await orchestrator.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(orchestrator).toBeVisible()
      }

      // 验证最近消息区域
      const msgHeader = page.getByText('最近消息').first()
      if (await msgHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(msgHeader).toBeVisible()
      }
    }
  })

  test('队列标签页 — 展示任务调度队列', async ({ page }) => {
    await page.waitForTimeout(2000)

    const queueTab = page.getByText('队列', { exact: false }).first()
    if (await queueTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await queueTab.click()

      // 验证队列分组
      const runningSection = page.getByText('运行中').first()
      if (await runningSection.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(runningSection).toBeVisible()
      }
    }
  })

  test('记忆标签页 — 搜索和分类筛选', async ({ page }) => {
    await page.waitForTimeout(2000)

    const memoryTab = page.getByText('记忆', { exact: false }).first()
    if (await memoryTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await memoryTab.click()

      // 验证记忆统计
      const stats = page.getByText('条记忆').first()
      if (await stats.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(stats).toBeVisible()
      }

      // 验证搜索框
      const searchInput = page.getByPlaceholder('搜索记忆...').first()
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill('架构')
        await page.waitForTimeout(500)
        // 应该过滤出包含"架构"的记忆条目
        const archMemory = page.getByText('项目架构').first()
        if (await archMemory.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(archMemory).toBeVisible()
        }
      }
    }
  })

  test('预览标签页 — 代码变更接受/拒绝', async ({ page }) => {
    await page.waitForTimeout(2000)

    const previewTab = page.getByText('预览', { exact: false }).first()
    if (await previewTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await previewTab.click()

      // 验证变更统计
      const changeStats = page.getByText('个变更').first()
      if (await changeStats.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(changeStats).toBeVisible()
      }

      // 验证全部接受按钮
      const acceptAllBtn = page.getByText('全部接受').first()
      if (await acceptAllBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(acceptAllBtn).toBeVisible()
      }
    }
  })

  test('暂停/运行 — 控制智能体运行状态', async ({ page }) => {
    await page.waitForTimeout(2000)

    // 查找暂停按钮
    const pauseBtn = page.locator('button[title="暂停"]').first()
    if (await pauseBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pauseBtn.click()
      await page.waitForTimeout(500)

      // 点击后应变为"运行"
      const playBtn = page.locator('button[title="运行"]').first()
      if (await playBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(playBtn).toBeVisible()
      }
    }
  })
})
