/**
 * @file: PWAInstallPrompt.tsx
 * @description: PWA 安装提示组件 - 支持安装提示、离线状态显示、更新通知
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-04
 * @updated: 2026-04-04
 * @status: stable
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: pwa,install,prompt,offline,ui
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  Smartphone,
  Shield,
  Zap,
} from 'lucide-react';
import { usePWA } from './ide/hooks/usePWA';

interface PWAInstallPromptProps {
  position?: 'top-right' | 'bottom-center' | 'bottom-right';
  showOfflineIndicator?: boolean;
  showUpdateBadge?: boolean;
}

export function PWAInstallPrompt({
  position = 'bottom-right',
  showOfflineIndicator = true,
  showUpdateBadge = true,
}: PWAInstallPromptProps) {
  const pwa = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (pwa.isInstallable && !pwa.isInstalled && !dismissed) {
      const timer = setTimeout(() => setShowInstallBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [pwa.isInstallable, pwa.isInstalled, dismissed]);

  const handleInstall = useCallback(async () => {
    setInstalling(true);
    const success = await pwa.install();
    setInstalling(false);
    setShowInstallBanner(!success);
  }, [pwa.install]);

  const handleDismiss = useCallback(() => {
    setShowInstallBanner(false);
    setDismissed(true);
    pwa.clearPrompt();
  }, [pwa.clearPrompt]);

  const handleUpdate = useCallback(async () => {
    await pwa.update();
    window.location.reload();
  }, [pwa.update]);

  if (!showInstallBanner && !showOfflineIndicator && !showUpdateBadge) return null;

  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-[9999]',
    'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]',
    'bottom-right': 'fixed bottom-4 right-4 z-[9999]',
  };

  return (
    <div className={positionClasses[position]} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Install Banner */}
      {showInstallBanner && (
        <div
          className="mb-3 w-[340px] rounded-xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-2xl shadow-black/30 backdrop-blur-sm animate-in slide-in-from-bottom-5 fade-in duration-300"
          role="dialog"
          aria-label="安装 YYC³ 应用"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20">
              <Smartphone className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white">安装 YYC³ Family AI</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                添加到主屏幕，获得更好的本地体验
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <Zap className="h-3 w-3" />
                  离线可用
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                  <Shield className="h-3 w-3" />
                  数据安全
                </span>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-slate-300 transition-colors"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
            >
              {installing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  安装中...
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  立即安装
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors"
            >
              稍后
            </button>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {showOfflineIndicator && pwa.isOffline && (
        <div className="mb-3 w-[340px] flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 animate-in fade-in duration-200">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="text-xs text-amber-200">离线模式 - 本地功能可用</span>
        </div>
      )}

      {/* Online Indicator (transient) */}
      {showOfflineIndicator && pwa.isOnline && !pwa.isOffline && (
        <div className="mb-3 w-[340px] flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 animate-in fade-in duration-200">
          <Wifi className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="text-xs text-emerald-200">已连接网络</span>
        </div>
      )}

      {/* Update Badge */}
      {showUpdateBadge && pwa.updateAvailable && (
        <div className="w-[340px] flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2">
          <RefreshCw className="h-4 w-4 shrink-0 text-indigo-400 animate-spin" />
          <span className="text-xs text-indigo-200 flex-1">新版本可用</span>
          <button
            onClick={handleUpdate}
            className="rounded-md bg-indigo-500 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-indigo-600 transition-colors"
          >
            更新
          </button>
        </div>
      )}
    </div>
  );
}

export default PWAInstallPrompt;
