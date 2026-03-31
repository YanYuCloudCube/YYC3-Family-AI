import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    // 包含所有测试文件
    include: [
      "src/__tests__/**/*.test.{ts,tsx}",
      "src/app/components/ide/**/__tests__/**/*.test.{ts,tsx}",
      "src/app/components/ide/stores/**/__tests__/**/*.test.{ts,tsx}",
      "src/app/components/**/__tests__/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
      include: ["src/app/**/*.{ts,tsx}"],
      exclude: [
        "src/__tests__/**",
        "src/imports/**",
        "src/app/components/figma/**",
        "node_modules/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/types/**",
      ],
    },
  },
})
