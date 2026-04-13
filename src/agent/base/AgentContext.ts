/**
 * @file: AgentContext.ts
 * @description: Multi-Agent 系统智能体上下文管理
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,context,management
 */

import type {
  AgentContext,
  TabInfo,
  GitChange,
  ConversationMessage,
  UserPreferences,
} from '../types';

export interface AgentContextOptions {
  projectId: string;
  conversationId: string;
  fileContents?: Record<string, string>;
  activeFile?: string;
  openTabs?: TabInfo[];
  gitBranch?: string;
  gitChanges?: GitChange[];
  conversationHistory?: ConversationMessage[];
  userPreferences?: Partial<UserPreferences>;
}

export class AgentContextManager {
  private _context: AgentContext;

  constructor(options: AgentContextOptions) {
    this._context = {
      projectId: options.projectId,
      conversationId: options.conversationId,
      fileContents: options.fileContents ?? {},
      activeFile: options.activeFile,
      openTabs: options.openTabs ?? [],
      gitBranch: options.gitBranch ?? 'main',
      gitChanges: options.gitChanges ?? [],
      persistentMemory: new Map(),
      conversationHistory: options.conversationHistory ?? [],
      userPreferences: {
        codeStyle: 'documented',
        testCoverage: 'standard',
        reviewDepth: 'standard',
        language: 'zh-CN',
        ...options.userPreferences,
      },
    };
  }

  get context(): AgentContext {
    return this._context;
  }

  updateFileContents(files: Record<string, string>): void {
    this._context.fileContents = {
      ...this._context.fileContents,
      ...files,
    };
  }

  updateActiveFile(path: string | undefined): void {
    this._context.activeFile = path;
  }

  updateOpenTabs(tabs: TabInfo[]): void {
    this._context.openTabs = tabs;
  }

  updateGitInfo(branch: string, changes: GitChange[]): void {
    this._context.gitBranch = branch;
    this._context.gitChanges = changes;
  }

  addConversationMessage(message: ConversationMessage): void {
    this._context.conversationHistory.push(message);
  }

  setMemory(key: string, value: unknown): void {
    this._context.persistentMemory.set(key, value);
  }

  getMemory<T = unknown>(key: string): T | undefined {
    return this._context.persistentMemory.get(key) as T | undefined;
  }

  hasMemory(key: string): boolean {
    return this._context.persistentMemory.has(key);
  }

  deleteMemory(key: string): boolean {
    return this._context.persistentMemory.delete(key);
  }

  clearMemory(): void {
    this._context.persistentMemory.clear();
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    this._context.userPreferences = {
      ...this._context.userPreferences,
      ...preferences,
    };
  }

  getFileContent(path: string): string | undefined {
    return this._context.fileContents[path];
  }

  getActiveFileContent(): string | undefined {
    if (!this._context.activeFile) {
      return undefined;
    }
    return this._context.fileContents[this._context.activeFile];
  }

  getRecentConversation(count: number = 10): ConversationMessage[] {
    return this._context.conversationHistory.slice(-count);
  }

  summarize(): AgentContextSummary {
    return {
      projectId: this._context.projectId,
      conversationId: this._context.conversationId,
      fileCount: Object.keys(this._context.fileContents).length,
      activeFile: this._context.activeFile,
      openTabCount: this._context.openTabs.length,
      gitBranch: this._context.gitBranch,
      gitChangeCount: this._context.gitChanges.length,
      memoryEntryCount: this._context.persistentMemory.size,
      conversationLength: this._context.conversationHistory.length,
    };
  }

  clone(): AgentContextManager {
    const cloned = new AgentContextManager({
      projectId: this._context.projectId,
      conversationId: this._context.conversationId,
      fileContents: { ...this._context.fileContents },
      activeFile: this._context.activeFile,
      openTabs: [...this._context.openTabs],
      gitBranch: this._context.gitBranch,
      gitChanges: [...this._context.gitChanges],
      conversationHistory: [...this._context.conversationHistory],
      userPreferences: { ...this._context.userPreferences },
    });

    for (const [key, value] of this._context.persistentMemory) {
      cloned.setMemory(key, value);
    }

    return cloned;
  }

  toJSON(): string {
    return JSON.stringify({
      ...this._context,
      persistentMemory: Object.fromEntries(this._context.persistentMemory),
    });
  }

  static fromJSON(json: string): AgentContextManager {
    const data = JSON.parse(json);
    const manager = new AgentContextManager({
      projectId: data.projectId,
      conversationId: data.conversationId,
      fileContents: data.fileContents,
      activeFile: data.activeFile,
      openTabs: data.openTabs,
      gitBranch: data.gitBranch,
      gitChanges: data.gitChanges,
      conversationHistory: data.conversationHistory,
      userPreferences: data.userPreferences,
    });

    if (data.persistentMemory) {
      for (const [key, value] of Object.entries(data.persistentMemory)) {
        manager.setMemory(key, value);
      }
    }

    return manager;
  }
}

export interface AgentContextSummary {
  projectId: string;
  conversationId: string;
  fileCount: number;
  activeFile?: string;
  openTabCount: number;
  gitBranch: string;
  gitChangeCount: number;
  memoryEntryCount: number;
  conversationLength: number;
}

export function createAgentContext(options: AgentContextOptions): AgentContextManager {
  return new AgentContextManager(options);
}
