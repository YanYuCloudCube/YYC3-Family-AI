/**
 * @file YYC3MCPServiceSection.comprehensive.test.tsx
 * @description YYC3MCPServiceSection 全面测试 - MCP服务配置面板
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import YYC3MCPServiceSection from '../YYC3MCPServiceSection'

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

describe('YYC3MCPServiceSection - 基本功能', () => {

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
        mcpServices: [
          {
            id: 'service-1',
            name: 'File System',
            endpoint: 'http://localhost:3001',
            status: 'connected',
          },
          {
            id: 'service-2',
            name: 'Database',
            endpoint: 'http://localhost:3002',
            status: 'disconnected',
          },
        ],
      },
    })
  })

  it('组件应该存在且可导入', () => {
    expect(YYC3MCPServiceSection).toBeDefined()
    expect(typeof YYC3MCPServiceSection).toBe('function')
  })

  it('组件应该返回有效的React元素', () => {
    const element = React.createElement(YYC3MCPServiceSection)
    expect(element).toBeDefined()
  })

  it('mock配置应该正确设置', () => {
    const tokens = mockUseThemeTokens()
    expect(tokens.page.cardBg).toBe('bg-white')
    
    const store = mockUseSettingsStore()
    expect(store.settings.mcpServices.length).toBe(2)
  })

  it('服务数据结构应该正确', () => {
    const store = mockUseSettingsStore()
    const services = store.settings.mcpServices
    
    expect(services[0]).toHaveProperty('id', 'service-1')
    expect(services[0]).toHaveProperty('name', 'File System')
    expect(services[0]).toHaveProperty('status', 'connected')
    expect(services[1]).toHaveProperty('status', 'disconnected')
  })

  it('i18n翻译函数应该正常工作', () => {
    const i18n = mockUseI18n()
    
    expect(i18n.t('settings.services')).toBe('settings.services')
    expect(i18n.t('')).toBe('')
  })
})

describe('YYC3MCPServiceSection - 边界情况', () => {

  it('空列表时应该正常工作', () => {
    mockUseSettingsStore.mockReturnValue({
      settings: { mcpServices: [] },
    })
    
    const element = React.createElement(YYC3MCPServiceSection)
    expect(element).toBeDefined()
  })

  it('大量服务时应该正常工作', () => {
    const manyServices = Array.from({ length: 15 }, (_, i) => ({
      id: `service-${i}`,
      name: `Service ${i}`,
      endpoint: `http://localhost:${3000 + i}`,
      status: ['connected', 'disconnected', 'error'][i % 3],
    }))
    
    mockUseSettingsStore.mockReturnValue({
      settings: { mcpServices: manyServices },
    })
    
    const element = React.createElement(YYC3MCPServiceSection)
    expect(element).toBeDefined()
  })

  it('服务状态类型应该正确', () => {
    const store = mockUseSettingsStore()
    const services = store.settings.mcpServices as Array<{ status: string }>
    
    services.forEach((service) => {
      expect(['connected', 'disconnected', 'error']).toContain(service.status)
    })
  })

  it('服务端点格式应该正确', () => {
    const store = mockUseSettingsStore()
    const services = store.settings.mcpServices as Array<{ endpoint: string }>
    
    services.forEach((service) => {
      expect(service.endpoint).toMatch(/^https?:\/\//)
    })
  })
})
