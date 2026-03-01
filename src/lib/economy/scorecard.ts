import type { Trend, TimeSeriesPoint } from './types'
import type { MacroData, SocialData } from './types'
import type { PeopleData } from './people-api'
import { calculateTrend, formatPercent, formatBillions, formatNumber } from './format'

export interface IndicatorScore {
  name: string
  category: 'Economic' | 'Financial' | 'Social' | 'Infrastructure'
  value: string
  rawValue: number
  score: number
  trend: Trend
  color: 'green' | 'yellow' | 'red'
}

export interface ScorecardResult {
  overallScore: number
  overallTrend: Trend
  sentiment: string
  indicators: IndicatorScore[]
}

function latestValue(data: TimeSeriesPoint[]): number {
  if (data.length === 0) return 0
  return data[data.length - 1].value
}

function peakValue(data: TimeSeriesPoint[]): number {
  if (data.length === 0) return 0
  return Math.max(...data.map((d) => d.value))
}

function scoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green'
  if (score >= 40) return 'yellow'
  return 'red'
}

function scoreGdpGrowth(value: number): number {
  if (value > 5) return 90
  if (value >= 3) return 70
  if (value >= 1) return 50
  if (value >= 0) return 30
  return 10
}

function scoreInflation(value: number): number {
  if (value < 0) return 50
  if (value >= 2 && value <= 4) return 90
  if (value < 2 || (value > 4 && value <= 6)) return 70
  if (value <= 10) return 40
  return 20
}

function scoreDebtToGdp(value: number): number {
  if (value < 40) return 90
  if (value <= 60) return 70
  if (value <= 80) return 50
  if (value <= 100) return 30
  return 15
}

function scoreReserves(valueUsd: number): number {
  const billions = valueUsd / 1e9
  if (billions > 6) return 85
  if (billions >= 4) return 70
  if (billions >= 2) return 45
  return 20
}

function scoreUnemployment(value: number): number {
  if (value < 4) return 90
  if (value <= 6) return 70
  if (value <= 10) return 45
  return 20
}

function scoreTourism(current: number, peak: number): number {
  if (peak === 0) return 45
  const ratio = current / peak
  if (ratio > 0.8) return 85
  if (ratio >= 0.6) return 65
  if (ratio >= 0.4) return 45
  return 25
}

function scoreLifeExpectancy(value: number): number {
  if (value > 76) return 85
  if (value >= 72) return 70
  if (value >= 68) return 50
  return 30
}

function scoreLiteracy(value: number): number {
  if (value > 95) return 90
  if (value >= 90) return 75
  if (value >= 80) return 55
  return 30
}

function scoreInternet(value: number): number {
  if (value > 70) return 85
  if (value >= 50) return 65
  if (value >= 30) return 45
  return 25
}

function scoreUrbanization(value: number): number {
  if (value >= 30 && value <= 50) return 70
  if (value > 50) return 60
  return 50
}

const WEIGHTS: Record<string, number> = {
  'GDP Growth': 0.15,
  'Inflation': 0.10,
  'Debt-to-GDP': 0.12,
  'Foreign Reserves': 0.12,
  'Unemployment': 0.08,
  'Tourism Recovery': 0.08,
  'Life Expectancy': 0.10,
  'Literacy Rate': 0.10,
  'Internet Penetration': 0.08,
  'Urbanization': 0.07,
}

export function computeScorecard(
  macro: MacroData,
  social: SocialData,
  people: PeopleData,
): ScorecardResult {
  const indicators: IndicatorScore[] = []

  // GDP Growth
  const gdpVal = latestValue(macro.gdpGrowth)
  indicators.push({
    name: 'GDP Growth',
    category: 'Economic',
    value: formatPercent(gdpVal),
    rawValue: gdpVal,
    score: scoreGdpGrowth(gdpVal),
    trend: calculateTrend(macro.gdpGrowth),
    color: scoreColor(scoreGdpGrowth(gdpVal)),
  })

  // Inflation
  const infVal = latestValue(macro.inflation)
  indicators.push({
    name: 'Inflation',
    category: 'Economic',
    value: formatPercent(infVal),
    rawValue: infVal,
    score: scoreInflation(infVal),
    trend: calculateTrend(macro.inflation),
    color: scoreColor(scoreInflation(infVal)),
  })

  // Debt-to-GDP
  const debtVal = latestValue(macro.debtToGdp)
  indicators.push({
    name: 'Debt-to-GDP',
    category: 'Financial',
    value: formatPercent(debtVal, 0),
    rawValue: debtVal,
    score: scoreDebtToGdp(debtVal),
    trend: calculateTrend(macro.debtToGdp),
    color: scoreColor(scoreDebtToGdp(debtVal)),
  })

  // Foreign Reserves
  const resVal = latestValue(macro.reserves)
  indicators.push({
    name: 'Foreign Reserves',
    category: 'Financial',
    value: formatBillions(resVal),
    rawValue: resVal,
    score: scoreReserves(resVal),
    trend: calculateTrend(macro.reserves),
    color: scoreColor(scoreReserves(resVal)),
  })

  // Unemployment
  const unempVal = latestValue(social.unemployment)
  indicators.push({
    name: 'Unemployment',
    category: 'Economic',
    value: formatPercent(unempVal),
    rawValue: unempVal,
    score: scoreUnemployment(unempVal),
    trend: calculateTrend(social.unemployment),
    color: scoreColor(scoreUnemployment(unempVal)),
  })

  // Tourism Recovery
  const tourCurrent = latestValue(social.tourismArrivals)
  const tourPeak = peakValue(social.tourismArrivals)
  const tourScore = scoreTourism(tourCurrent, tourPeak)
  indicators.push({
    name: 'Tourism Recovery',
    category: 'Economic',
    value: formatNumber(tourCurrent),
    rawValue: tourCurrent,
    score: tourScore,
    trend: calculateTrend(social.tourismArrivals),
    color: scoreColor(tourScore),
  })

  // Life Expectancy
  const lifeVal = latestValue(people.lifeExpectancy)
  indicators.push({
    name: 'Life Expectancy',
    category: 'Social',
    value: `${lifeVal.toFixed(1)} yrs`,
    rawValue: lifeVal,
    score: scoreLifeExpectancy(lifeVal),
    trend: calculateTrend(people.lifeExpectancy),
    color: scoreColor(scoreLifeExpectancy(lifeVal)),
  })

  // Literacy Rate
  const litVal = latestValue(people.literacy)
  indicators.push({
    name: 'Literacy Rate',
    category: 'Social',
    value: `${litVal.toFixed(1)}%`,
    rawValue: litVal,
    score: scoreLiteracy(litVal),
    trend: calculateTrend(people.literacy),
    color: scoreColor(scoreLiteracy(litVal)),
  })

  // Internet Penetration
  const netVal = latestValue(people.internetUsers)
  indicators.push({
    name: 'Internet Penetration',
    category: 'Infrastructure',
    value: `${netVal.toFixed(1)}%`,
    rawValue: netVal,
    score: scoreInternet(netVal),
    trend: calculateTrend(people.internetUsers),
    color: scoreColor(scoreInternet(netVal)),
  })

  // Urbanization
  const urbVal = latestValue(people.urbanPop)
  indicators.push({
    name: 'Urbanization',
    category: 'Infrastructure',
    value: `${urbVal.toFixed(1)}%`,
    rawValue: urbVal,
    score: scoreUrbanization(urbVal),
    trend: calculateTrend(people.urbanPop),
    color: scoreColor(scoreUrbanization(urbVal)),
  })

  // Overall score (weighted average)
  let overallScore = 0
  for (const ind of indicators) {
    overallScore += ind.score * (WEIGHTS[ind.name] ?? 0)
  }
  overallScore = Math.round(overallScore)

  // Overall trend: majority of indicators
  const upCount = indicators.filter((i) => i.trend === 'up').length
  const downCount = indicators.filter((i) => i.trend === 'down').length
  const overallTrend: Trend = upCount > downCount ? 'up' : downCount > upCount ? 'down' : 'flat'

  // Sentiment
  let sentiment: string
  if (overallScore >= 75) sentiment = 'Strong Recovery'
  else if (overallScore >= 60) sentiment = 'Steady Progress'
  else if (overallScore >= 40) sentiment = 'Under Pressure'
  else sentiment = 'Critical'

  return { overallScore, overallTrend, sentiment, indicators }
}
