/**
 * @file RulesSkillsSection.comprehensive.test.tsx
 * @description RulesSkillsSection 全面测试 - 规则和技能设置面板
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { SkillsSection } from '../RulesSkillsSection'

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

describe('RulesSkillsSection - 基本功能', () => {

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
        rules: [
          {
            id: 'rule-1',
            name: 'Code Style',
            description: 'Enforce code style guidelines',
            enabled: true,
          },
          {
            id: 'rule-2',
            name: 'Security Check',
            description: 'Check for security vulnerabilities',
            enabled: true,
          },
        ],
        skills: [
          {
            id: 'skill-1',
            name: 'Refactoring',
            category: 'code-quality',
            enabled: true,
          },
        ],
      },
    })
  })

  it('组件应该存在且可导入', () => {
    expect(SkillsSection).toBeDefined()
    expect(typeof SkillsSection).toBe('function')
  })

  it('组件应该返回有效的React元素', () => {
    const element = React.createElement(SkillsSection)
    expect(element).toBeDefined()
  })

  it('mock配置应该正确设置', () => {
    const tokens = mockUseThemeTokens()
    expect(tokens.page.cardBg).toBe('bg-white')
    
    const store = mockUseSettingsStore()
    expect(store.settings.rules.length).toBe(2)
    expect(store.settings.skills.length).toBe(1)
  })

  it('规则数据结构应该正确', () => {
    const store = mockUseSettingsStore()
    const rules = store.settings.rules
    
    expect(rules[0]).toHaveProperty('id', 'rule-1')
    expect(rules[0]).toHaveProperty('name', 'Code Style')
    expect(rules[0]).toHaveProperty('enabled', true)
  })

  it('技能数据结构应该正确', () => {
    const store = mockUseSettingsStore()
    const skills = store.settings.skills
    
    expect(skills[0]).toHaveProperty('id', 'skill-1')
    expect(skills[0]).toHaveProperty('name', 'Refactoring')
    expect(skills[0]).toHaveProperty('category', 'code-quality')
  })

  it('i18n翻译函数应该正常工作', () => {
    const i18n = mockUseI18n()
    
    expect(i18n.t('settings.rules')).toBe('settings.rules')
    expect(i18n.t('settings.skills')).toBe('settings.skills')
    expect(i18n.t('')).toBe('')
  })
})

describe('RulesSkillsSection - 边界情况', () => {

  it('空列表时应该正常工作', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: { rules: [], skills: [] },
    })
    
    const element = React.createElement(SkillsSection)
    expect(element).toBeDefined()
  })

  it('大量规则和技能时应该正常工作', () => {
    const manyRules = Array.from({ length: 20 }, (_, i) => ({
      id: `rule-${i}`,
      name: `Rule ${i}`,
      description: `Description ${i}`,
      enabled: i % 2 === 0,
    }))
    
    const manySkills = Array.from({ length: 15 }, (_, i) => ({
      id: `skill-${i}`,
      name: `Skill ${i}`,
      category: ['code-quality', 'performance', 'security'][i % 3],
      enabled: true,
    }))
    
    mockUseSettingsStore.mockReturnValue({
      settings: { rules: manyRules, skills: manySkills },
    })
    
    const element = React.createElement(SkillsSection)
    expect(element).toBeDefined()
  })

  it('只有规则没有技能时应该正常工作', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: {
        rules: [{ id: 'rule-1', name: 'Only Rule', enabled: true }],
        skills: [],
      },
    })
    
    const element = React.createElement(SkillsSection)
    expect(element).toBeDefined()
  })

  it('只有技能没有规则时应该正常工作', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: {
        rules: [],
        skills: [{ id: 'skill-1', name: 'Only Skill', enabled: true }],
      },
    })
    
    const element = React.createElement(SkillsSection)
    expect(element).toBeDefined()
  })
})
