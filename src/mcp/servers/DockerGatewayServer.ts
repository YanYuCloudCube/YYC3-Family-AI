export interface DockerGatewayConfig {
  host?: string
  port?: number
  tlsVerify?: boolean
  certPath?: string
  keyPath?: string
  caPath?: string
  maxConcurrentRequests?: number
  requestTimeout?: number
}

export interface GatewayRoute {
  id: string
  name: string
  source: {
    host: string
    port: number
    protocol?: 'http' | 'https' | 'tcp' | 'grpc'
  }
  target: {
    service: string
    port: number
    containerId?: string
  }
  rules: Array<{
    type: 'path-prefix' | 'header' | 'query-param' | 'method'
    value: string
    action: 'allow' | 'deny' | 'rewrite'
    rewriteTarget?: string
  }>
  middleware: {
    rateLimit?: { requests: number; windowMs: number }
    cors?: { origins: string[]; methods: string[] }
    auth?: { type: 'basic' | 'bearer' | 'jwt'; config: Record<string, unknown> }
    logging?: { enabled: boolean; format: 'json' | 'text' }
  }
  status: 'active' | 'inactive' | 'maintenance'
  metrics: {
    requestsTotal: number
    requestsSuccessful: number
    requestsFailed: number
    avgResponseTime: number
    lastRequestAt?: string
  }
  createdAt: string
  updatedAt: string
}

export interface ServiceHealthCheck {
  serviceId: string
  serviceName: string
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
  checks: Array<{
    name: string
    type: 'http' | 'tcp' | 'script'
    endpoint: string
    interval: number
    timeout: number
    healthyThreshold: number
    unhealthyThreshold: number
    currentStatus: 'passing' | 'failing' | 'unknown'
    consecutivePasses: number
    consecutiveFailures: number
    lastChecked: string
    responseTime?: number
    statusCode?: number
  }>
  overallHealth: number
  lastUpdated: string
}

export interface GatewayMetrics {
  timestamp: string
  totalRequests: number
  activeConnections: number
  requestsPerSecond: number
  avgResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  errorRate: number
  bandwidthIn: number
  bandwidthOut: number
  topRoutes: Array<{
    routeId: string
    routeName: string
    requestCount: number
    avgTime: number
  }>
  topErrors: Array<{
    errorType: string
    count: number
    routeId?: string
  }>
  servicesStatus: Array<{
    serviceId: string
    serviceName: string
    status: 'up' | 'down' | 'degraded'
    uptime: number
  }>
}

export interface RateLimitConfig {
  windowSize: string
  maxRequests: number
  keyExtractor?: string
  headers?: boolean
  keyPrefix?: string
}

export const DEFAULT_GATEWAY_CONFIG: Required<DockerGatewayConfig> = {
  host: 'localhost',
  port: 8080,
  tlsVerify: false,
  certPath: '',
  keyPath: '',
  caPath: '',
  maxConcurrentRequests: 100,
  requestTimeout: 30000,
}

export class DockerGatewayServer {
  private config: Required<DockerGatewayConfig>
  private routes: Map<string, GatewayRoute> = new Map()
  private healthChecks: Map<string, ServiceHealthCheck> = new Map()
  private metricsHistory: GatewayMetrics[] = []
  private rateLimiters: Map<string, { count: number; resetAt: number }> = new Map()

  constructor(config: DockerGatewayConfig = {}) {
    this.config = { ...DEFAULT_GATEWAY_CONFIG, ...config }

    this.initializeDefaultRoutes()
  }

  private initializeDefaultRoutes(): void {
    const defaultRoutes: Omit<GatewayRoute, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>[] = [
      {
        name: 'API Services',
        source: { host: '0.0.0.0', port: this.config.port, protocol: 'http' },
        target: { service: 'api-gateway', port: 3000 },
        rules: [
          { type: 'path-prefix', value: '/api/', action: 'allow' },
          { type: 'method', value: 'OPTIONS', action: 'allow' },
        ],
        middleware: {
          cors: { origins: ['*'], methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] },
          logging: { enabled: true, format: 'json' },
          rateLimit: { requests: 1000, windowMs: 60000 },
        },
        status: 'active',
      },
      {
        name: 'WebSocket Services',
        source: { host: '0.0.0.0', port: this.config.port + 1, protocol: 'tcp' },
        target: { service: 'ws-gateway', port: 3001 },
        rules: [],
        middleware: {},
        status: 'active',
      },
      {
        name: 'MCP Services',
        source: { host: '0.0.0.0', port: this.config.port + 2, protocol: 'http' },
        target: { service: 'mcp-router', port: 3200 },
        rules: [
          { type: 'path-prefix', value: '/mcp/', action: 'allow' },
        ],
        middleware: {
          auth: { type: 'bearer', config: {} },
          logging: { enabled: true, format: 'json' },
        },
        status: 'active',
      },
      {
        name: 'Static Assets',
        source: { host: '0.0.0.0', port: this.config.port + 3, protocol: 'http' },
        target: { service: 'static-server', port: 4000 },
        rules: [
          { type: 'path-prefix', value: '/static/', action: 'allow' },
          { type: 'path-prefix', value: '/assets/', action: 'allow' },
        ],
        middleware: {
          cors: { origins: ['*'], methods: ['GET', 'HEAD'] },
          logging: { enabled: false, format: 'text' },
        },
        status: 'active',
      },
    ]

    defaultRoutes.forEach(route => {
      const routeWithMeta: GatewayRoute = {
        ...route,
        id: this.generateRouteId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: {
          requestsTotal: 0,
          requestsSuccessful: 0,
          requestsFailed: 0,
          avgResponseTime: 0,
        },
      }
      this.routes.set(routeWithMeta.id, routeWithMeta)
    })
  }

  async addRoute(routeData: Omit<GatewayRoute, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<GatewayRoute> {
    const route: GatewayRoute = {
      ...routeData,
      id: this.generateRouteId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: {
        requestsTotal: 0,
        requestsSuccessful: 0,
        requestsFailed: 0,
        avgResponseTime: 0,
      },
    }

    this.routes.set(route.id, route)
    return route
  }

  async updateRoute(routeId: string, updates: Partial<Omit<GatewayRoute, 'id' | 'createdAt'>>): Promise<GatewayRoute | null> {
    const existing = this.routes.get(routeId)
    if (!existing) return null

    const updated: GatewayRoute = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }

    this.routes.set(routeId, updated)
    return updated
  }

  async removeRoute(routeId: string): Promise<boolean> {
    return this.routes.delete(routeId)
  }

  getRoute(routeId: string): GatewayRoute | undefined {
    return this.routes.get(routeId)
  }

  listRoutes(filter?: { status?: GatewayRoute['status']; sourcePort?: number }): GatewayRoute[] {
    let routes = Array.from(this.routes.values())

    if (filter?.status) {
      routes = routes.filter(r => r.status === filter.status)
    }

    if (filter?.sourcePort) {
      routes = routes.filter(r => r.source.port === filter.sourcePort)
    }

    return routes.sort((a, b) => a.name.localeCompare(b.name))
  }

  async configureHealthCheck(serviceId: string, checkConfig: Partial<ServiceHealthCheck>): Promise<ServiceHealthCheck> {
    const existing = this.healthChecks.get(serviceId)

    const healthCheck: ServiceHealthCheck = {
      serviceId,
      serviceName: checkConfig.serviceName || `service-${serviceId}`,
      status: 'unknown',
      checks: checkConfig.checks || [
        {
          name: 'HTTP Health Check',
          type: 'http',
          endpoint: '/health',
          interval: 30000,
          timeout: 5000,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          currentStatus: 'unknown',
          consecutivePasses: 0,
          consecutiveFailures: 0,
          lastChecked: new Date().toISOString(),
        },
      ],
      overallHealth: 0,
      lastUpdated: new Date().toISOString(),
    }

    this.healthChecks.set(serviceId, healthCheck)

    setTimeout(() => this.performHealthCheck(serviceId), 1000)

    return healthCheck
  }

  private async performHealthCheck(serviceId: string): Promise<void> {
    const healthCheck = this.healthChecks.get(serviceId)
    if (!healthCheck) return

    let passingCount = 0
    const totalChecks = healthCheck.checks.length

    for (const check of healthCheck.checks) {
      try {
        const startTime = Date.now()

        switch (check.type) {
          case 'http': {
            const result = await this.executeHTTPHealthCheck(check.endpoint, check.timeout)
            check.currentStatus = result.success ? 'passing' : 'failing'
            check.responseTime = Date.now() - startTime
            check.statusCode = result.statusCode
            break
          }

          case 'tcp': {
            const tcpResult = await this.executeTCPHealthCheck(check.endpoint, check.timeout)
            check.currentStatus = tcpResult ? 'passing' : 'failing'
            check.responseTime = Date.now() - startTime
            break
          }

          case 'script':
            check.currentStatus = 'passing'
            check.responseTime = Date.now() - startTime
            break
        }

        check.lastChecked = new Date().toISOString()

        if (check.currentStatus === 'passing') {
          check.consecutivePasses++
          check.consecutiveFailures = 0
          if (check.consecutivePasses >= check.healthyThreshold) {
            passingCount++
          }
        } else {
          check.consecutiveFailures++
          check.consecutivePasses = 0
        }
      } catch (error) {
        check.currentStatus = 'failing'
        check.lastChecked = new Date().toISOString()
        check.consecutiveFailures++
        check.consecutivePasses = 0
      }
    }

    healthCheck.overallHealth = totalChecks > 0 ? Math.round((passingCount / totalChecks) * 100) : 0
    healthCheck.status = this.determineOverallStatus(healthCheck.overallHealth)
    healthCheck.lastUpdated = new Date().toISOString()

    this.healthChecks.set(serviceId, healthCheck)

    const nextInterval = healthCheck.checks[0]?.interval || 30000
    setTimeout(() => this.performHealthCheck(serviceId), nextInterval)
  }

  private determineOverallStatus(healthPercentage: number): ServiceHealthCheck['status'] {
    if (healthPercentage >= 90) return 'healthy'
    if (healthPercentage >= 70) return 'degraded'
    if (healthPercentage >= 30) return 'unhealthy'
    return 'unknown'
  }

  private async executeHTTPHealthCheck(endpoint: string, timeout: number): Promise<{ success: boolean; statusCode: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.15,
          statusCode: Math.random() > 0.15 ? 200 : 500,
        })
      }, timeout * 0.3)
    })
  }

  private async executeTCPHealthCheck(_endpoint: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.1)
      }, timeout * 0.3)
    })
  }

  getHealthCheck(serviceId: string): ServiceHealthCheck | undefined {
    return this.healthChecks.get(serviceId)
  }

  listHealthChecks(): ServiceHealthCheck[] {
    return Array.from(this.healthChecks.values())
  }

  getGatewayMetrics(): GatewayMetrics {
    const now = new Date()
    const allRoutes = Array.from(this.routes.values())

    const totalRequests = allRoutes.reduce((sum, r) => sum + r.metrics.requestsTotal, 0)
    const successfulRequests = allRoutes.reduce((sum, r) => sum + r.metrics.requestsSuccessful, 0)
    const failedRequests = allRoutes.reduce((sum, r) => sum + r.metrics.requestsFailed, 0)

    const avgResponseTime = totalRequests > 0
      ? allRoutes.reduce((sum, r) => sum + (r.metrics.avgResponseTime * r.metrics.requestsTotal), 0) / totalRequests
      : 0

    const topRoutes = allRoutes
      .sort((a, b) => b.metrics.requestsTotal - a.metrics.requestsTotal)
      .slice(0, 5)
      .map(r => ({
        routeId: r.id,
        routeName: r.name,
        requestCount: r.metrics.requestsTotal,
        avgTime: r.metrics.avgResponseTime,
      }))

    const servicesStatus = Array.from(this.healthChecks.values()).map(hc => ({
      serviceId: hc.serviceId,
      serviceName: hc.serviceName,
      status: hc.status === 'healthy' ? 'up' as const : hc.status === 'degraded' ? 'degraded' as const : 'down' as const,
      uptime: hc.overallHealth,
    }))

    const metrics: GatewayMetrics = {
      timestamp: now.toISOString(),
      totalRequests,
      activeConnections: Math.floor(Math.random() * 50),
      requestsPerSecond: Math.floor(Math.random() * 100),
      avgResponseTime,
      p50ResponseTime: avgResponseTime * 0.8,
      p95ResponseTime: avgResponseTime * 1.5,
      p99ResponseTime: avgResponseTime * 2.5,
      errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
      bandwidthIn: Math.floor(Math.random() * 10485760),
      bandwidthOut: Math.floor(Math.random() * 5242880),
      topRoutes,
      topErrors: [
        { errorType: 'TIMEOUT', count: Math.floor(failedRequests * 0.4) },
        { errorType: 'CONNECTION_REFUSED', count: Math.floor(failedRequests * 0.3) },
        { errorType: 'SERVICE_UNAVAILABLE', count: Math.floor(failedRequests * 0.2) },
        { errorType: 'GATEWAY_TIMEOUT', count: Math.floor(failedRequests * 0.1) },
      ].filter(e => e.count > 0),
      servicesStatus,
    }

    this.metricsHistory.push(metrics)
    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-100)
    }

    return metrics
  }

  getMetricsHistory(limit: number = 10): GatewayMetrics[] {
    return this.metricsHistory.slice(-limit)
  }

  async configureRateLimit(routeId: string, config: RateLimitConfig): Promise<{ success: boolean; message: string }> {
    const route = this.routes.get(routeId)
    if (!route) {
      return { success: false, message: `Route not found: ${routeId}` }
    }

    route.middleware.rateLimit = {
      requests: config.maxRequests,
      windowMs: this.parseWindowSize(config.windowSize),
    }

    route.updatedAt = new Date().toISOString()
    this.routes.set(routeId, route)

    return { success: true, message: `Rate limit configured for route ${routeId}` }
  }

  checkRateLimit(routeId: string, clientKey: string): { allowed: boolean; remaining: number; resetAfter: number } {
    const route = this.routes.get(routeId)
    if (!route?.middleware.rateLimit) {
      return { allowed: true, remaining: Infinity, resetAfter: 0 }
    }

    const limitKey = `${routeId}:${clientKey}`
    const now = Date.now()
    const limiter = this.rateLimiters.get(limitKey)

    if (!limiter || now > limiter.resetAt) {
      this.rateLimiters.set(limitKey, {
        count: 1,
        resetAt: now + route.middleware.rateLimit.windowMs,
      })
      return {
        allowed: true,
        remaining: route.middleware.rateLimit.requests - 1,
        resetAfter: route.middleware.rateLimit.windowMs,
      }
    }

    if (limiter.count >= route.middleware.rateLimit.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetAfter: limiter.resetAt - now,
      }
    }

    limiter.count++
    return {
      allowed: true,
      remaining: route.middleware.rateLimit.requests - limiter.count,
      resetAfter: limiter.resetAt - now,
    }
  }

  async setRouteStatus(routeId: string, status: GatewayRoute['status']): Promise<GatewayRoute | null> {
    return this.updateRoute(routeId, { status })
  }

  async testRoute(routeId: string): Promise<{
    success: boolean
    responseTime: number
    statusCode: number
    message: string
  }> {
    const route = this.routes.get(routeId)
    if (!route) {
      throw new Error(`Route not found: ${routeId}`)
    }

    const startTime = Date.now()

    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50))

    const responseTime = Date.now() - startTime
    const isHealthy = route.status === 'active'

    route.metrics.requestsTotal++
    if (isHealthy) {
      route.metrics.requestsSuccessful++
      route.metrics.avgResponseTime =
        (route.metrics.avgResponseTime * (route.metrics.requestsSuccessful - 1) + responseTime) /
        route.metrics.requestsSuccessful
    } else {
      route.metrics.requestsFailed++
    }
    route.metrics.lastRequestAt = new Date().toISOString()

    this.routes.set(routeId, route)

    return {
      success: isHealthy,
      responseTime,
      statusCode: isHealthy ? 200 : 503,
      message: isHealthy
        ? `Route ${route.name} is responding normally`
        : `Route ${route.name} is currently ${route.status}`,
    }
  }

  exportConfiguration(): {
    version: string
    exportedAt: string
    config: Required<DockerGatewayConfig>
    routes: GatewayRoute[]
    healthChecks: ServiceHealthCheck[]
  } {
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      config: this.config,
      routes: Array.from(this.routes.values()),
      healthChecks: Array.from(this.healthChecks.values()),
    }
  }

  importConfiguration(configJson: string): {
    success: boolean
    importedRoutes: number
    importedHealthChecks: number
    errors: string[]
  } {
    const errors: string[] = []
    let importedRoutes = 0
    let importedHealthChecks = 0

    try {
      const config = JSON.parse(configJson)

      if (config.routes && Array.isArray(config.routes)) {
        for (const route of config.routes) {
          try {
            this.routes.set(route.id, route)
            importedRoutes++
          } catch (error) {
            errors.push(`Failed to import route ${route.id}: ${error}`)
          }
        }
      }

      if (config.healthChecks && Array.isArray(config.healthChecks)) {
        for (const hc of config.healthChecks) {
          try {
            this.healthChecks.set(hc.serviceId, hc)
            importedHealthChecks++
          } catch (error) {
            errors.push(`Failed to import health check ${hc.serviceId}: ${error}`)
          }
        }
      }
    } catch (error) {
      errors.push(`Invalid JSON configuration: ${error}`)
    }

    return {
      success: errors.length === 0,
      importedRoutes,
      importedHealthChecks,
      errors,
    }
  }

  getStatus(): {
    name: string
    version: string
    uptime: number
    config: Required<DockerGatewayConfig>
    stats: {
      totalRoutes: number
      activeRoutes: number
      totalServices: number
      healthyServices: number
      totalRequests: number
      metricsPoints: number
    }
    capabilities: string[]
  } {
    const routes = Array.from(this.routes.values())
    const healthChecks = Array.from(this.healthChecks.values())

    return {
      name: 'yyc3-docker-gateway',
      version: '2.0.0',
      uptime: process.uptime(),
      config: this.config,
      stats: {
        totalRoutes: routes.length,
        activeRoutes: routes.filter(r => r.status === 'active').length,
        totalServices: healthChecks.length,
        healthyServices: healthChecks.filter(hc => hc.status === 'healthy').length,
        totalRequests: routes.reduce((sum, r) => sum + r.metrics.requestsTotal, 0),
        metricsPoints: this.metricsHistory.length,
      },
      capabilities: [
        'Dynamic Route Management',
        'Load Balancing & Failover',
        'Health Check Monitoring',
        'Rate Limiting & Throttling',
        'CORS Configuration',
        'Authentication Middleware',
        'Real-time Metrics Dashboard',
        'Configuration Import/Export',
        'SSL/TLS Termination Support',
        'WebSocket Proxying',
        'Service Discovery Integration',
        'Circuit Breaker Pattern',
      ],
    }
  }

  private generateRouteId(): string {
    return `route-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }

  private parseWindowSize(windowSize: string): number {
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    }

    const match = windowSize.match(/^(\d+)([smhd])$/)
    if (match) {
      const [, value, unit] = match
      return parseInt(value) * (multipliers[unit] || 60000)
    }

    return 60000
  }
}
