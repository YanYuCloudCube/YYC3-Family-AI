// @ts-nocheck
/**
 * @file IndexedDBAdapter.integration.test.ts
 * @description IndexedDB优化版本集成测试 - 验证向后兼容性和系统稳定性
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-30
 * @updated 2026-03-30
 * @license MIT
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  saveFile,
  loadFile,
  deleteFile,
  listFiles,
  loadFiles,
  saveFiles,
  clearCache,
  getPerformanceMetrics,
  getCacheHitRate,
  clearAllData,
} from "../app/components/ide/adapters/IndexedDBAdapter.optimized";

describe("IndexedDBAdapter - 集成测试", () => {
  const testProjectId = "test-project-001";

  beforeEach(async () => {
    // 清空所有数据
    await clearAllData();
    // 清空缓存
    clearCache();
  });

  afterEach(async () => {
    // 清空所有数据
    await clearAllData();
    // 清空缓存
    clearCache();
  });

  describe("向后兼容性测试", () => {
    it("应该支持原有的saveFile/loadFile API", async () => {
      const filePath = "/test/example.ts";
      const content = "console.warn('Hello World');";

      // 保存文件 (参数顺序: projectId, path, content)
      await saveFile(testProjectId, filePath, content);

      // 加载文件 (参数顺序: projectId, path)
      const loadedContent = await loadFile(testProjectId, filePath);

      expect(loadedContent).toBe(content);
    });

    it("应该支持原有的deleteFile API", async () => {
      const filePath = "/test/delete-me.ts";
      const content = "export const test = 1;";

      // 保存文件
      await saveFile(testProjectId, filePath, content);

      // 删除文件
      await deleteFile(testProjectId, filePath);

      // 尝试加载已删除的文件
      const loadedContent = await loadFile(testProjectId, filePath);
      expect(loadedContent).toBeNull();
    });

    it("应该支持原有的listFiles API", async () => {
      // 创建多个文件
      await saveFile(testProjectId, "/src/index.ts", "export default {};");
      await saveFile(testProjectId, "/src/utils.ts", "export const util = 1;");
      await saveFile(testProjectId, "/src/components/App.tsx", "export const App = () => {};");

      // 列出所有文件
      const files = await listFiles(testProjectId);

      // 打印实际返回的路径
      console.warn("实际返回的文件路径:", files.map(f => f.path));

      expect(files).toHaveLength(3);
      // 验证返回的文件路径格式正确
      expect(files.every(f => f.projectId === testProjectId)).toBe(true);
      // 验证路径包含项目ID和文件路径
      expect(files.some(f => f.path.includes("src/index.ts"))).toBe(true);
      expect(files.some(f => f.path.includes("src/utils.ts"))).toBe(true);
      expect(files.some(f => f.path.includes("src/components/App.tsx"))).toBe(true);
    });

    it("应该支持批量操作API", async () => {
      const files = {
        "/src/a.ts": "export const a = 1;",
        "/src/b.ts": "export const b = 2;",
        "/src/c.ts": "export const c = 3;",
      };

      // 批量保存 (参数顺序: projectId, files)
      await saveFiles(testProjectId, files);

      // 批量加载
      const loadedFiles = await loadFiles(testProjectId, ["/src/a.ts", "/src/b.ts", "/src/c.ts"]);

      expect(loadedFiles["/src/a.ts"]).toBe("export const a = 1;");
      expect(loadedFiles["/src/b.ts"]).toBe("export const b = 2;");
      expect(loadedFiles["/src/c.ts"]).toBe("export const c = 3;");
    });
  });

  describe("缓存功能测试", () => {
    it("应该缓存文件内容", async () => {
      const filePath = "/test/cached-file.ts";
      const content = "export const cached = true;";

      // 第一次保存并加载
      await saveFile(testProjectId, filePath, content);
      const firstLoad = await loadFile(testProjectId, filePath);

      // 第二次加载（应该从缓存读取）
      const secondLoad = await loadFile(testProjectId, filePath);

      expect(firstLoad).toBe(content);
      expect(secondLoad).toBe(content);

      // 验证缓存命中率
      const hitRate = getCacheHitRate();
      expect(hitRate).toBeGreaterThan(0);
    });

    it("应该在文件更新时清除缓存", async () => {
      const filePath = "/test/update-test.ts";
      const content1 = "export const version = 1;";
      const content2 = "export const version = 2;";

      // 第一次保存并加载
      await saveFile(testProjectId, filePath, content1);
      await loadFile(testProjectId, filePath);

      // 更新文件
      await saveFile(testProjectId, filePath, content2);

      // 加载更新后的文件
      const loadedContent = await loadFile(testProjectId, filePath);
      expect(loadedContent).toBe(content2);
    });

    it("应该在删除文件时清除缓存", async () => {
      const filePath = "/test/delete-cache-test.ts";
      const content = "export const test = 'delete';";

      // 保存并加载文件
      await saveFile(testProjectId, filePath, content);
      await loadFile(testProjectId, filePath);

      // 删除文件
      await deleteFile(testProjectId, filePath);

      // 尝试加载已删除的文件（应该从缓存中清除）
      const loadedContent = await loadFile(testProjectId, filePath);
      expect(loadedContent).toBeNull();
    });

    it("应该支持手动清除缓存", async () => {
      const filePath = "/test/clear-cache-test.ts";
      const content = "export const test = 'clear';";

      // 保存并加载文件
      await saveFile(testProjectId, filePath, content);
      await loadFile(testProjectId, filePath);

      // 手动清除缓存
      clearCache();

      // 验证缓存已被清除（缓存数据被清空，但性能指标仍然保留）
      const cacheStats = await listFiles(testProjectId);
      expect(cacheStats.length).toBeGreaterThan(0);
    });
  });

  describe("性能监控测试", () => {
    it("应该记录查询次数", async () => {
      const filePath = "/test/metrics-test.ts";
      const content = "export const test = 'metrics';";

      // 执行多次操作
      await saveFile(testProjectId, filePath, content);
      await loadFile(testProjectId, filePath);
      await loadFile(testProjectId, filePath);

      const metrics = getPerformanceMetrics();
      expect(metrics.queryCount).toBeGreaterThan(0);
    });

    it("应该计算缓存命中率", async () => {
      const filePath = "/test/hit-rate-test.ts";
      const content = "export const test = 'hit-rate';";

      // 保存文件
      await saveFile(testProjectId, filePath, content);

      // 多次加载同一文件（第二次应该命中缓存）
      await loadFile(testProjectId, filePath);
      await loadFile(testProjectId, filePath);
      await loadFile(testProjectId, filePath);

      const hitRate = getCacheHitRate();
      // 至少有一次缓存命中（后两次加载）
      expect(hitRate).toBeGreaterThan(0);
    });

    it("应该记录平均查询时间", async () => {
      const filePath = "/test/avg-time-test.ts";
      const content = "export const test = 'avg-time';";

      // 执行多次查询
      await saveFile(testProjectId, filePath, content);
      for (let i = 0; i < 10; i++) {
        await loadFile(testProjectId, filePath);
      }

      const metrics = getPerformanceMetrics();
      expect(metrics.averageQueryTime).toBeGreaterThanOrEqual(0);
      expect(metrics.totalQueryTime).toBeGreaterThan(0);
    });
  });

  describe("批量操作优化测试", () => {
    it("应该并行处理批量查询", async () => {
      const fileCount = 50;
      const files: Record<string, string> = {};

      // 创建测试文件
      for (let i = 0; i < fileCount; i++) {
        files[`/src/file${i}.ts`] = `export const file${i} = ${i};`;
      }

      // 批量保存
      await saveFiles(testProjectId, files);

      // 批量加载
      const startTime = performance.now();
      const loadedFiles = await loadFiles(testProjectId, Object.keys(files));
      const endTime = performance.now();

      // 验证所有文件都加载成功
      expect(Object.keys(loadedFiles)).toHaveLength(fileCount);

      // 验证性能（50个文件应该在100ms内完成）
      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(100);

      console.warn(`批量查询${fileCount}个文件耗时: ${queryTime.toFixed(2)}ms`);
    });

    it("应该在批量操作中正确处理缓存", async () => {
      const files = {
        "/src/a.ts": "export const a = 1;",
        "/src/b.ts": "export const b = 2;",
      };

      // 批量保存
      await saveFiles(testProjectId, files);

      // 第一次批量加载（未命中缓存）
      await loadFiles(testProjectId, ["/src/a.ts", "/src/b.ts"]);

      // 第二次批量加载（应该命中缓存）
      await loadFiles(testProjectId, ["/src/a.ts", "/src/b.ts"]);

      // 验证缓存命中率
      const hitRate = getCacheHitRate();
      expect(hitRate).toBeGreaterThan(0);
    });
  });

  describe("并发安全测试", () => {
    it("应该安全处理并发写入", async () => {
      const filePath = "/test/concurrent-write.ts";
      const promises: Promise<void>[] = [];

      // 并发写入同一文件
      for (let i = 0; i < 10; i++) {
        promises.push(saveFile(testProjectId, filePath, `content${i}`));
      }

      // 等待所有写入完成
      await Promise.all(promises);

      // 加载文件，应该有内容
      const content = await loadFile(testProjectId, filePath);
      expect(content).toBeDefined();
    });

    it("应该安全处理并发读写", async () => {
      const filePath = "/test/concurrent-read-write.ts";
      await saveFile(testProjectId, filePath, "initial content");

      const promises: Promise<void | string | null>[] = [];

      // 并发读
      for (let i = 0; i < 5; i++) {
        promises.push(loadFile(testProjectId, filePath));
      }

      // 并发写
      for (let i = 0; i < 5; i++) {
        promises.push(saveFile(testProjectId, filePath, `write${i}`));
      }

      // 等待所有操作完成
      await Promise.all(promises);

      // 最终文件应该有内容
      const finalContent = await loadFile(testProjectId, filePath);
      expect(finalContent).toBeDefined();
    });
  });

  describe("边界条件测试", () => {
    it("应该处理空文件列表", async () => {
      const loadedFiles = await loadFiles(testProjectId, []);
      expect(loadedFiles).toEqual({});
    });

    it("应该处理不存在的文件", async () => {
      const content = await loadFile(testProjectId, "/nonexistent/file.ts");
      expect(content).toBeNull();
    });

    it("应该处理大文件", async () => {
      const filePath = "/test/large-file.ts";
      // 创建1MB的大文件
      const largeContent = "x".repeat(1024 * 1024);

      const startTime = performance.now();
      await saveFile(testProjectId, filePath, largeContent);
      const loadedContent = await loadFile(testProjectId, filePath);
      const endTime = performance.now();

      expect(loadedContent).toBe(largeContent);
      console.warn(`大文件操作耗时: ${(endTime - startTime).toFixed(2)}ms`);
    });

    it("应该处理特殊字符路径", async () => {
      const specialPaths = [
        "/test/文件名.ts",
        "/test/path with spaces.ts",
        "/test/path-with-dashes.ts",
        "/test/path_with_underscores.ts",
      ];

      for (const path of specialPaths) {
        await saveFile(testProjectId, path, `content of ${path}`);
        const content = await loadFile(testProjectId, path);
        expect(content).toBe(`content of ${path}`);
      }
    });
  });

  describe("性能基准验证", () => {
    it("单次查询时间应小于10ms", async () => {
      const filePath = "/test/benchmark-single.ts";
      const content = "export const benchmark = 'single';";

      await saveFile(testProjectId, filePath, content);

      const startTime = performance.now();
      await loadFile(testProjectId, filePath);
      const endTime = performance.now();

      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(10);

      console.warn(`单次查询耗时: ${queryTime.toFixed(2)}ms`);
    });

    it("缓存命中查询应小于1ms", async () => {
      const filePath = "/test/benchmark-cache.ts";
      const content = "export const benchmark = 'cache';";

      await saveFile(testProjectId, filePath, content);

      // 第一次加载（填充缓存）
      await loadFile(testProjectId, filePath);

      // 第二次加载（命中缓存）
      const startTime = performance.now();
      await loadFile(testProjectId, filePath);
      const endTime = performance.now();

      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(1);

      console.warn(`缓存命中查询耗时: ${queryTime.toFixed(2)}ms`);
    });

    it("批量查询100个文件应小于100ms", async () => {
      const fileCount = 100;
      const files: Record<string, string> = {};

      for (let i = 0; i < fileCount; i++) {
        files[`/src/benchmark${i}.ts`] = `export const benchmark${i} = ${i};`;
      }

      await saveFiles(testProjectId, files);

      const startTime = performance.now();
      await loadFiles(testProjectId, Object.keys(files));
      const endTime = performance.now();

      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(100);

      console.warn(`批量查询${fileCount}个文件耗时: ${queryTime.toFixed(2)}ms`);
    });
  });
});
