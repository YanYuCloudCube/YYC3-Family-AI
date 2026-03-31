# YYC3-P3-测试 - 性能基准

**版本**: v1.0.0  
**创建日期**: 2026-03-19  
**最后更新**: 2026-03-19  
**状态**: ✅ 稳定

---

## 📊 概述

性能基准测试提供:

- 📈 **Web Vitals**: FCP/LCP/FID/CLS 等核心指标
- ⚡ **渲染性能**: 渲染时间和帧率
- 💾 **内存使用**: JS 堆内存监控
- 🎯 **事件响应**: 交互延迟测试

---

## 🎯 目标

- 建立性能基准线
- 持续监控性能变化
- 发现性能瓶颈
- 优化用户体验

---

## 📋 配置说明

### 1. 使用工具

```tsx
import { startBenchmark } from "./utils/performanceBenchmark";

async function runTest() {
  const metrics = await startBenchmark();
  
  console.log({
    fcp: metrics.fcp,
    lcp: metrics.lcp,
    cls: metrics.cls,
  });
}
```

### 2. 指标说明

| 指标 | 名称 | 说明 | 良好 | 需改进 | 差 |
|------|------|------|------|--------|-----|
| **FCP** | 首次内容绘制 | 首次渲染时间 | < 1.8s | 1.8-3.0s | > 3.0s |
| **LCP** | 最大内容绘制 | 主要内容渲染 | < 2.5s | 2.5-4.0s | > 4.0s |
| **FID** | 首次输入延迟 | 首次交互响应 | < 100ms | 100-300ms | > 300ms |
| **CLS** | 累积布局偏移 | 布局稳定性 | < 0.1 | 0.1-0.25 | > 0.25 |
| **TTI** | 可交互时间 | 完全可交互 | < 3.8s | 3.8-7.3s | > 7.3s |

---

## 🔧 使用示例

### 收集 Web Vitals

```tsx
import { useEffect } from "react";
import { startBenchmark } from "./utils/performanceBenchmark";

function App() {
  useEffect(() => {
    const reportMetrics = async () => {
      const metrics = await startBenchmark();
      
      // 上报到监控系统
      if (metrics.lcp > 2500) {
        console.warn("LCP 性能不佳:", metrics.lcp);
      }
      
      if (metrics.cls > 0.1) {
        console.warn("CLS 过高:", metrics.cls);
      }
    };
    
    reportMetrics();
  }, []);
  
  return <MainContent />;
}
```

### 自定义测试

```tsx
import { performanceBenchmark } from "./utils/performanceBenchmark";

// 渲染性能测试
async function testRenderPerformance() {
  const start = performance.now();
  
  // 强制重排
  const element = document.createElement("div");
  document.body.appendChild(element);
  element.offsetHeight;
  document.body.removeChild(element);
  
  const duration = performance.now() - start;
  console.log(`渲染性能：${duration.toFixed(2)}ms`);
}

// 内存使用测试
function testMemoryUsage() {
  if ("memory" in performance) {
    const mem = performance.memory;
    const usage = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
    console.log(`内存使用：${Math.round(usage * 100)}%`);
  }
}

// 运行测试
testRenderPerformance();
testMemoryUsage();
```

---

## ⚠️ 注意事项

### 1. 测试环境

```tsx
// 仅在生产环境运行完整测试
const isProduction = import.meta.env.PROD;

if (isProduction) {
  startBenchmark();
}
```

### 2. 采样率

```tsx
// 降低测试频率
const shouldRunTest = Math.random() < 0.1; // 10% 采样

if (shouldRunTest) {
  startBenchmark();
}
```

### 3. 性能影响

```tsx
// 避免频繁测试
let lastTestTime = 0;
const TEST_INTERVAL = 60000; // 1 分钟

function runTestIfNeeded() {
  const now = Date.now();
  if (now - lastTestTime > TEST_INTERVAL) {
    startBenchmark();
    lastTestTime = now;
  }
}
```

---

## 📊 性能优化建议

### FCP 优化

```tsx
// 1. 代码分割
const LazyComponent = lazy(() => import("./LazyComponent"));

// 2. 预加载关键资源
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin />

// 3. 内联关键 CSS
<style>{criticalCSS}</style>
```

### LCP 优化

```tsx
// 1. 优化图片加载
<img 
  src="hero.jpg" 
  loading="eager" 
  fetchpriority="high"
/>

// 2. 使用 WebP 格式
<picture>
  <source srcSet="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Hero" />
</picture>

// 3. 预加载 LCP 资源
<link rel="preload" href="/images/hero.jpg" as="image" />
```

### CLS 优化

```tsx
// 1. 设置图片尺寸
<img src="image.jpg" width="800" height="600" />

// 2. 预留广告位
<div style={{ minHeight: "250px" }}>
  <AdComponent />
</div>

// 3. 避免动态插入内容
// 在页面加载时插入动态内容
```

---

## 🎯 性能基准目标

### 移动端

| 指标 | 目标值 | 警戒值 |
|------|--------|--------|
| FCP | < 1.5s | > 3.0s |
| LCP | < 2.0s | > 4.0s |
| FID | < 50ms | > 300ms |
| CLS | < 0.05 | > 0.25 |

### 桌面端

| 指标 | 目标值 | 警戒值 |
|------|--------|--------|
| FCP | < 1.0s | > 2.0s |
| LCP | < 1.5s | > 3.0s |
| FID | < 20ms | > 200ms |
| CLS | < 0.03 | > 0.15 |

---

## 📚 相关文档

- [Web Vitals 官方文档](https://web.dev/vitals/)
- [Lighthouse 使用指南](https://developer.chrome.com/docs/lighthouse/overview/)
- [性能优化指南](./YYC3-P3-性能 - 性能优化.md)

---

<div align="center">

> 「***YanYuCloudCube***」  
> 「***<admin@0379.email>***」  
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**维护团队**: YanYuCloudCube Team

</div>
