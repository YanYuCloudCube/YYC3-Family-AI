// @ts-nocheck
/**
 * @file: ReactWindow.test.tsx
 * @description: 测试react-window的基本功能
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-03-30
 * @updated: 2026-03-30
 * @license: MIT
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// 测试react-window导入
describe("React Window基础测试", () => {
  it("应该成功导入FixedSizeList", async () => {
    const { FixedSizeList } = await import("react-window");
    expect(FixedSizeList).toBeDefined();
    expect(typeof FixedSizeList).toBe("function");
  });

  it("应该成功渲染FixedSizeList", async () => {
    const { FixedSizeList } = await import("react-window");

    const items = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div style={style}>{items[index]}</div>
    );

    const { container } = render(
      <FixedSizeList
        height={200}
        itemCount={items.length}
        itemSize={35}
        width={300}
      >
        {Row}
      </FixedSizeList>,
    );

    expect(container).toBeTruthy();
  });
});
