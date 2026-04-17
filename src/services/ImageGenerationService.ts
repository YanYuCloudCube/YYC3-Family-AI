export interface ImageGenConfig {
  apiKey?: string
  model?: string
  defaultSize?: ImageSize
  defaultQuality?: 'standard' | 'hd'
  cacheEnabled?: boolean
}

export type ImageSize =
  | '256x256' | '512x512' | '768x768'
  | '1024x1024' | '1024x768' | '768x1024'
  | '1280x720' | '720x1280' | '1344x768'
  | '768x1344' | '1536x1024' | '1024x1536'

export type ImageStyle =
  | 'photorealistic' | 'digital-art' | 'oil-painting'
  | 'watercolor' | 'sketch' | 'anime' | '3d-render'
  | 'pixel-art' | 'minimalist' | 'vintage' | 'cyberpunk'
  | 'fantasy' | 'abstract' | 'pop-art' | 'comic'

export interface ImageGenerateRequest {
  prompt: string
  model?: string
  negativePrompt?: string
  size?: ImageSize
  style?: ImageStyle
  quality?: 'standard' | 'hd'
  seed?: number
  steps?: number
  guidanceScale?: number
  count?: number
  referenceImage?: string
  strength?: number
}

export interface GeneratedImage {
  id: string
  url: string
  b64Json?: string
  revisedPrompt?: string
  width: number
  height: number
  seed: number
  model: string
  style: string
  prompt: string
  generationTimeMs: number
  createdAt: string
}

export interface BatchGenerateResult {
  images: GeneratedImage[]
  totalCount: number
  successCount: number
  failureCount: number
  totalDurationMs: number
}

export interface ImageEditRequest {
  image: string
  prompt: string
  mask?: string
  size?: ImageSize
  seed?: number
  strength?: number
}

export interface ImageVariationRequest {
  image: string
  count?: number
  size?: ImageSize
  seed?: number
  style?: ImageStyle
}

const SIZE_MAP: Record<ImageSize, { width: number; height: number }> = {
  '256x256': { width: 256, height: 256 },
  '512x512': { width: 512, height: 512 },
  '768x768': { width: 768, height: 768 },
  '1024x1024': { width: 1024, height: 1024 },
  '1024x768': { width: 1024, height: 768 },
  '768x1024': { width: 768, height: 1024 },
  '1280x720': { width: 1280, height: 720 },
  '720x1280': { width: 720, height: 1280 },
  '1344x768': { width: 1344, height: 768 },
  '768x1344': { width: 768, height: 1344 },
  '1536x1024': { width: 1536, height: 1024 },
  '1024x1536': { width: 1024, height: 1536 },
}

const STYLE_PROMPTS: Record<ImageStyle, string> = {
  photorealistic: 'photorealistic, highly detailed, professional photography, natural lighting',
  'digital-art': 'digital art, vibrant colors, clean lines, modern illustration',
  'oil-painting': 'oil painting, classical art style, rich texture, brush strokes visible',
  watercolor: 'watercolor painting, soft edges, flowing colors, artistic',
  sketch: 'pencil sketch, hand-drawn, line art, detailed shading',
  anime: 'anime style, Japanese animation aesthetic, vibrant, expressive',
  '3d-render': '3D render, CGI, realistic lighting, high detail, octane render',
  'pixel-art': 'pixel art, retro game style, 8-bit or 16-bit aesthetic',
  minimalist: 'minimalist design, clean, simple shapes, limited color palette',
  vintage: 'vintage style, aged paper, sepia tones, nostalgic feel',
  cyberpunk: 'cyberpunk aesthetic, neon lights, futuristic, dark atmosphere',
  fantasy: 'fantasy art, magical, ethereal lighting, epic composition',
  abstract: 'abstract art, geometric patterns, bold colors, non-representational',
  'pop-art': 'pop art style, bold outlines, bright colors, Warhol inspired',
  comic: 'comic book style, halftone dots, dynamic action, bold lines',
}

export class ImageGenerationService {
  private config: ImageGenConfig

  constructor(config: ImageGenConfig = {}) {
    this.config = {
      model: 'cogview-4',
      defaultSize: '1024x1024',
      defaultQuality: 'standard',
      cacheEnabled: true,
      ...config,
    }
  }

  async generate(request: ImageGenerateRequest): Promise<GeneratedImage> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return this.getMockImage(request)
    }

    const startTime = Date.now()

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || this.config.model || 'cogview-4',
          prompt: this.buildPrompt(request.prompt, request.style),
          size: request.size || this.config.defaultSize || '1024x1024',
          quality: request.quality || this.config.defaultQuality || 'standard',
          n: 1,
          ...(request.seed !== undefined ? { seed: request.seed } : {}),
          ...(request.negativePrompt ? { negative_prompt: request.negativePrompt } : {}),
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        throw new Error(`CogView API 错误 (${response.status}): ${errorBody}`)
      }

      const data: any = await response.json()
      const imageData = data.data?.[0]

      if (!imageData?.url && !imageData?.b64_json) {
        throw new Error('图像生成结果为空')
      }

      const dims = SIZE_MAP[request.size || this.config.defaultSize || '1024x1024']

      return {
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        url: imageData.url || '',
        b64Json: imageData.b64_json,
        revisedPrompt: imageData.revised_prompt,
        width: dims.width,
        height: dims.height,
        seed: request.seed ?? Math.floor(Math.random() * 2147483647),
        model: request.model || this.config.model || 'cogview-4',
        style: request.style || 'default',
        prompt: request.prompt,
        generationTimeMs: Date.now() - startTime,
        createdAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('[ImageGen] Generation failed:', error)
      return this.getMockImage(request)
    }
  }

  async generateBatch(requests: ImageGenerateRequest[]): Promise<BatchGenerateResult> {
    const startTime = Date.now()
    const results: GeneratedImage[] = []

    for (let i = 0; i < requests.length; i++) {
      try {
        const image = await this.generate(requests[i])
        results.push(image)

        if (i < requests.length - 1) {
          await this.delay(500)
        }
      } catch (error) {
        console.error(`[ImageGen] Batch item ${i} failed:`, error)
      }
    }

    return {
      images: results,
      totalCount: requests.length,
      successCount: results.length,
      failureCount: requests.length - results.length,
      totalDurationMs: Date.now() - startTime,
    }
  }

  async edit(request: ImageEditRequest): Promise<GeneratedImage> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return this.getMockEditImage(request)
    }

    const startTime = Date.now()

    try {
      const body: Record<string, any> = {
        model: this.config.model || 'cogview-4-edit',
        image: request.image,
        prompt: request.prompt,
        size: request.size || this.config.defaultSize || '1024x1024',
        n: 1,
      }

      if (request.mask) body.mask = request.mask
      if (request.seed !== undefined) body.seed = request.seed
      if (request.strength !== undefined) body.strength = Math.max(0, Math.min(1, request.strength))

      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/images/edits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`图像编辑 API 错误 (${response.status})`)
      }

      const data: any = await response.json()
      const imageData = data.data?.[0]
      const dims = SIZE_MAP[request.size || this.config.defaultSize || '1024x1024']

      return {
        id: `edit_${Date.now()}`,
        url: imageData?.url || '',
        b64Json: imageData?.b64_json,
        width: dims.width,
        height: dims.height,
        seed: request.seed ?? Math.floor(Math.random() * 2147483647),
        model: this.config.model || 'cogview-4-edit',
        style: 'edit',
        prompt: request.prompt,
        generationTimeMs: Date.now() - startTime,
        createdAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('[ImageGen] Edit failed:', error)
      return this.getMockEditImage(request)
    }
  }

  async createVariation(request: ImageVariationRequest): Promise<GeneratedImage[]> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return [this.getMockVariationImage(request)]
    }

    const count = Math.min(request.count || 1, 4)
    const results: GeneratedImage[] = []

    for (let i = 0; i < count; i++) {
      try {
        const startTime = Date.now()
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/images/variations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model || 'cogview-4',
            image: request.image,
            size: request.size || this.config.defaultSize || '1024x1024',
            n: 1,
            ...(request.seed !== undefined ? { seed: request.seed + i } : {}),
          }),
        })

        const data: any = await response.json()
        const imageData = data.data?.[0]
        const dims = SIZE_MAP[request.size || this.config.defaultSize || '1024x1024']

        results.push({
          id: `var_${Date.now()}_${i}`,
          url: imageData?.url || '',
          b64Json: imageData?.b64_json,
          width: dims.width,
          height: dims.height,
          seed: (request.seed ?? Math.floor(Math.random() * 2147483647)) + i,
          model: this.config.model || 'cogview-4',
          style: request.style || 'variation',
          prompt: '',
          generationTimeMs: Date.now() - startTime,
          createdAt: new Date().toISOString(),
        })
      } catch {
        // Ignore image generation errors
      }

      if (i < count - 1) await this.delay(300)
    }

    return results
  }

  enhancePrompt(prompt: string, style?: ImageStyle): string {
    let enhanced = prompt.trim()

    if (style && STYLE_PROMPTS[style]) {
      enhanced += `, ${STYLE_PROMPTS[style]}`
    }

    const qualityKeywords = [
      'high quality', 'detailed', 'sharp focus', 'professional',
      'masterpiece', 'best quality', 'ultra-detailed',
    ]

    enhanced += ', ' + qualityKeywords.join(', ')

    return enhanced
  }

  getAvailableSizes(): Array<{ value: ImageSize; label: string; aspectRatio: string }> {
    return Object.entries(SIZE_MAP).map(([size, dims]) => ({
      value: size as ImageSize,
      label: `${dims.width}×${dims.height}`,
      aspectRatio: this.simplifyRatio(dims.width, dims.height),
    }))
  }

  getAvailableStyles(): Array<{ value: ImageStyle; label: string; description: string }> {
    return Object.entries(STYLE_PROMPTS).map(([style, desc]) => ({
      value: style as ImageStyle,
      label: style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: desc.split(', ').slice(0, 3).join(', '),
    }))
  }

  private buildPrompt(prompt: string, style?: ImageStyle): string {
    if (style && STYLE_PROMPTS[style]) {
      return `${prompt}, ${STYLE_PROMPTS[style]}`
    }
    return prompt
  }

  private getMockImage(request: ImageGenerateRequest): GeneratedImage {
    const dims = SIZE_MAP[request.size || this.config.defaultSize || '1024x1024']
    const mockB64 = this.generatePlaceholderBase64(dims.width, dims.height)

    return {
      id: `mock_img_${Date.now()}`,
      url: '',
      b64Json: mockB64,
      revisedPrompt: request.prompt,
      width: dims.width,
      height: dims.height,
      seed: request.seed ?? Math.floor(Math.random() * 2147483647),
      model: 'cogview-4-mock',
      style: request.style || 'default',
      prompt: request.prompt,
      generationTimeMs: 150,
      createdAt: new Date().toISOString(),
    }
  }

  private getMockEditImage(_request: ImageEditRequest): GeneratedImage {
    return {
      id: `mock_edit_${Date.now()}`,
      url: '',
      b64Json: this.generatePlaceholderBase64(1024, 1024),
      width: 1024,
      height: 1024,
      seed: Math.floor(Math.random() * 2147483647),
      model: 'cogview-4-edit-mock',
      style: 'edit',
      prompt: 'mock edit result',
      generationTimeMs: 200,
      createdAt: new Date().toISOString(),
    }
  }

  private getMockVariationImage(_request: ImageVariationRequest): GeneratedImage {
    return {
      id: `mock_var_${Date.now()}`,
      url: '',
      b64Json: this.generatePlaceholderBase64(1024, 1024),
      width: 1024,
      height: 1024,
      seed: Math.floor(Math.random() * 2147483647),
      model: 'cogview-4-mock',
      style: 'variation',
      prompt: '',
      generationTimeMs: 180,
      createdAt: new Date().toISOString(),
    }
  }

  private generatePlaceholderBase64(width: number, height: number): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#1a1a2e"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#e94560" font-family="Arial" font-size="24">
        CogView-4 Mock ${width}×${height}
      </text>
      <text x="50%" y="60%" text-anchor="middle" fill="#888" font-family="Arial" font-size="14">
        Configure ZHIPU_API_KEY for real generation
      </text>
    </svg>`

    return Buffer.from(svg).toString('base64')
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
