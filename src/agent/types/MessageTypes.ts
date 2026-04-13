/**
 * @file: MessageTypes.ts
 * @description: Multi-Agent 系统消息类型定义
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,message,types,communication
 */

import type { AgentRole, MessageType, TaskStatus } from './AgentTypes';

export interface AgentMessage {
  id: string;
  from: AgentRole | 'orchestrator' | 'user';
  to: AgentRole | 'orchestrator' | 'broadcast';
  type: MessageType;
  payload: MessagePayload;
  timestamp: number;
  correlationId?: string;
  replyTo?: string;
  priority: 'high' | 'normal' | 'low';
  ttl?: number;
  metadata?: Record<string, unknown>;
}

export interface MessagePayload {
  task?: TaskPayload;
  result?: ResultPayload;
  query?: QueryPayload;
  error?: ErrorPayload;
  sync?: SyncPayload;
  heartbeat?: HeartbeatPayload;
}

export interface TaskPayload {
  taskId: string;
  taskType: string;
  description: string;
  input: Record<string, unknown>;
  context: Record<string, unknown>;
  constraints?: MessageTaskConstraints;
}

export interface MessageTaskConstraints {
  timeout?: number;
  maxRetries?: number;
  dependencies?: string[];
  requiredTools?: string[];
}

export interface ResultPayload {
  taskId: string;
  status: TaskStatus;
  output: Record<string, unknown>;
  artifacts?: Record<string, unknown>[];
  metrics?: ResultMetricsPayload;
  nextSteps?: string[];
}

export interface ResultMetricsPayload {
  executionTime: number;
  tokensUsed: number;
  filesModified: number;
  testsGenerated?: number;
}

export interface QueryPayload {
  queryId: string;
  queryType: 'context' | 'status' | 'memory' | 'tool';
  query: string;
  parameters?: Record<string, unknown>;
}

export interface ErrorPayload {
  taskId?: string;
  errorCode: string;
  errorMessage: string;
  errorDetails?: Record<string, unknown>;
  recoverable: boolean;
  suggestedAction?: string;
}

export interface SyncPayload {
  syncType: 'state' | 'context' | 'memory' | 'config';
  data: Record<string, unknown>;
  version: number;
}

export interface HeartbeatPayload {
  agentId: string;
  status: string;
  currentTaskId?: string;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    queueLength: number;
  };
}

export interface MessageEnvelope {
  message: AgentMessage;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
  status: 'pending' | 'delivered' | 'failed' | 'expired';
}

export interface MessageQueueConfig {
  maxSize: number;
  defaultTTL: number;
  maxRetries: number;
  retryDelay: number;
  priorityLevels: number;
}

export interface MessageHandler {
  (message: AgentMessage): Promise<void> | void;
}

export interface MessageFilter {
  from?: AgentRole | 'orchestrator' | 'user';
  to?: AgentRole | 'orchestrator' | 'broadcast';
  type?: MessageType | MessageType[];
  correlationId?: string;
  timeRange?: {
    start: number;
    end: number;
  };
}

export interface MessageSubscription {
  id: string;
  filter: MessageFilter;
  handler: MessageHandler;
  active: boolean;
  createdAt: number;
}

export const MESSAGE_TYPE_NAMES: Record<MessageType, string> = {
  task: '任务分配',
  result: '结果返回',
  query: '信息查询',
  error: '错误报告',
  sync: '状态同步',
  heartbeat: '心跳检测',
};

export const DEFAULT_MESSAGE_QUEUE_CONFIG: MessageQueueConfig = {
  maxSize: 1000,
  defaultTTL: 300000,
  maxRetries: 3,
  retryDelay: 1000,
  priorityLevels: 3,
};

export function createMessage(
  from: AgentMessage['from'],
  to: AgentMessage['to'],
  type: MessageType,
  payload: MessagePayload,
  options?: Partial<Pick<AgentMessage, 'correlationId' | 'replyTo' | 'priority' | 'ttl' | 'metadata'>>
): AgentMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    from,
    to,
    type,
    payload,
    timestamp: Date.now(),
    priority: options?.priority ?? 'normal',
    ...options,
  };
}

export function createTaskMessage(
  from: AgentMessage['from'],
  to: AgentRole,
  task: TaskPayload,
  options?: Partial<Pick<AgentMessage, 'correlationId' | 'priority' | 'ttl'>>
): AgentMessage {
  return createMessage(from, to, 'task', { task }, options);
}

export function createResultMessage(
  from: AgentRole,
  to: AgentMessage['to'],
  result: ResultPayload,
  options?: Partial<Pick<AgentMessage, 'correlationId' | 'replyTo'>>
): AgentMessage {
  return createMessage(from, to, 'result', { result }, options);
}

export function createErrorMessage(
  from: AgentRole | 'orchestrator',
  to: AgentMessage['to'],
  error: ErrorPayload,
  options?: Partial<Pick<AgentMessage, 'correlationId' | 'replyTo'>>
): AgentMessage {
  return createMessage(from, to, 'error', { error }, { priority: 'high', ...options });
}
