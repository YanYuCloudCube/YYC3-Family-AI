/**
 * @file: CoderAgent.test.ts
 * @description: CoderAgent 单元测试
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,agent,coder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CoderAgent, createCoderAgent, type CodeGenerationOptions } from '../agent/agents/CoderAgent';
import type { AgentTask, AgentContext } from '../agent/types';

describe('CoderAgent', () => {
  let coderAgent: CoderAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    coderAgent = createCoderAgent();

    mockContext = {
      projectId: 'test-project',
      conversationId: 'test-conversation',
      fileContents: {
        'src/components/Test.tsx': `import React from 'react';\n\nexport const Test = () => <div>Test</div>;`,
        'src/utils/helper.ts': `export const helper = () => {};`,
      },
      activeFile: 'src/components/Test.tsx',
      openTabs: [],
      gitBranch: 'main',
      gitChanges: [],
      persistentMemory: new Map(),
      conversationHistory: [],
      userPreferences: {
        codeStyle: 'concise',
        testCoverage: 'standard',
        reviewDepth: 'standard',
        language: 'zh-CN',
      },
    };
  });

  describe('detectLanguage', () => {
    it('should detect TypeScript from file extension', async () => {
      await coderAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'generate',
        description: 'Create a component',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: '创建一个新的组件',
          context: mockContext as unknown as Record<string, unknown>,
        },
        dependencies: [],
        constraints: { timeout: 60000, maxRetries: 3 },
        metadata: {
          source: 'user',
          conversationId: 'test',
          projectId: 'test',
          tags: [],
        },
        createdAt: Date.now(),
      };

      const result = await coderAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.output.artifacts).toBeDefined();
    });

    it('should detect language from message content', async () => {
      await coderAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'generate',
        description: 'Create Python script',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: '创建一个 Python 脚本',
          context: {},
        },
        dependencies: [],
        constraints: { timeout: 60000, maxRetries: 3 },
        metadata: {
          source: 'user',
          conversationId: 'test',
          projectId: 'test',
          tags: [],
        },
        createdAt: Date.now(),
      };

      const result = await coderAgent.execute(task);

      expect(result.status).toBe('success');
    });
  });

  describe('extractComponentName', () => {
    it('should extract component name from message', async () => {
      await coderAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'generate',
        description: 'Create UserProfile component',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'create a UserProfile component',
          context: {},
        },
        dependencies: [],
        constraints: { timeout: 60000, maxRetries: 3 },
        metadata: {
          source: 'user',
          conversationId: 'test',
          projectId: 'test',
          tags: [],
        },
        createdAt: Date.now(),
      };

      const result = await coderAgent.execute(task);

      expect(result.status).toBe('success');
      const artifacts = result.output.artifacts as Array<{ path: string }>;
      expect(artifacts[0].path).toContain('UserProfile');
    });
  });

  describe('generateCode', () => {
    it('should generate React component', async () => {
      await coderAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'generate',
        description: 'Create React component',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: '创建一个 React Button 组件',
          context: mockContext as unknown as Record<string, unknown>,
        },
        dependencies: [],
        constraints: { timeout: 60000, maxRetries: 3 },
        metadata: {
          source: 'user',
          conversationId: 'test',
          projectId: 'test',
          tags: [],
        },
        createdAt: Date.now(),
      };

      const result = await coderAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.artifacts).toBeDefined();
      expect(result.artifacts!.length).toBeGreaterThan(0);
      expect(result.output.summary).toContain('Generated');
    });

    it('should generate code with tests when enabled', async () => {
      const agentWithTests = createCoderAgent({}, { includeTests: true });
      await agentWithTests.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'generate',
        description: 'Create component with tests',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: '创建一个 Card 组件',
          context: mockContext as unknown as Record<string, unknown>,
        },
        dependencies: [],
        constraints: { timeout: 60000, maxRetries: 3 },
        metadata: {
          source: 'user',
          conversationId: 'test',
          projectId: 'test',
          tags: [],
        },
        createdAt: Date.now(),
      };

      const result = await agentWithTests.execute(task);

      expect(result.status).toBe('success');
      expect(result.artifacts!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('modifyCode', () => {
    it('should modify existing code', async () => {
      await coderAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'modify',
        description: 'Modify existing code',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: '添加一个新的功能',
          context: mockContext as unknown as Record<string, unknown>,
        },
        dependencies: [],
        constraints: { timeout: 60000, maxRetries: 3 },
        metadata: {
          source: 'user',
          conversationId: 'test',
          projectId: 'test',
          tags: [],
        },
        createdAt: Date.now(),
      };

      const result = await coderAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.output.changes).toBeDefined();
      const changes = result.output.changes as Array<{ type: string }>;
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('refactorCode', () => {
    it('should refactor code', async () => {
      await coderAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'refactor',
        description: 'Refactor code',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: '重构这个组件，提取函数',
          context: mockContext as unknown as Record<string, unknown>,
        },
        dependencies: [],
        constraints: { timeout: 60000, maxRetries: 3 },
        metadata: {
          source: 'user',
          conversationId: 'test',
          projectId: 'test',
          tags: [],
        },
        createdAt: Date.now(),
      };

      const result = await coderAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.output.summary).toContain('Refactored');
    });
  });

  describe('fixCode', () => {
    it('should fix code issues', async () => {
      await coderAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'fix',
        description: 'Fix code',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: '修复这个 bug',
          context: mockContext as unknown as Record<string, unknown>,
        },
        dependencies: [],
        constraints: { timeout: 60000, maxRetries: 3 },
        metadata: {
          source: 'user',
          conversationId: 'test',
          projectId: 'test',
          tags: [],
        },
        createdAt: Date.now(),
      };

      const result = await coderAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.output.summary).toContain('Fixed');
    });
  });

  describe('capability', () => {
    it('should have correct role', () => {
      expect(coderAgent.role).toBe('coder');
    });

    it('should have correct capability', () => {
      expect(coderAgent.capability.role).toBe('coder');
      expect(coderAgent.capability.tools).toContain('generate_code');
      expect(coderAgent.capability.tools).toContain('modify_code');
      expect(coderAgent.capability.tools).toContain('refactor_code');
      expect(coderAgent.capability.tools).toContain('fix_code');
    });
  });

  describe('options', () => {
    it('should use custom options', () => {
      const customAgent = createCoderAgent({}, {
        language: 'python',
        style: 'verbose',
        includeTests: true,
      });

      expect(customAgent.capability.role).toBe('coder');
    });
  });
});
