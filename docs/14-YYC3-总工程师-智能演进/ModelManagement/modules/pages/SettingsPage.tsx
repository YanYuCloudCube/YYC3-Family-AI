/**
 * @file pages/SettingsPage.tsx
 * @description 重构后的设置页面 - 极简实现
 */

import { useEffect } from "react";
import { SettingsOrchestrator } from "../orchestrator/SettingsOrchestrator";
import { ModuleRegistry } from "../core/registry/ModuleRegistry";
import { PluginModule } from "../modules/PluginModule";
import { MCPModule } from "../modules/MCPModule";
import { ModelModule } from "../modules/ModelModule";
import { AgentModule } from "../modules/AgentModule";
import { ThemeAdapter } from "../core/adapters/ThemeAdapter";
import { useThemeTokens } from "../ide/hooks/useThemeTokens";

ModuleRegistry.register(new PluginModule());
ModuleRegistry.register(new MCPModule());
ModuleRegistry.register(new ModelModule());
ModuleRegistry.register(new AgentModule());

export default function SettingsPage() {
  const tokens = useThemeTokens();
  const theme = new ThemeAdapter(tokens);
  
  return (
    <SettingsOrchestrator
      title="全局设置"
      showSearch
      showSave
      layout="sidebar"
      theme={theme}
    />
  );
}