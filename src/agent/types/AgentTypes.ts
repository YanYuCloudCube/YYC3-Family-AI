/**
 * @file: AgentTypes.ts
 * @description: Multi-Agent 系统核心类型定义
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,types,multi-agent,core
 */

export type AgentRole = 'planner' | 'coder' | 'tester' | 'reviewer';

export type AgentStatus = 'idle' | 'running' | 'waiting' | 'completed' | 'error';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type TaskType = 'decompose' | 'generate' | 'modify' | 'test' | 'review' | 'refactor' | 'fix';

export type MessageType = 'task' | 'result' | 'query' | 'error' | 'sync' | 'heartbeat';

export interface AgentCapability {
  role: AgentRole;
  description: string;
  tools: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  maxConcurrentTasks: number;
  avgProcessingTime: number;
}

export interface AgentState {
  role: AgentRole;
  status: AgentStatus;
  currentTaskId: string | null;
  completedTasks: number;
  failedTasks: number;
  lastActivityAt: number;
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  totalTasksProcessed: number;
  successRate: number;
  avgExecutionTime: number;
  avgTokensUsed: number;
  lastExecutionTime: number;
}

export interface AgentConfig {
  role: AgentRole;
  enabled: boolean;
  maxRetries: number;
  timeout: number;
  priority: number;
  modelPreference: string;
  customInstructions?: string;
}

export interface AgentContext {
  projectId: string;
  conversationId: string;
  fileContents: Record<string, string>;
  activeFile?: string;
  openTabs: TabInfo[];
  gitBranch: string;
  gitChanges: GitChange[];
  persistentMemory: Map<string, unknown>;
  conversationHistory: ConversationMessage[];
  userPreferences: UserPreferences;
}

export interface TabInfo {
  path: string;
  modified: boolean;
  cursor?: { line: number; column: number };
}

export interface GitChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  staged: boolean;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface UserPreferences {
  codeStyle: 'concise' | 'verbose' | 'documented';
  testCoverage: 'minimal' | 'standard' | 'comprehensive';
  reviewDepth: 'quick' | 'standard' | 'thorough';
  language: 'zh-CN' | 'en-US';
}

export interface AgentResult {
  taskId: string;
  agent: AgentRole;
  status: 'success' | 'partial' | 'failed';
  output: Record<string, unknown>;
  artifacts?: AgentArtifact[];
  suggestions?: string[];
  nextSteps?: string[];
  metrics: ResultMetrics;
}

export interface ResultMetrics {
  executionTime: number;
  tokensUsed: number;
  filesModified: number;
  testsGenerated: number;
}

export interface AgentArtifact {
  type: 'code' | 'test' | 'document' | 'config' | 'diff';
  path: string;
  content: string;
  language?: string;
  isNew: boolean;
  diff?: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
  type: 'add' | 'delete' | 'context';
}

export interface PlannerOutput {
  tasks: TaskDefinition[];
  dependencies: TaskDependency[];
  estimatedTime: number;
  riskAssessment: RiskAssessment[];
  recommendedSequence: string[];
}

export interface TaskDefinition {
  id: string;
  type: TaskType;
  description: string;
  priority: TaskPriority;
  estimatedComplexity: 'low' | 'medium' | 'high';
  requiredTools: string[];
  inputContext: string[];
  expectedOutput: string;
  dependencies?: string[];
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  type: 'hard' | 'soft';
}

export interface RiskAssessment {
  type: 'technical' | 'resource' | 'dependency';
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface CoderOutput {
  files: FileChange[];
  summary: string;
  dependencies: string[];
  breakingChanges: string[];
  documentation: string;
}

export interface FileChange {
  path: string;
  action: 'create' | 'modify' | 'delete';
  content: string;
  diff: string;
  language: string;
}

export interface TesterOutput {
  testFiles: TestFile[];
  coverage: CoverageReport;
  results: TestResult[];
  recommendations: string[];
}

export interface TestFile {
  path: string;
  content: string;
  type: 'unit' | 'integration' | 'e2e';
  testCount: number;
}

export interface CoverageReport {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export interface ReviewerOutput {
  score: number;
  categories: ReviewCategory[];
  issues: ReviewIssue[];
  suggestions: string[];
  approved: boolean;
}

export interface ReviewCategory {
  name: string;
  score: number;
  weight: number;
}

export interface ReviewIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: 'bug' | 'security' | 'performance' | 'style' | 'best-practice';
  file: string;
  line: number;
  message: string;
  suggestion: string;
}

export const AGENT_ROLE_NAMES: Record<AgentRole, string> = {
  planner: '规划智能体',
  coder: '编码智能体',
  tester: '测试智能体',
  reviewer: '评审智能体',
};

export const AGENT_ROLE_DESCRIPTIONS: Record<AgentRole, string> = {
  planner: '分析需求、分解任务、制定执行计划',
  coder: '生成代码、重构、修复 Bug、编写文档',
  tester: '生成测试、运行测试、分析覆盖率',
  reviewer: '代码审查、安全检测、性能分析',
};

export const DEFAULT_AGENT_CONFIGS: Record<AgentRole, AgentConfig> = {
  planner: {
    role: 'planner',
    enabled: true,
    maxRetries: 2,
    timeout: 60000,
    priority: 1,
    modelPreference: 'reasoning',
  },
  coder: {
    role: 'coder',
    enabled: true,
    maxRetries: 3,
    timeout: 120000,
    priority: 2,
    modelPreference: 'code',
  },
  tester: {
    role: 'tester',
    enabled: true,
    maxRetries: 2,
    timeout: 90000,
    priority: 3,
    modelPreference: 'code',
  },
  reviewer: {
    role: 'reviewer',
    enabled: true,
    maxRetries: 2,
    timeout: 60000,
    priority: 4,
    modelPreference: 'reasoning',
  },
};
