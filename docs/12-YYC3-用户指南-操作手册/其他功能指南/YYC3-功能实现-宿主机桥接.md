# YYC3 Family AI - 宿主机桥接实现文档

**版本**: v1.0.0  
**创建日期**: 2026-03-19  
**状态**: ✅ 已实现

---

## 📊 架构总览

### 宿主机桥接架构

```
┌─────────────────────────────────────────┐
│         应用层 (React Components)        │
├─────────────────────────────────────────┤
│         桥接层 (HostBridge)              │
│  ┌──────────────────────────────────┐  │
│  │  自动检测环境                     │  │
│  │  - Tauri (原生)                   │  │
│  │  - Web (IndexedDB 降级)           │  │
│  └──────────────────────────────────┘  │
├─────────────────────────────────────────┤
│         存储层                            │
│  ┌─────────────┐  ┌──────────────────┐ │
│  │ Tauri FS    │  │   IndexedDB      │ │
│  │ (原生文件)  │  │  (浏览器存储)    │ │
│  └─────────────┘  └──────────────────┘ │
└─────────────────────────────────────────┘
```

---

## ✅ 已实现功能

### 1. HostBridge (宿主机桥接)

**文件**: `src/app/components/ide/bridge/host.ts`

**功能**:
- ✅ 自动环境检测 (Tauri/Web)
- ✅ 文件读取 (pickAndReadFile)
- ✅ 文件写入 (writeFile)
- ✅ 文件删除 (removeFile)
- ✅ 文件存在检查 (fileExists)
- ✅ 文件监控 (watchFile)
- ✅ 目录操作 (readDir/createDir/removeDir)
- ✅ 批量文件操作 (readFiles/writeFiles)

**环境降级策略**:
| 功能 | Tauri 环境 | Web 环境 |
|------|------------|----------|
| 文件选择 | 原生对话框 | HTML input |
| 文件保存 | 原生对话框 | 下载链接 |
| 文件读取 | 原生 FS | IndexedDB |
| 文件写入 | 原生 FS | IndexedDB/下载 |
| 文件监控 | 原生 watch | 轮询 (5s) |
| 目录操作 | 原生支持 | ❌ 不支持 |

---

### 2. DialogBridge (对话框桥接)

**功能**:
- ✅ 打开文件对话框 (openFile)
- ✅ 保存文件对话框 (saveFile)
- ✅ 选择目录对话框 (selectDirectory)

**降级策略**:
- Tauri: 原生对话框
- Web: HTML input 元素

---

### 3. Tauri 配置

**文件**: `tauri.conf.json`

**配置项**:
- ✅ 允许所有 FS API
- ✅ 允许对话框 API
- ✅ 允许通知 API
- ✅ 允许剪贴板 API
- ✅ 允许 Shell API

---

### 4. Rust 后端

**文件**: `src-tauri/src/main.rs`

**实现命令**:
- ✅ `pick_file` - 文件选择
- ✅ `save_file` - 文件保存
- ✅ `watch_file` - 文件监控
- ✅ `send_notification` - 系统通知
- ✅ `get_system_info` - 系统信息
- ✅ `exec_command` - 执行命令
- ✅ `open_url` - 打开 URL
- ✅ `read_clipboard` - 读取剪贴板
- ✅ `write_clipboard` - 写入剪贴板

**依赖**:
```toml
tauri = "1.5"
notify = "6.0"
sysinfo = "0.30"
arboard = "3.0"
whoami = "1.4"
```

---

## 🔧 使用指南

### 基本使用

```typescript
import HostBridge from "./bridge/host";

// 检测环境
if (HostBridge.isTauri()) {
  console.log("运行在 Tauri 环境");
} else {
  console.log("运行在 Web 环境，使用 IndexedDB 降级");
}

// 读取文件
const { path, content } = await HostBridge.pickAndReadFile();

// 写入文件
await HostBridge.writeFile("test.txt", "Hello, World!");

// 从 IndexedDB 读取 (Web 环境)
const content = await HostBridge.readFile("src/App.tsx");

// 写入到 IndexedDB (Web 环境)
await HostBridge.writeFile("src/Test.tsx", "export default function Test() {}");

// 文件监控
const watcher = await HostBridge.watchFile("src/App.tsx", (event) => {
  console.log(`文件 ${event.type}: ${event.path}`);
});

// 清理监控
await watcher.unwatch();
```

### 对话框使用

```typescript
import { DialogBridge } from "./bridge/host";

// 打开文件
const result = await DialogBridge.openFile({
  filters: [
    { name: "TypeScript", extensions: ["ts", "tsx"] },
  ],
});

// 保存文件
const savePath = await DialogBridge.saveFile({
  defaultPath: "test.txt",
});

// 选择目录
const dirPath = await DialogBridge.selectDirectory();
```

---

## 📊 存储策略

### 双存储后端

**Tauri 环境**:
```
用户选择文件 → 原生对话框 → 原生文件系统
```

**Web 环境**:
```
用户操作 → IndexedDB 存储 → 浏览器存储
导出时 → 下载链接 → 本地文件
```

### 存储位置选择

| 操作 | Tauri | Web |
|------|-------|-----|
| **打开文件** | 原生 FS | IndexedDB |
| **保存文件** | 原生 FS | IndexedDB/下载 |
| **导出备份** | 原生 FS | 下载链接 |
| **导入数据** | 原生 FS | 文件输入 |

---

## 🎯 最佳实践

### 1. 环境检测

```typescript
// 始终先检测环境
if (HostBridge.isTauri()) {
  // 使用原生功能
} else {
  // 使用降级方案
}
```

### 2. 错误处理

```typescript
try {
  const { path, content } = await HostBridge.pickAndReadFile();
} catch (error) {
  if (error.message.includes("cancelled")) {
    // 用户取消操作
  } else {
    // 其他错误
  }
}
```

### 3. 文件监控

```typescript
// Web 环境轮询频率不宜过高
const watcher = await HostBridge.watchFile(path, callback);

// 记得清理
return () => {
  watcher.unwatch();
};
```

---

## ⚠️ 注意事项

### 1. Web 环境限制

- ❌ 不支持目录读取
- ❌ 不支持目录创建
- ❌ 不支持文件重命名
- ⚠️ 文件监控使用轮询 (5 秒间隔)

### 2. 权限要求

**Tauri 环境**:
- 需要用户授权访问文件系统
- `tauri.conf.json` 中配置 `allowlist`

**Web 环境**:
- IndexedDB 有存储配额限制 (~50-100MB)
- 下载文件需要用户确认

### 3. 性能考虑

- 大文件建议使用流式处理
- 批量操作使用 `readFiles`/`writeFiles`
- 文件监控避免过多实例

---

## 📋 下一步计划

### 高优先级 (本周)
- [ ] 完善文件监控事件系统
- [ ] 添加文件压缩支持
- [ ] 实现云端同步接口

### 中优先级 (下周)
- [ ] 添加文件版本管理
- [ ] 实现增量同步
- [ ] 优化 Web 环境性能

### 低优先级 (本月)
- [ ] 跨设备同步
- [ ] 文件冲突解决
- [ ] 离线模式优化

---

<div align="center">

> 「***YanYuCloudCube***」  
> 「***<admin@0379.email>***」  
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**维护团队**: YanYuCloudCube Team

</div>
