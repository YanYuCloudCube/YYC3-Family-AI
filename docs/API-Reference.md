---
file: API-Reference.md
description: YYC³ IDE API参考文档 - 新增功能模块
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-05
updated: 2026-04-15
status: stable
tags: api,reference,documentation
category: api
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ IDE API 参考文档

## 目录

1. [文件系统增强](#文件系统增强)
2. [数据库连接器](#数据库连接器)
3. [限流与熔断](#限流与熔断)
4. [乐观更新管理](#乐观更新管理)
5. [异步错误边界](#异步错误边界)
6. [存储空间管理](#存储空间管理)
7. [大文件分块处理](#大文件分块处理)
8. [虚拟列表组件](#虚拟列表组件)
9. [Safari兼容性](#safari兼容性)
10. [性能监控](#性能监控)

---

## 文件系统增强

### 模块位置
`src/app/components/ide/stores/useFileStoreZustand.ts`

### API 方法

#### `moveFile(sourcePath: string, targetPath: string): boolean`

移动文件到新位置。

**参数:**
- `sourcePath` - 源文件路径
- `targetPath` - 目标文件路径

**返回值:**
- `true` - 移动成功
- `false` - 移动失败（源文件不存在或目标已存在）

**示例:**
```typescript
const store = useFileStoreZustand.getState();
const success = store.moveFile('src/old.ts', 'src/new.ts');
```

---

#### `copyFile(sourcePath: string, targetPath: string): boolean`

复制文件到新位置。

**参数:**
- `sourcePath` - 源文件路径
- `targetPath` - 目标文件路径

**返回值:**
- `true` - 复制成功
- `false` - 复制失败

**示例:**
```typescript
const store = useFileStoreZustand.getState();
const success = store.copyFile('src/original.ts', 'src/copy.ts');
```

---

#### `moveFolder(sourcePath: string, targetPath: string): boolean`

移动整个文件夹。

**参数:**
- `sourcePath` - 源文件夹路径
- `targetPath` - 目标文件夹路径

**返回值:**
- `true` - 移动成功
- `false` - 移动失败

---

#### `duplicateFile(filePath: string): boolean`

创建文件副本。

**参数:**
- `filePath` - 要复制的文件路径

**返回值:**
- `true` - 复制成功
- `false` - 复制失败

---

## 数据库连接器

### 模块位置
`src/app/components/ide/services/DatabaseConnector.ts`

### 基础类: `DatabaseConnector`

#### `connect(): Promise<boolean>`

建立数据库连接。

**返回值:**
- `true` - 连接成功
- `false` - 连接失败

---

#### `disconnect(): Promise<void>`

断开数据库连接。

---

#### `query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>>`

执行查询操作。

**参数:**
- `sql` - SQL查询语句
- `params` - 查询参数（可选）

**返回值:**
```typescript
interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  fields: FieldInfo[];
  executionTime: number;
}
```

---

#### `execute(sql: string, params?: unknown[]): Promise<number>`

执行更新/删除操作。

**返回值:**
- 受影响的行数

---

### PostgreSQL 连接器

```typescript
import { PostgreSQLConnector } from './services/DatabaseConnector';

const db = new PostgreSQLConnector({
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: 'pass',
  ssl: true,
  poolSize: 10,
});

await db.connect();
const result = await db.query('SELECT * FROM users WHERE id = $1', [1]);
await db.disconnect();
```

### MySQL 连接器

```typescript
import { MySQLConnector } from './services/DatabaseConnector';

const db = new MySQLConnector({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'mydb',
  username: 'user',
  password: 'pass',
});
```

### SQLite 连接器

```typescript
import { SQLiteConnector } from './services/DatabaseConnector';

const db = new SQLiteConnector({
  type: 'sqlite',
  database: '/path/to/database.db',
});
```

---

## 限流与熔断

### 模块位置
`src/app/components/ide/services/RateLimiter.ts`

### 令牌桶限流器: `TokenBucketLimiter`

```typescript
import { TokenBucketLimiter } from './services/RateLimiter';

const limiter = new TokenBucketLimiter({
  maxRequests: 100,  // 最大请求数
  windowMs: 60000,   // 时间窗口（毫秒）
});

const result = limiter.tryAcquire('user-123');
if (result.allowed) {
  // 执行操作
} else {
  console.log(`请等待 ${result.retryAfter}ms 后重试`);
}
```

### 滑动窗口限流器: `SlidingWindowLimiter`

```typescript
import { SlidingWindowLimiter } from './services/RateLimiter';

const limiter = new SlidingWindowLimiter({
  maxRequests: 100,
  windowMs: 60000,
});
```

### 熔断器: `CircuitBreaker`

```typescript
import { CircuitBreaker } from './services/RateLimiter';

const breaker = new CircuitBreaker({
  failureThreshold: 5,    // 失败阈值
  successThreshold: 2,    // 成功阈值（半开状态）
  timeout: 30000,         // 超时时间
});

const result = await breaker.execute(
  () => fetch('/api/data'),
  () => fetch('/api/fallback') // 降级函数
);
```

**状态说明:**
- `closed` - 正常状态，请求正常执行
- `open` - 熔断状态，请求直接执行降级函数
- `half-open` - 半开状态，允许部分请求通过测试

---

## 乐观更新管理

### 模块位置
`src/app/components/ide/services/OptimisticUpdateManager.ts`

### 使用示例

```typescript
import { OptimisticUpdateManager } from './services/OptimisticUpdateManager';

const manager = new OptimisticUpdateManager(
  {
    maxRetries: 3,
    snapshotEnabled: true,
    onRollback: (update) => console.log('Rolled back:', update),
    onConfirm: (update) => console.log('Confirmed:', update),
  },
  () => currentState,  // 状态获取函数
  (newState) => { currentState = newState; }  // 状态设置函数
);

// 执行乐观更新
const result = await manager.execute(
  'update-file',
  { fileId: '123', content: 'new content' },
  (state, payload) => ({
    ...state,
    files: {
      ...state.files,
      [payload.fileId]: payload.content,
    },
  }),
  async (payload) => {
    const response = await fetch('/api/files/' + payload.fileId, {
      method: 'PUT',
      body: JSON.stringify({ content: payload.content }),
    });
    return response.ok;
  },
  (state, payload) => ({
    ...state,
    files: {
      ...state.files,
      [payload.fileId]: originalContent,  // 恢复原始内容
    },
  })
);
```

---

## 异步错误边界

### 模块位置
`src/app/components/ide/components/AsyncErrorBoundary.tsx`

### 组件使用

```tsx
import { AsyncErrorBoundary } from './components/AsyncErrorBoundary';

function App() {
  return (
    <AsyncErrorBoundary
      maxRetries={3}
      retryDelay={1000}
      onError={(error) => logError(error)}
      onRetry={(error) => console.log('Retrying...', error)}
      onRecover={() => console.log('Recovered!')}
      fallback={(error, retry) => (
        <div>
          <p>发生错误: {error.error.message}</p>
          <button onClick={retry}>重试</button>
        </div>
      )}
    >
      <MyComponent />
    </AsyncErrorBoundary>
  );
}
```

### Hooks

#### `useAsyncError(): (error: Error) => void`

用于在异步代码中抛出错误。

```tsx
import { useAsyncError } from './components/AsyncErrorBoundary';

function MyComponent() {
  const throwError = useAsyncError();

  const handleClick = async () => {
    try {
      await fetchData();
    } catch (error) {
      throwError(error as Error);
    }
  };

  return <button onClick={handleClick}>Fetch Data</button>;
}
```

#### `useRetry(): { retry, retryCount, isRetrying }`

重试逻辑Hook。

```tsx
import { useRetry } from './components/AsyncErrorBoundary';

function MyComponent() {
  const { retry, retryCount, isRetrying } = useRetry(async () => {
    await fetchData();
  }, { maxRetries: 3, delay: 1000 });

  return (
    <button onClick={retry} disabled={isRetrying}>
      {isRetrying ? `重试中 (${retryCount}/3)` : '加载数据'}
    </button>
  );
}
```

---

## 存储空间管理

### 模块位置
`src/app/components/ide/services/StorageManager.ts`

### 使用示例

```typescript
import { StorageManager } from './services/StorageManager';

const manager = new StorageManager({
  warningThreshold: 80,   // 警告阈值（%）
  criticalThreshold: 95,  // 临界阈值（%）
  autoCleanup: true,      // 自动清理
  cleanupInterval: 3600000, // 清理间隔（毫秒）
  maxAge: 7 * 24 * 60 * 60 * 1000, // 最大保留时间
  onWarning: (warning) => {
    console.warn(warning.message);
  },
  onCleanup: (result) => {
    console.log(`清理了 ${result.removedItems} 项，释放 ${result.freedBytes} 字节`);
  },
});

// 获取存储配额
const quota = await manager.getQuota();
console.log(`已使用: ${quota.usagePercentage.toFixed(1)}%`);

// 检查存储状态
const warning = await manager.checkStorage();
if (warning) {
  console.log(warning.message);
}

// 手动清理
const result = await manager.cleanupLocalStorage({
  maxAge: 3 * 24 * 60 * 60 * 1000, // 清理3天前的数据
  excludeKeys: ['important-key'],  // 排除特定键
  prefix: 'cache-',                // 只清理特定前缀
});
```

---

## 大文件分块处理

### 模块位置
`src/app/components/ide/services/ChunkedFileHandler.ts`

### 上传文件

```typescript
import { ChunkedFileHandler } from './services/ChunkedFileHandler';

const handler = new ChunkedFileHandler({
  chunkSize: 5 * 1024 * 1024,  // 5MB
  maxConcurrentChunks: 3,
  maxRetries: 3,
  enableHashVerification: true,
  enableResume: true,
});

const file = document.querySelector('input[type="file"]').files[0];

const result = await handler.uploadFile(
  file,
  async (chunk, index, total, fileId) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('index', index.toString());
    formData.append('total', total.toString());
    formData.append('fileId', fileId);

    const response = await fetch('/api/upload/chunk', {
      method: 'POST',
      body: formData,
    });

    return { success: response.ok, chunkId: await response.text() };
  },
  (progress) => {
    console.log(`进度: ${progress.percentage.toFixed(1)}%`);
    console.log(`速度: ${(progress.speed / 1024).toFixed(1)} KB/s`);
    console.log(`剩余时间: ${Math.ceil(progress.eta)}s`);
  }
);
```

### 下载文件

```typescript
const blob = await handler.downloadFile(
  async (index, total, fileId) => {
    const response = await fetch(`/api/download/chunk?index=${index}&fileId=${fileId}`);
    return await response.blob();
  },
  'file-id-123',
  1024 * 1024 * 100, // 文件大小
  (progress) => {
    console.log(`下载进度: ${progress.percentage.toFixed(1)}%`);
  }
);

// 保存文件
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'downloaded-file.bin';
a.click();
```

---

## 虚拟列表组件

### 模块位置
`src/app/components/ide/components/VirtualList.tsx`

### 基础使用

```tsx
import { VirtualList } from './components/VirtualList';

interface FileItem {
  id: string;
  name: string;
  size: number;
  modified: Date;
}

function FileList({ files }: { files: FileItem[] }) {
  return (
    <VirtualList
      items={files}
      height={400}
      itemHeight={40}
      renderItem={(file, index, isSelected) => (
        <div className={`file-item ${isSelected ? 'selected' : ''}`}>
          <span>{file.name}</span>
          <span>{formatSize(file.size)}</span>
        </div>
      )}
    />
  );
}
```

### 高级功能

```tsx
function AdvancedFileList() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const listRef = useRef<VirtualListRef>(null);

  const {
    displayedItems,
    hasMore,
    loadMore,
    searchQuery,
    setSearchQuery,
    sortConfig,
    setSortConfig,
    selectedIds,
    setSelectedIds,
  } = useVirtualList(files, { pageSize: 50 });

  return (
    <VirtualList
      ref={listRef}
      items={displayedItems}
      height={600}
      itemHeight={48}
      hasMore={hasMore}
      onLoadMore={loadMore}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      multiSelect
      searchable
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      sortable
      sortConfig={sortConfig}
      onSortChange={setSortConfig}
      renderItem={(file, index, isSelected) => (
        <FileRow file={file} selected={isSelected} />
      )}
    />
  );
}
```

---

## Safari兼容性

### 模块位置
`src/app/components/ide/utils/SafariCompat.ts`

### 自动初始化

```typescript
// 在应用入口自动调用
import './utils/SafariCompat';
```

### 手动使用

```typescript
import {
  isSafari,
  isIOS,
  initializeSafariCompatibility,
  setupSafariTouchHandling,
} from './utils/SafariCompat';

// 检测浏览器
if (isSafari()) {
  console.log('Safari浏览器检测到');
}

// 初始化兼容性修复
initializeSafariCompatibility();

// 设置触摸处理
const cleanup = setupSafariTouchHandling(scrollableElement);
// 清理
cleanup();
```

### CSS兼容性类

```css
/* 自动添加的CSS修复 */
.flex-gap-fix { /* Flexbox gap修复 */ }
.backdrop-blur-fallback { /* backdrop-filter降级 */ }
.scroll-snap-fix { /* 滚动吸附修复 */ }
.sticky-fix { /* 粘性定位修复 */ }
.aspect-ratio-fix { /* 宽高比修复 */ }
```

---

## 性能监控

### 模块位置
`src/app/components/ide/services/PerformanceMonitor.ts`

### 基础使用

```typescript
import { PerformanceMonitor } from './services/PerformanceMonitor';

const monitor = new PerformanceMonitor({
  enabled: true,
  sampleRate: 1.0,
  reportInterval: 60000,
  thresholds: [
    { metric: 'fps', warning: 30, critical: 15 },
    { metric: 'memory_usage', warning: 80, critical: 95 },
  ],
  onWarning: (metric) => {
    console.warn(`性能警告: ${metric.name} = ${metric.value}`);
  },
  onCritical: (metric) => {
    console.error(`性能严重: ${metric.name} = ${metric.value}`);
  },
});

monitor.start();
```

### 性能测量

```typescript
// 同步测量
const result = monitor.measureSync('compute-heavy', () => {
  return heavyComputation();
});

// 异步测量
const data = await monitor.measureAsync('fetch-data', async () => {
  return await fetch('/api/data').then(r => r.json());
});

// 手动计时
const endTiming = monitor.startTiming('custom-operation');
// ... 执行操作
const duration = endTiming();
```

### React Hook

```tsx
import { usePerformanceMonitor } from './services/PerformanceMonitor';

function MyComponent() {
  const { measureAsync, getMemoryInfo, getRenderMetrics } = usePerformanceMonitor();

  const handleClick = async () => {
    await measureAsync('button-click', async () => {
      await processData();
    });
  };

  useEffect(() => {
    const memory = getMemoryInfo();
    const render = getRenderMetrics();
    console.log('FPS:', render.fps);
    console.log('Memory:', memory?.usagePercentage);
  }, []);

  return <button onClick={handleClick}>Process</button>;
}
```

### 装饰器

```typescript
import { measurePerformance } from './services/PerformanceMonitor';

class DataService {
  @measurePerformance('fetch-users')
  async fetchUsers() {
    return await fetch('/api/users').then(r => r.json());
  }
}
```

---

## 11. 业务服务层 API（v1.0.1 新增）

> 完整服务层包含 **21 个业务模块** + **8 个 MCP Server**，详见 [阶段性集成总结报告](08-YYC3-项目整合-实施阶段/项目总结报告/YYC3-阶段性集成总结-v1.0.1.md)

### 11.1 AIAgentOrchestrator — 智能体编排引擎

**模块位置**: `src/services/AIAgentOrchestrator.ts`

```typescript
import { AIAgentOrchestrator } from '@/services/AIAgentOrchestrator'

const orchestrator = new AIAgentOrchestrator({
  maxConcurrentTasks: 5,
  enableCaching: true,
  cacheTTL: 300000,
})

// 注册 Agent
orchestrator.registerAgent({
  id: 'finance-analyst',
  name: '金融分析师',
  capabilities: ['stock-analysis', 'portfolio-review'],
})

// 提交任务（4 种模式）
await orchestrator.submitTask({
  type: 'single-agent' | 'multi-agent' | 'pipeline' | 'parallel',
  title: '任务标题',
  input: [{ role: 'user', content: '...' }],
  agentIds: ['agent-id'],
})
```

### 11.2 FinanceAnalysisService — 金融数据分析

**模块位置**: `src/services/FinanceAnalysisService.ts`

```typescript
import { FinanceAnalysisService } from '@/services/FinanceAnalysisService'

const finance = new FinanceAnalysisService({ defaultCurrency: 'CNY' })

const stock = await finance.getStockQuote('AAPL')
const macd = finance.calculateMACD(historicalPrices, 12, 26, 9)
const valuation = await finance.calculateDCF('AAPL', { growthRate: 0.1 })
const portfolio = await finance.analyzePortfolio(assets)
```

### 11.3 EducationService — 教育作业批改

**模块位置**: `src/services/EducationService.ts`

```typescript
import { EducationService } from '@/services/EducationService'

const edu = new EducationService({ subjects: ['数学', '物理'] })

const submission = await edu.submitHomework({ content: '...', subject: '数学' })
const result = await edu.gradeHomework(submission.id, { strictness: 'normal' })
const exam = await edu.generateExam({ subject: '数学', difficulty: 'medium', questionCount: 20 })
const plan = await edu.createLearningPlan({ studentLevel: 'intermediate', goals: ['...'] })
```

### 11.4 OfficeAutomationService — 办公自动化

**模块位置**: `src/services/OfficeAutomationService.ts`

```typescript
import { OfficeAutomationService } from '@/services/OfficeAutomationService'

const office = new OfficeAutomationService({ defaultLanguage: 'zh-CN' })

const doc = await office.generateDocument('meeting-minutes', { meetingTitle: '...', date: '...' })
const email = await office.draftEmail({ to: '...', purpose: 'project-update', keyPoints: [...] })
const task = await office.createTask({ title: '...', priority: 'high', dueDate: '...' })
```

### 11.5 其他服务快速引用

| 服务 | 导入路径 | 核心用途 |
|------|----------|----------|
| KnowledgeBaseService | `@/services/KnowledgeBaseService` | 向量知识库、混合搜索 |
| WebScraperService | `@/services/WebScraperService` | 网页抓取、结构化提取 |
| DataVisualizationService | `@/services/DataVisualizationService` | 图表生成、统计分析 |
| DataAnalysisService | `@/services/DataAnalysisService` | 数据清洗、统计建模 |
| GraphRAGService | `@/services/GraphRAGService` | 知识图谱 RAG |
| TranslationService | `@/services/TranslationService` | 多语言翻译 |
| NewsGenerator | `@/services/NewsGenerator` | 新闻聚合摘要 |
| InterviewAgent | `@/services/InterviewAgent` | 模拟面试 |
| ASRService / TTSService | `@/services/ASRService` / `TTSService` | 语音识别/合成 |

---

## 版本信息

- **版本**: v1.0.1
- **更新日期**: 2026-04-15
- **维护团队**: YanYuCloudCube Team
- **联系方式**: admin@0379.email
