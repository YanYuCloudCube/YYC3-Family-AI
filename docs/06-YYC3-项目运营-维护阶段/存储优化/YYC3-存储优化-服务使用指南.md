# 存储优化服务使用指南

**版本**: v1.0.0  
**创建日期**: 2026-03-19

---

## 📊 服务概览

### 新增服务

| 服务 | 文件 | 功能 |
|------|------|------|
| **StorageMonitor** | `StorageMonitor.ts` | 存储监控、容量告警、清理建议 |
| **DataExporter** | `DataExporter.ts` | 数据导出、备份下载 |
| **DataImporter** | `DataImporter.ts` | 数据导入、恢复 |
| **StorageCleanup** | `StorageCleanup.ts` | 自动清理、空间释放 |

---

## 🔍 StorageMonitor 使用

### 基本使用

```typescript
import { storageMonitor } from "./services/StorageMonitor";

// 获取存储使用情况
const usage = await storageMonitor.getStorageUsage();
console.log("存储使用:", usage);

// 获取存储详细分类
const breakdown = await storageMonitor.getStorageBreakdown();
console.log("存储分类:", breakdown);
```

### 开始监控

```typescript
import { startMonitoring, stopMonitoring } from "./services/StorageMonitor";

// 开始监控 (每分钟检查一次)
startMonitoring(60000);

// 停止监控
stopMonitoring();
```

### 存储状态说明

| 状态 | 使用率 | 说明 |
|------|--------|------|
| **good** | < 70% | 存储充足 |
| **warning** | 70-90% | 需要清理 |
| **critical** | > 90% | 立即清理 |

---

## 📤 DataExporter 使用

### 导出所有数据

```typescript
import { DataExporter } from "./services/DataExporter";

// 导出并下载
await DataExporter.exportAndDownload();

// 或手动下载
const data = await DataExporter.exportAllData();
DataExporter.downloadExport(data, "my-backup.json");
```

### 导出特定项目

```typescript
// 导出项目数据
const projectData = await DataExporter.exportProject("project-id-123");
DataExporter.downloadExport(projectData, "project-backup.json");
```

### 获取导出统计

```typescript
const stats = await DataExporter.getExportStats();
console.log("导出统计:", stats);
// {
//   localStorageCount: 50,
//   localStorageSize: 102400,
//   filesCount: 100,
//   filesSize: 5242880,
//   ...
// }
```

---

## 📥 DataImporter 使用

### 从文件导入

```typescript
import { DataImporter } from "./services/DataImporter";

// 显示文件选择器并导入
const result = await DataImporter.importWithUI();
console.log("导入结果:", result);
```

### 从文本导入

```typescript
const jsonText = await readFile(); // 读取 JSON 文件
const result = await DataImporter.importFromText(jsonText);
console.log("导入成功:", result.success);
```

### 合并导入 (保留现有数据)

```typescript
const data = await DataExporter.exportAllData();
const result = await DataImporter.mergeImport(data);
console.log("合并导入:", result);
```

---

## 🧹 StorageCleanup 使用

### 执行清理

```typescript
import { StorageCleanup } from "./services/StorageCleanup";

// 清理所有可清理的数据
const result = await StorageCleanup.cleanup({
  cleanupFilesOlderThan: 30, // 清理 30 天前的文件
  keepMostRecentFiles: 100,  // 保留最新 100 个文件
  cleanupChatHistory: true,  // 清理对话历史
  keepLastSessions: 20,      // 保留最近 20 个会话
  cleanupSnapshots: true,    // 清理快照
  keepLastSnapshots: 10,     // 保留最近 10 个快照
  cleanupUnusedKeys: true,   // 清理未使用的键
  cleanupEmptyProjects: true,// 清理空项目
});

console.log("清理结果:", result);
```

### 仅预览清理 (不实际删除)

```typescript
const result = await StorageCleanup.cleanup({
  cleanupFilesOlderThan: 30,
  dryRun: true, // 仅预览，不实际删除
});

console.log("将清理:", result.cleanedFiles, "个文件");
console.log("将释放:", (result.freedSpace / 1024 / 1024).toFixed(2), "MB");
```

### 获取清理建议

```typescript
const suggestions = await StorageCleanup.getCleanupSuggestions();
console.log("清理建议:", suggestions);
// {
//   oldFilesCount: 50,
//   oldFilesSize: 1048576,
//   oldSessionsCount: 30,
//   ...
//   totalFreedSpace: 2097152
// }
```

---

## 🔧 集成到应用

### 在 App 启动时初始化

```typescript
// src/app/App.tsx
import { storageMonitor } from "./components/ide/services/StorageMonitor";

function App() {
  useEffect(() => {
    // 启动存储监控
    storageMonitor.startMonitoring(60000); // 每分钟检查
    
    return () => {
      storageMonitor.stopMonitoring();
    };
  }, []);
  
  return <...>;
}
```

### 在设置页面添加导出/导入

```typescript
// src/app/components/ide/SettingsPage.tsx
import { DataExporter } from "./services/DataExporter";
import { DataImporter } from "./services/DataImporter";

function SettingsPage() {
  const handleExport = async () => {
    await DataExporter.exportAndDownload();
  };
  
  const handleImport = async () => {
    const result = await DataImporter.importWithUI();
    if (result.success) {
      toast.success("导入成功，5 秒后刷新页面");
      setTimeout(() => window.location.reload(), 5000);
    }
  };
  
  return (
    <div>
      <button onClick={handleExport}>导出数据</button>
      <button onClick={handleImport}>导入数据</button>
    </div>
  );
}
```

### 在设置页面添加清理功能

```typescript
// src/app/components/ide/SettingsPage.tsx
import { StorageCleanup } from "./services/StorageCleanup";

function SettingsPage() {
  const handleCleanup = async () => {
    const suggestions = await StorageCleanup.getCleanupSuggestions();
    
    const confirmed = confirm(
      `将清理以下内容:\n` +
      `- ${suggestions.oldFilesCount} 个旧文件\n` +
      `- ${suggestions.oldSessionsCount} 个旧会话\n` +
      `- ${suggestions.oldSnapshotsCount} 个旧快照\n` +
      `预计释放：${(suggestions.totalFreedSpace / 1024 / 1024).toFixed(2)} MB\n` +
      `确认清理？`
    );
    
    if (confirmed) {
      const result = await StorageCleanup.cleanup({
        cleanupFilesOlderThan: 30,
        cleanupChatHistory: true,
        cleanupSnapshots: true,
        keepLastSessions: 20,
        keepLastSnapshots: 10,
      });
      
      if (result.success) {
        alert(`清理完成！释放 ${(result.freedSpace / 1024 / 1024).toFixed(2)} MB`);
      }
    }
  };
  
  return (
    <button onClick={handleCleanup}>清理存储空间</button>
  );
}
```

---

## 📊 监控仪表板

### 创建存储监控组件

```typescript
// src/app/components/ide/StorageMonitorPanel.tsx
import { useEffect, useState } from "react";
import { storageMonitor } from "./services/StorageMonitor";

export function StorageMonitorPanel() {
  const [usage, setUsage] = useState<any>(null);
  
  useEffect(() => {
    const updateUsage = async () => {
      const data = await storageMonitor.getStorageUsage();
      setUsage(data);
    };
    
    updateUsage();
    const interval = setInterval(updateUsage, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!usage) return <div>加载中...</div>;
  
  return (
    <div className="storage-monitor">
      <div className="storage-status">
        存储状态：
        <span className={`status-${usage.status}`}>
          {usage.status === "good" ? "良好" : usage.status === "warning" ? "警告" : "严重"}
        </span>
      </div>
      
      <div className="storage-usage">
        已使用：{(usage.totalUsage / 1024 / 1024).toFixed(2)} MB / 
        {(usage.totalPercent).toFixed(1)}%
      </div>
      
      {usage.recommendations.map((rec: string, i: number) => (
        <div key={i} className="recommendation">⚠️ {rec}</div>
      ))}
    </div>
  );
}
```

---

## ⚠️ 注意事项

### 1. 导出前备份

导出操作不会修改数据，但建议在重大操作前手动备份。

### 2. 导入会覆盖数据

导入操作会覆盖现有数据，请谨慎操作。

### 3. 清理不可恢复

清理操作会永久删除数据，请确认后再执行。

### 4. 性能影响

- 存储监控：每分钟检查，影响很小
- 导出操作：大数据量时可能较慢
- 清理操作：大数据量时可能较慢

---

## 🎯 最佳实践

### 1. 定期导出备份

```typescript
// 每周导出一次
setInterval(async () => {
  await DataExporter.exportAndDownload();
}, 7 * 24 * 60 * 60 * 1000);
```

### 2. 自动清理旧数据

```typescript
// 每月清理一次
setInterval(async () => {
  await StorageCleanup.cleanup({
    cleanupFilesOlderThan: 30,
    cleanupChatHistory: true,
    keepLastSessions: 20,
  });
}, 30 * 24 * 60 * 60 * 1000);
```

### 3. 监控告警响应

```typescript
// 当存储使用率超过 90% 时自动清理
const usage = await storageMonitor.getStorageUsage();
if (usage.status === "critical") {
  await StorageCleanup.cleanup({
    cleanupFilesOlderThan: 7, // 清理 7 天前的文件
    cleanupChatHistory: true,
    keepLastSessions: 10,
  });
}
```

---

<div align="center">

> 「***YanYuCloudCube***」  
> 「***<admin@0379.email>***」  
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**维护团队**: YanYuCloudCube Team

</div>
