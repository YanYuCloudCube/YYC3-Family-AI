# 🤝 YYC³ Family AI 贡献指南

> 感谢您考虑为 YYC³ Family AI 做出贡献！🎉

我们欢迎任何形式的贡献，包括但不限于：
- 🔧 **Bug 修复**
- ✨ **新功能开发**
- 📝 **文档改进**
- 🎨 **UI/UX 优化**
- 🧪 **测试用例补充**
- 🌍 **国际化翻译**

---

## 📋 目录

- [行为准则](#-行为准则)
- [如何贡献](#-如何贡献)
- [开发流程](#-开发流程)
- [代码规范](#-代码规范)
- [提交信息规范](#-提交信息规范)
- [Pull Request 流程](#-pull-request-流程)
- [Issue 规范](#-issue-规范)
- [测试要求](#-测试要求)

---

## 🤝 行为准则

参与本项目即表示您同意遵守我们的行为准则：

1. **尊重他人** - 保持专业和友善的态度
2. **包容开放** - 欢迎不同背景的贡献者
3. **建设性反馈** - 提供有建设性的意见和建议
4. **专注技术** - 讨论聚焦于项目本身
5. **保护隐私** - 不泄露用户敏感信息

---

## 🚀 如何贡献

### 方式一：报告 Bug

1. 确认 Bug 未被报告过（搜索 [Issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues)）
2. 创建新 Issue，使用 `Bug Report` 模板
3. 提供详细的复现步骤和环境信息

### 方式二：建议新功能

1. 在 [Discussions](https://github.com/YanYuCloudCube/YYC3-Family-AI/discussions) 发起讨论
2. 获得社区反馈后，创建 Feature Request Issue
3. 等待维护者确认后开始实现

### 方式三：直接贡献代码

```bash
# 1. Fork 项目
git clone https://github.com/YanYuCloudCube/YYC3-Family-AI.git
cd YYC3-Family-AI

# 2. 创建功能分支
git checkout -b feature/your-feature-name

# 3. 开发并测试
pnpm install
pnpm dev          # 开发模式
pnpm test         # 运行测试

# 4. 提交代码
git add .
git commit -m "feat: add new feature"

# 5. 推送到你的 Fork
git push origin feature/your-feature-name

# 6. 创建 Pull Request
```

---

## 💻 开发流程

### 1. 环境准备

```bash
# 克隆仓库
git clone https://github.com/YanYuCloudCube/YYC3-Family-AI.git
cd YYC3-Family-AI

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 2. 分支策略

| 分支类型 | 命名示例 | 用途 |
|----------|----------|------|
| 功能分支 | `feature/add-dark-mode` | 新功能 |
| 修复分支 | `fix/login-bug` | Bug 修复 |
| 文档分支 | `docs/update-readme` | 文档更新 |
| 重构分支 | `refactor/optimize-store` | 代码重构 |
| 测试分支 | `test/add-unit-tests` | 测试补充 |

### 3. 开发前检查

- [ ] 查看 [现有 Issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues) 避免重复工作
- [ ] 阅读 [README.md](./README.md) 了解项目结构
- [ ] 确认符合[代码规范](#-代码规范)

---

## 📐 代码规范

### TypeScript / JavaScript

```typescript
// ✅ 正确：使用有意义的变量名
const userAuthToken = await authService.getToken();

// ❌ 错误：缩写或不清晰的命名
const t = await auth.get();

// ✅ 正确：使用类型注解
interface UserConfig {
  name: string;
  preferences: Preferences;
}

// ✅ 正确：函数注释
/**
 * 获取用户配置
 * @param userId 用户ID
 * @returns 用户配置对象
 */
async function getUserConfig(userId: string): Promise<UserConfig> {
  // ...
}
```

### React 组件

```tsx
// ✅ 正确：使用函数组件 + Hooks
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
```

### 文件命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 组件 | PascalCase | `UserPanel.tsx` |
| 工具函数 | camelCase | `formatDate.ts` |
| 常量 | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| 类型定义 | PascalCase | `UserTypes.ts` |
| 样式文件 | kebab-case | `button.module.css` |

---

## 📝 提交信息规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 列表

| Type | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(terminal): add WebSocket reconnection` |
| `fix` | Bug 修复 | `fix(auth): resolve token refresh issue` |
| `docs` | 文档更新 | `docs(readme): update installation guide` |
| `style` | 代码格式化 | `style(lint): fix ESLint warnings` |
| `refactor` | 代码重构 | `refactor(store): simplify state management` |
| `perf` | 性能优化 | `perf(build): reduce bundle size by 20%` |
| `test` | 测试相关 | `test(llm): add unit tests for provider switching` |
| `chore` | 构建/工具 | `chore(deps): update dependencies` |
| `ci` | CI/CD 配置 | `ci(workflow): add Codecov integration` |

### 示例

```bash
# ✅ 正确的提交信息
feat(ai): add Anthropic Claude provider support

- Integrate Claude API with streaming support
- Add model selection (Claude 3 Opus/Sonnet/Haiku)
- Implement cost estimation for Claude models
- Update documentation with Claude configuration guide

Closes #123

# ❌ 错误的提交信息
fix bug
update stuff
wip
```

---

## 🔀 Pull Request 流程

### 1. 创建 PR 前的检查清单

- [ ] 代码通过所有测试 (`pnpm test`)
- [ ] 代码通过 lint 检查 (`pnpm lint`)
- [ ] TypeScript 类型检查通过 (`pnpm typecheck`)
- [ ] 新增功能包含对应的测试用例
- [ ] 文档已更新（如适用）
- [ ] Commit 信息符合规范

### 2. PR 标题格式

```
<type>: 简短描述 (#Issue编号)

例如:
feat: 添加终端多会话支持 (#123)
fix: 修复 Ollama 连接超时问题 (#124)
docs: 更新 API 使用文档 (#125)
```

### 3. PR 描述模板

```markdown
## 📝 变更说明
<!-- 简要描述这个 PR 的内容 -->

## 🔗 关联 Issue
<!-- 关联的 Issue 编号 -->
Closes #(issue number)

## 🛠️ 变更类型
<!-- 选择适用的类型 -->
- [ ] Bug 修复
- [ ] 新功能
- [ ] Breaking Change
- [ ] 文档更新
- [ ] 性能优化
- [ ] 代码重构
- [ ] 测试补充

## 📸 截图/演示
<!-- 如果涉及 UI 变更，请提供截图或录屏 -->

## ✅ 测试清单
<!-- 说明你测试了哪些场景 -->
- [ ] 本地开发环境测试通过
- [ ] 单元测试全部通过
- [ ] 手动测试关键流程

## ⚠️ 注意事项
<!-- 审核者需要特别注意的地方 -->

## 💡 补充说明
<!-- 其他需要说明的内容 -->
```

### 4. PR 审核流程

1. **自动化检查** - CI 会自动运行测试、lint、类型检查
2. **同行评审** - 至少一位维护者审核
3. **修改反馈** - 根据反馈进行修改
4. **合并** - 通过审核后合并到 main 分支

---

## 🐛 Issue 规范

### Bug Report 模板

```markdown
**🐛 Bug 描述**
<!-- 清晰描述 Bug 是什么 -->

**🔄 复现步骤**
<!-- 步骤列表 -->
1. 打开 '...'
2. 点击 '....'
3. 向下滚动到 '....'
4. 看到错误

**📸 预期行为**
<!-- 你期望发生什么 -->

**❌ 实际行为**
<!-- 实际发生了什么 -->

**💻 环境信息**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node.js Version: [e.g., 18.x]
- Project Version: [e.g., v1.0.0]

**📎 附加信息**
<!-- 截图、日志等 -->
```

### Feature Request 模板

```markdown
**✨ 功能描述**
<!-- 清晰描述你想要的功能 -->

**🎯 解决的问题**
<!-- 这个功能解决什么痛点？ -->

**💡 建议方案**
<!-- 你建议如何实现？（可选） -->

**🔄 替代方案**
<!-- 其他可能的解决方案（可选） -->

**📊 附加信息**
<!-- 截图、参考链接等 -->
```

---

## 🧪 测试要求

### 必须编写测试的场景

- ✅ 新增的功能模块
- ✅ Bug 修复（防止回归）
- ✅ 公共 API 函数
- ✅ 复杂的业务逻辑
- ✅ 工具函数

### 测试覆盖率要求

| 代码类型 | 覆盖率要求 |
|----------|-----------|
| 核心业务逻辑 | ≥ 90% |
| 工具函数 | ≥ 95% |
| UI 组件 | ≥ 80% |
| 整体项目 | ≥ 85% |

### 测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { LLMService } from '@/services/LLMService';

describe('LLMService', () => {
  let service: LLMService;

  beforeEach(() => {
    service = new LLMService();
  });

  it('should initialize with default config', () => {
    expect(service.getConfig()).toBeDefined();
    expect(service.getProviders().length).toBeGreaterThan(0);
  });

  it('should switch providers correctly', async () => {
    await service.switchProvider('openai');
    expect(service.getActiveProvider()).toBe('openai');
  });

  it('should handle errors gracefully', async () => {
    await expect(
      service.generateResponse('test')
    ).rejects.toThrow();
  });
});
```

---

## 🏆 贡献者认可

所有贡献者将被添加到：

- [CONTRIBUTORS.md](./CONTRIBUTORS.md) - 贡献者名单
- GitHub Release Notes - 版本发布说明
- 项目 README - 特别致谢

### 成为核心贡献者

连续贡献以下任一条件即可成为核心贡献者：

- 🎯 合并 10+ 个 PR
- 🐛 解决 5+ 个重要 Bug
- ✨ 实现 3+ 个重要功能
- 📝 贡献高质量文档

---

## 📚 学习资源

- [项目架构文档](https://docs.yyccube.com/architecture)
- [API 参考](https://docs.yyccube.com/api)
- [开发指南](https://docs.yyccube.com/guide)
- [TypeScript 最佳实践](https://www.typescriptlang.org/docs/handbook/declaration-files/do's-and-don'ts.html)
- [React 最佳实践](https://react.dev/learn/thinking-in-react)

---

## 💬 获取帮助

- 📖 [文档中心](https://docs.yyccube.com)
- 💬 [GitHub Discussions](https://github.com/YanYuCloudCube/YYC3-Family-AI/discussions)
- 🐛 [GitHub Issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues)
- 📧 Email: admin@0379.email

---

## 📄 许可证

贡献代码即表示您同意您的贡献将基于 [MIT License](./LICENSE) 发布。

---

**感谢您的贡献！** 🙏  
*YYC³ Family AI 因您而更强大！*

---

*最后更新: 2026-04-10 | 维护团队: YanYuCloudCube Team*
