/**
 * @file core/StateManager.ts
 * @description 状态管理器 - 统一管理所有 Zustand stores
 *              提供类型安全的状态访问和订阅机制
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags state,zustand,management,typescript
 */

import type { StoreApi } from 'zustand';
import { shallow } from 'zustand/shallow';

export interface StateManagerConfig {
  /** 是否启用开发模式日志 */
  enableDevTools?: boolean;
  /** 是否启用状态持久化 */
  enablePersistence?: boolean;
  /** 状态变更回调 */
  onStateChange?: (storeName: string, prevState: unknown, newState: unknown) => void;
}

export interface StoreDescriptor<T> {
  name: string;
  store: StoreApi<T>;
  initialState: T;
}

export class StateManager {
  private stores = new Map<string, StoreDescriptor<unknown>>();
  private config: StateManagerConfig;
  private subscribers = new Map<string, Set<(state: unknown) => void>>();

  constructor(config: StateManagerConfig = {}) {
    this.config = {
      enableDevTools: import.meta.env.DEV,
      enablePersistence: true,
      ...config,
    };
  }

  registerStore<T>(
    name: string,
    store: StoreApi<T>,
    initialState: T
  ): void {
    if (this.stores.has(name)) {
      throw new Error(`Store "${name}" already registered`);
    }

    this.stores.set(name, { name, store, initialState });

    if (this.config.enableDevTools) {
      this.setupDevTools(name, store);
    }

    if (this.config.onStateChange) {
      store.subscribe((state) => {
        this.config.onStateChange!(name, initialState, state);
      });
    }
  }

  unregisterStore(name: string): boolean {
    return this.stores.delete(name);
  }

  getStore<T>(name: string): StoreApi<T> | undefined {
    return this.stores.get(name)?.store as StoreApi<T>;
  }

  getState<T>(name: string): T | undefined {
    return this.stores.get(name)?.store.getState() as T;
  }

  setState<T>(name: string, partial: Partial<T>): void {
    const store = this.stores.get(name)?.store;
    if (store) {
      store.setState(partial as Partial<T>);
    }
  }

  subscribe<T>(
    name: string,
    callback: (state: T) => void,
    options?: { selector?: (state: T) => unknown; equalityFn?: (a: unknown, b: unknown) => boolean }
  ): () => void {
    const descriptor = this.stores.get(name);
    if (!descriptor) {
      throw new Error(`Store "${name}" not found`);
    }

    const store = descriptor.store as StoreApi<T>;
    const { selector } = options || {};

    const unsubscribe = store.subscribe(
      selector
        ? (state, prevState) => {
            const selected = selector(state);
            callback(selected as T);
          }
        : (state) => callback(state)
    );

    return unsubscribe;
  }

  resetStore(name: string): void {
    const descriptor = this.stores.get(name);
    if (descriptor) {
      descriptor.store.setState(descriptor.initialState);
    }
  }

  resetAllStores(): void {
    for (const descriptor of this.stores.values()) {
      descriptor.store.setState(descriptor.initialState);
    }
  }

  getStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }

  getStoreInfo(name: string): StoreDescriptor<unknown> | undefined {
    return this.stores.get(name);
  }

  getAllStoresInfo(): StoreDescriptor<unknown>[] {
    return Array.from(this.stores.values());
  }

  exportState(): Record<string, unknown> {
    const state: Record<string, unknown> = {};

    for (const [name, descriptor] of this.stores.entries()) {
      state[name] = descriptor.store.getState();
    }

    return state;
  }

  importState(state: Record<string, unknown>): void {
    for (const [name, value] of Object.entries(state)) {
      const store = this.stores.get(name);
      if (store) {
        store.store.setState(value);
      }
    }
  }

  private setupDevTools<T>(name: string, store: StoreApi<T>): void {
    if (typeof window === 'undefined' || !(window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      return;
    }

    const devtools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
      name: `YYC3-${name}`,
    });

    store.subscribe((state) => {
      devtools.send(`${name} update`, state);
    });
  }
}

let globalStateManager: StateManager | null = null;

export function getStateManager(config?: StateManagerConfig): StateManager {
  if (!globalStateManager) {
    globalStateManager = new StateManager(config);
  }
  return globalStateManager;
}

export function resetStateManager(): void {
  if (globalStateManager) {
    globalStateManager.resetAllStores();
  }
}

export function createStoreHelper<T>(name: string, store: StoreApi<T>, initialState: T) {
  const manager = getStateManager();
  manager.registerStore(name, store, initialState);

  return {
    use: (selector?: (state: T) => unknown) => {
      const storeApi = manager.getStore<T>(name)!;
      if (selector) {
        return selector(storeApi.getState());
      }
      return storeApi.getState();
    },
    getState: () => manager.getState<T>(name)!,
    setState: (partial: Partial<T>) => manager.setState(name, partial),
    subscribe: (callback: (state: T) => void) => manager.subscribe(name, callback),
    reset: () => manager.resetStore(name),
  };
}
