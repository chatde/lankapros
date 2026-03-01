import { WB_COUNTRY, WB_INDICATORS, TRACKED_CURRENCIES, IMF_INDICATORS } from './constants'
import type {
  TimeSeriesPoint,
  WorldBankIndicator,
  ExchangeRate,
  CSEMarketData,
  CSETopMover,
  CSESector,
  MacroData,
  SocialData,
  OverviewMetrics,
} from './types'

// ── World Bank API ──────────────────────────────────────────────

const WB_BASE = 'https://api.worldbank.org/v2/country'

async function fetchWorldBank(indicator: string, years = 15): Promise<TimeSeriesPoint[]> {
  const url = `${WB_BASE}/${WB_COUNTRY}/indicator/${indicator}?format=json&per_page=${years}&date=${new Date().getFullYear() - years}:${new Date().getFullYear()}`

  const res = await fetch(url, { next: { revalidate: 86400 } }) // 24h cache
  if (!res.ok) return []

  const json = await res.json()
  if (!json[1]) return []

  return (json[1] as WorldBankIndicator[])
    .filter((d) => d.value !== null)
    .map((d) => ({ year: parseInt(d.date), value: d.value as number }))
    .sort((a, b) => a.year - b.year)
}

// ── IMF WEO API ─────────────────────────────────────────────────

async function fetchIMFForecast(indicator: string): Promise<TimeSeriesPoint[]> {
  const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}/LKA`

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; LankaPros/1.0)',
      },
    })
    if (!res.ok) return []

    const text = await res.text()
    // IMF sometimes returns HTML instead of JSON — guard against it
    if (text.startsWith('<') || !text.startsWith('{')) return []

    const json = JSON.parse(text)
    const values = json?.values?.[indicator]?.LKA
    if (!values || typeof values !== 'object') return []

    const currentYear = new Date().getFullYear()

    return Object.entries(values)
      .map(([year, val]) => ({
        year: parseInt(year),
        value: val as number,
        forecast: parseInt(year) > currentYear - 1,
      }))
      .filter((d) => d.year >= currentYear - 15 && d.year <= currentYear + 5)
      .sort((a, b) => a.year - b.year)
  } catch {
    return []
  }
}

// ── Exchange Rates (fawazahmed0) ────────────────────────────────

// Client-side version (used by ExchangeRatePanel and CurrencyConverter)
export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  try {
    const res = await fetch('/api/economy/exchange-rates')
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

// Server-side version (used by fetchOverviewMetrics)
async function fetchExchangeRatesServer(): Promise<ExchangeRate[]> {
  const url = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/lkr.json'
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const json = await res.json()
    const rates = json.lkr as Record<string, number>
    if (!rates) return []

    return TRACKED_CURRENCIES.map((curr) => ({
      currency: curr.name,
      code: curr.code.toUpperCase(),
      rate: rates[curr.code] ? 1 / rates[curr.code] : 0,
      flag: curr.flag,
    })).filter((r) => r.rate > 0)
  } catch {
    return []
  }
}

// ── CSE (Colombo Stock Exchange) ────────────────────────────────

export async function fetchCSEMarket(): Promise<CSEMarketData | null> {
  try {
    const res = await fetch('/api/economy/cse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: 'market-summary' }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchCSETopMovers(): Promise<{ gainers: CSETopMover[]; losers: CSETopMover[] }> {
  try {
    const res = await fetch('/api/economy/cse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: 'top-movers' }),
    })
    if (!res.ok) return { gainers: [], losers: [] }
    return await res.json()
  } catch {
    return { gainers: [], losers: [] }
  }
}

export async function fetchCSESectors(): Promise<CSESector[]> {
  try {
    const res = await fetch('/api/economy/cse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: 'sectors' }),
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

// ── Aggregated Fetchers ─────────────────────────────────────────

export async function fetchMacroData(): Promise<MacroData> {
  const [gdp, imfGdpGrowth, wbGdpGrowth, imfInflation, wbInflation, imfDebt, wbDebt, exports, imports, reserves] = await Promise.all([
    fetchWorldBank(WB_INDICATORS.gdp),
    fetchIMFForecast(IMF_INDICATORS.gdpGrowth),
    fetchWorldBank(WB_INDICATORS.gdpGrowth),
    fetchIMFForecast(IMF_INDICATORS.inflation),
    fetchWorldBank(WB_INDICATORS.inflation),
    fetchIMFForecast(IMF_INDICATORS.debtToGdp),
    fetchWorldBank(WB_INDICATORS.debtToGdp),
    fetchWorldBank(WB_INDICATORS.exports),
    fetchWorldBank(WB_INDICATORS.imports),
    fetchWorldBank(WB_INDICATORS.reserves),
  ])

  return {
    gdp,
    gdpGrowth: imfGdpGrowth.length > 0 ? imfGdpGrowth : wbGdpGrowth,
    inflation: imfInflation.length > 0 ? imfInflation : wbInflation,
    debtToGdp: imfDebt.length > 0 ? imfDebt : wbDebt,
    exports,
    imports,
    reserves,
  }
}

export async function fetchSocialData(): Promise<SocialData> {
  const [imfUnemployment, wbUnemployment, tourismArrivals, tourismReceipts] = await Promise.all([
    fetchIMFForecast(IMF_INDICATORS.unemployment),
    fetchWorldBank(WB_INDICATORS.unemployment),
    fetchWorldBank(WB_INDICATORS.tourismArrivals),
    fetchWorldBank(WB_INDICATORS.tourismReceipts),
  ])

  return {
    unemployment: imfUnemployment.length > 0 ? imfUnemployment : wbUnemployment,
    tourismArrivals,
    tourismReceipts,
  }
}

export async function fetchOverviewMetrics(): Promise<OverviewMetrics> {
  const [gdpData, gdpGrowthData, inflationData, rates, reserves] = await Promise.all([
    fetchWorldBank(WB_INDICATORS.gdp, 3),
    fetchWorldBank(WB_INDICATORS.gdpGrowth, 3),
    fetchWorldBank(WB_INDICATORS.inflation, 3),
    fetchExchangeRatesServer(),
    fetchWorldBank(WB_INDICATORS.reserves, 3),
  ])

  const usdRate = rates.find((r) => r.code === 'USD')

  return {
    gdp: gdpData.at(-1)?.value ?? null,
    gdpGrowth: gdpGrowthData.at(-1)?.value ?? null,
    inflation: inflationData.at(-1)?.value ?? null,
    usdLkr: usdRate?.rate ?? null,
    aspiIndex: null, // Filled client-side from CSE
    aspiChange: null,
    reserves: reserves.at(-1)?.value ?? null,
  }
}

export async function fetchWorldBankForCountry(
  country: string,
  indicator: string,
  years = 30
): Promise<TimeSeriesPoint[]> {
  const url = `${WB_BASE}/${country}/indicator/${indicator}?format=json&per_page=${years}&date=${new Date().getFullYear() - years}:${new Date().getFullYear()}`
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const json = await res.json()
    if (!json[1]) return []
    return (json[1] as WorldBankIndicator[])
      .filter((d) => d.value !== null)
      .map((d) => ({ year: parseInt(d.date), value: d.value as number }))
      .sort((a, b) => a.year - b.year)
  } catch {
    return []
  }
}

export { fetchWorldBank, fetchIMFForecast }
