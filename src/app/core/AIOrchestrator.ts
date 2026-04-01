/**
 * @file core/AIOrchestrator.ts
 * @description AI 编排器 - 统一管理 AI 流水线、上下文收集、代码应用
 *              提供可操作的高级 API 和扩展点
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags ai,orchestrator,pipeline,extensibility
 */

import type { PipelineInput, PipelineStreamCallbacks, PipelineOptions } from '../components/ide/ai/AIPipeline';
import { runPipeline } from '../components/ide/ai/AIPipeline';
import type { UserIntent } from '../components/ide/ai/SystemPromptBuilder';
import type { CodeApplicationPlan } from '../components/ide/ai/CodeApplicator';

export interface AIOrchestratorConfig {
  /** 默认 LLM Provider 配置 */
  defaultProvider?: {
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
  /** 是否启用错误恢复 */
  enableErrorRecovery?: boolean;
  /** 自定义中间件 */
  middlewares?: AIMiddleware[];
}

export interface AIMiddleware {
  name: string;
  beforeContext?: (input: PipelineInput) => Promise<PipelineInput>;
  afterContext?: (ctx: unknown, intent: UserIntent) => Promise<void>;
  beforeLLM?: (messages: unknown[]) => Promise<unknown[]>;
  afterLLM?: (response: string) => Promise<string>;
  beforeApply?: (plan: CodeApplicationPlan) => Promise<CodeApplicationPlan>;
  afterApply?: (result: unknown) => Promise<void>;
  onError?: (error: Error, phase: string) => Promise<void>;
}

export interface AIOrchestratorOptions {
  /** 自定义系统提示词 */
  customSystemPrompt?: string;
  /** 最大上下文 token 数 */
  maxContextTokens?: number;
  /** 最大历史消息数 */
  maxHistoryMessages?: number;
  /** AbortSignal */
  signal?: AbortSignal;
}

export interface AIOrchestratorResult {
  /** 生成的完整文本 */
  fullText: string;
  /** 代码应用计划 */
  codePlan: CodeApplicationPlan | null;
  /** 验证结果 */
  validationResult?: unknown;
  /** 性能指标 */
  metrics: {
    contextCollectionTime: number;
    llmTime: number;
    codeApplicationTime: number;
    totalTime: number;
  };
}

export class AIOrchestrator {
  private config: AIOrchestratorConfig;
  private middlewares: AIMiddleware[] = [];
  private performanceMetrics = new Map<string, number[]>();

  constructor(config: AIOrchestratorConfig = {}) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableErrorRecovery: true,
      ...config,
    };
    this.middlewares = config.middlewares || [];
  }

  registerMiddleware(middleware: AIMiddleware): void {
    this.middlewares.push(middleware);
  }

  unregisterMiddleware(name: string): void {
    this.middlewares = this.middlewares.filter((m) => m.name !== name);
  }

  async execute(
    input: PipelineInput,
    options: AIOrchestratorOptions = {}
  ): Promise<AIOrchestratorResult> {
    const startTime = Date.now();
    const metrics: AIOrchestratorResult['metrics'] = {
      contextCollectionTime: 0,
      llmTime: 0,
      codeApplicationTime: 0,
      totalTime: 0,
    };

    try {
      let processedInput = input;

      for (const middleware of this.middlewares) {
        if (middleware.beforeContext) {
          processedInput = await middleware.beforeContext(processedInput);
        }
      }

      const pipelineOptions: PipelineOptions = {
        collectProjectContext: true,
        maxContextTokens: options.maxContextTokens,
        maxHistoryMessages: options.maxHistoryMessages,
        signal: options.signal,
      };

      const result = await this.executePipelineWithMetrics(
        processedInput,
        pipelineOptions,
        metrics
      );

      metrics.totalTime = Date.now() - startTime;

      if (this.config.enablePerformanceMonitoring) {
        this.recordMetrics(metrics);
      }

      return result;
    } catch (error) {
      await this.handleError(error as Error, 'execution');
      throw error;
    }
  }

  async executeStream(
    input: PipelineInput,
    callbacks: PipelineStreamCallbacks,
    options: AIOrchestratorOptions = {}
  ): Promise<void> {
    try {
      let processedInput = input;

      for (const middleware of this.middlewares) {
        if (middleware.beforeContext) {
          processedInput = await middleware.beforeContext(processedInput);
        }
      }

      const pipelineOptions: PipelineOptions = {
        collectProjectContext: true,
        maxContextTokens: options.maxContextTokens,
        maxHistoryMessages: options.maxHistoryMessages,
        signal: options.signal,
      };

      await runPipeline(processedInput, {
        ...callbacks,
        onContextReady: async (ctx: unknown, intent: unknown) => {
          for (const middleware of this.middlewares) {
            if (middleware.afterContext) {
              await middleware.afterContext(ctx, intent as UserIntent);
            }
          }
          callbacks.onContextReady?.(ctx as any, intent as UserIntent);
        },
        onDone: async (fullText: unknown, codePlan: unknown, validationResult: unknown) => {
          let processedPlan = codePlan as CodeApplicationPlan | null;

          for (const middleware of this.middlewares) {
            if (middleware.beforeApply && processedPlan) {
              processedPlan = await middleware.beforeApply(processedPlan);
            }
          }

          callbacks.onDone(fullText as string, processedPlan, validationResult as any);

          for (const middleware of this.middlewares) {
            if (middleware.afterApply) {
              await middleware.afterApply({ fullText: fullText as string, codePlan: processedPlan, validationResult });
            }
          }
        },
        onError: async (error: unknown) => {
          await this.handleError(error as Error, 'stream');
          callbacks.onError(error as string);
        },
      });
    } catch (error) {
      await this.handleError(error as Error, 'stream');
      throw error;
    }
  }

  getPerformanceMetrics(): Map<string, { avg: number; min: number; max: number }> {
    const result = new Map<string, { avg: number; min: number; max: number }>();

    for (const [key, values] of this.performanceMetrics.entries()) {
      if (values.length === 0) continue;

      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      result.set(key, { avg, min, max });
    }

    return result;
  }

  resetPerformanceMetrics(): void {
    this.performanceMetrics.clear();
  }

  private async executePipelineWithMetrics(
    input: PipelineInput,
    options: PipelineOptions,
    metrics: AIOrchestratorResult['metrics']
  ): Promise<AIOrchestratorResult> {
    return new Promise((resolve, reject) => {
      let contextStartTime = 0;
      const llmStartTime = 0;
      const applyStartTime = 0;

      runPipeline(input, {
        onToken: () => {},
        onContextReady: () => {
          contextStartTime = Date.now();
        },
        onDone: (fullText: unknown, codePlan: unknown, validationResult: unknown) => {
          metrics.contextCollectionTime = contextStartTime;
          metrics.llmTime = llmStartTime - contextStartTime;
          metrics.codeApplicationTime = Date.now() - llmStartTime;

          resolve({
            fullText: fullText as string,
            codePlan: codePlan as CodeApplicationPlan | null,
            validationResult: validationResult as any,
            metrics,
          });
        },
        onError: reject,
      }, options);
    });
  }

  private recordMetrics(metrics: AIOrchestratorResult['metrics']): void {
    const record = (key: string, value: number) => {
      if (!this.performanceMetrics.has(key)) {
        this.performanceMetrics.set(key, []);
      }
      this.performanceMetrics.get(key)!.push(value);
    };

    record('contextCollection', metrics.contextCollectionTime);
    record('llm', metrics.llmTime);
    record('codeApplication', metrics.codeApplicationTime);
    record('total', metrics.totalTime);
  }

  private async handleError(error: Error, phase: string): Promise<void> {
    console.error(`[AIOrchestrator] Error in ${phase}:`, error);

    for (const middleware of this.middlewares) {
      if (middleware.onError) {
        await middleware.onError(error, phase);
      }
    }

    if (this.config.enableErrorRecovery) {
      await this.attemptRecovery(error, phase);
    }
  }

  private async attemptRecovery(error: Error, phase: string): Promise<void> {
    if (phase === 'llm') {
      console.warn('[AIOrchestrator] Attempting LLM recovery...');
    }
  }
}

export function createAIOrchestrator(config?: AIOrchestratorConfig): AIOrchestrator {
  return new AIOrchestrator(config);
}
