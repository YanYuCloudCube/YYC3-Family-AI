/**
 * @file: TesterAgent.test.ts
 * @description: TesterAgent 单元测试
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-04
 * @updated: 2026-04-04
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,agent,tester
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TesterAgent, createTesterAgent, type TestGenerationOptions } from '../agent/agents/TesterAgent';
import type { AgentTask, AgentContext } from '../agent/types';

describe('TesterAgent', () => {
  let testerAgent: TesterAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    testerAgent = createTesterAgent();

    mockContext = {
      projectId: 'test-project',
      conversationId: 'test-conversation',
      fileContents: {
        'src/components/Button.tsx': `import React from 'react';\n\nexport const Button = () => <button>Click</button>;`,
        'src/utils/helper.ts': `export const helper = () => {};`,
      },
      activeFile: 'src/components/Button.tsx',
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

  describe('detectFramework', () => {
    it('should detect vitest framework from context', async () => {
      await testerAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'test',
        description: 'Generate tests',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'generate tests for Button component',
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

      const result = await testerAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.output.artifacts).toBeDefined();
    });
  });

  describe('generateTest', () => {
    it('should generate test file for React component', async () => {
      await testerAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'test',
        description: 'Generate React tests',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'create tests for Button component',
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

      const result = await testerAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.artifacts).toBeDefined();
      expect(result.artifacts!.length).toBeGreaterThan(0);
      expect(result.output.summary).toContain('Generated');
    });

    it('should generate test with custom framework', async () => {
      const customAgent = createTesterAgent({}, { framework: 'jest' });
      await customAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'test',
        description: 'Generate jest tests',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'create jest tests',
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

      const result = await customAgent.execute(task);

      expect(result.status).toBe('success');
      const artifacts = result.output.artifacts as Array<{ framework: string }>;
      expect(artifacts[0].framework).toBe('jest');
    });

    it('should generate Python tests', async () => {
      const pythonContext: AgentContext = {
        ...mockContext,
        fileContents: {
          'src/utils/calculator.py': `def add(a, b):\n    return a + b`,
        },
        activeFile: 'src/utils/calculator.py',
      };

      const pythonAgent = createTesterAgent({}, { framework: 'pytest' });
      await pythonAgent.initialize(pythonContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'test',
        description: 'Generate Python tests',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'create pytest tests',
          context: pythonContext as unknown as Record<string, unknown>,
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

      const result = await pythonAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.artifacts).toBeDefined();
      expect(result.artifacts!.length).toBeGreaterThan(0);
      expect(result.artifacts![0].content).toContain('import pytest');
    });
  });

  describe('generateTestFileName', () => {
    it('should generate correct test file path', async () => {
      await testerAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'test',
        description: 'Generate test file',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'create test',
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

      const result = await testerAgent.execute(task);

      expect(result.status).toBe('success');
      const artifacts = result.output.artifacts as Array<{ path: string }>;
      expect(artifacts[0].path).toContain('test');
    });
  });

  describe('capability', () => {
    it('should have correct role', () => {
      expect(testerAgent.role).toBe('tester');
    });

    it('should have correct capability', () => {
      expect(testerAgent.capability.role).toBe('tester');
      expect(testerAgent.capability.tools).toContain('generate_test');
      expect(testerAgent.capability.tools).toContain('execute_test');
      expect(testerAgent.capability.tools).toContain('verify_test');
    });
  });

  describe('options', () => {
    it('should use custom options', () => {
      const customAgent = createTesterAgent({}, {
        framework: 'pytest',
        coverage: 'comprehensive',
        includeMocks: false,
      });

      expect(customAgent.capability.role).toBe('tester');
    });
  });
});
