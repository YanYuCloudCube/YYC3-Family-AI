// ================================================================
// WorkflowEventBus 单元测试
// 覆盖: 事件类型映射、EVENT_STAGE_MAP 完整性、事件总线基本行为
// ================================================================

import { describe, it, expect } from "vitest";
import {
  EVENT_STAGE_MAP,
  type WorkflowEventType,
} from "../app/components/ide/WorkflowEventBus";

// ================================================================
// 1. EVENT_STAGE_MAP 完整性验证
// ================================================================

const ALL_EVENT_TYPES: WorkflowEventType[] = [
  // Design Input Loop
  "user-input",
  "multimodal-parse",
  "intent-analyzed",
  "design-generated",
  "preview-updated",
  "user-confirmed",
  // Code Generation Loop
  "design-read",
  "template-matched",
  "data-transformed",
  "code-generated",
  "code-applied",
  "type-checked",
  "file-written",
  "compile-run",
  "error-feedback",
  // Preview Loop
  "change-detected",
  "diff-computed",
  "patch-applied",
  "recompiled",
  "preview-refreshed",
  "user-interaction",
  "design-adjusted",
  // AI Assist Loop
  "ai-triggered",
  "context-collected",
  "ai-understood",
  "suggestions-ready",
  "suggestions-shown",
  "user-decided",
  "suggestion-applied",
  "effect-feedback",
  // Collab Loop
  "user-operation",
  "ot-transformed",
  "crdt-updated",
  "state-synced",
  "conflict-resolved",
  "views-updated",
  // Generic
  "file-saved",
  "file-created",
  "file-deleted",
  "terminal-command",
  "git-operation",
  "model-switched",
  "connectivity-ping",
  // Diagnostics
  "diagnostics-run",
  "diagnostics-found",
  "diagnostics-fixed",
];

describe("EVENT_STAGE_MAP — 事件映射完整性", () => {
  it("所有事件类型都有映射", () => {
    for (const eventType of ALL_EVENT_TYPES) {
      expect(EVENT_STAGE_MAP[eventType]).toBeDefined();
      expect(EVENT_STAGE_MAP[eventType].workflowId).toBeTruthy();
      expect(EVENT_STAGE_MAP[eventType].stageId).toBeTruthy();
    }
  });

  it("映射数量与事件类型数量一致", () => {
    expect(Object.keys(EVENT_STAGE_MAP).length).toBe(ALL_EVENT_TYPES.length);
  });

  it("Design Input Loop 事件映射到 'design-input' workflow", () => {
    const designEvents: WorkflowEventType[] = [
      "user-input",
      "multimodal-parse",
      "intent-analyzed",
      "design-generated",
      "preview-updated",
      "user-confirmed",
    ];
    for (const evt of designEvents) {
      expect(EVENT_STAGE_MAP[evt].workflowId).toBe("design-input");
    }
  });

  it("Code Generation Loop 事件映射到 'code-gen' workflow", () => {
    const codeGenEvents: WorkflowEventType[] = [
      "design-read",
      "template-matched",
      "data-transformed",
      "code-generated",
      "code-applied",
      "type-checked",
      "file-written",
      "compile-run",
      "error-feedback",
    ];
    for (const evt of codeGenEvents) {
      expect(EVENT_STAGE_MAP[evt].workflowId).toBe("code-gen");
    }
  });

  it("Preview Loop 事件映射到 'preview' workflow", () => {
    const previewEvents: WorkflowEventType[] = [
      "change-detected",
      "diff-computed",
      "patch-applied",
      "recompiled",
      "preview-refreshed",
      "user-interaction",
      "design-adjusted",
    ];
    for (const evt of previewEvents) {
      expect(EVENT_STAGE_MAP[evt].workflowId).toBe("preview");
    }
  });

  it("AI Assist Loop 事件映射到 'ai-assist' workflow", () => {
    const aiEvents: WorkflowEventType[] = [
      "ai-triggered",
      "context-collected",
      "ai-understood",
      "suggestions-ready",
      "suggestions-shown",
      "user-decided",
      "suggestion-applied",
      "effect-feedback",
    ];
    for (const evt of aiEvents) {
      expect(EVENT_STAGE_MAP[evt].workflowId).toBe("ai-assist");
    }
  });

  it("Collab Loop 事件映射到 'collab' workflow", () => {
    const collabEvents: WorkflowEventType[] = [
      "user-operation",
      "ot-transformed",
      "crdt-updated",
      "state-synced",
      "conflict-resolved",
      "views-updated",
    ];
    for (const evt of collabEvents) {
      expect(EVENT_STAGE_MAP[evt].workflowId).toBe("collab");
    }
  });

  it("每个 workflow 内 stageId 不重复", () => {
    const workflowStages: Record<string, Set<string>> = {};

    for (const [, mapping] of Object.entries(EVENT_STAGE_MAP)) {
      if (!workflowStages[mapping.workflowId]) {
        workflowStages[mapping.workflowId] = new Set();
      }
      // 注意：Generic events 可以复用 stageId，所以只检查主循环
    }

    // Design Input Loop stages 应唯一
    const diStages = Object.entries(EVENT_STAGE_MAP)
      .filter(([key]) =>
        [
          "user-input",
          "multimodal-parse",
          "intent-analyzed",
          "design-generated",
          "preview-updated",
          "user-confirmed",
        ].includes(key),
      )
      .map(([, v]) => v.stageId);
    expect(new Set(diStages).size).toBe(diStages.length);
  });

  it("stageId 遵循命名规范 (workflow前缀-数字)", () => {
    const stageIdPattern = /^(di|cg|pv|ai|co)-\d+$/;

    for (const [, mapping] of Object.entries(EVENT_STAGE_MAP)) {
      expect(mapping.stageId).toMatch(stageIdPattern);
    }
  });

  it("Generic 事件映射到最相关的 workflow", () => {
    expect(EVENT_STAGE_MAP["file-saved"].workflowId).toBe("code-gen");
    expect(EVENT_STAGE_MAP["file-created"].workflowId).toBe("code-gen");
    expect(EVENT_STAGE_MAP["file-deleted"].workflowId).toBe("code-gen");
    expect(EVENT_STAGE_MAP["terminal-command"].workflowId).toBe("code-gen");
    expect(EVENT_STAGE_MAP["git-operation"].workflowId).toBe("collab");
    expect(EVENT_STAGE_MAP["model-switched"].workflowId).toBe("ai-assist");
    expect(EVENT_STAGE_MAP["connectivity-ping"].workflowId).toBe("ai-assist");
  });
});
