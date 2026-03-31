# YYC3-P3-配置 - 环境变量

**版本**: v1.0.0  
**创建日期**: 2026-03-19  
**最后更新**: 2026-03-19  
**状态**: ✅ 稳定

---

## 📊 概述

环境变量配置提供:

- 🔐 **敏感信息管理**: API Keys、DSN 等
- ⚙️ **功能开关**: 启用/禁用功能
- 🌍 **环境区分**: 开发/测试/生产
- 🔧 **服务配置**: 第三方服务地址

---

## 🎯 目标

- 安全存储敏感信息
- 灵活配置不同环境
- 简化部署流程
- 提升安全性

---

## 📋 配置文件

### 1. 文件结构

```
project/
├── .env.example          # 配置模板 (提交到 Git)
├── .env                  # 默认配置 (不提交)
├── .env.local            # 本地配置 (不提交)
├── .env.development      # 开发环境 (不提交)
├── .env.production       # 生产环境 (不提交)
└── .env.test             # 测试环境 (不提交)
```

### 2. 优先级

```
.env.local > .env.{environment} > .env
```

### 3. 示例配置

```bash
# .env.example

# 应用配置
NODE_ENV=development
VITE_APP_VERSION=0.0.1
VITE_APP_NAME=YYC3 Family AI

# Sentry 错误追踪
VITE_SENTRY_DSN=https://your_key@o0.ingest.sentry.io/project_id
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_SAMPLE_RATE=1.0

# LLM Provider API Keys
VITE_ZHIPU_API_KEY=your_zhipu_key
VITE_DASHSCOPE_API_KEY=your_dashscope_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_DEEPSEEK_API_KEY=your_deepseek_key

# 服务地址
VITE_API_BASE_URL=https://api.yyc3.com
VITE_WEBSOCKET_URL=wss://ws.yyc3.com

# 功能开关
VITE_ENABLE_SENTRY=true
VITE_ENABLE_WEBSOCKET=false
```

---

## 🔧 使用指南

### 1. 创建配置

```bash
# 复制模板
cp .env.example .env.local

# 编辑配置
vim .env.local
```

### 2. 在代码中使用

```tsx
// 读取环境变量
const appName = import.meta.env.VITE_APP_NAME;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const isProduction = import.meta.env.PROD;

// 条件配置
const config = {
  sentry: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
  sampleRate: parseFloat(import.meta.env.VITE_SENTRY_SAMPLE_RATE || "1.0"),
};
```

### 3. TypeScript 类型定义

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SENTRY_ENVIRONMENT: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_SENTRY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly PROD: boolean;
  readonly DEV: boolean;
}
```

---

## ⚠️ 注意事项

### 1. 不要提交敏感信息

```bash
# .gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 2. 环境变量命名

```bash
# ✅ 正确 - 使用 VITE_ 前缀
VITE_API_KEY=abc123

# ❌ 错误 - 没有 VITE_前缀 (不会暴露到客户端)
API_KEY=abc123
```

### 3. 默认值处理

```typescript
// 提供默认值
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const sampleRate = parseFloat(import.meta.env.VITE_SENTRY_SAMPLE_RATE || "1.0");
```

---

## 📊 环境区分

### 开发环境 (.env.development)

```bash
NODE_ENV=development
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_SAMPLE_RATE=1.0
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_SENTRY=false
```

### 测试环境 (.env.test)

```bash
NODE_ENV=test
VITE_SENTRY_ENVIRONMENT=test
VITE_SENTRY_SAMPLE_RATE=0
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_SENTRY=false
```

### 生产环境 (.env.production)

```bash
NODE_ENV=production
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_SAMPLE_RATE=0.1
VITE_API_BASE_URL=https://api.yyc3.com
VITE_ENABLE_SENTRY=true
```

---

## 🔐 安全最佳实践

### 1. 使用 .env.example

```bash
# .env.example - 提交到 Git
# 包含所有配置项，但使用占位符

VITE_API_KEY=your_api_key_here
VITE_SECRET=your_secret_here
```

### 2. 加密敏感信息

```bash
# 使用加密工具
echo "secret_value" | openssl enc -aes-256-cbc -pbkdf2 -base64

# 在代码中解密
const decrypted = decrypt(import.meta.env.VITE_ENCRYPTED_SECRET);
```

### 3. 定期轮换密钥

```bash
# 设置密钥过期时间
VITE_API_KEY_EXPIRES=2026-12-31

# 在代码中检查
if (new Date() > new Date(import.meta.env.VITE_API_KEY_EXPIRES)) {
  console.warn("API Key 已过期");
}
```

---

## 🎯 配置管理

### 1. 配置验证

```typescript
// utils/validateEnv.ts
export function validateEnv() {
  const required = [
    "VITE_APP_NAME",
    "VITE_API_BASE_URL",
  ];
  
  const missing = required.filter(
    key => !import.meta.env[key]
  );
  
  if (missing.length > 0) {
    throw new Error(
      `缺少必需的环境变量：${missing.join(", ")}`
    );
  }
}

// 在应用启动时验证
validateEnv();
```

### 2. 配置导出

```typescript
// config/index.ts
export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME,
    version: import.meta.env.VITE_APP_VERSION,
  },
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    sampleRate: parseFloat(
      import.meta.env.VITE_SENTRY_SAMPLE_RATE || "1.0"
    ),
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL,
  },
} as const;
```

---

## 📚 相关文档

- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [Sentry 配置](./YYC3-P3-监控-Sentry 集成.md)
- [CSP 配置](./YYC3-P3-安全-CSP 配置.md)

---

<div align="center">

> 「***YanYuCloudCube***」  
> 「***<admin@0379.email>***」  
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**维护团队**: YanYuCloudCube Team

</div>
