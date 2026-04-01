# YYC³ Family AI - 项目规范标准

> **统一标准 | 规范开发 | 高质量交付**

---

## 📋 目录

- [代码规范](#代码规范)
- [文件组织](#文件组织)
- [命名规范](#命名规范)
- [注释规范](#注释规范)
- [Git 规范](#git-规范)
- [文档规范](#文档规范)
- [测试规范](#测试规范)
- [性能规范](#性能规范)

---

## 代码规范

### TypeScript 规范

#### 严格模式
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 类型定义
```typescript
// ✅ 好的做法
interface User {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'user' | 'guest';

// ❌ 避免
interface User {
  id: any;
  name: any;
}
```

#### 类型守卫
```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
}
```

### React 规范

#### 组件定义
```typescript
// ✅ 函数组件 + TypeScript
interface Props {
  title: string;
  onClick: () => void;
}

export function MyComponent({ title, onClick }: Props) {
  return <button onClick={onClick}>{title}</button>;
}

// ❌ 避免
export const MyComponent = ({ title, onClick }: any) => {
  return <button onClick={onClick}>{title}</button>;
};
```

#### Hooks 使用
```typescript
// ✅ 正确使用 Hooks
function MyComponent() {
  const [count, setCount] = useState(0);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return <div>{count}</div>;
}

// ❌ 避免在条件语句中使用 Hooks
function BadComponent() {
  if (condition) {
    const [count, setCount] = useState(0); // 错误
  }
}
```

#### 性能优化
```typescript
// ✅ 使用 memo 和 useMemo
export const ExpensiveComponent = memo(({ data }: Props) => {
  const processed = useMemo(() => processData(data), [data]);
  return <div>{processed}</div>;
});

// ✅ 使用 useCallback
const handleClick = useCallback(() => {
  doSomething(dependency);
}, [dependency]);
```

### 样式规范

#### Tailwind CSS
```typescript
// ✅ 使用 Tailwind 类名
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// ❌ 避免内联样式
<div style={{ display: 'flex', padding: '16px' }}>
```

#### 主题使用
```typescript
// ✅ 使用主题变量
<div className="text-primary bg-background border-border">

// ❌ 避免硬编码颜色
<div className="text-blue-500 bg-gray-100">
```

---

## 文件组织

### 目录结构
```
src/
├── app/
│   ├── components/       # React 组件
│   │   ├── ide/        # IDE 相关组件
│   │   ├── ui/         # UI 基础组件
│   │   └── layout/     # 布局组件
│   ├── core/           # 核心模块
│   │   ├── AIOrchestrator.ts
│   │   ├── StateManager.ts
│   │   └── PluginSDK.ts
│   ├── stores/         # Zustand stores
│   ├── hooks/          # 自定义 Hooks
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript 类型
│   └── examples/       # 示例代码
├── e2e/               # E2E 测试
├── public/            # 静态资源
└── docs/              # 文档
```

### 文件命名
```
# 组件文件
MyComponent.tsx
my-component.test.tsx

# 工具文件
utils.ts
dateUtils.ts

# 类型文件
types.ts
apiTypes.ts

# Store 文件
useThemeStore.ts
useFileStore.ts
```

---

## 命名规范

### 变量命名
```typescript
// ✅ camelCase
const userName = 'John';
const isLoggedIn = true;

// ❌ 避免
const user_name = 'John';
const isloggedin = true;
```

### 常量命名
```typescript
// ✅ UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// ❌ 避免
const maxRetryCount = 3;
const apiBaseUrl = 'https://api.example.com';
```

### 函数命名
```typescript
// ✅ 动词开头
function getUser(id: string): Promise<User> { }
function validateEmail(email: string): boolean { }
function formatDate(date: Date): string { }

// ❌ 避免
function user(id: string): Promise<User> { }
function emailValidation(email: string): boolean { }
```

### 类命名
```typescript
// ✅ PascalCase
class UserManager { }
class APIHandler { }

// ❌ 避免
class userManager { }
class api_handler { }
```

### 接口命名
```typescript
// ✅ PascalCase，无 I 前缀
interface User { }
interface ApiResponse<T> { }

// ❌ 避免
interface IUser { }
interface IApiResponse<T> { }
```

---

## 注释规范

### 文件头注释
```typescript
/**
 * @file components/MyComponent.tsx
 * @description 组件描述 - 详细说明组件的功能和用途
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev | stable | deprecated
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags react,component,typescript
 */
```

### 函数注释
```typescript
/**
 * 获取用户信息
 * @param userId - 用户 ID
 * @param includeProfile - 是否包含个人资料
 * @returns 用户信息对象
 * @throws {Error} 当用户不存在时抛出错误
 * @example
 * ```typescript
 * const user = await getUser('123', true);
 * console.log(user.name);
 * ```
 */
async function getUser(userId: string, includeProfile = false): Promise<User> {
  // 实现
}
```

### 复杂逻辑注释
```typescript
// 使用 CRDT 算法解决并发编辑冲突
// 参考: https://docs.yjs.dev/guide/crdt-algorithms
const ydoc = new Y.Doc();

// 性能优化：使用防抖减少频繁调用
const debouncedSave = debounce(saveContent, 300);
```

---

## Git 规范

### 分支命名
```
feature/功能名称      # 新功能
bugfix/问题描述        # Bug 修复
hotfix/紧急修复        # 紧急修复
refactor/重构内容      # 代码重构
docs/文档更新         # 文档更新
test/测试相关         # 测试相关
```

### 提交信息
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型
```
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构（不是新功能也不是修复）
perf:     性能优化
test:     测试相关
chore:    构建/工具链相关
```

#### 示例
```
feat(ai): add multi-provider support for LLM integration

- Add support for OpenAI, GLM, Qwen, DeepSeek
- Implement provider switching UI
- Add provider-specific configuration

Closes #123
```

---

## 文档规范

### Markdown 格式
```markdown
# 一级标题
## 二级标题
### 三级标题

**粗体文本**
*斜体文本*
`代码片段`

```typescript
// 代码块
```

| 表头 1 | 表头 2 |
|--------|--------|
| 内容 1 | 内容 2 |

> 引用文本

- 列表项 1
- 列表项 2
```

### 文档结构
```markdown
# 文档标题

> 简短描述

## 目录
- [章节 1](#章节-1)
- [章节 2](#章节-2)

## 章节 1
内容...

## 章节 2
内容...

## 总结
总结内容...
```

---

## 测试规范

### 单元测试
```typescript
describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should call onClick when button is clicked', () => {
    const handleClick = vi.fn();
    render(<MyComponent title="Test" onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E 测试
```typescript
test('should create new file', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="new-file-button"]');
  await page.fill('[data-testid="file-name-input"]', 'test.ts');
  await page.click('[data-testid="save-button"]');
  await expect(page.locator('[data-testid="file-list"]')).toContainText('test.ts');
});
```

### 测试覆盖率
- 单元测试覆盖率：> 80%
- 关键路径覆盖率：> 90%
- E2E 测试：覆盖主要用户流程

---

## 性能规范

### 代码分割
```typescript
// ✅ 动态导入
const MonacoEditor = lazy(() => import('./MonacoEditor'));

// ✅ 条件加载
if (needsFeature) {
  const feature = await import('./feature');
  feature.init();
}
```

### 优化建议
```typescript
// ✅ 使用 useMemo 缓存计算结果
const filteredData = useMemo(() => data.filter(item => item.active), [data]);

// ✅ 使用 useCallback 缓存函数
const handleSave = useCallback(() => saveData(data), [data]);

// ✅ 使用虚拟列表处理大数据
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={400}
  itemCount={items.length}
  itemSize={50}
>
  {({ index, style }) => <div style={style}>{items[index]}</div>}
</FixedSizeList>
```

---

## 安全规范

### 敏感信息
```typescript
// ❌ 避免硬编码密钥
const apiKey = 'sk-xxx';

// ✅ 使用环境变量
const apiKey = import.meta.env.VITE_API_KEY;
```

### 输入验证
```typescript
// ✅ 验证用户输入
function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '');
}

// ✅ 使用 TypeScript 类型检查
interface SafeInput {
  value: string;
  maxLength: number;
}

function validateInput(input: SafeInput): boolean {
  return input.value.length <= input.maxLength;
}
```

---

## 总结

遵循以上规范可以：
- ✅ 提高代码质量和可维护性
- ✅ 减少代码审查时间
- ✅ 提升团队协作效率
- ✅ 确保项目长期健康发展

---

**文档版本**: v1.0.0
**最后更新**: 2026-04-01
**维护者**: YanYuCloudCube Team