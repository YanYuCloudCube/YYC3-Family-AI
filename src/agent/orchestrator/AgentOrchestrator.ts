/**
 * @file: AgentOrchestrator.ts
 * @description: Multi-Agent 编排引擎核心实现
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,orchestrator,core
 */

import type {
  AgentRole,
  AgentTask,
  AgentResult,
  AgentContext,
  AgentState,
  AgentConfig,
  TaskPlan,
  TaskDefinition,
} from '../types';
import { BaseAgent } from '../base/BaseAgent';
import { MessageBus, type MessageBusConfig } from '../communication/MessageBus';
import { PlannerAgent, type UserIntent } from '../agents/PlannerAgent';

export interface OrchestratorConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryAttempts: number;
  enableParallelExecution: boolean;
  messageBusConfig?: Partial<MessageBusConfig>;
}

export interface OrchestratorState {
  status: 'idle' | 'running' | 'paused' | 'error';
  activeTasks: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  agents: Map<AgentRole, AgentState>;
}

export interface TaskSubmissionResult {
  taskId: string;
  status: 'accepted' | 'rejected' | 'queued';
  message: string;
  estimatedStartTime?: number;
}

export interface IAgentOrchestrator {
  initialize(context: AgentContext): Promise<void>;
  submitTask(task: AgentTask): Promise<TaskSubmissionResult>;
  planAndExecute(userMessage: string, context?: Record<string, unknown>): Promise<AgentResult>;
  getTaskStatus(taskId: string): Promise<AgentTask | null>;
  cancelTask(taskId: string): Promise<boolean>;
  getAgentStatus(role: AgentRole): AgentState;
  getOrchestratorState(): OrchestratorState;
  pause(): Promise<void>;
  resume(): Promise<void>;
  shutdown(): Promise<void>;
}

export class AgentOrchestrator implements IAgentOrchestrator {
  private _status: OrchestratorState['status'] = 'idle';
  private _context: AgentContext | null = null;
  private _agents: Map<AgentRole, BaseAgent> = new Map();
  private _agentConfigs: Map<AgentRole, AgentConfig> = new Map();
  private _taskQueue: AgentTask[] = [];
  private _runningTasks: Map<string, AgentTask> = new Map();
  private _completedTasks: Map<string, AgentResult> = new Map();
  private _failedTasks: Map<string, { task: AgentTask; error: Error }> = new Map();
  private _messageBus: MessageBus;
  private _config: OrchestratorConfig;
  private _plannerAgent: PlannerAgent;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this._config = {
      maxConcurrentTasks: 4,
      taskTimeout: 120000,
      retryAttempts: 3,
      enableParallelExecution: true,
      ...config,
    };

    this._messageBus = new MessageBus(config.messageBusConfig);
    this._plannerAgent = new PlannerAgent();
  }

  async initialize(context: AgentContext): Promise<void> {
    this._context = context;
    this._status = 'idle';

    for (const [role, agent] of this._agents) {
      await agent.initialize(context);
    }

    this._messageBus.start();

    this.log('Orchestrator initialized');
  }

  registerAgent(agent: BaseAgent, config: AgentConfig): void {
    if (this._agents.has(agent.role)) {
      throw new Error(`Agent with role ${agent.role} is already registered`);
    }

    this._agents.set(agent.role, agent);
    this._agentConfigs.set(agent.role, config);

    this.log(`Agent registered: ${agent.role}`);
  }

  unregisterAgent(role: AgentRole): boolean {
    const agent = this._agents.get(role);
    if (!agent) {
      return false;
    }

    if (agent.status === 'running') {
      throw new Error(`Cannot unregister running agent: ${role}`);
    }

    this._agents.delete(role);
    this._agentConfigs.delete(role);

    this.log(`Agent unregistered: ${role}`);
    return true;
  }

  async submitTask(task: AgentTask): Promise<TaskSubmissionResult> {
    if (!this._context) {
      return {
        taskId: task.id,
        status: 'rejected',
        message: 'Orchestrator not initialized',
      };
    }

    if (this._status === 'paused') {
      return {
        taskId: task.id,
        status: 'queued',
        message: 'Orchestrator is paused, task queued',
        estimatedStartTime: Date.now() + 60000,
      };
    }

    if (!task.assignedAgent) {
      const assignedRole = this.routeTask(task);
      if (!assignedRole) {
        return {
          taskId: task.id,
          status: 'rejected',
          message: 'No suitable agent available for this task type',
        };
      }
      task.assignedAgent = assignedRole;
    }

    const agent = this._agents.get(task.assignedAgent);
    if (!agent) {
      return {
        taskId: task.id,
        status: 'rejected',
        message: `Agent ${task.assignedAgent} not found`,
      };
    }

    if (this._runningTasks.size >= this._config.maxConcurrentTasks) {
      this._taskQueue.push(task);
      return {
        taskId: task.id,
        status: 'queued',
        message: 'Task queued due to max concurrent tasks limit',
        estimatedStartTime: this.estimateQueueTime(),
      };
    }

    await this.executeTask(task);

    return {
      taskId: task.id,
      status: 'accepted',
      message: 'Task accepted and started',
    };
  }

  async planAndExecute(userMessage: string, context?: Record<string, unknown>): Promise<AgentResult> {
    if (!this._context) {
      return {
        taskId: `plan-${Date.now()}`,
        agent: 'planner',
        status: 'failed',
        output: {},
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          filesModified: 0,
          testsGenerated: 0,
        },
        suggestions: ['Orchestrator not initialized'],
      };
    }

    const planTask: AgentTask = {
      id: `plan-${Date.now()}`,
      type: 'decompose',
      description: `Plan: ${userMessage.slice(0, 100)}`,
      priority: 'high',
      status: 'pending',
      input: {
        userMessage,
        context: context || {},
      },
      dependencies: [],
      constraints: {
        timeout: this._config.taskTimeout,
        maxRetries: this._config.retryAttempts,
      },
      metadata: {
        source: 'user',
        conversationId: this._context.conversationId,
        projectId: this._context.projectId,
        tags: ['planning'],
      },
      createdAt: Date.now(),
    };

    this._status = 'running';

    try {
      const planResult = await this._plannerAgent.execute(planTask);

      if (planResult.status !== 'success') {
        return planResult;
      }

      const plan = planResult.output.plan as {
        tasks: TaskDefinition[];
        recommendedSequence: string[];
      };

      if (!plan || !plan.tasks || plan.tasks.length === 0) {
        return {
          ...planResult,
          suggestions: ['无法生成执行计划，请提供更详细的需求描述'],
        };
      }

      const executionResults: AgentResult[] = [];
      const taskMap = new Map<string, TaskDefinition>();
      for (const taskDef of plan.tasks) {
        taskMap.set(taskDef.id, taskDef);
      }

      for (const taskId of plan.recommendedSequence) {
        const taskDef = taskMap.get(taskId);
        if (!taskDef) continue;

        const agentTask: AgentTask = {
          id: taskDef.id,
          type: taskDef.type,
          description: taskDef.description,
          priority: taskDef.priority,
          status: 'pending',
          input: {
            userMessage,
            context: context || {},
            parameters: { taskDefinition: taskDef },
          },
          dependencies: taskDef.dependencies || [],
          constraints: {
            timeout: this._config.taskTimeout,
            maxRetries: this._config.retryAttempts,
          },
          metadata: {
            source: 'agent',
            conversationId: this._context.conversationId,
            projectId: this._context.projectId,
            tags: [taskDef.type],
          },
          createdAt: Date.now(),
        };

        const assignedRole = this.routeTaskByType(taskDef.type);
        if (!assignedRole) {
          continue;
        }

        agentTask.assignedAgent = assignedRole;

        const agent = this._agents.get(assignedRole);
        if (!agent) {
          continue;
        }

        try {
          const result = await agent.execute(agentTask);
          executionResults.push(result);

          if (result.status === 'failed') {
            this.log(`Task ${taskDef.id} failed, stopping execution`, 'error');
            break;
          }
        } catch (error) {
          this.log(`Task ${taskDef.id} error: ${(error as Error).message}`, 'error');
          break;
        }
      }

      const finalResult = executionResults[executionResults.length - 1] || planResult;

      return {
        ...finalResult,
        output: {
          ...finalResult.output,
          plan: planResult.output.plan,
          executionResults: executionResults.map(r => ({
            taskId: r.taskId,
            status: r.status,
            agent: r.agent,
          })),
        },
        suggestions: [
          ...(finalResult.suggestions || []),
          `执行完成: ${executionResults.length}/${plan.tasks.length} 任务`,
        ],
      };
    } catch (error) {
      return {
        taskId: planTask.id,
        agent: 'planner',
        status: 'failed',
        output: {},
        metrics: {
          executionTime: 0,
          tokensUsed: 0,
          filesModified: 0,
          testsGenerated: 0,
        },
        suggestions: [`规划执行失败: ${(error as Error).message}`],
      };
    } finally {
      if (this._runningTasks.size === 0 && this._taskQueue.length === 0) {
        this._status = 'idle';
      }
    }
  }

  async getTaskStatus(taskId: string): Promise<AgentTask | null> {
    const runningTask = this._runningTasks.get(taskId);
    if (runningTask) {
      return runningTask;
    }

    const queuedTask = this._taskQueue.find((t) => t.id === taskId);
    if (queuedTask) {
      return queuedTask;
    }

    const completedResult = this._completedTasks.get(taskId);
    if (completedResult) {
      return {
        id: taskId,
        status: 'completed',
        description: 'Task completed',
        type: 'generate' as const,
        priority: 'medium' as const,
        input: { userMessage: '', context: {} },
        dependencies: [],
        constraints: { timeout: 0, maxRetries: 0 },
        metadata: { source: 'user' as const, conversationId: '', projectId: '', tags: [] },
        createdAt: Date.now(),
        completedAt: Date.now(),
      };
    }

    return null;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const runningTask = this._runningTasks.get(taskId);
    if (runningTask && runningTask.assignedAgent) {
      const agent = this._agents.get(runningTask.assignedAgent);
      if (agent) {
        await agent.cancel(taskId);
        this._runningTasks.delete(taskId);
        this.log(`Task cancelled: ${taskId}`);
        return true;
      }
    }

    const queueIndex = this._taskQueue.findIndex((t) => t.id === taskId);
    if (queueIndex !== -1) {
      this._taskQueue.splice(queueIndex, 1);
      this.log(`Task removed from queue: ${taskId}`);
      return true;
    }

    return false;
  }

  getAgentStatus(role: AgentRole): AgentState {
    const agent = this._agents.get(role);
    if (!agent) {
      throw new Error(`Agent ${role} not found`);
    }
    return agent.getState();
  }

  getOrchestratorState(): OrchestratorState {
    const agentStates = new Map<AgentRole, AgentState>();
    for (const [role, agent] of this._agents) {
      agentStates.set(role, agent.getState());
    }

    return {
      status: this._status,
      activeTasks: this._runningTasks.size,
      queuedTasks: this._taskQueue.length,
      completedTasks: this._completedTasks.size,
      failedTasks: this._failedTasks.size,
      agents: agentStates,
    };
  }

  async pause(): Promise<void> {
    this._status = 'paused';
    this.log('Orchestrator paused');
  }

  async resume(): Promise<void> {
    this._status = 'running';
    this.log('Orchestrator resumed');
    await this.processQueue();
  }

  async shutdown(): Promise<void> {
    this._status = 'idle';

    for (const [taskId, task] of this._runningTasks) {
      if (task.assignedAgent) {
        const agent = this._agents.get(task.assignedAgent);
        if (agent) {
          await agent.cancel(taskId);
        }
      }
    }

    for (const [role, agent] of this._agents) {
      await agent.shutdown();
    }

    this._messageBus.stop();

    this._runningTasks.clear();
    this._taskQueue = [];

    this.log('Orchestrator shutdown complete');
  }

  private async executeTask(task: AgentTask): Promise<void> {
    if (!task.assignedAgent) {
      this.log(`Task ${task.id} has no assigned agent`, 'error');
      return;
    }

    const agent = this._agents.get(task.assignedAgent);
    if (!agent) {
      this.log(`Agent ${task.assignedAgent} not found`, 'error');
      return;
    }

    this._runningTasks.set(task.id, task);
    this._status = 'running';
    task.status = 'running';
    task.startedAt = Date.now();

    try {
      const result = await agent.execute(task);

      if (result.status === 'success' || result.status === 'partial') {
        this._completedTasks.set(task.id, result);
        task.status = 'completed';
        task.completedAt = Date.now();
        this.log(`Task completed: ${task.id}`);
      } else {
        this._failedTasks.set(task.id, { task, error: new Error('Task failed') });
        task.status = 'failed';
        this.log(`Task failed: ${task.id}`, 'error');
      }
    } catch (error) {
      this._failedTasks.set(task.id, { task, error: error as Error });
      task.status = 'failed';
      task.error = {
        code: 'EXECUTION_ERROR',
        message: (error as Error).message,
        recoverable: true,
        retryCount: 0,
        timestamp: Date.now(),
      };
      this.log(`Task error: ${task.id} - ${(error as Error).message}`, 'error');
    } finally {
      this._runningTasks.delete(task.id);

      if (this._runningTasks.size === 0 && this._taskQueue.length === 0) {
        this._status = 'idle';
      }

      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this._status === 'paused') {
      return;
    }

    while (
      this._taskQueue.length > 0 &&
      this._runningTasks.size < this._config.maxConcurrentTasks
    ) {
      const task = this._taskQueue.shift();
      if (task) {
        await this.executeTask(task);
      }
    }
  }

  private routeTask(task: AgentTask): AgentRole | null {
    const typeToRole: Record<string, AgentRole> = {
      decompose: 'planner',
      generate: 'coder',
      refactor: 'coder',
      fix: 'coder',
      test: 'tester',
      review: 'reviewer',
    };

    return typeToRole[task.type] ?? null;
  }

  private routeTaskByType(taskType: string): AgentRole | null {
    const typeToRole: Record<string, AgentRole> = {
      decompose: 'planner',
      generate: 'coder',
      refactor: 'coder',
      fix: 'coder',
      test: 'tester',
      review: 'reviewer',
    };

    return typeToRole[taskType] ?? null;
  }

  private estimateQueueTime(): number {
    const avgTaskTime = 30000;
    const queuePosition = this._taskQueue.length;
    const availableSlots = Math.max(1, this._config.maxConcurrentTasks - this._runningTasks.size);
    return Date.now() + (queuePosition / availableSlots) * avgTaskTime;
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [ORCHESTRATOR]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
}

export function createOrchestrator(config?: Partial<OrchestratorConfig>): AgentOrchestrator {
  return new AgentOrchestrator(config);
}
