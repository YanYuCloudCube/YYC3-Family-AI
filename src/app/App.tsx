/**
 * @file App.tsx
 * @description 应用根组件，集成路由、主题 Provider、错误边界、主题定制器
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.2.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags app,root,router,theme,providers
 */

import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider, useTheme } from "./components/ide/ThemeStore";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeCustomizer } from "./components/ide/ThemeCustomizer";
import { LoadingSpinner } from "./components/ide/LoadingSpinner";
import { initErrorReporting } from "./components/ide/services/ErrorReportingService";

// ── 初始化错误上报服务（应用启动时执行一次） ──
initErrorReporting({
  appVersion: "1.3.0",
  environment: import.meta.env.MODE || "development",
  sampleRate: 1.0,
  // 接入真实 Sentry 时取消注释下行：
  // dsn: "https://YOUR_PUBLIC_KEY@o0.ingest.sentry.io/YOUR_PROJECT_ID",
});

/** 路由加载时的全局 Fallback */
function RouteLoadingFallback() {
  return (
    <div className="size-full min-h-screen flex items-center justify-center bg-[var(--ide-bg-deep,#060d1a)]">
      <LoadingSpinner size="md" label="加载中..." />
    </div>
  );
}

/** Inner shell that can access ThemeContext for the customizer */
function AppShell() {
  const { showThemeCustomizer, setShowThemeCustomizer } = useTheme();

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
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
