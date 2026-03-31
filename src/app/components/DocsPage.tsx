/**
 * @file DocsPage.tsx
 * @description 文档中心页面，提供 API 文档、教程指南、组件文档、
 *              搜索过滤等功能。已完成 isCyber → useThemeTokens 迁移
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-06
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags docs,documentation,tutorials,api-reference,token-migrated
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Search,
  BookOpen,
  Code2,
  Layers,
  Cpu,
  Paintbrush,
  Plug,
  Rocket,
  ChevronRight,
  ExternalLink,
  FileText,
  Terminal,
  GitBranch,
} from "lucide-react";
import { motion } from "motion/react";
import { useThemeTokens } from "./ide/hooks/useThemeTokens";
import ThemeSwitcher from "./ide/ThemeSwitcher";

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  articles: DocArticle[];
}

interface DocArticle {
  id: string;
  title: string;
  description: string;
  readTime: string;
  tags: string[];
  isNew?: boolean;
}

const DOC_SECTIONS: DocSection[] = [
  {
    id: "getting-started",
    title: "快速入门",
    icon: Rocket,
    articles: [
      {
        id: "gs1",
        title: "环境搭建与首次运行",
        description: "从零开始配置开发环境，运行你的第一个 YYC³ 项目",
        readTime: "5 min",
        tags: ["入门", "环境"],
      },
      {
        id: "gs2",
        title: "项目结构概览",
        description: "了解项目目录结构、核心文件及配置文件的作用",
        readTime: "3 min",
        tags: ["入门", "架构"],
      },
      {
        id: "gs3",
        title: "创建第一个面板应用",
        description: "使用多联式布局创建一个简单的仪表板应用",
        readTime: "8 min",
        tags: ["入门", "教程"],
        isNew: true,
      },
    ],
  },
  {
    id: "core-concepts",
    title: "核心概念",
    icon: Cpu,
    articles: [
      {
        id: "cc1",
        title: "多联式布局系统",
        description: "面板拖拽、合并、拆分的实现原理与使用方法",
        readTime: "10 min",
        tags: ["布局", "面板"],
      },
      {
        id: "cc2",
        title: "Design JSON 规范",
        description: "设计数据模型的定义、格式规范与版本管理",
        readTime: "12 min",
        tags: ["数据模型", "JSON"],
      },
      {
        id: "cc3",
        title: "状态管理架构",
        description: "全局状态、组件状态、服务端状态的管理策略",
        readTime: "8 min",
        tags: ["状态", "Zustand"],
      },
      {
        id: "cc4",
        title: "AI 模型集成",
        description: "接入 OpenAI、Ollama、智谱等 LLM Provider 的完整指南",
        readTime: "15 min",
        tags: ["AI", "LLM"],
        isNew: true,
      },
    ],
  },
  {
    id: "components",
    title: "组件系统",
    icon: Layers,
    articles: [
      {
        id: "cp1",
        title: "基础组件库",
        description: "Button、Input、Card 等基础组件的 API 参考与使用示例",
        readTime: "6 min",
        tags: ["组件", "UI"],
      },
      {
        id: "cp2",
        title: "面板组件",
        description: "左栏、中栏、右栏面板的自定义与扩展",
        readTime: "10 min",
        tags: ["面板", "布局"],
      },
      {
        id: "cp3",
        title: "Monaco Editor 集成",
        description: "代码编辑器的配置、主题定制与语言支持",
        readTime: "12 min",
        tags: ["编辑器", "Monaco"],
      },
      {
        id: "cp4",
        title: "终端组件",
        description: "集成终端的实现、命令处理与历史管理",
        readTime: "8 min",
        tags: ["终端", "Shell"],
      },
    ],
  },
  {
    id: "styling",
    title: "主题与样式",
    icon: Paintbrush,
    articles: [
      {
        id: "st1",
        title: "主题系统架构",
        description: "CSS 变量系统、深海军蓝与赛博朋克主题的切换机制",
        readTime: "7 min",
        tags: ["主题", "CSS"],
      },
      {
        id: "st2",
        title: "自定义主题创建",
        description: "创建和注册自定义主题的完整流程",
        readTime: "10 min",
        tags: ["主题", "自定义"],
      },
      {
        id: "st3",
        title: "Tailwind CSS 实践",
        description: "项目中 Tailwind v4 的配置与最佳实践",
        readTime: "6 min",
        tags: ["Tailwind", "样式"],
      },
    ],
  },
  {
    id: "api",
    title: "API 参考",
    icon: Code2,
    articles: [
      {
        id: "ap1",
        title: "LLMService API",
        description: "流式调用、模型切换、AbortController 的完整 API 文档",
        readTime: "15 min",
        tags: ["API", "LLM"],
      },
      {
        id: "ap2",
        title: "FileStore API",
        description: "文件树操作、虚拟文件系统的接口说明",
        readTime: "8 min",
        tags: ["API", "文件"],
      },
      {
        id: "ap3",
        title: "ModelRegistry API",
        description: "模型注册、Provider 管理、API Key 存储的接口说明",
        readTime: "10 min",
        tags: ["API", "模型"],
      },
    ],
  },
  {
    id: "advanced",
    title: "进阶指南",
    icon: Plug,
    articles: [
      {
        id: "ad1",
        title: "插件开发指南",
        description: "编写面板插件，扩展 IDE 功能",
        readTime: "20 min",
        tags: ["插件", "扩展"],
        isNew: true,
      },
      {
        id: "ad2",
        title: "实时协同原理",
        description: "CRDT、OT 算法与 WebSocket 同步机制",
        readTime: "18 min",
        tags: ["协同", "CRDT"],
      },
      {
        id: "ad3",
        title: "性能优化指南",
        description: "虚拟滚动、懒加载、缓存策略的实战技巧",
        readTime: "12 min",
        tags: ["性能", "优化"],
      },
    ],
  },
];

export default function DocsPage() {
  const navigate = useNavigate();
  const t = useThemeTokens();
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const allArticles = useMemo(() => {
    return DOC_SECTIONS.flatMap((s) =>
      s.articles.map((a) => ({ ...a, section: s.title, sectionId: s.id })),
    );
  }, []);

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [search, allArticles]);

  return (
    <div className={`size-full min-h-screen ${t.page.pageBg}`}>
      {/* Top bar */}
      <div
        className={`sticky top-0 z-30 border-b backdrop-blur-md ${t.templates.topBarBg}`}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 text-[0.82rem] transition-colors ${t.templates.backBtn}`}
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
          <div className={`h-5 w-px ${t.templates.divider}`} />
          <BookOpen className={`w-4 h-4 ${t.text.accent}`} />
          <h1 className={`text-[0.95rem] ${t.templates.titleText}`}>
            文档中心
          </h1>
          <div className="flex-1" />
          <ThemeSwitcher compact />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className={`text-[1.5rem] mb-2 ${t.text.heading}`}>
            YYC³ Family AI 开发文档
          </h2>
          <p className={`text-[0.85rem] ${t.text.muted}`}>
            从入门到进阶，全面了解智能编程助手的能力与 API
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-10">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${t.templates.searchBg}`}
          >
            <Search className={`w-4 h-4 ${t.templates.searchIcon}`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文档..."
              className={`flex-1 bg-transparent border-0 outline-none text-[0.88rem] ${t.templates.searchInput}`}
            />
          </div>
        </div>

        {/* Search results */}
        {filteredArticles && (
          <div className="mb-10">
            <div className={`text-[0.75rem] mb-3 ${t.templates.countText}`}>
              找到 {filteredArticles.length} 篇相关文档
            </div>
            <div className="space-y-2">
              {filteredArticles.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${t.templates.listCardBg} ${t.interactive.hoverBgStrong}`}
                >
                  <FileText
                    className={`w-5 h-5 flex-shrink-0 ${t.text.muted}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[0.85rem] ${t.text.heading}`}>
                        {a.title}
                      </span>
                      {a.isNew && (
                        <span
                          className={`text-[0.58rem] px-1.5 py-0.5 rounded-full ${t.home.designerBadge}`}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                    <p className={`text-[0.72rem] truncate ${t.text.muted}`}>
                      {a.description}
                    </p>
                  </div>
                  <span
                    className={`text-[0.68rem] flex-shrink-0 ${t.text.caption}`}
                  >
                    {a.readTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sections grid */}
        {!filteredArticles && (
          <div className="space-y-8">
            {DOC_SECTIONS.map((section, si) => {
              const SectionIcon = section.icon;
              const isExpanded = activeSection === section.id;
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: si * 0.05 }}
                >
                  <button
                    onClick={() =>
                      setActiveSection(isExpanded ? null : section.id)
                    }
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      isExpanded
                        ? `${t.templates.catActive  } ${  t.page.cardBorder}`
                        : `${t.templates.listCardBg
                          } ${
                          t.interactive.hoverBgStrong}`
                    }`}
                  >
                    <SectionIcon
                      className={`w-5 h-5 ${
                        isExpanded ? t.text.accent : t.text.muted
                      }`}
                    />
                    <span
                      className={`text-[0.9rem] flex-1 text-left ${t.text.label}`}
                    >
                      {section.title}
                    </span>
                    <span className={`text-[0.72rem] ${t.text.caption}`}>
                      {section.articles.length} 篇
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""} ${t.text.caption}`}
                    />
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 space-y-1 pl-4"
                    >
                      {section.articles.map((a) => (
                        <div
                          key={a.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${t.interactive.hoverBg}`}
                        >
                          <FileText
                            className={`w-4 h-4 flex-shrink-0 ${t.text.caption}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[0.82rem] ${t.text.label}`}
                              >
                                {a.title}
                              </span>
                              {a.isNew && (
                                <span
                                  className={`text-[0.55rem] px-1.5 py-0.5 rounded-full ${t.home.designerBadge}`}
                                >
                                  NEW
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[0.7rem] truncate ${t.text.caption}`}
                            >
                              {a.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {a.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className={`text-[0.6rem] px-1.5 py-0.5 rounded ${t.templates.tagBg}`}
                              >
                                {tag}
                              </span>
                            ))}
                            <span className={`text-[0.65rem] ${t.text.dim}`}>
                              {a.readTime}
                            </span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Quick links */}
        <div
          className={`mt-12 p-6 rounded-xl border ${t.templates.listCardBg}`}
        >
          <h3 className={`text-[0.88rem] mb-4 ${t.text.secondary}`}>
            外部资源
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "GitHub 仓库", url: "#", icon: GitBranch },
              { label: "API Playground", url: "#", icon: Terminal },
              { label: "社区论坛", url: "#", icon: ExternalLink },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${t.templates.listCardBg} ${t.interactive.hoverBg}`}
              >
                <link.icon className="w-4 h-4" />
                <span className="text-[0.8rem]">{link.label}</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
