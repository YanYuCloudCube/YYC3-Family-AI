/**
 * @file core/EventBus.ts
 * @description 事件总线 - 提供类型安全的事件发布订阅机制
 *              支持事件优先级、异步处理、错误隔离
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags events,bus,pub-sub,typescript
 */

export interface EventHandler<T = unknown> {
  (data: T): void | Promise<void>;
}

export interface EventSubscription {
  unsubscribe: () => void;
  isActive: boolean;
}

export interface EventBusConfig {
  /** 最大监听器数量 */
  maxListeners?: number;
  /** 是否启用错误隔离 */
  enableErrorIsolation?: boolean;
  /** 是否启用事件日志 */
  enableLogging?: boolean;
}

export interface EventMetadata {
  timestamp: number;
  source?: string;
  priority?: number;
}

export interface PrioritizedEvent<T = unknown> {
  data: T;
  metadata: EventMetadata;
}

export class EventBus<TEventMap extends Record<string, unknown> = Record<string, unknown>> {
  private listeners = new Map<keyof TEventMap, Set<EventHandler<unknown>>>();
  private onceListeners = new Map<keyof TEventMap, Set<EventHandler<unknown>>>();
  private config: EventBusConfig;
  private eventHistory: Array<{ event: string; data: unknown; metadata: EventMetadata }> = [];
  private maxHistorySize = 100;

  constructor(config: EventBusConfig = {}) {
    this.config = {
      maxListeners: 100,
      enableErrorIsolation: true,
      enableLogging: import.meta.env.DEV,
      ...config,
    };
  }

  on<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>
  ): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlers = this.listeners.get(event)!;
    if (handlers.size >= (this.config.maxListeners || 100)) {
      console.warn(`[EventBus] Max listeners reached for event "${String(event)}"`);
    }

    handlers.add(handler as EventHandler<unknown>);

    return {
      unsubscribe: () => this.off(event, handler),
      isActive: true,
    };
  }

  once<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>
  ): EventSubscription {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }

    const onceHandler: EventHandler<TEventMap[K]> = async (data) => {
      await handler(data);
      this.off(event, onceHandler);
    };

    this.onceListeners.get(event)!.add(onceHandler as EventHandler<unknown>);

    return {
      unsubscribe: () => this.off(event, onceHandler),
      isActive: true,
    };
  }

  off<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>
  ): void {
    this.listeners.get(event)?.delete(handler as EventHandler<unknown>);
    this.onceListeners.get(event)?.delete(handler as EventHandler<unknown>);
  }

  emit<K extends keyof TEventMap>(
    event: K,
    data: TEventMap[K],
    metadata?: Partial<EventMetadata>
  ): void {
    const fullMetadata: EventMetadata = {
      timestamp: Date.now(),
      ...metadata,
    };

    if (this.config.enableLogging) {
      console.log(`[EventBus] Emitting "${String(event)}":`, data);
    }

    this.addToHistory(event, data, fullMetadata);

    const handlers = [
      ...(this.listeners.get(event) || []),
      ...(this.onceListeners.get(event) || []),
    ];

    for (const handler of handlers) {
      this.executeHandler(handler, data, event, fullMetadata);
    }
  }

  emitAsync<K extends keyof TEventMap>(
    event: K,
    data: TEventMap[K],
    metadata?: Partial<EventMetadata>
  ): Promise<void> {
    const fullMetadata: EventMetadata = {
      timestamp: Date.now(),
      ...metadata,
    };

    if (this.config.enableLogging) {
      console.log(`[EventBus] Emitting async "${String(event)}":`, data);
    }

    this.addToHistory(event, data, fullMetadata);

    const handlers = [
      ...(this.listeners.get(event) || []),
      ...(this.onceListeners.get(event) || []),
    ];

    const promises = handlers.map((handler) =>
      this.executeHandler(handler, data, event, fullMetadata)
    );

    return Promise.all(promises).then(() => {});
  }

  emitPrioritized<K extends keyof TEventMap>(
    event: K,
    prioritizedEvent: PrioritizedEvent<TEventMap[K]>
  ): void {
    this.emit(event, prioritizedEvent.data, prioritizedEvent.metadata);
  }

  clear(event?: keyof TEventMap): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  listenerCount(event?: keyof TEventMap): number {
    if (event) {
      return (
        (this.listeners.get(event)?.size || 0) +
        (this.onceListeners.get(event)?.size || 0)
      );
    }

    let total = 0;
    for (const handlers of this.listeners.values()) {
      total += handlers.size;
    }
    for (const handlers of this.onceListeners.values()) {
      total += handlers.size;
    }
    return total;
  }

  getHistory(): Array<{ event: string; data: unknown; metadata: EventMetadata }> {
    return [...this.eventHistory];
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  private async executeHandler<T>(
    handler: EventHandler<T>,
    data: T,
    event: keyof TEventMap,
    metadata: EventMetadata
  ): Promise<void> {
    try {
      await handler(data);
    } catch (error) {
      if (this.config.enableErrorIsolation) {
        console.error(
          `[EventBus] Error in handler for "${String(event)}":`,
          error
        );
      } else {
        throw error;
      }
    }
  }

  private addToHistory<K extends keyof TEventMap>(
    event: K,
    data: TEventMap[K],
    metadata: EventMetadata
  ): void {
    this.eventHistory.push({
      event: String(event),
      data,
      metadata,
    });

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

let globalEventBus: EventBus | null = null;

export function getEventBus<TEventMap extends Record<string, unknown> = Record<string, unknown>>(
  config?: EventBusConfig
): EventBus<TEventMap> {
  if (!globalEventBus) {
    globalEventBus = new EventBus(config);
  }
  return globalEventBus as EventBus<TEventMap>;
}

export function resetEventBus(): void {
  if (globalEventBus) {
    globalEventBus.clear();
    globalEventBus.clearHistory();
    globalEventBus = null;
  }
}

export function createTypedEventBus<TEventMap extends Record<string, unknown>>(
  config?: EventBusConfig
): EventBus<TEventMap> {
  return new EventBus<TEventMap>(config);
}
