export type LanguageCode =
  | 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'pt'
  | 'ru' | 'it' | 'ar' | 'hi' | 'th' | 'vi' | 'id' | 'ms'
  | 'tr' | 'pl' | 'nl' | 'sv' | 'da' | 'no' | 'fi' | 'cs'
  | 'hu' | 'ro' | 'uk' | 'he' | 'auto'

export interface TranslationConfig {
  apiKey?: string
  model?: string
  defaultSource?: LanguageCode
  defaultTarget?: LanguageCode
  cacheEnabled?: boolean
  maxTextLength?: number
}

export interface TranslationRequest {
  text: string
  source: LanguageCode | 'auto'
  target: LanguageCode
  context?: string
  domain?: string
  tone?: 'formal' | 'casual' | 'professional' | 'creative'
}

export interface TranslationResult {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  confidence: number
  detectedLanguage?: string
  alternatives?: string[]
  wordCount: { original: number; translated: number }
  timestamp: string
}

export interface BatchTranslationRequest {
  texts: string[]
  source: LanguageCode | 'auto'
  target: LanguageCode
  context?: string
  parallel?: boolean
}

export interface BatchTranslationResult {
  results: TranslationResult[]
  totalCount: number
  successCount: number
  failureCount: number
  totalDurationMs: number
}

export interface LanguageInfo {
  code: LanguageCode
  name: string
  nativeName: string
  direction: 'ltr' | 'rtl'
  script: string
}

const LANGUAGE_MAP: Record<string, LanguageInfo> = {
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr', script: 'Hanzi' },
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', script: 'Latin' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr', script: 'Kana/Kanji' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr', script: 'Hangul' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', script: 'Latin' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', script: 'Latin' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr', script: 'Latin' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', script: 'Latin' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr', script: 'Cyrillic' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr', script: 'Latin' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', script: 'Arabic' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr', script: 'Devanagari' },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', direction: 'ltr', script: 'Thai' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr', script: 'Latin' },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr', script: 'Latin' },
  ms: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', direction: 'ltr', script: 'Latin' },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', script: 'Latin' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', direction: 'ltr', script: 'Latin' },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr', script: 'Latin' },
  sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska', direction: 'ltr', script: 'Latin' },
  da: { code: 'da', name: 'Danish', nativeName: 'Dansk', direction: 'ltr', script: 'Latin' },
  no: { code: 'no', name: 'Norwegian', nativeName: 'Norsk', direction: 'ltr', script: 'Latin' },
  fi: { code: 'fi', name: 'Finnish', nativeName: 'Suomi', direction: 'ltr', script: 'Latin' },
  cs: { code: 'cs', name: 'Czech', nativeName: 'Čeština', direction: 'ltr', script: 'Latin' },
  hu: { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', direction: 'ltr', script: 'Latin' },
  ro: { code: 'ro', name: 'Romanian', nativeName: 'Română', direction: 'ltr', script: 'Latin' },
  uk: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', direction: 'ltr', script: 'Cyrillic' },
  he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', script: 'Hebrew' },
}

const DOMAIN_PROMPTS: Record<string, string> = {
  technical: 'You are a technical translator specializing in software engineering, IT documentation, and technical specifications.',
  business: 'You are a business translator specializing in contracts, reports, emails, and corporate communications.',
  medical: 'You are a medical/healthcare translator specializing in clinical documents, research papers, and patient information.',
  legal: 'You are a legal translator specializing in contracts, regulations, patents, and court documents.',
  academic: 'You are an academic translator specializing in research papers, dissertations, and scholarly articles.',
  marketing: 'You are a marketing/copywriting translator that preserves persuasive intent and cultural appeal.',
  literary: 'You are a literary translator specializing in novels, poetry, and creative writing with attention to style.',
  general: 'You are a professional translator providing accurate, natural-sounding translations.',
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal: 'Use formal language appropriate for official documents or professional settings.',
  casual: 'Use conversational, everyday language suitable for informal communication.',
  professional: 'Use polished, business-appropriate language that balances formality with clarity.',
  creative: 'Adapt creatively to preserve emotional impact and cultural resonance in the target language.',
}

export class TranslationService {
  private config: TranslationConfig
  private cache: Map<string, TranslationResult>

  constructor(config: TranslationConfig = {}) {
    this.config = {
      model: 'glm-4-flash',
      defaultSource: 'auto',
      defaultTarget: 'en',
      cacheEnabled: true,
      maxTextLength: 10000,
      ...config,
    }
    this.cache = new Map()
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const { text, source, target, context, domain, tone } = request

    if (!text || !text.trim()) {
      throw new Error('翻译文本不能为空')
    }

    const truncatedText = text.slice(0, this.config.maxTextLength ?? 10000)
    const effectiveSource = source || this.config.defaultSource || 'auto'
    const effectiveTarget = target || this.config.defaultTarget || 'en'

    if (effectiveSource === effectiveTarget) {
      return this.buildSameLanguageResult(truncatedText, effectiveSource)
    }

    const cacheKey = `${effectiveSource}:${effectiveTarget}:${this.hashText(truncatedText)}`

    if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    const result = await this.callTranslationAPI(truncatedText, effectiveSource, effectiveTarget, context, domain, tone)

    if (this.config.cacheEnabled) {
      this.cache.set(cacheKey, result)
      if (this.cache.size > 500) {
        const firstKey = this.cache.keys().next().value
        if (firstKey) this.cache.delete(firstKey)
      }
    }

    return result
  }

  async translateBatch(request: BatchTranslationRequest): Promise<BatchTranslationResult> {
    const { texts, source, target, context, parallel = true } = request

    if (!texts.length) {
      throw new Error('翻译文本列表不能为空')
    }

    const startTime = Date.now()
    const results: TranslationResult[] = []

    if (parallel && texts.length <= 20) {
      const promises: Promise<TranslationResult>[] = texts.map(text =>
        this.translate({ text, source, target, context }).catch(err => ({
          originalText: text,
          translatedText: `[翻译失败: ${err instanceof Error ? err.message : String(err)}]`,
          sourceLanguage: source,
          targetLanguage: target,
          confidence: 0,
          wordCount: { original: text.split(/\s+/).length, translated: 0 },
          timestamp: new Date().toISOString(),
        }))
      )

      const resolved = await Promise.allSettled(promises)
      for (const r of resolved) {
        if (r.status === 'fulfilled') {
          results.push(r.value as TranslationResult)
        } else {
          results.push({
            originalText: '',
            translatedText: `[翻译失败: ${r.reason}]`,
            sourceLanguage: source,
            targetLanguage: target,
            confidence: 0,
            wordCount: { original: 0, translated: 0 },
            timestamp: new Date().toISOString(),
          })
        }
      }
    } else {
      for (const text of texts) {
        try {
          const result = await this.translate({ text, source, target, context })
          results.push(result)
        } catch {
          results.push({
            originalText: text,
            translatedText: '[翻译失败]',
            sourceLanguage: source,
            targetLanguage: target,
            confidence: 0,
            wordCount: { original: text.split(/\s+/).length, translated: 0 },
            timestamp: new Date().toISOString(),
          })
        }
      }
    }

    const successCount = results.filter(r => r.confidence > 0).length

    return {
      results,
      totalCount: results.length,
      successCount,
      failureCount: results.length - successCount,
      totalDurationMs: Date.now() - startTime,
    }
  }

  async detectLanguage(text: string): Promise<{ language: LanguageCode; confidence: number; name: string }> {
    const prompt = `Detect the language of the following text. Respond ONLY with a JSON object:
{
  "code": "language_code",
  "confidence": 0.95,
  "name": "Language Name"
}

Text to analyze:
"""${text.slice(0, 2000)}"""

Supported codes: ${Object.keys(LANGUAGE_MAP).join(', ')}`

    try {
      const response = await this.callLLM(prompt)
      const match = response.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        return {
          language: parsed.code || 'en',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
          name: parsed.name || (LANGUAGE_INFO as Record<string, LanguageInfo>)[parsed.code]?.name || 'Unknown',
        }
      }
    } catch {
      // Ignore language detection errors
    }

    return { language: 'auto', confidence: 0.5, name: 'Unknown' }
  }

  getSupportedLanguages(): LanguageInfo[] {
    return Object.values(LANGUAGE_MAP)
  }

  getLanguageInfo(code: LanguageCode): LanguageInfo | undefined {
    return LANGUAGE_MAP[code]
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).slice(0, 10),
    }
  }

  private buildSameLanguageResult(text: string, lang: string): TranslationResult {
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage: lang,
      targetLanguage: lang,
      confidence: 1.0,
      wordCount: {
        original: text.split(/\s+/).filter(Boolean).length,
        translated: text.split(/\s+/).filter(Boolean).length,
      },
      timestamp: new Date().toISOString(),
    }
  }

  private async callTranslationAPI(
    text: string,
    source: string,
    target: string,
    context?: string,
    domain?: string,
    tone?: string
  ): Promise<TranslationResult> {
    const sourceLang = LANGUAGE_MAP[source as LanguageCode]?.name || source
    const targetLang = LANGUAGE_MAP[target as LanguageCode]?.name || target

    const domainInstruction = domain ? DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.general : ''
    const toneInstruction = tone ? TONE_INSTRUCTIONS[tone] || '' : ''

    const systemPrompt = [
      `You are a professional ${sourceLang}-${targetLang} translator.`,
      domainInstruction,
      toneInstruction,
      `Rules:
- Translate accurately while preserving meaning, tone, and nuance.
- Maintain formatting (markdown, line breaks, lists).
- Do NOT add explanations, notes, or comments.
- Output ONLY the translated text, nothing else.
- If the text contains code/technical terms, keep them unchanged unless there's a standard translation.`,
    ].filter(Boolean).join('\n')

    let userPrompt = `Translate the following from ${sourceLang} to ${targetLang}:`

    if (context) {
      userPrompt += `\n\nContext/Domain: ${context}`
    }

    userPrompt += `\n\n---\n${text}\n---`

    const startTime = Date.now()

    try {
      const translatedText = await this.callLLM(userPrompt, systemPrompt)
      const elapsed = Date.now() - startTime

      const cleanResult = translatedText.trim()

      return {
        originalText: text,
        translatedText: cleanResult,
        sourceLanguage: source,
        targetLanguage: target,
        confidence: Math.max(0.3, Math.min(1.0, 1 - (elapsed / 10000))),
        wordCount: {
          original: text.split(/\s+/).filter(Boolean).length,
          translated: cleanResult.split(/\s+/).filter(Boolean).length,
        },
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new Error(`翻译请求失败: ${error instanceof Error ? error.message : error}`)
    }
  }

  private async callLLM(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return this.getMockTranslation(prompt)
    }

    const model = this.config.model || 'glm-4-flash'

    const messages: Array<{ role: string; content: string }> = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push({ role: 'user', content: prompt })

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new Error(`ZhipuAI API 错误 (${response.status}): ${errorBody}`)
    }

    const data: any = await response.json()

    if (data.error) {
      throw new Error(`ZhipuAI 翻译错误: ${data.error.message || JSON.stringify(data.error)}`)
    }

    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('翻译结果为空')
    }

    return content
  }

  private getMockTranslation(_prompt: string): string {
    const mockResponses = [
      '[Mock] Translation completed - please configure ZHIPU_API_KEY for real translations.',
      '[模拟] 翻译完成 - 请配置 ZHIPU_API_KEY 以启用真实翻译。',
      '[模拟] 翻訳完了 - 実際の翻訳には ZHIPU_API_KEY を設定してください。',
      '[모의] 번역 완료 - 실제 번역을 위해 ZHIPU_API_KEY를 구성하세요.',
    ]

    return mockResponses[Math.floor(Math.random() * mockResponses.length)]
  }

  private hashText(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return Math.abs(hash).toString(36)
  }
}

export const LANGUAGE_INFO = LANGUAGE_MAP
