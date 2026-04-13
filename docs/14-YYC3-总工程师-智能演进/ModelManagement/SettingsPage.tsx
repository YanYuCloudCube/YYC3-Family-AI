/**
 * @file SettingsPage.tsx
 * @description 全局设置页面 — 集成搜索、账号、通用、智能体、MCP、模型、
 *              上下文、对话流、规则技能、导入导出等完整设置模块
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v2.0.0
 * @created 2026-03-06
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,preferences,models,theme,agents,mcp,rules,skills
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
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
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useTheme } from './ide/ThemeStore'
import { useThemeTokens, type ThemeTokens } from './ide/hooks/useThemeTokens'
import {
  useSettingsStore,
  type SearchResult,
} from './ide/stores/useSettingsStore'
import {
  clearAllYYC3Storage,
} from './ide/constants/storage-keys'
import { Toggle, SettingRow, SettingGroup, ThemeButton } from './settings/SettingsShared'
import { AgentSection } from './settings/AgentSection'
import { MCPSection, ModelSection } from './settings/MCPModelSection'
import { ConversationSection, ContextSection } from './settings/ConversationContextSection'
import { RulesSection, SkillsSection } from './settings/RulesSkillsSection'
import { KeybindingsEditor } from './settings/KeybindingsEditor'
import { PluginSection } from './settings/PluginSection'

// ── Section definitions ──

type SettingsSection =
  | 'general'
  | 'account'
  | 'agents'
  | 'plugins'
  | 'mcp'
  | 'models'
  | 'context'
  | 'conversation'
  | 'rules'
  | 'skills'
  | 'import'

interface SectionDef {
  id: SettingsSection
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const SECTIONS: SectionDef[] = [
  { id: 'general', label: '通用设置', icon: Settings, description: '主题、语言、编辑器、快捷键' },
  { id: 'account', label: '账号信息', icon: User, description: '个人资料、头像、偏好' },
  { id: 'agents', label: '智能体', icon: Bot, description: '内置/自定义智能体管理' },
  { id: 'plugins', label: '插件管理', icon: Plug, description: '插件安装与配置' },
  { id: 'mcp', label: 'MCP 连接', icon: Plug, description: 'MCP 工具服务管理' },
  { id: 'models', label: '模型配置', icon: Cpu, description: 'AI 模型 Provider 与 API Key' },
  { id: 'context', label: '上下文管理', icon: Database, description: '代码索引、文档集、忽略规则' },
  { id: 'conversation', label: '对话流设置', icon: MessageSquare, description: '待办清单、代码审查、命令、通知' },
  { id: 'rules', label: '规则管理', icon: ScrollText, description: '个人/项目级编码规则' },
  { id: 'skills', label: '技能管理', icon: Zap, description: '全局/项目技能配置' },
  { id: 'import', label: '导入导出', icon: Download, description: '配置导入/导出、数据管理' },
]

// ── Main Component ──

export default function SettingsPage() {
  const navigate = useNavigate()
  const { isCyber, toggleTheme, setShowThemeCustomizer } = useTheme()
  const t = useThemeTokens()
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [saved, setSaved] = useState(false)

  // Search
  const { searchQuery, setSearchQuery, searchSettings: doSearch, settings, exportConfig, importConfig, resetSettings } = useSettingsStore()
  const [searchFocused, setSearchFocused] = useState(false)
  const searchResults = useMemo<SearchResult[]>(() => {
    return searchQuery.trim() ? doSearch(searchQuery) : []
  }, [searchQuery, doSearch])

  const handleSave = useCallback(() => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const handleSearchSelect = (result: SearchResult) => {
    // Map search result section to SettingsSection
    const sectionMap: Record<string, SettingsSection> = {
      general: 'general',
      agents: 'agents',
      mcp: 'mcp',
      models: 'models',
      conversation: 'conversation',
      context: 'context',
      rules: 'rules',
      skills: 'skills',
    }
    const target = sectionMap[result.section]
    if (target) setActiveSection(target)
    setSearchQuery('')
  }

  const currentSection = SECTIONS.find((s) => s.id === activeSection)!

  // ── Render section content ──
  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSection t={t} isCyber={isCyber} toggleTheme={toggleTheme} setShowThemeCustomizer={setShowThemeCustomizer} />
      case 'account':
        return <AccountSection t={t} />
      case 'agents':
        return <AgentSection />
      case 'plugins':
        return <PluginSection />
      case 'mcp':
        return <MCPSection />
      case 'models':
        return <ModelSection />
      case 'context':
        return <ContextSection />
      case 'conversation':
        return <ConversationSection />
      case 'rules':
        return <RulesSection />
      case 'skills':
        return <SkillsSection />
      case 'import':
        return <ImportExportSection t={t} />
      default:
        return null
    }
  }

  return (
    <div className={`size-full min-h-screen ${t.page.pageBg}`}>
      {/* Top bar */}
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md ${t.page.barBg} ${t.page.barBorder}`}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 text-[0.82rem] transition-colors ${t.text.tertiary} hover:${t.text.accent}`}
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
          <div className={`h-5 w-px ${t.page.divider}`} />
          <Settings className={`w-4 h-4 ${t.text.accent}`} />
          <h1 className={`text-[0.95rem] ${t.text.primary}`}>
            全局设置
          </h1>

          {/* Search bar */}
          <div className="flex-1 max-w-sm ml-4 relative">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              searchFocused
                ? `${t.page.inputBg} ${t.page.inputFocus} ${t.page.inputBorder}`
                : `${t.page.inputBg} ${t.page.inputBorder}`
            }`}>
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
                <button onClick={() => setSearchQuery('')} className={`${t.hoverBg} rounded p-0.5`}>
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
                      <span className={`text-[0.58rem] px-1.5 py-0.5 rounded uppercase ${t.status.infoBg}`}>
                        {result.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[0.82rem] ${t.text.primary}`}>{result.title}</span>
                        {result.description && (
                          <span className={`text-[0.72rem] ml-2 ${t.text.caption}`}>{result.description}</span>
                        )}
                      </div>
                      <ChevronRight className={`w-3 h-3 ${t.text.muted}`} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {searchQuery && searchResults.length === 0 && searchFocused && (
              <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-50 px-4 py-3 ${t.page.cardBg} ${t.page.cardBorder}`}>
                <span className={`text-[0.78rem] ${t.text.caption}`}>未找到匹配的设置项</span>
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
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-8">
          {/* Sidebar nav */}
          <nav className="w-56 flex-shrink-0 space-y-0.5">
            {SECTIONS.map((s) => {
              const isActive = activeSection === s.id
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
              )
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-6">
                <h2 className={`text-[1.1rem] mb-1 ${t.text.heading}`}>
                  {currentSection.label}
                </h2>
                <p className={`text-[0.78rem] ${t.text.muted}`}>
                  {currentSection.description}
                </p>
              </div>
              {renderContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== General Settings Section =====

function GeneralSection({
  t,
  isCyber,
  toggleTheme,
  setShowThemeCustomizer,
}: {
  t: ThemeTokens
  isCyber: boolean
  toggleTheme: () => void
  setShowThemeCustomizer: (v: boolean) => void
}) {
  const { settings, updateGeneralSettings } = useSettingsStore()
  const general = settings.general

  return (
    <div className="space-y-6">
      {/* Theme */}
      <SettingGroup title="主题" t={t}>
        <div className="flex items-center gap-3 mb-3">
          <ThemeButton icon={Sun} label="Navy 深蓝" active={!isCyber} onClick={() => isCyber && toggleTheme()} t={t} />
          <ThemeButton icon={Moon} label="赛博朋克" active={isCyber} onClick={() => !isCyber && toggleTheme()} t={t} />
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
              onChange={(e) => updateGeneralSettings({ language: e.target.value as 'zh-CN' | 'en-US' | 'ja-JP' })}
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
          <SettingRow label="编辑器字体" description="代码编辑器使用的字体" t={t}>
            <select
              value={general.editorFont}
              onChange={(e) => updateGeneralSettings({ editorFont: e.target.value })}
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
                onChange={(e) => updateGeneralSettings({ editorFontSize: Number(e.target.value) })}
                className="w-24 accent-violet-500"
              />
              <span className={`text-[0.82rem] w-10 text-right tabular-nums ${t.text.secondary}`}>
                {general.editorFontSize}px
              </span>
            </div>
          </SettingRow>
          <SettingRow label="自动换行" description="超长行自动折行显示" t={t}>
            <Toggle checked={general.wordWrap} onChange={(v) => updateGeneralSettings({ wordWrap: v })} t={t} />
          </SettingRow>
          <SettingRow label="本地链接打开方式" t={t}>
            <select
              value={general.localLinkOpenMode}
              onChange={(e) => updateGeneralSettings({ localLinkOpenMode: e.target.value as 'system' | 'builtin' })}
              className={`px-3 py-1.5 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText}`}
            >
              <option value="system">系统默认</option>
              <option value="builtin">内置浏览器</option>
            </select>
          </SettingRow>
          <SettingRow label="Markdown 打开方式" t={t}>
            <select
              value={general.markdownOpenMode}
              onChange={(e) => updateGeneralSettings({ markdownOpenMode: e.target.value as 'editor' | 'preview' })}
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
        <SettingRow label="Node.js 版本" description="项目运行的 Node.js 版本" t={t}>
          <select
            value={general.nodeVersion}
            onChange={(e) => updateGeneralSettings({ nodeVersion: e.target.value })}
            className={`px-3 py-1.5 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText}`}
          >
            <option value="18.0.0">18.x LTS</option>
            <option value="20.0.0">20.x LTS</option>
            <option value="22.0.0">22.x</option>
          </select>
        </SettingRow>
      </SettingGroup>
    </div>
  )
}

// ===== Account Section =====

function AccountSection({ t }: { t: ThemeTokens }) {
  const { settings, updateUserProfile } = useSettingsStore()
  const profile = settings.userProfile
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState({ ...profile })

  const handleSave = () => {
    updateUserProfile(editDraft)
    setIsEditing(false)
  }

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className={`flex items-center gap-4 p-5 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${t.page.avatarGradient}`}>
          <User className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={editDraft.username}
                onChange={(e) => setEditDraft({ ...editDraft, username: e.target.value })}
                placeholder="用户名"
                className={`w-full px-3 py-2 rounded-lg border text-[0.85rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
              />
              <input
                value={editDraft.email}
                onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
                placeholder="邮箱"
                className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText} ${t.page.inputFocus} focus:outline-none`}
              />
              <textarea
                value={editDraft.bio || ''}
                onChange={(e) => setEditDraft({ ...editDraft, bio: e.target.value })}
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
                  <Check className="w-3.5 h-3.5 inline mr-1" />保存
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={`text-[0.95rem] ${t.text.primary}`}>
                {profile.username || '未设置用户名'}
              </div>
              <div className={`text-[0.78rem] ${t.text.caption}`}>
                {profile.email || '未设置邮箱'}
              </div>
              {profile.bio && (
                <div className={`text-[0.75rem] mt-1 ${t.text.muted}`}>{profile.bio}</div>
              )}
              <button
                onClick={() => { setEditDraft({ ...profile }); setIsEditing(true) }}
                className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
              >
                编辑资料
              </button>
            </>
          )}
        </div>
      </div>

      {/* Security info */}
      <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
        <Shield className={`w-4 h-4 flex-shrink-0 mt-0.5 ${t.status.info}`} />
        <div className={`text-[0.72rem] ${t.text.muted}`}>
          本地模式下无需登录，所有数据仅存储在浏览器本地。如需跨设备同步，建议使用导入/导出功能备份配置。
        </div>
      </div>
    </div>
  )
}

// ===== Import/Export Section =====

function ImportExportSection({ t }: { t: ThemeTokens }) {
  const { exportConfig, importConfig, resetSettings, settings, updateImportSettings } = useSettingsStore()

  const handleExport = () => {
    const data = exportConfig()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yyc3-settings-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          importConfig(data)
          alert('配置导入成功！')
        } catch {
          alert('配置文件格式错误')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleReset = () => {
    if (confirm('确定要重置所有设置为默认值吗？此操作不可撤销。')) {
      resetSettings()
      alert('设置已重置')
    }
  }

  const handleClearCache = () => {
    try {
      const cleared = clearAllYYC3Storage()
      alert(`已清除 ${cleared} 项缓存数据`)
    } catch {
      alert('清除缓存失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* Export */}
      <SettingGroup title="配置导出" t={t}>
        <div className={`p-4 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
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
        <div className={`p-4 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
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
          <SettingRow label="包含 AGENTS.md" description="导入时包含项目根目录的 AGENTS.md 规则" t={t}>
            <Toggle
              checked={settings.importSettings.includeAgentsMD}
              onChange={(v) => updateImportSettings({ includeAgentsMD: v })}
              t={t}
            />
          </SettingRow>
          <SettingRow label="包含 CLAUDE.md" description="导入时包含项目根目录的 CLAUDE.md 规则" t={t}>
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
        <div className={`p-4 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
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
      <div className={`flex items-start gap-2 px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}>
        <Shield className={`w-4 h-4 flex-shrink-0 mt-0.5 ${t.status.warning}`} />
        <div className={`text-[0.72rem] ${t.text.muted}`}>
          所有配置数据仅存储在浏览器本地 <code className={`px-1 py-0.5 rounded ${t.badgeBg} ${t.text.tertiary}`}>localStorage</code> 中，
          不会发送到任何第三方服务。导出的 JSON 文件可能包含敏感信息（如 API Key），请妥善保管。
        </div>
      </div>
    </div>
  )
}