/**
 * @file: react-window.ts
 * @description: Mock for react-window to fix test compatibility issues with v2.x API
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 */

import React from 'react';

const List = React.forwardRef((props: any, ref: any) => {
  const { height, itemCount, itemSize, width, rowComponent, children } = props;
  const items = Array.from({ length: Math.min(itemCount, 20) }, (_, i) => i);
  
  React.useImperativeHandle(ref, () => ({
    scrollToRow: () => {},
    element: null,
  }));

  return React.createElement('div', { style: { height, width, overflow: 'auto' } },
    items.map((index: number) => {
      const style = {
        position: 'relative',
        height: typeof itemSize === 'number' ? itemSize : itemSize(index),
        top: 0,
        left: 0,
      };
      
      if (rowComponent) {
        return React.createElement('div', { key: index }, rowComponent({ index, style }));
      }
      if (children) {
        return React.createElement('div', { key: index }, children({ index, style }));
      }
      return null;
    })
  );
});

(List as any).displayName = 'MockList';

export function useListRef() {
  return React.useRef(null);
}

export { List };
export default { List, useListRef };