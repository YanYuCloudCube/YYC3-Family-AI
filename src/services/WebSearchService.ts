import { BraveSearchServer } from '../mcp/servers/BraveSearchServer'
import { MCPClientManager } from '../mcp/client/MCPClientManager'
import type { SearchResult, EnhancedSearchResult, SearchOptions } from '../mcp/servers/BraveSearchServer'

export interface WebSearchConfig {
  braveApiKey?: string
  defaultCount?: number
  enableCache?: boolean
  cacheTTL?: number
}

export interface MindMapNode {
  id: string
  label: string
  children?: MindMapNode[]
  metadata?: {
    url?: string
    relevance?: number
    source?: string
  }
}

export class WebSearchService {
  private braveSearch: BraveSearchServer
  private config: Required<WebSearchConfig>
  private cache: Map<string, { data: SearchResult[]; timestamp: number }> = new Map()

  constructor(config: WebSearchConfig = {}) {
    this.config = {
      braveApiKey: config.braveApiKey || '',
      defaultCount: config.defaultCount || 10,
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL || 5 * 60 * 1000, // 5 minutes
    }

    const clientManager = new MCPClientManager()
    this.braveSearch = new BraveSearchServer(clientManager)
  }

  async initialize(): Promise<void> {
    await this.braveSearch.getStatus()
  }

  async search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    const cacheKey = `search:${query}:${JSON.stringify(options)}`

    if (this.config.enableCache) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
        return cached.data
      }
    }

    const results = await this.braveSearch.search(query, {
      count: options?.count ?? this.config.defaultCount,
      offset: options?.offset,
      freshness: options?.freshness,
    })

    if (this.config.enableCache) {
      this.cache.set(cacheKey, { data: results, timestamp: Date.now() })
    }

    return results
  }

  async searchWithIntent(
    query: string
  ): Promise<EnhancedSearchResult[]> {
    return this.braveSearch.searchWithIntent(query)
  }

  async deepResearch(
    topic: string,
    depth = 2,
    breadth = 5
  ): Promise<{
    results: SearchResult[]
    mindMap: MindMapNode
    summary: string
  }> {
    const initialResults = await this.search(topic, { count: breadth })

    let allResults: SearchResult[] = [...initialResults]
    const subTopics: string[] = []

    initialResults.slice(0, Math.min(3, breadth)).forEach(result => {
      subTopics.push(result.title)
    })

    if (depth > 1) {
      for (const subTopic of subTopics) {
        try {
          const subResults = await this.search(subTopic, { count: Math.floor(breadth / 2) })
          allResults = [...allResults, ...subResults]
        } catch (e) {
          console.error('[WebSearch] Deep research sub-topic error:', e)
        }
      }
    }

    const uniqueResults = this.deduplicateResults(allResults)

    const mindMap = this.generateMindMap(topic, uniqueResults)
    const summary = this.generateSummary(topic, uniqueResults)

    return {
      results: uniqueResults,
      mindMap,
      summary,
    }
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>()
    return results.filter(result => {
      const key = result.url.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  generateMindMap(
    rootTopic: string,
    results: SearchResult[]
  ): MindMapNode {
    const rootNode: MindMapNode = {
      id: 'root',
      label: rootTopic,
      children: [],
    }

    const categories = this.categorizeResults(results)

    for (const [category, items] of Object.entries(categories)) {
      const categoryNode: MindMapNode = {
        id: `cat-${category}`,
        label: category,
        children: items.map((item, idx) => ({
          id: `item-${idx}-${Date.now()}`,
          label: item.title,
          metadata: {
            url: item.url,
            source: this.extractDomain(item.url),
            relevance: item.rank ? 1 / item.rank : 1,
          },
        })),
      }

      rootNode.children!.push(categoryNode)
    }

    return rootNode
  }

  private categorizeResults(
    results: SearchResult[]
  ): Record<string, SearchResult[]> {
    const categories: Record<string, SearchResult[]> = {}

    for (const result of results) {
      const domain = this.extractDomain(result.url)
      const category = this.inferCategory(result, domain)

      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(result)
    }

    return categories
  }

  private inferCategory(result: SearchResult, domain: string): string {
    const titleLower = result.title.toLowerCase()
    const descLower = result.description.toLowerCase()

    if (
      titleLower.includes('github') ||
      domain === 'github.com' ||
      titleLower.includes('npm') ||
      titleLower.includes('package')
    ) {
      return '开发工具'
    }
    if (
      titleLower.includes('文档') ||
      titleLower.includes('tutorial') ||
      titleLower.includes('guide')
    ) {
      return '技术文档'
    }
    if (
      titleLower.includes('news') ||
      titleLower.includes('新闻') ||
      domain.includes('news')
    ) {
      return '新闻资讯'
    }
    if (
      titleLower.includes('stackoverflow') ||
      titleLower.includes('问答') ||
      domain.includes('stack')
    ) {
      return '社区讨论'
    }

    return '相关资源'
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  private generateSummary(
    topic: string,
    results: SearchResult[]
  ): string {
    const topResults = results.slice(0, 5)
    const summaryLines = [
      `# ${topic} - 搜索摘要`,
      '',
      `共找到 ${results.length} 条相关结果`,
      '',
      '## 主要发现',
      '',
      ...topResults.map(
        (r, i) => `${i + 1}. **${r.title}**\n   ${r.description}\n   🔗 ${r.url}`
      ),
      '',
      '---',
      '*由 YYC³ WebSearchService 自动生成*',
    ]

    return summaryLines.join('\n')
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export type { SearchResult, EnhancedSearchResult, SearchOptions }
