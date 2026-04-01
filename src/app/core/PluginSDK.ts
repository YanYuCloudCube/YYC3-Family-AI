/**
 * @file core/PluginSDK.ts
 * @description 插件开发 SDK - 提供类型安全的插件开发 API
 *              简化插件开发流程，提升开发体验
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags plugin,sdk,development,typescript
 */

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license?: string;
  homepage?: string;
  icon?: string;
  permissions?: PluginPermission[];
  activationEvents?: ActivationEvent[];
}

export type PluginPermission =
  | 'editor:read'
  | 'editor:write'
  | 'ui:panel'
  | 'ui:menu'
  | 'ui:statusbar'
  | 'ai:chat'
  | 'ai:generate'
  | 'events:emit'
  | 'events:listen'
  | 'storage:read'
  | 'storage:write';

export type ActivationEvent = 'onStartup' | 'onEditorOpen' | 'onCommand' | string;

export interface PluginContext {
  /** 插件 ID */
  id: string;
  /** 插件版本 */
  version: string;
  /** 插件路径 */
  path: string;
  /** 全局配置 */
  config: Record<string, unknown>;
}

export interface EditorAPI {
  /** 获取当前文件路径 */
  getActiveFile(): string | null;

  /** 获取文件内容 */
  getFileContent(path: string): Promise<string>;

  /** 设置文件内容 */
  setFileContent(path: string, content: string): Promise<void>;

  /** 获取选中文本 */
  getSelectedText(): string;

  /** 设置选中文本 */
  setSelectedText(text: string): void;

  /** 打开文件 */
  openFile(path: string): Promise<void>;

  /** 列出所有文件 */
  listFiles(): Promise<string[]>;

  /** 创建新文件 */
  createFile(path: string, content?: string): Promise<void>;

  /** 删除文件 */
  deleteFile(path: string): Promise<void>;

  /** 重命名文件 */
  renameFile(oldPath: string, newPath: string): Promise<void>;
}

export interface UIAPI {
  /** 注册面板 */
  registerPanel(options: PanelOptions): PanelHandle;

  /** 注册菜单项 */
  registerMenuItem(options: MenuItemOptions): MenuItemHandle;

  /** 注册状态栏项 */
  registerStatusBarItem(options: StatusBarItemOptions): StatusBarItemHandle;

  /** 显示通知 */
  showNotification(options: NotificationOptions): NotificationHandle;

  /** 显示对话框 */
  showDialog(options: DialogOptions): Promise<DialogResult>;

  /** 显示输入框 */
  showInputBox(options: InputBoxOptions): Promise<string | undefined>;
}

export interface AIAPI {
  /** 发送聊天消息 */
  chat(message: string, options?: ChatOptions): AsyncIterable<string>;

  /** 生成代码 */
  generateCode(prompt: string, options?: GenerateOptions): AsyncIterable<string>;

  /** 获取对话历史 */
  getHistory(): Promise<ChatMessage[]>;

  /** 清除对话历史 */
  clearHistory(): Promise<void>;
}

export interface StorageAPI {
  /** 获取值 */
  get<T>(key: string, defaultValue?: T): Promise<T>;

  /** 设置值 */
  set(key: string, value: unknown): Promise<void>;

  /** 删除值 */
  delete(key: string): Promise<void>;

  /** 清空所有数据 */
  clear(): Promise<void>;

  /** 获取所有键 */
  keys(): Promise<string[]>;
}

export interface EventsAPI {
  /** 监听事件 */
  on(event: string, handler: (...args: unknown[]) => void): () => void;

  /** 发射事件 */
  emit(event: string, ...args: unknown[]): void;

  /** 一次性监听 */
  once(event: string, handler: (...args: unknown[]) => void): () => void;
}

export interface PluginAPI {
  editor: EditorAPI;
  ui: UIAPI;
  ai: AIAPI;
  storage: StorageAPI;
  events: EventsAPI;
  logger: LoggerAPI;
}

export interface LoggerAPI {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface PanelOptions {
  id: string;
  title: string;
  icon?: string;
  position?: 'left' | 'right' | 'bottom';
  render: (container: HTMLElement) => () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export interface MenuItemOptions {
  id: string;
  label: string;
  menu?: 'editor' | 'view' | 'help' | string;
  shortcut?: string;
  icon?: string;
  action: () => void | Promise<void>;
}

export interface StatusBarItemOptions {
  id: string;
  text: string;
  icon?: string;
  tooltip?: string;
  command?: string;
  color?: string;
}

export interface NotificationOptions {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
}

export interface DialogOptions {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error';
  buttons?: DialogButton[];
}

export interface DialogButton {
  label: string;
  type?: 'default' | 'primary' | 'danger';
}

export interface DialogResult {
  button: string;
  checked?: boolean;
}

export interface InputBoxOptions {
  title: string;
  placeholder?: string;
  value?: string;
  password?: boolean;
  validate?: (value: string) => string | null;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GenerateOptions {
  language?: string;
  framework?: string;
  style?: string;
  stream?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export type PanelHandle = () => void;
export type MenuItemHandle = () => void;
export type StatusBarItemHandle = {
  update(options: Partial<StatusBarItemOptions>): void;
  dispose: () => void;
};
export type NotificationHandle = () => void;

export abstract class BasePlugin {
  protected api!: PluginAPI;
  protected context!: PluginContext;

  constructor(protected manifest: PluginManifest) {}

  async activate(api: PluginAPI, context: PluginContext): Promise<void> {
    this.api = api;
    this.context = context;
    await this.onActivate();
  }

  async deactivate(): Promise<void> {
    await this.onDeactivate();
  }

  protected abstract onActivate(): Promise<void> | void;
  protected abstract onDeactivate(): Promise<void> | void;

  protected get config(): Record<string, unknown> {
    return this.context.config;
  }

  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
    this.api.logger[level](`[${this.manifest.name}] ${message}`, ...args);
  }
}

export function createPlugin(
  manifest: PluginManifest,
  implementation: new (manifest: PluginManifest) => BasePlugin
): { manifest: PluginManifest; implementation: new (manifest: PluginManifest) => BasePlugin } {
  return {
    manifest,
    implementation,
  };
}

export function validateManifest(manifest: PluginManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest.name || manifest.name.trim() === '') {
    errors.push('Plugin name is required');
  }

  if (!manifest.version || manifest.version.trim() === '') {
    errors.push('Plugin version is required');
  }

  if (!manifest.description || manifest.description.trim() === '') {
    errors.push('Plugin description is required');
  }

  if (!manifest.author || manifest.author.trim() === '') {
    errors.push('Plugin author is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createPluginBuilder(name: string) {
  return new PluginBuilder(name);
}

export class PluginBuilder {
  private manifest: Partial<PluginManifest> = {
    version: '1.0.0',
    description: '',
    author: '',
    permissions: [],
    activationEvents: [],
  };

  constructor(private name: string) {
    this.manifest.name = name;
  }

  version(version: string): this {
    this.manifest.version = version;
    return this;
  }

  description(description: string): this {
    this.manifest.description = description;
    return this;
  }

  author(author: string): this {
    this.manifest.author = author;
    return this;
  }

  license(license: string): this {
    this.manifest.license = license;
    return this;
  }

  homepage(homepage: string): this {
    this.manifest.homepage = homepage;
    return this;
  }

  icon(icon: string): this {
    this.manifest.icon = icon;
    return this;
  }

  permission(...permissions: PluginPermission[]): this {
    this.manifest.permissions = [...(this.manifest.permissions || []), ...permissions];
    return this;
  }

  activateOn(...events: ActivationEvent[]): this {
    this.manifest.activationEvents = [...(this.manifest.activationEvents || []), ...events];
    return this;
  }

  build(): PluginManifest {
    const validation = validateManifest(this.manifest as PluginManifest);
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
    }
    return this.manifest as PluginManifest;
  }
}
