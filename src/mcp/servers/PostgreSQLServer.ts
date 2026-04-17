import type { MCPTool, MCPToolResult } from '../types'

export interface PostgreSQLOptions {
  connectionString?: string
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  maxRows?: number
  timeout?: number
  readOnly?: boolean
}

export interface QueryResult {
  columns: string[]
  rows: Record<string, any>[]
  rowCount: number
  affectedRows?: number
  executionTimeMs: number
  query: string
}

export interface TableInfo {
  tableName: string
  schema: string
  columns: ColumnInfo[]
  primaryKey?: string[]
  indexes: IndexInfo[]
  rowCount?: number
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  defaultValue?: string
  isPrimaryKey: boolean
  isUnique: boolean
  comment?: string
}

export interface IndexInfo {
  indexName: string
  columns: string[]
  isUnique: boolean
  isPrimary: boolean
}

export class PostgreSQLServer {
  private options: PostgreSQLOptions
  private tools: MCPTool[]

  constructor(options: PostgreSQLOptions = {}) {
    this.options = {
      maxRows: 1000,
      timeout: 30000,
      readOnly: true,
      ...options,
    }

    this.tools = [
      {
        name: 'query',
        description: '执行只读 SQL 查询（SELECT），返回结果集',
        inputSchema: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: 'SQL SELECT 查询语句',
            },
            params: {
              type: 'array',
              items: { type: 'string' },
              description: '参数化查询的参数值（防止 SQL 注入）',
            },
            limit: {
              type: 'number',
              description: '返回行数上限，默认使用服务器配置',
            },
          },
          required: ['sql'],
        },
      },
      {
        name: 'list_tables',
        description: '列出数据库中的所有表及其基本信息',
        inputSchema: {
          type: 'object',
          properties: {
            schema: {
              type: 'string',
              description: 'Schema 名称过滤（默认 public）',
            },
            includeRowCount: {
              type: 'boolean',
              description: '是否包含每张表的行数统计',
            },
          },
        },
      },
      {
        name: 'describe_table',
        description: '获取表的详细结构信息：列、类型、主键、索引等',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: '表名',
            },
            schema: {
              type: 'string',
              description: 'Schema 名称（默认 public）',
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'list_schemas',
        description: '列出数据库中的所有 Schema',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_database_info',
        description: '获取数据库元信息：版本、大小、编码、时区等',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'explain_query',
        description: '获取 SQL 查询的执行计划（EXPLAIN ANALYZE）',
        inputSchema: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: '要分析的 SQL 查询',
            },
            analyze: {
              type: 'boolean',
              description: '是否执行实际分析（EXPLAIN ANALYZE）',
            },
          },
          required: ['sql'],
        },
      },
      {
        name: 'search_columns',
        description: '搜索包含特定关键词的列名或注释',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: '搜索关键词',
            },
            schema: {
              type: 'string',
              description: '限制搜索的 Schema',
            },
          },
          required: ['keyword'],
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
        case 'query':
          return await this.executeQuery(args.sql, args.params, args.limit)
        case 'list_tables':
          return await this.listTables(args.schema, args.includeRowCount)
        case 'describe_table':
          return await this.describeTable(args.table, args.schema)
        case 'list_schemas':
          return await this.listSchemas()
        case 'get_database_info':
          return await this.getDatabaseInfo()
        case 'explain_query':
          return await this.explainQuery(args.sql, args.analyze)
        case 'search_columns':
          return await this.searchColumns(args.keyword, args.schema)
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

  async executeQuery(sql: string, params?: any[], limit?: number): Promise<MCPToolResult> {
    const normalizedSql = sql.trim().toUpperCase()

    if (!normalizedSql.startsWith('SELECT') && !normalizedSql.startsWith('WITH') && !normalizedSql.startsWith('EXPLAIN')) {
      if (this.options.readOnly !== false) {
        throw new Error('只读模式: 仅允许 SELECT/EXPLAIN 查询')
      }
    }

    const effectiveLimit = limit ?? this.options.maxRows ?? 1000

    if (normalizedSql.startsWith('SELECT') || normalizedSql.startsWith('WITH')) {
      let limitedSql = sql
      if (!normalizedSql.includes('LIMIT') && !normalizedSql.includes('FETCH')) {
        limitedSql = `${sql} LIMIT ${effectiveLimit + 1}`
      }

      try {
        const result = await this.executeRawQuery(limitedSql, params)

        if (result.rows.length > effectiveLimit) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                ...result,
                rows: result.rows.slice(0, effectiveLimit),
                truncated: true,
                totalExceeded: result.rows.length,
                message: `结果已截断至 ${effectiveLimit} 行`,
              }, null, 2),
            }],
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (error) {
        throw new Error(`查询执行失败: ${error instanceof Error ? error.message : error}`)
      }
    }

    const startTime = Date.now()
    const result = await this.executeRawQuery(sql, params)
    const elapsed = Date.now() - startTime

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ...result,
          executionTimeMs: elapsed,
          message: '非 SELECT 语句已执行',
        }, null, 2),
      }],
    }
  }

  private async executeRawQuery(sql: string, _params?: any[]): Promise<QueryResult> {
    const startTime = Date.now()

    try {
      const { default: pg } = await import('pg')

      const config: any = {}
      if (this.options.connectionString) {
        config.connectionString = this.options.connectionString
      } else {
        config.host = this.options.host ?? 'localhost'
        config.port = this.options.port ?? 5432
        config.database = this.options.database ?? 'postgres'
        config.user = this.options.user ?? 'postgres'
        config.password = this.options.password ?? ''
      }

      config.query_timeout = this.options.timeout ?? 30000

      const pool = new pg.Pool(config)
      const client = await pool.connect()

      try {
        const result = await client.query(sql, _params)

        return {
          columns: result.fields?.map((f: any) => f.name) ?? [],
          rows: result.rows as Record<string, any>[],
          rowCount: result.rowCount ?? 0,
          affectedRows: result.rowCount,
          executionTimeMs: Date.now() - startTime,
          query: sql,
        }
      } finally {
        client.release()
        await pool.end()
      }
    } catch (error: any) {
      throw new Error(`PostgreSQL 错误: ${error.message || error}`)
    }
  }

  async listTables(schemaName?: string, includeRowCount: boolean = false): Promise<MCPToolResult> {
    const schemaFilter = schemaName || 'public'

    const sql = `
      SELECT
        t.table_name,
        t.table_schema,
        obj_description(c.oid) AS table_comment,
        ${includeRowCount ? '(SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name) AS row_count' : ''}
      FROM information_schema.tables t
      JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = $1
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `

    const result = await this.executeRawQuery(sql, [schemaFilter])

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          schema: schemaFilter,
          tables: result.rows,
          count: result.rowCount,
          listedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async describeTable(tableName: string, schemaName?: string): Promise<MCPToolResult> {
    const schema = schemaName || 'public'
    const fullTable = `"${schema}"."${tableName}"`

    const columnsSql = `
      SELECT
        c.column_name AS name,
        c.data_type AS type,
        c.is_nullable = 'YES' AS nullable,
        c.column_default AS "defaultValue",
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS "isPrimary",
        CASE WHEN uniq.column_name IS NOT NULL THEN true ELSE false END AS "isUnique",
        pgd.description AS comment,
        c.ordinal_position AS position
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name, kcu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = $1
      ) pk ON pk.column_name = c.column_name AND pk.table_name = $2
      LEFT JOIN (
        SELECT kcu.column_name, kcu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = $1
      ) uniq ON uniq.column_name = c.column_name AND uniq.table_name = $2
      LEFT JOIN pg_catalog.pg_statio_all_tables stat ON stat.relname = $2
      LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = stat.relid AND pgd.objsubid = c.ordinal_position
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position
    `

    const indexesSql = `
      SELECT
        i.relname AS "indexName",
        array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) AS columns,
        ix.indisunique AS "isUnique",
        ix.indisprimary AS "isPrimary"
      FROM pg_index ix
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname = $2 AND nspname = $1
      GROUP BY i.relname, ix.indisunique, ix.indisprimary
      ORDER BY i.relname
    `

    const [columnsResult, indexesResult] = await Promise.all([
      this.executeRawQuery(columnsSql, [schema, tableName]),
      this.executeRawQuery(indexesSql, [schema, tableName]),
    ])

    const info: TableInfo = {
      tableName,
      schema,
      columns: columnsResult.rows.map((r: any) => ({
        name: r.name,
        type: r.type,
        nullable: r.nullable,
        defaultValue: r.defaultValue,
        isPrimaryKey: r.isPrimary,
        isUnique: r.isUnique,
        comment: r.comment,
      })),
      indexes: indexesResult.rows.map((r: any) => ({
        indexName: r.indexName,
        columns: r.columns,
        isUnique: r.isUnique,
        isPrimary: r.isPrimary,
      })),
      primaryKey: columnsResult.rows
        .filter((r: any) => r.isPrimary)
        .map((r: any) => r.name),
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
    }
  }

  async listSchemas(): Promise<MCPToolResult> {
    const sql = `
      SELECT schema_name,
             pg_catalog.obj_description(
               (SELECT oid FROM pg_namespace WHERE nspname = schema_name), 'pg_namespace'
             ) AS description
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `

    const result = await this.executeRawQuery(sql)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          schemas: result.rows,
          count: result.rowCount,
        }, null, 2),
      }],
    }
  }

  async getDatabaseInfo(): Promise<MCPToolResult> {
    const queries = [
      ['version', `SELECT version()`],
      ['size', `SELECT pg_size_pretty(pg_database_size(current_database())) AS size`],
      ['encoding', `SELECT pg_encoding_to_char(encoding) AS encoding FROM pg_database WHERE datname = current_database()`],
      ['timezone', `SHOW timezone`],
      ['activeConnections', `SELECT count(*) AS count FROM pg_stat_activity WHERE state = 'active'`],
      ['totalConnections', `SELECT count(*) AS count FROM pg_stat_activity`],
      ['uptime', `SELECT date_trunc('second', now() - pg_postmaster_start_time()) AS uptime`],
    ] as const

    const results: Record<string, any> = {}

    for (const [key, sql] of queries) {
      try {
        const result = await this.executeRawQuery(sql)
        results[key] = result.rows[0]
      } catch {
        results[key] = { error: '无法获取' }
      }
    }

    results.databaseName = process.env.PGDATABASE || this.options.database || 'unknown'
    results.retrievedAt = new Date().toISOString()

    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    }
  }

  async explainQuery(sql: string, analyze: boolean = false): Promise<MCPToolResult> {
    const explainType = analyze ? 'ANALYZE' : ''
    const explainSql = `EXPLAIN ${explainType} ${sql}`

    const startTime = Date.now()
    const result = await this.executeRawQuery(explainSql)
    const elapsed = Date.now() - startTime

    const planLines = result.rows.map(r =>
      Object.values(r).join(' ')
    )

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          originalQuery: sql,
          analyzed: analyze,
          plan: planLines,
          planningTime: `${elapsed}ms`,
          explainedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  async searchColumns(keyword: string, schemaName?: string): Promise<MCPToolResult> {
    const schema = schemaName || '%'
    const likePattern = `%${keyword.toLowerCase()}%`

    const sql = `
      SELECT
        c.table_schema AS schema,
        c.table_name AS "tableName",
        c.column_name AS name,
        c.data_type AS type,
        pgd.description AS comment
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT cls.relname AS table_name, nsp.nspname AS table_schema, d.description
        FROM pg_description d
        JOIN pg_class cls ON d.objoid = cls.oid
        JOIN pg_namespace nsp ON d.classoid = nsp.oid AND nsp.nspname = c.table_schema
        WHERE d.objsubid = c.ordinal_position
      ) pgd ON TRUE
      WHERE LOWER(c.table_schema) LIKE $1
        AND (LOWER(c.column_name) LIKE $2 OR LOWER(pgd.description) LIKE $2)
      ORDER BY c.table_schema, c.table_name, c.ordinal_position
      LIMIT 200
    `

    const result = await this.executeRawQuery(sql, [schema, likePattern])

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          keyword,
          matches: result.rows,
          matchCount: result.rowCount,
          searchedAt: new Date().toISOString(),
        }, null, 2),
      }],
    }
  }

  getStatus(): {
    name: string
    toolsCount: number
    connected: boolean
    readOnly: boolean
    database: string | undefined
  } {
    return {
      name: 'postgres',
      toolsCount: this.tools.length,
      connected: true,
      readOnly: this.options.readOnly ?? true,
      database: this.options.database,
    }
  }
}
