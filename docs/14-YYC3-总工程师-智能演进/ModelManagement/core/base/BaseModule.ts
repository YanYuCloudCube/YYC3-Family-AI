/**
 * @file core/base/BaseModule.ts
 * @description 模块基类，提供通用实现
 */

import { useState, useCallback, useEffect } from "react";
import type { ISettingsModule, ModuleMeta, ModuleConfig, ModuleState, ModuleContext } from "./types";

export abstract class BaseModule<TConfig = any, TState = any>
  implements ISettingsModule<TConfig, TState> {
  
  abstract readonly meta: ModuleMeta;
  abstract readonly config: ModuleConfig;
  
  protected context!: ModuleContext;
  protected _state: ModuleState<TState>;
  
  constructor(initialState: TState) {
    this._state = {
      data: initialState,
      status: "idle",
    };
  }
  
  async init(context: ModuleContext): Promise<void> {
    this.context = context;
    
    if (this.config.storageKey) {
      const saved = await context.storage.get(this.config.storageKey);
      if (saved) {
        this._state.data = { ...this._state.data, ...saved };
      }
    }
    
    this._state.status = "active";
  }
  
  getState(): ModuleState<TState> {
    return { ...this._state };
  }
  
  setState(state: Partial<TState>): void {
    this._state = {
      ...this._state,
      data: { ...this._state.data, ...state },
      lastUpdated: Date.now(),
    };
    
    if (this.config.storageKey) {
      this.context.storage.set(this.config.storageKey, this._state.data);
    }
    
    this.context.events.emit(`${this.meta.id}:stateChange`, this._state);
  }
  
  async validate(): Promise<boolean> {
    return true;
  }
  
  reset(): void {
    this._state = {
      data: this.getDefaultState(),
      status: "idle",
    };
  }
  
  destroy(): void {
    this.context.events.removeAllListeners(`${this.meta.id}:*`);
  }
  
  protected abstract getDefaultState(): TState;
  abstract render(): React.ReactNode;
}

export function useModule<T extends BaseModule<any, any>>(module: T) {
  const [state, setState] = useState(module.getState());
  
  useEffect(() => {
    const unsubscribe = module.context.events.on(
      `${module.meta.id}:stateChange`,
      setState
    );
    
    return unsubscribe;
  }, [module]);
  
  const updateState = useCallback((partial: any) => {
    module.setState(partial);
  }, [module]);
  
  return { state, updateState, module };
}