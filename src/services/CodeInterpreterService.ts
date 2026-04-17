import { execSync, exec } from 'child_process'
import { promisify } from 'util'
import * as vm from 'vm'

const execAsync = promisify(exec)

export interface CodeInterpreterConfig {
  timeout?: number
  maxMemoryMB?: number
  maxOutputSize?: number
  allowedLanguages?: string[]
  enableSandbox?: boolean
}

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'html' | 'sql' | 'json' | 'yaml' | 'shell'

export interface ExecutionRequest {
  code: string
  language: SupportedLanguage
  inputs?: Record<string, any>
  timeout?: number
  sandbox?: boolean
  context?: Record<string, any>
}

export interface ExecutionResult {
  success: boolean
  output: string
  error?: string
  stderr?: string
  exitCode: number | null
  executionTimeMs: number
  memoryUsedMB?: number
  language: SupportedLanguage
  returnValue?: any
  logs: Array<{ level: string; message: string; timestamp: string }>
  executedAt: string
}

export interface ValidationResult {
  valid: boolean
  language: SupportedLanguage
  syntaxError?: string
  securityWarnings: Array<{ type: string; severity: string; message: string; line?: number }>
  complexity: { lines: number; cyclomatic: number; estimatedTimeMs: number }
  suggestions: string[]
}

export interface CodeSnippet {
  id: string
  name: string
  language: SupportedLanguage
  code: string
  description: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

const LANGUAGE_CONFIGS: Record<SupportedLanguage, {
  extensions: string[]
  mimeType: string
  hasRuntime: boolean
  sandboxable: boolean
}> = {
  javascript: { extensions: ['.js', '.mjs', '.cjs'], mimeType: 'application/javascript', hasRuntime: true, sandboxable: true },
  typescript: { extensions: ['.ts', '.tsx'], mimeType: 'application/typescript', hasRuntime: false, sandboxable: true },
  python: { extensions: ['.py'], mimeType: 'text/x-python', hasRuntime: true, sandboxable: true },
  html: { extensions: ['.html', '.htm'], mimeType: 'text/html', hasRuntime: false, sandboxable: true },
  sql: { extensions: ['.sql'], mimeType: 'application/sql', hasRuntime: false, sandboxable: true },
  json: { extensions: ['.json'], mimeType: 'application/json', hasRuntime: false, sandboxable: true },
  yaml: { extensions: ['.yml', '.yaml'], mimeType: 'text/yaml', hasRuntime: false, sandboxable: true },
  shell: { extensions: ['.sh', '.bash'], mimeType: 'application/x-sh', hasRuntime: true, sandboxable: false },
}

const DANGEROUS_PATTERNS: Array<[RegExp, string, string]> = [
  [/(?:require|import)\s*\(\s*['"]child_process['"]\s*\)/, 'dangerous-import', '检测到 child_process 导入，可能执行系统命令'],
  [/(?:require|import)\s*\(\s*['"]fs['"]\s*\)/, 'file-access', '检测到 fs 模块导入，可能访问文件系统'],
  [/eval\s*\(/, 'eval-usage', '使用了 eval()，存在代码注入风险'],
  [/Function\s*\(/, 'function-constructor', '使用了 Function 构造器，可能执行任意代码'],
  [/(?:require|import)\s*\(\s*['"]net['"]\s*\)/, 'network-access', '检测到 net 模块导入，可能建立网络连接'],
  [/(?:require|import)\s*\(\s*['"]http['"]\s*\)/, 'network-access', '检测到 http 模块导入，可能发起网络请求'],
  [/(?:require|import)\s*\(\s*['"]https['"]\s*\)/, 'network-access', '检测到 https 模块导入，可能发起网络请求'],
  [/process\.env/, 'env-access', '访问了环境变量，可能泄露敏感信息'],
  [/process\.exit/, 'process-exit', '使用了 process.exit()，可能导致解释器异常终止'],
  [/while\s*\(\s*true\s*\)/, 'infinite-loop', '检测到可能的无限循环模式'],
  [/rm\s+-rf|del\s+\/[sq]/, 'destructive-command', '检测到危险系统命令'],
]

export class CodeInterpreterService {
  private config: CodeInterpreterConfig
  private snippets: Map<string, CodeSnippet> = new Map()

  constructor(config: CodeInterpreterConfig = {}) {
    this.config = {
      timeout: 10000,
      maxMemoryMB: 256,
      maxOutputSize: 1024 * 1024,
      allowedLanguages: ['javascript', 'typescript', 'python', 'html', 'sql', 'json', 'yaml'],
      enableSandbox: true,
      ...config,
    }
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now()

    if (!this.isLanguageAllowed(request.language)) {
      return this.errorResult(request.language, `不支持的语言: ${request.language}。支持的语言: ${this.config.allowedLanguages?.join(', ')}`, 0)
    }

    const validation = this.validateCode(request.code, request.language)
    if (!validation.valid) {
      return this.errorResult(request.language, validation.syntaxError || '代码验证失败', Date.now() - startTime)
    }

    if (validation.securityWarnings.some(w => w.severity === 'critical')) {
      const criticalWarnings = validation.securityWarnings.filter(w => w.severity === 'critical')
      return this.errorResult(
        request.language,
        `安全检查未通过: ${criticalWarnings.map(w => w.message).join('; ')}`,
        Date.now() - startTime
      )
    }

    try {
      let result: ExecutionResult

      switch (request.language) {
        case 'javascript':
          result = await this.executeJavaScript(request.code, request.context, request.timeout || this.config.timeout)
          break
        case 'typescript':
          result = await this.executeTypeScript(request.code, request.context, request.timeout || this.config.timeout)
          break
        case 'python':
          result = await this.executePython(request.code, request.inputs, request.timeout || this.config.timeout)
          break
        case 'html':
          result = this.executeHTML(request.code)
          break
        case 'sql':
          result = this.executeSQL(request.code)
          break
        case 'json':
          result = this.executeJSON(request.code)
          break
        case 'yaml':
          result = this.executeYAML(request.code)
          break
        case 'shell':
          result = await this.executeShell(request.code, request.timeout || this.config.timeout)
          break
        default:
          result = this.errorResult(request.language, `不支持的语言: ${request.language}`, Date.now() - startTime)
      }

      result.executionTimeMs = Date.now() - startTime

      if (result.output.length > (this.config.maxOutputSize || 1048576)) {
        result.output = result.output.slice(0, this.config.maxOutputSize) + '\n... [输出已截断]'
      }

      return result
    } catch (error) {
      return this.errorResult(
        request.language,
        error instanceof Error ? error.message : String(error),
        Date.now() - startTime
      )
    }
  }

  validateCode(code: string, language: SupportedLanguage): ValidationResult {
    const securityWarnings: Array<{ type: string; severity: string; message: string; line?: number }> = []

    for (const [pattern, type, message] of DANGEROUS_PATTERNS) {
      const match = pattern.exec(code)
      if (match) {
        const lineNum = code.substring(0, match.index).split('\n').length
        securityWarnings.push({
          type,
          severity: type === 'infinite-loop' ? 'warning' :
                  type === 'destructive-command' ? 'critical' : 'high',
          message,
          line: lineNum,
        })
      }
    }

    const lines = code.split('\n').length
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code, language)

    let syntaxError: string | undefined

    try {
      if (language === 'javascript' || language === 'typescript') {
        new Function(code)
      } else if (language === 'json') {
        JSON.parse(code)
      }
    } catch (e: any) {
      syntaxError = e.message || '语法错误'
    }

    const suggestions: string[] = []
    if (cyclomaticComplexity > 15) suggestions.push('圈复杂度过高，建议拆分为更小的函数')
    if (lines > 200) suggestions.push('代码行数较多，建议模块化处理')
    if (securityWarnings.length > 0 && securityWarnings.every(w => w.severity !== 'critical')) {
      suggestions.push('存在安全警告，建议审查后确认安全性')
    }

    return {
      valid: !syntaxError,
      language,
      syntaxError,
      securityWarnings,
      complexity: {
        lines,
        cyclomatic: cyclomaticComplexity,
        estimatedTimeMs: Math.max(50, lines * 2 + cyclomaticComplexity * 10),
      },
      suggestions,
    }
  }

  async executeBatch(requests: ExecutionRequest[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = []

    for (let i = 0; i < requests.length; i++) {
      const result = await this.execute(requests[i])
      results.push(result)

      if (i < requests.length - 1) {
        await this.delay(100)
      }
    }

    return results
  }

  formatCode(code: string, language: SupportedLanguage): string {
    if (language === 'json') {
      try {
        return JSON.stringify(JSON.parse(code), null, 2)
      } catch {
        // Ignore JSON parsing errors
      }
    }

    if (language === 'javascript' || language === 'typescript') {
      return this.formatJSLike(code)
    }

    return code
  }

  getSupportedLanguages(): Array<{
    language: SupportedLanguage
    extensions: string[]
    hasRuntime: boolean
    sandboxable: boolean
  }> {
    return Object.entries(LANGUAGE_CONFIGS).map(([lang, config]) => ({
      language: lang as SupportedLanguage,
      extensions: config.extensions,
      hasRuntime: config.hasRuntime,
      sandboxable: config.sandboxable,
    }))
  }

  saveSnippet(name: string, language: SupportedLanguage, code: string, description: string, tags: string[] = []): CodeSnippet {
    const snippet: CodeSnippet = {
      id: `snippet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      language,
      code,
      description,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.snippets.set(snippet.id, snippet)
    return snippet
  }

  getSnippets(filter?: { language?: SupportedLanguage; tag?: string }): CodeSnippet[] {
    let results = Array.from(this.snippets.values())

    if (filter?.language) {
      results = results.filter(s => s.language === filter.language)
    }

    if (filter?.tag) {
      results = results.filter(s => s.tags.includes(filter.tag!))
    }

    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  deleteSnippet(id: string): boolean {
    return this.snippets.delete(id)
  }

  getStatus(): {
    name: string
    supportedLanguages: number
    savedSnippets: number
    sandboxEnabled: boolean
    config: Pick<CodeInterpreterConfig, 'timeout' | 'maxMemoryMB'>
  } {
    return {
      name: 'code-interpreter',
      supportedLanguages: Object.keys(LANGUAGE_CONFIGS).length,
      savedSnippets: this.snippets.size,
      sandboxEnabled: this.config.enableSandbox ?? true,
      config: {
        timeout: this.config.timeout || 10000,
        maxMemoryMB: this.config.maxMemoryMB || 256,
      },
    }
  }

  private async executeJavaScript(code: string, context?: Record<string, any>, timeout: number = 10000): Promise<ExecutionResult> {
    const logs: Array<{ level: string; message: string; timestamp: string }> = []

    const sandboxContext: Record<string, any> = {
      console: {
        log: (...args: any[]) => {
          logs.push({ level: 'info', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
        },
        warn: (...args: any[]) => {
          logs.push({ level: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
        },
        error: (...args: any[]) => {
          logs.push({ level: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() })
        },
      },
      setTimeout: () => {},
      setInterval: () => {},
      Math,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Date,
      RegExp,
      Map,
      Set,
      Promise,
      Error,
      TypeError,
      RangeError,
      SyntaxError,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURIComponent,
      decodeURIComponent,
      ...context,
    }

    try {
      const script = new vm.Script(code, { filename: 'code.js' })

      const result = script.runInNewContext(sandboxContext, { timeout })

      const output = logs.map(l => `[${l.level.toUpperCase()}] ${l.message}`).join('\n')

      return {
        success: true,
        output: output + (result !== undefined ? `\n=> ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}` : ''),
        exitCode: 0,
        executionTimeMs: 0,
        language: 'javascript',
        returnValue: result,
        logs,
        executedAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message || String(error),
        stderr: error.stack || '',
        exitCode: 1,
        executionTimeMs: 0,
        language: 'javascript',
        logs,
        executedAt: new Date().toISOString(),
      }
    }
  }

  private async executeTypeScript(code: string, context?: Record<string, any>, timeout: number = 10000): Promise<ExecutionResult> {
    const jsCode = code
      .replace(/:\s*(string|number|boolean|any|void|null|undefined|never|unknown|object)\b/g, '')
      .replace(/:\s*(string|number|boolean|any|void|null|undefined|never|unknown|object)\[\]/g, '')
      .replace(/(?:public|private|protected|readonly|abstract|interface|type|enum|declare)\s+/g, '')
      .replace(/<[^>]+>/g, '')

    return this.executeJavaScript(jsCode, context, timeout)
  }

  private async executePython(code: string, _inputs?: Record<string, any>, timeout: number = 10000): Promise<ExecutionResult> {
    try {
      const result = await execAsync(`python3 -c "${code.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, {
        timeout,
        maxBuffer: this.config.maxOutputSize || 1048576,
      })

      return {
        success: true,
        output: result.stdout.trim(),
        stderr: result.stderr.trim() || undefined,
        exitCode: 0,
        executionTimeMs: 0,
        language: 'python',
        logs: [],
        executedAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout?.trim() || '',
        error: error.message || 'Python 执行错误',
        stderr: error.stderr?.trim() || '',
        exitCode: error.code || 1,
        executionTimeMs: 0,
        language: 'python',
        logs: [],
        executedAt: new Date().toISOString(),
      }
    }
  }

  private executeHTML(code: string): ExecutionResult {
    const docRegex = /<!DOCTYPE html>.*<\/html>/is
    const isValidHTML = docRegex.test(code) || /<(html|head|body|div|p|span|h[1-6])>/i.test(code)

    if (!isValidHTML) {
      return this.errorResult('html', '无效的 HTML 结构', 0)
    }

    const titleMatch = code.match(/<title>(.*?)<\/title>/i)
    const tagCount = (code.match(/<\w+/g) || []).length
    const hasDoctype = code.includes('<!DOCTYPE')

    const summary = [
      `✅ HTML 结构有效`,
      `标题: ${titleMatch ? titleMatch[1] : '(无标题)'}`,
      `标签总数: ${tagCount}`,
      hasDoctype ? '✅ 包含 DOCTYPE 声明' : '⚠️ 缺少 DOCTYPE 声明',
    ]

    return {
      success: true,
      output: summary.join('\n'),
      exitCode: 0,
      executionTimeMs: 0,
      language: 'html',
      logs: [],
      executedAt: new Date().toISOString(),
    }
  }

  private executeSQL(code: string): ExecutionResult {
    const upperCode = code.toUpperCase().trim()

    const sqlKeywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'DISTINCT', 'AS', 'ON', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END']

    const detectedKeywords = sqlKeywords.filter(kw => upperCode.includes(kw))

    if (detectedKeywords.length === 0) {
      return this.errorResult('sql', '未能识别为有效的 SQL 语句', 0)
    }

    const operationType = upperCode.startsWith('SELECT') ? '查询' :
                          upperCode.startsWith('INSERT') ? '插入' :
                          upperCode.startsWith('UPDATE') ? '更新' :
                          upperCode.startsWith('DELETE') ? '删除' :
                          upperCode.startsWith('CREATE') ? '创建' :
                          upperCode.startsWith('DROP') ? '删除对象' :
                          upperCode.startsWith('ALTER') ? '修改' : '其他'

    const analysis = [
      `✅ SQL 语法结构有效`,
      `操作类型: ${operationType}`,
      `使用的关键字: ${detectedKeywords.join(', ')}`,
      `⚠️ 注意: 此环境仅做语法分析，不实际连接数据库`,
    ]

    return {
      success: true,
      output: analysis.join('\n'),
      exitCode: 0,
      executionTimeMs: 0,
      language: 'sql',
      logs: [],
      executedAt: new Date().toISOString(),
    }
  }

  private executeJSON(code: string): ExecutionResult {
    try {
      const parsed = JSON.parse(code)
      const typeInfo = this.analyzeJSONType(parsed)

      return {
        success: true,
        output: [
          `✅ JSON 格式有效`,
          `数据类型: ${typeInfo.type}`,
          typeInfo.count !== undefined ? `元素/属性数量: ${typeInfo.count}` : '',
          `格式化输出:\n${JSON.stringify(parsed, null, 2)}`,
        ].filter(Boolean).join('\n'),
        exitCode: 0,
        executionTimeMs: 0,
        language: 'json',
        returnValue: parsed,
        logs: [],
        executedAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return this.errorResult('json', `JSON 解析失败: ${error.message}`, 0)
    }
  }

  private executeYAML(code: string): ExecutionResult {
    const yamlLines = code.split('\n').filter(line => line.trim())
    
    if (yamlLines.length === 0) {
      return this.errorResult('yaml', '空的 YAML 内容', 0)
    }

    const hasIndentation = yamlLines.some(line => /^\s{2,}/.test(line))
    const hasKeyValues = yamlLines.some(line => /^[\w-]+:/.test(line))
    const hasListItems = yamlLines.some(line => /^-\s/.test(line))

    const analysis = [
      `✅ YAML 结构有效`,
      `总行数: ${yamlLines.length}`,
      hasIndentation ? '包含嵌套结构' : '扁平结构',
      hasKeyValues ? '包含键值对' : '',
      hasListItems ? '包含列表项' : '',
      `⚠️ 注意: 此环境仅做基本结构验证`,
    ].filter(Boolean).join('\n')

    return {
      success: true,
      output: analysis,
      exitCode: 0,
      executionTimeMs: 0,
      language: 'yaml',
      logs: [],
      executedAt: new Date().toISOString(),
    }
  }

  private async executeShell(code: string, timeout: number = 10000): Promise<ExecutionResult> {
    try {
      const result = await execAsync(code, {
        timeout,
        maxBuffer: this.config.maxOutputSize || 1048576,
        shell: '/bin/zsh',
        cwd: '/tmp',
        env: { ...process.env, PATH: process.env.PATH },
      })

      return {
        success: true,
        output: result.stdout.trim(),
        stderr: result.stderr.trim() || undefined,
        exitCode: 0,
        executionTimeMs: 0,
        language: 'shell',
        logs: [],
        executedAt: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout?.trim() || '',
        error: error.message || 'Shell 执行错误',
        stderr: error.stderr?.trim() || '',
        exitCode: error.code || 1,
        executionTimeMs: 0,
        language: 'shell',
        logs: [],
        executedAt: new Date().toISOString(),
      }
    }
  }

  private errorResult(language: SupportedLanguage, errorMessage: string, execTimeMs: number): ExecutionResult {
    return {
      success: false,
      output: '',
      error: errorMessage,
      exitCode: 1,
      executionTimeMs: execTimeMs,
      language,
      logs: [],
      executedAt: new Date().toISOString(),
    }
  }

  private isLanguageAllowed(language: string): language is SupportedLanguage {
    return (this.config.allowedLanguages || []).includes(language)
  }

  private calculateCyclomaticComplexity(code: string, _language: SupportedLanguage): number {
    let complexity = 1
    const patterns = /\b(if|else|for|while|case|catch|\?|&&|\|\||return|throw|switch)\b/g
    let match: RegExpExecArray | null

    while ((match = patterns.exec(code)) !== null) {
      complexity++
    }

    return complexity
  }

  private analyzeJSONType(data: any): { type: string; count?: number } {
    if (data === null) return { type: 'null' }
    if (Array.isArray(data)) return { type: 'array', count: data.length }
    if (typeof data === 'object') return { type: 'object', count: Object.keys(data).length }
    return { type: typeof data }
  }

  private formatJSLike(code: string): string {
    let formatted = code
    let indentLevel = 0

    formatted = formatted.replace(/\t/g, '  ')
    formatted = formatted.replace(/\{/g, ' {\n' + '  '.repeat(++indentLevel))
    formatted = formatted.replace(/\}/g, '\n' + '  '.repeat(--indentLevel) + '}')
    formatted = formatted.replace(/;/g, ';\n' + '  '.repeat(indentLevel))

    return formatted
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
