/**
 * @file: App.tsx
 * @description: 应用根组件，集成路由、主题 Provider、错误边界、主题定制器
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.3.0
 * @created: 2026-03-06
 * @updated: 2026-04-01
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: app,root,router,theme,providers
 */

import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useThemeStore } from "./components/ide/stores/useThemeStore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeCustomizer } from "./components/ide/ThemeCustomizer";
import { LoadingSpinner } from "./components/ide/LoadingSpinner";
import { initErrorReporting } from "./components/ide/services/ErrorReportingService";
import { initializeApiKeysFromEnv } from "./components/ide/LLMService";
import { useEffect } from "react";

// ── 初始化错误上报服务（应用启动时执行一次） ──
initErrorReporting({
  appVersion: "1.3.0",
  environment: import.meta.env.MODE || "development",
  sampleRate: 1.0,
  // 接入真实 Sentry 时取消注释下行：
  // dsn: "https://YOUR_PUBLIC_KEY@o0.ingest.sentry.io/YOUR_PROJECT_ID",
});

// ── 初始化 API Keys（从环境变量加载） ──
initializeApiKeysFromEnv();

/** 路由加载时的全局 Fallback */
function _RouteLoadingFallback() {
  return (
    <div className="size-full min-h-screen flex items-center justify-center bg-[var(--ide-bg-deep,#060d1a)]">
      <LoadingSpinner size="md" label="加载中..." />
    </div>
  );
}

/** Inner shell that can access Zustand theme store for customizer */
function AppShell() {
  const { showThemeCustomizer, setShowThemeCustomizer } = useThemeStore();

  return (
    <>
      <RouterProvider router={router} />
      <ThemeCustomizer
        open={showThemeCustomizer}
        onClose={() => setShowThemeCustomizer(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}
