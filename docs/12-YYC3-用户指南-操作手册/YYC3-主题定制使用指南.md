# 主题定制使用指南

> **版本**: v1.0.0  
> **适用对象**: 开发者、设计师  
> **最后更新**: 2026-03-31

## 概述

本指南将帮助你定制和使用 YYC3 Family AI 的主题系统，打造独特的视觉体验。

## 快速开始

### 1. 切换主题

```typescript
import { themeManager } from '@/app/components/ide/theme/ThemeManager';

// 切换到深色主题
await themeManager.setTheme('dark');

// 切换到赛博朋克主题
await themeManager.setTheme('cyberpunk');
```

### 2. 查看当前主题

```typescript
const currentTheme = themeManager.getTheme();
console.log('当前主题:', currentTheme.displayName);
```

### 3. 获取所有可用主题

```typescript
import { createThemeAPI } from '@/app/components/ide/theme/ThemeAPI';

const themeAPI = createThemeAPI();
const themes = themeAPI.getThemes();

themes.forEach(theme => {
  console.log(`${theme.displayName}: ${theme.description}`);
});
```

## 创建自定义主题

### 步骤 1: 定义主题配置

```typescript
const customThemeConfig = {
  name: 'my-custom-theme',
  displayName: '我的自定义主题',
  description: '一个温暖舒适的主题',
  colors: {
    primary: '#FF6B6B',      // 主色 - 温暖的红色
    secondary: '#4ECDC4',    // 辅助色 - 清新的青色
    background: '#F7F7F7',   // 背景色 - 柔和的灰色
    surface: '#FFFFFF',      // 表面色 - 纯白
    text: '#2C3E50',         // 文本色 - 深蓝灰
    textSecondary: '#7F8C8D', // 文本次要色 - 灰色
    border: '#E0E0E0',       // 边框色 - 浅灰
    error: '#E74C3C',        // 错误色 - 红色
    warning: '#F39C12',      // 警告色 - 橙色
    success: '#27AE60',      // 成功色 - 绿色
    info: '#3498DB',         // 信息色 - 蓝色
  },
  typography: {
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontSize: 14,
    lineHeight: 1.6,
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
  },
};
```

### 步骤 2: 创建主题

```typescript
await themeManager.createCustomTheme(customThemeConfig);
console.log('自定义主题已创建');
```

### 步骤 3: 应用主题

```typescript
await themeManager.setTheme('my-custom-theme');
```

## 主题导出和导入

### 导出主题

```typescript
const themeAPI = createThemeAPI();

// 导出当前主题为 JSON
const themeJson = themeAPI.exportTheme();
console.log('主题配置:', themeJson);

// 保存到文件
const blob = new Blob([themeJson], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'my-theme.json';
a.click();
```

### 导入主题

```typescript
// 从文件读取
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';
input.onchange = async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  
  // 导入主题
  await themeAPI.importTheme(text);
  console.log('主题已导入');
};
input.click();
```

## 主题定制技巧

### 1. 色彩搭配

使用色彩理论创建和谐的主题：

```typescript
// 互补色方案
const complementaryColors = {
  primary: '#3498DB',    // 蓝色
  secondary: '#E67E22',  // 橙色 (蓝色的互补色)
};

// 类比色方案
const analogousColors = {
  primary: '#E74C3C',    // 红色
  secondary: '#F39C12',  // 橙色
  tertiary: '#F1C40F',   // 黄色
};

// 三色方案
const triadicColors = {
  primary: '#E74C3C',    // 红色
  secondary: '#3498DB',  // 蓝色
  tertiary: '#2ECC71',   // 绿色
};
```

### 2. 深色主题设计

```typescript
const darkThemeConfig = {
  name: 'my-dark-theme',
  displayName: '我的深色主题',
  colors: {
    primary: '#BB86FC',      // 紫色主色
    secondary: '#03DAC6',    // 青色辅助色
    background: '#121212',   // 深黑背景
    surface: '#1E1E1E',      // 表面色
    text: '#FFFFFF',         // 白色文本
    textSecondary: '#B0B0B0', // 灰色次要文本
    border: '#2C2C2C',       // 边框色
    // 深色主题需要特别注意对比度
  },
  // ...
};
```

### 3. 响应式字体

```typescript
const responsiveTypography = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  lineHeight: 1.6,
  // 使用 CSS clamp() 实现响应式
  fontSizeScale: 'clamp(12px, 2vw, 16px)',
};
```

## 主题系统架构

### CSS 变量注入

主题系统使用 CSS 变量实现主题切换：

```css
:root {
  --color-primary: #3498DB;
  --color-secondary: #E67E22;
  --color-background: #F7F7F7;
  --font-family: Inter, sans-serif;
  --font-size: 14px;
  --spacing-md: 16px;
  --border-radius-md: 8px;
}
```

### 组件中使用主题

```typescript
import { useTheme } from '@/app/components/ide/theme/useTheme';

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div style={{
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
    }}>
      <h1>当前主题: {theme.displayName}</h1>
      <button onClick={() => setTheme('dark')}>
        切换到深色主题
      </button>
    </div>
  );
}
```

## 最佳实践

### 1. 保持一致性

- 使用相同的间距比例
- 保持字体大小层级清晰
- 统一圆角和阴影风格

### 2. 注意可访问性

```typescript
// 确保文本和背景有足够对比度
const accessibilityCheck = {
  // WCAG AA 标准: 对比度至少 4.5:1
  textColor: '#2C3E50',
  backgroundColor: '#FFFFFF',
  contrastRatio: 7.2, // 对比度
};
```

### 3. 测试主题

```typescript
// 测试所有内置组件在新主题下的表现
const testTheme = async () => {
  await themeManager.setTheme('my-custom-theme');
  
  // 检查所有组件
  const components = ['Button', 'Input', 'Modal', 'Panel'];
  for (const component of components) {
    const rendered = renderComponent(component);
    expect(rendered).toMatchSnapshot();
  }
};
```

## 常见问题

### Q: 如何创建渐变背景主题?

```typescript
const gradientTheme = {
  // ...
  colors: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    // ...
  },
};
```

### Q: 如何实现主题切换动画?

```typescript
// 添加 CSS 过渡
document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

// 切换主题
await themeManager.setTheme('dark');
```

### Q: 如何在插件中使用主题?

```typescript
import { createPluginAPI } from '@/app/components/ide/llm/PluginAPIManager';

const api = createPluginAPI('my-plugin');

// 获取当前主题
const theme = api.theme.getTheme();

// 监听主题变更
api.events.on('theme:changed', (data) => {
  console.log('主题已变更:', data.themeName);
});
```

## 主题示例库

### Ocean Theme

```typescript
const oceanTheme = {
  name: 'ocean',
  displayName: '海洋主题',
  colors: {
    primary: '#006994',
    secondary: '#40E0D0',
    background: '#F0F8FF',
    surface: '#FFFFFF',
    text: '#1C3D5A',
    textSecondary: '#6B8E9F',
    border: '#B0C4DE',
  },
  // ...
};
```

### Forest Theme

```typescript
const forestTheme = {
  name: 'forest',
  displayName: '森林主题',
  colors: {
    primary: '#228B22',
    secondary: '#90EE90',
    background: '#F5F5DC',
    surface: '#FAFAD2',
    text: '#2F4F4F',
    textSecondary: '#696969',
    border: '#8FBC8F',
  },
  // ...
};
```

### Sunset Theme

```typescript
const sunsetTheme = {
  name: 'sunset',
  displayName: '日落主题',
  colors: {
    primary: '#FF6347',
    secondary: '#FFD700',
    background: '#FFF8DC',
    surface: '#FFEFD5',
    text: '#8B4513',
    textSecondary: '#A0522D',
    border: '#DEB887',
  },
  // ...
};
```

## 相关资源

- [主题系统 API 文档](../API文档/主题系统API文档.md)
- [架构文档 - 主题系统](../架构文档/系统架构.md#主题系统)
- [CSS 变量参考](./CSS变量参考.md)

---

**维护者**: YYC3 团队  
**反馈渠道**: [GitHub Issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues)
