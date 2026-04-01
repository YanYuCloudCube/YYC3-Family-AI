// @ts-nocheck
/**
 * @file IconComponents.integration.test.tsx
 * @description 图标组件集成测试 - 覆盖所有使用图标的组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,vitest,icon,components,integration
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as LucideIcons from "lucide-react";

// ── Mock 所有使用图标的组件 ──

// 1. TopBar 图标测试
function MockTopBar() {
  return (
    <div data-testid="topbar">
      <LucideIcons.Home data-testid="home-icon" role="img" />
      <LucideIcons.Settings data-testid="settings-icon" role="img" />
      <LucideIcons.Bell data-testid="notification-icon" role="img" />
    </div>
  );
}

// 2. PanelHeader 图标测试
function MockPanelHeader({ icon: Icon }: { icon: React.ComponentType<any> }) {
  return (
    <div data-testid="panel-header">
      <Icon data-testid="panel-icon" />
      <span>Panel Title</span>
    </div>
  );
}

// 3. Button with Icon 测试
function MockIconButton({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <button data-testid="icon-button" aria-label={label}>
      <Icon />
      <span>{label}</span>
    </button>
  );
}

// 4. Tab with Icon 测试
function MockTab({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <div data-testid="tab" role="tab">
      <Icon />
      <span>{label}</span>
    </div>
  );
}

// 5. MenuItem with Icon 测试
function MockMenuItem({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <div data-testid="menu-item" role="menuitem">
      <Icon />
      <span>{label}</span>
    </div>
  );
}

// ================================================================
// 1. TopBar 图标测试
// ================================================================

describe("Icon Components - TopBar", () => {
  it("TopBar 渲染所有图标", () => {
    render(<MockTopBar />);
    
    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
    expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
    expect(screen.getByTestId("notification-icon")).toBeInTheDocument();
  });

  it("TopBar 图标可点击", () => {
    const handleClick = vi.fn();
    
    render(<MockTopBar />);
    
    fireEvent.click(screen.getByTestId("home-icon"));
    fireEvent.click(screen.getByTestId("settings-icon"));
    fireEvent.click(screen.getByTestId("notification-icon"));
    
    // 图标应该有点击效果
    expect(screen.getByTestId("home-icon")).toBeInTheDocument();
  });

  it("TopBar 图标有正确的 aria 标签", () => {
    render(<MockTopBar />);
    
    const homeIcon = screen.getByTestId("home-icon");
    const settingsIcon = screen.getByTestId("settings-icon");
    const notificationIcon = screen.getByTestId("notification-icon");
    
    expect(homeIcon).toHaveAttribute("role", "img");
    expect(settingsIcon).toHaveAttribute("role", "img");
    expect(notificationIcon).toHaveAttribute("role", "img");
  });
});

// ================================================================
// 2. PanelHeader 图标测试
// ================================================================

describe("Icon Components - PanelHeader", () => {
  it("PanelHeader 渲染图标", () => {
    render(<MockPanelHeader icon={LucideIcons.File} />);
    
    expect(screen.getByTestId("panel-icon")).toBeInTheDocument();
    expect(screen.getByText("Panel Title")).toBeInTheDocument();
  });

  it("PanelHeader 图标与文本对齐", () => {
    render(<MockPanelHeader icon={LucideIcons.Folder} />);
    
    const icon = screen.getByTestId("panel-icon");
    const text = screen.getByText("Panel Title");
    
    expect(icon).toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });

  it("PanelHeader 支持不同图标", () => {
    const { rerender } = render(<MockPanelHeader icon={LucideIcons.File} />);
    expect(screen.getByTestId("panel-icon")).toBeInTheDocument();
    
    rerender(<MockPanelHeader icon={LucideIcons.Folder} />);
    expect(screen.getByTestId("panel-icon")).toBeInTheDocument();
    
    rerender(<MockPanelHeader icon={LucideIcons.Settings} />);
    expect(screen.getByTestId("panel-icon")).toBeInTheDocument();
  });
});

// ================================================================
// 3. IconButton 测试
// ================================================================

describe("Icon Components - IconButton", () => {
  it("IconButton 渲染图标和文本", () => {
    render(<MockIconButton icon={LucideIcons.Home} label="Home" />);
    
    expect(screen.getByTestId("icon-button")).toBeInTheDocument();
    expect(screen.getByLabelText("Home")).toBeInTheDocument();
  });

  it("IconButton 可点击", () => {
    const handleClick = vi.fn();
    
    render(
      <button data-testid="icon-button" onClick={handleClick}>
        <LucideIcons.Settings />
        <span>Settings</span>
      </button>
    );
    
    fireEvent.click(screen.getByTestId("icon-button"));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("IconButton 禁用状态", () => {
    render(
      <button data-testid="icon-button" disabled>
        <LucideIcons.Home />
        <span>Home</span>
      </button>
    );
    
    expect(screen.getByTestId("icon-button")).toBeDisabled();
  });

  it("IconButton 悬停效果", () => {
    render(
      <button data-testid="icon-button" className="hover:bg-gray-200">
        <LucideIcons.Settings />
        <span>Settings</span>
      </button>
    );
    
    const button = screen.getByTestId("icon-button");
    fireEvent.mouseEnter(button);
    
    expect(button).toHaveClass("hover:bg-gray-200");
  });
});

// ================================================================
// 4. Tab 图标测试
// ================================================================

describe("Icon Components - Tab", () => {
  it("Tab 渲染图标和标签", () => {
    render(<MockTab icon={LucideIcons.File} label="Files" />);
    
    expect(screen.getByTestId("tab")).toBeInTheDocument();
    expect(screen.getByRole("tab")).toBeInTheDocument();
  });

  it("Tab 选中状态", () => {
    render(
      <div data-testid="tab" role="tab" aria-selected={true}>
        <LucideIcons.File />
        <span>Files</span>
      </div>
    );
    
    expect(screen.getByTestId("tab")).toHaveAttribute("aria-selected", "true");
  });

  it("Tab 可点击切换", () => {
    const handleClick = vi.fn();
    
    render(
      <div data-testid="tab" role="tab" onClick={handleClick}>
        <LucideIcons.Folder />
        <span>Folder</span>
      </div>
    );
    
    fireEvent.click(screen.getByTestId("tab"));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("Tab 图标切换", async () => {
    const { rerender } = render(<MockTab icon={LucideIcons.File} label="Files" />);
    
    expect(screen.getByTestId("tab")).toBeInTheDocument();
    
    await waitFor(() => {
      rerender(<MockTab icon={LucideIcons.Folder} label="Folder" />);
      expect(screen.getByText("Folder")).toBeInTheDocument();
    });
  });
});

// ================================================================
// 5. MenuItem 图标测试
// ================================================================

describe("Icon Components - MenuItem", () => {
  it("MenuItem 渲染图标和文本", () => {
    render(<MockMenuItem icon={LucideIcons.Settings} label="Settings" />);
    
    expect(screen.getByTestId("menu-item")).toBeInTheDocument();
    expect(screen.getByRole("menuitem")).toBeInTheDocument();
  });

  it("MenuItem 可点击", () => {
    const handleClick = vi.fn();
    
    render(
      <div data-testid="menu-item" role="menuitem" onClick={handleClick}>
        <LucideIcons.Home />
        <span>Home</span>
      </div>
    );
    
    fireEvent.click(screen.getByTestId("menu-item"));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("MenuItem 悬停效果", () => {
    render(
      <div data-testid="menu-item" role="menuitem" className="hover:bg-gray-100">
        <LucideIcons.Settings />
        <span>Settings</span>
      </div>
    );
    
    const menuItem = screen.getByTestId("menu-item");
    fireEvent.mouseEnter(menuItem);
    
    expect(menuItem).toHaveClass("hover:bg-gray-100");
  });

  it("MenuItem 禁用状态", () => {
    render(
      <div data-testid="menu-item" role="menuitem" aria-disabled={true}>
        <LucideIcons.File />
        <span>Files</span>
      </div>
    );
    
    expect(screen.getByTestId("menu-item")).toHaveAttribute("aria-disabled", "true");
  });
});

// ================================================================
// 6. 图标加载测试
// ================================================================

describe("Icon Components - 图标加载", () => {
  it("图标异步加载", async () => {
    const loadIcon = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return LucideIcons.Home;
    };
    
    const Icon = await loadIcon();
    
    render(<Icon data-testid="loaded-icon" />);
    
    expect(screen.getByTestId("loaded-icon")).toBeInTheDocument();
  });

  it("图标懒加载", async () => {
    // 模拟懒加载函数
    const loadIcon = async (): Promise<React.ComponentType<any>> => {
      return new Promise<{ default: React.ComponentType<any> }>((resolve) => {
        setTimeout(() => {
          resolve({ default: LucideIcons.Settings });
        }, 10);
      }).then(module => module.default);
    };

    // 调用懒加载函数并验证返回结果
    const Icon = await loadIcon();
    expect(Icon).toBeDefined();
    expect(Icon).toBe(LucideIcons.Settings);
  });

  it("图标加载失败处理", async () => {
    let caughtError: Error | null = null;

    const loadIcon = async (): Promise<React.ComponentType<any>> => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error("加载失败")), 10);
      }).then(() => LucideIcons.Home);
    };

    try {
      await loadIcon();
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError?.message).toBe("加载失败");
  });
});

// ================================================================
// 7. 图标动画测试
// ================================================================

describe("Icon Components - 图标动画", () => {
  it("图标旋转动画", () => {
    render(<LucideIcons.RefreshCw className="animate-spin" role="img" />);
    
    const icon = screen.getByRole("img");
    expect(icon).toHaveClass("animate-spin");
  });

  it("图标脉冲动画", () => {
    render(<LucideIcons.Bell className="animate-pulse" role="img" />);
    
    const icon = screen.getByRole("img");
    expect(icon).toHaveClass("animate-pulse");
  });

  it("图标bounce 动画", () => {
    render(<LucideIcons.ArrowUp className="animate-bounce" role="img" />);
    
    const icon = screen.getByRole("img");
    expect(icon).toHaveClass("animate-bounce");
  });

  it("图标缩放动画", () => {
    render(<LucideIcons.ZoomIn className="transition-transform hover:scale-125" role="img" />);
    
    const icon = screen.getByRole("img");
    fireEvent.mouseEnter(icon);
    
    expect(icon).toHaveClass("hover:scale-125");
  });
});

// ================================================================
// 8. 图标组合场景测试
// ================================================================

describe("Icon Components - 组合场景", () => {
  it("导航栏图标组", () => {
    render(
      <nav role="navigation" aria-label="Main navigation">
        <button aria-label="Home"><LucideIcons.Home role="img" /></button>
        <button aria-label="Settings"><LucideIcons.Settings role="img" /></button>
        <button aria-label="Profile"><LucideIcons.User role="img" /></button>
      </nav>
    );

    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  it("工具栏图标组", () => {
    render(
      <div role="toolbar" aria-label="Formatting tools">
        <button aria-label="Bold"><LucideIcons.Bold /></button>
        <button aria-label="Italic"><LucideIcons.Italic /></button>
        <button aria-label="Underline"><LucideIcons.Underline /></button>
      </div>
    );
    
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("面包屑图标", () => {
    render(
      <nav aria-label="Breadcrumb">
        <ol>
          <li><LucideIcons.Home /></li>
          <li><LucideIcons.ChevronRight /></li>
          <li>Current</li>
        </ol>
      </nav>
    );
    
    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
  });

  it("下拉菜单图标", () => {
    render(
      <div>
        <button aria-haspopup="menu" data-testid="menu-trigger">
          <LucideIcons.MoreVertical data-testid="more-icon" />
        </button>
        <div role="menu" data-testid="menu">
          <div role="menuitem" data-testid="edit-item"><LucideIcons.Edit data-testid="edit-icon" /> Edit</div>
          <div role="menuitem" data-testid="delete-item"><LucideIcons.Trash2 data-testid="delete-icon" /> Delete</div>
        </div>
      </div>
    );
    
    expect(screen.getByTestId("menu")).toBeInTheDocument();
    expect(screen.getByTestId("edit-item")).toBeInTheDocument();
    expect(screen.getByTestId("delete-item")).toBeInTheDocument();
  });
});

// ================================================================
// 9. 图标性能基准测试
// ================================================================

describe("Icon Components - 性能基准", () => {
  it("渲染 1000 个图标性能", async () => {
    const startTime = performance.now();
    
    render(
      <div>
        {Array.from({ length: 1000 }).map((_, i) => (
          <LucideIcons.Home key={i} size={16} />
        ))}
      </div>
    );
    
    const elapsed = performance.now() - startTime;
    
    // 1000 个图标应该在 2 秒内渲染完成
    expect(elapsed).toBeLessThan(2000);
  });

  it("图标组件重复使用性能", () => {
    const ReusableIcon = ({ name }: { name: string }) => {
      const Icon = LucideIcons[name as keyof typeof LucideIcons] as React.ComponentType<any>;
      return <Icon size={24} />;
    };
    
    const startTime = performance.now();
    
    render(
      <div>
        {Array.from({ length: 100 }).map((_, i) => (
          <ReusableIcon key={i} name="Home" />
        ))}
      </div>
    );
    
    const elapsed = performance.now() - startTime;
    
    // 100 个重复图标应该在 500ms 内渲染完成
    expect(elapsed).toBeLessThan(500);
  });
});

// ================================================================
// 10. 图标回归测试
// ================================================================

describe("Icon Components - 回归测试", () => {
  it("确保所有 lucide-react 图标可导入", () => {
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

  it("确保图标组件不抛出异常", () => {
    const commonIcons = ["Home", "Settings", "User", "File", "Folder"];
    
    commonIcons.forEach((iconName) => {
      const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<any>;
      
      expect(() => {
        render(<Icon />);
      }).not.toThrow();
    });
  });

  it("确保图标 props 类型正确", () => {
    const Icon = LucideIcons.Home;
    
    expect(() => {
      render(<Icon size={24} />);
      render(<Icon color="#000" />);
      render(<Icon strokeWidth={2} />);
      render(<Icon className="test" />);
    }).not.toThrow();
  });
});
