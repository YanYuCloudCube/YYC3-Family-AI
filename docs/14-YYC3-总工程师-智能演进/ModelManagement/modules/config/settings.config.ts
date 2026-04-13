/**
 * @file config/settings.config.ts
 * @description 声明式配置 - 完全解耦
 */

export const SETTINGS_CONFIG = {
  default: {
    title: "全局设置",
    layout: "sidebar",
    modules: ["general", "account", "agents", "mcp", "models", "plugins"],
  },
  
  minimal: {
    title: "快速设置",
    layout: "tabs",
    modules: ["general", "plugins"],
    showSearch: false,
  },
  
  admin: {
    title: "系统管理",
    layout: "accordion",
    modules: ["users", "permissions", "audit", "logs"],
    permissions: ["admin"],
  },
};

export function createSettingsPage(configKey: keyof typeof SETTINGS_CONFIG) {
  const config = SETTINGS_CONFIG[configKey];
  
  return function SettingsPage() {
    return <SettingsOrchestrator {...config} />;
  };
}