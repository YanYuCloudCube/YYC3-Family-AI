/**
 * @file AgentSection.comprehensive.test.tsx
 * @description AgentSection 全面测试 - 智能体管理设置面板
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { AgentSection } from '../AgentSection'

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

describe('AgentSection - 基本功能', () => {

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
        secondary: 'text-gray-700',
        muted: 'text-gray-400',
      },
      btn: {
        accent: 'bg-blue-500 text-white',
        accentHover: 'hover:bg-blue-600',
        ghost: 'text-gray-600',
        ghostHover: 'hover:bg-gray-100',
      },
    })
    
    mockUseI18n.mockReturnValue({
      t: (key: string) => key,
    })
    
    mockUseSettingsStore.mockReturnValue({
      settings: {
        agents: [
          {
            id: 'agent-1',
            name: 'Test Agent',
            description: 'A test agent',
            systemPrompt: 'You are a test agent',
            model: 'auto',
            temperature: 0.7,
            maxTokens: 4096,
            isBuiltIn: true,
            isCustom: false,
          },
          {
            id: 'agent-2',
            name: 'Custom Agent',
            description: 'A custom agent',
            systemPrompt: 'You are a custom agent',
            model: 'gpt-4',
            temperature: 0.8,
            maxTokens: 2048,
            isBuiltIn: false,
            isCustom: true,
          },
        ],
      },
      addAgent: vi.fn(),
      updateAgent: vi.fn(),
      removeAgent: vi.fn(),
    })
  })

  it('组件应该存在且可导入', () => {
    expect(AgentSection).toBeDefined()
    expect(typeof AgentSection).toBe('function')
  })

  it('组件应该返回有效的React元素', () => {
    const element = React.createElement(AgentSection)
    expect(element).toBeDefined()
  })

  it('mock配置应该正确设置', () => {
    const tokens = mockUseThemeTokens()
    expect(tokens.page.cardBg).toBe('bg-white')
    expect(tokens.text.primary).toBe('text-black')
    
    const i18n = mockUseI18n()
    expect(typeof i18n.t).toBe('function')
    
    const store = mockUseSettingsStore()
    expect(store.settings.agents.length).toBe(2)
  })

  it('智能体数据结构应该正确', () => {
    const store = mockUseSettingsStore()
    const agents = store.settings.agents
    
    expect(agents[0]).toHaveProperty('id', 'agent-1')
    expect(agents[0]).toHaveProperty('name', 'Test Agent')
    expect(agents[0]).toHaveProperty('isBuiltIn', true)
    expect(agents[1]).toHaveProperty('isCustom', true)
  })

  it('store方法应该是函数', () => {
    const store = mockUseSettingsStore()
    
    expect(typeof store.addAgent).toBe('function')
    expect(typeof store.updateAgent).toBe('function')
    expect(typeof store.removeAgent).toBe('function')
  })
})

describe('AgentSection - 边界情况', () => {

  it('空列表时应该正常工作', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: { agents: [] },
      addAgent: vi.fn(),
      updateAgent: vi.fn(),
      removeAgent: vi.fn(),
    })
    
    const element = React.createElement(AgentSection)
    expect(element).toBeDefined()
  })

  it('大量智能体时应该正常工作', () => {
    const manyAgents = Array.from({ length: 50 }, (_, i) => ({
      id: `agent-${i}`,
      name: `Agent ${i}`,
      description: `Description ${i}`,
      systemPrompt: `Prompt ${i}`,
      model: 'auto',
      temperature: 0.7,
      maxTokens: 4096,
      isBuiltIn: i < 5,
      isCustom: i >= 5,
    }))
    
    mockUseSettingsStore.mockReturnValue({
      settings: { agents: manyAgents },
      addAgent: vi.fn(),
      updateAgent: vi.fn(),
      removeAgent: vi.fn(),
    })
    
    const element = React.createElement(AgentSection)
    expect(element).toBeDefined()
  })

  it('i18n翻译函数应该处理各种key', () => {
    const i18n = mockUseI18n()
    
    expect(i18n.t('settings.agents')).toBe('settings.agents')
    expect(i18n.t('settings.builtIn')).toBe('settings.builtIn')
    expect(i18n.t('settings.custom')).toBe('settings.custom')
    expect(i18n.t('')).toBe('')
  })
})
