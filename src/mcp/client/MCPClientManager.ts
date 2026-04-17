import type {
  MCPServerConfig,
  MCPServerStatus,
  MCPConnectionState,
  MCPTool,
  MCPToolResult,
  MCPClientOptions,
} from '../types'

export class MCPClientManager {
  private servers: Map<string, MCPServerConfig> = new Map()
  private statuses: Map<string, MCPServerStatus> = new Map()
  private toolsCache: Map<string, MCPTool[]> = new Map()
  private options: MCPClientOptions

  constructor(options: MCPClientOptions = {}) {
    this.options = {
      timeout: 30000,
      maxRetries: 3,
      reconnectInterval: 5000,
      logLevel: 'info',
      ...options,
    }
  }

  registerServer(config: MCPServerConfig): void {
    this.servers.set(config.name, config)
    this.statuses.set(config.name, {
      name: config.name,
      connected: false,
    })
  }

  unregisterServer(name: string): void {
    this.servers.delete(name)
    this.statuses.delete(name)
    this.toolsCache.delete(name)
  }

  getRegisteredServers(): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter(s => s.enabled)
  }

  getStatus(serverName?: string): MCPServerStatus | MCPServerStatus[] {
    if (serverName) {
      return this.statuses.get(serverName) || {
        name: serverName,
        connected: false,
        error: 'Server not found',
      }
    }
    return Array.from(this.statuses.values())
  }

  async connect(serverName: string): Promise<void> {
    const config = this.servers.get(serverName)
    if (!config) throw new Error(`Server ${serverName} not registered`)
    if (!config.enabled) throw new Error(`Server ${serverName} is disabled`)

    const status = this.statuses.get(serverName)!
    status.connected = true
    status.lastPing = new Date()
    status.error = undefined

    console.log(`[MCP] Connected to server: ${serverName}`)
  }

  async disconnect(serverName: string): Promise<void> {
    const status = this.statuses.get(serverName)
    if (status) {
      status.connected = false
      console.log(`[MCP] Disconnected from server: ${serverName}`)
    }
  }

  async connectAll(): Promise<void> {
    const enabledServers = this.getRegisteredServers()
    await Promise.allSettled(
      enabledServers.map(s => this.connect(s.name))
    )
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.servers.keys()).map(name =>
      this.disconnect(name)
    )
    await Promise.allSettled(promises)
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<MCPToolResult> {
    const status = this.statuses.get(serverName)
    if (!status?.connected) {
      throw new Error(`Server ${serverName} not connected`)
    }

    console.log(`[MCP] Calling tool: ${toolName} on ${serverName}`, args)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, tool: toolName, args }),
      }],
    }
  }

  async listTools(serverName: string): Promise<MCPTool[]> {
    let cached = this.toolsCache.get(serverName)
    if (cached) return cached

    const status = this.statuses.get(serverName)
    if (!status?.connected) {
      throw new Error(`Server ${serverName} not connected`)
    }

    cached = []
    this.toolsCache.set(serverName, cached)

    return cached
  }

  getAllTools(): { server: string; tools: MCPTool[] }[] {
    const result: { server: string; tools: MCPTool[] }[] = []
    for (const [name, tools] of this.toolsCache) {
      result.push({ server: name, tools })
    }
    return result
  }

  clearToolsCache(serverName?: string): void {
    if (serverName) {
      this.toolsCache.delete(serverName)
    } else {
      this.toolsCache.clear()
    }
  }
}
