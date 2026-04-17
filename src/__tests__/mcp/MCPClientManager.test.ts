import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MCPClientManager } from '../../mcp/client/MCPClientManager'
import type { MCPServerConfig, MCPToolResult } from '../../mcp/types'

describe('MCPClientManager', () => {
  let client: MCPClientManager

  beforeEach(() => {
    client = new MCPClientManager({ logLevel: 'error' })
  })

  describe('Server Registration', () => {
    it('should register a server successfully', () => {
      const config: MCPServerConfig = {
        name: 'test-server',
        command: 'npx',
        args: ['-y', 'test-package'],
        enabled: true,
      }

      client.registerServer(config)

      const servers = client.getRegisteredServers()
      expect(servers).toHaveLength(1)
      expect(servers[0].name).toBe('test-server')
    })

    it('should not return disabled servers', () => {
      client.registerServer({
        name: 'enabled-server',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })
      client.registerServer({
        name: 'disabled-server',
        command: 'npx',
        args: ['test'],
        enabled: false,
      })

      const servers = client.getRegisteredServers()
      expect(servers).toHaveLength(1)
      expect(servers[0].name).toBe('enabled-server')
    })

    it('should unregister a server', () => {
      client.registerServer({
        name: 'to-remove',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })

      client.unregisterServer('to-remove')

      const servers = client.getRegisteredServers()
      expect(servers).toHaveLength(0)
    })
  })

  describe('Connection Management', () => {
    it('should connect to a registered server', async () => {
      client.registerServer({
        name: 'connect-test',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })

      await client.connect('connect-test')

      const status = client.getStatus('connect-test') as any
      expect(status.connected).toBe(true)
      expect(status.lastPing).toBeDefined()
    })

    it('should throw error for unregistered server', async () => {
      await expect(client.connect('non-existent')).rejects.toThrow(
        'Server non-existent not registered'
      )
    })

    it('should throw error for disabled server', async () => {
      client.registerServer({
        name: 'disabled-test',
        command: 'npx',
        args: ['test'],
        enabled: false,
      })

      await expect(client.connect('disabled-test')).rejects.toThrow(
        'is disabled'
      )
    })

    it('should disconnect from a server', async () => {
      client.registerServer({
        name: 'disconnect-test',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })

      await client.connect('disconnect-test')
      await client.disconnect('disconnect-test')

      const status = client.getStatus('disconnect-test') as any
      expect(status.connected).toBe(false)
    })
  })

  describe('Tool Execution', () => {
    it('should call tool on connected server', async () => {
      client.registerServer({
        name: 'tool-test',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })

      await client.connect('tool-test')

      const result = await client.callTool('tool-test', 'test-tool', {
        param1: 'value1',
      })

      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
    })

    it('should throw error when calling tool on disconnected server', async () => {
      client.registerServer({
        name: 'disconnected-tool',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })

      await expect(
        client.callTool('disconnected-tool', 'any-tool', {})
      ).rejects.toThrow('not connected')
    })
  })

  describe('Status Management', () => {
    it('should get status of all servers', () => {
      client.registerServer({
        name: 'server-1',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })
      client.registerServer({
        name: 'server-2',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })

      const statuses = client.getStatus() as any[]
      expect(statuses).toHaveLength(2)
    })

    it('should return error status for unknown server', () => {
      const status = client.getStatus('unknown') as any
      expect(status.connected).toBe(false)
      expect(status.error).toContain('not found')
    })
  })

  describe('Bulk Operations', () => {
    it('should connect to all enabled servers', async () => {
      client.registerServer({
        name: 'bulk-1',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })
      client.registerServer({
        name: 'bulk-2',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })
      client.registerServer({
        name: 'bulk-disabled',
        command: 'npx',
        args: ['test'],
        enabled: false,
      })

      await client.connectAll()

      const s1 = client.getStatus('bulk-1') as any
      const s2 = client.getStatus('bulk-2') as any
      expect(s1.connected).toBe(true)
      expect(s2.connected).toBe(true)
    })

    it('should disconnect from all servers', async () => {
      client.registerServer({
        name: 'dc-all-1',
        command: 'npx',
        args: ['test'],
        enabled: true,
      })

      await client.connect('dc-all-1')
      await client.disconnectAll()

      const status = client.getStatus('dc-all-1') as any
      expect(status.connected).toBe(false)
    })
  })
})

describe('MCP Integration Tests', () => {
  it('should demonstrate full workflow', async () => {
    const client = new MCPClientManager({ logLevel: 'error' })

    client.registerServer({
      name: 'brave-search',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      enabled: true,
      priority: 1,
    })

    const servers = client.getRegisteredServers()
    expect(servers.length).toBeGreaterThan(0)

    console.log('[Test] Registered servers:', servers.map(s => s.name))
  })
})
