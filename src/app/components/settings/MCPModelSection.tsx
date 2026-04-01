// @ts-nocheck
/**
 * @file settings/MCPModelSection.tsx
 * @description MCP 连接管理与模型配置设置面板 — CRUD 操作、启用/禁用、端点配置、
 *              集成真实 API Key 验证和 MCP 连接测试，全面 i18n 国际化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,mcp,models,management,validation,i18n
 */

import { useState, useCallback, useMemo, useEffect } from "react";
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
  Lightbulb,
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
  PlusCircle,
  MinusCircle,
  Bug,
  Lock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useThemeTokens } from "../ide/hooks/useThemeTokens";
import { useModelRegistry } from "../ide/ModelRegistry";
import { useSettingsStore, type MCPConfig } from "../ide/stores/useSettingsStore";
import { ItemCard, EmptyState, Toggle } from "./SettingsShared";
import { useI18n } from "../ide/i18n";
import {
  validateAPIKey,
  testMCPConnection,
  type APIKeyValidationResult,
  type MCPConnectionTestResult,
} from "../ide/SettingsBridge";
import { type ProviderId } from "../ide/LLMService";
import {
  loadJSON,
  saveJSON,
  SK_PROVIDER_API_KEYS,
  SK_PROVIDER_URLS,
  SK_MCP_SERVERS,
  SK_CUSTOM_PROVIDERS,
  SK_OLLAMA_CACHE_PREFIX,
  SK_MODEL_PERF_DATA,
} from "../ide/constants/storage-keys";
import { copyToClipboard } from "../ide/utils/clipboard";
import {
  BUILTIN_PROVIDERS,
  type ProviderDef,
  type ModelDef,
} from "../ide/constants/providers";
import {
  loadProxyConfig,
  saveProxyConfig,
  checkProxyHealth,
  type ProxyConfig,
  DEFAULT_PROXY_CONFIG,
  PROXY_SERVER_TEMPLATE,
} from "../ide/ProxyService";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";

// ── Provider 映射 ──
const _PROVIDER_TO_ID: Record<string, ProviderId> = {
  OpenAI: "openai",
  Anthropic: "custom",
  Google: "custom",
  Zhipu: "zhipu",
  Baidu: "dashscope",
  Alibaba: "dashscope",
  DeepSeek: "deepseek",
  Ollama: "ollama",
  Custom: "custom",
};

// ================================================================
// Types (local to ModelSettings)
// ================================================================

interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  enabled: boolean;
}

interface DiagnosticResult {
  providerId: string;
  modelName: string;
  status: "idle" | "testing" | "success" | "error";
  latency?: number;
  message: string;
  modelResponse?: string;
  timestamp?: number;
}

interface OllamaDetectedModel {
  name: string;
  size: string;
  status: "online" | "offline";
  quantization: string;
}

// ================================================================

// ================================================================
// Default MCP Servers
// ================================================================

const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    id: "mcp-filesystem",
    name: "Filesystem",
    description: "文件系统读写操作",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/app/designs"],
    env: {},
    enabled: true,
  },
  {
    id: "mcp-fetch",
    name: "Fetch",
    description: "HTTP 请求工具",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-fetch"],
    env: {},
    enabled: true,
  },
  {
    id: "mcp-postgres",
    name: "PostgreSQL",
    description: "数据库查询工具",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres"],
    env: { DATABASE_URL: "postgresql://user:pwd@localhost:5432/yanyucloud" },
    enabled: false,
  },
];

const STORAGE_KEYS = {
  providerKeys: SK_PROVIDER_API_KEYS,
  providerUrls: SK_PROVIDER_URLS,
  mcpServers: SK_MCP_SERVERS,
  customProviders: SK_CUSTOM_PROVIDERS,
  ollamaCache: SK_OLLAMA_CACHE_PREFIX,
};

// ================================================================
// Provider Definitions
// ================================================================

const PROVIDERS = BUILTIN_PROVIDERS;

const _SIMULATED_OLLAMA_MODELS: OllamaDetectedModel[] = [
  {
    name: "llama3.1:8b",
    size: "4.7 GB",
    status: "online",
    quantization: "Q4_K_M",
  },
  {
    name: "codellama:13b",
    size: "7.4 GB",
    status: "online",
    quantization: "Q4_0",
  },
  {
    name: "qwen2.5:7b",
    size: "4.4 GB",
    status: "online",
    quantization: "Q4_K_M",
  },
  {
    name: "deepseek-coder:6.7b",
    size: "3.8 GB",
    status: "offline",
    quantization: "Q5_K_M",
  },
  {
    name: "mistral:7b",
    size: "4.1 GB",
    status: "online",
    quantization: "Q4_0",
  },
  { name: "glm4:9b", size: "5.5 GB", status: "online", quantization: "Q4_K_M" },
];

// ================================================================
// Sub-Components
// ================================================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
      title="复制"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-400" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </button>
  );
}

function getDiagnosticSuggestion(diag: DiagnosticResult): string | null {
  if (diag.status === "success") {
    if (diag.latency !== undefined) {
      if (diag.latency < 500) {
        return "响应速度优秀，适合实时对话场景";
      } else if (diag.latency < 1500) {
        return "响应速度良好，适合大多数使用场景";
      } else {
        return "响应速度较慢，建议检查网络连接或考虑使用更快的模型";
      }
    }
    return "连接正常，可以正常使用";
  }

  if (diag.status === "error") {
    const message = diag.message.toLowerCase();

    if (message.includes("api key") || message.includes("401")) {
      return "请检查 API Key 是否正确，或前往服务商官网重新生成";
    }

    if (message.includes("403") || message.includes("权限")) {
      return "请检查账户权限，确保 API Key 有足够的访问权限";
    }

    if (message.includes("404") || message.includes("端点不存在")) {
      return "请检查 API 端点 URL 是否正确，或联系服务商确认服务状态";
    }

    if (message.includes("429") || message.includes("频率")) {
      return "请求频率超限，请稍后再试或升级服务套餐";
    }

    if (message.includes("超时") || message.includes("timeout")) {
      return "连接超时，请检查网络连接或尝试配置代理服务器";
    }

    if (message.includes("网络") || message.includes("fetch")) {
      return "网络连接失败，建议：① 检查网络连接 ② 配置代理服务器 ③ 检查防火墙设置";
    }

    if (message.includes("cors") || message.includes("跨域")) {
      return "CORS 跨域限制，建议配置代理服务器或使用后端转发";
    }

    return "请检查网络连接和配置，或联系技术支持获取帮助";
  }

  return null;
}

// ================================================================
// MCP Section
// ================================================================

export function MCPSection() {
  const th = useThemeTokens();
  const { t } = useI18n();
  const { settings, addMCP, updateMCP, removeMCP } = useSettingsStore();
  const mcps = settings.mcpConfigs;
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<MCPConfig>>({});

  // ── MCP 连接测试状态 ──
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, MCPConnectionTestResult>
  >({});

  // ── MCP 编辑状态 ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});

  const handleCreate = () => {
    const newMCP: MCPConfig = {
      id: `mcp-${Date.now()}`,
      name: draft.name || `${t("settings.createNew")  } MCP`,
      type: draft.type || "manual",
      endpoint: draft.endpoint || "",
      enabled: true,
      projectLevel: draft.projectLevel || false,
    };
    addMCP(newMCP);
    setDraft({});
    setIsCreating(false);
  };

  const handleTestConnection = useCallback(
    async (mcp: MCPConfig) => {
      if (!mcp.endpoint) return;
      setTestingId(mcp.id);
      try {
        const result = await testMCPConnection(mcp.endpoint);
        setTestResults((prev) => ({ ...prev, [mcp.id]: result }));
      } catch {
        setTestResults((prev) => ({
          ...prev,
          [mcp.id]: { connected: false, error: t("common.error") },
        }));
      } finally {
        setTestingId(null);
      }
    },
    [t],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
      >
        <div className="flex items-center gap-2">
          <Plug className={`w-4 h-4 ${th.status.info}`} />
          <span className={`text-[0.82rem] ${th.text.primary}`}>
            {mcps.length} {t("settings.mcp")}
          </span>
          <span className={`text-[0.72rem] ${th.text.caption}`}>
            ({mcps.filter((m) => m.enabled).length} {t("settings.enabled")})
          </span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
        >
          <Plus className="w-3.5 h-3.5" />
          {t("settings.addNew")}
        </button>
      </div>

      {/* Create */}
      {isCreating && (
        <ItemCard t={th} className="space-y-3">
          <div className={`text-[0.82rem] ${th.text.primary}`}>
            {t("settings.addNew")} MCP
          </div>

          {/* 示例配置说明 */}
          <div className={`px-3 py-2 rounded-lg border ${th.page.inputBg} ${th.page.inputBorder}`}>
            <div className={`text-[0.72rem] ${th.text.caption} mb-2`}>
              请从 MCP Servers 的介绍页面复制配置 JSON(优先使用 NPX或 UVX 配置)，并粘贴到输入框中
            </div>
            <pre className={`text-[0.68rem] font-mono ${th.text.muted} whitespace-pre-wrap`}>
{`// 示例:
// {
//   "mcpServers": {
//     "example-server": {
//       "command": "npx",
//       "args": [
//         "-y",
//         "mcp-server-example"
//       ]
//     }
//   }
// }`}
            </pre>
          </div>

          <input
            placeholder={`${t("settings.mcp")  } ${  t("common.edit")}`}
            value={draft.name || ""}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
          />
          <input
            placeholder="Endpoint (e.g. mcp://service)"
            value={draft.endpoint || ""}
            onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] font-mono ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mcp-type"
                checked={draft.type !== "market"}
                onChange={() => setDraft({ ...draft, type: "manual" })}
                className="accent-violet-500"
              />
              <span className={`text-[0.78rem] ${th.text.secondary}`}>
                {t("settings.custom")}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mcp-type"
                checked={draft.type === "market"}
                onChange={() => setDraft({ ...draft, type: "market" })}
                className="accent-violet-500"
              />
              <span className={`text-[0.78rem] ${th.text.secondary}`}>
                Market
              </span>
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setIsCreating(false);
                setDraft({});
              }}
              className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.ghost} ${th.btn.ghostHover}`}
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleCreate}
              className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
            >
              <Check className="w-3.5 h-3.5 inline mr-1" />
              {t("common.confirm")}
            </button>
          </div>
        </ItemCard>
      )}

      {/* MCP List */}
      {mcps.length === 0 ? (
        <EmptyState icon={Plug} message={t("common.noData")} t={th} />
      ) : (
        <div className="space-y-2">
          {mcps.map((mcp) => {
            const testResult = testResults[mcp.id];
            const isTesting = testingId === mcp.id;

            return (
              <ItemCard key={mcp.id} t={th}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      mcp.enabled
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-gray-500/10 border border-gray-500/20"
                    }`}
                  >
                    <Server
                      className={`w-4 h-4 ${mcp.enabled ? "text-emerald-400" : "text-gray-400"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[0.85rem] ${th.text.primary}`}>
                        {mcp.name}
                      </span>
                      <span
                        className={`text-[0.58rem] px-1.5 py-0.5 rounded ${
                          mcp.type === "market"
                            ? th.status.infoBg
                            : th.status.warningBg
                        }`}
                      >
                        {mcp.type === "market"
                          ? "Market"
                          : t("settings.custom")}
                      </span>
                      {mcp.projectLevel && (
                        <span
                          className={`text-[0.58rem] px-1.5 py-0.5 rounded ${th.status.successBg}`}
                        >
                          {t("settings.project")}
                        </span>
                      )}
                    </div>
                    {mcp.endpoint && (
                      editingId === mcp.id ? (
                        <input
                          value={editDraft[mcp.id] || mcp.endpoint}
                          onChange={(e) => setEditDraft({ ...editDraft, [mcp.id]: e.target.value })}
                          onBlur={() => {
                            if (editDraft[mcp.id] && editDraft[mcp.id] !== mcp.endpoint) {
                              updateMCP(mcp.id, { endpoint: editDraft[mcp.id] });
                            }
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (editDraft[mcp.id] && editDraft[mcp.id] !== mcp.endpoint) {
                                updateMCP(mcp.id, { endpoint: editDraft[mcp.id] });
                              }
                              setEditingId(null);
                            }
                            if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                          autoFocus
                          className={`w-full px-2 py-1 rounded border text-[0.72rem] font-mono ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
                        />
                      ) : (
                        <div
                          className={`text-[0.72rem] ${th.text.caption} font-mono truncate cursor-pointer hover:${th.text.secondary}`}
                          onClick={() => {
                            setEditingId(mcp.id);
                            setEditDraft({ ...editDraft, [mcp.id]: mcp.endpoint });
                          }}
                        >
                          {mcp.endpoint}
                        </div>
                      )
                    )}
                    {/* 连接测试结果 */}
                    {testResult && (
                      <div
                        className={`flex items-center gap-1.5 mt-1 text-[0.68rem] ${
                          testResult.connected
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {testResult.connected ? (
                          <Wifi className="w-3 h-3" />
                        ) : (
                          <WifiOff className="w-3 h-3" />
                        )}
                        {testResult.connected
                          ? `${t("common.success")} (${testResult.latencyMs}ms)`
                          : `${t("common.error")}: ${testResult.error}`}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* 测试连接按钮 */}
                    {mcp.endpoint && (
                      <button
                        onClick={() => handleTestConnection(mcp)}
                        disabled={isTesting}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[0.68rem] transition-all ${
                          isTesting
                            ? "opacity-50 cursor-not-allowed"
                            : `${th.btn.ghost} ${th.btn.ghostHover}`
                        }`}
                        title="Test Connection"
                      >
                        {isTesting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Zap className={`w-3 h-3 ${th.text.accent} cursor-pointer hover:scale-110 transition-transform`} />
                        )}
                        {isTesting ? t("common.loading") : "Test"}
                      </button>
                    )}
                    <Toggle
                      checked={mcp.enabled}
                      onChange={(v) => updateMCP(mcp.id, { enabled: v })}
                      t={th}
                    />
                    <button
                      onClick={() => removeMCP(mcp.id)}
                      className={`p-1.5 rounded-lg ${th.hoverBg}`}
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${th.status.error}`} />
                    </button>
                  </div>
                </div>
              </ItemCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ================================================================
// Model Section
// ================================================================

export function ModelSection() {
  const th = useThemeTokens();
  const { t } = useI18n();
  const {
    models: aiModels,
    addCustomModel,
    removeCustomModel,
    updateCustomModel,
    activeModelId,
    setActiveModelId,
    ollamaStatus,
    ollamaDetectedModels,
    importedOllamaIds,
    importOllamaModel,
    recheckOllama,
    providers,
    getProviderApiKey,
    setProviderApiKey,
    hasProviderKey,
  } = useModelRegistry();

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<AIModel>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"models" | "providers" | "ollama" | "mcp" | "diagnostics" | "proxy">("models");

  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<
    Record<string, APIKeyValidationResult>
  >({});

  const providerOptions = [
    "OpenAI",
    "Anthropic",
    "Google",
    "Zhipu",
    "Baidu",
    "Alibaba",
    "DeepSeek",
    "Custom",
  ];

  // Provider API keys & URLs (persisted)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() =>
    loadJSON(STORAGE_KEYS.providerKeys, {}),
  );
  const [customUrls, setCustomUrls] = useState<Record<string, string>>(() =>
    loadJSON(STORAGE_KEYS.providerUrls, {}),
  );

  // Custom providers (user-added)
  const [customProviders, setCustomProviders] = useState<ProviderDef[]>(() =>
    loadJSON(STORAGE_KEYS.customProviders, []),
  );
  const [addingProvider, setAddingProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: "",
    baseURL: "",
    apiKeyUrl: "",
  });

  // Diagnostics
  const [diagnostics, setDiagnostics] = useState<
    Record<string, DiagnosticResult>
  >({});

  // Testing providers state for progress animation
  const [testingProviders, setTestingProviders] = useState<Set<string>>(new Set());

  // Ollama
  const [ollamaHost, setOllamaHost] = useState("http://localhost:11434");
  const [ollamaScanning, setOllamaScanning] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaDetectedModel[]>([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);

  // Proxy configuration
  const [proxyConfig, setProxyConfig] = useState<ProxyConfig>(() => loadProxyConfig());
  const [proxyChecking, setProxyChecking] = useState(false);
  const [proxyHealth, setProxyHealth] = useState<{
    healthy: boolean;
    latencyMs: number;
    version?: string;
    error?: string;
  } | null>(null);

  // MCP configuration
  const [mcpServers, setMcpServers] = useState<MCPServerConfig[]>(() =>
    loadJSON(STORAGE_KEYS.mcpServers, DEFAULT_MCP_SERVERS),
  );
  const [addingMcpServer, setAddingMcpServer] = useState(false);
  const [editingMcpServer, setEditingMcpServer] = useState<string | null>(null);
  const [mcpServerDraft, setMcpServerDraft] = useState({
    name: "",
    command: "",
    args: "",
    env: "",
    description: "",
  });
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonDraft, setJsonDraft] = useState("");
  const [jsonError, setJsonError] = useState("");

  // Persist MCP servers
  useEffect(() => {
    saveJSON(STORAGE_KEYS.mcpServers, mcpServers);
  }, [mcpServers]);

  // Persist keys & urls
  useEffect(() => {
    saveJSON(STORAGE_KEYS.providerKeys, apiKeys);
  }, [apiKeys]);
  useEffect(() => {
    saveJSON(STORAGE_KEYS.providerUrls, customUrls);
  }, [customUrls]);
  useEffect(() => {
    saveJSON(STORAGE_KEYS.customProviders, customProviders);
  }, [customProviders]);

  // All providers = built-in + custom
  const allProviders = useMemo(
    () => [...PROVIDERS, ...customProviders],
    [customProviders],
  );

  const handleCreate = () => {
    addCustomModel(
      draft.name || "Custom Model",
      draft.provider || "Custom",
      draft.endpoint || "",
      draft.apiKey,
    );
    setDraft({});
    setIsCreating(false);
  };

  const handleEdit = (model: AIModel) => {
    setIsEditing(model.id);
    setDraft({
      name: model.name,
      provider: model.provider,
      endpoint: model.endpoint,
      apiKey: model.apiKey || "",
    });
  };

  const handleUpdate = () => {
    if (!isEditing) return;
    updateCustomModel(isEditing, {
      name: draft.name,
      provider: draft.provider,
      endpoint: draft.endpoint,
      apiKey: draft.apiKey,
    });
    setIsEditing(null);
    setDraft({});
  };

  const handleSetDefault = (modelId: string) => {
    setActiveModelId(modelId);
  };

  const handleValidateKey = useCallback(
    async (model: AIModel) => {
      const providerId = model.providerId;
      if (!providerId || !model.apiKey) return;

      setValidatingId(model.id);
      try {
        const result = await validateAPIKey(providerId, model.apiKey || "");
        setValidationResults((prev) => ({ ...prev, [model.id]: result }));
      } catch {
        setValidationResults((prev) => ({
          ...prev,
          [model.id]: { valid: false, error: t("common.error") },
        }));
      } finally {
        setValidatingId(null);
      }
    },
    [t],
  );

  const handleTestConnection = useCallback(
    async (providerId: string, modelId: string) => {
      const provider = allProviders.find((p) => p.id === providerId);
      if (!provider) return;
      const model = provider.models.find((m) => m.id === modelId);
      if (!model) return;

      const url = customUrls[providerId] || provider.baseURL;
      const providerApiKey = apiKeys[providerId] || "";
      const diagKey = `${providerId}:${modelId}`;

      if (!providerApiKey && providerId !== "ollama") {
        setDiagnostics((prev) => ({
          ...prev,
          [diagKey]: {
            providerId,
            modelName: model.name,
            status: "error",
            message: "未配置 API Key，无法验证连接。请先填入 API Key。",
            timestamp: Date.now(),
          },
        }));
        return;
      }
      if (!url) {
        setDiagnostics((prev) => ({
          ...prev,
          [diagKey]: {
            providerId,
            modelName: model.name,
            status: "error",
            message: "未配置 API 端点 URL",
            timestamp: Date.now(),
          },
        }));
        return;
      }

      setDiagnostics((prev) => ({
        ...prev,
        [diagKey]: {
          providerId,
          modelName: model.name,
          status: "testing",
          message: "正在发送测试请求...",
          timestamp: Date.now(),
        },
      }));

      const start = performance.now();
      const controller = new AbortController();
      const timeoutMs = 20000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const setResult = (
        result: Omit<
          DiagnosticResult,
          "providerId" | "modelName" | "timestamp"
        >,
      ) => {
        setDiagnostics((prev) => ({
          ...prev,
          [diagKey]: {
            providerId,
            modelName: model.name,
            timestamp: Date.now(),
            ...result,
          },
        }));
      };

      (async () => {
        try {
          let resp: Response;
          if (providerId === "ollama") {
            const ollamaBase = url.replace(/\/+$/, "");
            const chatUrl = ollamaBase.includes("/api/chat")
              ? ollamaBase
              : `${ollamaBase.replace(/\/api\/.*$/, "")  }/api/chat`;
            resp = await fetch(chatUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: model.id,
                messages: [
                  {
                    role: "user",
                    content: "Hi, respond with exactly: YANYUCLOUD_OK",
                  },
                ],
                stream: false,
              }),
              signal: controller.signal,
            });
          } else if (providerId === "claude") {
            resp = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": providerApiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
              },
              body: JSON.stringify({
                model: model.id,
                max_tokens: 20,
                messages: [
                  {
                    role: "user",
                    content: "Hi, respond with exactly: YANYUCLOUD_OK",
                  },
                ],
              }),
              signal: controller.signal,
            });
          } else {
            resp = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${  providerApiKey}`,
              },
              body: JSON.stringify({
                model: model.id,
                messages: [
                  {
                    role: "user",
                    content: "Hi, respond with exactly: YANYUCLOUD_OK",
                  },
                ],
                stream: false,
                max_tokens: 20,
                temperature: 0,
              }),
              signal: controller.signal,
            });
          }

          clearTimeout(timer);
          const latency = Math.round(performance.now() - start);

          if (!resp.ok) {
            const errText = await resp.text().catch(() => "");
            let detail = "";
            try {
              const j = JSON.parse(errText);
              detail = j.error?.message || j.message || errText.slice(0, 200);
            } catch {
              detail = errText.slice(0, 200);
            }
            const s = resp.status;
            const statusMsg =
              s === 401
                ? "API Key 无效或已过期 (401)"
                : s === 403
                  ? "权限不足 (403)"
                  : s === 404
                    ? providerId === "ollama"
                      ? `Ollama 模型未找到。请先 ollama pull ${  model.id}`
                      : "端点不存在 (404)"
                    : s === 429
                      ? "请求频率超限 (429)"
                      : `HTTP ${  s}`;
            setResult({
              status: "error",
              message: statusMsg + (detail ? `。${  detail}` : ""),
              latency,
            });
            return;
          }

          const data = await resp.json().catch(() => null);
          let reply = "";
          if (providerId === "ollama") reply = data?.message?.content || "";
          else if (providerId === "claude")
            reply = data?.content?.[0]?.text || "";
          else
            reply = data?.choices?.[0]?.message?.content || data?.result || "";

          setResult({
            status: "success",
            message: "连接成功，API 响应正常",
            latency,
            modelResponse: reply.slice(0, 100),
          });
        } catch (err: any) {
          clearTimeout(timer);
          const latency = Math.round(performance.now() - start);
          if (err.name === "AbortError") {
            setResult({
              status: "error",
              message:
                `连接超时 (${  timeoutMs / 1000  }s)。请检查端点是否可达。`,
              latency,
            });
            return;
          }
          const msg = err.message || "";
          const networkMsg =
            msg.includes("Failed to fetch") ||
            msg.includes("NetworkError") ||
            msg.includes("fetch")
              ? "网络连接失败。可能原因：① 服务未启动 ② CORS 跨域限制 ③ 防火墙拦截。"
              : `测试异常: ${  msg.slice(0, 200)}`;
          setResult({ status: "error", message: networkMsg, latency });
        }
      })();
    },
    [allProviders, apiKeys, customUrls],
  );

  const handleCheckProxyHealth = useCallback(async () => {
    if (!proxyConfig.enabled || !proxyConfig.baseUrl) {
      setProxyHealth(null);
      return;
    }

    setProxyChecking(true);
    try {
      const result = await checkProxyHealth(proxyConfig.baseUrl);
      setProxyHealth(result);
    } catch (err: any) {
      setProxyHealth({
        healthy: false,
        latencyMs: 0,
        error: err.message || "健康检查失败",
      });
    } finally {
      setProxyChecking(false);
    }
  }, [proxyConfig.enabled, proxyConfig.baseUrl]);

  const handleSaveProxyConfig = useCallback((config: Partial<ProxyConfig>) => {
    const newConfig = saveProxyConfig(config);
    setProxyConfig(newConfig);
  }, []);

  // MCP server handlers
  const handleToggleMcpServer = useCallback((id: string) => {
    setMcpServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  }, []);

  const handleRemoveMcpServer = useCallback((id: string) => {
    setMcpServers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleAddMcpServer = useCallback(() => {
    if (!mcpServerDraft.name || !mcpServerDraft.command) return;
    let envObj: Record<string, string> = {};
    try {
      if (mcpServerDraft.env) envObj = JSON.parse(mcpServerDraft.env);
    } catch { /* empty */ }
    const server: MCPServerConfig = {
      id: `mcp-${Date.now()}`,
      name: mcpServerDraft.name,
      description: mcpServerDraft.description || mcpServerDraft.name,
      command: mcpServerDraft.command,
      args: mcpServerDraft.args ? mcpServerDraft.args.split(/\s+/) : [],
      env: envObj,
      enabled: true,
    };
    setMcpServers((prev) => [...prev, server]);
    setMcpServerDraft({ name: "", command: "", args: "", env: "", description: "" });
    setAddingMcpServer(false);
  }, [mcpServerDraft]);

  const handleEditMcpServer = useCallback((id: string) => {
    const server = mcpServers.find((s) => s.id === id);
    if (!server) return;
    setEditingMcpServer(id);
    setMcpServerDraft({
      name: server.name,
      command: server.command,
      args: server.args.join(" "),
      env: JSON.stringify(server.env),
      description: server.description,
    });
  }, [mcpServers]);

  const handleUpdateMcpServer = useCallback(() => {
    if (!editingMcpServer || !mcpServerDraft.name || !mcpServerDraft.command) return;
    let envObj: Record<string, string> = {};
    try {
      if (mcpServerDraft.env) envObj = JSON.parse(mcpServerDraft.env);
    } catch { /* empty */ }
    setMcpServers((prev) =>
      prev.map((s) =>
        s.id === editingMcpServer
          ? {
              ...s,
              name: mcpServerDraft.name,
              description: mcpServerDraft.description || mcpServerDraft.name,
              command: mcpServerDraft.command,
              args: mcpServerDraft.args ? mcpServerDraft.args.split(/\s+/) : [],
              env: envObj,
            }
          : s,
      ),
    );
    setEditingMcpServer(null);
    setMcpServerDraft({ name: "", command: "", args: "", env: "", description: "" });
  }, [editingMcpServer, mcpServerDraft]);

  const handleExportMcpJson = useCallback(() => {
    const mcpConfig: Record<string, any> = { mcpServers: {} };
    mcpServers
      .filter((s) => s.enabled)
      .forEach((s) => {
        mcpConfig.mcpServers[s.name.toLowerCase()] = {
          command: s.command,
          args: s.args,
          ...(Object.keys(s.env).length > 0 ? { env: s.env } : {}),
        };
      });
    setJsonDraft(JSON.stringify(mcpConfig, null, 2));
    setJsonMode(true);
    setJsonError("");
  }, [mcpServers]);

  const handleImportMcpJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonDraft);
      const mcpServersData = parsed.mcpServers || parsed;
      const imported: MCPServerConfig[] = Object.entries(mcpServersData).map(
        ([name, conf]: [string, any]) => ({
          id: `mcp-${Date.now()}-${name}`,
          name,
          description: conf.description || name,
          command: conf.command || "",
          args: conf.args || [],
          env: conf.env || {},
          enabled: true,
        }),
      );
      setMcpServers(imported);
      setJsonMode(false);
      setJsonError("");
    } catch (e: any) {
      setJsonError(`JSON 解析失败: ${e.message}`);
    }
  }, [jsonDraft]);

  return (
    <div className="space-y-4">
      {/* Header with Tabs */}
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
      >
        <div className="flex items-center gap-2">
          <Cpu className={`w-4 h-4 ${th.text.accent}`} />
          <span className={`text-[0.82rem] ${th.text.primary}`}>
            AI 模型管理
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("models")}
            className={`px-3 py-1.5 rounded-lg text-[0.78rem] transition-all ${
              activeTab === "models"
                ? `${th.btn.accent} ${th.btn.accentHover}`
                : `${th.btn.ghost} ${th.btn.ghostHover}`
            }`}
          >
            模型列表
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`px-3 py-1.5 rounded-lg text-[0.78rem] transition-all ${
              activeTab === "providers"
                ? `${th.btn.accent} ${th.btn.accentHover}`
                : `${th.btn.ghost} ${th.btn.ghostHover}`
            }`}
          >
            服务商配置
          </button>
          <button
            onClick={() => setActiveTab("ollama")}
            className={`px-3 py-1.5 rounded-lg text-[0.78rem] transition-all ${
              activeTab === "ollama"
                ? `${th.btn.accent} ${th.btn.accentHover}`
                : `${th.btn.ghost} ${th.btn.ghostHover}`
            }`}
          >
            Ollama 本地
          </button>
          <button
            onClick={() => setActiveTab("mcp")}
            className={`px-3 py-1.5 rounded-lg text-[0.78rem] transition-all ${
              activeTab === "mcp"
                ? `${th.btn.accent} ${th.btn.accentHover}`
                : `${th.btn.ghost} ${th.btn.ghostHover}`
            }`}
          >
            MCP 工具
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-3 py-1.5 rounded-lg text-[0.78rem] transition-all ${
              activeTab === "diagnostics"
                ? `${th.btn.accent} ${th.btn.accentHover}`
                : `${th.btn.ghost} ${th.btn.ghostHover}`
            }`}
          >
            智能诊断
          </button>
          <button
            onClick={() => setActiveTab("proxy")}
            className={`px-3 py-1.5 rounded-lg text-[0.78rem] transition-all ${
              activeTab === "proxy"
                ? `${th.btn.accent} ${th.btn.accentHover}`
                : `${th.btn.ghost} ${th.btn.ghostHover}`
            }`}
          >
            代理配置
          </button>
        </div>
      </div>

      {/* Models Tab */}
      {activeTab === "models" && (
        <>
          <div className="flex items-center justify-end">
            <button
              onClick={() => setIsCreating(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
            >
              <Plus className="w-3.5 h-3.5" />
              {t("settings.addNew")}
            </button>
          </div>

          {/* Create/Edit */}
          {(isCreating || isEditing) && (
            <ItemCard t={th} className="space-y-3">
              <div className={`text-[0.82rem] ${th.text.primary}`}>
                {isEditing ? t("settings.edit") : t("settings.addNew")} {t("settings.models")}
              </div>
              <div className="flex gap-2">
                <select
                  value={draft.provider || "Custom"}
                  onChange={(e) => setDraft({ ...draft, provider: e.target.value })}
                  className={`px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText}`}
                >
                  {providerOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="模型名称"
                  value={draft.name || ""}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className={`flex-1 px-3 py-2 rounded-lg border text-[0.82rem] font-mono ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
                />
              </div>
              <input
                placeholder="API Endpoint (可选)"
                value={draft.endpoint || ""}
                onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] font-mono ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
              />
              <input
                type="password"
                placeholder="API Key"
                value={draft.apiKey || ""}
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] font-mono ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(null);
                    setDraft({});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.ghost} ${th.btn.ghostHover}`}
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={isEditing ? handleUpdate : handleCreate}
                  className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
                >
                  <Check className="w-3.5 h-3.5 inline mr-1" />
                  {isEditing ? t("settings.save") : t("common.confirm")}
                </button>
              </div>
            </ItemCard>
          )}

          {/* Model List */}
          {aiModels.length === 0 ? (
            <EmptyState icon={Cpu} message={t("common.noData")} t={th} />
          ) : (
            <div className="space-y-2">
              {aiModels.map((model) => {
                const valResult = validationResults[model.id];
                const isValidating = validatingId === model.id;
                const isDefault = activeModelId === model.id;

                return (
                  <ItemCard key={model.id} t={th}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[0.82rem] ${th.text.primary}`}>
                            {model.provider}
                          </span>
                          <span
                            className={`text-[0.72rem] font-mono ${th.text.caption}`}
                          >
                            {model.name}
                          </span>
                          {isDefault && (
                            <Star className={`w-3.5 h-3.5 text-amber-400 fill-amber-400`} />
                          )}
                          {/* 验证状态徽章 */}
                          {valResult && (
                            <span
                              className={`flex items-center gap-1 text-[0.58rem] px-1.5 py-0.5 rounded ${
                                valResult.valid
                                  ? th.status.successBg
                                  : th.status.errorBg
                              }`}
                            >
                              {valResult.valid ? (
                                <>
                                  <ShieldCheck className="w-3 h-3" />
                                  {t("settings.configured")}
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3 h-3" />
                                  {valResult.error}
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[0.72rem] font-mono ${th.text.muted}`}
                          >
                            {showKeys[model.id]
                              ? (model.apiKey || "")
                              : "\u2022".repeat(Math.min(model.apiKey?.length || 0, 20))}
                          </span>
                          {model.apiKey && (
                            <button
                              onClick={() =>
                                setShowKeys((prev) => ({
                                  ...prev,
                                  [model.id]: !prev[model.id],
                                }))
                              }
                              className={`p-0.5 rounded ${th.hoverBg}`}
                            >
                              {showKeys[model.id] ? (
                                <EyeOff className={`w-3 h-3 ${th.text.caption}`} />
                              ) : (
                                <Eye className={`w-3 h-3 ${th.text.caption}`} />
                              )}
                            </button>
                          )}
                          {/* 验证延迟 */}
                          {valResult?.valid && valResult.latencyMs && (
                            <span className={`text-[0.62rem] ${th.text.caption}`}>
                              {valResult.latencyMs}ms
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* 编辑按钮 */}
                        <button
                          onClick={() => handleEdit(model)}
                          className={`p-1.5 rounded-lg ${th.hoverBg}`}
                          title="编辑"
                        >
                          <Edit2 className={`w-3.5 h-3.5 ${th.text.accent}`} />
                        </button>
                        {/* 验证 API Key 按钮 */}
                        {model.apiKey && (
                          <button
                            onClick={() => handleValidateKey(model)}
                            disabled={isValidating}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.68rem} transition-all ${
                              isValidating
                                ? "opacity-50 cursor-not-allowed"
                                : valResult?.valid
                                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  : `${th.btn.ghost} ${th.btn.ghostHover}`
                            }`}
                            title="验证 API Key"
                          >
                            {isValidating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : valResult?.valid ? (
                              <ShieldCheck className="w-3 h-3" />
                            ) : (
                              <Zap className={`w-3 h-3 ${th.text.accent} cursor-pointer hover:scale-110 transition-transform`} />
                            )}
                            {isValidating
                              ? t("common.loading")
                              : valResult?.valid
                                ? t("common.success")
                                : "验证"}
                          </button>
                        )}
                        {/* 设置默认按钮 */}
                        {!isDefault && (
                          <button
                            onClick={() => handleSetDefault(model.id)}
                            className={`p-1.5 rounded-lg ${th.hoverBg}`}
                            title="设为默认"
                          >
                            <Star className={`w-3.5 h-3.5 ${th.text.caption}`} />
                          </button>
                        )}
                        {/* 删除按钮 */}
                        <button
                          onClick={() => removeCustomModel(model.id)}
                          className={`p-1.5 rounded-lg ${th.hoverBg}`}
                          title="删除"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${th.status.error}`} />
                        </button>
                      </div>
                    </div>
                  </ItemCard>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Providers Tab */}
      {activeTab === "providers" && (
        <div className="space-y-2">
          {providers.map((provider) => {
            const hasKey = hasProviderKey(provider.id);
            const apiKey = getProviderApiKey(provider.id);
            return (
              <ItemCard key={provider.id} t={th}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[0.82rem] ${th.text.primary}`}>
                        {provider.name}
                      </span>
                      <span className={`text-[0.72rem] ${th.text.muted}`}>
                        {provider.nameEn}
                      </span>
                      {hasKey && (
                        <span className={`text-[0.58rem] px-1.5 py-0.5 rounded ${th.status.successBg}`}>
                          已配置
                        </span>
                      )}
                    </div>
                    <div className={`text-[0.72rem] ${th.text.muted} mt-1`}>
                      {provider.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="password"
                      placeholder="API Key"
                      value={apiKey || ""}
                      onChange={(e) => setProviderApiKey(provider.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-[0.78rem] font-mono ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none w-48`}
                    />
                  </div>
                </div>
              </ItemCard>
            );
          })}
        </div>
      )}

      {/* Ollama Tab */}
      {activeTab === "ollama" && (
        <div
          className={`px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className={`w-4 h-4 ${th.text.accent}`} />
              <span className={`text-[0.82rem] ${th.text.primary}`}>
                Ollama 本地模型
              </span>
              <span
                className={`text-[0.68rem] px-2 py-0.5 rounded ${
                  ollamaStatus === "available"
                    ? th.status.successBg
                    : ollamaStatus === "checking"
                      ? th.status.warningBg
                      : th.status.errorBg
                }`}
              >
                {ollamaStatus === "available" ? (
                  <>
                    <Wifi className="w-3 h-3 inline mr-1" />
                    已连接
                  </>
                ) : ollamaStatus === "checking" ? (
                  <>
                    <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                    检测中
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 inline mr-1" />
                    未连接
                  </>
                )}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (ollamaStatus !== "checking") {
                  recheckOllama();
                }
              }}
              disabled={ollamaStatus === "checking"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] transition-all ${
                ollamaStatus === "checking"
                  ? "opacity-50 cursor-not-allowed"
                  : `${th.btn.ghost} ${th.btn.ghostHover}`
              }`}
            >
              {ollamaStatus === "checking" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              ) : (
                <Zap className={`w-3.5 h-3.5 ${th.text.accent}`} />
              )}
              {ollamaStatus === "checking" ? "检测中..." : "重新检测"}
            </button>
          </div>
          {ollamaDetectedModels.length > 0 ? (
            <div className="space-y-2">
              {ollamaDetectedModels.map((model) => {
                const isImported = importedOllamaIds.has(model.id);
                return (
                  <ItemCard key={model.id} t={th}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[0.85rem] ${th.text.primary}`}>
                            {model.name}
                          </span>
                          <span
                            className={`text-[0.72rem] font-mono ${th.text.caption}`}
                          >
                            {model.id}
                          </span>
                        </div>
                        <div className={`text-[0.72rem] ${th.text.muted} mt-1`}>
                          {model.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isImported ? (
                          <button
                            onClick={() => handleSetDefault(`ollama::${model.id}`)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.68rem} ${
                              activeModelId === `ollama::${model.id}`
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                            title="设为默认"
                          >
                            <Star className="w-3 h-3" />
                            {activeModelId === `ollama::${model.id}` ? "默认" : "设为默认"}
                          </button>
                        ) : (
                          <button
                            onClick={() => importOllamaModel(model)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.68rem] ${th.btn.accent} ${th.btn.accentHover}`}
                            title="导入模型"
                          >
                            <Plus className="w-3 h-3" />
                            导入
                          </button>
                        )}
                      </div>
                    </div>
                  </ItemCard>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Server}
              message="未检测到 Ollama 模型，请确保 Ollama 服务正在运行"
              t={th}
            />
          )}
        </div>
      )}

      {/* MCP Tab */}
      {activeTab === "mcp" && (
        <div
          className={`px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plug className={`w-4 h-4 ${th.text.accent}`} />
              <span className={`text-[0.82rem] ${th.text.primary}`}>
                MCP Server 配置
              </span>
              <span
                className={`text-[0.68rem] px-2 py-0.5 rounded ${th.status.successBg}`}
              >
                {mcpServers.filter((s) => s.enabled).length}/{mcpServers.length} 启用
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportMcpJson}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem} ${th.btn.ghost} ${th.btn.ghostHover}`}
              >
                <Copy className={`w-3.5 h-3.5 ${th.text.accent}`} />
                导出 JSON
              </button>
              <button
                onClick={() => setAddingMcpServer(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
              >
                <Plus className="w-3.5 h-3.5" />
                添加服务器
              </button>
            </div>
          </div>

          {jsonMode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-[0.78rem] ${th.text.primary}`}>
                  JSON 配置
                </span>
                <button
                  onClick={() => setJsonMode(false)}
                  className={`text-[0.68rem] ${th.text.muted} hover:${th.text.primary}`}
                >
                  返回列表
                </button>
              </div>
              <textarea
                value={jsonDraft}
                onChange={(e) => setJsonDraft(e.target.value)}
                placeholder='{"mcpServers": {"filesystem": {"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/app/designs"]}}}'
                className={`w-full h-64 bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.72rem] font-mono ${th.text.primary} focus:outline-none focus:border-indigo-500/40`}
              />
              {jsonError && (
                <div className={`text-[0.68rem] text-red-400 ${th.status.errorBg} px-3 py-2 rounded-lg`}>
                  {jsonError}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleImportMcpJson}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  导入配置
                </button>
                <button
                  onClick={() => setJsonMode(false)}
                  className={`px-4 py-2 rounded-lg text-[0.78rem} ${th.btn.ghost} ${th.btn.ghostHover}`}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {mcpServers.map((server) => (
                <ItemCard key={server.id} t={th}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[0.85rem] ${th.text.primary}`}>
                          {server.name}
                        </span>
                        <span
                          className={`text-[0.68rem] px-1.5 py-0.5 rounded ${
                            server.enabled
                              ? th.status.successBg
                              : th.status.errorBg
                          }`}
                        >
                          {server.enabled ? "启用" : "禁用"}
                        </span>
                      </div>
                      <div className={`text-[0.72rem] ${th.text.muted} mt-1`}>
                        {server.description}
                      </div>
                      <div className={`text-[0.68rem] font-mono ${th.text.caption} mt-1`}>
                        {server.command} {server.args?.join(" ") || ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleToggleMcpServer(server.id)}
                        className={`p-1.5 rounded-lg ${th.btn.ghost} ${th.btn.ghostHover}`}
                        title={server.enabled ? "禁用" : "启用"}
                      >
                        {server.enabled ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditMcpServer(server.id)}
                        className={`p-1.5 rounded-lg ${th.btn.ghost} ${th.btn.ghostHover}`}
                        title="编辑"
                      >
                        <Edit2 className={`w-3.5 h-3.5 ${th.text.accent}`} />
                      </button>
                      <button
                        onClick={() => handleRemoveMcpServer(server.id)}
                        className={`p-1.5 rounded-lg ${th.btn.ghost} ${th.btn.ghostHover}`}
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </ItemCard>
              ))}

              {addingMcpServer && (
                <ItemCard t={th} className="space-y-3">
                  <div className={`text-[0.82rem] ${th.text.primary}`}>
                    添加 MCP Server
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className={`text-[0.68rem] ${th.text.muted} uppercase tracking-wider mb-1 block`}>
                        服务器名称
                      </label>
                      <input
                        value={mcpServerDraft.name}
                        onChange={(e) =>
                          setMcpServerDraft((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="如 Filesystem"
                        className={`w-full bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.78rem] ${th.text.primary} placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40`}
                      />
                    </div>
                    <div>
                      <label className={`text-[0.68rem] ${th.text.muted} uppercase tracking-wider mb-1 block`}>
                        命令
                      </label>
                      <input
                        value={mcpServerDraft.command}
                        onChange={(e) =>
                          setMcpServerDraft((p) => ({ ...p, command: e.target.value }))
                        }
                        placeholder="npx"
                        className={`w-full bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.78rem] ${th.text.primary} placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40 font-mono`}
                      />
                    </div>
                    <div>
                      <label className={`text-[0.68rem] ${th.text.muted} uppercase tracking-wider mb-1 block`}>
                        参数
                      </label>
                      <input
                        value={mcpServerDraft.args}
                        onChange={(e) =>
                          setMcpServerDraft((p) => ({ ...p, args: e.target.value }))
                        }
                        placeholder="-y @modelcontextprotocol/server-filesystem /app/designs"
                        className={`w-full bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.78rem] ${th.text.primary} placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40 font-mono`}
                      />
                    </div>
                    <div>
                      <label className={`text-[0.68rem] ${th.text.muted} uppercase tracking-wider mb-1 block`}>
                        环境变量 (JSON)
                      </label>
                      <textarea
                        value={mcpServerDraft.env}
                        onChange={(e) =>
                          setMcpServerDraft((p) => ({ ...p, env: e.target.value }))
                        }
                        placeholder='{"DATABASE_URL": "postgresql://user:pwd@localhost:5432/db"}'
                        className={`w-full h-20 bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.72rem] font-mono ${th.text.primary} placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40`}
                      />
                    </div>
                    <div>
                      <label className={`text-[0.68rem] ${th.text.muted} uppercase tracking-wider mb-1 block`}>
                        描述
                      </label>
                      <input
                        value={mcpServerDraft.description}
                        onChange={(e) =>
                          setMcpServerDraft((p) => ({ ...p, description: e.target.value }))
                        }
                        placeholder="文件系统读写操作"
                        className={`w-full bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.78rem] ${th.text.primary} placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddMcpServer}
                      disabled={!mcpServerDraft.name || !mcpServerDraft.command}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover} disabled:opacity-30`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      添加
                    </button>
                    <button
                      onClick={() => {
                        setAddingMcpServer(false);
                        setMcpServerDraft({ name: "", command: "", args: "", env: "", description: "" });
                      }}
                      className={`px-4 py-2 rounded-lg text-[0.78rem} ${th.btn.ghost} ${th.btn.ghostHover}`}
                    >
                      取消
                    </button>
                  </div>
                </ItemCard>
              )}

              {editingMcpServer && (
                <ItemCard t={th} className="space-y-3">
                  <div className={`text-[0.82rem] ${th.text.primary}`}>
                    编辑 MCP Server
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className={`text-[0.68rem] ${th.text.muted} uppercase tracking-wider mb-1 block`}>
                        服务器名称
                      </label>
                      <input
                        value={mcpServerDraft.name}
                        onChange={(e) =>
                          setMcpServerDraft((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="如 Filesystem"
                        className={`w-full bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.78rem] ${th.text.primary} placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40`}
                      />
                    </div>
                    <div>
                      <label className={`text-[0.68rem] ${th.text.muted} uppercase tracking-wider mb-1 block`}>
                        命令
                      </label>
                      <input
                        value={mcpServerDraft.command}
                        onChange={(e) =>
                          setMcpServerDraft((p) => ({ ...p, command: e.target.value }))
                        }
                        placeholder="npx"
                        className={`w-full bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.78rem] ${th.text.primary} placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40 font-mono`}
                      />
                    </div>
                    <div>
                      <label className={`text-[0.68rem] ${th.text.muted} uppercase tracking-wider mb-1 block`}>
                        参数
                      </label>
                      <input
                        value={mcpServerDraft.args}
                        onChange={(e) =>
                          setMcpServerDraft((p) => ({ ...p, args: e.target.value }))
                        }
                        placeholder="-y @modelcontextprotocol/server-filesystem /app/designs"
                        className={`w-full bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.78rem] ${th.text.primary} placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40 font-mono`}
                      />
                    </div>
                    <div>
                      <label className={`text-[0.68rem] ${th.text.muted} uppercase tracking-wider mb-1 block`}>
                        环境变量 (JSON)
                      </label>
                      <textarea
                        value={mcpServerDraft.env}
                        onChange={(e) =>
                          setMcpServerDraft((p) => ({ ...p, env: e.target.value }))
                        }
                        placeholder='{"DATABASE_URL": "postgresql://user:pwd@localhost:5432/db"}'
                        className={`w-full h-20 bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.72rem] font-mono ${th.text.primary} placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40`}
                      />
                    </div>
                    <div>
                      <label className={`text-[0.68rem] ${th.text.muted} uppercase tracking-wider mb-1 block`}>
                        描述
                      </label>
                      <input
                        value={mcpServerDraft.description}
                        onChange={(e) =>
                          setMcpServerDraft((p) => ({ ...p, description: e.target.value }))
                        }
                        placeholder="文件系统读写操作"
                        className={`w-full bg-white/[0.02] border ${th.page.cardBorder} rounded-lg px-3 py-2 text-[0.78rem] ${th.text.primary} placeholder:text-white/10 focus:outline-none focus:border-indigo-500/40`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUpdateMcpServer}
                      disabled={!mcpServerDraft.name || !mcpServerDraft.command}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover} disabled:opacity-30`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingMcpServer(null);
                        setMcpServerDraft({ name: "", command: "", args: "", env: "", description: "" });
                      }}
                      className={`px-4 py-2 rounded-lg text-[0.78rem} ${th.btn.ghost} ${th.btn.ghostHover}`}
                    >
                      取消
                    </button>
                  </div>
                </ItemCard>
              )}
            </div>
          )}
        </div>
      )}

      {/* Diagnostics Tab */}
      {activeTab === "diagnostics" && (
        <div
          className={`px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className={`w-4 h-4 ${th.text.accent}`} />
            <span className={`text-[0.82rem] ${th.text.primary}`}>
              智能诊断
            </span>
            <span className={`text-[0.68rem] ${th.text.muted}`}>
              连通性测试 · 延迟监控 · 多模型对比
            </span>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div
              className={`px-3 py-2.5 rounded-lg border ${th.page.cardBg} ${th.page.cardBorder}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className={`text-[0.72rem] ${th.text.muted}`}>
                  测试成功
                </span>
              </div>
              <div className="text-[1.2rem] font-semibold text-emerald-400">
                {Object.values(diagnostics).filter((d) => d.status === "success").length}
              </div>
            </div>
            <div
              className={`px-3 py-2.5 rounded-lg border ${th.page.cardBg} ${th.page.cardBorder}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                <span className={`text-[0.72rem] ${th.text.muted}`}>
                  测试失败
                </span>
              </div>
              <div className="text-[1.2rem] font-semibold text-red-400">
                {Object.values(diagnostics).filter((d) => d.status === "error").length}
              </div>
            </div>
            <div
              className={`px-3 py-2.5 rounded-lg border ${th.page.cardBg} ${th.page.cardBorder}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className={`text-[0.72rem] ${th.text.muted}`}>
                  平均延迟
                </span>
              </div>
              <div className="text-[1.2rem] font-semibold text-amber-400">
                {(() => {
                  const latencies = Object.values(diagnostics)
                    .filter((d) => d.latency !== undefined)
                    .map((d) => d.latency as any);
                  if (latencies.length === 0) return "N/A";
                  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
                  return `${Math.round(avg)}ms`;
                })()}
              </div>
            </div>
          </div>

          {/* Diagnostics List */}
          <div className="space-y-2">
            {allProviders.map((provider) => (
              <ItemCard key={provider.id} t={th}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg ${provider.colorBg} border ${provider.colorBorder} flex items-center justify-center`}
                  >
                    <provider.icon className={`w-4 h-4 ${provider.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[0.82rem] ${th.text.primary}`}>
                      {provider.name}
                    </div>
                    <div className={`text-[0.68rem] ${th.text.muted}`}>
                      {provider.models.length} 个模型
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (testingProviders.has(provider.id)) return;
                      
                      setTestingProviders(prev => new Set([...prev, provider.id]));
                      
                      const testPromises = provider.models.map(model => 
                        handleTestConnection(provider.id, model.id)
                      );
                      
                      Promise.allSettled(testPromises).finally(() => {
                        setTestingProviders(prev => {
                          const next = new Set(prev);
                          next.delete(provider.id);
                          return next;
                        });
                      });
                    }}
                    disabled={testingProviders.has(provider.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.72rem] transition-all ${
                      testingProviders.has(provider.id)
                        ? "opacity-50 cursor-not-allowed"
                        : `${th.btn.ghost} ${th.btn.ghostHover}`
                    }`}
                  >
                    {testingProviders.has(provider.id) ? (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                    ) : (
                      <Zap className={`w-3 h-3 ${th.text.accent}`} />
                    )}
                    {testingProviders.has(provider.id) ? "测试中..." : "测试全部"}
                  </button>
                </div>
              </ItemCard>
            ))}
          </div>

          {/* Latency Trend Chart */}
          {Object.values(diagnostics).filter((d) => d.status === "success").length > 0 && (
            <div
              className={`mt-4 px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${th.text.accent}`} />
                  <span className={`text-[0.82rem] ${th.text.primary}`}>
                    延迟趋势
                  </span>
                </div>
                <span className={`text-[0.68rem] ${th.text.muted}`}>
                  最近测试结果
                </span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Object.entries(diagnostics)
                    .filter(([_, d]) => d.status === "success" && d.latency !== undefined)
                    .map(([key, d]) => ({
                      name: d.modelName,
                      latency: d.latency!,
                      timestamp: d.timestamp || Date.now(),
                    }))
                    .sort((a, b) => a.timestamp - b.timestamp)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <RTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.9)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="latency"
                      stroke="#8b5cf6"
                      fill="rgba(139, 92, 246, 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Diagnostic Suggestions */}
          {Object.values(diagnostics).filter((d) => d.status !== "idle").length > 0 && (
            <div
              className={`mt-4 px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className={`w-4 h-4 text-amber-400`} />
                <span className={`text-[0.82rem] ${th.text.primary}`}>
                  诊断建议
                </span>
              </div>
              <div className="space-y-2">
                {Object.entries(diagnostics)
                  .filter(([_, d]) => d.status !== "idle")
                  .map(([key, diag]) => {
                    const suggestion = getDiagnosticSuggestion(diag);
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border ${
                          diag.status === "error"
                            ? "bg-red-500/10 border-red-500/20"
                            : diag.status === "testing"
                              ? "bg-blue-500/10 border-blue-500/20"
                              : "bg-emerald-500/10 border-emerald-500/20"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {diag.status === "error" ? (
                            <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                          ) : diag.status === "testing" ? (
                            <Loader2 className="w-4 h-4 text-blue-400 mt-0.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[0.78rem] ${th.text.primary}`}>
                                {diag.providerId} - {diag.modelName}
                              </span>
                              <span className={`text-[0.68rem] ${th.text.muted}`}>
                                {diag.latency !== undefined && `${diag.latency}ms`}
                              </span>
                            </div>
                            <div className={`text-[0.72rem] ${th.text.muted} mb-1`}>
                              {diag.message}
                            </div>
                            {suggestion && (
                              <div className={`text-[0.72rem] ${th.text.secondary}`}>
                                💡 {suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Proxy Tab */}
      {activeTab === "proxy" && (
        <div
          className={`px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Network className={`w-4 h-4 ${th.text.accent}`} />
            <span className={`text-[0.82rem] ${th.text.primary}`}>
              代理配置
            </span>
            <span className={`text-[0.68rem] ${th.text.muted}`}>
              配置代理服务器以访问受限的 AI 服务
            </span>
          </div>

          <div className="space-y-3">
            <ItemCard t={th}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proxyConfig.enabled}
                      onChange={(e) => handleSaveProxyConfig({ enabled: e.target.checked })}
                      className="accent-violet-500"
                    />
                    <span className={`text-[0.78rem] ${th.text.primary}`}>
                      启用代理
                    </span>
                  </label>
                  {proxyConfig.enabled && (
                    <span className={`text-[0.68rem] px-2 py-0.5 rounded ${
                      proxyHealth?.healthy
                        ? "bg-emerald-500/20 text-emerald-400"
                        : proxyHealth === null
                          ? "bg-gray-500/20 text-gray-400"
                          : "bg-red-500/20 text-red-400"
                    }`}>
                      {proxyHealth === null
                        ? "未测试"
                        : proxyHealth.healthy
                          ? "正常"
                          : "异常"}
                    </span>
                  )}
                </div>
                <div>
                  <label className={`text-[0.78rem] ${th.text.secondary} mb-1 block`}>
                    代理服务器地址
                  </label>
                  <input
                    type="text"
                    placeholder="http://proxy.example.com:8080"
                    value={proxyConfig.baseUrl}
                    onChange={(e) => handleSaveProxyConfig({ baseUrl: e.target.value })}
                    disabled={!proxyConfig.enabled}
                    className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className={`text-[0.78rem] ${th.text.secondary} mb-1 block`}>
                    认证 Token（可选）
                  </label>
                  <input
                    type="password"
                    placeholder="proxy-auth-token"
                    value={proxyConfig.authToken || ""}
                    onChange={(e) => handleSaveProxyConfig({ authToken: e.target.value })}
                    disabled={!proxyConfig.enabled}
                    className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveProxyConfig({})}
                    disabled={!proxyConfig.enabled}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    保存配置
                  </button>
                  <button
                    onClick={handleCheckProxyHealth}
                    disabled={!proxyConfig.enabled || !proxyConfig.baseUrl || proxyChecking}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[0.78rem] ${th.btn.ghost} ${th.btn.ghostHover} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {proxyChecking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className={`w-3.5 h-3.5 ${th.text.accent}`} />
                    )}
                    {proxyChecking ? "测试中..." : "测试连接"}
                  </button>
                </div>
                {proxyHealth && (
                  <div className={`px-3 py-2 rounded-lg border ${
                    proxyHealth.healthy
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  }`}>
                    <div className="flex items-center gap-2">
                      {proxyHealth.healthy ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <div className="flex-1">
                        <div className={`text-[0.78rem] ${th.text.primary}`}>
                          {proxyHealth.healthy ? "代理服务器连接正常" : "代理服务器连接失败"}
                        </div>
                        <div className={`text-[0.72rem] ${th.text.muted}`}>
                          {proxyHealth.healthy
                            ? `响应时间: ${proxyHealth.latencyMs}ms`
                            : `错误: ${proxyHealth.error}`}
                          {proxyHealth.version && ` | 版本: ${proxyHealth.version}`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ItemCard>

            <div className={`px-4 py-3 rounded-lg border ${th.page.cardBg} ${th.page.cardBorder}`}>
              <div className="flex items-start gap-2">
                <Lightbulb className={`w-4 h-4 text-amber-400 mt-0.5`} />
                <div>
                  <div className={`text-[0.78rem] ${th.text.primary} mb-1`}>
                    代理使用提示
                  </div>
                  <div className={`text-[0.72rem] ${th.text.muted}`}>
                    如果您在中国大陆地区使用 OpenAI、Anthropic 等服务，建议配置代理服务器。
                    代理服务器可以帮助您绕过网络限制，确保服务的正常访问。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
