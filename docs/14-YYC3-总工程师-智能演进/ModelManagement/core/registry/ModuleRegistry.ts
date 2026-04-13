/**
 * @file core/registry/ModuleRegistry.ts
 * @description 模块注册与发现中心
 */

import type { ISettingsModule, ModuleMeta, ModuleCategory } from "../types";

type ModuleConstructor = new () => ISettingsModule<any, any>;

interface RegistryEntry {
  module: ISettingsModule<any, any>;
  instance?: any;
}

class ModuleRegistryImpl {
  private modules = new Map<string, RegistryEntry>();
  private categoryIndex = new Map<ModuleCategory, Set<string>>();
  
  register(module: ISettingsModule<any, any>): void {
    const id = module.meta.id;
    
    if (this.modules.has(id)) {
      console.warn(`Module ${id} already registered, skipping...`);
      return;
    }
    
    this.modules.set(id, { module });
    
    const category = module.meta.category;
    if (!this.categoryIndex.has(category)) {
      this.categoryIndex.set(category, new Set());
    }
    this.categoryIndex.get(category)!.add(id);
  }
  
  unregister(moduleId: string): void {
    const entry = this.modules.get(moduleId);
    if (!entry) return;
    
    const category = entry.module.meta.category;
    this.categoryIndex.get(category)?.delete(moduleId);
    this.modules.delete(moduleId);
    
    entry.module.destroy();
  }
  
  get<T = any>(moduleId: string): ISettingsModule<any, T> | undefined {
    return this.modules.get(moduleId)?.module;
  }
  
  getByCategory(category: ModuleCategory): ISettingsModule<any, any>[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.modules.get(id)?.module)
      .filter(Boolean) as ISettingsModule<any, any>[];
  }
  
  getAll(): ISettingsModule<any, any>[] {
    return Array.from(this.modules.values()).map(e => e.module);
  }
  
  getSorted(): ISettingsModule<any, any>[] {
    return this.getAll().sort((a, b) => a.meta.order - b.meta.order);
  }
  
  getMetaList(): ModuleMeta[] {
    return this.getSorted().map(m => m.meta);
  }
}

export const ModuleRegistry = new ModuleRegistryImpl();