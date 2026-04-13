import type { Meta, StoryObj } from '@storybook/react';
import { PWAInstallPrompt } from '../app/components/PWAInstallPrompt';

const meta = {
  title: 'YYC³/PWA/PWAInstallPrompt',
  component: PWAInstallPrompt,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# PWA 安装提示组件

用于显示 PWA 安装提示、离线状态指示器和更新通知的组件。

## 功能特性

- 📱 **安装提示**: 显示 PWA 安装横幅
- 📴 **离线指示**: 离线时显示状态提示
- 🔄 **更新通知**: 检测到新版本时提示更新
- 🎨 **多种位置**: 支持左下角、右下角、左上角、右上角

## 使用示例

\`\`\`tsx
import { PWAInstallPrompt } from '@/app/components/PWAInstallPrompt';

function App() {
  return (
    <PWAInstallPrompt
      position="bottom-right"
      showOfflineIndicator={true}
      showUpdateBadge={true}
    />
  );
}
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
      description: '提示框显示位置',
    },
    showOfflineIndicator: {
      control: 'boolean',
      description: '是否显示离线状态指示器',
    },
    showUpdateBadge: {
      control: 'boolean',
      description: '是否显示更新通知',
    },
  },
} satisfies Meta<typeof PWAInstallPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    position: 'bottom-right',
    showOfflineIndicator: true,
    showUpdateBadge: true,
  },
};

export const BottomLeft: Story = {
  args: {
    position: 'bottom-left',
    showOfflineIndicator: true,
    showUpdateBadge: false,
  },
};

export const TopRight: Story = {
  args: {
    position: 'top-right',
    showOfflineIndicator: false,
    showUpdateBadge: true,
  },
};

export const Minimal: Story = {
  args: {
    position: 'bottom-right',
    showOfflineIndicator: false,
    showUpdateBadge: false,
  },
};
