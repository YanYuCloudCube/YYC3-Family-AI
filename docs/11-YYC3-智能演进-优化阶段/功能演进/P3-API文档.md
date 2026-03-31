# P3 验证增强 API 文档

> **版本**: v1.0.0
> **更新日期**: 2026-03-31
> **作者**: YanYuCloudCube Team

---

## 📋 目录

- [概述](#概述)
- [ColorValidator](#colorvalidator)
- [FontSizeValidator](#fontsizevalidator)
- [ZoomController](#zoomcontroller)
- [SnapshotViewController](#snapshotviewcontroller)
- [BoundaryExceptionHandler](#boundaryexceptionhandler)
- [集成测试](#集成测试)

---

## 概述

P3 验证增强模块提供了五个核心控制器，用于增强 IDE 预览功能的输入验证、视图控制和异常处理能力。

### 核心功能

- ✅ 颜色格式验证（ColorValidator）
- ✅ 字体大小验证（FontSizeValidator）
- ✅ 视图缩放控制（ZoomController）
- ✅ 快照视图控制（SnapshotViewController）
- ✅ 边界异常处理（BoundaryExceptionHandler）

---

## ColorValidator

颜色验证器，用于验证颜色格式、对比度和可访问性。

### 类定义

```typescript
class ColorValidator {
  constructor();
  validateHex(color: string): ValidationResult;
  validateRGB(color: string): ValidationResult;
  validateHSL(color: string): ValidationResult;
  validateContrast(foreground: string, background: string): ContrastValidationResult;
  validateAll(colors: Record<string, string>): ValidationResult[];
  destroy(): void;
}
```

### 接口定义

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

interface ContrastValidationResult extends ValidationResult {
  contrastRatio: number;
  wcagLevel: 'AA' | 'AAA' | 'FAIL';
}
```

### API 方法

#### `validateHex(color: string)`

验证十六进制颜色格式。

**参数**:
- `color` (string): 十六进制颜色字符串，如 `#ff0000`

**返回值**:
- `ValidationResult`: 验证结果

**示例**:
```typescript
const validator = new ColorValidator();

const valid = validator.validateHex('#ff0000');
console.log(valid.valid); // true

const invalid = validator.validateHex('ff0000');
console.log(invalid.valid); // false
console.log(invalid.error); // "Invalid hex color format"
```

**验证规则**:
- 必须以 `#` 开头
- 3位格式: `#RGB` - 每位字符代表 R、G、B
- 6位格式: `#RRGGBB` - 每两位代表 R、G、B
- 大小写不敏感

---

#### `validateRGB(color: string)`

验证 RGB 颜色格式。

**参数**:
- `color` (string): RGB 颜色字符串，如 `rgb(255, 0, 0)`

**返回值**:
- `ValidationResult`: 验证结果

**示例**:
```typescript
const validator = new ColorValidator();

const valid = validator.validateRGB('rgb(255, 0, 0)');
console.log(valid.valid); // true

const invalid = validator.validateRGB('rgb(300, 0, 0)');
console.log(invalid.valid); // false
console.log(invalid.error); // "RGB value 300 is out of range (0-255)"
```

**验证规则**:
- 格式: `rgb(r, g, b)` 或 `rgba(r, g, b, a)`
- R、G、B 值范围: 0-255
- Alpha 值范围: 0-1

---

#### `validateHSL(color: string)`

验证 HSL 颜色格式。

**参数**:
- `color` (string): HSL 颜色字符串，如 `hsl(120, 100%, 50%)`

**返回值**:
- `ValidationResult`: 验证结果

**示例**:
```typescript
const validator = new ColorValidator();

const valid = validator.validateHSL('hsl(120, 100%, 50%)');
console.log(valid.valid); // true

const invalid = validator.validateHSL('hsl(400, 100%, 50%)');
console.log(invalid.valid); // false
console.log(invalid.error); // "HSL hue value 400 is out of range (0-360)"
```

**验证规则**:
- 格式: `hsl(h, s%, l%)` 或 `hsla(h, s%, l%, a)`
- H (色相) 范围: 0-360
- S (饱和度) 范围: 0-100%
- L (亮度) 范围: 0-100%
- Alpha 值范围: 0-1

---

#### `validateContrast(foreground: string, background: string)`

验证颜色对比度是否符合 WCAG 标准。

**参数**:
- `foreground` (string): 前景颜色（文本颜色）
- `background` (string): 背景颜色

**返回值**:
- `ContrastValidationResult`: 对比度验证结果

**示例**:
```typescript
const validator = new ColorValidator();

const result = validator.validateContrast('#ffffff', '#000000');
console.log(result.valid); // true
console.log(result.contrastRatio); // 21.0
console.log(result.wcagLevel); // 'AAA'

const lowContrast = validator.validateContrast('#ffffff', '#eeeeee');
console.log(lowContrast.valid); // false
console.log(lowContrast.error); // "Contrast ratio 1.14 does not meet WCAG AA standard (4.5:1)"
console.log(lowContrast.wcagLevel); // 'FAIL'
```

**WCAG 标准**:
- AA 级别: 普通文本 ≥ 4.5:1，大文本 ≥ 3:1
- AAA 级别: 普通文本 ≥ 7:1，大文本 ≥ 4.5:1

---

#### `validateAll(colors: Record<string, string>)`

批量验证多个颜色值。

**参数**:
- `colors` (Record<string, string>): 颜色键值对对象

**返回值**:
- `ValidationResult[]`: 验证结果数组

**示例**:
```typescript
const validator = new ColorValidator();

const colors = {
  primary: '#ff0000',
  secondary: '#00ff00',
  background: '#000000',
  text: '#ffffff',
};

const results = validator.validateAll(colors);
const allValid = results.every(r => r.valid);

console.log(allValid); // true
```

---

#### `destroy()`

销毁验证器，释放资源。

**示例**:
```typescript
const validator = new ColorValidator();
// 使用验证器...
validator.destroy();
```

---

## FontSizeValidator

字体大小验证器，用于验证字体大小格式和范围。

### 类定义

```typescript
class FontSizeValidator {
  constructor(options?: FontSizeValidatorOptions);
  validate(size: string): ValidationResult;
  validateRange(minSize: string, maxSize: string): ValidationResult;
  setLimits(min: number, max: number): void;
  destroy(): void;
}
```

### 接口定义

```typescript
interface FontSizeValidatorOptions {
  minFontSize: number;
  maxFontSize: number;
  defaultUnit: 'px' | 'rem' | 'em';
}
```

### API 方法

#### `constructor(options?: FontSizeValidatorOptions)`

创建字体大小验证器。

**参数**:
- `options` (FontSizeValidatorOptions): 配置选项
  - `minFontSize` (number): 最小字体大小，默认 10
  - `maxFontSize` (number): 最大字体大小，默认 72
  - `defaultUnit` (string): 默认单位，默认 'px'

**示例**:
```typescript
const validator = new FontSizeValidator({
  minFontSize: 12,
  maxFontSize: 64,
  defaultUnit: 'px'
});
```

---

#### `validate(size: string)`

验证字体大小。

**参数**:
- `size` (string): 字体大小字符串，如 `16px`、`1rem`、`1.5em`

**返回值**:
- `ValidationResult`: 验证结果

**示例**:
```typescript
const validator = new FontSizeValidator();

const valid = validator.validate('16px');
console.log(valid.valid); // true

const invalid = validator.validate('-16px');
console.log(invalid.valid); // false
console.log(invalid.error); // "Font size must be positive"

const tooLarge = validator.validate('100px');
console.log(tooLarge.valid); // false
console.log(tooLarge.error); // "Font size 100px exceeds maximum of 72px"
```

**支持的单位**:
- `px`: 像素
- `rem`: 根元素字体大小的倍数
- `em`: 父元素字体大小的倍数
- `%`: 百分比

---

#### `validateRange(minSize: string, maxSize: string)`

验证字体大小范围是否有效。

**参数**:
- `minSize` (string): 最小字体大小
- `maxSize` (string): 最大字体大小

**返回值**:
- `ValidationResult`: 验证结果

**示例**:
```typescript
const validator = new FontSizeValidator();

const valid = validator.validateRange('12px', '24px');
console.log(valid.valid); // true

const invalid = validator.validateRange('24px', '12px');
console.log(invalid.valid); // false
console.log(invalid.error); // "Minimum size cannot be greater than maximum size"
```

---

#### `setLimits(min: number, max: number)`

设置字体大小限制。

**参数**:
- `min` (number): 最小字体大小
- `max` (number): 最大字体大小

**示例**:
```typescript
const validator = new FontSizeValidator();
validator.setLimits(14, 48);

const valid = validator.validate('16px');
console.log(valid.valid); // true
```

---

#### `destroy()`

销毁验证器，释放资源。

---

## ZoomController

视图缩放控制器，用于管理预览视图的缩放级别。

### 类定义

```typescript
class ZoomController {
  constructor(options?: ZoomControllerOptions);
  setZoomLevel(level: number): boolean;
  getZoomLevel(): number;
  zoomIn(): boolean;
  zoomOut(): boolean;
  resetZoom(): void;
  setZoomStep(step: number): void;
  getZoomStep(): number;
  setMinZoomLevel(level: number): void;
  getMinZoomLevel(): number;
  setMaxZoomLevel(level: number): void;
  getMaxZoomLevel(): number;
  destroy(): void;
}
```

### 接口定义

```typescript
interface ZoomControllerOptions {
  initialZoom: number;
  zoomStep: number;
  minZoom: number;
  maxZoom: number;
}
```

### API 方法

#### `constructor(options?: ZoomControllerOptions)`

创建缩放控制器。

**参数**:
- `options` (ZoomControllerOptions): 配置选项
  - `initialZoom` (number): 初始缩放级别，默认 1.0
  - `zoomStep` (number): 缩放步进，默认 0.25
  - `minZoom` (number): 最小缩放级别，默认 0.25
  - `maxZoom` (number): 最大缩放级别，默认 3.0

**示例**:
```typescript
const zoom = new ZoomController({
  initialZoom: 1.0,
  zoomStep: 0.25,
  minZoom: 0.5,
  maxZoom: 2.0
});
```

---

#### `setZoomLevel(level: number)`

设置缩放级别。

**参数**:
- `level` (number): 缩放级别，1.0 表示 100%

**返回值**:
- `boolean`: 是否成功设置

**示例**:
```typescript
const zoom = new ZoomController();

const success = zoom.setZoomLevel(1.5);
console.log(success); // true
console.log(zoom.getZoomLevel()); // 1.5

const invalid = zoom.setZoomLevel(5.0);
console.log(invalid); // false (超过最大限制)
```

---

#### `getZoomLevel()`

获取当前缩放级别。

**返回值**:
- `number`: 当前缩放级别

---

#### `zoomIn()`

放大视图。

**返回值**:
- `boolean`: 是否成功放大

**示例**:
```typescript
const zoom = new ZoomController();

zoom.setZoomLevel(1.0);
zoom.zoomIn();
console.log(zoom.getZoomLevel()); // 1.25

zoom.zoomIn();
console.log(zoom.getZoomLevel()); // 1.5
```

---

#### `zoomOut()`

缩小视图。

**返回值**:
- `boolean`: 是否成功缩小

---

#### `resetZoom()`

重置缩放级别到初始值。

**示例**:
```typescript
const zoom = new ZoomController();

zoom.setZoomLevel(2.0);
zoom.resetZoom();
console.log(zoom.getZoomLevel()); // 1.0
```

---

#### `setZoomStep(step: number)`

设置缩放步进。

**参数**:
- `step` (number): 缩放步进值

---

#### `getZoomStep()`

获取缩放步进。

**返回值**:
- `number`: 缩放步进值

---

#### `setMinZoomLevel(level: number)`

设置最小缩放级别。

---

#### `getMinZoomLevel()`

获取最小缩放级别。

---

#### `setMaxZoomLevel(level: number)`

设置最大缩放级别。

---

#### `getMaxZoomLevel()`

获取最大缩放级别。

---

## SnapshotViewController

快照视图控制器，用于管理快照的视图状态同步。

### 类定义

```typescript
class SnapshotViewController {
  constructor(snapshotManager: SnapshotManager);
  saveViewState(state: ViewState): boolean;
  restoreViewState(snapshotId: string): ViewState | null;
  syncViewState(state: ViewState): SyncResult;
  clearViewState(snapshotId: string): boolean;
  compareViewStates(snapshotId1: string, snapshotId2: string): ViewStateDiff;
  destroy(): void;
}
```

### 接口定义

```typescript
interface ViewState {
  zoom: number;
  scroll: { x: number; y: number };
  device: 'desktop' | 'tablet' | 'mobile';
  theme?: string;
}

interface SyncResult {
  success: boolean;
  restoredZoom?: number;
  restoredScroll?: { x: number; y: number };
  error?: string;
}

interface ViewStateDiff {
  zoomDiff: number;
  scrollDiff: { x: number; y: number };
  deviceChanged: boolean;
  themeChanged: boolean;
}
```

### API 方法

#### `constructor(snapshotManager: SnapshotManager)`

创建快照视图控制器。

**参数**:
- `snapshotManager` (SnapshotManager): 快照管理器实例

---

#### `saveViewState(state: ViewState)`

保存视图状态到快照。

**参数**:
- `state` (ViewState): 视图状态

**返回值**:
- `boolean`: 是否成功保存

**示例**:
```typescript
const viewState = {
  zoom: 1.5,
  scroll: { x: 100, y: 200 },
  device: 'tablet',
  theme: 'dark'
};

const success = snapshotViewController.saveViewState(viewState);
console.log(success); // true
```

---

#### `restoreViewState(snapshotId: string)`

从快照恢复视图状态。

**参数**:
- `snapshotId` (string): 快照 ID

**返回值**:
- `ViewState | null`: 视图状态，如果快照不存在则返回 null

---

#### `syncViewState(state: ViewState)`

同步视图状态。

**参数**:
- `state` (ViewState): 要同步的视图状态

**返回值**:
- `SyncResult`: 同步结果

**示例**:
```typescript
const result = snapshotViewController.syncViewState({
  zoom: 1.25,
  scroll: { x: 50, y: 150 },
  device: 'tablet'
});

console.log(result.success); // true
console.log(result.restoredZoom); // 1.25
```

---

#### `clearViewState(snapshotId: string)`

清除快照的视图状态。

**参数**:
- `snapshotId` (string): 快照 ID

**返回值**:
- `boolean`: 是否成功清除

---

#### `compareViewStates(snapshotId1: string, snapshotId2: string)`

比较两个快照的视图状态。

**参数**:
- `snapshotId1` (string): 第一个快照 ID
- `snapshotId2` (string): 第二个快照 ID

**返回值**:
- `ViewStateDiff`: 视图状态差异

---

#### `destroy()`

销毁控制器，释放资源。

---

## BoundaryExceptionHandler

边界异常处理器，用于处理和恢复边界异常。

### 类定义

```typescript
class BoundaryExceptionHandler {
  constructor(options?: BoundaryExceptionHandlerOptions);
  handle(error: Error, context: HandlerContext): HandlerResult;
  registerHandler(type: string, handler: ErrorHandler): void;
  unregisterHandler(type: string): void;
  setRecoveryStrategy(type: string, strategy: RecoveryStrategy): void;
  getErrorHistory(): ErrorRecord[];
  clearErrorHistory(): void;
  destroy(): void;
}
```

### 接口定义

```typescript
interface BoundaryExceptionHandlerOptions {
  maxErrorHistory: number;
  autoRecovery: boolean;
  retryAttempts: number;
}

interface HandlerContext {
  context: string;
  metadata?: Record<string, any>;
}

interface HandlerResult {
  success: boolean;
  recovered?: boolean;
  fallbackValue?: any;
  error?: string;
}

interface ErrorHandler {
  (error: Error, context: HandlerContext): HandlerResult;
}

interface RecoveryStrategy {
  retry?: boolean;
  fallback?: any;
  notify?: boolean;
  log?: boolean;
}
```

### API 方法

#### `constructor(options?: BoundaryExceptionHandlerOptions)`

创建边界异常处理器。

**参数**:
- `options` (BoundaryExceptionHandlerOptions): 配置选项
  - `maxErrorHistory` (number): 最大错误历史记录数，默认 100
  - `autoRecovery` (boolean): 是否自动恢复，默认 true
  - `retryAttempts` (number): 重试次数，默认 3

---

#### `handle(error: Error, context: HandlerContext)`

处理异常。

**参数**:
- `error` (Error): 错误对象
- `context` (HandlerContext): 处理上下文

**返回值**:
- `HandlerResult`: 处理结果

**示例**:
```typescript
const handler = new BoundaryExceptionHandler();

try {
  // 可能抛出错误的代码
} catch (error) {
  const result = handler.handle(error as Error, {
    context: 'snapshot-restore',
    metadata: { snapshotId: 'abc123' }
  });

  console.log(result.success); // true
  console.log(result.recovered); // true
}
```

---

#### `registerHandler(type: string, handler: ErrorHandler)`

注册自定义错误处理器。

**参数**:
- `type` (string): 错误类型
- `handler` (ErrorHandler): 错误处理器函数

---

#### `unregisterHandler(type: string)`

注销错误处理器。

---

#### `setRecoveryStrategy(type: string, strategy: RecoveryStrategy)`

设置恢复策略。

**参数**:
- `type` (string): 错误类型
- `strategy` (RecoveryStrategy): 恢复策略

**示例**:
```typescript
handler.setRecoveryStrategy('network-error', {
  retry: true,
  notify: true,
  log: true
});
```

---

#### `getErrorHistory()`

获取错误历史记录。

**返回值**:
- `ErrorRecord[]`: 错误记录数组

---

#### `clearErrorHistory()`

清除错误历史记录。

---

#### `destroy()`

销毁处理器，释放资源。

---

## 集成测试

P3 提供了三个完整的集成测试套件，覆盖所有验证增强功能。

### PreviewFlow.integration.test.ts

完整预览流程集成测试，测试编辑器到预览的完整工作流程。

**测试覆盖**:
- ✅ 编辑代码 → 预览更新（三种模式）
- ✅ 切换设备 → 视图更新
- ✅ 切换主题 → 样式更新
- ✅ 缩放控制 → 视图缩放
- ✅ 错误处理 → 错误展示
- ✅ 完整工作流集成

**运行测试**:
```bash
pnpm test PreviewFlow.integration.test.ts --run
```

---

### ThemeFlow.integration.test.ts

主题流程集成测试，测试主题切换、颜色验证和系统主题同步。

**测试覆盖**:
- ✅ 切换主题 → 样式更新
- ✅ 自定义颜色 → CSS变量更新
- ✅ 验证无效值 → 错误提示
- ✅ 系统主题监听 → 自动切换
- ✅ 字体大小验证
- ✅ 完整主题工作流

**运行测试**:
```bash
pnpm test ThemeFlow.integration.test.ts --run
```

---

### SnapshotFlow.integration.test.ts

快照恢复流程集成测试，测试快照的创建、恢复、比较和删除。

**测试覆盖**:
- ✅ 创建快照 → 快照列表更新
- ✅ 恢复快照 → 文件恢复
- ✅ 比较快照 → 差异显示
- ✅ 删除快照 → 列表更新
- ✅ 视图控制 → 视图同步
- ✅ 边界条件处理
- ✅ 完整快照工作流

**运行测试**:
```bash
pnpm test SnapshotFlow.integration.test.ts --run
```

---

## 使用示例

### 完整的预览流程示例

```typescript
import { usePreviewStore } from './stores/usePreviewStore';
import { ColorValidator } from './theme/ColorValidator';
import { ZoomController } from './preview/ZoomController';

// 初始化
const { initModeController, initZoomController, initDeviceSimulator } =
  usePreviewStore.getState();

const colorValidator = new ColorValidator();
const zoomController = initZoomController();

// 设置预览模式
initModeController(() => {
  console.log('Preview updated');
});

usePreviewStore.getState().setMode('realtime');

// 自定义主题颜色
const themeColors = {
  primary: '#ff0000',
  secondary: '#00ff00',
  background: '#000000',
  text: '#ffffff'
};

// 验证颜色
const results = colorValidator.validateAll(themeColors);
const allValid = results.every(r => r.valid);

if (allValid) {
  useThemeStore.getState().updateCustomColors(themeColors);
}

// 设置缩放
zoomController.setZoomLevel(1.5);

// 切换设备
usePreviewStore.getState().deviceSimulator!.setDevice('tablet');

// 清理
zoomController.destroy();
colorValidator.destroy();
```

---

## 总结

P3 验证增强模块提供了五个核心控制器，完整覆盖了输入验证、视图控制和异常处理的所有场景。

### 主要特性

- ✅ **完整的类型验证**: 支持颜色、字体大小的完整格式验证
- ✅ **灵活的视图控制**: 支持缩放、滚动、设备切换等视图操作
- ✅ **强大的异常处理**: 自动恢复、错误历史、自定义策略
- ✅ **完善的测试覆盖**: 178个单元测试 + 3个集成测试
- ✅ **原生实现**: 零第三方依赖，纯 TypeScript 实现

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-31
**维护团队**: YanYuCloudCube Team
