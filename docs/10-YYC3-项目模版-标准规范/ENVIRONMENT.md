---
file: ENVIRONMENT.md
description: YYC³ Family AI 环境变量配置指南，包含所有环境变量的说明、默认值、使用示例等
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-30
updated: 2026-03-30
status: stable
tags: environment,configuration,guide,zh-CN
category: technical
language: zh-CN
audience: developers
complexity: intermediate
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# 🌍 环境变量配置指南

## 📋 目录

- [环境变量概述](#环境变量概述)
- [配置文件](#配置文件)
- [核心环境变量](#核心环境变量)
- [数据库配置](#数据库配置)
- [安全配置](#安全配置)
- [第三方服务配置](#第三方服务配置)
- [开发环境配置](#开发环境配置)

---

## 环境变量概述

YYC³ Family AI 使用环境变量进行配置管理，遵循 [12-Factor App](https://12factor.net/) 原则。

### 为什么使用环境变量？

- **安全性**: 避免在代码中硬编码敏感信息
- **灵活性**: 不同环境使用不同配置
- **可移植性**: 易于在不同平台部署
- **可维护性**: 集中管理配置

---

## 配置文件

### .env 文件结构

```bash
# .env.example - 环境变量模板文件
# 复制此文件为 .env 并填写实际值

# ==================== 核心配置 ====================
NODE_ENV=development
PORT=3000

# ==================== 数据库配置 ====================
DATABASE_URL=postgresql://user:password@localhost:5432/yyc3_db

# ==================== 安全配置 ====================
JWT_SECRET=your-jwt-secret-key-change-this
ENCRYPTION_KEY=your-encryption-key-32-characters

# ==================== 第三方服务 ====================
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
```

### 环境文件管理

```
项目根目录/
├── .env                    # 本地开发环境（不提交）
├── .env.example            # 环境变量模板（提交到Git）
├── .env.test               # 测试环境（不提交）
├── .env.production         # 生产环境（不提交）
└── .gitignore              # 排除敏感文件
```

### .gitignore 配置

```gitignore
# 环境变量文件
.env
.env.local
.env.*.local
.env.test
.env.production

# 保留模板文件
!.env.example
```

---

## 核心环境变量

### 应用配置

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `NODE_ENV` | string | `development` | 运行环境: development/test/production | ✅ |
| `PORT` | number | `3000` | 应用端口号 | ✅ |
| `APP_NAME` | string | `YYC³ Family AI` | 应用名称 | ❌ |
| `APP_URL` | string | `http://localhost:3000` | 应用基础URL | ✅ |
| `API_VERSION` | string | `v1` | API版本号 | ❌ |

**示例配置**:

```bash
# 开发环境
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# 生产环境
NODE_ENV=production
PORT=443
APP_URL=https://yyc3.com
```

### 日志配置

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `LOG_LEVEL` | string | `info` | 日志级别: error/warn/info/debug | ❌ |
| `LOG_FORMAT` | string | `json` | 日志格式: json/pretty | ❌ |
| `LOG_FILE` | string | `logs/app.log` | 日志文件路径 | ❌ |

**示例配置**:

```bash
# 开发环境（详细日志）
LOG_LEVEL=debug
LOG_FORMAT=pretty

# 生产环境（简洁日志）
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/yyc3/app.log
```

---

## 数据库配置

### PostgreSQL 配置

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `DATABASE_URL` | string | - | 数据库连接URL | ✅ |
| `DB_HOST` | string | `localhost` | 数据库主机 | ❌ |
| `DB_PORT` | number | `5432` | 数据库端口 | ❌ |
| `DB_NAME` | string | `yyc3_db` | 数据库名称 | ❌ |
| `DB_USER` | string | - | 数据库用户名 | ❌ |
| `DB_PASSWORD` | string | - | 数据库密码 | ❌ |
| `DB_POOL_SIZE` | number | `10` | 连接池大小 | ❌ |

**连接URL格式**:

```bash
# 完整连接URL（推荐）
DATABASE_URL=postgresql://username:password@host:port/database?ssl=true

# 分别配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yyc3_db
DB_USER=yyc3_user
DB_PASSWORD=your-secure-password
DB_POOL_SIZE=20
```

### IndexedDB 配置

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `IDB_NAME` | string | `yyc3_family_ai` | IndexedDB名称 | ❌ |
| `IDB_VERSION` | number | `1` | 数据库版本 | ❌ |

---

## 安全配置

### JWT 认证

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `JWT_SECRET` | string | - | JWT签名密钥 | ✅ |
| `JWT_EXPIRES_IN` | string | `7d` | JWT过期时间 | ❌ |
| `JWT_REFRESH_SECRET` | string | - | 刷新Token密钥 | ✅ |
| `JWT_REFRESH_EXPIRES_IN` | string | `30d` | 刷新Token过期时间 | ❌ |

**生成密钥**:

```bash
# 生成32字节的随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成UUID
node -e "console.log(require('crypto').randomUUID())"
```

**示例配置**:

```bash
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
JWT_REFRESH_EXPIRES_IN=30d
```

### 加密配置

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `ENCRYPTION_KEY` | string | - | 数据加密密钥（32字节hex） | ✅ |
| `ENCRYPTION_ALGORITHM` | string | `aes-256-gcm` | 加密算法 | ❌ |

**生成加密密钥**:

```bash
# 生成32字节的hex密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CORS 配置

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `CORS_ORIGIN` | string | `*` | 允许的跨域来源 | ❌ |
| `CORS_CREDENTIALS` | boolean | `true` | 允许携带凭证 | ❌ |

**示例配置**:

```bash
# 开发环境（允许所有来源）
CORS_ORIGIN=*

# 生产环境（指定来源）
CORS_ORIGIN=https://yyc3.com,https://app.yyc3.com
CORS_CREDENTIALS=true
```

---

## 第三方服务配置

### AI 服务配置

#### OpenAI

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `OPENAI_API_KEY` | string | - | OpenAI API密钥 | ✅ |
| `OPENAI_MODEL` | string | `gpt-4` | 默认模型 | ❌ |
| `OPENAI_MAX_TOKENS` | number | `4096` | 最大Token数 | ❌ |

**示例配置**:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=8192
```

#### Anthropic (Claude)

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `ANTHROPIC_API_KEY` | string | - | Anthropic API密钥 | ❌ |
| `ANTHROPIC_MODEL` | string | `claude-3-opus-20240229` | 默认模型 | ❌ |

**示例配置**:

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

### 文件存储配置

#### 本地存储

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `UPLOAD_DIR` | string | `./uploads` | 上传目录 | ❌ |
| `MAX_FILE_SIZE` | number | `10485760` | 最大文件大小（字节） | ❌ |

#### 云存储 (可选)

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `AWS_ACCESS_KEY_ID` | string | - | AWS访问密钥ID | ❌ |
| `AWS_SECRET_ACCESS_KEY` | string | - | AWS秘密访问密钥 | ❌ |
| `AWS_REGION` | string | `us-east-1` | AWS区域 | ❌ |
| `AWS_S3_BUCKET` | string | - | S3存储桶名称 | ❌ |

---

## 开发环境配置

### 开发工具

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `DEBUG` | string | `yyc3:*` | 调试命名空间 | ❌ |
| `ENABLE_SWAGGER` | boolean | `true` | 启用Swagger文档 | ❌ |
| `ENABLE_GRAPHIQL` | boolean | `true` | 启用GraphiQL | ❌ |

### 测试配置

| 变量名 | 类型 | 默认值 | 说明 | 必需 |
|--------|------|--------|------|------|
| `TEST_TIMEOUT` | number | `30000` | 测试超时时间（毫秒） | ❌ |
| `COVERAGE_THRESHOLD` | number | `80` | 测试覆盖率阈值（%） | ❌ |

---

## 环境变量验证

### 使用 Zod 验证

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
});

const env = envSchema.parse(process.env);

export default env;
```

### 运行时验证

```typescript
// src/config/env.ts
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'OPENAI_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
}

validateEnv();
```

---

## 最佳实践

### 1. 使用 .env.example

```bash
# 始终提供 .env.example 文件
cp .env.example .env
```

### 2. 密钥管理

```bash
# ❌ 不安全：在代码中硬编码
const apiKey = 'sk-xxxxxx';

# ✅ 安全：使用环境变量
const apiKey = process.env.OPENAI_API_KEY;
```

### 3. 类型安全

```typescript
// ✅ 类型安全的环境变量访问
import env from './config/env';

const port = env.PORT; // 类型: number
const dbUrl = env.DATABASE_URL; // 类型: string
```

### 4. 加密敏感数据

```bash
# 加密环境变量文件
ansible-vault encrypt .env.production

# 解密查看
ansible-vault decrypt .env.production
```

### 5. 定期轮换密钥

```bash
# 每90天轮换一次密钥
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

---

## 常见问题

### Q: 如何在不同环境使用不同配置？

```bash
# 开发环境
NODE_ENV=development npm run dev

# 测试环境
NODE_ENV=test npm test

# 生产环境
NODE_ENV=production npm start
```

### Q: 如何验证环境变量是否正确？

```bash
# 检查环境变量
node -e "console.log(process.env.NODE_ENV)"
node -e "console.log(process.env.DATABASE_URL)"

# 使用配置验证脚本
npm run validate:env
```

### Q: 如何安全地分享环境变量？

```bash
# 使用加密工具
gpg --symmetric --cipher-algo AES256 .env

# 解密
gpg --decrypt .env.gpg > .env
```

---

## 检查清单

### 开发环境

- [ ] 复制 `.env.example` 为 `.env`
- [ ] 填写所有必需的环境变量
- [ ] 验证配置是否正确
- [ ] 确保 `.env` 在 `.gitignore` 中

### 生产环境

- [ ] 使用强密码和密钥
- [ ] 启用HTTPS
- [ ] 配置CORS白名单
- [ ] 设置正确的 `NODE_ENV`
- [ ] 定期轮换密钥
- [ ] 加密敏感配置文件

---

## 相关资源

- [12-Factor App](https://12factor.net/)
- [Node.js Environment Variables](https://nodejs.org/en/docs/guides/getting-started-guide/)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
