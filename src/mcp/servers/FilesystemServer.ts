import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import type { MCPTool, MCPToolResult } from '../types'

const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
const readdirAsync = promisify(fs.readdir)
const statAsync = promisify(fs.stat)
const mkdirAsync = promisify(fs.mkdir)
const unlinkAsync = promisify(fs.unlink)
const renameAsync = promisify(fs.rename)

export interface FileSystemOptions {
  allowedPaths: string[]
  maxFileSize?: number
  maxDirEntries?: number
}

export interface FileInfo {
  name: string
  path: string
  size: number
  type: 'file' | 'directory' | 'symlink'
  modifiedAt: Date
  createdAt?: Date
  permissions?: string
  extension?: string
}

export interface DirectoryEntry {
  name: string
  path: string
  isDirectory: boolean
  size?: number
  modifiedAt?: Date
}

export class FilesystemServer {
  private options: FileSystemOptions
  private tools: MCPTool[]

  constructor(options: FileSystemOptions) {
    this.options = {
      maxFileSize: 10 * 1024 * 1024,
      maxDirEntries: 1000,
      ...options,
    }

    this.tools = [
      {
        name: 'read_file',
        description: '读取文件内容，支持文本和二进制文件的Base64编码',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '要读取的文件路径（相对于允许的根目录）',
            },
            encoding: {
              type: 'string',
              enum: ['utf-8', 'base64', 'latin1'],
              description: '文件编码，默认 utf-8',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'write_file',
        description: '写入或创建文件内容，支持自动创建父目录',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: '要写入的文件路径',
            },
            content: {
              type: 'string',
              description: '要写入的内容（文本或 Base64 编码的二进制数据）',
            },
            encoding: {
              type: 'string',
              enum: ['utf-8', 'base64', 'latin1'],
              description: '编码方式，默认 utf-8',
            },
            createDirs: {
              type: 'boolean',
              description: '是否自动创建不存在的父目录',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'list_directory',
        description: '列出目录内容，支持递归和过滤',
        inputSchema: {
          type: 'object',
          properties: {
            dirPath: {
              type: 'string',
              description: '目录路径',
            },
            recursive: {
              type: 'boolean',
              description: '是否递归列出子目录',
            },
            pattern: {
              type: 'string',
              description: 'Glob 模式过滤（如 *.ts, **/*.json）',
            },
            showHidden: {
              type: 'boolean',
              description: '是否显示隐藏文件',
            },
          },
          required: ['dirPath'],
        },
      },
      {
        name: 'get_file_info',
        description: '获取文件或目录的详细信息',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: {
              type: 'string',
              description: '目标路径（文件或目录）',
            },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'create_directory',
        description: '创建目录，支持嵌套创建',
        inputSchema: {
          type: 'object',
          properties: {
            dirPath: {
              type: 'string',
              description: '要创建的目录路径',
            },
            recursive: {
              type: 'boolean',
              description: '是否递归创建所有不存在的父目录',
            },
          },
          required: ['dirPath'],
        },
      },
      {
        name: 'move_file',
        description: '移动或重命名文件/目录',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: '源路径',
            },
            destination: {
              type: 'string',
              description: '目标路径',
            },
            overwrite: {
              type: 'boolean',
              description: '是否覆盖已存在的目标',
            },
          },
          required: ['source', 'destination'],
        },
      },
      {
        name: 'delete_file',
        description: '删除文件或空目录',
        inputSchema: {
          type: 'object',
          properties: {
            targetPath: {
              type: 'string',
              description: '要删除的路径',
            },
            force: {
              type: 'boolean',
              description: '是否强制删除非空目录',
            },
          },
          required: ['targetPath'],
        },
      },
      {
        name: 'search_files',
        description: '在指定目录中搜索匹配模式的文件名或内容',
        inputSchema: {
          type: 'object',
          properties: {
            rootDir: {
              type: 'string',
              description: '搜索根目录',
            },
            query: {
              type: 'string',
              description: '搜索关键词或正则表达式',
            },
            searchInContent: {
              type: 'boolean',
              description: '是否在文件内容中搜索（不仅限于文件名）',
            },
            fileTypes: {
              type: 'array',
              items: { type: 'string' },
              description: '限制搜索的文件类型扩展名列表',
            },
            maxResults: {
              type: 'number',
              description: '最大返回结果数',
            },
          },
          required: ['rootDir', 'query'],
        },
      },
      {
        name: 'get_directory_tree',
        description: '获取目录树形结构，用于可视化展示',
        inputSchema: {
          type: 'object',
          properties: {
            rootPath: {
              type: 'string',
              description: '根目录路径',
            },
            depth: {
              type: 'number',
              description: '最大遍历深度，0 表示无限制',
            },
            includeSize: {
              type: 'boolean',
              description: '是否包含文件大小信息',
            },
          },
          required: ['rootPath'],
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
        case 'read_file':
          return await this.readFile(args.path, args.encoding)
        case 'write_file':
          return await this.writeFile(args.path, args.content, args.encoding, args.createDirs)
        case 'list_directory':
          return await this.listDirectory(args.dirPath, args.recursive, args.pattern, args.showHidden)
        case 'get_file_info':
          return await this.getFileInfo(args.targetPath)
        case 'create_directory':
          return await this.createDirectory(args.dirPath, args.recursive)
        case 'move_file':
          return await this.moveFile(args.source, args.destination, args.overwrite)
        case 'delete_file':
          return await this.deleteFile(args.targetPath, args.force)
        case 'search_files':
          return await this.searchFiles(args.rootDir, args.query, args.searchInContent, args.fileTypes, args.maxResults)
        case 'get_directory_tree':
          return await this.getDirectoryTree(args.rootPath, args.depth, args.includeSize)
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

  private resolvePath(requestedPath: string): string {
    const normalized = path.normalize(requestedPath)

    for (const allowed of this.options.allowedPaths) {
      const resolved = path.resolve(allowed, normalized)
      if (resolved.startsWith(path.resolve(allowed))) {
        return resolved
      }
    }

    throw new Error(`访问被拒绝: 路径 "${requestedPath}" 不在允许的目录范围内`)
  }

  private validatePath(requestedPath: string): void {
    for (const allowed of this.options.allowedPaths) {
      const resolved = path.resolve(this.resolvePath(requestedPath))
      if (resolved.startsWith(path.resolve(allowed))) {
        return
      }
    }
    throw new Error(`安全限制: 路径不在允许范围内`)
  }

  async readFile(filePath: string, encoding: string = 'utf-8'): Promise<MCPToolResult> {
    this.validatePath(filePath)
    const fullPath = this.resolvePath(filePath)

    const stat = await statAsync(fullPath)
    if (!stat.isFile()) throw new Error('目标不是文件')
    if (stat.size > (this.options.maxFileSize ?? 10 * 1024 * 1024)) {
      throw new Error(`文件过大 (${(stat.size / 1024 / 1024).toFixed(2)}MB)，超过限制 ${(this.options.maxFileSize! / 1024 / 1024).toFixed(2)}MB`)
    }

    const content = await readFileAsync(fullPath, encoding as BufferEncoding)
    const info: FileInfo = {
      name: path.basename(fullPath),
      path: filePath,
      size: stat.size,
      type: 'file',
      modifiedAt: stat.mtime,
      createdAt: stat.birthtime,
      extension: path.extname(fullPath).slice(1),
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            meta: info,
            content,
            encoding,
            readAt: new Date().toISOString(),
          }, null, 2),
        },
      ],
    }
  }

  async writeFile(
    filePath: string,
    content: string,
    encoding: string = 'utf-8',
    createDirs: boolean = false
  ): Promise<MCPToolResult> {
    this.validatePath(filePath)
    const fullPath = this.resolvePath(filePath)

    if (createDirs) {
      const dir = path.dirname(fullPath)
      await mkdirAsync(dir, { recursive: true }).catch(() => {})
    }

    await writeFileAsync(fullPath, content, encoding as BufferEncoding)

    const stat = await statAsync(fullPath)
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          path: filePath,
          size: stat.size,
          writtenAt: new Date().toISOString(),
        }),
      }],
    }
  }

  async listDirectory(
    dirPath: string,
    recursive: boolean = false,
    pattern?: string,
    showHidden: boolean = false
  ): Promise<MCPToolResult> {
    this.validatePath(dirPath)
    const fullPath = this.resolvePath(dirPath)

    const entries = await this.readDirRecursive(fullPath, recursive, pattern, showHidden, 0)
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          path: dirPath,
          totalEntries: entries.length,
          entries,
          listedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  private async readDirRecursive(
    dirPath: string,
    recursive: boolean,
    pattern: string | undefined,
    showHidden: boolean,
    currentDepth: number
  ): Promise<DirectoryEntry[]> {
    let entries: DirectoryEntry[] = []

    try {
      const items = await readdirAsync(dirPath, { withFileTypes: true })

      for (const item of items) {
        if (!showHidden && item.name.startsWith('.')) continue

        const relativePath = path.relative(
          this.options.allowedPaths[0],
          path.join(dirPath, item.name)
        )

        const entry: DirectoryEntry = {
          name: item.name,
          path: relativePath,
          isDirectory: item.isDirectory(),
        }

        if (!item.isDirectory()) {
          try {
            const stat = await statAsync(path.join(dirPath, item.name))
            entry.size = stat.size
            entry.modifiedAt = stat.mtime
          } catch {
            // Ignore stat errors for individual files
          }
        }

        if (pattern && !this.matchPattern(item.name, pattern)) continue

        entries.push(entry)

        if (recursive && item.isDirectory() && currentDepth < 20) {
          const subEntries = await this.readDirRecursive(
            path.join(dirPath, item.name),
            recursive,
            pattern,
            showHidden,
            currentDepth + 1
          )
          entries = entries.concat(subEntries)
        }
      }
      } catch {
        // Ignore directory read errors
      }

      return entries.slice(0, this.options.maxDirEntries ?? 1000)
  }

  private matchPattern(name: string, pattern: string): boolean {
    if (!pattern.includes('*') && !pattern.includes('?')) {
      return name.toLowerCase().includes(pattern.toLowerCase())
    }

    const regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '{{STAR_STAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/, '[^/]')
      .replace(/\{\{STAR_STAR\}\}/g, '.*')

    return new RegExp(`^${regexStr}$`, 'i').test(name)
  }

  async getFileInfo(targetPath: string): Promise<MCPToolResult> {
    this.validatePath(targetPath)
    const fullPath = this.resolvePath(targetPath)

    const stat = await statAsync(fullPath)
    const info: FileInfo = {
      name: path.basename(fullPath),
      path: targetPath,
      size: stat.size,
      type: stat.isFile() ? 'file' : stat.isDirectory() ? 'directory' : 'symlink',
      modifiedAt: stat.mtime,
      createdAt: stat.birthtime,
      extension: stat.isFile() ? path.extname(fullPath).slice(1) : undefined,
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
    }
  }

  async createDirectory(dirPath: string, recursive: boolean = false): Promise<MCPToolResult> {
    this.validatePath(dirPath)
    const fullPath = this.resolvePath(dirPath)

    await mkdirAsync(fullPath, { recursive })

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, path: dirPath, created: true }),
      }],
    }
  }

  async moveFile(source: string, destination: string, overwrite: boolean = false): Promise<MCPToolResult> {
    this.validatePath(source)
    this.validatePath(destination)

    const srcPath = this.resolvePath(source)
    const destPath = this.resolvePath(destination)

    if (!overwrite) {
      try {
        await statAsync(destPath)
        throw new Error('目标已存在且 overwrite=false')
      } catch (err: any) {
        if (err.message?.includes('目标已存在')) throw err
      }
    }

    await renameAsync(srcPath, destPath)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, from: source, to: destination }),
      }],
    }
  }

  async deleteFile(targetPath: string, force: boolean = false): Promise<MCPToolResult> {
    this.validatePath(targetPath)
    const fullPath = this.resolvePath(targetPath)

    const stat = await statAsync(fullPath)
    if (stat.isDirectory()) {
      const contents = await readdirAsync(fullPath)
      if (contents.length > 0 && !force) {
        throw new Error('目录非空，需要设置 force=true 才能删除')
      }
    }

    await unlinkAsync(fullPath)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, deleted: targetPath }),
      }],
    }
  }

  async searchFiles(
    rootDir: string,
    query: string,
    searchInContent: boolean = false,
    fileTypes?: string[],
    maxResults: number = 50
  ): Promise<MCPToolResult> {
    this.validatePath(rootDir)
    const fullPath = this.resolvePath(rootDir)

    const results: Array<{ path: string; matches?: number; preview?: string }> = []
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const extSet = fileTypes ? new Set(fileTypes.map(e => e.startsWith('.') ? e : `.${e}`)) : null

    await this.searchRecursive(fullPath, regex, searchInContent, extSet, results, maxResults, rootDir, 0)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          rootDir,
          totalFound: results.length,
          results,
          searchedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  private async searchRecursive(
    dirPath: string,
    regex: RegExp,
    searchInContent: boolean,
    extSet: Set<string> | null | undefined,
    results: Array<{ path: string; matches?: number; preview?: string }>,
    maxResults: number,
    basePath: string,
    depth: number
  ): Promise<void> {
    if (results.length >= maxResults || depth > 15) return

    try {
      const items = await readdirAsync(dirPath, { withFileTypes: true })

      for (const item of items) {
        if (item.name.startsWith('.')) continue
        if (results.length >= maxResults) break

        const fullPath = path.join(dirPath, item.name)
        const relativePath = path.relative(basePath, fullPath)

        if (item.isDirectory()) {
          await this.searchRecursive(fullPath, regex, searchInContent, extSet, results, maxResults, basePath, depth + 1)
          continue
        }

        if (extSet && !extSet.has(path.extname(item.name))) continue

        const nameMatch = regex.test(item.name)
        let contentMatch = false
        let preview = ''
        let matchCount = 0

        if (searchInContent && !nameMatch) {
          try {
            const content = await readFileAsync(fullPath, 'utf-8')
            const lines = content.split('\n')
            for (let i = 0; i < lines.length; i++) {
              if (regex.test(lines[i])) {
                matchCount++
                if (!preview) {
                  preview = `L${i + 1}: ${lines[i].slice(0, 200)}`
                }
              }
            }
            contentMatch = matchCount > 0
          } catch {
            // Ignore search content errors
          }
        }

        if (nameMatch || contentMatch) {
          results.push({
            path: relativePath,
            matches: contentMatch ? matchCount : undefined,
            preview: contentMatch ? preview : undefined,
          })
        }
      }
    } catch {
      // Ignore search errors
    }
  }

  async getDirectoryTree(rootPath: string, depth: number = 3, includeSize: boolean = false): Promise<MCPToolResult> {
    this.validatePath(rootPath)
    const fullPath = this.resolvePath(rootPath)

    const tree = await this.buildTree(fullPath, depth, includeSize, 0, rootPath)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(tree, null, 2),
      }],
    }
  }

  private async buildTree(
    dirPath: string,
    maxDepth: number,
    includeSize: boolean,
    currentDepth: number,
    basePath: string
  ): Promise<any> {
    if (maxDepth !== undefined && currentDepth >= maxDepth) {
      return { _truncated: true }
    }

    try {
      const items = await readdirAsync(dirPath, { withFileTypes: true })
      const children: any[] = []
      let totalSize = 0

      for (const item of items) {
        if (item.name.startsWith('.')) continue

        const fullPath = path.join(dirPath, item.name)
        const relativePath = path.relative(basePath, fullPath)

        if (item.isDirectory()) {
          const subtree = await this.buildTree(fullPath, maxDepth, includeSize, currentDepth + 1, basePath)
          children.push({
            name: item.name,
            path: relativePath,
            type: 'directory',
            children: subtree.children || subtree,
          })
        } else {
          let size: number | undefined
          if (includeSize) {
            try {
              const s = await statAsync(fullPath)
              size = s.size
              totalSize += s.size
            } catch {
              // Ignore stat errors for size calculation
            }
          }

          children.push({
            name: item.name,
            path: relativePath,
            type: 'file',
            ext: path.extname(item.name).slice(1),
            size,
          })
        }
      }

      return {
        name: path.basename(dirPath),
        path: path.relative(basePath, dirPath),
        type: 'directory',
        children,
        ...(includeSize ? { totalSize } : {}),
      }
    } catch {
      return { error: '无法读取目录' }
    }
  }

  getStatus(): { name: string; toolsCount: number; allowedPaths: string[]; connected: boolean } {
    return {
      name: 'filesystem',
      toolsCount: this.tools.length,
      allowedPaths: this.options.allowedPaths,
      connected: true,
    }
  }
}
