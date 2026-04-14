/**
 * @file: react-window.ts
 * @description: Mock for react-window to fix test compatibility issues with v2.x API
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v2.0.0
 */

import React from 'react';

const List = React.forwardRef((props: any, ref: any) => {
  const {
    style,
    rowCount,
    rowHeight,
    overscanCount = 5,
    rowComponent: RowComponent,
    rowProps = {},
    onRowsRendered,
    children,
  } = props;

  const items = Array.from({ length: Math.min(rowCount, 20) }, (_, i) => i);

  React.useImperativeHandle(ref, () => ({
    scrollToRow: () => {},
    element: null,
  }));

  React.useEffect(() => {
    if (onRowsRendered && items.length > 0) {
      onRowsRendered({
        startIndex: 0,
        stopIndex: Math.min(items.length - 1, 19),
      });
    }
  }, [items.length, onRowsRendered]);

  return React.createElement('div', { style: { ...style, overflow: 'auto' } },
    items.map((index: number) => {
      const itemStyle = {
        position: 'relative' as const,
        height: typeof rowHeight === 'function' ? rowHeight(index) : rowHeight,
        top: 0,
        left: 0,
        width: '100%',
      };

      if (RowComponent) {
        return React.createElement('div', { key: index },
          React.createElement(RowComponent, {
            index,
            style: itemStyle,
            ariaAttributes: {
              'aria-posinset': index + 1,
              'aria-setsize': rowCount,
              role: 'listitem',
            },
            ...rowProps,
          })
        );
      }

      if (children) {
        return React.createElement('div', { key: index }, children({ index, style: itemStyle }));
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