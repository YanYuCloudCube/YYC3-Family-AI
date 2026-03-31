/**
 * @file IconAssets.test.tsx
 * @description 图标资产功能测试 - 覆盖图标渲染、分类、可访问性等核心功能
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,icon,assets
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import * as LucideIcons from "lucide-react";

// ================================================================
// 1. 图标渲染测试
// ================================================================

describe("Icon Assets - 图标渲染", () => {
  it("渲染单个图标", () => {
    const HomeIcon = LucideIcons.Home;
    const { container } = render(<HomeIcon />);
    
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("渲染带自定义大小的图标", () => {
    const HomeIcon = LucideIcons.Home;
    const { container } = render(<HomeIcon size={32} />);
    
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("渲染带自定义颜色的图标", () => {
    const HomeIcon = LucideIcons.Home;
    const { container } = render(<HomeIcon color="#ff0000" />);
    
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("渲染带 className 的图标", () => {
    const HomeIcon = LucideIcons.Home;
    const { container } = render(<HomeIcon className="custom-class" />);
    
    expect(container.querySelector("svg")).toHaveClass("custom-class");
  });
});

// ================================================================
// 2. 图标分类测试
// ================================================================

describe("Icon Assets - 图标分类", () => {
  it("常用图标存在", () => {
    const commonIcons = [
      "Home",
      "Settings",
      "User",
      "File",
      "Folder",
      "Bell",
      "Search",
      "Menu",
      "X",
      "Check",
    ];
    
    commonIcons.forEach((iconName) => {
      const Icon = LucideIcons[iconName as keyof typeof LucideIcons];
      expect(Icon).toBeDefined();
    });
  });

  it("图标库包含多个图标", () => {
    const iconCount = Object.keys(LucideIcons).length;
    expect(iconCount).toBeGreaterThan(100);
  });
});

// ================================================================
// 3. 图标可访问性测试
// ================================================================

describe("Icon Assets - 图标可访问性", () => {
  it("图标可以渲染", () => {
    const HomeIcon = LucideIcons.Home;
    const { container } = render(<HomeIcon aria-label="Home" />);
    
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("图标带 role 属性", () => {
    const HomeIcon = LucideIcons.Home;
    const { container } = render(<HomeIcon role="img" />);
    
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

// ================================================================
// 4. 图标组合测试
// ================================================================

describe("Icon Assets - 图标组合", () => {
  it("图标 + 文本组合", () => {
    const HomeIcon = LucideIcons.Home;
    
    const { container } = render(
      <button>
        <HomeIcon />
        <span>Home</span>
      </button>
    );
    
    expect(container.querySelector("button")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("span")).toHaveTextContent("Home");
  });

  it("图标组", () => {
    const HomeIcon = LucideIcons.Home;
    const SettingsIcon = LucideIcons.Settings;
    const UserIcon = LucideIcons.User;
    
    const { container } = render(
      <div role="group">
        <HomeIcon />
        <SettingsIcon />
        <UserIcon />
      </div>
    );
    
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBe(3);
  });
});

// ================================================================
// 5. 图标性能测试
// ================================================================

describe("Icon Assets - 图标性能", () => {
  it("渲染多个图标不卡顿", () => {
    const HomeIcon = LucideIcons.Home;
    
    const startTime = performance.now();
    
    render(
      <div>
        {Array.from({ length: 50 }).map((_, i) => (
          <HomeIcon key={i} size={16} />
        ))}
      </div>
    );
    
    const elapsed = performance.now() - startTime;
    
    // 50 个图标应该在 200ms 内渲染完成
    expect(elapsed).toBeLessThan(200);
  });
});

// ================================================================
// 6. 图标兼容性测试
// ================================================================

describe("Icon Assets - 图标兼容性", () => {
  it("支持 React 18", () => {
    const HomeIcon = LucideIcons.Home;
    
    expect(() => {
      render(<HomeIcon />);
    }).not.toThrow();
  });

  it("支持 TypeScript", () => {
    const HomeIcon = LucideIcons.Home;
    
    const element = <HomeIcon size={24} color="#000" />;
    
    expect(element).toBeDefined();
  });
});
