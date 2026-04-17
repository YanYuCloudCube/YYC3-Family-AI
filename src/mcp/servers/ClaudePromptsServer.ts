import type { MCPTool, MCPToolResult } from '../types'

export interface PromptTemplate {
  id: string
  name: string
  description: string
  category: PromptCategory
  version: string
  author: string
  tags: string[]
  variables: PromptVariable[]
  systemPrompt: string
  userPromptTemplate: string
  outputFormat?: OutputFormat
  gates?: GateConfig[]
  examples?: PromptExample[]
  metadata: Record<string, any>
}

export type PromptCategory =
  | 'coding' | 'writing' | 'analysis' | 'creative'
  | 'business' | 'education' | 'research' | 'translation'
  | 'debugging' | 'refactoring' | 'testing' | 'documentation'
  | 'planning' | 'review' | 'optimization' | 'security'

export type OutputFormat = 'text' | 'json' | 'markdown' | 'code' | 'structured' | 'html' | 'xml'

export interface PromptVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'code' | 'file'
  description: string
  required: boolean
  defaultValue?: any
  options?: string[]
  validation?: RegExp
}

export interface PromptExample {
  input: Record<string, any>
  output: string
  description: string
}

export interface GateConfig {
  id: string
  name: string
  type: 'validation' | 'guidance' | 'quality' | 'security'
  criteria: string[]
  severity: 'critical' | 'high' | 'medium' | 'low'
  passAction?: string
  failAction?: string
}

export interface PromptSearchOptions {
  query?: string
  category?: PromptCategory
  tags?: string[]
  author?: string
  outputFormat?: OutputFormat
  limit?: number
  offset?: number
}

export interface PromptRenderResult {
  renderedId: string
  templateId: string
  templateName: string
  systemPrompt: string
  userPrompt: string
  variablesUsed: Record<string, any>
  renderedAt: string
  tokenEstimate: {
    systemTokens: number
    userTokens: number
    totalTokens: number
  }
}

export interface PromptAnalysisResult {
  templateId: string
  qualityScore: number
  clarityScore: number
  specificityScore: number
  structureScore: number
  securityRisk: 'low' | 'medium' | 'high' | 'critical'
  suggestions: Array<{
    type: 'improvement' | 'warning' | 'error'
    message: string
    location?: string
  }>
  optimizationTips: string[]
}

const BUILTIN_TEMPLATES: PromptTemplate[] = [
  {
    id: 'code-review',
    name: '代码审查专家',
    description: '对代码进行全面审查，发现潜在问题并提供改进建议',
    category: 'review',
    version: '1.0.0',
    author: 'YYC³',
    tags: ['代码质量', '最佳实践', '重构建议'],
    variables: [
      { name: 'code', type: 'code', description: '需要审查的代码', required: true },
      { name: 'language', type: 'string', description: '编程语言', required: false, defaultValue: 'TypeScript', options: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust'] },
      { name: 'focusAreas', type: 'array', description: '关注领域', required: false, defaultValue: ['安全性', '性能', '可读性'], options: ['安全性', '性能', '可读性', '可维护性', '测试覆盖', '错误处理'] },
      { name: 'strictness', type: 'string', description: '严格程度', required: false, defaultValue: 'strict', options: ['lenient', 'moderate', 'strict', 'very-strict'] },
    ],
    systemPrompt: `你是一位资深代码审查专家，拥有15年以上软件开发经验。你的职责是对提交的代码进行专业、全面的审查。

## 审查原则
1. **正确性优先**：确保逻辑正确，边界条件处理完整
2. **安全意识**：识别注入、XSS、CSRF等安全漏洞
3. **性能敏感**：关注时间/空间复杂度、内存泄漏风险
4. **可维护性**：代码应清晰、模块化、遵循SOLID原则
5. **一致性**：与项目现有风格和模式保持一致

## 输出格式
请按以下结构输出审查结果：

### 📊 总体评分：X/10

### ✅ 优点（如有）
- ...

### ⚠️ 问题列表
| # | 严重度 | 类型 | 位置 | 描述 | 建议 |
|---|--------|------|------|------|------|

### 💡 改进建议
1. ...
2. ...

### 🔧 重构建议（可选）
...`,
    userPromptTemplate: `请审查以下{{language}}代码，重点关注：{{focusAreas}}。严格程度：{{strictness}}

\`\`\`{{language}}
{{code}}
\`\`\`

请提供详细的审查报告。`,
    outputFormat: 'markdown',
    gates: [
      { id: 'security-check', name: '安全检查', type: 'security', criteria: ['无硬编码密钥', '输入已验证', 'SQL注入防护'], severity: 'critical' },
      { id: 'quality-check', name: '质量检查', type: 'validation', criteria: ['命名规范', '函数长度合理', '复杂度可控'], severity: 'high' },
    ],
    metadata: { complexity: 'advanced', estimatedTokens: 2000 },
  },
  {
    id: 'tech-writing',
    name: '技术文档生成',
    description: '根据代码或需求生成专业的技术文档',
    category: 'documentation',
    version: '1.0.0',
    author: 'YYC³',
    tags: ['API文档', 'README', '架构文档'],
    variables: [
      { name: 'sourceCode', type: 'code', description: '源代码', required: true },
      { name: 'docType', type: 'string', description: '文档类型', required: true, options: ['api-reference', 'readme', 'architecture-guide', 'tutorial', 'changelog'] },
      { name: 'targetAudience', type: 'string', description: '目标读者', required: false, defaultValue: 'developers', options: ['beginners', 'developers', 'architects', 'devops'] },
      { name: 'language', type: 'string', description: '编程语言', required: false, defaultValue: 'TypeScript' },
    ],
    systemPrompt: `你是一位技术文档专家，擅长将复杂的代码和概念转化为清晰、准确、易读的技术文档。

## 文档编写原则
1. **准确性**：所有信息必须与源码一致
2. **完整性**：覆盖所有公开API和关键功能
3. **可读性**：使用清晰的标题层级、代码示例和图表
4. **实用性**：提供真实可运行的示例
5. **时效性**：标注版本信息和更新日期`,
    userPromptTemplate: `请为以下{{language}}代码生成{{docType}}类型的技术文档，目标读者：{{targetAudience}}

\`\`\`{{language}}
{{sourceCode}}
\`\`\``,
    outputFormat: 'markdown',
    metadata: { complexity: 'intermediate', estimatedTokens: 3000 },
  },
  {
    id: 'debug-assistant',
    name: '智能调试助手',
    description: '分析错误日志和代码，定位问题根因并提供修复方案',
    category: 'debugging',
    version: '1.0.0',
    author: 'YYC³',
    tags: ['错误诊断', '日志分析', '问题排查'],
    variables: [
      { name: 'errorMessage', type: 'string', description: '错误信息', required: true },
      { name: 'errorStack', type: 'string', description: '错误堆栈', required: false },
      { name: 'relevantCode', type: 'code', description: '相关代码片段', required: false },
      { name: 'context', type: 'string', description: '运行环境上下文', required: false },
      { name: 'recentChanges', type: 'string', description: '最近的代码变更', required: false },
    ],
    systemPrompt: `你是一位高级调试专家，擅长快速定位和分析软件问题的根本原因。

## 调试方法论
1. **症状分析**：理解错误表现和影响范围
2. **根因追溯**：从堆栈跟踪追溯到源头
3. **假设验证**：提出可能的原因并逐一排除
4. **方案设计**：提供最小化风险的修复方案
5. **预防措施**：建议如何避免同类问题复发`,
    userPromptTemplate: `遇到以下错误，请帮助分析和解决：

**错误信息**: {{errorMessage}}

{{#errorStack}}
**错误堆栈**:
\`\`\`
{{errorStack}}
\`\`\`
{{/errorStack}}

{{#relevantCode}}
**相关代码**:
\`\`\`
{{relevantCode}}
\`\`\`
{{/relevantCode}}

{{#context}}
**运行环境**: {{context}}
{{/context}}

{{#recentChanges}}
**最近变更**: {{recentChanges}}
{{/recentChanges}}`,
    outputFormat: 'markdown',
    gates: [
      { id: 'info-completeness', name: '信息完整性', type: 'guidance', criteria: ['包含错误信息', '有堆栈追踪'], severity: 'high' },
    ],
    metadata: { complexity: 'advanced', estimatedTokens: 1500 },
  },
  {
    id: 'arch-design',
    name: '架构设计方案',
    description: '根据需求生成系统架构设计方案',
    category: 'planning',
    version: '1.0.0',
    author: 'YYC³',
    tags: ['系统设计', '微服务', '架构模式'],
    variables: [
      { name: 'requirements', type: 'string', description: '功能需求描述', required: true },
      { name: 'constraints', type: 'array', description: '约束条件', required: false, defaultValue: [] },
      { name: 'scale', type: 'string', description: '预期规模', required: false, defaultValue: 'medium', options: ['small', 'medium', 'large', 'enterprise'] },
      { name: 'techPreference', type: 'array', description: '技术偏好', required: false, defaultValue: [] },
    ],
    systemPrompt: `你是一位首席架构师，拥有20年以上的分布式系统设计和架构经验。

## 设计原则
1. **简洁性**：避免过度设计，选择最简有效方案
2. **可扩展性**：支持水平和垂直扩展
3. **高可用性**：设计容错和故障恢复机制
4. **安全性**：纵深防御，零信任架构
5. **可观测性**：完整的监控、日志和追踪体系`,
    userPromptTemplate: `请为以下需求设计系统架构：

**需求描述**: {{requirements}}

**约束条件**: {{constraints}}

**预期规模**: {{scale}}

**技术偏好**: {{techPreference}}

请提供：
1. 整体架构图（文字描述）
2. 核心组件说明
3. 技术选型理由
4. 数据流设计
5. 关键非功能需求保障方案
6. 风险点和应对策略`,
    outputFormat: 'markdown',
    metadata: { complexity: 'expert', estimatedTokens: 4000 },
  },
  {
    id: 'test-generator',
    name: '智能测试用例生成',
    description: '根据代码自动生成高质量的单元测试和集成测试',
    category: 'testing',
    version: '1.0.0',
    author: 'YYC³',
    tags: ['单元测试', '集成测试', '覆盖率'],
    variables: [
      { name: 'sourceCode', type: 'code', description: '被测代码', required: true },
      { name: 'testFramework', type: 'string', description: '测试框架', required: false, defaultValue: 'vitest', options: ['jest', 'vitest', 'mocha', 'pytest', 'junit'] },
      { name: 'coverageTarget', type: 'string', description: '覆盖率目标', required: false, defaultValue: '80%', options: ['70%', '80%', '90%', '95%'] },
      { name: 'testTypes', type: 'array', description: '测试类型', required: false, defaultValue: ['unit', 'integration'], options: ['unit', 'integration', 'e2e', 'performance'] },
    ],
    systemPrompt: `你是一位测试工程专家，精通各种测试框架和测试策略。

## 测试设计原则
1. **AAA 模式**：Arrange-Act-Assert 结构清晰
2. **边界覆盖**：正常路径 + 边界条件 + 异常情况
3. **独立性**：每个测试用例独立运行，不依赖执行顺序
4. **可读性**：测试名称描述预期行为
5. **可维护性**：使用工厂模式和测试工具函数减少重复`,
    userPromptTemplate: `为以下代码生成{{testFramework}}测试用例，目标覆盖率 {{coverageTarget}}，测试类型：{{testTypes}}

\`\`\`
{{sourceCode}}
\`\`\`

要求：
1. 覆盖所有公共方法
2. 包含正常和异常场景
3. 使用有意义的测试数据
4. 添加清晰的注释说明测试意图`,
    outputFormat: 'code',
    metadata: { complexity: 'intermediate', estimatedTokens: 2500 },
  },
  {
    id: 'prompt-optimizer',
    name: '提示词优化器',
    description: '优化和改进用户提供的提示词，提升AI响应质量',
    category: 'optimization',
    version: '1.0.0',
    author: 'YYC³',
    tags: ['提示词工程', 'Prompt优化', 'CoT'],
    variables: [
      { name: 'originalPrompt', type: 'string', description: '原始提示词', required: true },
      { name: 'goal', type: 'string', description: '期望达成的目标', required: false },
      { name: 'targetModel', type: 'string', description: '目标模型', required: false, defaultValue: 'glm-4', options: ['glm-4', 'gpt-4', 'claude', 'gemini'] },
      { name: 'optimizationFocus', type: 'array', description: '优化重点', required: false, defaultValue: ['clarity', 'specificity'], options: ['clarity', 'specificity', 'structure', 'examples', 'constraints', 'format'] },
    ],
    systemPrompt: `你是一位提示词工程专家，深谙大语言模型的交互原理和最佳实践。

## 提示词优化框架 (C.A.G.E.E.R.F)
- **Context**: 提供充分的背景和角色设定
- **Analysis**: 明确任务要求和约束条件
- **Goals**: 定义清晰的输出目标和成功标准
- **Execution**: 给出具体的执行步骤和方法
- **Evaluation**: 建立评估标准和质量控制
- **Refinement**: 迭代改进和持续优化

## 优化维度
1. **明确性**：消除歧义，精确定义期望
2. **具体性**：添加具体示例和反例
3. **结构化**：使用清晰的层次和格式
4. **约束性**：设置合理的边界和限制
5. **示例驱动**：通过少样本学习引导输出`,
    userPromptTemplate: `请优化以下提示词：

**原始提示词**:
{{originalPrompt}}

{{#goal}}
**期望目标**: {{goal}}
{{/goal}}

**目标模型**: {{targetModel}}
**优化重点**: {{optimizationFocus}}

请提供：
1. 优化后的提示词
2. 优化说明（解释每处改动的原因）
3. 预期效果对比
4. 进一步改进建议`,
    outputFormat: 'markdown',
    metadata: { complexity: 'intermediate', estimatedTokens: 1200 },
  },
]

export class ClaudePromptsServer {
  private templates: Map<string, PromptTemplate> = new Map()
  private customTemplates: Map<string, PromptTemplate> = new Map()
  private tools: MCPTool[]

  constructor() {
    BUILTIN_TEMPLATES.forEach(t => this.templates.set(t.id, t))

    this.tools = [
      {
        name: 'list_templates',
        description: '列出所有可用的提示词模板，支持按类别、标签过滤',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: ['coding','writing','analysis','creative','business','education','research','translation','debugging','refactoring','testing','documentation','planning','review','optimization','security'] },
            tags: { type: 'array', items: { type: 'string' } },
            limit: { type: 'number' },
          },
        },
      },
      {
        name: 'get_template',
        description: '获取指定模板的详细信息',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: { type: 'string', description: '模板 ID' },
          },
          required: ['templateId'],
        },
      },
      {
        name: 'render_prompt',
        description: '渲染模板，将变量替换后生成最终提示词',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: { type: 'string' },
            variables: { type: 'object', description: '变量值映射' },
            overrideSystemPrompt: { type: 'string' },
          },
          required: ['templateId', 'variables'],
        },
      },
      {
        name: 'analyze_prompt',
        description: '分析提示词质量，给出评分和改进建议',
        inputSchema: {
          type: 'object',
          properties: {
            promptText: { type: 'string', description: '待分析的提示词' },
            targetModel: { type: 'string' },
          },
          required: ['promptText'],
        },
      },
      {
        name: 'create_template',
        description: '创建自定义提示词模板',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            systemPrompt: { type: 'string' },
            userPromptTemplate: { type: 'string' },
            variables: { type: 'array', items: { type: 'object' } },
            tags: { type: 'array', items: { type: 'string' } },
            outputFormat: { type: 'string' },
          },
          required: ['name', 'description', 'category', 'systemPrompt', 'userPromptTemplate'],
        },
      },
      {
        name: 'search_templates',
        description: '搜索匹配的模板',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            category: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            limit: { type: 'number' },
          },
        },
      },
      {
        name: 'validate_template',
        description: '验证模板的完整性和正确性',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: { type: 'string' },
          },
          required: ['templateId'],
        },
      },
      {
        name: 'export_template',
        description: '导出模板为 JSON 格式',
        inputSchema: {
          type: 'object',
          properties: {
            templateId: { type: 'string' },
            format: { type: 'string', enum: ['json', 'yaml', 'markdown'], default: 'json' },
          },
          required: ['templateId'],
        },
      },
    ]
  }

  getTools(): MCPTool[] {
    return this.tools
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    try {
      switch (toolName) {
        case 'list_templates':
          return this.listTemplates(args.category, args.tags, args.limit)
        case 'get_template':
          return this.getTemplate(args.templateId)
        case 'render_prompt':
          return this.renderPrompt(args.templateId, args.variables, args.overrideSystemPrompt)
        case 'analyze_prompt':
          return this.analyzePrompt(args.promptText, args.targetModel)
        case 'create_template':
          return this.createTemplate(args)
        case 'search_templates':
          return this.searchTemplates(args.query, args.category, args.tags, args.limit)
        case 'validate_template':
          return this.validateTemplate(args.templateId)
        case 'export_template':
          return this.exportTemplate(args.templateId, args.format)
        default:
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `未知工具: ${toolName}` }) }],
            isError: true,
          }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
        isError: true,
      }
    }
  }

  private listTemplates(category?: string, _tags?: string[], limit?: number): MCPToolResult {
    let allTemplates = [...this.templates.values(), ...this.customTemplates.values()]

    if (category) {
      allTemplates = allTemplates.filter(t => t.category === category)
    }

    const result = allTemplates.slice(0, limit || 50).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      tags: t.tags,
      variableCount: t.variables.length,
      outputFormat: t.outputFormat || 'text',
      isBuiltin: this.templates.has(t.id),
    }))

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          total: allTemplates.length,
          returned: result.length,
          categories: [...new Set(allTemplates.map(t => t.category))],
          templates: result,
        }, null, 2),
      }],
    }
  }

  private getTemplate(templateId: string): MCPToolResult {
    const template = this.templates.get(templateId) || this.customTemplates.get(templateId)

    if (!template) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `未找到模板: ${templateId}` }) }],
        isError: true,
      }
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(template, null, 2) }],
    }
  }

  private renderPrompt(templateId: string, variables: Record<string, any>, overrideSystem?: string): MCPToolResult {
    const template = this.templates.get(templateId) || this.customTemplates.get(templateId)

    if (!template) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `未找到模板: ${templateId}` }) }],
        isError: true,
      }
    }

    const missingRequired = template.variables
      .filter(v => v.required && !(v.name in variables))
      .map(v => v.name)

    if (missingRequired.length > 0) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `缺少必需变量: ${missingRequired.join(', ')}` }) }],
        isError: true,
      }
    }

    const resolvedVars: Record<string, any> = {}
    for (const v of template.variables) {
      resolvedVars[v.name] = variables[v.name] ?? v.defaultValue ?? ''
    }

    let userPrompt = template.userPromptTemplate

    Object.entries(resolvedVars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      userPrompt = userPrompt.replace(regex, String(value))

      const conditionalRegex = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{/${key}\\}\\}`, 'g')
      if (value && value !== '' && value !== undefined) {
        userPrompt = userPrompt.replace(conditionalRegex, (_, content) => content.replace(/\{\{.*?\}\}/g, (match: string) => {
          const varName = match.replace(/[{}#\/]/g, '')
          return String(resolvedVars[varName] ?? match)
        }))
      } else {
        userPrompt = userPrompt.replace(conditionalRegex, '')
      }
    })

    userPrompt = userPrompt.replace(/\{\{[^}]+\}\}/g, '')

    const systemPrompt = overrideSystem || template.systemPrompt

    const systemTokens = this.estimateTokens(systemPrompt)
    const userTokens = this.estimateTokens(userPrompt)

    const result: PromptRenderResult = {
      renderedId: `render_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      templateId: template.id,
      templateName: template.name,
      systemPrompt,
      userPrompt,
      variablesUsed: resolvedVars,
      renderedAt: new Date().toISOString(),
      tokenEstimate: {
        systemTokens,
        userTokens,
        totalTokens: systemTokens + userTokens,
      },
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  }

  private analyzePrompt(promptText: string, _targetModel?: string): MCPToolResult {
    const suggestions: Array<{ type: 'improvement' | 'warning' | 'error'; message: string; location?: string }> = []

    let clarityScore = 50
    let specificityScore = 50
    let structureScore = 50

    if (promptText.length < 20) {
      suggestions.push({ type: 'warning', message: '提示词过短，可能缺乏足够的上下文信息' })
      specificityScore -= 20
    }

    if (promptText.length > 5000) {
      suggestions.push({ type: 'warning', message: '提示词过长，可能导致注意力分散，建议拆分为多个步骤' })
      clarityScore -= 10
    }

    if (/^(please|can you|could you|help me)/i.test(promptText.trim())) {
      suggestions.push({ type: 'improvement', message: '建议直接陈述任务目标，而非以礼貌用语开头，可节省token并提高指令清晰度' })
      clarityScore += 5
    }

    if (!/输出|output|返回|return|格式|format|json|markdown/i.test(promptText)) {
      suggestions.push({ type: 'improvement', message: '建议明确指定输出格式（如JSON结构、Markdown标题层级等），以提高输出的一致性' })
      structureScore -= 15
    }

    if (/例如|example|比如|sample/i.test(promptText)) {
      specificityScore += 20
      suggestions.push({ type: 'improvement', message: '✅ 包含示例，这有助于引导模型产生更符合预期的输出' })
    }

    if (/步骤|step|首先|然后|最后|first|then|finally/i.test(promptText)) {
      structureScore += 20
      suggestions.push({ type: 'improvement', message: '✅ 包含步骤说明，结构化程度良好' })
    }

    if (/你是|you are|作为|act as|role/i.test(promptText)) {
      clarityScore += 15
      suggestions.push({ type: 'improvement', message: '✅ 设定了角色/身份，有助于模型采用合适的视角和语气' })
    }

    if (!/禁止|不要|不要|must not|do not|avoid/i.test(promptText)) {
      suggestions.push({ type: 'improvement', message: '建议添加负面约束（如"不要..."），以减少不符合预期的输出' })
      specificityScore -= 10
    }

    const hasNumberedItems = /^\d+[\.\)、]/m.test(promptText) || /^[-*]/m.test(promptText)
    if (hasNumberedItems) {
      structureScore += 10
    }

    clarityScore = Math.max(0, Math.min(100, clarityScore))
    specificityScore = Math.max(0, Math.min(100, specificityScore))
    structureScore = Math.max(0, Math.min(100, structureScore))
    const qualityScore = Math.round((clarityScore + specificityScore + structureScore) / 3)

    let securityRisk: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (/密码|password|secret|token|api[_ -]?key|private[_ -]?key/i.test(promptText)) {
      securityRisk = 'high'
      suggestions.push({ type: 'error', message: '⚠️ 检测到可能的敏感信息请求，请勿在提示词中包含真实的密钥或凭证', location: 'security' })
    }

    const optimizationTips: string[] = []
    if (clarityScore < 70) optimizationTips.push('增加角色设定和背景说明，明确任务的上下文')
    if (specificityScore < 70) optimizationTips.push('添加具体示例和期望输出的样例')
    if (structureScore < 70) optimizationTips.push('使用编号列表或分节符组织内容结构')
    if (promptText.split('\n').length < 3) optimizationTips.push('考虑将长提示词分段，每段聚焦一个子任务')

    const result: PromptAnalysisResult = {
      templateId: `analysis_${Date.now()}`,
      qualityScore,
      clarityScore,
      specificityScore,
      structureScore,
      securityRisk,
      suggestions,
      optimizationTips,
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  }

  private createTemplate(args: Record<string, any>): MCPToolResult {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const template: PromptTemplate = {
      id,
      name: args.name,
      description: args.description,
      category: args.category as PromptCategory,
      version: '1.0.0',
      author: 'user',
      tags: args.tags || [],
      variables: (args.variables || []).map((v: any) => ({
        name: v.name,
        type: v.type || 'string',
        description: v.description || '',
        required: v.required || false,
        defaultValue: v.defaultValue,
        options: v.options,
      })),
      systemPrompt: args.systemPrompt,
      userPromptTemplate: args.userPromptTemplate,
      outputFormat: args.outputFormat as OutputFormat || 'text',
      metadata: { createdAt: new Date().toISOString(), isCustom: true },
    }

    this.customTemplates.set(id, template)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          templateId: id,
          template,
          message: '自定义模板创建成功',
          totalCustomTemplates: this.customTemplates.size,
        }, null, 2),
      }],
    }
  }

  private searchTemplates(query?: string, category?: string, _tags?: string[], limit?: number): MCPToolResult {
    let results = [...this.templates.values(), ...this.customTemplates.values()]

    if (query) {
      const q = query.toLowerCase()
      results = results.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }

    if (category) {
      results = results.filter(t => t.category === category)
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          totalMatches: results.length,
          returned: results.slice(0, limit || 20).map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            tags: t.tags,
            relevanceScore: query ? this.calculateRelevance(query, t) : 1,
          })),
        }, null, 2),
      }],
    }
  }

  private validateTemplate(templateId: string): MCPToolResult {
    const template = this.templates.get(templateId) || this.customTemplates.get(templateId)

    if (!template) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ valid: false, errors: [`模板不存在: ${templateId}`] }) }],
        isError: true,
      }
    }

    const errors: string[] = []
    const warnings: string[] = []

    if (!template.systemPrompt || template.systemPrompt.trim().length < 10) {
      errors.push('systemPrompt 过短或为空')
    }

    if (!template.userPromptTemplate || template.userPromptTemplate.trim().length < 5) {
      errors.push('userPromptTemplate 过短或为空')
    }

    if (!template.variables || template.variables.length === 0) {
      warnings.push('模板没有定义任何变量')
    }

    const varNamesInTemplate = [...template.userPromptTemplate.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1])
    const definedVarNames = new Set(template.variables.map(v => v.name))

    for (const vName of varNamesInTemplate) {
      if (!definedVarNames.has(vName)) {
        warnings.push(`模板中使用了未定义的变量: {{${vName}}}`)
      }
    }

    for (const v of template.variables) {
      if (v.required && !varNamesInTemplate.includes(v.name)) {
        warnings.push(`必需变量 "${v.name}" 未在 userPromptTemplate 中引用`)
      }
    }

    const isValid = errors.length === 0

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          valid: isValid,
          templateId,
          templateName: template.name,
          errors,
          warnings,
          score: isValid ? 100 - (warnings.length * 10) : 0,
          validatedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  private exportTemplate(templateId: string, format: string = 'json'): MCPToolResult {
    const template = this.templates.get(templateId) || this.customTemplates.get(templateId)

    if (!template) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `未找到模板: ${templateId}` }) }],
        isError: true,
      }
    }

    let exported: string

    if (format === 'markdown') {
      exported = `# ${template.name}\n\n> ${template.description}\n\n**类别**: ${template.category}  \n**版本**: ${template.version}  \n**作者**: ${template.author}  \n**标签**: ${template.tags.join(', ')}\n\n## 系统提示词\n\n${template.systemPrompt}\n\n## 用户提示词模板\n\n\`\`\`${template.userPromptTemplate}\`\`\`\n\n## 变量\n\n${template.variables.map(v => `- **${v.name}** (${v.type}): ${v.description}${v.required ? ' *(必填)*' : ''}`).join('\n')}`
    } else if (format === 'yaml') {
      exported = `id: ${template.id}\nname: ${template.name}\ndescription: ${template.description}\ncategory: ${template.category}\nversion: ${template.version}\nauthor: ${template.author}\ntags:\n${template.tags.map(t => `  - ${t}`).join('\n')}\nsystemPrompt: |\n  ${template.systemPrompt.split('\n').join('\n  ')}\nuserPromptTemplate: |\n  ${template.userPromptTemplate.split('\n').join('\n  ')}\nvariables:\n${template.variables.map(v => `  - name: ${v.name}\n    type: ${v.type}\n    description: ${v.description}\n    required: ${v.required}`).join('\n')}`
    } else {
      exported = JSON.stringify(template, null, 2)
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          format,
          templateId,
          exported,
          size: exported.length,
          exportedAt: new Date().toISOString(),
        }),
      }],
    }
  }

  getStatus(): { name: string; toolsCount: number; builtinCount: number; customCount: number } {
    return {
      name: 'claude-prompts',
      toolsCount: this.tools.length,
      builtinCount: this.templates.size,
      customCount: this.customTemplates.size,
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length * 0.5)
  }

  private calculateRelevance(query: string, template: PromptTemplate): number {
    const q = query.toLowerCase()
    let score = 0

    if (template.name.toLowerCase().includes(q)) score += 0.5
    if (template.description.toLowerCase().includes(q)) score += 0.3
    if (template.tags.some(t => t.toLowerCase().includes(q))) score += 0.15
    if (template.category.toLowerCase().includes(q)) score += 0.05

    return Math.min(1, score)
  }
}
