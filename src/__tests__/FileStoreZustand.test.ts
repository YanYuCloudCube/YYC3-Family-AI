/**
 * @file FileStoreZustand.test.ts
 * @description 文件状态管理测试 - 测试文件内容、标签页和 Git 状态
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,unit-test
 */

// @ts-nocheck
// ================================================================
// FileStore Zustand 单元测试
// 覆盖: 文件 CRUD、标签页管理、Git 操作、格式化、项目初始化
// ================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { useFileStoreZustand } from "../app/components/ide/stores/useFileStoreZustand";

// Helper: 直接调用 store (非 React hook 方式)
const store = () => useFileStoreZustand.getState();
const reset = () => {
  useFileStoreZustand.setState({
    fileContents: { "src/app/App.tsx": "export default function App() {}" },
    openTabs: [{ path: "src/app/App.tsx", modified: false }],
    activeFile: "src/app/App.tsx",
    gitBranch: "main",
    gitChanges: [],
    gitLog: [],
  });
};

describe("FileStore — 文件操作", () => {
  beforeEach(reset);

  it("updateFile — 更新内容并标记 tab 为 modified", () => {
    store().updateFile("src/app/App.tsx", "const a = 1");
    expect(store().fileContents["src/app/App.tsx"]).toBe("const a = 1");
    expect(store().openTabs[0].modified).toBe(true);
  });

  it("updateFile — 自动添加 git change", () => {
    store().updateFile("src/app/App.tsx", "changed");
    const change = store().gitChanges.find((c) => c.path === "src/app/App.tsx");
    expect(change).toBeDefined();
    expect((change as any).status).toBe("modified");
    expect((change as any).staged).toBe(false);
  });

  it("updateFile — 同一文件多次修改不重复 git change", () => {
    store().updateFile("src/app/App.tsx", "v1");
    store().updateFile("src/app/App.tsx", "v2");
    const changes = store().gitChanges.filter(
      (c) => c.path === "src/app/App.tsx",
    );
    expect(changes).toHaveLength(1);
  });

  it("createFile — 添加新文件和 git untracked 标记", () => {
    store().createFile("src/utils.ts", "export const util = 1");
    expect(store().fileContents["src/utils.ts"]).toBe("export const util = 1");
    const change = store().gitChanges.find((c) => c.path === "src/utils.ts");
    expect(change).toBeDefined();
    expect((change as any).status).toBe("untracked");
  });

  it("createFile — 默认内容为空字符串", () => {
    store().createFile("src/empty.ts");
    expect(store().fileContents["src/empty.ts"]).toBe("");
  });

  it("deleteFile — 删除文件内容、关闭 tab、添加 git deleted", () => {
    store().createFile("src/temp.ts", "temp");
    store().openFile("src/temp.ts");
    store().setActiveFile("src/temp.ts");

    store().deleteFile("src/temp.ts");

    expect(store().fileContents["src/temp.ts"]).toBeUndefined();
    expect(
      store().openTabs.find((t) => t.path === "src/temp.ts"),
    ).toBeUndefined();
    expect(store().activeFile).toBe("src/app/App.tsx"); // 切回默认
    const change = store().gitChanges.find((c) => c.path === "src/temp.ts");
    expect((change as any).status).toBe("deleted");
  });

  it("renameFile — 文件内容迁移，旧路径删除", () => {
    store().createFile("src/old.ts", "content");
    store().openFile("src/old.ts");
    store().setActiveFile("src/old.ts");

    store().renameFile("src/old.ts", "src/new.ts");

    expect(store().fileContents["src/old.ts"]).toBeUndefined();
    expect(store().fileContents["src/new.ts"]).toBe("content");
    expect(store().activeFile).toBe("src/new.ts");
    expect(store().openTabs.find((t) => t.path === "src/new.ts")).toBeDefined();
  });
});

describe("FileStore — 标签页管理", () => {
  beforeEach(reset);

  it("openFile — 打开并设为 active", () => {
    store().createFile("src/test.ts", "");
    store().openFile("src/test.ts");
    expect(store().activeFile).toBe("src/test.ts");
    expect(
      store().openTabs.find((t) => t.path === "src/test.ts"),
    ).toBeDefined();
  });

  it("openFile — 已打开的文件不重复添加 tab", () => {
    store().openFile("src/app/App.tsx");
    store().openFile("src/app/App.tsx");
    const count = store().openTabs.filter(
      (t) => t.path === "src/app/App.tsx",
    ).length;
    expect(count).toBe(1);
  });

  it("closeTab — 关闭 tab 并切换 active", () => {
    store().createFile("src/a.ts", "");
    store().openFile("src/a.ts");

    store().closeTab("src/a.ts");
    expect(store().openTabs.find((t) => t.path === "src/a.ts")).toBeUndefined();
    expect(store().activeFile).toBe("src/app/App.tsx");
  });

  it("closeTab — 保持至少一个 tab（不能关闭最后一个）", () => {
    // 只有一个 tab 的情况
    store().closeTab("src/app/App.tsx");
    expect(store().openTabs.length).toBeGreaterThanOrEqual(1);
  });

  it("closeOtherTabs — 只保留指定 tab", () => {
    store().createFile("src/a.ts", "");
    store().createFile("src/b.ts", "");
    store().openFile("src/a.ts");
    store().openFile("src/b.ts");

    store().closeOtherTabs("src/a.ts");
    expect(store().openTabs).toHaveLength(1);
    expect(store().openTabs[0].path).toBe("src/a.ts");
    expect(store().activeFile).toBe("src/a.ts");
  });

  it("closeAllTabs — 恢复到默认 App.tsx", () => {
    store().createFile("src/a.ts", "");
    store().openFile("src/a.ts");

    store().closeAllTabs();
    expect(store().openTabs).toHaveLength(1);
    expect(store().openTabs[0].path).toBe("src/app/App.tsx");
    expect(store().activeFile).toBe("src/app/App.tsx");
  });
});

describe("FileStore — Git 操作", () => {
  beforeEach(() => {
    reset();
    // 添加一些 git changes
    store().updateFile("src/app/App.tsx", "modified content");
    store().createFile("src/new-file.ts", "new");
  });

  it("stageFile — 暂存指定文件", () => {
    store().stageFile("src/app/App.tsx");
    const change = store().gitChanges.find((c) => c.path === "src/app/App.tsx");
    expect((change as any).staged).toBe(true);
  });

  it("unstageFile — 取消暂存", () => {
    store().stageFile("src/app/App.tsx");
    store().unstageFile("src/app/App.tsx");
    const change = store().gitChanges.find((c) => c.path === "src/app/App.tsx");
    expect((change as any).staged).toBe(false);
  });

  it("stageAll — 暂存所有变更", () => {
    store().stageAll();
    expect(store().gitChanges.every((c) => c.staged)).toBe(true);
  });

  it("unstageAll — 取消所有暂存", () => {
    store().stageAll();
    store().unstageAll();
    expect(store().gitChanges.every((c) => !c.staged)).toBe(true);
  });

  it("commitChanges — 提交暂存文件并清除 git changes", () => {
    store().stageAll();
    const changeCount = store().gitChanges.length;

    store().commitChanges("test commit");

    expect(store().gitChanges).toHaveLength(0);
    expect(store().gitLog[0].message).toBe("test commit");
    expect(store().gitLog[0].branch).toBe("main");
  });

  it("commitChanges — 无暂存文件时不操作", () => {
    const logBefore = store().gitLog.length;
    store().commitChanges("empty commit");
    expect(store().gitLog.length).toBe(logBefore);
  });

  it("commitChanges — 提交后清除已暂存文件的 modified 标记", () => {
    store().stageFile("src/app/App.tsx");
    store().commitChanges("fix: update app");
    const tab = store().openTabs.find((t) => t.path === "src/app/App.tsx");
    expect(tab?.modified).toBe(false);
  });

  it("setGitBranch — 切换分支", () => {
    store().setGitBranch("feature/test");
    expect(store().gitBranch).toBe("feature/test");
  });
});

describe("FileStore — 格式化", () => {
  beforeEach(reset);

  it("formatCurrentFile — JSON 格式化", () => {
    store().createFile("data.json", '{"a":1,"b":2}');
    store().openFile("data.json");
    store().formatCurrentFile();
    expect(store().fileContents["data.json"]).toBe(
      JSON.stringify({ a: 1, b: 2 }, null, 2),
    );
  });

  it("formatCurrentFile — 非 JSON 文件应用简单缩进格式化", () => {
    store().createFile("test.ts", "function hello() {\nreturn 1\n}");
    store().openFile("test.ts");
    store().formatCurrentFile();
    const formatted = store().fileContents["test.ts"];
    expect(formatted).toBeTruthy();
  });
});

describe("FileStore — 项目初始化", () => {
  beforeEach(reset);

  it("initializeProject — 替换全部文件和状态", () => {
    const files = {
      "src/index.ts": "console.warn('hello')",
      "src/utils.ts": "export const PI = 3.14",
    };

    store().initializeProject(files, "src/index.ts");

    expect(Object.keys(store().fileContents)).toHaveLength(2);
    expect(store().fileContents["src/index.ts"]).toBe("console.warn('hello')");
    expect(store().activeFile).toBe("src/index.ts");
    expect(store().openTabs).toHaveLength(1);
    expect(store().gitChanges).toHaveLength(0);
    expect(store().gitBranch).toBe("main");
  });

  it("initializeProject — 默认入口文件为 src/app/App.tsx", () => {
    store().initializeProject({ "src/app/App.tsx": "app" });
    expect(store().activeFile).toBe("src/app/App.tsx");
  });
});

describe("FileStore — getFileTree", () => {
  beforeEach(reset);

  it("生成正确的文件树结构", () => {
    store().createFile("src/components/Button.tsx", "button");
    store().createFile("src/components/Input.tsx", "input");
    store().createFile("src/utils/format.ts", "format");

    const tree = store().getFileTree();
    expect(tree).toBeDefined();
    expect(Array.isArray(tree)).toBe(true);

    // 根节点应有 src 文件夹
    const srcNode = tree.find((n) => n.name === "src");
    expect(srcNode).toBeDefined();
    expect((srcNode as any).type).toBe("folder");
  });
});
