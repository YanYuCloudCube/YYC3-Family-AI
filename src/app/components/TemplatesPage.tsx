/**
 * @file TemplatesPage.tsx
 * @description 项目模板市场页面，支持搜索、分类筛选、模板预览、
 *              快速创建项目。已完成 isCyber → useThemeTokens 迁移
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-06
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags templates,marketplace,projects,creation,token-migrated
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Search,
  LayoutGrid,
  List,
  Layers,
  Zap,
  ShoppingCart,
  BarChart3,
  FileText,
  Users,
  MessageSquare,
  Calendar,
  Star,
  Download,
  Eye,
  Filter,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";
import { useThemeTokens } from "./ide/hooks/useThemeTokens";
import ThemeSwitcher from "./ide/ThemeSwitcher";

// ── Template data ──
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  stars: number;
  downloads: number;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
  panels: number;
  techStack: string[];
}

const CATEGORIES = [
  { id: "all", label: "全部模板", count: 12 },
  { id: "dashboard", label: "仪表板", count: 3 },
  { id: "ecommerce", label: "电商应用", count: 2 },
  { id: "management", label: "管理系统", count: 3 },
  { id: "data", label: "数据可视化", count: 2 },
  { id: "social", label: "社交/内容", count: 2 },
];

const TEMPLATES: Template[] = [
  {
    id: "t1",
    name: "企业管理仪表板",
    description:
      "综合性企业管理面板，包含数据概览、用户管理、订单跟踪、数据分析等模块",
    category: "dashboard",
    tags: ["React", "Recharts", "Tailwind"],
    stars: 328,
    downloads: 1240,
    gradient: "from-violet-500 to-indigo-600",
    icon: BarChart3,
    panels: 6,
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "Recharts"],
  },
  {
    id: "t2",
    name: "电商管理后台",
    description:
      "完整的电商后台管理系统，涵盖商品管理、订单处理、库存预警、营销活动",
    category: "ecommerce",
    tags: ["React", "Ant Design", "API"],
    stars: 256,
    downloads: 980,
    gradient: "from-emerald-500 to-teal-600",
    icon: ShoppingCart,
    panels: 8,
    techStack: ["React 18", "TypeScript", "Ant Design", "REST API"],
  },
  {
    id: "t3",
    name: "数据分析平台",
    description:
      "专业数据分析与可视化平台，支持多维度数据探索、实时监控、报表生成",
    category: "data",
    tags: ["D3.js", "WebSocket", "Canvas"],
    stars: 189,
    downloads: 720,
    gradient: "from-blue-500 to-cyan-600",
    icon: BarChart3,
    panels: 5,
    techStack: ["React 18", "D3.js", "WebSocket", "Canvas API"],
  },
  {
    id: "t4",
    name: "CRM 客户关系管理",
    description: "客户关系管理系统，含客户档案、跟进记录、销售漏斗、合同管理",
    category: "management",
    tags: ["React", "Form", "Charts"],
    stars: 167,
    downloads: 650,
    gradient: "from-orange-500 to-amber-600",
    icon: Users,
    panels: 7,
    techStack: ["React 18", "React Hook Form", "Zod", "Recharts"],
  },
  {
    id: "t5",
    name: "内容管理系统",
    description:
      "功能完善的 CMS，支持富文本编辑、媒体库管理、SEO 优化、多语言发布",
    category: "social",
    tags: ["Markdown", "i18n", "SEO"],
    stars: 142,
    downloads: 530,
    gradient: "from-rose-500 to-pink-600",
    icon: FileText,
    panels: 4,
    techStack: ["React 18", "MDX", "i18n", "TipTap Editor"],
  },
  {
    id: "t6",
    name: "项目管理看板",
    description:
      "类 Trello 项目看板，支持拖拽排序、多视图切换（看板/列表/甘特图）、团队协作",
    category: "management",
    tags: ["DnD", "Kanban", "Gantt"],
    stars: 213,
    downloads: 890,
    gradient: "from-sky-500 to-blue-600",
    icon: Layers,
    panels: 3,
    techStack: ["React 18", "react-dnd", "date-fns", "Zustand"],
  },
  {
    id: "t7",
    name: "实时监控大屏",
    description:
      "运维监控大屏，支持服务器状态、网络流量、异常告警、地理分布实时展示",
    category: "data",
    tags: ["WebSocket", "Canvas", "Map"],
    stars: 178,
    downloads: 610,
    gradient: "from-purple-500 to-violet-600",
    icon: Zap,
    panels: 6,
    techStack: ["React 18", "WebSocket", "ECharts", "Leaflet"],
  },
  {
    id: "t8",
    name: "在线客服系统",
    description:
      "实时在线客服平台，支持多渠道接入、智能机器人、会话分配、满意度评价",
    category: "social",
    tags: ["WebSocket", "AI", "Chat"],
    stars: 134,
    downloads: 480,
    gradient: "from-amber-500 to-yellow-600",
    icon: MessageSquare,
    panels: 4,
    techStack: ["React 18", "WebSocket", "OpenAI API", "Redis"],
  },
  {
    id: "t9",
    name: "HR 人力资源管理",
    description:
      "企业人力资源管理系统，涵盖员工档案、考勤管理、薪资计算、绩效评估",
    category: "management",
    tags: ["Form", "Charts", "Calendar"],
    stars: 98,
    downloads: 370,
    gradient: "from-teal-500 to-emerald-600",
    icon: Users,
    panels: 5,
    techStack: ["React 18", "React Hook Form", "FullCalendar", "Recharts"],
  },
  {
    id: "t10",
    name: "SaaS 运营分析",
    description:
      "SaaS 产品运营指标仪表板，MRR/ARR 追踪、用户留存、漏斗分析、A/B 测试",
    category: "dashboard",
    tags: ["Analytics", "Charts", "API"],
    stars: 156,
    downloads: 520,
    gradient: "from-indigo-500 to-purple-600",
    icon: BarChart3,
    panels: 4,
    techStack: ["React 18", "Recharts", "Mixpanel SDK", "Zustand"],
  },
  {
    id: "t11",
    name: "IoT 设备管理",
    description:
      "物联网设备管理平台，设备注册、固件升级、实时数据采集、告警规则配置",
    category: "dashboard",
    tags: ["MQTT", "WebSocket", "Map"],
    stars: 87,
    downloads: 290,
    gradient: "from-cyan-500 to-sky-600",
    icon: Zap,
    panels: 5,
    techStack: ["React 18", "MQTT.js", "WebSocket", "Leaflet"],
  },
  {
    id: "t12",
    name: "日程协作平台",
    description:
      "团队日程协作工具，支持多日历视图、会议预约、日程共享、提醒通知",
    category: "ecommerce",
    tags: ["Calendar", "i18n", "PWA"],
    stars: 112,
    downloads: 410,
    gradient: "from-pink-500 to-rose-600",
    icon: Calendar,
    panels: 3,
    techStack: ["React 18", "FullCalendar", "PWA", "IndexedDB"],
  },
];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const t = useThemeTokens();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    let list = TEMPLATES;
    if (activeCategory !== "all") {
      list = list.filter((tpl) => tpl.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (tpl) =>
          tpl.name.toLowerCase().includes(q) ||
          tpl.description.toLowerCase().includes(q) ||
          tpl.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [search, activeCategory]);

  const handleUseTemplate = (template: Template) => {
    navigate("/ide/new", {
      state: { template: template.id, templateName: template.name },
    });
  };

  return (
    <div className={`size-full min-h-screen ${t.templates.pageBg}`}>
      {/* Top bar */}
      <div
        className={`sticky top-0 z-30 border-b backdrop-blur-md ${t.templates.topBarBg}`}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 text-[0.82rem] transition-colors ${t.templates.backBtn}`}
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
          <div className={`h-5 w-px ${t.templates.divider}`} />
          <h1 className={`text-[0.95rem] ${t.templates.titleText}`}>
            模板中心
          </h1>
          <div className="flex-1" />
          <ThemeSwitcher compact />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Search & Filter bar */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${t.templates.searchBg}`}
          >
            <Search className={`w-4 h-4 ${t.templates.searchIcon}`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索模板名称、标签..."
              className={`flex-1 bg-transparent border-0 outline-none text-[0.85rem] ${t.templates.searchInput}`}
            />
          </div>
          <div className="flex items-center gap-1">
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === mode
                    ? t.templates.viewBtnActive
                    : t.templates.viewBtnInactive
                }`}
              >
                {mode === "grid" ? (
                  <LayoutGrid className="w-4 h-4" />
                ) : (
                  <List className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Categories sidebar */}
          <div className="w-48 flex-shrink-0">
            <div
              className={`text-[0.7rem] uppercase tracking-wider mb-3 ${t.templates.filterLabel}`}
            >
              <Filter className="w-3 h-3 inline mr-1" />
              分类筛选
            </div>
            <nav className="space-y-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[0.82rem] transition-colors ${
                    activeCategory === cat.id
                      ? t.templates.catActive
                      : t.templates.catInactive
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[0.7rem] ${t.templates.catCount}`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Templates grid */}
          <div className="flex-1">
            <div className={`text-[0.75rem] mb-4 ${t.templates.countText}`}>
              共 {filtered.length} 个模板
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((tpl, i) => (
                  <motion.div
                    key={tpl.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`group rounded-xl overflow-hidden border cursor-pointer transition-all hover:-translate-y-1 ${t.templates.cardBg}`}
                    onClick={() => handleUseTemplate(tpl)}
                  >
                    <div
                      className={`h-28 bg-gradient-to-br ${tpl.gradient} flex items-center justify-center relative`}
                    >
                      <tpl.icon className="w-10 h-10 text-white/50" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-[0.78rem] flex items-center gap-1">
                          <Eye className="w-4 h-4" /> 预览
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3
                        className={`text-[0.85rem] mb-1 ${t.templates.cardTitle}`}
                      >
                        {tpl.name}
                      </h3>
                      <p
                        className={`text-[0.72rem] mb-3 line-clamp-2 ${t.templates.cardDesc}`}
                      >
                        {tpl.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tpl.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-[0.62rem] px-1.5 py-0.5 rounded ${t.templates.tagBg}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex items-center gap-1 text-[0.68rem] ${t.templates.starColor}`}
                        >
                          <Star className="w-3 h-3" /> {tpl.stars}
                        </span>
                        <span
                          className={`flex items-center gap-1 text-[0.68rem] ${t.templates.metaText}`}
                        >
                          <Download className="w-3 h-3" /> {tpl.downloads}
                        </span>
                        <span
                          className={`text-[0.65rem] ml-auto ${t.templates.metaText}`}
                        >
                          {tpl.panels} 面板
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((tpl, i) => (
                  <motion.div
                    key={tpl.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${t.templates.listCardBg}`}
                    onClick={() => handleUseTemplate(tpl)}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tpl.gradient} flex items-center justify-center flex-shrink-0`}
                    >
                      <tpl.icon className="w-6 h-6 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[0.85rem] ${t.templates.cardTitle}`}>
                        {tpl.name}
                      </h3>
                      <p
                        className={`text-[0.72rem] truncate ${t.templates.cardDesc}`}
                      >
                        {tpl.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span
                        className={`flex items-center gap-1 text-[0.68rem] ${t.templates.starColor}`}
                      >
                        <Star className="w-3 h-3" /> {tpl.stars}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 ${t.templates.metaText}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Search className={`w-10 h-10 mb-3 ${t.templates.emptyIcon}`} />
                <p className={`text-[0.85rem] ${t.templates.emptyText}`}>
                  没有找到匹配的模板
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
