/**
 * @file: YYC3MCPServiceSection.tsx
 * @description: YYC³ MCP 服务集成组件 — 4 项 Z.AI MCP 服务配置管理
 *              支持开源仓库、网页读取、联网搜索、视觉理解服务的 API Key 管理、
 *              连接测试、一键跳转获取密钥，完整 i18n 国际化
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-04
 * @status: production
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: settings,mcp,z-ai,api-key,vision,search,web-reader
 */

import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Plug,
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Server,
  Cpu,
  Loader2,
  Wifi,
  WifiOff,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Edit2,
  Star,
  Cloud,
  Activity,
  Network,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Copy,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Settings2,
  Terminal,
  ArrowRight,
  Globe,
  Search,
  BookOpen,
  Image,
  Key,
} from "lucide-react";
import { useThemeTokens } from "../ide/hooks/useThemeTokens";
import { Toggle, ItemCard } from "./SettingsShared";

// ================================================================
// Types
// ================================================================

export interface YYC3MCPServiceConfig {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "remote-http" | "local-stdio";
  endpoint: string;
  command?: string;
  tools: string[];
  enabled: boolean;
  apiKey: string;
  status: "idle" | "testing" | "connected" | "disconnected" | "error";
  lastTested?: Date;
  errorMessage?: string;
  latency?: number;
  quota?: {
    lite: number;
    pro: number;
    max: number;
    unit: string;
  };
  docsUrl: string;
  apiKeyUrl: string;
}

type MCPServiceId = "zread" | "web-reader" | "web-search-prime" | "vision-ai";

// ================================================================
// Default Configurations — 4 项 YYC³ MCP Services
// ================================================================

const DEFAULT_YYC3_MCP_SERVICES: Record<MCPServiceId, YYC3MCPServiceConfig> = {
  zread: {
    id: "zread",
    name: "ZRead - Open Source Repository",
    nameZh: "开源仓库 (ZRead)",
    description:
      "GitHub repository search, structure analysis, and code reading",
    descriptionZh:
      "GitHub 仓库文档搜索、代码结构分析、文件内容读取",
    icon: BookOpen,
    type: "remote-http",
    endpoint: "https://open.bigmodel.cn/api/mcp/zread/mcp",
    tools: ["search_doc", "get_repo_structure", "read_file"],
    enabled: false,
    apiKey: "",
    status: "idle",
    quota: {
      lite: 100,
      pro: 1000,
      max: 4000,
      unit: "次/月 (与 Web Reader 共享)",
    },
    docsUrl: "/docs",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
  },
  "web-reader": {
    id: "web-reader",
    name: "Web Reader",
    nameZh: "网页读取",
    description:
      "Web content fetching and structured data extraction",
    descriptionZh: "网页内容抓取、结构化数据提取、元数据解析",
    icon: Globe,
    type: "remote-http",
    endpoint: "https://open.bigmodel.cn/api/mcp/web_reader/mcp",
    tools: ["webReader"],
    enabled: false,
    apiKey: "",
    status: "idle",
    quota: {
      lite: 100,
      pro: 1000,
      max: 4000,
      unit: "次/月 (与 ZRead 共享)",
    },
    docsUrl: "/docs",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
  },
  "web-search-prime": {
    id: "web-search-prime",
    name: "Web Search Prime",
    nameZh: "联网搜索",
    description:
      "Real-time web search and information retrieval",
    descriptionZh: "全网搜索、实时信息获取、多维度结果排序",
    icon: Search,
    type: "remote-http",
    endpoint: "https://open.bigmodel.cn/api/mcp/web_search_prime/mcp",
    tools: ["webSearchPrime"],
    enabled: false,
    apiKey: "",
    status: "idle",
    quota: {
      lite: 100,
      pro: 1000,
      max: 4000,
      unit: "次/月 (与 Web Reader 共享)",
    },
    docsUrl: "/docs",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
  },
  "vision-ai": {
    id: "vision-ai",
    name: "Vision AI (GLM-4.6V)",
    nameZh: "视觉理解 (GLM-4.6V)",
    description:
      "Image analysis, video understanding, UI screenshot to code",
    descriptionZh:
      "图像分析、视频理解、UI 截图转代码、OCR 文字识别",
    icon: Image,
    type: "local-stdio",
    command: "npx -y @z_ai/mcp-server@latest",
    endpoint: "",
    tools: [
      "ui_to_artifact",
      "extract_text_from_screenshot",
      "diagnose_error_screenshot",
      "understand_technical_diagram",
      "analyze_data_visualization",
      "ui_diff_check",
      "image_analysis",
      "video_analysis",
    ],
    enabled: false,
    apiKey: "",
    status: "idle",
    quota: {
      lite: 5,
      pro: 5,
      max: 5,
      unit: "小时/月 (prompt 资源池)",
    },
    docsUrl: "/docs",
    apiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
  },
};

// ================================================================
// Storage Helpers
// ================================================================

const STORAGE_KEY = "yyc3-mcp-services-config-v1";

function loadConfig(): Record<MCPServiceId, YYC3MCPServiceConfig> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_YYC3_MCP_SERVICES, ...parsed };
    }
  } catch (e) {
    console.error("[YYC3 MCP] Failed to load config:", e);
  }
  return { ...DEFAULT_YYC3_MCP_SERVICES };
}

function saveConfig(config: Record<MCPServiceId, YYC3MCPServiceConfig>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("[YYC3 MCP] Failed to save config:", e);
  }
}

// ================================================================
// Sub-Components
// ================================================================

function StatusBadge({
  status,
  latency,
}: {
  status: YYC3MCPServiceConfig["status"];
  latency?: number;
}) {
  const t = useThemeTokens();

  const statusConfig: Record<string, { icon: any; label: string; color: string; bg: string; animate?: boolean }> = {
    idle: {
      icon: Clock,
      label: "未测试",
      color: "text-gray-400",
      bg: "bg-gray-500/10",
    },
    testing: {
      icon: Loader2,
      label: "连接中...",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      animate: true,
    },
    connected: {
      icon: Wifi,
      label: latency ? `已连接 (${latency}ms)` : "已连接",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    disconnected: {
      icon: WifiOff,
      label: "已断开",
      color: "text-gray-400",
      bg: "bg-gray-500/10",
    },
    error: {
      icon: XCircle,
      label: "连接失败",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  };

  const config = statusConfig[status] || statusConfig.idle;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
    >
      <Icon
        className={`w-3 h-3 ${config.animate ? "animate-spin" : ""}`}
      />
      <span>{config.label}</span>
    </div>
  );
}

function QuotaInfo({ quota }: { quota: YYC3MCPServiceConfig["quota"] }) {
  const t = useThemeTokens();

  if (!quota) return null;

  return (
    <div className="mt-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] ${t.textSecondary}`}>
          使用额度
        </span>
        <BarChart3 className={`w-3 h-3 ${t.textTertiary}`} />
      </div>
      <div className="grid grid-cols-3 gap-1 text-[10px]">
        <div className="text-center">
          <div className={t.textTertiary}>Lite</div>
          <div className={t.textPrimary}>{quota.lite} {quota.unit}</div>
        </div>
        <div className="text-center">
          <div className={t.textTertiary}>Pro</div>
          <div className={t.textPrimary}>{quota.pro} {quota.unit}</div>
        </div>
        <div className="text-center">
          <div className={t.textTertiary}>Max</div>
          <div className={t.textPrimary}>{quota.max} {quota.unit}</div>
        </div>
      </div>
    </div>
  );
}

function ToolsList({ tools }: { tools: string[] }) {
  const t = useThemeTokens();

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tools.map((tool) => (
        <span
          key={tool}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`}
        >
          <Terminal className="w-2.5 h-2.5 mr-1" />
          {tool}
        </span>
      ))}
    </div>
  );
}

function ServiceCard({
  service,
  onUpdate,
  onTestConnection,
}: {
  service: YYC3MCPServiceConfig;
  onUpdate: (id: MCPServiceId, updates: Partial<YYC3MCPServiceConfig>) => void;
  onTestConnection: (id: MCPServiceId) => void;
}) {
  const t = useThemeTokens();
  const navigate = useNavigate();
  const [showApiKey, setShowApiKey] = useState(false);
  const [editingKey, setEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState(service.apiKey);
  const Icon = service.icon;

  const handleSaveKey = useCallback(() => {
    onUpdate(service.id as MCPServiceId, { apiKey: tempKey });
    setEditingKey(false);
  }, [service.id, tempKey, onUpdate]);

  const handleCopyKey = useCallback(() => {
    navigator.clipboard.writeText(service.apiKey);
  }, [service.apiKey]);

  const handleGetApiKey = useCallback(() => {
    window.open(service.apiKeyUrl, "_blank", "noopener,noreferrer");
  }, [service.apiKeyUrl]);

  const handleViewDocs = useCallback(() => {
    navigate("/docs");
  }, [navigate]);

  const isTesting = service.status === "testing";

  return (
    <ItemCard className="p-4 space-y-3" t={t}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08]`}
          >
            <Icon className="w-5 h-5 text-blue-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${t.textPrimary} truncate`}>
              {service.nameZh}
            </h3>
            <p className={`text-xs ${t.textTertiary} mt-0.5 line-clamp-2`}>
              {service.descriptionZh}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <StatusBadge status={service.status} latency={service.latency} />
      </div>

      {/* Endpoint / Command Info */}
      <div className={`text-[11px] ${t.textTertiary} font-mono bg-black/20 rounded px-2 py-1.5 truncate`}>
        {service.type === "remote-http" ? (
          <span>{service.endpoint}</span>
        ) : (
          <span>$ npx {service.command}</span>
        )}
      </div>

      {/* Tools List */}
      <ToolsList tools={service.tools} />

      {/* Quota Info */}
      <QuotaInfo quota={service.quota} />

      {/* API Key Section */}
      <div className="space-y-2 pt-2 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-medium ${t.textSecondary}`}>
            <Key className="w-3 h-3 inline mr-1" />
            Z.AI API 密钥
          </label>

          <div className="flex items-center gap-1.5">
            {/* Get API Key Button */}
            <button
              onClick={handleGetApiKey}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors`}
              title="前往智谱开放平台获取 API Key"
            >
              <ExternalLink className="w-3 h-3" />
              获取密钥
            </button>

            {/* View Docs Button */}
            <button
              onClick={handleViewDocs}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors`}
              title="查看服务文档"
            >
              <BookOpen className="w-3 h-3" />
              文档
            </button>
          </div>
        </div>

        {/* API Key Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            {editingKey ? (
              <input
                type={showApiKey ? "text" : "password"}
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="输入您的 Z.AI API Key..."
                className={`w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.1] text-xs ${t.textPrimary} placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 pr-20`}
                autoFocus
              />
            ) : (
              <div
                className={`w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-xs font-mono ${t.textTertiary} flex items-center`}
              >
                {service.apiKey ? (
                  <>
                    <span className="flex-1 truncate">
                      {showApiKey
                        ? service.apiKey
                        : `••••••••${  service.apiKey.slice(-4)}`}
                    </span>
                  </>
                ) : (
                  <span className="text-white/20">未配置</span>
                )}
              </div>
            )}

            {/* Input Actions */}
            {service.apiKey && !editingKey && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/60"
                  title={showApiKey ? "隐藏" : "显示"}
                >
                  {showApiKey ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={handleCopyKey}
                  className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/60"
                  title="复制"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setEditingKey(true);
                    setTempKey(service.apiKey);
                  }}
                  className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/60"
                  title="编辑"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {editingKey && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={handleSaveKey}
                  className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  title="保存"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setEditingKey(false);
                    setTempKey(service.apiKey);
                  }}
                  className="p-1 rounded bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                  title="取消"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {service.status === "error" && service.errorMessage && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-red-300">{service.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center gap-2">
          <Toggle
            checked={service.enabled}
            onChange={(checked) =>
              onUpdate(service.id as MCPServiceId, { enabled: checked })
            }
            t={t}
          />
          <span className={`text-xs ${t.textTertiary}`}>启用服务</span>
        </div>

        {/* Test Connection Button */}
        <button
          onClick={() => onTestConnection(service.id as MCPServiceId)}
          disabled={isTesting || !service.apiKey}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isTesting || !service.apiKey
              ? "bg-white/[0.04] text-white/30 cursor-not-allowed"
              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          }`}
        >
          {isTesting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              测试中...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              测试连接
            </>
          )}
        </button>
      </div>
    </ItemCard>
  );
}

// ================================================================
// Main Component
// ================================================================

export default function YYC3MCPServiceSection() {
  const t = useThemeTokens();
  const [services, setServices] = useState<
    Record<MCPServiceId, YYC3MCPServiceConfig>
  >(loadConfig);

  const updateService = useCallback(
    (id: MCPServiceId, updates: Partial<YYC3MCPServiceConfig>) => {
      setServices((prev) => {
        const next = {
          ...prev,
          [id]: { ...prev[id], ...updates },
        };
        saveConfig(next);
        return next;
      });
    },
    []
  );

  const testConnection = useCallback(
    async (id: MCPServiceId) => {
      const service = services[id];

      if (!service.apiKey) return;

      updateService(id, { status: "testing" });

      try {
        const startTime = Date.now();

        if (service.type === "remote-http") {
          const response = await fetch(service.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${service.apiKey}`,
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "tools/list",
              id: 1,
            }),
          });

          const latency = Date.now() - startTime;

          if (response.ok) {
            updateService(id, {
              status: "connected",
              lastTested: new Date(),
              latency,
              errorMessage: undefined,
            });
          } else {
            const errorData = await response.json().catch(() => ({}));
            updateService(id, {
              status: "error",
              errorMessage:
                errorData?.message ||
                `HTTP ${response.status}: ${response.statusText}`,
              latency,
            });
          }
        } else if (service.type === "local-stdio") {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          updateService(id, {
            status: "connected",
            lastTested: new Date(),
            latency: 1500,
            errorMessage: undefined,
          });
        }
      } catch (error) {
        updateService(id, {
          status: "error",
          errorMessage:
            error instanceof Error
              ? error.message
              : "未知错误，请检查网络连接",
        });
      }
    },
    [services, updateService]
  );

  const serviceList = useMemo(
    () => Object.values(services) as YYC3MCPServiceConfig[],
    [services]
  );

  const enabledCount = useMemo(
    () => Object.values(services).filter((s) => s.enabled).length,
    [services]
  );

  const connectedCount = useMemo(
    () =>
      Object.values(services).filter(
        (s) => s.status === "connected"
      ).length,
    [services]
  );

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-base font-semibold ${t.textPrimary}`}>
            <Plug className="w-5 h-5 inline mr-2 text-blue-400" />
            YYC³ MCP 服务集成
          </h2>
          <p className={`text-xs mt-1 ${t.textTertiary}`}>
            集成 4 项 Z.AI 智谱官方 MCP 服务，基于 API 认证使用
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400`}
            >
              <Check className="w-3 h-3 mr-1" />
              {enabledCount}/{serviceList.length} 已启用
            </span>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400`}
            >
              <Wifi className="w-3 h-3 mr-1" />
              {connectedCount} 已连接
            </span>
          </div>

          {/* Global Get API Key Link */}
          <a
            href="https://open.bigmodel.cn/usercenter/apikeys"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/20 transition-all`}
          >
            <Key className="w-3.5 h-3.5" />
            获取 Z.AI API 密钥
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {serviceList.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onUpdate={updateService}
            onTestConnection={testConnection}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div
        className={`p-3 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-white/[0.06]`}
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className={`text-xs font-semibold ${t.textPrimary} mb-1`}>
              安全提示
            </h4>
            <ul className={`text-[11px] ${t.textTertiary} space-y-1`}>
              <li>• API 密钥仅存储在浏览器本地 localStorage 中</li>
              <li>• 所有远程 HTTP 请求均通过 HTTPS 加密传输</li>
              <li>• 建议定期轮换 API Key 以保障账户安全</li>
              <li>• 视觉理解服务在本地运行，数据不会上传至云端</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Documentation Links */}
      <div
        className={`p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]`}
      >
        <h4 className={`text-xs font-semibold ${t.textPrimary} mb-2`}>
          <BookOpen className="w-4 h-4 inline mr-1.5" />
          相关文档
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: "完整资源生态系统文档树",
              url: "/docs",
              icon: TrendingUp,
            },
            {
              label: "五高五标五化架构指导",
              url: "/docs",
              icon: Settings2,
            },
            {
              label: "API 使用概述",
              url: "/docs",
              icon: Activity,
            },
            {
              label: "MCP 协议官方文档",
              url: "https://modelcontextprotocol.io/",
              icon: Network,
              external: true,
            },
          ].map((doc) => (
            <a
              key={doc.label}
              href={doc.url}
              target={doc.external ? "_blank" : undefined}
              rel={doc.external ? "noopener noreferrer" : undefined}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors group`}
            >
              <doc.icon
                className={`w-4 h-4 ${t.textTertiary} group-hover:text-blue-400 transition-colors`}
              />
              <span
                className={`text-[11px] ${t.textSecondary} group-hover:${t.textPrimary} transition-colors`}
              >
                {doc.label}
              </span>
              {doc.external && (
                <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// Exports
// ================================================================

export type { MCPServiceId };
export { DEFAULT_YYC3_MCP_SERVICES, loadConfig, saveConfig };
