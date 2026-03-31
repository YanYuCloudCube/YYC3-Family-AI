/**
 * file: vite.config.ts
 * description: Vite 构建配置，包含 React 插件、Tailwind CSS 插件、路径别名、
 *              开发服务器配置（端口 3126 固定）、代码分割优化、压缩配置
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-03-19
 * status: stable
 * license: MIT
 * copyright: Copyright (c) 2026 YanYuCloudCube Team
 * tags: config,vite,build,optimization,code-splitting
 */

import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3126,
    strictPort: true,
    hmr: {
      clientPort: 3126,
      overlay: true,
    },
    watch: {
      usePolling: false,
    },
    headers: {
      // 允许跨域加载 Monaco Editor worker
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    fs: {
      // 允许访问 node_modules
      strict: false,
    },
    proxy: {
      // 代理外部 API 请求以避免 CORS 问题
      '/api/zhipu': {
        target: 'https://open.bigmodel.cn/api/paas/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/zhipu/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
        },
      },
      '/api/deepseek': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
        },
      },
      '/api/dashscope': {
        target: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dashscope/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
        },
      },
      '/api/openai': {
        target: 'https://api.openai.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      '@monaco-editor/react',
      'monaco-editor',
    ],
  },
  build: {
    // 代码分割优化 - 减小构建产物大小
    rollupOptions: {
      output: {
        manualChunks: {
          // React 生态
          'react-vendor': ['react', 'react-dom', 'react-router'],
          
          // UI 库 - 分组减小单个 chunk 大小
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
          ],
          
          // 编辑器 - 单独分割
          'monaco': ['@monaco-editor/react', 'monaco-editor'],
          'sandpack': ['@codesandbox/sandpack-react'],
          
          // 富文本编辑器
          'tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-code-block-lowlight',
          ],
          
          // 工具库
          'utils': ['date-fns', 'immer', 'zustand', 'yjs'],
          
          // 动画
          'motion': ['motion'],
          
          // 图表
          'charts': ['recharts'],
        },
      },
    },
    // 压缩优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    // 分块大小限制警告
    chunkSizeWarningLimit: 500,
    // 资源输出目录
    outDir: 'dist',
    // 生成 source map (生产环境关闭以减小体积)
    sourcemap: process.env.NODE_ENV !== 'production',
  },
  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
