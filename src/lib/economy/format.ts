import type { Trend, TimeSeriesPoint } from './types'

export function calculateTrend(data: TimeSeriesPoint[], count = 3): Trend {
  if (data.length < 2) return 'flat'
  const recent = data.slice(-count)
  const first = recent[0].value
  const last = recent[recent.length - 1].value
  const change = ((last - first) / Math.abs(first)) * 100
  if (change > 1) return 'up'
  if (change < -1) return 'down'
  return 'flat'
}

export function formatBillions(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`
  }
  return `$${value.toLocaleString()}`
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatLKR(value: number): string {
  return `Rs ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatNumber(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`
  }
  if (Math.abs(value) >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`
  }
  return value.toLocaleString()
}

export function formatExchangeRate(rate: number): string {
  if (rate >= 100) return rate.toFixed(2)
  if (rate >= 1) return rate.toFixed(4)
  return rate.toFixed(6)
}
