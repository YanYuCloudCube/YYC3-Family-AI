import type { MCPTool, MCPServerConfig } from '../types'
import { MCPClientManager } from '../client/MCPClientManager'

export interface SearchOptions {
  count?: number
  offset?: number
  freshness?: 'pd' | 'pw' | 'pm' | 'py' | 'pd-1w' | 'pw-1m' | 'pm-1y'
}

export interface SearchResult {
  title: string
  url: string
  description: string
  date?: string
  favicon_url?: string
  rank?: number
}

export interface EnhancedSearchResult extends SearchResult {
  intent_type?: string
  confidence?: number
  related_queries?: string[]
}

interface ZhipuSearchResponse {
  request_id: string
  code: number
  msg: string
  results: Array<{
    title: string
    url: string
    description: string
    date?: string
    favicon_url?: string
    rank?: number
  }>
  related_queries?: string[]
}

export class BraveSearchServer {
  private clientManager: MCPClientManager
  private zhipuApiKey: string
  readonly name = 'brave-search'

  constructor(clientManager: MCPClientManager) {
    this.clientManager = clientManager
    this.zhipuApiKey = process.env.ZHIPU_API_KEY || ''

    const config: MCPServerConfig = {
      name: this.name,
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-brave-search',
      ],
      env: {},
      enabled: true,
      priority: 1,
    }

    if (process.env.BRAVE_API_KEY) {
      config.env!.BRAVE_API_KEY = process.env.BRAVE_API_KEY
    }

    this.clientManager.registerServer(config)
  }

  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    if (this.zhipuApiKey) {
      return this.searchViaZhipu(query, options)
    }

    return this.searchViaMCP(query, options)
  }

  private async searchViaZhipu(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const freshnessMap: Record<string, string> = {
        pd: 'oneDay',
        pw: 'oneWeek',
        pm: 'oneMonth',
        py: 'oneYear',
      }

      const body = {
        search_query: query.slice(0, 70),
        search_engine: 'search_pro',
        count: options.count ?? 10,
        offset: options.offset ?? 0,
        search_recency_filter: options.freshness
          ? freshnessMap[options.freshness] || 'noLimit'
          : undefined,
      }

      const response = await fetch(
        'https://open.bigmodel.cn/api/paas/v4/web_search',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.zhipuApiKey}`,
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        throw new Error(`Zhipu API error: ${response.status} ${response.statusText}`)
      }

      const data: ZhipuSearchResponse = await response.json()

      if (data.code !== 0) {
        throw new Error(`Zhipu search failed: ${data.msg}`)
      }

      return data.results.map((r, idx) => ({
        ...r,
        rank: r.rank ?? idx + 1,
      }))
    } catch (error) {
      console.error('[BraveSearch] Zhipu API error:', error)

      return this.searchViaMCP(query, options)
    }
  }

  private async searchViaMCP(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const status = this.getStatus()
      const isConnected = Array.isArray(status)
        ? status.length > 0 && status[0].connected
        : (status as any)?.connected

      if (!isConnected) {
        return this.getMockResults(query, options.count ?? 10)
      }

      const result = await this.clientManager.callTool(
        this.name,
        'brave_web_search',
        {
          query,
          count: options.count ?? 10,
          offset: options.offset ?? 0,
          freshness: options.freshness,
        }
      )

      const textContent = result.content[0]?.text || '{}'
      return JSON.parse(textContent).results || []
    } catch (error) {
      console.error('[BraveSearch] MCP fallback error:', error)
      return this.getMockResults(query, options.count ?? 10)
    }
  }

  async searchWithIntent(
    query: string,
    recognizeIntent = true
  ): Promise<EnhancedSearchResult[]> {
    const results = await this.search(query, { count: 10 })

    return results.map((item) => ({
      ...item,
      intent_type: recognizeIntent ? this.inferIntent(item.title) : undefined,
      confidence: recognizeIntent ? this.calculateConfidence(item) : undefined,
      related_queries: this.generateRelatedQueries(item.title),
    }))
  }

  async getLocalResults(
    query: string,
    count = 5
  ): Promise<EnhancedSearchResult[]> {
    if (this.zhipuApiKey) {
      try {
        const response = await fetch(
          'https://open.bigmodel.cn/api/paas/v4/web_search',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.zhipuApiKey}`,
            },
            body: JSON.stringify({
              search_query: query.slice(0, 70),
              search_engine: 'search_pro',
              count,
              search_domain_filter: '',
            }),
          }
        )

        if (!response.ok) throw new Error('Local search failed')

        const data: ZhipuSearchResponse = await response.json()
        return data.results.map((r, idx) => ({ ...r, rank: idx + 1 }))
      } catch (error) {
        console.error('[BraveSearch] Local search error:', error)
      }
    }

    try {
      const result = await this.clientManager.callTool(
        this.name,
        'brave_local_search',
        { query, count }
      )
      const textContent = result.content[0]?.text || '{}'
      return JSON.parse(textContent).results || []
    } catch (error) {
      console.error('[BraveSearch] Local search MCP error:', error)
      return []
    }
  }

  async getAvailableTools(): Promise<MCPTool[]> {
    return this.clientManager.listTools(this.name)
  }

  getStatus() {
    return this.clientManager.getStatus(this.name)
  }

  isZhipuAvailable(): boolean {
    return !!this.zhipuApiKey && this.zhipuApiKey.length > 0
  }

  getProviderInfo(): { name: string; available: boolean }[] {
    const providers: { name: string; available: boolean }[] = []

    providers.push({
      name: 'ZhipuAI Web Search Pro',
      available: this.isZhipuAvailable(),
    })

    const status = this.getStatus() as any
    providers.push({
      name: 'Brave Search MCP',
      available: status?.connected === true,
    })

    return providers
  }

  private inferIntent(title: string): string {
    const lower = title.toLowerCase()
    if (lower.includes('how to') || lower.includes('教程') || lower.includes('guide')) return 'instructional'
    if (lower.includes('what is') || lower.includes('什么是') || lower.includes('定义')) return 'informational'
    if (lower.includes('best') || lower.includes('top') || lower.includes('最好')) return 'comparative'
    if (lower.includes('buy') || lower.includes('price') || lower.includes('价格') || lower.includes('购买')) return 'transactional'
    return 'navigational'
  }

  private calculateConfidence(result: SearchResult): number {
    let score = 0.5

    if (result.description.length > 100) score += 0.15
    if (result.url.startsWith('https://')) score += 0.1
    if (result.favicon_url) score += 0.05
    if (result.rank && result.rank <= 3) score += 0.2

    return Math.min(score, 1.0)
  }

  private generateRelatedQueries(title: string): string[] {
    const words = title.split(/\s+/).slice(0, 3)
    const prefixes = ['how to', 'best', 'tutorial', 'vs', 'alternative']
    return prefixes
      .slice(0, 3)
      .map(p => `${p} ${words.join(' ')}`)
      .filter(q => q !== title.toLowerCase())
  }

  private getMockResults(query: string, count: number): SearchResult[] {
    return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
      title: `${query} - 搜索结果 ${i + 1}`,
      url: `https://example.com/result/${i + 1}`,
      description: `关于 "${query}" 的搜索结果示例。这是模拟数据，请配置 BRAVE_API_KEY 或 ZHIPU_API_KEY 以获取真实结果。`,
      rank: i + 1,
    }))
  }
}
