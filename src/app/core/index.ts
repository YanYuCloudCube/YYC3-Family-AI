/**
 * @file core/index.ts
 * @description 核心模块统一导出 - 提供类型安全的 API 访问
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags core,exports,api,typescript
 */

export { AIOrchestrator, createAIOrchestrator } from './AIOrchestrator';
export type {
  AIOrchestratorConfig,
  AIMiddleware,
  AIOrchestratorOptions,
  AIOrchestratorResult,
} from './AIOrchestrator';

export { StateManager, getStateManager, createStoreHelper } from './StateManager';
export type {
  StateManagerConfig,
  StoreDescriptor,
} from './StateManager';

export { BasePlugin, createPlugin, createPluginBuilder, validateManifest } from './PluginSDK';
export type {
  PluginManifest,
  PluginPermission,
  ActivationEvent,
  PluginContext,
  PluginAPI,
  EditorAPI,
  UIAPI,
  AIAPI,
  StorageAPI,
  EventsAPI,
  LoggerAPI,
  PanelOptions,
  MenuItemOptions,
  StatusBarItemOptions,
  NotificationOptions,
  DialogOptions,
  InputBoxOptions,
  ChatOptions,
  GenerateOptions,
  ChatMessage,
} from './PluginSDK';

export { CommandRegistry, getCommandRegistry, registerCommand, unregisterCommand, executeCommand, createCommandBuilder } from './CommandRegistry';
export type {
  CommandDefinition,
  CommandHandler,
  CommandContext,
  CommandResult,
  CommandPaletteOptions,
} from './CommandRegistry';

export { EventBus, getEventBus, resetEventBus, createTypedEventBus } from './EventBus';
export type {
  EventHandler,
  EventSubscription,
  EventBusConfig,
  EventMetadata,
  PrioritizedEvent,
} from './EventBus';

export { ExtensionSystem, getExtensionSystem, resetExtensionSystem, createExtensionBuilder } from './ExtensionSystem';
export type {
  ExtensionPoint,
  ExtensionHandler,
  ExtensionContext,
  ExtensionManifest,
  ExtensionDependency,
  ExtensionLoadResult,
  ExtensionSystemConfig,
} from './ExtensionSystem';

export { createAIOrchestrator as createOrchestrator } from './AIOrchestrator';
export { getStateManager as getStoreManager } from './StateManager';
export { getCommandRegistry as getCommands } from './CommandRegistry';
export { getEventBus as getEvents } from './EventBus';
export { getExtensionSystem as getExtensions } from './ExtensionSystem';

export { createPluginBuilder as buildPlugin } from './PluginSDK';
export { createCommandBuilder as buildCommand } from './CommandRegistry';
export { createExtensionBuilder as buildExtension } from './ExtensionSystem';
