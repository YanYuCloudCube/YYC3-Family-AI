# 性能监控 API 文档

> **版本**: v1.0.0  
> **最后更新**: 2026-03-31  
> **维护团队**: YYC3 团队

## 概述

性能监控系统提供了全面的性能监控和分析功能，包括性能指标收集、瓶颈分析、优化建议等。

## 核心 API

### PerformanceMonitor

性能监控器，负责性能数据的收集和分析。

#### 方法

##### `startMonitoring(): void`

启动性能监控。

**示例**:
```typescript
import { performanceMonitor } from '@/app/components/ide/llm/PerformanceMonitor';

performanceMonitor.startMonitoring();
```

##### `stopMonitoring(): void`

停止性能监控。

**示例**:
```typescript
performanceMonitor.stopMonitoring();
```

##### `getMetrics(): PerformanceMetrics`

获取当前性能指标。

**返回值**: `PerformanceMetrics`

**示例**:
```typescript
const metrics = performanceMonitor.getMetrics();
console.log('FPS:', metrics.fps);
console.log('内存使用:', metrics.memory);
```

##### `mark(name: string): void`

创建性能标记。

**参数**:
- `name`: 标记名称

**示例**:
```typescript
performanceMonitor.mark('task-start');
// 执行任务
performanceMonitor.mark('task-end');
```

##### `measure(name: string, startMark: string, endMark: string): PerformanceEntry`

测量两个标记之间的性能。

**参数**:
- `name`: 测量名称
- `startMark`: 起始标记名称
- `endMark`: 结束标记名称

**返回值**: `PerformanceEntry`

**示例**:
```typescript
const entry = performanceMonitor.measure(
  'task-duration',
  'task-start',
  'task-end'
);
console.log('任务耗时:', entry.duration, 'ms');
```

##### `getReport(): PerformanceReport`

生成性能报告。

**返回值**: `PerformanceReport`

**示例**:
```typescript
const report = performanceMonitor.getReport();
console.log('性能评分:', report.score);
console.log('瓶颈:', report.bottlenecks);
```

## 类型定义

### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  /** 帧率 */
  fps: number;
  /** CPU 使用率 */
  cpuUsage: number;
  /** 内存使用 */
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  /** 网络性能 */
  network: {
    latency: number;
    bandwidth: number;
  };
  /** 渲染性能 */
  render: {
    paintTime: number;
    layoutTime: number;
    scriptTime: number;
  };
}
```

### PerformanceEntry

```typescript
interface PerformanceEntry {
  /** 条目名称 */
  name: string;
  /** 条目类型 */
  entryType: string;
  /** 开始时间 */
  startTime: number;
  /** 持续时间 */
  duration: number;
}
```

### PerformanceReport

```typescript
interface PerformanceReport {
  /** 性能评分 (0-100) */
  score: number;
  /** 性能指标 */
  metrics: PerformanceMetrics;
  /** 瓶颈列表 */
  bottlenecks: PerformanceBottleneck[];
  /** 优化建议 */
  recommendations: PerformanceRecommendation[];
  /** 时间戳 */
  timestamp: number;
}
```

### PerformanceBottleneck

```typescript
interface PerformanceBottleneck {
  /** 瓶颈类型 */
  type: 'cpu' | 'memory' | 'network' | 'render';
  /** 严重程度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 描述 */
  description: string;
  /** 影响范围 */
  impact: string;
  /** 位置 */
  location?: string;
}
```

### PerformanceRecommendation

```typescript
interface PerformanceRecommendation {
  /** 建议类型 */
  type: 'optimization' | 'refactor' | 'configuration' | 'best-practice';
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
  /** 描述 */
  description: string;
  /** 预期收益 */
  expectedBenefit: string;
  /** 实施步骤 */
  steps: string[];
}
```

## 性能指标详解

### FPS (帧率)

衡量应用流畅度，目标值：60 FPS。

```typescript
const fps = performanceMonitor.getMetrics().fps;
if (fps < 30) {
  console.warn('帧率过低，可能影响用户体验');
}
```

### CPU 使用率

衡量 CPU 负载，目标值：< 50%。

```typescript
const cpuUsage = performanceMonitor.getMetrics().cpuUsage;
if (cpuUsage > 80) {
  console.warn('CPU 使用率过高');
}
```

### 内存使用

衡量内存消耗，目标值：< 80%。

```typescript
const memory = performanceMonitor.getMetrics().memory;
if (memory.percentage > 80) {
  console.warn('内存使用率过高');
}
```

### 网络延迟

衡量网络响应速度，目标值：< 100ms。

```typescript
const latency = performanceMonitor.getMetrics().network.latency;
if (latency > 200) {
  console.warn('网络延迟过高');
}
```

### 渲染时间

衡量渲染性能，目标值：< 16.67ms (60 FPS)。

```typescript
const render = performanceMonitor.getMetrics().render;
if (render.paintTime > 16.67) {
  console.warn('渲染时间过长');
}
```

## 高级功能

### 性能快照

```typescript
// 创建性能快照
const snapshot = performanceMonitor.createSnapshot();
console.log('快照时间:', snapshot.timestamp);
console.log('快照指标:', snapshot.metrics);

// 对比两个快照
const diff = performanceMonitor.compareSnapshots(snapshot1, snapshot2);
console.log('性能变化:', diff);
```

### 性能预算

```typescript
// 设置性能预算
performanceMonitor.setBudget({
  fps: { min: 30, target: 60 },
  memory: { max: 500 * 1024 * 1024 }, // 500MB
  cpu: { max: 50 },
  latency: { max: 100 },
});

// 检查是否超出预算
const violations = performanceMonitor.checkBudget();
if (violations.length > 0) {
  console.warn('性能预算违规:', violations);
}
```

### 性能追踪

```typescript
// 开始追踪
const traceId = performanceMonitor.startTrace('user-action');

// 执行操作
await performAction();

// 结束追踪
const trace = performanceMonitor.endTrace(traceId);
console.log('追踪详情:', trace);
```

### 性能告警

```typescript
// 设置告警规则
performanceMonitor.setAlertRules([
  {
    metric: 'fps',
    condition: 'less_than',
    threshold: 30,
    severity: 'warning',
    message: 'FPS 低于 30',
  },
  {
    metric: 'memory',
    condition: 'greater_than',
    threshold: 80,
    severity: 'critical',
    message: '内存使用率超过 80%',
  },
]);

// 监听告警
performanceMonitor.onAlert((alert) => {
  console.log('性能告警:', alert);
});
```

## 性能优化建议

### 1. 组件优化

- 使用 `React.memo` 避免不必要的渲染
- 使用 `useMemo` 和 `useCallback` 缓存计算结果
- 实现虚拟滚动处理大列表

### 2. 状态管理优化

- 使用 Zustand 的选择器避免不必要的订阅
- 分割 Store 降低更新范围
- 使用 `immer` 优化不可变更新

### 3. 网络优化

- 实现请求缓存
- 使用流式响应
- 启用压缩传输

### 4. 内存优化

- 及时清理不再使用的对象
- 实现对象池复用对象
- 避免内存泄漏

## 性能测试

### 压力测试

```typescript
// 运行压力测试
const stressTestResult = await performanceMonitor.runStressTest({
  duration: 60000, // 60 秒
  concurrency: 10, // 10 个并发
});

console.log('压力测试结果:', stressTestResult);
```

### 基准测试

```typescript
// 运行基准测试
const benchmark = await performanceMonitor.runBenchmark();
console.log('基准测试分数:', benchmark.score);
```

## 事件系统

性能监控系统支持事件监听：

### 性能告警事件

```typescript
import { eventBus } from '@/app/components/ide/llm/PluginAPIManager';

eventBus.on('performance:alert', (data) => {
  console.log('性能告警:', data);
});
```

### 性能指标更新事件

```typescript
eventBus.on('performance:metrics:updated', (data) => {
  console.log('性能指标更新:', data.metrics);
});
```

## 集成示例

### 与 Sentry 集成

```typescript
import * as Sentry from '@sentry/react';

// 监控性能并发送到 Sentry
performanceMonitor.onAlert((alert) => {
  Sentry.captureMessage(`Performance Alert: ${alert.message}`, {
    level: alert.severity === 'critical' ? 'error' : 'warning',
    extra: alert,
  });
});
```

### 与监控仪表板集成

```typescript
// 定期发送性能数据到监控仪表板
setInterval(() => {
  const metrics = performanceMonitor.getMetrics();
  sendToDashboard(metrics);
}, 10000); // 每 10 秒
```

## 最佳实践

### 1. 持续监控

```typescript
// 应用启动时开始监控
performanceMonitor.startMonitoring();

// 定期检查性能
setInterval(() => {
  const report = performanceMonitor.getReport();
  if (report.score < 70) {
    console.warn('性能评分过低:', report.score);
  }
}, 60000); // 每分钟检查一次
```

### 2. 关键路径追踪

```typescript
// 追踪关键用户操作
async function criticalOperation() {
  const traceId = performanceMonitor.startTrace('critical-operation');
  
  try {
    await performOperation();
  } finally {
    performanceMonitor.endTrace(traceId);
  }
}
```

### 3. 性能预算管理

```typescript
// 设置严格的性能预算
performanceMonitor.setBudget({
  fps: { min: 55, target: 60 },
  memory: { max: 300 * 1024 * 1024 },
  cpu: { max: 40 },
});

// 在 CI/CD 中检查性能预算
const violations = performanceMonitor.checkBudget();
if (violations.length > 0) {
  console.error('性能预算违规:', violations);
  process.exit(1);
}
```

## 测试覆盖

性能监控系统测试覆盖率：**93%**

- 单元测试：52个
- 集成测试：18个
- E2E 测试：8个

## 相关文档

- [性能优化使用指南](../使用指南/性能优化使用指南.md)
- [架构文档 - 性能监控](../架构文档/系统架构.md#性能监控)

## 更新日志

### v1.0.0 (2026-03-31)
- 初始版本发布
- 完整性能指标收集
- 性能报告生成
- 性能预算管理
- 性能告警系统
- 性能追踪功能
- 完整测试覆盖

---

**维护者**: YYC3 团队  
**反馈渠道**: [GitHub Issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues)
