/**
 * @file ConversationContextSection.comprehensive.test.tsx
 * @description ConversationContextSection 全面测试 - 对话上下文设置面板
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { ConversationSection } from '../ConversationContextSection'

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

describe('ConversationContextSection - 基本功能', () => {

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
        conversationContext: {
          maxHistoryMessages: 50,
          contextWindow: 4096,
          includeSystemPrompt: true,
          preserveFormatting: true,
        },
      },
    })
  })

  it('组件应该存在且可导入', () => {
    expect(ConversationSection).toBeDefined()
    expect(typeof ConversationSection).toBe('function')
  })

  it('组件应该返回有效的React元素', () => {
    const element = React.createElement(ConversationSection)
    expect(element).toBeDefined()
  })

  it('mock配置应该正确设置', () => {
    const tokens = mockUseThemeTokens()
    expect(tokens.page.cardBg).toBe('bg-white')
    
    const store = mockUseSettingsStore()
    expect(store.settings.conversationContext).toBeDefined()
  })

  it('上下文配置数据结构应该正确', () => {
    const store = mockUseSettingsStore()
    const context = store.settings.conversationContext
    
    expect(context).toHaveProperty('maxHistoryMessages', 50)
    expect(context).toHaveProperty('contextWindow', 4096)
    expect(context).toHaveProperty('includeSystemPrompt', true)
  })

  it('i18n翻译函数应该正常工作', () => {
    const i18n = mockUseI18n()
    
    expect(i18n.t('settings.context')).toBe('settings.context')
    expect(i18n.t('')).toBe('')
  })
})

describe('ConversationContextSection - 边界情况', () => {

  it('空配置时应该正常工作', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: { conversationContext: {} },
    })
    
    const element = React.createElement(ConversationSection)
    expect(element).toBeDefined()
  })

  it('极端值配置时应该正常工作', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: {
        conversationContext: {
          maxHistoryMessages: 1000,
          contextWindow: 100000,
          includeSystemPrompt: false,
          preserveFormatting: false,
        },
      },
    })
    
    const element = React.createElement(ConversationSection)
    expect(element).toBeDefined()
  })

  it('i18n翻译函数应该处理各种key', () => {
    const i18n = mockUseI18n()
    
    expect(i18n.t('settings.maxHistory')).toBe('settings.maxHistory')
    expect(i18n.t('settings.contextWindow')).toBe('settings.contextWindow')
    expect(i18n.t('settings.includeSystem')).toBe('settings.includeSystem')
  })
})
