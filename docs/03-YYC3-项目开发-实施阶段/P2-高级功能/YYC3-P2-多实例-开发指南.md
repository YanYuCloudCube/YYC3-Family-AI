/**
 * @file docs/YYC3-P2-Multi-Instance-Dev-Guide.md
 * @description P2 阶段 — 应用多开功能开发衔接指南，包含架构说明、文件清单、
 *              本地开发步骤、测试验证、下一步建议
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-18
 * @updated 2026-03-18
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags P2,multi-instance,dev-guide,handoff
 */

# YYC³ Family AI — P2 应用多开功能开发衔接指南

## 一、功能概述

P2 阶段实现了 **应用多开管理系统**，在 Web 环境下提供窗口实例管理、工作区管理、会话管理、跨标签页 IPC 通信四大核心能力。架构设计源自 `docs/YYC3-P2-Advanced-Feature-Multi-Instance.md`，将原 Tauri 原生窗口方案适配为纯浏览器方案（BroadcastChannel API + localStorage 持久化）。

## 二、新增/修改文件清单

### 新增文件（8 个）

| 文件路径 | 说明 |
|---------|------|
| `src/app/components/ide/types/multi-instance.ts` | 核心类型定义（AppInstance, Workspace, Session, IPCMessage 等） |
| `src/app/components/ide/stores/useWindowStore.ts` | 窗口管理 Zustand Store（创建/关闭/激活/最小化/移动/调整） |
| `src/app/components/ide/stores/useWorkspaceStore.ts` | 工作区管理 Zustand Store（创建/删除/切换/复制/导入导出） |
| `src/app/components/ide/stores/useSessionStore.ts` | 会话管理 Zustand Store（创建/激活/暂停/恢复/更新数据） |
| `src/app/components/ide/stores/useIPCStore.ts` | IPC 通信管理 Zustand Store（BroadcastChannel 广播/点对点/订阅） |
| `src/app/components/ide/MultiInstancePanel.tsx` | 多开管理 UI 面板（四标签页：窗口/工作区/会话/IPC） |
| `docs/YYC3-P2-Multi-Instance-Dev-Guide.md` | 本文档 |

### 修改文件（3 个）

| 文件路径 | 变更内容 |
|---------|---------|
| `src/app/components/ide/stores/index.ts` | 追加导出 useWindowStore / useWorkspaceStore / useSessionStore / useIPCStore |
| `src/app/components/ide/PanelManager.tsx` | PanelId 联合类型追加 `"multi-instance"`，PANEL_TITLES 追加标签，拆分菜单追加选项 |
| `src/app/components/ide/PanelQuickAccess.tsx` | QUICK_PANELS 追加 `multi-instance` 快捷入口 |
| `src/app/components/IDEPage.tsx` | 导入 MultiInstancePanel，renderPanel switch 追加 `"multi-instance"` case |

## 三、架构说明

### 3.1 Store 层级

```
Zustand (无 Provider 嵌套)
├── useWindowStore     → localStorage key: yyc3-window-storage
├── useWorkspaceStore  → localStorage key: yyc3-workspace-storage
├── useSessionStore    → localStorage key: yyc3-session-storage
└── useIPCStore        → 运行时状态（BroadcastChannel: yyc3-multi-instance）
```

### 3.2 IPC 通信机制

- **跨标签页通信**：使用 `BroadcastChannel('yyc3-multi-instance')` API
- **消息路由**：支持广播（broadcast）和点对点（sendToInstance）
- **消息过滤**：自动跳过自身发送的消息和非目标接收者消息
- **处理器注册**：`useIPCStore.onMessage(type, handler)` 返回取消订阅函数

### 3.3 面板集成

MultiInstancePanel 作为第 21 个功能面板注册到 PanelManager：
- 通过面板快速访问栏（PanelQuickAccess）打开
- 通过面板拆分菜单选择 "应用多开" 创建
- 支持拖拽合并、拆分、最大化、浮动等标准面板操作

## 四、本地开发衔接步骤

### 4.1 环境准备

```bash
# 安装依赖
pnpm install

# 类型检查
pnpm typecheck

# 单元测试
pnpm test

# 构建验证
pnpm build
```

### 4.2 功能验证清单

- [ ] 进入 IDE 页面，通过面板快速访问打开 "应用多开" 面板
- [ ] **窗口标签页**：创建不同类型窗口实例，验证激活/最小化/关闭
- [ ] **工作区标签页**：创建工作区，搜索过滤，复制/导出/删除
- [ ] **会话标签页**：创建会话，暂停/恢复/删除
- [ ] **IPC 标签页**：验证连接状态指示灯，发送 Ping 消息，查看消息日志
- [ ] 打开两个浏览器标签页，验证 BroadcastChannel 跨标签页通信
- [ ] 刷新页面，验证 localStorage 持久化恢复

### 4.3 E2E 测试（可选）

```bash
npx playwright install
pnpm test:e2e
```

## 五、下一步建议

1. **跨标签页窗口同步**：当一个标签页创建/关闭实例时，其他标签页自动更新实例列表（需在 `useWindowStore` 中监听 BroadcastChannel 消息并合并状态）
2. **工作区与文件系统关联**：将工作区的 `projectPath` 与 FileStore 联动，切换工作区时自动切换文件树
3. **会话数据深度集成**：将 AI 对话历史（ChatHistoryStore）与 Session.data.aiMessages 双向同步
4. **资源共享功能**：实现跨实例剪贴板共享（clipboard-share IPC 消息类型已预留）
5. **性能监控**：添加实例级别的内存/CPU 使用统计（Performance API）
6. **单元测试补充**：为四个新 Store 编写 Vitest 测试用例

## 六、关键约束提醒

- **路由导入**：必须从 `react-router` 导入（禁止 `react-router-dom`）
- **Provider 嵌套顺序**：`DndProvider > WorkflowEventBusProvider > FileStoreProvider > ModelRegistryProvider > PanelManagerProvider`
- **代码标头格式**：严格遵循 `docs/05-B-YYC3-技术规范-代码标头.md`
- **AI 模型配置**：动态可配置，禁止硬编码模型名称
- **Store 位置**：Zustand store 文件统一放置 `/src/app/components/ide/stores/`

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
