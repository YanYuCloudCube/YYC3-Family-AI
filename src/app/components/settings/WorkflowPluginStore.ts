/**
 * @file: WorkflowPluginStore.ts
 * @description: 工作流、插件和模版的统一状态管理 — 实现真实CRUD功能和数据互通
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-02
 * @updated: 2026-04-02
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: workflow,plugin,template,store,management
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loadJSON, saveJSON } from "../ide/constants/storage-keys";

export interface WorkflowNode {
  id: string;
  type: "start" | "task" | "condition" | "loop" | "end";
  name: string;
  description?: string;
  config?: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: "draft" | "active" | "paused" | "completed";
  createdAt: number;
  updatedAt: number;
  executionCount: number;
  lastExecutedAt?: number;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: "productivity" | "integration" | "ai" | "utility" | "custom";
  enabled: boolean;
  installed: boolean;
  source: "local" | "market" | "github";
  config?: Record<string, any>;
  installedAt?: number;
  updatedAt?: number;
}

export interface PluginTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  readme: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: "web" | "mobile" | "desktop" | "api" | "cli" | "custom";
  icon: string;
  tags: string[];
  template: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
}

interface WorkflowPluginState {
  workflows: Workflow[];
  plugins: Plugin[];
  templates: ProjectTemplate[];
  pluginTemplates: PluginTemplate[];

  addWorkflow: (workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt" | "executionCount">) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  duplicateWorkflow: (id: string) => void;
  executeWorkflow: (id: string) => void;

  installPlugin: (plugin: Omit<Plugin, "id" | "installed" | "installedAt">) => void;
  uninstallPlugin: (id: string) => void;
  togglePlugin: (id: string) => void;
  updatePluginConfig: (id: string, config: Record<string, any>) => void;

  addTemplate: (template: Omit<ProjectTemplate, "id" | "createdAt" | "updatedAt" | "usageCount">) => void;
  updateTemplate: (id: string, updates: Partial<ProjectTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  useTemplate: (id: string) => ProjectTemplate | null;
}

export const useWorkflowPluginStore = create<WorkflowPluginState>()(
  persist(
    (set, get) => ({
      workflows: loadJSON("yyc3-workflows", []),
      plugins: loadJSON("yyc3-plugins", []),
      templates: loadJSON("yyc3-templates", [
        {
          id: "template-web-react",
          name: "React Web App",
          description: "现代化的React Web应用模版，支持TypeScript、Tailwind CSS",
          category: "web",
          icon: "⚛️",
          tags: ["react", "typescript", "tailwind"],
          template: { framework: "react", language: "typescript", styling: "tailwind" },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          usageCount: 0,
        },
        {
          id: "template-api-express",
          name: "Express API Server",
          description: "RESTful API服务器模版，支持中间件、路由、数据库集成",
          category: "api",
          icon: "🚀",
          tags: ["express", "nodejs", "api"],
          template: { framework: "express", language: "typescript", database: "postgresql" },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          usageCount: 0,
        },
        {
          id: "template-cli-tool",
          name: "CLI Tool",
          description: "命令行工具模版，支持参数解析、交互式提示",
          category: "cli",
          icon: "⚡",
          tags: ["cli", "nodejs", "commander"],
          template: { framework: "commander", language: "typescript" },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          usageCount: 0,
        },
      ]),
      pluginTemplates: [
        {
          id: "plugin-template-basic",
          name: "基础插件模版",
          description: "最小化的插件结构，适合快速开始",
          category: "basic",
          template: `/**
 * @plugin {{name}}
 * @description: {{description}}
 */

export default {
  id: '{{id}}',
  name: '{{name}}',
  version: '1.0.0',
  
  activate(context) {
    console.log('Plugin activated');
  },
  
  deactivate() {
    console.log('Plugin deactivated');
  }
};`,
          readme: "# 基础插件模版\n\n这是一个最小化的插件结构，适合快速开始开发。",
        },
        {
          id: "plugin-template-command",
          name: "命令插件模版",
          description: "注册自定义命令的插件模版",
          category: "command",
          template: `/**
 * @plugin {{name}}
 * @description: {{description}}
 */

export default {
  id: '{{id}}',
  name: '{{name}}',
  version: '1.0.0',
  
  commands: [
    {
      id: '{{id}}.hello',
      title: 'Say Hello',
      handler: () => {
        console.log('Hello from {{name}}!');
      }
    }
  ],
  
  activate(context) {
    // 注册命令
    context.registerCommands(this.commands);
  }
};`,
          readme: "# 命令插件模版\n\n这个模版展示了如何注册自定义命令。",
        },
      ],

      addWorkflow: (workflow) => {
        set((state) => {
          const newWorkflow: Workflow = {
            ...workflow,
            id: `workflow-${Date.now()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            executionCount: 0,
          };
          const workflows = [...state.workflows, newWorkflow];
          saveJSON("yyc3-workflows", workflows);
          return { workflows };
        });
      },

      updateWorkflow: (id, updates) => {
        set((state) => {
          const workflows = state.workflows.map((w) =>
            w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w
          );
          saveJSON("yyc3-workflows", workflows);
          return { workflows };
        });
      },

      deleteWorkflow: (id) => {
        set((state) => {
          const workflows = state.workflows.filter((w) => w.id !== id);
          saveJSON("yyc3-workflows", workflows);
          return { workflows };
        });
      },

      duplicateWorkflow: (id) => {
        set((state) => {
          const workflow = state.workflows.find((w) => w.id === id);
          if (!workflow) return state;
          const newWorkflow: Workflow = {
            ...workflow,
            id: `workflow-${Date.now()}`,
            name: `${workflow.name} (副本)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            executionCount: 0,
          };
          const workflows = [...state.workflows, newWorkflow];
          saveJSON("yyc3-workflows", workflows);
          return { workflows };
        });
      },

      executeWorkflow: (id) => {
        set((state) => {
          const workflows = state.workflows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  executionCount: w.executionCount + 1,
                  lastExecutedAt: Date.now(),
                  updatedAt: Date.now(),
                }
              : w
          );
          saveJSON("yyc3-workflows", workflows);
          return { workflows };
        });
      },

      installPlugin: (plugin) => {
        set((state) => {
          const newPlugin: Plugin = {
            ...plugin,
            id: `plugin-${Date.now()}`,
            installed: true,
            installedAt: Date.now(),
          };
          const plugins = [...state.plugins, newPlugin];
          saveJSON("yyc3-plugins", plugins);
          return { plugins };
        });
      },

      uninstallPlugin: (id) => {
        set((state) => {
          const plugins = state.plugins.filter((p) => p.id !== id);
          saveJSON("yyc3-plugins", plugins);
          return { plugins };
        });
      },

      togglePlugin: (id) => {
        set((state) => {
          const plugins = state.plugins.map((p) =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
          );
          saveJSON("yyc3-plugins", plugins);
          return { plugins };
        });
      },

      updatePluginConfig: (id, config) => {
        set((state) => {
          const plugins = state.plugins.map((p) =>
            p.id === id ? { ...p, config: { ...p.config, ...config }, updatedAt: Date.now() } : p
          );
          saveJSON("yyc3-plugins", plugins);
          return { plugins };
        });
      },

      addTemplate: (template) => {
        set((state) => {
          const newTemplate: ProjectTemplate = {
            ...template,
            id: `template-${Date.now()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0,
          };
          const templates = [...state.templates, newTemplate];
          saveJSON("yyc3-templates", templates);
          return { templates };
        });
      },

      updateTemplate: (id, updates) => {
        set((state) => {
          const templates = state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          );
          saveJSON("yyc3-templates", templates);
          return { templates };
        });
      },

      deleteTemplate: (id) => {
        set((state) => {
          const templates = state.templates.filter((t) => t.id !== id);
          saveJSON("yyc3-templates", templates);
          return { templates };
        });
      },

      duplicateTemplate: (id) => {
        set((state) => {
          const template = state.templates.find((t) => t.id === id);
          if (!template) return state;
          const newTemplate: ProjectTemplate = {
            ...template,
            id: `template-${Date.now()}`,
            name: `${template.name} (副本)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0,
          };
          const templates = [...state.templates, newTemplate];
          saveJSON("yyc3-templates", templates);
          return { templates };
        });
      },

      useTemplate: (id) => {
        const state = get();
        const template = state.templates.find((t) => t.id === id);
        if (!template) return null;

        set((state) => {
          const templates = state.templates.map((t) =>
            t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
          );
          saveJSON("yyc3-templates", templates);
          return { templates };
        });

        return template;
      },
    }),
    {
      name: "yyc3-workflow-plugin-store",
    }
  )
);
