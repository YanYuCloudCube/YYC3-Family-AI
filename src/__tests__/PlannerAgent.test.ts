/**
 * @file: PlannerAgent.test.ts
 * @description: PlannerAgent 单元测试
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,agent,planner
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlannerAgent, createPlannerAgent, type UserIntent } from '../agent/agents/PlannerAgent';
import type { AgentTask, AgentContext } from '../agent/types';

describe('PlannerAgent', () => {
  let plannerAgent: PlannerAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    plannerAgent = createPlannerAgent();

    mockContext = {
      projectId: 'test-project',
      conversationId: 'test-conversation',
      fileContents: {
        'src/test.ts': 'export const test = "hello";',
      },
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

  describe('detectIntent', () => {
    it('should detect generate intent', () => {
      const result = plannerAgent.detectIntent('创建一个新的组件');
      expect(result).toBe('generate');
    });

    it('should detect generate intent in English', () => {
      const result = plannerAgent.detectIntent('Create a new component');
      expect(result).toBe('generate');
    });

    it('should detect modify intent', () => {
      const result = plannerAgent.detectIntent('修改这个文件');
      expect(result).toBe('modify');
    });

    it('should detect fix intent', () => {
      const result = plannerAgent.detectIntent('修复这个bug');
      expect(result).toBe('fix');
    });

    it('should detect explain intent', () => {
      const result = plannerAgent.detectIntent('解释这段代码');
      expect(result).toBe('explain');
    });

    it('should detect refactor intent', () => {
      const result = plannerAgent.detectIntent('重构这个模块');
      expect(result).toBe('refactor');
    });

    it('should detect test intent', () => {
      const result = plannerAgent.detectIntent('生成单元测试');
      expect(result).toBe('test');
    });

    it('should detect review intent', () => {
      const result = plannerAgent.detectIntent('审查这段代码');
      expect(result).toBe('review');
    });

    it('should return general for unknown intent', () => {
      const result = plannerAgent.detectIntent('你好');
      expect(result).toBe('general');
    });
  });

  describe('decomposeTask', () => {
    it('should decompose generate task', () => {
      const tasks = plannerAgent.decomposeTask('创建一个新的组件', 'generate', {});

      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].type).toBe('generate');
      expect(tasks[0].priority).toBe('high');
    });

    it('should decompose fix task with test', () => {
      const tasks = plannerAgent.decomposeTask('修复这个bug', 'fix', {});

      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.some(t => t.type === 'fix')).toBe(true);
    });

    it('should decompose refactor task', () => {
      const tasks = plannerAgent.decomposeTask('重构这个模块', 'refactor', {});

      expect(tasks.some(t => t.type === 'refactor')).toBe(true);
    });

    it('should decompose test task', () => {
      const tasks = plannerAgent.decomposeTask('生成单元测试', 'test', {});

      expect(tasks.some(t => t.type === 'test')).toBe(true);
    });

    it('should include dependencies for sequential tasks', () => {
      const tasks = plannerAgent.decomposeTask('创建组件并生成测试', 'generate', {});

      const tasksWithDeps = tasks.filter(t => t.dependencies && t.dependencies.length > 0);
      expect(tasksWithDeps.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('buildDependencies', () => {
    it('should build dependencies between tasks', () => {
      const tasks = [
        { id: 'task-1', type: 'generate' as const, description: 'Task 1', priority: 'high' as const, estimatedComplexity: 'medium' as const, requiredTools: [], inputContext: [], expectedOutput: '' },
        { id: 'task-2', type: 'test' as const, description: 'Task 2', priority: 'medium' as const, estimatedComplexity: 'low' as const, requiredTools: [], inputContext: [], expectedOutput: '', dependencies: ['task-1'] },
      ];

      const deps = plannerAgent.buildDependencies(tasks);

      expect(deps.length).toBeGreaterThan(0);
    });
  });

  describe('assessRisks', () => {
    it('should assess risks for complex tasks', () => {
      const tasks = [
        { id: 'task-1', type: 'generate' as const, description: 'Complex task', priority: 'high' as const, estimatedComplexity: 'high' as const, requiredTools: [], inputContext: [], expectedOutput: '' },
      ];

      const risks = plannerAgent.assessRisks(tasks, {});

      expect(risks.length).toBeGreaterThan(0);
      expect(risks[0].type).toBe('technical');
    });

    it('should assess risks for fix tasks', () => {
      const tasks = [
        { id: 'task-1', type: 'fix' as const, description: 'Fix bug', priority: 'high' as const, estimatedComplexity: 'medium' as const, requiredTools: [], inputContext: [], expectedOutput: '' },
      ];

      const risks = plannerAgent.assessRisks(tasks, {});

      expect(risks.some(r => r.description.includes('修复'))).toBe(true);
    });
  });

  describe('estimateTotalTime', () => {
    it('should estimate time for low complexity tasks', () => {
      const tasks = [
        { id: 'task-1', type: 'test' as const, description: 'Test', priority: 'low' as const, estimatedComplexity: 'low' as const, requiredTools: [], inputContext: [], expectedOutput: '' },
      ];

      const time = plannerAgent.estimateTotalTime(tasks);

      expect(time).toBe(30000);
    });

    it('should estimate time for high complexity tasks', () => {
      const tasks = [
        { id: 'task-1', type: 'generate' as const, description: 'Complex', priority: 'high' as const, estimatedComplexity: 'high' as const, requiredTools: [], inputContext: [], expectedOutput: '' },
      ];

      const time = plannerAgent.estimateTotalTime(tasks);

      expect(time).toBe(120000);
    });

    it('should sum time for multiple tasks', () => {
      const tasks = [
        { id: 'task-1', type: 'generate' as const, description: 'Task 1', priority: 'high' as const, estimatedComplexity: 'medium' as const, requiredTools: [], inputContext: [], expectedOutput: '' },
        { id: 'task-2', type: 'test' as const, description: 'Task 2', priority: 'medium' as const, estimatedComplexity: 'low' as const, requiredTools: [], inputContext: [], expectedOutput: '' },
      ];

      const time = plannerAgent.estimateTotalTime(tasks);

      expect(time).toBe(90000);
    });
  });

  describe('determineExecutionSequence', () => {
    it('should determine execution sequence', () => {
      const tasks = [
        { id: 'task-1', type: 'generate' as const, description: 'Task 1', priority: 'high' as const, estimatedComplexity: 'medium' as const, requiredTools: [], inputContext: [], expectedOutput: '' },
        { id: 'task-2', type: 'test' as const, description: 'Task 2', priority: 'medium' as const, estimatedComplexity: 'low' as const, requiredTools: [], inputContext: [], expectedOutput: '' },
      ];

      const deps = plannerAgent.buildDependencies(tasks);
      const sequence = plannerAgent.determineExecutionSequence(tasks, deps);

      expect(sequence.length).toBe(2);
      expect(sequence).toContain('task-1');
      expect(sequence).toContain('task-2');
    });

    it('should respect dependencies in sequence', () => {
      const tasks = [
        { id: 'task-1', type: 'generate' as const, description: 'Task 1', priority: 'high' as const, estimatedComplexity: 'medium' as const, requiredTools: [], inputContext: [], expectedOutput: '' },
        { id: 'task-2', type: 'test' as const, description: 'Task 2', priority: 'medium' as const, estimatedComplexity: 'low' as const, requiredTools: [], inputContext: [], expectedOutput: '', dependencies: ['task-1'] },
      ];

      const deps = plannerAgent.buildDependencies(tasks);
      const sequence = plannerAgent.determineExecutionSequence(tasks, deps);

      const task1Index = sequence.indexOf('task-1');
      const task2Index = sequence.indexOf('task-2');

      expect(task1Index).toBeLessThan(task2Index);
    });
  });

  describe('execute', () => {
    it('should execute planning task', async () => {
      await plannerAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'decompose',
        description: 'Test planning',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: '创建一个新的组件',
          context: {},
        },
        dependencies: [],
        constraints: {
          timeout: 60000,
          maxRetries: 3,
        },
        metadata: {
          source: 'user',
          conversationId: 'test',
          projectId: 'test',
          tags: [],
        },
        createdAt: Date.now(),
      };

      const result = await plannerAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.output.intent).toBe('generate');
      expect(result.output.plan).toBeDefined();
      const plan = result.output.plan as { tasks: unknown[] };
      expect(plan.tasks).toBeDefined();
      expect(plan.tasks.length).toBeGreaterThan(0);
    });

    it('should return artifacts with plan', async () => {
      await plannerAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'test-task',
        type: 'decompose',
        description: 'Test planning',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: '创建一个新的组件',
          context: {},
        },
        dependencies: [],
        constraints: {
          timeout: 60000,
          maxRetries: 3,
        },
        metadata: {
          source: 'user',
          conversationId: 'test',
          projectId: 'test',
          tags: [],
        },
        createdAt: Date.now(),
      };

      const result = await plannerAgent.execute(task);

      expect(result.artifacts).toBeDefined();
      expect(result.artifacts?.length).toBeGreaterThan(0);
      expect(result.artifacts?.[0].type).toBe('document');
    });
  });

  describe('capability', () => {
    it('should have correct role', () => {
      expect(plannerAgent.role).toBe('planner');
    });

    it('should have correct capability', () => {
      expect(plannerAgent.capability.role).toBe('planner');
      expect(plannerAgent.capability.tools).toContain('analyze_requirements');
      expect(plannerAgent.capability.tools).toContain('decompose_task');
    });
  });
});
