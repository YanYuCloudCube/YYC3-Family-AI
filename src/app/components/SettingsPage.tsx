/**
 * @file: SettingsPage.tsx
 * @description: 全局设置页面 — 集成搜索、账号、通用、智能体、MCP、模型、
 *              上下文、对话流、规则技能、导入导出等完整设置模块
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v2.0.0
 * @created: 2026-03-06
 * @updated: 2026-03-17
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: settings,preferences,models,theme,agents,mcp,rules,skills
 */

import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Settings,
  Palette,
  Shield,
  Database,
  User,
  ChevronRight,
  Check,
  Moon,
  Sun,
  RotateCcw,
  Save,
  Trash2,
  Bot,
  Plug,
  Cpu,
  MessageSquare,
  ScrollText,
  Zap,
  Search,
  Download,
  Upload,
  X,
  Plus,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "./ide/stores/useThemeStore";
import { toastSuccess, toastError } from "./ide/stores/useToastStore";
import { confirmDialog } from "./ide/stores/useConfirmStore";
import { useThemeTokens, type ThemeTokens } from "./ide/hooks/useThemeTokens";
import { ModelRegistryProvider } from "./ide/ModelRegistry";
import {
  useSettingsStore,
  type SearchResult,
} from "./ide/stores/useSettingsStore";
import { clearAllYYC3Storage } from "./ide/constants/storage-keys";
import {
  Toggle,
  SettingRow,
  SettingGroup,
  ThemeButton,
} from "./settings/SettingsShared";
import { AgentSection } from "./settings/AgentSection";
import { MCPSection } from "./settings/MCPModelSection";
import YYC3MCPServiceSection from "./settings/YYC3MCPServiceSection";
import { ModelSettings } from "./ide/ModelSettings";
import {
  ConversationSection,
  ContextSection,
} from "./settings/ConversationContextSection";
import { RulesSection, SkillsSection } from "./settings/RulesSkillsSection";
import { KeybindingsEditor } from "./settings/KeybindingsEditor";
import { useWorkflowPluginStore } from "./settings/WorkflowPluginStore";
import { PluginSection } from "./settings/PluginSection";
import { StorageSection } from "./settings/StorageSection";
import EnvironmentConfigPanel from "./ide/config/EnvironmentConfigPanel";
import UnifiedStoragePanel from "./ide/storage/UnifiedStoragePanel";

// ── Section definitions ──

type SettingsSection =
  | "general"
  | "account"
  | "agents"
  | "agent-skills"
  | "agent-workflow"
  | "plugins"
  | "plugin-custom"
  | "plugin-market"
  | "plugin-dev"
  | "templates"
  | "models"
  | "environment"
  | "context"
  | "conversation"
  | "rules"
  | "storage"
  | "import";

interface SectionDef {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SECTIONS: SectionDef[] = [
  {
    id: "general",
    label: "通用设置",
    icon: Settings,
    description: "主题、语言、编辑器、快捷键",
  },
  {
    id: "account",
    label: "账号信息",
    icon: User,
    description: "个人资料、头像、偏好",
  },
  {
    id: "agents",
    label: "智能体",
    icon: Bot,
    description: "内置/自定义智能体管理",
  },
  {
    id: "agent-skills",
    label: "Skills 设计",
    icon: Zap,
    description: "智能体技能设计编辑",
  },
  {
    id: "agent-workflow",
    label: "工作流系统",
    icon: MessageSquare,
    description: "Agent工作流可视化推演执行",
  },
  {
    id: "plugins",
    label: "MCP服务",
    icon: Plug,
    description: "通用 MCP / YYC³ MCP 服务集成"
  },
  {
    id: "plugin-custom",
    label: "自研插件",
    icon: Zap,
    description: "自定义插件开发与管理"
  },
  {
    id: "plugin-market",
    label: "插件市场",
    icon: Download,
    description: "9 个核心插件管理（ESLint/AI/Git等）"
  },
  {
    id: "plugin-dev",
    label: "插件定制",
    icon: Settings,
    description: "插件开发工具与模板"
  },
  {
    id: "templates",
    label: "模版设计",
    icon: Database,
    description: "项目模版管理与设计",
  },
  {
    id: "models",
    label: "模型配置",
    icon: Cpu,
    description: "AI 模型 Provider 与 API Key",
  },
  {
    id: "environment",
    label: "环境配置",
    icon: Globe,
    description: "网关、认证、终端、心跳同步",
  },
  {
    id: "context",
    label: "上下文管理",
    icon: Database,
    description: "代码索引、文档集、忽略规则",
  },
  {
    id: "conversation",
    label: "对话流设置",
    icon: MessageSquare,
    description: "待办清单、代码审查、命令、通知",
  },
  {
    id: "rules",
    label: "规则管理",
    icon: ScrollText,
    description: "个人/项目级编码规则",
  },
  {
    id: "storage",
    label: "存储管理",
    icon: Database,
    description: "IndexedDB、LocalStorage、缓存管理",
  },
  {
    id: "import",
    label: "导入导出",
    icon: Download,
    description: "配置导入/导出、数据管理",
  },
];

// ── Main Component ──

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isCyber, toggleTheme, setShowThemeCustomizer } = useThemeStore();
  const t = useThemeTokens();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("general");
  const [saved, setSaved] = useState(false);
  const [pluginsSubTab, setPluginsSubTab] = useState<"general-mcp" | "yyc3-mcp">("yyc3-mcp");

  // Search
  const {
    searchQuery,
    setSearchQuery,
    searchSettings: doSearch,
    settings,
    exportConfig,
    importConfig,
    resetSettings,
  } = useSettingsStore();
  const [searchFocused, setSearchFocused] = useState(false);
  const searchResults = useMemo<SearchResult[]>(() => {
    return searchQuery.trim() ? doSearch(searchQuery) : [];
  }, [searchQuery, doSearch]);

  const handleSave = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleSearchSelect = (result: SearchResult) => {
    // Map search result section to SettingsSection
    const sectionMap: Record<string, SettingsSection> = {
      general: "general",
      agents: "agents",
      mcp: "plugins",
      models: "models",
      conversation: "conversation",
      context: "context",
      rules: "rules",
      skills: "storage",
    };
    const target = sectionMap[result.section];
    if (target) setActiveSection(target);
    setSearchQuery("");
  };

  const currentSection = SECTIONS.find((s) => s.id === activeSection)!;

  // ── Render section content ──
  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <GeneralSection
            t={t}
            isCyber={isCyber}
            toggleTheme={toggleTheme}
            setShowThemeCustomizer={setShowThemeCustomizer}
          />
        );
      case "account":
        return <AccountSection t={t} />;
      case "agents":
        return <AgentSection />;
      case "agent-skills":
        return <SkillsSection />;
      case "agent-workflow":
        return <AgentWorkflowSection t={t} />;
      case "plugins":
        return (
          <div className="space-y-4">
            {/* Sub-tabs for Plugin System */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <button
                onClick={() => setPluginsSubTab("general-mcp")}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  pluginsSubTab === "general-mcp"
                    ? "bg-blue-500/20 text-blue-400 shadow-sm"
                    : `${t.textTertiary  } hover:bg-white/[0.04]`
                }`}
              >
                <Plug className="w-3.5 h-3.5 inline mr-1.5" />
                通用 MCP
              </button>
              <button
                onClick={() => setPluginsSubTab("yyc3-mcp")}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  pluginsSubTab === "yyc3-mcp"
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 shadow-sm"
                    : `${t.textTertiary  } hover:bg-white/[0.04]`
                }`}
              >
                <Zap className="w-3.5 h-3.5 inline mr-1.5" />
                YYC³ MCP
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-400">
                  4 项服务
                </span>
              </button>
            </div>

            {/* Sub-tab Content */}
            {pluginsSubTab === "general-mcp" ? (
              <MCPSection />
            ) : (
              <YYC3MCPServiceSection />
            )}
          </div>
        );
      case "plugin-custom":
        return <PluginCustomSection t={t} />;
      case "plugin-market":
        return <PluginSection />;
      case "plugin-dev":
        return <PluginDevSection t={t} />;
      case "templates":
        return <TemplateDesignSection t={t} />;
      case "models":
        return <ModelSettings mode="embedded" />;
      case "environment":
        return <EnvironmentConfigPanel />;
      case "context":
        return <ContextSection />;
      case "conversation":
        return <ConversationSection />;
      case "rules":
        return <RulesSection />;
      case "storage":
        return <UnifiedStoragePanel />;
      case "import":
        return <ImportExportSection t={t} />;
      default:
        return null;
    }
  };

  return (
    <ModelRegistryProvider>
      <div className={`size-full min-h-screen ${t.page.pageBg} flex flex-col overflow-hidden`}>
        {/* Top bar */}
        <div
          className={`sticky top-0 z-30 border-b backdrop-blur-md ${t.page.barBg} ${t.page.barBorder} flex-shrink-0`}
        >
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className={`flex items-center gap-2 text-[0.82rem] transition-colors ${t.text.tertiary} hover:${t.text.accent}`}
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </button>
            <div className={`h-5 w-px ${t.page.divider}`} />
            <Settings className={`w-4 h-4 ${t.text.accent}`} />
            <h1 className={`text-[0.95rem] ${t.text.primary}`}>全局设置</h1>

            {/* Search bar */}
            <div className="flex-1 max-w-sm ml-4 relative">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                  searchFocused
                    ? `${t.page.inputBg} ${t.page.inputFocus} ${t.page.inputBorder}`
                    : `${t.page.inputBg} ${t.page.inputBorder}`
                }`}
              >
                <Search className={`w-3.5 h-3.5 ${t.text.caption}`} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="搜索设置..."
                  className={`flex-1 bg-transparent text-[0.82rem] outline-none ${t.page.inputText} ${t.page.inputPlaceholder}`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={`${t.hoverBg} rounded p-0.5`}
                  >
                    <X className={`w-3 h-3 ${t.text.caption}`} />
                  </button>
                )}
              </div>

              {/* Search results dropdown */}
              <AnimatePresence>
                {searchQuery && searchResults.length > 0 && searchFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-50 overflow-hidden ${t.page.cardBg} ${t.page.cardBorder}`}
                  >
                    {searchResults.slice(0, 8).map((result, idx) => (
                      <button
                        key={`${result.path}-${idx}`}
                        onClick={() => handleSearchSelect(result)}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${t.hoverBg}`}
                      >
                        <span
                          className={`text-[0.58rem] px-1.5 py-0.5 rounded uppercase ${t.status.infoBg}`}
                        >
                          {result.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[0.82rem] ${t.text.primary}`}>
                            {result.title}
                          </span>
                          {result.description && (
                            <span
                              className={`text-[0.72rem] ml-2 ${t.text.caption}`}
                            >
                              {result.description}
                            </span>
                          )}
                        </div>
                        <ChevronRight className={`w-3 h-3 ${t.text.muted}`} />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {searchQuery && searchResults.length === 0 && searchFocused && (
                <div
                  className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-50 px-4 py-3 ${t.page.cardBg} ${t.page.cardBorder}`}
                >
                  <span className={`text-[0.78rem] ${t.text.caption}`}>
                    未找到匹配的设置项
                  </span>
                </div>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[0.8rem] transition-all ${
                saved ? t.btn.savedActive : t.btn.saved
              }`}
            >
              {saved ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saved ? "已保存" : "保存设置"}
            </button>
          </div>
        </div>

        {/* Body — 左右分栏布局：导航栏与内容区完全隔离 */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* ═══ 左侧导航栏 ═══ 固定宽度、独立滚动、不受内容区任何影响 */}
          <aside className="w-56 flex-shrink-0 border-r ${t.page.barBorder} bg-[var(--ide-bg)]/50 backdrop-blur-sm overflow-y-auto">
            <div className="p-4 space-y-0.5">
              {SECTIONS.map((s) => {
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isActive ? t.page.navActive : t.page.navInactive
                    }`}
                  >
                    <s.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[0.82rem]">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ═══ 右侧内容区 ═══ 独立滚动容器，面板在此渲染 */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-8 py-6">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className={`text-[1.15rem] font-semibold mb-1.5 ${t.text.heading}`}>
                    {currentSection.label}
                  </h2>
                  <p className={`text-[0.8rem] ${t.text.muted}`}>
                    {currentSection.description}
                  </p>
                </div>
                {renderContent()}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </ModelRegistryProvider>
  );
}

// ===== General Settings Section =====

function GeneralSection({
  t,
  isCyber,
  toggleTheme,
  setShowThemeCustomizer,
}: {
  t: ThemeTokens;
  isCyber: boolean;
  toggleTheme: () => void;
  setShowThemeCustomizer: (v: boolean) => void;
}) {
  const { settings, updateGeneralSettings } = useSettingsStore();
  const general = settings.general;

  return (
    <div className="space-y-6">
      {/* Theme */}
      <SettingGroup title="主题" t={t}>
        <div className="flex items-center gap-3 mb-3">
          <ThemeButton
            icon={Sun}
            label="Navy 深蓝"
            active={!isCyber}
            onClick={() => isCyber && toggleTheme()}
            t={t}
          />
          <ThemeButton
            icon={Moon}
            label="赛博朋克"
            active={isCyber}
            onClick={() => !isCyber && toggleTheme()}
            t={t}
          />
        </div>
        <button
          onClick={() => setShowThemeCustomizer(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[0.82rem] transition-colors ${t.btn.accent} ${t.btn.accentHover}`}
        >
          <Palette className="w-4 h-4" />
          打开自定义主题编辑器
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </button>
      </SettingGroup>

      {/* Language */}
      <SettingGroup title="语言与地区" t={t}>
        <div className="space-y-2">
          <SettingRow label="界面语言" description="选择应用界面语言" t={t}>
            <select
              value={general.language}
              onChange={(e) =>
                updateGeneralSettings({
                  language: e.target.value as "zh-CN" | "en-US" | "ja-JP",
                })
              }
              className={`px-3 py-1.5 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText}`}
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </SettingRow>
          <SettingRow label="时区" description="用于显示时间戳" t={t}>
            <span className={`text-[0.82rem] ${t.text.tertiary}`}>
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
          </SettingRow>
        </div>
      </SettingGroup>

      {/* Editor */}
      <SettingGroup title="编辑器" t={t}>
        <div className="space-y-2">
          <SettingRow
            label="编辑器字体"
            description="代码编辑器使用的字体"
            t={t}
          >
            <select
              value={general.editorFont}
              onChange={(e) =>
                updateGeneralSettings({ editorFont: e.target.value })
              }
              className={`px-3 py-1.5 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText}`}
            >
              <option value="Monaco">Monaco</option>
              <option value="Fira Code">Fira Code</option>
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="Source Code Pro">Source Code Pro</option>
              <option value="Consolas">Consolas</option>
            </select>
          </SettingRow>
          <SettingRow label="字体大小" description="编辑器字号" t={t}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={24}
                value={general.editorFontSize}
                onChange={(e) =>
                  updateGeneralSettings({
                    editorFontSize: Number(e.target.value),
                  })
                }
                className="w-24 accent-violet-500"
              />
              <span
                className={`text-[0.82rem] w-10 text-right tabular-nums ${t.text.secondary}`}
              >
                {general.editorFontSize}px
              </span>
            </div>
          </SettingRow>
          <SettingRow label="自动换行" description="超长行自动折行显示" t={t}>
            <Toggle
              checked={general.wordWrap}
              onChange={(v) => updateGeneralSettings({ wordWrap: v })}
              t={t}
            />
          </SettingRow>
          <SettingRow label="本地链接打开方式" t={t}>
            <select
              value={general.localLinkOpenMode}
              onChange={(e) =>
                updateGeneralSettings({
                  localLinkOpenMode: e.target.value as "system" | "builtin",
                })
              }
              className={`px-3 py-1.5 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText}`}
            >
              <option value="system">系统默认</option>
              <option value="builtin">内置浏览器</option>
            </select>
          </SettingRow>
          <SettingRow label="Markdown 打开方式" t={t}>
            <select
              value={general.markdownOpenMode}
              onChange={(e) =>
                updateGeneralSettings({
                  markdownOpenMode: e.target.value as "editor" | "preview",
                })
              }
              className={`px-3 py-1.5 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText}`}
            >
              <option value="editor">编辑器</option>
              <option value="preview">预览</option>
            </select>
          </SettingRow>
        </div>
      </SettingGroup>

      {/* Shortcuts — 可编辑快捷键映射 */}
      <KeybindingsEditor />

      {/* Node.js */}
      <SettingGroup title="运行环境" t={t}>
        <SettingRow
          label="Node.js 版本"
          description="项目运行的 Node.js 版本"
          t={t}
        >
          <select
            value={general.nodeVersion}
            onChange={(e) =>
              updateGeneralSettings({ nodeVersion: e.target.value })
            }
            className={`px-3 py-1.5 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText}`}
          >
            <option value="18.0.0">18.x LTS</option>
            <option value="20.0.0">20.x LTS</option>
            <option value="22.0.0">22.x</option>
          </select>
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

// ===== Account Section =====

function AccountSection({ t }: { t: ThemeTokens }) {
  const { settings, updateUserProfile } = useSettingsStore();
  const profile = settings.userProfile;
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({ ...profile });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setEditDraft({ ...editDraft, avatar: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateUserProfile(editDraft);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div
        className={`flex items-center gap-4 p-5 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center relative overflow-hidden ${t.page.avatarGradient} cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={() => fileInputRef.current?.click()}
        >
          {profile.avatar || editDraft.avatar ? (
            <img
              src={editDraft.avatar || profile.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleAvatarUpload}
        />
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={editDraft.username}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, username: e.target.value })
                }
                placeholder="用户名"
                className={`w-full px-3 py-2 rounded-lg border text-[0.85rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
              />
              <input
                value={editDraft.email}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, email: e.target.value })
                }
                placeholder="邮箱"
                className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
              />
              <textarea
                value={editDraft.bio || ""}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, bio: e.target.value })
                }
                placeholder="个人简介（可选）"
                rows={2}
                className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] resize-none ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.accent} ${t.btn.accentHover}`}
                >
                  <Check className="w-3.5 h-3.5 inline mr-1" />
                  保存
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={`text-[0.95rem] ${t.text.primary}`}>
                {profile.username || "未设置用户名"}
              </div>
              <div className={`text-[0.78rem] ${t.text.caption}`}>
                {profile.email || "未设置邮箱"}
              </div>
              {profile.bio && (
                <div className={`text-[0.75rem] mt-1 ${t.text.muted}`}>
                  {profile.bio}
                </div>
              )}
              <button
                onClick={() => {
                  setEditDraft({ ...profile });
                  setIsEditing(true);
                }}
                className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
              >
                编辑资料
              </button>
            </>
          )}
        </div>
      </div>

      {/* Security info */}
      <div
        className={`flex items-start gap-2 px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
      >
        <Shield className={`w-4 h-4 flex-shrink-0 mt-0.5 ${t.status.info}`} />
        <div className={`text-[0.72rem] ${t.text.muted}`}>
          本地模式下无需登录，所有数据仅存储在浏览器本地。如需跨设备同步，建议使用导入/导出功能备份配置。
        </div>
      </div>
    </div>
  );
}

// ===== Import/Export Section =====

function ImportExportSection({ t }: { t: ThemeTokens }) {
  const {
    exportConfig,
    importConfig,
    resetSettings,
    settings,
    updateImportSettings,
  } = useSettingsStore();

  const handleExport = () => {
    const data = exportConfig();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yyc3-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          importConfig(data);
          toastSuccess("配置导入成功！");
        } catch {
          toastError("配置文件格式错误");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = async () => {
    if (await confirmDialog("确定要重置所有设置为默认值吗？此操作不可撤销。")) {
      resetSettings();
      toastSuccess("设置已重置");
    }
  };

  const handleClearCache = () => {
    try {
      const cleared = clearAllYYC3Storage();
      toastSuccess(`已清除 ${cleared} 项缓存数据`);
    } catch {
      toastError("清除缓存失败");
    }
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      <SettingGroup title="配置导出" t={t}>
        <div
          className={`p-4 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
        >
          <div className={`text-[0.82rem] mb-2 ${t.text.secondary}`}>
            导出所有设置为 JSON 文件
          </div>
          <div className={`text-[0.72rem] mb-3 ${t.text.muted}`}>
            包含通用设置、智能体、MCP、模型、规则、技能等全部配置
          </div>
          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[0.82rem] ${t.btn.accent} ${t.btn.accentHover}`}
          >
            <Download className="w-4 h-4" />
            导出配置
          </button>
        </div>
      </SettingGroup>

      {/* Import */}
      <SettingGroup title="配置导入" t={t}>
        <div
          className={`p-4 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
        >
          <div className={`text-[0.82rem] mb-2 ${t.text.secondary}`}>
            从 JSON 文件导入设置
          </div>
          <div className={`text-[0.72rem] mb-3 ${t.text.muted}`}>
            导入将覆盖当前全部设置，建议先导出备份
          </div>
          <button
            onClick={handleImport}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[0.82rem] ${t.btn.accent} ${t.btn.accentHover}`}
          >
            <Upload className="w-4 h-4" />
            导入配置
          </button>
        </div>
      </SettingGroup>

      {/* Import settings toggles */}
      <SettingGroup title="自动导入规则" t={t}>
        <div className="space-y-2">
          <SettingRow
            label="包含 AGENTS.md"
            description="导入时包含项目根目录的 AGENTS.md 规则"
            t={t}
          >
            <Toggle
              checked={settings.importSettings.includeAgentsMD}
              onChange={(v) => updateImportSettings({ includeAgentsMD: v })}
              t={t}
            />
          </SettingRow>
          <SettingRow
            label="包含 CLAUDE.md"
            description="导入时包含项目根目录的 CLAUDE.md 规则"
            t={t}
          >
            <Toggle
              checked={settings.importSettings.includeClaudeMD}
              onChange={(v) => updateImportSettings({ includeClaudeMD: v })}
              t={t}
            />
          </SettingRow>
        </div>
      </SettingGroup>

      {/* Data management */}
      <SettingGroup title="数据管理" t={t}>
        <div
          className={`p-4 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
        >
          <div className={`text-[0.82rem] mb-3 ${t.text.secondary}`}>
            危险操作区
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleClearCache}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.78rem] transition-colors ${t.btn.danger}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              清除应用缓存
            </button>
            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.78rem] transition-colors ${t.btn.dangerLight}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置所有设置
            </button>
          </div>
        </div>
      </SettingGroup>

      {/* Privacy note */}
      <div
        className={`flex items-start gap-2 px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
      >
        <Shield
          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${t.status.warning}`}
        />
        <div className={`text-[0.72rem] ${t.text.muted}`}>
          所有配置数据仅存储在浏览器本地{" "}
          <code
            className={`px-1 py-0.5 rounded ${t.badgeBg} ${t.text.tertiary}`}
          >
            localStorage
          </code>{" "}
          中， 不会发送到任何第三方服务。导出的 JSON 文件可能包含敏感信息（如
          API Key），请妥善保管。
        </div>
      </div>
    </div>
  );
}

// ===== Agent Workflow Section =====
function AgentWorkflowSection({ t }: { t: ThemeTokens }) {
  const {
    workflows,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    executeWorkflow,
  } = useWorkflowPluginStore();
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "" });

  const handleCreate = () => {
    if (!draft.name.trim()) return;
    addWorkflow({
      name: draft.name,
      description: draft.description,
      nodes: [
        { id: "start", type: "start", name: "开始", position: { x: 100, y: 100 } },
        { id: "end", type: "end", name: "结束", position: { x: 100, y: 300 } },
      ],
      edges: [{ id: "edge-1", source: "start", target: "end" }],
      status: "draft",
    });
    setDraft({ name: "", description: "" });
    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      <SettingGroup title="工作流管理" t={t}>
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
          <div className="flex items-center gap-2">
            <MessageSquare className={`w-4 h-4 ${t.text.accent}`} />
            <span className={`text-[0.82rem] ${t.text.primary}`}>
              {workflows.length} 个工作流
            </span>
            <span className={`text-[0.72rem] ${t.text.caption}`}>
              ({workflows.filter(w => w.status === "active").length} 个运行中)
            </span>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.accent} ${t.btn.accentHover}`}
          >
            <Plus className="w-3.5 h-3.5" />
            创建工作流
          </button>
        </div>

        {isCreating && (
          <div className={`p-4 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder} space-y-3`}>
            <input
              placeholder="工作流名称"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
            />
            <textarea
              placeholder="工作流描述（可选）"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] resize-none ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.accent} ${t.btn.accentHover}`}
              >
                创建
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {workflows.length > 0 ? (
          <div className="space-y-2">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[0.82rem] ${t.text.primary}`}>
                      {workflow.name}
                    </span>
                    <span className={`text-[0.68rem] px-2 py-0.5 rounded ${
                      workflow.status === "active"
                        ? t.status.successBg
                        : workflow.status === "paused"
                        ? t.status.warningBg
                        : t.status.infoBg
                    }`}>
                      {workflow.status === "active" ? "运行中" : workflow.status === "paused" ? "已暂停" : "草稿"}
                    </span>
                  </div>
                  {workflow.description && (
                    <div className={`text-[0.72rem] ${t.text.muted} mt-1`}>
                      {workflow.description}
                    </div>
                  )}
                  <div className={`text-[0.68rem] ${t.text.caption} mt-1`}>
                    执行次数: {workflow.executionCount} ·
                    创建于 {new Date(workflow.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => executeWorkflow(workflow.id)}
                    className={`px-2 py-1 rounded text-[0.72rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
                    title="执行"
                  >
                    ▶
                  </button>
                  <button
                    onClick={() => duplicateWorkflow(workflow.id)}
                    className={`px-2 py-1 rounded text-[0.72rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
                    title="复制"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => deleteWorkflow(workflow.id)}
                    className={`px-2 py-1 rounded text-[0.72rem] ${t.status.error} hover:opacity-80`}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-8 text-center rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
            <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${t.text.muted}`} />
            <div className={`text-[0.82rem] ${t.text.secondary}`}>暂无工作流</div>
            <div className={`text-[0.72rem] ${t.text.muted} mt-1`}>点击上方按钮创建第一个工作流</div>
          </div>
        )}
      </SettingGroup>
    </div>
  );
}

// ===== Plugin Custom Section =====
function PluginCustomSection({ t }: { t: ThemeTokens }) {
  const {
    plugins,
    installPlugin,
    uninstallPlugin,
    togglePlugin,
  } = useWorkflowPluginStore();
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", version: "1.0.0", author: "" });

  const handleCreate = () => {
    if (!draft.name.trim()) return;
    installPlugin({
      name: draft.name,
      description: draft.description,
      version: draft.version,
      author: draft.author,
      category: "custom",
      enabled: true,
      source: "local",
    });
    setDraft({ name: "", description: "", version: "1.0.0", author: "" });
    setIsCreating(false);
  };

  const customPlugins = plugins.filter(p => p.source === "local");

  return (
    <div className="space-y-4">
      <SettingGroup title="自研插件" t={t}>
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${t.text.accent}`} />
            <span className={`text-[0.82rem] ${t.text.primary}`}>
              {customPlugins.length} 个自研插件
            </span>
            <span className={`text-[0.72rem] ${t.text.caption}`}>
              ({customPlugins.filter(p => p.enabled).length} 个已启用)
            </span>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.accent} ${t.btn.accentHover}`}
          >
            <Plus className="w-3.5 h-3.5" />
            创建插件
          </button>
        </div>

        {isCreating && (
          <div className={`p-4 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder} space-y-3`}>
            <input
              placeholder="插件名称"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
            />
            <textarea
              placeholder="插件描述"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] resize-none ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
            />
            <div className="flex gap-2">
              <input
                placeholder="版本号"
                value={draft.version}
                onChange={(e) => setDraft({ ...draft, version: e.target.value })}
                className={`flex-1 px-3 py-2 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
              />
              <input
                placeholder="作者"
                value={draft.author}
                onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                className={`flex-1 px-3 py-2 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.accent} ${t.btn.accentHover}`}
              >
                创建
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {customPlugins.length > 0 ? (
          <div className="space-y-2">
            {customPlugins.map((plugin) => (
              <div
                key={plugin.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[0.82rem] ${t.text.primary}`}>
                      {plugin.name}
                    </span>
                    <span className={`text-[0.68rem] px-2 py-0.5 rounded ${t.status.infoBg}`}>
                      v{plugin.version}
                    </span>
                  </div>
                  {plugin.description && (
                    <div className={`text-[0.72rem] ${t.text.muted} mt-1`}>
                      {plugin.description}
                    </div>
                  )}
                  <div className={`text-[0.68rem] ${t.text.caption} mt-1`}>
                    作者: {plugin.author} ·
                    安装于 {new Date(plugin.installedAt || 0).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => togglePlugin(plugin.id)}
                    className={`px-2 py-1 rounded text-[0.72rem] ${plugin.enabled ? t.status.successBg : t.status.warningBg}`}
                  >
                    {plugin.enabled ? "已启用" : "已禁用"}
                  </button>
                  <button
                    onClick={() => uninstallPlugin(plugin.id)}
                    className={`px-2 py-1 rounded text-[0.72rem] ${t.status.error} hover:opacity-80`}
                    title="卸载"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-8 text-center rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
            <Zap className={`w-12 h-12 mx-auto mb-3 ${t.text.muted}`} />
            <div className={`text-[0.82rem] ${t.text.secondary}`}>暂无自研插件</div>
            <div className={`text-[0.72rem] ${t.text.muted} mt-1`}>点击上方按钮创建第一个插件</div>
          </div>
        )}
      </SettingGroup>
    </div>
  );
}

// ===== Plugin Market Section =====
function PluginMarketSection({ t }: { t: ThemeTokens }) {
  const { plugins, installPlugin } = useWorkflowPluginStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const marketPlugins = [
    { id: "market-1", name: "AI代码补全", description: "基于GPT的智能代码补全插件", category: "ai", version: "2.1.0", author: "YYC3 Team", downloads: 1520 },
    { id: "market-2", name: "Git增强", description: "Git工作流增强和可视化", category: "productivity", version: "1.5.2", author: "Community", downloads: 890 },
    { id: "market-3", name: "数据库管理", description: "数据库连接和查询管理工具", category: "integration", version: "3.0.1", author: "DB Tools", downloads: 2100 },
    { id: "market-4", name: "主题定制", description: "自定义编辑器主题和配色方案", category: "utility", version: "1.2.0", author: "Theme Maker", downloads: 750 },
  ];

  const categories = [
    { id: "all", label: "全部" },
    { id: "ai", label: "AI" },
    { id: "productivity", label: "效率" },
    { id: "integration", label: "集成" },
    { id: "utility", label: "工具" },
  ];

  const filteredPlugins = marketPlugins.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (plugin: typeof marketPlugins[0]) => {
    installPlugin({
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      author: plugin.author,
      category: plugin.category as any,
      enabled: true,
      source: "market",
    });
  };

  const isInstalled = (pluginId: string) => plugins.some(p => p.name === marketPlugins.find(mp => mp.id === pluginId)?.name);

  return (
    <div className="space-y-4">
      <SettingGroup title="插件市场" t={t}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
          <Search className={`w-4 h-4 ${t.text.muted}`} />
          <input
            placeholder="搜索插件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent text-[0.82rem] outline-none ${t.page.inputText}`}
          />
        </div>

        <div className="flex gap-2 px-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-[0.78rem] transition-all ${
                selectedCategory === cat.id
                  ? `${t.btn.accent} ${t.btn.accentHover}`
                  : `${t.btn.ghost} ${t.btn.ghostHover}`
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.id}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[0.82rem] ${t.text.primary}`}>
                    {plugin.name}
                  </span>
                  <span className={`text-[0.68rem] px-2 py-0.5 rounded ${t.status.infoBg}`}>
                    v{plugin.version}
                  </span>
                  <span className={`text-[0.68rem] px-2 py-0.5 rounded ${t.page.cardBorder}`}>
                    {plugin.category}
                  </span>
                </div>
                <div className={`text-[0.72rem] ${t.text.muted} mt-1`}>
                  {plugin.description}
                </div>
                <div className={`text-[0.68rem] ${t.text.caption} mt-1`}>
                  作者: {plugin.author} · 下载量: {plugin.downloads}
                </div>
              </div>
              <button
                onClick={() => handleInstall(plugin)}
                disabled={isInstalled(plugin.id)}
                className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${
                  isInstalled(plugin.id)
                    ? "opacity-50 cursor-not-allowed"
                    : `${t.btn.accent} ${t.btn.accentHover}`
                }`}
              >
                {isInstalled(plugin.id) ? "已安装" : "安装"}
              </button>
            </div>
          ))}
        </div>
      </SettingGroup>
    </div>
  );
}

// ===== Plugin Dev Section =====
function PluginDevSection({ t }: { t: ThemeTokens }) {
  const { pluginTemplates } = useWorkflowPluginStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState("");

  const handleUseTemplate = (templateId: string) => {
    const template = pluginTemplates.find(t => t.id === templateId);
    if (template) {
      setCustomCode(template.template);
      setSelectedTemplate(templateId);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(customCode);
  };

  return (
    <div className="space-y-4">
      <SettingGroup title="插件开发工具" t={t}>
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
          <div className="flex items-center gap-2">
            <Settings className={`w-4 h-4 ${t.text.accent}`} />
            <span className={`text-[0.82rem] ${t.text.primary}`}>
              {pluginTemplates.length} 个开发模版
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {pluginTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleUseTemplate(template.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedTemplate === template.id
                  ? `${t.page.cardBg} ${t.page.inputBorder} ${t.page.inputFocus}`
                  : `${t.page.cardBg} ${t.page.cardBorder} ${t.hoverBg}`
              }`}
            >
              <div className={`text-[0.82rem] ${t.text.primary} mb-1`}>
                {template.name}
              </div>
              <div className={`text-[0.72rem] ${t.text.muted}`}>
                {template.description}
              </div>
            </button>
          ))}
        </div>

        {selectedTemplate && customCode && (
          <div className={`p-4 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[0.82rem] ${t.text.primary}`}>
                代码模版
              </span>
              <button
                onClick={handleCopyCode}
                className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
              >
                复制代码
              </button>
            </div>
            <textarea
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              rows={12}
              className={`w-full px-3 py-2 rounded-lg border text-[0.72rem] font-mono resize-none ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
            />
          </div>
        )}
      </SettingGroup>
    </div>
  );
}

// ===== Template Design Section =====
function TemplateDesignSection({ t }: { t: ThemeTokens }) {
  const {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    useTemplate: applyTemplate,
  } = useWorkflowPluginStore();
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", category: "custom" as const, icon: "📦", tags: "" });

  const handleCreate = () => {
    if (!draft.name.trim()) return;
    addTemplate({
      name: draft.name,
      description: draft.description,
      category: draft.category,
      icon: draft.icon,
      tags: draft.tags.split(",").map(t => t.trim()).filter(Boolean),
      template: {},
    });
    setDraft({ name: "", description: "", category: "custom", icon: "📦", tags: "" });
    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      <SettingGroup title="模版管理" t={t}>
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
          <div className="flex items-center gap-2">
            <Database className={`w-4 h-4 ${t.text.accent}`} />
            <span className={`text-[0.82rem] ${t.text.primary}`}>
              {templates.length} 个模版
            </span>
            <span className={`text-[0.72rem] ${t.text.caption}`}>
              (总使用次数: {templates.reduce((sum, t) => sum + t.usageCount, 0)})
            </span>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.accent} ${t.btn.accentHover}`}
          >
            <Plus className="w-3.5 h-3.5" />
            创建模版
          </button>
        </div>

        {isCreating && (
          <div className={`p-4 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder} space-y-3`}>
            <input
              placeholder="模版名称"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
            />
            <textarea
              placeholder="模版描述"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] resize-none ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
            />
            <div className="flex gap-2">
              <input
                placeholder="图标 (emoji)"
                value={draft.icon}
                onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                className={`w-20 px-3 py-2 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
              />
              <input
                placeholder="标签 (逗号分隔)"
                value={draft.tags}
                onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                className={`flex-1 px-3 py-2 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.accent} ${t.btn.accentHover}`}
              >
                创建
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{template.icon}</span>
                  <span className={`text-[0.82rem] ${t.text.primary}`}>
                    {template.name}
                  </span>
                  <span className={`text-[0.68rem] px-2 py-0.5 rounded ${t.status.infoBg}`}>
                    {template.category}
                  </span>
                </div>
                {template.description && (
                  <div className={`text-[0.72rem] ${t.text.muted} mt-1`}>
                    {template.description}
                  </div>
                )}
                <div className={`text-[0.68rem] ${t.text.caption} mt-1`}>
                  使用次数: {template.usageCount} ·
                  创建于 {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => applyTemplate(template.id)}
                  className={`px-2 py-1 rounded text-[0.72rem] ${t.btn.accent} ${t.btn.accentHover}`}
                  title="使用"
                >
                  使用
                </button>
                <button
                  onClick={() => duplicateTemplate(template.id)}
                  className={`px-2 py-1 rounded text-[0.72rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
                  title="复制"
                >
                  📋
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className={`px-2 py-1 rounded text-[0.72rem] ${t.status.error} hover:opacity-80`}
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </SettingGroup>
    </div>
  );
}
