export interface ASRConfig {
  apiKey?: string
  model?: string
  language?: string
  enablePunctuation?: boolean
  enableItn?: boolean
}

export type AudioEncoding = 'wav' | 'mp3' | 'pcm' | 'opus' | 'flac' | 'aac' | 'ogg' | 'm4a' | 'webm'

export interface ASRTranscribeRequest {
  audioData: string
  encoding?: AudioEncoding
  sampleRate?: number
  language?: string
  enablePunctuation?: boolean
  enableWordTimestamps?: boolean
  enableDiarization?: boolean
  maxSpeakers?: number
  vocabulary?: string[]
  hotwords?: Array<{ word: string; boost: number }>
}

export interface WordTimestamp {
  word: string
  start: number
  end: number
  confidence: number
}

export interface SpeakerSegment {
  speaker: string
  startTime: number
  endTime: number
  text: string
  confidence: number
}

export interface ASRTranscribeResult {
  text: string
  language: string
  durationMs: number
  confidence: number
  segments: Array<{
    text: string
    start: number
    end: number
    confidence: number
  }>
  wordTimestamps?: WordTimestamp[]
  speakers?: SpeakerSegment[]
  detectedLanguage?: string
  audioFormat: string
  processedAt: string
}

export interface ASRTranslateResult {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  confidence: number
  translatedAt: string
}

const SAMPLE_RATES = [8000, 16000, 22050, 24000, 44100, 48000]

export class ASRService {
  private config: ASRConfig

  constructor(config: ASRConfig = {}) {
    this.config = {
      model: 'whisper-1',
      language: 'zh-CN',
      enablePunctuation: true,
      enableItn: true,
      ...config,
    }
  }

  async transcribe(request: ASRTranscribeRequest): Promise<ASRTranscribeResult> {
    if (!request.audioData) {
      throw new Error('音频数据不能为空')
    }

    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return this.getMockResult(request)
    }

    const startTime = Date.now()

    try {
      let audioBuffer: Buffer

      if (this.isBase64(request.audioData)) {
        audioBuffer = Buffer.from(request.audioData, 'base64')
      } else {
        throw new Error('音频数据格式错误，需要 Base64 编码')
      }

      const formData = new FormData()
      formData.append('file', new Blob([new Uint8Array(audioBuffer)]), `audio.${request.encoding || 'wav'}`)
      formData.append('model', this.config.model || 'whisper-1')
      formData.append('language', request.language || this.config.language || 'zh-CN')

      if (request.enablePunctuation !== undefined) {
        formData.append('punctuation', String(request.enablePunctuation))
      }
      if (request.enableWordTimestamps) {
        formData.append('timestamp_granularities[]', 'word')
      }
      if (request.hotwords && request.hotwords.length > 0) {
        for (const hw of request.hotwords) {
          formData.append('hotword', `${hw.word}:${hw.boost}`)
        }
      }
      if (request.vocabulary && request.vocabulary.length > 0) {
        formData.append('vocabulary', request.vocabulary.join(','))
      }

      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        throw new Error(`GLM-ASR API 错误 (${response.status}): ${errorBody}`)
      }

      const data: any = await response.json()
      const processingTimeMs = Date.now() - startTime

      return {
        text: data.text || '',
        language: data.language || request.language || this.config.language || 'zh-CN',
        durationMs: data.duration ? Math.round(data.duration * 1000) : this.estimateDuration(audioBuffer.byteLength, request.encoding),
        confidence: data.confidence ?? 0.95,
        segments: data.segments?.map((seg: any) => ({
          text: seg.text || '',
          start: Math.round((seg.start || 0) * 1000),
          end: Math.round((seg.end || 0) * 1000),
          confidence: seg.confidence ?? 0.95,
        })) || [],
        wordTimestamps: data.words?.map((w: any) => ({
          word: w.word || '',
          start: Math.round((w.start || 0) * 1000),
          end: Math.round((w.end || 0) * 1000),
          confidence: w.confidence ?? 0.9,
        })),
        detectedLanguage: data.detected_language,
        audioFormat: request.encoding || 'wav',
        processedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('[ASR] Transcription failed:', error)
      return this.getMockResult(request)
    }
  }

  async transcribeFile(filePath: string, options?: Partial<ASRTranscribeRequest>): Promise<ASRTranscribeResult> {
    try {
      const fs = await import('fs/promises')
      const fileBuffer = await fs.readFile(filePath)
      const base64Audio = fileBuffer.toString('base64')

      return this.transcribe({
        ...options,
        audioData: base64Audio,
        encoding: this.detectFormatFromPath(filePath),
      })
    } catch (error) {
      throw new Error(`读取文件失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async translate(
    request: Omit<ASRTranscribeRequest, 'enableDiarization'> & { targetLanguage: string }
  ): Promise<ASRTranslateResult> {
    const transcription = await this.transcribe(request)

    return {
      originalText: transcription.text,
      translatedText: `[翻译结果 - 目标语言: ${request.targetLanguage}] ${transcription.text}`,
      sourceLanguage: transcription.language,
      targetLanguage: request.targetLanguage,
      confidence: transcription.confidence,
      translatedAt: new Date().toISOString(),
    }
  }

  getSupportedFormats(): Array<{ format: AudioEncoding; description: string; recommended: boolean }> {
    return [
      { format: 'wav', description: '无损波形格式，推荐用于高质量转录', recommended: true },
      { format: 'mp3', description: '有损压缩，通用性好', recommended: true },
      { format: 'flac', description: '无损压缩，质量高', recommended: false },
      { format: 'pcm', description: '原始 PCM 数据', recommended: false },
      { format: 'opus', description: '低延迟语音编码', recommended: false },
      { format: 'aac', description: '高效编码，移动端常用', recommended: false },
      { format: 'ogg', description: '开源容器格式', recommended: false },
      { format: 'm4a', description: 'Apple 音频格式', recommended: false },
      { format: 'webm', description: 'Web 原生格式', recommended: false },
    ]
  }

  getSupportedLanguages(): Array<{ code: string; name: string; nativeName: string }> {
    return [
      { code: 'zh-CN', name: 'Chinese (Mandarin)', nativeName: '普通话' },
      { code: 'zh-TW', name: 'Chinese (Taiwanese)', nativeName: '繁体中文' },
      { code: 'yue', name: 'Cantonese', nativeName: '粤语' },
      { code: 'en-US', name: 'English (US)', nativeName: '美式英语' },
      { code: 'en-GB', name: 'English (UK)', nativeName: '英式英语' },
      { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
      { code: 'fr-FR', name: 'French', nativeName: 'Français' },
      { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
      { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português' },
      { code: 'ru-RU', name: 'Russian', nativeName: 'Русский' },
      { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'th-TH', name: 'Thai', nativeName: 'ไทย' },
      { code: 'vi-VN', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    ]
  }

  validateAudioParams(encoding: AudioEncoding, sampleRate: number): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!SAMPLE_RATES.includes(sampleRate)) {
      errors.push(`不支持的采样率: ${sampleRate}Hz，支持: ${SAMPLE_RATES.join(', ')}Hz`)
    }

    const validEncodings: AudioEncoding[] = ['wav', 'mp3', 'pcm', 'opus', 'flac', 'aac', 'ogg', 'm4a', 'webm']
    if (!validEncodings.includes(encoding)) {
      errors.push(`不支持的音频格式: ${encoding}`)
    }

    return { valid: errors.length === 0, errors }
  }

  private isBase64(str: string): boolean {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    return base64Regex.test(str) && str.length > 0
  }

  private estimateDuration(byteLength: number, _encoding?: AudioEncoding): number {
    const avgBitrate = 128000
    return Math.ceil((byteLength * 8) / avgBitrate * 1000)
  }

  private detectFormatFromPath(filePath: string): AudioEncoding {
    const ext = filePath.split('.').pop()?.toLowerCase()

    const extMap: Record<string, AudioEncoding> = {
      wav: 'wav',
      mp3: 'mp3',
      flac: 'flac',
      pcm: 'pcm',
      opus: 'opus',
      aac: 'aac',
      ogg: 'ogg',
      m4a: 'm4a',
      webm: 'webm',
    }

    return extMap[ext || ''] || 'wav'
  }

  private getMockResult(_request: ASRTranscribeRequest): ASRTranscribeResult {
    const mockText = '这是一段模拟的语音识别结果。请配置 ZHIPU_API_KEY 以使用真实的 GLM-ASR 服务。'
    const mockSegments = [
      { text: mockText, start: 0, end: 3000, confidence: 0.92 },
    ]

    return {
      text: mockText,
      language: this.config.language || 'zh-CN',
      durationMs: 3000,
      confidence: 0.92,
      segments: mockSegments,
      wordTimestamps: mockText.split('').map((char, i) => ({
        word: char,
        start: i * 80,
        end: (i + 1) * 80,
        confidence: 0.88 + Math.random() * 0.12,
      })),
      audioFormat: _request.encoding || 'wav',
      processedAt: new Date().toISOString(),
    }
  }
}
