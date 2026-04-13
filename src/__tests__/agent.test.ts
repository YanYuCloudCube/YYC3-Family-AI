/**
 * @file: agent.test.ts
 * @description: Multi-Agent 系统单元测试
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,test,unit
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AgentOrchestrator,
  createOrchestrator,
  MessageBus,
  createMessageBus,
  BaseAgent,
  AgentContextManager,
  createAgentContext,
  createTask,
  validateTask,
  createMessage,
  createTaskMessage,
  createResultMessage,
  type AgentRole,
  type AgentTask,
  type AgentContext,
  type AgentResult,
  type AgentCapability,
  type AgentConfig,
} from '../agent/index';

class MockAgent extends BaseAgent {
  readonly role: AgentRole;
  readonly capability: AgentCapability;

  constructor(role: AgentRole, config: AgentConfig) {
    super(config);
    this.role = role;
    this.capability = {
      role,
      description: `Mock ${role} agent`,
      tools: ['mock_tool'],
      inputSchema: {},
      outputSchema: {},
      maxConcurrentTasks: 1,
      avgProcessingTime: 1000,
    };
  }

  protected async onInitialize(_context: AgentContext): Promise<void> {
    this.log(`Mock ${this.role} initialized`);
  }

  protected async onExecute(task: AgentTask): Promise<Omit<AgentResult, 'taskId' | 'agent' | 'status' | 'metrics'>> {
    this.log(`Mock ${this.role} executing task: ${task.id}`);
    
    return {
      output: {
        message: `Task ${task.id} completed by ${this.role}`,
      },
      artifacts: [],
      suggestions: [],
      nextSteps: [],
    };
  }

  protected async onCancel(_taskId: string): Promise<void> {
    this.log(`Mock ${this.role} cancelled task`);
  }

  protected async onShutdown(): Promise<void> {
    this.log(`Mock ${this.role} shutdown`);
  }
}

describe('AgentTypes', () => {
  describe('createTask', () => {
    it('should create a task with default values', () => {
      const task = createTask('generate', 'Test task', {
        userMessage: 'Test message',
        context: {},
      });

      expect(task.type).toBe('generate');
      expect(task.description).toBe('Test task');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('medium');
      expect(task.id).toMatch(/^task-/);
    });

    it('should create a task with custom priority', () => {
      const task = createTask(
        'review',
        'High priority task',
        { userMessage: 'Test', context: {} },
        { priority: 'high' }
      );

      expect(task.priority).toBe('high');
    });
  });

  describe('validateTask', () => {
    it('should validate a valid task', () => {
      const task = createTask('generate', 'Valid task', {
        userMessage: 'Test message',
        context: {},
      });

      const validation = validateTask(task);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail for empty description', () => {
      const task = createTask('generate', '', {
        userMessage: 'Test',
        context: {},
      });

      const validation = validateTask(task);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.code === 'EMPTY_DESCRIPTION')).toBe(true);
    });

    it('should fail for empty user message', () => {
      const task = createTask('generate', 'Test', {
        userMessage: '',
        context: {},
      });

      const validation = validateTask(task);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.code === 'EMPTY_USER_MESSAGE')).toBe(true);
    });
  });
});

describe('MessageTypes', () => {
  describe('createMessage', () => {
    it('should create a message with auto-generated ID', () => {
      const taskPayload = {
        taskId: 'test',
        taskType: 'generate',
        description: 'Test task',
        input: {},
        context: {},
      };
      const message = createMessage('user', 'planner', 'task', { task: taskPayload });

      expect(message.id).toMatch(/^msg-/);
      expect(message.from).toBe('user');
      expect(message.to).toBe('planner');
      expect(message.type).toBe('task');
      expect(message.timestamp).toBeGreaterThan(0);
    });

    it('should create a task message', () => {
      const taskPayload = {
        taskId: 'task-123',
        taskType: 'generate',
        description: 'Test task',
        input: {},
        context: {},
      };

      const message = createTaskMessage('orchestrator', 'coder', taskPayload);

      expect(message.type).toBe('task');
      expect(message.to).toBe('coder');
      expect(message.payload.task).toEqual(taskPayload);
    });

    it('should create a result message', () => {
      const resultPayload = {
        taskId: 'task-123',
        status: 'completed' as const,
        output: { result: 'success' },
      };

      const message = createResultMessage('coder', 'orchestrator', resultPayload);

      expect(message.type).toBe('result');
      expect(message.from).toBe('coder');
      expect(message.payload.result).toEqual(resultPayload);
    });
  });
});

describe('AgentContext', () => {
  let contextManager: AgentContextManager;

  beforeEach(() => {
    contextManager = createAgentContext({
      projectId: 'test-project',
      conversationId: 'test-conversation',
    });
  });

  it('should create context with default values', () => {
    const summary = contextManager.summarize();

    expect(summary.projectId).toBe('test-project');
    expect(summary.conversationId).toBe('test-conversation');
    expect(summary.fileCount).toBe(0);
    expect(summary.gitBranch).toBe('main');
  });

  it('should update file contents', () => {
    contextManager.updateFileContents({
      'test.ts': 'console.log("test")',
    });

    expect(contextManager.getFileContent('test.ts')).toBe('console.log("test")');
  });

  it('should manage persistent memory', () => {
    contextManager.setMemory('key1', 'value1');
    contextManager.setMemory('key2', { nested: 'object' });

    expect(contextManager.getMemory('key1')).toBe('value1');
    expect(contextManager.getMemory('key2')).toEqual({ nested: 'object' });
    expect(contextManager.hasMemory('key1')).toBe(true);
    expect(contextManager.hasMemory('nonexistent')).toBe(false);
  });

  it('should track conversation history', () => {
    contextManager.addConversationMessage({
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
    });

    contextManager.addConversationMessage({
      role: 'assistant',
      content: 'Hi there!',
      timestamp: Date.now(),
    });

    const recent = contextManager.getRecentConversation(1);
    expect(recent).toHaveLength(1);
    expect(recent[0].role).toBe('assistant');
  });

  it('should clone context', () => {
    contextManager.setMemory('key', 'value');
    contextManager.updateFileContents({ 'file.ts': 'content' });

    const cloned = contextManager.clone();

    expect(cloned.getMemory('key')).toBe('value');
    expect(cloned.getFileContent('file.ts')).toBe('content');

    cloned.setMemory('key', 'modified');
    expect(contextManager.getMemory('key')).toBe('value');
  });
});

describe('MessageBus', () => {
  let messageBus: MessageBus;

  beforeEach(() => {
    messageBus = createMessageBus();
    messageBus.start();
  });

  afterEach(() => {
    messageBus.stop();
  });

  it('should send and receive messages', () => {
    const handler = vi.fn();
    messageBus.subscribe({ to: 'coder' }, handler);

    const taskPayload = {
      taskId: 'test',
      taskType: 'generate',
      description: 'Test task',
      input: {},
      context: {},
    };
    const message = createMessage('orchestrator', 'coder', 'task', {
      task: taskPayload,
    });

    const sent = messageBus.send(message);

    expect(sent).toBe(true);
    expect(handler).toHaveBeenCalledWith(message);
  });

  it('should broadcast messages', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    messageBus.subscribe({ to: 'broadcast' }, handler1);
    messageBus.subscribe({ to: 'broadcast' }, handler2);

    messageBus.broadcast('orchestrator', 'sync', { sync: { syncType: 'state', data: {}, version: 1 } });

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should filter messages by type', () => {
    const taskHandler = vi.fn();
    const resultHandler = vi.fn();

    messageBus.subscribe({ type: 'task' }, taskHandler);
    messageBus.subscribe({ type: 'result' }, resultHandler);

    messageBus.send(createMessage('user', 'planner', 'task', { task: { taskId: '1', taskType: 'generate', description: 'Test', input: {}, context: {} } }));
    messageBus.send(createMessage('coder', 'orchestrator', 'result', { result: { taskId: '1', status: 'completed', output: {} } }));

    expect(taskHandler).toHaveBeenCalledTimes(1);
    expect(resultHandler).toHaveBeenCalledTimes(1);
  });

  it('should track message statistics', () => {
    const stats = messageBus.getStats();

    expect(stats.totalMessagesSent).toBe(0);
    expect(stats.queueSize).toBe(0);

    messageBus.send(createMessage('user', 'planner', 'task', { task: { taskId: '1', taskType: 'generate', description: 'Test', input: {}, context: {} } }));

    const newStats = messageBus.getStats();
    expect(newStats.totalMessagesSent).toBe(1);
  });

  it('should allow unsubscribing', () => {
    const handler = vi.fn();
    const subscriptionId = messageBus.subscribe({ to: 'coder' }, handler);

    messageBus.send(createMessage('orchestrator', 'coder', 'task', { task: { taskId: '1', taskType: 'generate', description: 'Test', input: {}, context: {} } }));
    expect(handler).toHaveBeenCalledTimes(1);

    messageBus.unsubscribe(subscriptionId);

    messageBus.send(createMessage('orchestrator', 'coder', 'task', { task: { taskId: '2', taskType: 'generate', description: 'Test', input: {}, context: {} } }));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('BaseAgent', () => {
  let mockAgent: MockAgent;
  let context: AgentContext;

  beforeEach(() => {
    mockAgent = new MockAgent('coder', {
      role: 'coder',
      enabled: true,
      maxRetries: 3,
      timeout: 60000,
      priority: 1,
      modelPreference: 'code',
    });

    context = createAgentContext({
      projectId: 'test-project',
      conversationId: 'test-conversation',
    }).context;
  });

  afterEach(async () => {
    await mockAgent.shutdown();
  });

  it('should initialize correctly', async () => {
    await mockAgent.initialize(context);

    expect(mockAgent.status).toBe('idle');
  });

  it('should execute a task', async () => {
    await mockAgent.initialize(context);

    const task = createTask('generate', 'Test task', {
      userMessage: 'Generate a function',
      context: {},
    });

    const result = await mockAgent.execute(task);

    expect(result.status).toBe('success');
    expect(result.agent).toBe('coder');
    expect(result.output.message).toContain('completed');
  });

  it('should track completed tasks', async () => {
    await mockAgent.initialize(context);

    const task = createTask('generate', 'Test task', {
      userMessage: 'Test',
      context: {},
    });

    await mockAgent.execute(task);

    const state = mockAgent.getState();
    expect(state.completedTasks).toBe(1);
  });

  it('should return correct state', async () => {
    await mockAgent.initialize(context);

    const state = mockAgent.getState();

    expect(state.role).toBe('coder');
    expect(state.status).toBe('idle');
    expect(state.currentTaskId).toBeNull();
  });
});

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;
  let context: AgentContext;

  beforeEach(() => {
    orchestrator = createOrchestrator();
    context = createAgentContext({
      projectId: 'test-project',
      conversationId: 'test-conversation',
    }).context;
  });

  afterEach(async () => {
    await orchestrator.shutdown();
  });

  it('should initialize correctly', async () => {
    await orchestrator.initialize(context);

    const state = orchestrator.getOrchestratorState();
    expect(state.status).toBe('idle');
  });

  it('should register agents', async () => {
    const mockAgent = new MockAgent('coder', {
      role: 'coder',
      enabled: true,
      maxRetries: 3,
      timeout: 60000,
      priority: 1,
      modelPreference: 'code',
    });

    orchestrator.registerAgent(mockAgent, mockAgent.config);

    const agentStatus = orchestrator.getAgentStatus('coder');
    expect(agentStatus.role).toBe('coder');
  });

  it('should reject duplicate agent registration', () => {
    const agent1 = new MockAgent('coder', {
      role: 'coder',
      enabled: true,
      maxRetries: 3,
      timeout: 60000,
      priority: 1,
      modelPreference: 'code',
    });

    const agent2 = new MockAgent('coder', {
      role: 'coder',
      enabled: true,
      maxRetries: 3,
      timeout: 60000,
      priority: 1,
      modelPreference: 'code',
    });

    orchestrator.registerAgent(agent1, agent1.config);

    expect(() => orchestrator.registerAgent(agent2, agent2.config)).toThrow(
      'Agent with role coder is already registered'
    );
  });

  it('should submit and execute tasks', async () => {
    const mockAgent = new MockAgent('coder', {
      role: 'coder',
      enabled: true,
      maxRetries: 3,
      timeout: 60000,
      priority: 1,
      modelPreference: 'code',
    });

    orchestrator.registerAgent(mockAgent, mockAgent.config);
    await orchestrator.initialize(context);

    const task = createTask('generate', 'Test task', {
      userMessage: 'Generate code',
      context: {},
    });
    task.assignedAgent = 'coder';

    const result = await orchestrator.submitTask(task);

    expect(result.status).toBe('accepted');
    expect(result.taskId).toBe(task.id);
  });

  it('should queue tasks when at max capacity', async () => {
    const limitedOrchestrator = createOrchestrator({
      maxConcurrentTasks: 1,
    });

    const mockAgent = new MockAgent('coder', {
      role: 'coder',
      enabled: true,
      maxRetries: 3,
      timeout: 60000,
      priority: 1,
      modelPreference: 'code',
    });

    limitedOrchestrator.registerAgent(mockAgent, mockAgent.config);
    await limitedOrchestrator.initialize(context);

    const task1 = createTask('generate', 'Task 1', {
      userMessage: 'Generate',
      context: {},
    });
    task1.assignedAgent = 'coder';

    const task2 = createTask('generate', 'Task 2', {
      userMessage: 'Generate',
      context: {},
    });
    task2.assignedAgent = 'coder';

    limitedOrchestrator.submitTask(task1);
    limitedOrchestrator.submitTask(task2);

    const state = limitedOrchestrator.getOrchestratorState();
    expect(state.queuedTasks + state.activeTasks + state.completedTasks).toBeGreaterThanOrEqual(2);

    await limitedOrchestrator.shutdown();
  });

  it('should pause and resume', async () => {
    await orchestrator.initialize(context);

    await orchestrator.pause();
    expect(orchestrator.getOrchestratorState().status).toBe('paused');

    await orchestrator.resume();
    expect(orchestrator.getOrchestratorState().status).toBe('running');
  });
});
