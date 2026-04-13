/**
 * @file: ReviewerAgent.test.ts
 * @description: ReviewerAgent 单元测试
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-04
 * @updated: 2026-04-04
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: test,agent,reviewer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReviewerAgent, createReviewerAgent, type ReviewOptions } from '../agent/agents/ReviewerAgent';
import type { AgentTask, AgentContext } from '../agent/types';

describe('ReviewerAgent', () => {
  let reviewerAgent: ReviewerAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    reviewerAgent = createReviewerAgent();

    mockContext = {
      projectId: 'test-project',
      conversationId: 'test-conversation',
      fileContents: {
        'src/components/Button.tsx': `import React from 'react';\n\nexport const Button = () => <button>Click</button>;`,
        'src/utils/helper.ts': `export const helper = () => {};\n\nconst password = "secret123";`,
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

  describe('performReview', () => {
    it('should review code and return findings', async () => {
      await reviewerAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'review-task',
        type: 'review',
        description: 'Review code quality',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'review the code',
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

      const result = await reviewerAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.output.result).toBeDefined();
      expect(result.output.findings).toBeDefined();
    });

    it('should detect security issues', async () => {
      const securityContext: AgentContext = {
        ...mockContext,
        fileContents: {
          'src/auth.ts': `const apiKey = "sk-1234567890";\nconst password = "admin123";`,
        },
        activeFile: 'src/auth.ts',
      };

      await reviewerAgent.initialize(securityContext);

      const task: AgentTask = {
        id: 'review-task',
        type: 'review',
        description: 'Review security',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'check for security issues',
          context: securityContext as unknown as Record<string, unknown>,
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

      const result = await reviewerAgent.execute(task);

      expect(result.status).toBe('success');
      const findings = result.output.findings as Array<{ category: string; severity: string }>;
      const securityFindings = findings.filter(f => f.category === 'security');
      expect(securityFindings.length).toBeGreaterThan(0);
    });

    it('should detect performance issues', async () => {
      const perfContext: AgentContext = {
        ...mockContext,
        fileContents: {
          'src/processing.ts': `items.map(x => x * 2).map(y => y + 1);`,
        },
        activeFile: 'src/processing.ts',
      };

      await reviewerAgent.initialize(perfContext);

      const task: AgentTask = {
        id: 'review-task',
        type: 'review',
        description: 'Review performance',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'check for performance issues',
          context: perfContext as unknown as Record<string, unknown>,
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

      const result = await reviewerAgent.execute(task);

      expect(result.status).toBe('success');
      const findings = result.output.findings as Array<{ category: string }>;
      const perfFindings = findings.filter(f => f.category === 'performance');
      expect(perfFindings.length).toBeGreaterThan(0);
    });

    it('should calculate review score', async () => {
      await reviewerAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'review-task',
        type: 'review',
        description: 'Calculate score',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'review and score',
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

      const result = await reviewerAgent.execute(task);

      expect(result.status).toBe('success');
      const reviewResult = result.output.result as { score: number; metrics: Record<string, number> };
      expect(reviewResult.score).toBeGreaterThanOrEqual(0);
      expect(reviewResult.score).toBeLessThanOrEqual(100);
      expect(reviewResult.metrics).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('should generate markdown report', async () => {
      await reviewerAgent.initialize(mockContext);

      const task: AgentTask = {
        id: 'review-task',
        type: 'review',
        description: 'Generate report',
        priority: 'high',
        status: 'pending',
        input: {
          userMessage: 'review and generate report',
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

      const result = await reviewerAgent.execute(task);

      expect(result.status).toBe('success');
      expect(result.artifacts).toBeDefined();
      expect(result.artifacts!.length).toBeGreaterThan(0);
      expect(result.artifacts![0].content).toContain('# Code Review Report');
    });
  });

  describe('capability', () => {
    it('should have correct role', () => {
      expect(reviewerAgent.role).toBe('reviewer');
    });

    it('should have correct capability', () => {
      expect(reviewerAgent.capability.role).toBe('reviewer');
      expect(reviewerAgent.capability.tools).toContain('review_code');
      expect(reviewerAgent.capability.tools).toContain('check_security');
      expect(reviewerAgent.capability.tools).toContain('check_performance');
    });
  });

  describe('options', () => {
    it('should use custom options', () => {
      const customAgent = createReviewerAgent({}, {
        depth: 'thorough',
        checkSecurity: true,
        checkPerformance: true,
        checkBestPractices: true,
      });

      expect(customAgent.capability.role).toBe('reviewer');
    });
  });
});
