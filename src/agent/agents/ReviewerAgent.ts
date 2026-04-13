/**
 * @file: ReviewerAgent.ts
 * @description: 评审智能体 - 代码审查、质量检查、最佳实践验证
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-04
 * @updated: 2026-04-04
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,reviewer,code-review
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
} from '../types';

export interface ReviewOptions {
  depth: 'quick' | 'standard' | 'thorough';
  focus: ReviewFocus[];
  checkSecurity: boolean;
  checkPerformance: boolean;
  checkBestPractices: boolean;
  checkAccessibility: boolean;
}

export type ReviewFocus = 'security' | 'performance' | 'maintainability' | 'readability' | 'testing' | 'documentation' | 'accessibility';

export interface ReviewFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: ReviewFocus;
  file: string;
  line?: number;
  column?: number;
  message: string;
  suggestion: string;
  ruleId?: string;
  documentation?: string;
}

export interface ReviewResult {
  passed: boolean;
  score: number;
  findings: ReviewFinding[];
  summary: ReviewSummary;
  metrics: ReviewMetrics;
}

export interface ReviewSummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  infoIssues: number;
  filesReviewed: number;
  linesReviewed: number;
}

export interface ReviewMetrics {
  codeQuality: number;
  security: number;
  performance: number;
  maintainability: number;
  testCoverage: number;
  documentation: number;
}

const DEFAULT_REVIEW_OPTIONS: ReviewOptions = {
  depth: 'standard',
  focus: ['security', 'performance', 'maintainability', 'readability'],
  checkSecurity: true,
  checkPerformance: true,
  checkBestPractices: true,
  checkAccessibility: false,
};

const SECURITY_PATTERNS = [
  { pattern: /eval\s*\(/gi, severity: 'critical' as const, message: '使用 eval() 存在安全风险', suggestion: '避免使用 eval()，考虑更安全的替代方案' },
  { pattern: /innerHTML\s*=/gi, severity: 'high' as const, message: '直接设置 innerHTML 可能导致 XSS', suggestion: '使用 textContent 或 DOMPurify 进行清理' },
  { pattern: /dangerouslySetInnerHTML/gi, severity: 'high' as const, message: 'React dangerouslySetInnerHTML 可能导致 XSS', suggestion: '确保内容经过充分清理' },
  { pattern: /password\s*=\s*['"][^'"]+['"]/gi, severity: 'critical' as const, message: '硬编码密码', suggestion: '使用环境变量存储敏感信息' },
  { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi, severity: 'critical' as const, message: '硬编码 API Key', suggestion: '使用环境变量存储 API Key' },
  { pattern: /localStorage\.setItem\s*\(\s*['"]token/gi, severity: 'medium' as const, message: 'Token 存储在 localStorage', suggestion: '考虑使用 httpOnly cookie 或 sessionStorage' },
];

const PERFORMANCE_PATTERNS = [
  { pattern: /\.map\s*\([^)]*\)\.map\s*\(/gi, severity: 'medium' as const, message: '链式 .map() 调用可能影响性能', suggestion: '考虑合并为单个 .map() 或使用 .flatMap()' },
  { pattern: /for\s*\([^)]*\)\s*{\s*for\s*\(/gi, severity: 'high' as const, message: '嵌套循环可能导致性能问题', suggestion: '考虑使用 Map 或优化算法复杂度' },
  { pattern: /useEffect\s*\([^)]*\[\s*\]/gi, severity: 'low' as const, message: '空依赖数组的 useEffect', suggestion: '确认是否需要在每次渲染时执行' },
  { pattern: /console\.log\s*\(/gi, severity: 'low' as const, message: '生产代码中的 console.log', suggestion: '移除或使用条件日志' },
];

const BEST_PRACTICE_PATTERNS = [
  { pattern: /var\s+/g, severity: 'medium' as const, message: '使用 var 声明变量', suggestion: '使用 const 或 let 替代 var' },
  { pattern: /==\s*['"]|['"]\s*==/g, severity: 'low' as const, message: '使用 == 进行比较', suggestion: '使用 === 进行严格比较' },
  { pattern: /any\s*;/g, severity: 'medium' as const, message: 'TypeScript any 类型', suggestion: '使用具体类型或 unknown' },
  { pattern: /TODO|FIXME|HACK|XXX/gi, severity: 'info' as const, message: '发现待办事项注释', suggestion: '处理待办事项或创建 Issue' },
];

export class ReviewerAgent extends BaseAgent {
  readonly role: AgentRole = 'reviewer';
  readonly capability: AgentCapability = {
    role: 'reviewer',
    description: '代码审查、质量检查、最佳实践验证',
    tools: ['review_code', 'check_security', 'check_performance', 'check_best_practices', 'generate_report'],
    inputSchema: {
      type: 'object',
      properties: {
        userMessage: { type: 'string' },
        context: { type: 'object' },
        taskDefinition: { type: 'object' },
        options: { type: 'object' },
      },
      required: ['userMessage'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        result: { type: 'object' },
        findings: { type: 'array' },
        summary: { type: 'string' },
      },
    },
    maxConcurrentTasks: 2,
    avgProcessingTime: 25000,
  };

  private _options: ReviewOptions;

  constructor(config?: Partial<AgentConfig>, options?: Partial<ReviewOptions>) {
    super({
      role: 'reviewer',
      enabled: true,
      maxRetries: 3,
      timeout: 120000,
      priority: 4,
      modelPreference: 'balanced',
      ...config,
    });

    this._options = { ...DEFAULT_REVIEW_OPTIONS, ...options };
  }

  protected async onInitialize(_context: AgentContext): Promise<void> {
    this.log('ReviewerAgent initialized');
  }

  protected async onCancel(_taskId: string): Promise<void> {
    this.log('ReviewerAgent task cancelled');
  }

  protected async onShutdown(): Promise<void> {
    this.log('ReviewerAgent shutdown');
  }

  protected async onExecute(task: AgentTask): Promise<Omit<AgentResult, 'taskId' | 'agent' | 'status' | 'metrics'>> {
    this.validateInput(task);

    this.log(`Reviewing task: ${task.description}`);

    const userMessage = task.input.userMessage;
    const context = task.input.context as Record<string, unknown>;
    const taskDef = task.input.parameters?.taskDefinition as TaskDefinition | undefined;

    const taskType = taskDef?.type || task.type;

    let result: ReviewResult;
    let summary = '';

    switch (taskType) {
      case 'review':
        ({ result, summary } = await this.performReview(userMessage, context, taskDef));
        break;
      default:
        ({ result, summary } = await this.performReview(userMessage, context, taskDef));
    }

    return {
      output: {
        result: {
          passed: result.passed,
          score: result.score,
          summary: result.summary,
          metrics: result.metrics,
        },
        findings: result.findings,
        summary,
      },
      artifacts: [
        this.createArtifact('document', 'review-report.md', this.generateReport(result), true, 'markdown'),
      ],
      suggestions: this.generateSuggestions(result),
      nextSteps: this.determineNextSteps(result),
    };
  }

  private async performReview(
    userMessage: string,
    context: Record<string, unknown>,
    taskDef?: TaskDefinition
  ): Promise<{ result: ReviewResult; summary: string }> {
    const fileContents = context.fileContents as Record<string, string> || {};
    const activeFile = context.activeFile as string || '';

    const filesToReview = activeFile ? [activeFile] : Object.keys(fileContents);

    const allFindings: ReviewFinding[] = [];
    let totalLines = 0;

    for (const filePath of filesToReview) {
      const content = fileContents[filePath];
      if (!content) continue;

      const lines = content.split('\n');
      totalLines += lines.length;

      if (this._options.checkSecurity) {
        allFindings.push(...this.checkSecurityPatterns(filePath, content, lines));
      }

      if (this._options.checkPerformance) {
        allFindings.push(...this.checkPerformancePatterns(filePath, content, lines));
      }

      if (this._options.checkBestPractices) {
        allFindings.push(...this.checkBestPractices(filePath, content, lines));
      }
    }

    const summary: ReviewSummary = {
      totalIssues: allFindings.length,
      criticalIssues: allFindings.filter(f => f.severity === 'critical').length,
      highIssues: allFindings.filter(f => f.severity === 'high').length,
      mediumIssues: allFindings.filter(f => f.severity === 'medium').length,
      lowIssues: allFindings.filter(f => f.severity === 'low').length,
      infoIssues: allFindings.filter(f => f.severity === 'info').length,
      filesReviewed: filesToReview.length,
      linesReviewed: totalLines,
    };

    const metrics = this.calculateMetrics(allFindings, totalLines);

    const score = this.calculateScore(summary, metrics);

    const result: ReviewResult = {
      passed: summary.criticalIssues === 0 && summary.highIssues === 0,
      score,
      findings: allFindings,
      summary,
      metrics,
    };

    const summaryText = `Reviewed ${summary.filesReviewed} file(s), ${summary.linesReviewed} lines. Found ${summary.totalIssues} issues (Critical: ${summary.criticalIssues}, High: ${summary.highIssues})`;

    return { result, summary: summaryText };
  }

  private checkSecurityPatterns(filePath: string, content: string, lines: string[]): ReviewFinding[] {
    const findings: ReviewFinding[] = [];

    for (const { pattern, severity, message, suggestion } of SECURITY_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(content)) !== null) {
        const lineNumber = this.findLineNumber(content, match.index);
        findings.push({
          id: `SEC-${findings.length + 1}`,
          severity,
          category: 'security',
          file: filePath,
          line: lineNumber,
          message,
          suggestion,
          ruleId: pattern.source.slice(0, 20),
        });
      }
    }

    return findings;
  }

  private checkPerformancePatterns(filePath: string, content: string, lines: string[]): ReviewFinding[] {
    const findings: ReviewFinding[] = [];

    for (const { pattern, severity, message, suggestion } of PERFORMANCE_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(content)) !== null) {
        const lineNumber = this.findLineNumber(content, match.index);
        findings.push({
          id: `PERF-${findings.length + 1}`,
          severity,
          category: 'performance',
          file: filePath,
          line: lineNumber,
          message,
          suggestion,
        });
      }
    }

    return findings;
  }

  private checkBestPractices(filePath: string, content: string, lines: string[]): ReviewFinding[] {
    const findings: ReviewFinding[] = [];

    for (const { pattern, severity, message, suggestion } of BEST_PRACTICE_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(content)) !== null) {
        const lineNumber = this.findLineNumber(content, match.index);
        findings.push({
          id: `BP-${findings.length + 1}`,
          severity,
          category: 'maintainability',
          file: filePath,
          line: lineNumber,
          message,
          suggestion,
        });
      }
    }

    return findings;
  }

  private findLineNumber(content: string, index: number): number {
    const beforeMatch = content.slice(0, index);
    return beforeMatch.split('\n').length;
  }

  private calculateMetrics(findings: ReviewFinding[], totalLines: number): ReviewMetrics {
    const securityIssues = findings.filter(f => f.category === 'security').length;
    const performanceIssues = findings.filter(f => f.category === 'performance').length;
    const maintainabilityIssues = findings.filter(f => f.category === 'maintainability').length;

    const baseScore = 100;
    const securityPenalty = Math.min(securityIssues * 10, 50);
    const performancePenalty = Math.min(performanceIssues * 5, 30);
    const maintainabilityPenalty = Math.min(maintainabilityIssues * 3, 20);

    return {
      codeQuality: Math.max(0, baseScore - maintainabilityPenalty),
      security: Math.max(0, baseScore - securityPenalty),
      performance: Math.max(0, baseScore - performancePenalty),
      maintainability: Math.max(0, baseScore - maintainabilityPenalty),
      testCoverage: 0,
      documentation: 0,
    };
  }

  private calculateScore(summary: ReviewSummary, metrics: ReviewMetrics): number {
    const weights = {
      security: 0.3,
      performance: 0.2,
      maintainability: 0.2,
      codeQuality: 0.3,
    };

    return Math.round(
      metrics.security * weights.security +
      metrics.performance * weights.performance +
      metrics.maintainability * weights.maintainability +
      metrics.codeQuality * weights.codeQuality
    );
  }

  private generateReport(result: ReviewResult): string {
    const lines: string[] = [
      `# Code Review Report`,
      ``,
      `## Summary`,
      ``,
      `- **Score**: ${result.score}/100`,
      `- **Status**: ${result.passed ? '✅ Passed' : '❌ Failed'}`,
      `- **Files Reviewed**: ${result.summary.filesReviewed}`,
      `- **Lines Reviewed**: ${result.summary.linesReviewed}`,
      ``,
      `## Issues`,
      ``,
      `| Severity | Count |`,
      `|----------|-------|`,
      `| 🔴 Critical | ${result.summary.criticalIssues} |`,
      `| 🟠 High | ${result.summary.highIssues} |`,
      `| 🟡 Medium | ${result.summary.mediumIssues} |`,
      `| 🔵 Low | ${result.summary.lowIssues} |`,
      `| ℹ️ Info | ${result.summary.infoIssues} |`,
      ``,
      `## Metrics`,
      ``,
      `| Category | Score |`,
      `|----------|-------|`,
      `| Security | ${result.metrics.security}/100 |`,
      `| Performance | ${result.metrics.performance}/100 |`,
      `| Maintainability | ${result.metrics.maintainability}/100 |`,
      `| Code Quality | ${result.metrics.codeQuality}/100 |`,
      ``,
    ];

    if (result.findings.length > 0) {
      lines.push(`## Detailed Findings`, ``);

      for (const finding of result.findings.slice(0, 20)) {
        lines.push(`### ${finding.id}`);
        lines.push(``);
        lines.push(`- **Severity**: ${finding.severity}`);
        lines.push(`- **File**: ${finding.file}${finding.line ? `:${finding.line}` : ''}`);
        lines.push(`- **Message**: ${finding.message}`);
        lines.push(`- **Suggestion**: ${finding.suggestion}`);
        lines.push(``);
      }
    }

    return lines.join('\n');
  }

  private generateSuggestions(result: ReviewResult): string[] {
    const suggestions: string[] = [];

    if (result.summary.criticalIssues > 0) {
      suggestions.push(`🔴 发现 ${result.summary.criticalIssues} 个严重问题，需要立即修复`);
    }

    if (result.summary.highIssues > 0) {
      suggestions.push(`🟠 发现 ${result.summary.highIssues} 个高优先级问题，建议优先处理`);
    }

    if (result.metrics.security < 70) {
      suggestions.push('安全评分较低，建议进行安全审计');
    }

    if (result.metrics.performance < 70) {
      suggestions.push('性能评分较低，建议优化性能瓶颈');
    }

    if (result.passed) {
      suggestions.push('✅ 代码审查通过，质量良好');
    }

    return suggestions;
  }

  private determineNextSteps(result: ReviewResult): string[] {
    const nextSteps: string[] = [];

    if (result.summary.criticalIssues > 0 || result.summary.highIssues > 0) {
      nextSteps.push('CoderAgent 修复发现的问题');
    }

    if (result.summary.mediumIssues > 0) {
      nextSteps.push('评估中优先级问题是否需要修复');
    }

    nextSteps.push('运行测试验证修复效果');
    nextSteps.push('更新文档记录变更');

    return nextSteps;
  }
}

export function createReviewerAgent(config?: Partial<AgentConfig>, options?: Partial<ReviewOptions>): ReviewerAgent {
  return new ReviewerAgent(config, options);
}
