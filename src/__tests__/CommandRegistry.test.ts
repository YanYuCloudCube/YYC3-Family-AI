// ================================================================
// CommandRegistry 单元测试
// 覆盖: 命令注册/查找、命令执行、命令行解析、Tab 补全、
//       内置命令 (ls, cat, head, tail, wc, grep, find, tree,
//       touch, mkdir, rm, mv, cp, echo, date, whoami, open,
//       env, git, npm, node, tsc, help, clear, about, export)
// ================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executeCommand,
  getCommand,
  getAllCommands,
  getCommandNames,
  getCompletions,
  registerCommand,
  type CommandContext,
  type CommandOutput,
} from "../app/components/ide/ai/CommandRegistry";

// ── Helper: build a minimal CommandContext ──
function makeCtx(files: Record<string, string> = {}): CommandContext {
  return {
    cwd: "/project",
    fileContents: files,
    createFile: vi.fn(),
    deleteFile: vi.fn(),
    renameFile: vi.fn(),
    updateFile: vi.fn(),
    openFile: vi.fn(),
    env: { NODE_ENV: "test", USER: "tester" },
    gitBranch: "main",
    gitChanges: [
      { path: "src/a.ts", status: "modified", staged: false },
      { path: "src/b.ts", status: "added", staged: true },
    ],
  };
}

// ================================================================
// 1. Registry operations
// ================================================================

describe("Command Registry — 注册与查找", () => {
  it("getCommand 返回已注册的命令", () => {
    expect(getCommand("help")).toBeDefined();
    expect(getCommand("ls")).toBeDefined();
    expect(getCommand("nonexistent")).toBeUndefined();
  });

  it("getAllCommands 按字母排序", () => {
    const cmds = getAllCommands();
    const names = cmds.map((c) => c.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it("getCommandNames 返回所有命令名", () => {
    const names = getCommandNames();
    expect(names).toContain("ls");
    expect(names).toContain("cat");
    expect(names).toContain("git");
    expect(names).toContain("help");
  });

  it("registerCommand 注册自定义命令后可查找", () => {
    registerCommand({
      name: "__test_custom__",
      description: "test",
      usage: "__test_custom__",
      handler: () => [{ type: "output", text: "custom!" }],
    });
    expect(getCommand("__test_custom__")).toBeDefined();
    const result = executeCommand("__test_custom__", makeCtx());
    expect(result[0].text).toBe("custom!");
  });
});

// ================================================================
// 2. Command execution basics
// ================================================================

describe("executeCommand — 基本执行", () => {
  it("空输入返回空数组", () => {
    expect(executeCommand("", makeCtx())).toEqual([]);
    expect(executeCommand("   ", makeCtx())).toEqual([]);
  });

  it("未知命令返回错误", () => {
    const result = executeCommand("nonexistent_cmd", makeCtx());
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("error");
    expect(result[0].text).toContain("command not found");
  });

  it("支持 && 连接多条命令", () => {
    const ctx = makeCtx();
    const result = executeCommand("pwd && whoami", ctx);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.some((r) => r.text.includes("/project"))).toBe(true);
    expect(result.some((r) => r.text.includes("yyc3-user"))).toBe(true);
  });

  it("&& 遇到错误时停止后续命令", () => {
    const ctx = makeCtx();
    const result = executeCommand("nonexistent && pwd", ctx);
    expect(result.some((r) => r.type === "error")).toBe(true);
    // pwd 不应执行
    expect(result.some((r) => r.text.includes("/project"))).toBe(false);
  });

  it("支持引号解析", () => {
    const result = executeCommand('echo "hello world"', makeCtx());
    expect(result[0].text).toBe("hello world");
  });
});

// ================================================================
// 3. Built-in commands
// ================================================================

describe("内置命令 — pwd", () => {
  it("返回 cwd", () => {
    const result = executeCommand("pwd", makeCtx());
    expect(result[0].text).toBe("/project");
  });
});

describe("内置命令 — echo", () => {
  it("输出参数文本", () => {
    const result = executeCommand("echo foo bar", makeCtx());
    expect(result[0].text).toBe("foo bar");
  });
});

describe("内置命令 — whoami", () => {
  it("返回用户名", () => {
    const result = executeCommand("whoami", makeCtx());
    expect(result[0].text).toBe("yyc3-user");
  });
});

describe("内置命令 — date", () => {
  it("返回日期字符串", () => {
    const result = executeCommand("date", makeCtx());
    expect(result[0].text.length).toBeGreaterThan(0);
  });
});

describe("内置命令 — ls", () => {
  it("列出根目录内容", () => {
    const ctx = makeCtx({
      "src/app/App.tsx": "content",
      "src/utils/helper.ts": "content",
      "package.json": "{}",
    });
    const result = executeCommand("ls", ctx);
    expect(result[0].text).toContain("src");
    expect(result[0].text).toContain("package.json");
  });

  it("列出子目录内容", () => {
    const ctx = makeCtx({
      "src/app/App.tsx": "content",
      "src/utils/helper.ts": "content",
    });
    const result = executeCommand("ls src", ctx);
    expect(result[0].text).toContain("app");
    expect(result[0].text).toContain("utils");
  });

  it("不存在的目录返回错误", () => {
    const result = executeCommand("ls nonexistent", makeCtx());
    expect(result[0].type).toBe("error");
  });

  it("-l 选项输出长格式", () => {
    const ctx = makeCtx({ "readme.md": "hello" });
    const result = executeCommand("ls -l", ctx);
    expect(result[0].text).toContain("readme.md");
    expect(result[0].text).toMatch(/rw/);
  });
});

describe("内置命令 — cat", () => {
  it("显示文件内容", () => {
    const ctx = makeCtx({ "test.txt": "hello world" });
    const result = executeCommand("cat test.txt", ctx);
    expect(result[0].text).toBe("hello world");
  });

  it("文件不存在返回错误", () => {
    const result = executeCommand("cat nonexistent.txt", makeCtx());
    expect(result[0].type).toBe("error");
  });

  it("无参数返回错误", () => {
    const result = executeCommand("cat", makeCtx());
    expect(result[0].type).toBe("error");
  });
});

describe("内置命令 — head / tail", () => {
  const content = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join(
    "\n",
  );

  it("head 默认显示前 10 行", () => {
    const ctx = makeCtx({ "big.txt": content });
    const result = executeCommand("head big.txt", ctx);
    const lines = result[0].text.split("\n");
    expect(lines).toHaveLength(10);
    expect(lines[0]).toBe("line 1");
  });

  it("head -n 5 显示前 5 行", () => {
    const ctx = makeCtx({ "big.txt": content });
    const result = executeCommand("head -n 5 big.txt", ctx);
    const lines = result[0].text.split("\n");
    expect(lines).toHaveLength(5);
  });

  it("tail 默认显示后 10 行", () => {
    const ctx = makeCtx({ "big.txt": content });
    const result = executeCommand("tail big.txt", ctx);
    const lines = result[0].text.split("\n");
    expect(lines).toHaveLength(10);
    expect(lines[lines.length - 1]).toBe("line 20");
  });
});

describe("内置命令 — wc", () => {
  it("统计行数/字数/字节数", () => {
    const ctx = makeCtx({ "test.txt": "hello world\nfoo bar" });
    const result = executeCommand("wc test.txt", ctx);
    expect(result[0].text).toContain("2"); // 2 lines
    expect(result[0].text).toContain("test.txt");
  });

  it("-l 只显示行数", () => {
    const ctx = makeCtx({ "test.txt": "a\nb\nc" });
    const result = executeCommand("wc -l test.txt", ctx);
    expect(result[0].text).toContain("3");
  });
});

describe("内置命令 — grep", () => {
  it("搜索文件内容", () => {
    const ctx = makeCtx({
      "src/app.ts": "const foo = 1\nconst bar = 2\nconst foo2 = 3",
    });
    const result = executeCommand("grep foo src/app.ts", ctx);
    expect(result[0].text).toContain("foo");
    expect(result[0].text.split("\n").length).toBe(2); // 2 matches
  });

  it("全局搜索 *", () => {
    const ctx = makeCtx({
      "a.ts": "import react",
      "b.ts": "no match",
      "c.ts": "import react from",
    });
    const result = executeCommand("grep import *", ctx);
    expect(result[0].text.split("\n").length).toBe(2);
  });

  it("无匹配返回 (no matches)", () => {
    const ctx = makeCtx({ "test.txt": "hello" });
    const result = executeCommand("grep xyz test.txt", ctx);
    expect(result[0].text).toBe("(no matches)");
  });
});

describe("内置命令 — find", () => {
  it("查找所有文件", () => {
    const ctx = makeCtx({ "src/a.ts": "", "src/b.ts": "", "lib/c.ts": "" });
    const result = executeCommand("find", ctx);
    expect(result[0].text.split("\n")).toHaveLength(3);
  });

  it("按 pattern 过滤", () => {
    const ctx = makeCtx({ "src/a.ts": "", "src/b.tsx": "", "lib/c.ts": "" });
    const result = executeCommand("find *.tsx", ctx);
    expect(result[0].text).toContain("b.tsx");
  });
});

describe("内置命令 — tree", () => {
  it("显示文件树结构", () => {
    const ctx = makeCtx({ "src/app/App.tsx": "", "src/utils/helper.ts": "" });
    const result = executeCommand("tree", ctx);
    expect(result[0].text).toContain("src");
    expect(result[0].text).toContain("App.tsx");
    expect(result[0].text).toContain("directories");
    expect(result[0].text).toContain("files");
  });
});

describe("内置命令 — touch", () => {
  it("创建新文件", () => {
    const ctx = makeCtx();
    const result = executeCommand("touch newfile.ts", ctx);
    expect(result[0].type).toBe("success");
    expect(ctx.createFile).toHaveBeenCalledWith("newfile.ts", "");
  });

  it("文件已存在时返回 info", () => {
    const ctx = makeCtx({ "existing.ts": "content" });
    const result = executeCommand("touch existing.ts", ctx);
    expect(result[0].type).toBe("info");
  });
});

describe("内置命令 — mkdir", () => {
  it("创建目录 (通过 .gitkeep)", () => {
    const ctx = makeCtx();
    const result = executeCommand("mkdir newdir", ctx);
    expect(result[0].type).toBe("success");
    expect(ctx.createFile).toHaveBeenCalledWith("newdir/.gitkeep", "");
  });
});

describe("内置命令 — rm", () => {
  it("删除文件", () => {
    const ctx = makeCtx({ "target.ts": "content" });
    const result = executeCommand("rm target.ts", ctx);
    expect(result[0].type).toBe("success");
    expect(ctx.deleteFile).toHaveBeenCalledWith("target.ts");
  });

  it("文件不存在返回错误", () => {
    const result = executeCommand("rm nonexistent.ts", makeCtx());
    expect(result[0].type).toBe("error");
  });
});

describe("内置命令 — mv", () => {
  it("移动/重命名文件", () => {
    const ctx = makeCtx({ "old.ts": "content" });
    const result = executeCommand("mv old.ts new.ts", ctx);
    expect(result[0].type).toBe("success");
    expect(ctx.renameFile).toHaveBeenCalledWith("old.ts", "new.ts");
  });
});

describe("内置命令 — cp", () => {
  it("复制文件", () => {
    const ctx = makeCtx({ "src.ts": "content" });
    const result = executeCommand("cp src.ts dest.ts", ctx);
    expect(result[0].type).toBe("success");
    expect(ctx.createFile).toHaveBeenCalledWith("dest.ts", "content");
  });
});

describe("内置命令 — open", () => {
  it("在编辑器中打开文件", () => {
    const ctx = makeCtx({ "target.ts": "content" });
    const result = executeCommand("open target.ts", ctx);
    expect(result[0].type).toBe("success");
    expect(ctx.openFile).toHaveBeenCalledWith("target.ts");
  });
});

describe("内置命令 — env", () => {
  it("显示环境变量", () => {
    const ctx = makeCtx();
    const result = executeCommand("env", ctx);
    expect(result[0].text).toContain("NODE_ENV=test");
    expect(result[0].text).toContain("USER=tester");
  });
});

describe("内置命令 — git (模拟)", () => {
  it("git status 显示分支和变更", () => {
    const ctx = makeCtx();
    const result = executeCommand("git status", ctx);
    expect(result[0].text).toContain("main");
  });

  it("git branch 显示分支列表", () => {
    const result = executeCommand("git branch", makeCtx());
    expect(result[0].text).toContain("main");
  });

  it("git log 显示日志", () => {
    const result = executeCommand("git log", makeCtx());
    expect(result[0].text).toContain("commit");
  });

  it("无参数显示用法", () => {
    const result = executeCommand("git", makeCtx());
    expect(result[0].text).toContain("usage");
  });
});

describe("内置命令 — npm (模拟)", () => {
  it("npm install 模拟安装", () => {
    const result = executeCommand("npm install", makeCtx());
    expect(result.some((r) => r.type === "success")).toBe(true);
  });

  it("npm run dev 模拟启动", () => {
    const result = executeCommand("npm run dev", makeCtx());
    expect(result.some((r) => r.text.includes("VITE"))).toBe(true);
  });
});

describe("内置命令 — help", () => {
  it("列出所有可用命令", () => {
    const result = executeCommand("help", makeCtx());
    expect(result.some((r) => r.text.includes("ls"))).toBe(true);
    expect(result.some((r) => r.text.includes("cat"))).toBe(true);
  });

  it("help <command> 显示单个命令帮助", () => {
    const result = executeCommand("help ls", makeCtx());
    expect(result.some((r) => r.text.includes("ls"))).toBe(true);
  });
});

describe("内置命令 — clear", () => {
  it("返回 __CLEAR__ 标记", () => {
    const result = executeCommand("clear", makeCtx());
    expect(result[0].text).toBe("__CLEAR__");
  });
});

describe("内置命令 — about", () => {
  it("显示系统信息", () => {
    const result = executeCommand("about", makeCtx());
    expect(result.some((r) => r.text.includes("YYC³"))).toBe(true);
  });
});

// ================================================================
// 4. Tab completion
// ================================================================

describe("getCompletions — Tab 补全", () => {
  it("空输入返回所有命令名", () => {
    const completions = getCompletions("", makeCtx());
    expect(completions.length).toBeGreaterThan(0);
    expect(completions).toContain("ls");
    expect(completions).toContain("cat");
  });

  it("部分命令名返回匹配", () => {
    const completions = getCompletions("he", makeCtx());
    expect(completions).toContain("help");
    expect(completions).toContain("head");
  });

  it("命令后的参数返回文件路径补全", () => {
    const ctx = makeCtx({ "src/app.ts": "", "src/utils.ts": "" });
    const completions = getCompletions("cat src/", ctx);
    expect(completions).toContain("src/app.ts");
    expect(completions).toContain("src/utils.ts");
  });
});
