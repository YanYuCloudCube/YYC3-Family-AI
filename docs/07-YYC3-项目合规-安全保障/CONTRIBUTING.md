---
file: CONTRIBUTING.md
description: YYC³ Family AI 贡献指南，包含如何参与项目、代码规范、提交规范、开发流程等
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-30
updated: 2026-03-30
status: stable
tags: contributing,guide,open-source,zh-CN
category: guide
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

# 🤝 贡献指南

感谢您考虑为 YYC³ Family AI 项目做出贡献！

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [问题反馈](#问题反馈)

---

## 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们承诺参与我们的项目和社区将使每个人都能获得无骚扰的体验，无论年龄、体型、残疾、种族、性别认同和表达、经验水平、教育程度、社会经济地位、国籍、外貌、种族、宗教或性取向如何。

### 我们的标准

**积极行为包括**：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

**不可接受的行为包括**：

- 使用性化的语言或图像，以及不受欢迎的性关注或性骚扰
- 捣乱、侮辱/贬损评论以及人身或政治攻击
- 公开或私下骚扰
- 未经明确许可，发布他人的私人信息，例如物理地址或电子地址
- 在专业环境中可能被合理认为不适当的其他行为

---

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请：

1. 检查 [Issues](https://github.com/YYC3/YYC3-Family-AI/issues) 中是否已有相同问题
2. 如果没有，创建新的 Issue，包含：
   - Bug 描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 截图（如果适用）
   - 环境信息（操作系统、浏览器版本等）

### 提出新功能

如果您有新功能的想法：

1. 先在 [Discussions](https://github.com/YYC3/YYC3-Family-AI/discussions) 中讨论
2. 获得社区认可后，创建 Feature Request Issue
3. 等待维护者审核和批准

### 提交代码

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: 添加某功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 开发流程

### 环境准备

#### 系统要求

- **Node.js**: v20.x 或更高版本
- **npm**: v10.x 或更高版本
- **Git**: v2.x 或更高版本

#### 本地开发

```bash
# 1. Clone 仓库
git clone https://github.com/YYC3/YYC3-Family-AI.git
cd YYC3-Family-AI

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 运行测试
npm test

# 5. 构建生产版本
npm run build
```

### 开发规范

#### 分支命名

- `feature/*` - 新功能开发
- `fix/*` - Bug 修复
- `refactor/*` - 代码重构
- `docs/*` - 文档更新
- `test/*` - 测试相关
- `chore/*` - 其他杂项

示例：
```bash
feature/ai-assistant
fix/login-error
refactor/state-management
docs/api-documentation
```

#### 代码风格

本项目使用以下工具确保代码质量：

- **ESLint**: JavaScript/TypeScript 代码检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **Husky**: Git Hooks

运行代码检查：
```bash
# 检查代码风格
npm run lint

# 自动修复代码风格问题
npm run lint:fix

# 类型检查
npm run type-check
```

---

## 代码规范

### 文件标头规范

所有代码文件必须包含标准标头：

```typescript
/**
 * @file 文件路径/文件名
 * @description 文件功能描述
 * @author 作者姓名 <邮箱>
 * @version v1.0.0
 * @created 2026-03-30
 * @updated 2026-03-30
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags 标签1,标签2,标签3
 */
```

### TypeScript 规范

#### 命名规范

```typescript
// 类名：PascalCase
class UserService {}

// 接口名：PascalCase，以 I 开头（可选）
interface IUserService {}

// 函数名：camelCase
function getUserById() {}

// 变量名：camelCase
const userName = 'John';

// 常量名：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// 文件名：kebab-case
// user-service.ts
```

#### 类型定义

```typescript
// 优先使用 interface
interface User {
  id: string;
  name: string;
  email: string;
}

// 复杂类型使用 type
type UserStatus = 'active' | 'inactive' | 'suspended';
```

#### 注释规范

```typescript
/**
 * 获取用户信息
 * @param userId 用户ID
 * @returns 用户信息
 * @throws {UserNotFoundError} 用户不存在时抛出
 * @example
 * const user = await getUserById('123');
 */
async function getUserById(userId: string): Promise<User> {
  // 实现...
}
```

### React 组件规范

```typescript
/**
 * @file user-card.tsx
 * @description 用户卡片组件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-30
 * @updated 2026-03-30
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags react,component,user,ui
 */

import React from 'react';

interface UserCardProps {
  name: string;
  email: string;
  avatar?: string;
}

export const UserCard: React.FC<UserCardProps> = ({ name, email, avatar }) => {
  return (
    <div className="user-card">
      {avatar && <img src={avatar} alt={name} />}
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
};
```

---

## 提交规范

### Commit Message 格式

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat: 添加用户登录功能 |
| `fix` | Bug 修复 | fix: 修复登录超时问题 |
| `docs` | 文档更新 | docs: 更新 README |
| `style` | 代码格式（不影响功能） | style: 格式化代码 |
| `refactor` | 代码重构 | refactor: 重构状态管理 |
| `test` | 测试相关 | test: 添加单元测试 |
| `chore` | 构建/工具相关 | chore: 更新依赖 |
| `perf` | 性能优化 | perf: 优化渲染性能 |

### Scope 范围

常见 Scope：

- `core` - 核心模块
- `ui` - UI 组件
- `api` - API 相关
- `auth` - 认证模块
- `db` - 数据库
- `config` - 配置相关

### 示例

```bash
# 新功能
feat(auth): 添加OAuth2认证

# Bug修复
fix(ui): 修复移动端布局问题

# 文档更新
docs(api): 更新API文档

# 破坏性变更
feat(api)!: 重构API接口

BREAKING CHANGE: API v1接口已废弃，请迁移到v2
```

---

## Pull Request 流程

### PR 检查清单

在提交 PR 之前，请确保：

- [ ] 代码符合项目的代码规范
- [ ] 所有测试通过 (`npm test`)
- [ ] 新功能有对应的测试用例
- [ ] 文档已更新（如果需要）
- [ ] Commit Message 符合规范
- [ ] 没有合并冲突

### PR 标题格式

```
<type>(<scope>): <description>
```

示例：
```
feat(auth): 添加JWT token刷新机制
fix(ui): 修复移动端侧边栏滚动问题
docs(readme): 更新安装说明
```

### PR 描述模板

```markdown
## 变更类型
- [ ] 新功能 (feat)
- [ ] Bug修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 测试相关 (test)
- [ ] 其他 (chore)

## 变更说明
详细描述本次变更的内容和原因

## 相关Issue
Closes #123

## 测试情况
描述如何测试这些变更

## 截图
如果适用，添加截图展示变更效果

## 检查清单
- [ ] 代码符合规范
- [ ] 测试通过
- [ ] 文档已更新
```

### Code Review

- 所有 PR 都需要至少一位维护者审核
- 审核者会在 2-3 个工作日内回复
- 请及时响应审核意见并修改

---

## 问题反馈

### Bug 报告模板

```markdown
## Bug 描述
清晰简洁地描述这个Bug

## 复现步骤
1. 进入 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

## 预期行为
描述你期望发生的事情

## 实际行为
描述实际发生的事情

## 截图
如果适用，添加截图帮助解释问题

## 环境信息
- 操作系统: [例如 macOS 14.0]
- 浏览器: [例如 Chrome 120]
- Node版本: [例如 v20.10.0]
- 项目版本: [例如 v1.2.0]

## 其他信息
添加其他有关此问题的信息
```

### Feature Request 模板

```markdown
## 功能描述
清晰简洁地描述你想要的功能

## 问题背景
描述这个功能要解决什么问题

## 建议方案
描述你建议的解决方案

## 替代方案
描述你考虑过的其他解决方案

## 其他信息
添加其他有关功能建议的信息
```

---

## 许可证

通过贡献代码，您同意您的贡献将根据项目的 [MIT License](../LICENSE) 进行许可。

---

## 联系方式

- **维护团队**: YanYuCloudCube Team
- **邮箱**: <admin@0379.email>
- **GitHub**: https://github.com/YYC3/YYC3-Family-AI

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
