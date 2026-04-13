# 设备模拟使用指南

> **版本**: v1.0.0  
> **适用对象**: 前端开发者、测试工程师  
> **最后更新**: 2026-03-31

## 概述

本指南将帮助你使用 YYC3 Family AI 的设备模拟功能，快速测试响应式设计和跨设备兼容性。

## 快速开始

### 1. 切换设备

```typescript
import { deviceSimulator } from '@/app/components/ide/preview/DeviceSimulator';

// 切换到 iPhone 15
await deviceSimulator.setDevice('iphone-15');

// 切换到 iPad Pro
await deviceSimulator.setDevice('ipad-pro');

// 切换到 MacBook Pro
await deviceSimulator.setDevice('macbook-pro');
```

### 2. 查看当前设备

```typescript
const currentDevice = deviceSimulator.getDevice();
console.log('当前设备:', currentDevice.name);
console.log('尺寸:', `${currentDevice.width}×${currentDevice.height}`);
console.log('像素比:', currentDevice.devicePixelRatio);
```

### 3. 获取所有可用设备

```typescript
const devices = deviceSimulator.getDevices();

devices.forEach(device => {
  console.log(`${device.name}: ${device.dimensions.width}×${device.dimensions.height}`);
});
```

## 设备旋转

### 横竖屏切换

```typescript
// 旋转设备
deviceSimulator.rotate();

// 检查当前方向
const device = deviceSimulator.getDevice();
console.log('方向:', device.width > device.height ? '横屏' : '竖屏');
```

### 监听旋转事件

```typescript
import { eventBus } from '@/app/components/ide/llm/PluginAPIManager';

eventBus.on('device:rotated', (data) => {
  console.log('设备已旋转:', data.orientation);
  console.log('新尺寸:', data.dimensions);
});
```

## 缩放控制

### 设置缩放比例

```typescript
// 设置为 80% 缩放
deviceSimulator.setZoom(0.8);

// 设置为 100% 缩放
deviceSimulator.setZoom(1.0);

// 设置为 120% 缩放
deviceSimulator.setZoom(1.2);
```

### 自适应缩放

```typescript
// 自动适应容器大小
function autoFit() {
  const container = document.getElementById('preview-container');
  const device = deviceSimulator.getDevice();
  
  const scale = Math.min(
    container.clientWidth / device.width,
    container.clientHeight / device.height,
    1.0 // 最大不超过 100%
  );
  
  deviceSimulator.setZoom(scale);
}
```

## 自定义设备

### 创建自定义设备

```typescript
await deviceSimulator.createCustomDevice({
  name: '我的自定义设备',
  width: 800,
  height: 600,
  devicePixelRatio: 2,
  userAgent: 'Mozilla/5.0 (Custom Device)',
});
```

### 创建响应式测试设备集

```typescript
// 创建常用断点设备
const breakpoints = [
  { name: 'Mobile S', width: 320, height: 568 },
  { name: 'Mobile M', width: 375, height: 667 },
  { name: 'Mobile L', width: 414, height: 896 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Laptop', width: 1024, height: 768 },
  { name: 'Desktop', width: 1440, height: 900 },
];

for (const bp of breakpoints) {
  await deviceSimulator.createCustomDevice(bp);
}
```

## 截图功能

### 截取当前预览

```typescript
// 截取截图
const screenshot = await deviceSimulator.captureScreenshot();

// 下载截图
const url = URL.createObjectURL(screenshot);
const a = document.createElement('a');
a.href = url;
a.download = `screenshot-${Date.now()}.png`;
a.click();
```

### 批量截图

```typescript
// 为所有设备截图
const devices = deviceSimulator.getDevices();
const screenshots = [];

for (const device of devices) {
  await deviceSimulator.setDevice(device.id);
  const screenshot = await deviceSimulator.captureScreenshot();
  screenshots.push({
    deviceName: device.name,
    blob: screenshot,
  });
}

// 保存所有截图
screenshots.forEach(({ deviceName, blob }) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deviceName}.png`;
  a.click();
});
```

## 响应式测试

### 测试所有断点

```typescript
async function testAllBreakpoints() {
  const devices = [
    'iphone-se',
    'iphone-15',
    'ipad-air',
    'ipad-pro',
    'macbook-pro',
  ];
  
  for (const deviceId of devices) {
    await deviceSimulator.setDevice(deviceId);
    
    // 等待渲染完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 检查布局
    const issues = checkLayout();
    
    if (issues.length > 0) {
      console.warn(`${deviceId} 布局问题:`, issues);
    }
  }
}
```

### 检查布局问题

```typescript
function checkLayout(): string[] {
  const issues: string[] = [];
  
  // 检查元素是否超出视口
  document.querySelectorAll('*').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      issues.push(`元素 ${el.tagName} 超出右边界`);
    }
    if (rect.bottom > window.innerHeight) {
      issues.push(`元素 ${el.tagName} 超出下边界`);
    }
  });
  
  // 检查文本是否可读
  document.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(el => {
    const style = getComputedStyle(el);
    if (parseInt(style.fontSize) < 12) {
      issues.push(`文本 ${el.tagName} 字号过小`);
    }
  });
  
  return issues;
}
```

## 高级功能

### 网络模拟

```typescript
// 模拟慢速网络
await deviceSimulator.setNetworkCondition('slow-3g');

// 模拟快速网络
await deviceSimulator.setNetworkCondition('fast-3g');

// 恢复正常网络
await deviceSimulator.setNetworkCondition('online');
```

### 地理位置模拟

```typescript
// 模拟北京位置
await deviceSimulator.setGeolocation({
  latitude: 39.9042,
  longitude: 116.4074,
});

// 清除地理位置
await deviceSimulator.clearGeolocation();
```

### 媒体查询测试

```typescript
// 测试媒体查询
const mediaQueries = [
  '(max-width: 600px)',
  '(min-width: 601px) and (max-width: 1024px)',
  '(min-width: 1025px)',
];

for (const query of mediaQueries) {
  const matches = window.matchMedia(query).matches;
  console.log(`${query}: ${matches}`);
}
```

## 自动化测试

### Playwright 集成

```typescript
import { test, expect } from '@playwright/test';

test('响应式测试', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  const devices = [
    { name: 'iPhone 15', width: 390, height: 844 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
  ];
  
  for (const device of devices) {
    await page.setViewportSize({
      width: device.width,
      height: device.height,
    });
    
    // 检查关键元素
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // 截图
    await page.screenshot({
      path: `screenshots/${device.name}.png`,
    });
  }
});
```

## 最佳实践

### 1. 测试流程

```typescript
async function comprehensiveTest() {
  // 1. 测试移动设备
  await testMobileDevices();
  
  // 2. 测试平板设备
  await testTabletDevices();
  
  // 3. 测试桌面设备
  await testDesktopDevices();
  
  // 4. 测试极端尺寸
  await testExtremeSizes();
}
```

### 2. 性能优化

```typescript
// 避免频繁切换设备
async function batchTest(devices: string[]) {
  // 先加载所有设备配置
  await Promise.all(devices.map(id => deviceSimulator.loadDevice(id)));
  
  // 然后依次测试
  for (const deviceId of devices) {
    await deviceSimulator.setDevice(deviceId);
    // 执行测试
  }
}
```

### 3. 截图管理

```typescript
// 组织截图文件
function organizeScreenshots() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const folder = `screenshots/${timestamp}`;
  
  // 创建文件夹
  // 保存截图到对应文件夹
}
```

## 常见问题

### Q: 如何模拟 Retina 显示屏?

```typescript
// 设置高像素比
await deviceSimulator.createCustomDevice({
  name: 'Retina Display',
  width: 1440,
  height: 900,
  devicePixelRatio: 2, // Retina 显示屏
});
```

### Q: 如何测试横屏模式?

```typescript
// 切换到横屏
await deviceSimulator.setDevice('iphone-15');
deviceSimulator.rotate(); // 旋转到横屏
```

### Q: 如何同时预览多个设备?

```typescript
// 创建多窗口预览
function createMultiDevicePreview() {
  const devices = ['iphone-15', 'ipad-pro', 'macbook-pro'];
  
  devices.forEach(deviceId => {
    const iframe = document.createElement('iframe');
    iframe.src = `${window.location.href}?device=${deviceId}`;
    document.body.appendChild(iframe);
  });
}
```

## 设备配置参考

### 手机设备

| 设备 | 宽度 | 高度 | DPR | 典型用途 |
|------|------|------|-----|----------|
| iPhone SE | 375 | 667 | 2 | 小屏手机 |
| iPhone 15 | 390 | 844 | 3 | 主流手机 |
| iPhone 15 Pro Max | 430 | 932 | 3 | 大屏手机 |
| Samsung Galaxy S24 | 360 | 780 | 3 | Android 主流 |

### 平板设备

| 设备 | 宽度 | 高度 | DPR | 典型用途 |
|------|------|------|-----|----------|
| iPad Air | 820 | 1180 | 2 | 平板竖屏 |
| iPad Pro 12.9" | 1024 | 1366 | 2 | 大屏平板 |
| Surface Pro 9 | 912 | 1368 | 1.5 | Windows 平板 |

### 桌面设备

| 设备 | 宽度 | 高度 | DPR | 典型用途 |
|------|------|------|-----|----------|
| Standard Desktop | 1920 | 1080 | 1 | 主流桌面 |
| MacBook Pro 16" | 1728 | 1117 | 2 | 高分屏 |
| 4K Monitor | 3840 | 2160 | 1 | 超高分屏 |

## 相关资源

- [设备模拟 API 文档](../API文档/设备模拟API文档.md)
- [架构文档 - 设备模拟](../架构文档/系统架构.md#设备模拟)
- [响应式设计最佳实践](./响应式设计最佳实践.md)

---

**维护者**: YYC3 团队  
**反馈渠道**: [GitHub Issues](https://github.com/YanYuCloudCube/YYC3-Family-AI/issues)
