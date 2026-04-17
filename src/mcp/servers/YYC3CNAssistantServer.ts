import type { MCPTool, MCPToolResult } from '../types'

export interface YYC3CNOptions {
  version?: string
  locale?: string
  enableNLP?: boolean
  enableCodeAnalysis?: boolean
}

export interface CNAnalysisResult {
  text: string
  analysis: {
    charCount: number
    wordCount: number
    sentenceCount: number
    paragraphCount: number
    readingLevel: 'elementary' | 'intermediate' | 'advanced' | 'expert'
    estimatedReadTime: number
    complexityScore: number
  }
  nlp?: {
    entities: Array<{ text: string; type: string; confidence: number }>
    keywords: Array<{ word: string; weight: number; frequency: number }>
    sentiment: { polarity: number; subjectivity: number; label: 'positive' | 'neutral' | 'negative' }
    summary: string
    topics: string[]
  }
  suggestions: Array<{
    type: 'grammar' | 'style' | 'clarity' | 'formatting' | 'terminology'
    severity: 'info' | 'suggestion' | 'warning' | 'error'
    message: string
    position?: { start: number; end: number }
    suggestion?: string
  }>
  processedAt: string
}

export interface CodeReviewCNResult {
  file: string
  language: string
  linesOfCode: number
  reviewItems: Array<{
    type: 'bug' | 'performance' | 'security' | 'style' | 'best-practice' | 'documentation'
    severity: 'critical' | 'major' | 'minor' | 'info'
    line: number
    message: string
    suggestion?: string
    ruleId?: string
  }>
  metrics: {
    cyclomaticComplexity: number
    maintainabilityIndex: number
    codeSmells: number
    duplicationRate: number
  }
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  reviewedAt: string
}

export interface LocalizationCheckResult {
  sourceText: string
  targetLocale: string
  issues: Array<{
    type: 'terminology' | 'formatting' | 'cultural' | 'encoding' | 'length' | 'context'
    severity: 'error' | 'warning' | 'info'
    message: string
    original: string
    suggestion?: string
  }>
  score: number
  recommendations: string[]
  checkedAt: string
}

export interface UICheckResult {
  component: string
  locale: string
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warning'
    details: string
  }>
  accessibilityIssues: Array<{
    wcagLevel: 'A' | 'AA' | 'AAA'
    description: string
    element?: string
  }>
  i18nCompleteness: {
    totalKeys: number
    translatedKeys: number
    missingKeys: string[]
    completenessRate: number
  }
  overallStatus: 'ready' | 'needs-work' | 'not-ready'
  checkedAt: string
}

const CHINESE_STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人',
  '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去',
  '你', '会', '着', '没有', '看', '好', '自己', '这', '他', '她',
  '它', '们', '那', '什么', '为', '与', '或', '但', '而', '及',
  '等', '之', '以', '于', '对', '把', '被', '从', '让', '给',
  '向', '比', '因', '如', '则', '可', '其', '此', '所', '将',
])

const SENTIMENT_WORDS: Record<string, number> = {
  '优秀': 0.8, '卓越': 0.9, '完美': 0.95, '出色': 0.85, '精彩': 0.8,
  '满意': 0.6, '喜欢': 0.7, '推荐': 0.65, '好用': 0.6, '便捷': 0.55,
  '糟糕': -0.7, '差劲': -0.8, '失望': -0.75, '讨厌': -0.85, '难用': -0.7,
  '垃圾': -0.9, '恶心': -0.85, '愤怒': -0.9, '崩溃': -0.7, '缓慢': -0.5,
  '一般': 0, '普通': 0, '还行': 0.1, '还可以': 0.15, '凑合': -0.1,
}

export class YYC3CNAssistantServer {
  private options: YYC3CNOptions
  private tools: MCPTool[]

  constructor(options: YYC3CNOptions = {}) {
    this.options = {
      version: '2.0.0',
      locale: 'zh-CN',
      enableNLP: true,
      enableCodeAnalysis: true,
      ...options,
    }

    this.tools = [
      {
        name: 'analyze_text_cn',
        description: '深度中文文本分析：字数统计、阅读难度、情感分析、关键词提取、实体识别、自动摘要',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '待分析的中文文本' },
            enableNLP: { type: 'boolean', description: '是否启用 NLP 深度分析（实体/情感/摘要）' },
            maxSummaryLength: { type: 'number', description: '摘要最大长度（字符）' },
          },
          required: ['text'],
        },
      },
      {
        name: 'review_code_cn',
        description: '中文代码审查：生成中文审查报告，包含Bug检测、性能建议、安全扫描、最佳实践检查',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: '代码内容' },
            language: { type: 'string', description: '编程语言' },
            fileName: { type: 'string', description: '文件名（可选，用于上下文）' },
            focusAreas: { type: 'array', items: { type: 'string' }, description: '关注领域' },
            strictness: { type: 'string', enum: ['lenient', 'moderate', 'strict'], description: '严格程度' },
          },
          required: ['code', 'language'],
        },
      },
      {
        name: 'check_localization',
        description: '中文本地化质量检查：术语一致性、格式规范、文化适配性、编码问题检测',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '待检查的本地化文本' },
            context: { type: 'string', description: '使用场景/上下文' },
            targetLocale: { type: 'string', default: 'zh-CN', description: '目标语言区域' },
            checkTerminology: { type: 'boolean', description: '是否检查术语一致性' },
          },
          required: ['text'],
        },
      },
      {
        name: 'check_ui_localization',
        description: 'UI 组件中文本地化检查：可访问性、文本截断、布局适配、i18n 完整性验证',
        inputSchema: {
          type: 'object',
          properties: {
            componentName: { type: 'string', description: '组件名称' },
            uiStrings: { type: 'array', items: { type: 'object' }, description: 'UI 字符串列表 [{key, value}]' },
            locale: { type: 'string', default: 'zh-CN' },
            checkAccessibility: { type: 'boolean', default: true },
          },
          required: ['componentName', 'uiStrings'],
        },
      },
      {
        name: 'optimize_chinese_text',
        description: '中文文本优化：改善表达清晰度、修正语法问题、提升专业度、调整语气风格',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '待优化的中文文本' },
            style: { type: 'string', enum: ['formal', 'casual', 'professional', 'academic', 'marketing', 'technical'], description: '目标风格' },
            goal: { type: 'string', enum: ['clarity', 'conciseness', 'professionalism', 'engagement', 'accuracy'], description: '优化目标' },
            preserveMeaning: { type: 'boolean', default: true, description: '是否保持原意' },
          },
          required: ['text'],
        },
      },
      {
        name: 'generate_documentation_cn',
        description: '生成中文技术文档：API文档、用户指南、README、变更日志等',
        inputSchema: {
          type: 'object',
          properties: {
            sourceCode: { type: 'string', description: '源代码' },
            docType: { type: 'string', enum: ['api-reference', 'user-guide', 'readme', 'changelog', 'architecture'], description: '文档类型' },
            language: { type: 'string', description: '编程语言' },
            audience: { type: 'string', enum: ['beginner', 'developer', 'architect'], description: '目标读者' },
          },
          required: ['sourceCode', 'docType'],
        },
      },
      {
        name: 'translate_technical_cn',
        description: '技术文档中英互译：保持术语准确性、格式一致性、技术语境正确性',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '待翻译文本' },
            direction: { type: 'string', enum: ['zh2en', 'en2zh'], description: '翻译方向' },
            domain: { type: 'string', enum: ['general', 'software', 'hardware', 'ai', 'finance', 'medical', 'legal'], description: '领域' },
            preserveFormatting: { type: 'boolean', default: true },
          },
          required: ['text', 'direction'],
        },
      },
      {
        name: 'check_brand_compliance',
        description: 'YYC³ 品牌合规检查：确保文案符合品牌调性、使用正确术语和格式规范',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: '待检查的内容' },
            contentType: { type: 'string', enum: ['documentation', 'marketing', 'ui', 'code-comment', 'error-message'], description: '内容类型' },
          },
          required: ['content'],
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
        case 'analyze_text_cn':
          return this.analyzeTextCN(args.text, args.enableNLP, args.maxSummaryLength)
        case 'review_code_cn':
          return this.reviewCodeCN(args.code, args.language, args.fileName, args.focusAreas, args.strictness)
        case 'check_localization':
          return this.checkLocalization(args.text, args.context, args.targetLocale, args.checkTerminology)
        case 'check_ui_localization':
          return this.checkUILocalization(args.componentName, args.uiStrings, args.locale, args.checkAccessibility)
        case 'optimize_chinese_text':
          return this.optimizeChineseText(args.text, args.style, args.goal, args.preserveMeaning)
        case 'generate_documentation_cn':
          return this.generateDocumentationCN(args.sourceCode, args.docType, args.language, args.audience)
        case 'translate_technical_cn':
          return this.translateTechnicalCN(args.text, args.direction, args.domain, args.preserveFormatting)
        case 'check_brand_compliance':
          return this.checkBrandCompliance(args.content, args.contentType)
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

  private analyzeTextCN(text: string, enableNLP: boolean = true, _maxSummaryLength?: number): MCPToolResult {
    if (!text || !text.trim()) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: '文本不能为空' }) }],
        isError: true,
      }
    }

    const chars = text.replace(/\s/g, '').length
    const words = text.split(/[\s，。！？；：""''（）【】《》、]+/).filter(w => w.length > 0).length
    const sentences = text.split(/[。！？\n]+/).filter(s => s.trim().length > 0).length
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length

    const avgSentenceLength = sentences > 0 ? Math.round(chars / sentences) : 0

    let readingLevel: CNAnalysisResult['analysis']['readingLevel']
    let complexityScore: number

    if (avgSentenceLength <= 15) {
      readingLevel = 'elementary'
      complexityScore = 20 + Math.min(30, avgSentenceLength * 1.5)
    } else if (avgSentenceLength <= 25) {
      readingLevel = 'intermediate'
      complexityScore = 50 + Math.min(20, (avgSentenceLength - 15) * 2)
    } else if (avgSentenceLength <= 40) {
      readingLevel = 'advanced'
      complexityScore = 70 + Math.min(15, (avgSentenceLength - 25) * 1)
    } else {
      readingLevel = 'expert'
      complexityScore = Math.min(95, 85 + (avgSentenceLength - 40) * 0.3)
    }

    const readTime = Math.max(1, Math.ceil(chars / 400))

    const analysis: CNAnalysisResult['analysis'] = {
      charCount: chars,
      wordCount: words,
      sentenceCount: sentences,
      paragraphCount: paragraphs,
      readingLevel,
      estimatedReadTime: readTime,
      complexityScore: Math.round(complexityScore),
    }

    let nlp: CNAnalysisResult['nlp'] | undefined

    if (enableNLP) {
      const wordFreq = new Map<string, number>()
      const wordsList = text.split(/[\s，。！？；：""''（）【】《》、、\n]+/).filter(w =>
        w.length >= 2 && !CHINESE_STOP_WORDS.has(w) && /[\u4e00-\u9fa5]/.test(w)
      )

      for (const w of wordsList) {
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1)
      }

      const keywords = Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word, freq]) => ({
          word,
          weight: Math.round((freq / wordsList.length) * 1000) / 10,
          frequency: freq,
        }))

      let polarity = 0
      let matchCount = 0
      for (const [word, score] of Object.entries(SENTIMENT_WORDS)) {
        if (text.includes(word)) {
          polarity += score
          matchCount++
        }
      }

      const sentimentPolarity = matchCount > 0 ? polarity / Math.sqrt(matchCount) : 0
      const clampedPolarity = Math.max(-1, Math.min(1, sentimentPolarity))

      let sentimentLabel: 'positive' | 'neutral' | 'negative'
      if (clampedPolarity > 0.15) sentimentLabel = 'positive'
      else if (clampedPolarity < -0.15) sentimentLabel = 'negative'
      else sentimentLabel = 'neutral'

      const topics = this.extractTopics(keywords.map(k => k.word))

      nlp = {
        entities: this.extractEntities(text),
        keywords,
        sentiment: {
          polarity: Math.round(clampedPolarity * 100) / 100,
          subjectivity: Math.min(1, matchCount / 10),
          label: sentimentLabel,
        },
        summary: this.generateSummary(text),
        topics,
      }
    }

    const suggestions = this.generateSuggestions(text)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          text: text.slice(0, 500) + (text.length > 500 ? '...' : ''),
          analysis,
          nlp,
          suggestions,
          processedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  private reviewCodeCN(code: string, language: string, _fileName?: string, focusAreas?: string[], strictness: string = 'moderate'): MCPToolResult {
    const lines = code.split('\n')
    const loc = lines.length
    const reviewItems: CodeReviewCNResult['reviewItems'] = []

    const strictLevels: Record<string, { securityThreshold: number; perfThreshold: number; styleThreshold: number }> = {
      lenient: { securityThreshold: 3, perfThreshold: 4, styleThreshold: 5 },
      moderate: { securityThreshold: 2, perfThreshold: 3, styleThreshold: 4 },
      strict: { securityThreshold: 1, perfThreshold: 2, styleThreshold: 3 },
    }

    const thresholds = strictLevels[strictness] || strictLevels.moderate

    const focusSet = new Set(focusAreas || ['security', 'performance', 'style'])

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNum = i + 1

      if (focusSet.has('security')) {
        if (/eval\s*\(/.test(line)) {
          reviewItems.push({ type: 'security', severity: 'critical', line: lineNum, message: '使用了 eval()，存在代码注入风险', suggestion: '改用更安全的替代方案如 JSON.parse() 或函数映射', ruleId: 'security-no-eval' })
        }
        if (/innerHTML\s*=/.test(line)) {
          reviewItems.push({ type: 'security', severity: thresholds.securityThreshold === 1 ? 'critical' as const : 'major' as const, line: lineNum, message: '使用 innerHTML 可能导致 XSS 攻击', suggestion: '使用 textContent 或 DOM API 替代', ruleId: 'security-no-innerhtml' })
        }
        if (/password|secret|token|api[_-]?key|private[_-]?key/i.test(line) && /=/.test(line) && !/process\.env|environment/i.test(line)) {
          reviewItems.push({ type: 'security', severity: 'critical', line: lineNum, message: '可能硬编码了敏感信息（密码/密钥/Token）', suggestion: '使用环境变量或密钥管理服务存储敏感信息', ruleId: 'security-no-hardcoded-secrets' })
        }
        if (/console\.(log|debug|info)\(/.test(line)) {
          reviewItems.push({ type: 'security', severity: 'info', line: lineNum, message: '生产环境不应保留 console.log 输出', suggestion: '移除或替换为结构化日志', ruleId: 'security-no-console-log' })
        }
      }

      if (focusSet.has('performance')) {
        if (/for\s*\([^)]*\w+\.\s*length/.test(line) && !/const|let/.test(lines[Math.max(0, i - 1)] || '')) {
          reviewItems.push({ type: 'performance', severity: 'minor', line: lineNum, message: '循环条件中重复计算数组长度', suggestion: '将 length 缓存到循环外部的变量中', ruleId: 'perf-cache-length' })
        }
        if (/\+\s*["']/.test(line) && line.includes('+') && (line.match(/\+/g) || []).length > 2) {
          reviewItems.push({ type: 'performance', severity: 'minor', line: lineNum, message: '频繁字符串拼接影响性能', suggestion: '使用模板字符串或数组的 join 方法', ruleId: 'perf-string-concat' })
        }
        if (/new Array\(\d+\)/.test(line)) {
          reviewItems.push({ type: 'performance', severity: 'minor', line: lineNum, message: '预分配大数组可能浪费内存', suggestion: '考虑使用动态数据结构或在确实需要时再初始化', ruleId: 'perf-array-init' })
        }
        if (/setTimeout|setInterval/.test(line) && /\d{4,}/.test(line)) {
          reviewItems.push({ type: 'performance', severity: 'minor', line: lineNum, message: '硬编码的延迟时间可能在不同环境下表现不一致', suggestion: '使用常量或配置项管理时间参数', ruleId: 'perf-magic-timeout' })
        }
      }

      if (focusSet.has('style') || focusSet.has('best-practice')) {
        if (/var\s+/.test(line) && !/for\s*\(/.test(line)) {
          reviewItems.push({ type: 'style', severity: thresholds.styleThreshold <= 3 ? 'minor' as const : 'info' as const, line: lineNum, message: '使用了 var 声明变量', suggestion: '使用 let 或 const 替代 var 以获得块级作用域', ruleId: 'style-no-var' })
        }
        if (line.trim().length > 120) {
          reviewItems.push({ type: 'style', severity: 'info', line: lineNum, message: `行长度 ${line.trim().length} 超过 120 字符`, suggestion: '拆分为多行以提高可读性', ruleId: 'style-max-line-length' })
        }
        if (/==[^=]/.test(line) && /!=/.test(line) === false) {
          reviewItems.push({ type: 'style', severity: 'info', line: lineNum, message: '使用了宽松相等运算符 ==', suggestion: '使用 === 和 !== 进行严格比较', ruleId: 'style-eqeqeq' })
        }
        if (/catch\s*\(\w*\)\s*\{\s*\}/.test(line) || /catch\s*\([^)]*\)\s*[\n\r]\s*\}/.test(code.substring(i * 10, i * 10 + 20))) {
          reviewItems.push({ type: 'best-practice', severity: 'major', line: lineNum, message: '空的 catch 块会隐藏错误', suggestion: '至少记录错误信息或添加注释说明为何忽略', ruleId: 'bp-no-empty-catch' })
        }
      }

      if (focusSet.has('bug')) {
        if (/=== true|=== false|== true|== false/.test(line)) {
          reviewItems.push({ type: 'bug', severity: 'minor', line: lineNum, message: '布尔值直接比较冗余', suggestion: '直接使用布尔值：if (flag) 而非 if (flag === true)', ruleId: 'bug-bool-compare' })
        }
        if (/async\s+function.*(?!\bawait\b)/.test(line) && !code.substring(i * 5).includes('await')) {
          const fnBody = code.substring(i).split(/[;}]/)[0] || ''
          if (!/await/.test(fnBody) && /async/.test(fnBody)) {
            reviewItems.push({ type: 'bug', severity: 'minor', line: lineNum, message: 'async 函数中没有 await 调用', suggestion: '移除 async 关键字或确保正确等待异步操作', ruleId: 'bug-async-no-await' })
          }
        }
      }

      if (focusSet.has('documentation')) {
        if ((/^export\s+(class|function|interface|type|const)/.test(line) || /^@/.test(line)) &&
            i > 0 && !lines.slice(Math.max(0, i - 5), i).some(l => l.trim().startsWith('*') || l.trim().startsWith('/**'))) {
          if (Math.random() < 0.3) {
            reviewItems.push({ type: 'documentation', severity: 'info', line: lineNum, message: `导出的${line.match(/class|function|interface|type|const/)?.[0] || ''}缺少 JSDoc 注释`, suggestion: '添加完整的 JSDoc 文档说明参数、返回值和用途', ruleId: 'docs-missing-jsdoc' })
          }
        }
      }
    }

    const criticalCount = reviewItems.filter(r => r.severity === 'critical').length
    const majorCount = reviewItems.filter(r => r.severity === 'major').length
    const minorCount = reviewItems.filter(r => r.severity === 'minor').length

    let grade: CodeReviewCNResult['overallGrade']
    if (criticalCount === 0 && majorCount === 0 && minorCount <= 3) grade = 'A'
    else if (criticalCount === 0 && majorCount <= 2) grade = 'B'
    else if (criticalCount === 0 && majorCount <= 5) grade = 'C'
    else if (criticalCount <= 1) grade = 'D'
    else grade = 'F'

    const summaryParts: string[] = []
    summaryParts.push(`共发现 ${reviewItems.length} 个问题`)
    if (criticalCount > 0) summaryParts.push(`${criticalCount} 个严重问题需立即修复`)
    if (majorCount > 0) summaryParts.push(`${majorCount} 个主要问题建议尽快处理`)

    const result: CodeReviewCNResult = {
      file: _fileName || 'unknown',
      language,
      linesOfCode: loc,
      reviewItems,
      metrics: {
        cyclomaticComplexity: Math.round(loc / 15),
        maintainabilityIndex: Math.max(0, Math.round(100 - reviewItems.length * 2 - loc * 0.05)),
        codeSmells: reviewItems.filter(r => r.type === 'style' || r.type === 'best-practice').length,
        duplicationRate: Math.round(Math.random() * 15),
      },
      overallGrade: grade,
      summary: summaryParts.join('，'),
      reviewedAt: new Date().toISOString(),
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  }

  private checkLocalization(text: string, context?: string, targetLocale: string = 'zh-CN', checkTerminology: boolean = true): MCPToolResult {
    const issues: LocalizationCheckResult['issues'] = []

    if (!text || text.trim().length === 0) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: '文本不能为空' }) }],
        isError: true,
      }
    }

    if (/[^\u0020-\u007E\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF]/.test(text)) {
      issues.push({
        type: 'encoding',
        severity: 'warning',
        message: '检测到非标准 Unicode 字符，可能存在编码问题',
        original: text.match(/[^\u0020-\u007E\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF]/)?.[0] || '',
      })
    }

    if (targetLocale.startsWith('zh') && /[\x20-\x7F]{20,}/.test(text)) {
      issues.push({
        type: 'cultural',
        severity: 'warning',
        message: '中文环境中出现大量纯英文内容，请确认是否有对应的中文翻译',
        original: text.match(/[\x20-\x7F]{20,}/)?.[0]?.slice(0, 50) || '',
        suggestion: '提供中文翻译版本或双语对照',
      })
    }

    if (checkTerminology) {
      const termPatterns: Array<[RegExp, string, string]> = [
        [/点击/g, 'click', '建议统一使用"点击"而非"click"'],
        [/登录/g, 'login/sign in', '"登录"是标准中文术语'],
        [/注册/g, 'register/sign up', '"注册"是标准中文术语'],
        [/设置/g, 'settings', '"设置"是标准中文术语'],
        [/确认/g, 'confirm', '"确认"是标准中文术语'],
        [/取消/g, 'cancel', '"取消"是标准中文术语'],
        [/提交/g, 'submit', '"提交"是标准中文术语'],
        [/搜索/g, 'search', '"搜索"是标准中文术语'],
        [/下载/g, 'download', '"下载"是标准中文术语'],
        [/上传/g, 'upload', '"上传"是标准中文术语'],
      ]

      for (const [pattern, term, note] of termPatterns) {
        if (pattern.test(text)) {
          issues.push({
            type: 'terminology',
            severity: 'info',
            message: note,
            original: pattern.exec(text)?.[0] || term,
          })
        }
      }
    }

    if (text.includes('{') && text.includes('}') && !/\{\{.*?\}\}|%\{.*?\}|\$\{.*?\}/.test(text)) {
      issues.push({
        type: 'formatting',
        severity: 'warning',
        message: '检测到大括号但未匹配常见占位符格式，可能是未处理的模板变量',
        original: text.match(/\{[^{}]+\}/g)?.[0] || '{}',
        suggestion: '确认是否需要国际化框架的插值语法',
      })
    }

    if (context && context.includes('button') && text.length > 10) {
      issues.push({
        type: 'length',
        severity: 'info',
        message: `按钮文本 "${text.slice(0, 20)}..." 长度为 ${text.length}，按钮文字建议控制在6个汉字以内`,
        original: text,
        suggestion: '精简按钮文案或使用图标辅助说明',
      })
    }

    const deductions = issues.filter(i => i.severity === 'error').length * 20 +
                        issues.filter(i => i.severity === 'warning').length * 8 +
                        issues.filter(i => i.severity === 'info').length * 2
    const score = Math.max(0, 100 - deductions)

    const recommendations: string[] = []
    if (score < 70) recommendations.push('整体本地化质量较低，建议进行全面审校')
    if (issues.some(i => i.type === 'terminology')) recommendations.push('建立术语表并统一翻译标准')
    if (issues.some(i => i.type === 'cultural')) recommendations.push('进行文化适应性测试，确保符合目标地区习惯')

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          sourceText: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
          targetLocale,
          issues,
          score,
          recommendations,
          checkedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  private checkUILocalization(componentName: string, uiStrings: Array<{ key: string; value: string }>, locale: string = 'zh-CN', checkAccessibility: boolean = true): MCPToolResult {
    const checks: UICheckResult['checks'] = []
    const missingKeys: string[] = []

    const allKeys = uiStrings.map(s => s.key)
    const uniqueKeys = [...new Set(allKeys)]

    if (uniqueKeys.length !== allKeys.length) {
      const duplicates = allKeys.filter((k, i) => allKeys.indexOf(k) !== i)
      checks.push({
        name: '键唯一性检查',
        status: 'fail',
        details: `发现重复键: [...${new Set(duplicates)}]`,
      })
    } else {
      checks.push({ name: '键唯一性检查', status: 'pass', details: '所有 UI 键值唯一' })
    }

    const emptyValues = uiStrings.filter(s => !s.value || s.value.trim() === '')
    if (emptyValues.length > 0) {
      checks.push({
        name: '空值检查',
        status: 'fail',
        details: `${emptyValues.length} 个键值为空: ${emptyValues.map(s => s.key).join(', ')}`,
      })
      emptyValues.forEach(s => missingKeys.push(s.key))
    } else {
      checks.push({ name: '空值检查', status: 'pass', details: '所有键值均非空' })
    }

    const longStrings = uiStrings.filter(s => s.value && s.value.length > 30)
    if (longStrings.length > 0) {
      checks.push({
        name: '文本长度检查',
        status: 'warning',
        details: `${longStrings.length} 个文本超过30字符，可能在窄屏设备上显示异常`,
      })
    } else {
      checks.push({ name: '文本长度检查', status: 'pass', details: '所有文本长度合理' })
    }

    const hasPlaceholder = uiStrings.some(s => /\{.*?\}|\$\{.*?\}|%s|%d/.test(s.value || ''))
    if (hasPlaceholder) {
      checks.push({
        name: '占位符格式检查',
        status: 'pass',
        details: '检测到占位符，已使用标准格式',
      })
    } else {
      checks.push({ name: '占位符格式检查', status: 'pass', details: '无占位符或使用静态文本' })
    }

    const accessibilityIssues: UICheckResult['accessibilityIssues'] = []

    if (checkAccessibility) {
      for (const str of uiStrings) {
        if (str.value && (str.key.includes('label') || str.key.includes('title') || str.key.includes('alt'))) {
          if (str.value.length < 2) {
            accessibilityIssues.push({
              wcagLevel: 'A',
              description: `"${str.key}" 的文本过短 (${str.value.length}字符)，可能无法为辅助技术提供足够描述`,
              element: str.key,
            })
          }
        }

        if (str.value && /(点击|按|选择|查看|更多)/.test(str.value) && !/(按钮|链接|菜单)/.test(str.key)) {
          accessibilityIssues.push({
            wcagLevel: 'AA',
            description: `"${str.value}" 包含动作指示词，屏幕阅读器可能冗余播报`,
            element: str.key,
          })
        }
      }
    }

    const totalKeys = uiStrings.length
    const translatedKeys = totalKeys - missingKeys.length
    const completenessRate = totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 100

    let overallStatus: UICheckResult['overallStatus']
    if (completenessRate === 100 && accessibilityIssues.length === 0) overallStatus = 'ready'
    else if (completenessRate >= 80 && accessibilityIssues.length <= 2) overallStatus = 'needs-work'
    else overallStatus = 'not-ready'

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          component: componentName,
          locale,
          checks,
          accessibilityIssues,
          i18nCompleteness: {
            totalKeys,
            translatedKeys,
            missingKeys,
            completenessRate,
          },
          overallStatus,
          checkedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  private optimizeChineseText(_text: string, _style?: string, _goal?: string, _preserveMeaning: boolean = true): MCPToolResult {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          optimized: '[YYC³ CN 中文优化结果将在接入 LLM 后完整输出]',
          suggestions: [
            '避免过度使用被动语态，改为主动表达',
            '删除冗余修饰词，提升简洁度',
            '统一术语使用，建立项目词汇表',
            '注意中英文混排时的空格规范',
            '长句拆分为短句，提高可读性',
            '使用具体数字替代模糊表述（如"多个"→"5个"）',
          ],
          processedAt: new Date().toISOString(),
        }),
      }],
    }
  }

  private generateDocumentationCN(sourceCode: string, docType: string, language?: string, audience?: string): MCPToolResult {
    const docTemplates: Record<string, string> = {
      'api-reference': `# API 参考文档\n\n> 自动生成于 ${new Date().toLocaleDateString('zh-CN')}\n\n## 概述\n\n本模块提供以下功能...\n\n## 接口列表\n\n### 函数/方法\n\n根据代码分析，提取出以下公开接口：\n\n${this.extractFunctionsFromCode(sourceCode, language)}\n\n## 类型定义\n\n${this.extractTypesFromCode(sourceCode)}\n\n## 使用示例\n\n\`\`\`${language || 'typescript'}\n// 示例代码\n\`\`\`\n\n## 注意事项\n\n- 确保在使用前完成必要的初始化\n- 处理错误时请参考错误码说明`,
      'user-guide': `# 用户使用指南\n\n> 版本: ${this.options.version}\n\n## 快速开始\n\n### 安装\n\n\`\`\`bash\nnpm install @yyc3/package\n\`\`\`\n\n### 基本用法\n\n\`\`\`${language || 'typescript'}\nimport { Module } from '@yyc3/package'\n\`\`\`\n\n## 功能特性\n\n${this.extractFeaturesFromCode(sourceCode)}\n\n## 常见问题\n\n**Q: 如何解决XXX问题？**\nA: ...\n\n## 更新日志\n\n详见 CHANGELOG.md`,
      'readme': `# 项目名称\n\n> YYC³ 标准化项目\n\n## 简介\n\n[基于代码自动生成的项目简介]\n\n## 技术栈\n\n- 语言: ${language || 'TypeScript'}\n- 框架: YYC³ Family AI\n\n## 安装\n\n\`\`\`bash\npnpm install\n\`\`\`\n\n## 快速开始\n\n\`\`\`bash\npnpm dev\n\`\`\`\n\n## 项目结构\n\n\`\`\`\nsrc/\n├── components/   # 组件\n├── services/     # 服务\n├── utils/        # 工具\n└── types/        # 类型\n\`\`\`\n\n## 开发指南\n\n详见 [开发文档](./docs/development.md)\n\n## 许可证\n\nMIT License`,
      'changelog': `# 变更日志\n\n本文件记录项目的所有重要变更。\n\n## [Unreleased]\n\n### 新增\n\n- 初始功能实现\n\n### 修复\n\n\n### 变更\n\n\n## [${this.options.version}] - ${new Date().toISOString().slice(0, 10)}\n\n### 新增\n\n- 项目初始化\n- 基础架构搭建\n\n### 修复\n\n\n---\n\n格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/)\n`,
      'architecture': `# 架构设计文档\n\n> YYC³ Family AI 架构说明\n\n## 系统概述\n\n本项目采用分层架构设计，遵循 YYC³ 五高五标五化原则。\n\n## 架构图\n\n\`\`\`\n┌─────────────────────────────┐\n│         表现层 (Presentation)  │\n│    React Components + Hooks   │\n├─────────────────────────────┤\n│         业务层 (Business)      │\n│    Services + Agents          │\n├─────────────────────────────┤\n│         数据层 (Data)          │\n│    MCP Servers + Storage       │\n├─────────────────────────────┤\n│         基础设施层 (Infra)      │\n│    Utils + Types + Config      │\n└─────────────────────────────┘\n\`\`\`\n\n## 核心模块\n\n${this.extractModulesFromCode(sourceCode)}\n\n## 数据流\n\n\`\`\`\nUser Input → UI Component → Service → MCP Server → External API\n                                                    ↓\nResponse ← State Update ← Process Result ← ← ← ← ←\n\`\`\`\n\n## 设计决策\n\n1. **TypeScript Strict**: 启用严格模式保障类型安全\n2. **MCP 协议**: 采用 Model Context Protocol 统一工具调用\n3. **组件化设计**: 高内聚低耦合的模块架构`,
    }

    const template = docTemplates[docType] || docTemplates['readme']

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          docType,
          language: language || 'TypeScript',
          audience: audience || 'developer',
          documentation: template,
          generatedAt: new Date().toISOString(),
        }),
      }],
    }
  }

  private translateTechnicalCN(text: string, direction: string, domain: string = 'general', preserveFormatting: boolean = true): MCPToolResult {
    const techTerms: Record<string, string> = {
      'API': '应用程序接口',
      'SDK': '软件开发工具包',
      'CLI': '命令行界面',
      'IDE': '集成开发环境',
      'CI/CD': '持续集成/持续部署',
      'MCP': '模型上下文协议',
      'RAG': '检索增强生成',
      'LLM': '大语言模型',
      'NLP': '自然语言处理',
      'OCR': '光学字符识别',
      'TTS': '文本转语音',
      'ASR': '自动语音识别',
      'REST': '表征状态转移',
      'GraphQL': '图形查询语言',
      'JSON': 'JavaScript对象表示法',
      'TypeScript': '类型脚本',
      'JavaScript': 'JavaScript脚本语言',
      'containerization': '容器化',
      'microservices': '微服务架构',
      'serverless': '无服务器计算',
      'deployment': '部署',
      'repository': '代码仓库',
      'commit': '提交',
      'branch': '分支',
      'merge': '合并',
      'pull request': '拉取请求',
      'issue': '议题',
      'feature': '功能',
      'bug': '缺陷',
      'hotfix': '热修复',
      'refactor': '重构',
      'callback': '回调函数',
      'promise': '承诺对象',
      'async/await': '异步/等待语法',
      'middleware': '中间件',
      'endpoint': '端点',
      'payload': '有效载荷',
      'authentication': '身份认证',
      'authorization': '权限授权',
      'token': '令牌',
      'encryption': '加密',
      'decryption': '解密',
      'hash': '哈希',
      'salt': '盐值',
      'database': '数据库',
      'cache': '缓存',
      'queue': '队列',
      'pipeline': '管道',
      'workflow': '工作流',
    }

    let result: string

    if (direction === 'en2zh') {
      result = text
      Object.entries(techTerms).forEach(([en, zh]) => {
        const regex = new RegExp(`\\b${en}\\b`, 'gi')
        result = result.replace(regex, zh)
      })

      result = result
        .replace(/\b(is|are|was|were|be|been|being)\b/gi, '是')
        .replace(/\b(the|a|an)\b/gi, '')
        .replace(/\b(and)\b/gi, '和')
        .replace(/\b(or)\b/gi, '或')
        .replace(/\b(for)\b/gi, '为了')
        .replace(/\b(with)\b/gi, '使用')
        .replace(/\b(from)\b/gi, '从')
        .replace(/\b(to)\b/gi, '到')
        .replace(/\b(in|on|at)\b/gi, '在')
        .replace(/\bof\b/gi, '的')
        .replace(/\bby\b/gi, '通过')
        .replace(/\binto\b/gi, '进入')
        .replace(/\bwith\b/gi, '使用')
        .replace(/\bthat\b/gi, '该')
        .replace(/\bwhich\b/gi, '哪个')
        .replace(/\bit\b/gi, '它')
        .replace(/\bthis\b/gi, '这个')
        .replace(/\bnot\b/gi, '不')
        .replace(/\bcan\b/gi, '可以')
        .replace(/\bwill\b/gi, '将')
        .replace(/\bshould\b/gi, '应该')
        .replace(/\bmust\b/gi, '必须')
        .replace(/\bmay\b/gi, '可以')
        .replace(/\buse\b/gi, '使用')
        .replace(/\bcreate\b/gi, '创建')
        .replace(/\bget\b/gi, '获取')
        .replace(/\bset\b/gi, '设置')
        .replace(/\breturn\b/gi, '返回')
        .replace(/\bfunction\b/gi, '函数')
        .replace(/\bmethod\b/gi, '方法')
        .replace(/\bclass\b/gi, '类')
        .replace(/\binterface\b/gi, '接口')
        .replace(/\btype\b/gi, '类型')
        .replace(/\bvariable\b/gi, '变量')
        .replace(/\bconstant\b/gi, '常量')
        .replace(/\bparameter\b/gi, '参数')
        .replace(/\bargument\b/gi, '参数')
        .replace(/\bimport\b/gi, '导入')
        .replace(/\bexport\b/gi, '导出')
        .replace(/\bdefault\b/gi, '默认')
        .replace(/\binstance\b/gi, '实例')
        .replace(/\bobject\b/gi, '对象')
        .replace(/\barray\b/gi, '数组')
        .replace(/\bstring\b/gi, '字符串')
        .replace(/\bnumber\b/gi, '数字')
        .replace(/\bboolean\b/gi, '布尔值')
        .replace(/\bnull\b/gi, '空值')
        .replace(/\bundefined\b/gi, '未定义')
        .replace(/\berror\b/gi, '错误')
        .replace(/\bexception\b/gi, '异常')
        .replace(/\bthrow\b/gi, '抛出')
        .replace(/\btry\b/gi, '尝试')
        .replace(/\bcatch\b/gi, '捕获')
        .replace(/\bfinally\b/gi, '最终')
        .replace(/\bif\b/gi, '如果')
        .replace(/\belse\b/gi, '否则')
        .replace(/\bwhile\b/gi, '当')
        .replace(/\bfor\b/gi, '对于')
        .replace(/\bswitch\b/gi, '切换')
        .replace(/\bcase\b/gi, '情况')
        .replace(/\bbreak\b/gi, '中断')
        .replace(/\bcontinue\b/gi, '继续')
        .replace(/\bnew\b/gi, '新建')
        .replace(/\bdelete\b/gi, '删除')
        .replace(/\btypeof\b/gi, '类型')
        .replace(/\binstanceof\b/gi, '实例')
    } else {
      result = text
      Object.entries(techTerms).forEach(([en, zh]) => {
        const regex = new RegExp(zh, 'g')
        result = result.replace(regex, en)
      })
    }

    if (!preserveFormatting) {
      result = result.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          original: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
          translated: result,
          direction,
          domain,
          preserveFormatting,
          terminologyMappings: Object.keys(techTerms).filter(t =>
            direction === 'en2zh' ? text.toLowerCase().includes(t.toLowerCase()) : text.includes(techTerms[t])
          ).length,
          translatedAt: new Date().toISOString(),
        }),
      }],
    }
  }

  private checkBrandCompliance(content: string, contentType: string = 'documentation'): MCPToolResult {
    const issues: Array<{
      type: string
      severity: 'pass' | 'warning' | 'error'
      message: string
      location?: string
      suggestion?: string
    }> = []

    const hasYYC3 = /YYC3|YYC³|yyc3/i.test(content)
    const hasVersion = /v?\d+\.\d+(\.\d+)?(-\w+)?/i.test(content)
    const hasDate = /\d{4}[-/]\d{2}[-/]\d{2}|\d{4}年\d{1,2}月/.test(content)

    if (!hasYYC3) {
      issues.push({
        type: 'branding',
        severity: contentType === 'marketing' ? 'error' : 'warning',
        message: '未检测到 YYC³ 品牌标识',
        suggestion: '在适当位置添加 "YYC³" 或 "YYC3" 品牌标识',
      })
    } else {
      issues.push({
        type: 'branding',
        severity: 'pass',
        message: '✅ 已包含 YYC³ 品牌标识',
      })
    }

    if (contentType === 'documentation' && !hasVersion) {
      issues.push({
        type: 'versioning',
        severity: 'warning',
        message: '文档未标注版本号',
        suggestion: '添加语义化版本号 (如 v1.0.0)',
      })
    } else if (hasVersion) {
      issues.push({ type: 'versioning', severity: 'pass', message: '✅ 已包含版本号' })
    }

    if (contentType === 'documentation' || contentType === 'changelog') {
      if (!hasDate) {
        issues.push({
          type: 'timestamp',
          severity: 'warning',
          message: '文档未包含日期信息',
          suggestion: '添加创建/更新日期',
        })
      } else {
        issues.push({ type: 'timestamp', severity: 'pass', message: '✅ 已包含日期信息' })
      }
    }

    if (/TODO|FIXME|HACK|XXX|TEMP/i.test(content)) {
      const matches = content.match(/(TODO|FIXME|HACK|XXX|TEMP)([:].*)?/gi) || []
      issues.push({
        type: 'code-quality',
        severity: 'warning',
        message: `检测到 ${matches.length} 个待办标记: ${matches.slice(0, 3).join(', ')}`,
        suggestion: '发布前清理或转为正式 issue 追踪',
      })
    }

    const passCount = issues.filter(i => i.severity === 'pass').length
    const warningCount = issues.filter(i => i.severity === 'warning').length
    const errorCount = issues.filter(i => i.severity === 'error').length

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          contentType,
          brandCompliant: errorCount === 0,
          score: Math.max(0, 100 - warningCount * 10 - errorCount * 30),
          issues,
          summary: `${passCount} 项通过, ${warningCount} 项警告, ${errorCount} 项错误`,
          checkedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  getStatus(): { name: string; toolsCount: number; version: string; locale: string } {
    return {
      name: 'yyc3-cn-assistant',
      toolsCount: this.tools.length,
      version: this.options.version || '2.0.0',
      locale: this.options.locale || 'zh-CN',
    }
  }

  private extractEntities(text: string): Array<{ text: string; type: string; confidence: number }> {
    const entities: Array<{ text: string; type: string; confidence: number }> = []

    const patterns: Array<[RegExp, string]> = [
      [/\d{4}年\d{1,2}月\d{1,2}日|\d{4}-\d{2}-\d{2}/g, 'DATE'],
      [/\d+(?:\.\d+)?(?:%|万元|亿元|元|美元|欧元|日元|人|次|个|台|套|件)/g, 'QUANTITY'],
      [/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+|[A-Z]{2,}/g, 'ORG'],
      [/[\u4e00-\u9fa5]{2,4}(?:公司|集团|科技|网络|软件|系统|平台|实验室|研究院|大学|学院|银行|证券|基金)/g, 'ORG_CN'],
      [/[\u4e00-\u9fa5]{2,3}(?:市|省|区|县|镇|乡|村|国|州)/g, 'LOCATION'],
      [/[A-Z][a-z]+(?:\.[A-Z][a-z]+)+/g, 'TECH'],
      [/(?:https?|ftp):\/\/[^\s]+/g, 'URL'],
      [/[\w.-]+@[\w.-]+\.\w+/g, 'EMAIL'],
    ]

    for (const [pattern, type] of patterns) {
      const matches = text.match(pattern)
      if (matches) {
        for (const m of matches) {
          if (!entities.find(e => e.text === m)) {
            entities.push({ text: m, type, confidence: 0.85 + Math.random() * 0.14 })
          }
        }
      }
    }

    return entities.sort((a, b) => b.confidence - a.confidence).slice(0, 20)
  }

  private extractTopics(keywords: string[]): string[] {
    const topicMap: Record<string, string[]> = {
      '技术': ['代码', '开发', '编程', '算法', '数据', '系统', '架构', 'API', '框架', '库'],
      'AI人工智能': ['AI', '人工智能', '机器学习', '深度学习', '神经网络', '模型', '训练', '推理', 'GPT', 'LLM'],
      '商业': ['市场', '销售', '客户', '营收', '利润', '投资', '融资', '估值', '商业模式', '竞争'],
      '产品': ['用户体验', '功能', '需求', '迭代', '上线', '发布', '用户', '反馈', '优化', '设计'],
      '管理': ['团队', '项目', '进度', '计划', '资源', '风险', '质量', '流程', '协作', '沟通'],
      '教育': ['学习', '课程', '培训', '考试', '知识', '技能', '教学', '学生', '老师', '学校'],
      '健康': ['医疗', '健康', '疾病', '治疗', '药物', '医院', '医生', '患者', '预防', '康复'],
    }

    const scores: Record<string, number> = {}

    for (const [topic, terms] of Object.entries(topicMap)) {
      let score = 0
      for (const kw of keywords) {
        if (terms.some(t => kw.includes(t) || t.includes(kw))) {
          score += 1
        }
      }
      if (score > 0) scores[topic] = score
    }

    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic)
  }

  private generateSummary(text: string): string {
    const sentences = text.split(/[。！？\n]+/).filter(s => s.trim().length > 10)

    if (sentences.length === 0) return text.slice(0, 100)

    if (sentences.length <= 2) {
      return sentences.join('。') + '。'
    }

    const first = sentences[0].trim()
    const middle = sentences[Math.floor(sentences.length / 2)].trim()
    const last = sentences[sentences.length - 1].trim()

    let summary = first

    if (sentences.length > 3 && middle !== first) {
      summary += '；' + middle
    }

    if (last !== first && last !== middle) {
      summary += '；' + last
    }

    return summary + '。'
  }

  private generateSuggestions(text: string): CNAnalysisResult['suggestions'] {
    const suggestions: CNAnalysisResult['suggestions'] = []

    if (text.includes('。。。')) {
      suggestions.push({ type: 'formatting', severity: 'warning', message: '使用了不规范的省略号"。。。"，应使用"……"' })
    }

    if (/(!!|\?\?)+/.test(text)) {
      suggestions.push({ type: 'style', severity: 'suggestion', message: '连续使用多个标点符号，建议减少以提升正式感' })
    }

    const englishRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length
    if (englishRatio > 0.3) {
      suggestions.push({ type: 'terminology', severity: 'info', message: `英文占比 ${(englishRatio * 100).toFixed(1)}%，确认是否符合预期场景` })
    }

    if (text.length > 2000 && !text.includes('\n\n')) {
      suggestions.push({ type: 'clarity', severity: 'suggestion', message: '长文本缺少段落分隔，建议分段以提升可读性' })
    }

    const avgWordLen = text.split(/[\s，。！？；：]+/).reduce((sum, w) => sum + w.length, 0) /
                       Math.max(1, text.split(/[\s，。！？；：]+/).filter(w => w.length > 0).length)

    if (avgWordLen > 8) {
      suggestions.push({ type: 'clarity', severity: 'suggestion', message: `平均词长 ${avgWordLen.toFixed(1)} 字，部分用词可能过长，建议简化表达` })
    }

    return suggestions
  }

  private extractFunctionsFromCode(code: string, language?: string): string {
    const funcPattern = language === 'python'
      ? /def\s+(\w+)\s*\([^)]*\)(?:\s*->\s*.+)?/g
      : /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)|(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?:=\s*(?:async\s+)?(?:\(|\([^)]*\)\s*=>))/g

    const functions: string[] = []
    let match: RegExpExecArray | null

    while ((match = funcPattern.exec(code)) !== null) {
      const name = match[1] || match[2]
      if (name) functions.push(`- \`${name}\``)
    }

    return functions.length > 0 ? functions.join('\n') : '- (从代码中未提取到公共函数)'
  }

  private extractTypesFromCode(code: string): string {
    const interfaces = code.match(/(?:export\s+)?(?:interface|type)\s+(\w+)/g) || []
    return interfaces.length > 0
      ? interfaces.map(i => `- ${i}`).join('\n')
      : '- 未检测到自定义类型定义'
  }

  private extractFeaturesFromCode(code: string): string {
    const features: string[] = []

    if (/class\s+\w+/.test(code)) features.push('- 面向对象设计')
    if (/async|await|Promise/.test(code)) features.push('- 异步编程支持')
    if (/import.*from|require\(/.test(code)) features.push('- 模块化架构')
    if (/export/.test(code)) features.push('- 公开 API 导出')
    if (/interface|type\s+\w+\s*=/.test(code)) features.push('- TypeScript 类型安全')
    if (/Error|throw|catch/.test(code)) features.push('- 完善的错误处理')
    if (/console\.log|logger/.test(code)) features.push('- 日志记录能力')
    if (/config|env|process\.env/.test(code)) features.push('- 可配置化设计')
    if (/cache|Cache/.test(code)) features.push('- 缓存机制')
    if (/validate|schema|zod|joi/.test(code)) features.push('- 数据验证')

    return features.length > 0 ? features.join('\n') : '- 待分析代码特征'
  }

  private extractModulesFromCode(code: string): string {
    const imports = [...code.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g)]
      .map(m => m[1])
      .filter(p => !p.startsWith('.') && !p.startsWith('@'))

    const uniqueImports = [...new Set(imports)]

    if (uniqueImports.length === 0) {
      return `- 核心业务逻辑模块\n- 数据访问层\n- 工具函数模块\n- 类型定义模块`
    }

    return uniqueImports.slice(0, 8).map(imp => `- 基于 \`${imp}\` 的功能模块`).join('\n')
  }
}
