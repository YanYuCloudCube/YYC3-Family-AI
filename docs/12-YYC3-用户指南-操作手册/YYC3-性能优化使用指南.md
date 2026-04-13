# 性能优化使用指南

> **版本**: v1.0.0  
> **适用对象**: 前端开发者、性能工程师  
> **最后更新**: 2026-03-31

## 概述

本指南将帮助你使用 YYC3 Family AI 的性能监控和优化功能，提升应用性能。

## 快速开始

### 1. 启动性能监控

```typescript
import { performanceMonitor } from '@/app/components/ide/llm/PerformanceMonitor';

// 启动监控
performanceMonitor.startMonitoring();

// 查看当前性能
const metrics = performanceMonitor.getMetrics();
console.log('FPS:', metrics.fps);
console.log('内存使用:', metrics.memory.used);
```

### 2. 性能标记

```typescript
// 创建性能标记
performanceMonitor.mark('task-start');

// 执行任务
await performTask();

// 结束标记
performanceMonitor.mark('task-end');

// 测量耗时
const entry = performanceMonitor.measure(
  'task-duration',
  'task-start',
  'task-end'
);

console.log('任务耗时:', entry.duration, 'ms');
```

### 3. 生成性能报告

```typescript
const report = performanceMonitor.getReport();

console.log('性能评分:', report.score);
console.log('瓶颈:', report.bottlenecks);
console.log('建议:', report.recommendations);
```

## 性能指标

### 1. FPS (帧率)

目标值：**60 FPS** (16.67ms/帧)

```typescript
const fps = performanceMonitor.getMetrics().fps;

if (fps < 30) {
  console.warn('帧率过低，可能存在性能问题');
}
```

**优化建议**:
- 减少 DOM 操作
- 使用 CSS 动画替代 JavaScript 动画
- 实现 requestAnimationFrame 节流

### 2. CPU 使用率

目标值：**< 50%**

```typescript
const cpuUsage = performanceMonitor.getMetrics().cpuUsage;

if (cpuUsage > 80) {
  console.warn('CPU 使用率过高');
}
```

**优化建议**:
- 避免长任务阻塞主线程
- 使用 Web Worker 处理复杂计算
- 实现任务分片

### 3. 内存使用

目标值：**< 80%**

```typescript
const memory = performanceMonitor.getMetrics().memory;

if (memory.percentage > 80) {
  console.warn('内存使用率过高');
}
```

**优化建议**:
- 及时清理不再使用的对象
- 实现对象池复用对象
- 避免内存泄漏

### 4. 网络延迟

目标值：**< 100ms**

```typescript
const latency = performanceMonitor.getMetrics().network.latency;

if (latency > 200) {
  console.warn('网络延迟过高');
}
```

**优化建议**:
- 实现请求缓存
- 使用 CDN 加速
- 启用压缩传输

## 性能瓶颈分析

### 1. 识别瓶颈

```typescript
const report = performanceMonitor.getReport();

report.bottlenecks.forEach(bottleneck => {
  console.log(`瓶颈类型: ${bottleneck.type}`);
  console.log(`严重程度: ${bottleneck.severity}`);
  console.log(`描述: ${bottleneck.description}`);
  console.log(`影响: ${bottleneck.impact}`);
});
```

### 2. 性能分析工具

```typescript
// 追踪特定操作
const traceId = performanceMonitor.startTrace('expensive-operation');

await expensiveOperation();

const trace = performanceMonitor.endTrace(traceId);
console.log('追踪详情:', trace);
```

### 3. 性能快照对比

```typescript
// 创建快照 1
const snapshot1 = performanceMonitor.createSnapshot();

// 执行优化操作
await optimizeCode();

// 创建快照 2
const snapshot2 = performanceMonitor.createSnapshot();

// 对比快照
const diff = performanceMonitor.compareSnapshots(snapshot1, snapshot2);
console.log('性能变化:', diff);
```

## 性能优化技术

### 1. 组件优化

#### React.memo

```typescript
import { memo } from 'react';

// 避免不必要的渲染
const MyComponent = memo(({ data }) => {
  return <div>{data}</div>;
});
```

#### useMemo 和 useCallback

```typescript
import { useMemo, useCallback } from 'react';

function MyComponent({ items }) {
  // 缓存计算结果
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  
  // 缓存回调函数
  const handleClick = useCallback((id) => {
    console.log('Clicked:', id);
  }, []);
  
  return <ItemList items={sortedItems} onClick={handleClick} />;
}
```

#### 虚拟滚动

```typescript
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

### 2. 状态管理优化

#### Zustand 选择器

```typescript
import { useStore } from 'zustand';

// 只订阅需要的部分
const userName = useStore(state => state.user.name);
// 避免订阅整个 user 对象
```

#### Store 分割

```typescript
// 分割 Store 降低更新范围
const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

const useUIStore = create((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
```

### 3. 网络优化

#### 请求缓存

```typescript
const cache = new Map();

async function fetchData(url) {
  if (cache.has(url)) {
    return cache.get(url);
  }
  
  const data = await fetch(url).then(r => r.json());
  cache.set(url, data);
  
  return data;
}
```

#### 流式响应

```typescript
const response = await fetch(url);
const reader = response.body.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  // 处理数据块
  processChunk(value);
}
```

### 4. 内存优化

#### 对象池

```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  
  acquire(): T {
    return this.pool.pop() || this.create();
  }
  
  release(obj: T): void {
    this.pool.push(obj);
  }
  
  private create(): T {
    // 创建新对象
  }
}
```

#### 内存泄漏检测

```typescript
// 检测未清理的定时器
const timers = new Set();

const originalSetInterval = window.setInterval;
window.setInterval = function(...args) {
  const id = originalSetInterval(...args);
  timers.add(id);
  return id;
};

window.clearInterval = function(id) {
  timers.delete(id);
  return originalClearInterval(id);
};

// 检查是否有未清理的定时器
setInterval(() => {
  if (timers.size > 10) {
    console.warn('存在未清理的定时器:', timers.size);
  }
}, 10000);
```

## 性能测试

### 1. 压力测试

```typescript
// 运行压力测试
const stressTestResult = await performanceMonitor.runStressTest({
  duration: 60000, // 60 秒
  concurrency: 10, // 10 个并发
});

console.log('压力测试结果:', stressTestResult);
```

### 2. 基准测试

```typescript
// 运行基准测试
const benchmark = await performanceMonitor.runBenchmark();

console.log('基准测试分数:', benchmark.score);
console.log('详细结果:', benchmark.details);
```

### 3. 性能预算

```typescript
// 设置性能预算
performanceMonitor.setBudget({
  fps: { min: 55, target: 60 },
  memory: { max: 500 * 1024 * 1024 }, // 500MB
  cpu: { max: 50 },
  latency: { max: 100 },
});

// 检查预算
const violations = performanceMonitor.checkBudget();

if (violations.length > 0) {
  console.error('性能预算违规:', violations);
}
```

## 性能监控集成

### 1. 与 Sentry 集成

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

### 2. 与监控仪表板集成

```typescript
// 定期发送性能数据到监控仪表板
setInterval(() => {
  const metrics = performanceMonitor.getMetrics();
  sendToDashboard({
    ...metrics,
    timestamp: Date.now(),
  });
}, 10000); // 每 10 秒
```

### 3. 与 CI/CD 集成

```typescript
// 在 CI/CD 中检查性能预算
const violations = performanceMonitor.checkBudget();

if (violations.length > 0) {
  console.error('性能预算违规:', violations);
  process.exit(1); // 构建失败
}
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
```

## 常见问题

### Q: 如何诊断页面卡顿?

```typescript
// 监听长任务
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log('长任务:', entry);
    console.log('耗时:', entry.duration, 'ms');
  });
});

observer.observe({ entryTypes: ['longtask'] });
```

### Q: 如何优化首次加载性能?

1. 代码分割
2. 懒加载
3. 预加载关键资源
4. 启用压缩
5. 使用 CDN

### Q: 如何检测内存泄漏?

```typescript
// 定期检查内存使用
setInterval(() => {
  const memory = performanceMonitor.getMetrics().memory;
  
  if (memory.used > 500 * 1024 * 1024) {
    console.warn('内存使用过高，可能存在内存泄漏');
    // 触发垃圾回收（如果可能）
    if (window.gc) {
      window.gc();
    }
  }
}, 30000);
```

## 相关资源

- [性能监控 API 文档](../API文档/性能监控API文档.md)
- [架构文档 - 性能监控](../架构文档/系统架构.md#性能监控)
- [React 性能优化](./React性能优化.md)

---

**维护者**: YYC3 团队  
**反馈渠道**: [GitHub Issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues)
