/**
 * @file: ChatHistoryStore.test.ts
 * @description: 聊天历史存储测试 - 测试聊天记录持久化和历史查询
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-01
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,vitest,unit-test
 */

// @ts-nocheck
// ================================================================
// ChatHistoryStore 单元测试
// 覆盖: 会话管理、消息持久化、跨 scope 导入、边界条件
// ================================================================

import { describe, it, expect, beforeEach } from "vitest";
import {
  listSessions,
  loadMessages,
  saveMessages,
  deleteSession,
  clearAllSessions,
  createSessionId,
  importFromScope,
  listCrossScopeSessions,
  type PersistedMessage,
} from "../app/components/ide/ChatHistoryStore";

// ── Helper ──
function makeMessage(
  role: "user" | "assistant",
  content: string,
): PersistedMessage {
  return {
    id: `msg_${Date.now()}_${Math.random()}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

describe("ChatHistoryStore — 会话列表", () => {
  beforeEach(() => localStorage.clear());

  it("listSessions — 无数据时返回空数组", () => {
    expect(listSessions("ide")).toEqual([]);
    expect(listSessions("chat")).toEqual([]);
  });

  it("saveMessages 后 listSessions 能看到会话", () => {
    const sessionId = "test-session-1";
    const messages = [makeMessage("user", "你好")];

    saveMessages("ide", sessionId, messages);

    const sessions = listSessions("ide");
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(sessionId);
    expect(sessions[0].title).toBe("你好");
  });

  it("会话按 updatedAt 降序排列", () => {
    saveMessages("ide", "session-old", [makeMessage("user", "旧消息")]);
    // 确保时间差
    const later = Date.now() + 1000;
    vi.spyOn(Date, "now").mockReturnValueOnce(later).mockReturnValueOnce(later);
    saveMessages("ide", "session-new", [makeMessage("user", "新消息")]);
    vi.restoreAllMocks();

    const sessions = listSessions("ide");
    expect(sessions[0].id).toBe("session-new");
  });
});

describe("ChatHistoryStore — 消息读写", () => {
  beforeEach(() => localStorage.clear());

  it("loadMessages — 无数据时返回空数组", () => {
    expect(loadMessages("ide", "nonexistent")).toEqual([]);
  });

  it("saveMessages + loadMessages — 往返正确", () => {
    const messages = [
      makeMessage("user", "帮我写一个按钮组件"),
      makeMessage("assistant", "好的，这是一个按钮组件..."),
    ];

    saveMessages("ide", "s1", messages, "gpt-4o");
    const loaded = loadMessages("ide", "s1");

    expect(loaded).toHaveLength(2);
    expect(loaded[0].role).toBe("user");
    expect(loaded[1].role).toBe("assistant");
  });

  it("saveMessages — 超过 200 条自动裁剪", () => {
    const messages: PersistedMessage[] = [];
    for (let i = 0; i < 250; i++) {
      messages.push(makeMessage("user", `消息 ${i}`));
    }

    saveMessages("chat", "large-session", messages);
    const loaded = loadMessages("chat", "large-session");
    expect(loaded.length).toBeLessThanOrEqual(200);
  });

  it("saveMessages — 更新已存在的会话", () => {
    saveMessages("ide", "s1", [makeMessage("user", "第一条")]);
    saveMessages("ide", "s1", [
      makeMessage("user", "第一条"),
      makeMessage("assistant", "回复"),
      makeMessage("user", "第二条"),
    ]);

    const sessions = listSessions("ide");
    expect(sessions).toHaveLength(1); // 仍然只有一个会话

    const loaded = loadMessages("ide", "s1");
    expect(loaded).toHaveLength(3);
  });

  it("saveMessages — title 取自第一条用户消息前 30 字", () => {
    const longMsg =
      "这是一条超过三十个字的消息内容用来测试标题截取是否正确工作的";
    saveMessages("ide", "s1", [makeMessage("user", longMsg)]);

    const sessions = listSessions("ide");
    expect(sessions[0].title).toBe(longMsg.slice(0, 30));
  });

  it("saveMessages — 无用户消息时标题为'新对话'", () => {
    saveMessages("ide", "s1", [makeMessage("assistant", "你好")]);

    const sessions = listSessions("ide");
    expect(sessions[0].title).toBe("新对话");
  });
});

describe("ChatHistoryStore — 删除操作", () => {
  beforeEach(() => localStorage.clear());

  it("deleteSession — 删除会话和消息", () => {
    saveMessages("ide", "s1", [makeMessage("user", "test")]);
    saveMessages("ide", "s2", [makeMessage("user", "test2")]);

    deleteSession("ide", "s1");

    expect(listSessions("ide")).toHaveLength(1);
    expect(loadMessages("ide", "s1")).toEqual([]);
  });

  it("clearAllSessions — 清空全部会话", () => {
    saveMessages("chat", "s1", [makeMessage("user", "a")]);
    saveMessages("chat", "s2", [makeMessage("user", "b")]);
    saveMessages("chat", "s3", [makeMessage("user", "c")]);

    clearAllSessions("chat");

    expect(listSessions("chat")).toEqual([]);
    expect(loadMessages("chat", "s1")).toEqual([]);
    expect(loadMessages("chat", "s2")).toEqual([]);
  });

  it("clearAllSessions — 不影响另一个 scope", () => {
    saveMessages("ide", "s1", [makeMessage("user", "IDE 消息")]);
    saveMessages("chat", "s2", [makeMessage("user", "Chat 消息")]);

    clearAllSessions("chat");

    expect(listSessions("ide")).toHaveLength(1); // IDE scope 不受影响
    expect(listSessions("chat")).toEqual([]);
  });
});

describe("ChatHistoryStore — createSessionId", () => {
  it("生成唯一 ID", () => {
    const id1 = createSessionId();
    const id2 = createSessionId();

    expect(id1).toMatch(/^session_\d+_/);
    expect(id2).toMatch(/^session_\d+_/);
    expect(id1).not.toBe(id2);
  });
});

describe("ChatHistoryStore — 跨 Scope 导入", () => {
  beforeEach(() => localStorage.clear());

  it("importFromScope — 从 IDE 导入到 Chat", () => {
    const messages = [
      makeMessage("user", "IDE 里的对话"),
      makeMessage("assistant", "回复"),
    ];
    saveMessages("ide", "ide-s1", messages);

    const result = importFromScope("ide", "chat", "ide-s1");

    expect(result).not.toBeNull();
    expect((result as any).messageCount).toBe(2);

    const imported = loadMessages("chat", (result as any).newSessionId);
    expect(imported).toHaveLength(2);
    expect(imported[0].content).toBe("IDE 里的对话");
  });

  it("importFromScope — 源会话不存在时返回 null", () => {
    const result = importFromScope("ide", "chat", "nonexistent");
    expect(result).toBeNull();
  });

  it("importFromScope — 源会话消息为空时返回 null", () => {
    // 直接设置空消息的 key
    localStorage.setItem("yyc3_chat_ide_msg_empty-session", "[]");

    const result = importFromScope("ide", "chat", "empty-session");
    expect(result).toBeNull();
  });

  it("listCrossScopeSessions — 列出对�� scope 的会话", () => {
    saveMessages("chat", "chat-s1", [makeMessage("user", "Chat 消息")]);

    const result = listCrossScopeSessions("ide");
    expect(result.scope).toBe("chat");
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].id).toBe("chat-s1");
  });
});

describe("ChatHistoryStore — 边界条件", () => {
  beforeEach(() => localStorage.clear());

  it("localStorage 损坏时 listSessions 返回空数组", () => {
    localStorage.setItem("yyc3_chat_ide_sessions", "not-valid-json");
    expect(listSessions("ide")).toEqual([]);
  });

  it("localStorage 损坏时 loadMessages 返回空数组", () => {
    localStorage.setItem("yyc3_chat_ide_msg_s1", "{broken}");
    expect(loadMessages("ide", "s1")).toEqual([]);
  });

  it("最多保存 20 个会话", () => {
    for (let i = 0; i < 25; i++) {
      saveMessages("ide", `session-${i}`, [makeMessage("user", `消息 ${i}`)]);
    }

    const sessions = listSessions("ide");
    expect(sessions.length).toBeLessThanOrEqual(20);
  });
});
