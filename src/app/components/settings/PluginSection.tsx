/**
 * @file: settings/PluginSection.tsx
 * @description: 插件管理设置模块 — 支持插件的启用/禁用、配置、分类筛选、
 *              批量操作，对齐 YYC3-Settings.md PluginModule 设计规范
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-02
 * @updated: 2026-04-02
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: settings,plugins,management,module
 */

import { useState, useMemo } from 'react'
import {
  Puzzle,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Power,
  PowerOff,
  Settings,
  ExternalLink,
  Star,
  Download,
  Package,
  Shield,
  Palette,
  Zap,
  Code2,
  GitBranch,
} from 'lucide-react'
import { useThemeTokens } from '../ide/hooks/useThemeTokens'
import { ItemCard, EmptyState, Toggle, SettingGroup } from './SettingsShared'
import { usePluginStore, type PluginCategory as StorePluginCategory } from '../ide/stores/usePluginStore'

// ── Types ──

interface PluginConfig {
  id: string
  name: string
  description: string
  version: string
  author: string
  category: PluginCategory
  enabled: boolean
  isBuiltIn: boolean
  configurable: boolean
  icon: typeof Code2
  color: string
  repository?: string
  installedAt: string
  lastUpdated: string
  dependencies?: string[]
  config?: Record<string, unknown>
}

type PluginCategory = 'code-quality' | 'ai-tools' | 'git' | 'themes' | 'productivity'

// ── Constants ──

const CATEGORY_CONFIG: Record<PluginCategory, { label: string; icon: typeof Code2; color: string }> = {
  'code-quality': { label: '代码质量', icon: Shield, color: 'text-emerald-400' },
  'ai-tools': { label: 'AI 工具', icon: Zap, color: 'text-violet-400' },
  'git': { label: 'Git 集成', icon: GitBranch, color: 'text-orange-400' },
  'themes': { label: '主题定制', icon: Palette, color: 'text-pink-400' },
  'productivity': { label: '效率工具', icon: Package, color: 'text-blue-400' },
}

const CATEGORIES: PluginCategory[] = ['code-quality', 'ai-tools', 'git', 'themes', 'productivity']

// ── Default Plugins ──

const DEFAULT_PLUGINS: PluginConfig[] = [
  {
    id: 'plugin-eslint', name: 'ESLint 代码检查', description: '实时 JavaScript/TypeScript 代码检查，支持自动修复',
    version: '3.2.1', author: 'YYC³ Core', category: 'code-quality', enabled: true, isBuiltIn: true,
    configurable: true, icon: Shield, color: 'bg-emerald-500/15', repository: 'https://github.com/eslint/eslint',
    installedAt: '2026-03-01', lastUpdated: '2026-03-28',
  },
  {
    id: 'plugin-prettier', name: 'Prettier 格式化', description: '多语言代码格式化工具，统一代码风格',
    version: '4.0.0', author: 'YYC³ Core', category: 'code-quality', enabled: true, isBuiltIn: true,
    configurable: true, icon: Code2, color: 'bg-blue-500/15', installedAt: '2026-03-01', lastUpdated: '2026-03-25',
  },
  {
    id: 'plugin-ai-complete', name: 'AI 智能补全', description: '基于 LLM 的上下文感知代码补全引擎',
    version: '2.1.0', author: 'YYC³ AI Lab', category: 'ai-tools', enabled: true, isBuiltIn: true,
    configurable: true, icon: Zap, color: 'bg-violet-500/15', installedAt: '2026-03-01', lastUpdated: '2026-04-01',
  },
  {
    id: 'plugin-ai-review', name: 'AI 代码审查', description: '自动化代码审查，检测潜在问题和优化建议',
    version: '1.5.0', author: 'YYC³ AI Lab', category: 'ai-tools', enabled: true, isBuiltIn: false,
    configurable: true, icon: Zap, color: 'bg-violet-500/15', installedAt: '2026-03-10', lastUpdated: '2026-03-30',
  },
  {
    id: 'plugin-git-lens', name: 'Git 可视化增强', description: 'Git blame、历史对比、分支可视化',
    version: '1.8.3', author: 'GitPlus', category: 'git', enabled: true, isBuiltIn: false,
    configurable: false, icon: GitBranch, color: 'bg-orange-500/15', installedAt: '2026-03-05', lastUpdated: '2026-03-20',
  },
  {
    id: 'plugin-cyberpunk-theme', name: '赛博朋克主题', description: '霓虹风格编辑器主题，支持自定义配色',
    version: '2.0.0', author: 'YYC³ Design', category: 'themes', enabled: false, isBuiltIn: false,
    configurable: true, icon: Palette, color: 'bg-pink-500/15', installedAt: '2026-03-12', lastUpdated: '2026-03-29',
  },
  {
    id: 'plugin-snippets', name: '代码片段管理', description: '自定义代码片段库，支持变量和制表位',
    version: '1.3.0', author: 'YYC³ Core', category: 'productivity', enabled: true, isBuiltIn: true,
    configurable: true, icon: Package, color: 'bg-blue-500/15', installedAt: '2026-03-01', lastUpdated: '2026-03-22',
  },
  {
    id: 'plugin-perf-monitor', name: '性能分析器', description: '实时运行时性能监控和瓶颈分析',
    version: '3.0.1', author: 'PerfLab', category: 'productivity', enabled: false, isBuiltIn: false,
    configurable: false, icon: Zap, color: 'bg-amber-500/15', installedAt: '2026-03-18', lastUpdated: '2026-03-27',
  },
  {
    id: 'plugin-i18n', name: '国际化助手', description: '自动化多语言翻译、键值管理和本地化',
    version: '1.2.0', author: 'i18nKit', category: 'productivity', enabled: false, isBuiltIn: false,
    configurable: true, icon: Package, color: 'bg-cyan-500/15', installedAt: '2026-03-20', lastUpdated: '2026-03-26',
  },
]

// ── Component ──

export function PluginSection() {
  const th = useThemeTokens()
  const { plugins: storePlugins, togglePlugin, installPlugin, uninstallPlugin, enableAll, disableAll } = usePluginStore()
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [draft, setDraft] = useState<Partial<PluginConfig>>({})

  // Map store plugins to local PluginConfig format with icons
  const ICON_MAP: Record<string, { icon: typeof Code2; color: string }> = {
    'code-quality': { icon: Shield, color: 'bg-emerald-500/15' },
    'ai-tools': { icon: Zap, color: 'bg-violet-500/15' },
    'git': { icon: GitBranch, color: 'bg-orange-500/15' },
    'themes': { icon: Palette, color: 'bg-pink-500/15' },
    'productivity': { icon: Package, color: 'bg-blue-500/15' },
  }

  const plugins: PluginConfig[] = storePlugins.map(p => ({
    ...p,
    icon: ICON_MAP[p.category]?.icon || Package,
    color: ICON_MAP[p.category]?.color || 'bg-slate-500/15',
    configurable: p.configurable ?? false,
  }))

  const filtered = useMemo(() => {
    return plugins.filter(p => {
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [plugins, selectedCategory, searchQuery])

  const enabledCount = plugins.filter(p => p.enabled).length

  const handleToggle = (id: string) => {
    togglePlugin(id)
  }

  const handleRemove = (id: string) => {
    uninstallPlugin(id)
  }

  const handleCreate = () => {
    installPlugin({
      name: draft.name || '自定义插件',
      description: draft.description || '',
      version: '0.1.0',
      author: 'User',
      category: (draft.category as PluginCategory) || 'productivity',
      enabled: true,
      isBuiltIn: false,
      configurable: false,
    })
    setDraft({})
    setIsCreating(false)
  }

  const handleEnableAll = () => enableAll()
  const handleDisableAll = () => disableAll()

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}>
        <div className="flex items-center gap-2">
          <Puzzle className={`w-4 h-4 text-emerald-400`} />
          <span className={`text-[0.82rem] ${th.text.primary}`}>
            {plugins.length} 个插件
          </span>
          <span className={`text-[0.72rem] ${th.text.caption}`}>
            ({enabledCount} 已启用 · {plugins.filter(p => p.isBuiltIn).length} 内置)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCreating(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
          >
            <Plus className="w-3.5 h-3.5" />
            安装插件
          </button>
        </div>
      </div>

      {/* Search + category filter */}
      <div className="flex items-center gap-3">
        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${th.page.inputBg} ${th.page.inputBorder}`}>
          <Search className={`w-3.5 h-3.5 ${th.text.caption}`} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索插件..."
            className={`flex-1 bg-transparent text-[0.82rem] outline-none ${th.page.inputText} ${th.page.inputPlaceholder}`}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={`${th.hoverBg} rounded p-0.5`}>
              <X className={`w-3 h-3 ${th.text.caption}`} />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors ${
            selectedCategory === 'all'
              ? `${th.page.navActive}`
              : `${th.page.navInactive}`
          }`}
        >
          全部 ({plugins.length})
        </button>
        {CATEGORIES.map(cat => {
          const cfg = CATEGORY_CONFIG[cat]
          const count = plugins.filter(p => p.category === cat).length
          const Icon = cfg.icon
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors ${
                selectedCategory === cat
                  ? `${th.page.navActive}`
                  : `${th.page.navInactive}`
              }`}
            >
              <Icon className={`w-3 h-3 ${cfg.color}`} />
              {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleEnableAll}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.72rem] ${th.btn.ghost} ${th.btn.ghostHover}`}
        >
          <Power className="w-3 h-3 text-emerald-400" /> 全部启用
        </button>
        <button
          onClick={handleDisableAll}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.72rem] ${th.btn.ghost} ${th.btn.ghostHover}`}
        >
          <PowerOff className="w-3 h-3 text-slate-400" /> 全部禁用
        </button>
        <button className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.72rem] ${th.btn.ghost} ${th.btn.ghostHover}`}>
          <RefreshCw className="w-3 h-3" /> 检查更新
        </button>
      </div>

      {/* Create form */}
      {isCreating && (
        <ItemCard t={th} className="space-y-3">
          <div className={`text-[0.82rem] ${th.text.primary}`}>安装自定义插件</div>
          <input
            placeholder="插件名称"
            value={draft.name || ''}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
          />
          <input
            placeholder="描述"
            value={draft.description || ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
          />
          <select
            value={(draft.category as string) || 'productivity'}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as PluginCategory })}
            className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText}`}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].label}</option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setIsCreating(false); setDraft({}) }}
              className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.ghost} ${th.btn.ghostHover}`}
            >
              取消
            </button>
            <button onClick={handleCreate} className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}>
              <Check className="w-3.5 h-3.5 inline mr-1" />安装
            </button>
          </div>
        </ItemCard>
      )}

      {/* Plugin list */}
      {filtered.length === 0 ? (
        <EmptyState icon={Puzzle} message="未找到匹配的插件" t={th} />
      ) : (
        <div className="space-y-2">
          {filtered.map(plugin => {
            const catCfg = CATEGORY_CONFIG[plugin.category]
            const CatIcon = catCfg.icon
            const isExpanded = expandedId === plugin.id

            return (
              <ItemCard key={plugin.id} t={th}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${plugin.color} flex items-center justify-center flex-shrink-0 border border-white/[0.06]`}>
                    <CatIcon className={`w-5 h-5 ${catCfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[0.85rem] ${th.text.primary}`}>{plugin.name}</span>
                      <span className={`text-[0.58rem] ${th.text.caption}`}>v{plugin.version}</span>
                      {plugin.isBuiltIn && (
                        <span className={`text-[0.55rem] px-1.5 py-0.5 rounded ${th.status.infoBg}`}>内置</span>
                      )}
                      <span className={`text-[0.55rem] px-1.5 py-0.5 rounded bg-white/[0.04] ${catCfg.color}`}>
                        {catCfg.label}
                      </span>
                    </div>
                    <p className={`text-[0.72rem] ${th.text.caption} truncate mt-0.5`}>{plugin.description}</p>
                    <div className={`flex items-center gap-3 mt-1 text-[0.65rem] ${th.text.muted}`}>
                      <span>{plugin.author}</span>
                      <span>更新于 {plugin.lastUpdated}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {plugin.configurable && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : plugin.id)}
                        className={`p-1.5 rounded-lg ${th.hoverBg}`}
                        title="配置"
                      >
                        <Settings className={`w-3.5 h-3.5 ${th.text.caption}`} />
                      </button>
                    )}
                    <Toggle
                      checked={plugin.enabled}
                      onChange={() => handleToggle(plugin.id)}
                      t={th}
                    />
                    {!plugin.isBuiltIn && (
                      <button
                        onClick={() => handleRemove(plugin.id)}
                        className={`p-1.5 rounded-lg ${th.hoverBg}`}
                        title="卸载"
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${th.status.error}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded config */}
                {isExpanded && (
                  <div className={`mt-3 pt-3 border-t border-current/5 space-y-3`}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className={`text-[0.68rem] ${th.text.caption} block mb-1`}>版本</span>
                        <span className={`text-[0.78rem] ${th.text.secondary}`}>v{plugin.version}</span>
                      </div>
                      <div>
                        <span className={`text-[0.68rem] ${th.text.caption} block mb-1`}>作者</span>
                        <span className={`text-[0.78rem] ${th.text.secondary}`}>{plugin.author}</span>
                      </div>
                      <div>
                        <span className={`text-[0.68rem] ${th.text.caption} block mb-1`}>安装日期</span>
                        <span className={`text-[0.78rem] ${th.text.secondary}`}>{plugin.installedAt}</span>
                      </div>
                      <div>
                        <span className={`text-[0.68rem] ${th.text.caption} block mb-1`}>最后更新</span>
                        <span className={`text-[0.78rem] ${th.text.secondary}`}>{plugin.lastUpdated}</span>
                      </div>
                    </div>
                    {plugin.repository && (
                      <a
                        href={plugin.repository}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 text-[0.72rem] ${th.text.accent} hover:underline`}
                      >
                        <ExternalLink className="w-3 h-3" /> 源码仓库
                      </a>
                    )}
                    {plugin.dependencies && plugin.dependencies.length > 0 && (
                      <div>
                        <span className={`text-[0.68rem] ${th.text.caption} block mb-1`}>依赖</span>
                        <div className="flex flex-wrap gap-1">
                          {plugin.dependencies.map(dep => (
                            <span key={dep} className={`text-[0.62rem] px-1.5 py-0.5 rounded ${th.badgeBg} ${th.text.tertiary}`}>
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ItemCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
