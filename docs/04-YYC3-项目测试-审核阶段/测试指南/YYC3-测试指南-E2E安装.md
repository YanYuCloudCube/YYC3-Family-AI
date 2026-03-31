# Playwright E2E 测试安装指南

## 问题说明

Playwright 浏览器安装需要下载 Chromium (约 100MB+),在网络环境不佳的情况下可能超时。

## 手动安装步骤

### 1. 安装 Playwright

```bash
# 安装 Playwright 包
npm install -D @playwright/test

# 或
pnpm add -D @playwright/test
```

### 2. 安装浏览器

**方式 1: 完整安装 (推荐)**
```bash
npx playwright install
```

这会安装所有浏览器 (Chromium, Firefox, WebKit)。

**方式 2: 仅安装 Chromium**
```bash
npx playwright install chromium
```

**方式 3: 仅安装 Chrome**
```bash
npx playwright install chrome
```

### 3. 安装系统依赖 (Linux)

```bash
npx playwright install-deps
```

### 4. 验证安装

```bash
npx playwright install --help
```

## 运行 E2E 测试

### 开发模式

```bash
# 启动开发服务器并运行测试
npm run test:e2e
```

### UI 模式 (可视化调试)

```bash
npm run test:e2e:ui
```

### 有头模式 (显示浏览器)

```bash
npm run test:e2e:headed
```

### 特定浏览器

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
```

### 特定测试文件

```bash
npx playwright test e2e/ai-chat-flow.spec.ts
npx playwright test e2e/ide-panel-dnd.spec.ts
```

## 当前 E2E 测试文件

项目已创建以下 E2E 测试文件:

1. **ai-chat-flow.spec.ts** - AI 对话流程测试 (12 个用例)
2. **ide-panel-dnd.spec.ts** - IDE 面板拖拽测试 (20 个用例)
3. **settings-configuration.spec.ts** - 设置配置测试 (18 个用例)
4. **code-generation-flow.spec.ts** - 代码生成流程测试 (24 个用例)

总计：**74 个 E2E 测试用例**

## 常见问题

### Q: 安装超时怎么办？

A: 使用国内镜像:
```bash
PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright npx playwright install
```

### Q: 缺少系统依赖？

A: macOS 安装 Xcode 命令行工具:
```bash
xcode-select --install
```

### Q: Docker 环境中如何安装？

A: 使用官方镜像:
```bash
mcr.microsoft.com/playwright:v1.40.0-jammy
```

## 配置说明

配置文件：`playwright.config.ts`

```typescript
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000, // 30 秒超时
  retries: 2, // 失败重试 2 次
  reporter: [
    ["html"], // HTML 报告
    ["list"], // 列表报告
  ],
  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
})
```

## 下一步

安装完成后运行:

```bash
# 运行所有 E2E 测试
npm run test:e2e

# 查看测试报告
open playwright-report/index.html
```

---

**创建日期**: 2026-03-19  
**维护团队**: YanYuCloudCube Team
