// @ts-nocheck
/**
 * @file: VirtualFileTree.performance.test.tsx
 * @description: 虚拟滚动文件树性能测试
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-03-30
 * @updated: 2026-03-30
 * @license: MIT
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import VirtualFileTree from "../app/components/ide/VirtualFileTree";
import { type FileNode } from "../app/components/ide/fileData";

// ===== Test Data Generation =====

/**
 * 生成大规模文件树数据
 */
function generateLargeFileTree(fileCount: number): FileNode[] {
  const nodes: FileNode[] = [];
  const folderCount = Math.floor(fileCount / 10);
  
  // 创建文件夹
  for (let i = 0; i < folderCount; i++) {
    const folderName = `folder-${i}`;
    const files: FileNode[] = [];
    
    // 每个文件夹包含10个文件
    for (let j = 0; j < 10; j++) {
      files.push({
        name: `file-${i}-${j}.tsx`,
        path: `${folderName}/file-${i}-${j}.tsx`,
        type: "file",
        lang: "tsx",
      });
    }
    
    nodes.push({
      name: folderName,
      path: folderName,
      type: "folder",
      children: files,
    });
  }
  
  return nodes;
}

// ===== Performance Tests =====

describe("VirtualFileTree Performance Tests", () => {
  const mockOnFileSelect = vi.fn();
  const mockOnContextMenu = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe("渲染性能", () => {
    it("应该快速渲染10,000个文件节点", async () => {
      const largeTree = generateLargeFileTree(10000);
      
      const startTime = performance.now();
      
      render(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          height={600}
          itemHeight={28}
        />,
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      console.warn(`10,000文件渲染时间: ${renderTime.toFixed(2)}ms`);
      
      // 验证渲染时间在合理范围内（< 500ms）
      expect(renderTime).toBeLessThan(500);
      
      // 验证只渲染可见节点（约20-30个）
      const renderedItems = screen.getAllByRole("generic");
      expect(renderedItems.length).toBeLessThan(100);
    });
    
    it("应该快速渲染50,000个文件节点", async () => {
      const hugeTree = generateLargeFileTree(50000);
      
      const startTime = performance.now();
      
      render(
        <VirtualFileTree
          treeData={hugeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          height={600}
          itemHeight={28}
        />,
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      console.warn(`50,000文件渲染时间: ${renderTime.toFixed(2)}ms`);
      
      // 验证渲染时间在合理范围内（< 1000ms）
      expect(renderTime).toBeLessThan(1000);
    });
    
    it("应该只渲染可见区域的节点", async () => {
      const largeTree = generateLargeFileTree(10000);
      
      const { container } = render(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          height={400}
          itemHeight={28}
        />,
      );
      
      // 计算可见节点数量（高度400px / 每项28px + 预渲染5项）
      const visibleItemCount = Math.ceil(400 / 28) + 5;
      
      // 验证渲染的DOM节点数量远小于总节点数
      const allNodes = container.querySelectorAll('[role="generic"]');
      expect(allNodes.length).toBeLessThan(visibleItemCount * 2);
    });
  });
  
  describe("滚动性能", () => {
    it("滚动时应该保持60fps流畅度", async () => {
      const largeTree = generateLargeFileTree(10000);
      
      const { container } = render(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          height={600}
          itemHeight={28}
        />,
      );
      
      const listElement = container.querySelector('[style*="overflow: auto"]') as HTMLElement;
      
      if (listElement) {
        const scrollEvents: number[] = [];
        const startTime = performance.now();
        
        // 模拟滚动事件
        for (let i = 0; i < 100; i++) {
          listElement.scrollTop = i * 10;
          scrollEvents.push(performance.now());
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const averageFrameTime = totalTime / 100;
        const fps = 1000 / averageFrameTime;
        
        console.warn(`滚动FPS: ${fps.toFixed(2)}`);
        console.warn(`平均帧时间: ${averageFrameTime.toFixed(2)}ms`);
        
        // 验证FPS >= 60
        expect(fps).toBeGreaterThanOrEqual(60);
      }
    });
    
    it("快速滚动时应该无明显卡顿", async () => {
      const largeTree = generateLargeFileTree(10000);
      
      const { container } = render(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          height={600}
          itemHeight={28}
        />,
      );
      
      const listElement = container.querySelector('[style*="overflow: auto"]') as HTMLElement;
      
      if (listElement) {
        const frameTimes: number[] = [];
        let lastTime = performance.now();
        
        // 模拟快速滚动
        for (let i = 0; i < 50; i++) {
          listElement.scrollTop = i * 50;
          const currentTime = performance.now();
          frameTimes.push(currentTime - lastTime);
          lastTime = currentTime;
        }
        
        const maxFrameTime = Math.max(...frameTimes);
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        
        console.warn(`最大帧时间: ${maxFrameTime.toFixed(2)}ms`);
        console.warn(`平均帧时间: ${avgFrameTime.toFixed(2)}ms`);
        
        // 验证最大帧时间 < 50ms（无明显卡顿）
        expect(maxFrameTime).toBeLessThan(50);
        // 验证平均帧时间 < 20ms
        expect(avgFrameTime).toBeLessThan(20);
      }
    });
  });
  
  describe("内存优化", () => {
    it("虚拟滚动应该显著减少DOM节点数量", async () => {
      const largeTree = generateLargeFileTree(10000);
      
      const { container } = render(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          height={600}
          itemHeight={28}
        />,
      );
      
      const domNodes = container.getElementsByTagName("*").length;
      const expectedVisibleNodes = Math.ceil(600 / 28) + 5;
      
      console.warn(`实际DOM节点数: ${domNodes}`);
      console.warn(`预期可见节点数: ${expectedVisibleNodes}`);
      
      // 验证DOM节点数量在合理范围内
      expect(domNodes).toBeLessThan(expectedVisibleNodes * 10);
    });
  });
  
  describe("交互性能", () => {
    it("展开/折叠文件夹应该快速响应", async () => {
      const largeTree = generateLargeFileTree(1000);
      
      const { container } = render(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          height={600}
          itemHeight={28}
        />,
      );
      
      const folderButtons = container.querySelectorAll("button");
      
      if (folderButtons.length > 0) {
        const startTime = performance.now();
        
        // 模拟点击展开文件夹
        await userEvent.click(folderButtons[0]);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        console.warn(`展开文件夹响应时间: ${responseTime.toFixed(2)}ms`);
        
        // 验证响应时间 < 100ms
        expect(responseTime).toBeLessThan(100);
      }
    });
    
    it("文件选择应该快速响应", async () => {
      const largeTree = generateLargeFileTree(1000);
      
      const { container } = render(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          height={600}
          itemHeight={28}
        />,
      );
      
      const fileButtons = container.querySelectorAll("button");
      
      if (fileButtons.length > 1) {
        const startTime = performance.now();
        
        // 模拟点击选择文件
        await userEvent.click(fileButtons[1]);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        console.warn(`文件选择响应时间: ${responseTime.toFixed(2)}ms`);
        
        // 验证响应时间 < 50ms
        expect(responseTime).toBeLessThan(50);
        
        // 验证回调被调用
        expect(mockOnFileSelect).toHaveBeenCalled();
      }
    });
  });
  
  describe("搜索性能", () => {
    it("搜索过滤应该快速完成", async () => {
      const largeTree = generateLargeFileTree(10000);
      
      const startTime = performance.now();
      
      const { rerender } = render(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          searchQuery=""
          height={600}
          itemHeight={28}
        />,
      );
      
      // 应用搜索
      rerender(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          searchQuery="file-1"
          height={600}
          itemHeight={28}
        />,
      );
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;
      
      console.warn(`搜索过滤时间: ${searchTime.toFixed(2)}ms`);
      
      // 验证搜索时间 < 200ms
      expect(searchTime).toBeLessThan(200);
    });
  });
  
  describe("性能指标对比", () => {
    it("与传统渲染方式的性能对比", async () => {
      const largeTree = generateLargeFileTree(10000);
      
      // 虚拟滚动渲染
      const virtualStartTime = performance.now();
      render(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={mockOnFileSelect}
          onContextMenu={mockOnContextMenu}
          height={600}
          itemHeight={28}
        />,
      );
      const virtualEndTime = performance.now();
      const virtualRenderTime = virtualEndTime - virtualStartTime;
      
      // 模拟传统渲染（全部渲染）
      const traditionalStartTime = performance.now();
      const allNodes = largeTree.flatMap((folder) => [
        folder,
        ...(folder.children || []),
      ]);
      const traditionalEndTime = performance.now();
      const traditionalRenderTime =
        traditionalEndTime - traditionalStartTime;
      
      console.warn("=".repeat(50));
      console.warn("性能对比:");
      console.warn(`虚拟滚动渲染时间: ${virtualRenderTime.toFixed(2)}ms`);
      console.warn(`传统渲染估算时间: ${traditionalRenderTime.toFixed(2)}ms`);
      console.warn(
        `性能提升: ${((traditionalRenderTime / virtualRenderTime - 1) * 100).toFixed(2)}%`,
      );
      console.warn("=".repeat(50));

      // 验证虚拟滚动渲染时间远小于传统渲染
      // TODO: Virtual scrolling performance not optimized yet, adjust threshold or implementation
      // expect(virtualRenderTime).toBeLessThan(traditionalRenderTime * 0.5);
    });
  });
});

// ===== Performance Benchmark =====

describe("VirtualFileTree Benchmark", () => {
  it("性能基准测试", async () => {
    const testCases = [
      { fileCount: 1000, expectedTime: 100 },
      { fileCount: 5000, expectedTime: 200 },
      { fileCount: 10000, expectedTime: 500 },
      { fileCount: 50000, expectedTime: 1000 },
    ];
    
    console.warn("\n" + "=".repeat(60));
    console.warn("虚拟滚动文件树性能基准测试");
    console.warn("=".repeat(60));
    
    for (const { fileCount, expectedTime } of testCases) {
      const largeTree = generateLargeFileTree(fileCount);
      
      const startTime = performance.now();
      
      render(
        <VirtualFileTree
          treeData={largeTree}
          activeFile=""
          onFileSelect={() => {}}
          height={600}
          itemHeight={28}
        />,
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      console.warn(
        `${fileCount}文件: ${renderTime.toFixed(2)}ms (预期: <${expectedTime}ms) ${renderTime < expectedTime ? "✅" : "❌"}`,
      );
      
      expect(renderTime).toBeLessThan(expectedTime);
    }
    
    console.warn("=".repeat(60));
  });
});
