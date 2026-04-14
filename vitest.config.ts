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
      "src/app/components/ide/**/__tests__/**/*.test.{ts,tsx}",
      "src/app/components/ide/stores/**/__tests__/**/*.test.{ts,tsx}",
      "src/app/components/**/__tests__/**/*.test.{ts,tsx}",
      "src/app/components/ide/services/__tests__/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      thresholds: {
        statements: 35,
        branches: 25,
        functions: 30,
        lines: 36,
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
      ],
    },
  },
})
