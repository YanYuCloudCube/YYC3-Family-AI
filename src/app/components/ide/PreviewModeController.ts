/**
 * @file PreviewModeController.ts
 * @description 预览模式控制器，管理实时/手动/延迟三种预览模式，控制预览更新策略
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-31
 * @updated 2026-03-31
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview,controller,mode,realtime,manual,delayed
 */

// ================================================================
// PreviewModeController — Preview mode control strategy
// ================================================================

import type { PreviewMode } from "./stores/usePreviewStore";

/**
 * 预览模式控制器
 * 
 * 管理三种预览模式的更新策略：
 * - realtime: 文件修改立即触发预览更新
 * - manual: 需要手动触发预览更新
 * - delayed: 文件修改后延迟一定时间再更新
 * 
 * @example
 * ```typescript
 * const controller = new PreviewModeController(
 *   () => console.log("Preview updated"),
 *   500
 * );
 * 
 * controller.setMode("realtime");
 * controller.handleFileChange(); // 立即更新
 * 
 * controller.setMode("delayed");
 * controller.handleFileChange(); // 延迟500ms更新
 * ```
 */
export class PreviewModeController {
  /** 当前预览模式 */
  private mode: PreviewMode = "realtime";
  
  /** 延迟定时器 */
  private delayTimer: ReturnType<typeof setTimeout> | null = null;
  
  /** 是否有待处理的更新（手动模式使用） */
  private pendingUpdate: boolean = false;
  
  /** 默认延迟时间（毫秒） */
  private readonly DEFAULT_DELAY = 500;
  
  /** 当前延迟时间 */
  private delay: number;

  /**
   * 构造函数
   * 
   * @param onTriggerUpdate - 触发预览更新的回调函数
   * @param delay - 延迟时间（毫秒），默认500ms
   */
  constructor(
    private onTriggerUpdate: () => void,
    delay?: number
  ) {
    this.delay = delay ?? this.DEFAULT_DELAY;
  }

  /**
   * 设置预览模式
   * 
   * @param mode - 预览模式：realtime | manual | delayed
   */
  setMode(mode: PreviewMode): void {
    this.mode = mode;
    this.clearPendingUpdate();
    
    // 切换到手动模式时，如果有待处理的更新，保持标记
    if (mode === "manual" && this.pendingUpdate) {
      // 保持待处理状态
    }
  }

  /**
   * 获取当前预览模式
   * 
   * @returns 当前预览模式
   */
  getMode(): PreviewMode {
    return this.mode;
  }

  /**
   * 文件变更处理
   * 
   * 根据当前模式决定如何处理文件变更：
   * - realtime: 立即触发更新
   * - manual: 标记有待处理更新，等待手动触发
   * - delayed: 延迟触发更新
   */
  handleFileChange(): void {
    switch (this.mode) {
      case "realtime":
        this.triggerImmediateUpdate();
        break;
      
      case "manual":
        this.pendingUpdate = true;
        // 可以触发一个事件通知UI显示"有待处理的更新"
        console.log("[PreviewModeController] Pending update marked for manual mode");
        break;
      
      case "delayed":
        this.scheduleDelayedUpdate();
        break;
      
      case "smart":
        // 智能模式暂未实现，默认使用延迟模式
        this.scheduleDelayedUpdate();
        break;
      
      default:
        console.warn(`[PreviewModeController] Unknown mode: ${this.mode}`);
        this.triggerImmediateUpdate();
    }
  }

  /**
   * 手动触发更新（手动模式）
   * 
   * 只在有待处理更新时触发
   */
  manualTrigger(): void {
    if (this.pendingUpdate) {
      this.triggerImmediateUpdate();
      this.pendingUpdate = false;
    } else {
      console.log("[PreviewModeController] Manual trigger ignored - no pending update");
    }
  }

  /**
   * 检查是否有待处理的更新
   * 
   * @returns 是否有待处理的更新
   */
  hasPendingUpdate(): boolean {
    return this.pendingUpdate;
  }

  /**
   * 立即触发更新
   * 
   * 清除所有待处理的更新，立即执行更新回调
   */
  private triggerImmediateUpdate(): void {
    this.clearPendingUpdate();
    
    try {
      this.onTriggerUpdate();
      console.log("[PreviewModeController] Preview updated immediately");
    } catch (error) {
      console.error("[PreviewModeController] Error triggering update:", error);
    }
  }

  /**
   * 调度延迟更新
   * 
   * 清除之前的延迟定时器，设置新的延迟定时器
   */
  private scheduleDelayedUpdate(): void {
    this.clearPendingUpdate();
    
    this.delayTimer = setTimeout(() => {
      this.delayTimer = null;
      this.triggerImmediateUpdate();
    }, this.delay);
    
    console.log(`[PreviewModeController] Scheduled delayed update in ${this.delay}ms`);
  }

  /**
   * 清除待处理的更新
   * 
   * 清除延迟定时器和待处理标记
   */
  private clearPendingUpdate(): void {
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
      console.log("[PreviewModeController] Cleared delayed timer");
    }
    // 注意：不清除 pendingUpdate 标记，它应该由手动触发或模式切换清除
  }

  /**
   * 设置延迟时间
   * 
   * @param delay - 延迟时间（毫秒），限制在100ms到5000ms之间
   */
  setDelay(delay: number): void {
    // 限制延迟时间范围：100ms - 5s
    this.delay = Math.max(100, Math.min(5000, delay));
    console.log(`[PreviewModeController] Delay set to ${this.delay}ms`);
  }

  /**
   * 获取当前延迟时间
   * 
   * @returns 当前延迟时间（毫秒）
   */
  getDelay(): number {
    return this.delay;
  }

  /**
   * 销毁控制器
   * 
   * 清理所有定时器和资源
   */
  destroy(): void {
    this.clearPendingUpdate();
    this.pendingUpdate = false;
    console.log("[PreviewModeController] Controller destroyed");
  }

  /**
   * 重置控制器状态
   * 
   * 清除所有待处理的更新，但保持当前模式
   */
  reset(): void {
    this.clearPendingUpdate();
    this.pendingUpdate = false;
    console.log("[PreviewModeController] Controller reset");
  }

  /**
   * 获取控制器状态信息
   * 
   * @returns 控制器状态对象
   */
  getStatus(): {
    mode: PreviewMode;
    delay: number;
    hasPendingUpdate: boolean;
    hasActiveTimer: boolean;
  } {
    return {
      mode: this.mode,
      delay: this.delay,
      hasPendingUpdate: this.pendingUpdate,
      hasActiveTimer: this.delayTimer !== null
    };
  }
}

/**
 * 工厂函数：创建预览模式控制器
 * 
 * @param onTriggerUpdate - 触发预览更新的回调函数
 * @param initialMode - 初始模式，默认为 "realtime"
 * @param delay - 延迟时间（毫秒），默认为 500
 * @returns PreviewModeController 实例
 * 
 * @example
 * ```typescript
 * const controller = createPreviewModeController(
 *   () => refreshPreview(),
 *   "delayed",
 *   1000
 * );
 * ```
 */
export function createPreviewModeController(
  onTriggerUpdate: () => void,
  initialMode: PreviewMode = "realtime",
  delay: number = 500
): PreviewModeController {
  const controller = new PreviewModeController(onTriggerUpdate, delay);
  controller.setMode(initialMode);
  return controller;
}
