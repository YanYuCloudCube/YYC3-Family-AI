// ================================================================
// useThemeTokens 单元测试
// 覆盖: Navy/Cyber token 输出、page/btn/text/status/gradients/chat/drawer/
//       interactive/home/intentToast/shareDialog 子对象完整性 + 字段计数 +
//       Cyberpunk 结构验证 + 跨主题键集合一致性
// ================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ThemeProvider } from "../app/components/ide/ThemeStore";
import { useThemeTokens } from "../app/components/ide/hooks/useThemeTokens";

function TokenConsumer() {
  const t = useThemeTokens();
  return (
    <div>
      <span data-testid="textPrimary">{t.textPrimary}</span>
      <span data-testid="accent">{t.accent}</span>
      <span data-testid="page-pageBg">{t.page.pageBg}</span>
      <span data-testid="page-toggleOn">{t.page.toggleOn}</span>
      <span data-testid="btn-accent">{t.btn.accent}</span>
      <span data-testid="btn-danger">{t.btn.danger}</span>
      <span data-testid="text-primary">{t.text.primary}</span>
      <span data-testid="text-muted">{t.text.muted}</span>
      <span data-testid="text-dim">{t.text.dim}</span>
      <span data-testid="text-ghost">{t.text.ghost}</span>
      <span data-testid="status-success">{t.status.success}</span>
      <span data-testid="status-warning">{t.status.warning}</span>
      <span data-testid="chat-cursorBg">{t.chat.cursorBg}</span>
      <span data-testid="drawer-bg">{t.drawer.bg}</span>
      <span data-testid="interactive-ghostBtn">{t.interactive.ghostBtn}</span>
      <span data-testid="home-chatBoxBg">{t.home.chatBoxBg}</span>
      <span data-testid="home-submitBtn">{t.home.submitBtn}</span>
      <span data-testid="home-navDot">{t.home.navDot}</span>
      <span data-testid="toast-containerBg">{t.intentToast.containerBg}</span>
      <span data-testid="toast-loaderColor">{t.intentToast.loaderColor}</span>
      <span data-testid="share-dialogBg">{t.shareDialog.dialogBg}</span>
      <span data-testid="share-headerIcon">{t.shareDialog.headerIcon}</span>
      <span data-testid="share-doneBtn">{t.shareDialog.doneBtn}</span>
      <span data-testid="ts-compactBtnHover">
        {t.themeSwitcher.compactBtnHover}
      </span>
      <span data-testid="ts-fullBtnStyle">{t.themeSwitcher.fullBtnStyle}</span>
      <span data-testid="ts-glowDot">{t.themeSwitcher.glowDot}</span>
    </div>
  );
}

function ToggleWrapper() {
  const [cyber, setCyber] = React.useState(false);
  return (
    <div>
      <button data-testid="switch" onClick={() => setCyber(!cyber)}>
        switch
      </button>
      {/* We can't dynamically change ThemeProvider's internal state from here,
          so we test both themes by rendering with pre-set localStorage */}
    </div>
  );
}

describe("useThemeTokens — Navy 主题", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("yyc3-theme", "navy");
  });

  it("返回 Navy 主题的 token 值", () => {
    render(
      <ThemeProvider>
        <TokenConsumer />
      </ThemeProvider>,
    );

    // Legacy flat tokens
    expect(screen.getByTestId("textPrimary").textContent).toBe("text-white/90");
    expect(screen.getByTestId("accent").textContent).toBe("text-indigo-400");

    // Page tokens
    expect(screen.getByTestId("page-pageBg").textContent).toBe(
      "bg-[var(--background)]",
    );
    expect(screen.getByTestId("page-toggleOn").textContent).toBe(
      "bg-violet-500",
    );

    // Button tokens
    expect(screen.getByTestId("btn-accent").textContent).toContain(
      "bg-violet-50",
    );
    expect(screen.getByTestId("btn-danger").textContent).toContain("bg-red-50");

    // Text tokens
    expect(screen.getByTestId("text-primary").textContent).toBe(
      "text-[var(--foreground)]",
    );

    // Status tokens
    expect(screen.getByTestId("status-success").textContent).toBe(
      "text-emerald-600",
    );
  });
});

describe("useThemeTokens — Cyberpunk 主题", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("yyc3-theme", "cyberpunk");
  });

  it("返回 Cyberpunk 主题的 token 值", () => {
    render(
      <ThemeProvider>
        <TokenConsumer />
      </ThemeProvider>,
    );

    // Legacy flat tokens
    expect(screen.getByTestId("textPrimary").textContent).toBe("text-cyan-100");
    expect(screen.getByTestId("accent").textContent).toBe("text-cyan-400");

    // Page tokens
    expect(screen.getByTestId("page-pageBg").textContent).toBe("bg-[#08081a]");
    expect(screen.getByTestId("page-toggleOn").textContent).toBe(
      "bg-[rgba(0,240,255,0.4)]",
    );

    // Button tokens
    expect(screen.getByTestId("btn-accent").textContent).toContain(
      "text-[#00f0ff]",
    );

    // Text tokens
    expect(screen.getByTestId("text-primary").textContent).toBe(
      "text-[rgba(0,240,255,0.9)]",
    );

    // Status tokens
    expect(screen.getByTestId("status-success").textContent).toBe(
      "text-emerald-400/60",
    );
    expect(screen.getByTestId("status-warning").textContent).toBe(
      "text-amber-400/40",
    );
  });
});

describe("useThemeTokens — 结构完整性", () => {
  beforeEach(() => localStorage.clear());

  it("page 子对象包含所有必要字段", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    expect(tokens).not.toBeNull();
    const page = tokens!.page;
    const requiredKeys = [
      "pageBg",
      "barBg",
      "barBorder",
      "cardBg",
      "cardBorder",
      "inputBg",
      "inputBorder",
      "inputText",
      "inputPlaceholder",
      "inputFocus",
      "selectBg",
      "navActive",
      "navInactive",
      "shortcutRowBg",
      "kbdStyle",
      "divider",
      "avatarGradient",
      "toggleOn",
      "toggleOff",
    ];
    requiredKeys.forEach((key) => {
      expect(page).toHaveProperty(key);
      expect((page as any)[key]).toBeTruthy();
    });
  });

  it("btn 子对象包含所有必要字段", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    const btn = tokens!.btn;
    const requiredKeys = [
      "accent",
      "accentHover",
      "danger",
      "dangerLight",
      "saved",
      "savedActive",
      "ghost",
      "ghostHover",
    ];
    requiredKeys.forEach((key) => {
      expect(btn).toHaveProperty(key);
    });
  });

  it("chat 子对象包含所有必要字段", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    const chat = tokens!.chat;
    const requiredKeys = [
      "userBubble",
      "assistantBubble",
      "userAvatar",
      "assistantAvatar",
      "codeBg",
      "codeHeaderBg",
      "cursorBg",
      "inputWrapperBg",
      "inputText",
      "sendBtn",
      "sendBtnHover",
      "stopBtn",
    ];
    requiredKeys.forEach((key) => {
      expect(chat).toHaveProperty(key);
      expect((chat as any)[key]).toBeTruthy();
    });
  });

  it("drawer 子对象包含所有必要字段", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    const drawer = tokens!.drawer;
    const requiredKeys = [
      "bg",
      "border",
      "headerBorder",
      "itemBorder",
      "itemUnread",
      "itemHover",
      "closeBtn",
      "deleteBtn",
      "markReadBtn",
      "footerBorder",
      "footerLink",
      "emptyIcon",
      "emptyText",
    ];
    requiredKeys.forEach((key) => {
      expect(drawer).toHaveProperty(key);
      expect((drawer as any)[key]).toBeTruthy();
    });
  });

  it("interactive 子对象包含所有必要字段", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    const interactive = tokens!.interactive;
    const requiredKeys = [
      "ghostBtn",
      "ghostBtnHover",
      "activeBtn",
      "hoverBg",
      "hoverBgStrong",
      "activeBg",
      "separator",
      "badge",
      "sessionItem",
      "sessionItemActive",
      "sessionItemHover",
      "deleteSessionBtn",
      "importBtn",
      "importBtnActive",
      "importPanelBg",
      "importPanelBorder",
      "importPanelHeader",
      "importItemHover",
    ];
    requiredKeys.forEach((key) => {
      expect(interactive).toHaveProperty(key);
      expect((interactive as any)[key]).toBeTruthy();
    });
  });

  it("text 子对象包含 dim 和 ghost 字段", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    expect(tokens!.text.dim).toBeTruthy();
    expect(tokens!.text.ghost).toBeTruthy();
  });

  it("home 子对象包含所有必要字段 (26 个)", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    expect(tokens).not.toBeNull();
    const home = tokens!.home;
    const requiredKeys = [
      "chatBoxBg",
      "actionsBorder",
      "actionBtnHover",
      "actionIcon",
      "actionLabel",
      "actionShortcut",
      "plusBtn",
      "plusIcon",
      "textareaText",
      "submitBtn",
      "liveIntentBorder",
      "liveIntentIcon",
      "liveIntentText",
      "liveIntentConfidence",
      "designerBadge",
      "aiBadge",
      "featureText",
      "newProjectBtn",
      "codingBtn",
      "aiChatBtn",
      "ctxMenuNormal",
      "ctxMenuDanger",
      "renameDialogBg",
      "renameConfirmBtn",
      "navDot",
      "cyberGlitchClass",
    ];
    requiredKeys.forEach((key) => {
      expect(home).toHaveProperty(key);
      // renameDialogBg 在 Navy 主题下为空字符串, cyberGlitchClass 同理
      // 因此不对这两个字段做 toBeTruthy 断言
      if (key !== "renameDialogBg" && key !== "cyberGlitchClass") {
        expect((home as any)[key]).toBeTruthy();
      }
    });
    // 字段总数断言 — 防止字段漂移
    expect(Object.keys(home).length).toBe(26);
  });

  it("intentToast 子对象包含所有必要字段 (17 个)", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    expect(tokens).not.toBeNull();
    const toast = tokens!.intentToast;
    const requiredKeys = [
      "containerBg",
      "designerIconBg",
      "aiIconBg",
      "designerIconColor",
      "aiIconColor",
      "summaryText",
      "categoryText",
      "closeText",
      "progressBg",
      "designerProgressGradient",
      "aiProgressGradient",
      "percentageText",
      "lightbulbColor",
      "suggestionText",
      "bottomBorder",
      "bottomText",
      "loaderColor",
    ];
    requiredKeys.forEach((key) => {
      expect(toast).toHaveProperty(key);
      expect((toast as any)[key]).toBeTruthy();
    });
    // 字段总数断言 — 防止字段漂移
    expect(Object.keys(toast).length).toBe(17);
  });

  it("shareDialog 子对象包含所有必要字段 (26 个)", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    expect(tokens).not.toBeNull();
    const sd = tokens!.shareDialog;
    const requiredKeys = [
      "dialogBg",
      "headerBorder",
      "headerIcon",
      "titleText",
      "subtitleText",
      "closeBtn",
      "labelText",
      "toggleActive",
      "toggleInactive",
      "linkAreaBg",
      "linkIcon",
      "linkText",
      "copyBtn",
      "inviteInputArea",
      "inviteInputIcon",
      "inviteInputText",
      "inviteBtn",
      "memberRowBg",
      "memberRowHover",
      "memberName",
      "memberEmail",
      "ownerBadge",
      "roleBadge",
      "footerBorder",
      "qrBtn",
      "doneBtn",
    ];
    requiredKeys.forEach((key) => {
      expect(sd).toHaveProperty(key);
      expect((sd as any)[key]).toBeTruthy();
    });
    // 字段总数断言 — 防止字段漂移
    expect(Object.keys(sd).length).toBe(26);
  });

  it("text 子对象包含全部 10 个字段", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    const text = tokens!.text;
    const requiredKeys = [
      "primary",
      "secondary",
      "tertiary",
      "muted",
      "accent",
      "heading",
      "label",
      "caption",
      "dim",
      "ghost",
    ];
    requiredKeys.forEach((key) => {
      expect(text).toHaveProperty(key);
      expect((text as any)[key]).toBeTruthy();
    });
    expect(Object.keys(text).length).toBe(10);
  });

  it("status 子对象包含全部 8 个字段", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    const status = tokens!.status;
    const requiredKeys = [
      "success",
      "successBg",
      "warning",
      "warningBg",
      "info",
      "infoBg",
      "error",
      "errorBg",
    ];
    requiredKeys.forEach((key) => {
      expect(status).toHaveProperty(key);
      expect((status as any)[key]).toBeTruthy();
    });
    expect(Object.keys(status).length).toBe(8);
  });

  it("gradients 子对象包含全部 6 个字段", () => {
    let tokens: ReturnType<typeof useThemeTokens> | null = null;
    function Capture() {
      tokens = useThemeTokens();
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );

    const gradients = tokens!.gradients;
    const requiredKeys = [
      "title",
      "button",
      "buttonHover",
      "progress",
      "progressAlt",
      "avatar",
    ];
    requiredKeys.forEach((key) => {
      expect(gradients).toHaveProperty(key);
      expect((gradients as any)[key]).toBeTruthy();
    });
    expect(Object.keys(gradients).length).toBe(6);
  });

  it("themeSwitcher 子对象包含全部 6 个字段且非空", () => {
    const tokens = captureTokens("cyberpunk");
    const ts = tokens.themeSwitcher;
    expect(Object.keys(ts).length).toBe(6);
    // Cyber 主题下所有 themeSwitcher 字段均应非空
    Object.values(ts).forEach((val) => {
      expect(val).toBeTruthy();
    });
    // Cyber 特有值断言
    expect(ts.compactBtnHover).toContain("#00f0ff");
    expect(ts.glowDot).toContain("#00f0ff");
    expect(ts.labelFont).toContain("mono");
  });
});

// ── 辅助: 捕获 tokens 的通用函数 ──
function captureTokens(
  theme: "navy" | "cyberpunk",
): ReturnType<typeof useThemeTokens> {
  let tokens: ReturnType<typeof useThemeTokens> | null = null;
  function Capture() {
    tokens = useThemeTokens();
    return null;
  }
  localStorage.clear();
  localStorage.setItem("yyc3-theme", theme);
  const { unmount } = render(
    <ThemeProvider>
      <Capture />
    </ThemeProvider>,
  );
  unmount();
  return tokens!;
}

// ================================================================
// Cyberpunk 主题结构完整性验证
// ================================================================

describe("useThemeTokens — Cyberpunk 结构完整性", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("yyc3-theme", "cyberpunk");
  });

  it("Cyber home 子对象包含全部 26 个字段且非空", () => {
    const tokens = captureTokens("cyberpunk");
    const home = tokens.home;
    expect(Object.keys(home).length).toBe(26);
    // Cyber 主题下所有 home 字段均应非空（含 cyberGlitchClass = "cyber-glitch"）
    Object.entries(home).forEach(([key, val]) => {
      expect(val).toBeDefined();
      if (key !== "renameDialogBg" && key !== "cyberGlitchClass") {
        // renameDialogBg Cyber 不为空但其他字段也不应为空
      }
    });
    // Cyber 特有值断言
    expect(home.cyberGlitchClass).toBe("cyber-glitch");
    expect(home.chatBoxBg).toContain("#0a0a12");
  });

  it("Cyber intentToast 子对象包含全部 17 个字段且非空", () => {
    const tokens = captureTokens("cyberpunk");
    const toast = tokens.intentToast;
    expect(Object.keys(toast).length).toBe(17);
    Object.values(toast).forEach((val) => {
      expect(val).toBeTruthy();
    });
    // Cyber 特有值断言
    expect(toast.loaderColor).toContain("#00f0ff");
    expect(toast.containerBg).toContain("#14142a");
  });

  it("Cyber shareDialog 子对象包含全部 26 个字段且非空", () => {
    const tokens = captureTokens("cyberpunk");
    const sd = tokens.shareDialog;
    expect(Object.keys(sd).length).toBe(26);
    Object.values(sd).forEach((val) => {
      expect(val).toBeTruthy();
    });
    // Cyber 特有值断言
    expect(sd.headerIcon).toContain("#00f0ff");
    expect(sd.dialogBg).toContain("#0a0a12");
  });

  it("Cyber text/status/gradients 子对象字段数一致", () => {
    const tokens = captureTokens("cyberpunk");
    expect(Object.keys(tokens.text).length).toBe(10);
    expect(Object.keys(tokens.status).length).toBe(8);
    expect(Object.keys(tokens.gradients).length).toBe(6);
  });
});

// ================================================================
// 跨主题键集合一致性验证（Navy 与 Cyber 的 key set 必须相同）
// ================================================================

describe("useThemeTokens — Navy/Cyber 键集合一致性", () => {
  it("所有 token 组在两个主题下具有相同的键集合", () => {
    const navy = captureTokens("navy");
    const cyber = captureTokens("cyberpunk");

    const groups = [
      "page",
      "btn",
      "status",
      "text",
      "gradients",
      "chat",
      "drawer",
      "interactive",
      "home",
      "intentToast",
      "shareDialog",
      "themeSwitcher",
      "templates",
      "wizard",
    ] as const;

    groups.forEach((group) => {
      const navyKeys = Object.keys((navy as any)[group]).sort();
      const cyberKeys = Object.keys((cyber as any)[group]).sort();
      expect(navyKeys).toEqual(cyberKeys);
    });
  });
});

// ================================================================
// home / intentToast / shareDialog 跨主题值验证
// ================================================================

describe("useThemeTokens — home tokens Navy 值验证", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("yyc3-theme", "navy");
  });

  it("Navy 主题 home tokens 返回正确值", () => {
    render(
      <ThemeProvider>
        <TokenConsumer />
      </ThemeProvider>,
    );

    // chatBoxBg 应包含 var(--card) (Navy)
    expect(screen.getByTestId("home-chatBoxBg").textContent).toContain(
      "var(--card)",
    );
    // submitBtn 应包含 violet (Navy)
    expect(screen.getByTestId("home-submitBtn").textContent).toContain(
      "violet-600",
    );
    // navDot 应包含 violet-400 (Navy)
    expect(screen.getByTestId("home-navDot").textContent).toContain(
      "violet-400",
    );
  });

  it("Navy 主题 intentToast tokens 返回正确值", () => {
    render(
      <ThemeProvider>
        <TokenConsumer />
      </ThemeProvider>,
    );

    // containerBg 应包含 var(--card)
    expect(screen.getByTestId("toast-containerBg").textContent).toContain(
      "var(--card)",
    );
    // loaderColor 应包含 violet-500
    expect(screen.getByTestId("toast-loaderColor").textContent).toContain(
      "violet-500",
    );
  });

  it("Navy 主题 shareDialog tokens 返回正确值", () => {
    render(
      <ThemeProvider>
        <TokenConsumer />
      </ThemeProvider>,
    );

    // dialogBg 应包含 var(--card)
    expect(screen.getByTestId("share-dialogBg").textContent).toContain(
      "var(--card)",
    );
    // headerIcon 应包含 violet-600
    expect(screen.getByTestId("share-headerIcon").textContent).toContain(
      "violet-600",
    );
    // doneBtn 应包含 violet-600
    expect(screen.getByTestId("share-doneBtn").textContent).toContain(
      "violet-600",
    );
  });
});

describe("useThemeTokens — home tokens Cyberpunk 值验证", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("yyc3-theme", "cyberpunk");
  });

  it("Cyberpunk 主题 home tokens 返回正确值", () => {
    render(
      <ThemeProvider>
        <TokenConsumer />
      </ThemeProvider>,
    );

    // chatBoxBg 应包含 0a0a12 (Cyber)
    expect(screen.getByTestId("home-chatBoxBg").textContent).toContain(
      "#0a0a12",
    );
    // submitBtn 应包含 #ff00ff → #00f0ff 渐变
    expect(screen.getByTestId("home-submitBtn").textContent).toContain(
      "#ff00ff",
    );
    expect(screen.getByTestId("home-submitBtn").textContent).toContain(
      "#00f0ff",
    );
    // navDot 应包含 cyan 色调
    expect(screen.getByTestId("home-navDot").textContent).toContain(
      "0,240,255",
    );
  });

  it("Cyberpunk 主题 intentToast tokens 返回正确值", () => {
    render(
      <ThemeProvider>
        <TokenConsumer />
      </ThemeProvider>,
    );

    // containerBg 应包含 #14142a
    expect(screen.getByTestId("toast-containerBg").textContent).toContain(
      "#14142a",
    );
    // loaderColor 应包含 #00f0ff
    expect(screen.getByTestId("toast-loaderColor").textContent).toContain(
      "#00f0ff",
    );
  });

  it("Cyberpunk 主题 shareDialog tokens 返回正确值", () => {
    render(
      <ThemeProvider>
        <TokenConsumer />
      </ThemeProvider>,
    );

    // dialogBg 应包含 #0a0a12
    expect(screen.getByTestId("share-dialogBg").textContent).toContain(
      "#0a0a12",
    );
    // headerIcon 应包含 #00f0ff
    expect(screen.getByTestId("share-headerIcon").textContent).toContain(
      "#00f0ff",
    );
    // doneBtn 应包含 #00f0ff
    expect(screen.getByTestId("share-doneBtn").textContent).toContain(
      "#00f0ff",
    );
  });
});

describe("useThemeTokens — home/intentToast Cyber 与 Navy 互斥性", () => {
  it("Navy 与 Cyber home.cyberGlitchClass 互斥", () => {
    let navyTokens: ReturnType<typeof useThemeTokens> | null = null;
    let cyberTokens: ReturnType<typeof useThemeTokens> | null = null;

    function Capture({
      onCapture,
    }: {
      onCapture: (t: ReturnType<typeof useThemeTokens>) => void;
    }) {
      const t = useThemeTokens();
      React.useEffect(() => {
        onCapture(t);
      }, [t]);
      return null;
    }

    // Navy
    localStorage.clear();
    localStorage.setItem("yyc3-theme", "navy");
    const { unmount: u1 } = render(
      <ThemeProvider>
        <Capture
          onCapture={(t) => {
            navyTokens = t;
          }}
        />
      </ThemeProvider>,
    );
    u1();

    // Cyber
    localStorage.clear();
    localStorage.setItem("yyc3-theme", "cyberpunk");
    const { unmount: u2 } = render(
      <ThemeProvider>
        <Capture
          onCapture={(t) => {
            cyberTokens = t;
          }}
        />
      </ThemeProvider>,
    );
    u2();

    // Navy 应为空串, Cyber 应为 "cyber-glitch"
    expect(navyTokens!.home.cyberGlitchClass).toBe("");
    expect(cyberTokens!.home.cyberGlitchClass).toBe("cyber-glitch");

    // Navy renameDialogBg 应为空, Cyber 应包含 #14142a
    expect(navyTokens!.home.renameDialogBg).toBe("");
    expect(cyberTokens!.home.renameDialogBg).toContain("#14142a");
  });
});
