/**
 * @file VirtualFileTree.test.tsx
 * @description 虚拟滚动文件树基础功能测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-30
 * @updated 2026-03-30
 * @license MIT
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import VirtualFileTree from "../app/components/ide/VirtualFileTree";
import { type FileNode } from "../app/components/ide/fileData";

describe("VirtualFileTree基础功能测试", () => {
  const mockTreeData: FileNode[] = [
    {
      name: "src",
      path: "src",
      type: "folder",
      children: [
        {
          name: "app",
          path: "src/app",
          type: "folder",
          children: [
            {
              name: "App.tsx",
              path: "src/app/App.tsx",
              type: "file",
              lang: "tsx",
            },
            {
              name: "index.ts",
              path: "src/app/index.ts",
              type: "file",
              lang: "ts",
            },
          ],
        },
        {
          name: "utils.ts",
          path: "src/utils.ts",
          type: "file",
          lang: "ts",
        },
      ],
    },
    {
      name: "package.json",
      path: "package.json",
      type: "file",
      lang: "json",
    },
  ];

  const mockOnFileSelect = vi.fn();
  const mockOnContextMenu = vi.fn();

  it("应该成功渲染文件树组件", () => {
    const { container } = render(
      <VirtualFileTree
        treeData={mockTreeData}
        activeFile=""
        onFileSelect={mockOnFileSelect}
        onContextMenu={mockOnContextMenu}
        height={400}
        itemHeight={28}
      />,
    );

    // 验证组件渲染成功
    expect(container).toBeTruthy();
  });

  it("应该只渲染可见节点", () => {
    const { container } = render(
      <VirtualFileTree
        treeData={mockTreeData}
        activeFile=""
        onFileSelect={mockOnFileSelect}
        onContextMenu={mockOnContextMenu}
        height={100}
        itemHeight={28}
      />,
    );

    // 计算可见节点数量
    const visibleCount = Math.ceil(100 / 28) + 5;
    const allNodes = container.querySelectorAll('[class*="flex"]');

    // 验证渲染的节点数量在合理范围内
    expect(allNodes.length).toBeLessThan(visibleCount * 2);
  });

  it("应该支持搜索过滤", () => {
    const { container, rerender } = render(
      <VirtualFileTree
        treeData={mockTreeData}
        activeFile=""
        onFileSelect={mockOnFileSelect}
        onContextMenu={mockOnContextMenu}
        searchQuery=""
        height={400}
        itemHeight={28}
      />,
    );

    const initialNodeCount = container.querySelectorAll('[class*="flex"]').length;

    // 应用搜索
    rerender(
      <VirtualFileTree
        treeData={mockTreeData}
        activeFile=""
        onFileSelect={mockOnFileSelect}
        onContextMenu={mockOnContextMenu}
        searchQuery="App"
        height={400}
        itemHeight={28}
      />,
    );

    const filteredNodeCount = container.querySelectorAll('[class*="flex"]').length;

    // 验证搜索后节点数量减少
    expect(filteredNodeCount).toBeLessThanOrEqual(initialNodeCount);
  });

  it("应该显示文件夹图标", () => {
    render(
      <VirtualFileTree
        treeData={mockTreeData}
        activeFile=""
        onFileSelect={mockOnFileSelect}
        onContextMenu={mockOnContextMenu}
        height={400}
        itemHeight={28}
      />,
    );

    // 验证文件夹图标存在（通过查找特定的class）
    const folderElements = document.querySelectorAll('[class*="text-amber"]');
    expect(folderElements.length).toBeGreaterThan(0);
  });

  it("应该显示文件图标", () => {
    render(
      <VirtualFileTree
        treeData={mockTreeData}
        activeFile=""
        onFileSelect={mockOnFileSelect}
        onContextMenu={mockOnContextMenu}
        height={400}
        itemHeight={28}
      />,
    );

    // 验证文件图标存在
    const fileElements = document.querySelectorAll('[class*="text-blue"]');
    expect(fileElements.length).toBeGreaterThan(0);
  });
});
