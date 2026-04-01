/**
 * @file RouteErrorFallback.tsx
 * @description 路由级错误回退 UI — 当某个路由页面加载或渲染失败时展示友好提示，
 *              支持重试、返回首页、查看错误详情，风格与项目整体 IDE 暗色主题一致
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags error,route,fallback,recovery,ux,error-reporting
 */

import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router";
import {
  AlertTriangle,
  RotateCcw,
  Home,
  Bug,
  FileWarning,
  ShieldAlert,
  WifiOff,
  ChevronDown,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { errorReporting } from "./ide/services/ErrorReportingService";

/** 根据错误类型返回对应图标、标题、描述 */
function classifyError(error: unknown) {
  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404:
        return {
          icon: FileWarning,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          title: "页面未找到",
          description: "您访问的页面不存在或已被移除",
          code: "404",
        };
      case 403:
        return {
          icon: ShieldAlert,
          color: "text-orange-400",
          bg: "bg-orange-500/10",
          border: "border-orange-500/20",
          title: "访问被拒绝",
          description: "您没有权限访问该页面",
          code: "403",
        };
      case 500:
        return {
          icon: Bug,
          color: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          title: "服务器错误",
          description: "服务端处理请求时出现异常",
          code: "500",
        };
      default:
        return {
          icon: AlertTriangle,
          color: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          title: `请求错误 (${error.status})`,
          description: error.statusText || "发生了未预期的错误",
          code: String(error.status),
        };
    }
  }

  // Module loading failure (common in lazy-loaded routes)
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes("does not provide an export") ||
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk")
  ) {
    return {
      icon: WifiOff,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      title: "模块加载失败",
      description: "页面资源加载出错，可能是网络问题或依赖缺失，请尝试重新加载",
      code: "LOAD",
    };
  }

  return {
    icon: Bug,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    title: "页面渲染出错",
    description: "该页面遇到了未预期的错误，但您的数据是安全的",
    code: "ERR",
  };
}

export default function RouteErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);
  const [reportStatus, setReportStatus] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");
  const reportedRef = useRef(false);

  const info = classifyError(error);
  const Icon = info.icon;

  const errorMessage =
    error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : String(error);

  const errorStack = error instanceof Error ? error.stack : null;

  // ── 自动上报（首次渲染时） ──
  useEffect(() => {
    if (reportedRef.current) return;
    reportedRef.current = true;

    const eventId = errorReporting.captureRouteError(error, {
      route: window.location.hash.replace("#", "") || window.location.pathname,
    });

    if (eventId) {
      console.warn(`[RouteErrorFallback] 错误已自动上报 → eventId: ${eventId}`);
      setReportStatus("sent");
    }
  }, [error]);

  // ── 手动重新上报 ──
  const handleManualReport = async () => {
    setReportStatus("sending");
    try {
      const eventId = errorReporting.captureRouteError(error, {
        route:
          window.location.hash.replace("#", "") || window.location.pathname,
      });
      if (eventId) {
        await errorReporting.flush();
        setReportStatus("sent");
      } else {
        setReportStatus("sent"); // deduplicated, treat as success
      }
    } catch {
      setReportStatus("failed");
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    try {
      navigate("/");
    } catch {
      window.location.hash = "#/";
      window.location.reload();
    }
  };

  const handleGoBack = () => {
    try {
      navigate(-1);
    } catch {
      handleGoHome();
    }
  };

  return (
    <div className="size-full min-h-screen flex items-center justify-center bg-[var(--ide-bg-deep,#060d1a)] p-4">
      <div className="max-w-lg w-full">
        {/* Error code badge */}
        <div className="flex justify-center mb-6">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.68rem] ${info.bg} ${info.color} ${info.border} border`}
          >
            <Icon className="w-3.5 h-3.5" />
            {info.code}
          </span>
        </div>

        {/* Main card */}
        <div className="rounded-2xl bg-[var(--ide-bg,#0b1729)] border border-[var(--ide-border-dim,rgba(30,58,95,0.4))] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl ${info.bg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-6 h-6 ${info.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[1.1rem] text-[var(--ide-text-bright,#e2e8f0)] mb-1">
                  {info.title}
                </h2>
                <p className="text-[0.78rem] text-[var(--ide-text-muted,#64748b)] leading-relaxed">
                  {info.description}
                </p>
              </div>
            </div>
          </div>

          {/* Error detail (collapsible) */}
          <div className="px-6 pb-4">
            {/* Report status indicator */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="flex items-center gap-1.5 text-[0.68rem] text-[var(--ide-text-dim,#475569)] hover:text-[var(--ide-text-muted,#64748b)] transition-colors"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showDetail ? "rotate-180" : ""}`}
                />
                <span>{showDetail ? "收起" : "查看"}错误详情</span>
              </button>

              {/* Error reporting status badge */}
              <div className="flex items-center gap-1.5">
                {reportStatus === "sent" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    已上报
                  </span>
                )}
                {reportStatus === "sending" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] bg-sky-500/10 text-sky-400 border border-sky-500/20 animate-pulse">
                    <Send className="w-3 h-3" />
                    上报中…
                  </span>
                )}
                {reportStatus === "failed" && (
                  <button
                    onClick={handleManualReport}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    重新上报
                  </button>
                )}
                {reportStatus === "idle" && (
                  <button
                    onClick={handleManualReport}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] bg-white/5 text-[var(--ide-text-dim,#475569)] border border-[var(--ide-border-faint,rgba(30,58,95,0.2))] hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    上报错误
                  </button>
                )}
              </div>
            </div>

            {showDetail && (
              <div className="mt-3 p-3 rounded-lg bg-[var(--ide-bg-dark,#050e1d)] border border-[var(--ide-border-faint,rgba(30,58,95,0.2))]">
                <p className="text-[0.7rem] text-red-400/90 font-mono break-all leading-relaxed">
                  {errorMessage}
                </p>
                {errorStack && (
                  <pre className="mt-2 text-[0.58rem] text-[var(--ide-text-faint,#334155)] overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed">
                    {errorStack}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500/10 text-sky-400 text-[0.78rem] hover:bg-sky-500/20 transition-colors border border-sky-500/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重新加载
            </button>
            <button
              onClick={handleGoBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-[var(--ide-text-secondary,#94a3b8)] text-[0.78rem] hover:bg-white/10 transition-colors border border-[var(--ide-border-faint,rgba(30,58,95,0.2))]"
            >
              返回上页
            </button>
            <button
              onClick={handleGoHome}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-[var(--ide-text-secondary,#94a3b8)] text-[0.78rem] hover:bg-white/10 transition-colors border border-[var(--ide-border-faint,rgba(30,58,95,0.2))]"
            >
              <Home className="w-3.5 h-3.5" />
              返回首页
            </button>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-[0.62rem] text-[var(--ide-text-faint,#334155)] mt-4">
          YYC³ Family AI · 如问题持续出现，请检查控制台日志或联系开发团队
        </p>
      </div>
    </div>
  );
}
