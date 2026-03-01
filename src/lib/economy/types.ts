export interface TimeSeriesPoint {
  year: number
  value: number
  forecast?: boolean
}

export interface WorldBankIndicator {
  indicator: { id: string; value: string }
  country: { id: string; value: string }
  date: string
  value: number | null
}

export interface IMFDataPoint {
  year: number
  value: number
}

export interface ExchangeRate {
  currency: string
  code: string
  rate: number
  flag: string
}

export interface CSEMarketData {
  aspiIndex: number
  aspiChange: number
  aspiChangePercent: number
  sp20Index: number
  sp20Change: number
  sp20ChangePercent: number
  totalVolume: number
  totalTurnover: number
  totalTrades: number
  marketStatus: string
}

export interface CSETopMover {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

export interface CSESector {
  sector: string
  index: number
  change: number
  changePercent: number
  volume: number
  turnover: number
}

export interface MacroData {
  gdp: TimeSeriesPoint[]
  gdpGrowth: TimeSeriesPoint[]
  inflation: TimeSeriesPoint[]
  debtToGdp: TimeSeriesPoint[]
  exports: TimeSeriesPoint[]
  imports: TimeSeriesPoint[]
  reserves: TimeSeriesPoint[]
}

export interface SocialData {
  unemployment: TimeSeriesPoint[]
  tourismArrivals: TimeSeriesPoint[]
  tourismReceipts: TimeSeriesPoint[]
}

export interface OverviewMetrics {
  gdp: number | null
  gdpGrowth: number | null
  inflation: number | null
  usdLkr: number | null
  aspiIndex: number | null
  aspiChange: number | null
  reserves: number | null
}

export type Trend = 'up' | 'down' | 'flat'
