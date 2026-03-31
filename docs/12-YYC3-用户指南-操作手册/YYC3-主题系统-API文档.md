# 📚 主题系统 API 文档

**版本**: v1.0.0  
**更新时间**: 2026-03-31  
**适用范围**: YYC3 IDE 主题系统增强（P1任务1.1）

---

## 📋 目录

1. [CSSVariableInjector API](#cssvariableinjector-api)
2. [ColorValidator API](#colorvalidator-api)
3. [DesignTokenSystem API](#designtokensystem-api)
4. [快速参考](#快速参考)

---

## CSSVariableInjector API

CSS变量动态注入器，提供高性能的CSS变量管理。

### 类方法

#### `getInstance(): CSSVariableInjector`

获取单例实例。

**返回值**: `CSSVariableInjector` 实例

**示例**:
```typescript
import { CSSVariableInjector } from '@/app/components/ide/theme/CSSVariableInjector';

const injector = CSSVariableInjector.getInstance();
```

---

#### `batchUpdate(variables: Record<string, string>): BatchUpdateResult`

批量更新CSS变量，只更新变化的变量。

**参数**:
- `variables`: CSS变量键值对

**返回值**: `BatchUpdateResult`
```typescript
interface BatchUpdateResult {
  applied: number;    // 应用的变量数
  skipped: number;    // 跳过的变量数（未变化）
  changes: CSSVariableChange[]; // 变化详情
  duration: number;   // 执行耗时（毫秒）
}
```

**示例**:
```typescript
const result = injector.batchUpdate({
  '--primary': '#007bff',
  '--secondary': '#6c757d',
  '--background': '#ffffff'
});

console.log(`应用了 ${result.applied} 个变量`);
console.log(`跳过了 ${result.skipped} 个变量`);
console.log(`耗时 ${result.duration}ms`);
```

---

#### `setVariable(key: string, value: string): void`

设置单个CSS变量。

**参数**:
- `key`: CSS变量名（如 `--primary`）
- `value`: 变量值

**示例**:
```typescript
injector.setVariable('--primary', '#007bff');
```

---

#### `getVariable(key: string): string | undefined`

获取CSS变量当前值。

**参数**:
- `key`: CSS变量名

**返回值**: 变量值或 `undefined`

**示例**:
```typescript
const primary = injector.getVariable('--primary');
console.log(primary); // '#007bff'
```

---

#### `applyTheme(theme: ThemeType, customVariables?: Record<string, string>): void`

应用主题预设。

**参数**:
- `theme`: 主题类型（`'navy'` | `'cyberpunk'` | `'light'`）
- `customVariables`: 可选的自定义变量覆盖

**示例**:
```typescript
// 应用Navy主题
injector.applyTheme('navy');

// 应用Cyberpunk主题并覆盖主色
injector.applyTheme('cyberpunk', {
  '--primary': '#custom-color'
});
```

---

#### `scheduleBatchUpdate(variables: Record<string, string>): void`

调度延迟批量更新（用于高频更新场景）。

**参数**:
- `variables`: CSS变量键值对

**示例**:
```typescript
// 合并多次更新为一次
injector.scheduleBatchUpdate({ '--var1': '#111' });
injector.scheduleBatchUpdate({ '--var2': '#222' });
// 在下一个requestAnimationFrame统一执行
```

---

#### `addChangeListener(callback: (changes: CSSVariableChange[]) => void): () => void`

添加变量变化监听器。

**参数**:
- `callback`: 变化回调函数

**返回值**: 取消监听函数

**示例**:
```typescript
const unsubscribe = injector.addChangeListener((changes) => {
  changes.forEach(change => {
    console.log(`${change.key}: ${change.oldValue} → ${change.newValue}`);
  });
});

// 取消监听
unsubscribe();
```

---

#### `getPerformanceMetrics(): PerformanceMetrics`

获取性能指标。

**返回值**: `PerformanceMetrics`
```typescript
interface PerformanceMetrics {
  totalUpdates: number;      // 总更新次数
  totalVariables: number;    // 当前变量总数
  averageBatchSize: number;  // 平均批量大小
  averageDuration: number;   // 平均耗时
  lastUpdateDuration: number; // 最后一次更新耗时
}
```

**示例**:
```typescript
const metrics = injector.getPerformanceMetrics();
console.log(`平均耗时: ${metrics.averageDuration}ms`);
```

---

#### `exportVariables(): string`

导出所有变量为JSON字符串。

**返回值**: JSON字符串

**示例**:
```typescript
const json = injector.exportVariables();
console.log(json);
// {"--primary":"#007bff","--secondary":"#6c757d"}
```

---

#### `importVariables(json: string): BatchUpdateResult`

从JSON字符串导入变量。

**参数**:
- `json`: JSON格式的变量

**返回值**: `BatchUpdateResult`

**示例**:
```typescript
const result = injector.importVariables('{"--primary":"#007bff"}');
console.log(`导入了 ${result.applied} 个变量`);
```

---

#### `clearAll(): void`

清空所有CSS变量和性能指标。

**示例**:
```typescript
injector.clearAll();
```

---

### 便捷函数

```typescript
import { 
  batchUpdateCSSVariables,
  setCSSVariable,
  getCSSVariable 
} from '@/app/components/ide/theme/CSSVariableInjector';

// 快速批量更新
batchUpdateCSSVariables({ '--primary': '#007bff' });

// 快速设置单个变量
setCSSVariable('--primary', '#007bff');

// 快速获取变量
const value = getCSSVariable('--primary');
```

---

## ColorValidator API

颜色验证和规范化系统。

### 类方法

#### `getInstance(): ColorValidator`

获取单例实例。

**示例**:
```typescript
import { ColorValidator } from '@/app/components/ide/theme/ColorValidator';

const validator = ColorValidator.getInstance();
```

---

#### `validate(color: string | null | undefined): ColorValidationResult`

验证颜色值。

**参数**:
- `color`: 颜色字符串（支持空值）

**返回值**: `ColorValidationResult`
```typescript
interface ColorValidationResult {
  valid: boolean;
  format?: 'hex' | 'rgb' | 'hsl' | 'oklch';
  normalized?: string;
  error?: string;
  suggestion?: string;
}
```

**示例**:
```typescript
// 验证HEX颜色
const result1 = validator.validate('#FF5733');
console.log(result1);
// { valid: true, format: 'hex', normalized: '#ff5733' }

// 验证RGB颜色
const result2 = validator.validate('rgb(255, 87, 51)');
console.log(result2);
// { valid: true, format: 'rgb', normalized: 'rgb(255, 87, 51)' }

// 验证无效颜色
const result3 = validator.validate('invalid');
console.log(result3);
// { valid: false, error: '无法识别的颜色格式', suggestion: '...' }
```

---

#### `validateWithDefault(color: string | null | undefined, defaultKey: string): string`

验证颜色值，失败时返回默认值。

**参数**:
- `color`: 颜色字符串
- `defaultKey`: 默认颜色键名

**返回值**: 验证后的颜色值或默认值

**示例**:
```typescript
const color = validator.validateWithDefault(null, 'primary');
console.log(color); // 返回预设的primary颜色
```

---

#### `calculateContrastRatio(foreground: string, background: string): number`

计算对比度。

**参数**:
- `foreground`: 前景色
- `background`: 背景色

**返回值**: 对比度比率（1-21）

**示例**:
```typescript
const ratio = validator.calculateContrastRatio('#ffffff', '#000000');
console.log(ratio); // 21（最大对比度）
```

---

#### `validateContrast(foreground: string, background: string): ContrastResult`

验证对比度是否符合WCAG标准。

**参数**:
- `foreground`: 前景色
- `background`: 背景色

**返回值**: `ContrastResult`
```typescript
interface ContrastResult {
  ratio: number;           // 对比度比率
  wcagAA: boolean;         // 是否符合AA标准（≥4.5）
  wcagAAA: boolean;        // 是否符合AAA标准（≥7.0）
  level: 'AAA' | 'AA' | 'fail';
  suggestion?: string;     // 改进建议
}
```

**示例**:
```typescript
const result = validator.validateContrast('#ffffff', '#767676');
console.log(result);
// {
//   ratio: 4.54,
//   wcagAA: true,
//   wcagAAA: false,
//   level: 'AA'
// }
```

---

#### 颜色转换方法

```typescript
// HEX转RGB
const rgb = validator.hexToRGB('#FF5733');
console.log(rgb); // { r: 255, g: 87, b: 51 }

// RGB转HEX
const hex = validator.rgbToHex({ r: 255, g: 87, b: 51 });
console.log(hex); // '#ff5733'

// RGB转HSL
const hsl = validator.rgbToHSL({ r: 255, g: 87, b: 51 });
console.log(hsl); // { h: 11, s: 100, l: 60 }

// HSL转RGB
const rgb2 = validator.hslToRGB({ h: 11, s: 100, l: 60 });
console.log(rgb2); // { r: 255, g: 87, b: 51 }
```

---

#### 格式验证方法

```typescript
// 验证HEX
validator.isValidHex('#FF5733'); // true

// 验证RGB
validator.isValidRGB('rgb(255, 87, 51)'); // true

// 验证HSL
validator.isValidHSL('hsl(10, 100%, 60%)'); // true

// 验证OKLch
validator.isValidOKLch('oklch(0.55 0.22 264)'); // true
```

---

#### 工具方法

```typescript
// 检查是否为深色
const isDark = validator.isDarkColor('#000000');
console.log(isDark); // true

// 获取推荐的前景色
const foreground = validator.getRecommendedForeground('#000000');
console.log(foreground); // '#ffffff'

// 设置默认颜色
validator.setDefaultColor('custom', '#ff0000');

// 获取默认颜色
const defaultColor = validator.getDefaultColor('custom');
console.log(defaultColor); // '#ff0000'
```

---

### 便捷函数

```typescript
import { 
  validateColor,
  calculateContrast,
  validateContrast 
} from '@/app/components/ide/theme/ColorValidator';

// 快速验证颜色
const result = validateColor('#ff0000');

// 快速计算对比度
const ratio = calculateContrast('#fff', '#000');

// 快速验证对比度
const contrastResult = validateContrast('#fff', '#000');
```

---

## DesignTokenSystem API

Design Token层级管理系统。

### 类方法

#### `getInstance(): DesignTokenSystem`

获取单例实例。

**示例**:
```typescript
import { DesignTokenSystem } from '@/app/components/ide/theme/DesignTokenSystem';

const tokenSystem = DesignTokenSystem.getInstance();
```

---

#### `getToken(name: string, theme?: ThemeType): string`

获取Token值（自动解析引用）。

**参数**:
- `name`: Token名称
- `theme`: 可选的主题类型

**返回值**: Token值

**示例**:
```typescript
// 获取基础Token
const blue = tokenSystem.getToken('color.blue.500');
console.log(blue); // 'oklch(0.55 0.22 264)'

// 获取语义Token（自动解析引用）
const primary = tokenSystem.getToken('color.primary');
console.log(primary); // 自动解析为color.blue.500的值

// 获取组件Token（多级解析）
const buttonBg = tokenSystem.getToken('button.primary.background');
// 解析链: button.primary.background → color.primary → color.blue.500

// 获取主题特定Token
const navyPrimary = tokenSystem.getToken('color.primary', 'navy');
const cyberPrimary = tokenSystem.getToken('color.primary', 'cyberpunk');
```

---

#### `setToken(name: string, value: string, type: TokenType, description?: string): void`

设置Token。

**参数**:
- `name`: Token名称
- `value`: Token值或引用
- `type`: Token类型（`'primitive'` | `'semantic'` | `'component'`）
- `description`: 可选的描述

**示例**:
```typescript
// 设置基础Token
tokenSystem.setToken('custom.blue', '#007bff', 'primitive', '自定义蓝色');

// 设置语义Token（引用）
tokenSystem.setToken('custom.primary', '{custom.blue}', 'semantic', '自定义主色');

// 设置组件Token
tokenSystem.setToken('button.custom.bg', '{custom.primary}', 'component', '按钮背景');
```

---

#### `setThemeOverride(theme: ThemeType, tokenName: string, value: string): void`

设置主题Token覆盖。

**参数**:
- `theme`: 主题类型
- `tokenName`: Token名称
- `value`: 覆盖值

**示例**:
```typescript
// 为Cyberpunk主题设置不同的主色
tokenSystem.setThemeOverride('cyberpunk', 'color.primary', 'oklch(0.60 0.25 300)');
```

---

#### `exportToCSSVariables(theme?: ThemeType): Record<string, string>`

导出为CSS变量格式。

**参数**:
- `theme`: 可选的主题类型

**返回值**: CSS变量键值对

**示例**:
```typescript
const variables = tokenSystem.exportToCSSVariables('navy');
console.log(variables);
// {
//   '--color-blue-500': 'oklch(0.55 0.22 264)',
//   '--color-primary': 'oklch(0.55 0.22 264)',
//   '--button-primary-background': 'oklch(0.55 0.22 264)',
//   ...
// }

// 应用到DOM
injector.batchUpdate(variables);
```

---

#### `resolveValue(value: string, theme?: ThemeType): string`

解析值中的Token引用。

**参数**:
- `value`: 包含Token引用的字符串
- `theme`: 可选的主题类型

**返回值**: 解析后的值

**示例**:
```typescript
const padding = tokenSystem.resolveValue('padding: {spacing.4} {spacing.6}');
console.log(padding);
// 'padding: 16px 24px'
```

---

#### `getTokenDefinition(name: string): DesignToken | undefined`

获取Token定义（包含元数据）。

**参数**:
- `name`: Token名称

**返回值**: `DesignToken` 定义

**示例**:
```typescript
const definition = tokenSystem.getTokenDefinition('color.primary');
console.log(definition);
// {
//   name: 'color.primary',
//   value: '{color.blue.500}',
//   type: 'semantic',
//   description: '主题主色',
//   references: 'color.blue.500'
// }
```

---

#### `getAllTokens(type?: TokenType): DesignToken[]`

获取所有Token。

**参数**:
- `type`: 可选的Token类型过滤

**返回值**: Token数组

**示例**:
```typescript
// 获取所有Token
const allTokens = tokenSystem.getAllTokens();

// 只获取基础Token
const primitives = tokenSystem.getAllTokens('primitive');

// 只获取语义Token
const semantics = tokenSystem.getAllTokens('semantic');

// 只获取组件Token
const components = tokenSystem.getAllTokens('component');
```

---

#### `getTokenStats(): TokenStats`

获取Token统计。

**返回值**: `TokenStats`
```typescript
interface TokenStats {
  primitive: number;   // 基础Token数量
  semantic: number;    // 语义Token数量
  component: number;   // 组件Token数量
  total: number;       // 总数
}
```

**示例**:
```typescript
const stats = tokenSystem.getTokenStats();
console.log(stats);
// { primitive: 25, semantic: 12, component: 15, total: 52 }
```

---

#### `addTokenListener(callback: (token: DesignToken) => void): () => void`

添加Token变更监听器。

**参数**:
- `callback`: 变更回调函数

**返回值**: 取消监听函数

**示例**:
```typescript
const unsubscribe = tokenSystem.addTokenListener((token) => {
  console.log(`Token ${token.name} 已更新: ${token.value}`);
});

// 取消监听
unsubscribe();
```

---

### 便捷函数

```typescript
import { getToken, setToken } from '@/app/components/ide/theme/DesignTokenSystem';

// 快速获取Token
const value = getToken('color.primary');

// 快速设置Token
setToken('custom.token', '#ff0000', 'semantic', '自定义Token');
```

---

## 快速参考

### CSS变量注入

```typescript
// 批量更新
injector.batchUpdate({
  '--primary': '#007bff',
  '--secondary': '#6c757d'
});

// 应用主题
injector.applyTheme('navy');
injector.applyTheme('cyberpunk');
injector.applyTheme('light');
```

### 颜色验证

```typescript
// 验证颜色
validateColor('#ff0000'); // { valid: true, format: 'hex' }

// 检查对比度
validateContrast('#fff', '#000'); // { ratio: 21, wcagAA: true }
```

### Design Token

```typescript
// 获取Token
getToken('color.primary'); // 'oklch(0.55 0.22 264)'

// 设置Token
setToken('custom.color', '#ff0000', 'semantic');
```

---

**API文档完成！** 📚
