export interface PodcastConfig {
  language?: 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
  voiceStyle?: 'professional' | 'casual' | 'energetic' | 'calm'
  outputFormat?: 'mp3' | 'wav' | 'ogg'
  sampleRate?: number
  bitrate?: number
  enableBackgroundMusic?: boolean
  enableSoundEffects?: boolean
}

export interface PodcastEpisode {
  id: string
  title: string
  description: string
  hostName?: string
  guestNames?: string[]
  duration?: number
  segments: PodcastSegment[]
  metadata: {
    createdAt: string
    updatedAt: string
    status: 'draft' | 'recording' | 'processing' | 'published'
    tags: string[]
    category: string
  }
}

export interface PodcastSegment {
  id: string
  type: 'intro' | 'discussion' | 'interview' | 'break' | 'outro' | 'sponsor' | 'news'
  speaker: string
  content: string
  duration?: number
  audioUrl?: string
  mood?: string
  backgroundMusic?: string
}

export interface PodcastScriptRequest {
  topic: string
  format?: 'interview' | 'discussion' | 'solo' | 'roundtable' | 'narrative'
  duration?: number
  targetAudience?: string
  tone?: 'informal' | 'formal' | 'educational' | 'entertaining'
  includeSegments?: boolean
  hostPersonality?: string
  keywords?: string[]
}

export interface PodcastScriptResponse {
  script: PodcastEpisode
  outline: Array<{
    section: string
    duration: number
    keyPoints: string[]
  }>
  suggestions: {
    titleVariants: string[]
    descriptionSuggestions: string[]
    segmentImprovements: string[]
  }
  estimatedDuration: number
  wordCount: number
}

export interface AudioGenerationOptions {
  voiceId?: string
  speed?: number
  pitch?: number
  volume?: number
  emotion?: 'neutral' | 'happy' | 'sad' | 'excited' | 'serious' | 'friendly'
  pauseBetweenSegments?: number
}

const PODCAST_TEMPLATES = {
  interview: {
    structure: ['intro', 'guest-introduction', 'main-discussion', 'q-and-a', 'outro'],
    defaultDuration: 45,
    description: '深度访谈节目，适合专家对话',
  },
  discussion: {
    structure: ['intro', 'topic-overview', 'debate', 'conclusion', 'outro'],
    defaultDuration: 30,
    description: '圆桌讨论，多角度分析话题',
  },
  solo: {
    structure: ['intro', 'main-content', 'examples', 'summary', 'call-to-action', 'outro'],
    defaultDuration: 20,
    description: '单人讲解，知识分享类节目',
  },
  roundtable: {
    structure: ['intro', 'panel-introduction', 'topic-1', 'topic-2', 'topic-3', 'synthesis', 'outro'],
    defaultDuration: 60,
    description: '多人圆桌，全面探讨复杂议题',
  },
  narrative: {
    structure: ['teaser', 'intro', 'story-act-1', 'story-act-2', 'climax', 'resolution', 'outro'],
    defaultDuration: 40,
    description: '叙事性播客，故事驱动型内容',
  },
}

const VOICE_PROFILES: Record<string, { name: string; characteristics: string; suitableFor: string[] }> = {
  'zh-male-professional': {
    name: '专业男声',
    characteristics: '沉稳、权威、清晰',
    suitableFor: ['interview', 'solo', 'news'],
  },
  'zh-female-warm': {
    name: '温暖女声',
    characteristics: '亲切、柔和、自然',
    suitableFor: ['discussion', 'narrative', 'interview'],
  },
  'zh-male-energetic': {
    name: '活力男声',
    characteristics: '充满活力、节奏感强',
    suitableFor: ['roundtable', 'entertainment'],
  },
  'en-male-broadcaster': {
    name: '英文播音腔',
    characteristics: '标准美式发音、专业',
    suitableFor: ['news', 'solo', 'interview'],
  },
  'en-female-conversational': {
    name: '英文对话风',
    characteristics: '轻松、自然、友好',
    suitableFor: ['discussion', 'interview', 'narrative'],
  },
}

export class PodcastGenerator {
  private config: PodcastConfig
  private episodes: Map<string, PodcastEpisode> = new Map()

  constructor(config: PodcastConfig = {}) {
    this.config = {
      language: 'zh-CN',
      voiceStyle: 'professional',
      outputFormat: 'mp3',
      sampleRate: 44100,
      bitrate: 192,
      enableBackgroundMusic: true,
      enableSoundEffects: false,
      ...config,
    }
  }

  async generateScript(request: PodcastScriptRequest): Promise<PodcastScriptResponse> {
    const episodeId = this.generateEpisodeId()
    const template = PODCAST_TEMPLATES[request.format || 'discussion']

    const script = this.buildScriptStructure(request, template, episodeId)
    const outline = this.createOutline(script, request)
    const suggestions = this.generateSuggestions(script, request)

    this.episodes.set(episodeId, script)

    return {
      script,
      outline,
      suggestions,
      estimatedDuration: this.estimateTotalDuration(script.segments),
      wordCount: this.countWords(script),
    }
  }

  private buildScriptStructure(request: PodcastScriptRequest, template: typeof PODCAST_TEMPLATES.interview, episodeId: string): PodcastEpisode {
    const segments: PodcastSegment[] = []
    let currentSpeaker = '主持人'

    for (let i = 0; i < template.structure.length; i++) {
      const sectionType = template.structure[i] as PodcastSegment['type']
      const segment = this.generateSegment(sectionType, request, i, currentSpeaker)
      segments.push(segment)

      if (sectionType === 'discussion' || sectionType === 'interview') {
        currentSpeaker = currentSpeaker === '主持人' ? '嘉宾' : '主持人'
      }
    }

    return {
      id: episodeId,
      title: this.generateTitle(request.topic, request.format),
      description: this.generateDescription(request),
      hostName: request.hostPersonality || 'YYC³ AI 播客助手',
      segments,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        tags: [...(request.keywords || []), request.topic],
        category: this.categorizeTopic(request.topic),
      },
    }
  }

  private generateSegment(
    type: PodcastSegment['type'],
    request: PodcastScriptRequest,
    index: number,
    speaker: string
  ): PodcastSegment {
    const segmentContent = this.getSegmentContent(type, request)

    return {
      id: `seg-${index}`,
      type,
      speaker,
      content: segmentContent.content,
      duration: segmentContent.duration,
      mood: segmentContent.mood,
      backgroundMusic: this.selectBackgroundMusic(type),
    }
  }

  private getSegmentContent(type: PodcastSegment['type'], request: PodcastScriptRequest): { content: string; duration: number; mood: string } {
    switch (type) {
      case 'intro':
        return {
          content: `欢迎收听本期节目！今天我们要聊的话题是"${request.topic}"。这是一个非常${this.getTopicAdjective(request.topic)}的话题，我相信大家一定会感兴趣。`,
          duration: 60,
          mood: 'welcoming',
        }

      case 'discussion':
        return {
          content: `关于"${request.topic}"，我认为有几个关键点值得关注。首先，这个话题在当前环境下显得尤为重要。其次，从实践角度来看，我们需要考虑多个维度的影响。`,
          duration: 180,
          mood: 'thoughtful',
        }

      case 'interview':
        return {
          content: `非常感谢您来到我们的节目。关于"${request.topic}"这个问题，您能分享一下您的看法吗？特别是对于那些正在关注这个领域的听众，您有什么建议？`,
          duration: 120,
          mood: 'curious',
        }

      case 'break':
        return {
          content: '稍事休息，马上回来。',
          duration: 15,
          mood: 'neutral',
        }

      case 'outro':
        return {
          content: `好了，今天的节目就到这里。希望我们对"${request.topic}"的讨论对您有所帮助。如果您有任何想法或问题，欢迎在评论区留言。我们下期再见！`,
          duration: 45,
          mood: 'warm',
        }

      case 'sponsor':
        return {
          content: '本节目由 YYC³ Family AI 赞助播出。智能、高效、安全的一站式AI解决方案。',
          duration: 20,
          mood: 'professional',
        }

      case 'news':
        return {
          content: `接下来是关于"${request.topic}"的最新动态。近期在这个领域有一些重要的发展值得大家关注。`,
          duration: 90,
          mood: 'informative',
        }

      default:
        return {
          content: `${request.topic}相关的深入讨论...`,
          duration: 120,
          mood: 'neutral',
        }
    }
  }

  async generateAudio(episodeId: string, options: AudioGenerationOptions = {}): Promise<{
    audioBuffer: ArrayBuffer
    format: string
    duration: number
    fileSize: number
  }> {
    const episode = this.episodes.get(episodeId)

    if (!episode) {
      throw new Error(`Episode not found: ${episodeId}`)
    }

    const audioSegments: ArrayBuffer[] = []

    for (const segment of episode.segments) {
      const segmentAudio = await this.synthesizeSpeech(segment.content, options)
      audioSegments.push(segmentAudio)

      if (options.pauseBetweenSegments && options.pauseBetweenSegments > 0) {
        const silence = this.generateSilence(options.pauseBetweenSegments * 1000)
        audioSegments.push(silence)
      }
    }

    const combinedAudio = this.combineAudioSegments(audioSegments)

    if (this.config.enableBackgroundMusic) {
      return this.addBackgroundMusic(combinedAudio)
    }

    return {
      audioBuffer: combinedAudio,
      format: this.config.outputFormat || 'mp3',
      duration: this.estimateTotalDuration(episode.segments),
      fileSize: combinedAudio.byteLength,
    }
  }

  private async synthesizeSpeech(text: string, options: AudioGenerationOptions): Promise<ArrayBuffer> {
    const voiceSettings = {
      language: this.config.language,
      style: this.config.voiceStyle,
      speed: options.speed || 1.0,
      pitch: options.pitch || 1.0,
      volume: options.volume || 1.0,
      emotion: options.emotion || 'neutral',
    }

    const textWithSSML = this.addSSMLMarkers(text, options.emotion)

    return new ArrayBuffer(textWithSSML.length * 2)
  }

  private addSSMLMarkers(text: string, emotion?: string): string {
    const prosodyMap: Record<string, string> = {
      happy: '<prosody rate="10%" pitch="+10%">',
      sad: '<prosody rate="-10%" pitch="-10%">',
      excited: '<prosody rate="20%" pitch="+20%">',
      serious: '<prosody rate="-5%" pitch="-5%">',
      friendly: '<prosody rate="5%" pitch="+5%">',
      neutral: '',
    }

    const openTag = emotion ? prosodyMap[emotion] || '' : ''
    const closeTag = emotion ? '</prosody>' : ''

    return `<speak>${openTag}${text}${closeTag}</speak>`
  }

  private generateSilence(durationMs: number): ArrayBuffer {
    const sampleRate = this.config.sampleRate || 44100
    const numSamples = Math.floor((durationMs / 1000) * sampleRate)
    return new ArrayBuffer(numSamples * 2)
  }

  private combineAudioSegments(segments: ArrayBuffer[]): ArrayBuffer {
    const totalLength = segments.reduce((sum, seg) => sum + seg.byteLength, 0)
    const combined = new Uint8Array(totalLength)
    let offset = 0

    for (const segment of segments) {
      combined.set(new Uint8Array(segment), offset)
      offset += segment.byteLength
    }

    return combined.buffer as ArrayBuffer
  }

  private addBackgroundMusic(audioBuffer: ArrayBuffer): Promise<{
    audioBuffer: ArrayBuffer
    format: string
    duration: number
    fileSize: number
  }> {
    return Promise.resolve({
      audioBuffer,
      format: this.config.outputFormat || 'mp3',
      duration: 0,
      fileSize: audioBuffer.byteLength,
    })
  }

  private selectBackgroundMusic(segmentType: PodcastSegment['type']): string {
    const musicMap: Record<PodcastSegment['type'], string> = {
      intro: 'upbeat-intro',
      discussion: 'ambient-thinking',
      interview: 'calm-conversation',
      break: 'light-interlude',
      outro: 'warm-outro',
      sponsor: 'professional-corporate',
      news: 'serious-news',
    }

    return musicMap[segmentType] || 'ambient-generic'
  }

  getEpisode(episodeId: string): PodcastEpisode | undefined {
    return this.episodes.get(episodeId)
  }

  listEpisodes(): PodcastEpisode[] {
    return Array.from(this.episodes.values())
  }

  updateSegment(episodeId: string, segmentId: string, updates: Partial<PodcastSegment>): PodcastEpisode | null {
    const episode = this.episodes.get(episodeId)
    if (!episode) return null

    const segmentIndex = episode.segments.findIndex(s => s.id === segmentId)
    if (segmentIndex === -1) return null

    episode.segments[segmentIndex] = { ...episode.segments[segmentIndex], ...updates }
    episode.metadata.updatedAt = new Date().toISOString()

    return episode
  }

  exportScript(episodeId: string, format: 'txt' | 'json' | 'srt' | 'markdown'): string {
    const episode = this.episodes.get(episodeId)
    if (!episode) throw new Error(`Episode not found: ${episodeId}`)

    switch (format) {
      case 'txt':
        return this.exportAsTxt(episode)
      case 'json':
        return JSON.stringify(episode, null, 2)
      case 'srt':
        return this.exportAsSRT(episode)
      case 'markdown':
        return this.exportAsMarkdown(episode)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private exportAsTxt(episode: PodcastEpisode): string {
    const lines: string[] = [
      `#${episode.title}`,
      '',
      episode.description,
      '',
      '=' .repeat(50),
      '',
    ]

    let currentTime = 0

    for (const segment of episode.segments) {
      lines.push(`[${this.formatTime(currentTime)}] ${segment.speaker}:`)
      lines.push(segment.content)
      lines.push('')
      currentTime += segment.duration || 0
    }

    return lines.join('\n')
  }

  private exportAsSRT(episode: PodcastEpisode): string {
    const entries: string[] = []
    let index = 1
    let currentTime = 0

    for (const segment of episode.segments) {
      const startTime = this.formatSRTTime(currentTime)
      const endTime = this.formatSRTTime(currentTime + (segment.duration || 0))

      entries.push(`${index}`)
      entries.push(`${startTime} --> ${endTime}`)
      entries.push(`[${segment.speaker}]`)
      entries.push(segment.content.replace(/\n/g, ' '))
      entries.push('')

      index++
      currentTime += segment.duration || 0
    }

    return entries.join('\n')
  }

  private exportAsMarkdown(episode: PodcastEpisode): string {
    const lines: string[] = [
      `# ${episode.title}`,
      '',
      `**主持人**: ${episode.hostName || '未指定'}`,
      `**描述**: ${episode.description}`,
      `**时长**: ${this.formatTime(this.estimateTotalDuration(episode.segments))}`,
      '',
      '## 播客大纲',
      '',
    ]

    for (const segment of episode.segments) {
      lines.push(`### ${segment.type.toUpperCase()}`)
      lines.push(`**发言者**: ${segment.speaker}`)
      lines.push('')
      lines.push(segment.content)
      lines.push('')
    }

    return lines.join('\n')
  }

  private createOutline(script: PodcastEpisode, _request: PodcastScriptRequest): PodcastScriptResponse['outline'] {
    return script.segments.map(segment => ({
      section: `${segment.type} - ${segment.speaker}`,
      duration: segment.duration || 0,
      keyPoints: this.extractKeyPoints(segment.content),
    }))
  }

  private extractKeyPoints(content: string): string[] {
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 10)
    return sentences.slice(0, 3).map(s => s.trim())
  }

  private generateSuggestions(_script: PodcastEpisode, _request: PodcastScriptRequest): PodcastScriptResponse['suggestions'] {
    return {
      titleVariants: [
        '深度解析：从技术到应用',
        '专家视角：未来发展趋势',
        '实战分享：最佳实践指南',
      ],
      descriptionSuggestions: [
        '本期节目将深入探讨...',
        '我们邀请了行业专家...',
        '通过真实案例为您解读...',
      ],
      segmentImprovements: [
        '建议增加更多互动环节',
        '可以在讨论部分加入听众提问',
        '结尾处可以加入行动号召',
      ],
    }
  }

  private generateTitle(topic: string, format?: string): string {
    const prefixes: Record<string, string> = {
      interview: '深度访谈：',
      discussion: '圆桌讨论：',
      solo: '知识分享：',
      roundtable: '多人论坛：',
      narrative: '故事时间：',
    }

    const prefix = format ? (prefixes[format] || '') : ''
    return `${prefix}${topic}`
  }

  private generateDescription(request: PodcastScriptRequest): string {
    const templates = [
      `本期节目围绕"${request.topic}"展开${request.format === 'interview' ? '深度访谈' : '讨论'}，邀请多位嘉宾分享见解与实践经验。`,
      `探索"${request.topic}"的方方面面，从理论到实践，为您提供全面的视角和深入的思考。`,
    ]

    return templates[Math.floor(Math.random() * templates.length)]
  }

  private categorizeTopic(topic: string): string {
    const categories: Record<string, string[]> = {
      technology: ['AI', '人工智能', '编程', '开发', '技术', '软件', '数据', '算法'],
      business: ['商业', '创业', '投资', '市场', '营销', '管理', '战略'],
      education: ['教育', '学习', '培训', '课程', '知识', '技能'],
      lifestyle: ['生活', '健康', '旅行', '美食', '文化', '艺术'],
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => topic.includes(keyword))) {
        return category
      }
    }

    return 'general'
  }

  private getTopicAdjective(topic: string): string {
    const adjectives = ['重要', '有趣', '热门', '前沿', '实用', '深刻', '引人深思']
    return adjectives[Math.floor(Math.random() * adjectives.length)]
  }

  private estimateTotalDuration(segments: PodcastSegment[]): number {
    return segments.reduce((total, seg) => total + (seg.duration || 0), 0)
  }

  private countWords(script: PodcastEpisode): number {
    return script.segments.reduce((total, seg) => total + seg.content.length, 0)
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  private generateEpisodeId(): string {
    return `podcast-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }

  getStatus(): {
    name: string
    version: string
    totalEpisodes: number
    supportedFormats: string[]
    supportedLanguages: string[]
    capabilities: string[]
  } {
    return {
      name: 'yyc3-podcast-generator',
      version: '2.0.0',
      totalEpisodes: this.episodes.size,
      supportedFormats: ['mp3', 'wav', 'ogg'],
      supportedLanguages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
      capabilities: [
        'Multi-format Script Generation',
        'TTS Audio Synthesis',
        'SSML Emotion Control',
        'Background Music Integration',
        'Multi-export Formats (TXT/JSON/SRT/Markdown)',
        'Voice Profile Selection',
        'Segment-level Editing',
        'Duration Estimation',
      ],
    }
  }
}
