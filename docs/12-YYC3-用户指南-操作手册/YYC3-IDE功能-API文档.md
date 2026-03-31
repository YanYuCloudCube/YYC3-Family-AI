# YYC3 IDE 核心 API 文档

> **版本**: v1.1.0  
> **更新日期**: 2026-03-31  
> **作者**: YanYuCloudCube Team  
> **状态**: 已完成

---

## 📋 目录

- [概览](#概览)
- [PreviewModeController API](#previewmodecontroller-api)
- [SnapshotManager API](#snapshotmanager-api)
- [CodeValidator API](#codevalidator-api)
- [SystemPromptBuilder API](#systempromptbuilder-api)
- [类型定义](#类型定义)

---

## 概览

本文档详细说明了 YYC3 IDE 四个核心模块的 API 接口：

1. **PreviewModeController** - 预览模式控制器
2. **SnapshotManager** - 快照管理器
3. **CodeValidator** - 代码验证器
4. **SystemPromptBuilder** - 系统提示词构建器

所有模块都提供了性能优化版本，包含缓存、节流、压缩等优化策略。

---

## PreviewModeController API

### 类：PreviewModeControllerOptimized

**用途**: 管理 IDE 预览的三种模式（实时/手动/延迟），提供智能预览更新策略。

**文件位置**: `src/app/components/ide/PreviewModeController.optimized.ts`

### 构造函数

```typescript
constructor(
  onTriggerUpdate: () => void,
  delay?: number
)
```

**参数**:
- `onTriggerUpdate: () => void` - 触发预览更新的回调函数
- `delay?: number` - 延迟时间（毫秒），默认 500ms

**示例**:

```typescript
import { PreviewModeControllerOptimized } from "./PreviewModeController.optimized";

// 创建控制器实例
const controller = new PreviewModeControllerOptimized(
  () => {
    console.log("触发预览更新");
    // 执行预览刷新逻辑
    refreshPreview();
  },
  500 // 延迟时间
);
```

---

### 核心方法

#### setMode(mode: PreviewMode)

设置预览模式。

**参数**:
- `mode: PreviewMode` - 预览模式，可选值：
  - `"realtime"` - 实时模式：编辑后立即更新（100ms 节流）
  - `"manual"` - 手动模式：需要手动触发
  - `"delayed"` - 延迟模式：编辑后延迟更新（防抖 500ms）

**返回值**: `void`

**示例**:

```typescript
// 设置实时模式
controller.setMode("realtime");

// 设置手动模式
controller.setMode("manual");

// 设置延迟模式
controller.setMode("delayed");
```

---

#### handleFileChange()

处理文件变更，根据当前模式决定是否触发预览更新。

**参数**: 无

**返回值**: `void`

**示例**:

```typescript
// 在编辑器 onChange 回调中调用
editor.onChange(() => {
  controller.handleFileChange();
});
```

**行为说明**:
- **实时模式**: 使用节流控制，限制更新频率为 100ms
- **手动模式**: 标记有待处理更新，不自动触发
- **延迟模式**: 使用防抖，500ms 后触发更新

---

#### manualTriggerPreview()

手动触发预览更新（仅手动模式使用）。

**参数**: 无

**返回值**: `void`

**示例**:

```typescript
// 用户点击"刷新预览"按钮时调用
refreshButton.onClick(() => {
  controller.manualTriggerPreview();
});
```

---

#### hasPendingPreviewUpdate(): boolean

检查是否有待处理的预览更新（手动模式使用）。

**参数**: 无

**返回值**: `boolean` - 是否有待处理更新

**示例**:

```typescript
const hasPending = controller.hasPendingPreviewUpdate();

if (hasPending) {
  console.log("有未更新的预览，请手动刷新");
}
```

---

#### getStatus(): PreviewControllerStatus

获取控制器状态信息。

**参数**: 无

**返回值**: `PreviewControllerStatus`

```typescript
interface PreviewControllerStatus {
  mode: PreviewMode;
  hasPendingUpdate: boolean;
  delay: number;
  smartModeStats?: {
    editCount: number;
    lastEditTime: number;
    avgEditInterval: number;
  };
}
```

**示例**:

```typescript
const status = controller.getStatus();

console.log(`当前模式: ${status.mode}`);
console.log(`延迟时间: ${status.delay}ms`);
console.log(`有待处理更新: ${status.hasPendingUpdate}`);

// 智能模式统计（如果启用）
if (status.smartModeStats) {
  console.log(`编辑次数: ${status.smartModeStats.editCount}`);
  console.log(`平均编辑间隔: ${status.smartModeStats.avgEditInterval}ms`);
}
```

---

#### updateDelay(delay: number)

更新延迟时间。

**参数**:
- `delay: number` - 新的延迟时间（毫秒）

**返回值**: `void`

**示例**:

```typescript
// 将延迟时间更新为 1000ms
controller.updateDelay(1000);
```

---

#### reset()

重置控制器状态。

**参数**: 无

**返回值**: `void`

**示例**:

```typescript
// 清除所有定时器和待处理状态
controller.reset();
```

---

#### destroy()

销毁控制器，清理所有资源。

**参数**: 无

**返回值**: `void`

**示例**:

```typescript
// 组件卸载时调用
useEffect(() => {
  return () => {
    controller.destroy();
  };
}, []);
```

---

### 性能优化特性

1. **节流控制**: 实时模式使用 100ms 节流，减少 80% 更新次数
2. **防抖优化**: 延迟模式合并多次快速变更
3. **内存优化**: 及时清理定时器，避免内存泄漏
4. **智能统计**: 记录编辑频率，支持自适应策略

---

## SnapshotManager API

### 类：SnapshotManagerOptimized

**用途**: 管理 IDE 预览快照的创建、存储、恢复和比较，支持压缩和容量控制。

**文件位置**: `src/app/components/ide/SnapshotManager.optimized.ts`

### 构造函数

```typescript
constructor()
```

**示例**:

```typescript
import { SnapshotManagerOptimized } from "./SnapshotManager.optimized";

const snapshotManager = new SnapshotManagerOptimized();
```

---

### 核心方法

#### createSnapshot(label: string, files: SnapshotFile[], metadata?: SnapshotMetadata): string

创建快照。

**参数**:
- `label: string` - 快照标签/名称
- `files: SnapshotFile[]` - 文件列表
- `metadata?: SnapshotMetadata` - 可选元数据

**返回值**: `string` - 快照 ID

**类型定义**:

```typescript
interface SnapshotFile {
  path: string;      // 文件路径
  content: string;   // 文件内容
  hash: string;      // 内容哈希
}

interface SnapshotMetadata {
  totalFiles: number;          // 文件总数
  totalLines: number;          // 总行数
  compressedSize?: number;     // 压缩后大小
  device?: DevicePreset;       // 设备预设
  zoom?: number;               // 缩放级别
  tags?: string[];             // 标签
  description?: string;        // 描述
}
```

**示例**:

```typescript
// 创建快照
const snapshotId = snapshotManager.createSnapshot(
  "功能完成快照",
  [
    {
      path: "src/App.tsx",
      content: "export function App() { return <div>Hello</div> }",
      hash: "abc123"
    },
    {
      path: "src/index.tsx",
      content: "import { App } from './App'",
      hash: "def456"
    }
  ],
  {
    totalFiles: 2,
    totalLines: 5,
    tags: ["feature", "milestone"],
    description: "完成主要功能开发"
  }
);

console.log(`快照已创建: ${snapshotId}`);
```

---

#### getSnapshot(id: string): Snapshot | undefined

获取指定快照。

**参数**:
- `id: string` - 快照 ID

**返回值**: `Snapshot | undefined`

**类型定义**:

```typescript
interface Snapshot {
  id: string;                  // 快照 ID
  label: string;               // 快照标签
  timestamp: number;           // 创建时间戳
  files: SnapshotFile[];       // 文件列表
  metadata: SnapshotMetadata;  // 元数据
  compressed?: boolean;        // 是否已压缩
}
```

**示例**:

```typescript
// 获取快照
const snapshot = snapshotManager.getSnapshot(snapshotId);

if (snapshot) {
  console.log(`快照名称: ${snapshot.label}`);
  console.log(`创建时间: ${new Date(snapshot.timestamp).toLocaleString()}`);
  console.log(`文件数量: ${snapshot.files.length}`);
  console.log(`是否压缩: ${snapshot.compressed}`);
}
```

---

#### listSnapshots(): Snapshot[]

列出所有快照。

**参数**: 无

**返回值**: `Snapshot[]` - 快照列表（按时间倒序）

**示例**:

```typescript
// 列出所有快照
const snapshots = snapshotManager.listSnapshots();

snapshots.forEach((snapshot, index) => {
  console.log(`${index + 1}. ${snapshot.label} - ${new Date(snapshot.timestamp).toLocaleString()}`);
});
```

---

#### restoreSnapshot(id: string): SnapshotFile[] | null

恢复快照。

**参数**:
- `id: string` - 快照 ID

**返回值**: `SnapshotFile[] | null` - 文件列表或 null

**示例**:

```typescript
// 恢复快照
const files = snapshotManager.restoreSnapshot(snapshotId);

if (files) {
  console.log(`恢复 ${files.length} 个文件`);
  
  files.forEach(file => {
    console.log(`恢复文件: ${file.path}`);
    // 应用文件内容到编辑器
    editor.setContent(file.path, file.content);
  });
} else {
  console.log("快照不存在");
}
```

---

#### deleteSnapshot(id: string): boolean

删除快照。

**参数**:
- `id: string` - 快照 ID

**返回值**: `boolean` - 是否删除成功

**示例**:

```typescript
// 删除快照
const success = snapshotManager.deleteSnapshot(snapshotId);

if (success) {
  console.log("快照已删除");
} else {
  console.log("快照不存在或删除失败");
}
```

---

#### compareSnapshots(id1: string, id2: string): SnapshotComparison | null

比较两个快照。

**参数**:
- `id1: string` - 第一个快照 ID
- `id2: string` - 第二个快照 ID

**返回值**: `SnapshotComparison | null`

**类型定义**:

```typescript
interface SnapshotComparison {
  added: string[];      // 新增的文件路径
  removed: string[];    // 删除的文件路径
  modified: string[];   // 修改的文件路径
  unchanged: string[];  // 未变化的文件路径
}
```

**示例**:

```typescript
// 比较两个快照
const comparison = snapshotManager.compareSnapshots(snapshotId1, snapshotId2);

if (comparison) {
  console.log(`新增文件: ${comparison.added.length}`);
  console.log(`删除文件: ${comparison.removed.length}`);
  console.log(`修改文件: ${comparison.modified.length}`);
  console.log(`未变化: ${comparison.unchanged.length}`);
  
  // 详细信息
  comparison.added.forEach(path => console.log(`  + ${path}`));
  comparison.removed.forEach(path => console.log(`  - ${path}`));
  comparison.modified.forEach(path => console.log(`  * ${path}`));
} else {
  console.log("快照不存在");
}
```

---

#### clearAllSnapshots(): void

清除所有快照。

**参数**: 无

**返回值**: `void`

**示例**:

```typescript
// 清除所有快照
snapshotManager.clearAllSnapshots();
console.log("所有快照已清除");
```

---

### 性能优化特性

1. **快照压缩**: 超过 10KB 的快照自动压缩
2. **增量存储**: 相同内容的文件复用哈希
3. **容量控制**: 最大 5MB，自动清理旧快照
4. **智能清理**: 根据访问频率和时间自动清理

---

## CodeValidator API

### 类：CodeValidatorOptimized

**用途**: 验证 AI 生成的代码，检查语法、安全性、最佳实践等。

**文件位置**: `src/app/components/ide/CodeValidator.optimized.ts`

### 核心方法

#### validate(block: ParsedCodeBlock): ValidationResult

验证代码块。

**参数**:
- `block: ParsedCodeBlock` - 代码块

**返回值**: `ValidationResult`

**类型定义**:

```typescript
interface ParsedCodeBlock {
  filepath: string;    // 文件路径
  content: string;     // 代码内容
  language: string;    // 语言类型
  isNewFile: boolean;  // 是否新文件
}

interface ValidationResult {
  valid: boolean;           // 是否有效
  warnings: string[];       // 警告列表
  errors: string[];         // 错误列表
  suggestions: string[];    // 建议列表
  metrics: {
    lines: number;          // 行数
    characters: number;     // 字符数
    complexity: "low" | "medium" | "high";  // 复杂度
  };
}
```

**示例**:

```typescript
import { CodeValidatorOptimized } from "./CodeValidator.optimized";

const validator = new CodeValidatorOptimized();

// 验证代码
const result = validator.validate({
  filepath: "src/utils/helper.ts",
  content: `
    export function formatDate(date: Date): string {
      return date.toISOString().split('T')[0];
    }
  `,
  language: "typescript",
  isNewFile: false
});

console.log(`验证通过: ${result.valid}`);
console.log(`错误: ${result.errors.length}`);
console.log(`警告: ${result.warnings.length}`);
console.log(`建议: ${result.suggestions.length}`);
console.log(`复杂度: ${result.metrics.complexity}`);
console.log(`行数: ${result.metrics.lines}`);
```

---

#### validateBatch(blocks: ParsedCodeBlock[]): ValidationResult[]

批量验证多个代码块。

**参数**:
- `blocks: ParsedCodeBlock[]` - 代码块数组

**返回值**: `ValidationResult[]` - 验证结果数组

**示例**:

```typescript
// 批量验证
const blocks = [
  {
    filepath: "src/utils/date.ts",
    content: "export const now = () => new Date();",
    language: "typescript",
    isNewFile: true
  },
  {
    filepath: "src/utils/string.ts",
    content: "export const trim = (s: string) => s.trim();",
    language: "typescript",
    isNewFile: true
  }
];

const results = validator.validateBatch(blocks);

results.forEach((result, index) => {
  console.log(`文件 ${blocks[index].filepath}: ${result.valid ? '✓' : '✗'}`);
});
```

---

#### getPerformanceStats(): PerformanceStats

获取性能统计信息。

**参数**: 无

**返回值**: `PerformanceStats`

**类型定义**:

```typescript
interface PerformanceStats {
  totalValidations: number;  // 总验证次数
  totalTime: number;         // 总耗时（ms）
  cacheHits: number;         // 缓存命中次数
}
```

**示例**:

```typescript
const stats = validator.getPerformanceStats();

console.log(`总验证次数: ${stats.totalValidations}`);
console.log(`总耗时: ${stats.totalTime}ms`);
console.log(`缓存命中: ${stats.cacheHits}`);
console.log(`平均耗时: ${stats.totalTime / stats.totalValidations}ms`);
```

---

#### clearCache(): void

清除缓存。

**参数**: 无

**返回值**: `void`

**示例**:

```typescript
// 清除缓存
validator.clearCache();
console.log("缓存已清除");
```

---

### 性能优化特性

1. **正则缓存**: 避免重复编译正则表达式
2. **结果缓存**: 缓存验证结果
3. **并行验证**: 多文件同时验证
4. **增量验证**: 只验证变更部分

---

## SystemPromptBuilder API

### 函数：detectIntentOptimized

**用途**: 检测用户意图，支持缓存优化。

**文件位置**: `src/app/components/ide/ai/SystemPromptBuilder.optimized.ts`

### 签名

```typescript
function detectIntentOptimized(userMessage: string): UserIntent
```

**参数**:
- `userMessage: string` - 用户消息

**返回值**: `UserIntent` - 用户意图

**类型定义**:

```typescript
type UserIntent =
  | "generate"  // 生成代码
  | "modify"    // 修改代码
  | "fix"       // 修复代码
  | "explain"   // 解释代码
  | "refactor"  // 重构代码
  | "test"      // 生成测试
  | "review"    // 代码审查
  | "general";  // 通用
```

**示例**:

```typescript
import { detectIntentOptimized } from "./SystemPromptBuilder.optimized";

// 检测意图
const intent1 = detectIntentOptimized("创建一个用户登录表单");
console.log(intent1); // "generate"

const intent2 = detectIntentOptimized("修复登录页面的报错");
console.log(intent2); // "fix"

const intent3 = detectIntentOptimized("解释这段代码的作用");
console.log(intent3); // "explain"

const intent4 = detectIntentOptimized("为用户服务生成单元测试");
console.log(intent4); // "test"
```

---

### 函数：buildSystemPromptOptimized

**用途**: 构建优化的系统提示词。

### 签名

```typescript
function buildSystemPromptOptimized(
  projectContext: ProjectContext,
  userMessage: string
): string
```

**参数**:
- `projectContext: ProjectContext` - 项目上下文
- `userMessage: string` - 用户消息

**返回值**: `string` - 系统提示词

**示例**:

```typescript
import { buildSystemPromptOptimized } from "./SystemPromptBuilder.optimized";

const context: ProjectContext = {
  projectType: "react",
  framework: "React",
  language: "TypeScript",
  dependencies: ["react", "react-dom"],
  fileStructure: {
    "src/App.tsx": "...",
    "src/index.tsx": "..."
  }
};

const prompt = buildSystemPromptOptimized(
  context,
  "创建一个用户登录表单"
);

console.log(prompt);
```

---

### 函数：estimateTokensOptimized

**用途**: 估算文本的 Token 数量。

### 签名

```typescript
function estimateTokensOptimized(text: string): number
```

**参数**:
- `text: string` - 文本内容

**返回值**: `number` - Token 数量

**示例**:

```typescript
import { estimateTokensOptimized } from "./SystemPromptBuilder.optimized";

const text = "创建一个用户登录表单，包含用户名和密码输入框";
const tokens = estimateTokensOptimized(text);

console.log(`Token 数量: ${tokens}`);
```

---

### 函数：compressContextOptimized

**用途**: 压缩上下文，减少 Token 使用。

### 签名

```typescript
function compressContextOptimized(
  context: string,
  maxTokens: number
): string
```

**参数**:
- `context: string` - 原始上下文
- `maxTokens: number` - 最大 Token 数

**返回值**: `string` - 压缩后的上下文

**示例**:

```typescript
import { compressContextOptimized } from "./SystemPromptBuilder.optimized";

const longContext = "..."; // 很长的上下文
const compressed = compressContextOptimized(longContext, 1000);

console.log(`原始长度: ${longContext.length}`);
console.log(`压缩后长度: ${compressed.length}`);
```

---

### 性能优化特性

1. **意图缓存**: 缓存意图检测结果
2. **Token 估算优化**: 精确算法 + 缓存
3. **上下文压缩**: 智能截断，压缩率 > 60%

---

## 类型定义

### PreviewMode

```typescript
type PreviewMode = "realtime" | "manual" | "delayed";
```

### DevicePreset

```typescript
type DevicePreset = "desktop" | "tablet" | "mobile" | "custom";
```

### ProjectContext

```typescript
interface ProjectContext {
  projectType: string;
  framework: string;
  language: string;
  dependencies: string[];
  fileStructure: Record<string, string>;
}
```

---

## 完整使用示例

### 示例 1：预览模式控制

```typescript
import { PreviewModeControllerOptimized } from "./PreviewModeController.optimized";

// 创建控制器
const controller = new PreviewModeControllerOptimized(
  () => refreshPreview(),
  500
);

// 设置实时模式
controller.setMode("realtime");

// 在编辑器中监听变更
editor.onChange(() => {
  controller.handleFileChange();
});

// 获取状态
const status = controller.getStatus();
console.log(`当前模式: ${status.mode}`);

// 销毁
controller.destroy();
```

### 示例 2：快照管理

```typescript
import { SnapshotManagerOptimized } from "./SnapshotManager.optimized";

const manager = new SnapshotManagerOptimized();

// 创建快照
const id = manager.createSnapshot("v1.0", files);

// 列出快照
const snapshots = manager.listSnapshots();

// 恢复快照
const restored = manager.restoreSnapshot(id);

// 比较快照
const diff = manager.compareSnapshots(id1, id2);
```

### 示例 3：代码验证

```typescript
import { CodeValidatorOptimized } from "./CodeValidator.optimized";

const validator = new CodeValidatorOptimized();

// 验证代码
const result = validator.validate({
  filepath: "src/App.tsx",
  content: "...",
  language: "typescript",
  isNewFile: false
});

if (!result.valid) {
  console.error("验证失败:", result.errors);
}

// 查看性能统计
const stats = validator.getPerformanceStats();
```

### 示例 4：系统提示词构建

```typescript
import {
  detectIntentOptimized,
  buildSystemPromptOptimized,
  estimateTokensOptimized
} from "./SystemPromptBuilder.optimized";

// 检测意图
const intent = detectIntentOptimized("创建登录表单");

// 构建提示词
const prompt = buildSystemPromptOptimized(context, "创建登录表单");

// 估算 Token
const tokens = estimateTokensOptimized(prompt);
```

---

## 性能基准

### 预览模式控制器

| 操作 | 性能预算 | 实测 |
|------|---------|------|
| 实时模式节流 | < 100ms | ✅ 100ms |
| 延迟模式防抖 | < 500ms | ✅ 305ms |

### 快照管理器

| 操作 | 性能预算 | 实测 |
|------|---------|------|
| 快照创建 | < 100ms | ✅ < 100ms |
| 快照恢复 | < 50ms | ✅ < 50ms |

### 代码验证器

| 操作 | 性能预算 | 实测 |
|------|---------|------|
| 单文件验证 | < 50ms | ✅ < 50ms |
| 10 文件并行验证 | < 200ms | ✅ < 200ms |

### 系统提示词构建

| 操作 | 性能预算 | 实测 |
|------|---------|------|
| 意图检测 | < 10ms | ✅ 0.02ms |
| 提示词构建 | < 20ms | ✅ < 20ms |
| Token 估算 | < 1ms | ✅ 0.02ms |

---

## 相关文档

- [IDE功能使用指南](./IDE功能-使用指南.md)
- [P0-核心架构](../P0-核心架构/)
- [性能优化报告](../P3-优化完善/YYC3-P3-优化-性能优化.md)

---

**文档版本**: v1.1.0  
**最后更新**: 2026-03-31  
**维护团队**: YanYuCloudCube Team
