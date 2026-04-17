export interface GraphNode {
  id: string
  label: string
  type: string
  properties: Record<string, any>
  embedding?: number[]
  source?: string
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  relation: string
  weight: number
  properties: Record<string, any>
  sourceText?: string
}

export interface KnowledgeGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  metadata: {
    createdAt: string
    updatedAt: string
    nodeCount: number
    edgeCount: number
    sources: string[]
  }
}

export interface EntityExtractionResult {
  entities: Array<{
    text: string
    type: string
    confidence: number
    startOffset?: number
    endOffset?: number
  }>
  relations: Array<{
    subject: string
    predicate: string
    object: string
    confidence: number
  }>
  rawText: string
  processedAt: string
}

export interface GraphQueryRequest {
  query: string
  maxHops?: number
  limit?: number
  includeRelated?: boolean
  filters?: {
    nodeTypes?: string[]
    relationTypes?: string[]
    minWeight?: number
  }
}

export interface GraphQueryResult {
  answer: string
  subgraph: KnowledgeGraph
  relevantPaths: Array<{ path: GraphEdge[]; score: number }>
  sources: string[]
  confidence: number
  queryTimeMs: number
}

export interface GraphRAGConfig {
  apiKey?: string
  model?: string
  embeddingModel?: string
  maxEntitiesPerDoc?: number
  similarityThreshold?: number
  cacheEnabled?: boolean
}

export class GraphRAGService {
  private config: GraphRAGConfig
  private graph: KnowledgeGraph
  private entityCache: Map<string, EntityExtractionResult>

  constructor(config: GraphRAGConfig = {}) {
    this.config = {
      model: 'glm-4-flash',
      maxEntitiesPerDoc: 50,
      similarityThreshold: 0.7,
      cacheEnabled: true,
      ...config,
    }

    this.graph = this.createEmptyGraph()
    this.entityCache = new Map()
  }

  async extractEntities(text: string, options?: { domain?: string; language?: string }): Promise<EntityExtractionResult> {
    if (!text || !text.trim()) {
      throw new Error('输入文本不能为空')
    }

    const cacheKey = this.hashText(text.slice(0, 500))

    if (this.config.cacheEnabled && this.entityCache.has(cacheKey)) {
      return this.entityCache.get(cacheKey)!
    }

    const result = await this.callEntityExtractionAPI(text, options)

    if (this.config.cacheEnabled) {
      this.entityCache.set(cacheKey, result)
      if (this.entityCache.size > 200) {
        const firstKey = this.entityCache.keys().next().value
        if (firstKey) this.entityCache.delete(firstKey)
      }
    }

    return result
  }

  async addDocumentToGraph(
    text: string,
    docId: string,
    options?: { domain?: string; mergeEntities?: boolean }
  ): Promise<KnowledgeGraph> {
    const extraction = await this.extractEntities(text, options)

    const newNodes: GraphNode[] = []
    const newEdges: GraphEdge[] = []

    const existingLabels = new Set(this.graph.nodes.map(n => n.label.toLowerCase()))

    for (const entity of extraction.entities.slice(0, this.config.maxEntitiesPerDoc ?? 50)) {
      const normalizedLabel = entity.text.trim()
      const existingNode = this.graph.nodes.find(
        n => n.label.toLowerCase() === normalizedLabel.toLowerCase() && n.type === entity.type
      )

      if (existingNode && options?.mergeEntities !== false) {
        if (!existingNode.source?.includes(docId)) {
          existingNode.source = existingNode.source ? `${existingNode.source},${docId}` : docId
        }
        existingNode.properties.mentions = (existingNode.properties.mentions || 0) + 1
      } else {
        const nodeId = `${entity.type}_${normalizedLabel.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`
        newNodes.push({
          id: nodeId,
          label: normalizedLabel,
          type: entity.type,
          properties: {
            confidence: entity.confidence,
            mentions: 1,
            firstSeen: docId,
          },
          source: docId,
        })
      }
    }

    for (const rel of extraction.relations) {
      const sourceNode = [...this.graph.nodes, ...newNodes].find(
        n => n.label.toLowerCase() === rel.subject.toLowerCase()
      )
      const targetNode = [...this.graph.nodes, ...newNodes].find(
        n => n.label.toLowerCase() === rel.object.toLowerCase()
      )

      if (sourceNode && targetNode) {
        const edgeExists = this.graph.edges.some(
          e => e.source === sourceNode.id && e.target === targetNode.id && e.relation === rel.predicate
        )

        if (!edgeExists) {
          newEdges.push({
            id: `edge_${sourceNode.id}_${targetNode.id}_${rel.predicate}`,
            source: sourceNode.id,
            target: targetNode.id,
            relation: rel.predicate,
            weight: rel.confidence,
            properties: { sourceDoc: docId },
            sourceText: `${rel.subject} ${rel.predicate} ${rel.object}`,
          })
        }
      }
    }

    this.graph.nodes.push(...newNodes)
    this.graph.edges.push(...newEdges)
    this.graph.metadata.updatedAt = new Date().toISOString()

    if (!this.graph.metadata.sources.includes(docId)) {
      this.graph.metadata.sources.push(docId)
    }

    return this.getGraphSnapshot()
  }

  async query(request: GraphQueryRequest): Promise<GraphQueryResult> {
    const startTime = Date.now()

    const relevantSubgraph = this.retrieveRelevantSubgraph(request.query, request.maxHops ?? 2, request.filters)

    const contextString = this.subgraphToString(relevantSubgraph)

    const answer = await this.generateAnswer(request.query, contextString)

    const paths = this.findRelevantPaths(relevantSubgraph, request.query)

    return {
      answer,
      subgraph: relevantSubgraph,
      relevantPaths: paths,
      sources: relevantSubgraph.metadata.sources,
      confidence: this.calculateConfidence(answer, relevantSubgraph),
      queryTimeMs: Date.now() - startTime,
    }
  }

  getGraph(): KnowledgeGraph {
    return this.getGraphSnapshot()
  }

  getNodeById(nodeId: string): GraphNode | undefined {
    return this.graph.nodes.find(n => n.id === nodeId)
  }

  getNeighbors(nodeId: string, depth: number = 1): { node: GraphNode; edges: GraphEdge[] }[] {
    const visited = new Set<string>()
    const results: { node: GraphNode; edges: GraphEdge[] }[] = []

    const bfs = (currentId: string, currentDepth: number) => {
      if (visited.has(currentId) || currentDepth > depth) return

      visited.add(currentId)
      const node = this.getNodeById(currentId)
      if (!node) return

      const connectedEdges = this.graph.edges.filter(
        e => e.source === currentId || e.target === currentId
      )

      results.push({ node, edges: connectedEdges })

      for (const edge of connectedEdges) {
        const neighborId = edge.source === currentId ? edge.target : edge.source
        bfs(neighborId, currentDepth + 1)
      }
    }

    bfs(nodeId, 0)
    return results
  }

  findPath(fromNodeId: string, toNodeId: string, maxDepth: number = 5): GraphEdge[] | null {
    if (fromNodeId === toNodeId) return []

    const queue: Array<{ nodeId: string; path: GraphEdge[] }> = [{ nodeId: fromNodeId, path: [] }]
    const visited = new Set<string>([fromNodeId])

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!

      if (path.length >= maxDepth) continue

      const edges = this.graph.edges.filter(e => e.source === nodeId)

      for (const edge of edges) {
        if (edge.target === toNodeId) {
          return [...path, edge]
        }

        if (!visited.has(edge.target)) {
          visited.add(edge.target)
          queue.push({ nodeId: edge.target, path: [...path, edge] })
        }
      }
    }

    return null
  }

  findShortestPath(fromNodeId: string, toNodeId: string): GraphEdge[] | null {
    return this.findPath(fromNodeId, toNodeId, 10)
  }

  getStats(): {
    totalNodes: number
    totalEdges: number
    nodeTypes: Record<string, number>
    relationTypes: Record<string, number>
    sources: string[]
  } {
    const nodeTypes: Record<string, number> = {}
    const relationTypes: Record<string, number> = {}

    for (const node of this.graph.nodes) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1
    }

    for (const edge of this.graph.edges) {
      relationTypes[edge.relation] = (relationTypes[edge.relation] || 0) + 1
    }

    return {
      totalNodes: this.graph.nodes.length,
      totalEdges: this.graph.edges.length,
      nodeTypes,
      relationTypes,
      sources: this.graph.metadata.sources,
    }
  }

  clearGraph(): void {
    this.graph = this.createEmptyGraph()
    this.entityCache.clear()
  }

  exportGraph(format: 'json' | 'cypher' | 'mermaid' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.graph, null, 2)

      case 'cypher': {
        const statements: string[] = []

        for (const node of this.graph.nodes) {
          const props = Object.entries(node.properties)
            .map(([k, v]) => `${k}: "${v}"`)
            .join(', ')
          statements.push(`CREATE (:${node.type} {id: "${node.id}", label: "${node.label}"${props ? ', ' + props : ''}})`)
        }

        for (const edge of this.graph.edges) {
          statements.push(`MATCH (a), (b) WHERE a.id = "${edge.source}" AND b.id = "${edge.target}" CREATE (a)-[:${edge.relation} {weight: ${edge.weight}}]->(b)`)
        }

        return statements.join('\n')
      }

      case 'mermaid': {
        let output = 'graph LR\n'

        for (const edge of this.graph.edges.slice(0, 100)) {
          const sourceNode = this.graph.nodes.find(n => n.id === edge.source)
          const targetNode = this.graph.nodes.find(n => n.id === edge.target)
          if (sourceNode && targetNode) {
            output += `  ${sourceNode.label.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')} -->|${edge.relation}| ${targetNode.label.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')}\n`
          }
        }

        return output
      }

      default:
        throw new Error(`不支持的导出格式: ${format}`)
    }
  }

  private createEmptyGraph(): KnowledgeGraph {
    const now = new Date().toISOString()
    return {
      nodes: [],
      edges: [],
      metadata: {
        createdAt: now,
        updatedAt: now,
        nodeCount: 0,
        edgeCount: 0,
        sources: [],
      },
    }
  }

  private getGraphSnapshot(): KnowledgeGraph {
    return {
      ...this.graph,
      metadata: {
        ...this.graph.metadata,
        nodeCount: this.graph.nodes.length,
        edgeCount: this.graph.edges.length,
      },
    }
  }

  private async callEntityExtractionAPI(
    text: string,
    options?: { domain?: string; language?: string }
  ): Promise<EntityExtractionResult> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return this.getMockExtraction(text)
    }

    const truncatedText = text.slice(0, 8000)
    const domainHint = options?.domain ? `\nDomain context: ${options.domain}` : ''
    const languageHint = options?.language ? `Language: ${options.language}` : ''

    const systemPrompt = `You are an expert knowledge graph entity extractor. Extract entities and relationships from text.

Output format (STRICT JSON only):
{
  "entities": [
    {"text": "entity name", "type": "PERSON|ORG|LOCATION|EVENT|CONCEPT|PRODUCT|DATE|MISC", "confidence": 0.95}
  ],
  "relations": [
    {"subject": "entity1", "predicate": "relation_type", "object": "entity2", "confidence": 0.90}
  ]
}

Rules:
- Extract ALL significant entities (people, organizations, locations, events, concepts, products).
- Identify clear relationships between entities.
- Use standard entity types.
- Confidence should reflect certainty (0.5-1.0).
- Output ONLY valid JSON, no other text.`

    const userPrompt = `Extract entities and relationships from this text:\n${languageHint}${domainHint}\n\n---\n${truncatedText}\n---`

    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || 'glm-4-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      })

      if (!response.ok) {
        throw new Error(`ZhipuAI API error: ${response.status}`)
      }

      const data: any = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('Empty response')
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        entities: (parsed.entities || []).slice(0, this.config.maxEntitiesPerDoc ?? 50),
        relations: parsed.relations || [],
        rawText: text,
        processedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('[GraphRAG] Entity extraction failed:', error)
      return this.getMockExtraction(text)
    }
  }

  private getMockExtraction(text: string): EntityExtractionResult {
    const words = text.split(/\s+/).filter(w => w.length > 3)
    const uniqueWords = [...new Set(words)].slice(0, 10)

    const entities = uniqueWords.map((word, i) => ({
      text: word,
      type: ['CONCEPT', 'MISC', 'PERSON', 'ORG', 'LOCATION'][i % 5],
      confidence: 0.6 + Math.random() * 0.3,
    }))

    const relations = entities.slice(0, Math.min(5, entities.length - 1)).map((e, i) => ({
      subject: e.text,
      predicate: ['related_to', 'part_of', 'located_in', 'works_for', 'created_by'][i % 5],
      object: entities[i + 1]?.text || 'unknown',
      confidence: 0.5 + Math.random() * 0.3,
    }))

    return {
      entities,
      relations,
      rawText: text,
      processedAt: new Date().toISOString(),
    }
  }

  private retrieveRelevantSubgraph(query: string, maxHops: number, _filters?: GraphQueryRequest['filters']): KnowledgeGraph {
    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)

    const scoredNodes = this.graph.nodes.map(node => {
      let score = 0

      if (node.label.toLowerCase().includes(queryLower)) {
        score += 1.0
      } else {
        for (const word of queryWords) {
          if (node.label.toLowerCase().includes(word)) {
            score += 0.5
          }
        }
      }

      for (const word of queryWords) {
        if (node.type.toLowerCase().includes(word)) {
          score += 0.3
        }
      }

      return { node, score }
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 15)

    const relevantNodeIds = new Set(scoredNodes.map(s => s.node.id))

    for (let hop = 0; hop < maxHops; hop++) {
      const newIds = new Set<string>()

      for (const nodeId of relevantNodeIds) {
        const neighbors = this.graph.edges.filter(
          e => e.source === nodeId || e.target === nodeId
        )

        for (const edge of neighbors) {
          const neighborId = edge.source === nodeId ? edge.target : edge.source
          if (!relevantNodeIds.has(neighborId)) {
            newIds.add(neighborId)
          }
        }
      }

      newIds.forEach(id => relevantNodeIds.add(id))
    }

    const filteredNodes = this.graph.nodes.filter(n => relevantNodeIds.has(n.id))
    const filteredEdges = this.graph.edges.filter(
      e => relevantNodeIds.has(e.source) && relevantNodeIds.has(e.target)
    )

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: {
        createdAt: this.graph.metadata.createdAt,
        updatedAt: new Date().toISOString(),
        nodeCount: filteredNodes.length,
        edgeCount: filteredEdges.length,
        sources: Array.from(new Set(filteredNodes.map(n => n.source).filter(Boolean) as string[])),
      },
    }
  }

  private async generateAnswer(query: string, context: string): Promise<string> {
    const apiKey = this.config.apiKey || process.env.ZHIPU_API_KEY

    if (!apiKey) {
      return `[Mock Answer] Based on the knowledge graph containing ${this.graph.nodes.length} entities and ${this.graph.edges.length} relationships.\n\nQuery: ${query}\n\nPlease configure ZHIPU_API_KEY for real answers.`
    }

    try {
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
              content: 'You are a knowledge assistant that answers questions based on provided graph context. Be concise and accurate.',
            },
            {
              role: 'user',
              content: `Based on this knowledge graph context, answer the question:\n\nContext:\n${context}\n\nQuestion: ${query}`,
            },
          ],
          temperature: 0.4,
          max_tokens: 2048,
        }),
      })

      const data: any = await response.json()
      return data.choices?.[0]?.message?.content || 'Unable to generate answer.'
    } catch {
      return 'Failed to generate answer from API.'
    }
  }

  private findRelevantPaths(subgraph: KnowledgeGraph, _query: string): Array<{ path: GraphEdge[]; score: number }> {
    if (subgraph.edges.length === 0) return []

    const paths: Array<{ path: GraphEdge[]; score: number }> = []

    const startNodes = subgraph.nodes.slice(0, 5)

    for (const startNode of startNodes) {
      for (const edge of subgraph.edges.filter(e => e.source === startNode.id)) {
        const path = [edge]
        let currentScore = edge.weight

        let nextTarget = edge.target
        for (let depth = 0; depth < 3; depth++) {
          const nextEdge = subgraph.edges.find(e => e.source === nextTarget)
          if (nextEdge) {
            path.push(nextEdge)
            currentScore *= nextEdge.weight
            nextTarget = nextEdge.target
          } else {
            break
          }
        }

        paths.push({ path, score: currentScore })
      }
    }

    return paths.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  private calculateConfidence(_answer: string, subgraph: KnowledgeGraph): number {
    if (subgraph.nodes.length === 0) return 0.1

    let baseConfidence = Math.min(0.95, 0.5 + subgraph.nodes.length * 0.02)

    if (subgraph.edges.length > 0) {
      baseConfidence = Math.min(0.98, baseConfidence + 0.1)
    }

    return baseConfidence
  }

  private subgraphToString(graph: KnowledgeGraph): string {
    if (graph.nodes.length === 0) return '(empty knowledge graph)'

    let output = `Knowledge Graph (${graph.nodes.length} nodes, ${graph.edges.length} edges):\n\n`

    output += 'Entities:\n'
    for (const node of graph.nodes.slice(0, 30)) {
      output += `- [${node.type}] ${node.label}`
      if (Object.keys(node.properties).length > 0) {
        output += ` (${JSON.stringify(node.properties)})`
      }
      output += '\n'
    }

    if (graph.edges.length > 0) {
      output += '\nRelationships:\n'
      for (const edge of graph.edges.slice(0, 30)) {
        const source = graph.nodes.find(n => n.id === edge.source)?.label || edge.source
        const target = graph.nodes.find(n => n.id === edge.target)?.label || edge.target
        output += `- ${source} --[${edge.relation}]--> ${target} (weight: ${edge.weight.toFixed(2)})\n`
      }
    }

    return output
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
