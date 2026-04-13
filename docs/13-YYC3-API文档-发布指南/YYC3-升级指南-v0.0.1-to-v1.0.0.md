# 升级指南 v0.0.1 → v1.0.0

> **从版本**: v0.0.1  
> **到版本**: v1.0.0  
> **发布日期**: 2026-03-31  
> **升级难度**: 中等

## 概述

本指南将帮助你从 v0.0.1 升级到 v1.0.0。这个版本包含了许多新功能和改进，但也有一些不兼容的变更。

## 🚨 重大变更

### 1. 状态管理重构

#### 变更说明

v1.0.0 对状态管理进行了重构，将多个 Store 合并和重新组织。

#### 影响范围

- `useAIStore`
- `useFileStore`
- `usePanelStore`
- `useThemeStore`
- `useSettingsStore`

#### 迁移步骤

**旧代码 (v0.0.1)**:
```typescript
import { useAIStore } from '@/stores/ai';

const messages = useAIStore(state => state.messages);
const addMessage = useAIStore(state => state.addMessage);
```

**新代码 (v1.0.0)**:
```typescript
import { useAIStore } from '@/app/components/ide/stores/useAIStore';

const messages = useAIStore(state => state.messages);
const addMessage = useAIStore(state => state.actions.addMessage);
```

**关键变更**:
- Store 路径变更
- Actions 嵌套在 `actions` 对象中

### 2. 插件系统升级

#### 变更说明

v1.0.0 引入了完整的插件系统，插件接口有重大变更。

#### 影响范围

- 插件开发者
- 自定义插件

#### 迁移步骤

**旧代码 (v0.0.1)**:
```typescript
// 简单的插件对象
const myPlugin = {
  name: 'my-plugin',
  activate() {
    console.log('Plugin activated');
  },
};
```

**新代码 (v1.0.0)**:
```typescript
// 完整的插件清单
const myPlugin: PluginManifest = {
  id: 'com.example.my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  main: 'dist/index.js',
  activationPoints: ['onStartup'],
  contributes: {
    commands: [
      {
        id: 'myPlugin.hello',
        title: 'Say Hello',
      },
    ],
  },
  activate(context: PluginContext) {
    context.subscriptions.push(
      context.commands.register('myPlugin.hello', () => {
        console.log('Hello from plugin!');
      })
    );
  },
};
```

**关键变更**:
- 插件清单格式变更
- 需要定义 `activationPoints`
- 需要使用 `PluginContext`

### 3. LLM Provider 接口变更

#### 变更说明

v1.0.0 统一了 LLM Provider 接口，移除了部分旧接口。

#### 影响范围

- LLM Provider 配置
- 自定义 Provider

#### 迁移步骤

**旧代码 (v0.0.1)**:
```typescript
const provider = createProvider({
  type: 'openai',
  apiKey: 'sk-...',
  // 旧配置格式
});
```

**新代码 (v1.0.0)**:
```typescript
import { LLMProviderFactory } from '@/app/components/ide/llm/LLMProviderFactory';

const provider = LLMProviderFactory.createProvider({
  type: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4',
  baseURL: 'https://api.openai.com/v1',
});
```

**关键变更**:
- 使用 `LLMProviderFactory` 创建 Provider
- 新增 `model` 和 `baseURL` 参数

## 📦 依赖更新

### 主要依赖升级

| 包名 | 旧版本 | 新版本 | 变更类型 |
|------|--------|--------|----------|
| `react` | 18.2.0 | 18.3.1 | Minor |
| `react-dom` | 18.2.0 | 18.3.1 | Minor |
| `typescript` | 5.6.x | 5.8.x | Minor |
| `vite` | 6.2.x | 6.3.x | Minor |
| `zustand` | 4.x | 5.x | Major |
| `tailwindcss` | 3.x | 4.x | Major |

### 升级步骤

1. **更新 package.json**:
```bash
# 更新依赖
pnpm update
```

2. **检查破坏性变更**:
```bash
# 检查 Zustand 迁移
# 参考: https://github.com/pmndrs/zustand/blob/main/docs/migrating-to-v5.md

# 检查 Tailwind CSS v4 迁移
# 参考: https://tailwindcss.com/docs/upgrade-guide
```

3. **运行测试**:
```bash
pnpm test
```

## 🗂️ 文件结构变更

### 新增目录

```
src/app/components/ide/
├── llm/                    # LLM 服务（新增）
│   ├── LLMProviderFactory.ts
│   ├── IntentRecognizer.ts
│   └── ContextManager.ts
├── testing/                # 测试工具（新增）
│   ├── PerformanceTestSuite.ts
│   ├── BoundaryTestSuite.ts
│   └── CompatibilityTestSuite.ts
└── theme/                  # 主题系统（重组）
    ├── ThemeManager.ts
    ├── ThemeAPI.ts
    └── CSSVariableInjector.ts
```

### 迁移步骤

1. **更新导入路径**:
```typescript
// 旧路径
import { themeManager } from '@/theme/ThemeManager';

// 新路径
import { themeManager } from '@/app/components/ide/theme/ThemeManager';
```

2. **检查文件引用**:
```bash
# 搜索旧路径
grep -r "from '@/theme/" src/

# 替换为新路径
sed -i "s|from '@/theme/|from '@/app/components/ide/theme/|g" src/**/*.ts
```

## ⚙️ 配置变更

### Vite 配置

**vite.config.ts** 变更:

```typescript
// 旧配置
export default defineConfig({
  plugins: [react()],
});

// 新配置
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 新增 Tailwind CSS v4 插件
  ],
  build: {
    target: 'esnext', // 新增
    sourcemap: true,  // 新增
  },
});
```

### TypeScript 配置

**tsconfig.json** 变更:

```json
{
  "compilerOptions": {
    "target": "ES2022",     // 更新
    "module": "ESNext",     // 更新
    "lib": ["ES2023", "DOM"], // 更新
    "strict": true,
    "noUncheckedIndexedAccess": true // 新增
  }
}
```

## 🧪 测试迁移

### 测试框架更新

v1.0.0 升级了测试框架版本，部分测试 API 有变更。

**旧代码 (v0.0.1)**:
```typescript
import { render } from '@testing-library/react';

test('test', () => {
  const { getByText } = render(<Component />);
  expect(getByText('Hello')).toBeInTheDocument();
});
```

**新代码 (v1.0.0)**:
```typescript
import { render, screen } from '@testing-library/react';

test('test', () => {
  render(<Component />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

**关键变更**:
- 推荐使用 `screen` 对象
- 更好的查询方法

## 🔄 数据迁移

### IndexedDB 数据迁移

v1.0.0 对 IndexedDB 结构进行了优化，需要迁移数据。

```typescript
// 迁移脚本
import { migrateDB } from '@/app/components/ide/adapters/IndexedDBAdapter';

async function migrate() {
  const oldVersion = await getOldVersion();
  
  if (oldVersion < 2) {
    // 执行迁移
    await migrateDB(oldVersion, 2);
  }
}
```

### localStorage 数据迁移

部分 localStorage 键名已变更：

| 旧键名 | 新键名 |
|--------|--------|
| `theme` | `yyc3-theme` |
| `settings` | `yyc3-settings` |
| `layout` | `yyc3-layout` |

```typescript
// 迁移脚本
function migrateLocalStorage() {
  // 主题配置
  const oldTheme = localStorage.getItem('theme');
  if (oldTheme) {
    localStorage.setItem('yyc3-theme', oldTheme);
    localStorage.removeItem('theme');
  }
  
  // 设置配置
  const oldSettings = localStorage.getItem('settings');
  if (oldSettings) {
    localStorage.setItem('yyc3-settings', oldSettings);
    localStorage.removeItem('settings');
  }
}
```

## 📝 API 变更

### 废弃的 API

以下 API 已废弃，将在 v2.0.0 中移除：

| 废弃 API | 替代 API | 说明 |
|----------|----------|------|
| `createProvider()` | `LLMProviderFactory.createProvider()` | 使用工厂方法 |
| `themeManager.setTheme()` | `themeAPI.applyTheme()` | 使用 ThemeAPI |
| `deviceSimulator.capture()` | `deviceSimulator.captureScreenshot()` | 更明确的命名 |

### 新增的 API

v1.0.0 新增了大量 API：

- **IntentRecognizer**: 意图识别
- **ContextManager**: 上下文管理
- **TokenCounter**: Token 计算
- **CostEstimator**: 成本估算
- **PluginAPIFactory**: 插件 API 工厂

## 🚀 升级步骤总结

### 1. 准备工作

```bash
# 1. 备份当前代码
git checkout -b backup-v0.0.1

# 2. 创建升级分支
git checkout main
git checkout -b upgrade-to-v1.0.0

# 3. 拉取最新代码
git pull origin main
```

### 2. 更新依赖

```bash
# 1. 删除旧依赖
rm -rf node_modules pnpm-lock.yaml

# 2. 更新 package.json
# 手动更新依赖版本

# 3. 安装新依赖
pnpm install
```

### 3. 更新代码

```bash
# 1. 更新导入路径
# 手动或使用脚本更新

# 2. 更新 API 调用
# 根据上述 API 变更更新代码

# 3. 运行迁移脚本
pnpm run migrate
```

### 4. 测试验证

```bash
# 1. 运行类型检查
pnpm typecheck

# 2. 运行测试
pnpm test

# 3. 运行构建
pnpm build

# 4. 运行 E2E 测试
pnpm test:e2e
```

### 5. 部署上线

```bash
# 1. 合并到主分支
git checkout main
git merge upgrade-to-v1.0.0

# 2. 创建版本标签
git tag v1.0.0

# 3. 推送到远程
git push origin main --tags
```

## ❓ 常见问题

### Q: 升级后样式错乱？

**A**: 检查 Tailwind CSS v4 配置，确保所有类名都正确迁移。

### Q: 状态丢失？

**A**: 检查 localStorage 迁移是否正确执行，必要时手动迁移数据。

### Q: 插件无法加载？

**A**: 更新插件清单格式，确保符合 v1.0.0 的插件规范。

### Q: LLM 请求失败？

**A**: 检查 Provider 配置，确保使用新的 `LLMProviderFactory`。

## 📞 获取帮助

如果在升级过程中遇到问题，可以通过以下方式获取帮助：

- **GitHub Issues**: [https://github.com/YanYuCloudCube/YYC3-Family-AI/issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues)
- **文档**: [docs/](../docs/)
- **示例**: [examples/](../examples/)

---

**维护者**: YYC3 团队  
**最后更新**: 2026-03-31
