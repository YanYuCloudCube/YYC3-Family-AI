/**
 * @file: StorageSection.tsx
 * @description: 存储管理组件 — 管理 IndexedDB、LocalStorage、缓存
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: storage,indexeddb,localstorage,cache,settings
 */

import { useState, useEffect } from "react";
import {
  Database,
  HardDrive,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { useThemeTokens } from "../ide/hooks/useThemeTokens";
import { useMemoryStore } from "../ide/stores/useMemoryStore";
import { useSettingsStore } from "../ide/stores/useSettingsStore";
import { useSessionStore } from "../ide/stores/useSessionStore";
import { useWorkspaceStore } from "../ide/stores/useWorkspaceStore";
import { useTaskBoardStore } from "../ide/stores/useTaskBoardStore";
import { usePluginStore } from "../ide/stores/usePluginStore";

interface StorageInfo {
  name: string;
  type: "indexeddb" | "localstorage" | "memory";
  size: string;
  items: number;
  lastUpdated: string;
}

export function StorageSection() {
  const th = useThemeTokens();
  const [storageList, setStorageList] = useState<StorageInfo[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [clearResult, setClearResult] = useState<string | null>(null);

  const { memories, clearAll: clearMemory } = useMemoryStore();
  const settingsStore = useSettingsStore();
  const sessionStore = useSessionStore();
  const workspaceStore = useWorkspaceStore();
  const taskBoardStore = useTaskBoardStore();
  const pluginStore = usePluginStore();

  useEffect(() => {
    calculateStorageInfo();
  }, [memories]);

  const calculateStorageInfo = () => {
    const list: StorageInfo[] = [];

    list.push({
      name: "Agent Memory (IndexedDB)",
      type: "indexeddb",
      size: formatSize(JSON.stringify(memories).length),
      items: memories.length,
      lastUpdated: new Date().toLocaleString("zh-CN"),
    });

    const localStorageKeys = [
      { name: "Settings", key: "yyc3-settings" },
      { name: "Sessions", key: "yyc3-sessions" },
      { name: "Workspace", key: "yyc3-workspace" },
      { name: "TaskBoard", key: "yyc3-taskboard" },
      { name: "Plugins", key: "yyc3-plugin-settings" },
    ];

    localStorageKeys.forEach(({ name, key }) => {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        const items = Array.isArray(parsed?.state?.items)
          ? parsed.state.items.length
          : Object.keys(parsed?.state || {}).length;
        list.push({
          name: `${name} (LocalStorage)`,
          type: "localstorage",
          size: formatSize(data.length),
          items,
          lastUpdated: new Date().toLocaleString("zh-CN"),
        });
      }
    });

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        const used = formatSize(estimate.usage || 0);
        const quota = formatSize(estimate.quota || 0);
        console.log(`Storage: ${used} / ${quota}`);
      });
    }

    setStorageList(list);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleClearStorage = async (type: "indexeddb" | "localstorage" | "all") => {
    setIsClearing(true);
    setClearResult(null);

    try {
      if (type === "indexeddb" || type === "all") {
        await clearMemory();
      }

      if (type === "localstorage" || type === "all") {
        const keysToPreserve = ["yyc3-theme"];
        const allKeys = Object.keys(localStorage);
        allKeys.forEach((key) => {
          if (key.startsWith("yyc3-") && !keysToPreserve.includes(key)) {
            localStorage.removeItem(key);
          }
        });
      }

      calculateStorageInfo();
      setClearResult("success");
    } catch (error) {
      console.error("Clear storage error:", error);
      setClearResult("error");
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportData = () => {
    const exportData: Record<string, unknown> = {
      memories,
      settings: settingsStore,
      sessions: sessionStore.sessions,
      workspace: workspaceStore,
      taskBoard: taskBoardStore,
      plugins: pluginStore.plugins,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yyc3-storage-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalSize = storageList.reduce((acc, s) => {
    const size = parseFloat(s.size.split(" ")[0]);
    const unit = s.size.split(" ")[1];
    const bytes =
      unit === "MB" ? size * 1024 * 1024 : unit === "KB" ? size * 1024 : size;
    return acc + bytes;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${th.text.primary}`}>存储管理</h2>
          <p className={`text-sm ${th.text.caption} mt-1`}>
            管理应用数据存储，包括 IndexedDB 和 LocalStorage
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg ${th.page.cardBg} border ${th.page.cardBorder}`}>
          <span className={`text-sm ${th.text.caption}`}>总占用: </span>
          <span className={`text-sm font-medium ${th.text.primary}`}>
            {formatSize(totalSize)}
          </span>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}>
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-blue-400" />
          <span className={`text-sm ${th.text.secondary}`}>
            存储架构: 内存 → LocalStorage → IndexedDB 三层持久化
          </span>
        </div>

        <div className="space-y-3">
          {storageList.map((storage, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                th.page.cardBg
              } ${th.page.cardBorder} hover:border-[var(--ide-accent-solid)] transition-colors`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    storage.type === "indexeddb"
                      ? "bg-purple-500/20"
                      : "bg-blue-500/20"
                  }`}
                >
                  {storage.type === "indexeddb" ? (
                    <Database className="w-4 h-4 text-purple-400" />
                  ) : (
                    <HardDrive className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div>
                  <div className={`text-sm font-medium ${th.text.primary}`}>
                    {storage.name}
                  </div>
                  <div className={`text-xs ${th.text.caption}`}>
                    {storage.items} 条记录 · {storage.lastUpdated}
                  </div>
                </div>
              </div>
              <div className={`text-sm font-medium ${th.text.secondary}`}>
                {storage.size}
              </div>
            </div>
          ))}
        </div>
      </div>

      {clearResult && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg ${
            clearResult === "success"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {clearResult === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span className="text-sm">
            {clearResult === "success" ? "存储已清理" : "清理失败"}
          </span>
        </div>
      )}

      <div className={`p-4 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}>
        <h3 className={`text-sm font-medium ${th.text.primary} mb-4`}>操作</h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleClearStorage("indexeddb")}
            disabled={isClearing}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border ${th.page.cardBorder} hover:border-red-500/50 hover:bg-red-500/10 transition-colors disabled:opacity-50`}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className={`text-sm ${th.text.primary}`}>清理 IndexedDB</span>
          </button>

          <button
            onClick={() => handleClearStorage("localstorage")}
            disabled={isClearing}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border ${th.page.cardBorder} hover:border-orange-500/50 hover:bg-orange-500/10 transition-colors disabled:opacity-50`}
          >
            <Trash2 className="w-4 h-4 text-orange-400" />
            <span className={`text-sm ${th.text.primary}`}>清理 LocalStorage</span>
          </button>

          <button
            onClick={handleExportData}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border ${th.page.cardBorder} hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors`}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className={`text-sm ${th.text.primary}`}>导出数据</span>
          </button>

          <button
            onClick={() => calculateStorageInfo()}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border ${th.page.cardBorder} hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors`}
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span className={`text-sm ${th.text.primary}`}>刷新统计</span>
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--ide-border-dim)]">
          <button
            onClick={() => handleClearStorage("all")}
            disabled={isClearing}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 transition-colors disabled:opacity-50`}
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">清理全部存储</span>
          </button>
          <p className={`text-xs ${th.text.caption} mt-2 text-center`}>
            ⚠️ 此操作将清除所有本地数据，无法恢复
          </p>
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}>
        <h3 className={`text-sm font-medium ${th.text.primary} mb-3`}>存储说明</h3>
        <div className={`text-xs ${th.text.caption} space-y-2`}>
          <p>
            <strong className={th.text.secondary}>IndexedDB:</strong> 用于存储
            Multi-Agent 记忆、向量嵌入等大数据，支持跨会话持久化
          </p>
          <p>
            <strong className={th.text.secondary}>LocalStorage:</strong>{" "}
            用于存储用户设置、会话、工作空间等配置数据
          </p>
          <p>
            <strong className={th.text.secondary}>内存缓存:</strong>{" "}
            运行时状态，页面刷新后重置
          </p>
        </div>
      </div>
    </div>
  );
}
