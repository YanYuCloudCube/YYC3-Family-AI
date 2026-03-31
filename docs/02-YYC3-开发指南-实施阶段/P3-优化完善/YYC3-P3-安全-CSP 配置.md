# YYC3-P3-安全-CSP 配置

**版本**: v1.0.0  
**创建日期**: 2026-03-19  
**最后更新**: 2026-03-19  
**状态**: ✅ 稳定

---

## 📊 概述

内容安全策略 (Content Security Policy, CSP) 是一种安全机制，通过限制资源加载来源来防止:

- 🛡️ **XSS 攻击**: 跨站脚本攻击
- 🛡️ **数据注入**: 恶意代码注入
- 🛡️ **点击劫持**: 页面嵌套攻击
- 🛡️ **资源劫持**: 第三方资源篡改

---

## 🎯 目标

- 防止 XSS 攻击
- 限制资源加载来源
- 提升应用安全性
- 符合安全合规要求

---

## 📋 配置说明

### 1. 基本配置

在 `index.html` 的 `<head>` 中添加:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  connect-src 'self' https://api.yyc3.com wss://*.yyc3.com;
  worker-src 'self' blob:;
  frame-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
" />
```

### 2. 指令说明

| 指令 | 说明 | 配置值 |
|------|------|--------|
| `default-src` | 默认策略 | `'self'` |
| `script-src` | 脚本来源 | `'self' 'unsafe-inline' blob:` |
| `style-src` | 样式来源 | `'self' 'unsafe-inline'` |
| `font-src` | 字体来源 | `'self' fonts.gstatic.com` |
| `img-src` | 图片来源 | `'self' data: blob: https:` |
| `connect-src` | 网络连接 | `'self' api.yyc3.com` |
| `worker-src` | Web Worker | `'self' blob:` |
| `frame-src` | 框架来源 | `'self' blob:` |
| `object-src` | 插件对象 | `'none'` |
| `base-uri` | 基础 URL | `'self'` |
| `form-action` | 表单提交 | `'self'` |

### 3. 配置值说明

| 值 | 说明 |
|----|------|
| `'self'` | 仅允许同源资源 |
| `'unsafe-inline'` | 允许内联脚本/样式 |
| `'unsafe-eval'` | 允许 eval() 等动态代码 |
| `'none'` | 禁止所有来源 |
| `data:` | 允许 data URI 方案 |
| `blob:` | 允许 blob URL |
| `https:` | 允许所有 HTTPS 资源 |
| `https://example.com` | 允许指定域名 |

---

## 🔧 使用示例

### 开发环境配置

开发环境需要更宽松的策略:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self' *;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' *;
  style-src 'self' 'unsafe-inline' 'unsafe-hashes' *;
  connect-src 'self' * ws: wss:;
" />
```

### 生产环境配置

生产环境需要严格限制:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'sha256-abc123...';
  style-src 'self' 'sha256-def456...';
  connect-src 'self' https://api.yyc3.com;
  img-src 'self' https://cdn.yyc3.com;
  upgrade-insecure-requests;
  block-all-mixed-content;
" />
```

### 使用 Nonce

更安全的脚本加载方式:

```html
<script nonce="random-nonce-value">
  // 内联脚本
</script>
```

```html
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' 'nonce-random-nonce-value';
" />
```

---

## ⚠️ 注意事项

### 1. 避免的配置

```html
<!-- ❌ 不要这样做 -->
<meta http-equiv="Content-Security-Policy" content="
  default-src *;
  script-src * 'unsafe-inline' 'unsafe-eval';
  connect-src *;
" />

<!-- ✅ 正确做法 -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'sha256-hash';
  connect-src 'self' https://trusted-api.com;
" />
```

### 2. 内联脚本处理

**方式 1**: 使用 Hash

```html
<script>
  // 脚本内容
</script>

<!-- 计算 SHA256 Hash -->
<!-- sha256-abc123... -->

<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' 'sha256-abc123...';
" />
```

**方式 2**: 移到外部文件

```html
<script src="/js/app.js"></script>
```

### 3. 第三方资源

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="stylesheet">

<!-- CSP 配置 -->
<meta http-equiv="Content-Security-Policy" content="
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
" />

<!-- Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js"></script>

<!-- CSP 配置 -->
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' https://www.googletagmanager.com;
" />
```

---

## 🔍 违规处理

### 1. 报告收集

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  report-uri https://csp-report.yyc3.com/report;
  report-to csp-endpoint;
">
```

### 2. 报告格式

```json
{
  "csp-report": {
    "document-uri": "https://example.com",
    "violated-directive": "script-src 'self'",
    "original-policy": "default-src 'self'; script-src 'self'",
    "blocked-uri": "https://malicious.com/malware.js",
    "line-number": 42,
    "column-number": 12,
    "source-file": "https://example.com/app.js"
  }
}
```

### 3. 处理流程

```tsx
// 接收 CSP 报告
app.post('/csp-report', (req, res) => {
  const report = req.body['csp-report'];
  
  // 记录到日志
  console.error('CSP Violation:', report);
  
  // 上报到 Sentry
  captureMessage('CSP Violation', {
    level: 'warning',
    extra: report,
  });
  
  res.sendStatus(200);
});
```

---

## 📊 测试工具

### 1. 在线检测

- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Security Headers](https://securityheaders.com/)
- [CSP Is Awesome](https://csper.io/)

### 2. 浏览器 DevTools

Chrome DevTools Console 会显示 CSP 违规信息:

```
Refused to load the script 'https://malicious.com/malware.js' 
because it violates the following Content Security Policy directive: 
"script-src 'self'".
```

### 3. 报告模式

测试配置而不阻止资源:

```html
<meta http-equiv="Content-Security-Policy-Report-Only" content="
  default-src 'self';
  report-uri https://csp-report.yyc3.com/report;
" />
```

---

## 🎯 最佳实践

### 1. 渐进式部署

```bash
# 阶段 1: 仅报告
Content-Security-Policy-Report-Only: default-src 'self'

# 阶段 2: 收集违规
分析违规报告，调整策略

# 阶段 3: 强制执行
Content-Security-Policy: default-src 'self'
```

### 2. 最小权限原则

```html
<!-- ❌ 过于宽松 -->
<meta http-equiv="Content-Security-Policy" content="
  script-src * 'unsafe-inline';
">

<!-- ✅ 严格限制 -->
<meta http-equiv="Content-Security-Policy" content="
  script-src 'self' 'sha256-specific-hash';
">
```

### 3. 定期审查

- 每月审查 CSP 违规报告
- 更新第三方资源白名单
- 移除不再使用的资源
- 优化 Hash 和 Nonce

---

## 📚 相关文档

- [MDN CSP 文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP)
- [CSP Level 3 规范](https://www.w3.org/TR/CSP3/)
- [Sentry 集成](./YYC3-P3-监控-Sentry 集成.md)
- [安全加固指南](./YYC3-P3-安全 - 安全加固.md)

---

<div align="center">

> 「***YanYuCloudCube***」  
> 「***<admin@0379.email>***」  
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**维护团队**: YanYuCloudCube Team

</div>
