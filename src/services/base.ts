export enum ServiceErrorCode {
  UNKNOWN = 'SERVICE_UNKNOWN',
  INIT_FAILED = 'SERVICE_INIT_FAILED',
  CONFIG_INVALID = 'SERVICE_CONFIG_INVALID',
  NOT_FOUND = 'SERVICE_NOT_FOUND',
  ALREADY_EXISTS = 'SERVICE_ALREADY_EXISTS',
  OPERATION_FAILED = 'SERVICE_OPERATION_FAILED',
  TIMEOUT = 'SERVICE_TIMEOUT',
  RATE_LIMITED = 'SERVICE_RATE_LIMITED',
  UNAUTHORIZED = 'SERVICE_UNAUTHORIZED',
  VALIDATION_ERROR = 'SERVICE_VALIDATION_ERROR',
  EXTERNAL_API_ERROR = 'SERVICE_EXTERNAL_API_ERROR',
  INTERNAL_ERROR = 'SERVICE_INTERNAL_ERROR',
}

export enum ServiceErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class ServiceError extends Error {
  readonly code: ServiceErrorCode
  readonly severity: ServiceErrorSeverity
  readonly service: string
  readonly timestamp: string
  readonly details?: Record<string, unknown>
  readonly cause?: Error

  constructor(options: {
    message: string
    code?: ServiceErrorCode
    severity?: ServiceErrorSeverity
    service: string
    details?: Record<string, unknown>
    cause?: Error
  }) {
    super(options.message)
    this.name = 'ServiceError'
    this.code = options.code ?? ServiceErrorCode.UNKNOWN
    this.severity = options.severity ?? ServiceErrorSeverity.MEDIUM
    this.service = options.service
    this.timestamp = new Date().toISOString()
    this.details = options.details
    this.cause = options.cause

    Object.setPrototypeOf(this, ServiceError.prototype)
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      service: this.service,
      timestamp: this.timestamp,
      details: this.details,
      cause: this.cause?.message,
    }
  }

  static fromUnknown(error: unknown, service: string): ServiceError {
    if (error instanceof ServiceError) return error
    const message = error instanceof Error ? error.message : String(error)
    return new ServiceError({
      message,
      code: ServiceErrorCode.UNKNOWN,
      service,
      cause: error instanceof Error ? error : undefined,
    })
  }
}

export interface ServiceHealthStatus {
  service: string
  version: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'initializing'
  uptime: number
  timestamp: string
  checks: Array<{
    name: string
    status: 'pass' | 'warn' | 'fail'
    message?: string
    duration?: number
  }>
  metrics?: Record<string, number>
}

export interface BaseServiceConfig {
  enabled?: boolean
  debug?: boolean
  timeout?: number
  retryAttempts?: number
}

export interface ServiceInfo {
  name: string
  version: string
  description: string
  capabilities: string[]
  configSchema?: Record<string, unknown>
}

export interface YYC3Service<TConfig extends BaseServiceConfig = BaseServiceConfig> {
  readonly serviceName: string
  readonly serviceVersion: string

  getStatus(): Record<string, unknown>
  health(): ServiceHealthStatus
  getInfo(): ServiceInfo
  configure(config: Partial<TConfig>): void
  reset(): void
}

export function createServiceHealth(
  service: string,
  version: string,
  startTime: number,
  checks: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; message?: string; duration?: number }>,
  metrics?: Record<string, number>,
): ServiceHealthStatus {
  const hasFail = checks.some(c => c.status === 'fail')
  const hasWarn = checks.some(c => c.status === 'warn')

  return {
    service,
    version,
    status: hasFail ? 'unhealthy' : hasWarn ? 'degraded' : 'healthy',
    uptime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    checks,
    metrics,
  }
}
