import { execSync, exec } from 'child_process'
import { promisify } from 'util'
import type { MCPTool, MCPToolResult } from '../types'

const execAsync = promisify(exec)

export interface DockerOptions {
  host?: string
  socketPath?: string
  certPath?: string
  defaultTimeout?: number
}

export interface ContainerInfo {
  id: string
  name: string
  image: string
  status: string
  state: 'running' | 'exited' | 'created' | 'paused' | 'dead' | 'restarting'
  ports: PortMapping[]
  created: string
  sizeRw?: number
  sizeRootFs?: number
  labels: Record<string, string>
  networks: string[]
}

export interface PortMapping {
  containerPort: number
  hostPort?: number
  hostIp?: string
  protocol: 'tcp' | 'udp'
}

export interface ImageInfo {
  id: string
  repository: string
  tag: string
  size: number
  created: string
  labels: Record<string, string>
}

export interface VolumeInfo {
  name: string
  driver: string
  mountpoint: string
  createdAt: string
  size?: number
  containers: string[]
}

export interface NetworkInfo {
  name: string
  id: string
  driver: string
  scope: string
  subnet?: string
  gateway?: string
  containers: Array<{ name: string; ipv4Address?: string }>
}

export interface ContainerStats {
  containerId: string
  name: string
  cpuPercent: number
  memoryUsage: number
  memoryLimit: number
  memoryPercent: number
  networkRx: number
  networkTx: number
  blockRead: number
  blockWrite: number
  pids: number
  timestamp: string
}

export interface DockerEvent {
  action: string
  type: string
  scope: string
  time: number
  actor: { id: string; attributes?: Record<string, string> }
}

const DOCKER_BIN = process.env.DOCKER_BIN || 'docker'

export class DockerServer {
  private options: DockerOptions
  private tools: MCPTool[]

  constructor(options: DockerOptions = {}) {
    this.options = {
      defaultTimeout: 30000,
      ...options,
    }

    this.tools = [
      {
        name: 'list_containers',
        description: '列出所有容器，支持按状态过滤',
        inputSchema: {
          type: 'object',
          properties: {
            all: { type: 'boolean', description: '是否包含已停止的容器' },
            filters: { type: 'object', description: '过滤条件（如 {status: ["running"]}）' },
            limit: { type: 'number', description: '返回数量限制' },
          },
        },
      },
      {
        name: 'inspect_container',
        description: '获取容器的详细配置和状态信息',
        inputSchema: {
          type: 'object',
          properties: {
            containerIdOrName: { type: 'string', description: '容器 ID 或名称' },
          },
          required: ['containerIdOrName'],
        },
      },
      {
        name: 'get_container_stats',
        description: '获取容器的实时资源使用统计（CPU/内存/网络/IO）',
        inputSchema: {
          type: 'object',
          properties: {
            containerIdOrName: { type: 'string' },
            stream: { type: 'boolean', description: '是否持续流式输出（默认 false）' },
          },
          required: ['containerIdOrName'],
        },
      },
      {
        name: 'start_container',
        description: '启动一个或多个容器',
        inputSchema: {
          type: 'object',
          properties: {
            containerIdsOrNames: { type: 'array', items: { type: 'string' }, description: '容器 ID 或名称列表' },
          },
          required: ['containerIdsOrNames'],
        },
      },
      {
        name: 'stop_container',
        description: '停止运行中的容器',
        inputSchema: {
          type: 'object',
          properties: {
            containerIdOrName: { type: 'string' },
            timeout: { type: 'number', description: '强制停止超时时间（秒），默认 10' },
          },
          required: ['containerIdOrName'],
        },
      },
      {
        name: 'restart_container',
        description: '重启容器',
        inputSchema: {
          type: 'object',
          properties: {
            containerIdOrName: { type: 'string' },
            timeout: { type: 'number' },
          },
          required: ['containerIdOrName'],
        },
      },
      {
        name: 'remove_container',
        description: '删除已停止的容器',
        inputSchema: {
          type: 'object',
          properties: {
            containerIdOrName: { type: 'string' },
            force: { type: 'boolean', description: '是否强制删除运行中的容器' },
            volumes: { type: 'boolean', description: '是否同时删除关联的匿名卷' },
          },
          required: ['containerIdOrName'],
        },
      },
      {
        name: 'list_images',
        description: '列出本地镜像',
        inputSchema: {
          type: 'object',
          properties: {
            all: { type: 'boolean', description: '是否显示中间层镜像' },
            filters: { type: 'object' },
            limit: { type: 'number' },
          },
        },
      },
      {
        name: 'pull_image',
        description: '从仓库拉取镜像',
        inputSchema: {
          type: 'object',
          properties: {
            image: { type: 'string', description: '镜像名（如 nginx:latest）' },
            tag: { type: 'string', description: '标签（可选，默认 latest）' },
          },
          required: ['image'],
        },
      },
      {
        name: 'run_container',
        description: '创建并启动新容器',
        inputSchema: {
          type: 'object',
          properties: {
            image: { type: 'string', description: '镜像名称' },
            name: { type: 'string', description: '容器名称' },
            command: { type: 'string', description: '覆盖默认命令' },
            env: { type: 'array', items: { type: 'string' }, description: '环境变量（如 ["PORT=8080"]）' },
            ports: { type: 'array', items: { type: 'string' }, description: '端口映射（如 ["8080:80"]）' },
            volumes: { type: 'array', items: { type: 'string' }, description: '卷挂载（如 ["/host:/container"]）' },
            network: { type: 'string', description: '网络名称' },
            detach: { type: 'boolean', description: '后台运行（默认 true）' },
            restartPolicy: { type: 'string', enum: ['no', 'always', 'unless-stopped', 'on-failure'], description: '重启策略' },
            memoryLimit: { type: 'string', description: '内存限制（如 "512m", "2g"）' },
            cpuLimit: { type: 'number', description: 'CPU 限制（核数）' },
          },
          required: ['image'],
        },
      },
      {
        name: 'exec_command',
        description: '在运行的容器中执行命令',
        inputSchema: {
          type: 'object',
          properties: {
            containerIdOrName: { type: 'string' },
            command: { type: 'string', description: '要执行的命令（如 "ls -la /app"）' },
            workDir: { type: 'string', description: '工作目录' },
            interactive: { type: 'boolean', description: '交互模式（分配 TTY）' },
          },
          required: ['containerIdOrName', 'command'],
        },
      },
      {
        name: 'get_logs',
        description: '获取容器日志',
        inputSchema: {
          type: 'object',
          properties: {
            containerIdOrName: { type: 'string' },
            tail: { type: 'number', description: '最后 N 行日志' },
            since: { type: 'string', description: '起始时间（ISO 8601 或相对时间如 "2h"）' },
            follow: { type: 'boolean', description: '持续跟踪输出' },
            timestamps: { type: 'boolean', description: '是否显示时间戳' },
          },
          required: ['containerIdOrName'],
        },
      },
      {
        name: 'list_volumes',
        description: '列出所有 Docker 卷',
        inputSchema: {
          type: 'object',
          properties: {
            filters: { type: 'object' },
          },
        },
      },
      {
        name: 'list_networks',
        description: '列出所有 Docker 网络',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'docker_info',
        description: '获取 Docker 引擎系统信息',
        inputSchema: {
          type: 'object',
          properties: {},
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
        case 'list_containers':
          return await this.listContainers(args.all, args.filters, args.limit)
        case 'inspect_container':
          return await this.inspectContainer(args.containerIdOrName)
        case 'get_container_stats':
          return await this.getContainerStats(args.containerIdOrName)
        case 'start_container':
          return await this.startContainer(args.containerIdsOrNames)
        case 'stop_container':
          return await this.stopContainer(args.containerIdOrName, args.timeout)
        case 'restart_container':
          return await this.restartContainer(args.containerIdOrName, args.timeout)
        case 'remove_container':
          return await this.removeContainer(args.containerIdOrName, args.force, args.volumes)
        case 'list_images':
          return await this.listImages(args.all, args.filters, args.limit)
        case 'pull_image':
          return await this.pullImage(args.image, args.tag)
        case 'run_container':
          return await this.runContainer(args)
        case 'exec_command':
          return await this.execCommand(args.containerIdOrName, args.command, args.workDir, args.interactive)
        case 'get_logs':
          return await this.getLogs(args.containerIdOrName, args.tail, args.since, args.follow, args.timestamps)
        case 'list_volumes':
          return await this.listVolumes(args.filters)
        case 'list_networks':
          return await this.listNetworks()
        case 'docker_info':
          return await this.getDockerInfo()
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

  private buildDockerCommand(...args: string[]): string {
    const parts = [DOCKER_BIN]

    if (this.options.host) {
      parts.push('--host', this.options.host)
    }
    if (this.options.socketPath) {
      parts.push('--host', `unix://${this.options.socketPath}`)
    }
    if (this.options.certPath) {
      parts.push('--tlscacert', `${this.options.certPath}/ca.pem`)
      parts.push('--tlscert', `${this.options.certPath}/cert.pem`)
      parts.push('--tlskey', `${this.options.certPath}/key.pem`)
      parts.push('--tlsverify')
    }

    parts.push(...args.filter(Boolean))
    return parts.join(' ')
  }

  private async dockerExec(command: string): Promise<{ stdout: string; stderr: string; code: number }> {
    try {
      const fullCommand = this.buildDockerCommand(command)
      const result = await execAsync(fullCommand, {
        timeout: this.options.defaultTimeout ?? 30000,
        maxBuffer: 10 * 1024 * 1024,
      })
      return { stdout: result.stdout || '', stderr: result.stderr || '', code: 0 }
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || String(error),
        code: error.code || 1,
      }
    }
  }

  private parseState(statusStr: string): ContainerInfo['state'] {
    if (statusStr.includes('Up')) return 'running'
    if (statusStr.includes('Exited')) return 'exited'
    if (statusStr.includes('Created')) return 'created'
    if (statusStr.includes('Paused')) return 'paused'
    if (statusStr.includes('Dead')) return 'dead'
    if (statusStr.includes('Restarting')) return 'restarting'
    return 'exited'
  }

  private parsePorts(portsStr: string): PortMapping[] {
    if (!portsStr || portsStr === '' || portsStr === '0.0.0.0:0') return []

    const mappings: PortMapping[] = []
    const portEntries = portsStr.split(', ')

    for (const entry of portEntries) {
      if (!entry || entry === '') continue

      if (entry.includes('->')) {
        const [hostPart, containerPart] = entry.split('->').map(s => s.trim())
        const hostMatch = hostPart.match(/(?:(\d+\.\d+\.\d+\.\d+):)?(\d+)/)
        const containerMatch = containerPart.match(/(\d+)(?:\/(tcp|udp))?/)

        if (hostMatch && containerMatch) {
          mappings.push({
            hostPort: parseInt(hostMatch[2], 10),
            containerPort: parseInt(containerMatch[1], 10),
            hostIp: hostMatch[1],
            protocol: (containerMatch[2] as 'tcp' | 'udp') || 'tcp',
          })
        }
      } else {
        const match = entry.match(/(\d+)(?:\/(tcp|udp))?/)
        if (match) {
          mappings.push({
            containerPort: parseInt(match[1], 10),
            protocol: (match[2] as 'tcp' | 'udp') || 'tcp',
          })
        }
      }
    }

    return mappings
  }

  async listContainers(all: boolean = false, _filters?: Record<string, any>, _limit?: number): Promise<MCPToolResult> {
    const args = all ? ['ps', '-a', '--format', '{{json .}}'] : ['ps', '--format', '{{json .}}']

    const result = await this.dockerExec(args.join(' '))

    if (result.code !== 0) {
      throw new Error(`Docker 命令执行失败: ${result.stderr}`)
    }

    const lines = result.stdout.trim().split('\n').filter(Boolean)
    const containers: ContainerInfo[] = []

    for (const line of lines) {
      try {
        const raw = JSON.parse(line)
        containers.push({
          id: raw.ID?.slice(0, 12),
          name: raw.Names?.replace(/^\//, ''),
          image: raw.Image,
          status: raw.Status,
          state: this.parseState(raw.Status || ''),
          ports: this.parsePorts(raw.Ports || ''),
          created: raw.CreatedAt || '',
          labels: raw.Labels ? (typeof raw.Labels === 'string' ? JSON.parse(raw.Labels) : raw.Labels) : {},
          networks: raw.Networks ? (typeof raw.Networks === 'string' ? raw.Networks.split(',') : raw.Networks) : [],
        })
      } catch {
        // Ignore parsing errors for individual containers
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          total: containers.length,
          running: containers.filter(c => c.state === 'running').length,
          stopped: containers.filter(c => c.state !== 'running').length,
          containers,
          listedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async inspectContainer(idOrName: string): Promise<MCPToolResult> {
    const result = await this.dockerExec(`inspect ${idOrName}`)

    if (result.code !== 0) {
      throw new Error(`检查容器失败: ${result.stderr}`)
    }

    let parsed: any[]
    try {
      parsed = JSON.parse(result.stdout)
    } catch {
      throw new Error('无法解析容器信息')
    }

    if (!parsed || parsed.length === 0) {
      throw new Error(`未找到容器: ${idOrName}`)
    }

    const info = parsed[0]

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          id: info.Id?.slice(0, 12),
          name: info.Name?.replace(/^\//, ''),
          state: info.State?.Status,
          startedAt: info.State?.StartedAt,
          image: info.Config?.Image,
          hostname: info.Config?.Hostname,
          platform: info.Platform,
          restartPolicy: info.HostConfig?.RestartPolicy?.Name,
          networkMode: info.HostConfig?.NetworkMode,
          mounts: info.Mounts?.map((m: any) => ({
            source: m.Source,
            destination: m.Destination,
            mode: m.Mode,
            rw: m.RW,
            type: m.Type,
          })),
          networks: Object.entries(info.NetworkSettings?.Networks || {}).map(([name, net]: [string, any]) => ({
            name,
            ipAddress: net.IPAddress,
            gateway: net.Gateway,
            macAddress: net.MacAddress,
          })),
          config: {
            env: info.Config?.Env,
            exposedPorts: info.Config?.ExposedPorts,
            cmd: info.Config?.Cmd,
            entrypoint: info.Config?.Entrypoint,
          },
          inspectedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async getContainerStats(idOrName: string): Promise<MCPToolResult> {
    const result = await this.dockerExec(`stats --no-stream --format "{{json .}}" ${idOrName}`)

    if (result.code !== 0) {
      throw new Error(`获取统计信息失败: ${result.stderr}`)
    }

    try {
      const raw = JSON.parse(result.stdout.trim())

      const stats: ContainerStats = {
        containerId: raw.CPUPerc ? idOrName.slice(0, 12) : '',
        name: raw.Name?.replace(/^\//, '') || idOrName,
        cpuPercent: parseFloat(raw.CPUPerc?.replace('%', '') || '0'),
        memoryUsage: this.parseMemory(raw.MemUsage || '0B'),
        memoryLimit: this.parseMemory(raw.MemPerc ? '100%' : '0B'),
        memoryPercent: parseFloat(raw.MemPerc?.replace('%', '') || '0'),
        networkRx: this.parseNetIO(raw.NetIO)?.rx || 0,
        networkTx: this.parseNetIO(raw.NetIO)?.tx || 0,
        blockRead: this.parseBlockIO(raw.BlockIO)?.read || 0,
        blockWrite: this.parseBlockIO(raw.BlockIO)?.write || 0,
        pids: parseInt(raw.PIDs || '0', 10),
        timestamp: new Date().toISOString(),
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
      }
    } catch {
      throw new Error('无法解析容器统计数据')
    }
  }

  async startContainer(idsOrNames: string[]): Promise<MCPToolResult> {
    const targets = idsOrNames.join(' ')
    const result = await this.dockerExec(`start ${targets}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: result.code === 0,
          output: result.stdout.trim(),
          error: result.code !== 0 ? result.stderr : undefined,
          containers: idsOrNames,
          action: 'start',
          timestamp: new Date().toISOString(),
        }),
      }],
    }
  }

  async stopContainer(idOrName: string, timeout?: number): Promise<MCPToolResult> {
    const timeoutArg = timeout !== undefined ? `-t ${timeout}` : ''
    const result = await this.dockerExec(`stop ${timeoutArg} ${idOrName}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: result.code === 0,
          output: result.stdout.trim(),
          error: result.code !== 0 ? result.stderr : undefined,
          container: idOrName,
          action: 'stop',
          timeout,
          timestamp: new Date().toISOString(),
        }),
      }],
    }
  }

  async restartContainer(idOrName: string, timeout?: number): Promise<MCPToolResult> {
    const timeoutArg = timeout !== undefined ? `-t ${timeout}` : ''
    const result = await this.dockerExec(`restart ${timeoutArg} ${idOrName}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: result.code === 0,
          output: result.stdout.trim(),
          container: idOrName,
          action: 'restart',
          timestamp: new Date().toISOString(),
        }),
      }],
    }
  }

  async removeContainer(idOrName: string, force?: boolean, volumes?: boolean): Promise<MCPToolResult> {
    const flags = []
    if (force) flags.push('-f')
    if (volumes) flags.push('-v')

    const result = await this.dockerExec(`rm ${flags.join(' ')} ${idOrName}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: result.code === 0,
          output: result.stdout.trim(),
          error: result.code !== 0 ? result.stderr : undefined,
          container: idOrName,
          action: 'remove',
          force,
          removeVolumes: volumes,
          timestamp: new Date().toISOString(),
        }),
      }],
    }
  }

  async listImages(all: boolean = false, _filters?: Record<string, any>, _limit?: number): Promise<MCPToolResult> {
    const args = all ? ['images', '-a', '--format', '{{json .}}'] : ['images', '--format', '{{json .}}']
    const result = await this.dockerExec(args.join(' '))

    if (result.code !== 0) {
      throw new Error(`列出镜像失败: ${result.stderr}`)
    }

    const lines = result.stdout.trim().split('\n').filter(Boolean)
    const images: ImageInfo[] = []

    for (const line of lines) {
      try {
        const raw = JSON.parse(line)
        images.push({
          id: raw.ID?.replace('sha256:', '').slice(0, 12),
          repository: raw.Repository,
          tag: raw.Tag,
          size: this.parseSize(raw.Size || '0B'),
          created: raw.CreatedAt || '',
          labels: raw.Labels ? (typeof raw.Labels === 'string' ? {} : raw.Labels) : {},
        })
      } catch {
        // Ignore image parsing errors
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalImages: images.length,
          totalSize: images.reduce((sum, img) => sum + img.size, 0),
          images,
          listedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async pullImage(image: string, tag?: string): Promise<MCPToolResult> {
    const fullImage = tag ? `${image}:${tag}` : image
    const result = await this.dockerExec(`pull ${fullImage}`)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: result.code === 0,
          image: fullImage,
          output: result.stdout.trim(),
          error: result.code !== 0 ? result.stderr : undefined,
          pulledAt: new Date().toISOString(),
        }),
      }],
    }
  }

  async runContainer(options: Record<string, any>): Promise<MCPToolResult> {
    const { image, name, command, env, ports, volumes, network, detach, restartPolicy, memoryLimit, cpuLimit } = options

    const args: string[] = ['run']

    if (detach !== false) args.push('-d')
    if (name) args.push('--name', name)
    if (restartPolicy) args.push('--restart', restartPolicy)
    if (memoryLimit) args.push('--memory', memoryLimit)
    if (cpuLimit) args.push('--cpus', String(cpuLimit))

    if (env && Array.isArray(env)) {
      for (const e of env) {
        args.push('-e', e)
      }
    }

    if (ports && Array.isArray(ports)) {
      for (const p of ports) {
        args.push('-p', p)
      }
    }

    if (volumes && Array.isArray(volumes)) {
      for (const v of volumes) {
        args.push('-v', v)
      }
    }

    if (network) args.push('--network', network)

    args.push(image)

    if (command) {
      args.push(...command.split(/\s+/))
    }

    const result = await this.dockerExec(args.join(' '))

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: result.code === 0,
          containerId: result.stdout.trim(),
          image,
          name,
          command,
          error: result.code !== 0 ? result.stderr : undefined,
          createdAt: new Date().toISOString(),
        }),
      }],
    }
  }

  async execCommand(idOrName: string, command: string, workDir?: string, interactive?: boolean): Promise<MCPToolResult> {
    const args: string[] = ['exec']

    if (interactive) {
      args.push('-it')
    }

    if (workDir) {
      args.push('-w', workDir)
    }

    args.push(idOrName, ...command.split(/\s+/))

    const result = await this.dockerExec(args.join(' '))

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: result.code === 0,
          container: idOrName,
          command,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.code,
          executedAt: new Date().toISOString(),
        }),
      }],
    }
  }

  async getLogs(idOrName: string, tail?: number, since?: string, follow?: boolean, timestamps?: boolean): Promise<MCPToolResult> {
    const args: string[] = ['logs']

    if (tail) args.push('--tail', String(tail))
    if (since) args.push('--since', since)
    if (follow) args.push('-f')
    if (timestamps) args.push('-t')

    args.push(idOrName)

    const result = await this.dockerExec(args.join(' '))

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          container: idOrName,
          logs: result.stdout,
          truncated: !follow && tail ? true : false,
          tailLines: tail,
          retrievedAt: new Date().toISOString(),
        }),
      }],
    }
  }

  async listVolumes(_filters?: Record<string, any>): Promise<MCPToolResult> {
    const result = await this.dockerExec('volume ls --format "{{json .}}"')

    if (result.code !== 0) {
      throw new Error(`列出卷失败: ${result.stderr}`)
    }

    const lines = result.stdout.trim().split('\n').filter(Boolean)
    const volumeList: VolumeInfo[] = []

    for (const line of lines) {
      try {
        const raw = JSON.parse(line)
        volumeList.push({
          name: raw.Name,
          driver: raw.Driver,
          mountpoint: raw.Mountpoint,
          createdAt: raw.CreatedAt || '',
          containers: [],
        })
      } catch {
        // Ignore volume detail parsing errors
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalVolumes: volumeList.length,
          volumes: volumeList,
          listedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async listNetworks(): Promise<MCPToolResult> {
    const result = await this.dockerExec('network ls --format "{{json .}}"')

    if (result.code !== 0) {
      throw new Error(`列出网络失败: ${result.stderr}`)
    }

    const lines = result.stdout.trim().split('\n').filter(Boolean)
    const networkList: NetworkInfo[] = []

    for (const line of lines) {
      try {
        const raw = JSON.parse(line)
        networkList.push({
          name: raw.Name,
          id: raw.ID?.slice(0, 12),
          driver: raw.Driver,
          scope: raw.Scope,
          containers: [],
        })
      } catch {
        // Ignore network detail parsing errors
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalNetworks: networkList.length,
          networks: networkList,
          listedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async getDockerInfo(): Promise<MCPToolResult> {
    const result = await this.dockerExec('info --format "{{json .}}"')

    if (result.code !== 0) {
      throw new Error(`获取 Docker 信息失败: ${result.stderr}`)
    }

    let info: any
    try {
      info = JSON.parse(result.stdout)
    } catch {
      throw new Error('无法解析 Docker 信息')
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          serverVersion: info.ServerVersion,
          operatingSystem: info.OperatingSystem,
          architecture: info.Architecture,
          CPUs: info.NCPU,
          totalMemory: info.MemTotal,
          dockerRootDir: info.DockerRootDir,
          storageDriver: info.Driver,
          containers: {
            total: info.Containers,
            running: info.ContainersRunning,
            stopped: info.ContainersStopped,
            paused: info.ContainersPaused,
          },
          images: info.Images,
          securityOptions: info.SecurityOptions || [],
          registryMirrors: info.RegistryConfig?.Mirrors || [],
          retrievedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  getStatus(): { name: string; toolsCount: number; connected: boolean; dockerAvailable: boolean } {
    try {
      execSync(`${DOCKER_BIN} info`, { stdio: 'pipe', timeout: 5000 })
      return { name: 'docker', toolsCount: this.tools.length, connected: true, dockerAvailable: true }
    } catch {
      return { name: 'docker', toolsCount: this.tools.length, connected: false, dockerAvailable: false }
    }
  }

  private parseMemory(memStr: string): number {
    const match = memStr.match(/([\d.]+)\s*(KiB|MiB|GiB|TiB|KB|MB|GB|TB|B|%)/i)
    if (!match) return 0

    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()

    switch (unit) {
      case 'B': return value
      case 'KB': case 'KIB': return value * 1024
      case 'MB': case 'MIB': return value * 1024 * 1024
      case 'GB': case 'GIB': return value * 1024 * 1024 * 1024
      case 'TB': case 'TIB': return value * 1024 * 1024 * 1024 * 1024
      default: return value
    }
  }

  private parseSize(sizeStr: string): number {
    return this.parseMemory(sizeStr)
  }

  private parseNetIO(netIoStr: string): { rx: number; tx: number } | null {
    if (!netIoStr) return null

    const match = netIoStr.match(/([\d.]+\s*\w+)\s*\/\s*([\d.]+\s*\w*)/i)
    if (!match) return null

    return {
      rx: this.parseMemory(match[1]),
      tx: this.parseMemory(match[2]),
    }
  }

  private parseBlockIO(blockIoStr: string): { read: number; write: number } | null {
    if (!blockIoStr) return null

    const match = blockIoStr.match(/([\d.]+\s*\w+)\s*\/\s*([\d.]+\s*\w*)/i)
    if (!match) return null

    return {
      read: this.parseMemory(match[1]),
      write: this.parseMemory(match[2]),
    }
  }
}
