/**
 * @file: browser-apis.ts
 * @description: 浏览器API Mock集合 - IndexedDB, localStorage, Crypto等
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-15
 * @status: dev
 * @license: MIT
 */

// ── IndexedDB Mock (Simplified for Testing) ─────────────

interface MockIDBObjectStore {
  data: Map<any, any>;
  keyPath?: string;
}

interface MockIDBRequest<T = any> {
  result: T | null;
  error: DOMException | null;
  source: any;
  readyState: 'pending' | 'done';
  onsuccess: ((ev: Event) => void) | null;
  onerror: ((ev: Event) => void) | null;
  transaction: any;
}

function createMockRequest<T = any>(): MockIDBRequest<T> {
  return {
    result: null,
    error: null,
    source: null,
    readyState: 'pending',
    onsuccess: null,
    onerror: null,
    transaction: null,
  };
}

export class MockIndexedDBFactory {
  private databases = new Map<string, { version: number; stores: Map<string, MockIDBObjectStore> }>();

  async open(name: string, version?: number): Promise<MockIDBDatabase> {
    const ver = version || 1;
    const existing = this.databases.get(name);
    
    if (existing && existing.version >= ver) {
      return new MockIDBDatabase(name, existing.version, existing.stores);
    }

    const stores = existing?.stores || new Map();
    this.databases.set(name, { version: ver, stores });
    
    return new MockIDBDatabase(name, ver, stores);
  }

  async deleteDatabase(name: string): Promise<void> {
    this.databases.delete(name);
  }
  
  reset(): void {
    this.databases.clear();
  }
}

export class MockIDBDatabase {
  name: string;
  version: number;
  private stores: Map<string, MockIDBObjectStore>;

  constructor(name: string, version: number, stores: Map<string, MockIDBObjectStore>) {
    this.name = name;
    this.version = version;
    this.stores = stores;
  }

  get objectStoreNames(): string[] {
    return Array.from(this.stores.keys());
  }

  createObjectStore(storeName: string, options?: { keyPath?: string; autoIncrement?: boolean }): MockIDBObjectStoreInstance {
    const store: MockIDBObjectStore = {
      data: new Map(),
      keyPath: options?.keyPath,
    };
    this.stores.set(storeName, store);
    return new MockIDBObjectStoreInstance(storeName, store);
  }

  deleteObjectStore(storeName: string): void {
    this.stores.delete(storeName);
  }

  transaction(storeNames: string | string[], mode: 'readonly' | 'readwrite' = 'readonly'): MockIDBTransaction {
    const names = typeof storeNames === 'string' ? [storeNames] : storeNames;
    return new MockIDBTransaction(mode, names, this.stores);
  }

  close(): void {}
}

export class MockIDBTransaction {
  mode: 'readonly' | 'readwrite';
  private storeNames: string[];
  private stores: Map<string, MockIDBObjectStore>;
  error: DOMException | null = null;

  constructor(mode: 'readonly' | 'readwrite', storeNames: string[], stores: Map<string, MockIDBObjectStore>) {
    this.mode = mode;
    this.storeNames = storeNames;
    this.stores = stores;
  }

  objectStore(name: string): MockIDBObjectStoreInstance {
    if (!this.storeNames.includes(name)) {
      throw new DOMException('Object store not found in transaction scope', 'NotFoundError');
    }
    const store = this.stores.get(name);
    if (!store) {
      throw new DOMException('Object store not found', 'NotFoundError');
    }
    return new MockIDBObjectStoreInstance(name, store);
  }

  abort(): void {}
  commit(): void {}
}

export class MockIDBObjectStoreInstance {
  name: string;
  keyPath: string | null;
  autoIncrement = false;
  private store: MockIDBObjectStore;
  private counter = 0;

  constructor(name: string, store: MockIDBObjectStore) {
    this.name = name;
    this.keyPath = store.keyPath || null;
    this.store = store;
  }

  add(value: any, key?: any): MockIDBRequest {
    const req = createMockRequest();
    setTimeout(() => {
      try {
        const finalKey = key !== undefined ? key : 
          (this.autoIncrement ? ++this.counter :
            (this.keyPath ? value[this.keyPath] : undefined));
        
        if (finalKey === undefined) {
          throw new DOMException('Key required', 'DataError');
        }
        
        if (this.store.data.has(finalKey)) {
          throw new DOMException('Key already exists', 'ConstraintError');
        }
        
        this.store.data.set(finalKey, value);
        req.result = finalKey;
        req.readyState = 'done';
        req.onsuccess?.(new Event('success') as any);
      } catch (e) {
        req.error = e as DOMException;
        req.onerror?.(new Event('error') as any);
      }
    }, 0);
    return req;
  }

  put(value: any, key?: any): MockIDBRequest {
    const req = createMockRequest();
    setTimeout(() => {
      try {
        const finalKey = key !== undefined ? key :
          (this.autoIncrement ? ++this.counter :
            (this.keyPath ? value[this.keyPath] : undefined));
        
        if (finalKey === undefined) {
          throw new DOMException('Key required', 'DataError');
        }
        
        this.store.data.set(finalKey, value);
        req.result = finalKey;
        req.readyState = 'done';
        req.onsuccess?.(new Event('success') as any);
      } catch (e) {
        req.error = e as DOMException;
        req.onerror?.(new Event('error') as any);
      }
    }, 0);
    return req;
  }

  get(key: any): MockIDBRequest {
    const req = createMockRequest();
    setTimeout(() => {
      req.result = this.store.data.get(key) || undefined;
      req.readyState = 'done';
      req.onsuccess?.(new Event('success') as any);
    }, 0);
    return req;
  }

  delete(key: any): MockIDBRequest {
    const req = createMockRequest();
    setTimeout(() => {
      this.store.data.delete(key);
      req.result = undefined;
      req.readyState = 'done';
      req.onsuccess?.(new Event('success') as any);
    }, 0);
    return req;
  }

  clear(): MockIDBRequest {
    const req = createMockRequest();
    setTimeout(() => {
      this.store.data.clear();
      req.result = undefined;
      req.readyState = 'done';
      req.onsuccess?.(new Event('success') as any);
    }, 0);
    return req;
  }

  getAll(): MockIDBRequest<any[]> {
    const req = createMockRequest<any[]>();
    setTimeout(() => {
      req.result = Array.from(this.store.data.values());
      req.readyState = 'done';
      req.onsuccess?.(new Event('success') as any);
    }, 0);
    return req;
  }

  count(): MockIDBRequest<number> {
    const req = createMockRequest<number>();
    setTimeout(() => {
      req.result = this.store.data.size;
      req.readyState = 'done';
      req.onsuccess?.(new Event('success') as any);
    }, 0);
    return req;
  }
}

// ── localStorage Enhanced Mock ──────────────────────────

export function createEnhancedLocalStorage(): Storage & { _store: Record<string, string> } {
  const store: Record<string, string> = {};
  
  const mockStorage: Storage & { _store: Record<string, string> } = {
    _store: store,
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      Object.keys(store).forEach(key => delete store[key]);
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
  };
  
  return mockStorage;
}

// ── Web Crypto API Helpers ──────────────────────────────

export async function setupTestCrypto(): Promise<void> {
  try {
    const { webcrypto } = await import('node:crypto');
    (globalThis as any).crypto = webcrypto;
  } catch {
    console.warn('[Mock] Web Crypto not available');
  }
}

// ── Fetch API Mock Helpers ───────────────────────────────

export interface MockFetchResponse {
  status: number;
  statusText: string;
  ok: boolean;
  headers: Record<string, string>;
  body: any;
  json(): Promise<any>;
  text(): Promise<string>;
}

export function createMockFetchResponse(options: Partial<MockFetchResponse> = {}): MockFetchResponse {
  return {
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    ok: (options.status || 200) >= 200 && (options.status || 200) < 300,
    headers: options.headers || {},
    body: options.body ?? null,
    json: async () => options.body ?? {},
    text: async () => JSON.stringify(options.body ?? ''),
  };
}

// ── Export Singleton Instances ──────────────────────────

export const mockIndexedDB = new MockIndexedDBFactory();

export default {
  MockIndexedDBFactory,
  MockIDBDatabase,
  MockIDBTransaction,
  MockIDBObjectStoreInstance,
  createEnhancedLocalStorage,
  setupTestCrypto,
  createMockFetchResponse,
  mockIndexedDB,
};
