/**
 * @file: ai-services.ts
 * @description: AI/LLM服务Mock - 用于测试LLMService, AIPipeline等模块
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-15
 * @status: dev
 * @license: MIT
 */

// ── Types ──────────────────────────────────────────────

export interface MockLLMResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: 'stop' | 'length' | 'tool_calls';
}

export interface MockChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<{ type: 'text'; text: string }>;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

export interface MockLLMConfig {
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

// ── Mock LLM Service ────────────────────────────────────

export class MockLLMService {
  private responses: Map<string, MockLLMResponse[]> = new Map();
  private defaultResponse: MockLLMResponse = {
    id: 'mock-response-1',
    content: 'This is a mock AI response for testing purposes.',
    model: 'mock-model',
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    finish_reason: 'stop',
  };

  private shouldFail = false;
  private failError: Error = new Error('Mock LLM service error');
  private delay = 0;

  configure(config: Partial<{
    defaultResponse: MockLLMResponse;
    shouldFail: boolean;
    failError: Error;
    delay: number;
  }>): void {
    if (config.defaultResponse) this.defaultResponse = config.defaultResponse;
    if (config.shouldFail !== undefined) this.shouldFail = config.shouldFail;
    if (config.failError) this.failError = config.failError;
    if (config.delay !== undefined) this.delay = config.delay;
  }

  setResponses(key: string, responses: MockLLMResponse[]): void {
    this.responses.set(key, responses);
  }

  async chat(messages: MockChatMessage[], _config?: MockLLMConfig): Promise<MockLLMResponse> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw this.failError;
    }

    const messageKey = messages.map(m => `${m.role}:${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('|');
    
    const queuedResponses = this.responses.get(messageKey);
    if (queuedResponses && queuedResponses.length > 0) {
      return queuedResponses.shift()!;
    }

    return { ...this.defaultResponse, id: `mock-${Date.now()}` };
  }

  async streamChat(
    messages: MockChatMessage[],
    onChunk: (chunk: string) => void,
    _config?: MockLLMConfig
  ): Promise<MockLLMResponse> {
    if (this.shouldFail) {
      throw this.failError;
    }

    const response = await this.chat(messages, _config);
    const chunks = response.content.split(' ').map((word, i) => 
      i === 0 ? word : ` ${word}`
    );

    for (const chunk of chunks) {
      if (this.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay / chunks.length));
      }
      onChunk(chunk);
    }

    return response;
  }

  reset(): void {
    this.responses.clear();
    this.shouldFail = false;
    this.delay = 0;
  }
}

// ── Predefined Response Templates ───────────────────────

export const mockResponses = {
  codeGeneration: {
    id: 'code-gen-1',
    content: `\`\`\`typescript
// Generated code
function helloWorld() {
  console.log('Hello from mock AI!');
}
\`\`\``,
    model: 'gpt-4',
    usage: { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 },
  },

  errorAnalysis: {
    id: 'error-analysis-1',
    content: JSON.stringify({
      errorType: 'TypeError',
      message: 'Cannot read property of undefined',
      suggestion: 'Check if the variable is properly initialized before accessing its properties.',
      confidence: 0.95,
    }, null, 2),
    model: 'gpt-4',
    usage: { prompt_tokens: 80, completion_tokens: 60, total_tokens: 140 },
  },

  taskExtraction: {
    id: 'task-extract-1',
    content: JSON.stringify({
      tasks: [
        { id: '1', description: 'Create user authentication component', priority: 'high', estimatedTime: '2h' },
        { id: '2', description: 'Set up database connection', priority: 'high', estimatedTime: '1h' },
        { id: '3', description: 'Write unit tests for auth module', priority: 'medium', estimatedTime: '3h' },
      ],
    }, null, 2),
    model: 'gpt-4',
    usage: { prompt_tokens: 100, completion_tokens: 120, total_tokens: 220 },
  },

  simpleText: {
    id: 'simple-1',
    content: 'I understand your request. Here is my response.',
    model: 'gpt-4',
    usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
  },
};

// ── Helper Functions ────────────────────────────────────

export function createMockLLMService(overrides?: Partial<MockLLMService>): MockLLMService {
  const service = new MockLLMService();
  
  if (overrides) {
    Object.assign(service, overrides);
  }
  
  return service;
}

export function createSuccessResponse(content: string, overrides?: Partial<MockLLMResponse>): MockLLMResponse {
  return {
    id: `success-${Date.now()}`,
    content,
    model: 'mock-model',
    usage: { prompt_tokens: 10, completion_tokens: content.split(' ').length, total_tokens: 10 + content.split(' ').length },
    finish_reason: 'stop',
    ...overrides,
  };
}

export function createErrorResponse(errorMsg: string = 'API Error'): never {
  throw new Error(errorMsg);
}

// ── Export Singleton ────────────────────────────────────

export const globalMockLLM = new MockLLMService();

export default {
  MockLLMService,
  mockResponses,
  createMockLLMService,
  createSuccessResponse,
  createErrorResponse,
  globalMockLLM,
};
