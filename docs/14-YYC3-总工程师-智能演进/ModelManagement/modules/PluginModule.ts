/**
 * @file modules/PluginModule.ts
 * @description 插件管理模块 - 高可复用实现
 */

import { BaseModule, useModule } from "../core/base/BaseModule";
import type { ModuleMeta, ModuleConfig, ModuleContext } from "../core/types";
import { Puzzle, Bot, Zap, Settings } from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  enabled: boolean;
  installed: boolean;
  category: "ai" | "workflow" | "tool" | "integration";
  rating?: number;
  downloads?: number;
}

interface PluginModuleState {
  installedPlugins: Plugin[];
  marketplacePlugins: Plugin[];
  activeTab: "installed" | "marketplace" | "workflows";
}

const DEFAULT_STATE: PluginModuleState = {
  installedPlugins: [],
  marketplacePlugins: [],
  activeTab: "installed",
};

export class PluginModule extends BaseModule<any, PluginModuleState> {
  readonly meta: ModuleMeta = {
    id: "plugins",
    name: "插件系统",
    nameEn: "Plugin System",
    description: "插件管理、插件市场、工作流配置",
    icon: Puzzle,
    category: "system",
    version: "2.0.0",
    author: "YYC3 Team",
    tags: ["settings", "plugins", "marketplace"],
    order: 50,
  };
  
  readonly config: ModuleConfig = {
    enabled: true,
    visible: true,
    permissions: ["plugin:read", "plugin:write"],
    dependencies: [],
    storageKey: "plugin-settings",
  };
  
  protected getDefaultState(): PluginModuleState {
    return DEFAULT_STATE;
  }
  
  async init(context: ModuleContext): Promise<void> {
    await super.init(context);
    
    const marketplacePlugins = await this.fetchMarketplacePlugins();
    this.setState({ marketplacePlugins });
  }
  
  private async fetchMarketplacePlugins(): Promise<Plugin[]> {
    return [
      {
        id: "plugin-code-assistant",
        name: "代码助手",
        description: "智能代码补全、重构建议",
        version: "2.1.0",
        author: "YYC3 Team",
        icon: "🤖",
        enabled: false,
        installed: false,
        category: "ai",
        rating: 4.8,
        downloads: 12500,
      },
    ];
  }
  
  installPlugin(plugin: Plugin): void {
    const installedPlugin = { ...plugin, installed: true, enabled: true };
    const current = this._state.data.installedPlugins;
    
    this.setState({
      installedPlugins: [...current, installedPlugin],
    });
    
    this.context.events.emit("plugin:installed", installedPlugin);
    this.context.logger.info(`Plugin installed: ${plugin.name}`);
  }
  
  uninstallPlugin(pluginId: string): void {
    const current = this._state.data.installedPlugins;
    
    this.setState({
      installedPlugins: current.filter(p => p.id !== pluginId),
    });
    
    this.context.events.emit("plugin:uninstalled", { id: pluginId });
  }
  
  togglePlugin(pluginId: string): void {
    const current = this._state.data.installedPlugins;
    const updated = current.map(p =>
      p.id === pluginId ? { ...p, enabled: !p.enabled } : p
    );
    
    this.setState({ installedPlugins: updated });
  }
  
  render(): React.ReactNode {
    return <PluginModuleUI module={this} />;
  }
}

function PluginModuleUI({ module }: { module: PluginModule }) {
  const { state, updateState } = useModule(module);
  const theme = module.context.theme;
  const { t } = module.context.i18n;
  
  const th = theme.getTokens();
  const { installedPlugins, marketplacePlugins, activeTab } = state.data;
  
  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}>
        <div className="flex items-center gap-2">
          <Puzzle className={`w-4 h-4 ${th.text.accent}`} />
          <span className={`text-[0.82rem] ${th.text.primary}`}>
            {t("settings.plugins")}
          </span>
        </div>
        
        <TabButtons
          tabs={["installed", "marketplace", "workflows"]}
          active={activeTab}
          onChange={(tab) => updateState({ activeTab: tab })}
          theme={th}
        />
      </div>
      
      {activeTab === "installed" && (
        <PluginList
          plugins={installedPlugins}
          onToggle={(id) => module.togglePlugin(id)}
          onUninstall={(id) => module.uninstallPlugin(id)}
          theme={th}
        />
      )}
      
      {activeTab === "marketplace" && (
        <MarketplaceList
          plugins={marketplacePlugins}
          onInstall={(p) => module.installPlugin(p)}
          theme={th}
        />
      )}
    </div>
  );
}