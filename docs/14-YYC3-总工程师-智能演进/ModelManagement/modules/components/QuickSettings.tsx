/**
 * @file components/QuickSettings.tsx
 * @description 快速设置面板 - 仅包含特定模块
 */

import { SettingsOrchestrator } from "../orchestrator/SettingsOrchestrator";

export function QuickSettings() {
  return (
    <SettingsOrchestrator
      modules={["plugins", "mcp"]}
      title="快速配置"
      showSearch={false}
      showSave={false}
      layout="tabs"
    />
  );
}