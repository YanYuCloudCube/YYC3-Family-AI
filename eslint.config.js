/**
 * @file eslint.config.js
 * @description ESLint v9 平面配置文件 - YYC3 Family AI 项目代码质量检查
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags eslint,config,linting,quality
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  // ── 全局忽略配置 ──
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      'playwright-report/',
      '*.config.*',
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
      'postcss.config.mjs',
      'src/imports/**',
      'src/__tests__/**/*.tsx',
    ],
  },

  // ── 基础推荐配置 ──
  eslint.configs.recommended,

  // ── TypeScript 基础配置 (非严格) ──
  ...tseslint.configs.recommended,

  // ── 主配置 ──
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        vitest: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        it: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
      },
    },

    plugins: {
      'react-hooks': reactHooks,
    },

    rules: {
      // ===== React Hooks 规则 =====
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ===== TypeScript 规则 - 宽松模式 =====
      // 未使用变量 - 允许下划线前缀
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // 显式 any 类型 - 改为警告而非错误
      '@typescript-eslint/no-explicit-any': 'warn',

      // 非空断言 - 警告
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // ===== 通用规则 =====
      // 控制台 - 允许 warn 和 error
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // 变量声明偏好
      'prefer-const': 'warn',
      'no-var': 'error',

      // 代码风格 - 宽松
      'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 0 }],
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',

      // 最佳实践 - 警告
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'no-useless-escape': 'warn',

      // 关闭需要类型信息的规则 (未配置 parserOptions.project)
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
    },
  },

  // ── 测试文件特殊配置 ──
  {
    files: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    rules: {
      // 测试文件中允许 any (用于 mock)
      '@typescript-eslint/no-explicit-any': 'off',
      // 测试文件中允许 console
      'no-console': 'off',
      // 测试文件中允许未使用变量 (用于 test helpers)
      '@typescript-eslint/no-unused-vars': 'off',
      // 测试文件中允许非空断言
      '@typescript-eslint/no-non-null-assertion': 'off',
      // 测试文件中放宽格式要求
      'prefer-template': 'off',
      'prefer-nullish-coalescing': 'off',
      'no-trailing-spaces': 'off',
      'eol-last': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },

  // ── 脚本文件配置 ──
  {
    files: ['scripts/**/*.ts', '**/*.config.ts'],
    rules: {
      'no-console': 'off',
    },
  }
);
