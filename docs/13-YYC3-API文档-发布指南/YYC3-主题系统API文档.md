# 主题系统 API 文档

> **版本**: v1.0.0  
> **最后更新**: 2026-03-31  
> **维护团队**: YYC3 团队

## 概述

主题系统提供了完整的主题管理功能，包括主题切换、自定义主题、CSS 变量注入等核心能力。

## 核心 API

### ThemeManager

主题管理器，负责主题的加载、切换和持久化。

#### 方法

##### `setTheme(themeName: string): Promise<void>`

设置当前主题。

**参数**:
- `themeName`: 主题名称（'light' | 'dark' | 'cyberpunk' | 'custom'）

**返回值**: `Promise<void>`

**示例**:
```typescript
import { themeManager } from '@/app/components/ide/theme/ThemeManager';

await themeManager.setTheme('cyberpunk');
```

##### `getTheme(): ThemeConfig`

获取当前主题配置。

**返回值**: `ThemeConfig`

**示例**:
```typescript
const currentTheme = themeManager.getTheme();
console.log(currentTheme.name); // 'cyberpunk'
```

##### `createCustomTheme(config: CustomThemeConfig): Promise<void>`

创建自定义主题。

**参数**:
- `config`: 自定义主题配置

**返回值**: `Promise<void>`

**示例**:
```typescript
await themeManager.createCustomTheme({
  name: 'my-theme',
  colors: {
    primary: '#00ff88',
    secondary: '#ff0088',
    background: '#1a1a2e',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
  },
});
```

### ThemeAPI

主题 API 工厂，提供统一的主题访问接口。

#### 方法

##### `getThemes(): ThemeInfo[]`

获取所有可用主题。

**返回值**: `ThemeInfo[]`

**示例**:
```typescript
import { createThemeAPI } from '@/app/components/ide/theme/ThemeAPI';

const themeAPI = createThemeAPI();
const themes = themeAPI.getThemes();
// [
//   { name: 'light', displayName: '浅色主题', description: '...' },
//   { name: 'dark', displayName: '深色主题', description: '...' },
//   ...
// ]
```

##### `applyTheme(themeName: string): Promise<void>`

应用指定主题。

**参数**:
- `themeName`: 主题名称

**返回值**: `Promise<void>`

##### `exportTheme(): string`

导出当前主题配置为 JSON 字符串。

**返回值**: `string`

##### `importTheme(jsonString: string): Promise<void>`

从 JSON 字符串导入主题配置。

**参数**:
- `jsonString`: JSON 格式的主题配置

**返回值**: `Promise<void>`

### CSSVariableInjector

CSS 变量注入器，将主题配置注入到 DOM。

#### 方法

##### `inject(theme: ThemeConfig): void`

注入主题 CSS 变量到 `:root` 选择器。

**参数**:
- `theme`: 主题配置对象

**示例**:
```typescript
import { CSSVariableInjector } from '@/app/components/ide/theme/CSSVariableInjector';

const injector = new CSSVariableInjector();
injector.inject(currentTheme);
```

##### `remove(): void`

移除已注入的 CSS 变量。

## 类型定义

### ThemeConfig

```typescript
interface ThemeConfig {
  /** 主题名称 */
  name: string;
  /** 主题显示名称 */
  displayName: string;
  /** 主题描述 */
  description?: string;
  /** 颜色配置 */
  colors: ThemeColors;
  /** 字体配置 */
  typography: ThemeTypography;
  /** 间距配置 */
  spacing?: ThemeSpacing;
  /** 圆角配置 */
  borderRadius?: ThemeBorderRadius;
  /** 阴影配置 */
  shadows?: ThemeShadows;
}
```

### ThemeColors

```typescript
interface ThemeColors {
  /** 主色 */
  primary: string;
  /** 辅助色 */
  secondary: string;
  /** 背景色 */
  background: string;
  /** 表面色 */
  surface: string;
  /** 文本色 */
  text: string;
  /** 文本次要色 */
  textSecondary: string;
  /** 边框色 */
  border: string;
  /** 错误色 */
  error?: string;
  /** 警告色 */
  warning?: string;
  /** 成功色 */
  success?: string;
  /** 信息色 */
  info?: string;
}
```

### ThemeTypography

```typescript
interface ThemeTypography {
  /** 字体族 */
  fontFamily: string;
  /** 基础字号 */
  fontSize: number;
  /** 行高 */
  lineHeight: number;
  /** 字重映射 */
  fontWeight?: {
    light: number;
    regular: number;
    medium: number;
    bold: number;
  };
}
```

## 内置主题

### 浅色主题 (light)

- 明亮的背景色
- 适合白天使用
- 高对比度文本

### 深色主题 (dark)

- 深色背景
- 保护眼睛
- 适合夜间使用

### 赛博朋克主题 (cyberpunk)

- 未来科技感
- 霓虹色彩
- 发光效果

### 自定义主题 (custom)

- 完全可定制
- 支持所有配置项
- 可导入导出

## 事件系统

主题系统支持事件监听：

### 主题变更事件

```typescript
import { eventBus } from '@/app/components/ide/llm/PluginAPIManager';

eventBus.on('theme:changed', (data) => {
  console.log('主题已变更:', data.themeName);
});
```

### 主题创建事件

```typescript
eventBus.on('theme:created', (data) => {
  console.log('新主题已创建:', data.themeName);
});
```

## 存储机制

主题系统使用以下存储：

1. **localStorage**: 存储当前主题名称
2. **CSS 变量**: 注入到 `:root` 选择器
3. **Zustand Store**: 运行时状态管理

## 性能优化

### 懒加载

内置主题按需加载，减少初始包大小。

### 缓存机制

主题配置缓存到 localStorage，避免重复解析。

### CSS 变量优化

使用 CSS 变量实现主题切换，无需重新渲染组件。

## 错误处理

### 主题不存在

```typescript
try {
  await themeManager.setTheme('non-existent');
} catch (error) {
  console.error('主题不存在:', error.message);
}
```

### 配置验证失败

```typescript
try {
  await themeManager.createCustomTheme(invalidConfig);
} catch (error) {
  console.error('配置验证失败:', error.message);
}
```

## 最佳实践

### 1. 主题切换动画

```typescript
// 添加淡入淡出动画
document.body.style.transition = 'background-color 0.3s ease';
await themeManager.setTheme('dark');
```

### 2. 主题持久化

```typescript
// 自动保存到 localStorage
await themeManager.setTheme('cyberpunk');
// 下次启动时自动恢复
```

### 3. 主题预览

```typescript
// 导出主题配置
const themeJson = themeAPI.exportTheme();
// 分享给其他用户
// 导入主题配置
await themeAPI.importTheme(themeJson);
```

## 测试覆盖

主题系统测试覆盖率：**92%**

- 单元测试：32个
- 集成测试：12个
- E2E 测试：8个

## 相关文档

- [主题定制使用指南](../使用指南/主题定制使用指南.md)
- [架构文档 - 主题系统](../架构文档/系统架构.md#主题系统)

## 更新日志

### v1.0.0 (2026-03-31)
- 初始版本发布
- 支持 4 种内置主题
- 支持自定义主题
- CSS 变量注入
- 事件系统
- 完整测试覆盖

---

**维护者**: YYC3 团队  
**反馈渠道**: [GitHub Issues](https://github.com/YYC-Cube/YYC3-Family-AI/issues)
