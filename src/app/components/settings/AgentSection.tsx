/**
 * @file settings/AgentSection.tsx
 * @description 智能体管理设置面板 — 支持内置/自定义智能体的 CRUD、参数调节，全面 i18n 国际化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,agents,management,i18n
 */

import { useState } from "react";
import {
  Bot,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { useThemeTokens } from "../ide/hooks/useThemeTokens";
import {
  useSettingsStore,
  type AgentConfig,
} from "../ide/stores/useSettingsStore";
import { ItemCard, EmptyState, Toggle } from "./SettingsShared";
import { useI18n } from "../ide/i18n";

export function AgentSection() {
  const th = useThemeTokens();
  const { t } = useI18n();
  const { settings, addAgent, updateAgent, removeAgent } = useSettingsStore();
  const agents = settings.agents;

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<AgentConfig>>({});

  const handleCreate = () => {
    const newAgent: AgentConfig = {
      id: `agent-${Date.now()}`,
      name: draft.name || t("settings.createNew"),
      description: draft.description || "",
      systemPrompt: draft.systemPrompt || "",
      model: draft.model || "auto",
      temperature: draft.temperature ?? 0.7,
      maxTokens: draft.maxTokens ?? 4096,
      isBuiltIn: false,
      isCustom: true,
    };
    addAgent(newAgent);
    setDraft({});
    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
      >
        <div className="flex items-center gap-2">
          <Bot className={`w-4 h-4 ${th.text.accent}`} />
          <span className={`text-[0.82rem] ${th.text.primary}`}>
            {agents.length} {t("settings.agents")}
          </span>
          <span className={`text-[0.72rem] ${th.text.caption}`}>
            ({agents.filter((a) => a.isBuiltIn).length} {t("settings.builtIn")}{" "}
            · {agents.filter((a) => a.isCustom).length} {t("settings.custom")})
          </span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] transition-colors ${th.btn.accent} ${th.btn.accentHover}`}
        >
          <Plus className="w-3.5 h-3.5" />
          {t("settings.createNew")}
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <ItemCard t={th} className="space-y-3">
          <div className={`text-[0.82rem] ${th.text.primary}`}>
            {t("settings.createNew")} {t("settings.agents")}
          </div>
          <input
            placeholder={t("settings.agents")}
            value={draft.name || ""}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
          />
          <input
            placeholder={t("common.edit")}
            value={draft.description || ""}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
          />
          <textarea
            placeholder={`${t("settings.systemPrompt")  }...`}
            value={draft.systemPrompt || ""}
            onChange={(e) =>
              setDraft({ ...draft, systemPrompt: e.target.value })
            }
            rows={3}
            className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] resize-none ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
          />
          <div className="flex items-center gap-3">
            <label className={`text-[0.72rem] ${th.text.caption}`}>
              {t("settings.temperature")}
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={draft.temperature ?? 0.7}
              onChange={(e) =>
                setDraft({ ...draft, temperature: Number(e.target.value) })
              }
              className="flex-1 accent-violet-500"
            />
            <span
              className={`text-[0.72rem] w-8 text-right tabular-nums ${th.text.secondary}`}
            >
              {(draft.temperature ?? 0.7).toFixed(1)}
            </span>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setIsCreating(false);
                setDraft({});
              }}
              className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.ghost} ${th.btn.ghostHover}`}
            >
              <X className="w-3.5 h-3.5 inline mr-1" />
              {t("common.cancel")}
            </button>
            <button
              onClick={handleCreate}
              className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
            >
              <Check className="w-3.5 h-3.5 inline mr-1" />
              {t("common.confirm")}
            </button>
          </div>
        </ItemCard>
      )}

      {/* Agent List */}
      {agents.length === 0 ? (
        <EmptyState icon={Bot} message={t("common.noData")} t={th} />
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => {
            const isExpanded = expandedId === agent.id;
            return (
              <ItemCard key={agent.id} t={th}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      agent.isBuiltIn
                        ? "bg-violet-500/10 border border-violet-500/20"
                        : "bg-blue-500/10 border border-blue-500/20"
                    }`}
                  >
                    <Cpu
                      className={`w-4 h-4 ${agent.isBuiltIn ? "text-violet-400" : "text-blue-400"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[0.85rem] ${th.text.primary}`}>
                        {agent.name}
                      </span>
                      {agent.isBuiltIn && (
                        <span
                          className={`text-[0.58rem] px-1.5 py-0.5 rounded ${th.status.infoBg}`}
                        >
                          {t("settings.builtIn")}
                        </span>
                      )}
                    </div>
                    {agent.description && (
                      <div
                        className={`text-[0.72rem] ${th.text.caption} truncate`}
                      >
                        {agent.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!agent.isBuiltIn && (
                      <button
                        onClick={() => removeAgent(agent.id)}
                        className={`p-1.5 rounded-lg ${th.hoverBg}`}
                        title={t("common.delete")}
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${th.status.error}`} />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : agent.id)
                      }
                      className={`p-1.5 rounded-lg ${th.hoverBg}`}
                    >
                      {isExpanded ? (
                        <ChevronUp
                          className={`w-3.5 h-3.5 ${th.text.caption}`}
                        />
                      ) : (
                        <ChevronDown
                          className={`w-3.5 h-3.5 ${th.text.caption}`}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-current/5">
                    <div>
                      <label
                        className={`text-[0.72rem] ${th.text.caption} block mb-1`}
                      >
                        {t("settings.systemPrompt")}
                      </label>
                      <textarea
                        value={agent.systemPrompt}
                        onChange={(e) =>
                          updateAgent(agent.id, {
                            systemPrompt: e.target.value,
                          })
                        }
                        rows={3}
                        disabled={agent.isBuiltIn}
                        className={`w-full px-3 py-2 rounded-lg border text-[0.78rem] resize-none ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} focus:outline-none ${agent.isBuiltIn ? "opacity-60" : ""}`}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <label className={`text-[0.72rem] ${th.text.caption}`}>
                          {t("settings.temperature")}
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.1}
                          value={agent.temperature}
                          onChange={(e) =>
                            updateAgent(agent.id, {
                              temperature: Number(e.target.value),
                            })
                          }
                          className="flex-1 accent-violet-500"
                        />
                        <span
                          className={`text-[0.72rem] w-8 text-right tabular-nums ${th.text.secondary}`}
                        >
                          {agent.temperature.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className={`text-[0.72rem] ${th.text.caption}`}>
                          {t("settings.maxTokens")}
                        </label>
                        <select
                          value={agent.maxTokens}
                          onChange={(e) =>
                            updateAgent(agent.id, {
                              maxTokens: Number(e.target.value),
                            })
                          }
                          className={`px-2 py-1 rounded-lg border text-[0.72rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText}`}
                        >
                          <option value={1024}>1024</option>
                          <option value={2048}>2048</option>
                          <option value={4096}>4096</option>
                          <option value={8192}>8192</option>
                          <option value={16384}>16384</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </ItemCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
