/**
 * @file: BaseAgent.ts
 * @description: Multi-Agent 系统智能体基类
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,base,abstract
 */

import type {
  AgentRole,
  AgentStatus,
  AgentContext,
  AgentTask,
  AgentResult,
  AgentConfig,
  AgentState,
  AgentCapability,
  AgentArtifact,
} from '../types';

export interface BaseAgentInterface {
  readonly role: AgentRole;
  readonly status: AgentStatus;
  readonly capability: AgentCapability;
  readonly config: AgentConfig;

  initialize(context: AgentContext): Promise<void>;
  execute(task: AgentTask): Promise<AgentResult>;
  cancel(taskId: string): Promise<boolean>;
  getState(): AgentState;
  shutdown(): Promise<void>;
}

export abstract class BaseAgent implements BaseAgentInterface {
  protected _status: AgentStatus = 'idle';
  protected _currentTaskId: string | null = null;
  protected _context: AgentContext | null = null;
  protected _completedTasks: number = 0;
  protected _failedTasks: number = 0;
  protected _lastActivityAt: number = Date.now();

  abstract readonly role: AgentRole;
  abstract readonly capability: AgentCapability;

  constructor(protected readonly _config: AgentConfig) {}

  get status(): AgentStatus {
    return this._status;
  }

  get config(): AgentConfig {
    return this._config;
  }

  async initialize(context: AgentContext): Promise<void> {
    this._context = context;
    this._status = 'idle';
    this._lastActivityAt = Date.now();
    await this.onInitialize(context);
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    if (this._status === 'running') {
      throw new Error(`Agent ${this.role} is already running a task`);
    }

    this._status = 'running';
    this._currentTaskId = task.id;
    this._lastActivityAt = Date.now();

    const startTime = Date.now();

    try {
      const result = await this.onExecute(task);

      this._completedTasks++;
      this._status = 'completed';

      return {
        ...result,
        taskId: task.id,
        agent: this.role,
        status: 'success',
        metrics: {
          executionTime: Date.now() - startTime,
          tokensUsed: 0,
          filesModified: result.artifacts?.length ?? 0,
          testsGenerated: 0,
        },
      };
    } catch (error) {
      this._failedTasks++;
      this._status = 'error';

      return {
        taskId: task.id,
        agent: this.role,
        status: 'failed',
        output: {},
        metrics: {
          executionTime: Date.now() - startTime,
          tokensUsed: 0,
          filesModified: 0,
          testsGenerated: 0,
        },
        suggestions: [`任务执行失败: ${(error as Error).message}`],
      };
    } finally {
      this._currentTaskId = null;
      this._lastActivityAt = Date.now();
    }
  }

  async cancel(taskId: string): Promise<boolean> {
    if (this._currentTaskId !== taskId) {
      return false;
    }

    this._status = 'idle';
    this._currentTaskId = null;
    await this.onCancel(taskId);
    return true;
  }

  getState(): AgentState {
    return {
      role: this.role,
      status: this._status,
      currentTaskId: this._currentTaskId,
      completedTasks: this._completedTasks,
      failedTasks: this._failedTasks,
      lastActivityAt: this._lastActivityAt,
      metrics: {
        totalTasksProcessed: this._completedTasks + this._failedTasks,
        successRate:
          this._completedTasks + this._failedTasks > 0
            ? this._completedTasks / (this._completedTasks + this._failedTasks)
            : 0,
        avgExecutionTime: 0,
        avgTokensUsed: 0,
        lastExecutionTime: 0,
      },
    };
  }

  async shutdown(): Promise<void> {
    if (this._status === 'running' && this._currentTaskId) {
      await this.cancel(this._currentTaskId);
    }
    this._status = 'idle';
    this._context = null;
    await this.onShutdown();
  }

  protected abstract onInitialize(context: AgentContext): Promise<void>;
  protected abstract onExecute(task: AgentTask): Promise<Omit<AgentResult, 'taskId' | 'agent' | 'status' | 'metrics'>>;
  protected abstract onCancel(taskId: string): Promise<void>;
  protected abstract onShutdown(): Promise<void>;

  protected createContextMessage(): string {
    if (!this._context) {
      return '';
    }

    const ctx = this._context;
    const parts: string[] = [];

    if (ctx.activeFile) {
      parts.push(`当前活跃文件: ${ctx.activeFile}`);
    }

    if (ctx.gitBranch) {
      parts.push(`当前分支: ${ctx.gitBranch}`);
    }

    if (ctx.gitChanges.length > 0) {
      parts.push(`待提交变更: ${ctx.gitChanges.length} 个文件`);
    }

    return parts.join('\n');
  }

  protected createArtifact(
    type: AgentArtifact['type'],
    path: string,
    content: string,
    isNew: boolean = false,
    language?: string
  ): AgentArtifact {
    return {
      type,
      path,
      content,
      isNew,
      language,
    };
  }

  protected validateInput(task: AgentTask): void {
    if (!task.input?.userMessage) {
      throw new Error('Task input must contain userMessage');
    }
  }

  protected log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.role.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}
