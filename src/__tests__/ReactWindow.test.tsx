// @ts-nocheck
/**
 * @file: ReactWindow.test.tsx
 * @description: 测试react-window的基本功能
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-03-30
 * @updated: 2026-04-14
 * @license: MIT
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// 测试react-window导入 (v2.x API)
describe("React Window基础测试", () => {
  it("应该成功导入List", async () => {
    const { List } = await import("react-window");
    expect(List).toBeDefined();
    expect(typeof List).toMatch(/function|object/);
  });

  it("应该成功渲染List", async () => {
    const { List } = await import("react-window");

    const items = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div style={style}>{items[index]}</div>
    );

    const { container } = render(
      <List
        height={200}
        itemCount={items.length}
        itemSize={35}
        width={300}
        rowComponent={Row as (props: { index: number; style: React.CSSProperties }) => React.ReactElement | null}
      />,
    );

    expect(container).toBeTruthy();
  });
});
