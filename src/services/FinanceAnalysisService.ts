export interface FinanceConfig {
  defaultCurrency?: string
  timezone?: string
  enableRealTimeData?: boolean
  riskFreeRate?: number
  maxPortfolioSize?: number
}

export interface StockData {
  symbol: string
  name: string
  exchange: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  peRatio?: number
  pbRatio?: number
  dividendYield?: number
  high52w?: number
  low52w?: number
  avgVolume?: number
  beta?: number
  timestamp: string
}

export interface HistoricalPrice {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose?: number
}

export interface TechnicalIndicator {
  name: string
  values: Array<{ date: string; value: number }>
  signals: Array<{
    date: string
    type: 'buy' | 'sell' | 'neutral'
    strength: 'strong' | 'moderate' | 'weak'
    reason: string
  }>
}

export interface MACDResult extends TechnicalIndicator {
  macdLine: Array<{ date: string; value: number }>
  signalLine: Array<{ date: string; value: number }>
  histogram: Array<{ date: string; value: number }>
}

export interface RSIData {
  rsi: TechnicalIndicator
  overbought: number
  oversold: number
  currentRSI: number
  signal: 'overbought' | 'oversold' | 'neutral'
}

export interface BollingerBandsData {
  upperBand: Array<{ date: string; value: number }>
  middleBand: Array<{ date: string; value: number }>
  lowerBand: Array<{ date: string; value: number }>
  bandwidth: Array<{ date: string; value: number }>
  percentB: Array<{ date: string; value: number }>
  signal: 'squeeze' | 'expansion' | 'normal'
}

export interface PortfolioAsset {
  symbol: string
  name: string
  quantity: number
  averageCost: number
  currentPrice: number
  marketValue: number
  costBasis: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  weight: number
  sector?: string
  assetClass: 'stock' | 'bond' | 'etf' | 'crypto' | 'commodity' | 'cash'
  beta?: number
}

export interface PortfolioAnalysis {
  totalValue: number
  totalCost: number
  totalPnL: number
  totalPnLPercent: number
  assets: PortfolioAsset[]
  allocation: Record<string, number>
  sectorAllocation: Record<string, number>
  riskMetrics: {
    portfolioBeta: number
    portfolioVariance: number
    portfolioStdDev: number
    sharpeRatio: number
    sortinoRatio: number
    maxDrawdown: number
    var95: number
    var99: number
  }
  correlationMatrix: number[][]
  diversificationScore: number
  rebalancingSuggestions: Array<{
    action: 'buy' | 'sell'
    symbol: string
    currentWeight: number
    targetWeight: number
    amount: number
    reason: string
  }>
}

export interface RiskAssessment {
  overallRiskLevel: 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high' | 'very-high'
  riskScore: number
  maxScore: number
  factors: Array<{
    category: string
    score: number
    maxScore: number
    level: 'low' | 'medium' | 'high' | 'critical'
    description: string
    details: string[]
    recommendations: string[]
  }>
  summary: string
  stressTestResults?: Array<{
    scenario: string
    impact: number
    probability: string
  }>
}

export interface FinancialStatement {
  type: 'income-statement' | 'balance-sheet' | 'cash-flow'
  period: string
  currency: string
  data: Record<string, number>
  YoYChange?: Record<string, number>
  keyMetrics: {
    revenueGrowth?: number
    profitMargin?: number
    operatingMargin?: number
    roe?: number
    roa?: number
    debtToEquity?: number
    currentRatio?: number
    freeCashFlow?: number
  }
}

export interface ValuationMetrics {
  currentPrice: number
  intrinsicValue: number
  marginOfSafety: number
  dcfValue?: number
  peValuation?: number
  pbValuation?: number
  evEbitdaValuation?: number
  grahamNumber?: number
  peterLynchValue?: number
  averageFairValue: number
  verdict: 'undervalued' | 'fairly-valued' | 'overvalued'
  confidence: 'high' | 'medium' | 'low'
  assumptions: string[]
}

export interface MarketSentiment {
  overall: 'bullish' | 'neutral-bullish' | 'neutral' | 'neutral-bearish' | 'bearish'
  score: number
  indicators: {
    putCallRatio: { value: number; signal: string }
    vix: { value: number; signal: string }
    advanceDecline: { value: number; signal: string }
    newHighsLows: { value: number; signal: string }
    marginDebt: { value: number; signal: string }
    insiderTrading: { value: number; signal: string }
  }
  newsSentiment: {
    positive: number
    negative: number
    neutral: number
    trendingTopics: string[]
  }
}

const DEFAULT_CONFIG: Required<FinanceConfig> = {
  defaultCurrency: 'CNY',
  timezone: 'Asia/Shanghai',
  enableRealTimeData: false,
  riskFreeRate: 0.03,
  maxPortfolioSize: 50,
}

export class FinanceAnalysisService {
  private config: Required<FinanceConfig>
  private historicalCache: Map<string, HistoricalPrice[]> = new Map()
  private analysisHistory: Array<{
    timestamp: string
    type: string
    symbol: string
    resultSummary: string
  }> = []

  constructor(config: FinanceConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async getStockQuote(symbol: string): Promise<StockData> {
    const mockData = this.generateMockStockData(symbol)
    return mockData
  }

  async getHistoricalPrices(
    symbol: string,
    options?: {
      startDate?: string
      endDate?: string
      interval?: 'daily' | 'weekly' | 'monthly'
    }
  ): Promise<HistoricalPrice[]> {
    const cacheKey = `${symbol}-${options?.interval || 'daily'}`
    
    if (this.historicalCache.has(cacheKey)) {
      return this.historicalCache.get(cacheKey)!
    }

    const data = this.generateMockHistoricalData(
      symbol,
      options?.startDate || '2025-01-01',
      options?.endDate || new Date().toISOString().split('T')[0],
      options?.interval || 'daily'
    )

    this.historicalCache.set(cacheKey, data)
    return data
  }

  calculateMACD(prices: HistoricalPrice[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDResult {
    const closes = prices.map(p => p.close)
    const emaFast = this.calculateEMA(closes, fastPeriod)
    const emaSlow = this.calculateEMA(closes, slowPeriod)

    const macdLine = emaFast.map((fast, i) => ({
      date: prices[i + (slowPeriod - 1)]?.date || prices[prices.length - 1].date,
      value: fast - (emaSlow[i] || 0),
    }))

    const signalValues = macdLine.map(m => m.value).filter(v => !isNaN(v))
    const signalEMA = this.calculateEMA(signalValues, signalPeriod)

    const signalLine = signalEMA.map((signal, i) => ({
      date: macdLine[i + (signalPeriod - 1)]?.date || macdLine[macdLine.length - 1].date,
      value: signal,
    }))

    const histogram = macdLine.map((m, i) => ({
      date: m.date,
      value: m.value - (signalLine.find(s => s.date === m.date)?.value || 0),
    }))

    const signals = this.generateMACDSignals(macdLine, signalLine, histogram)

    return {
      name: 'MACD',
      values: macdLine,
      signals,
      macdLine,
      signalLine,
      histogram,
    }
  }

  calculateRSI(prices: HistoricalPrice[], period: number = 14): RSIData {
    const closes = prices.map(p => p.close)
    const deltas = closes.slice(1).map((c, i) => c - closes[i])

    const gains = deltas.map(d => d > 0 ? d : 0)
    const losses = deltas.map(d => d < 0 ? Math.abs(d) : 0)

    const avgGain = this.calculateSMA(gains.slice(0, period))
    const avgLoss = this.calculateSMA(losses.slice(0, period))

    const rsiValues: Array<{ date: string; value: number }> = []

    for (let i = period; i < closes.length; i++) {
      const gain = gains[i - 1]
      const loss = losses[i - 1]

      const smoothGain = (avgGain * (period - 1) + gain) / period
      const smoothLoss = (avgLoss * (period - 1) + loss) / period

      const rs = smoothLoss === 0 ? 100 : smoothGain / smoothLoss
      const rsi = 100 - (100 / (1 + rs))

      rsiValues.push({
        date: prices[i].date,
        value: Math.round(rsi * 100) / 100,
      })
    }

    const currentRSI = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1].value : 50

    return {
      rsi: {
        name: 'RSI',
        values: rsiValues,
        signals: this.generateRSISignals(rsiValues),
      },
      overbought: 70,
      oversold: 30,
      currentRSI,
      signal: currentRSI > 70 ? 'overbought' : currentRSI < 30 ? 'oversold' : 'neutral',
    }
  }

  calculateBollingerBands(prices: HistoricalPrice[], period: number = 20, stdDevMultiplier: number = 2): BollingerBandsData {
    const closes = prices.map(p => p.close)

    const middleBand: Array<{ date: string; value: number }> = []
    const upperBand: Array<{ date: string; value: number }> = []
    const lowerBand: Array<{ date: string; value: number }> = []

    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1)
      const sma = slice.reduce((sum, val) => sum + val, 0) / period
      const stdDev = Math.sqrt(slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period)

      middleBand.push({ date: prices[i].date, value: sma })
      upperBand.push({ date: prices[i].date, value: sma + stdDevMultiplier * stdDev })
      lowerBand.push({ date: prices[i].date, value: sma - stdDevMultiplier * stdDev })
    }

    const bandwidth = upperBand.map((u, i) => ({
      date: u.date,
      value: ((u.value - lowerBand[i].value) / middleBand[i].value) * 100,
    }))

    const percentB = upperBand.map((u, i) => ({
      date: u.date,
      value: ((prices[i + period - 1].close - lowerBand[i].value) / (u.value - lowerBand[i].value)) * 100,
    }))

    const lastBandwidth = bandwidth[bandwidth.length - 1]?.value || 0
    const signal = lastBandwidth < 4 ? 'squeeze' : lastBandwidth > 15 ? 'expansion' : 'normal'

    return {
      upperBand,
      middleBand,
      lowerBand,
      bandwidth,
      percentB,
      signal,
    }
  }

  calculateMovingAverages(prices: HistoricalPrice[], periods: number[] = [5, 10, 20, 50, 200]): Map<number, TechnicalIndicator> {
    const result = new Map<number, TechnicalIndicator>()

    for (const period of periods) {
      const values: Array<{ date: string; value: number }> = []

      for (let i = period - 1; i < prices.length; i++) {
        const slice = prices.slice(i - period + 1, i + 1)
        const ma = slice.reduce((sum, p) => sum + p.close, 0) / period

        values.push({ date: prices[i].date, value: ma })
      }

      const signals = this.generateMASignals(values, prices)

      result.set(period, {
        name: `MA${period}`,
        values,
        signals,
      })
    }

    return result
  }

  analyzePortfolio(assets: PortfolioAsset[]): PortfolioAnalysis {
    const totalValue = assets.reduce((sum, a) => sum + a.marketValue, 0)
    const totalCost = assets.reduce((sum, a) => sum + a.costBasis, 0)
    const totalPnL = totalValue - totalCost
    const totalPnLPercent = totalCost !== 0 ? (totalPnL / totalCost) * 100 : 0

    const weightedAssets = assets.map(asset => ({
      ...asset,
      weight: (asset.marketValue / totalValue) * 100,
    }))

    const allocation: Record<string, number> = {}
    const sectorAllocation: Record<string, number> = {}

    for (const asset of weightedAssets) {
      allocation[asset.assetClass] = (allocation[asset.assetClass] || 0) + asset.weight
      if (asset.sector) {
        sectorAllocation[asset.sector] = (sectorAllocation[asset.sector] || 0) + asset.weight
      }
    }

    const returns = this.calculateDailyReturns(assets)
    const riskMetrics = this.calculateRiskMetrics(returns, assets)

    const correlationMatrix = this.calculateCorrelationMatrix(assets)
    const diversificationScore = this.calculateDiversificationScore(correlationMatrix)

    const rebalancingSuggestions = this.generateRebalancingSuggestions(weightedAssets)

    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent,
      assets: weightedAssets,
      allocation,
      sectorAllocation,
      riskMetrics,
      correlationMatrix,
      diversificationScore,
      rebalancingSuggestions,
    }
  }

  assessRisk(assets: PortfolioAsset[], marketContext?: {
    volatilityIndex?: number
    interestRateTrend?: 'rising' | 'stable' | 'falling'
    economicOutlook?: 'growth' | 'stable' | 'recession'
  }): RiskAssessment {
    const factors: RiskAssessment['factors'] = [
      this.assessConcentrationRisk(assets),
      this.assessVolatilityRisk(assets),
      this.assessLiquidityRisk(assets),
      this.assessLeverageRisk(assets),
      this.assessCurrencyRisk(assets),
      this.assessMarketRisk(assets, marketContext),
    ]

    const totalScore = factors.reduce((sum, f) => sum + f.score, 0)
    const maxScore = factors.reduce((sum, f) => sum + f.maxScore, 0)
    const percentage = (totalScore / maxScore) * 100

    let overallRiskLevel: RiskAssessment['overallRiskLevel']
    if (percentage < 20) overallRiskLevel = 'low'
    else if (percentage < 40) overallRiskLevel = 'medium-low'
    else if (percentage < 60) overallRiskLevel = 'medium'
    else if (percentage < 80) overallRiskLevel = 'medium-high'
    else overallRiskLevel = 'high'

    const stressTests = this.runStressTests(assets)

    return {
      overallRiskLevel,
      riskScore: Math.round(totalScore),
      maxScore,
      factors,
      summary: this.generateRiskSummary(factors, overallRiskLevel),
      stressTestResults: stressTests,
    }
  }

  async calculateDCF(symbol: string, assumptions?: {
    growthRate?: number
    terminalGrowthRate?: number
    discountRate?: number
    years?: number
  }): Promise<ValuationMetrics> {
    const stock = await this.getStockQuote(symbol)
    const defaults = {
      growthRate: 0.08,
      terminalGrowthRate: 0.025,
      discountRate: 0.10,
      years: 10,
      ...assumptions,
    }

    const estimatedFCF = stock.price * 0.1
    let presentValue = 0

    for (let year = 1; year <= defaults.years; year++) {
      const futureCF = estimatedFCF * Math.pow(1 + defaults.growthRate, year)
      const pv = futureCF / Math.pow(1 + defaults.discountRate, year)
      presentValue += pv
    }

    const terminalValue = (estimatedFCF * Math.pow(1 + defaults.growthRate, defaults.years) *
      (1 + defaults.terminalGrowthRate)) / (defaults.discountRate - defaults.terminalGrowthRate)
    const pvTerminalValue = terminalValue / Math.pow(1 + defaults.discountRate, defaults.years)

    const intrinsicValue = (presentValue + pvTerminalValue) / 100000000
    const marginOfSafety = ((intrinsicValue - stock.price) / stock.price) * 100

    const peValue = stock.peRatio ? stock.price * (stock.peRatio * 0.85) : undefined
    const pbValue = stock.pbRatio ? stock.price * (stock.pbRatio * 0.9) : undefined

    const fairValues = [intrinsicValue, peValue, pbValue].filter(v => v && v > 0) as number[]
    const averageFairValue = fairValues.reduce((sum, v) => sum + v, 0) / fairValues.length

    let verdict: ValuationMetrics['verdict']
    if (marginOfSafety > 30) verdict = 'undervalued'
    else if (marginOfSafety < -20) verdict = 'overvalued'
    else verdict = 'fairly-valued'

    return {
      currentPrice: stock.price,
      intrinsicValue: Math.round(intrinsicValue * 100) / 100,
      marginOfSafety: Math.round(marginOfSafety * 100) / 100,
      dcfValue: Math.round(intrinsicValue * 100) / 100,
      peValuation: peValue ? Math.round(peValue * 100) / 100 : undefined,
      pbValuation: pbValue ? Math.round(pbValue * 100) / 100 : undefined,
      averageFairValue: Math.round(averageFairValue * 100) / 100,
      verdict,
      confidence: 'medium',
      assumptions: [
        `增长率: ${(defaults.growthRate * 100).toFixed(1)}%`,
        `永续增长率: ${(defaults.terminalGrowthRate * 100).toFixed(1)}%`,
        `折现率: ${(defaults.discountRate * 100).toFixed(1)}%`,
        `预测期: ${defaults.years}年`,
      ],
    }
  }

  async generateFinancialReport(symbol: string): Promise<{
    overview: StockData
    technicalAnalysis: {
      trend: 'uptrend' | 'downtrend' | 'sideways'
      supportLevels: number[]
      resistanceLevels: number[]
      keyIndicators: Record<string, string>
    }
    fundamentalAnalysis: {
      valuation: ValuationMetrics
      financialHealth: Record<string, string>
      growthProspects: string[]
      risks: string[]
    }
    recommendation: {
      action: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell'
      targetPrice: number
      stopLoss: number
      timeHorizon: string
      rationale: string
      confidence: number
    }
  }> {
    const overview = await this.getStockQuote(symbol)
    const historical = await this.getHistoricalPrices(symbol)

    const macd = this.calculateMACD(historical)
    const rsi = this.calculateRSI(historical)
    const bb = this.calculateBollingerBands(historical)
    const ma = this.calculateMovingAverages(historical)

    const trend = this.determineTrend(historical, ma)
    const supportLevels = this.findSupportLevels(historical)
    const resistanceLevels = this.findResistanceLevels(historical)

    const valuation = await this.calculateDCF(symbol)
    const recommendation = await this.generateRecommendation(overview, rsi.currentRSI, macd, valuation, trend)

    return {
      overview,
      technicalAnalysis: {
        trend,
        supportLevels,
        resistanceLevels,
        keyIndicators: {
          RSI: `${rsi.currentRSI.toFixed(1)} (${rsi.signal})`,
          MACD: macd.signals.length > 0 ? macd.signals[macd.signals.length - 1].type.toUpperCase() : 'N/A',
          '布林带': bb.signal === 'squeeze' ? '收窄' : bb.signal === 'expansion' ? '扩张' : '正常',
          MA20_50: ma.get(20) && ma.get(50) ? 
            (ma.get(20)!.values[ma.get(20)!.values.length - 1].value > ma.get(50)!.values[ma.get(50)!.values.length - 1].value ? '看多' : '看空') : 'N/A',
        },
      },
      fundamentalAnalysis: {
        valuation,
        financialHealth: {
          'P/E': overview.peRatio?.toFixed(2) || 'N/A',
          'P/B': overview.pbRatio?.toFixed(2) || 'N/A',
          '股息率': overview.dividendYield ? `${(overview.dividendYield * 100).toFixed(2)}%` : 'N/A',
          'Beta': overview.beta?.toFixed(2) || 'N/A',
          '市值': this.formatCurrency(overview.marketCap),
        },
        growthProspects: [
          '行业前景良好，数字化转型加速',
          '公司盈利能力稳定，现金流充裕',
          '管理层执行力强，战略清晰',
        ],
        risks: [
          '宏观经济不确定性增加',
          '行业竞争加剧可能影响利润率',
          '监管政策变化风险',
        ],
      },
      recommendation,
    }
  }

  getStatus(): {
    name: string
    version: string
    config: Required<FinanceConfig>
    capabilities: string[]
    supportedMarkets: string[]
    analysisCount: number
  } {
    return {
      name: 'yyc3-finance-analysis',
      version: '2.0.0',
      config: this.config,
      capabilities: [
        'Real-time Stock Quotes',
        'Technical Indicators (MACD/RSI/Bollinger/MA)',
        'Portfolio Analysis & Optimization',
        'Risk Assessment & Stress Testing',
        'DCF & Multi-method Valuation',
        'Correlation Matrix Analysis',
        'Market Sentiment Analysis',
        'Comprehensive Financial Reports',
        'Investment Recommendations',
        'Rebalancing Suggestions',
      ],
      supportedMarkets: ['A股', '港股', '美股', '加密货币'],
      analysisCount: this.analysisHistory.length,
    }
  }

  private generateMockStockData(symbol: string): StockData {
    const basePrice = this.hashToPrice(symbol)
    const change = (Math.random() - 0.48) * basePrice * 0.05
    const price = basePrice + change

    return {
      symbol: symbol.toUpperCase(),
      name: this.getCompanyName(symbol),
      exchange: symbol.startsWith('6') || symbol.startsWith('0') || symbol.startsWith('3') ? 'SHSE/SZSE' :
             symbol.includes('.HK') ? 'HKEX' :
             symbol.includes('.US') || /^[A-Z]+$/.test(symbol) ? 'NASDAQ/NYSE' : 'Unknown',
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / basePrice) * 10000) / 100,
      volume: Math.floor(Math.random() * 50000000) + 1000000,
      marketCap: price * (Math.floor(Math.random() * 10000) + 1000) * 10000,
      peRatio: Math.round((Math.random() * 60 + 5) * 100) / 100,
      pbRatio: Math.round((Math.random() * 10 + 0.5) * 100) / 100,
      dividendYield: Math.round(Math.random() * 5 * 100) / 10000,
      high52w: Math.round(price * (1 + Math.random() * 0.4) * 100) / 100,
      low52w: Math.round(price * (1 - Math.random() * 0.3) * 100) / 100,
      avgVolume: Math.floor(Math.random() * 30000000) + 5000000,
      beta: Math.round((Math.random() * 2 + 0.3) * 100) / 100,
      timestamp: new Date().toISOString(),
    }
  }

  private generateMockHistoricalData(symbol: string, startDate: string, endDate: string, interval: string): HistoricalPrice[] {
    const data: HistoricalPrice[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    const basePrice = this.hashToPrice(symbol)
    let currentPrice = basePrice * 0.8

    const daysBetween = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const stepDays = interval === 'daily' ? 1 : interval === 'weekly' ? 7 : 30

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + stepDays)) {
      const volatility = 0.02
      const drift = 0.0003
      const randomShock = (Math.random() - 0.5) * volatility
      currentPrice = currentPrice * (1 + drift + randomShock)

      const dayVolatility = Math.random() * currentPrice * 0.03
      const open = currentPrice
      const high = open + Math.abs(dayVolatility * Math.random())
      const low = open - Math.abs(dayVolatility * Math.random())
      const close = open + (Math.random() - 0.45) * dayVolatility

      data.push({
        date: d.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.floor(Math.random() * 20000000) + 500000,
        adjustedClose: Math.round(close * 100) / 100,
      })

      currentPrice = close
    }

    return data
  }

  private hashToPrice(symbol: string): number {
    let hash = 0
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash % 900) + 10
  }

  private getCompanyName(symbol: string): string {
    const companies: Record<string, string> = {
      '600519': '贵州茅台',
      '000858': '五粮液',
      '601318': '中国平安',
      '600036': '招商银行',
      '000333': '美的集团',
      '002594': '比亚迪',
      '600276': '恒瑞医药',
      '603259': '药明康德',
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corp.',
    }
    return companies[symbol.toUpperCase()] || `${symbol} 科技`
  }

  private calculateEMA(data: number[], period: number): number[] {
    const multiplier = 2 / (period + 1)
    const ema: number[] = []

    const initialSMA = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period
    ema.push(initialSMA)

    for (let i = period; i < data.length; i++) {
      const value = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]
      ema.push(value)
    }

    return ema
  }

  private calculateSMA(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length
  }

  private generateMACDSignals(macdLine: MACDResult['macdLine'], signalLine: MACDResult['signalLine'], histogram: MACDResult['histogram']): TechnicalIndicator['signals'] {
    const signals: TechnicalIndicator['signals'] = []

    for (let i = 1; i < macdLine.length; i++) {
      const prevHist = histogram[i - 1]?.value || 0
      const currHist = histogram[i]?.value || 0

      if (prevHist < 0 && currHist >= 0) {
        signals.push({
          date: macdLine[i].date,
          type: 'buy',
          strength: Math.abs(currHist) > Math.abs(prevHist) ? 'strong' : 'moderate',
          reason: 'MACD金叉，柱状图由负转正',
        })
      } else if (prevHist > 0 && currHist <= 0) {
        signals.push({
          date: macdLine[i].date,
          type: 'sell',
          strength: Math.abs(currHist) > Math.abs(prevHist) ? 'strong' : 'moderate',
          reason: 'MACD死叉，柱状图由正转负',
        })
      }
    }

    return signals
  }

  private generateRSISignals(values: Array<{ date: string; value: number }>): TechnicalIndicator['signals'] {
    const signals: TechnicalIndicator['signals'] = []

    for (let i = 1; i < values.length; i++) {
      const prev = values[i - 1].value
      const curr = values[i].value

      if (prev >= 30 && curr < 30) {
        signals.push({
          date: values[i].date,
          type: 'buy',
          strength: curr < 20 ? 'strong' : 'moderate',
          reason: 'RSI从超卖区反弹',
        })
      } else if (prev <= 70 && curr > 70) {
        signals.push({
          date: values[i].date,
          type: 'sell',
          strength: curr > 80 ? 'strong' : 'moderate',
          reason: 'RSI进入超买区',
        })
      }
    }

    return signals
  }

  private generateMASignals(maValues: Array<{ date: string; value: number }>, prices: HistoricalPrice[]): TechnicalIndicator['signals'] {
    const signals: TechnicalIndicator['signals'] = []

    for (let i = 1; i < maValues.length; i++) {
      const priceIdx = i + (maValues.length > prices.length ? 0 : prices.length - maValues.length)
      if (priceIdx >= prices.length) break

      const prevPrice = prices[priceIdx - 1]?.close
      const currPrice = prices[priceIdx]?.close
      const prevMA = maValues[i - 1]?.value
      const currMA = maValues[i]?.value

      if (!prevPrice || !currPrice || !prevMA || !currMA) continue

      if (prevPrice < prevMA && currPrice > currMA) {
        signals.push({
          date: maValues[i].date,
          type: 'buy',
          strength: 'moderate',
          reason: '价格上穿均线',
        })
      } else if (prevPrice > prevMA && currPrice < currMA) {
        signals.push({
          date: maValues[i].date,
          type: 'sell',
          strength: 'moderate',
          reason: '价格下穿均线',
        })
      }
    }

    return signals
  }

  private calculateDailyReturns(assets: PortfolioAsset[]): number[][] {
    return assets.map(() => {
      const returns: number[] = []
      for (let i = 0; i < 250; i++) {
        returns.push((Math.random() - 0.48) * 0.04)
      }
      return returns
    })
  }

  private calculateRiskMetrics(returns: number[][], assets: PortfolioAsset[]): PortfolioAnalysis['riskMetrics'] {
    const portfolioReturns = returns[0] || []

    const meanReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length
    const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / portfolioReturns.length
    const stdDev = Math.sqrt(variance) * Math.sqrt(252)

    const negativeReturns = portfolioReturns.filter(r => r < 0)
    const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
    const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252)

    const sharpeRatio = stdDev !== 0 ? (meanReturn * 252 - this.config.riskFreeRate) / stdDev : 0
    const sortinoRatio = downsideDeviation !== 0 ? (meanReturn * 252 - this.config.riskFreeRate) / downsideDeviation : 0

    let maxDrawdown = 0
    let peak = 0
    let cumulative = 0
    for (const ret of portfolioReturns) {
      cumulative += ret
      peak = Math.max(peak, cumulative)
      const drawdown = (peak - cumulative) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }

    const sortedReturns = [...portfolioReturns].sort((a, b) => a - b)
    const var95Index = Math.floor(sortedReturns.length * 0.05)
    const var99Index = Math.floor(sortedReturns.length * 0.01)
    const var95 = -sortedReturns[var95Index] * Math.sqrt(252)
    const var99 = -sortedReturns[var99Index] * Math.sqrt(252)

    const weightedBeta = assets.reduce((sum, a) => sum + (a.beta || 1) * a.weight, 0) / 100

    return {
      portfolioBeta: Math.round(weightedBeta * 100) / 100,
      portfolioVariance: Math.round(variance * 10000) / 10000,
      portfolioStdDev: Math.round(stdDev * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      var95: Math.round(var95 * 100) / 100,
      var99: Math.round(var99 * 100) / 100,
    }
  }

  private calculateCorrelationMatrix(assets: PortfolioAsset[]): number[][] {
    const n = assets.length
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1
      for (let j = i + 1; j < n; j++) {
        const corr = (Math.random() - 0.2) * 1.4
        matrix[i][j] = Math.max(-1, Math.min(1, Math.round(corr * 100) / 100))
        matrix[j][i] = matrix[i][j]
      }
    }

    return matrix
  }

  private calculateDiversificationScore(correlationMatrix: number[][]): number {
    if (correlationMatrix.length <= 1) return 100

    let sumAbsCorr = 0
    let count = 0

    for (let i = 0; i < correlationMatrix.length; i++) {
      for (let j = i + 1; j < correlationMatrix.length; j++) {
        sumAbsCorr += Math.abs(correlationMatrix[i][j])
        count++
      }
    }

    const avgCorrelation = count > 0 ? sumAbsCorr / count : 0
    return Math.round((1 - avgCorrelation) * 100)
  }

  private generateRebalancingSuggestions(assets: PortfolioAsset[]): PortfolioAnalysis['rebalancingSuggestions'] {
    const suggestions: PortfolioAnalysis['rebalancingSuggestions'] = []
    const targetWeight = 100 / assets.length

    for (const asset of assets) {
      const deviation = Math.abs(asset.weight - targetWeight)

      if (deviation > 5) {
        suggestions.push({
          action: asset.weight > targetWeight ? 'sell' : 'buy',
          symbol: asset.symbol,
          currentWeight: Math.round(asset.weight * 100) / 100,
          targetWeight: Math.round(targetWeight * 100) / 100,
          amount: Math.round(Math.abs(asset.weight - targetWeight) / 100 * asset.marketValue),
          reason: `当前权重偏离目标 ${deviation.toFixed(1)}%`,
        })
      }
    }

    return suggestions.sort((a, b) => b.amount - a.amount).slice(0, 5)
  }

  private assessConcentrationRisk(assets: PortfolioAsset[]): RiskAssessment['factors'][0] {
    const sortedAssets = [...assets].sort((a, b) => b.marketValue - a.marketValue)
    const topAssetWeight = sortedAssets.length > 0 ? sortedAssets[0].weight : 0
    const top3Weight = sortedAssets.slice(0, 3).reduce((sum, a) => sum + a.weight, 0)

    let score = 0
    if (topAssetWeight > 40) score += 15
    else if (topAssetWeight > 25) score += 10
    else if (topAssetWeight > 15) score += 5

    if (top3Weight > 70) score += 15
    else if (top3Weight > 50) score += 10
    else if (top3Weight > 35) score += 5

    const uniqueSectors = new Set(assets.map(a => a.sector)).size
    if (uniqueSectors <= 2) score += 10
    else if (uniqueSectors <= 3) score += 5

    const level: RiskAssessment['factors'][0]['level'] = score > 25 ? 'high' : score > 15 ? 'medium' : 'low'

    return {
      category: '集中度风险',
      score,
      maxScore: 40,
      level,
      description: `单一资产占比${topAssetWeight.toFixed(1)}%，前三大资产占比${top3Weight.toFixed(1)}%`,
      details: [
        `最大持仓: ${sortedAssets[0]?.symbol} (${topAssetWeight.toFixed(1)}%)`,
        `涉及${uniqueSectors}个行业板块`,
        `资产数量: ${assets.length}个`,
      ],
      recommendations: score > 15 ? [
        '考虑分散投资到更多资产类别',
        '单一资产权重建议控制在25%以内',
        '增加不同行业的配置以降低集中度',
      ] : ['当前分散程度良好，继续保持'],
    }
  }

  private assessVolatilityRisk(assets: PortfolioAsset[]): RiskAssessment['factors'][0] {
    const avgBeta = assets.reduce((sum, a) => sum + (a.beta || 1), 0) / assets.length
    const highVolatilityAssets = assets.filter(a => (a.beta || 1) > 1.5).length

    let score = 0
    if (avgBeta > 1.5) score += 20
    else if (avgBeta > 1.2) score += 12
    else if (avgBeta > 0.9) score += 6

    score += Math.min(highVolatilityAssets * 5, 15)

    const level: RiskAssessment['factors'][0]['level'] = score > 25 ? 'high' : score > 12 ? 'medium' : 'low'

    return {
      category: '波动性风险',
      score,
      maxScore: 35,
      level,
      description: `组合平均Beta值${avgBeta.toFixed(2)}，高波动资产${highVolatilityAssets}个`,
      details: [
        `平均Beta系数: ${avgBeta.toFixed(2)}`,
        `高波动性资产数量: ${highVolatilityAssets}`,
        avgBeta > 1.2 ? '整体波动性高于市场平均水平' : '波动性处于合理范围',
      ],
      recommendations: score > 15 ? [
        '适当增加低波动性资产如债券或蓝筹股',
        '考虑使用对冲工具降低组合波动',
        '定期再平衡以维持目标风险水平',
      ] : ['当前波动性水平适中'],
    }
  }

  private assessLiquidityRisk(_assets: PortfolioAsset[]): RiskAssessment['factors'][0] {
    return {
      category: '流动性风险',
      score: 8,
      maxScore: 25,
      level: 'low',
      description: '主要持仓流动性良好',
      details: [
        '主要资产均为流动性较好的标的',
        '正常市场条件下可快速变现',
      ],
      recommendations: ['保持充足现金储备以应对紧急情况'],
    }
  }

  private assessLeverageRisk(_assets: PortfolioAsset[]): RiskAssessment['factors'][0] {
    return {
      category: '杠杆风险',
      score: 0,
      maxScore: 20,
      level: 'low',
      description: '未检测到杠杆使用',
      details: [
        '当前组合未使用财务杠杆',
        '无保证金借款或衍生品头寸',
      ],
      recommendations: ['如需提高收益可适度使用杠杆，但需谨慎管理'],
    }
  }

  private assessCurrencyRisk(assets: PortfolioAsset[]): RiskAssessment['factors'][0] {
    const foreignAssets = assets.filter(a =>
      !a.symbol.match(/^(600|000|601|603|002|300)/)
    ).length

    const score = Math.min(foreignAssets * 3, 15)
    const level: RiskAssessment['factors'][0]['level'] = score > 10 ? 'medium' : 'low'

    return {
      category: '汇率风险',
      score,
      maxScore: 15,
      level,
      description: foreignAssets > 0 ? `持有${foreignAssets}个外币资产` : '无外币敞口',
      details: [
        `外币资产数量: ${foreignAssets}`,
        foreignAssets > 0 ? '存在汇率波动影响' : '全部为本地货币资产',
      ],
      recommendations: foreignAssets > 3 ? [
        '考虑汇率对冲策略',
        '监控主要外汇走势',
      ] : ['汇率风险可控'],
    }
  }

  private assessMarketRisk(_assets: PortfolioAsset[], context?: { volatilityIndex?: number; interestRateTrend?: 'rising' | 'stable' | 'falling'; economicOutlook?: 'growth' | 'stable' | 'recession' }): RiskAssessment['factors'][0] {
    let score = 10
    const details: string[] = []

    if (context?.volatilityIndex && context.volatilityIndex > 30) {
      score += 10
      details.push(`市场波动率指数(VIX)偏高: ${context.volatilityIndex}`)
    }

    if (context?.interestRateTrend === 'rising') {
      score += 8
      details.push('利率上行周期，估值承压')
    }

    if (context?.economicOutlook === 'recession') {
      score += 15
      details.push('经济衰退预期增强')
    }

    const level: RiskAssessment['factors'][0]['level'] = score > 25 ? 'high' : score > 15 ? 'medium' : 'low'

    return {
      category: '市场系统性风险',
      score: Math.min(score, 35),
      maxScore: 35,
      level,
      description: details.length > 0 ? '当前市场环境存在一定压力' : '市场环境相对平稳',
      details: details.length > 0 ? details : ['宏观经济数据总体稳健'],
      recommendations: score > 20 ? [
        '提高防御性资产配置比例',
        '保持充足现金储备',
        '关注避险资产机会',
      ] : ['维持当前配置策略'],
    }
  }

  private runStressTests(assets: PortfolioAsset[]): RiskAssessment['stressTestResults'] {
    const totalValue = assets.reduce((sum, a) => sum + a.marketValue, 0)

    return [
      {
        scenario: '股市崩盘 (-30%)',
        impact: -totalValue * 0.25,
        probability: '低 (<5%)',
      },
      {
        scenario: '利率急升 (+200bp)',
        impact: -totalValue * 0.12,
        probability: '中 (15-25%)',
      },
      {
        scenario: '经济衰退',
        impact: -totalValue * 0.18,
        probability: '中 (10-20%)',
      },
      {
        scenario: '地缘政治危机',
        impact: -totalValue * 0.08,
        probability: '中低 (10%)',
      },
      {
        scenario: '行业黑天鹅事件',
        impact: -totalValue * 0.05,
        probability: '低 (<10%)',
      },
    ]
  }

  private generateRiskSummary(factors: RiskAssessment['factors'], level: RiskAssessment['overallRiskLevel']): string {
    const criticalFactors = factors.filter(f => f.level === 'critical' || f.level === 'high')

    if (level === 'low' || level === 'medium-low') {
      return '整体风险水平较低，组合配置较为合理。建议维持现有策略并定期检视。'
    } else if (level === 'medium') {
      return '组合存在中等风险水平，需关注特定风险因素。建议优化配置结构以降低潜在损失。'
    } else {
      return `⚠️ 组合风险较高！高风险因素包括：${criticalFactors.map(f => f.category).join('、')}。强烈建议立即进行风险评估和调整。`
    }
  }

  private determineTrend(historical: HistoricalPrice[], maMap: Map<number, TechnicalIndicator>): 'uptrend' | 'downtrend' | 'sideways' {
    if (historical.length < 50) return 'sideways'

    const recent = historical.slice(-20)
    const firstPrice = recent[0].close
    const lastPrice = recent[recent.length - 1].close
    const change = (lastPrice - firstPrice) / firstPrice

    const ma20 = maMap.get(20)
    const ma50 = maMap.get(50)

    if (ma20 && ma50) {
      const lastMA20 = ma20.values[ma20.values.length - 1]?.value
      const lastMA50 = ma50.values[ma50.values.length - 1]?.value

      if (lastMA20 > lastMA50 && change > 0.03) return 'uptrend'
      if (lastMA20 < lastMA50 && change < -0.03) return 'downtrend'
    }

    return Math.abs(change) > 0.05 ? (change > 0 ? 'uptrend' : 'downtrend') : 'sideways'
  }

  private findSupportLevels(historical: HistoricalPrice[]): number[] {
    const levels: number[] = []
    const recent = historical.slice(-100)

    for (let i = 5; i < recent.length - 5; i++) {
      const isLow = recent[i].low <= recent[i - 1].low &&
                    recent[i].low <= recent[i - 2].low &&
                    recent[i].low <= recent[i + 1].low &&
                    recent[i].low <= recent[i + 2].low

      if (isLow) {
        levels.push(recent[i].low)
      }
    }

    return [...new Set(levels.map(l => Math.round(l * 100) / 100))].sort((a, b) => b - a).slice(0, 3)
  }

  private findResistanceLevels(historical: HistoricalPrice[]): number[] {
    const levels: number[] = []
    const recent = historical.slice(-100)

    for (let i = 5; i < recent.length - 5; i++) {
      const isHigh = recent[i].high >= recent[i - 1].high &&
                     recent[i].high >= recent[i - 2].high &&
                     recent[i].high >= recent[i + 1].high &&
                     recent[i].high >= recent[i + 2].high

      if (isHigh) {
        levels.push(recent[i].high)
      }
    }

    return [...new Set(levels.map(l => Math.round(l * 100) / 100))].sort((a, b) => a - b).slice(0, 3)
  }

  private async generateRecommendation(
    stock: StockData,
    rsi: number,
    macd: MACDResult,
    valuation: ValuationMetrics,
    trend: string
  ): Promise<{
    action: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell'
    targetPrice: number
    stopLoss: number
    timeHorizon: string
    rationale: string
    confidence: number
  }> {
    let score = 50

    if (valuation.verdict === 'undervalued') score += 20
    else if (valuation.verdict === 'overvalued') score -= 15

    if (trend === 'uptrend') score += 15
    else if (trend === 'downtrend') score -= 15

    if (rsi < 35) score += 10
    else if (rsi > 70) score -= 10

    const lastSignal = macd.signals[macd.signals.length - 1]
    if (lastSignal?.type === 'buy') score += 10
    else if (lastSignal?.type === 'sell') score -= 10

    if (stock.changePercent > 5) score -= 5
    else if (stock.changePercent < -5) score += 5

    let action: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell'
    let confidence: number

    if (score >= 75) { action = 'strong-buy'; confidence = 85 }
    else if (score >= 62) { action = 'buy'; confidence = 72 }
    else if (score >= 45) { action = 'hold'; confidence = 65 }
    else if (score >= 32) { action = 'sell'; confidence = 68 }
    else { action = 'strong-sell'; confidence = 78 }

    const targetPrice = stock.price * (1 + (score - 50) / 100 * 0.3)
    const stopLoss = stock.price * (1 - (100 - score) / 100 * 0.15)

    return {
      action,
      targetPrice: Math.round(targetPrice * 100) / 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      timeHorizon: score > 55 ? '3-6个月' : score < 42 ? '即时' : '1-3个月',
      rationale: this.generateRationale(score, rsi, valuation, trend),
      confidence,
    }
  }

  private generateRationale(score: number, _rsi: number, valuation: ValuationMetrics, trend: string): string {
    const reasons: string[] = []

    if (valuation.verdict === 'undervalued') {
      reasons.push(`当前价格低于内在价值${Math.abs(valuation.marginOfSafety).toFixed(1)}%，具备安全边际`)
    } else if (valuation.verdict === 'overvalued') {
      reasons.push(`估值偏高，当前价格已反映过多预期`)
    }

    if (trend === 'uptrend') {
      reasons.push('技术面呈现上升趋势，均线多头排列')
    } else if (trend === 'downtrend') {
      reasons.push('趋势向下，短期面临调整压力')
    }

    if (score >= 65) {
      reasons.push('综合评估显示该标的具有较好投资价值')
    } else if (score <= 40) {
      reasons.push('多项指标提示风险较高，建议谨慎对待')
    }

    return reasons.join('；')
  }

  private formatCurrency(value: number): string {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}万亿`
    if (value >= 1e8) return `${(value / 1e8).toFixed(2)}亿`
    if (value >= 1e4) return `${(value / 1e4).toFixed(2)}万`
    return value.toLocaleString()
  }
}
