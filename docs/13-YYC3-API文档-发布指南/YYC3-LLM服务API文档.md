# LLM 服务 API 文档

> **版本**: v1.0.0  
> **最后更新**: 2026-03-31  
> **维护团队**: YYC3 团队

## 概述

LLM 服务提供了统一的 LLM Provider 接口，支持六大主流 AI 提供商。

## 支持的 Provider

1. **Ollama** - 本地部署
2. **OpenAI** - GPT 系列
3. **智谱 GLM** - GLM 系列
4. **通义千问** - Qwen 系列
5. **DeepSeek** - DeepSeek 系列
6. **自定义** - 自定义 Provider

## 核心 API

### LLMProviderFactory

LLM Provider 工厂，负责创建和管理 Provider 实例。

#### 方法

##### `createProvider(config: ProviderConfig): LLMProvider`

创建 LLM Provider 实例。

**参数**:
- `config`: Provider 配置

**返回值**: `LLMProvider`

**示例**:
```typescript
import { LLMProviderFactory } from '@/app/components/ide/llm/LLMProviderFactory';

const provider = LLMProviderFactory.createProvider({
  type: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4',
  baseURL: 'https://api.openai.com/v1',
});
```

##### `getAvailableProviders(): ProviderInfo[]`

获取所有可用的 Provider 列表。

**返回值**: `ProviderInfo[]`

**示例**:
```typescript
const providers = LLMProviderFactory.getAvailableProviders();
// [
//   { type: 'ollama', name: 'Ollama', description: '...' },
//   { type: 'openai', name: 'OpenAI', description: '...' },
//   ...
// ]
```

### LLMProvider

LLM Provider 接口，所有 Provider 都实现此接口。

#### 方法

##### `chat(messages: Message[], options?: ChatOptions): Promise<string>`

发送聊天消息并获取响应。

**参数**:
- `messages`: 消息数组
- `options`: 聊天选项（可选）

**返回值**: `Promise<string>`

**示例**:
```typescript
const response = await provider.chat([
  { role: 'user', content: '你好，请介绍一下自己' },
], {
  temperature: 0.7,
  maxTokens: 2000,
});
```

##### `chatStream(messages: Message[], options?: ChatOptions): AsyncGenerator<string>`

发送聊天消息并以流式方式获取响应。

**参数**:
- `messages`: 消息数组
- `options`: 聊天选项（可选）

**返回值**: `AsyncGenerator<string>`

**示例**:
```typescript
for await (const chunk of provider.chatStream(messages)) {
  console.log(chunk);
}
```

##### `complete(prompt: string, options?: CompleteOptions): Promise<string>`

完成文本补全。

**参数**:
- `prompt`: 提示文本
- `options`: 补全选项（可选）

**返回值**: `Promise<string>`

**示例**:
```typescript
const completion = await provider.complete('function add(a, b) {', {
  temperature: 0.5,
  maxTokens: 100,
});
```

##### `embed(text: string): Promise<number[]>`

生成文本嵌入向量。

**参数**:
- `text`: 输入文本

**返回值**: `Promise<number[]>`

**示例**:
```typescript
const embedding = await provider.embed('Hello, world!');
console.log(embedding.length); // 1536 (OpenAI)
```

##### `getModels(): Promise<ModelInfo[]>`

获取 Provider 支持的所有模型。

**返回值**: `Promise<ModelInfo[]>`

**示例**:
```typescript
const models = await provider.getModels();
// [
//   { id: 'gpt-4', name: 'GPT-4', contextWindow: 8192, ... },
//   { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 4096, ... },
//   ...
// ]
```

## 类型定义

### ProviderConfig

```typescript
interface ProviderConfig {
  /** Provider 类型 */
  type: ProviderType;
  /** API 密钥 */
  apiKey?: string;
  /** 基础 URL */
  baseURL?: string;
  /** 模型名称 */
  model?: string;
  /** 组织 ID */
  organization?: string;
  /** 其他配置 */
  [key: string]: unknown;
}
```

### ProviderType

```typescript
type ProviderType = 
  | 'ollama'
  | 'openai'
  | 'zhipu'
  | 'qwen'
  | 'deepseek'
  | 'custom';
```

### Message

```typescript
interface Message {
  /** 角色 */
  role: 'system' | 'user' | 'assistant';
  /** 内容 */
  content: string;
  /** 名称 */
  name?: string;
}
```

### ChatOptions

```typescript
interface ChatOptions {
  /** 温度 (0-1) */
  temperature?: number;
  /** 最大 Token 数 */
  maxTokens?: number;
  /** Top-p 采样 */
  topP?: number;
  /** 停止序列 */
  stop?: string[];
  /** 流式响应 */
  stream?: boolean;
  /** 频率惩罚 */
  frequencyPenalty?: number;
  /** 存在惩罚 */
  presencePenalty?: number;
}
```

### ModelInfo

```typescript
interface ModelInfo {
  /** 模型 ID */
  id: string;
  /** 模型名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 上下文窗口大小 */
  contextWindow: number;
  /** 最大输出 Token */
  maxOutputTokens?: number;
  /** 支持的功能 */
  capabilities?: {
    chat: boolean;
    completion: boolean;
    embedding: boolean;
    fine_tuning: boolean;
  };
  /** 价格信息 */
  pricing?: {
    input: number; // 每 1K token 价格
    output: number;
  };
}
```

## Provider 详细配置

### Ollama

```typescript
const ollamaProvider = LLMProviderFactory.createProvider({
  type: 'ollama',
  baseURL: 'http://localhost:11434',
  model: 'llama2',
});
```

**特点**:
- 本地部署，无需 API Key
- 支持自定义模型
- 低延迟

### OpenAI

```typescript
const openaiProvider = LLMProviderFactory.createProvider({
  type: 'openai',
  apiKey: 'sk-...',
  organization: 'org-...',
  model: 'gpt-4',
});
```

**特点**:
- 支持多种模型
- 高质量输出
- 流式响应

### 智谱 GLM

```typescript
const zhipuProvider = LLMProviderFactory.createProvider({
  type: 'zhipu',
  apiKey: '...',
  model: 'glm-4',
});
```

**特点**:
- 中文优化
- 支持长上下文
- 成本效益高

### 通义千问

```typescript
const qwenProvider = LLMProviderFactory.createProvider({
  type: 'qwen',
  apiKey: '...',
  model: 'qwen-max',
});
```

**特点**:
- 中文优化
- 多模态支持
- 企业级服务

### DeepSeek

```typescript
const deepseekProvider = LLMProviderFactory.createProvider({
  type: 'deepseek',
  apiKey: '...',
  model: 'deepseek-chat',
});
```

**特点**:
- 代码能力强
- 成本低
- 开源友好

### 自定义 Provider

```typescript
const customProvider = LLMProviderFactory.createProvider({
  type: 'custom',
  apiKey: '...',
  baseURL: 'https://api.example.com/v1',
  model: 'custom-model',
});
```

**特点**:
- 完全自定义
- 兼容 OpenAI API 格式
- 灵活配置

## 事件系统

LLM 服务支持事件监听：

### 请求开始事件

```typescript
import { eventBus } from '@/app/components/ide/llm/PluginAPIManager';

eventBus.on('llm:request:start', (data) => {
  console.log('请求开始:', data.provider, data.model);
});
```

### 响应完成事件

```typescript
eventBus.on('llm:response:complete', (data) => {
  console.log('响应完成:', data.provider, data.tokens);
});
```

### 错误事件

```typescript
eventBus.on('llm:error', (data) => {
  console.error('LLM 错误:', data.error);
});
```

## 高级功能

### 流式响应处理

```typescript
const stream = provider.chatStream(messages);

let fullResponse = '';
for await (const chunk of stream) {
  fullResponse += chunk;
  // 实时更新 UI
  updateUI(fullResponse);
}
```

### Token 计算

```typescript
import { TokenCounter } from '@/app/components/ide/llm/TokenCounter';

const tokenCount = TokenCounter.count(messages);
console.log('Token 数量:', tokenCount);
```

### 上下文管理

```typescript
import { ContextManager } from '@/app/components/ide/llm/ContextManager';

const contextManager = new ContextManager({
  maxTokens: 8000,
  strategy: 'sliding-window',
});

contextManager.addMessage(newMessage);
const context = contextManager.getContext();
```

### 成本估算

```typescript
import { CostEstimator } from '@/app/components/ide/llm/CostEstimator';

const cost = CostEstimator.estimate({
  provider: 'openai',
  model: 'gpt-4',
  inputTokens: 1000,
  outputTokens: 500,
});

console.log('预估成本:', cost); // $0.03
```

## 错误处理

### API Key 无效

```typescript
try {
  await provider.chat(messages);
} catch (error) {
  if (error.code === 'invalid_api_key') {
    console.error('API Key 无效');
  }
}
```

### 请求超时

```typescript
try {
  await provider.chat(messages, { timeout: 30000 });
} catch (error) {
  if (error.code === 'timeout') {
    console.error('请求超时');
  }
}
```

### 速率限制

```typescript
try {
  await provider.chat(messages);
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    console.error('速率限制，请稍后重试');
  }
}
```

## 最佳实践

### 1. Provider 选择策略

```typescript
function selectProvider(task: string): ProviderType {
  if (task.includes('代码')) return 'deepseek';
  if (task.includes('中文')) return 'zhipu';
  if (task.includes('本地')) return 'ollama';
  return 'openai';
}
```

### 2. 成本优化

```typescript
// 使用更便宜的模型处理简单任务
const provider = taskComplexity === 'simple' 
  ? cheapProvider 
  : expensiveProvider;
```

### 3. 错误重试

```typescript
async function chatWithRetry(messages: Message[], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await provider.chat(messages);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## 测试覆盖

LLM 服务测试覆盖率：**94%**

- 单元测试：68个
- 集成测试：24个
- E2E 测试：12个

## 相关文档

- [意图识别使用指南](../使用指南/意图识别使用指南.md)
- [架构文档 - LLM 服务](../架构文档/系统架构.md#llm服务)

## 更新日志

### v1.0.0 (2026-03-31)
- 初始版本发布
- 支持 6 大 Provider
- 统一 API 接口
- 流式响应
- Token 计算
- 成本估算
- 完整测试覆盖

---

**维护者**: YYC3 团队  
**反馈渠道**: [GitHub Issues](https://github.com/YYC-Cube/YYC3-Family-AI/issues)
