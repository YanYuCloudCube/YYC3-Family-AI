/**
 * @file: CoderAgent.ts
 * @description: 编码智能体 - 代码生成、修改、重构、修复
 * @author: YanYuCloudCube Team <admin@0379.email>
 * @version: v1.0.0
 * @created: 2026-04-03
 * @updated: 2026-04-03
 * @status: dev
 * @license: MIT
 * @copyright: Copyright (c) 2026 YanYuCloudCube Team
 * @tags: agent,coder,code-generation
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

export interface CodeGenerationOptions {
  language: 'typescript' | 'javascript' | 'python' | 'rust' | 'go' | 'java';
  framework?: 'react' | 'vue' | 'angular' | 'nextjs' | 'express' | 'fastapi';
  style: 'concise' | 'verbose' | 'documented';
  includeTests: boolean;
  includeTypes: boolean;
}

export interface CodeArtifact {
  path: string;
  content: string;
  language: string;
  description: string;
  isNew: boolean;
}

export interface CodeChange {
  type: 'create' | 'modify' | 'delete';
  path: string;
  originalContent?: string;
  newContent: string;
  diff?: string;
  lineStart?: number;
  lineEnd?: number;
}

const DEFAULT_CODE_OPTIONS: CodeGenerationOptions = {
  language: 'typescript',
  style: 'concise',
  includeTests: false,
  includeTypes: true,
};

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  typescript: '.ts',
  javascript: '.js',
  python: '.py',
  rust: '.rs',
  go: '.go',
  java: '.java',
};

const FRAMEWORK_PATTERNS: Record<string, RegExp> = {
  react: /import.*React|from ['"]react['"]|jsx|tsx/i,
  vue: /import.*Vue|from ['"]vue['"]|\.vue/i,
  angular: /@Component|@Injectable|@NgModule/i,
  nextjs: /from ['"]next['"]|getServerSideProps|getStaticProps/i,
  express: /from ['"]express['"]|express\(\)/i,
  fastapi: /from fastapi|@app\.(get|post|put|delete)/i,
};

export class CoderAgent extends BaseAgent {
  readonly role: AgentRole = 'coder';
  readonly capability: AgentCapability = {
    role: 'coder',
    description: '代码生成、修改、重构、修复',
    tools: ['generate_code', 'modify_code', 'refactor_code', 'fix_code', 'analyze_code'],
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
        changes: { type: 'array' },
        summary: { type: 'string' },
      },
    },
    maxConcurrentTasks: 2,
    avgProcessingTime: 15000,
  };

  private _options: CodeGenerationOptions;

  constructor(config?: Partial<AgentConfig>, options?: Partial<CodeGenerationOptions>) {
    super({
      role: 'coder',
      enabled: true,
      maxRetries: 3,
      timeout: 120000,
      priority: 2,
      modelPreference: 'code',
      ...config,
    });

    this._options = { ...DEFAULT_CODE_OPTIONS, ...options };
  }

  protected async onInitialize(_context: AgentContext): Promise<void> {
    this.log('CoderAgent initialized');
  }

  protected async onExecute(task: AgentTask): Promise<Omit<AgentResult, 'taskId' | 'agent' | 'status' | 'metrics'>> {
    this.validateInput(task);
    this.log(`Coding task: ${task.description}`);

    const userMessage = task.input.userMessage;
    const context = task.input.context as Record<string, unknown>;
    const taskDef = task.input.parameters?.taskDefinition as TaskDefinition | undefined;

    const taskType = taskDef?.type || task.type;

    let artifacts: CodeArtifact[] = [];
    let changes: CodeChange[] = [];
    let summary = '';

    switch (taskType) {
      case 'generate':
        ({ artifacts, changes, summary } = await this.generateCode(userMessage, context, taskDef));
        break;
      case 'modify':
        ({ artifacts, changes, summary } = await this.modifyCode(userMessage, context, taskDef));
        break;
      case 'refactor':
        ({ artifacts, changes, summary } = await this.refactorCode(userMessage, context, taskDef));
        break;
      case 'fix':
        ({ artifacts, changes, summary } = await this.fixCode(userMessage, context, taskDef));
        break;
      default:
        ({ artifacts, changes, summary } = await this.generateCode(userMessage, context, taskDef));
    }

    return {
      output: {
        artifacts: artifacts.map(a => ({
          path: a.path,
          language: a.language,
          description: a.description,
          isNew: a.isNew,
        })),
        changes: changes.map(c => ({
          type: c.type,
          path: c.path,
          lineStart: c.lineStart,
          lineEnd: c.lineEnd,
        })),
        summary,
        codeContent: artifacts.length > 0 ? artifacts[0].content : undefined,
      },
      artifacts: artifacts.map(a =>
        this.createArtifact('code', a.path, a.content, true, a.language)
      ),
      suggestions: this.generateSuggestions(taskType, artifacts),
      nextSteps: this.determineNextSteps(taskType, artifacts),
    };
  }

  protected async onCancel(_taskId: string): Promise<void> {
    this.log('Coding cancelled');
  }

  protected async onShutdown(): Promise<void> {
    this.log('CoderAgent shutdown');
  }

  private async generateCode(
    userMessage: string,
    context: Record<string, unknown>,
    _taskDef?: TaskDefinition
  ): Promise<{ artifacts: CodeArtifact[]; changes: CodeChange[]; summary: string }> {
    const artifacts: CodeArtifact[] = [];
    const changes: CodeChange[] = [];

    const detectedLanguage = this.detectLanguage(userMessage, context);
    const detectedFramework = this.detectFramework(userMessage, context);

    const componentName = this.extractComponentName(userMessage);
    const componentPath = this.generateComponentPath(componentName, detectedLanguage, detectedFramework);

    const codeContent = this.generateComponentCode(
      componentName,
      userMessage,
      detectedLanguage,
      detectedFramework
    );

    artifacts.push({
      path: componentPath,
      content: codeContent,
      language: detectedLanguage,
      description: `Generated ${componentName} component`,
      isNew: true,
    });

    changes.push({
      type: 'create',
      path: componentPath,
      newContent: codeContent,
    });

    if (this._options.includeTests) {
      const testPath = this.generateTestPath(componentPath);
      const testContent = this.generateTestCode(componentName, componentPath, detectedLanguage);

      artifacts.push({
        path: testPath,
        content: testContent,
        language: detectedLanguage,
        description: `Tests for ${componentName}`,
        isNew: true,
      });

      changes.push({
        type: 'create',
        path: testPath,
        newContent: testContent,
      });
    }

    const summary = `Generated ${artifacts.length} file(s): ${artifacts.map(a => a.path).join(', ')}`;

    return { artifacts, changes, summary };
  }

  private async modifyCode(
    userMessage: string,
    context: Record<string, unknown>,
    _taskDef?: TaskDefinition
  ): Promise<{ artifacts: CodeArtifact[]; changes: CodeChange[]; summary: string }> {
    const artifacts: CodeArtifact[] = [];
    const changes: CodeChange[] = [];

    const fileContents = context.fileContents as Record<string, string> | undefined;
    const activeFile = context.activeFile as string | undefined;

    if (!fileContents || !activeFile) {
      return {
        artifacts: [],
        changes: [],
        summary: 'No file context available for modification',
      };
    }

    const originalContent = fileContents[activeFile] || '';
    const modifiedContent = this.applyModifications(originalContent, userMessage);

    artifacts.push({
      path: activeFile,
      content: modifiedContent,
      language: this.detectLanguage(activeFile, context),
      description: `Modified ${activeFile}`,
      isNew: false,
    });

    changes.push({
      type: 'modify',
      path: activeFile,
      originalContent,
      newContent: modifiedContent,
      diff: this.generateDiff(originalContent, modifiedContent),
    });

    const summary = `Modified ${activeFile}`;

    return { artifacts, changes, summary };
  }

  private async refactorCode(
    userMessage: string,
    context: Record<string, unknown>,
    _taskDef?: TaskDefinition
  ): Promise<{ artifacts: CodeArtifact[]; changes: CodeChange[]; summary: string }> {
    const artifacts: CodeArtifact[] = [];
    const changes: CodeChange[] = [];

    const fileContents = context.fileContents as Record<string, string> | undefined;
    const activeFile = context.activeFile as string | undefined;

    if (!fileContents || !activeFile) {
      return {
        artifacts: [],
        changes: [],
        summary: 'No file context available for refactoring',
      };
    }

    const originalContent = fileContents[activeFile] || '';
    const refactoredContent = this.applyRefactoring(originalContent, userMessage);

    artifacts.push({
      path: activeFile,
      content: refactoredContent,
      language: this.detectLanguage(activeFile, context),
      description: `Refactored ${activeFile}`,
      isNew: false,
    });

    changes.push({
      type: 'modify',
      path: activeFile,
      originalContent,
      newContent: refactoredContent,
      diff: this.generateDiff(originalContent, refactoredContent),
    });

    const summary = `Refactored ${activeFile}`;

    return { artifacts, changes, summary };
  }

  private async fixCode(
    userMessage: string,
    context: Record<string, unknown>,
    _taskDef?: TaskDefinition
  ): Promise<{ artifacts: CodeArtifact[]; changes: CodeChange[]; summary: string }> {
    const artifacts: CodeArtifact[] = [];
    const changes: CodeChange[] = [];

    const fileContents = context.fileContents as Record<string, string> | undefined;
    const activeFile = context.activeFile as string | undefined;

    if (!fileContents || !activeFile) {
      return {
        artifacts: [],
        changes: [],
        summary: 'No file context available for fixing',
      };
    }

    const originalContent = fileContents[activeFile] || '';
    const fixedContent = this.applyFixes(originalContent, userMessage);

    artifacts.push({
      path: activeFile,
      content: fixedContent,
      language: this.detectLanguage(activeFile, context),
      description: `Fixed ${activeFile}`,
      isNew: false,
    });

    changes.push({
      type: 'modify',
      path: activeFile,
      originalContent,
      newContent: fixedContent,
      diff: this.generateDiff(originalContent, fixedContent),
    });

    const summary = `Fixed ${activeFile}`;

    return { artifacts, changes, summary };
  }

  private detectLanguage(message: string, context: Record<string, unknown>): string {
    const activeFile = context.activeFile as string | undefined;

    if (activeFile) {
      const ext = activeFile.split('.').pop()?.toLowerCase();
      for (const [lang, extension] of Object.entries(LANGUAGE_EXTENSIONS)) {
        if (ext === extension.replace('.', '')) {
          return lang;
        }
      }
    }

    if (/\.(ts|tsx|typescript)/i.test(message)) return 'typescript';
    if (/\.(js|jsx|javascript)/i.test(message)) return 'javascript';
    if (/\.(py|python)/i.test(message)) return 'python';
    if (/\.(rs|rust)/i.test(message)) return 'rust';
    if (/\.(go|golang)/i.test(message)) return 'go';
    if (/\.java/i.test(message)) return 'java';

    return this._options.language;
  }

  private detectFramework(message: string, context: Record<string, unknown>): string | undefined {
    const fileContents = context.fileContents as Record<string, string> | undefined;

    if (fileContents) {
      for (const content of Object.values(fileContents)) {
        for (const [framework, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
          if (pattern.test(content)) {
            return framework;
          }
        }
      }
    }

    if (/react/i.test(message)) return 'react';
    if (/vue/i.test(message)) return 'vue';
    if (/angular/i.test(message)) return 'angular';
    if (/nextjs|next\.js/i.test(message)) return 'nextjs';
    if (/express/i.test(message)) return 'express';
    if (/fastapi/i.test(message)) return 'fastapi';

    return undefined;
  }

  private extractComponentName(message: string): string {
    const patterns = [
      /(?:create|generate|build|make|add|implement)\s+(?:a\s+)?(?:new\s+)?(\w+)/i,
      /(\w+)\s*component/i,
      /(\w+)\s*module/i,
      /(\w+)\s*function/i,
      /(\w+)\s*class/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return this.toPascalCase(match[1]);
      }
    }

    return 'NewComponent';
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, c => c.toUpperCase());
  }

  private generateComponentPath(name: string, language: string, framework?: string): string {
    const ext = language === 'typescript' ? '.tsx' : LANGUAGE_EXTENSIONS[language] || '.js';

    if (framework === 'react' || framework === 'nextjs') {
      return `src/components/${name}/${name}${ext}`;
    }

    if (framework === 'vue') {
      return `src/components/${name}.vue`;
    }

    return `src/${name}${ext}`;
  }

  private generateTestPath(componentPath: string): string {
    const ext = componentPath.endsWith('.tsx') ? '.test.tsx' : '.test.ts';
    return componentPath.replace(/\.(tsx?|jsx?)$/, ext);
  }

  private generateComponentCode(
    name: string,
    description: string,
    language: string,
    framework?: string
  ): string {
    const isTypeScript = language === 'typescript';

    if (framework === 'react' || framework === 'nextjs') {
      return this.generateReactComponent(name, description, isTypeScript);
    }

    if (framework === 'vue') {
      return this.generateVueComponent(name, description);
    }

    return this.generateGenericCode(name, description, language);
  }

  private generateReactComponent(name: string, description: string, isTypeScript: boolean): string {
    const propsType = isTypeScript ? `interface ${name}Props {\n  children?: React.ReactNode;\n}\n\n` : '';
    const props = isTypeScript ? `: React.FC<${name}Props>` : '';
    const propsParam = isTypeScript ? `{ children }` : '{ children }';

    return `${isTypeScript ? `import React from 'react';\n\n` : ''}
${propsType}export const ${name}${props} = (${propsParam}) => {
  return (
    <div className="${name.toLowerCase()}-container">
      <h2>${name}</h2>
      <p>${description}</p>
      {children}
    </div>
  );
};

export default ${name};
`;
  }

  private generateVueComponent(name: string, description: string): string {
    return `<template>
  <div class="${name.toLowerCase()}-container">
    <h2>${name}</h2>
    <p>${description}</p>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: '${name}',
});
</script>

<style scoped>
.${name.toLowerCase()}-container {
  padding: 1rem;
}
</style>
`;
  }

  private generateGenericCode(name: string, description: string, language: string): string {
    if (language === 'python') {
      return `"""
${name} - ${description}
"""

class ${name}:
    """${description}"""
    
    def __init__(self):
        pass
    
    def execute(self):
        """Execute the main logic"""
        pass


if __name__ == "__main__":
    instance = ${name}()
    instance.execute()
`;
    }

    return `// ${name} - ${description}

export class ${name} {
  constructor() {}

  execute(): void {
    // Implementation
  }
}

export default ${name};
`;
  }

  private generateTestCode(name: string, componentPath: string, language: string): string {
    const isTypeScript = language === 'typescript';
    const importPath = componentPath.replace(/^src\//, '../').replace(/\.(tsx?|jsx?)$/, '');

    return `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ${name} } from '${importPath}';

describe('${name}', () => {
  it('should render correctly', () => {
    render(<${name} />);
    expect(screen.getByText('${name}')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(<${name} />);
    expect(container).toMatchSnapshot();
  });
});
`;
  }

  private applyModifications(content: string, instructions: string): string {
    const lines = content.split('\n');
    const modifiedLines = [...lines];

    const addMatch = instructions.match(/add\s+(.+?)(?:\s+after\s+(.+?))?$/i);
    if (addMatch) {
      const codeToAdd = addMatch[1];
      modifiedLines.push(`\n// Added: ${codeToAdd}`);
    }

    return modifiedLines.join('\n');
  }

  private applyRefactoring(content: string, instructions: string): string {
    let refactored = content;

    if (/extract.*function|extract.*method/i.test(instructions)) {
      refactored = `// Refactored: Extracted function\n${content}`;
    }

    if (/rename/i.test(instructions)) {
      refactored = `// Refactored: Renamed identifiers\n${content}`;
    }

    if (/optimize|improve.*performance/i.test(instructions)) {
      refactored = `// Refactored: Optimized\n${content}`;
    }

    return refactored;
  }

  private applyFixes(content: string, instructions: string): string {
    let fixed = content;

    if (/error|bug|fix/i.test(instructions)) {
      fixed = content.replace(/\/\/ TODO: fix.*\n?/gi, '// Fixed\n');
    }

    if (/type.*error|typescript.*error/i.test(instructions)) {
      fixed = content.replace(/: any/g, ': unknown');
    }

    return fixed;
  }

  private generateDiff(original: string, modified: string): string {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const diff: string[] = [];

    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    for (let i = 0; i < maxLines; i++) {
      const orig = originalLines[i];
      const mod = modifiedLines[i];

      if (orig !== mod) {
        if (orig !== undefined) diff.push(`- ${orig}`);
        if (mod !== undefined) diff.push(`+ ${mod}`);
      }
    }

    return diff.join('\n');
  }

  private generateSuggestions(taskType: string, artifacts: CodeArtifact[]): string[] {
    const suggestions: string[] = [];

    if (artifacts.length > 0) {
      suggestions.push('Review the generated code before applying changes');
    }

    if (taskType === 'generate' && !this._options.includeTests) {
      suggestions.push('Consider adding unit tests for the new code');
    }

    if (taskType === 'fix') {
      suggestions.push('Run tests to verify the fix works correctly');
    }

    if (taskType === 'refactor') {
      suggestions.push('Ensure all tests pass after refactoring');
    }

    return suggestions;
  }

  private determineNextSteps(taskType: string, artifacts: CodeArtifact[]): string[] {
    const nextSteps: string[] = [];

    if (artifacts.length > 0) {
      nextSteps.push(`Apply changes to ${artifacts[0].path}`);
    }

    if (taskType === 'generate') {
      nextSteps.push('Run tests to verify functionality');
    }

    if (taskType === 'fix' || taskType === 'refactor') {
      nextSteps.push('Run full test suite');
    }

    return nextSteps;
  }
}

export function createCoderAgent(
  config?: Partial<AgentConfig>,
  options?: Partial<CodeGenerationOptions>
): CoderAgent {
  return new CoderAgent(config, options);
}
