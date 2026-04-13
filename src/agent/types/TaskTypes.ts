/**
 * @file: TaskTypes.ts
 * @description: Multi-Agent 系统任务类型定义
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,task,types,scheduler
 */

import type {
  AgentRole,
  TaskPriority,
  TaskStatus,
  TaskType,
  AgentArtifact,
} from './AgentTypes';

export interface AgentTask {
  id: string;
  parentTaskId?: string;
  type: TaskType;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgent?: AgentRole;
  input: TaskInput;
  output?: TaskOutput;
  dependencies: string[];
  constraints: TaskConstraints;
  metadata: TaskMetadata;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: TaskError;
}

export interface TaskInput {
  userMessage: string;
  context: Record<string, unknown>;
  files?: Record<string, string>;
  parameters?: Record<string, unknown>;
}

export interface TaskOutput {
  result: Record<string, unknown>;
  artifacts?: AgentArtifact[];
  summary: string;
  metrics: TaskMetrics;
}

export interface TaskMetrics {
  executionTime: number;
  tokensUsed: number;
  llmCalls: number;
  retries: number;
}

export interface TaskConstraints {
  timeout: number;
  maxRetries: number;
  requiredTools?: string[];
  excludedTools?: string[];
  modelPreference?: string;
  maxTokens?: number;
}

export interface TaskMetadata {
  source: 'user' | 'agent' | 'system';
  conversationId: string;
  projectId: string;
  userId?: string;
  tags: string[];
  customInstructions?: string;
}

export interface TaskError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  retryCount: number;
  timestamp: number;
}

export interface TaskPlan {
  id: string;
  goal: string;
  tasks: AgentTask[];
  dependencies: TaskDependencyGraph;
  executionOrder: string[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface TaskDependencyGraph {
  nodes: TaskNode[];
  edges: TaskEdge[];
}

export interface TaskNode {
  taskId: string;
  type: TaskType;
  status: TaskStatus;
  level: number;
}

export interface TaskEdge {
  from: string;
  to: string;
  type: 'hard' | 'soft';
}

export interface TaskQueue {
  pending: AgentTask[];
  running: AgentTask[];
  completed: AgentTask[];
  failed: AgentTask[];
}

export interface TaskSchedulerConfig {
  maxConcurrentTasks: number;
  defaultTimeout: number;
  defaultMaxRetries: number;
  priorityWeights: Record<TaskPriority, number>;
  retryDelayMs: number;
  maxQueueSize: number;
}

export interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  output?: TaskOutput;
  error?: TaskError;
  duration: number;
  agentUsed: AgentRole;
}

export interface TaskProgress {
  taskId: string;
  status: TaskStatus;
  progress: number;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  estimatedTimeRemaining: number;
  logs: TaskLogEntry[];
}

export interface TaskLogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface TaskValidation {
  isValid: boolean;
  errors: TaskValidationError[];
  warnings: TaskValidationWarning[];
}

export interface TaskValidationError {
  field: string;
  message: string;
  code: string;
}

export interface TaskValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

export const TASK_TYPE_NAMES: Record<TaskType, string> = {
  decompose: '任务分解',
  generate: '代码生成',
  modify: '代码修改',
  test: '测试生成',
  review: '代码审查',
  refactor: '代码重构',
  fix: 'Bug 修复',
};

export const TASK_STATUS_NAMES: Record<TaskStatus, string> = {
  pending: '待执行',
  running: '执行中',
  completed: '已完成',
  failed: '执行失败',
  cancelled: '已取消',
};

export const TASK_PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  high: 100,
  medium: 50,
  low: 10,
};

export const DEFAULT_TASK_SCHEDULER_CONFIG: TaskSchedulerConfig = {
  maxConcurrentTasks: 4,
  defaultTimeout: 120000,
  defaultMaxRetries: 3,
  priorityWeights: TASK_PRIORITY_WEIGHTS,
  retryDelayMs: 1000,
  maxQueueSize: 100,
};

export function createTask(
  type: TaskType,
  description: string,
  input: TaskInput,
  options?: Partial<
    Pick<
      AgentTask,
      'parentTaskId' | 'priority' | 'dependencies' | 'constraints' | 'metadata'
    >
  >
): AgentTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    description,
    priority: options?.priority ?? 'medium',
    status: 'pending',
    input,
    dependencies: options?.dependencies ?? [],
    constraints: options?.constraints ?? {
      timeout: DEFAULT_TASK_SCHEDULER_CONFIG.defaultTimeout,
      maxRetries: DEFAULT_TASK_SCHEDULER_CONFIG.defaultMaxRetries,
    },
    metadata: options?.metadata ?? {
      source: 'user',
      conversationId: '',
      projectId: '',
      tags: [],
    },
    createdAt: Date.now(),
  };
}

export function validateTask(task: AgentTask): TaskValidation {
  const errors: TaskValidationError[] = [];
  const warnings: TaskValidationWarning[] = [];

  if (!task.description || task.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: '任务描述不能为空',
      code: 'EMPTY_DESCRIPTION',
    });
  }

  if (!task.input.userMessage || task.input.userMessage.trim().length === 0) {
    errors.push({
      field: 'input.userMessage',
      message: '用户消息不能为空',
      code: 'EMPTY_USER_MESSAGE',
    });
  }

  if (task.constraints.timeout <= 0) {
    errors.push({
      field: 'constraints.timeout',
      message: '超时时间必须大于 0',
      code: 'INVALID_TIMEOUT',
    });
  }

  if (task.dependencies.includes(task.id)) {
    errors.push({
      field: 'dependencies',
      message: '任务不能依赖自身',
      code: 'CIRCULAR_DEPENDENCY',
    });
  }

  if (task.description.length > 500) {
    warnings.push({
      field: 'description',
      message: '任务描述过长，可能影响处理效率',
      suggestion: '建议将任务描述控制在 500 字符以内',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function calculateTaskPriority(
  task: AgentTask,
  queueLength: number
): number {
  const baseWeight = TASK_PRIORITY_WEIGHTS[task.priority];
  const ageBonus = Math.floor((Date.now() - task.createdAt) / 60000);
  const queuePenalty = queueLength * 0.1;
  return Math.max(0, baseWeight + ageBonus - queuePenalty);
}
