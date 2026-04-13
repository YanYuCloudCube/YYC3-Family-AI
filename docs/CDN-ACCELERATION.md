---
file: CDN-ACCELERATION.md
description: CDN 加速配置指南 - 多CDN支持、自动回退、环境变量控制
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-21
updated: 2026-04-09
status: stable
tags: cdn,acceleration,performance,configuration
category: devops
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元***
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# CDN 加速配置指南

## 概述

YYC3 Family AI 支持 CDN 加速功能，通过将常用依赖包（如 React、Zustand 等）从公共 CDN 加载，可以显著提升应用加载速度和用户体验。

## 功能特性

- ✅ 支持多个 CDN 提供商（jsDelivr、unpkg、cdnjs）
- ✅ 自动回退机制，CDN 加载失败时使用本地资源
- ✅ 环境变量控制，灵活启用/禁用
- ✅ 并行加载，优化首屏加载时间
- ✅ 支持自定义 CDN 基础 URL

## 快速开始

### 1. 配置环境变量

复制示例配置文件：

```bash
cp .env.cdn.example .env.cdn
```

编辑 `.env.cdn` 文件：

```env
USE_CDN=true
CDN_BASE_URL=https://cdn.jsdelivr.net/npm
```

### 2. 启用 CDN 模式

开发环境：

```bash
pnpm dev --mode cdn
```

生产构建：

```bash
pnpm build --mode cdn
```

### 3. 验证 CDN 加载

打开浏览器开发者工具（F12），在 Network 面板中查看：

- 应该看到从 `cdn.jsdelivr.net` 加载的脚本
- 检查 Console 中是否有 `[CDN]` 相关日志
- 确认应用正常运行

## CDN 提供商

### jsDelivr（推荐）

```env
CDN_BASE_URL=https://cdn.jsdelivr.net/npm
```

**优点**：
- 全球节点覆盖广
- 支持 npm 包直接访问
- 自动缓存优化
- 免费且稳定

### unpkg

```env
CDN_BASE_URL=https://unpkg.com
```

**优点**：
- 官方 npm CDN
- 简单易用
- 支持版本锁定

### cdnjs

```env
CDN_BASE_URL=https://cdnjs.cloudflare.com
```

**优点**：
- Cloudflare 支持
- 高可用性
- 全球加速

## 支持的包

当前支持通过 CDN 加载的包：

| 包名 | 版本 | 用途 |
|------|------|------|
| react | 18.3.1 | React 核心库 |
| react-dom | 18.3.1 | React DOM 渲染 |
| zustand | 5.0.2 | 状态管理 |

## 高级配置

### 自定义 CDN 包版本

在 `.env.cdn` 中修改版本号：

```env
CDN_REACT_VERSION=18.3.1
CDN_REACT_DOM_VERSION=18.3.1
CDN_ZUSTAND_VERSION=5.0.2
```

**注意**：版本号必须与 `package.json` 中的依赖版本匹配。

### 回退机制

当 CDN 加载失败时，系统会自动回退到本地资源：

```env
CDN_FALLBACK=true
```

### 缓存配置

配置 CDN 缓存策略：

```env
CDN_CACHE_TTL=3600
CDN_USE_CACHE=true
```

## 性能优化

### 1. 预连接

在 `index.html` 中已配置：

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
```

### 2. DNS 预取

```html
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
```

### 3. 并行加载

CDN 脚本加载器会并行加载所有配置的包：

```javascript
Promise.all(promises).catch(err => {
  console.error('[CDN] Failed to load packages:', err);
});
```

## 故障排查

### CDN 加载失败

**症状**：应用无法加载，控制台显示 CDN 错误

**解决方案**：
1. 检查网络连接
2. 确认 CDN URL 正确
3. 尝试切换 CDN 提供商
4. 检查浏览器控制台错误信息

### 版本不匹配

**症状**：运行时错误，提示 React 版本不匹配

**解决方案**：
1. 检查 `.env.cdn` 中的版本号
2. 确认与 `package.json` 中的版本一致
3. 更新版本号后重新构建

### CSP 错误

**症状**：控制台显示 Content Security Policy 错误

**解决方案**：
1. 在 `index.html` 中更新 CSP 配置
2. 添加 CDN 域名到 `script-src` 白名单

## 最佳实践

### 1. 生产环境使用 CDN

```env
# .env.production
USE_CDN=true
```

### 2. 开发环境禁用 CDN

```env
# .env.development
USE_CDN=false
```

### 3. 监控 CDN 性能

使用浏览器开发者工具监控：
- 加载时间
- 缓存命中率
- 错误率

### 4. 定期更新版本

保持 CDN 包版本与项目依赖同步：

```bash
# 检查依赖版本
pnpm list react react-dom zustand

# 更新 .env.cdn 中的版本号
```

## 安全考虑

### 1. 使用 HTTPS

始终使用 HTTPS CDN URL：

```env
CDN_BASE_URL=https://cdn.jsdelivr.net/npm
```

### 2. 验证完整性

考虑使用 SRI（Subresource Integrity）验证脚本完整性：

```html
<script
  src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js"
  integrity="sha384-..."
  crossorigin="anonymous">
</script>
```

### 3. 限制域名

在 CSP 中明确允许的 CDN 域名：

```html
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
" />
```

## 常见问题

**Q: CDN 加速能提升多少性能？**

A: 根据网络环境和地理位置，通常可以提升 30-50% 的首屏加载时间。

**Q: CDN 是否支持离线使用？**

A: 不支持。离线使用需要禁用 CDN 功能。

**Q: 如何测试 CDN 效果？**

A: 使用 Chrome DevTools 的 Network 面板对比启用/禁用 CDN 的加载时间。

**Q: CDN 是否影响开发体验？**

A: 不影响。开发环境可以禁用 CDN，生产环境启用。

## 技术支持

如有问题，请联系：
- 邮箱：admin@0379.email
- 项目地址：https://github.com/YYC3-Family-AI

## 更新日志

### v1.0.0 (2026-04-01)
- 初始版本
- 支持 jsDelivr、unpkg、cdnjs
- 自动回退机制
- 环境变量控制