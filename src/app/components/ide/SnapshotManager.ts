/**
 * @file: SnapshotManager.ts
 * @description: 快照管理器，负责创建、存储、恢复、比较预览快照，支持localStorage持久化
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-03-31
 * @updated: 2026-03-31
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: snapshot,manager,restore,compare,persistence
 */

// ================================================================
// SnapshotManager — Preview snapshot management system
// ================================================================

import type { DevicePreset } from "./types/previewTypes";
import { logger } from "./services/Logger";

/**
 * 快照文件数据结构
 */
export interface SnapshotFile {
  /** 文件路径 */
  path: string;
  /** 文件内容 */
  content: string;
  /** 内容哈希（用于快速比较） */
  hash: string;
}

/**
 * 快照元数据
 */
export interface SnapshotMetadata {
  /** 总文件数 */
  totalFiles: number;
  /** 总行数 */
  totalLines: number;
  /** 设备预设（可选） */
  device?: DevicePreset;
  /** 缩放级别（可选） */
  zoom?: number;
  /** 自定义标签 */
  tags?: string[];
  /** 描述信息 */
  description?: string;
}

/**
 * 快照数据结构
 */
export interface Snapshot {
  /** 快照唯一标识 */
  id: string;
  /** 快照标签/名称 */
  label: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 文件列表 */
  files: SnapshotFile[];
  /** 元数据 */
  metadata: SnapshotMetadata;
}

/**
 * 快照比较结果
 */
export interface SnapshotComparison {
  /** 新增的文件路径列表 */
  added: string[];
  /** 删除的文件路径列表 */
  removed: string[];
  /** 修改的文件路径列表 */
  modified: string[];
  /** 未改变的文件路径列表 */
  unchanged: string[];
}

/**
 * 快照管理器
 *
 * 管理预览快照的生命周期：
 * - 创建快照：保存当前文件状态
 * - 列出快照：查看所有快照
 * - 恢复快照：恢复到指定快照状态
 * - 删除快照：删除不需要的快照
 * - 比较快照：查看两个快照的差异
 *
 * @example
 * ```typescript
 * const manager = new SnapshotManager();
 *
 * // 创建快照
 * const snapshot = manager.createSnapshot(
 *   "版本1",
 logger.warn('hello');
 * );
 *
 * // 列出快照
 * const snapshots = manager.listSnapshots();
 *
 * // 恢复快照
 * manager.restoreSnapshot(snapshot.id, (files) => {
 logger.warn(f.path, f.content));
 * });
 *
 * // 比较快照
 * const diff = manager.compareSnapshots(snap1.id, snap2.id);
 * ```
 */
export class SnapshotManager {
  /** 快照存储（使用Map保证唯一性） */
  private snapshots: Map<string, Snapshot> = new Map();

  /** 最大快照数量限制 */
  private readonly MAX_SNAPSHOTS = 50;

  /** localStorage 存储键 */
  private readonly STORAGE_KEY = "yyc3_snapshots";

  /**
   * 构造函数
   *
   * 自动从 localStorage 加载已保存的快照
   */
  constructor() {
    this.loadFromStorage();
    logger.warn('Initialized with ${this.snapshots.size} snapshots');
  }

  /**
   * 创建快照
   *
   * @param label - 快照标签/名称
   * @param files - 文件列表（路径和内容）
   * @param metadata - 可选的元数据
   * @returns 创建的快照对象
   *
   * @example
   * ```typescript
   * const snapshot = manager.createSnapshot(
   *   "功能完成",
   *   [
   *     { path: "src/index.ts", content: "export const app = () => {}" },
   *     { path: "src/App.tsx", content: "<div>Hello</div>" }
   *   ],
   *   { description: "完成核心功能开发" }
   * );
   * ```
   */
  createSnapshot(
    label: string,
    files: Array<{ path: string; content: string }>,
    metadata?: Partial<SnapshotMetadata>
  ): Snapshot {
    const timestamp = Date.now();
    const id = `snap_${timestamp}_${Math.random().toString(36).slice(2, 9)}`;

    const totalLines = files.reduce((sum, f) =>
      sum + f.content.split('\n').length, 0
    );

    const snapshot: Snapshot = {
      id,
      label,
      timestamp,
      files: files.map(f => ({
        path: f.path,
        content: f.content,
        hash: this.calculateHash(f.content)
      })),
      metadata: {
        totalFiles: files.length,
        totalLines,
        ...metadata
      }
    };

    this.snapshots.set(id, snapshot);

    this.enforceLimit();

    this.saveToStorage();

    logger.warn('Created snapshot: ${id} (${label})');
    return snapshot;
  }

  /**
   * 列出所有快照
   *
   * @returns 快照列表，按时间戳降序排列（最新的在前）
   *
   * @example
   * ```typescript
   * const snapshots = manager.listSnapshots();
   logger.warn(s.label, s.timestamp));
   * ```
   */
  listSnapshots(): Snapshot[] {
    return Array.from(this.snapshots.values())
      .sort((a, b) => {
        const timeDiff = b.timestamp - a.timestamp;
        if (timeDiff !== 0) return timeDiff;
        return a.id.localeCompare(b.id);
      });
  }

  /**
   * 获取单个快照
   *
   * @param id - 快照ID
   * @returns 快照对象，不存在则返回 null
   *
   * @example
   * ```typescript
   * const snapshot = manager.getSnapshot("snap_1234567890_abc123");
   * if (snapshot) {
   logger.warn("Found:", snapshot.label);
   * }
   * ```
   */
  getSnapshot(id: string): Snapshot | null {
    return this.snapshots.get(id) || null;
  }

  /**
   * 恢复快照
   *
   * @param id - 快照ID
   * @param applyFn - 文件应用函数，接收文件列表作为参数
   * @returns 是否成功恢复
   *
   * @example
   * ```typescript
   * const success = manager.restoreSnapshot(snapshot.id, (files) => {
   *   files.forEach(f => {
   *     fileStore.updateFile(f.path, f.content);
   *   });
   * });
   * ```
   */
  restoreSnapshot(
    id: string,
    applyFn: (files: Array<{ path: string; content: string }>) => void
  ): boolean {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) {
      logger.warn('Snapshot not found: ${id}');
      return false;
    }

    try {
      // 提取文件列表（不包含hash）
      const files = snapshot.files.map(f => ({
        path: f.path,
        content: f.content
      }));

      // 调用应用函数
      applyFn(files);

      logger.warn('Restored snapshot: ${id} (${snapshot.label})');
      return true;
    } catch (error) {
      logger.error(`[SnapshotManager] Failed to restore snapshot: ${id}`, error);
      return false;
    }
  }

  /**
   * 删除快照
   *
   * @param id - 快照ID
   * @returns 是否成功删除
   *
   * @example
   * ```typescript
   * if (manager.deleteSnapshot(snapshot.id)) {
   logger.warn('快照已删除');
   * }
   * ```
   */
  deleteSnapshot(id: string): boolean {
    const deleted = this.snapshots.delete(id);

    if (deleted) {
      this.saveToStorage();
      logger.warn('Deleted snapshot: ${id}');
    } else {
      logger.warn('Snapshot not found for deletion: ${id}');
    }

    return deleted;
  }

  /**
   * 批量删除快照
   *
   * @param ids - 快照ID列表
   * @returns 成功删除的数量
   */
  deleteSnapshots(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.snapshots.delete(id)) {
        count++;
      }
    }

    if (count > 0) {
      this.saveToStorage();
      logger.warn('Deleted ${count} snapshots');
    }

    return count;
  }

  /**
   * 比较两个快照
   *
   * @param id1 - 第一个快照ID（旧快照）
   * @param id2 - 第二个快照ID（新快照）
   * @returns 比较结果
   * @throws 如果任一快照不存在
   *
   * @example
   * ```typescript
   * const diff = manager.compareSnapshots(oldSnap.id, newSnap.id);
   logger.warn("Added:", diff.added);
   logger.warn("Removed:", diff.removed);
   logger.warn("Modified:", diff.modified);
   * ```
   */
  compareSnapshots(id1: string, id2: string): SnapshotComparison {
    const snap1 = this.snapshots.get(id1);
    const snap2 = this.snapshots.get(id2);

    if (!snap1) {
      throw new Error(`Snapshot not found: ${id1}`);
    }
    if (!snap2) {
      throw new Error(`Snapshot not found: ${id2}`);
    }

    // 转换为Map便于查找
    const files1 = new Map(snap1.files.map(f => [f.path, f]));
    const files2 = new Map(snap2.files.map(f => [f.path, f]));

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    const unchanged: string[] = [];

    // 检查新增和修改
    for (const [path, file2] of files2) {
      const file1 = files1.get(path);
      if (!file1) {
        added.push(path);
      } else if (file1.hash !== file2.hash) {
        modified.push(path);
      } else {
        unchanged.push(path);
      }
    }

    // 检查删除
    for (const path of files1.keys()) {
      if (!files2.has(path)) {
        removed.push(path);
      }
    }

    logger.warn('Compared ${id1} vs ${id2}: +${added.length} -${removed.length} ~${modified.length}');

    return { added, removed, modified, unchanged };
  }

  /**
   * 清空所有快照
   */
  clearAll(): void {
    this.snapshots.clear();
    this.saveToStorage();
    logger.warn('Cleared all snapshots');
  }

  /**
   * 获取快照数量
   *
   * @returns 当前快照总数
   */
  getSnapshotCount(): number {
    return this.snapshots.size;
  }

  /**
   * 检查快照是否存在
   *
   * @param id - 快照ID
   * @returns 是否存在
   */
  hasSnapshot(id: string): boolean {
    return this.snapshots.has(id);
  }

  /**
   * 更新快照标签
   *
   * @param id - 快照ID
   * @param label - 新标签
   * @returns 是否成功更新
   */
  updateSnapshotLabel(id: string, label: string): boolean {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) return false;

    snapshot.label = label;
    this.saveToStorage();
    return true;
  }

  /**
   * 计算内容哈希（简单实现）
   *
   * 使用简单的哈希算法，用于快速比较文件内容
   *
   * @param content - 文件内容
   * @returns 哈希字符串
   */
  private calculateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * 强制限制快照数量
   *
   * 当快照数量超过限制时，删除最旧的快照
   */
  private enforceLimit(): void {
    if (this.snapshots.size > this.MAX_SNAPSHOTS) {
      const sorted = this.listSnapshots();
      const toRemove = sorted.slice(this.MAX_SNAPSHOTS);

      for (const snap of toRemove) {
        this.snapshots.delete(snap.id);
      }

      logger.warn('Removed ${toRemove.length} old snapshots (limit: ${this.MAX_SNAPSHOTS})');
    }
  }

  /**
   * 持久化到 localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.snapshots.values());
      const json = JSON.stringify(data);

      // 检查存储大小
      const sizeInMB = (json.length * 2) / (1024 * 1024); // UTF-16编码
      if (sizeInMB > 4) {
        logger.warn('Storage size: ${sizeInMB.toFixed(2)}MB (close to limit)');
      }

      localStorage.setItem(this.STORAGE_KEY, json);
      logger.warn('Saved ${data.length} snapshots to localStorage');
    } catch (error) {
      logger.error("[SnapshotManager] Failed to save to localStorage:", error);

      // 如果是配额错误，尝试清理旧快照
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        logger.warn("[SnapshotManager] Storage quota exceeded, removing old snapshots");
        this.removeOldestSnapshots(10);
        // 重试保存
        try {
          const data = Array.from(this.snapshots.values());
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (retryError) {
          logger.error("[SnapshotManager] Retry failed:", retryError);
        }
      }
    }
  }

  /**
   * 从 localStorage 加载
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return;

      const snapshots = JSON.parse(data) as Snapshot[];

      // 验证数据完整性
      const validSnapshots = snapshots.filter(snap =>
        snap.id && snap.label && snap.timestamp && Array.isArray(snap.files)
      );

      for (const snap of validSnapshots) {
        this.snapshots.set(snap.id, snap);
      }

      if (validSnapshots.length < snapshots.length) {
        logger.warn('Loaded ${validSnapshots.length}/${snapshots.length} valid snapshots');
      }
    } catch (error) {
      logger.error("[SnapshotManager] Failed to load from localStorage:", error);
      // 加载失败时清空，避免持续错误
      this.snapshots.clear();
    }
  }

  /**
   * 删除最旧的N个快照
   *
   * @param count - 要删除的数量
   */
  private removeOldestSnapshots(count: number): void {
    const sorted = this.listSnapshots();
    const toRemove = sorted.slice(-count); // 取最后N个（最旧的）

    for (const snap of toRemove) {
      this.snapshots.delete(snap.id);
    }

    logger.warn('Removed ${toRemove.length} oldest snapshots');
  }

  /**
   * 获取存储统计信息
   *
   * @returns 统计信息对象
   */
  getStorageStats(): {
    snapshotCount: number;
    totalFiles: number;
    totalLines: number;
    estimatedSize: string;
  } {
    const snapshots = this.listSnapshots();
    const totalFiles = snapshots.reduce((sum, s) => sum + s.metadata.totalFiles, 0);
    const totalLines = snapshots.reduce((sum, s) => sum + s.metadata.totalLines, 0);

    // 估算存储大小
    const json = JSON.stringify(snapshots);
    const sizeInBytes = json.length * 2; // UTF-16编码
    const estimatedSize = sizeInBytes < 1024
      ? `${sizeInBytes} B`
      : sizeInBytes < 1024 * 1024
      ? `${(sizeInBytes / 1024).toFixed(2)} KB`
      : `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;

    return {
      snapshotCount: snapshots.length,
      totalFiles,
      totalLines,
      estimatedSize
    };
  }
}

/**
 * 工厂函数：创建快照管理器实例
 *
 * @returns SnapshotManager 实例
 */
export function createSnapshotManager(): SnapshotManager {
  return new SnapshotManager();
}
