/**
 * @file: settings/ConversationContextSection.tsx
 * @description: 对话流设置与上下文管理面板 — 待办清单、代码审查、命令执行、通知、文档集等，全面 i18n 国际化
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.1.0
 * @created: 2026-03-17
 * @updated: 2026-03-17
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: settings,conversation,context,management,i18n
 */

import { useState } from "react";
import {
  Database,
  Plus,
  Trash2,
  Check,
  X,
  Volume2,
  FileText,
  Terminal,
} from "lucide-react";
import { useThemeTokens } from "../ide/hooks/useThemeTokens";
import {
  useSettingsStore,
  type DocumentSet,
} from "../ide/stores/useSettingsStore";
import {
  Toggle,
  SettingRow,
  SettingGroup,
  ItemCard,
  EmptyState,
} from "./SettingsShared";
import { useI18n } from "../ide/i18n";

/** 对话流设置 */
export function ConversationSection() {
  const th = useThemeTokens();
  const { t } = useI18n();
  const { settings, updateConversationSettings } = useSettingsStore();
  const conv = settings.conversation;
  const [newCommand, setNewCommand] = useState("");

  const addWhitelistCommand = () => {
    if (newCommand.trim()) {
      updateConversationSettings({
        whitelistCommands: [...conv.whitelistCommands, newCommand.trim()],
      });
      setNewCommand("");
    }
  };

  const removeWhitelistCommand = (cmd: string) => {
    updateConversationSettings({
      whitelistCommands: conv.whitelistCommands.filter((c) => c !== cmd),
    });
  };

  return (
    <div className="space-y-6">
      {/* 对话行为 */}
      <SettingGroup title={t("settings.conversation")} t={th}>
        <div className="space-y-2">
          <SettingRow
            label={t("settings.todoList")}
            description={t("settings.todoList")}
            t={th}
          >
            <Toggle
              checked={conv.useTodoList}
              onChange={(v) => updateConversationSettings({ useTodoList: v })}
              t={th}
            />
          </SettingRow>
          <SettingRow
            label={t("settings.autoFix")}
            description={t("settings.autoFix")}
            t={th}
          >
            <Toggle
              checked={conv.autoCollapseNodes}
              onChange={(v) =>
                updateConversationSettings({ autoCollapseNodes: v })
              }
              t={th}
            />
          </SettingRow>
          <SettingRow
            label={t("ai.systemPrompt")}
            description={t("ai.systemPrompt")}
            t={th}
          >
            <Toggle
              checked={conv.agentProactiveQuestion}
              onChange={(v) =>
                updateConversationSettings({ agentProactiveQuestion: v })
              }
              t={th}
            />
          </SettingRow>
        </div>
      </SettingGroup>

      {/* 代码审查 */}
      <SettingGroup title={t("settings.codeReview")} t={th}>
        <div className="space-y-2">
          <SettingRow
            label={t("settings.autoFix")}
            description={t("settings.autoFix")}
            t={th}
          >
            <Toggle
              checked={conv.autoFixCodeIssues}
              onChange={(v) =>
                updateConversationSettings({ autoFixCodeIssues: v })
              }
              t={th}
            />
          </SettingRow>
          <SettingRow
            label={t("settings.codeReview")}
            description={t("settings.codeReview")}
            t={th}
          >
            <select
              value={conv.codeReviewScope}
              onChange={(e) =>
                updateConversationSettings({
                  codeReviewScope: e.target.value as "none" | "all" | "changed",
                })
              }
              className={`px-3 py-1.5 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText}`}
            >
              <option value="none">None</option>
              <option value="changed">Changed</option>
              <option value="all">All</option>
            </select>
          </SettingRow>
          <SettingRow
            label="Jump after review"
            description="Jump after review"
            t={th}
          >
            <Toggle
              checked={conv.jumpAfterReview}
              onChange={(v) =>
                updateConversationSettings({ jumpAfterReview: v })
              }
              t={th}
            />
          </SettingRow>
        </div>
      </SettingGroup>

      {/* 命令执行 */}
      <SettingGroup title="MCP & Commands" t={th}>
        <div className="space-y-2">
          <SettingRow label="Auto Run MCP" description="Auto Run MCP" t={th}>
            <Toggle
              checked={conv.autoRunMCP}
              onChange={(v) => updateConversationSettings({ autoRunMCP: v })}
              t={th}
            />
          </SettingRow>
          <SettingRow label="Command Mode" description="Command Mode" t={th}>
            <select
              value={conv.commandRunMode}
              onChange={(e) =>
                updateConversationSettings({
                  commandRunMode: e.target.value as "sandbox" | "direct",
                })
              }
              className={`px-3 py-1.5 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText}`}
            >
              <option value="sandbox">Sandbox</option>
              <option value="direct">Direct</option>
            </select>
          </SettingRow>

          {/* Whitelist commands */}
          <ItemCard t={th}>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className={`w-3.5 h-3.5 ${th.text.caption}`} />
              <span className={`text-[0.82rem] ${th.text.label}`}>
                {t("settings.whitelistCommands")}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {conv.whitelistCommands.map((cmd) => (
                <span
                  key={cmd}
                  className={`text-[0.72rem] px-2 py-1 rounded-lg border font-mono flex items-center gap-1 ${th.page.cardBg} ${th.page.cardBorder}`}
                >
                  {cmd}
                  <button
                    onClick={() => removeWhitelistCommand(cmd)}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newCommand}
                onChange={(e) => setNewCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addWhitelistCommand();
                }}
                placeholder={`${t("settings.addNew")  }...`}
                className={`flex-1 px-3 py-1.5 rounded-lg border text-[0.78rem] font-mono ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
              />
              <button
                onClick={addWhitelistCommand}
                className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </ItemCard>
        </div>
      </SettingGroup>

      {/* 通知 */}
      <SettingGroup title={t("settings.volume")} t={th}>
        <div className="space-y-2">
          <SettingRow
            label={t("settings.volume")}
            description={t("settings.volume")}
            t={th}
          >
            <div className="flex items-center gap-2">
              <Volume2 className={`w-3.5 h-3.5 ${th.text.caption}`} />
              <input
                type="range"
                min={0}
                max={100}
                value={conv.volume}
                onChange={(e) =>
                  updateConversationSettings({ volume: Number(e.target.value) })
                }
                className="w-24 accent-violet-500"
              />
              <span
                className={`text-[0.72rem] w-8 text-right tabular-nums ${th.text.secondary}`}
              >
                {conv.volume}%
              </span>
            </div>
          </SettingRow>
        </div>
      </SettingGroup>
    </div>
  );
}

/** 上下文管理 */
export function ContextSection() {
  const th = useThemeTokens();
  const { t } = useI18n();
  const { settings, updateContextSettings } = useSettingsStore();
  const ctx = settings.context;
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docDraft, setDocDraft] = useState<Partial<DocumentSet>>({});
  const [newIgnoreRule, setNewIgnoreRule] = useState("");

  const statusLabels: Record<string, string> = {
    idle: t("common.noData"),
    indexing: t("common.loading"),
    completed: t("common.success"),
    error: t("common.error"),
  };
  const statusColors: Record<string, string> = {
    idle: th.text.muted,
    indexing: th.status.warning,
    completed: th.status.success,
    error: th.status.error,
  };

  const addIgnoreRule = () => {
    if (newIgnoreRule.trim()) {
      updateContextSettings({
        ignoreRules: [...ctx.ignoreRules, newIgnoreRule.trim()],
      });
      setNewIgnoreRule("");
    }
  };

  const removeIgnoreRule = (rule: string) => {
    updateContextSettings({
      ignoreRules: ctx.ignoreRules.filter((r) => r !== rule),
    });
  };

  const addDocSet = () => {
    const newDoc: DocumentSet = {
      id: `doc-${Date.now()}`,
      name: docDraft.name || t("settings.createNew"),
      source: docDraft.source || "url",
      url: docDraft.url,
      localPath: docDraft.localPath,
      enabled: true,
    };
    updateContextSettings({
      documentSets: [...ctx.documentSets, newDoc],
    });
    setDocDraft({});
    setIsAddingDoc(false);
  };

  const removeDocSet = (id: string) => {
    updateContextSettings({
      documentSets: ctx.documentSets.filter((d) => d.id !== id),
    });
  };

  const toggleDocSet = (id: string, enabled: boolean) => {
    updateContextSettings({
      documentSets: ctx.documentSets.map((d) =>
        d.id === id ? { ...d, enabled } : d,
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* 代码索引 */}
      <SettingGroup title={t("settings.codeIndex")} t={th}>
        <ItemCard t={th}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className={`w-4 h-4 ${th.text.accent}`} />
              <span className={`text-[0.82rem] ${th.text.primary}`}>
                {t("settings.codeIndex")}
              </span>
            </div>
            <span className={`text-[0.78rem] ${statusColors[ctx.indexStatus]}`}>
              {statusLabels[ctx.indexStatus]}
            </span>
          </div>
          <button
            onClick={() => updateContextSettings({ indexStatus: "indexing" })}
            className={`mt-2 px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
          >
            {t("common.refresh")}
          </button>
        </ItemCard>
      </SettingGroup>

      {/* 忽略规则 */}
      <SettingGroup title={t("settings.ignoreRules")} t={th}>
        <ItemCard t={th}>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ctx.ignoreRules.map((rule) => (
              <span
                key={rule}
                className={`text-[0.72rem] px-2 py-1 rounded-lg border font-mono flex items-center gap-1 ${th.page.cardBg} ${th.page.cardBorder}`}
              >
                {rule}
                <button
                  onClick={() => removeIgnoreRule(rule)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newIgnoreRule}
              onChange={(e) => setNewIgnoreRule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addIgnoreRule();
              }}
              placeholder={`${t("settings.addNew")  }...`}
              className={`flex-1 px-3 py-1.5 rounded-lg border text-[0.78rem] font-mono ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
            />
            <button
              onClick={addIgnoreRule}
              className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </ItemCard>
      </SettingGroup>

      {/* 文档集 */}
      <SettingGroup title={t("settings.documentSets")} t={th}>
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAddingDoc(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
            >
              <Plus className="w-3.5 h-3.5" />
              {t("settings.addNew")} {t("settings.documentSets")}
            </button>
          </div>

          {isAddingDoc && (
            <ItemCard t={th} className="space-y-3">
              <input
                placeholder={t("settings.documentSets")}
                value={docDraft.name || ""}
                onChange={(e) =>
                  setDocDraft({ ...docDraft, name: e.target.value })
                }
                className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
              />
              <div className="flex gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={docDraft.source !== "local"}
                    onChange={() => setDocDraft({ ...docDraft, source: "url" })}
                    className="accent-violet-500"
                  />
                  <span className={`text-[0.78rem] ${th.text.secondary}`}>
                    URL
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={docDraft.source === "local"}
                    onChange={() =>
                      setDocDraft({ ...docDraft, source: "local" })
                    }
                    className="accent-violet-500"
                  />
                  <span className={`text-[0.78rem] ${th.text.secondary}`}>
                    Local
                  </span>
                </label>
              </div>
              {docDraft.source === "local" ? (
                <input
                  placeholder="Local path"
                  value={docDraft.localPath || ""}
                  onChange={(e) =>
                    setDocDraft({ ...docDraft, localPath: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] font-mono ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
                />
              ) : (
                <input
                  placeholder="Document URL"
                  value={docDraft.url || ""}
                  onChange={(e) =>
                    setDocDraft({ ...docDraft, url: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border text-[0.82rem] font-mono ${th.page.inputBg} ${th.page.inputBorder} ${th.page.inputText} ${th.page.inputFocus} focus:outline-none`}
                />
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsAddingDoc(false);
                    setDocDraft({});
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.ghost} ${th.btn.ghostHover}`}
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={addDocSet}
                  className={`px-3 py-1.5 rounded-lg text-[0.78rem] ${th.btn.accent} ${th.btn.accentHover}`}
                >
                  <Check className="w-3.5 h-3.5 inline mr-1" />
                  {t("settings.addNew")}
                </button>
              </div>
            </ItemCard>
          )}

          {ctx.documentSets.length === 0 ? (
            <EmptyState icon={FileText} message={t("common.noData")} t={th} />
          ) : (
            ctx.documentSets.map((doc) => (
              <ItemCard key={doc.id} t={th}>
                <div className="flex items-center gap-3">
                  <FileText
                    className={`w-4 h-4 ${th.text.caption} flex-shrink-0`}
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-[0.82rem] ${th.text.primary}`}>
                      {doc.name}
                    </span>
                    <div
                      className={`text-[0.72rem] font-mono ${th.text.caption} truncate`}
                    >
                      {doc.source === "url" ? doc.url : doc.localPath}
                    </div>
                  </div>
                  <Toggle
                    checked={doc.enabled}
                    onChange={(v) => toggleDocSet(doc.id, v)}
                    t={th}
                  />
                  <button
                    onClick={() => removeDocSet(doc.id)}
                    className={`p-1.5 rounded-lg ${th.hoverBg}`}
                  >
                    <Trash2 className={`w-3.5 h-3.5 ${th.status.error}`} />
                  </button>
                </div>
              </ItemCard>
            ))
          )}
        </div>
      </SettingGroup>
    </div>
  );
}
