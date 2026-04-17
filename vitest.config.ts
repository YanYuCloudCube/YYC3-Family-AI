import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "react-window": path.resolve(__dirname, "./src/__mocks__/react-window.ts"),
      "pg": path.resolve(__dirname, "./src/__tests__/mocks/empty-module.ts"),
      "mysql2": path.resolve(__dirname, "./src/__tests__/mocks/empty-module.ts"),
      "mysql2/promise": path.resolve(__dirname, "./src/__tests__/mocks/empty-module.ts"),
      "better-sqlite3": path.resolve(__dirname, "./src/__tests__/mocks/empty-module.ts"),
      "node-pty": path.resolve(__dirname, "./src/__tests__/mocks/empty-module.ts"),
      "sql.js": path.resolve(__dirname, "./src/__tests__/mocks/empty-module.ts"),
      "child_process": path.resolve(__dirname, "./src/__tests__/mocks/empty-module.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    globalSetup: ["./src/__tests__/global-setup.ts"],
    deps: {
      interopDefault: true,
    },
    include: [
      "src/__tests__/**/*.test.{ts,tsx}",
      "src/services/**/__tests__/**/*.test.{ts,tsx}",
      "src/app/components/ide/**/__tests__/**/*.test.{ts,tsx}",
      "src/app/components/ide/stores/**/__tests__/**/*.test.{ts,tsx}",
      "src/app/components/**/__tests__/**/*.test.{ts,tsx}",
      "src/app/components/ide/services/__tests__/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      
      // ── 覆盖率阈值（YYC³ CI/CD门禁对齐）──────────────
      // 与 .github/workflows/quality-gate.yml 阈值保持一致
      thresholds: {
        statements: 62,     // CI门禁: 62%
        branches: 55,       // CI门禁: 55%
        functions: 60,      // CI门禁: 60%
        lines: 65,          // CI门禁: 65%
        
        // ── 关键模块覆盖率目标 ─────────────────────
        'src/app/components/ide/services/**': {
          statements: 45,
          branches: 40,
          functions: 42,
          lines: 45,
        },
        
        // AI模块 - 高标准维持
        'src/app/components/ide/ai/**': {
          statements: 90,
          branches: 78,
          functions: 94,
          lines: 91,
        },
        
        // Settings组件 - 已补全测试
        'src/app/components/ide/settings/**': {
          statements: 35,
          branches: 30,
          functions: 33,
          lines: 35,
        },
        
        // Hooks - 已补全测试
        'src/app/components/ide/hooks/**': {
          statements: 30,
          branches: 25,
          functions: 28,
          lines: 30,
        },
        
        // Config/API - 已补全测试
        'src/app/components/ide/config/**': {
          statements: 25,
          branches: 20,
          functions: 23,
          lines: 25,
        },
      },
      
      include: ["src/app/**/*.{ts,tsx}"],
      exclude: [
        "src/__tests__/**",
        "src/imports/**",
        "src/app/components/figma/**",
        "src/app/components/ui/**",
        "src/app/core/**",
        "src/app/examples/**",
        "node_modules/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/types/**",
        // 临时排除（待后续补全测试）
        'src/app/components/settings/**',
        'src/app/components/ide/storage/**',
        'src/app/components/ide/plugins/**',
        'src/app/components/ide/components/**',
        'src/app/components/ide/factory/**',
        'src/app/components/ide/di/**',
        'src/app/components/ide/examples/**',
        'src/app/components/ide/bridge/**',
      ],
      
      // ── 增强报告选项 ────────────────────────────────
      reportOnFailure: true,  // CI失败时输出详细报告
    },
  },
})
