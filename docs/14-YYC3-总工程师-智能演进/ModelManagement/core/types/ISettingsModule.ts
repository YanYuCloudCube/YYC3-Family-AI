/**
 * @file core/types/ISettingsModule.ts
 * @description 设置模块统一接口定义
 */

import type { ReactNode } from "react";

export type ModuleCategory = 
  | "ai" 
  | "workflow" 
  | "tool" 
  | "integration" 
  | "system"
  | "user";

export type ModuleStatus = "idle" | "loading" | "active" | "error";

export interface ModuleMeta {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: ModuleCategory;
  version: string;
  author: string;
  tags: string[];
  order: number;
}

export interface ModuleConfig {
  enabled: boolean;
  visible: boolean;
  permissions: string[];
  dependencies: string[];
  storageKey?: string;
}

export interface ModuleState<T = any> {
  data: T;
  status: ModuleStatus;
  error?: string;
  lastUpdated?: number;
}

export interface ModuleContext {
  theme: ThemeAdapter;
  i18n: I18nAdapter;
  storage: StorageAdapter;
  events: EventEmitter;
  logger: LoggerAdapter;
}

export interface ISettingsModule<TConfig = any, TState = any> {
  readonly meta: ModuleMeta;
  readonly config: ModuleConfig;
  
  init(context: ModuleContext): Promise<void>;
  render(): ReactNode;
  
  getState(): ModuleState<TState>;
  setState(state: Partial<TState>): void;
  
  validate(): Promise<boolean>;
  reset(): void;
  destroy(): void;
  
  onActivate?(): void;
  onDeactivate?(): void;
  onError?(error: Error): void;
}