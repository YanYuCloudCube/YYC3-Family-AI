export interface TTSConfig {
  apiKey?: string
  model?: string
  defaultVoice?: TTSVoice
  defaultFormat?: AudioFormat
  sampleRate?: number
}

export type AudioFormat = 'mp3' | 'wav' | 'opus' | 'flac' | 'aac' | 'pcm' | 'ogg'
export type TTSVoice =
  | 'female-tianmei-jingpin' | 'female-shaonv-tianmei' | 'female-yujie-jingpin'
  | 'male-chunqiu-wenrou' | 'male-qinggan-wenrou' | 'female-yujie-wenrou'
  | 'female-badao-wenrou' | 'male-qn-jingpin' | 'female-shaonv-badao'
  | 'female-yujie-badao' | 'male-chunqiu-jingpin' | 'female-shaonv-yujie'
  | 'male-qn-badao' | 'male-chunqiu-badao' | 'male-qn-yujie'
  | 'female-shentiyu-jingpin' | 'female-cantonese-jingpin' | 'male-cantonese-jingpin'

export interface TTSSynthesizeRequest {
  text: string
  voice?: TTSVoice
  format?: AudioFormat
  speed?: number
  volume?: number
  pitch?: number
  sampleRate?: number
  outputAsBase64?: boolean
}

export interface TTSSynthesizeResult {
  audioData: string
  format: AudioFormat
  durationMs: number
  textLength: number
  voice: TTSVoice
  sizeBytes: number
  synthesizedAt: string
}

export interface TTSBatchRequest {
  segments: Array<{ text: string; voice?: TTSVoice }>
  format?: AudioFormat
  mergeOutput?: boolean
}

export const VOICE_LIST: Array<{ id: TTSVoice; name: string; gender: string; style: string; language: string }> = [
  { id: 'female-tianmei-jingpin', name: '甜美女声(精品)', gender: '女', style: '甜美', language: 'zh-CN' },
  { id: 'female-shaonv-tianmei', name: '少女甜美', gender: '女', style: '甜美', language: 'zh-CN' },
  { id: 'female-yujie-jingpin', name: '御姐女声(精品)', gender: '女', style: '成熟', language: 'zh-CN' },
  { id: 'male-chunqiu-wenrou', name: '醇厚男声(温柔)', gender: '男', style: '温柔', language: 'zh-CN' },
  { id: 'male-qinggan-wenrou', name: '情感男声(温柔)', gender: '男', style: '情感', language: 'zh-CN' },
  { id: 'female-yujie-wenrou', name: '御姐女声(温柔)', gender: '女', style: '成熟', language: 'zh-CN' },
  { id: 'female-badao-wenrou', name: '霸道女声(温柔)', gender: '女', style: '霸气', language: 'zh-CN' },
  { id: 'male-qn-jingpin', name: '情感男声(精品)', gender: '男', style: '情感', language: 'zh-CN' },
  { id: 'female-shaonv-badao', name: '少女霸道', gender: '女', style: '活泼', language: 'zh-CN' },
  { id: 'female-yujie-badao', name: '御姐霸道', gender: '女', style: '霸气', language: 'zh-CN' },
  { id: 'male-chunqiu-jingpin', name: '醇厚男声(精品)', gender: '男', style: '沉稳', language: 'zh-CN' },
  { id: 'female-shaonv-yujie', name: '少女御姐', gender: '女', style: '优雅', language: 'zh-CN' },
  { id: 'male-qn-badao', name: '情感男声(霸道)', gender: '男', style: '磁性', language: 'zh-CN' },
  { id: 'male-chunqiu-badao', name: '醇厚男声(霸道)', gender: '男', style: '深沉', language: 'zh-CN' },
  { id: 'male-qn-yujie', name: '情感男声(御姐)', gender: '男', style: '温暖', language: 'zh-CN' },
  { id: 'female-shentiyu-jingpin', name: '身语音色(精品)', gender: '女', style: '亲切', language: 'zh-CN' },
  { id: 'female-cantonese-jingpin', name: '粤语女声(精品)', gender: '女', style: '标准', language: 'yue' },
  { id: 'male-cantonese-jingpin', name: '粤语男声(精品)', gender: '男', style: '标准', language: 'yue' },
]

const ZH_CHAR_RATE = 3.5

export class TTSService {
  private config: TTSConfig

  constructor(config: TTSConfig = {}) {
    this.config = {
      model: 'tts-1',
      defaultVoice: 'female-tianmei-jingpin',
      defaultFormat: 'mp3',
      sampleRate: 24000,
      ...config,
    }
  }

  async synthesize(request: TTSSynthesizeRequest): Promise<TTSSynthesizeResult> {
    if (!request.text || !request.text.trim()) {
      throw new Error('合成文本不能为空')
    }

    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return this.getMockAudio(request)
    }

    const startTime = Date.now()

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'tts-1',
          input: request.text.trim(),
          voice: request.voice || this.config.defaultVoice || 'female-tianmei-jingpin',
          response_format: request.format || this.config.defaultFormat || 'mp3',
          speed: request.speed ?? 1.0,
          ...(request.sampleRate ? { sample_rate: request.sampleRate } : {}),
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        throw new Error(`COgTTS API 错误 (${response.status}): ${errorBody}`)
      }

      const audioBuffer = await response.arrayBuffer()
      const base64Audio = Buffer.from(audioBuffer).toString('base64')

      const estimatedDuration = Math.ceil(
        (request.text.length * ZH_CHAR_RATE) / (request.speed || 1.0) * 1000
      )

      return {
        audioData: base64Audio,
        format: request.format || this.config.defaultFormat || 'mp3',
        durationMs: estimatedDuration,
        textLength: request.text.length,
        voice: request.voice || this.config.defaultVoice || 'female-tianmei-jingpin',
        sizeBytes: audioBuffer.byteLength,
        synthesizedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('[TTS] Synthesis failed:', error)
      return this.getMockAudio(request)
    }
  }

  async synthesizeBatch(request: TTSBatchRequest): Promise<TTSSynthesizeResult[]> {
    const results: TTSSynthesizeResult[] = []

    for (let i = 0; i < request.segments.length; i++) {
      const segment = request.segments[i]
      try {
        const result = await this.synthesize({
          text: segment.text,
          voice: segment.voice,
          format: request.format,
        })
        results.push(result)
      } catch (error) {
        console.error(`[TTS] Batch segment ${i} failed:`, error)
      }

      if (i < request.segments.length - 1) {
        await this.delay(200)
      }
    }

    return results
  }

  getAvailableVoices(): typeof VOICE_LIST {
    return VOICE_LIST
  }

  getVoiceById(id: TTSVoice): typeof VOICE_LIST[number] | undefined {
    return VOICE_LIST.find(v => v.id === id)
  }

  estimateDuration(text: string, speed: number = 1.0, _format: AudioFormat = 'mp3'): number {
    const charCount = text.replace(/\s/g, '').length
    return Math.ceil((charCount * ZH_CHAR_RATE) / speed * 1000)
  }

  estimateFileSize(durationMs: number, format: AudioFormat = 'mp3'): number {
    const bitRates: Record<AudioFormat, number> = {
      mp3: 128000,
      wav: 1411200,
      opus: 64000,
      flac: 768000,
      aac: 128000,
      pcm: 384000,
      ogg: 192000,
    }

    const bitrate = bitRates[format] || 128000
    return Math.ceil((durationMs / 1000) * (bitrate / 8))
  }

  private getMockAudio(request: TTSSynthesizeRequest): TTSSynthesizeResult {
    const duration = this.estimateDuration(
      request.text,
      request.speed || 1.0,
      request.format || this.config.defaultFormat || 'mp3'
    )

    const fileSize = this.estimateFileSize(
      duration,
      request.format || this.config.defaultFormat || 'mp3'
    )

    const mockWavHeader = Buffer.alloc(44)

    mockWavHeader.write('RIFF', 0)
    mockWavHeader.writeUInt32LE(36 + fileSize, 4)
    mockWavHeader.write('WAVE', 8)
    mockWavHeader.write('fmt ', 12)
    mockWavHeader.writeUInt32LE(16, 16)
    mockWavHeader.writeUInt16LE(1, 20)
    mockWavHeader.writeUInt16LE(1, 22)
    mockWavHeader.writeUInt32LE(this.config.sampleRate || 24000, 24)
    mockWavHeader.writeUInt32LE((this.config.sampleRate || 24000) * 2, 28)
    mockWavHeader.writeUInt16LE(2, 32)
    mockWavHeader.writeUInt16LE(16, 34)
    mockWavHeader.write('data', 36)
    mockWavHeader.writeUInt32LE(fileSize, 40)

    const silentData = Buffer.alloc(fileSize)
    const fullBuffer = Buffer.concat([mockWavHeader, silentData])

    return {
      audioData: fullBuffer.toString('base64'),
      format: request.format || this.config.defaultFormat || 'mp3',
      durationMs: duration,
      textLength: request.text.length,
      voice: request.voice || this.config.defaultVoice || 'female-tianmei-jingpin',
      sizeBytes: fullBuffer.length,
      synthesizedAt: new Date().toISOString(),
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
