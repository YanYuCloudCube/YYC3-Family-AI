/**
 * @file: SystemMonitorDashboard.tsx
 * @description: 本地系统监控仪表板 - 实时展示内存、存储、性能指标
 *              专为 YYC³ 开源本地工具设计，数据完全本地采集
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-04
 * @updated: 2026-04-04
 * @status: stable
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: monitor,dashboard,performance,local-storage,memory
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Gauge,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

function MetricCard({ title, value, unit, icon, color, bgColor, trend, subtitle }: MetricCardProps) {
  return (
    <div className={`rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.7rem] text-slate-400 font-medium">{title}</span>
        <div className={`p-1.5 rounded-lg ${bgColor}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${color}`}>{value}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      {(trend || subtitle) && (
        <div className="mt-2 flex items-center gap-1">
          {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
          {trend === 'down' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
          {trend === 'stable' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
          <span className="text-[0.6rem] text-slate-500">{subtitle}</span>
        </div>
      )}
    </div>
  );
}

interface StorageUsage {
  used: number;
  quota: number;
  percentage: number;
  persistentUsed?: number;
  persistentQuota?: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  percentage: number;
}

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  fid: number | null;
  ttfb: number | null;
}

export function SystemMonitorDashboard() {
  const [storage, setStorage] = useState<StorageUsage>({
    used: 0,
    quota: 0,
    percentage: 0,
  });
  const [memory, setMemory] = useState<MemoryInfo | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    ttfb: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  }, []);

  const formatMs = useCallback((ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }, []);

  const getStorageUsage = useCallback(async (): Promise<StorageUsage> => {
    if ('storage' in navigator && 'estimate' in (navigator as any).storage) {
      try {
        const estimate = await (navigator as any).storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
          persistentUsed: estimate.usageDetails?.persisted,
          persistentQuota: estimate.quotaDetails?.persisted,
        };
      } catch {
        return { used: 0, quota: 0, percentage: 0 };
      }
    }
    return { used: 0, quota: 0, percentage: 0 };
  }, []);

  const getMemoryInfo = useCallback((): MemoryInfo | null => {
    if ('memory' in performance) {
      const mem = (performance as any).memory as MemoryInfo & {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
        percentage: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }, []);

  const getPerformanceMetrics = useCallback((): PerformanceMetrics => {
    const entries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');

    return {
      fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
      lcp: lcpEntries.length > 0 ? Math.round(lcpEntries[lcpEntries.length - 1].startTime) : null,
      cls: null,
      fid: null,
      ttfb: entries ? Math.round(entries.responseStart - entries.requestStart) : null,
    };
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);

    const [storageData, memoryData, perfData] = await Promise.all([
      getStorageUsage(),
      Promise.resolve(getMemoryInfo()),
      Promise.resolve(getPerformanceMetrics()),
    ]);

    setStorage(storageData);
    setMemory(memoryData);
    setMetrics(perfData);
    setLastUpdate(new Date());
    setIsRefreshing(false);
  }, [getStorageUsage, getMemoryInfo, getPerformanceMetrics]);

  useEffect(() => {
    refreshAll();

    intervalRef.current = setInterval(refreshAll, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshAll]);

  const storageColor = storage.percentage > 80 ? 'text-red-400' : storage.percentage > 50 ? 'text-amber-400' : 'text-emerald-400';
  const storageBgColor = storage.percentage > 80 ? 'bg-red-500/10' : storage.percentage > 50 ? 'bg-amber-500/10' : 'bg-emerald-500/10';

  const memoryColor = memory && memory.percentage > 80 ? 'text-red-400' : memory && memory.percentage > 50 ? 'text-amber-400' : 'text-sky-400';
  const memoryBgColor = memory && memory.percentage > 80 ? 'bg-red-500/10' : memory && memory.percentage > 50 ? 'bg-amber-500/10' : 'bg-sky-500/10';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              系统监控仪表板
            </h1>
            <p className="text-xs text-slate-500 mt-1">YYC³ 本地运行状态 · 数据完全本地采集</p>
          </div>
          <button
            onClick={refreshAll}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        <div className="mt-2 text-[0.65rem] text-slate-600">
          最后更新: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="本地存储使用"
            value={formatBytes(storage.used)}
            unit={`/ ${formatBytes(storage.quota)}`}
            icon={<HardDrive className="w-4 h-4" style={{ color: storageColor }} />}
            color={storageColor}
            bgColor={storageBgColor}
            trend={storage.percentage > 80 ? 'down' : 'stable'}
            subtitle={`${storage.percentage.toFixed(1)}% 已使用`}
          />

          <MetricCard
            title="内存使用"
            value={memory ? formatBytes(memory.usedJSHeapSize) : '--'}
            unit=""
            icon={<MemoryStick className="w-4 h-4" style={{ color: memoryColor || '#94a3b8' }} />}
            color={memoryColor}
            bgColor={memoryBgColor}
            trend={memory && memory.percentage > 70 ? 'down' : 'stable'}
            subtitle={memory ? `${memory.percentage.toFixed(1)}% 堆内存` : '不可用'}
          />

          <MetricCard
            title="首屏渲染 (FCP)"
            value={metrics.fcp ? formatMs(metrics.fcp) : '--'}
            unit=""
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            color={metrics.fcp && metrics.fcp > 1800 ? 'text-red-400' : metrics.fcp && metrics.fcp > 1000 ? 'text-amber-400' : 'text-emerald-400'}
            bgColor={metrics.fcp && metrics.fcp > 1800 ? 'bg-red-500/10' : metrics.fcp && metrics.fcp > 1000 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}
            trend={metrics.fcp && metrics.fcp <= 1000 ? 'stable' : 'down'}
            subtitle={metrics.fcp ? (metrics.fcp <= 1000 ? '优秀' : metrics.fcp <= 1800 ? '良好' : '需优化') : '等待测量'}
          />

          <MetricCard
            title="最大内容绘制 (LCP)"
            value={metrics.lcp ? formatMs(metrics.lcp) : '--'}
            unit=""
            icon={<Gauge className="w-4 h-4 text-cyan-400" />}
            color={metrics.lcp && metrics.lcp > 2500 ? 'text-red-400' : metrics.lcp && metrics.lcp > 2000 ? 'text-amber-400' : 'text-emerald-400'}
            bgColor={metrics.lcp && metrics.lcp > 2500 ? 'bg-red-500/10' : metrics.lcp && metrics.lcp > 2000 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}
            subtitle={metrics.lcp ? (metrics.lcp <= 2000 ? '优秀' : '需优化') : '等待测量'}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="TTFB (首字节时间)"
            value={metrics.ttfb ? formatMs(metrics.ttfb) : '--'}
            unit=""
            icon={<Clock className="w-4 h-4 text-violet-400" />}
            color="text-violet-300"
            bgColor="bg-violet-500/10"
            subtitle={metrics.ttfb ? `服务器响应 + 网络延迟` : '等待导航'}
          />

          <MetricCard
            title="堆内存限制"
            value={memory ? formatBytes(memory.jsHeapSizeLimit) : '--'}
            unit=""
            icon={<Cpu className="w-4 h-4 text-orange-400" />}
            color="text-orange-300"
            bgColor="bg-orange-500/10"
            subtitle={memory ? `已用 ${(memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100).toFixed(1)}%` : ''}
          />

          <MetricCard
            title="持久化存储"
            value={storage.persistentUsed ? formatBytes(storage.persistentUsed) : '--'}
            unit="/ --"
            icon={<Database className="w-4 h-4 text-emerald-400" />}
            color="text-emerald-300"
            bgColor="bg-emerald-500/10"
            subtitle="IndexedDB 持久化数据"
          />
        </div>

        {/* Storage Breakdown */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            存储分布详情
          </h2>

          <div className="space-y-3">
            <StorageBar label="IndexedDB (文件/历史)" estimatedPercent={45} color="from-indigo-500 to-purple-500" />
            <StorageBar label="localStorage (配置/设置)" estimatedPercent={15} color="from-cyan-500 to-blue-500" />
            <StorageBar label="Cache API (静态资源)" estimatedPercent={30} color="from-emerald-500 to-teal-500" />
            <StorageBar label="其他 (Session/临时)" estimatedPercent={10} color="from-slate-500 to-gray-500" />
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[0.65rem] text-slate-500">
            <span>注: 存储分布为估算值</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              数据安全存储在本地
            </span>
          </div>
        </div>

        {/* Web Vitals Status */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            Core Web Vitals 状态
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <VitalStatus
              name="FCP"
              value={metrics.fcp}
              goodThreshold={1800}
              needsImprovementThreshold={3000}
              unit="ms"
            />
            <VitalStatus
              name="LCP"
              value={metrics.lcp}
              goodThreshold={2500}
              needsImprovementThreshold={4000}
              unit="ms"
            />
            <VitalStatus
              name="CLS"
              value={metrics.cls !== null ? metrics.cls * 100 : null}
              goodThreshold={0.1}
              needsImprovementThreshold={0.25}
              unit=""
              isScore
            />
            <VitalStatus
              name="FID"
              value={metrics.fid}
              goodThreshold={100}
              needsImprovementThreshold={300}
              unit="ms"
            />
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-emerald-300">本地隐私保护</p>
              <p className="text-[0.7rem] text-emerald-400/70 mt-1 leading-relaxed">
                所有监控数据仅在您的浏览器本地采集和展示，不会上传至任何服务器。
                YYC³ 遵循开源本地优先原则，您完全掌控自己的数据。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StorageBar({
  label,
  estimatedPercent,
  color,
}: {
  label: string;
  estimatedPercent: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-500 font-mono">~{estimatedPercent}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${estimatedPercent}%` }}
        />
      </div>
    </div>
  );
}

function VitalStatus({
  name,
  value,
  goodThreshold,
  needsImprovementThreshold,
  unit,
  isScore = false,
}: {
  name: string;
  value: number | null;
  goodThreshold: number;
  needsImprovementThreshold: number;
  unit: string;
  isScore?: boolean;
}) {
  let status: 'good' | 'needs-improvement' | 'poor' | 'pending' = 'pending';
  let statusText = '等待中';

  if (value !== null) {
    if (isScore) {
      if (value <= goodThreshold) { status = 'good'; statusText = '优秀'; }
      else if (value <= needsImprovementThreshold) { status = 'needs-improvement'; statusText = '一般'; }
      else { status = 'poor'; statusText = '差'; }
    } else {
      if (value <= goodThreshold) { status = 'good'; statusText = '优秀'; }
      else if (value <= needsImprovementThreshold) { status = 'needs-improvement'; statusText = '一般'; }
      else { status = 'poor'; statusText = '差'; }
    }
  }

  const statusConfig = {
    good: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
    'needs-improvement': { color: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
    poor: { color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400' },
    pending: { color: 'text-slate-500', bg: 'bg-slate-500/10', dot: 'bg-slate-500' },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg ${config.bg} p-3`}>
      <div className="text-[0.65rem] text-slate-400 mb-1">{name}</div>
      <div className={`text-lg font-bold ${config.color}`}>
        {value !== null ? (isScore ? value.toFixed(3) : value) : '--'}
        <span className="text-xs ml-0.5">{unit}</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <span className={`text-[0.6rem] ${config.color}`}>{statusText}</span>
      </div>
    </div>
  );
}

export default SystemMonitorDashboard;
