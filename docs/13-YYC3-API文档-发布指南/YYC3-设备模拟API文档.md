# 设备模拟 API 文档

> **版本**: v1.0.0  
> **最后更新**: 2026-03-31  
> **维护团队**: YYC3 团队

## 概述

设备模拟系统提供了多设备预览功能，支持模拟不同设备尺寸、分辨率和特性。

## 核心 API

### DeviceSimulator

设备模拟器，负责设备切换和预览管理。

#### 方法

##### `setDevice(deviceId: string): Promise<void>`

设置当前模拟设备。

**参数**:
- `deviceId`: 设备 ID（如 'iphone-15', 'ipad-pro', 'macbook-pro'）

**返回值**: `Promise<void>`

**示例**:
```typescript
import { deviceSimulator } from '@/app/components/ide/preview/DeviceSimulator';

await deviceSimulator.setDevice('iphone-15');
```

##### `getDevice(): DeviceConfig`

获取当前设备配置。

**返回值**: `DeviceConfig`

**示例**:
```typescript
const currentDevice = deviceSimulator.getDevice();
console.log(currentDevice.name); // 'iPhone 15'
console.log(currentDevice.width); // 390
```

##### `getDevices(): DeviceInfo[]`

获取所有可用设备列表。

**返回值**: `DeviceInfo[]`

**示例**:
```typescript
const devices = deviceSimulator.getDevices();
// [
//   { id: 'iphone-15', name: 'iPhone 15', type: 'phone', ... },
//   { id: 'ipad-pro', name: 'iPad Pro', type: 'tablet', ... },
//   ...
// ]
```

##### `createCustomDevice(config: CustomDeviceConfig): Promise<void>`

创建自定义设备。

**参数**:
- `config`: 自定义设备配置

**返回值**: `Promise<void>`

**示例**:
```typescript
await deviceSimulator.createCustomDevice({
  name: 'My Custom Device',
  width: 800,
  height: 600,
  devicePixelRatio: 2,
  userAgent: 'Custom User Agent',
});
```

##### `rotate(): void`

旋转设备（横屏/竖屏切换）。

**示例**:
```typescript
deviceSimulator.rotate();
```

##### `setZoom(scale: number): void`

设置缩放比例。

**参数**:
- `scale`: 缩放比例（0.1 - 2.0）

**示例**:
```typescript
deviceSimulator.setZoom(0.8); // 80% 缩放
```

##### `captureScreenshot(): Promise<Blob>`

截取当前预览截图。

**返回值**: `Promise<Blob>`

**示例**:
```typescript
const screenshot = await deviceSimulator.captureScreenshot();
// 下载截图
const url = URL.createObjectURL(screenshot);
const a = document.createElement('a');
a.href = url;
a.download = 'screenshot.png';
a.click();
```

## 类型定义

### DeviceConfig

```typescript
interface DeviceConfig {
  /** 设备 ID */
  id: string;
  /** 设备名称 */
  name: string;
  /** 设备类型 */
  type: 'phone' | 'tablet' | 'desktop' | 'custom';
  /** 宽度（像素） */
  width: number;
  /** 高度（像素） */
  height: number;
  /** 设备像素比 */
  devicePixelRatio: number;
  /** 用户代理字符串 */
  userAgent?: string;
  /** 设备图标 */
  icon?: string;
  /** 描述 */
  description?: string;
}
```

### DeviceInfo

```typescript
interface DeviceInfo {
  /** 设备 ID */
  id: string;
  /** 设备名称 */
  name: string;
  /** 设备类型 */
  type: DeviceType;
  /** 尺寸信息 */
  dimensions: {
    width: number;
    height: number;
  };
  /** 像素比 */
  pixelRatio: number;
}
```

### CustomDeviceConfig

```typescript
interface CustomDeviceConfig {
  /** 设备名称 */
  name: string;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 设备像素比 */
  devicePixelRatio?: number;
  /** 用户代理 */
  userAgent?: string;
}
```

## 内置设备

### 手机设备

| 设备 | 尺寸 | DPR |
|------|------|-----|
| iPhone 15 | 390 × 844 | 3 |
| iPhone 15 Pro Max | 430 × 932 | 3 |
| iPhone SE | 375 × 667 | 2 |
| Samsung Galaxy S24 | 360 × 780 | 3 |
| Google Pixel 8 | 393 × 873 | 3 |

### 平板设备

| 设备 | 尺寸 | DPR |
|------|------|-----|
| iPad Pro 12.9" | 1024 × 1366 | 2 |
| iPad Air | 820 × 1180 | 2 |
| Samsung Galaxy Tab S9 | 800 × 1280 | 2 |
| Microsoft Surface Pro 9 | 912 × 1368 | 1.5 |

### 桌面设备

| 设备 | 尺寸 | DPR |
|------|------|-----|
| MacBook Pro 16" | 1728 × 1117 | 2 |
| iMac 27" | 2560 × 1440 | 1 |
| Dell U2723QE | 3840 × 2160 | 1 |
| Standard Desktop | 1920 × 1080 | 1 |

## 事件系统

设备模拟系统支持事件监听：

### 设备变更事件

```typescript
import { eventBus } from '@/app/components/ide/llm/PluginAPIManager';

eventBus.on('device:changed', (data) => {
  console.log('设备已变更:', data.deviceId);
  console.log('新设备配置:', data.config);
});
```

### 设备旋转事件

```typescript
eventBus.on('device:rotated', (data) => {
  console.log('设备已旋转:', data.orientation);
  console.log('新尺寸:', data.dimensions);
});
```

### 缩放变更事件

```typescript
eventBus.on('device:zoomed', (data) => {
  console.log('缩放比例:', data.scale);
});
```

## 高级功能

### 响应式设计测试

```typescript
// 测试不同断点
const breakpoints = [320, 375, 414, 768, 1024, 1440];

for (const width of breakpoints) {
  await deviceSimulator.createCustomDevice({
    name: `Breakpoint ${width}`,
    width,
    height: 800,
  });
}
```

### 网络模拟

```typescript
// 模拟慢速网络
await deviceSimulator.setNetworkCondition('slow-3g');
```

### 地理位置模拟

```typescript
// 模拟特定位置
await deviceSimulator.setGeolocation({
  latitude: 39.9042,
  longitude: 116.4074,
});
```

## 存储机制

设备模拟系统使用以下存储：

1. **localStorage**: 存储当前设备 ID 和缩放比例
2. **IndexedDB**: 存储自定义设备配置
3. **Zustand Store**: 运行时状态管理

## 性能优化

### 懒加载设备配置

设备配置按需加载，减少初始包大小。

### 缓存机制

设备配置缓存到 IndexedDB，避免重复解析。

### 虚拟化渲染

大屏幕设备使用虚拟化渲染，提高性能。

## 错误处理

### 设备不存在

```typescript
try {
  await deviceSimulator.setDevice('non-existent');
} catch (error) {
  console.error('设备不存在:', error.message);
}
```

### 配置验证失败

```typescript
try {
  await deviceSimulator.createCustomDevice(invalidConfig);
} catch (error) {
  console.error('配置验证失败:', error.message);
}
```

## 最佳实践

### 1. 多设备预览

```typescript
// 同时预览多个设备
const devices = ['iphone-15', 'ipad-pro', 'macbook-pro'];
for (const deviceId of devices) {
  await deviceSimulator.setDevice(deviceId);
  const screenshot = await deviceSimulator.captureScreenshot();
  // 保存截图
}
```

### 2. 响应式测试

```typescript
// 测试所有内置设备
const allDevices = deviceSimulator.getDevices();
for (const device of allDevices) {
  await deviceSimulator.setDevice(device.id);
  // 运行测试
}
```

### 3. 自定义设备管理

```typescript
// 创建自定义设备集合
const customDevices = [
  { name: 'My Phone', width: 360, height: 760 },
  { name: 'My Tablet', width: 800, height: 1280 },
];

for (const config of customDevices) {
  await deviceSimulator.createCustomDevice(config);
}
```

## 测试覆盖

设备模拟系统测试覆盖率：**95%**

- 单元测试：45个
- 集成测试：15个
- E2E 测试：10个

## 相关文档

- [设备模拟使用指南](../使用指南/设备模拟使用指南.md)
- [架构文档 - 设备模拟](../架构文档/系统架构.md#设备模拟)

## 更新日志

### v1.0.0 (2026-03-31)
- 初始版本发布
- 支持 20+ 内置设备
- 支持自定义设备
- 设备旋转和缩放
- 截图功能
- 事件系统
- 完整测试覆盖

---

**维护者**: YYC3 团队  
**反馈渠道**: [GitHub Issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues)
