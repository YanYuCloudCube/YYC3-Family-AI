export interface NewsConfig {
  apiKey?: string
  model?: string
  language?: 'zh' | 'en'
  maxArticlesPerTopic?: number
  topics?: NewsTopic[]
}

export interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  source: string
  url?: string
  publishedAt: string
  category: NewsCategory
  tags: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  importance: number
  imageUrl?: string
}

export type NewsCategory =
  | 'technology'
  | 'business'
  | 'science'
  | 'health'
  | 'politics'
  | 'sports'
  | 'entertainment'
  | 'world'
  | 'finance'
  | 'ai'
  | 'general'

export interface NewsTopic {
  id: string
  name: string
  keywords: string[]
  category: NewsCategory
  priority: number
}

export interface NewsDigest {
  id: string
  date: string
  title: string
  edition: string
  sections: DigestSection[]
  summary: string
  keyTakeaways: string[]
  trendingTopics: TrendingTopic[]
  metadata: {
    generatedAt: string
    articleCount: number
    sourcesCount: number
    language: string
  }
}

export interface DigestSection {
  title: string
  icon: string
  articles: NewsArticle[]
  sectionSummary: string
}

export interface TrendingTopic {
  name: string
  mentionCount: number
  growthRate: number
  relatedArticles: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
}

export interface NewsSearchOptions {
  query?: string
  category?: NewsCategory
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d'
  limit?: number
  sortBy?: 'relevance' | 'date' | 'importance'
  sentiment?: 'positive' | 'negative' | 'neutral'
}

const DEFAULT_TOPICS: NewsTopic[] = [
  { id: 'ai', name: '人工智能', keywords: ['AI', 'GPT', 'LLM', '机器学习', '深度学习'], category: 'ai', priority: 10 },
  { id: 'tech', name: '科技', keywords: ['科技', '互联网', '芯片', '5G', '云计算'], category: 'technology', priority: 9 },
  { id: 'finance', name: '财经', keywords: ['股市', '经济', '金融', '投资', '比特币'], category: 'finance', priority: 8 },
  { id: 'biz', name: '商业', keywords: ['商业', '创业', '公司', '企业', '市场'], category: 'business', priority: 7 },
  { id: 'science', name: '科学', keywords: ['科学', '研究', '发现', '太空', '生物'], category: 'science', priority: 7 },
  { id: 'health', name: '健康', keywords: ['健康', '医疗', '疫苗', '药物', '疾病'], category: 'health', priority: 6 },
  { id: 'world', name: '国际', keywords: ['国际', '全球', '外交', '战争', '政治'], category: 'world', priority: 8 },
]

export class NewsGenerator {
  private config: NewsConfig

  constructor(config: NewsConfig = {}) {
    this.config = {
      model: 'glm-4-flash',
      language: 'zh',
      maxArticlesPerTopic: 5,
      topics: DEFAULT_TOPICS,
      ...config,
    }
  }

  async generateDigest(options?: {
    customTitle?: string
    focusTopics?: string[]
    includeAnalysis?: boolean
  }): Promise<NewsDigest> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]

    let articles: NewsArticle[] = []

    if (apiKey) {
      articles = await this.fetchRealNews(options?.focusTopics)
    } else {
      articles = await this.generateMockNews(options?.focusTopics)
    }

    const categorized = this.categorizeArticles(articles)
    const sections = this.buildSections(categorized)
    const trending = this.detectTrendingTopics(articles)
    const takeaways = this.extractKeyTakeaways(articles)
    const summary = await this.generateDigestSummary(articles, options?.includeAnalysis)

    return {
      id: `digest_${Date.now()}`,
      date: dateStr,
      title: options?.customTitle || `YYC³ AI 早报 ${this.formatDate(now)}`,
      edition: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`,
      sections,
      summary,
      keyTakeaways: takeaways,
      trendingTopics: trending,
      metadata: {
        generatedAt: new Date().toISOString(),
        articleCount: articles.length,
        sourcesCount: new Set(articles.map(a => a.source)).size,
        language: this.config.language || 'zh',
      },
    }
  }

  async searchNews(options: NewsSearchOptions): Promise<NewsArticle[]> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey && !options.query) {
      const mockArticles = await this.generateMockNews()
      return mockArticles.slice(0, options.limit ?? 10)
    }

    if (apiKey) {
      try {
        const searchQuery = options.query || this.buildDefaultSearchQuery(options.category)

        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model || 'glm-4-flash',
            messages: [
              {
                role: 'system',
                content: `You are a news research assistant. Generate realistic-sounding recent news articles based on current events knowledge.`,
              },
              {
                role: 'user',
                content: `Generate ${options.limit || 10} news article summaries about: ${searchQuery}\n\nOutput format (STRICT JSON array):\n[\n  {\n    "title": "...",\n    "summary": "2-3 sentence summary",\n    "source": "news source name",\n    "category": "${options.category || 'general'}",\n    "tags": ["tag1", "tag2"],\n    "sentiment": "positive|negative|neutral",\n    "importance": 8\n  }\n]`,
              },
            ],
            temperature: 0.8,
            max_tokens: 4096,
          }),
        })

        const data: any = await response.json()
        const content = data.choices?.[0]?.message?.content

        if (content) {
          const jsonMatch = content.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const parsed: any[] = JSON.parse(jsonMatch[0])
            return parsed.map((a, i) => ({
              id: `news_${Date.now()}_${i}`,
              title: a.title || '',
              summary: a.summary || '',
              content: a.summary || '',
              source: a.source || 'YYC³ News',
              category: a.category || 'general',
              tags: a.tags || [],
              sentiment: a.sentiment || 'neutral',
              importance: Math.min(10, Math.max(1, a.importance || 5)),
              publishedAt: new Date().toISOString(),
            }))
          }
        }
      } catch (error) {
        console.error('[News] Search failed:', error)
      }
    }

    const fallbackArticles = await this.generateMockNews(options.query ? [options.query] : undefined)
    return fallbackArticles.slice(0, options.limit ?? 10)
  }

  async analyzeTrend(topic: string, days: number = 7): Promise<{
    topic: string
    timeline: Array<{ date: string; mentions: number; sentiment: string }>
    summary: string
    prediction: string
  }> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return {
        topic,
        timeline: this.generateMockTimeline(days),
        summary: `[Mock] ${topic} 相关话题趋势分析`,
        prediction: '预计该话题将持续受到关注',
      }
    }

    const prompt = `Analyze the news trend for topic: ${topic} over the past ${days} days.

Provide:
1. Daily mention trend
2. Overall summary
3. Future prediction (3-5 sentences)

Output format (STRICT JSON):
{
  "timeline": [{"date": "2024-01-01", "mentions": 100, "sentiment": "positive"}],
  "summary": "trend summary",
  "prediction": "future outlook"
}`

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'glm-4-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 2048,
        }),
      })

      const data: any = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }
    } catch (error) {
      console.error('[News] Trend analysis failed:', error)
    }

    return {
      topic,
      timeline: this.generateMockTimeline(days),
      summary: `${topic} 趋势分析完成`,
      prediction: '数据不足以做出准确预测',
    }
  }

  getAvailableTopics(): NewsTopic[] {
    return this.config.topics || DEFAULT_TOPICS
  }

  private async fetchRealNews(focusTopics?: string[]): Promise<NewsArticle[]> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY
    if (!apiKey) return []

    const topicsToFetch = focusTopics?.length
      ? (this.config.topics || DEFAULT_TOPICS).filter(t =>
          focusTopics.some(ft => t.name.includes(ft) || t.keywords.some(k => k.includes(ft)))
        )
      : (this.config.topics || DEFAULT_TOPICS).slice(0, 5)

    const allArticles: NewsArticle[] = []

    for (const topic of topicsToFetch) {
      try {
        const articles = await this.fetchTopicNews(topic)
        allArticles.push(...articles)
      } catch {
        // Ignore news fetch errors
      }
    }

    return allArticles.sort((a, b) => b.importance - a.importance).slice(0, 50)
  }

  private async fetchTopicNews(topic: NewsTopic): Promise<NewsArticle[]> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY
    if (!apiKey) return []

    const prompt = `Generate ${this.config.maxArticlesPerTopic || 5} recent news headlines and brief summaries for topic: ${topic.name}
Keywords: ${topic.keywords.join(', ')}

Output format (STRICT JSON array):
[
  {
    "title": "catchy headline",
    "summary": "2-3 sentence summary",
    "source": "realistic news source",
    "tags": ["relevant tag"],
    "sentiment": "positive|negative|neutral",
    "importance": 1-10
  }
]

Rules:
- Titles should be realistic and newsworthy.
- Cover different aspects of the topic.
- Include a mix of breaking news and in-depth stories.`

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'glm-4-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 3000,
      }),
    })

    const data: any = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) return []

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed: any[] = JSON.parse(jsonMatch[0])

    return parsed.map((a, i) => ({
      id: `${topic.id}_${Date.now()}_${i}`,
      title: a.title || '',
      summary: a.summary || '',
      content: a.summary || '',
      source: a.source || 'YYC³ News',
      url: undefined,
      publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      category: topic.category,
      tags: a.tags || [],
      sentiment: (['positive', 'negative', 'neutral'] as const).includes(a.sentiment) ? a.sentiment : 'neutral',
      importance: Math.min(10, Math.max(1, a.importance || 5)),
    }))
  }

  private async generateMockNews(keywords?: string[]): Promise<NewsArticle[]> {
    const mockData: Record<string, Array<{ title: string; summary: string; source: string }>> = {
      ai: [
        { title: '新一代大语言模型发布，性能提升显著', summary: '多家科技公司发布最新AI模型，在推理能力和多模态理解方面取得重大突破。', source: 'AI科技日报' },
        { title: 'AI Agent 应用场景持续扩展', summary: '智能代理技术在客服、编程、数据分析等领域加速落地，企业采用率大幅提升。', source: '智能产业周刊' },
        { title: '开源模型生态蓬勃发展', summary: '多个开源大模型项目获得社区热烈响应，推动AI技术民主化进程。', source: '开发者头条' },
      ],
      tech: [
        { title: '量子计算研究取得新进展', summary: '科研团队在量子纠错领域实现突破，为实用化量子计算机奠定基础。', source: '科学前沿' },
        { title: '芯片制程技术竞争白热化', summary: '全球半导体厂商竞相投入先进制程研发，2nm以下工艺成为新战场。', source: '电子工程杂志' },
      ],
      finance: [
        { title: '全球股市震荡，投资者保持谨慎', summary: '受多重因素影响，主要股指出现波动，分析师建议关注基本面良好的优质标的。', source: '财经早报' },
        { title: '数字货币监管框架逐步完善', summary: '多国央行推进数字货币试点，监管政策趋于明朗。', source: '金融时报' },
      ],
      biz: [
        { title: '科技巨头财报超预期', summary: '多家头部科技公司季度业绩亮眼，云服务和AI业务成为增长引擎。', source: '商业观察' },
        { title: '初创企业融资环境回暖', summary: '风险投资活跃度提升，AI和清洁技术领域最受青睐。', source: '创投日报' },
      ],
    }

    const defaultArticles = [
      { title: '今日要闻速览', summary: '多条重要新闻值得关注，涵盖科技、财经、社会等多个领域。', source: '综合新闻' },
      { title: '行业动态更新', summary: '各行业最新发展情况汇总，把握市场脉搏。', source: '行业快讯' },
    ]

    let selectedArticles: Array<{ title: string; summary: string; source: string }> = []

    if (keywords && keywords.length > 0) {
      for (const kw of keywords) {
        for (const [key, articles] of Object.entries(mockData)) {
          if (
            key.includes(kw) ||
            articles.some(a => a.title.includes(kw) || a.summary.includes(kw))
          ) {
            selectedArticles.push(...articles)
          }
        }
      }
    } else {
      selectedArticles = Object.values(mockData).flat()
    }

    if (selectedArticles.length === 0) {
      selectedArticles = defaultArticles
    }

    return selectedArticles.slice(0, 15).map((a, i) => ({
      id: `mock_${Date.now()}_${i}`,
      title: a.title,
      summary: a.summary,
      content: a.summary,
      source: a.source,
      publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      category: 'general' as NewsCategory,
      tags: [],
      sentiment: 'neutral' as const,
      importance: Math.floor(Math.random() * 5) + 5,
    }))
  }

  private categorizeArticles(articles: NewsArticle[]): Map<NewsCategory, NewsArticle[]> {
    const categorized = new Map<NewsCategory, NewsArticle[]>()

    for (const article of articles) {
      const existing = categorized.get(article.category) || []
      existing.push(article)
      categorized.set(article.category, existing)
    }

    return categorized
  }

  private buildSections(categorized: Map<NewsCategory, NewsArticle[]>): DigestSection[] {
    const sectionIcons: Record<string, string> = {
      technology: '💻',
      business: '📊',
      science: '🔬',
      health: '🏥',
      politics: '🏛️',
      sports: '⚽',
      entertainment: '🎬',
      world: '🌍',
      finance: '💰',
      ai: '🤖',
      general: '📰',
    }

    const sections: DigestSection[] = []

    for (const [category, catArticles] of categorized.entries()) {
      const sorted = [...catArticles].sort((a, b) => b.importance - a.importance)

      sections.push({
        title: this.getCategoryName(category),
        icon: sectionIcons[category] || '📌',
        articles: sorted.slice(0, this.config.maxArticlesPerTopic || 5),
        sectionSummary: sorted.length > 0
          ? `本版块包含 ${sorted.length} 条相关资讯，重点聚焦${sorted[0]?.title.split('，')[0]}等热点`
          : '暂无相关内容',
      })
    }

    return sections.sort((a, b) => b.articles.length - a.articles.length)
  }

  private getCategoryName(category: NewsCategory): string {
    const names: Record<NewsCategory, string> = {
      technology: '科技前沿',
      business: '商业动态',
      science: '科学发现',
      health: '健康医疗',
      politics: '时政要闻',
      sports: '体育赛事',
      entertainment: '娱乐文化',
      world: '国际新闻',
      finance: '财经行情',
      ai: 'AI 智能圈',
      general: '综合要闻',
    }

    return names[category] || category
  }

  private detectTrendingTopics(articles: NewsArticle[]): TrendingTopic[] {
    const topicMentions = new Map<string, { count: number; articles: string[]; sentiments: string[] }>()

    for (const article of articles) {
      for (const tag of article.tags) {
        const existing = topicMentions.get(tag) || { count: 0, articles: [], sentiments: [] }
        existing.count++
        existing.articles.push(article.id)
        existing.sentiments.push(article.sentiment)
        topicMentions.set(tag, existing)
      }
    }

    return Array.from(topicMentions.entries())
      .map(([name, data]) => ({
        name,
        mentionCount: data.count,
        growthRate: Math.random() * 100,
        relatedArticles: data.articles.slice(0, 5),
        sentiment: this.dominantSentiment(data.sentiments) as 'positive' | 'negative' | 'neutral',
      }))
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, 10)
  }

  private dominantSentiment(sentiments: string[]): string {
    const counts = { positive: 0, negative: 0, neutral: 0 }
    for (const s of sentiments) {
      if (s in counts) counts[s as keyof typeof counts]++
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]
  }

  private extractKeyTakeaways(articles: NewsArticle[]): string[] {
    const topArticles = [...articles]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)

    return topArticles.map(a => `• ${a.title}`)
  }

  private async generateDigestSummary(articles: NewsArticle[], _includeAnalysis?: boolean): Promise<string> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return [
        `本期早报共收录 ${articles.length} 条重要资讯`,
        `涵盖 ${new Set(articles.map(a => a.category)).size} 个主要板块`,
        '建议重点关注 AI、科技、财经等领域动态',
      ].join('\n')
    }

    const topHeadlines = articles
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)
      .map(a => `- [${a.importance}/10] ${a.title}`)
      .join('\n')

    const prompt = `Generate a concise morning news digest summary based on these headlines:\n\n${topHeadlines}\n\nWrite 3-4 paragraphs covering key highlights. Language: ${this.config.language || 'zh'}`

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'glm-4-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 1024,
        }),
      })

      const data: any = await response.json()
      return data.choices?.[0]?.message?.content || ''
    } catch {
      return '摘要生成中遇到问题，请稍后重试。'
    }
  }

  private buildDefaultSearchQuery(category?: NewsCategory): string {
    const queries: Record<NewsCategory, string> = {
      technology: '最新科技新闻 技术创新',
      business: '商业动态 企业新闻',
      science: '科学研究 新发现',
      health: '医疗健康 新药',
      politics: '时政要闻 政策',
      sports: '体育赛事 比赛结果',
      entertainment: '娱乐 影视 音乐',
      world: '国际新闻 全球动态',
      finance: '股市行情 经济数据',
      ai: '人工智能 大模型 最新进展',
      general: '今日新闻 热点',
    }

    return category ? queries[category] : '今日重要新闻'
  }

  private formatDate(date: Date): string {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${month}月${day}日 ${weekdays[date.getDay()]}`
  }

  private generateMockTimeline(days: number): Array<{ date: string; mentions: number; sentiment: string }> {
    const timeline: Array<{ date: string; mentions: number; sentiment: string }> = []
    const baseMentions = 50 + Math.random() * 100

    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000)
      timeline.push({
        date: date.toISOString().split('T')[0],
        mentions: Math.floor(baseMentions + Math.random() * 50 - 25),
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
      })
    }

    return timeline
  }
}
