/**
 * @file pages/DynamicSettings.tsx
 * @description 根据用户权限动态加载模块
 */

import { useMemo } from "react";
import { SettingsOrchestrator } from "../orchestrator/SettingsOrchestrator";
import { ModuleRegistry } from "../core/registry/ModuleRegistry";
import { useUserPermissions } from "../hooks/useUserPermissions";

export function DynamicSettings() {
  const permissions = useUserPermissions();
  
  const availableModules = useMemo(() => {
    return ModuleRegistry.getAll()
      .filter(m => {
        const required = m.config.permissions;
        return required.every(p => permissions.includes(p));
      })
      .map(m => m.meta.id);
  }, [permissions]);
  
  return (
    <SettingsOrchestrator
      modules={availableModules}
      title="个性化设置"
    />
  );
}