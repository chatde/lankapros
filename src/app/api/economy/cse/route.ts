import { NextRequest, NextResponse } from 'next/server'
import type { CSEMarketData, CSETopMover, CSESector } from '@/lib/economy/types'

const CSE_BASE = 'https://www.cse.lk/api'

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json() as { endpoint: string }

    switch (endpoint) {
      case 'market-summary':
        return NextResponse.json(await getMarketSummary())
      case 'top-movers':
        return NextResponse.json(await getTopMovers())
      case 'sectors':
        return NextResponse.json(await getSectors())
      default:
        return NextResponse.json({ error: 'Unknown endpoint' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'CSE API unavailable' }, { status: 502 })
  }
}

async function getMarketSummary(): Promise<CSEMarketData> {
  const res = await fetch(`${CSE_BASE}/marketSummary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60 },
  })

  if (!res.ok) throw new Error('CSE market summary failed')

  const data = await res.json()
  const summary = data?.reqMarketSummery

  if (!summary) throw new Error('Invalid CSE response')

  return {
    aspiIndex: summary.aspiIndex ?? 0,
    aspiChange: summary.aspiPointChange ?? 0,
    aspiChangePercent: summary.aspiPerChange ?? 0,
    sp20Index: summary.sp20Index ?? 0,
    sp20Change: summary.sp20PointChange ?? 0,
    sp20ChangePercent: summary.sp20PerChange ?? 0,
    totalVolume: summary.totalVolume ?? 0,
    totalTurnover: summary.totalTurnover ?? 0,
    totalTrades: summary.totalTrades ?? 0,
    marketStatus: summary.marketStatus ?? 'CLOSED',
  }
}

async function getTopMovers(): Promise<{ gainers: CSETopMover[]; losers: CSETopMover[] }> {
  const [gainRes, loseRes] = await Promise.all([
    fetch(`${CSE_BASE}/topGainers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    }),
    fetch(`${CSE_BASE}/topLosers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    }),
  ])

  const mapMover = (item: Record<string, unknown>): CSETopMover => ({
    symbol: (item.symbol as string) ?? '',
    name: (item.name as string) ?? '',
    price: (item.price as number) ?? 0,
    change: (item.change as number) ?? 0,
    changePercent: (item.percentageChange as number) ?? 0,
    volume: (item.volume as number) ?? 0,
  })

  const gainers = gainRes.ok ? ((await gainRes.json()) as Record<string, unknown>[]).slice(0, 10).map(mapMover) : []
  const losers = loseRes.ok ? ((await loseRes.json()) as Record<string, unknown>[]).slice(0, 10).map(mapMover) : []

  return { gainers, losers }
}

async function getSectors(): Promise<CSESector[]> {
  const res = await fetch(`${CSE_BASE}/sectorSummary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60 },
  })

  if (!res.ok) return []

  const data = (await res.json()) as Record<string, unknown>[]

  return data.slice(0, 20).map((s) => ({
    sector: (s.sector as string) ?? '',
    index: (s.index as number) ?? 0,
    change: (s.change as number) ?? 0,
    changePercent: (s.percentageChange as number) ?? 0,
    volume: (s.volume as number) ?? 0,
    turnover: (s.turnover as number) ?? 0,
  }))
}
