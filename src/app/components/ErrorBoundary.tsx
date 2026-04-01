// @ts-nocheck
/**
 * @file ErrorBoundary.tsx
 * @description 增强版 React 错误边界组件，支持错误分类、自动恢复、错误上报
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-03-06
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags error-boundary,react,fallback,recovery,classification
 */

import React, { useState } from "react";
import {
  AlertTriangle,
  RotateCcw,
  Home,
  Bug,
  WifiOff,
  ServerCrash,
  Code2,
  X,
} from "lucide-react";
import { errorReporting } from "./ide/services/ErrorReportingService";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  autoRecover?: boolean;
  recoverDelay?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorType: ErrorType;
  retryCount: number;
}

type ErrorType =
  | "render" // 渲染错误
  | "network" // 网络错误
  | "api" // API 错误
  | "code" // 代码错误
  | "unknown"; // 未知错误

// 错误分类配置
const ERROR_CONFIGS: Record<
  ErrorType,
  {
    title: string;
    message: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    recoverable: boolean;
  }
> = {
  render: {
    title: "页面渲染错误",
    message: "组件渲染时出现问题，但您的数据是安全的",
    icon: Bug,
    color: "text-red-400",
    recoverable: true,
  },
  network: {
    title: "网络连接错误",
    message: "无法连接到服务器，请检查网络连接",
    icon: WifiOff,
    color: "text-amber-400",
    recoverable: true,
  },
  api: {
    title: "API 服务错误",
    message: "API 响应异常，请稍后重试",
    icon: ServerCrash,
    color: "text-orange-400",
    recoverable: true,
  },
  code: {
    title: "代码执行错误",
    message: "代码执行时出现异常，请检查代码语法",
    icon: Code2,
    color: "text-purple-400",
    recoverable: false,
  },
  unknown: {
    title: "未知错误",
    message: "发生了未知错误，已记录到错误日志",
    icon: AlertTriangle,
    color: "text-slate-400",
    recoverable: true,
  },
};

/**
 * 增强版全局错误边界
 * 特性:
 * - 错误分类处理 (渲染/网络/API/代码)
 * - 自动恢复机制
 * - 错误上报集成
 * - 重试次数限制
 * - 错误详情展示
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private recoverTimer: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: "unknown",
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 错误分类
    let errorType: ErrorType = "unknown";

    if (error.message.includes("network") || error.message.includes("fetch")) {
      errorType = "network";
    } else if (
      error.message.includes("API") ||
      error.message.includes("response")
    ) {
      errorType = "api";
    } else if (error.message.includes("syntax") || error.message.includes("parse")) {
      errorType = "code";
    } else {
      errorType = "render";
    }

    return { hasError: true, error, errorType };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // 错误上报
    errorReporting.captureRenderError(error, {
      componentStack: errorInfo?.componentStack ?? undefined,
      errorType: this.state.errorType,
      retryCount: this.state.retryCount,
    });

    // 调用外部错误处理
    this.props.onError?.(error, errorInfo);

    // 自动恢复
    if (this.props.autoRecover !== false) {
      this.attemptAutoRecover();
    }
  }

  attemptAutoRecover = () => {
    const { maxRetries = 3, recoverDelay = 3000 } = this.props;

    if (this.state.retryCount >= maxRetries) {
      console.warn("[ErrorBoundary] 达到最大重试次数，停止自动恢复");
      return;
    }

    const config = ERROR_CONFIGS[this.state.errorType];
    if (!config.recoverable) {
      console.warn("[ErrorBoundary] 错误不可恢复，跳过自动重试");
      return;
    }

    console.warn(
      `[ErrorBoundary] ${recoverDelay}ms 后自动重试 (第 ${this.state.retryCount + 1}/${maxRetries} 次)`,
    );

    this.recoverTimer = setTimeout(() => {
      this.handleRetry();
    }, recoverDelay);
  };

  handleRetry = () => {
    if (this.recoverTimer) {
      clearTimeout(this.recoverTimer);
      this.recoverTimer = null;
    }

    const { maxRetries = 3 } = this.props;
    if (this.state.retryCount >= maxRetries) {
      console.warn("[ErrorBoundary] 达到最大重试次数");
      return;
    }

    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleReset = () => {
    if (this.recoverTimer) {
      clearTimeout(this.recoverTimer);
      this.recoverTimer = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  componentWillUnmount() {
    if (this.recoverTimer) {
      clearTimeout(this.recoverTimer);
      this.recoverTimer = null;
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const config = ERROR_CONFIGS[this.state.errorType];
      const Icon = config.icon;
      const { maxRetries = 3 } = this.props;
      const canRetry = this.state.retryCount < maxRetries;

      return (
        <div className="size-full min-h-screen flex items-center justify-center bg-[var(--ide-bg-deep,#060d1a)]">
          <div className="max-w-md w-full mx-4 p-6 rounded-2xl bg-[var(--ide-bg,#0b1729)] border border-[var(--ide-border-dim,rgba(30,58,95,0.4))] shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl ${config.color}/10 flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-[0.95rem] text-[var(--ide-text-bright,#e2e8f0)]">
                  {config.title}
                </h2>
                <p className="text-[0.72rem] text-[var(--ide-text-muted,#64748b)]">
                  {config.message}
                </p>
              </div>
              <button
                onClick={this.handleReset}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5"
                title="清除错误状态"
              >
                <X className="w-3.5 h-3.5 text-[var(--ide-text-dim)]" />
              </button>
            </div>

            {/* Error Details */}
            {this.state.error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-[0.7rem] text-red-400 font-mono break-all mb-2">
                  {this.state.error.message}
                </p>

                {/* Retry Info */}
                {canRetry && config.recoverable && (
                  <p className="text-[0.62rem] text-amber-400/80">
                    将在 {this.props.recoverDelay || 3000}ms 后自动重试 (第{" "}
                    {this.state.retryCount + 1}/{maxRetries} 次)
                  </p>
                )}

                {!canRetry && (
                  <p className="text-[0.62rem] text-red-400/80">
                    已达到最大重试次数 ({maxRetries})
                  </p>
                )}

                {/* Component Stack */}
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="text-[0.62rem] text-[var(--ide-text-dim,#475569)] cursor-pointer hover:text-[var(--ide-text-muted)]">
                      查看组件堆栈
                    </summary>
                    <pre className="mt-1 text-[0.58rem] text-[var(--ide-text-faint,#334155)] overflow-auto max-h-32 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {canRetry && config.recoverable ? (
                <button
                  onClick={this.handleRetry}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500/10 text-sky-400 text-[0.78rem] hover:bg-sky-500/20 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  立即重试
                </button>
              ) : (
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-[0.78rem] hover:bg-emerald-500/20 transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  清除状态
                </button>
              )}

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-[var(--ide-text-secondary,#94a3b8)] text-[0.78rem] hover:bg-white/10 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                返回首页
              </button>
            </div>

            {/* Help Info */}
            <div className="mt-4 pt-4 border-t border-[var(--ide-border-faint)]">
              <p className="text-[0.62rem] text-[var(--ide-text-dim)]">
                💡 提示：{this.getErrorHelpText()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private getErrorHelpText(): string {
    switch (this.state.errorType) {
      case "network":
        return "请检查网络连接，或尝试刷新页面"
      case "api":
        return "可能是 API 服务暂时不可用，请稍后重试"
      case "code":
        return "请检查最近的代码变更，或联系技术支持"
      case "render":
        return "尝试刷新页面或清除浏览器缓存"
      default:
        return "已记录错误日志，我们将尽快修复"
    }
  }
}

/**
 * 函数组件版本的错误边界处理 Hook
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<React.ErrorInfo | null>(null);

  const captureError = (err: Error, info?: React.ErrorInfo) => {
    setError(err);
    if (info) setErrorInfo(info);
    // 只在有 window 对象时才上报错误 (避免 SSR 问题)
    if (typeof window !== "undefined" && window.location) {
      errorReporting.captureRenderError(err, {
        componentStack: info?.componentStack,
      });
    }
  };

  const clearError = () => {
    setError(null);
    setErrorInfo(null);
  };

  return {
    error,
    errorInfo,
    hasError: !!error,
    captureError,
    clearError,
  };
}

export default ErrorBoundary;
