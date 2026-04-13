# YYC³ Family-AI 插件开发指南

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*

---

## 📋 文档信息

| 属性 | 值 |
|------|-----|
| **文档名称** | YYC³ Family-AI 插件开发指南 |
| **版本** | v1.0.0 |
| **创建日期** | 2026-04-04 |
| **适用项目** | YYC3-Family-AI |
| **许可证** | MIT |

---

## 🎯 一、插件系统概述

### 1.1 什么是 YYC³ 插件？

YYC³ 插件是扩展 IDE 功能的模块化组件，可以：
- 添加新的代码分析工具
- 集成第三方服务
- 自定义 UI 面板
- 扩展 AI 能力

### 1.2 插件架构

```
┌─────────────────────────────────────────────────────────────┐
│                    YYC³ 插件架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Plugin Host (插件宿主)                 │   │
│  │  ├─ PluginRegistry (插件注册表)                     │   │
│  │  ├─ PluginLoader (插件加载器)                       │   │
│  │  └─ PluginSandbox (插件沙箱)                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Plugin API (插件接口)                  │   │
│  │  ├─ Editor API (编辑器接口)                         │   │
│  │  ├─ File API (文件系统接口)                         │   │
│  │  ├─ AI API (AI 能力接口)                            │   │
│  │  └─ UI API (UI 组件接口)                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Plugins (插件实例)                     │   │
│  │  ├─ ESLint Plugin                                   │   │
│  │  ├─ Prettier Plugin                                 │   │
│  │  ├─ AI Tools Plugin                                 │   │
│  │  └─ Custom Plugins...                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 二、插件类型

### 2.1 内置插件

YYC³ 内置 9 个核心插件：

| 插件 ID | 名称 | 类型 | 功能 |
|---------|------|------|------|
| `plugin-eslint` | ESLint 代码检查 | code-quality | 实时代码检查和自动修复 |
| `plugin-prettier` | Prettier 格式化 | code-quality | 代码格式化 |
| `plugin-git-lens` | Git 增强 | version-control | Git 历史和 blame |
| `plugin-path-intellisense` | 路径智能提示 | productivity | 文件路径自动补全 |
| `plugin-auto-rename-tag` | 标签自动重命名 | productivity | HTML/JSX 标签同步修改 |
| `plugin-bracket-colorizer` | 括号着色 | visual | 彩色括号匹配 |
| `plugin-error-lens` | 错误内联显示 | visual | 行内错误提示 |
| `plugin-ai-assistant` | AI 编程助手 | ai | AI 代码生成和解释 |
| `plugin-code-spell-checker` | 拼写检查 | code-quality | 代码拼写检查 |

### 2.2 自定义插件类型

```typescript
type PluginCategory = 
  | 'code-quality'    // 代码质量
  | 'version-control' // 版本控制
  | 'productivity'    // 效率工具
  | 'visual'          // 视觉增强
  | 'ai'              // AI 能力
  | 'integration'     // 第三方集成
  | 'theme'           // 主题扩展
  | 'language'        // 语言支持
  | 'custom';         // 自定义类型
```

---

## 🔌 三、插件 API

### 3.1 插件配置接口

```typescript
/**
 * @file PluginTypes.ts
 * @description 插件类型定义
 */

interface PluginConfig {
  /** 插件唯一标识符 (kebab-case) */
  id: string;
  
  /** 插件显示名称 */
  name: string;
  
  /** 插件描述 */
  description: string;
  
  /** 插件版本 (semver) */
  version: string;
  
  /** 作者信息 */
  author: string | {
    name: string;
    email?: string;
    url?: string;
  };
  
  /** 插件分类 */
  category: PluginCategory;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 是否为内置插件 */
  isBuiltIn: boolean;
  
  /** 是否可配置 */
  configurable: boolean;
  
  /** 插件图标 (可选) */
  icon?: string;
  
  /** 插件主页 (可选) */
  homepage?: string;
  
  /** 仓库地址 (可选) */
  repository?: string;
  
  /** 许可证 */
  license?: string;
  
  /** 依赖的其他插件 */
  dependencies?: string[];
  
  /** 支持的 YYC³ 版本范围 */
  engines?: {
    yyc3: string;
  };
  
  /** 安装时间 */
  installedAt?: string;
  
  /** 最后更新时间 */
  lastUpdated?: string;
  
  /** 插件配置项 */
  settings?: PluginSetting[];
  
  /** 插件权限 */
  permissions?: PluginPermission[];
}

interface PluginSetting {
  /** 配置项键名 */
  key: string;
  
  /** 配置项类型 */
  type: 'string' | 'number' | 'boolean' | 'select' | 'array';
  
  /** 默认值 */
  default: any;
  
  /** 显示名称 */
  label: string;
  
  /** 描述 */
  description?: string;
  
  /** 选项 (type 为 select 时) */
  options?: { label: string; value: any }[];
  
  /** 是否必填 */
  required?: boolean;
}

type PluginPermission = 
  | 'file:read'       // 读取文件
  | 'file:write'      // 写入文件
  | 'file:delete'     // 删除文件
  | 'network:request' // 网络请求
  | 'clipboard:read'  // 读取剪贴板
  | 'clipboard:write' // 写入剪贴板
  | 'ai:generate'     // AI 生成
  | 'ai:analyze';     // AI 分析
```

### 3.2 插件生命周期接口

```typescript
/**
 * 插件生命周期钩子
 */
interface PluginLifecycle {
  /** 插件安装时调用 */
  install?: (context: PluginContext) => Promise<void> | void;
  
  /** 插件启用时调用 */
  activate?: (context: PluginContext) => Promise<void> | void;
  
  /** 插件禁用时调用 */
  deactivate?: (context: PluginContext) => Promise<void> | void;
  
  /** 插件卸载时调用 */
  uninstall?: (context: PluginContext) => Promise<void> | void;
}

/**
 * 插件上下文
 */
interface PluginContext {
  /** 插件配置 */
  config: PluginConfig;
  
  /** 获取设置值 */
  getSetting: <T = any>(key: string) => T | undefined;
  
  /** 设置设置值 */
  setSetting: (key: string, value: any) => void;
  
  /** 显示通知 */
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  
  /** 显示确认对话框 */
  showConfirm: (message: string) => Promise<boolean>;
  
  /** 注册命令 */
  registerCommand: (command: PluginCommand) => void;
  
  /** 注册面板 */
  registerPanel: (panel: PluginPanel) => void;
  
  /** 注册状态栏项 */
  registerStatusBarItem: (item: StatusBarItem) => void;
  
  /** 访问文件系统 */
  fs: FileSystemAPI;
  
  /** 访问编辑器 */
  editor: EditorAPI;
  
  /** 访问 AI 能力 */
  ai: AIAPI;
  
  /** 日志输出 */
  log: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
}
```

### 3.3 编辑器 API

```typescript
interface EditorAPI {
  /** 获取当前活动编辑器 */
  getActiveEditor(): Editor | undefined;
  
  /** 获取所有打开的编辑器 */
  getOpenEditors(): Editor[];
  
  /** 打开文件 */
  openFile(path: string): Promise<Editor>;
  
  /** 保存当前文件 */
  saveCurrentFile(): Promise<void>;
  
  /** 在编辑器中插入文本 */
  insertText(editor: Editor, text: string, position?: Position): void;
  
  /** 替换文本 */
  replaceText(editor: Editor, range: Range, text: string): void;
  
  /** 获取选中的文本 */
  getSelection(editor: Editor): Selection | undefined;
  
  /** 设置选区 */
  setSelection(editor: Editor, selection: Selection): void;
  
  /** 注册代码操作提供者 */
  registerCodeActionProvider(provider: CodeActionProvider): void;
  
  /** 注册补全提供者 */
  registerCompletionProvider(provider: CompletionProvider): void;
  
  /** 注册诊断提供者 */
  registerDiagnosticProvider(provider: DiagnosticProvider): void;
}

interface Editor {
  id: string;
  filePath: string;
  language: string;
  content: string;
  cursorPosition: Position;
  selection?: Selection;
}

interface Position {
  line: number;
  column: number;
}

interface Range {
  start: Position;
  end: Position;
}

interface Selection {
  anchor: Position;
  active: Position;
}
```

### 3.4 文件系统 API

```typescript
interface FileSystemAPI {
  /** 读取文件内容 */
  readFile(path: string): Promise<string>;
  
  /** 写入文件 */
  writeFile(path: string, content: string): Promise<void>;
  
  /** 删除文件 */
  deleteFile(path: string): Promise<void>;
  
  /** 检查文件是否存在 */
  fileExists(path: string): Promise<boolean>;
  
  /** 列出目录内容 */
  listDirectory(path: string): Promise<FileInfo[]>;
  
  /** 创建目录 */
  createDirectory(path: string): Promise<void>;
  
  /** 监听文件变化 */
  watchFile(path: string, callback: (event: FileChangeEvent) => void): () => void;
  
  /** 获取工作空间路径 */
  getWorkspacePath(): string | undefined;
  
  /** 相对路径转绝对路径 */
  toAbsolutePath(relativePath: string): string;
}

interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: Date;
}

interface FileChangeEvent {
  type: 'created' | 'changed' | 'deleted';
  path: string;
}
```

### 3.5 AI API

```typescript
interface AIAPI {
  /** 生成代码 */
  generateCode(prompt: string, options?: GenerateOptions): Promise<string>;
  
  /** 解释代码 */
  explainCode(code: string): Promise<string>;
  
  /** 重构代码 */
  refactorCode(code: string, instructions: string): Promise<string>;
  
  /** 分析代码 */
  analyzeCode(code: string): Promise<CodeAnalysis>;
  
  /** 聊天补全 */
  chat(messages: ChatMessage[]): Promise<string>;
  
  /** 获取可用模型列表 */
  getAvailableModels(): ModelInfo[];
  
  /** 设置当前模型 */
  setCurrentModel(modelId: string): void;
}

interface GenerateOptions {
  language?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CodeAnalysis {
  summary: string;
  issues: CodeIssue[];
  suggestions: string[];
  complexity: number;
}

interface CodeIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
}
```

---

## 🛠️ 四、创建你的第一个插件

### 4.1 插件项目结构

```
my-yyc3-plugin/
├── package.json        # 插件元数据
├── src/
│   ├── index.ts        # 插件入口
│   ├── extension.ts    # 插件逻辑
│   └── types.ts        # 类型定义
├── README.md           # 插件说明
├── CHANGELOG.md        # 更新日志
└── tsconfig.json       # TypeScript 配置
```

### 4.2 package.json 配置

```json
{
  "name": "yyc3-plugin-hello-world",
  "version": "1.0.0",
  "displayName": "Hello World",
  "description": "一个简单的 YYC³ 插件示例",
  "author": {
    "name": "Your Name",
    "email": "your@email.com"
  },
  "license": "MIT",
  "engines": {
    "yyc3": ">=1.0.0"
  },
  "categories": ["productivity"],
  "keywords": ["yyc3", "plugin", "example"],
  "main": "./dist/index.js",
  "contributes": {
    "commands": [
      {
        "id": "helloWorld.sayHello",
        "title": "Say Hello"
      }
    ],
    "configuration": {
      "title": "Hello World",
      "properties": {
        "helloWorld.greeting": {
          "type": "string",
          "default": "Hello, YYC³!",
          "description": "自定义问候语"
        }
      }
    }
  }
}
```

### 4.3 插件入口文件

```typescript
/**
 * @file index.ts
 * @description Hello World 插件入口
 */

import type { PluginLifecycle, PluginContext } from '@yyc3/plugin-api';

const plugin: PluginLifecycle = {
  async activate(context: PluginContext) {
    context.log.info('Hello World 插件已激活');

    // 注册命令
    context.registerCommand({
      id: 'helloWorld.sayHello',
      title: 'Say Hello',
      handler: () => {
        const greeting = context.getSetting<string>('greeting') || 'Hello, YYC³!';
        context.showNotification(greeting, 'info');
      },
    });

    // 注册状态栏项
    context.registerStatusBarItem({
      id: 'helloWorld.status',
      text: '$(smiley) Hello',
      tooltip: '点击显示问候',
      command: 'helloWorld.sayHello',
      alignment: 'left',
      priority: 100,
    });
  },

  async deactivate(context: PluginContext) {
    context.log.info('Hello World 插件已停用');
  },
};

export default plugin;
```

### 4.4 构建配置

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 📚 五、高级功能

### 5.1 创建自定义面板

```typescript
context.registerPanel({
  id: 'myPlugin.customPanel',
  title: 'My Panel',
  icon: 'graph',
  position: 'right',
  render: () => {
    return `
      <div class="my-panel">
        <h2>Custom Panel</h2>
        <p>This is my custom panel content.</p>
      </div>
    `;
  },
  onActivate: () => {
    console.log('Panel activated');
  },
  onDeactivate: () => {
    console.log('Panel deactivated');
  },
});
```

### 5.2 代码诊断

```typescript
context.editor.registerDiagnosticProvider({
  language: 'javascript',
  provideDiagnostics: async (document) => {
    const diagnostics = [];
    const lines = document.content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('console.log')) {
        diagnostics.push({
          severity: 'warning',
          message: '避免在生产代码中使用 console.log',
          line: index + 1,
          column: line.indexOf('console.log') + 1,
          source: 'my-plugin',
        });
      }
    });
    
    return diagnostics;
  },
});
```

### 5.3 代码补全

```typescript
context.editor.registerCompletionProvider({
  language: 'javascript',
  triggerCharacters: ['.'],
  provideCompletions: async (document, position) => {
    const completions = [];
    const line = document.content.split('\n')[position.line - 1];
    
    if (line.endsWith('console.')) {
      completions.push(
        { label: 'log', insertText: 'log($1)', documentation: '输出日志' },
        { label: 'error', insertText: 'error($1)', documentation: '输出错误' },
        { label: 'warn', insertText: 'warn($1)', documentation: '输出警告' }
      );
    }
    
    return completions;
  },
});
```

### 5.4 文件监听

```typescript
// 监听文件变化
const disposable = context.fs.watchFile('/src/**/*.ts', (event) => {
  if (event.type === 'changed') {
    context.log.info(`文件已修改: ${event.path}`);
    // 执行自定义逻辑...
  }
});

// 插件停用时取消监听
context.subscriptions.push(disposable);
```

---

## 🚀 六、发布插件

### 6.1 打包插件

```bash
# 构建插件
npm run build

# 打包为 .yyc3-plugin 文件
yyc3 package ./my-plugin
```

### 6.2 发布到插件市场

1. 创建 GitHub 仓库
2. 添加 `yyc3-plugin.json` 元数据文件
3. 发布 Release
4. 提交到 YYC³ 插件索引

### 6.3 插件清单文件

```json
{
  "id": "yyc3-plugin-hello-world",
  "name": "Hello World",
  "version": "1.0.0",
  "description": "一个简单的 YYC³ 插件示例",
  "author": "Your Name",
  "repository": "https://github.com/yourname/yyc3-plugin-hello-world",
  "download": "https://github.com/yourname/yyc3-plugin-hello-world/releases/download/v1.0.0/hello-world-1.0.0.yyc3-plugin",
  "checksum": "sha256:abc123...",
  "yyc3Version": ">=1.0.0"
}
```

---

## 🔒 七、安全最佳实践

### 7.1 权限最小化

```typescript
// ❌ 不推荐：请求所有权限
permissions: ['*']

// ✅ 推荐：只请求必要的权限
permissions: ['file:read', 'ai:generate']
```

### 7.2 数据验证

```typescript
// 始终验证用户输入
function validateInput(input: string): boolean {
  if (typeof input !== 'string') return false;
  if (input.length > 10000) return false;
  if (/<script>/i.test(input)) return false;
  return true;
}
```

### 7.3 敏感数据处理

```typescript
// ❌ 不要记录敏感信息
context.log.info(`API Key: ${apiKey}`);

// ✅ 脱敏处理
context.log.info(`API Key: ${maskApiKey(apiKey)}`);

function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}
```

---

## 📖 八、示例插件

### 8.1 代码片段插件

```typescript
const snippetPlugin: PluginLifecycle = {
  async activate(context) {
    const snippets = {
      'react-component': {
        prefix: 'rfc',
        body: `
import React from 'react';

interface ${1:ComponentName}Props {
  ${2:prop}: ${3:type};
}

export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ ${2:prop} }) => {
  return (
    <div>
      ${4:content}
    </div>
  );
};
`,
        description: 'React 函数组件',
      },
    };

    context.editor.registerCompletionProvider({
      language: 'typescriptreact',
      triggerCharacters: ['.'],
      provideCompletions: async (document, position) => {
        return Object.entries(snippets).map(([key, snippet]) => ({
          label: snippet.prefix,
          insertText: snippet.body,
          documentation: snippet.description,
          kind: 'snippet',
        }));
      },
    });
  },
};
```

### 8.2 AI 辅助插件

```typescript
const aiAssistPlugin: PluginLifecycle = {
  async activate(context) {
    context.registerCommand({
      id: 'aiAssist.explain',
      title: 'AI 解释代码',
      handler: async () => {
        const editor = context.editor.getActiveEditor();
        if (!editor) return;
        
        const selection = context.editor.getSelection(editor);
        if (!selection) {
          context.showNotification('请先选中代码', 'warning');
          return;
        }
        
        const code = editor.content.split('\n')
          .slice(selection.anchor.line, selection.active.line + 1)
          .join('\n');
        
        const explanation = await context.ai.explainCode(code);
        context.showNotification(explanation, 'info');
      },
    });
  },
};
```

---

## 🆘 九、常见问题

### Q1: 插件加载失败？

检查以下几点：
- `package.json` 格式是否正确
- `main` 入口文件路径是否正确
- TypeScript 编译是否成功
- 是否有未声明的权限

### Q2: 如何调试插件？

```typescript
// 使用日志输出
context.log.info('调试信息');
context.log.warn('警告信息');
context.log.error('错误信息');

// 使用浏览器开发者工具
console.log('插件调试');
```

### Q3: 如何处理异步操作？

```typescript
// 使用 async/await
async function handleCommand() {
  try {
    const result = await context.ai.generateCode('...');
    context.showNotification(result, 'success');
  } catch (error) {
    context.showNotification(`错误: ${error.message}`, 'error');
  }
}
```

---

## 📚 十、相关资源

| 资源 | 链接 |
|------|------|
| YYC³ GitHub | https://github.com/YanYuCloudCube/YYC3-Family-AI |
| 插件 API 类型定义 | `src/types/plugin.d.ts` |
| 内置插件示例 | `src/app/components/ide/plugins/` |
| 问题反馈 | https://github.com/YanYuCloudCube/YYC3-Family-AI/issues |

---

**文档版本**: v1.0.0
**最后更新**: 2026-04-04
**维护者**: YanYuCloudCube Team
**许可证**: MIT
