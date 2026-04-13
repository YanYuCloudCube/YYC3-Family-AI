/**
 * @file: core/ExtensionSystem.ts
 * @description: 扩展系统 - 提供应用级别的扩展点和钩子
 *              支持动态加载、依赖管理、生命周期控制
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-01
 * @updated: 2026-04-01
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: extension,system,hooks,lifecycle
 */

export interface ExtensionPoint<T = unknown> {
  id: string;
  description: string;
  handler: ExtensionHandler<T>;
  priority?: number;
  enabled?: boolean;
}

export type ExtensionHandler<T = unknown> = (context: ExtensionContext) => T | Promise<T>;

export interface ExtensionContext {
  /** 扩展点 ID */
  extensionPoint: string;
  /** 执行时间 */
  timestamp: number;
  /** 元数据 */
  metadata: Record<string, unknown>;
}

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  extensionPoints: string[];
  dependencies?: ExtensionDependency[];
  permissions?: string[];
}

export interface ExtensionDependency {
  id: string;
  version: string;
  optional?: boolean;
}

export interface ExtensionLoadResult {
  success: boolean;
  extension?: ExtensionManifest;
  error?: Error;
}

export interface ExtensionSystemConfig {
  /** 是否启用热重载 */
  enableHotReload?: boolean;
  /** 是否启用依赖检查 */
  enableDependencyCheck?: boolean;
  /** 是否启用权限验证 */
  enablePermissionCheck?: boolean;
}

type ExtensionHook = ExtensionHandler;

export class ExtensionSystem {
  private extensions = new Map<string, ExtensionManifest>();
  private extensionPoints = new Map<string, Set<ExtensionPoint>>();
  private hooks = new Map<string, Set<ExtensionHook>>();
  private config: ExtensionSystemConfig;

  constructor(config: ExtensionSystemConfig = {}) {
    this.config = {
      enableHotReload: import.meta.env.DEV,
      enableDependencyCheck: true,
      enablePermissionCheck: true,
      ...config,
    };
  }

  registerExtension(manifest: ExtensionManifest): ExtensionLoadResult {
    if (this.extensions.has(manifest.id)) {
      return {
        success: false,
        error: new Error(`Extension "${manifest.id}" already registered`),
      };
    }

    if (this.config.enableDependencyCheck) {
      const depCheck = this.checkDependencies(manifest);
      if (!depCheck.valid) {
        return {
          success: false,
          error: new Error(`Dependency check failed: ${depCheck.errors.join(', ')}`),
        };
      }
    }

    this.extensions.set(manifest.id, manifest);

    for (const pointId of manifest.extensionPoints) {
      if (!this.extensionPoints.has(pointId)) {
        this.extensionPoints.set(pointId, new Set());
      }
    }

    return {
      success: true,
      extension: manifest,
    };
  }

  unregisterExtension(extensionId: string): boolean {
    const manifest = this.extensions.get(extensionId);
    if (!manifest) return false;

    for (const pointId of manifest.extensionPoints) {
      const points = this.extensionPoints.get(pointId);
      if (points) {
        points.forEach((point) => {
          if (point.handler.toString().includes(extensionId)) {
            points.delete(point);
          }
        });
      }
    }

    return this.extensions.delete(extensionId);
  }

  registerExtensionPoint<T>(
    pointId: string,
    handler: ExtensionHandler<T>,
    options?: { priority?: number; enabled?: boolean }
  ): void {
    if (!this.extensionPoints.has(pointId)) {
      this.extensionPoints.set(pointId, new Set());
    }

    const point: ExtensionPoint<T> = {
      id: `${pointId}-${Date.now()}`,
      description: pointId,
      handler,
      priority: options?.priority || 0,
      enabled: options?.enabled !== false,
    };

    this.extensionPoints.get(pointId)!.add(point);
  }

  unregisterExtensionPoint(pointId: string, handlerId: string): boolean {
    const points = this.extensionPoints.get(pointId);
    if (!points) return false;

    for (const point of points) {
      if (point.id === handlerId) {
        points.delete(point);
        return true;
      }
    }

    return false;
  }

  async executeExtensionPoint<T>(
    pointId: string,
    context: ExtensionContext
  ): Promise<T[]> {
    const points = this.extensionPoints.get(pointId);
    if (!points || points.size === 0) {
      return [];
    }

    const enabledPoints = Array.from(points)
      .filter((point) => point.enabled !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const results: T[] = [];

    for (const point of enabledPoints) {
      try {
        const result = await point.handler(context);
        results.push(result as T);
      } catch (error) {
        console.error(
          `[ExtensionSystem] Error executing extension point "${pointId}":`,
          error
        );
      }
    }

    return results;
  }

  registerHook<T>(
    hookId: string,
    handler: ExtensionHandler<T>
  ): () => void {
    if (!this.hooks.has(hookId)) {
      this.hooks.set(hookId, new Set());
    }

    this.hooks.get(hookId)!.add(handler);

    return () => {
      this.hooks.get(hookId)?.delete(handler);
    };
  }

  async executeHook<T>(hookId: string, context: ExtensionContext): Promise<T[]> {
    const handlers = this.hooks.get(hookId);
    if (!handlers || handlers.size === 0) {
      return [];
    }

    const results: T[] = [];

    for (const handler of handlers) {
      try {
        const result = await handler(context);
        results.push(result as T);
      } catch (error) {
        console.error(
          `[ExtensionSystem] Error executing hook "${hookId}":`,
          error
        );
      }
    }

    return results;
  }

  getExtension(extensionId: string): ExtensionManifest | undefined {
    return this.extensions.get(extensionId);
  }

  getAllExtensions(): ExtensionManifest[] {
    return Array.from(this.extensions.values());
  }

  getExtensionPoint(pointId: string): ExtensionPoint[] {
    const points = this.extensionPoints.get(pointId);
    return points ? Array.from(points) : [];
  }

  getExtensionPoints(): string[] {
    return Array.from(this.extensionPoints.keys());
  }

  getExtensionsByPoint(pointId: string): ExtensionManifest[] {
    return this.getAllExtensions().filter((ext) =>
      ext.extensionPoints.includes(pointId)
    );
  }

  checkDependencies(manifest: ExtensionManifest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!manifest.dependencies || manifest.dependencies.length === 0) {
      return { valid: true, errors: [] };
    }

    for (const dep of manifest.dependencies) {
      const depExtension = this.extensions.get(dep.id);
      if (!depExtension) {
        if (!dep.optional) {
          errors.push(`Missing required dependency: ${dep.id}@${dep.version}`);
        }
      } else {
        const versionMatch = this.checkVersion(
          depExtension.version,
          dep.version
        );
        if (!versionMatch) {
          errors.push(
            `Dependency version mismatch: ${dep.id} requires ${dep.version}, but ${depExtension.version} is installed`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  enableExtension(extensionId: string): boolean {
    const points = this.extensionPoints.get(extensionId);
    if (points) {
      points.forEach((point) => {
        point.enabled = true;
      });
    }
    return true;
  }

  disableExtension(extensionId: string): boolean {
    const points = this.extensionPoints.get(extensionId);
    if (points) {
      points.forEach((point) => {
        point.enabled = false;
      });
    }
    return true;
  }

  private checkVersion(installed: string, required: string): boolean {
    const installedParts = installed.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);

    for (let i = 0; i < requiredParts.length; i++) {
      const installedPart = installedParts[i] || 0;
      const requiredPart = requiredParts[i];

      if (installedPart < requiredPart) {
        return false;
      }
      if (installedPart > requiredPart) {
        return true;
      }
    }

    return true;
  }
}

let globalExtensionSystem: ExtensionSystem | null = null;

export function getExtensionSystem(config?: ExtensionSystemConfig): ExtensionSystem {
  if (!globalExtensionSystem) {
    globalExtensionSystem = new ExtensionSystem(config);
  }
  return globalExtensionSystem;
}

export function resetExtensionSystem(): void {
  if (globalExtensionSystem) {
    globalExtensionSystem = null;
  }
}

export function createExtensionBuilder(id: string, name: string) {
  return new ExtensionBuilder(id, name);
}

export class ExtensionBuilder {
  private manifest: Partial<ExtensionManifest> = {
    version: '1.0.0',
    description: '',
    author: '',
    extensionPoints: [],
    dependencies: [],
    permissions: [],
  };

  constructor(private id: string, private name: string) {
    this.manifest.id = id;
    this.manifest.name = name;
  }

  version(version: string): this {
    this.manifest.version = version;
    return this;
  }

  description(description: string): this {
    this.manifest.description = description;
    return this;
  }

  author(author: string): this {
    this.manifest.author = author;
    return this;
  }

  extensionPoint(...points: string[]): this {
    this.manifest.extensionPoints = [
      ...(this.manifest.extensionPoints || []),
      ...points,
    ];
    return this;
  }

  dependency(id: string, version: string, optional = false): this {
    this.manifest.dependencies = [
      ...(this.manifest.dependencies || []),
      { id, version, optional },
    ];
    return this;
  }

  permission(...permissions: string[]): this {
    this.manifest.permissions = [
      ...(this.manifest.permissions || []),
      ...permissions,
    ];
    return this;
  }

  build(): ExtensionManifest {
    if (!this.manifest.id || this.manifest.id.trim() === '') {
      throw new Error('Extension ID is required');
    }
    if (!this.manifest.name || this.manifest.name.trim() === '') {
      throw new Error('Extension name is required');
    }
    if (!this.manifest.version || this.manifest.version.trim() === '') {
      throw new Error('Extension version is required');
    }
    if (!this.manifest.author || this.manifest.author.trim() === '') {
      throw new Error('Extension author is required');
    }

    return this.manifest as ExtensionManifest;
  }

  register(system: ExtensionSystem): ExtensionLoadResult {
    return system.registerExtension(this.build());
  }
}
