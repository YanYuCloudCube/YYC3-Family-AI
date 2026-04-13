# YYC³ Family-AI Tauri 桌面端打包指南

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*

---

## 📋 文档信息

| 属性 | 值 |
|------|-----|
| **文档名称** | YYC³ Family-AI Tauri 桌面端打包指南 |
| **版本** | v1.0.0 |
| **创建日期** | 2026-04-04 |
| **适用项目** | YYC3-Family-AI |
| **许可证** | MIT |

---

## 🎯 一、为什么选择 Tauri？

### 1.1 Tauri vs Electron 对比

| 特性 | Tauri | Electron |
|------|-------|----------|
| **安装包大小** | ~10MB | ~150MB |
| **内存占用** | ~100MB | ~300MB |
| **启动速度** | 快 | 较慢 |
| **系统 WebView** | 使用系统原生 | 内置 Chromium |
| **安全性** | 更高 | 一般 |
| **Rust 后端** | ✅ 原生支持 | ❌ 需要 Node.js |
| **跨平台** | Windows/macOS/Linux | Windows/macOS/Linux |

### 1.2 Tauri 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri 应用架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Frontend (WebView)                    │   │
│  │  ├─ React + TypeScript                             │   │
│  │  ├─ Vite 构建                                      │   │
│  │  └─ 与 YYC³ Web 版共享代码                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                     IPC (JSON-RPC)                          │
│                            │                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Backend (Rust)                        │   │
│  │  ├─ 文件系统访问                                   │   │
│  │  ├─ 系统托盘                                       │   │
│  │  ├─ 窗口管理                                       │   │
│  │  ├─ 自动更新                                       │   │
│  │  └─ 原生 API                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 二、环境准备

### 2.1 系统要求

| 平台 | 要求 |
|------|------|
| **Windows** | Windows 10+, Visual Studio Build Tools |
| **macOS** | macOS 10.15+, Xcode Command Line Tools |
| **Linux** | Ubuntu 18.04+,webkit2gtk, openssl |

### 2.2 安装 Rust

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# 下载并运行 https://win.rustup.rs/

# 验证安装
rustc --version
cargo --version
```

### 2.3 安装 Tauri CLI

```bash
# 全局安装
cargo install tauri-cli

# 或作为项目依赖
pnpm add -D @tauri-apps/cli
```

---

## 🛠️ 三、项目配置

### 3.1 初始化 Tauri

```bash
cd YYC3-Family-AI

# 初始化 Tauri
pnpm tauri init
```

### 3.2 目录结构

```
YYC3-Family-AI/
├── src/                    # 前端源码
├── src-tauri/              # Tauri 后端
│   ├── src/
│   │   ├── main.rs         # Rust 入口
│   │   └── lib.rs          # 库文件
│   ├── Cargo.toml          # Rust 依赖
│   ├── tauri.conf.json     # Tauri 配置
│   ├── icons/              # 应用图标
│   └── build.rs            # 构建脚本
├── package.json
└── vite.config.ts
```

### 3.3 tauri.conf.json 配置

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/schema.json",
  "build": {
    "beforeBuildCommand": "pnpm build",
    "beforeDevCommand": "pnpm dev",
    "devPath": "http://localhost:3126",
    "distDir": "../dist"
  },
  "package": {
    "productName": "YYC³ Family AI",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "scope": ["$APPDATA/**", "$DOCUMENT/**", "$DOWNLOAD/**"]
      },
      "shell": {
        "open": true
      },
      "dialog": {
        "all": true
      },
      "clipboard": {
        "all": true
      },
      "notification": {
        "all": true
      },
      "window": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "category": "DeveloperTool",
      "copyright": "Copyright (c) 2026 YanYuCloudCube Team",
      "deb": {
        "depends": []
      },
      "externalBin": [],
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "identifier": "com.yyccube.family-ai",
      "longDescription": "YYC³ Family AI - 开源本地 AI 编程助手",
      "macOS": {
        "entitlements": null,
        "exceptionDomain": "",
        "frameworks": [],
        "providerShortName": null,
        "signingIdentity": null
      },
      "resources": [],
      "shortDescription": "YYC³ Family AI",
      "targets": "all",
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    },
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://open.bigmodel.cn https://api.deepseek.com"
    },
    "updater": {
      "active": true,
      "endpoints": ["https://releases.yyccube.xin/tauri/{{target}}/{{arch}}/{{current_version}}"],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    },
    "windows": [
      {
        "fullscreen": false,
        "height": 900,
        "resizable": true,
        "title": "YYC³ Family AI",
        "width": 1400,
        "minWidth": 1024,
        "minHeight": 768,
        "center": true,
        "decorations": true,
        "transparent": false
      }
    ],
    "systemTray": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true,
      "menuOnLeftClick": false
    }
  }
}
```

### 3.4 Cargo.toml 配置

```toml
[package]
name = "yyc3-family-ai"
version = "1.0.0"
description = "YYC³ Family AI - 开源本地 AI 编程助手"
authors = ["YanYuCloudCube Team <admin@0379.email>"]
license = "MIT"
repository = "https://github.com/YanYuCloudCube/YYC3-Family-AI"
edition = "2021"
rust-version = "1.70"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
tauri = { version = "1.6", features = ["dialog-all", "fs-all", "notification-all", "shell-open", "window-all", "system-tray", "updater"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "z"
strip = true
```

---

## 🦀 四、Rust 后端实现

### 4.1 main.rs

```rust
// src-tauri/src/main.rs

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                // 最小化到托盘而不是关闭
                event.window().minimize().unwrap();
                api.prevent_close();
            }
        })
        .system_tray(system_tray())
        .on_system_tray_event(|app, event| match event {
            tauri::SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            tauri::SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn system_tray() -> tauri::SystemTray {
    let quit = tauri::CustomMenuItem::new("quit".to_string(), "退出");
    let show = tauri::CustomMenuItem::new("show".to_string(), "显示窗口");
    let tray_menu = tauri::SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);

    tauri::SystemTray::new().with_menu(tray_menu)
}
```

### 4.2 自定义命令

```rust
// src-tauri/src/lib.rs

use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppInfo {
    name: String,
    version: String,
    platform: String,
}

#[command]
pub fn get_app_info() -> AppInfo {
    AppInfo {
        name: "YYC³ Family AI".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
    }
}

#[command]
pub async fn read_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    tokio::fs::write(&path, content)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub fn open_external(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| e.to_string())
}
```

---

## 🖥️ 五、前端集成

### 5.1 Tauri API 封装

```typescript
// src/app/utils/tauri-api.ts

/**
 * @file tauri-api.ts
 * @description Tauri API 封装，提供类型安全的调用接口
 */

import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';
import { sendNotification } from '@tauri-apps/api/notification';

// 检测是否在 Tauri 环境中
export const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// 应用信息
export interface AppInfo {
  name: string;
  version: string;
  platform: string;
}

// 获取应用信息
export async function getAppInfo(): Promise<AppInfo | null> {
  if (!isTauri) return null;
  return invoke<AppInfo>('get_app_info');
}

// 文件对话框
export async function openFileDialog(options?: {
  multiple?: boolean;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | string[] | null> {
  if (!isTauri) {
    // Web 回退：使用 input 元素
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options?.multiple || false;
      input.onchange = () => {
        const files = Array.from(input.files || []).map((f) => f.name);
        resolve(options?.multiple ? files : files[0] || null);
      };
      input.click();
    });
  }
  return open(options);
}

// 读取文件
export async function readFile(path: string): Promise<string> {
  if (!isTauri) {
    throw new Error('File system access requires Tauri');
  }
  return readTextFile(path);
}

// 写入文件
export async function writeFile(path: string, content: string): Promise<void> {
  if (!isTauri) {
    throw new Error('File system access requires Tauri');
  }
  return writeTextFile(path, content);
}

// 发送通知
export async function showNotification(title: string, body: string): Promise<void> {
  if (!isTauri) {
    // Web 回退：使用浏览器通知
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return;
  }
  await sendNotification({ title, body });
}

// 窗口控制
export const windowControls = {
  minimize: () => isTauri && appWindow.minimize(),
  maximize: () => isTauri && appWindow.toggleMaximize(),
  close: () => isTauri && appWindow.close(),
  show: () => isTauri && appWindow.show(),
  hide: () => isTauri && appWindow.hide(),
  setFocus: () => isTauri && appWindow.setFocus(),
};
```

### 5.2 条件渲染

```tsx
// src/app/components/TauriTitleBar.tsx

import { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { isTauri, windowControls } from '../utils/tauri-api';

export function TauriTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isTauri) return;
    
    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });
    
    return () => { unlisten.then(f => f()); };
  }, []);

  if (!isTauri) return null;

  return (
    <div className="h-8 bg-slate-900 flex items-center justify-between drag-region">
      <div className="flex items-center px-3">
        <span className="text-xs text-slate-400">YYC³ Family AI</span>
      </div>
      
      <div className="flex items-center no-drag">
        <button
          onClick={windowControls.minimize}
          className="w-12 h-8 flex items-center justify-center hover:bg-slate-800"
        >
          <Minus className="w-4 h-4 text-slate-400" />
        </button>
        <button
          onClick={windowControls.maximize}
          className="w-12 h-8 flex items-center justify-center hover:bg-slate-800"
        >
          <Square className="w-3 h-3 text-slate-400" />
        </button>
        <button
          onClick={windowControls.close}
          className="w-12 h-8 flex items-center justify-center hover:bg-red-500"
        >
          <X className="w-4 h-4 text-slate-400 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
```

---

## 🚀 六、构建与发布

### 6.1 开发模式

```bash
# 启动开发服务器
pnpm tauri dev
```

### 6.2 构建生产版本

```bash
# 构建所有平台
pnpm tauri build

# 仅构建特定平台
pnpm tauri build --target x86_64-pc-windows-msvc  # Windows
pnpm tauri build --target x86_64-apple-darwin     # macOS Intel
pnpm tauri build --target aarch64-apple-darwin    # macOS Apple Silicon
pnpm tauri build --target x86_64-unknown-linux-gnu # Linux
```

### 6.3 输出文件

```
src-tauri/target/release/bundle/
├── dmg/
│   └── YYC³ Family AI_1.0.0_x64.dmg      # macOS
├── msi/
│   └── YYC³ Family AI_1.0.0_x64.msi      # Windows
├── deb/
│   └── yyc3-family-ai_1.0.0_amd64.deb    # Linux (Debian)
└── appimage/
    └── yyc3-family-ai_1.0.0_amd64.AppImage # Linux (AppImage)
```

### 6.4 自动更新配置

```rust
// 在 tauri.conf.json 中配置
"updater": {
  "active": true,
  "endpoints": [
    "https://releases.yyccube.xin/tauri/{{target}}/{{arch}}/{{current_version}}"
  ],
  "dialog": true,
  "pubkey": "YOUR_PUBLIC_KEY"
}
```

```jsonc
// 更新服务器响应格式
{
  "version": "1.1.0",
  "notes": "新功能：支持离线模式",
  "pub_date": "2026-04-04T00:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "CONTENT_OF_THE_.SIG_FILE",
      "url": "https://releases.yyccube.xin/tauri/yyc3-family-ai_1.1.0_x64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "CONTENT_OF_THE_.SIG_FILE",
      "url": "https://releases.yyccube.xin/tauri/yyc3-family-ai_1.1.0_aarch64.app.tar.gz"
    },
    "windows-x86_64": {
      "signature": "CONTENT_OF_THE_.SIG_FILE",
      "url": "https://releases.yyccube.xin/tauri/yyc3-family-ai_1.1.0_x64-setup.nsis.zip"
    }
  }
}
```

---

## 📊 七、性能优化

### 7.1 Rust 优化

```toml
# Cargo.toml
[profile.release]
panic = "abort"        # 减小二进制大小
codegen-units = 1      # 更好的优化
lto = true             # 链接时优化
opt-level = "z"        # 最小化大小
strip = true           # 移除符号
```

### 7.2 前端优化

```typescript
// vite.config.ts - 确保 Tauri 兼容
export default defineConfig({
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

---

## 🔒 八、安全配置

### 8.1 CSP 配置

```json
// tauri.conf.json
"security": {
  "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://open.bigmodel.cn"
}
```

### 8.2 权限控制

```json
// tauri.conf.json - 最小权限原则
"allowlist": {
  "all": false,
  "fs": {
    "all": false,
    "readFile": true,
    "writeFile": true,
    "scope": ["$APPDATA/**", "$DOCUMENT/**"]
  },
  "shell": {
    "open": true
  }
}
```

---

## 📚 九、相关资源

| 资源 | 链接 |
|------|------|
| Tauri 官方文档 | https://tauri.app/v1/guides |
| Tauri API 参考 | https://tauri.app/v1/api/js |
| Rust 学习 | https://www.rust-lang.org/learn |
| YYC³ GitHub | https://github.com/YanYuCloudCube/YYC3-Family-AI |

---

**文档版本**: v1.0.0
**最后更新**: 2026-04-04
**维护者**: YanYuCloudCube Team
**许可证**: MIT
