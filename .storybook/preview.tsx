import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f172a' },
        { name: 'light', value: '#ffffff' },
        { name: 'slate-900', value: '#0f172a' },
        { name: 'slate-800', value: '#1e293b' },
        { name: 'slate-950', value: '#020617' },
      ],
    },
    themes: {
      default: 'dark',
      list: [
        { name: 'dark', class: 'dark', color: '#0f172a' },
        { name: 'light', class: 'light', color: '#ffffff' },
      ],
    },
    layout: 'centered',
    docs: {
      toc: true,
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-slate-900 min-h-screen p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
