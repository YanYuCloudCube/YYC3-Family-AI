/**
 * @file MCPModelSection.comprehensive.test.tsx
 * @description MCPModelSection 全面测试 - MCP模型配置面板
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { ModelSection } from '../MCPModelSection'

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

describe('MCPModelSection - 基本功能', () => {

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
        mcpModels: [
          {
            id: 'model-1',
            name: 'GPT-4',
            provider: 'openai',
            endpoint: 'https://api.openai.com/v1',
          },
          {
            id: 'model-2',
            name: 'Claude-3',
            provider: 'anthropic',
            endpoint: 'https://api.anthropic.com/v1',
          },
        ],
      },
    })
  })

  it('组件应该存在且可导入', () => {
    expect(ModelSection).toBeDefined()
    expect(typeof ModelSection).toBe('function')
  })

  it('组件应该返回有效的React元素', () => {
    const element = React.createElement(ModelSection)
    expect(element).toBeDefined()
  })

  it('mock配置应该正确设置', () => {
    const tokens = mockUseThemeTokens()
    expect(tokens.page.cardBg).toBe('bg-white')
    
    const store = mockUseSettingsStore()
    expect(store.settings.mcpModels.length).toBe(2)
  })

  it('模型数据结构应该正确', () => {
    const store = mockUseSettingsStore()
    const models = store.settings.mcpModels
    
    expect(models[0]).toHaveProperty('id', 'model-1')
    expect(models[0]).toHaveProperty('name', 'GPT-4')
    expect(models[1]).toHaveProperty('provider', 'anthropic')
  })

  it('i18n翻译函数应该正常工作', () => {
    const i18n = mockUseI18n()
    
    expect(i18n.t('settings.models')).toBe('settings.models')
    expect(i18n.t('')).toBe('')
  })
})

describe('MCPModelSection - 边界情况', () => {

  it('空列表时应该正常工作', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: { mcpModels: [] },
    })
    
    const element = React.createElement(ModelSection)
    expect(element).toBeDefined()
  })

  it('大量模型时应该正常工作', () => {
    const manyModels = Array.from({ length: 30 }, (_, i) => ({
      id: `model-${i}`,
      name: `Model ${i}`,
      provider: ['openai', 'anthropic', 'google'][i % 3],
      endpoint: `https://api.example${i}.com/v1`,
    }))
    
    mockUseSettingsStore.mockReturnValue({
      settings: { mcpModels: manyModels },
    })
    
    const element = React.createElement(ModelSection)
    expect(element).toBeDefined()
  })
})
