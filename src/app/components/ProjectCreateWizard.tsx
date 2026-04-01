/**
 * @file ProjectCreateWizard.tsx
 * @description 项目创建向导弹窗，支持模板选择、项目配置、技术栈选择、
 *              多步骤表单流程。已完成 isCyber → useThemeTokens 迁移
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.2.0
 * @created 2026-03-06
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags wizard,project-creation,templates,forms,token-migrated
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  LayoutDashboard,
  ShoppingCart,
  Users,
  BarChart3,
  FileText,
  Globe,
  Code2,
  Palette,
  Database,
  Layers,
  Sparkles,
  Zap,
  FolderPlus,
} from "lucide-react";
import { useThemeTokens } from "./ide/hooks/useThemeTokens";

// ── 项目模板定义 ──
interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tags: string[];
  techStack: string[];
  panels: number;
  complexity: "basic" | "intermediate" | "advanced";
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "blank",
    name: "空白项目",
    description: "从零开始，完全自定义的空白项目",
    icon: FolderPlus,
    color: "from-slate-500 to-slate-600",
    tags: ["自由", "灵活"],
    techStack: ["React", "TypeScript", "Tailwind"],
    panels: 3,
    complexity: "basic",
  },
  {
    id: "dashboard",
    name: "数据仪表板",
    description: "包含图表、统计卡片、数据表格的管理后台",
    icon: LayoutDashboard,
    color: "from-violet-500 to-indigo-600",
    tags: ["管理后台", "数据可视化"],
    techStack: ["React", "Recharts", "Tailwind"],
    panels: 6,
    complexity: "intermediate",
  },
  {
    id: "ecommerce",
    name: "电商平台",
    description: "商品展示、购物车、订单管理的电商系统",
    icon: ShoppingCart,
    color: "from-emerald-500 to-teal-600",
    tags: ["电商", "商城"],
    techStack: ["React", "TypeScript", "Tailwind"],
    panels: 8,
    complexity: "advanced",
  },
  {
    id: "crm",
    name: "CRM 管理系统",
    description: "客户关系管理、销售跟踪、数据分析",
    icon: Users,
    color: "from-blue-500 to-cyan-600",
    tags: ["CRM", "客户管理"],
    techStack: ["React", "TypeScript", "Tailwind"],
    panels: 5,
    complexity: "intermediate",
  },
  {
    id: "data-viz",
    name: "数据可视化平台",
    description: "交互式图表、大屏展示、实时数据监控",
    icon: BarChart3,
    color: "from-amber-500 to-orange-600",
    tags: ["数据", "图表", "大屏"],
    techStack: ["React", "Recharts", "D3.js"],
    panels: 4,
    complexity: "advanced",
  },
  {
    id: "blog",
    name: "博客/内容平台",
    description: "文章发布、分类管理、评论系统",
    icon: FileText,
    color: "from-rose-500 to-pink-600",
    tags: ["博客", "内容"],
    techStack: ["React", "Markdown", "Tailwind"],
    panels: 4,
    complexity: "basic",
  },
  {
    id: "portfolio",
    name: "个人作品集",
    description: "个人展示、项目案例、简历页面",
    icon: Globe,
    color: "from-purple-500 to-fuchsia-600",
    tags: ["个人", "展示"],
    techStack: ["React", "Motion", "Tailwind"],
    panels: 3,
    complexity: "basic",
  },
  {
    id: "api-platform",
    name: "API 开发平台",
    description: "API 文档、接口测试、开发者工具",
    icon: Code2,
    color: "from-sky-500 to-blue-600",
    tags: ["API", "开发工具"],
    techStack: ["React", "Monaco", "Tailwind"],
    panels: 5,
    complexity: "advanced",
  },
];

// ── 向导步骤 ──
type WizardStep = "template" | "info" | "config" | "confirm";

interface ProjectInfo {
  name: string;
  description: string;
  templateId: string;
}

interface WizardProps {
  open: boolean;
  onClose: () => void;
}

export default function ProjectCreateWizard({ open, onClose }: WizardProps) {
  const navigate = useNavigate();
  const t = useThemeTokens();
  const w = t.wizard;
  const [step, setStep] = useState<WizardStep>("template");
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProjectTemplate | null>(null);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: "",
    description: "",
    templateId: "",
  });

  const complexityColors = {
    basic: "text-emerald-400 bg-emerald-900/30",
    intermediate: "text-amber-400 bg-amber-900/30",
    advanced: "text-red-400 bg-red-900/30",
  };
  const complexityLabels = {
    basic: "基础",
    intermediate: "中级",
    advanced: "高级",
  };

  const handleSelectTemplate = useCallback((template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setProjectInfo((prev) => ({
      ...prev,
      templateId: template.id,
      name: prev.name || `${template.name  } 项目`,
    }));
  }, []);

  const handleNext = useCallback(() => {
    if (step === "template" && selectedTemplate) setStep("info");
    else if (step === "info" && projectInfo.name.trim()) setStep("config");
    else if (step === "config") setStep("confirm");
  }, [step, selectedTemplate, projectInfo.name]);

  const handleBack = useCallback(() => {
    if (step === "info") setStep("template");
    else if (step === "config") setStep("info");
    else if (step === "confirm") setStep("config");
  }, [step]);

  const handleCreate = useCallback(() => {
    const projectId = `proj_${Date.now()}`;
    // 保存项目信息到 localStorage
    try {
      const projects = JSON.parse(
        localStorage.getItem("yyc3_projects") || "[]",
      );
      projects.unshift({
        id: projectId,
        name: projectInfo.name,
        description: projectInfo.description,
        templateId: selectedTemplate?.id,
        templateName: selectedTemplate?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        panels: selectedTemplate?.panels || 3,
      });
      localStorage.setItem(
        "yyc3_projects",
        JSON.stringify(projects.slice(0, 50)),
      );
    } catch { /* empty */ }

    onClose();
    navigate(`/ide/${projectId}`, {
      state: {
        mode: "designer",
        projectName: projectInfo.name,
        templateId: selectedTemplate?.id,
      },
    });
  }, [projectInfo, selectedTemplate, navigate, onClose]);

  const _handleReset = useCallback(() => {
    setStep("template");
    setSelectedTemplate(null);
    setProjectInfo({ name: "", description: "", templateId: "" });
  }, []);

  if (!open) return null;

  const steps: { key: WizardStep; label: string; num: number }[] = [
    { key: "template", label: "选择模板", num: 1 },
    { key: "info", label: "项目信息", num: 2 },
    { key: "config", label: "技术配置", num: 3 },
    { key: "confirm", label: "确认创建", num: 4 },
  ];

  const currentIdx = steps.findIndex((s) => s.key === step);

  // ── All styling via wizard tokens (isCyber fully eliminated) ──
  const inputClass = `w-full rounded-lg px-4 py-3 text-[0.85rem] focus:outline-none ${w.formInputBg} border ${w.formInputBorder} ${w.formInputText} ${w.formInputFocus}`;
  const infoPanelClass = `rounded-lg p-3 ${w.infoPanel}`;
  const configPanelClass = `rounded-lg p-4 ${w.configPanel}`;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-[780px] max-h-[92vh] rounded-2xl flex flex-col overflow-hidden ${w.modalBg}`}
        style={{ boxShadow: "0 25px 60px -12px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-3 px-6 py-4 border-b ${w.headerBorder}`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${w.headerIconBg}`}
          >
            <Sparkles className={`w-4 h-4 ${t.text.accent}`} />
          </div>
          <div className="flex-1">
            <div className={`text-[0.9rem] ${w.header}`}>创建新项目</div>
            <div className={`text-[0.7rem] ${t.text.muted}`}>
              选择模板 → 填写信息 → 配置 → 创建
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${t.text.muted} hover:${t.text.secondary}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div
          className={`flex items-center gap-2 px-6 py-3 border-b ${w.stepBorder}`}
        >
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] transition-all ${
                  i < currentIdx
                    ? w.stepDone
                    : i === currentIdx
                      ? w.stepCurrent
                      : w.stepPending
                }`}
              >
                {i < currentIdx ? <Check className="w-3 h-3" /> : s.num}
              </div>
              <span
                className={`text-[0.68rem] ${
                  i === currentIdx ? w.stepLabelCurrent : w.stepLabelPending
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 h-px ${
                    i < currentIdx ? w.stepLineDone : w.stepLinePending
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <AnimatePresence mode="wait">
            {/* Step 1: Template Selection */}
            {step === "template" && (
              <motion.div
                key="template"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="grid grid-cols-2 gap-3">
                  {PROJECT_TEMPLATES.map((tmpl) => {
                    const isSelected = selectedTemplate?.id === tmpl.id;
                    const Icon = tmpl.icon;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => handleSelectTemplate(tmpl)}
                        className={`text-left rounded-xl p-4 border transition-all ${
                          isSelected ? w.cardSelected : w.cardDefault
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tmpl.color} flex items-center justify-center flex-shrink-0`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-[0.82rem] mb-0.5 ${t.text.primary}`}
                            >
                              {tmpl.name}
                            </div>
                            <div
                              className={`text-[0.68rem] mb-2 ${t.text.muted}`}
                            >
                              {tmpl.description}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[0.55rem] px-1.5 py-0.5 rounded-full ${complexityColors[tmpl.complexity]}`}
                              >
                                {complexityLabels[tmpl.complexity]}
                              </span>
                              <span
                                className={`text-[0.52rem] ${t.text.caption}`}
                              >
                                {tmpl.panels} 面板
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${w.checkIconBg}`}
                            >
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Project Info */}
            {step === "info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 max-w-lg"
              >
                <div>
                  <label
                    className={`text-[0.75rem] mb-1.5 block ${t.text.label}`}
                  >
                    项目名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={projectInfo.name}
                    onChange={(e) =>
                      setProjectInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="输入项目名称"
                    autoFocus
                  />
                </div>
                <div>
                  <label
                    className={`text-[0.75rem] mb-1.5 block ${t.text.label}`}
                  >
                    项目描述
                  </label>
                  <textarea
                    value={projectInfo.description}
                    onChange={(e) =>
                      setProjectInfo((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="简要描述您的项目（可选）"
                  />
                </div>
                {selectedTemplate && (
                  <div className={infoPanelClass}>
                    <div className={`text-[0.68rem] mb-1 ${t.text.muted}`}>
                      已选模板
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${selectedTemplate.color} flex items-center justify-center`}
                      >
                        <selectedTemplate.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className={`text-[0.78rem] ${t.text.primary}`}>
                        {selectedTemplate.name}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Config */}
            {step === "config" && selectedTemplate && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 max-w-lg"
              >
                <div className={configPanelClass}>
                  <div className={`text-[0.72rem] mb-3 ${t.text.label}`}>
                    技术栈
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.techStack.map((tech) => (
                      <span
                        key={tech}
                        className={`px-2.5 py-1 rounded-lg text-[0.7rem] ${w.techTag}`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={configPanelClass}>
                  <div className={`text-[0.72rem] mb-3 ${t.text.label}`}>
                    项目结构预览
                  </div>
                  <div
                    className={`font-mono text-[0.65rem] space-y-0.5 ${t.text.tertiary}`}
                  >
                    <div>src/</div>
                    <div className="pl-4">app/</div>
                    <div className="pl-8">App.tsx</div>
                    <div className="pl-8">routes.ts</div>
                    <div className="pl-8">components/</div>
                    <div className="pl-12">Header.tsx</div>
                    <div className="pl-12">Sidebar.tsx</div>
                    {selectedTemplate.id === "dashboard" && (
                      <div className="pl-12">Dashboard.tsx</div>
                    )}
                    {selectedTemplate.id === "ecommerce" && (
                      <div className="pl-12">ProductList.tsx</div>
                    )}
                    {selectedTemplate.id === "crm" && (
                      <div className="pl-12">CustomerTable.tsx</div>
                    )}
                    <div className="pl-4">styles/</div>
                    <div className="pl-8">theme.css</div>
                    <div>package.json</div>
                    <div>tsconfig.json</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirm */}
            {step === "confirm" && selectedTemplate && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-lg"
              >
                <div className={`rounded-xl p-6 text-center ${w.confirmPanel}`}>
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedTemplate.color} flex items-center justify-center mx-auto mb-4`}
                  >
                    <selectedTemplate.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className={`text-[1rem] mb-1 ${t.text.primary}`}>
                    {projectInfo.name}
                  </div>
                  {projectInfo.description && (
                    <div className={`text-[0.75rem] mb-3 ${t.text.muted}`}>
                      {projectInfo.description}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <div className={`text-[0.68rem] ${t.text.muted}`}>
                      <Palette className="w-3.5 h-3.5 inline mr-1" />
                      {selectedTemplate.name}
                    </div>
                    <div className={`text-[0.68rem] ${t.text.muted}`}>
                      <Layers className="w-3.5 h-3.5 inline mr-1" />
                      {selectedTemplate.panels} 面板
                    </div>
                    <div className={`text-[0.68rem] ${t.text.muted}`}>
                      <Database className="w-3.5 h-3.5 inline mr-1" />
                      {selectedTemplate.techStack.length} 技术
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-t ${w.footerBorder}`}
        >
          <button
            onClick={step === "template" ? onClose : handleBack}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.78rem] transition-colors ${w.backBtn}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {step === "template" ? "取消" : "上一步"}
          </button>

          {step === "confirm" ? (
            <button
              onClick={handleCreate}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[0.82rem] transition-all ${w.createBtn}`}
            >
              <Zap className="w-4 h-4" />
              创建项目
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                (step === "template" && !selectedTemplate) ||
                (step === "info" && !projectInfo.name.trim())
              }
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-[0.78rem] transition-all disabled:opacity-30 ${w.nextBtn}`}
            >
              下一步
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
