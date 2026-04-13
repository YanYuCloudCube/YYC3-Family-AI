import type { Meta, StoryObj } from '@storybook/react';
import { SystemMonitorDashboard } from '../app/components/SystemMonitorDashboard';

const meta = {
  title: 'YYC³/Monitoring/SystemMonitorDashboard',
  component: SystemMonitorDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# 系统监控仪表板

用于显示本地系统性能指标的仪表板组件。

## 功能特性

- 💾 **存储监控**: IndexedDB/localStorage/Cache 使用量
- 🧠 **内存监控**: JS Heap Size 使用情况
- ⚡ **性能指标**: FCP/LCP/TTFB 等 Web Vitals
- 📊 **可视化图表**: 直观的进度条和状态指示
- 🔒 **隐私保护**: 数据完全本地采集

## 使用示例

\`\`\`tsx
import { SystemMonitorDashboard } from '@/app/components/SystemMonitorDashboard';

function MonitorPage() {
  return <SystemMonitorDashboard />;
}
\`\`\`

## 监控指标

| 指标 | 说明 | 阈值 |
|------|------|------|
| FCP | 首屏渲染时间 | ≤1000ms 优秀 |
| LCP | 最大内容绘制 | ≤2000ms 优秀 |
| TTFB | 首字节时间 | ≤600ms 良好 |
| 内存 | JS 堆内存使用 | <70% 正常 |
| 存储 | 本地存储使用 | <80% 正常 |
        `,
      },
    },
  },
} satisfies Meta<typeof SystemMonitorDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
