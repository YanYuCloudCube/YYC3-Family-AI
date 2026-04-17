export interface SecurityScanOptions {
  scanType: 'code' | 'document' | 'config' | 'dependency' | 'full'
  severityLevel?: 'info' | 'low' | 'medium' | 'high' | 'critical'
  enableAI?: boolean
  checkDependencies?: boolean
  checkSecrets?: boolean
  checkVulnerabilities?: boolean
  maxFileSize?: number
}

export interface SecurityFinding {
  id: string
  type: SecurityIssueType
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location?: {
    file?: string
    line?: number
    column?: number
    path?: string
  }
  remediation: {
    steps: string[]
    codeExample?: string
    references?: string[]
  }
  cwe?: string
  cvss?: number
  confidence: number
  falsePositiveLikelihood: 'low' | 'medium' | 'high'
  discoveredAt: string
  status: 'open' | 'acknowledged' | 'resolved' | 'false-positive' | 'wont-fix'
}

export type SecurityIssueType =
  | 'injection'
  | 'xss'
  | 'authentication'
  | 'authorization'
  | 'crypto'
  | 'configuration'
  | 'dependency'
  | 'information-disclosure'
  | 'denial-of-service'
  | 'insecure-design'
  | 'secret-leakage'
  | 'path-traversal'
  | 'csrf'
  | 'ssrf'

export interface SecurityScanResult {
  scanId: string
  scannedAt: string
  scanType: string
  target: string
  summary: {
    totalFindings: number
    criticalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
    infoCount: number
    score: number
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
  }
  findings: SecurityFinding[]
  statistics: {
    filesScanned: number
    linesOfCode: number
    scanDurationMs: number
    rulesApplied: number
  }
  recommendations: Array<{
    priority: 'immediate' | 'short-term' | 'long-term'
    category: string
    description: string
    impact: string
  }>
  compliance: {
    owaspTop10: Record<string, { covered: boolean; findings: number }>
    sansTop25: Record<string, { covered: boolean; findings: number }>
    pciDss: Array<{ requirement: string; status: 'pass' | 'fail' | 'warning' }>
  }
}

export interface VulnerabilityDatabaseEntry {
  cveId: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  cvssScore: number
  affectedPackages: string[]
  patchedVersions: string[]
  description: string
  references: string[]
  publishedDate: string
}

import * as fs from 'fs'
import * as path from 'path'

const SECRET_PATTERNS: Array<{ pattern: RegExp; name: string; severity: SecurityFinding['severity'] }> = [
  { pattern: /(?:api[_-]?key|apikey)["\s]*[:=]["\s']*[\w\-]{20,}/i, name: 'API Key', severity: 'critical' },
  { pattern: /(?:secret|password|passwd|pwd)["\s]*[:=]["\s']*["'][^"']{8,}/i, name: 'Password/Secret', severity: 'critical' },
  { pattern: /(?:private[_-]?key|privkey)["\s]*[:=]["\s]*(?:-----BEGIN|[\w\-\/+=]{30,})/i, name: 'Private Key', severity: 'critical' },
  { pattern: /(?:access[_-]?token|auth[_-]?token)["\s]*[:=]["\s']*[\w\-\.]{20,}/i, name: 'Access Token', severity: 'high' },
  { pattern: /(?:aws[_-]?access[_-]?key|aws_secret)["\s]*[:=]["\s']*[A-Z0-9]{16,}/i, name: 'AWS Access Key', severity: 'critical' },
  { pattern: /(?:github[_-]?token|ghp_)[\w]{36,}/i, name: 'GitHub Token', severity: 'critical' },
  { pattern: /(?:stripe[_-]?key|sk_live_)[\w]{24,}/i, name: 'Stripe Secret Key', severity: 'critical' },
  { pattern: /(?:firebase[_-]?api[_-]?key)[\w\-]{30,}/i, name: 'Firebase API Key', severity: 'high' },
  { pattern: /(?:connection[_-]?string|mongodb\+srv?:\/\/|postgres:\/\/|mysql:\/\/)[^\s"']+/i, name: 'Database Connection String', severity: 'critical' },
]

const INJECTION_PATTERNS: Array<{ pattern: RegExp; type: SecurityIssueType; name: string; severity: SecurityFinding['severity'] }> = [
  { pattern: /\beval\s*\(/g, type: 'injection', name: 'eval() Usage', severity: 'critical' },
  { pattern: /\bnew\s+Function\s*\(/g, type: 'injection', name: 'Dynamic Function Creation', severity: 'critical' },
  { pattern: /innerHTML\s*=/g, type: 'xss', name: 'innerHTML Assignment', severity: 'high' },
  { pattern: /document\.write\s*\(/g, type: 'xss', name: 'document.write() Usage', severity: 'high' },
  { pattern: /\$\{[^}]*\}/g, type: 'injection', name: 'Template Literal Injection Risk', severity: 'medium' },
  { pattern: /exec\s*\(\s*[^)]*\+\s*/g, type: 'injection', name: 'Command Injection via exec()', severity: 'critical' },
  { pattern: /spawn\s*\(/g, type: 'injection', name: 'Child Process spawn() Risk', severity: 'high' },
  { pattern: /\.exec\(.*req\./gi, type: 'injection', name: 'User Input in exec()', severity: 'critical' },
  { pattern: /query\s*\(\s*[^)]*(?:SELECT|INSERT|UPDATE|DELETE)/gi, type: 'injection', name: 'Raw SQL Query with User Input', severity: 'critical' },
]

const CRYPTO_ISSUES: Array<{ pattern: RegExp; type?: SecurityIssueType; name: string; severity: SecurityFinding['severity']; cwe: string }> = [
  { pattern: /md5\s*\(/gi, name: 'Weak Hash Algorithm (MD5)', severity: 'medium', cwe: 'CWE-328' },
  { pattern: /sha1\s*\(/gi, name: 'Weak Hash Algorithm (SHA1)', severity: 'medium', cwe: 'CWE-328' },
  { pattern: /createHash\s*\(\s*['"]md5/i, name: 'MD5 Hash Creation', severity: 'medium', cwe: 'CWE-328' },
  { pattern: /createHash\s*\(\s*['"]sha1/i, name: 'SHA1 Hash Creation', severity: 'medium', cwe: 'CWE-328' },
  { pattern: /createCipher\s*\(/gi, name: 'Deprecated createCipher (no IV)', severity: 'high', cwe: 'CWE-326' },
  { pattern: /createDecipher\s*\(/gi, name: 'Deprecated createDecipher', severity: 'high', cwe: 'CWE-326' },
  { pattern: /randomBytes\s*\(\s*[0-8]\s*\)/gi, name: 'Insufficient Random Bytes', severity: 'medium', cwe: 'CWE-330' },
  { pattern: /Math\.random\s*\(\s*\)/gi, name: 'Insecure Math.random() for Crypto', severity: 'high', cwe: 'CWE-330' },
]

const CONFIG_ISSUES: Array<{ pattern: RegExp; name: string; severity: SecurityFinding['severity'] }> = [
  { pattern: /cors\s*:\s*\*\s*}|Access-Control-Allow-Origin:\s*\*/gi, name: 'Wildcard CORS Policy', severity: 'high' },
  { pattern: /helmet\s*\(\s*\)/gi, name: 'Missing Helmet Configuration', severity: 'medium' },
  { pattern: /trust\s*proxy\s*:\s*true/gi, name: 'Trusted Proxy Without Validation', severity: 'medium' },
  { pattern: /cookie\s*:\s*\{[^}]*httpOnly\s*:\s*false/gi, name: 'Cookies Without httpOnly Flag', severity: 'medium' },
  { pattern: /cookie\s*:\s*\{[^}]*secure\s*:\s*false/gi, name: 'Cookies Without Secure Flag', severity: 'medium' },
  { pattern: /session\s*:\s*\{[^}]*secret\s*:\s*['"][^'"]+['"]/gi, name: 'Hardcoded Session Secret', severity: 'critical' },
  { pattern: /debug\s*:\s*true/gi, name: 'Debug Mode Enabled in Production', severity: 'medium' },
]

const OWASP_TOP_10_2021: Record<string, string> = {
  'A01': 'Broken Access Control',
  'A02': 'Cryptographic Failures',
  'A03': 'Injection',
  'A04': 'Insecure Design',
  'A05': 'Security Misconfiguration',
  'A06': 'Vulnerable and Outdated Components',
  'A07': 'Identification and Authentication Failures',
  'A08': 'Software and Data Integrity Failures',
  'A09': 'Security Logging and Monitoring Failures',
  'A10': 'Server-Side Request Forgery (SSRF)',
}

export class SecurityScannerEnhanced {
  private vulnerabilityCache: Map<string, VulnerabilityDatabaseEntry[]> = new Map()
  private scanHistory: SecurityScanResult[] = []
  private customRules: Array<{ pattern: RegExp; type: SecurityIssueType; name: string; severity: SecurityFinding['severity'] }> = []

  async scan(target: string, options: SecurityScanOptions): Promise<SecurityScanResult> {
    const startTime = Date.now()
    const scanId = this.generateScanId()

    const allFindings: SecurityFinding[] = []

    if (options.scanType === 'code' || options.scanType === 'full') {
      const codeFindings = await this.scanCode(target)
      allFindings.push(...codeFindings)
    }

    if (options.checkSecrets !== false) {
      const secretFindings = await this.scanForSecrets(target)
      allFindings.push(...secretFindings)
    }

    if (options.checkVulnerabilities !== false) {
      const vulnFindings = await this.scanForVulnerabilities(target)
      allFindings.push(...vulnFindings)
    }

    if (options.scanType === 'config' || options.scanType === 'full') {
      const configFindings = await this.scanConfiguration(target)
      allFindings.push(...configFindings)
    }

    const deduplicatedFindings = this.deduplicateFindings(allFindings)

    const summary = this.calculateSummary(deduplicatedFindings)
    const compliance = this.calculateCompliance(deduplicatedFindings)
    const recommendations = this.generateRecommendations(summary, deduplicatedFindings)

    const result: SecurityScanResult = {
      scanId,
      scannedAt: new Date().toISOString(),
      scanType: options.scanType,
      target,
      summary,
      findings: deduplicatedFindings,
      statistics: {
        filesScanned: this.countFiles(target),
        linesOfCode: this.estimateLinesOfCode(target),
        scanDurationMs: Date.now() - startTime,
        rulesApplied: SECRET_PATTERNS.length + INJECTION_PATTERNS.length + CRYPTO_ISSUES.length + CONFIG_ISSUES.length + this.customRules.length,
      },
      recommendations,
      compliance,
    }

    this.scanHistory.push(result)
    return result
  }

  private async scanCode(target: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = []
    const codeFiles = this.findCodeFiles(target)

    for (const file of codeFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8')
        const lines = content.split('\n')

        for (const rule of [...INJECTION_PATTERNS, ...CRYPTO_ISSUES, ...this.customRules]) {
          let match
          const regex = new RegExp(rule.pattern.source, rule.pattern.flags)

          while ((match = regex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length

            findings.push({
              id: this.generateFindingId(),
              type: rule.type || ('configuration' as SecurityIssueType),
              severity: rule.severity,
              title: `Potential ${rule.name}`,
              description: `Detected ${rule.name} at line ${lineNumber} in ${file}`,
              location: {
                file: file.replace(target + '/', ''),
                line: lineNumber,
                column: match.index - content.lastIndexOf('\n', match.index),
              },
              remediation: this.getRemediation(rule.name),
              confidence: 0.85,
              falsePositiveLikelihood: 'low',
              discoveredAt: new Date().toISOString(),
              status: 'open',
            })
          }
        }
      } catch (error) {
        console.error(`Error scanning ${file}:`, error)
      }
    }

    return findings
  }

  private async scanForSecrets(target: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = []
    const files = this.findAllFiles(target)

    for (const file of files) {
      if (!this.shouldScanFile(file)) continue

      try {
        const content = fs.readFileSync(file, 'utf-8')

        for (const secret of SECRET_PATTERNS) {
          let match
          const regex = new RegExp(secret.pattern.source, secret.pattern.flags)

          while ((match = regex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length
            const maskedValue = this.maskSensitiveValue(match[0])

            findings.push({
              id: this.generateFindingId(),
              type: 'secret-leakage',
              severity: secret.severity,
              title: `${secret.name} Detected`,
              description: `Potential ${secret.name} exposure found in ${file}:${lineNumber}. Value: ${maskedValue}`,
              location: {
                file: file.replace(target + '/', ''),
                line: lineNumber,
              },
              remediation: {
                steps: [
                  'Remove the hardcoded secret immediately',
                  'Rotate the exposed credential',
                  'Use environment variables or a secrets manager',
                  'Add the file to .gitignore if applicable',
                  'Check git history for previous commits containing the secret',
                ],
                references: [
                  'https://owasp.org/www-project-secrets/',
                  'https://github.com/trufflesecurity/trufflehog',
                ],
              },
              confidence: 0.92,
              falsePositiveLikelihood: 'low',
              discoveredAt: new Date().toISOString(),
              status: 'open',
            })
          }
        }
      } catch (error) {
        console.error(`Error scanning ${file} for secrets:`, error)
      }
    }

    return findings
  }

  private async scanForVulnerabilities(_target: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = []

    try {
      const packageJsonPath = path.join(_target, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

        for (const [pkgName, version] of Object.entries(dependencies)) {
          const knownVulns = this.checkKnownVulnerabilities(pkgName, String(version))

          for (const vuln of knownVulns) {
            findings.push({
              id: this.generateFindingId(),
              type: 'dependency',
              severity: vuln.severity === 'critical' ? 'critical' : vuln.severity === 'high' ? 'high' : 'medium',
              title: `Known Vulnerability in ${pkgName}`,
              description: `${vuln.cveId}: ${vuln.title}. Current version: ${version}, Patched in: ${vuln.patchedVersions.join(', ')}`,
              location: { file: 'package.json' },
              remediation: {
                steps: [`Upgrade ${pkgName} to version ${vuln.patchedVersions[0]} or later`],
                references: vuln.references,
              },
              cwe: 'CWE-1104',
              cvss: vuln.cvssScore,
              confidence: 0.95,
              falsePositiveLikelihood: 'low',
              discoveredAt: new Date().toISOString(),
              status: 'open',
            })
          }
        }
      }
    } catch (error) {
      console.error('Error checking dependencies:', error)
    }

    return findings
  }

  private async scanConfiguration(target: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = []
    const configFiles = this.findConfigFiles(target)

    for (const file of configFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8')

        for (const issue of CONFIG_ISSUES) {
          let match
          const regex = new RegExp(issue.pattern.source, issue.pattern.flags)

          while ((match = regex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length

            findings.push({
              id: this.generateFindingId(),
              type: 'configuration',
              severity: issue.severity,
              title: `Security Configuration Issue: ${issue.name}`,
              description: `Detected ${issue.name} in ${file}:${lineNumber}`,
              location: {
                file: file.replace(target + '/', ''),
                line: lineNumber,
              },
              remediation: this.getRemediation(issue.name),
              confidence: 0.88,
              falsePositiveLikelihood: 'medium',
              discoveredAt: new Date().toISOString(),
              status: 'open',
            })
          }
        }
      } catch (error) {
        console.error(`Error scanning config ${file}:`, error)
      }
    }

    return findings
  }

  private getRemediation(issueName: string): SecurityFinding['remediation'] {
    const remediations: Record<string, SecurityFinding['remediation']> = {
      'eval() Usage': {
        steps: ['Replace eval() with safer alternatives like JSON.parse() or function mapping'],
        codeExample: '// Instead of: eval(userInput)\n// Use: JSON.parse(jsonString) or a switch/case statement',
        references: ['https://cheatsheetseries.owasp.org/cheatsheets/Javascript_Cheat_Sheet.html'],
      },
      'innerHTML Assignment': {
        steps: ['Use textContent instead of innerHTML', 'If HTML is needed, sanitize input first using DOMPurify or similar library'],
        codeExample: '// Instead of: element.innerHTML = userInput\n// Use: element.textContent = userInput\n// Or: element.innerHTML = DOMPurify.sanitize(userInput)',
        references: ['https://owasp.org/www-community/xss-filter-evasion-cheatsheet'],
      },
      'Wildcard CORS Policy': {
        steps: ['Specify exact allowed origins instead of using wildcard (*)', 'Use environment variables for origin configuration'],
        codeExample: "app.use(cors({ origin: ['https://yourdomain.com'] }))",
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS'],
      },
      'Hardcoded Session Secret': {
        steps: ['Move session secret to environment variable', 'Use a strong random value generated at startup'],
        codeExample: "session({ secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex') })",
        references: [],
      },
      'Weak Hash Algorithm (MD5)': {
        steps: ['Replace MD5 with SHA-256 or SHA-3', 'Use crypto.createHash("sha256") instead'],
        codeExample: "// Instead of: crypto.createHash('md5')\n// Use: crypto.createHash('sha256')",
        references: ['https://csrc.nist.gov/projects/hash-functions'],
      },
      'Default': {
        steps: ['Review and fix the identified security issue', 'Follow security best practices for your framework'],
        references: ['https://owasp.org/www-project-top-ten/'],
      },
    }

    return remediations[issueName] || remediations['Default']
  }

  private calculateSummary(findings: SecurityFinding[]): SecurityScanResult['summary'] {
    const criticalCount = findings.filter(f => f.severity === 'critical').length
    const highCount = findings.filter(f => f.severity === 'high').length
    const mediumCount = findings.filter(f => f.severity === 'medium').length
    const lowCount = findings.filter(f => f.severity === 'low').length
    const infoCount = findings.filter(f => f.severity === 'info').length

    const totalFindings = findings.length
    const weightedScore = Math.max(0, 100 - (criticalCount * 25 + highCount * 15 + mediumCount * 7 + lowCount * 3))

    let grade: SecurityScanResult['summary']['grade']
    if (weightedScore >= 95) grade = 'A+'
    else if (weightedScore >= 85) grade = 'A'
    else if (weightedScore >= 70) grade = 'B'
    else if (weightedScore >= 55) grade = 'C'
    else if (weightedScore >= 40) grade = 'D'
    else grade = 'F'

    return {
      totalFindings,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      score: Math.round(weightedScore),
      grade,
    }
  }

  private calculateCompliance(findings: SecurityFinding[]): SecurityScanResult['compliance'] {
    const owaspMap: SecurityScanResult['compliance']['owaspTop10'] = {}
    const sansMap: SecurityScanResult['compliance']['sansTop25'] = {}

    Object.keys(OWASP_TOP_10_2021).forEach(key => {
      const relatedFindings = findings.filter(f => this.mapToOWASP(f.type) === key)
      owaspMap[key] = {
        covered: true,
        findings: relatedFindings.length,
      }
    })

    return {
      owaspTop10: owaspMap,
      sansTop25: sansMap,
      pciDss: [
        { requirement: '6.5 - Address common coding vulnerabilities', status: findings.length > 0 ? 'fail' as const : 'pass' as const },
        { requirement: '8.2 - Authenticate all access', status: findings.some(f => f.type === 'authentication') ? 'fail' as const : 'pass' as const },
      ],
    }
  }

  private generateRecommendations(summary: SecurityScanResult['summary'], findings: SecurityFinding[]): SecurityScanResult['recommendations'] {
    const recommendations: SecurityScanResult['recommendations'] = []

    if (summary.criticalCount > 0) {
      recommendations.push({
        priority: 'immediate',
        category: 'Critical Issues',
        description: `Address ${summary.criticalCount} critical security vulnerabilities immediately`,
        impact: 'High risk of data breach or system compromise',
      })
    }

    if (findings.some(f => f.type === 'secret-leakage')) {
      recommendations.push({
        priority: 'immediate',
        category: 'Secret Management',
        description: 'Implement proper secrets management and rotate exposed credentials',
        impact: 'Prevents unauthorized access to systems and data',
      })
    }

    if (summary.highCount > 0) {
      recommendations.push({
        priority: 'short-term',
        category: 'High Severity Issues',
        description: `Resolve ${summary.highCount} high-severity issues within the next sprint`,
        impact: 'Reduces attack surface significantly',
      })
    }

    recommendations.push({
      priority: 'long-term',
      category: 'Security Hardening',
      description: 'Implement security headers, CSP, and regular dependency updates',
      impact: 'Improves overall security posture',
    })

    return recommendations
  }

  private mapToOWASP(type: SecurityIssueType): string {
    const mapping: Partial<Record<SecurityIssueType, string>> = {
      injection: 'A03',
      xss: 'A03',
      authentication: 'A07',
      authorization: 'A01',
      crypto: 'A02',
      configuration: 'A05',
      dependency: 'A06',
      'information-disclosure': 'A09',
      'denial-of-service': 'A04',
      'secret-leakage': 'A02',
      csrf: 'A01',
      ssrf: 'A10',
    }
    return mapping[type] || 'A04'
  }

  private deduplicateFindings(findings: SecurityFinding[]): SecurityFinding[] {
    const seen = new Set<string>()
    return findings.filter(f => {
      const key = `${f.type}-${f.location?.file}-${f.title}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  private maskSensitiveValue(value: string): string {
    if (value.length <= 8) return '****'
    return value.substring(0, 4) + '****' + value.substring(value.length - 4)
  }

  private shouldScanFile(filePath: string): boolean {
    const skipPatterns = [/node_modules/, /\.git/, /dist/, /build/, /\.min\.js/, /\.map$/]
    return !skipPatterns.some(p => p.test(filePath))
  }

  private findCodeFiles(target: string): string[] {
    const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs']
    return this.findFilesByExtension(target, extensions)
  }

  private findConfigFiles(target: string): string[] {
    const configs = ['.env*', '*.config.js', '*.config.ts', 'server.ts', 'app.js', 'index.js']

    const results: string[] = []
    for (const pattern of configs) {
      try {
        const fullPath = path.join(target, pattern)
        if (fs.existsSync(fullPath)) results.push(fullPath)
      } catch {
        // Ignore config file search errors
      }
    }
    return results
  }

  private findFilesByExtension(dir: string, extensions: string[]): string[] {
    const results: string[] = []

    function walk(currentDir: string) {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true })

        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue

          const fullPath = path.join(currentDir, entry.name)

          if (entry.isDirectory()) {
            walk(fullPath)
          } else if (extensions.some(ext => entry.name.endsWith(ext))) {
            results.push(fullPath)
          }
        }
      } catch {
        // Ignore directory read errors
      }
    }

    walk(dir)
    return results
  }

  private findAllFiles(target: string): string[] {
    const results: string[] = []

    function walk(currentDir: string) {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true })

        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue

          const fullPath = path.join(currentDir, entry.name)

          if (entry.isDirectory()) {
            walk(fullPath)
          } else {
            results.push(fullPath)
          }
        }
      } catch {
        // Ignore file listing errors
      }
    }

    walk(target)
    return results
  }

  private countFiles(target: string): number {
    return this.findAllFiles(target).length
  }

  private estimateLinesOfCode(target: string): number {
    let totalLines = 0

    for (const file of this.findCodeFiles(target)) {
      try {
        const content = fs.readFileSync(file, 'utf-8')
        totalLines += content.split('\n').length
      } catch {
        // Ignore line counting errors
      }
    }

    return totalLines
  }

  private checkKnownVulnerabilities(packageName: string, version: string): VulnerabilityDatabaseEntry[] {
    const knownVulns: Record<string, VulnerabilityDatabaseEntry[]> = {
      'lodash': [{
        cveId: 'CVE-2021-23337',
        title: 'Command Injection in lodash',
        severity: 'high',
        cvssScore: 7.2,
        affectedPackages: ['<4.17.21'],
        patchedVersions: ['4.17.21'],
        description: 'Prototype pollution vulnerability',
        references: ['https://github.com/lodash/lodash/issues/4937'],
        publishedDate: '2021-02-09',
      }],
      'express': [{
        cveId: 'CVE-2022-24999',
        title: 'Open Redirect in express',
        severity: 'medium',
        cvssScore: 5.4,
        affectedPackages: ['<4.18.2'],
        patchedVersions: ['4.18.2'],
        description: 'Open redirect vulnerability in res.redirect()',
        references: ['https://expressjs.com/en/changelog/4x.html#4.18.2'],
        publishedDate: '2022-03-22',
      }],
    }

    return knownVulns[packageName] || []
  }

  private generateScanId(): string {
    return `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }

  private generateFindingId(): string {
    return `finding-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }

  addCustomRule(rule: { pattern: RegExp; type: SecurityIssueType; name: string; severity: SecurityFinding['severity'] }): void {
    this.customRules.push(rule)
  }

  getScanHistory(limit: number = 10): SecurityScanResult[] {
    return this.scanHistory.slice(-limit)
  }

  getStatus(): {
    name: string
    version: string
    scansPerformed: number
    totalFindings: number
    rulesLoaded: number
    capabilities: string[]
  } {
    return {
      name: 'yyc3-security-scanner-enhanced',
      version: '2.0.0',
      scansPerformed: this.scanHistory.length,
      totalFindings: this.scanHistory.reduce((sum, s) => sum + s.summary.totalFindings, 0),
      rulesLoaded: SECRET_PATTERNS.length + INJECTION_PATTERNS.length + CRYPTO_ISSUES.length + CONFIG_ISSUES.length + this.customRules.length,
      capabilities: [
        'Secret Detection (API Keys, Passwords, Tokens)',
        'Injection Prevention (SQL, XSS, Command)',
        'Cryptographic Weakness Detection',
        'Dependency Vulnerability Scanning',
        'Configuration Security Audit',
        'OWASP Top 10 Mapping',
        'Compliance Reporting (PCI-DSS)',
        'Custom Rule Support',
      ],
    }
  }
}
