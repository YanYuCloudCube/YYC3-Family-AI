/**
 * @file: MessageBus.ts
 * @description: Multi-Agent 系统消息总线实现
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,message,bus,communication
 */

import type {
  AgentRole,
  AgentMessage,
  MessageType,
} from '../types';
import {
  createMessage,
  type MessageHandler,
  type MessageFilter,
  type MessageSubscription,
  type MessageQueueConfig,
  DEFAULT_MESSAGE_QUEUE_CONFIG,
} from '../types/MessageTypes';

export interface MessageBusConfig {
  maxQueueSize: number;
  defaultMessageTTL: number;
  enablePersistence: boolean;
  heartbeatInterval: number;
}

export interface MessageBusStats {
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesFailed: number;
  averageDeliveryTime: number;
  queueSize: number;
  subscriptionCount: number;
}

export class MessageBus {
  private _queue: AgentMessage[] = [];
  private _subscriptions: Map<string, MessageSubscription> = new Map();
  private _messageHistory: AgentMessage[] = [];
  private _running: boolean = false;
  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private _stats: MessageBusStats = {
    totalMessagesSent: 0,
    totalMessagesDelivered: 0,
    totalMessagesFailed: 0,
    averageDeliveryTime: 0,
    queueSize: 0,
    subscriptionCount: 0,
  };

  constructor(private readonly _config: Partial<MessageBusConfig> = {}) {
    const defaultConfig: MessageBusConfig = {
      maxQueueSize: 1000,
      defaultMessageTTL: 300000,
      enablePersistence: false,
      heartbeatInterval: 30000,
    };
    this._config = { ...defaultConfig, ..._config };
  }

  start(): void {
    if (this._running) {
      return;
    }

    this._running = true;
    this.startHeartbeat();
    this.log('MessageBus started');
  }

  stop(): void {
    if (!this._running) {
      return;
    }

    this._running = false;
    this.stopHeartbeat();
    this.log('MessageBus stopped');
  }

  send(message: AgentMessage): boolean {
    if (!this._running) {
      this.log('MessageBus not running, message rejected', 'warn');
      return false;
    }

    if (this._queue.length >= (this._config.maxQueueSize ?? 1000)) {
      this.log('Message queue full, message rejected', 'warn');
      return false;
    }

    this._queue.push(message);
    this._stats.totalMessagesSent++;
    this._stats.queueSize = this._queue.length;

    this.processQueue();

    return true;
  }

  broadcast(
    from: AgentMessage['from'],
    type: MessageType,
    payload: AgentMessage['payload']
  ): void {
    const message = createMessage(from, 'broadcast', type, payload);
    this.send(message);
  }

  subscribe(
    filter: MessageFilter,
    handler: MessageHandler
  ): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const subscription: MessageSubscription = {
      id: subscriptionId,
      filter,
      handler,
      active: true,
      createdAt: Date.now(),
    };

    this._subscriptions.set(subscriptionId, subscription);
    this._stats.subscriptionCount = this._subscriptions.size;

    this.log(`Subscription created: ${subscriptionId}`);
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): boolean {
    const result = this._subscriptions.delete(subscriptionId);
    this._stats.subscriptionCount = this._subscriptions.size;

    if (result) {
      this.log(`Subscription removed: ${subscriptionId}`);
    }

    return result;
  }

  getHistory(filter?: MessageFilter): AgentMessage[] {
    if (!filter) {
      return [...this._messageHistory];
    }

    return this._messageHistory.filter((msg) => this.matchesFilter(msg, filter));
  }

  getStats(): MessageBusStats {
    return { ...this._stats };
  }

  clearHistory(): void {
    this._messageHistory = [];
    this.log('Message history cleared');
  }

  private processQueue(): void {
    while (this._queue.length > 0) {
      const message = this._queue.shift();
      if (!message) break;

      const startTime = Date.now();

      try {
        this.deliverMessage(message);

        const deliveryTime = Date.now() - startTime;
        this._stats.totalMessagesDelivered++;
        this._stats.averageDeliveryTime =
          (this._stats.averageDeliveryTime * (this._stats.totalMessagesDelivered - 1) + deliveryTime) /
          this._stats.totalMessagesDelivered;

        this._messageHistory.push(message);

        if (this._messageHistory.length > 100) {
          this._messageHistory.shift();
        }
      } catch (error) {
        this._stats.totalMessagesFailed++;
        this.log(`Message delivery failed: ${(error as Error).message}`, 'error');
      }

      this._stats.queueSize = this._queue.length;
    }
  }

  private deliverMessage(message: AgentMessage): void {
    for (const [, subscription] of this._subscriptions) {
      if (!subscription.active) {
        continue;
      }

      if (this.matchesFilter(message, subscription.filter)) {
        try {
          subscription.handler(message);
        } catch (error) {
          this.log(`Handler error for subscription: ${(error as Error).message}`, 'error');
        }
      }
    }
  }

  private matchesFilter(message: AgentMessage, filter: MessageFilter): boolean {
    if (filter.from && message.from !== filter.from) {
      return false;
    }

    if (filter.to && message.to !== filter.to && message.to !== 'broadcast') {
      return false;
    }

    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      if (!types.includes(message.type)) {
        return false;
      }
    }

    if (filter.correlationId && message.correlationId !== filter.correlationId) {
      return false;
    }

    if (filter.timeRange) {
      if (message.timestamp < filter.timeRange.start || message.timestamp > filter.timeRange.end) {
        return false;
      }
    }

    return true;
  }

  private startHeartbeat(): void {
    if (this._heartbeatTimer) {
      return;
    }

    this._heartbeatTimer = setInterval(() => {
      this.broadcast('orchestrator', 'heartbeat', {
        heartbeat: {
          agentId: 'orchestrator',
          status: this._running ? 'running' : 'stopped',
          metrics: {
            cpuUsage: 0,
            memoryUsage: 0,
            queueLength: this._queue.length,
          },
        },
      });
    }, this._config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [MESSAGE_BUS]`;

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

export function createMessageBus(config?: Partial<MessageBusConfig>): MessageBus {
  return new MessageBus(config);
}
