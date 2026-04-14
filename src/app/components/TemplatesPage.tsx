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
} from "lucide-react";
import { motion } from "motion/react";
import { useThemeTokens } from "./ide/hooks/useThemeTokens";
import ThemeSwitcher from "./ide/ThemeSwitcher";
import TemplatePreviewModal, {
  type TemplateWithPreview,
} from "./TemplatePreviewModal";
import { APP_TEMPLATES } from "./AppTemplates";

const CATEGORIES = [
  { id: "all", label: "全部模板", count: 20 },
  { id: "dashboard", label: "仪表板", count: 4 },
  { id: "ecommerce", label: "电商应用", count: 2 },
  { id: "management", label: "管理系统", count: 3 },
  { id: "data", label: "数据可视化", count: 2 },
  { id: "social", label: "社交/内容", count: 2 },
  { id: "utility", label: "实用工具", count: 3 },
  { id: "productivity", label: "效率工具", count: 3 },
  { id: "widget", label: "小组件", count: 1 },
];

const TEMPLATES: TemplateWithPreview[] = [
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
    difficulty: "beginner",
    estimatedTime: "10分钟",
    features: [
      "响应式 KPI 数据卡片（收入/用户/订单/转化率）",
      "Recharts 图表：折线图 + 饼图 + 柱状图",
      "用户管理表格（搜索/排序/分页）",
      "实时通知系统 + 最近活动时间线",
      "暗色/亮色主题切换",
      "侧边导航栏 + 面包屑",
    ],
    previewCode: {
      react: `export default function Dashboard() {
  const stats = [
    { label: "总收入", value: "¥128,430", change: "+12.5%", up: true },
    { label: "活跃用户", value: "8,420", change: "+5.2%", up: true },
    { label: "订单数", value: "1,284", change: "-2.1%", up: false },
    { label: "转化率", value: "3.24%", change: "+0.8%", up: true },
  ];
  return (
    <div style={{ padding: 24, background: "#0f172a", color: "#e2e8f0", fontFamily: "system-ui", minHeight: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#1e293b", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, margin: "8px 0" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: s.up ? "#34d399" : "#f87171" }}>{s.change}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>收入趋势</div>
          <svg viewBox="0 0 400 120" style={{ width: "100%" }}>
            <polyline points="0,100 50,80 100,90 150,50 200,60 250,30 300,45 350,20 400,35"
              fill="none" stroke="#818cf8" strokeWidth="2.5"/>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
            </linearGradient></defs>
            <polygon points="0,100 50,80 100,90 150,50 200,60 250,30 300,45 350,20 400,35 400,120 0,120"
              fill="url(#g1)"/>
          </svg>
        </div>
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>流量来源</div>
          {[
            { name: "直接访问", pct: 42, color: "#818cf8" },
            { name: "搜索引擎", pct: 28, color: "#34d399" },
            { name: "社交媒体", pct: 18, color: "#fbbf24" },
            { name: "其他", pct: 12, color: "#f87171" },
          ].map(item => (
            <div key={item.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span>{item.name}</span><span>{item.pct}%</span>
              </div>
              <div style={{ height: 6, background: "#334155", borderRadius: 3 }}>
                <div style={{ width: item.pct + "%", height: "100%", background: item.color, borderRadius: 3 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
      dependencies: {},
    },
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
    difficulty: "intermediate",
    estimatedTime: "15分钟",
    features: [
      "商品 CRUD + SKU 变体管理",
      "订单全流程状态跟踪",
      "库存阈值自动告警",
      "优惠券 / 促销活动配置",
      "销售数据可视化报表",
      "多角色权限控制 (RBAC)",
    ],
    previewCode: {
      react: `export default function EcommerceAdmin() {
  const products = [
    { name: "无线蓝牙耳机 Pro", price: 299, stock: 234, status: "在售", sales: 1892 },
    { name: "机械键盘 RGB", price: 459, stock: 56, status: "在售", sales: 756 },
    { name: "智能手表 S7", price: 1299, stock: 12, status: "低库存", sales: 3421 },
    { name: "便携充电宝 20000mAh", price: 159, stock: 0, status: "缺货", sales: 5621 },
  ];
  return (
    <div style={{ padding: 24, background: "#0c1222", color: "#e2e8f0", fontFamily: "system-ui", minHeight: "100%" }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[
          { label: "今日销售额", value: "¥43,280", icon: "💰" },
          { label: "今日订单", value: "186", icon: "📦" },
          { label: "待发货", value: "23", icon: "🚚" },
          { label: "退款处理", value: "5", icon: "↩️" },
        ].map(card => (
          <div key={card.label} style={{ flex: 1, background: "#162032", borderRadius: 12, padding: 20, borderLeft: "3px solid #10b981" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{card.icon} {card.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{card.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#162032", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e3a5f", fontWeight: 600 }}>商品列表</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#0f172a", color: "#94a3b8" }}>
              {["商品名称","价格","库存","状态","销量"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.name} style={{ borderTop: "1px solid #1e3a5f" }}>
                <td style={{ padding: "10px 16px" }}>{p.name}</td>
                <td style={{ padding: "10px 16px" }}>¥{p.price}</td>
                <td style={{ padding: "10px 16px", color: p.stock < 20 ? "#fbbf24" : p.stock === 0 ? "#f87171" : "#e2e8f0" }}>{p.stock}</td>
                <td style={{ padding: "10px 16px" }}><span style={{
                  padding: "2px 10px", borderRadius: 10, fontSize: 11,
                  background: p.status === "在售" ? "#065f46" : p.status === "低库存" ? "#854d0e" : "#7f1d1d",
                  color: p.status === "在售" ? "#34d399" : p.status === "低库存" ? "#fbbf24" : "#f87171"
                }}>{p.status}</span></td>
                <td style={{ padding: "10px 16px" }}>{p.sales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
      dependencies: {},
    },
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
    difficulty: "advanced",
    estimatedTime: "25分钟",
    features: [
      "D3.js 交互式图表（力导向图/树图/桑基图）",
      "WebSocket 实时数据流接入",
      "Canvas 高性能大数据渲染",
      "多维数据透视表",
      "自定义 SQL 查询编辑器",
      "报表导出 PDF/Excel",
    ],
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
    difficulty: "intermediate",
    estimatedTime: "12分钟",
    features: [
      "360° 客户全景视图",
      "跟进记录时间线",
      "销售漏斗可视化",
      "合同到期提醒",
      "公海池分配机制",
      "客户标签与分组",
    ],
    previewCode: {
      react: `export default function CRM() {
  const pipeline = [
    { stage: "线索", count: 48, value: "¥0", color: "#94a3b8" },
    { stage: "初步接触", count: 32, value: "¥320K", color: "#60a5fa" },
    { stage: "需求确认", count: 19, value: "¥570K", color: "#a78bfa" },
    { stage: "方案报价", count: 11, value: "¥880K", color: "#fbbf24" },
    { stage: "成交签约", count: 7, value: "¥1.2M", color: "#34d399" },
  ];
  return (
    <div style={{ padding: 24, background: "#1a1410", color: "#e2e8f0", fontFamily: "system-ui", minHeight: "100%" }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>销售漏斗</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 260, padding: "0 40px" }}>
        {pipeline.map((stage, i) => (
          <div key={stage.stage} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            transition: "all 0.3s"
          }}>
            <div style={{
              width: \`\${100 - i * 14}%\`, height: \`\${(stage.count / 48) * 200}px\`,
              background: \`linear-gradient(180deg, \${stage.color}40, \${stage.color}10)\`,
              borderRadius: "8px 8px 4px 4px", border: \`1px solid \${stage.color}30\`,
              display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
              cursor: "pointer"
            }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{stage.count}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{stage.value}</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 500, textAlign: "center" }}>{stage.stage}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { title: "本月新客户", value: "+23", sub: "较上月 +18%" },
          { title: "跟进中", value: "41", sub: "12 个即将超时" },
          { title: "本月成单", value: "¥2.1M", sub: "完成率 87%" },
        ].map(card => (
          <div key={card.title} style={{ background: "#1c1510", borderRadius: 12, padding: 20, border: "1px solid rgba(251,191,36,0.15)" }}>
            <div style={{ fontSize: 12, color: "#92400e" }}>{card.title}</div>
            <div style={{ fontSize: 24, fontWeight: 700, margin: "4px 0" }}>{card.value}</div>
            <div style={{ fontSize: 11, color: "#78716c" }}>{card.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}`,
      dependencies: {},
    },
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
    difficulty: "intermediate",
    estimatedTime: "15分钟",
    features: [
      "TipTap 富文本编辑器",
      "Markdown / MDX 双模式写作",
      "图片上传 + 媒体库管理",
      "SEO 元信息配置面板",
      "i18n 多语言发布",
      "版本历史 + 草稿自动保存",
    ],
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
    difficulty: "beginner",
    estimatedTime: "8分钟",
    features: [
      "拖拽式看板列（待办/进行中/已完成）",
      "任务卡片（标签/截止日期/成员）",
      "看板 / 列表 / 甘特图三视图切换",
      "任务评论 + @提及",
      "看板筛选与搜索",
      "Zustand 状态管理",
    ],
    previewCode: {
      react: `export default function KanbanBoard() {
  const columns = [
    { title: "待办", color: "#64748b", tasks: [
      { id: 1, title: "设计登录页面原型", tag: "设计", avatar: "🎨" },
      { id: 2, title: "编写 API 文档", tag: "文档", avatar: "📝" },
      { id: 3, title: "数据库 Schema 设计", tag: "后端", avatar: "🗄️" },
    ]},
    { title: "进行中", color: "#3b82f6", tasks: [
      { id: 4, title: "实现用户认证模块", tag: "开发", avatar: "⚙️" },
      { id: 5, title: "首页响应式布局", tag: "前端", avatar: "💻" },
    ]},
    { title: "已完成", color: "#22c55e", tasks: [
      { id: 6, title: "项目初始化 + CI/CD", tag: "DevOps", avatar: "✅" },
      { id: 7, title: "组件库搭建", tag: "基础", avatar: "🧱" },
    ]},
  ];
  return (
    <div style={{ padding: 24, background: "#0f172a", color: "#e2e8f0", fontFamily: "system-ui", minHeight: "100%" }}>
      <div style={{ display: "flex", gap: 16 }}>
        {columns.map(col => (
          <div key={col.title} style={{
            flex: 1, background: "#1e293b", borderRadius: 12, padding: 16,
            minWidth: 260, border: "1px solid #334155"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{col.title}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>{col.tasks.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {col.tasks.map(task => (
                <div key={task.id} style={{
                  background: "#0f172a", borderRadius: 8, padding: 14,
                  border: "1px solid #334155", cursor: "grab",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span>{task.avatar}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</span>
                  </div>
                  <span style={{
                    display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    background: \`\${col.color}20\`, color: col.color
                  }}>{task.tag}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,
      dependencies: {},
    },
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
    difficulty: "advanced",
    estimatedTime: "20分钟",
    features: [
      "服务器 CPU/内存/磁盘实时曲线",
      "网络流量带宽监控",
      "异常告警规则引擎",
      "Leaflet 地理分布热力图",
      "ECharts 大屏可视化",
      "WebSocket 实时推送",
    ],
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
    difficulty: "advanced",
    estimatedTime: "22分钟",
    features: [
      "多渠道接入（网页/微信/APP）",
      "AI 智能机器人自动应答",
      "技能组会话路由分配",
      "满意度评价 + 标签归档",
      "快捷回复模板库",
      "客服绩效统计面板",
    ],
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
    difficulty: "intermediate",
    estimatedTime: "14分钟",
    features: [
      "员工电子档案管理",
      "考勤打卡 + 排班日历",
      "薪资自动计算引擎",
      "360° 绩效评估",
      "招聘流程追踪",
      "组织架构树形展示",
    ],
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
    difficulty: "intermediate",
    estimatedTime: "12分钟",
    features: [
      "MRR / ARR / Churn 实时追踪",
      "用户留存 cohort 分析",
      "注册→付费转化漏斗",
      "A/B 测试结果对比",
      "Feature Usage 热力图",
      "LTV / CAC 计算",
    ],
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
    difficulty: "advanced",
    estimatedTime: "25分钟",
    features: [
      "设备注册 / 注销 / 分组",
      "MQTT 协议通信",
      "OTA 固件远程升级",
      "实时传感器数据流",
      "设备地图定位",
      "告警规则 + 推送通知",
    ],
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
    difficulty: "beginner",
    estimatedTime: "8分钟",
    features: [
      "月/周/日/日程列表视图",
      "会议室预约冲突检测",
      "日程共享 + 权限控制",
      "邮件 / 微信提醒通知",
      "PWA 离线可用",
      "时区自动转换",
    ],
  },
];

const ALL_TEMPLATES: TemplateWithPreview[] = [...TEMPLATES, ...APP_TEMPLATES];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const t = useThemeTokens();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithPreview | null>(null);

  const filtered = useMemo(() => {
    let list = ALL_TEMPLATES;
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

  const handlePreview = (template: TemplateWithPreview) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = (template: TemplateWithPreview) => {
    navigate("/ide/new", {
      state: { template: template.id, templateName: template.name },
    });
  };

  return (
    <div className={`h-screen flex flex-col ${t.templates.pageBg}`}>
      {/* Top bar */}
      <div
        className={`sticky top-0 z-30 border-b backdrop-blur-md flex-shrink-0 ${t.templates.topBarBg}`}
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

      <div className="max-w-6xl mx-auto px-6 py-6 flex-1 min-h-0 overflow-y-auto">
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
                    onClick={() => handlePreview(tpl)}
                  >
                    <div
                      className={`h-28 bg-gradient-to-br ${tpl.gradient} flex items-center justify-center relative`}
                    >
                      <tpl.icon className="w-10 h-10 text-white/50" />
                      {tpl.previewCode && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[0.6rem] bg-black/40 text-white/80 backdrop-blur-sm">
                          LIVE
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-[0.78rem] flex items-center gap-1 font-medium">
                          <Eye className="w-4 h-4" /> 预览
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`text-[0.85rem] truncate ${t.templates.cardTitle}`}
                        >
                          {tpl.name}
                        </h3>
                        {tpl.difficulty && (
                          <span className={`text-[0.6rem] px-1.5 py-0.5 rounded-full ${
                            tpl.difficulty === "beginner" ? "bg-emerald-400/15 text-emerald-400" :
                            tpl.difficulty === "intermediate" ? "bg-amber-400/15 text-amber-400" :
                            "bg-rose-400/15 text-rose-400"
                          }`}>
                            {tpl.difficulty === "beginner" ? "入门" : tpl.difficulty === "intermediate" ? "中级" : "高级"}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[0.72rem] mb-3 line-clamp-2 ${t.templates.cardDesc}`}
                      >
                        {tpl.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tpl.tags.slice(0, 3).map((tag) => (
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
                        {tpl.estimatedTime && (
                          <span className={`text-[0.65rem] ml-auto ${t.templates.metaText}`}>
                            ⏱️ {tpl.estimatedTime}
                          </span>
                        )}
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
                    onClick={() => handlePreview(tpl)}
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
                      {tpl.previewCode && (
                        <span className="text-[0.62rem] px-2 py-0.5 rounded bg-emerald-400/15 text-emerald-400">可预览</span>
                      )}
                      <Eye className={`w-4 h-4 ${t.templates.metaText}`} />
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

      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUse={handleUseTemplate}
        />
      )}
    </div>
  );
}
