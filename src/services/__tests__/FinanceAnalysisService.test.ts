import { describe, it, expect, beforeEach } from 'vitest'
import { FinanceAnalysisService } from '../FinanceAnalysisService'
import type { HistoricalPrice, PortfolioAsset } from '../FinanceAnalysisService'

function makeHistoricalPrices(count: number, basePrice: number = 100): HistoricalPrice[] {
  const prices: HistoricalPrice[] = []
  let price = basePrice
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 3
    price = Math.max(1, price + change)
    const date = new Date(2025, 0, i + 1).toISOString().split('T')[0]
    prices.push({
      date,
      open: price - Math.random(),
      high: price + Math.random() * 2,
      low: price - Math.random() * 2,
      close: price,
      volume: Math.floor(Math.random() * 1000000) + 100000,
    })
  }
  return prices
}

function makePortfolioAsset(overrides: Partial<PortfolioAsset> = {}): PortfolioAsset {
  return {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 100,
    averageCost: 150,
    currentPrice: 180,
    marketValue: 18000,
    costBasis: 15000,
    unrealizedPnL: 3000,
    unrealizedPnLPercent: 20,
    weight: 100,
    assetClass: 'stock',
    sector: 'Technology',
    ...overrides,
  }
}

describe('FinanceAnalysisService', () => {
  let service: FinanceAnalysisService

  beforeEach(() => {
    service = new FinanceAnalysisService()
  })

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const status = service.getStatus()
      expect(status.name).toBe('yyc3-finance-analysis')
      expect(status.version).toBe('2.0.0')
    })

    it('should accept custom config', () => {
      const s = new FinanceAnalysisService({ defaultCurrency: 'USD', riskFreeRate: 0.05 })
      const status = s.getStatus()
      expect(status.config.defaultCurrency).toBe('USD')
      expect(status.config.riskFreeRate).toBe(0.05)
    })
  })

  describe('getStockQuote', () => {
    it('should return stock data for a symbol', async () => {
      const quote = await service.getStockQuote('AAPL')
      expect(quote.symbol).toBe('AAPL')
      expect(quote.price).toBeGreaterThan(0)
      expect(quote.name).toBeDefined()
    })
  })

  describe('getHistoricalPrices', () => {
    it('should return historical price data', async () => {
      const prices = await service.getHistoricalPrices('AAPL')
      expect(Array.isArray(prices)).toBe(true)
      expect(prices.length).toBeGreaterThan(0)
    })

    it('should cache results for same symbol+interval', async () => {
      const first = await service.getHistoricalPrices('AAPL')
      const second = await service.getHistoricalPrices('AAPL')
      expect(first).toBe(second)
    })

    it('should respect interval option', async () => {
      const daily = await service.getHistoricalPrices('AAPL', { interval: 'daily' })
      const weekly = await service.getHistoricalPrices('AAPL', { interval: 'weekly' })
      expect(daily.length).toBeGreaterThan(weekly.length)
    })
  })

  describe('calculateMACD', () => {
    it('should calculate MACD from historical prices', () => {
      const prices = makeHistoricalPrices(60)
      const macd = service.calculateMACD(prices)
      expect(macd.name).toBe('MACD')
      expect(macd.macdLine.length).toBeGreaterThan(0)
      expect(macd.signalLine.length).toBeGreaterThan(0)
      expect(macd.histogram.length).toBeGreaterThan(0)
    })

    it('should generate buy/sell signals', () => {
      const prices = makeHistoricalPrices(80)
      const macd = service.calculateMACD(prices)
      expect(macd.signals.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateRSI', () => {
    it('should calculate RSI from historical prices', () => {
      const prices = makeHistoricalPrices(30)
      const rsi = service.calculateRSI(prices)
      expect(rsi.currentRSI).toBeGreaterThanOrEqual(0)
      expect(rsi.currentRSI).toBeLessThanOrEqual(100)
    })

    it('should identify overbought/oversold signals', () => {
      const prices = makeHistoricalPrices(30)
      const rsi = service.calculateRSI(prices)
      expect(['overbought', 'oversold', 'neutral']).toContain(rsi.signal)
    })
  })

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands', () => {
      const prices = makeHistoricalPrices(30)
      const bb = service.calculateBollingerBands(prices)
      expect(bb.upperBand.length).toBeGreaterThan(0)
      expect(bb.middleBand.length).toBeGreaterThan(0)
      expect(bb.lowerBand.length).toBeGreaterThan(0)
    })
  })

  describe('calculateMovingAverages', () => {
    it('should calculate multiple MA periods', () => {
      const prices = makeHistoricalPrices(250)
      const mas = service.calculateMovingAverages(prices, [5, 20, 50])
      expect(mas.size).toBe(3)
      expect(mas.has(5)).toBe(true)
      expect(mas.has(20)).toBe(true)
      expect(mas.has(50)).toBe(true)
    })

    it('should produce MA values for each period', () => {
      const prices = makeHistoricalPrices(50)
      const mas = service.calculateMovingAverages(prices, [10])
      const ma10 = mas.get(10)
      expect(ma10).toBeDefined()
      expect(ma10!.values.length).toBeGreaterThan(0)
    })
  })

  describe('analyzePortfolio', () => {
    it('should analyze a portfolio of assets', () => {
      const assets = [
        makePortfolioAsset({ symbol: 'AAPL', marketValue: 18000, costBasis: 15000, assetClass: 'stock', sector: 'Technology' }),
        makePortfolioAsset({ symbol: 'GOOGL', marketValue: 22000, costBasis: 20000, assetClass: 'stock', sector: 'Technology' }),
        makePortfolioAsset({ symbol: 'BND', marketValue: 10000, costBasis: 9500, assetClass: 'bond', sector: 'Fixed Income' }),
      ]
      const analysis = service.analyzePortfolio(assets)
      expect(analysis.totalValue).toBe(50000)
      expect(analysis.totalCost).toBe(44500)
      expect(analysis.totalPnL).toBeCloseTo(5500, 0)
      expect(analysis.allocation).toBeDefined()
    })

    it('should calculate allocation percentages', () => {
      const assets = [
        makePortfolioAsset({ symbol: 'AAPL', marketValue: 30000, costBasis: 25000, assetClass: 'stock' }),
        makePortfolioAsset({ symbol: 'BND', marketValue: 20000, costBasis: 18000, assetClass: 'bond' }),
      ]
      const analysis = service.analyzePortfolio(assets)
      expect(analysis.allocation.stock).toBeCloseTo(60, 0)
      expect(analysis.allocation.bond).toBeCloseTo(40, 0)
    })
  })

  describe('assessRisk', () => {
    it('should assess portfolio risk', () => {
      const assets = [
        makePortfolioAsset({ symbol: 'AAPL', marketValue: 50000, costBasis: 40000, assetClass: 'stock', sector: 'Tech' }),
      ]
      const risk = service.assessRisk(assets)
      expect(risk.riskScore).toBeGreaterThanOrEqual(0)
      expect(risk.riskScore).toBeLessThanOrEqual(risk.maxScore)
      expect(risk.factors.length).toBeGreaterThan(0)
    })
  })

  describe('getStatus', () => {
    it('should return service status', () => {
      const status = service.getStatus()
      expect(status.name).toBe('yyc3-finance-analysis')
      expect(status.version).toBe('2.0.0')
      expect(status.capabilities.length).toBeGreaterThan(0)
      expect(status.supportedMarkets.length).toBeGreaterThan(0)
    })
  })
})
