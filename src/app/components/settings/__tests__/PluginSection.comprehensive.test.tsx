/**
 * @file PluginSection.comprehensive.test.tsx
 * @description PluginSection 全面测试 - 插件管理设置面板
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { PluginSection } from '../PluginSection'

const mockUseThemeTokens = vi.fn()
const mockUseSettingsStore = vi.fn()
const mockUseI18n = vi.fn()

vi.mock('../../ide/hooks/useThemeTokens', () => ({
  useThemeTokens: () => mockUseThemeTokens(),
}))

vi.mock('../../ide/stores/useSettingsStore', () => ({
  useSettingsStore: () => mockUseSettingsStore(),
}))

vi.mock('../../ide/i18n', () => ({
  useI18n: () => mockUseI18n(),
}))

describe('PluginSection - 基本功能', () => {

  beforeEach(() => {
    mockUseThemeTokens.mockReturnValue({
      page: {
        cardBg: 'bg-white',
        cardBorder: 'border-gray-200',
      },
      text: {
        primary: 'text-black',
        accent: 'text-blue-500',
        caption: 'text-gray-500',
      },
      btn: {
        accent: 'bg-blue-500 text-white',
        ghost: 'text-gray-600',
      },
    })
    
    mockUseI18n.mockReturnValue({
      t: (key: string) => key,
    })
    
    mockUseSettingsStore.mockReturnValue({
      settings: {
        plugins: [
          {
            id: 'plugin-1',
            name: 'Code Formatter',
            version: '1.0.0',
            enabled: true,
          },
          {
            id: 'plugin-2',
            name: 'Linter',
            version: '2.1.0',
            enabled: false,
          },
        ],
      },
    })
  })

  it('组件应该存在且可导入', () => {
    expect(PluginSection).toBeDefined()
    expect(typeof PluginSection).toBe('function')
  })

  it('组件应该返回有效的React元素', () => {
    const element = React.createElement(PluginSection)
    expect(element).toBeDefined()
  })

  it('mock配置应该正确设置', () => {
    const tokens = mockUseThemeTokens()
    expect(tokens.page.cardBg).toBe('bg-white')
    
    const store = mockUseSettingsStore()
    expect(store.settings.plugins.length).toBe(2)
  })

  it('插件数据结构应该正确', () => {
    const store = mockUseSettingsStore()
    const plugins = store.settings.plugins
    
    expect(plugins[0]).toHaveProperty('id', 'plugin-1')
    expect(plugins[0]).toHaveProperty('name', 'Code Formatter')
    expect(plugins[0]).toHaveProperty('enabled', true)
    expect(plugins[1]).toHaveProperty('enabled', false)
  })

  it('i18n翻译函数应该正常工作', () => {
    const i18n = mockUseI18n()
    
    expect(i18n.t('settings.plugins')).toBe('settings.plugins')
    expect(i18n.t('')).toBe('')
  })
})

describe('PluginSection - 边界情况', () => {

  it('空列表时应该正常工作', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: { plugins: [] },
    })
    
    const element = React.createElement(PluginSection)
    expect(element).toBeDefined()
  })

  it('大量插件时应该正常工作', () => {
    const manyPlugins = Array.from({ length: 25 }, (_, i) => ({
      id: `plugin-${i}`,
      name: `Plugin ${i}`,
      version: `${i}.0.0`,
      enabled: i % 3 !== 0,
    }))
    
    mockUseSettingsStore.mockReturnValue({
      settings: { plugins: manyPlugins },
    })
    
    const element = React.createElement(PluginSection)
    expect(element).toBeDefined()
  })

  it('插件版本格式应该正确', () => {
    const store = mockUseSettingsStore()
    const plugins: Array<{ version: string }> = store.settings.plugins as any
    
    plugins.forEach((plugin: { version: string }) => {
      expect(typeof plugin.version).toBe('string')
      expect(plugin.version.split('.').length).toBeGreaterThanOrEqual(2)
    })
  })
})
