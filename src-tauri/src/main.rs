// Prevent the additional file descriptor being opened on windows
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::mpsc::channel;
use std::time::Duration;
use tauri::Manager;

#[derive(Serialize, Deserialize)]
struct FileWatchEvent {
    path: String,
    event_type: String,
    timestamp: u64,
}

#[tauri::command]
fn pick_file() -> Result<String, String> {
    // 在浏览器环境中使用，这里仅作为示例
    // 实际文件选择在前端通过 dialog API 实现
    Ok("".to_string())
}

#[tauri::command]
fn save_file(default_path: String) -> Result<String, String> {
    // 在浏览器环境中使用，这里仅作为示例
    // 实际文件保存在前端通过 dialog API 实现
    Ok(default_path)
}

#[tauri::command]
fn watch_file(path: String) -> Result<String, String> {
    let (tx, rx) = channel();

    // 创建文件监控器
    let mut watcher = RecommendedWatcher::new(
        move |res: Result<notify::Event, notify::Error>| {
            if let Ok(event) = res {
                let event_type = match event.kind {
                    notify::EventKind::Create(_) => "created",
                    notify::EventKind::Modify(_) => "modified",
                    notify::EventKind::Remove(_) => "deleted",
                    _ => return,
                };

                let event_data = FileWatchEvent {
                    path: path.clone(),
                    event_type: event_type.to_string(),
                    timestamp: std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis() as u64,
                };

                // 发送事件到前端
                tx.send(event_data).unwrap();
            }
        },
        Config::default(),
    )
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    // 开始监控
    watcher
        .watch(Path::new(&path), RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch file: {}", e))?;

    // 在后台线程中监听事件
    std::thread::spawn(move || {
        for event in rx {
            // 发送事件到前端
            // 这里需要通过 tauri 的事件系统发送
        }
    });

    Ok("watch_started".to_string())
}

#[tauri::command]
fn send_notification(title: String, body: String) -> Result<(), String> {
    // 系统通知通过前端 API 实现
    Ok(())
}

#[tauri::command]
fn get_system_info() -> Result<SystemInfo, String> {
    use sysinfo::{System, SystemExt};

    let system = System::new_all();

    Ok(SystemInfo {
        os: system.name().unwrap_or("unknown".to_string()),
        arch: std::env::consts::ARCH.to_string(),
        version: system.os_version().unwrap_or("unknown".to_string()),
        hostname: system.host_name().unwrap_or("unknown".to_string()),
        username: whoami::username(),
    })
}

#[tauri::command]
fn exec_command(command: String, args: Vec<String>) -> Result<String, String> {
    use std::process::Command;

    let output = Command::new(&command)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute command: {}", e))?;

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    use std::process::Command;

    #[cfg(target_os = "windows")]
    let result = Command::new("cmd")
        .args(&["/C", "start", "", &url])
        .spawn();

    #[cfg(target_os = "macos")]
    let result = Command::new("open").arg(&url).spawn();

    #[cfg(target_os = "linux")]
    let result = Command::new("xdg-open").arg(&url).spawn();

    result.map_err(|e| format!("Failed to open URL: {}", e))?;
    Ok(())
}

#[tauri::command]
fn read_clipboard() -> Result<String, String> {
    use arboard::Clipboard;

    let mut clipboard = Clipboard::new().map_err(|e| format!("Failed to init clipboard: {}", e))?;
    let text = clipboard
        .get_text()
        .map_err(|e| format!("Failed to read clipboard: {}", e))?;
    Ok(text)
}

#[tauri::command]
fn write_clipboard(text: String) -> Result<(), String> {
    use arboard::Clipboard;

    let mut clipboard = Clipboard::new().map_err(|e| format!("Failed to init clipboard: {}", e))?;
    clipboard
        .set_text(&text)
        .map_err(|e| format!("Failed to write clipboard: {}", e))?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
struct SystemInfo {
    os: String,
    arch: String,
    version: String,
    hostname: String,
    username: String,
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            pick_file,
            save_file,
            watch_file,
            send_notification,
            get_system_info,
            exec_command,
            open_url,
            read_clipboard,
            write_clipboard,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
