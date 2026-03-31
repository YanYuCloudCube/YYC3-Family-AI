/**
 * @file settings/RulesSkillsSection.tsx
 * @description 规则与技能管理面板 — 支持个人/项目级规则 CRUD、全局/项目技能配置，全面 i18n 国际化
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-17
 * @updated 2026-03-17
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags settings,rules,skills,management,i18n
 */

import { useState } from "react";
import {
  ScrollText,
  Zap,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useThemeTokens } from "../ide/hooks/useThemeTokens";
import {
  useSettingsStore,
  type RuleConfig,
  type SkillConfig,
} from "../ide/stores/useSettingsStore";
import { Toggle, SettingGroup, ItemCard, EmptyState } from "./SettingsShared";
import { useI18n } from "../ide/i18n";

/** 规则管理 */
export function RulesSection() {
  const th = useThemeTokens();
  const { t } = useI18n();
  const { settings, addRule, updateRule, removeRule } = useSettingsStore();
  const rules = settings.rules;
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<RuleConfig>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = () => {
    const newRule: RuleConfig = {
      id: `rule-${Date.now()}`,
      name: draft.name || t("settings.createNew"),
      content: draft.content || "",
      scope: draft.scope || "personal",
      enabled: true,
    };
    addRule(newRule);
    setDraft({});
    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      <SettingGroup title={t("settings.rules")} t={th}>
        <div className="space-y-2">
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
          >
            <div className="flex items-center gap-2">
              <ScrollText className={`w-4 h-4 ${th.text.accent}`} />
              <span className={`text-[0.82rem] ${th.text.primary}`}>
                {rules.length} {t("settings.rules")}
              </span>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
            >
              <Plus className="w-3.5 h-3.5" />
              {t("settings.createNew")}
            </button>
          </div>

          {/* Create */}
          {isCreating && (
            <ItemCard t={th} className="space-y-3">
              <input
                placeholder={t("settings.rules")}
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
              />
              <textarea
                placeholder={`${t("common.edit")  }...`}
                value={draft.content || ""}
                onChange={(e) =>
                  setDraft({ ...draft, content: e.target.value })
                }
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] resize-none ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={draft.scope !== "project"}
                    onChange={() => setDraft({ ...draft, scope: "personal" })}
                    className="accent-violet-500"
                  />
                  <span className={`text-[0.78rem] ${th.text.secondary}`}>
                    {t("settings.personal")}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={draft.scope === "project"}
                    onChange={() => setDraft({ ...draft, scope: "project" })}
                    className="accent-violet-500"
                  />
                  <span className={`text-[0.78rem] ${th.text.secondary}`}>
                    {t("settings.project")}
                  </span>
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setDraft({});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.ghost} ${th.btn.ghostHover}`}
                >
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

          {/* List */}
          {rules.length === 0 ? (
            <EmptyState icon={ScrollText} message={t("common.noData")} t={th} />
          ) : (
            rules.map((rule) => {
              const isExpanded = expandedId === rule.id;
              return (
                <ItemCard key={rule.id} t={th}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[0.85rem] ${th.text.primary}`}>
                          {rule.name}
                        </span>
                        <span
                          className={`text-[0.58rem] px-1.5 py-0.5 rounded ${
                            rule.scope === "project"
                              ? th.status.infoBg
                              : th.status.warningBg
                          }`}
                        >
                          {rule.scope === "project"
                            ? t("settings.project")
                            : t("settings.personal")}
                        </span>
                      </div>
                    </div>
                    <Toggle
                      checked={rule.enabled}
                      onChange={(v) => updateRule(rule.id, { enabled: v })}
                      t={th}
                    />
                    <button
                      onClick={() => removeRule(rule.id)}
                      className={`p-1.5 rounded-lg ${th.hoverBg}`}
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${th.status.error}`} />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : rule.id)}
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
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-current/5">
                      <textarea
                        value={rule.content}
                        onChange={(e) =>
                          updateRule(rule.id, { content: e.target.value })
                        }
                        rows={3}
                        className={`w-full px-3 py-2 rounded-lg border text-[0.78rem] resize-none ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} focus:outline-none`}
                      />
                    </div>
                  )}
                </ItemCard>
              );
            })
          )}
        </div>
      </SettingGroup>
    </div>
  );
}

/** 技能管理 */
export function SkillsSection() {
  const th = useThemeTokens();
  const { t } = useI18n();
  const { settings, addSkill, updateSkill, removeSkill } = useSettingsStore();
  const skills = settings.skills;
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<SkillConfig>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = () => {
    const newSkill: SkillConfig = {
      id: `skill-${Date.now()}`,
      name: draft.name || t("settings.createNew"),
      description: draft.description || "",
      content: draft.content || "",
      scope: draft.scope || "global",
      enabled: true,
    };
    addSkill(newSkill);
    setDraft({});
    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      <SettingGroup title={t("settings.skills")} t={th}>
        <div className="space-y-2">
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border ${th.page.cardBg} ${th.page.cardBorder}`}
          >
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${th.text.accent}`} />
              <span className={`text-[0.82rem] ${th.text.primary}`}>
                {skills.length} {t("settings.skills")}
              </span>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
            >
              <Plus className="w-3.5 h-3.5" />
              {t("settings.createNew")}
            </button>
          </div>

          {/* Create */}
          {isCreating && (
            <ItemCard t={th} className="space-y-3">
              <input
                placeholder={t("settings.skills")}
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
                placeholder={`${t("common.edit")  }...`}
                value={draft.content || ""}
                onChange={(e) =>
                  setDraft({ ...draft, content: e.target.value })
                }
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] resize-none ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={draft.scope !== "project"}
                    onChange={() => setDraft({ ...draft, scope: "global" })}
                    className="accent-violet-500"
                  />
                  <span className={`text-[0.78rem] ${th.text.secondary}`}>
                    {t("settings.global")}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={draft.scope === "project"}
                    onChange={() => setDraft({ ...draft, scope: "project" })}
                    className="accent-violet-500"
                  />
                  <span className={`text-[0.78rem] ${th.text.secondary}`}>
                    {t("settings.project")}
                  </span>
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setDraft({});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.ghost} ${th.btn.ghostHover}`}
                >
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

          {/* List */}
          {skills.length === 0 ? (
            <EmptyState icon={Zap} message={t("common.noData")} t={th} />
          ) : (
            skills.map((skill) => {
              const isExpanded = expandedId === skill.id;
              return (
                <ItemCard key={skill.id} t={th}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[0.85rem] ${th.text.primary}`}>
                          {skill.name}
                        </span>
                        <span
                          className={`text-[0.58rem] px-1.5 py-0.5 rounded ${
                            skill.scope === "project"
                              ? th.status.infoBg
                              : th.status.successBg
                          }`}
                        >
                          {skill.scope === "project"
                            ? t("settings.project")
                            : t("settings.global")}
                        </span>
                      </div>
                      {skill.description && (
                        <div
                          className={`text-[0.72rem] ${th.text.caption} truncate`}
                        >
                          {skill.description}
                        </div>
                      )}
                    </div>
                    <Toggle
                      checked={skill.enabled}
                      onChange={(v) => updateSkill(skill.id, { enabled: v })}
                      t={th}
                    />
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className={`p-1.5 rounded-lg ${th.hoverBg}`}
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${th.status.error}`} />
                    </button>
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : skill.id)
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
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-current/5">
                      <textarea
                        value={skill.content}
                        onChange={(e) =>
                          updateSkill(skill.id, { content: e.target.value })
                        }
                        rows={3}
                        className={`w-full px-3 py-2 rounded-lg border text-[0.78rem] resize-none ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} focus:outline-none`}
                      />
                    </div>
                  )}
                </ItemCard>
              );
            })
          )}
        </div>
      </SettingGroup>
    </div>
  );
}
