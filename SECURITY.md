# 🔒 YYC³ Family-AI 安全策略

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*

---

## 📋 文档信息

| 属性 | 值 |
|------|-----|
| **文档名称** | YYC³ Family-AI 安全策略 |
| **版本** | v1.0.0 |
| **更新日期** | 2026-04-04 |
| **适用范围** | YYC3-Family-AI 开源项目 |
| **项目定位** | 开源本地优先开发工具 |

---

## 🎯 一、安全理念：本地优先，隐私至上

YYC³ Family-AI 是一个**完全本地运行**的开源工具，我们的安全设计围绕以下核心原则：

```
┌─────────────────────────────────────────────────────────────┐
│                 YYC³ 安全设计哲学                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔒 数据主权                                                │
│  ├─ 所有数据存储在用户本地设备                             │
│  ├─ 无需云端账户或认证                                     │
│  ├─ 无数据上传至第三方服务器                               │
│  └─ 用户完全掌控自己的数据                                 │
│                                                             │
│  🛡️ 隐私保护                                                │
│  ├- 零追踪: 无用户行为分析                                 │
│  ├- 零收集: 无个人信息收集                                 │
│  ├- 零广告: 无任何形式的广告                               │
│  └- 零依赖: 无第三方 SDK 追踪                              │
│                                                             │
│  🔐 加密存储                                                │
│  ├- API 密钥本地加密存储                                   │
│  ├- 聊天记录可选加密                                       │
│  ├- 敏感数据自动脱敏                                       │
│  └- 使用 AES-256-GCM 加密算法                             │
│                                                             │
│  📖 透明开源                                                │
│  ├- 所有代码公开可审计                                     │
│  ├- 安全实现可验证                                         │
│  ├- 社区共同审查                                           │
│  └- 快速响应安全问题                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 二、安全架构总览

### 2.1 本地存储安全模型

```
┌─────────────────────────────────────────────────────────────┐
│                    浏览器沙箱环境                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                  应用层 (React)                     │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        │                                  │
│  ┌─────────────────────▼───────────────────────────────┐ │
│  │              加密层 (CryptoService)                │ │
│  │   • AES-256-GCM 加密/解密                          │ │
│  │   • PBKDF2 密钥派生                                │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        │                                  │
│  ┌─────────────────────▼───────────────────────────────┐ │
│  │              存储层 (Browser Storage)             │ │
│  │   • IndexedDB (文件/历史/大数据)                   │ │
│  │   • localStorage (配置/设置/小数据)               │ │
│  │   • sessionStorage (临时/API Keys)                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                             │
│  ⚠️ 重要: 所有数据均在浏览器沙箱内，无法被外部访问      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据分类与保护级别

| 数据类型 | 存储位置 | 加密方式 | 保留策略 | 用户控制 |
|----------|----------|----------|----------|----------|
| **API 密钥** | sessionStorage | AES-256 | 会话结束清除 | ✅ 可删除 |
| **用户配置** | localStorage | 明文 | 永久保留 | ✅ 可导出/删除 |
| **文件内容** | IndexedDB | 可选加密 | 永久保留 | ✅ 可删除 |
| **聊天历史** | IndexedDB | 可选加密 | 永久保留 | ✅ 可删除 |
| **主题设置** | localStorage | 明文 | 永久保留 | ✅ 可重置 |
| **面板布局** | localStorage | 明文 | 永久保留 | ✅ 可重置 |

---

## 🔐 三、已实施的安全措施

### 3.1 数据加密服务

**文件**: [CryptoService.ts](../src/app/components/CryptoService.ts)

```typescript
// 已实现的加密功能
const cryptoService = {
  // 加密算法
  algorithm: 'AES-256-GCM',
  
  // 密钥派生
  keyDerivation: 'PBKDF2',
  iterations: 100000,
  
  // 支持的操作
  encrypt: async (data: string, password: string) => string,
  decrypt: async (encryptedData: string, password: string) => string,
  
  // 哈希函数
  hash: async (data: string): Promise<string>,
  
  // 随机数生成
  generateRandomKey: (): string,
  generateIV: (): Uint8Array
};
```

### 3.2 XSS 防护

**技术**: DOMPurify

```typescript
// 所有用户输入都经过消毒处理
import DOMPurify from 'dompurify';

// 在渲染前清理 HTML 内容
const cleanHTML = DOMPurify.sanitize(dirtyHTML, {
  ALLOWED_TAGS: ['b', 'i', 'u', 'code', 'pre'],
  ALLOWED_ATTR: []
});
```

**防护范围**:
- ✅ AI 响应内容渲染
- ✅ Markdown 转换输出
- ✅ 富文本编辑器内容
- ✅ 用户输入显示

### 3.3 API 密钥管理

```typescript
// API 密钥安全策略
const apiKeyPolicy = {
  storage: {
    location: 'sessionStorage',  // 会话结束时自动清除
    encryption: true,            // 存储前加密
    masking: true                 // 显示时脱敏 (****1234)
  },
  
  display: {
    maskPattern: /^(.{4}).*(.{4})$/,  // 显示首尾4位
    copyProtection: true,               // 禁止复制完整密钥
    autoHide: true                      // 5秒后自动隐藏
  },
  
  transmission: {
    onlyToLLMProviders: true,           // 仅发送至 LLM Provider
    noLogging: true,                    // 不记录完整密钥
    noLocalStorage: true                // 不持久化到 localStorage
  }
};
```

### 3.4 Content Security Policy (CSP)

**当前状态**: ⚠️ 待配置 (P1 任务)

**推荐配置**:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline' 'unsafe-eval';
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;
               img-src 'self' data: https:;
               connect-src 'self' https://api.openai.com https://api.zhipuai.cn;">
```

---

## 🚨 四、安全最佳实践（用户指南）

### 4.1 保护您的数据

#### ✅ 推荐做法

| 做法 | 说明 |
|------|------|
| **使用强密码** | 如启用聊天记录加密，使用复杂密码 |
| **定期备份数据** | 使用设置中的"导入/导出"功能备份配置 |
| **及时清除敏感数据** | 关闭浏览器后 sessionStorage 自动清除 |
| **保持浏览器更新** | 使用最新版浏览器获得最佳安全保护 |
| **使用隐私模式** | 敏感操作时可使用浏览器无痕模式 |

#### ❌ 应避免的行为

| 行为 | 风险 |
|------|------|
| 在公共电脑上保存 API 密钥 | 密钥可能泄露 |
| 分享包含个人数据的配置文件 | 隐私泄露风险 |
| 禁用浏览器安全设置 | 降低整体安全性 |
| 使用来源不明的自定义插件 | 可能包含恶意代码 |

### 4.2 API 密钥安全

```
┌─────────────────────────────────────────────────────────────┐
│                  API 密钥安全指南                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ 密钥获取                                              │
│     • 仅从官方渠道获取 API Key                            │
│     • 为 YYC³ 创建专用的 API Key                           │
│     • 设置适当的使用限额和权限                             │
│                                                             │
│  2️⃣ 密钥存储                                              │
│     • YYC³ 默认存储在 sessionStorage (会话级)             │
│     • 关闭浏览器后自动清除                                 │
│     • 不会上传至任何服务器                                 │
│                                                             │
│  3️⃣ 密钥显示                                              │
│     • UI 中仅显示脱敏后的密钥 (****1234)                  │
│     • 复制时仅复制完整密钥 (需确认)                       │
│     • 5秒后自动隐藏                                       │
│                                                             │
│  4️⃣ 密钥轮换                                              │
│     • 定期更换 API Key                                      │
│     • 如怀疑泄露，立即在 Provider 后台撤销                 │
│     • 在 YYC³ 设置中更新为新密钥                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 五、报告安全问题

### 5.1 安全漏洞报告流程

如果您发现安全漏洞，请按照以下步骤报告：

#### Step 1: 不要公开披露

⚠️ **请勿在 GitHub Issues 公开讨论安全漏洞**

#### Step 2: 私密报告

通过以下方式私密报告：
- **Email**: security@0379.email
- **GitHub Security Advisories**: [报告漏洞](https://github.com/YanYuCloudCube/YYC3-Family-AI/security/advisories/new)

#### Step 3: 报告内容请包含

| 信息项 | 说明 |
|--------|------|
| **漏洞描述** | 清晰描述漏洞及其影响 |
| **复现步骤** | 详细的重现步骤 |
| **影响范围** | 受影响的版本和功能 |
| **建议修复** | 如有，提供修复建议 |
| **联系方式** | 用于跟进的联系方式 |

#### Step 4: 响应时间承诺

| 时间 | 动作 |
|------|------|
| 24小时内 | 确认收到报告 |
| 48小时内 | 初步评估和分类 |
| 7天内 | 提供修复方案或时间表 |
| 修复后 | 致谢并可选公开披露 |

### 5.2 安全奖励

虽然我们目前没有正式的 Bug Bounty 计划，但我们会：

- 🏆 在安全公告中致谢报告者
- 📢 可选的公开致谢（经您同意）
- 🎖️ 贡献者名单收录

---

## 📋 六、安全检查清单

### 6.1 开发者安全检查清单

在提交代码前，请确保：

- [ ] 不包含硬编码的密钥或凭据
- [ ] 用户输入经过适当的消毒和验证
- [ ] 不使用 `eval()` 或其他危险函数
- [ ] 不引入有已知漏洞的依赖
- [ ] 敏感操作需要用户明确确认
- [ ] 错误信息不泄露系统内部细节
- [ ] 外部链接使用 `rel="noopener noreferrer"`

### 6.2 依赖安全

**工具**: pnpm overrides + npm audit

```jsonc
// package.json - 已配置的安全覆盖
"pnpm": {
  "overrides": {
    "ws": ">=8.17.1",        // WebSocket 安全版本
    "tar-fs": ">=2.1.4",     // 文件解压安全
    "tmp": ">=0.2.3",         // 临时文件安全
    "dompurify": ">=3.3.2"    // XSS 防护
  }
}
```

**定期运行**:
```bash
# 检查依赖漏洞
pnpm audit

# 更新依赖
pnpm update
```

---

## 🔄 七、安全更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-04-04 | v1.0.0 | 初始安全策略文档发布 |

---

## 📚 八、相关资源

| 资源 | 链接 |
|------|------|
| OWASP Top 10 | https://owasp.org/www-project-top-ten/ |
| MDN Web Security | https://developer.mozilla.org/zh-CN/docs/Web/Security |
| CSP 指南 | https://content-security-policy.com/ |
| DOMPurify 文档 | https://github.com/cure53/DOMPurify |
| Web Crypto API | https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Crypto_API |

---

## 🙏 九、联系我们

**安全相关问题**: security@0379.email

**一般问题**: [GitHub Issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues)

**社区讨论**: [GitHub Discussions](https://github.com/YanYuCloudCube/YYC3-Family-AI/discussions)

---

**文档版本**: v1.0.0
**最后更新**: 2026-04-04
**维护者**: YanYuCloudCube Team
**许可证**: MIT
