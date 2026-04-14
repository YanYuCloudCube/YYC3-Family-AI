# 🔒 YYC³ Security Fix Report — XSS Vulnerability Remediation

> **修复日期**: 2026-04-14
> **严重等级**: 🔴 P0-Critical (必须修复)
> **影响范围**: 15 个源文件
> **修复工具**: DOMPurify + Sanitizer.ts

---

## 📊 执行摘要

| 指标 | 数值 |
|------|------|
| 总计受影响文件 | **15** |
| 使用 `innerHTML` | **8** |
| 使用 `dangerouslySetInnerHTML` | **5** |
| 使用 `eval()` | **2** (仅在测试代码) |
| 风险等级 | **High (DOM XSS)** |
| 预估修复时间 | **2-3 小时** |

---

## 🎯 修复策略

### 核心原则

1. **零信任**: 所有动态 HTML 内容必须经过消毒
2. **白名单**: 仅允许安全的 HTML 标签和属性
3. **默认安全**: 新代码必须使用 Sanitizer.ts 工具函数
4. **渐进迁移**: 优先修复用户可输入的场景

### 技术方案

```typescript
// ❌ 危险写法 (修复前)
element.innerHTML = userInput
// 或
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 安全写法 (修复后)
import { sanitizeHTML, createSafeHTML, useSafeHTML } from './services/Sanitizer'

// 方案1: 基础消毒
element.innerHTML = sanitizeHTML(userInput)

// 方案2: React 组件内
<div dangerouslySetInnerHTML={createSafeHTML(userInput)} />

// 方案3: React Hook (推荐, 自动 memoize)
function MyComponent({ content }) {
  const safeHTML = useSafeHTML(content)
  return <div dangerouslySetInnerHTML={safeHTML} />
}
```

---

## 📝 文件级修复清单

### 🔴 高风险文件 (用户输入可达)

#### 1. [chart.tsx](src/app/components/ui/chart.tsx) ⚠️ **P0**

**位置**: Recharts 图表渲染组件  
**风险**: 如果图表数据来自用户输入,可能导致 XSS  
**修复方案**:
```typescript
// 修复前
<div dangerouslySetInnerHTML={{ __html: tooltipContent }} />

// 修复后
import { createSafeHTML } from '../ide/services/Sanitizer'
<div dangerouslySetInnerHTML={createSafeHTML(tooltipContent)} />
```

**状态**: ⏳ 待修复  
**负责人**: @yyc3-security-team  
**预计工时**: 30 分钟

---

#### 2. [DocumentEditor.tsx](src/app/components/ide/DocumentEditor.tsx) ⚠️ **P0**

**位置**: 富文本编辑器组件  
**风险**: 用户直接编辑内容,高风险 XSS 向量  
**修复方案**:
```typescript
// TipTap 编辑器通常自行处理消毒,
// 但需确认 onPaste 和外部 HTML 插入已消毒

import { sanitizeHTML } from './services/Sanitizer'

// 在内容保存/显示前强制消毒
const sanitizedContent = sanitizeHTML(editorContent)
```

**状态**: ⏳ 待审查 (TipTap 可能已有内置防护)  
**负责人**: @yyc3-security-team  
**预计工时**: 45 分钟

---

#### 3. [PreviewEngine.ts](src/app/components/ide/PreviewEngine.ts)) ⚠️ **P0**

**位置**: 实时代码预览引擎  
**风险**: 用户代码预览可能包含恶意 HTML  
**修复方案**:
```typescript
// iframe sandbox 已提供一定防护,
// 但仍需消毒嵌入的外部内容

import { sanitizeHTML, isSafeURL } from '../services/Sanitizer'

// 在设置 iframe srcdoc 前
const safePreview = sanitizeHTML(codeOutput)
iframe.srcdoc = safePreview
```

**状态**: ⏳ 待修复  
**负责人**: @yyc3-security-team  
**预计工时**: 1 小时

---

#### 4. [ConsoleManager.ts](src/app/components/ide/preview/ConsoleManager.ts)) ⚠️ **P0**

**位置**: 控制台输出管理器  
**风险**: console.log 输出可能被恶意代码利用  
**修复方案**:
```typescript
import { escapeHTML } from '../../services/Sanitizer'

// 转义所有控制台输出
const safeOutput = escapeHTML(logMessage)
element.innerHTML = safeOutput  // 现在安全了
```

**状态**: ⏳ 待修复  
**负责人**: @yyc3-security-team  
**预计工时**: 20 分钟

---

### 🟡 中等风险文件 (受限场景)

#### 5. [StorageMonitor.ts](src/app/components/ide/services/StorageMonitor.ts))

**位置**: 存储监控服务  
**风险**: 低 (仅显示内部数据)  
**建议**: 添加防御性消毒  
**预计工时**: 15 分钟

#### 6. [DataImporter.ts](src/app/components/ide/services/DataImporter.ts)

**位置**: 数据导入服务  
**风险**: 中 (处理用户上传文件)  
**建议**: 强制消毒导入的 HTML 内容  
**预计工时**: 30 分钟

#### 7. [CodeValidator.optimized.ts](src/app/components/ide/CodeValidator.optimized.ts)

**位置**: 代码验证器优化版  
**风险**: 低 (主要用于语法高亮)  
**建议**: 确认无用户输入注入点  
**预计工时**: 20 分钟

---

### 🟢 低风险文件 (测试/内部使用)

#### 8-15. 测试文件和示例文件

以下文件主要在测试环境或示例中使用,风险较低:

- [SecurityScanner.test.ts](src/__tests__/SecurityScanner.test.ts) - 测试用例
- [ErrorAnalyzer.test.ts](src/__tests__/ErrorAnalyzer.test.ts) - 测试用例
- [TopBar.test.tsx](src/__tests__/TopBar.test.tsx) - 测试用例
- [LeftPanel.test.tsx](src/__tests__/LeftPanel.test.tsx) - 测试用例
- [ReviewerAgent.ts](src/agent/agents/ReviewerAgent.ts) - Agent 内部逻辑
- [HelloWorldPlugin.ts](src/app/examples/HelloWorldPlugin.ts) - 示例插件
- [advanced-editor-config.ts](src/imports/pasted_text/advanced-editor-config.ts) - 配置文件

**建议**: 
- 测试文件: 保持现有代码 (测试需要验证 XSS 场景)
- 示例文件: 添加注释说明安全性注意事项
- 内部模块: 审查并添加防御性消毒

**预计总工时**: 1 小时

---

## ✅ 修复验证清单

### 自动化测试

- [ ] 创建 `Sanitizer.test.ts` 单元测试 (覆盖所有公开函数)
- [ ] 创建 `XSSIntegration.test.ts` 集成测试 (模拟真实攻击向量)
- [ ] 更新 CI/CD 流水线,添加 XSS 扫描步骤

### 手动验证

- [ ] 使用 [XSS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatheets/Cross_Site Scripting Prevention Cheat Sheet.html) 测试每个修复点
- [ ] 使用浏览器开发者工具验证 DOM 结构
- [ ] 使用 [DOMPurify 在线测试工具](https://pubwww.dompurify.org/) 验证配置

### 代码审查

- [ ] 所有修复通过 Peer Review
- [ ] 安全团队最终签字确认
- [ ] 更新 SECURITY.md 文档,记录此次修复

---

## 📈 修复后目标指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| innerHTML 使用数 | 8 | **0** (全部替换) |
| dangerouslySetInnerHTML 使用数 | 5 | **5** (全部使用 Sanitizer)** |
| eval() 使用数 | 2 | **0** (移除或沙箱化) |
| XSS 攻击面 | 15 文件 | **0 文件** (全部加固) |

---

## 🛠️ 快速修复命令

```bash
# 1. 安装依赖 (已完成)
pnpm add dompurify

# 2. 运行测试
pnpm test -- --grep="Sanitizer"

# 3. 手动验证关键文件
grep -r "innerHTML\|dangerouslySetInnerHTML" src/ --include="*.ts" --include="*.tsx"

# 4. 构建检查
pnpm build && pnpm typecheck
```

---

## 📚 参考资源

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross Site Scripting Prevention Cheat Sheet.html)
- [DOMPurify Documentation](https://pubwww.dompurify.com/)
- [React Security Best Practices](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [MDN: innerHTML Security](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#security_considerations)

---

## 👥 责任分工

| 角色 | 职责 | 成员 |
|------|------|------|
| **安全工程师** | 实施修复,编写测试 | @security-lead |
| **代码审查员** | Review 所有更改 | @tech-lead |
| **QA 工程师** | 验证修复有效性 | @qa-team |
| **文档更新** | 更新安全文档 | @docs-team |

---

**报告版本**: v1.0.0  
**下次复审**: 2026-05-14 (一个月后)  
**相关 Issue**: #SEC-2026-04-XSS-001 (待创建)
