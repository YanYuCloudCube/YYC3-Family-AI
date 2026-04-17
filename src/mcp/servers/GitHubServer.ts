import type { MCPTool, MCPToolResult } from '../types'

export interface GitHubOptions {
  token?: string
  baseUrl?: string
  defaultOwner?: string
  defaultRepo?: string
  maxResults?: number
  cacheEnabled?: boolean
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  fork: boolean
  url: string
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  updated_at: string
  created_at: string
  default_branch: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  body: string | null
  user: { login: string }
  labels: Array<{ name: string; color: string }>
  created_at: string
  updated_at: string
  comments: number
  pull_request?: boolean
}

export interface GitHubPR {
  id: number
  number: number
  title: string
  state: 'open' | 'closed' | 'merged'
  body: string | null
  user: { login: string }
  base: { ref: string; sha: string }
  head: { ref: string; sha: string }
  created_at: string
  updated_at: string
  additions: number
  deletions: number
  changed_files: number
  review_status?: string
  mergeable?: boolean
}

export interface GitHubFileContent {
  name: string
  path: string
  sha: string
  size: number
  content: string
  encoding: string
  type: 'file' | 'dir' | 'symlink' | 'submodule'
}

export interface GitHubCommit {
  sha: string
  message: string
  author: { name: string; email: string; date: string }
  committer: { name: string; email: string; date: string }
  url: string
  stats?: { additions: number; deletions: number; total: number }
}

export interface GitHubBranch {
  name: string
  commit: { sha: string; url: string }
  protected: boolean
}

export interface GitHubActionRun {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null
  created_at: string
  head_branch: string
  head_sha: string
}

const GITHUB_API_BASE = 'https://api.github.com'

export class GitHubServer {
  private options: GitHubOptions
  private tools: MCPTool[]
  private cache: Map<string, { data: any; timestamp: number }>

  constructor(options: GitHubOptions = {}) {
    this.options = {
      baseUrl: GITHUB_API_BASE,
      maxResults: 30,
      cacheEnabled: true,
      ...options,
    }

    this.cache = new Map()

    this.tools = [
      {
        name: 'search_repositories',
        description: '搜索 GitHub 仓库，支持关键词、语言、排序等过滤条件',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索关键词（如 "react hooks"）' },
            language: { type: 'string', description: '编程语言过滤（如 TypeScript, Python）' },
            sort: { type: 'string', enum: ['stars', 'forks', 'updated'], description: '排序方式' },
            order: { type: 'string', enum: ['desc', 'asc'], description: '排序顺序' },
            per_page: { type: 'number', description: '返回数量（默认30，最大100）' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_repo_info',
        description: '获取仓库详细信息：描述、星标、分支、语言等',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: '仓库所有者/组织名' },
            repo: { type: 'string', description: '仓库名称' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'list_issues',
        description: '列出仓库的 Issues，支持状态、标签、创建者等过滤',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: '仓库所有者' },
            repo: { type: 'string', description: '仓库名称' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Issue 状态' },
            labels: { type: 'string', description: '标签过滤（逗号分隔）' },
            creator: { type: 'string', description: '创建者用户名' },
            sort: { type: 'string', enum: ['created', 'updated', 'comments'], description: '排序字段' },
            direction: { type: 'string', enum: ['asc', 'desc'], description: '排序方向' },
            per_page: { type: 'number', description: '返回数量' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'list_pull_requests',
        description: '列出仓库的 Pull Requests，含状态和审查信息',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: '仓库所有者' },
            repo: { type: 'string', description: '仓库名称' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'PR 状态' },
            sort: { type: 'string', enum: ['created', 'updated', 'popularity'], description: '排序方式' },
            direction: { type: 'string', enum: ['asc', 'desc'] },
            per_page: { type: 'number' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'read_file',
        description: '读取仓库中的文件内容',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: '仓库所有者' },
            repo: { type: 'string', description: '仓库名称' },
            path: { type: 'string', description: '文件路径（如 src/index.ts）' },
            branch: { type: 'string', description: '分支名（默认 main）' },
          },
          required: ['owner', 'repo', 'path'],
        },
      },
      {
        name: 'list_directory',
        description: '列出仓库目录内容',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            path: { type: 'string', description: '目录路径（默认根目录）' },
            branch: { type: 'string', description: '分支名' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'get_commits',
        description: '获取仓库提交历史记录',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            branch: { type: 'string', description: '分支名' },
            since: { type: 'string', description: '起始日期 (ISO 8601)' },
            until: { type: 'string', description: '截止日期 (ISO 8601)' },
            per_page: { type: 'number', description: '返回条数' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'list_branches',
        description: '列出仓库所有分支',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            protected_only: { type: 'boolean', description: '仅显示受保护分支' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'get_workflow_runs',
        description: '获取 GitHub Actions 工作流运行状态',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            workflow_id: { type: ['number', 'string'], description: '工作流 ID 或文件名' },
            status: { type: 'string', enum: ['queued', 'in_progress', 'completed'], description: '运行状态' },
            per_page: { type: 'number' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'create_issue',
        description: '在仓库中创建新 Issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' },
            title: { type: 'string', description: 'Issue 标题' },
            body: { type: 'string', description: 'Issue 内容（支持 Markdown）' },
            labels: { type: 'array', items: { type: 'string' }, description: '标签列表' },
            assignees: { type: 'array', items: { type: 'string' }, description: '指派用户列表' },
          },
          required: ['owner', 'repo', 'title'],
        },
      },
    ]
  }

  getTools(): MCPTool[] {
    return this.tools
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    try {
      switch (toolName) {
        case 'search_repositories':
          return await this.searchRepositories(args.query, args)
        case 'get_repo_info':
          return await this.getRepoInfo(args.owner, args.repo)
        case 'list_issues':
          return await this.listIssues(args.owner, args.repo, args)
        case 'list_pull_requests':
          return await this.listPullRequests(args.owner, args.repo, args)
        case 'read_file':
          return await this.readFile(args.owner, args.repo, args.path, args.branch)
        case 'list_directory':
          return await this.listDirectory(args.owner, args.repo, args.path, args.branch)
        case 'get_commits':
          return await this.getCommits(args.owner, args.repo, args)
        case 'list_branches':
          return await this.listBranches(args.owner, args.repo, args.protected_only)
        case 'get_workflow_runs':
          return await this.getWorkflowRuns(args.owner, args.repo, args)
        case 'create_issue':
          return await this.createIssue(args.owner, args.repo, args.title, args.body, args.labels, args.assignees)
        default:
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: `未知工具: ${toolName}` }) }],
            isError: true,
          }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
        isError: true,
      }
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'YYC3-Family-AI/1.0',
    }

    if (this.options.token) {
      headers['Authorization'] = `token ${this.options.token}`
    }

    return headers
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = this.options.baseUrl || GITHUB_API_BASE
    const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

    const cacheKey = `${url}_${JSON.stringify(options.method || 'GET')}`

    if (this.options.cacheEnabled && (options.method || 'GET') === 'GET') {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < 60000) {
        return cached.data as T
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: { ...this.getHeaders(), ...(options.headers as Record<string, string>) },
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      let errorMessage = `GitHub API Error (${response.status})`

      try {
        const errorJson = JSON.parse(errorBody)
        errorMessage += `: ${errorJson.message || errorBody}`
      } catch {
        if (errorBody) errorMessage += `: ${errorBody}`
      }

      throw new Error(errorMessage)
    }

    const data = await response.json() as T

    if (this.options.cacheEnabled && (options.method || 'GET') === 'GET') {
      this.cache.set(cacheKey, { data, timestamp: Date.now() })
      if (this.cache.size > 200) {
        const firstKey = this.cache.keys().next().value
        if (firstKey) this.cache.delete(firstKey)
      }
    }

    return data
  }

  async searchRepositories(query: string, options: Record<string, any> = {}): Promise<MCPToolResult> {
    const params = new URLSearchParams({
      q: query,
      per_page: String(Math.min(options.per_page || this.options.maxResults || 30, 100)),
    })

    if (options.language) params.append('language', options.language)
    if (options.sort) params.append('sort', options.sort)
    if (options.order) params.append('order', options.order || 'desc')

    const data = await this.apiRequest<{ items: GitHubRepo[]; total_count: number }>(`/search/repositories?${params}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          totalResults: data.total_count,
          repositories: data.items.map(r => ({
            fullName: r.full_name,
            description: r.description,
            stars: r.stargazers_count,
            forks: r.forks_count,
            language: r.language,
            topics: r.topics,
            updatedAt: r.updated_at,
            url: r.html_url,
          })),
          returnedCount: data.items.length,
          searchedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async getRepoInfo(owner: string, repo: string): Promise<MCPToolResult> {
    const data = await this.apiRequest<GitHubRepo>(`/repos/${owner}/${repo}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          repository: {
            fullName: data.full_name,
            description: data.description,
            isPrivate: data.private,
            isFork: data.fork,
            stars: data.stargazers_count,
            forks: data.forks_count,
            primaryLanguage: data.language,
            topics: data.topics,
            defaultBranch: data.default_branch,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            url: data.html_url,
            apiUrl: data.url,
          },
          retrievedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async listIssues(owner: string, repo: string, options: Record<string, any> = {}): Promise<MCPToolResult> {
    const params = new URLSearchParams({
      state: options.state || 'open',
      per_page: String(options.per_page || this.options.maxResults || 30),
    })

    if (options.labels) params.append('labels', options.labels)
    if (options.creator) params.append('creator', options.creator)
    if (options.sort) params.append('sort', options.sort)
    if (options.direction) params.append('direction', options.direction)

    const data = await this.apiRequest<GitHubIssue[]>(`/repos/${owner}/${repo}/issues?${params}`)

    const issuesOnly = data.filter(i => !i.pull_request)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          issues: issuesOnly.map(i => ({
            number: i.number,
            title: i.title,
            state: i.state,
            author: i.user.login,
            labels: i.labels.map(l => l.name),
            commentCount: i.comments,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
            bodyPreview: i.body?.slice(0, 150),
          })),
          totalCount: issuesOnly.length,
          listedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async listPullRequests(owner: string, repo: string, options: Record<string, any> = {}): Promise<MCPToolResult> {
    const params = new URLSearchParams({
      state: options.state || 'open',
      per_page: String(options.per_page || this.options.maxResults || 30),
    })

    if (options.sort) params.append('sort', options.sort)
    if (options.direction) params.append('direction', options.direction)

    const data = await this.apiRequest<GitHubPR[]>(`/repos/${owner}/${repo}/pulls?${params}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          pullRequests: data.map(pr => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            author: pr.user.login,
            baseBranch: pr.base.ref,
            headBranch: pr.head.ref,
            additions: pr.additions,
            deletions: pr.deletions,
            changedFiles: pr.changed_files,
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            reviewStatus: pr.review_status,
            mergeable: pr.mergeable,
          })),
          totalCount: data.length,
          listedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async readFile(owner: string, repo: string, filePath: string, branch?: string): Promise<MCPToolResult> {
    const params = branch ? `?ref=${branch}` : ''
    const data = await this.apiRequest<GitHubFileContent>(`/repos/${owner}/${repo}/contents/${filePath}${params}`)

    if (data.type !== 'file') {
      throw new Error(`"${filePath}" 不是文件，而是 ${data.type}`)
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8')

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          file: {
            name: data.name,
            path: data.path,
            size: data.size,
            encoding: data.encoding,
            sha: data.sha,
          },
          content,
          readAt: new Date().toISOString(),
        }),
      }],
    }
  }

  async listDirectory(owner: string, repo: string, dirPath?: string, branch?: string): Promise<MCPToolResult> {
    const encodedPath = dirPath ? `/${encodeURIComponent(dirPath)}` : ''
    const params = branch ? `?ref=${branch}` : ''

    const data = await this.apiRequest<GitHubFileContent[]>(`/repos/${owner}/${repo}/contents${encodedPath}${params}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          path: dirPath || '/',
          entries: data.map(entry => ({
            name: entry.name,
            path: entry.path,
            type: entry.type,
            size: entry.size,
          })),
          totalCount: data.length,
          listedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async getCommits(owner: string, repo: string, options: Record<string, any> = {}): Promise<MCPToolResult> {
    const params = new URLSearchParams({
      per_page: String(options.per_page || 20),
    })

    if (options.branch) params.append('sha', options.branch)
    if (options.since) params.append('since', options.since)
    if (options.until) params.append('until', options.until)

    const data = await this.apiRequest<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?${params}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          owner,
          repo,
          commits: data.map(c => ({
            sha: c.sha.slice(0, 7),
            fullSha: c.sha,
            message: c.message.split('\n')[0],
            author: c.author.name,
            authorDate: c.author.date,
            stats: c.stats,
            url: c.url,
          })),
          totalCount: data.length,
          retrievedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async listBranches(owner: string, repo: string, protectedOnly?: boolean): Promise<MCPToolResult> {
    const params = protectedOnly ? '?protected=true' : ''
    const data = await this.apiRequest<GitHubBranch[]>(`/repos/${owner}/${repo}/branches${params}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          branches: data.map(b => ({
            name: b.name,
            sha: b.commit.sha.slice(0, 7),
            protected: b.protected,
          })),
          totalCount: data.length,
          retrievedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async getWorkflowRuns(owner: string, repo: string, options: Record<string, any> = {}): Promise<MCPToolResult> {
    const params = new URLSearchParams({
      per_page: String(options.per_page || 15),
    })

    if (options.workflow_id) params.append('workflow_id', String(options.workflow_id))
    if (options.status) params.append('status', options.status)

    const data = await this.apiRequest<{ workflow_runs: GitHubActionRun[]; total_count: number }>(
      `/repos/${owner}/${repo}/actions/runs?${params}`
    )

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalRuns: data.total_count,
          runs: data.workflow_runs.map(run => ({
            id: run.id,
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
            branch: run.head_branch,
            commitSha: run.head_sha.slice(0, 7),
            createdAt: run.created_at,
          })),
          retrievedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body?: string,
    labels?: string[],
    assignees?: string[]
  ): Promise<MCPToolResult> {
    if (!this.options.token) {
      throw new Error('创建 Issue 需要配置 GitHub Token')
    }

    const issueData: Record<string, any> = { title }
    if (body) issueData.body = body
    if (labels && labels.length > 0) issueData.labels = labels
    if (assignees && assignees.length > 0) issueData.assignees = assignees

    const data = await this.apiRequest<GitHubIssue>(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issueData),
    })

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          issue: {
            number: data.number,
            title: data.title,
            state: data.state,
            url: `https://github.com/${owner}/${repo}/issues/${data.number}`,
            createdAt: data.created_at,
          },
          createdAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  getStatus(): { name: string; toolsCount: number; connected: boolean; hasToken: boolean } {
    return {
      name: 'github',
      toolsCount: this.tools.length,
      connected: true,
      hasToken: !!this.options.token,
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}
