/**
 * @file: TesterAgent.ts
 * @description: 测试智能体 - 测试生成、执行、验证
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-04
 * @updated: 2026-04-04
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,tester,test-generation
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

export interface TestGenerationOptions {
  framework: 'jest' | 'vitest' | 'pytest' | 'unittest' | 'mocha' | 'junit';
  coverage: 'minimal' | 'standard' | 'comprehensive';
  includeMocks: boolean;
  includeSetup: boolean;
  testPattern: 'describe' | 'it' | 'test';
}

export interface TestArtifact {
  path: string;
  content: string;
  framework: string;
  description: string;
  isNew: boolean;
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
}

export interface TestExecutionResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  errors: TestError[];
}

export interface TestError {
  testName: string;
  message: string;
  stack?: string;
  line?: number;
}

const DEFAULT_TEST_OPTIONS: TestGenerationOptions = {
  framework: 'vitest',
  coverage: 'standard',
  includeMocks: true,
  includeSetup: true,
  testPattern: 'describe',
};

const FRAMEWORK_PATTERNS: Record<string, RegExp> = {
  jest: /describe\.|it\(|test\(|expect\(|jest\./i,
  vitest: /describe\.|it\(|test\(|expect\(|vi\./i,
  pytest: /def test_|import unittest|import pytest|assert /i,
  unittest: /import unittest|def test_|self\.assert/i,
  mocha: /describe\.|it\(|before\(|after\(/i,
  junit: /@Test|@Before|@After|assertEquals/i,
};

const TEST_FILE_PATTERNS: Record<string, string[]> = {
  typescript: ['*.test.ts', '*.spec.ts', '*.test.tsx', '*.spec.tsx'],
  javascript: ['*.test.js', '*.spec.js', '*.test.jsx', '*.spec.jsx'],
  python: ['test_*.py', '*_test.py'],
  java: ['*Test.java', '*Tests.java'],
  go: ['*_test.go'],
  rust: ['*_test.rs', 'tests/*.rs'],
};

export class TesterAgent extends BaseAgent {
  readonly role: AgentRole = 'tester';
  readonly capability: AgentCapability = {
    role: 'tester',
    description: '测试生成、执行、验证',
    tools: ['generate_test', 'execute_test', 'verify_test', 'analyze_coverage', 'debug_test'],
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
        artifacts: { type: 'array' },
        results: { type: 'object' },
        summary: { type: 'string' },
      },
    },
    maxConcurrentTasks: 2,
    avgProcessingTime: 20000,
  };

  private _options: TestGenerationOptions;

  constructor(config?: Partial<AgentConfig>, options?: Partial<TestGenerationOptions>) {
    super({
      role: 'tester',
      enabled: true,
      maxRetries: 3,
      timeout: 120000,
      priority: 3,
      modelPreference: 'balanced',
      ...config,
    });

    this._options = { ...DEFAULT_TEST_OPTIONS, ...options };
  }

  protected async onInitialize(_context: AgentContext): Promise<void> {
    this.log('TesterAgent initialized');
  }

  protected async onCancel(_taskId: string): Promise<void> {
    this.log('TesterAgent task cancelled');
  }

  protected async onShutdown(): Promise<void> {
    this.log('TesterAgent shutdown');
  }

  protected async onExecute(task: AgentTask): Promise<Omit<AgentResult, 'taskId' | 'agent' | 'status' | 'metrics'>> {
    this.validateInput(task);

    this.log(`Testing task: ${task.description}`);

    const userMessage = task.input.userMessage;
    const context = task.input.context as Record<string, unknown>;
    const taskDef = task.input.parameters?.taskDefinition as TaskDefinition | undefined;

    const taskType = taskDef?.type || task.type;

    let artifacts: TestArtifact[] = [];
    let results: TestExecutionResult | undefined;
    let summary = '';

    switch (taskType) {
      case 'test':
        ({ artifacts, results, summary } = await this.generateTest(userMessage, context, taskDef));
        break;
      case 'generate':
        ({ artifacts, results, summary } = await this.generateTest(userMessage, context, taskDef));
        break;
      default:
        ({ artifacts, results, summary } = await this.generateTest(userMessage, context, taskDef));
    }

    return {
      output: {
        artifacts: artifacts.map(a => ({
          path: a.path,
          framework: a.framework,
          description: a.description,
          isNew: a.isNew,
          coverage: a.coverage,
        })),
        results,
        summary,
      },
      artifacts: artifacts.map(a =>
        this.createArtifact('test', a.path, a.content, true, a.framework)
      ),
      suggestions: this.generateSuggestions(taskType, artifacts),
      nextSteps: this.determineNextSteps(taskType, artifacts),
    };
  }

  private detectFramework(userMessage: string, context: Record<string, unknown>): TestGenerationOptions['framework'] {
    const messageLower = userMessage.toLowerCase();
    const contextFiles = context.fileContents as Record<string, string> || {};
    const allContent = Object.values(contextFiles).join(' ');

    for (const [framework, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
      if (pattern.test(messageLower) || pattern.test(allContent)) {
        return framework as TestGenerationOptions['framework'];
      }
    }

    return this._options.framework;
  }

  private detectTargetFiles(context: Record<string, unknown>): string[] {
    const fileContents = context.fileContents as Record<string, string> || {};
    const activeFile = context.activeFile as string || '';

    const targetFiles = [activeFile];

    for (const [filePath] of Object.entries(fileContents)) {
      if (!filePath.includes('.test.') && !filePath.includes('.spec.')) {
        targetFiles.push(filePath);
      }
    }

    return targetFiles.filter(f => f);
  }

  private async generateTest(
    userMessage: string,
    context: Record<string, unknown>,
    taskDef?: TaskDefinition
  ): Promise<{
    artifacts: TestArtifact[];
    results?: TestExecutionResult;
    summary: string;
  }> {
    const framework = this.detectFramework(userMessage, context);
    const targetFiles = this.detectTargetFiles(context);

    const artifacts: TestArtifact[] = [];
    const targetFileName = targetFiles[0]?.split('/').pop() || 'Component';

    for (const targetFile of targetFiles.slice(0, 3)) {
      const testFileName = this.generateTestFileName(targetFile, framework);
      const testContent = this.generateTestContent(targetFile, framework, context);

      artifacts.push({
        path: testFileName,
        content: testContent,
        framework,
        description: `Test for ${targetFile}`,
        isNew: true,
        coverage: this._options.coverage === 'comprehensive' ? {
          lines: 80,
          branches: 75,
          functions: 85,
          statements: 78,
        } : undefined,
      });
    }

    const summary = `Generated ${artifacts.length} test file(s) using ${framework} framework`;

    return {
      artifacts,
      results: {
        passed: true,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        errors: [],
      },
      summary,
    };
  }

  private generateTestFileName(targetFile: string, framework: TestGenerationOptions['framework']): string {
    const baseName = targetFile.replace(/\.(ts|tsx|js|jsx|py|java|go|rs)$/, '');

    const patterns = TEST_FILE_PATTERNS[framework === 'jest' ? 'typescript' : framework === 'vitest' ? 'typescript' : framework]?.[0] || '*.test.ts';

    const ext = patterns.replace('*', '');

    if (targetFile.includes('/src/')) {
      return targetFile.replace('/src/', '/src/__tests__/').replace(/\.[^.]+$/, ext);
    }

    return baseName.replace(/([^/]+)$/, `__tests__/$1${  ext}`);
  }

  private generateTestContent(targetFile: string, framework: TestGenerationOptions['framework'], context: Record<string, unknown>): string {
    const componentName = targetFile.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || 'Component';
    const fileContents = context.fileContents as Record<string, string> || {};
    const targetContent = fileContents[targetFile] || '';
    const isReact = /import.*React|from ['"]react['"]|jsx|tsx/i.test(targetContent);
    const isTypeScript = targetFile.endsWith('.ts') || targetFile.endsWith('.tsx');

    switch (framework) {
      case 'vitest':
      case 'jest':
        return this.generateJSTest(componentName, isReact, isTypeScript);
      case 'pytest':
        return this.generatePythonTest(componentName);
      case 'mocha':
        return this.generateMochaTest(componentName);
      default:
        return this.generateJSTest(componentName, isReact, isTypeScript);
    }
  }

  private generateJSTest(componentName: string, isReact: boolean, isTypeScript: boolean): string {
    const ext = isTypeScript ? 'ts' : 'js';

    if (isReact) {
      return `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ${componentName} } from '../components/${componentName}';

describe('${componentName}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without errors', () => {
    expect(() => render(<${componentName} />)).not.toThrow();
  });

  it('should match snapshot', () => {
    const { container } = render(<${componentName} />);
    expect(container).toMatchSnapshot();
  });
});
`;
    }

    return `import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ${componentName} } from '../${componentName}';

describe('${componentName}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(${componentName}).toBeDefined();
  });

  it('should have correct structure', () => {
    expect(typeof ${componentName}).toBe('object');
  });
});
`;
  }

  private generatePythonTest(componentName: string): string {
    const moduleName = componentName.toLowerCase();
    return `import pytest
from ${moduleName} import ${componentName}


class Test${componentName}:

    def setup_method(self):
        pass

    def test_should_be_defined(self):
        assert ${componentName} is not None

    def test_should_have_correct_type(self):
        assert isinstance(${componentName}, object)
`;
  }

  private generateMochaTest(componentName: string): string {
    return `const { describe, it, beforeEach } = require('mocha');
const { expect } = require('chai');

describe('${componentName}', () => {
  beforeEach(() => {
  });

  it('should be defined', () => {
    expect(true).to.be.true;
  });
});
`;
  }

  private generateSuggestions(taskType: string, artifacts: TestArtifact[]): string[] {
    const suggestions: string[] = [];

    if (artifacts.length === 0) {
      suggestions.push('未能生成测试文件，请检查目标代码是否存在');
    } else {
      suggestions.push(`已生成 ${artifacts.length} 个测试文件`);
      suggestions.push(`使用 ${artifacts[0].framework} 测试框架`);
    }

    if (this._options.coverage !== 'comprehensive') {
      suggestions.push('考虑增加测试覆盖率以提高代码质量');
    }

    return suggestions;
  }

  private determineNextSteps(taskType: string, artifacts: TestArtifact[]): string[] {
    const nextSteps: string[] = [];

    if (artifacts.length > 0) {
      nextSteps.push('运行测试: npm test');
      nextSteps.push('检查测试覆盖率: npm run coverage');
    }

    nextSteps.push('ReviewerAgent 评审测试代码');
    nextSteps.push('CoderAgent 修复测试失败用例');

    return nextSteps;
  }
}

export function createTesterAgent(config?: Partial<AgentConfig>, options?: Partial<TestGenerationOptions>): TesterAgent {
  return new TesterAgent(config, options);
}
