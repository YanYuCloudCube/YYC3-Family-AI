# YYC³ Family-AI MCP 服务集成指南

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*

---

## 📋 文档信息

| 属性 | 值 |
|------|-----|
| **文档名称** | YYC³ Family-AI MCP 服务集成指南 |
| **版本** | v1.0.0 |
| **创建日期** | 2026-04-04 |
| **适用项目** | YYC3-Family-AI |
| **许可证** | MIT |

---

## 🎯 一、MCP 概述

### 1.1 什么是 MCP？

**MCP (Model Context Protocol)** 是一种标准化的 AI 服务协议，允许 AI 模型与外部工具和服务进行交互。YYC³ 通过 MCP 协议集成了多种 AI 能力服务。

### 1.2 YYC³ 已集成的 MCP 服务

| 服务 ID | 名称 | 功能 | Provider |
|---------|------|------|----------|
| `zread` | 开源仓库分析 | GitHub 仓库代码分析 | Z.ai |
| `zbrowser` | 网页读取 | 网页内容抓取和分析 | Z.ai |
| `zsearch` | 联网搜索 | 实时网络搜索 | Z.ai |
| `zvision` | 视觉理解 | 图像识别和理解 | Z.ai |

### 1.3 MCP 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    YYC³ MCP 架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              MCP Client (YYC³ 内置)                │   │
│  │  ├─ ServiceRegistry (服务注册表)                    │   │
│  │  ├─ ConnectionManager (连接管理)                    │   │
│  │  └─ APIKeyManager (密钥管理)                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              MCP Protocol Layer                    │   │
│  │  ├─ Request/Response 格式                          │   │
│  │  ├─ 认证头 (Authorization)                         │   │
│  │  └─ 错误处理                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              MCP Services (服务端)                 │   │
│  │  ├─ Z.ai (开源仓库/网页/搜索/视觉)                 │   │
│  │  ├─ OpenAI (GPT-4/Claude/等)                       │   │
│  │  ├─ ZhipuAI (智谱 GLM)                             │   │
│  │  └─ Custom Services...                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 二、MCP 服务类型定义

### 2.1 服务配置接口

```typescript
/**
 * @file MCPTypes.ts
 * @description MCP 服务类型定义
 */

type MCPServiceId = string;

interface MCPServiceConfig {
  /** 服务唯一标识符 */
  id: MCPServiceId;
  
  /** 服务显示名称 */
  name: string;
  
  /** 服务描述 */
  description: string;
  
  /** 服务端点 URL */
  endpoint: string;
  
  /** API 密钥 (用户配置) */
  apiKey?: string;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 服务图标 */
  icon?: string;
  
  /** 服务分类 */
  category: 'ai' | 'search' | 'code' | 'vision' | 'custom';
  
  /** API 密钥获取地址 */
  apiKeyUrl?: string;
  
  /** 文档地址 */
  docsUrl?: string;
  
  /** 配额信息 */
  quota?: {
    used: number;
    total: number;
    resetAt?: string;
  };
  
  /** 最后连接状态 */
  lastStatus?: 'connected' | 'disconnected' | 'error';
  
  /** 最后检查时间 */
  lastChecked?: string;
  
  /** 自定义配置 */
  customConfig?: Record<string, any>;
}

interface MCPServiceStatus {
  id: MCPServiceId;
  status: 'connected' | 'disconnected' | 'error' | 'checking';
  latency?: number;
  error?: string;
  lastChecked: string;
}
```

### 2.2 MCP 请求/响应格式

```typescript
interface MCPRequest {
  /** 请求 ID */
  id: string;
  
  /** 服务 ID */
  service: MCPServiceId;
  
  /** 方法名 */
  method: string;
  
  /** 请求参数 */
  params: Record<string, any>;
  
  /** 请求元数据 */
  meta?: {
    timeout?: number;
    retryCount?: number;
  };
}

interface MCPResponse<T = any> {
  /** 请求 ID */
  id: string;
  
  /** 响应状态 */
  status: 'success' | 'error';
  
  /** 响应数据 */
  data?: T;
  
  /** 错误信息 */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  /** 响应元数据 */
  meta?: {
    latency: number;
    quota?: {
      used: number;
      remaining: number;
    };
  };
}
```

---

## 🛠️ 三、集成新的 MCP 服务

### 3.1 步骤概览

```
┌─────────────────────────────────────────────────────────────┐
│              MCP 服务集成流程                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 定义服务配置                                       │
│     └─ 添加到 DEFAULT_YYC3_MCP_SERVICES                    │
│                                                             │
│  Step 2: 创建服务组件                                       │
│     └─ 实现连接测试、状态显示                               │
│                                                             │
│  Step 3: 实现 API 调用                                      │
│     └─ 封装请求逻辑、错误处理                               │
│                                                             │
│  Step 4: 添加 UI 集成                                       │
│     └─ 设置页面、状态指示器                                 │
│                                                             │
│  Step 5: 编写文档                                           │
│     └─ 使用说明、API 参考                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Step 1: 定义服务配置

在 `YYC3MCPServiceSection.tsx` 中添加新服务：

```typescript
// src/app/components/settings/YYC3MCPServiceSection.tsx

const DEFAULT_YYC3_MCP_SERVICES: Record<MCPServiceId, YYC3MCPServiceConfig> = {
  // 现有服务...
  
  // 添加新服务
  "new-service": {
    id: "new-service",
    name: "新服务名称",
    description: "服务功能描述",
    endpoint: "https://api.new-service.com/v1",
    enabled: false,
    icon: "new-service-icon",
    category: "custom",
    apiKeyUrl: "https://new-service.com/api-keys",
    docsUrl: "/docs",
  },
};
```

### 3.3 Step 2: 创建服务类型定义

```typescript
// src/types/mcp-services.ts

export interface NewServiceConfig extends MCPServiceConfig {
  id: 'new-service';
  customConfig: {
    // 服务特定的配置项
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface NewServiceRequest {
  prompt: string;
  options?: {
    model?: string;
    maxTokens?: number;
  };
}

export interface NewServiceResponse {
  result: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### 3.4 Step 3: 实现 API 调用

```typescript
// src/app/components/ide/services/NewServiceAPI.ts

/**
 * @file NewServiceAPI.ts
 * @description 新服务 API 封装
 */

import type { NewServiceRequest, NewServiceResponse } from '@/types/mcp-services';

export class NewServiceAPI {
  private endpoint: string;
  private apiKey: string | null = null;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async testConnection(): Promise<{ success: boolean; latency: number; error?: string }> {
    if (!this.apiKey) {
      return { success: false, latency: 0, error: 'API Key 未配置' };
    }

    const startTime = performance.now();
    
    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        return { success: true, latency };
      } else {
        return { 
          success: false, 
          latency, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      const latency = Math.round(performance.now() - startTime);
      return { 
        success: false, 
        latency, 
        error: error instanceof Error ? error.message : '连接失败' 
      };
    }
  }

  async execute(request: NewServiceRequest): Promise<NewServiceResponse> {
    if (!this.apiKey) {
      throw new Error('API Key 未配置');
    }

    const response = await fetch(`${this.endpoint}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        ...request.options,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

// 单例实例
export const newServiceAPI = new NewServiceAPI('https://api.new-service.com/v1');
```

### 3.5 Step 4: 添加 UI 集成

在设置页面中添加服务配置 UI：

```tsx
// src/app/components/settings/NewServiceSection.tsx

import { useState, useCallback } from 'react';
import { Key, ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { newServiceAPI } from '../ide/services/NewServiceAPI';

export function NewServiceSection() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [latency, setLatency] = useState<number | null>(null);

  const handleTestConnection = useCallback(async () => {
    if (!apiKey.trim()) return;

    setStatus('checking');
    newServiceAPI.setApiKey(apiKey);
    
    const result = await newServiceAPI.testConnection();
    
    if (result.success) {
      setStatus('connected');
      setLatency(result.latency);
    } else {
      setStatus('error');
      setLatency(null);
    }
  }, [apiKey]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">新服务配置</h3>
        {status === 'connected' && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            已连接 ({latency}ms)
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1 text-xs text-red-400">
            <XCircle className="w-3 h-3" />
            连接失败
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入 API Key"
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={handleTestConnection}
          disabled={status === 'checking' || !apiKey.trim()}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 disabled:opacity-50"
        >
          {status === 'checking' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            '测试连接'
          )}
        </button>
      </div>

      <a
        href="https://new-service.com/api-keys"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
      >
        <ExternalLink className="w-3 h-3" />
        获取 API Key
      </a>
    </div>
  );
}
```

---

## 🔐 四、API 密钥管理

### 4.1 安全存储策略

YYC³ 采用以下策略保护 API 密钥：

```typescript
// API 密钥存储策略
const apiKeyStoragePolicy = {
  // 存储位置
  location: 'sessionStorage',  // 会话级存储
  
  // 加密选项
  encryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
  },
  
  // 显示策略
  display: {
    masked: true,              // 显示时脱敏
    maskPattern: '****XXXX',   // 显示后4位
  },
  
  // 生命周期
  lifecycle: {
    clearOnClose: true,        // 关闭时清除
    clearOnLogout: true,       // 登出时清除
  },
};
```

### 4.2 密钥管理实现

```typescript
// src/app/components/ide/services/APIKeyManager.ts

/**
 * @file APIKeyManager.ts
 * @description API 密钥管理服务
 */

class APIKeyManager {
  private storageKey = 'yyc3-mcp-api-keys';
  
  // 保存密钥
  saveKey(serviceId: string, apiKey: string): void {
    const keys = this.getAllKeys();
    keys[serviceId] = this.maskKey(apiKey);
    sessionStorage.setItem(this.storageKey, JSON.stringify(keys));
  }
  
  // 获取密钥
  getKey(serviceId: string): string | null {
    const keys = this.getAllKeys();
    return keys[serviceId] || null;
  }
  
  // 获取所有密钥
  getAllKeys(): Record<string, string> {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  
  // 删除密钥
  removeKey(serviceId: string): void {
    const keys = this.getAllKeys();
    delete keys[serviceId];
    sessionStorage.setItem(this.storageKey, JSON.stringify(keys));
  }
  
  // 清除所有密钥
  clearAll(): void {
    sessionStorage.removeItem(this.storageKey);
  }
  
  // 脱敏显示
  maskKey(key: string): string {
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  }
  
  // 验证密钥格式
  validateKey(serviceId: string, key: string): boolean {
    // 根据服务类型验证格式
    const patterns: Record<string, RegExp> = {
      'zread': /^zread_[a-zA-Z0-9]{32}$/,
      'openai': /^sk-[a-zA-Z0-9]{48}$/,
      'zhipu': /^[a-zA-Z0-9]{32}\.[a-zA-Z0-9]{16}$/,
    };
    
    const pattern = patterns[serviceId];
    return pattern ? pattern.test(key) : key.length >= 16;
  }
}

export const apiKeyManager = new APIKeyManager();
```

---

## 📊 五、使用示例

### 5.1 在 AI 对话中使用 MCP 服务

```typescript
// 使用开源仓库分析服务
async function analyzeRepository(repoUrl: string) {
  const response = await mcpClient.execute({
    id: generateUUID(),
    service: 'zread',
    method: 'analyze',
    params: {
      repository: repoUrl,
      depth: 'full',
    },
  });
  
  return response.data;
}

// 使用网页读取服务
async function readWebPage(url: string) {
  const response = await mcpClient.execute({
    id: generateUUID(),
    service: 'zbrowser',
    method: 'read',
    params: {
      url,
      extractMain: true,
    },
  });
  
  return response.data;
}

// 使用联网搜索服务
async function search(query: string) {
  const response = await mcpClient.execute({
    id: generateUUID(),
    service: 'zsearch',
    method: 'search',
    params: {
      query,
      limit: 10,
    },
  });
  
  return response.data;
}

// 使用视觉理解服务
async function analyzeImage(imageUrl: string) {
  const response = await mcpClient.execute({
    id: generateUUID(),
    service: 'zvision',
    method: 'analyze',
    params: {
      image: imageUrl,
      tasks: ['ocr', 'description', 'objects'],
    },
  });
  
  return response.data;
}
```

### 5.2 在 Agent 流程中集成

```typescript
// src/app/components/ide/ai/agents/ResearchAgent.ts

export class ResearchAgent {
  async execute(task: string): Promise<AgentResult> {
    // Step 1: 联网搜索
    const searchResults = await mcpClient.execute({
      id: generateUUID(),
      service: 'zsearch',
      method: 'search',
      params: { query: task, limit: 5 },
    });
    
    // Step 2: 读取相关网页
    const contents = await Promise.all(
      searchResults.data.results.slice(0, 3).map((r: any) =>
        mcpClient.execute({
          id: generateUUID(),
          service: 'zbrowser',
          method: 'read',
          params: { url: r.url },
        })
      )
    );
    
    // Step 3: 综合分析
    const analysis = await this.synthesize(contents.map(c => c.data));
    
    return {
      success: true,
      output: analysis,
      sources: searchResults.data.results,
    };
  }
}
```

---

## 🔧 六、故障排除

### 6.1 常见错误

| 错误代码 | 描述 | 解决方案 |
|----------|------|----------|
| `AUTH_FAILED` | API Key 无效 | 检查密钥是否正确，是否过期 |
| `QUOTA_EXCEEDED` | 配额用尽 | 等待配额重置或升级套餐 |
| `TIMEOUT` | 请求超时 | 检查网络连接，增加超时时间 |
| `SERVICE_UNAVAILABLE` | 服务不可用 | 稍后重试或联系服务提供商 |

### 6.2 调试技巧

```typescript
// 启用详细日志
const mcpClient = new MCPClient({
  debug: true,
  logLevel: 'verbose',
});

// 监听请求事件
mcpClient.on('request', (request) => {
  console.log('[MCP] Request:', request);
});

mcpClient.on('response', (response) => {
  console.log('[MCP] Response:', response);
});

mcpClient.on('error', (error) => {
  console.error('[MCP] Error:', error);
});
```

---

## 📚 七、相关资源

| 资源 | 链接 |
|------|------|
| Z.ai 开放平台 | https://open.bigmodel.cn |
| MCP 协议规范 | https://modelcontextprotocol.io |
| YYC³ 文档中心 | `/docs` |
| 问题反馈 | https://github.com/YanYuCloudCube/YYC3-Family-AI/issues |

---

**文档版本**: v1.0.0
**最后更新**: 2026-04-04
**维护者**: YanYuCloudCube Team
**许可证**: MIT
