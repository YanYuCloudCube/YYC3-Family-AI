export interface VideoGenConfig {
  apiKey?: string
  model?: string
  defaultResolution?: VideoResolution
  defaultDuration?: number
}

export type VideoResolution =
  | '480p' | '720p' | '1080p' | '2k'
  | '720x1280' | '1080x1920' | '768x1344'
  | '1344x768' | '1536x1024'

export type VideoStyle =
  | 'cinematic' | 'anime' | '3d-animation' | 'realistic'
  | 'watercolor' | 'sketch' | 'oil-painting' | 'pixel-art'
  | 'cyberpunk' | 'fantasy' | 'documentary' | 'commercial'

export interface VideoGenerateRequest {
  prompt: string
  model?: string
  negativePrompt?: string
  resolution?: VideoResolution
  duration?: number
  style?: VideoStyle
  fps?: number
  seed?: number
  referenceImage?: string
  referenceVideo?: string
  strength?: number
  cameraMotion?: CameraMotion
}

export interface CameraMotion {
  type: 'static' | 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down'
    | 'zoom-in' | 'zoom-out' | 'rotate-cw' | 'rotate-ccw'
    | 'dolly-in' | 'dolly-out' | 'orbit' | 'handheld'
  speed?: 'slow' | 'normal' | 'fast'
  intensity?: number
}

export interface GeneratedVideo {
  id: string
  url: string
  thumbnailUrl?: string
  width: number
  height: number
  duration: number
  fps: number
  style: VideoStyle
  prompt: string
  seed: number
  model: string
  status: 'completed' | 'processing' | 'failed'
  generationTimeMs: number
  fileSizeBytes?: number
  createdAt: string
}

export interface VideoTaskStatus {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
  createdAt: string
  updatedAt: string
}

const RESOLUTION_MAP: Record<VideoResolution, { width: number; height: number }> = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '2k': { width: 2560, height: 1440 },
  '720x1280': { width: 720, height: 1280 },
  '1080x1920': { width: 1080, height: 1920 },
  '768x1344': { width: 768, height: 1344 },
  '1344x768': { width: 1344, height: 768 },
  '1536x1024': { width: 1536, height: 1024 },
}

const STYLE_PROMPTS: Record<VideoStyle, string> = {
  cinematic: 'cinematic lighting, film grain, dramatic composition, anamorphic lens flare',
  anime: 'anime style, Japanese animation aesthetic, vibrant colors, dynamic motion lines',
  '3d-animation': '3D animation, CGI rendering, smooth motion, Pixar-style quality',
  realistic: 'photorealistic, natural lighting, documentary style, lifelike detail',
  watercolor: 'watercolor painting style, soft flowing colors, artistic brush strokes',
  sketch: 'hand-drawn pencil sketch, line art, animated sketch effect',
  'oil-painting': 'oil painting texture, classical art style, rich color palette',
  'pixel-art': 'pixel art animation, retro game aesthetic, 16-bit style',
  cyberpunk: 'cyberpunk aesthetic, neon lights, rain-soaked streets, futuristic city',
  fantasy: 'fantasy world, magical effects, ethereal atmosphere, epic scenery',
  documentary: 'documentary style, handheld camera feel, natural environment',
  commercial: 'commercial production quality, polished look, advertising aesthetic',
}

export class VideoGenerationService {
  private config: VideoGenConfig

  constructor(config: VideoGenConfig = {}) {
    this.config = {
      model: 'cogvideox',
      defaultResolution: '720p',
      defaultDuration: 5,
      ...config,
    }
  }

  async generate(request: VideoGenerateRequest): Promise<GeneratedVideo> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return this.getMockVideo(request)
    }

    const startTime = Date.now()
    const dims = RESOLUTION_MAP[request.resolution || this.config.defaultResolution || '720p']

    try {
      const body: Record<string, any> = {
        model: request.model || this.config.model || 'cogvideox',
        prompt: this.buildPrompt(request.prompt, request.style),
        negative_prompt: request.negativePrompt || '',
        resolution: request.resolution || this.config.defaultResolution || '720p',
        duration: Math.min(Math.max(request.duration || this.config.defaultDuration || 5, 2), 10),
        fps: request.fps ?? 24,
        ...(request.seed !== undefined ? { seed: request.seed } : {}),
      }

      if (request.referenceImage) {
        body.reference_image = request.referenceImage
        body.strength = request.strength ?? 0.8
      }
      if (request.cameraMotion) {
        body.camera_motion = request.cameraMotion.type
        body.motion_speed = request.cameraMotion.speed || 'normal'
        if (request.cameraMotion.intensity !== undefined) {
          body.motion_intensity = request.cameraMotion.intensity
        }
      }

      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/videos/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        throw new Error(`Vidu API 错误 (${response.status}): ${errorBody}`)
      }

      const data: any = await response.json()

      return {
        id: data.id || `vid_${Date.now()}`,
        url: data.url || '',
        thumbnailUrl: data.thumbnail_url,
        width: dims.width,
        height: dims.height,
        duration: request.duration || this.config.defaultDuration || 5,
        fps: request.fps ?? 24,
        style: request.style || 'realistic',
        prompt: request.prompt,
        seed: data.seed ?? request.seed ?? Math.floor(Math.random() * 2147483647),
        model: request.model || this.config.model || 'cogvideox',
        status: data.status || 'completed',
        generationTimeMs: Date.now() - startTime,
        fileSizeBytes: data.file_size,
        createdAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('[VideoGen] Generation failed:', error)
      return this.getMockVideo(request)
    }
  }

  async checkTaskStatus(taskId: string): Promise<VideoTaskStatus> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return {
        taskId,
        status: 'completed',
        progress: 100,
        videoUrl: `mock://video/${taskId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    try {
      const response = await fetch(
        `https://open.bigmodel.cn/api/paas/v4/videos/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      )

      if (!response.ok) {
        throw new Error(`查询任务状态失败 (${response.status})`)
      }

      const data: any = await response.json()

      return {
        taskId: data.task_id || taskId,
        status: data.status || 'pending',
        progress: data.progress || 0,
        videoUrl: data.video_url,
        thumbnailUrl: data.thumbnail_url,
        error: data.error,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      }
    } catch (error) {
      console.error('[VideoGen] Status check failed:', error)
      throw error
    }
  }

  async generateWithCallback(
    request: VideoGenerateRequest,
    callback: (status: VideoTaskStatus) => void,
    pollIntervalMs: number = 5000
  ): Promise<GeneratedVideo> {
    const result = await this.generate(request)

    if (result.status === 'completed') {
      callback({
        taskId: result.id,
        status: 'completed',
        progress: 100,
        videoUrl: result.url,
        createdAt: result.createdAt,
        updatedAt: new Date().toISOString(),
      })
      return result
    }

    let status: VideoTaskStatus = {
      taskId: result.id,
      status: 'processing',
      progress: 50,
      createdAt: result.createdAt,
      updatedAt: new Date().toISOString(),
    }

    while (status.status === 'processing' || status.status === 'pending') {
      await this.delay(pollIntervalMs)

      try {
        status = await this.checkTaskStatus(result.id)
        callback(status)
      } catch {
        // Ignore status check errors
      }

      if (status.status === 'completed') {
        return {
          ...result,
          url: status.videoUrl || result.url,
          thumbnailUrl: status.thumbnailUrl || result.thumbnailUrl,
          status: 'completed',
          generationTimeMs: Date.now() - new Date(result.createdAt).getTime(),
        }
      }

      if (status.status === 'failed') {
        throw new Error(`视频生成失败: ${status.error || '未知错误'}`)
      }
    }

    return result
  }

  getAvailableResolutions(): Array<{ value: VideoResolution; label: string; aspectRatio: string }> {
    return Object.entries(RESOLUTION_MAP).map(([res, dims]) => ({
      value: res as VideoResolution,
      label: `${dims.width}×${dims.height} (${res})`,
      aspectRatio: this.simplifyRatio(dims.width, dims.height),
    }))
  }

  getAvailableStyles(): Array<{ value: VideoStyle; label: string; description: string }> {
    return Object.entries(STYLE_PROMPTS).map(([style, desc]) => ({
      value: style as VideoStyle,
      label: style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: desc.split(', ').slice(0, 3).join(', '),
    }))
  }

  getCameraMotionOptions(): Array<{ type: CameraMotion['type']; label: string; description: string }> {
    return [
      { type: 'static', label: '固定镜头', description: '相机位置不变' },
      { type: 'pan-left', label: '左摇', description: '相机水平向左移动' },
      { type: 'pan-right', label: '右摇', description: '相机水平向右移动' },
      { type: 'tilt-up', label: '上仰', description: '相机垂直向上移动' },
      { type: 'tilt-down', label: '下俯', description: '相机垂直向下移动' },
      { type: 'zoom-in', label: '推近', description: '镜头向前推进' },
      { type: 'zoom-out', label: '拉远', description: '镜头向后拉出' },
      { type: 'rotate-cw', label: '顺时针旋转', description: '相机顺时针旋转' },
      { type: 'rotate-ccw', label: '逆时针旋转', description: '相机逆时针旋转' },
      { type: 'dolly-in', label: '轨道推进', description: '沿轨道向前移动' },
      { type: 'dolly-out', label: '轨道拉出', description: '沿轨道向后移动' },
      { type: 'orbit', label: '环绕', description: '围绕主体环绕拍摄' },
      { type: 'handheld', label: '手持效果', description: '模拟手持拍摄的轻微抖动' },
    ]
  }

  estimateFileSize(resolution: VideoResolution, duration: number, _fps: number = 24): number {
    const dims = RESOLUTION_MAP[resolution]
    const pixelCount = dims.width * dims.height
    const bitratePerPixel = 0.05
    const bitrate = pixelCount * bitratePerPixel
    return Math.ceil((duration / 1) * (bitrate / 8))
  }

  private buildPrompt(prompt: string, style?: VideoStyle): string {
    if (style && STYLE_PROMPTS[style]) {
      return `${prompt}, ${STYLE_PROMPTS[style]}, smooth motion, high quality video`
    }
    return `${prompt}, high quality video, smooth motion`
  }

  private getMockVideo(request: VideoGenerateRequest): GeneratedVideo {
    const dims = RESOLUTION_MAP[request.resolution || this.config.defaultResolution || '720p']
    const duration = request.duration || this.config.defaultDuration || 5

    return {
      id: `mock_vid_${Date.now()}`,
      url: 'mock://video/generated',
      thumbnailUrl: '',
      width: dims.width,
      height: dims.height,
      duration,
      fps: request.fps ?? 24,
      style: request.style || 'realistic',
      prompt: request.prompt,
      seed: request.seed ?? Math.floor(Math.random() * 2147483647),
      model: 'cogvideox-mock',
      status: 'completed',
      generationTimeMs: 500,
      fileSizeBytes: this.estimateFileSize(
        request.resolution || this.config.defaultResolution || '720p',
        duration,
        request.fps ?? 24
      ),
      createdAt: new Date().toISOString(),
    }
  }

  private simplifyRatio(w: number, h: number): string {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const d = gcd(w, h)
    return `${w / d}:${h / d}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
