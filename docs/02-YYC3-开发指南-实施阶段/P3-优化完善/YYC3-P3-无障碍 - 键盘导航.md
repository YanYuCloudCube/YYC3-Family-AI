# YYC3-P3-无障碍 - 键盘导航

**版本**: v1.0.0  
**创建日期**: 2026-03-19  
**最后更新**: 2026-03-19  
**状态**: ✅ 稳定

---

## 📊 概述

键盘导航是无障碍访问 (Accessibility) 的核心功能，支持:

- ⌨️ **Tab 键导航**: 在可聚焦元素间切换
- 🔥 **快捷键**: 快速执行常用操作
- 🎯 **焦点管理**: 控制焦点位置
- ♿ **屏幕阅读器**: 配合读屏软件使用

---

## 🎯 目标

- 提升无障碍访问体验
- 支持纯键盘操作
- 符合 WCAG 2.1 标准
- 覆盖所有交互场景

---

## 📋 配置说明

### 1. 使用 Hook

```tsx
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";

function MyComponent() {
  const { containerRef, focusFirst, focusLast } = useKeyboardNavigation({
    enabled: true,
    shortcuts: {
      "Ctrl+S": () => save(),
      "Escape": () => close(),
    },
    focusTrap: false,
  });
  
  return (
    <div ref={containerRef}>
      {/* 内容 */}
    </div>
  );
}
```

### 2. 快捷键配置

```tsx
const shortcuts = {
  // 单键
  "Enter": handleSubmit,
  "Escape": handleClose,
  "ArrowUp": handleUp,
  "ArrowDown": handleDown,
  
  // 组合键
  "Ctrl+S": handleSave,
  "Ctrl+Shift+P": handlePrint,
  "Alt+N": handleNew,
  
  // 多个修饰符
  "Ctrl+Shift+S": handleSaveAs,
};

useKeyboardNavigation({ shortcuts });
```

### 3. 焦点陷阱

用于模态框等需要限制焦点的场景:

```tsx
function Modal() {
  const { containerRef } = useKeyboardNavigation({
    focusTrap: true,
  });
  
  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      <h2>模态框标题</h2>
      <button>确定</button>
      <button>取消</button>
    </div>
  );
}
```

---

## 🔧 使用示例

### 全局快捷键

```tsx
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";

function App() {
  const shortcuts = {
    "Ctrl+Shift+P": () => navigate("/projects"),
    "Ctrl+Shift+A": () => navigate("/ai-chat"),
    "Ctrl+Shift+S": () => navigate("/settings"),
    "Ctrl+K": () => openCommandPalette(),
    "Ctrl+/": () => openHelp(),
  };
  
  useKeyboardNavigation({ shortcuts, enabled: true });
  
  return <MainLayout />;
}
```

### 表单导航

```tsx
function Form() {
  const { containerRef, focusFirst } = useKeyboardNavigation();
  
  return (
    <form ref={containerRef}>
      <input name="username" aria-label="用户名" />
      <input name="email" aria-label="邮箱" />
      <input name="password" type="password" aria-label="密码" />
      <button type="submit">提交</button>
      <button type="button" onClick={() => focusFirst()}>重置</button>
    </form>
  );
}
```

### 菜单导航

```tsx
function Menu() {
  const { containerRef } = useKeyboardNavigation({
    shortcuts: {
      "ArrowDown": () => navigateToNextItem(),
      "ArrowUp": () => navigateToPrevItem(),
      "Enter": () => selectCurrentItem(),
      "Escape": () => closeMenu(),
    },
  });
  
  return (
    <ul ref={containerRef} role="menu">
      <li role="menuitem">选项 1</li>
      <li role="menuitem">选项 2</li>
      <li role="menuitem">选项 3</li>
    </ul>
  );
}
```

---

## ⚠️ 注意事项

### 1. 可聚焦元素

确保所有交互元素可聚焦:

```tsx
// ✅ 正确 - 原生可聚焦
<button>按钮</button>
<input type="text" />
<a href="/link">链接</a>

// ❌ 错误 - 需要添加 tabIndex
<div onClick={handleClick}>点击我</div>

// ✅ 正确 - 添加 tabIndex
<div 
  onClick={handleClick}
  tabIndex={0}
  role="button"
  onKeyDown={(e) => e.key === "Enter" && handleClick()}
>
  点击我
</div>
```

### 2. 焦点顺序

使用 `tabIndex` 控制焦点顺序:

```tsx
<div>
  <input tabIndex={1} />
  <input tabIndex={2} />
  <input tabIndex={3} />
</div>
```

### 3. 焦点可见性

确保焦点可见:

```css
/* 不要移除焦点样式 */
:focus {
  outline: 2px solid #0ea5e9;
  outline-offset: 2px;
}

/* 自定义焦点样式 */
:focus-visible {
  outline: 2px solid var(--ide-accent);
  outline-offset: 2px;
}
```

---

## 📊 快捷键参考

### 全局快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl+Shift+P` | 命令面板 | 打开快速搜索 |
| `Ctrl+Shift+A` | AI 对话 | 打开 AI 助手 |
| `Ctrl+Shift+S` | 设置 | 打开设置页面 |
| `Ctrl+K` | 快速搜索 | 搜索文件/功能 |
| `Ctrl+/` | 帮助 | 打开快捷键帮助 |
| `Ctrl+` ` | 终端 | 切换终端面板 |

### 编辑器快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Ctrl+S` | 保存 | 保存当前文件 |
| `Ctrl+F` | 查找 | 搜索文本 |
| `Ctrl+H` | 替换 | 查找并替换 |
| `Ctrl+Z` | 撤销 | 撤销操作 |
| `Ctrl+Y` | 重做 | 重做操作 |

### 导航快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Alt+←` | 后退 | 返回上一页 |
| `Alt+→` | 前进 | 前往下一页 |
| `Home` | 顶部 | 滚动到顶部 |
| `End` | 底部 | 滚动到底部 |

---

## 🎯 最佳实践

### 1. 快捷键冲突检测

```tsx
const reservedKeys = [
  "F1", "F2", "F3", "F4", "F5", "F6",
  "F7", "F8", "F9", "F10", "F11", "F12",
  "Alt+Tab", "Alt+F4", "Ctrl+Alt+Del",
];

function validateShortcut(shortcut: string): boolean {
  return !reservedKeys.includes(shortcut);
}
```

### 2. 快捷键提示

```tsx
function Button({ shortcut, children }) {
  return (
    <button>
      {children}
      <kbd className="shortcut-hint">{shortcut}</kbd>
    </button>
  );
}

// 使用
<Button shortcut="Ctrl+S">保存</Button>
```

### 3. 无障碍属性

```tsx
<button
  aria-label="保存文件"
  aria-keyshortcuts="Ctrl+S"
  title="保存 (Ctrl+S)"
>
  保存
</button>
```

---

## 📚 相关文档

- [WCAG 2.1 标准](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN 无障碍指南](https://developer.mozilla.org/zh-CN/docs/Web/Accessibility)
- [键盘导航模式](https://www.w3.org/WAI/ARIA/apg/patterns/)

---

<div align="center">

> 「***YanYuCloudCube***」  
> 「***<admin@0379.email>***」  
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**维护团队**: YanYuCloudCube Team

</div>
