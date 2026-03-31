# MCP 功能使用指南

**版本**: v1.0.0  
**创建日期**: 2026-03-19

---

## 📊 MCP 功能概览

### 什么是 MCP?

MCP (Model Context Protocol) 是一个开放的协议标准，用于 AI 模型与外部工具和资源的交互。

### 已实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| **MCP 客户端** | ✅ | 连接 MCP 服务器 |
| **MCP 服务器配置** | ✅ | 多服务器支持 |
| **MCP 工具集成** | ✅ | 文件/Git/数据库/记忆 |
| **MCP 资源管理** | ✅ | 资源读取和缓存 |
| **MCP 提示词模板** | ✅ | 8 个内置模板 |

---

## 🔧 MCP 客户端使用

### 初始化

```typescript
import { createMCPClient } from "./services/MCPClient";

const client = createMCPClient({
  serverUrl: "http://localhost:3000",
  apiKey: "your-api-key",
  timeout: 30000,
});

// 连接服务器
await client.connect();
```

### 调用工具

```typescript
// 列出可用工具
const tools = client.listTools();

// 调用工具
const result = await client.callTool("read_file", {
  path: "/path/to/file.txt",
});

if (result.success) {
  console.log("Content:", result.data.content);
}
```

### 读取资源

```typescript
// 列出资源
const resources = client.listResources();

// 读取资源
const content = await client.readResource("file:///path/to/file.txt");
console.log("Content:", content.text);
```

### 获取提示词

```typescript
// 列出提示词
const prompts = client.listPrompts();

// 获取提示词
const messages = await client.getPrompt("code-review", {
  code: "const x = 1;",
  language: "typescript",
});
```

---

## 🛠️ MCP 工具使用

### 文件操作工具

```typescript
import { MCPToolManager } from "./services/MCPTools";

const tools = new MCPToolManager(client);

// 读取文件
const content = await tools.fs.readFile("src/App.tsx");

// 写入文件
await tools.fs.writeFile("src/Test.tsx", "export default function Test() {}");

// 列出目录
const files = await tools.fs.listDirectory("src");

// 搜索文件
const tsFiles = await tools.fs.searchFiles("src", "\\.tsx$");
```

### Git 操作工具

```typescript
// 获取状态
const status = await tools.git.status();
console.log("Staged:", status.staged);
console.log("Unstaged:", status.unstaged);

// Git Diff
const diff = await tools.git.diff();
console.log("Diff:", diff);

// Git Commit
const hash = await tools.git.commit("feat: add new feature");
console.log("Commit:", hash);

// Git Push
await tools.git.push();

// Git Log
const log = await tools.git.log(5);
console.log("Recent commits:", log);
```

### 数据库操作工具

```typescript
// 查询
const rows = await tools.db.query("SELECT * FROM users WHERE id = 1");

// 列出表
const tables = await tools.db.listTables();

// 描述表
const columns = await tools.db.describeTable("users");

// 插入
await tools.db.insert("users", { name: "John", email: "john@example.com" });

// 更新
await tools.db.update("users", { name: "Jane" }, "id = 1");

// 删除
await tools.db.delete("users", "id = 1");
```

### 记忆管理工具

```typescript
// 创建记忆
const id = await tools.memory.createMemory(
  "User prefers dark mode",
  ["preferences", "ui"]
);

// 搜索记忆
const memories = await tools.memory.searchMemories("dark mode", 5);

// 更新记忆
await tools.memory.updateMemory(id, "User prefers light mode");

// 删除记忆
await tools.memory.deleteMemory(id);
```

---

## 📚 MCP 资源管理

### 读取资源

```typescript
import { MCPResourceManager } from "./services/MCPResources";

const resourceManager = new MCPResourceManager(client);

// 读取资源 (带缓存)
const content = await resourceManager.readResource("file:///path/to/file.txt");

// 强制刷新
const freshContent = await resourceManager.readResource(
  "file:///path/to/file.txt",
  true
);
```

### 订阅资源变化

```typescript
// 订阅
const unsubscribe = resourceManager.subscribe(
  "file:///path/to/file.txt",
  (content) => {
    console.log("Resource updated:", content);
  }
);

// 取消订阅
unsubscribe();
```

### 预加载资源

```typescript
// 预加载多个资源
await resourceManager.preloadResources([
  "file:///src/App.tsx",
  "file:///src/index.tsx",
  "file:///package.json",
]);
```

### 缓存管理

```typescript
// 清除缓存
resourceManager.clearCache(); // 清除所有
resourceManager.clearCache("file:///path/to/file.txt"); // 清除特定

// 获取缓存统计
const stats = resourceManager.getCacheStats();
console.log("Cache hit rate:", stats.hitRate);
```

---

## 💡 MCP 提示词模板

### 内置模板

| 模板名称 | 说明 | 参数 |
|----------|------|------|
| **code-review** | 代码审查 | code, language, focus |
| **code-generation** | 代码生成 | description, language, framework, requirements |
| **code-explanation** | 代码解释 | code, language, level |
| **bug-fix** | Bug 修复 | code, error, expected, actual |
| **test-generation** | 测试生成 | code, framework, coverage |
| **documentation** | 文档生成 | code, type, language |
| **refactoring** | 重构建议 | code, goals, constraints |
| **performance-optimization** | 性能优化 | code, bottleneck, metrics |

### 使用模板

```typescript
import { MCPPromptManager } from "./services/MCPPrompts";

const promptManager = new MCPPromptManager(client);

// 使用代码审查模板
const messages = await promptManager.useTemplate("code-review", {
  code: "const x = 1;",
  language: "typescript",
  focus: "performance",
});
```

### 自定义模板

```typescript
// 添加模板
promptManager.addTemplate({
  name: "my-custom-template",
  description: "My custom prompt template",
  arguments: {
    input: "Input text",
    style: "Writing style",
  },
});

// 导出模板
const json = promptManager.exportTemplate("my-custom-template");

// 导入模板
promptManager.importTemplate(json);

// 搜索模板
const results = promptManager.searchTemplates("code");
```

---

## 🔌 MCP 服务器配置

### 配置文件

`mcp.config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"],
      "description": "本地文件系统访问",
      "tools": ["read_file", "write_file", "list_directory"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "/path/to/project"],
      "description": "Git 版本控制操作",
      "tools": ["git_status", "git_diff", "git_commit"]
    }
  },
  "mcpSettings": {
    "autoConnect": true,
    "timeout": 30000,
    "retryAttempts": 3,
    "logLevel": "info"
  }
}
```

### 可用服务器

| 服务器 | 命令 | 说明 |
|--------|------|------|
| **filesystem** | @modelcontextprotocol/server-filesystem | 文件系统访问 |
| **git** | @modelcontextprotocol/server-git | Git 操作 |
| **database** | @modelcontextprotocol/server-database | 数据库查询 |
| **memory** | @modelcontextprotocol/server-memory | 长期记忆 |
| **sequential-thinking** | @modelcontextprotocol/server-sequential-thinking | 顺序思考 |

---

## 🎯 最佳实践

### 1. 连接管理

```typescript
// 单例模式
let mcpClient: MCPClient | null = null;

async function getMCPClient(): Promise<MCPClient> {
  if (!mcpClient) {
    mcpClient = createMCPClient(config);
    await mcpClient.connect();
  }
  return mcpClient;
}
```

### 2. 错误处理

```typescript
try {
  const result = await client.callTool("read_file", { path });
  if (result.success) {
    // 处理结果
  } else {
    console.error("Tool call failed:", result.error);
  }
} catch (error) {
  console.error("MCP error:", error);
}
```

### 3. 资源缓存

```typescript
// 设置合理的 TTL
resourceManager.setCacheTTL(10 * 60 * 1000); // 10 分钟

// 定期清理过期缓存
setInterval(() => {
  resourceManager.clearCache();
}, 15 * 60 * 1000);
```

### 4. 提示词历史

```typescript
// 保存历史
const history = await promptManager.getPromptHistory(10);

// 清除历史
promptManager.clearPromptHistory();
```

---

## 📋 使用示例

### 完整示例

```typescript
import { createMCPClient } from "./services/MCPClient";
import { MCPToolManager } from "./services/MCPTools";
import { MCPPromptManager } from "./services/MCPPrompts";

async function main() {
  // 初始化客户端
  const client = createMCPClient({
    serverUrl: "http://localhost:3000",
    apiKey: "your-api-key",
  });

  // 连接服务器
  await client.connect();

  // 创建工具管理器
  const tools = new MCPToolManager(client);
  const promptManager = new MCPPromptManager(client);

  // 读取文件
  const code = await tools.fs.readFile("src/App.tsx");

  // 使用代码审查模板
  const messages = await promptManager.useTemplate("code-review", {
    code,
    language: "typescript",
    focus: "performance",
  });

  // 发送消息给 AI
  const response = await sendToAI(messages);

  // 保存审查结果
  await tools.fs.writeFile("src/App.review.md", response);

  // 断开连接
  await client.disconnect();
}
```

---

<div align="center">

> 「***YanYuCloudCube***」  
> 「***<admin@0379.email>***」  
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**维护团队**: YanYuCloudCube Team

</div>
