import { NextResponse } from 'next/server'
import type { CommodityPrice } from '@/lib/economy/types'

const SYMBOLS = [
  { ticker: 'GC=F',  name: 'Gold',         symbol: 'XAU', icon: '🥇', unit: 'per oz' },
  { ticker: 'SI=F',  name: 'Silver',        symbol: 'XAG', icon: '🥈', unit: 'per oz' },
  { ticker: 'BZ=F',  name: 'Brent Crude',   symbol: 'OIL', icon: '🛢️', unit: 'per bbl' },
]

async function fetchYahoo(ticker: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LankaPros/1.0)' },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return null
    const json = await res.json() as {
      chart: { result: Array<{ meta: { regularMarketPrice: number } }> | null }
    }
    return json.chart?.result?.[0]?.meta?.regularMarketPrice ?? null
  } catch {
    return null
  }
}

async function fetchUsdToLkr(): Promise<number> {
  try {
    const res = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return 311
    const json = await res.json() as { usd: Record<string, number> }
    return json.usd?.lkr ?? 311
  } catch {
    return 311
  }
}

export async function GET() {
  try {
    const [usdToLkr, ...prices] = await Promise.all([
      fetchUsdToLkr(),
      ...SYMBOLS.map(s => fetchYahoo(s.ticker)),
    ])

    const result: CommodityPrice[] = SYMBOLS
      .map((commodity, i) => {
        const priceUsd = prices[i]
        if (priceUsd === null) return null
        return {
          name: commodity.name,
          symbol: commodity.symbol,
          icon: commodity.icon,
          priceUsd,
          priceLkr: Math.round(priceUsd * usdToLkr),
          unit: commodity.unit,
        }
      })
      .filter((c): c is CommodityPrice => c !== null)

    return NextResponse.json(result)
  } catch {
    return NextResponse.json([], { status: 502 })
  }
}
