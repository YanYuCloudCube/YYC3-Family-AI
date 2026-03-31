// ================================================================
// ThemeStore 单元测试
// 覆盖: 主题初始化、切换、localStorage 持久化
// ================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  ThemeProvider,
  useTheme,
  type ThemeId,
} from "../app/components/ide/ThemeStore";

// Test consumer component
function ThemeConsumer() {
  const { theme, setTheme, toggleTheme, isCyber } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="isCyber">{String(isCyber)}</span>
      <button data-testid="toggle" onClick={toggleTheme}>
        Toggle
      </button>
      <button data-testid="set-cyber" onClick={() => setTheme("cyberpunk")}>
        Cyber
      </button>
      <button data-testid="set-navy" onClick={() => setTheme("navy")}>
        Navy
      </button>
    </div>
  );
}

describe("ThemeStore — 初始化", () => {
  beforeEach(() => localStorage.clear());

  it("默认主题为 navy", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("navy");
    expect(screen.getByTestId("isCyber").textContent).toBe("false");
  });

  it("从 localStorage 恢复 cyberpunk 主题", () => {
    localStorage.setItem("yyc3-theme", "cyberpunk");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("cyberpunk");
    expect(screen.getByTestId("isCyber").textContent).toBe("true");
  });

  it("localStorage 值无效时使用默认 navy", () => {
    localStorage.setItem("yyc3-theme", "invalid-theme");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("navy");
  });
});

describe("ThemeStore — 切换", () => {
  beforeEach(() => localStorage.clear());

  it("toggleTheme — navy → cyberpunk", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("cyberpunk");
  });

  it("toggleTheme — cyberpunk → navy", () => {
    localStorage.setItem("yyc3-theme", "cyberpunk");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("navy");
  });

  it("setTheme — 直接设置主题", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTestId("set-cyber"));
    expect(screen.getByTestId("theme").textContent).toBe("cyberpunk");

    fireEvent.click(screen.getByTestId("set-navy"));
    expect(screen.getByTestId("theme").textContent).toBe("navy");
  });
});

describe("ThemeStore — 持久化", () => {
  beforeEach(() => localStorage.clear());

  it("切换主题时保存到 localStorage", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTestId("set-cyber"));
    expect(localStorage.getItem("yyc3-theme")).toBe("cyberpunk");
  });

  it("切换后 document 应有正确的 class", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    // 初始状态
    expect(document.documentElement.classList.contains("navy")).toBe(true);

    fireEvent.click(screen.getByTestId("toggle"));
    expect(document.documentElement.classList.contains("cyberpunk")).toBe(true);
    expect(document.documentElement.classList.contains("navy")).toBe(false);
  });
});

describe("ThemeStore — useTheme outside Provider", () => {
  it("在 Provider 外部使用 useTheme 返回默认值", () => {
    // 不包裹 ThemeProvider
    render(<ThemeConsumer />);

    expect(screen.getByTestId("theme").textContent).toBe("navy");
    expect(screen.getByTestId("isCyber").textContent).toBe("false");
  });
});
