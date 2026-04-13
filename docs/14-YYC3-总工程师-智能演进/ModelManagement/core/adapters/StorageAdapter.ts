/**
 * @file core/adapters/StorageAdapter.ts
 * @description 存储系统适配器
 */

export interface IStorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class LocalStorageAdapter implements IStorageAdapter {
  private prefix: string;
  
  constructor(prefix: string = "yyc3-") {
    this.prefix = prefix;
  }
  
  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.prefix}${key}`;
    const value = localStorage.getItem(fullKey);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    const serialized = typeof value === "string" 
      ? value 
      : JSON.stringify(value);
    
    localStorage.setItem(fullKey, serialized);
  }
  
  async remove(key: string): Promise<void> {
    localStorage.removeItem(`${this.prefix}${key}`);
  }
  
  async clear(): Promise<void> {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix));
    
    keys.forEach(k => localStorage.removeItem(k));
  }
}