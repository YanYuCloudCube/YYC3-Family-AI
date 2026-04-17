export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar' | 'treemap' | 'funnel'

export interface DataColumn {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  values: (string | number | boolean)[]
}

export interface DataRow {
  [key: string]: string | number | boolean
}

export interface DataSet {
  columns: DataColumn[]
  rows: DataRow[]
  name?: string
}

export interface StatisticalSummary {
  count: number
  sum: number | null
  mean: number | null
  median: number | null
  mode: (string | number)[] | null
  min: number | null
  max: number | null
  range: number | null
  variance: number | null
  stdDev: number | null
  quartiles: { q1: number; q2: number; q3: number } | null
  uniqueCount: number
  missingCount: number
  missingRatio: number
}

export interface ChartConfig {
  type: ChartType
  title: string
  xAxis?: { key: string; label: string }
  yAxis?: { key: string; label: string }
  series: Array<{
    key: string
    label: string
    color?: string
    stackId?: string
  }>
  options?: {
    showLegend?: boolean
    showGrid?: boolean
    stacked?: boolean
    horizontal?: boolean
    doughnut?: boolean
    curveType?: 'monotone' | 'linear' | 'step' | 'natural'
    size?: Array<[number, number]>
  }
}

export interface AnalysisResult {
  dataSet: DataSet
  summary: Record<string, StatisticalSummary>
  charts: ChartConfig[]
  insights: string[]
  rawDataPreview: DataRow[]
}

export interface ParseOptions {
  delimiter?: string
  hasHeader?: boolean
  encoding?: string
  sheetIndex?: number
}

export class DataAnalysisService {
  private cache: Map<string, AnalysisResult> = new Map()

  parseCSV(csvText: string, options: ParseOptions = {}): DataSet {
    const delimiter = options.delimiter || ','
    const hasHeader = options.hasHeader !== false

    const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim())

    if (lines.length === 0) {
      throw new Error('CSV content is empty')
    }

    const headerLine = lines[0]
    const rawHeaders = this.splitCSVLine(headerLine, delimiter)

    const headers: string[] = hasHeader
      ? rawHeaders.map(h => h.trim().replace(/^["']|["']$/g, ''))
      : rawHeaders.map((_, i) => `Column_${i + 1}`)

    const dataLines = hasHeader ? lines.slice(1) : lines
    const rows: DataRow[] = []

    for (const line of dataLines) {
      const values = this.splitCSVLine(line, delimiter)
      if (values.length !== headers.length && values.length > 0) continue

      const row: DataRow = {}
      headers.forEach((header, idx) => {
        const val = values[idx]?.trim().replace(/^["']|["']$/g, '') || ''

        const numVal = Number(val)
        if (!isNaN(numVal) && val !== '') {
          row[header] = numVal
        } else if (val.toLowerCase() === 'true') {
          row[header] = true
        } else if (val.toLowerCase() === 'false') {
          row[header] = false
        } else if (val === '') {
          row[header] = ''
        } else {
          row[header] = val
        }
      })

      rows.push(row)
    }

    return this.buildDataSet(headers, rows)
  }

  parseJSON(jsonText: string): DataSet {
    try {
      const parsed = JSON.parse(jsonText)

      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of objects')
      }

      if (parsed.length === 0) {
        throw new Error('JSON array is empty')
      }

      const allKeys = new Set<string>()
      parsed.forEach(item => {
        Object.keys(item).forEach(k => allKeys.add(k))
      })
      const headers = Array.from(allKeys)

      const rows: DataRow[] = parsed.map(item => {
        const row: DataRow = {}
        headers.forEach(h => {
          row[h] = item[h] ?? ''
        })
        return row
      })

      return this.buildDataSet(headers, rows)
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  analyze(dataSet: DataSet, options?: {
    autoDetectCharts?: boolean
    maxCharts?: number
  }): AnalysisResult {
    const summary: Record<string, StatisticalSummary> = {}

    for (const col of dataSet.columns) {
      summary[col.key] = this.computeStatistics(col.values)
    }

    const insights = this.generateInsights(dataSet, summary)

    const charts = options?.autoDetectCharts !== false
      ? this.autoDetectCharts(dataSet, summary, options?.maxCharts ?? 5)
      : []

    const result: AnalysisResult = {
      dataSet,
      summary,
      charts,
      insights,
      rawDataPreview: dataSet.rows.slice(0, 10),
    }

    const cacheKey = JSON.stringify({ name: dataSet.name, rowCount: dataSet.rows.length })
    this.cache.set(cacheKey, result)

    return result
  }

  generateChart(
    dataSet: DataSet,
    type: ChartType,
    config: Partial<ChartConfig> & Pick<ChartConfig, 'type'>
  ): ChartConfig {
    const numericCols = dataSet.columns.filter(c => c.type === 'number')
    const stringCols = dataSet.columns.filter(c => c.type === 'string')

    if (!config.xAxis && stringCols.length > 0) {
      config.xAxis = { key: stringCols[0].key, label: stringCols[0].label }
    }
    if (!config.yAxis && numericCols.length > 0) {
      config.yAxis = { key: numericCols[0].key, label: numericCols[0].label }
    }
    if (!config.series && config.yAxis) {
      config.series = [{
        key: config.yAxis.key,
        label: config.yAxis.label,
      }]
    }
    if (!config.title) {
      config.title = `${dataSet.name || 'Data'} - ${type} Chart`
    }

    return config as ChartConfig
  }

  transform(
    dataSet: DataSet,
    operation: 'filter' | 'sort' | 'group' | 'aggregate' | 'pivot',
    params: Record<string, any>
  ): DataSet {
    switch (operation) {
      case 'filter':
        return this.filterRows(dataSet, params)
      case 'sort':
        return this.sortRows(dataSet, params)
      case 'group':
        return this.groupBy(dataSet, params)
      case 'aggregate':
        return this.aggregate(dataSet, params)
      case 'pivot':
        return this.pivot(dataSet, params)
      default:
        return dataSet
    }
  }

  exportToCSV(dataSet: DataSet): string {
    const headers = dataSet.columns.map(c => c.label)
    const csvLines = [headers.join(',')]

    for (const row of dataSet.rows) {
      const values = dataSet.columns.map(col => {
        const val = row[col.key]
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return String(val ?? '')
      })
      csvLines.push(values.join(','))
    }

    return csvLines.join('\n')
  }

  clearCache(): void {
    this.cache.clear()
  }

  private buildDataSet(headers: string[], rows: DataRow[]): DataSet {
    const columns: DataColumn[] = headers.map(h => {
      const values = rows.map(r => r[h])
      const inferredType = this.inferColumnType(values)

      return {
        key: h,
        label: h,
        type: inferredType,
        values,
      }
    })

    return { columns, rows }
  }

  private inferColumnType(values: (string | number | boolean)[]): DataColumn['type'] {
    const nonEmptyValues = values.filter(v =>
      v !== '' && v !== null && v !== undefined
    )

    if (nonEmptyValues.length === 0) return 'string'

    const numCount = nonEmptyValues.filter(v => typeof v === 'number').length
    const boolCount = nonEmptyValues.filter(v =>
      typeof v === 'boolean' ||
      v === 'true' || v === 'false'
    ).length
    const dateCount = nonEmptyValues.filter(v => {
      if (typeof v !== 'string') return false
      return !isNaN(Date.parse(v))
    }).length

    const total = nonEmptyValues.length

    if (numCount / total > 0.8) return 'number'
    if (boolCount / total > 0.8) return 'boolean'
    if (dateCount / total > 0.5) return 'date'
    return 'string'
  }

  private computeStatistics(values: (string | number | boolean)[]): StatisticalSummary {
    const numValues = values
      .filter(v => typeof v === 'number' && !isNaN(v))
      .map(v => v as number)

    const validValues = values.filter(v => v !== '' && v !== null && v !== undefined)
    const missingCount = values.length - validValues.length

    if (numValues.length === 0) {
      return {
        count: values.length,
        sum: null,
        mean: null,
        median: null,
        mode: null,
        min: null,
        max: null,
        range: null,
        variance: null,
        stdDev: null,
        quartiles: null,
        uniqueCount: new Set(validValues).size,
        missingCount,
        missingRatio: values.length > 0 ? missingCount / values.length : 0,
      }
    }

    numValues.sort((a, b) => a - b)

    const sum = numValues.reduce((s, v) => s + v, 0)
    const mean = sum / numValues.length
    const min = numValues[0]
    const max = numValues[numValues.length - 1]
    const range = max - min

    const median = this.percentile(numValues, 50)
    const q1 = this.percentile(numValues, 25)
    const q3 = this.percentile(numValues, 75)

    const variance = numValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / numValues.length
    const stdDev = Math.sqrt(variance)

    const freqMap = new Map<number | string, number>()
    numValues.forEach(v => freqMap.set(v, (freqMap.get(v) || 0) + 1))

    let maxFreq = 0
    const modes: (string | number)[] = []
    freqMap.forEach((freq, value) => {
      if (freq > maxFreq) {
        maxFreq = freq
        modes.length = 0
        modes.push(value)
      } else if (freq === maxFreq) {
        modes.push(value)
      }
    })

    return {
      count: values.length,
      sum: Math.round(sum * 10000) / 10000,
      mean: Math.round(mean * 10000) / 10000,
      median: Math.round(median * 10000) / 10000,
      mode: modes.length <= 10 ? modes : [],
      min,
      max,
      range: Math.round(range * 10000) / 10000,
      variance: Math.round(variance * 10000) / 10000,
      stdDev: Math.round(stdDev * 10000) / 10000,
      quartiles: {
        q1: Math.round(q1 * 10000) / 10000,
        q2: median,
        q3: Math.round(q3 * 10000) / 10000,
      },
      uniqueCount: new Set(validValues).size,
      missingCount,
      missingRatio: Math.round((missingCount / values.length) * 10000) / 10000,
    }
  }

  private percentile(sortedArr: number[], p: number): number {
    const index = (p / 100) * (sortedArr.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)

    if (lower === upper) return sortedArr[lower]

    return sortedArr[lower] * (upper - index) + sortedArr[upper] * (index - lower)
  }

  private autoDetectCharts(
    dataSet: DataSet,
    summary: Record<string, StatisticalSummary>,
    maxCharts: number
  ): ChartConfig[] {
    const charts: ChartConfig[] = []
    const numericCols = dataSet.columns.filter(c => c.type === 'number')
    const stringCols = dataSet.columns.filter(c => c.type === 'string')

    if (stringCols.length >= 1 && numericCols.length >= 1) {
      charts.push({
        type: 'bar',
        title: `${numericCols[0].label} by ${stringCols[0].label}`,
        xAxis: { key: stringCols[0].key, label: stringCols[0].label },
        yAxis: { key: numericCols[0].key, label: numericCols[0].label },
        series: [{ key: numericCols[0].key, label: numericCols[0].label }],
        options: { showLegend: false, showGrid: true },
      })

      charts.push({
        type: 'line',
        title: `${numericCols[0].label} 趋势`,
        xAxis: { key: stringCols[0].key, label: stringCols[0].label },
        yAxis: { key: numericCols[0].key, label: numericCols[0].label },
        series: [{ key: numericCols[0].key, label: numericCols[0].label }],
        options: { showLegend: false, curveType: 'monotone' },
      })
    }

    if (stringCols.length >= 1 && numericCols.length >= 2) {
      charts.push({
        type: 'area',
        title: '多指标对比',
        xAxis: { key: stringCols[0].key, label: stringCols[0].label },
        yAxis: { key: numericCols[0].key, label: numericCols[0].label },
        series: numericCols.slice(0, 4).map(col => ({
          key: col.key,
          label: col.label,
          color: this.getColorForIndex(numericCols.indexOf(col)),
        })),
        options: { showLegend: true, stacked: false, curveType: 'monotone' },
      })
    }

    if (stringCols.length >= 1 && numericCols.length >= 1) {
      charts.push({
        type: 'pie',
        title: `${stringCols[0].label} 分布`,
        series: [{ key: numericCols[0].key, label: numericCols[0].label }],
        options: { showLegend: true },
      })
    }

    if (numericCols.length >= 2) {
      charts.push({
        type: 'scatter',
        title: `${numericCols[0].label} vs ${numericCols[1].label}`,
        xAxis: { key: numericCols[0].key, label: numericCols[0].label },
        yAxis: { key: numericCols[1].key, label: numericCols[1].label },
        series: [{ key: numericCols[1].key, label: numericCols[1].label }],
        options: { showGrid: true },
      })
    }

    return charts.slice(0, maxCharts)
  }

  private generateInsights(
    dataSet: DataSet,
    summary: Record<string, StatisticalSummary>
  ): string[] {
    const insights: string[] = []
    const numericCols = dataSet.columns.filter(c => c.type === 'number')

    insights.push(`数据集包含 ${dataSet.rows.length} 条记录，${dataSet.columns.length} 个字段`)

    for (const col of numericCols) {
      const stats = summary[col.key]

      if (stats.missingRatio > 0.1) {
        insights.push(`⚠️ "${col.label}" 缺失率 ${Math.round(stats.missingRatio * 100)}%，建议处理缺失值`)
      }

      if (stats.stdDev && stats.mean && stats.mean !== 0) {
        const cv = stats.stdDev / Math.abs(stats.mean)
        if (cv > 1) {
          insights.push(`📊 "${col.label}" 变异系数 ${cv.toFixed(2)}，数据离散程度较高`)
        }
      }

      if (stats.min !== null && stats.max !== null && stats.max > stats.min * 100) {
        insights.push(`📈 "${col.label}" 范围 ${stats.min.toLocaleString()} ~ ${stats.max.toLocaleString()}，极差较大`)
      }

      if (stats.uniqueCount !== null && stats.count > 0) {
        const uniqueness = stats.uniqueCount / stats.count
        if (uniqueness < 0.05) {
          insights.push(`🔑 "${col.label}" 唯一值占比仅 ${(uniqueness * 100).toFixed(1)}%，可能是分类字段`)
        }
      }
    }

    if (numericCols.length >= 2) {
      const firstCol = numericCols[0]
      const secondCol = numericCols[1]
      const correlation = this.pearsonCorrelation(
        firstCol.values as number[],
        secondCol.values as number[]
      )

      if (correlation !== null) {
        const absCorr = Math.abs(correlation)
        if (absCorr > 0.7) {
          insights.push(
            `🔗 "${firstCol.label}" 与 "${secondCol.label}" ${
              correlation > 0 ? '正' : '负'
            }相关 (${correlation.toFixed(3)})`
          )
        }
      }
    }

    return insights
  }

  private pearsonCorrelation(x: number[], y: number[]): number | null {
    const n = Math.min(x.length, y.length)
    if (n < 3) return null

    const xValid: number[] = []
    const yValid: number[] = []

    for (let i = 0; i < n; i++) {
      if (!isNaN(x[i]) && !isNaN(y[i])) {
        xValid.push(x[i])
        yValid.push(y[i])
      }
    }

    if (xValid.length < 3) return null

    const nValid = xValid.length
    const meanX = xValid.reduce((s, v) => s + v, 0) / nValid
    const meanY = yValid.reduce((s, v) => s + v, 0) / nValid

    let sumXY = 0
    let sumX2 = 0
    let sumY2 = 0

    for (let i = 0; i < nValid; i++) {
      const dx = xValid[i] - meanX
      const dy = yValid[i] - meanY
      sumXY += dx * dy
      sumX2 += dx * dx
      sumY2 += dy * dy
    }

    const denom = Math.sqrt(sumX2 * sumY2)
    if (denom === 0) return null

    return Math.round((sumXY / denom) * 1000) / 1000
  }

  private filterRows(dataSet: DataSet, params: Record<string, any>): DataSet {
    const { column, operator, value } = params

    if (!column || !operator) return dataSet

    const filteredRows = dataSet.rows.filter(row => {
      const cellValue = row[column]

      switch (operator) {
        case 'eq': return cellValue === value
        case 'neq': return cellValue !== value
        case 'gt': return typeof cellValue === 'number' && cellValue > value
        case 'gte': return typeof cellValue === 'number' && cellValue >= value
        case 'lt': return typeof cellValue === 'number' && cellValue < value
        case 'lte': return typeof cellValue === 'number' && cellValue <= value
        case 'contains': return String(cellValue).includes(String(value))
        case 'startsWith': return String(cellValue).startsWith(String(value))
        case 'endsWith': return String(cellValue).endsWith(String(value))
        default: return true
      }
    })

    return this.buildDataSet(
      dataSet.columns.map(c => c.key),
      filteredRows
    )
  }

  private sortRows(dataSet: DataSet, params: Record<string, any>): DataSet {
    const { column, order = 'asc' } = params

    if (!column) return dataSet

    const sortedRows = [...dataSet.rows].sort((a, b) => {
      const aVal = a[column]
      const bVal = b[column]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal ?? '')
      const bStr = String(bVal ?? '')
      return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })

    return this.buildDataSet(
      dataSet.columns.map(c => c.key),
      sortedRows
    )
  }

  private groupBy(dataSet: DataSet, params: Record<string, any>): DataSet {
    const { column, aggregations = {} } = params

    if (!column) return dataSet

    const groups = new Map<string, DataRow[]>()

    for (const row of dataSet.rows) {
      const key = String(row[column] ?? 'unknown')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }

    const resultRows: DataRow[] = []
    const aggColumns: DataColumn[] = [
      { key: column, label: column, type: 'string', values: [] },
    ]

    Object.entries(aggregations).forEach(([targetCol, op]) => {
      const aggKey = `${targetCol}_${op}`
      aggColumns.push({
        key: aggKey,
        label: `${targetCol}(${op})`,
        type: 'number',
        values: [],
      })
    })

    groups.forEach((rows, groupKey) => {
      const groupRow: DataRow = { [column]: groupKey }

      Object.entries(aggregations).forEach(([targetCol, op]) => {
        const aggKey = `${targetCol}_${op}`
        const values = rows
          .map(r => r[targetCol])
          .filter(v => typeof v === 'number') as number[]

        let result: number
        switch (op) {
          case 'sum': result = values.reduce((s, v) => s + v, 0); break
          case 'avg': result = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0; break
          case 'min': result = values.length ? Math.min(...values) : 0; break
          case 'max': result = values.length ? Math.max(...values) : 0; break
          case 'count': result = values.length; break
          default: result = values.length
        }

        groupRow[aggKey] = Math.round(result * 10000) / 10000
      })

      resultRows.push(groupRow)
    })

    return { columns: aggColumns, rows: resultRows }
  }

  private aggregate(dataSet: DataSet, params: Record<string, any>): DataSet {
    return this.groupBy(dataSet, {
      column: '__all__',
      aggregations: params.aggregations || {},
    })
  }

  private pivot(_dataSet: DataSet, _params: Record<string, any>): DataSet {
    console.warn('[DataAnalysis] Pivot operation not yet fully implemented')
    return _dataSet
  }

  private splitCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }

  private getColorForIndex(index: number): string {
    const colors = [
      '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
      '#f97316', '#84cc16', '#a855f7', '#0ea5e9',
    ]
    return colors[index % colors.length]
  }
}
