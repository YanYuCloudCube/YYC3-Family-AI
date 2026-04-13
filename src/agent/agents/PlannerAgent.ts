/**
 * @file: PlannerAgent.ts
 * @description: 规划智能体 - 分析需求、分解任务、制定执行计划
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,planner,task-decomposition
 */

import { BaseAgent } from '../base/BaseAgent';
import type {
  AgentRole,
  AgentTask,
  AgentContext,
  AgentResult,
  AgentCapability,
  AgentConfig,
  TaskDefinition,
  TaskDependency,
  RiskAssessment,
  PlannerOutput,
} from '../types';

export type UserIntent =
  | 'generate'
  | 'modify'
  | 'fix'
  | 'explain'
  | 'refactor'
  | 'test'
  | 'review'
  | 'general';

const INTENT_PATTERNS: Record<UserIntent, RegExp[]> = {
  test: [
    /生成.*测试|写.*测试|单元测试|test|spec|覆盖率/,
    /generate.*test|write.*test|test|spec|coverage|unit test|testing/i,
  ],
  generate: [
    /创建|生成|新建|写一个|做一个|搭建|添加|新增|实现/,
    /create|generate|build|make|add|implement|write/i,
  ],
  modify: [
    /修改|更改|调整|替换|改成|改为|改动/,
    /modify|change|update|alter|adjust|replace/i,
  ],
  fix: [
    /修复|修正|解决|修bug|报错|错误|异常|问题/,
    /fix|debug|solve|error|bug|issue|broken|crash/i,
  ],
  explain: [
    /解释.*代码|说明.*代码|讲解.*代码|分析.*代码|代码.*是什么|代码.*怎么|代码.*为什么|代码原理/,
    /explain.*code|describe.*code|what.*code|how.*code|why.*code|analyze.*code|understand.*code/i,
  ],
  refactor: [
    /重构|优化|性能|改善|提升|简化|整理|clean/,
    /refactor|optimize|improve|simplify|clean|performance/i,
  ],
  review: [
    /审查|review|检查|检视|code review|评审/,
    /review|inspect|audit|check/i,
  ],
  general: [],
};

const INTENT_TO_TASK_TYPE: Record<UserIntent, TaskDefinition['type'][]> = {
  generate: ['generate'],
  modify: ['refactor', 'generate'],
  fix: ['fix', 'test'],
  explain: ['review'],
  refactor: ['refactor', 'test'],
  test: ['test'],
  review: ['review'],
  general: ['generate'],
};

const INTENT_TO_AGENT_SEQUENCE: Record<UserIntent, AgentRole[]> = {
  generate: ['coder', 'tester'],
  modify: ['coder', 'tester'],
  fix: ['coder', 'tester', 'reviewer'],
  explain: ['reviewer'],
  refactor: ['coder', 'tester', 'reviewer'],
  test: ['tester'],
  review: ['reviewer'],
  general: ['coder'],
};

export class PlannerAgent extends BaseAgent {
  readonly role: AgentRole = 'planner';
  readonly capability: AgentCapability = {
    role: 'planner',
    description: '分析需求、分解任务、制定执行计划',
    tools: ['analyze_requirements', 'decompose_task', 'estimate_complexity', 'identify_risks'],
    inputSchema: {
      type: 'object',
      properties: {
        userMessage: { type: 'string' },
        context: { type: 'object' },
      },
      required: ['userMessage'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        tasks: { type: 'array' },
        dependencies: { type: 'array' },
        estimatedTime: { type: 'number' },
      },
    },
    maxConcurrentTasks: 1,
    avgProcessingTime: 2000,
  };

  constructor(config?: Partial<AgentConfig>) {
    super({
      role: 'planner',
      enabled: true,
      maxRetries: 2,
      timeout: 60000,
      priority: 1,
      modelPreference: 'reasoning',
      ...config,
    });
  }

  protected async onInitialize(_context: AgentContext): Promise<void> {
    this.log('PlannerAgent initialized');
  }

  protected async onExecute(task: AgentTask): Promise<Omit<AgentResult, 'taskId' | 'agent' | 'status' | 'metrics'>> {
    this.validateInput(task);
    this.log(`Planning task: ${task.description}`);

    const userMessage = task.input.userMessage;
    const context = task.input.context as Record<string, unknown>;

    const intent = this.detectIntent(userMessage);
    this.log(`Detected intent: ${intent}`);

    const taskDefinitions = this.decomposeTask(userMessage, intent, context);
    this.log(`Decomposed into ${taskDefinitions.length} subtasks`);

    const dependencies = this.buildDependencies(taskDefinitions);

    const riskAssessments = this.assessRisks(taskDefinitions, context);

    const estimatedTime = this.estimateTotalTime(taskDefinitions);

    const recommendedSequence = this.determineExecutionSequence(taskDefinitions, dependencies);

    const plannerOutput: PlannerOutput = {
      tasks: taskDefinitions,
      dependencies,
      estimatedTime,
      riskAssessment: riskAssessments,
      recommendedSequence,
    };

    return {
      output: {
        intent,
        plan: plannerOutput,
        agentSequence: INTENT_TO_AGENT_SEQUENCE[intent],
      },
      artifacts: [
        this.createArtifact(
          'document',
          `plan-${task.id}.json`,
          JSON.stringify(plannerOutput, null, 2),
          true,
          'json'
        ),
      ],
      suggestions: this.generateSuggestions(intent, riskAssessments),
      nextSteps: recommendedSequence.slice(0, 3),
    };
  }

  protected async onCancel(_taskId: string): Promise<void> {
    this.log('Planning cancelled');
  }

  protected async onShutdown(): Promise<void> {
    this.log('PlannerAgent shutdown');
  }

  detectIntent(userMessage: string): UserIntent {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      if (intent === 'general') continue;
      for (const pattern of patterns) {
        if (pattern.test(userMessage)) {
          return intent as UserIntent;
        }
      }
    }
    return 'general';
  }

  decomposeTask(
    userMessage: string,
    intent: UserIntent,
    _context: Record<string, unknown>
  ): TaskDefinition[] {
    const tasks: TaskDefinition[] = [];
    const taskTypes = INTENT_TO_TASK_TYPE[intent] || ['generate'];

    const baseTaskId = `task-${Date.now()}`;

    if (taskTypes.includes('generate') || taskTypes.includes('fix')) {
      tasks.push({
        id: `${baseTaskId}-code`,
        type: taskTypes.includes('fix') ? 'fix' : 'generate',
        description: this.extractCodeTaskDescription(userMessage, intent),
        priority: 'high',
        estimatedComplexity: this.estimateComplexity(userMessage),
        requiredTools: ['read_file', 'write_file', 'llm_generate'],
        inputContext: ['userMessage', 'fileContents', 'activeFile'],
        expectedOutput: 'code_changes',
      });
    }

    if (taskTypes.includes('refactor')) {
      tasks.push({
        id: `${baseTaskId}-refactor`,
        type: 'refactor',
        description: `重构代码: ${userMessage.slice(0, 100)}`,
        priority: 'medium',
        estimatedComplexity: 'medium',
        requiredTools: ['read_file', 'write_file', 'analyze_code'],
        inputContext: ['userMessage', 'fileContents'],
        expectedOutput: 'refactored_code',
      });
    }

    if (taskTypes.includes('test')) {
      tasks.push({
        id: `${baseTaskId}-test`,
        type: 'test',
        description: '生成单元测试',
        priority: 'medium',
        estimatedComplexity: 'low',
        requiredTools: ['read_file', 'write_file', 'generate_tests'],
        inputContext: ['codeChanges', 'fileContents'],
        expectedOutput: 'test_files',
        dependencies: tasks.length > 0 ? [tasks[0].id] : [],
      });
    }

    if (taskTypes.includes('review')) {
      tasks.push({
        id: `${baseTaskId}-review`,
        type: 'review',
        description: '代码审查',
        priority: 'low',
        estimatedComplexity: 'low',
        requiredTools: ['read_file', 'analyze_code', 'security_check'],
        inputContext: ['codeChanges', 'testResults'],
        expectedOutput: 'review_report',
        dependencies: tasks.length > 0 ? [tasks[tasks.length - 1].id] : [],
      });
    }

    if (tasks.length === 0) {
      tasks.push({
        id: `${baseTaskId}-general`,
        type: 'generate',
        description: userMessage,
        priority: 'medium',
        estimatedComplexity: 'medium',
        requiredTools: ['llm_generate'],
        inputContext: ['userMessage'],
        expectedOutput: 'response',
      });
    }

    return tasks;
  }

  buildDependencies(tasks: TaskDefinition[]): TaskDependency[] {
    const dependencies: TaskDependency[] = [];

    for (const task of tasks) {
      if (task.dependencies && task.dependencies.length > 0) {
        for (const depId of task.dependencies) {
          dependencies.push({
            taskId: task.id,
            dependsOn: [depId],
            type: 'hard',
          });
        }
      }
    }

    for (let i = 1; i < tasks.length; i++) {
      const existingDep = dependencies.find(d => d.taskId === tasks[i].id);
      if (!existingDep) {
        dependencies.push({
          taskId: tasks[i].id,
          dependsOn: [tasks[i - 1].id],
          type: 'soft',
        });
      }
    }

    return dependencies;
  }

  assessRisks(tasks: TaskDefinition[], _context: Record<string, unknown>): RiskAssessment[] {
    const risks: RiskAssessment[] = [];

    const hasComplexTask = tasks.some(t => t.estimatedComplexity === 'high');
    if (hasComplexTask) {
      risks.push({
        type: 'technical',
        description: '任务复杂度较高，可能需要多次迭代',
        probability: 'medium',
        impact: 'medium',
        mitigation: '建议分阶段实施，逐步验证',
      });
    }

    const hasMultipleFiles = tasks.filter(t => t.type === 'generate' || t.type === 'refactor').length > 1;
    if (hasMultipleFiles) {
      risks.push({
        type: 'dependency',
        description: '涉及多个文件修改，可能存在依赖冲突',
        probability: 'low',
        impact: 'high',
        mitigation: '建议先备份，修改后运行测试验证',
      });
    }

    if (tasks.some(t => t.type === 'fix')) {
      risks.push({
        type: 'technical',
        description: '修复问题可能引入新问题',
        probability: 'medium',
        impact: 'medium',
        mitigation: '建议修复后运行完整测试套件',
      });
    }

    return risks;
  }

  estimateTotalTime(tasks: TaskDefinition[]): number {
    const complexityToTime: Record<string, number> = {
      low: 30000,
      medium: 60000,
      high: 120000,
    };

    return tasks.reduce((total, task) => {
      return total + (complexityToTime[task.estimatedComplexity] || 60000);
    }, 0);
  }

  determineExecutionSequence(tasks: TaskDefinition[], dependencies: TaskDependency[]): string[] {
    const sequence: string[] = [];
    const completed = new Set<string>();
    const remaining = new Set(tasks.map(t => t.id));

    while (remaining.size > 0) {
      let progress = false;

      for (const taskId of remaining) {
        const taskDeps = dependencies.filter(d => d.taskId === taskId);
        const allDepsMet = taskDeps.every(d =>
          d.dependsOn.every(depId => completed.has(depId))
        );

        if (allDepsMet) {
          sequence.push(taskId);
          completed.add(taskId);
          remaining.delete(taskId);
          progress = true;
        }
      }

      if (!progress && remaining.size > 0) {
        const nextTask = Array.from(remaining)[0];
        sequence.push(nextTask);
        completed.add(nextTask);
        remaining.delete(nextTask);
      }
    }

    return sequence;
  }

  private extractCodeTaskDescription(userMessage: string, intent: UserIntent): string {
    const prefix: Record<UserIntent, string> = {
      generate: '生成代码: ',
      modify: '修改代码: ',
      fix: '修复问题: ',
      explain: '分析代码: ',
      refactor: '重构代码: ',
      test: '生成测试: ',
      review: '审查代码: ',
      general: '处理请求: ',
    };

    const desc = userMessage.slice(0, 150);
    return `${prefix[intent]}${desc}${desc.length >= 150 ? '...' : ''}`;
  }

  private estimateComplexity(userMessage: string): 'low' | 'medium' | 'high' {
    const wordCount = userMessage.split(/\s+/).length;
    const hasMultipleRequirements = /并且|同时|以及|also|and|additionally/i.test(userMessage);
    const hasComplexKeywords = /架构|系统|重构|优化|architecture|system|refactor|optimize/i.test(userMessage);

    if (hasComplexKeywords || wordCount > 100) {
      return 'high';
    }

    if (hasMultipleRequirements || wordCount > 50) {
      return 'medium';
    }

    return 'low';
  }

  private generateSuggestions(intent: UserIntent, risks: RiskAssessment[]): string[] {
    const suggestions: string[] = [];

    if (risks.length > 0) {
      suggestions.push('检测到潜在风险，建议仔细审查生成的代码');
    }

    const intentSuggestions: Record<UserIntent, string[]> = {
      generate: ['建议添加单元测试验证功能', '考虑添加错误处理'],
      modify: ['建议先备份原文件', '修改后运行相关测试'],
      fix: ['建议添加回归测试', '检查是否有类似问题'],
      explain: ['可以请求更详细的解释', '建议查看相关文档'],
      refactor: ['建议分步骤重构', '每次重构后运行测试'],
      test: ['建议提高测试覆盖率', '考虑边界情况'],
      review: ['关注代码安全性', '检查性能问题'],
      general: [],
    };

    suggestions.push(...(intentSuggestions[intent] || []));

    return suggestions;
  }
}

export function createPlannerAgent(config?: Partial<AgentConfig>): PlannerAgent {
  return new PlannerAgent(config);
}
