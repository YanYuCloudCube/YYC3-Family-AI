# PWA 使用指南

**版本**: v1.0.0  
**创建日期**: 2026-03-19  
**状态**: 开发中

---

## 📱 什么是 PWA?

PWA (Progressive Web App) 是一种现代 Web 应用技术，提供类似原生应用的体验:

- 📲 可安装到主屏幕
- 📶 离线工作
- 🔔 推送通知
- ⚡ 快速加载
- 🔒 安全可靠

---

## 🚀 安装 YYC3 Family AI

### 桌面端 (Chrome/Edge)

1. 访问网站
2. 点击地址栏右侧的 **安装** 图标 (⬇️)
3. 点击 **安装**
4. 应用将出现在桌面或开始菜单

### Android (Chrome)

1. 使用 Chrome 打开网站
2. 点击菜单 (⋮)
3. 选择 **添加到主屏幕**
4. 确认添加
5. 应用图标将出现在主屏幕

### iOS (Safari)

1. 使用 Safari 打开网站
2. 点击分享按钮 (⬆️)
3. 选择 **添加到主屏幕**
4. 点击右上角 **添加**
5. 应用图标将出现在主屏幕

---

## 📶 离线功能

### 支持的离线功能

- ✅ 查看已缓存的项目
- ✅ 编辑本地文件
- ✅ 查看文档
- ✅ 使用 AI 对话 (本地模型)

### 需要网络的功能

- ❌ 云端同步
- ❌ 在线 LLM 调用
- ❌ 项目分享
- ❌ 协作编辑

---

## 🔔 推送通知

### 启用通知

1. 打开设置
2. 进入 **通知设置**
3. 开启 **允许通知**
4. 选择通知类型

### 通知类型

- 📝 代码生成完成
- ⚠️ 错误警告
- 💬 新消息
- 🔄 同步完成

---

## 📲 使用触摸手势

### 支持的手势

| 手势 | 功能 |
|------|------|
| 左滑 | 返回上一页 |
| 右滑 | 打开侧边栏 |
| 上滑 | 刷新内容 |
| 下滑 | 显示通知 |

### 使用示例

```tsx
import { useTouchGestures } from "./hooks/useTouchGestures";

function MyComponent() {
  useTouchGestures({
    onSwipeLeft: () => navigate(-1),
    onSwipeRight: () => toggleSidebar(),
    threshold: 50,
  });
  
  return <div>...</div>;
}
```

---

## 🏠 底部导航栏

### 导航项

| 图标 | 名称 | 路径 |
|------|------|------|
| 🏠 | 首页 | `/` |
| 💬 | AI 对话 | `/ai-chat` |
| 📁 | IDE | `/ide` |
| ⚙️ | 设置 | `/settings` |
| 👤 | 我的 | `/profile` |

### 特性

- ✅ 触摸反馈
- ✅ 角标提示
- ✅ 当前页高亮
- ✅ 安全区域适配

---

## 🔄 自动更新

PWA 会自动检查更新:

1. 后台下载新版本
2. 提示用户更新
3. 点击 **更新** 按钮
4. 应用刷新

### 手动更新

```javascript
// 检查更新
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.update();
  });
}
```

---

## 📊 存储管理

### 本地存储

- **IndexedDB**: 项目文件、对话历史
- **LocalStorage**: 用户设置、主题
- **Cache Storage**: 静态资源

### 清理缓存

1. 打开设置
2. 进入 **存储管理**
3. 点击 **清理缓存**
4. 选择清理范围

---

## 🛠️ 故障排查

### 应用无法安装

**原因**: 浏览器不支持 PWA

**解决**: 使用 Chrome/Edge/Safari 最新版

### 离线功能不工作

**原因**: Service Worker 未注册

**解决**:
1. 清除浏览器缓存
2. 刷新页面
3. 检查控制台错误

### 推送通知不显示

**原因**: 通知权限被拒绝

**解决**:
1. 打开浏览器设置
2. 进入 **网站设置** > **通知**
3. 允许 YYC3 Family AI 通知

---

## 📋 浏览器支持

| 浏览器 | 版本 | 支持度 |
|--------|------|--------|
| Chrome | 67+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| Safari | 11.1+ | ✅ 部分支持 |
| Firefox | 68+ | ✅ 部分支持 |
| Samsung Internet | 9.2+ | ✅ 完全支持 |

---

## 🔐 安全说明

- 所有数据本地存储
- HTTPS 加密传输
- 不收集个人信息
- 定期清理缓存

---

## 📞 技术支持

遇到问题？

- 📧 邮件：admin@0379.email
- 💬 GitHub Issues
- 📖 文档中心

---

<div align="center">

> 「***YanYuCloudCube***」  
> 「***<admin@0379.email>***」  
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」

**版本**: v1.0.0  
**最后更新**: 2026-03-19  
**维护团队**: YanYuCloudCube Team

</div>
