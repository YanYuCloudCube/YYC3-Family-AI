/**
 * @file orchestrator/SettingsOrchestrator.tsx
 * @description 配置驱动的设置页面编排器
 */

import { useState, useEffect, useMemo } from "react";
import { ModuleRegistry } from "../core/registry/ModuleRegistry";
import { ThemeAdapter, LocalStorageAdapter } from "../core/adapters";
import type { ISettingsModule, ModuleMeta, ModuleContext } from "../core/types";
import { EventEmitter } from "events";
import { Search, ChevronRight, ArrowLeft, Save, Check } from "lucide-react";
import { useNavigate } from "react-router";

interface SettingsOrchestratorProps {
  modules?: string[];
  title?: string;
  showSearch?: boolean;
  showSave?: boolean;
  layout?: "sidebar" | "tabs" | "accordion";
  theme?: ThemeAdapter;
  storage?: LocalStorageAdapter;
}

export function SettingsOrchestrator({
  modules: moduleIds,
  title = "全局设置",
  showSearch = true,
  showSave = true,
  layout = "sidebar",
  theme,
  storage,
}: SettingsOrchestratorProps) {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saved, setSaved] = useState(false);
  
  const context = useMemo<ModuleContext>(() => ({
    theme: theme || new ThemeAdapter({} as any),
    i18n: createI18nAdapter(),
    storage: storage || new LocalStorageAdapter(),
    events: new EventEmitter(),
    logger: console,
  }), [theme, storage]);
  
  const modules = useMemo(() => {
    const all = moduleIds
      ? moduleIds.map(id => ModuleRegistry.get(id)).filter(Boolean)
      : ModuleRegistry.getSorted();
    
    return all as ISettingsModule<any, any>[];
  }, [moduleIds]);
  
  useEffect(() => {
    modules.forEach(m => m.init(context));
  }, [modules, context]);
  
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    
    const query = searchQuery.toLowerCase();
    return modules.filter(m =>
      m.meta.name.toLowerCase().includes(query) ||
      m.meta.description.toLowerCase().includes(query) ||
      m.meta.tags.some(t => t.toLowerCase().includes(query))
    );
  }, [modules, searchQuery]);
  
  const handleSave = async () => {
    const results = await Promise.all(
      modules.map(m => m.validate())
    );
    
    if (results.every(Boolean)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };
  
  const currentModule = activeModule
    ? modules.find(m => m.meta.id === activeModule)
    : null;
  
  const th = context.theme.getTokens();
  
  return (
    <div className={`size-full min-h-screen ${th.page.pageBg}`}>
      <TopBar
        title={title}
        showSearch={showSearch}
        showSave={showSave}
        saved={saved}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSave={handleSave}
        onBack={() => navigate("/")}
        theme={th}
      />
      
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-8">
          {layout === "sidebar" && (
            <SideNav
              modules={filteredModules}
              activeId={activeModule}
              onSelect={setActiveModule}
              theme={th}
            />
          )}
          
          <div className="flex-1 min-w-0">
            {currentModule ? (
              currentModule.render()
            ) : (
              <EmptyState theme={th} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}