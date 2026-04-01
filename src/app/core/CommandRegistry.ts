/**
 * @file core/CommandRegistry.ts
 * @description 命令注册表 - 统一管理应用命令、快捷键、菜单项
 *              提供类型安全的命令注册和执行机制
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags commands,registry,shortcuts,keyboard
 */

export interface CommandDefinition {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: string;
  shortcut?: string | string[];
  when?: string;
  handler: CommandHandler;
  enabled?: () => boolean;
}

export type CommandHandler = (...args: unknown[]) => void | Promise<void>;

export interface CommandContext {
  /** 命令 ID */
  commandId: string;
  /** 执行时间 */
  timestamp: number;
  /** 参数 */
  args: unknown[];
  /** 来源 */
  source: 'keyboard' | 'menu' | 'palette' | 'api';
}

export interface CommandResult {
  success: boolean;
  error?: Error;
  duration: number;
}

export interface CommandPaletteOptions {
  placeholder?: string;
  filter?: (command: CommandDefinition) => boolean;
  sort?: (a: CommandDefinition, b: CommandDefinition) => number;
}

export class CommandRegistry {
  private commands = new Map<string, CommandDefinition>();
  private shortcuts = new Map<string, Set<string>>();
  private history: string[] = [];
  private maxHistorySize = 50;

  register(command: CommandDefinition): void {
    if (this.commands.has(command.id)) {
      throw new Error(`Command "${command.id}" already registered`);
    }

    this.commands.set(command.id, command);

    if (command.shortcut) {
      const shortcuts = Array.isArray(command.shortcut) ? command.shortcut : [command.shortcut];
      for (const shortcut of shortcuts) {
        if (!this.shortcuts.has(shortcut)) {
          this.shortcuts.set(shortcut, new Set());
        }
        this.shortcuts.get(shortcut)!.add(command.id);
      }
    }
  }

  unregister(commandId: string): boolean {
    const command = this.commands.get(commandId);
    if (!command) return false;

    if (command.shortcut) {
      const shortcuts = Array.isArray(command.shortcut) ? command.shortcut : [command.shortcut];
      for (const shortcut of shortcuts) {
        const commandIds = this.shortcuts.get(shortcut);
        if (commandIds) {
          commandIds.delete(commandId);
          if (commandIds.size === 0) {
            this.shortcuts.delete(shortcut);
          }
        }
      }
    }

    return this.commands.delete(commandId);
  }

  execute(commandId: string, ...args: unknown[]): Promise<CommandResult> {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error(`Command "${commandId}" not found`);
    }

    if (command.enabled && !command.enabled()) {
      return Promise.resolve({
        success: false,
        error: new Error('Command is disabled'),
        duration: 0,
      });
    }

    const startTime = Date.now();
    const context: CommandContext = {
      commandId,
      timestamp: startTime,
      args,
      source: 'api',
    };

    try {
      await command.handler(...args);

      this.addToHistory(commandId);

      return {
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime,
      };
    }
  }

  executeByShortcut(shortcut: string): Promise<CommandResult | null> {
    const commandIds = this.shortcuts.get(shortcut);
    if (!commandIds || commandIds.size === 0) {
      return Promise.resolve(null);
    }

    const commandId = Array.from(commandIds)[0];
    return this.execute(commandId);
  }

  getCommand(commandId: string): CommandDefinition | undefined {
    return this.commands.get(commandId);
  }

  getAllCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory(category: string): CommandDefinition[] {
    return this.getAllCommands().filter((cmd) => cmd.category === category);
  }

  searchCommands(query: string): CommandDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllCommands().filter((cmd) => {
      const titleMatch = cmd.title.toLowerCase().includes(lowerQuery);
      const descMatch = cmd.description?.toLowerCase().includes(lowerQuery);
      const idMatch = cmd.id.toLowerCase().includes(lowerQuery);
      return titleMatch || descMatch || idMatch;
    });
  }

  getHistory(): string[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const command of this.commands.values()) {
      if (command.category) {
        categories.add(command.category);
      }
    }
    return Array.from(categories).sort();
  }

  private addToHistory(commandId: string): void {
    const index = this.history.indexOf(commandId);
    if (index > -1) {
      this.history.splice(index, 1);
    }
    this.history.unshift(commandId);
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }
  }
}

let globalCommandRegistry: CommandRegistry | null = null;

export function getCommandRegistry(): CommandRegistry {
  if (!globalCommandRegistry) {
    globalCommandRegistry = new CommandRegistry();
  }
  return globalCommandRegistry;
}

export function registerCommand(command: CommandDefinition): void {
  getCommandRegistry().register(command);
}

export function unregisterCommand(commandId: string): boolean {
  return getCommandRegistry().unregister(commandId);
}

export function executeCommand(commandId: string, ...args: unknown[]): Promise<CommandResult> {
  return getCommandRegistry().execute(commandId, ...args);
}

export function createCommandBuilder(id: string, title: string) {
  return new CommandBuilder(id, title);
}

export class CommandBuilder {
  private definition: Partial<CommandDefinition> = {
    id,
    title,
  };

  constructor(private id: string, private title: string) {}

  description(desc: string): this {
    this.definition.description = desc;
    return this;
  }

  category(cat: string): this {
    this.definition.category = cat;
    return this;
  }

  icon(iconName: string): this {
    this.definition.icon = iconName;
    return this;
  }

  shortcut(shortcut: string | string[]): this {
    this.definition.shortcut = shortcut;
    return this;
  }

  when(condition: string): this {
    this.definition.when = condition;
    return this;
  }

  handler(handler: CommandHandler): this {
    this.definition.handler = handler;
    return this;
  }

  enabled(checker: () => boolean): this {
    this.definition.enabled = checker;
    return this;
  }

  build(): CommandDefinition {
    if (!this.definition.handler) {
      throw new Error('Command handler is required');
    }
    return this.definition as CommandDefinition;
  }

  register(): void {
    registerCommand(this.build());
  }
}