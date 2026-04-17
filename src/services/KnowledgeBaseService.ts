export interface KnowledgeBaseConfig {
  name: string
  description?: string
  embeddingModel?: 'embedding-2' | 'embedding-3'
  chunkSize?: number
  chunkOverlap?: number
  similarityThreshold?: number
  maxResults?: number
  enableHybridSearch?: boolean
  enableReranking?: boolean
  rerankerModel?: 'bge-reranker' | 'cross-encoder'
}

export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  metadata: {
    source: string
    author?: string
    category?: string
    tags?: string[]
    createdAt?: string
    updatedAt?: string
    language?: string
    version?: number
  }
  chunks: DocumentChunk[]
  embedding?: number[]
  vectorId?: string
  status: 'pending' | 'indexing' | 'indexed' | 'failed' | 'archived'
  indexedAt?: string
}

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  index: number
  startPosition: number
  endPosition: number
  embedding?: number[]
  metadata: {
    tokenCount: number
    charCount: number
    heading?: string
    sectionType?: 'title' | 'heading' | 'paragraph' | 'code' | 'list' | 'table' | 'quote'
  }
}

export interface SearchResult {
  documentId: string
  chunkId: string
  content: string
  score: number
  relevanceScore: number
  highlights: Array<{
    text: string
    score: number
    positions: Array<{ start: number; end: number }>
  }>
  metadata: KnowledgeDocument['metadata']
  rankingSignals: {
    vectorSimilarity: number
    keywordMatch: number
    recencyBoost: number
    popularityScore: number
    finalScore: number
  }
}

export interface SearchQuery {
  query: string
  filters?: {
    category?: string
    tags?: string[]
    author?: string
    dateRange?: { from: string; to: string }
    language?: string
  }
  options?: {
    limit?: number
    offset?: number
    minScore?: number
    hybridWeight?: { vector: number; keyword: number }
    rerank?: boolean
    highlight?: boolean
    includeMetadata?: boolean
  }
}

export interface KnowledgeStats {
  totalDocuments: number
  totalChunks: number
  totalTokens: number
  categories: Record<string, number>
  documentsByStatus: Record<KnowledgeDocument['status'], number>
  averageChunkSize: number
  indexHealth: 'excellent' | 'good' | 'fair' | 'poor'
  lastIndexedAt?: string
  searchQueriesTotal: number
  averageQueryTime: number
}

const DEFAULT_CONFIG: Required<Omit<KnowledgeBaseConfig, 'name' | 'description'>> = {
  embeddingModel: 'embedding-3',
  chunkSize: 512,
  chunkOverlap: 50,
  similarityThreshold: 0.7,
  maxResults: 10,
  enableHybridSearch: true,
  enableReranking: true,
  rerankerModel: 'bge-reranker',
}

export class KnowledgeBaseService {
  private config: Required<KnowledgeBaseConfig> & { name: string; description: string }
  private documents: Map<string, KnowledgeDocument> = new Map()
  private chunks: Map<string, DocumentChunk> = new Map()
  private vectorIndex: Map<string, number[]> = new Map()
  private invertedIndex: Map<string, Set<string>> = new Map()
  private searchHistory: Array<{ query: string; timestamp: string; resultCount: number; durationMs: number }> = []
  private stats: KnowledgeStats

  constructor(config: KnowledgeBaseConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      name: config.name,
      description: config.description || '',
    }

    this.stats = this.initializeStats()
  }

  async addDocument(document: Omit<KnowledgeDocument, 'id' | 'chunks' | 'status'>): Promise<KnowledgeDocument> {
    const docId = this.generateDocumentId()

    const chunks = await this.chunkDocument(document.content, docId)

    const knowledgeDoc: KnowledgeDocument = {
      ...document,
      id: docId,
      chunks,
      status: 'pending',
    }

    this.documents.set(docId, knowledgeDoc)

    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk)
    }

    await this.indexDocument(docId)

    return knowledgeDoc
  }

  async addDocuments(documents: Array<Omit<KnowledgeDocument, 'id' | 'chunks' | 'status'>>): Promise<KnowledgeDocument[]> {
    const results: KnowledgeDocument[] = []

    for (const doc of documents) {
      const result = await this.addDocument(doc)
      results.push(result)
    }

    return results
  }

  async removeDocument(documentId: string): Promise<boolean> {
    const doc = this.documents.get(documentId)
    if (!doc) return false

    for (const chunk of doc.chunks) {
      this.chunks.delete(chunk.id)
      this.vectorIndex.delete(chunk.id)
    }

    this.documents.delete(documentId)
    this.updateStats()

    return true
  }

  async updateDocument(documentId: string, updates: Partial<Pick<KnowledgeDocument, 'title' | 'content' | 'metadata'>>): Promise<KnowledgeDocument | null> {
    const existing = this.documents.get(documentId)
    if (!existing) return null

    const updated: KnowledgeDocument = {
      ...existing,
      ...updates,
      metadata: { ...existing.metadata, ...updates.metadata },
      status: 'pending',
    }

    if (updates.content !== undefined) {
      updated.chunks = await this.chunkDocument(updates.content, documentId)
    }

    this.documents.set(documentId, updated)
    await this.indexDocument(documentId)

    return updated
  }

  getDocument(documentId: string): KnowledgeDocument | undefined {
    return this.documents.get(documentId)
  }

  listDocuments(filter?: { status?: KnowledgeDocument['status']; category?: string }): KnowledgeDocument[] {
    let docs = Array.from(this.documents.values())

    if (filter?.status) {
      docs = docs.filter(d => d.status === filter.status)
    }

    if (filter?.category) {
      docs = docs.filter(d => d.metadata.category === filter.category)
    }

    return docs.sort((a, b) =>
      new Date(b.metadata.updatedAt || b.metadata.createdAt || '').getTime() -
      new Date(a.metadata.updatedAt || a.metadata.createdAt || '').getTime()
    )
  }

  async search(searchQuery: SearchQuery): Promise<{
    results: SearchResult[]
    total: number
    queryTimeMs: number
    suggestions: string[]
    facets: Record<string, Array<{ value: string; count: number }>>
  }> {
    const startTime = Date.now()

    let results: SearchResult[] = []

    if (this.config.enableHybridSearch) {
      results = await this.hybridSearch(searchQuery)
    } else {
      results = await this.vectorSearch(searchQuery)
    }

    if (searchQuery.options?.rerank && this.config.enableReranking) {
      results = await this.rerankResults(results, searchQuery.query)
    }

    if (searchQuery.options?.highlight !== false) {
      results = this.addHighlights(results, searchQuery.query)
    }

    const filtered = this.applyFilters(results, searchQuery.filters)
    const paginated = this.applyPagination(filtered, searchQuery.options?.limit, searchQuery.options?.offset)

    const queryTimeMs = Date.now() - startTime
    const suggestions = this.generateSuggestions(searchQuery.query)
    const facets = this.generateFacets(filtered)

    this.searchHistory.push({
      query: searchQuery.query,
      timestamp: new Date().toISOString(),
      resultCount: filtered.length,
      durationMs: queryTimeMs,
    })

    this.stats.searchQueriesTotal++
    this.stats.averageQueryTime =
      (this.stats.averageQueryTime * (this.stats.searchQueriesTotal - 1) + queryTimeMs) /
      this.stats.searchQueriesTotal

    return {
      results: paginated,
      total: filtered.length,
      queryTimeMs,
      suggestions,
      facets,
    }
  }

  private async hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
    const [vectorResults, keywordResults] = await Promise.all([
      this.vectorSearch(query),
      this.keywordSearch(query),
    ])

    const vectorWeight = query.options?.hybridWeight?.vector ?? 0.7
    const keywordWeight = query.options?.hybridWeight?.keyword ?? 0.3

    const combinedMap = new Map<string, SearchResult>()

    for (const result of vectorResults) {
      const key = `${result.documentId}:${result.chunkId}`
      combinedMap.set(key, {
        ...result,
        rankingSignals: {
          ...result.rankingSignals,
          finalScore: result.rankingSignals.vectorSimilarity * vectorWeight,
        },
      })
    }

    for (const result of keywordResults) {
      const key = `${result.documentId}:${result.chunkId}`
      const existing = combinedMap.get(key)

      if (existing) {
        existing.rankingSignals.keywordMatch = result.rankingSignals.keywordMatch
        existing.rankingSignals.finalScore +=
          result.rankingSignals.keywordMatch * keywordWeight
      } else {
        combinedMap.set(key, {
          ...result,
          rankingSignals: {
            ...result.rankingSignals,
            finalScore: result.rankingSignals.keywordMatch * keywordWeight,
          },
        })
      }
    }

    return Array.from(combinedMap.values())
      .sort((a, b) => b.rankingSignals.finalScore - a.rankingSignals.finalScore)
      .slice(0, query.options?.limit || this.config.maxResults)
  }

  private async vectorSearch(query: SearchQuery): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query.query)
    const results: SearchResult[] = []

    for (const [chunkId, chunkEmbedding] of this.vectorIndex.entries()) {
      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding)

      if (similarity >= (query.options?.minScore || this.config.similarityThreshold)) {
        const chunk = this.chunks.get(chunkId)
        const doc = chunk ? this.documents.get(chunk.documentId) : undefined

        if (chunk && doc) {
          results.push({
            documentId: doc.id,
            chunkId: chunk.id,
            content: chunk.content,
            score: similarity,
            relevanceScore: similarity,
            highlights: [],
            metadata: doc.metadata,
            rankingSignals: {
              vectorSimilarity: similarity,
              keywordMatch: 0,
              recencyBoost: this.calculateRecencyBoost(doc.metadata.updatedAt || doc.metadata.createdAt || ''),
              popularityScore: 1,
              finalScore: similarity,
            },
          })
        }
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }

  private async keywordSearch(query: SearchQuery): Promise<SearchResult[]> {
    const tokens = this.tokenize(query.query.toLowerCase())
    const results: SearchResult[] = []
    const matchedChunks = new Set<string>()

    for (const token of tokens) {
      const chunkIds = this.invertedIndex.get(token)
      if (chunkIds) {
        chunkIds.forEach(id => matchedChunks.add(id))
      }
    }

    for (const chunkId of matchedChunks) {
      const chunk = this.chunks.get(chunkId)
      const doc = chunk ? this.documents.get(chunk.documentId) : undefined

      if (chunk && doc) {
        const matchScore = this.calculateKeywordScore(chunk.content, tokens)

        results.push({
          documentId: doc.id,
          chunkId: chunk.id,
          content: chunk.content,
          score: matchScore,
          relevanceScore: matchScore,
          highlights: [],
          metadata: doc.metadata,
          rankingSignals: {
            vectorSimilarity: 0,
            keywordMatch: matchScore,
            recencyBoost: this.calculateRecencyBoost(doc.metadata.updatedAt || doc.metadata.createdAt || ''),
            popularityScore: 1,
            finalScore: matchScore,
          },
        })
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }

  private async rerankResults(results: SearchResult[], _query: string): Promise<SearchResult[]> {
    return results.map((result, index) => ({
      ...result,
      relevanceScore: result.relevanceScore * (1 - index * 0.05),
      rankingSignals: {
        ...result.rankingSignals,
        finalScore: result.rankingSignals.finalScore * (1 - index * 0.03),
      },
    }))
  }

  private addHighlights(results: SearchResult[], query: string): SearchResult[] {
    const terms = this.tokenize(query.toLowerCase())

    return results.map(result => {
      const highlights: SearchResult['highlights'] = []

      const lowerContent = result.content.toLowerCase()

      for (const term of terms) {
        let startIndex = 0
        while ((startIndex = lowerContent.indexOf(term, startIndex)) !== -1) {
          const contextStart = Math.max(0, startIndex - 30)
          const contextEnd = Math.min(result.content.length, startIndex + term.length + 30)

          highlights.push({
            text: result.content.substring(contextStart, contextEnd),
            score: term.length / result.content.length,
            positions: [{ start: startIndex, end: startIndex + term.length }],
          })

          startIndex += term.length
        }
      }

      return { ...result, highlights }
    })
  }

  private applyFilters(results: SearchResult[], filters?: SearchQuery['filters']): SearchResult[] {
    if (!filters) return results

    return results.filter(result => {
      if (filters.category && result.metadata.category !== filters.category) return false
      if (filters.author && result.metadata.author !== filters.author) return false
      if (filters.language && result.metadata.language !== filters.language) return false
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag =>
          result.metadata.tags?.includes(tag)
        )
        if (!hasTag) return false
      }
      if (filters.dateRange) {
        const docDate = result.metadata.updatedAt || result.metadata.createdAt
        if (docDate) {
          const date = new Date(docDate)
          const from = new Date(filters.dateRange.from)
          const to = new Date(filters.dateRange.to)
          if (date < from || date > to) return false
        }
      }

      return true
    })
  }

  private applyPagination(results: SearchResult[], limit?: number, offset?: number): SearchResult[] {
    const start = offset || 0
    const end = limit ? start + limit : results.length
    return results.slice(start, end)
  }

  getStats(): KnowledgeStats {
    return { ...this.stats }
  }

  getSearchHistory(limit: number = 20): typeof this.searchHistory {
    return this.searchHistory.slice(-limit)
  }

  async rebuildIndex(): Promise<{ success: boolean; documentsProcessed: number; durationMs: number }> {
    const startTime = Date.now()
    let processed = 0

    for (const [docId, doc] of this.documents.entries()) {
      try {
        await this.indexDocument(docId)
        processed++
      } catch (error) {
        console.error(`Failed to index document ${docId}:`, error)
      }
    }

    this.updateStats()

    return {
      success: true,
      documentsProcessed: processed,
      durationMs: Date.now() - startTime,
    }
  }

  exportKnowledgeBase(): {
    version: string
    exportedAt: string
    config: Required<KnowledgeBaseConfig> & { name: string; description: string }
    documents: KnowledgeDocument[]
    stats: KnowledgeStats
  } {
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      config: this.config,
      documents: Array.from(this.documents.values()),
      stats: this.getStats(),
    }
  }

  private async chunkDocument(content: string, documentId: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = []
    const chunkSize = this.config.chunkSize
    const overlap = this.config.chunkOverlap

    const sentences = content.split(/(?<=[。！？.!?\n])/g)
    let currentChunk = ''
    let chunkIndex = 0
    let position = 0

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        const startPos = position - currentChunk.length
        chunks.push(this.createChunk(currentChunk.trim(), documentId, chunkIndex++, startPos))

        if (overlap > 0 && currentChunk.length > overlap) {
          currentChunk = currentChunk.slice(-overlap) + sentence
        } else {
          currentChunk = sentence
        }
      } else {
        currentChunk += sentence
      }

      position += sentence.length
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(this.createChunk(currentChunk.trim(), documentId, chunkIndex++, position - currentChunk.length))
    }

    return chunks
  }

  private createChunk(content: string, documentId: string, index: number, startPosition: number): DocumentChunk {
    return {
      id: `chunk-${documentId}-${index}`,
      documentId,
      content,
      index,
      startPosition,
      endPosition: startPosition + content.length,
      metadata: {
        tokenCount: Math.ceil(content.length / 4),
        charCount: content.length,
        sectionType: this.detectSectionType(content),
      },
    }
  }

  private detectSectionType(content: string): DocumentChunk['metadata']['sectionType'] {
    if (/^#{1,6}\s/m.test(content)) return 'heading'
    if (/^```[\s\S]*?```$/m.test(content)) return 'code'
    if (/^[-*+]\s|^(\d+\.)\s/m.test(content)) return 'list'
    if (/^>\s/m.test(content)) return 'quote'
    if (/^\|.*\|$/m.test(content)) return 'table'
    return 'paragraph'
  }

  private async indexDocument(documentId: string): Promise<void> {
    const doc = this.documents.get(documentId)
    if (!doc) return

    doc.status = 'indexing'

    for (const chunk of doc.chunks) {
      const embedding = await this.generateEmbedding(chunk.content)
      chunk.embedding = embedding

      this.vectorIndex.set(chunk.id, embedding)

      const tokens = this.tokenize(chunk.content.toLowerCase())
      for (const token of tokens) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Set())
        }
        this.invertedIndex.get(token)!.add(chunk.id)
      }
    }

    doc.status = 'indexed'
    doc.indexedAt = new Date().toISOString()

    this.updateStats()
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const dimensions = this.config.embeddingModel === 'embedding-3' ? 1024 : 768
    const embedding: number[] = []

    for (let i = 0; i < dimensions; i++) {
      const hash = this.simpleHash(text + i.toString())
      embedding.push((hash % 10000) / 10000)
    }

    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => val / magnitude)
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    return denominator === 0 ? 0 : dotProduct / denominator
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1)
  }

  private calculateKeywordScore(content: string, tokens: string[]): number {
    const lowerContent = content.toLowerCase()
    let matches = 0
    let totalLength = 0

    for (const token of tokens) {
      const regex = new RegExp(token, 'gi')
      const matchArray = lowerContent.match(regex)
      if (matchArray) {
        matches += matchArray.length
        totalLength += token.length * matchArray.length
      }
    }

    const score = matches > 0 ? (matches / tokens.length) * (totalLength / content.length) : 0
    return Math.min(score * 10, 1)
  }

  private calculateRecencyBoost(dateString: string): number {
    if (!dateString) return 0.5

    const date = new Date(dateString)
    const now = new Date()
    const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff < 7) return 1.0
    if (daysDiff < 30) return 0.8
    if (daysDiff < 90) return 0.6
    if (daysDiff < 365) return 0.4
    return 0.2
  }

  private generateSuggestions(query: string): string[] {
    const suggestions: string[] = []
    const tokens = this.tokenize(query)

    for (const [term, chunkIds] of this.invertedIndex.entries()) {
      if (tokens.some(t => t.includes(term) || term.includes(t))) {
        if (chunkIds.size > 0) {
          const sampleChunk = this.chunks.get(Array.from(chunkIds)[0])
          if (sampleChunk) {
            const words = sampleChunk.content.split(/\s+/).slice(0, 5)
            suggestions.push(words.join(' '))
          }
        }
      }
    }

    return [...new Set(suggestions)].slice(0, 5)
  }

  private generateFacets(results: SearchResult[]): Record<string, Array<{ value: string; count: number }>> {
    const facets: Record<string, Array<{ value: string; count: number }>> = {}

    const categoryCounts = new Map<string, number>()
    const tagCounts = new Map<string, number>()

    for (const result of results) {
      if (result.metadata.category) {
        categoryCounts.set(
          result.metadata.category,
          (categoryCounts.get(result.metadata.category) || 0) + 1
        )
      }

      if (result.metadata.tags) {
        for (const tag of result.metadata.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        }
      }
    }

    if (categoryCounts.size > 0) {
      facets['category'] = Array.from(categoryCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
    }

    if (tagCounts.size > 0) {
      facets['tags'] = Array.from(tagCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }

    return facets
  }

  private initializeStats(): KnowledgeStats {
    return {
      totalDocuments: 0,
      totalChunks: 0,
      totalTokens: 0,
      categories: {},
      documentsByStatus: {
        pending: 0,
        indexing: 0,
        indexed: 0,
        failed: 0,
        archived: 0,
      },
      averageChunkSize: 0,
      indexHealth: 'excellent',
      searchQueriesTotal: 0,
      averageQueryTime: 0,
    }
  }

  private updateStats(): void {
    const docs = Array.from(this.documents.values())

    this.stats.totalDocuments = docs.length
    this.stats.totalChunks = this.chunks.size
    this.stats.totalTokens = Array.from(this.chunks.values()).reduce(
      (sum, chunk) => sum + chunk.metadata.tokenCount,
      0
    )

    this.stats.categories = {}
    this.stats.documentsByStatus = {
      pending: 0,
      indexing: 0,
      indexed: 0,
      failed: 0,
      archived: 0,
    }

    for (const doc of docs) {
      if (doc.metadata.category) {
        this.stats.categories[doc.metadata.category] =
          (this.stats.categories[doc.metadata.category] || 0) + 1
      }
      this.stats.documentsByStatus[doc.status]++
    }

    this.stats.averageChunkSize =
      this.stats.totalChunks > 0
        ? this.stats.totalTokens / this.stats.totalChunks
        : 0

    const indexedRatio = this.stats.documentsByStatus.indexed / Math.max(1, this.stats.totalDocuments)
    if (indexedRatio >= 0.95) this.stats.indexHealth = 'excellent'
    else if (indexedRatio >= 0.8) this.stats.indexHealth = 'good'
    else if (indexedRatio >= 0.6) this.stats.indexHealth = 'fair'
    else this.stats.indexHealth = 'poor'

    this.stats.lastIndexedAt = new Date().toISOString()
  }

  private generateDocumentId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }

  getStatus(): {
    name: string
    version: string
    config: Required<KnowledgeBaseConfig> & { name: string; description: string }
    capabilities: string[]
  } {
    return {
      name: 'yyc3-knowledge-base',
      version: '2.0.0',
      config: this.config,
      capabilities: [
        'Vector Embedding & Similarity Search',
        'Hybrid Search (Vector + Keyword)',
        'Neural Reranking',
        'Intelligent Chunking',
        'Multi-language Support',
        'Faceted Search & Filtering',
        'Real-time Indexing',
        'Highlight Snippets',
        'Query Suggestions',
        'Export/Import Knowledge Base',
        'Statistics & Analytics',
      ],
    }
  }
}
