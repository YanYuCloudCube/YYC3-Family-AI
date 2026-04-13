/**
 * @file: useAgentOrchestrator.test.ts
 * @description: useAgentOrchestrator Hook 单元测试
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-04
 * @updated: 2026-04-04
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { AgentContext } from '@/agent/types';

const mockAddMemory = vi.fn().mockResolvedValue({ id: 'test-memory-id' });

vi.mock('../app/components/ide/stores/useMemoryStore', () => ({
  useMemoryStore: vi.fn(() => ({
    addMemory: mockAddMemory,
    memories: [],
    search: vi.fn().mockReturnValue([]),
    updateMemory: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../app/components/ide/services/AgentServiceAdapter', () => ({
  createAgentServiceAdapter: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    executePipeline: vi.fn().mockResolvedValue({
      success: true,
      results: [
        {
          taskId: 'plan-1',
          agent: 'planner',
          status: 'success',
          output: { plan: { tasks: [], recommendedSequence: [] } },
          metrics: { executionTime: 1000, tokensUsed: 100 },
        },
      ],
      totalDuration: 1000,
    }),
    executeAgent: vi.fn().mockResolvedValue({
      taskId: 'test-1',
      agent: 'planner',
      status: 'success',
      output: 'Test output',
      metrics: { executionTime: 500, tokensUsed: 50 },
    }),
    cancel: vi.fn(),
    reset: vi.fn(),
  })),
}));

import { useAgentOrchestrator } from '../app/components/ide/hooks/useAgentOrchestrator';

describe('useAgentOrchestrator', () => {
  const mockContext: AgentContext = {
    conversationId: 'test-conv-1',
    projectId: 'test-project-1',
    fileContents: {},
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

  const mockLLMConfig = {
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    apiKey: 'test-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddMemory.mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAgentOrchestrator());

    expect(result.current.state.stage).toBe('idle');
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.results).toEqual([]);
  });

  it('should execute pipeline successfully', async () => {
    const { result } = renderHook(() => useAgentOrchestrator());

    await act(async () => {
      const pipelineResult = await result.current.executePipeline(
        'Create a button component',
        mockContext,
        mockLLMConfig
      );

      expect(pipelineResult.success).toBe(true);
      expect(pipelineResult.results.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(result.current.state.stage).toBe('completed');
    });
  });

  it('should execute single agent', async () => {
    const { result } = renderHook(() => useAgentOrchestrator());

    await act(async () => {
      const agentResult = await result.current.executeAgent(
        'planner',
        'Plan a feature',
        mockContext,
        mockLLMConfig
      );

      expect(agentResult).not.toBeNull();
      expect(agentResult?.status).toBe('success');
    });

    await waitFor(() => {
      expect(result.current.state.stage).toBe('completed');
    });
  });

  it('should cancel execution', () => {
    const { result } = renderHook(() => useAgentOrchestrator());

    act(() => {
      result.current.cancel();
    });

    expect(result.current.state.stage).toBe('idle');
    expect(result.current.state.isStreaming).toBe(false);
  });

  it('should reset state', async () => {
    const { result } = renderHook(() => useAgentOrchestrator());

    await act(async () => {
      await result.current.executePipeline(
        'Test request',
        mockContext,
        mockLLMConfig
      );
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.stage).toBe('idle');
    expect(result.current.state.results).toEqual([]);
    expect(result.current.state.error).toBeNull();
  });

  it('should call onStageChange callback', async () => {
    const onStageChange = vi.fn();
    const { result } = renderHook(() =>
      useAgentOrchestrator({ onStageChange })
    );

    await act(async () => {
      await result.current.executePipeline(
        'Test request',
        mockContext,
        mockLLMConfig
      );
    });

    expect(onStageChange).toHaveBeenCalled();
  });

  it('should call onAgentComplete callback', async () => {
    const onAgentComplete = vi.fn();
    const { result } = renderHook(() =>
      useAgentOrchestrator({ onAgentComplete })
    );

    await act(async () => {
      await result.current.executePipeline(
        'Test request',
        mockContext,
        mockLLMConfig
      );
    });

    expect(onAgentComplete).toHaveBeenCalled();
  });

  it('should update agent state during execution', async () => {
    const { result } = renderHook(() => useAgentOrchestrator());

    await act(async () => {
      await result.current.executeAgent(
        'coder',
        'Write code',
        mockContext,
        mockLLMConfig
      );
    });

    expect(result.current.state.agents.coder.status).toBe('completed');
    expect(result.current.state.agents.coder.progress).toBe(100);
  });
});
