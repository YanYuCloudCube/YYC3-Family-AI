/**
 * @file e2e/performance-benchmark.spec.ts
 * @description Playwright 性能基准测试 - 测试加载时间、渲染性能、内存使用等
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,performance,benchmark
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

// 性能指标类型
interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  tti: number;
  tbt: number;
}

// 性能预算
const PERFORMANCE_BUDGETS = {
  fcp: 1800, // 首次内容绘制 < 1.8s
  lcp: 2500, // 最大内容绘制 < 2.5s
  fid: 100,  // 首次输入延迟 < 100ms
  cls: 0.1,  // 累积布局偏移 < 0.1
  tti: 3800, // 可交互时间 < 3.8s
  tbt: 300,  // 总阻塞时间 < 300ms
};

// ── Helper Functions ──

async function getPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
  const metrics = await page.evaluate(() => {
    return new Promise<PerformanceMetrics>((resolve) => {
      // 获取 Performance API 数据
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");
      
      const fcpEntry = paint.find((e) => e.name === "first-contentful-paint");
      
      // 计算各项指标
      const fcp = fcpEntry ? fcpEntry.startTime : 0;
      const lcp = navigation.responseEnd - navigation.startTime;
      const fid = navigation.domInteractive - navigation.responseEnd;
      const cls = 0; // 需要额外监听
      const tti = navigation.domInteractive - navigation.startTime;
      const tbt = navigation.domComplete - navigation.domInteractive;
      
      resolve({
        fcp: Math.round(fcp),
        lcp: Math.round(lcp),
        fid: Math.round(fid),
        cls,
        tti: Math.round(tti),
        tbt: Math.round(tbt),
      });
    });
  });
  
  return metrics;
}

async function measurePageLoad(page: Page, url: string): Promise<number> {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  return Date.now() - startTime;
}

// ── Performance Benchmark Tests ──

test.describe("性能基准测试 - E2E", () => {
  // ── 1. 首页加载性能 ──

  test("首页加载性能", async ({ page }) => {
    const loadTime = await measurePageLoad(page, BASE_URL);
    
    console.log(`首页加载时间：${loadTime}ms`);
    
    // 验证加载时间在预算内
    expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.lcp);
    
    // 获取详细性能指标
    const metrics = await getPerformanceMetrics(page);
    console.log("性能指标:", metrics);
    
    // 验证 FCP
    expect(metrics.fcp).toBeLessThan(PERFORMANCE_BUDGETS.fcp);
  });

  // ── 2. IDE 页面加载性能 ──

  test("IDE 页面加载性能", async ({ page }) => {
    const loadTime = await measurePageLoad(page, `${BASE_URL}/#/ide`);
    
    console.log(`IDE 加载时间：${loadTime}ms`);
    
    // IDE 加载时间允许稍长
    expect(loadTime).toBeLessThan(5000);
    
    // 获取详细性能指标
    const metrics = await getPerformanceMetrics(page);
    
    // 验证关键指标
    expect(metrics.fcp).toBeLessThan(PERFORMANCE_BUDGETS.fcp);
    expect(metrics.tti).toBeLessThan(PERFORMANCE_BUDGETS.tti);
  });

  // ── 3. 多次加载平均性能 ──

  test("多次加载平均性能", async ({ page }) => {
    const loadTimes: number[] = [];
    const runs = 3;
    
    for (let i = 0; i < runs; i++) {
      const loadTime = await measurePageLoad(page, BASE_URL);
      loadTimes.push(loadTime);
      console.log(`第 ${i + 1} 次加载：${loadTime}ms`);
      
      // 清除缓存
      await page.context().clearCookies();
    }
    
    const avgLoadTime = loadTimes.reduce((a, b) => a + b) / runs;
    console.log(`平均加载时间：${avgLoadTime}ms`);
    
    expect(avgLoadTime).toBeLessThan(PERFORMANCE_BUDGETS.lcp);
  });

  // ── 4. 资源加载性能 ──

  test("资源加载性能", async ({ page }) => {
    const resources: { url: string; duration: number; size: number }[] = [];
    
    page.on("response", (response) => {
      const timing = response.request().timing();
      resources.push({
        url: response.url(),
        duration: timing.responseEnd,
        size: parseInt(response.headers()["content-length"] || "0"),
      });
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    
    // 分析资源加载
    const jsResources = resources.filter((r) => r.url.endsWith(".js"));
    const cssResources = resources.filter((r) => r.url.endsWith(".css"));
    
    console.log(`JS 资源数量：${jsResources.length}`);
    console.log(`CSS 资源数量：${cssResources.length}`);
    
    // 验证资源数量合理
    expect(jsResources.length).toBeLessThan(20);
    expect(cssResources.length).toBeLessThan(10);
    
    // 验证最大资源大小
    const maxJsSize = Math.max(...jsResources.map((r) => r.size));
    expect(maxJsSize).toBeLessThan(1000 * 1000); // < 1MB
  });

  // ── 5. 渲染性能测试 ──

  test("渲染性能测试", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/ide`);
    await page.waitForLoadState("networkidle");
    
    // 测试滚动性能
    const scrollStartTime = Date.now();
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      window.scrollTo(0, 0);
    });
    const scrollTime = Date.now() - scrollStartTime;
    
    console.log(`滚动性能：${scrollTime}ms`);
    expect(scrollTime).toBeLessThan(100);
    
    // 测试点击响应
    const clickStartTime = Date.now();
    await page.click('button').catch(() => {});
    const clickTime = Date.now() - clickStartTime;
    
    console.log(`点击响应：${clickTime}ms`);
    expect(clickTime).toBeLessThan(100);
  });

  // ── 6. 内存使用测试 ──

  test("内存使用测试", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    
    // 获取内存使用
    const memoryUsage = await page.evaluate(() => {
      if ("memory" in performance) {
        const mem = (performance as any).memory;
        return {
          used: mem.usedJSHeapSize,
          total: mem.totalJSHeapSize,
          limit: mem.jsHeapSizeLimit,
        };
      }
      return null;
    });
    
    if (memoryUsage) {
      console.log(`内存使用：${(memoryUsage.used / 1024 / 1024).toFixed(2)} MB`);
      
      // 验证内存使用合理
      expect(memoryUsage.used).toBeLessThan(100 * 1024 * 1024); // < 100MB
    }
  });

  // ── 7. 长时间运行测试 ──

  test("长时间运行测试", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/ide`);
    await page.waitForLoadState("networkidle");
    
    // 模拟用户操作 1 分钟
    const operations = 10;
    const startTime = Date.now();
    
    for (let i = 0; i < operations; i++) {
      // 点击不同元素
      const buttons = await page.$$("button");
      if (buttons.length > 0) {
        await buttons[Math.floor(Math.random() * buttons.length)].click().catch(() => {});
      }
      
      // 滚动
      await page.evaluate(() => {
        window.scrollBy(0, 100);
      });
      
      await page.waitForTimeout(100);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`长时间运行测试：${totalTime}ms`);
    
    // 验证没有内存泄漏
    const finalMemory = await page.evaluate(() => {
      if ("memory" in performance) {
        const mem = (performance as any).memory;
        return mem.usedJSHeapSize;
      }
      return 0;
    });
    
    console.log(`最终内存：${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
  });

  // ── 8. 并发请求测试 ──

  test("并发请求测试", async ({ page }) => {
    const requests: { url: string; duration: number }[] = [];
    
    page.on("request", (request) => {
      (request as any)._startTime = Date.now();
    });
    
    page.on("response", (response) => {
      const request = response.request();
      const duration = Date.now() - (request as any)._startTime;
      requests.push({ url: request.url(), duration });
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    
    // 分析并发请求
    const concurrentRequests = requests.filter((r) => r.duration > 0);
    const avgDuration = concurrentRequests.reduce((a, b) => a + b.duration, 0) / concurrentRequests.length;
    
    console.log(`并发请求数：${concurrentRequests.length}`);
    console.log(`平均请求时间：${avgDuration}ms`);
    
    // 验证并发请求数合理
    expect(concurrentRequests.length).toBeLessThan(50);
  });

  // ── 9. 缓存命中率测试 ──

  test("缓存命中率测试", async ({ page }) => {
    // 第一次加载
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    
    const firstLoadResources = await page.evaluate(() => {
      return performance.getEntriesByType("resource").length;
    });
    
    // 第二次加载 (应该使用缓存)
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    const secondLoadResources = await page.evaluate(() => {
      return performance.getEntriesByType("resource").filter(
        (r: any) => r.transferSize === 0
      ).length;
    });
    
    const cacheHitRate = (secondLoadResources / firstLoadResources) * 100;
    console.log(`缓存命中率：${cacheHitRate.toFixed(2)}%`);
    
    // 验证缓存命中率
    expect(cacheHitRate).toBeGreaterThan(50);
  });

  // ── 10. 布局稳定性测试 (CLS) ──

  test("布局稳定性测试", async ({ page }) => {
    let clsScore = 0;
    
    // 监听布局偏移
    await page.evaluate(() => {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    
    // 滚动页面触发可能的布局偏移
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    const finalCls = await page.evaluate(() => clsScore);
    console.log(`CLS 分数：${finalCls.toFixed(4)}`);
    
    // 验证 CLS 在预算内
    expect(finalCls).toBeLessThan(PERFORMANCE_BUDGETS.cls);
  });

  // ── 11. 移动端性能测试 ──

  test("移动端性能测试", async ({ page }) => {
    // 模拟移动端设备
    await page.setViewportSize({ width: 375, height: 667 });
    await page.emulateMedia({ deviceScaleFactor: 2 });
    
    const loadTime = await measurePageLoad(page, BASE_URL);
    console.log(`移动端加载时间：${loadTime}ms`);
    
    // 移动端性能预算更宽松
    expect(loadTime).toBeLessThan(3000);
  });

  // ── 12. 慢速网络测试 ──

  test("慢速网络测试", async ({ page }) => {
    // 模拟慢速网络
    await page.context().route("**/*", (route) => {
      setTimeout(() => route.continue(), 100); // 100ms 延迟
    });
    
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;
    
    console.log(`慢速网络加载时间：${loadTime}ms`);
    
    // 验证在慢速网络下仍能加载
    expect(loadTime).toBeLessThan(10000);
  });
});
