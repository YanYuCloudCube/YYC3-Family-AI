import { MCPClientManager } from './client/MCPClientManager'
import { BraveSearchServer } from './servers/BraveSearchServer'
import type {
  MCPServerConfig,
  MCPServerStatus,
  MCPConnectionState,
  MCPTool,
  MCPToolResult,
  MCPClientOptions,
} from './types'

export {
  MCPClientManager,
  BraveSearchServer,
}

export type {
  MCPServerConfig,
  MCPServerStatus,
  MCPConnectionState,
  MCPTool,
  MCPToolResult,
  MCPClientOptions,
}

export function createMCPClient(options?: MCPClientOptions): MCPClientManager {
  return new MCPClientManager(options)
}

export function createBraveSearchServer(
  clientManager: MCPClientManager
): BraveSearchServer {
  return new BraveSearchServer(clientManager)
}

const DEFAULT_SERVERS: MCPServerConfig[] = [
  {
    name: 'brave-search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    enabled: true,
    priority: 1,
  },
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
    enabled: true,
    priority: 2,
  },
  {
    name: 'github-yyc3',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    enabled: true,
    priority: 3,
  },
]

export async function initializeMCPEcosystem(
  options?: MCPClientOptions
): Promise<MCPClientManager> {
  const client = createMCPClient(options)

  for (const serverConfig of DEFAULT_SERVERS) {
    if (serverConfig.enabled) {
      client.registerServer(serverConfig)
    }
  }

  await client.connectAll()

  return client
}
