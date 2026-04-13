/**
 * @file: settings/KeybindingsEditor.tsx
 * @description: 可编辑的快捷键映射 UI — 支持录制新快捷键、恢复默认、冲突检测
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-03-17
 * @updated: 2026-03-17
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: settings,keybindings,editor,shortcuts
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Keyboard, RotateCcw, AlertTriangle } from "lucide-react";
import { useThemeTokens } from "../ide/hooks/useThemeTokens";
import { useSettingsStore } from "../ide/stores/useSettingsStore";
import {
  getEffectiveKeybindings,
  normalizeKeyEvent,
  type KeybindingDef,
} from "../ide/SettingsBridge";
import { SettingGroup } from "./SettingsShared";

export function KeybindingsEditor() {
  const t = useThemeTokens();
  const { settings, updateGeneralSettings } = useSettingsStore();
  const bindings = getEffectiveKeybindings();
  const customBindings = settings.general.customKeybindings;

  const [recordingAction, setRecordingAction] = useState<string | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string>("");
  const [conflict, setConflict] = useState<string | null>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // 录制快捷键
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!recordingAction) return;

      e.preventDefault();
      e.stopPropagation();

      const normalized = normalizeKeyEvent(e);
      // 忽略纯修饰键
      if (
        [
          "ctrl",
          "shift",
          "alt",
          "ctrl+shift",
          "ctrl+alt",
          "shift+alt",
          "ctrl+shift+alt",
        ].includes(normalized)
      ) {
        return;
      }

      setRecordedKeys(normalized);

      // 检测冲突
      const conflicting = bindings.find(
        (b) => b.keys === normalized && b.action !== recordingAction,
      );
      setConflict(conflicting ? conflicting.label : null);
    },
    [recordingAction, bindings],
  );

  useEffect(() => {
    if (recordingAction) {
      document.addEventListener("keydown", handleKeyDown, { capture: true });
      return () =>
        document.removeEventListener("keydown", handleKeyDown, {
          capture: true,
        });
    }
  }, [recordingAction, handleKeyDown]);

  const startRecording = (action: string) => {
    setRecordingAction(action);
    setRecordedKeys("");
    setConflict(null);
  };

  const confirmRecording = () => {
    if (!recordingAction || !recordedKeys) return;
    updateGeneralSettings({
      customKeybindings: {
        ...customBindings,
        [recordingAction]: recordedKeys,
      },
    });
    setRecordingAction(null);
    setRecordedKeys("");
    setConflict(null);
  };

  const cancelRecording = () => {
    setRecordingAction(null);
    setRecordedKeys("");
    setConflict(null);
  };

  const resetBinding = (action: string) => {
    const updated = { ...customBindings };
    delete updated[action];
    updateGeneralSettings({ customKeybindings: updated });
  };

  const resetAll = () => {
    updateGeneralSettings({
      keybindingScheme: "vscode",
      customKeybindings: {},
    });
  };

  const isCustomized = (action: string) => !!customBindings[action];

  // 按分类分组
  const categories = Array.from(new Set(bindings.map((b) => b.category)));

  return (
    <div className="space-y-6">
      {/* 方案选择 + 重置 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard className={`w-4 h-4 ${t.text.accent}`} />
          <span className={`text-[0.82rem] ${t.text.primary}`}>
            快捷键方案:{" "}
            {settings.general.keybindingScheme === "vscode"
              ? "VS Code"
              : "自定义"}
          </span>
          {Object.keys(customBindings).length > 0 && (
            <span
              className={`text-[0.62rem] px-1.5 py-0.5 rounded ${t.status.warningBg}`}
            >
              {Object.keys(customBindings).length} 项自定义
            </span>
          )}
        </div>
        <button
          onClick={resetAll}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          恢复默认
        </button>
      </div>

      {/* 按分类展示 */}
      {categories.map((category) => {
        const catBindings = bindings.filter((b) => b.category === category);
        return (
          <SettingGroup key={category} title={category} t={t}>
            <div className="space-y-1">
              {catBindings.map((binding) => {
                const isRecording = recordingAction === binding.action;
                const customized = isCustomized(binding.action);

                return (
                  <div
                    key={binding.action}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                      isRecording
                        ? `ring-1 ring-violet-500/50 ${t.page.cardBg}`
                        : t.page.shortcutRowBg
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`text-[0.82rem] ${t.text.secondary}`}>
                        {binding.label}
                      </span>
                      {customized && (
                        <span
                          className={`text-[0.58rem] px-1 py-0.5 rounded ${t.status.warningBg}`}
                        >
                          已修改
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isRecording ? (
                        <div className="flex items-center gap-2">
                          <div
                            ref={inputRef}
                            className={`px-3 py-1 rounded-lg border min-w-[120px] text-center text-[0.78rem] font-mono animate-pulse ${t.page.inputBg} ${t.page.inputBorder} ${t.page.inputText}`}
                          >
                            {recordedKeys || "按下快捷键..."}
                          </div>
                          {conflict && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle
                                className={`w-3 h-3 ${t.status.warning}`}
                              />
                              <span
                                className={`text-[0.62rem] ${t.status.warning}`}
                              >
                                冲突: {conflict}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={confirmRecording}
                            disabled={!recordedKeys}
                            className={`px-2 py-1 rounded text-[0.72rem] ${
                              recordedKeys
                                ? `${t.btn.accent} ${t.btn.accentHover}`
                                : "opacity-40 cursor-not-allowed"
                            }`}
                          >
                            确认
                          </button>
                          <button
                            onClick={cancelRecording}
                            className={`px-2 py-1 rounded text-[0.72rem] ${t.btn.ghost} ${t.btn.ghostHover}`}
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <>
                          <kbd
                            className={`text-[0.72rem] px-2 py-1 rounded border font-mono cursor-pointer transition-all hover:ring-1 hover:ring-violet-500/30 ${t.page.kbdStyle}`}
                            onClick={() => startRecording(binding.action)}
                            title="点击修改"
                          >
                            {binding.keys}
                          </kbd>
                          {customized && (
                            <button
                              onClick={() => resetBinding(binding.action)}
                              className={`p-1 rounded ${t.hoverBg}`}
                              title="恢复默认"
                            >
                              <RotateCcw
                                className={`w-3 h-3 ${t.text.caption}`}
                              />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SettingGroup>
        );
      })}

      {/* 提示 */}
      <div
        className={`flex items-start gap-2 px-4 py-3 rounded-xl border ${t.page.cardBg} ${t.page.cardBorder}`}
      >
        <Keyboard className={`w-4 h-4 flex-shrink-0 mt-0.5 ${t.status.info}`} />
        <div className={`text-[0.72rem] ${t.text.muted}`}>
          点击快捷键区域可录制新的快捷键组合。自定义快捷键会覆盖默认映射，但不会影响浏览器原生快捷键。
          修改后的快捷键会在 IDE 页面自动生效。
        </div>
      </div>
    </div>
  );
}
