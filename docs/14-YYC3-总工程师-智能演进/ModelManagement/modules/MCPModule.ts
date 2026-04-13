/**
 * @file modules/MCPModule.ts
 * @description MCP 连接管理模块
 */

import { BaseModule, useModule } from "../core/base/BaseModule";
import type { ModuleMeta, ModuleConfig } from "../core/types";
import { Plug, Wifi, WifiOff, Server } from "lucide-react";

interface MCPServer {
  id: string;
  name: string;
  endpoint: string;
  enabled: boolean;
  status: "connected" | "disconnected" | "error";
}

interface MCPModuleState {
  servers: MCPServer[];
  editingId: string | null;
  testingId: string | null;
}

export class MCPModule extends BaseModule<any, MCPModuleState> {
  readonly meta: ModuleMeta = {
    id: "mcp",
    name: "MCP 连接",
    nameEn: "MCP Connections",
    description: "MCP 工具服务管理",
    icon: Plug,
    category: "integration",
    version: "2.0.0",
    author: "YYC3 Team",
    tags: ["settings", "mcp", "connections"],
    order: 40,
  };
  
  readonly config: ModuleConfig = {
    enabled: true,
    visible: true,
    permissions: ["mcp:read", "mcp:write"],
    dependencies: [],
    storageKey: "mcp-servers",
  };
  
  protected getDefaultState(): MCPModuleState {
    return {
      servers: [],
      editingId: null,
      testingId: null,
    };
  }
  
  addServer(server: Omit<MCPServer, "id" | "status">): void {
    const newServer: MCPServer = {
      ...server,
      id: `mcp-${Date.now()}`,
      status: "disconnected",
    };
    
    this.setState({
      servers: [...this._state.data.servers, newServer],
    });
  }
  
  async testConnection(serverId: string): Promise<boolean> {
    this.setState({ testingId: serverId });
    
    const server = this._state.data.servers.find(s => s.id === serverId);
    if (!server) return false;
    
    try {
      const result = await this.context.events.emitAsync("mcp:test", {
        endpoint: server.endpoint,
      });
      
      const status = result.success ? "connected" : "error";
      this.updateServerStatus(serverId, status);
      
      return result.success;
    } finally {
      this.setState({ testingId: null });
    }
  }
  
  private updateServerStatus(id: string, status: MCPServer["status"]): void {
    const servers = this._state.data.servers.map(s =>
      s.id === id ? { ...s, status } : s
    );
    
    this.setState({ servers });
  }
  
  render(): React.ReactNode {
    return <MCPModuleUI module={this} />;
  }
}