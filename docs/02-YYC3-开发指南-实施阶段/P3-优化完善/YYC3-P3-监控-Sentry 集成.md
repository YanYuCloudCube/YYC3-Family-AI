# YYC3-P3-监控-Sentry 集成

**版本**: v1.0.0  
**创建日期**: 2026-03-19  
**最后更新**: 2026-03-19  
**状态**: ✅ 稳定

---

## 📊 概述

YYC3 Family AI 集成了 Sentry 错误追踪和性能监控服务，提供:

- 🐛 **错误追踪**: 自动捕获 JavaScript 错误和异常
- ⚡ **性能监控**: Web Vitals 指标收集和分析
- 🔍 **会话重放**: 重现用户操作流程
- 📈 **面包屑**: 记录用户行为轨迹
- 👥 **用户追踪**: 按用户维度分析错误

---

## 🎯 目标

- 实时监控生产环境错误
- 快速定位和修复问题
- 持续优化应用性能
- 提升用户体验

---

## 📋 配置说明

### 1. 获取 Sentry DSN

1. 访问 [sentry.io](https://sentry.io)
2. 创建账号和项目
3. 选择 React 平台
4. 复制 DSN (数据源名称)

DSN 格式:
```
https://public_key@o0.ingest.sentry.io/project_id
```

### 2. 环境变量配置

创建 `.env.local` 文件:

```bash
# Sentry 配置
VITE_SENTRY_DSN=https://your_public_key@o0.ingest.sentry.io/your_project_id
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_SAMPLE_RATE=0.1
VITE_SENTRY_TRACES_SAMPLE_RATE=0.01
```

**配置说明**:

| 变量 | 说明 | 默认值 | 建议值 |
|------|------|--------|--------|
| `VITE_SENTRY_DSN` | Sentry 数据源名称 | - | 必填 |
| `VITE_SENTRY_ENVIRONMENT` | 环境标识 | development | production/staging/development |
| `VITE_SENTRY_SAMPLE_RATE` | 错误采样率 | 1.0 | 0.1 (10%) |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | 性能追踪采样率 | 0.1 | 0.01 (1%) |

### 3. 使用 Hook

在应用入口或根组件中初始化:

```tsx
import { useSentry } from "./hooks/useSentry";

function App() {
  const { captureError, addBreadcrumb } = useSentry({
    enabled: import.meta.env.PROD,
    userId: currentUser?.id,
    userEmail: currentUser?.email,
    username: currentUser?.name,
  });
  
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
```

---

## 🔧 使用示例

### 捕获错误

```tsx
import { useSentry } from "./hooks/useSentry";

function MyComponent() {
  const { captureError } = useSentry();
  
  const handleClick = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      captureError(error, {
        tags: {
          component: "MyComponent",
          action: "handleClick",
        },
        extra: {
          userId: currentUser.id,
          payload: inputData,
        },
      });
    }
  };
  
  return <button onClick={handleClick}>操作</button>;
}
```

### 添加面包屑

```tsx
import { useSentry } from "./hooks/useSentry";

function Navigation() {
  const { addBreadcrumb } = useSentry();
  
  const navigateTo = (page: string) => {
    addBreadcrumb({
      category: "navigation",
      message: `Navigating to ${page}`,
      level: "info",
    });
    
    router.push(page);
  };
  
  return (
    <nav>
      <button onClick={() => navigateTo("home")}>首页</button>
      <button onClick={() => navigateTo("settings")}>设置</button>
    </nav>
  );
}
```

### 设置用户信息

```tsx
import { useSentry } from "./hooks/useSentry";

function AuthProvider() {
  const { setUser } = useSentry();
  
  useEffect(() => {
    if (user) {
      setUser({
        id: user.id,
        username: user.name,
        email: user.email,
      });
    } else {
      setUser(null);
    }
  }, [user, setUser]);
  
  return <AuthContext.Provider value={user}>...</AuthContext.Provider>;
}
```

### 性能追踪

```tsx
import { useSentry } from "./hooks/useSentry";

function DataFetcher() {
  const { startTransaction } = useSentry();
  
  const fetchData = async () => {
    const transaction = startTransaction("fetchData", "http");
    
    try {
      const response = await fetch("/api/data");
      const data = await response.json();
      return data;
    } finally {
      transaction?.end();
    }
  };
  
  return <DataComponent fetchData={fetchData} />;
}
```

---

## 📊 Web Vitals 监控

自动收集以下性能指标:

### Core Web Vitals

| 指标 | 名称 | 良好 | 需改进 | 差 |
|------|------|------|--------|-----|
| **FCP** | 首次内容绘制 | < 1.8s | 1.8-3.0s | > 3.0s |
| **LCP** | 最大内容绘制 | < 2.5s | 2.5-4.0s | > 4.0s |
| **FID** | 首次输入延迟 | < 100ms | 100-300ms | > 300ms |
| **CLS** | 累积布局偏移 | < 0.1 | 0.1-0.25 | > 0.25 |

### 自定义性能监控

```tsx
import { startBenchmark } from "./utils/performanceBenchmark";

async function runPerformanceTest() {
  const metrics = await startBenchmark();
  
  console.log({
    fcp: metrics.fcp,
    lcp: metrics.lcp,
    cls: metrics.cls,
  });
  
  // 上报到 Sentry
  if (metrics.lcp > 2500) {
    captureMessage("LCP 性能不佳", "warning");
  }
}
```

---

## ⚠️ 注意事项

### 1. 开发环境配置

开发环境建议关闭或降低采样率:

```bash
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_SAMPLE_RATE=0
VITE_SENTRY_TRACES_SAMPLE_RATE=0
```

### 2. 敏感信息过滤

Sentry 会自动过滤敏感信息，但建议:

```tsx
// ❌ 不要这样做
captureError(error, {
  extra: {
    password: userPassword, // 敏感信息
    token: apiToken, // 敏感信息
  },
});

// ✅ 正确做法
captureError(error, {
  extra: {
    actionType: "login", // 非敏感信息
  },
});
```

### 3. 错误去重

避免重复上报相同错误:

```tsx
const errorCache = new Set();

function captureUniqueError(error: Error) {
  const key = `${error.name}:${error.message}`;
  
  if (!errorCache.has(key)) {
    errorCache.add(key);
    captureError(error);
    
    // 1 分钟后清除缓存
    setTimeout(() => errorCache.delete(key), 60000);
  }
}
```

---

## 🔍 Sentry Dashboard 使用

### 查看错误

1. 登录 Sentry Dashboard
2. 选择项目
3. 查看 Issues 列表
4. 点击错误查看详情

### 错误详情

- **Stack Trace**: 错误堆栈
- **Breadcrumbs**: 用户行为轨迹
- **Context**: 设备、浏览器、OS 信息
- **User**: 受影响用户
- **Release**: 版本号

### 设置告警

1. 进入 Alerts 页面
2. 创建告警规则
3. 配置通知渠道 (邮件/Slack/钉钉)

示例规则:
```
IF (error_count() > 100) IN last 5m
THEN notify @slack-dev-team
```

---

## 📚 相关文档

- [Sentry 官方文档](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Web Vitals 说明](https://web.dev/vitals/)
- [性能基准测试](./YYC3-P3-测试 - 性能基准.md)
- [环境变量配置](./YYC3-P3-配置 - 环境变量.md)

---

## 🎯 最佳实践

### 1. 错误分类

```tsx
// 按严重程度分类
if (error instanceof NetworkError) {
  captureError(error, { level: "warning" });
} else if (error instanceof ValidationError) {
  captureError(error, { level: "info" });
} else {
  captureError(error, { level: "error" });
}
```

### 2. 上下文丰富

```tsx
captureError(error, {
  tags: {
    component: "CheckoutForm",
    feature: "payment",
    severity: "high",
  },
  extra: {
    cartTotal: cart.total,
    itemCount: cart.items.length,
    paymentMethod: selectedMethod,
  },
});
```

### 3. 性能优化

```tsx
// 降低生产环境采样率
const isProduction = import.meta.env.PROD;
const sampleRate = isProduction ? 0.1 : 1.0;

useSentry({
  sampleRate,
  tracesSampleRate: isProduction ? 0.01 : 0.1,
});
```

---

<div align="center">

> 「***YanYuCloudCube***」  
> 「***<admin@0379.email>***」  
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**维护团队**: YanYuCloudCube Team

</div>
