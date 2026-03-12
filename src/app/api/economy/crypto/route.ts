import { NextResponse } from 'next/server'
import type { CryptoPrice } from '@/lib/economy/types'

const COINS = [
  { id: 'bitcoin',      name: 'Bitcoin',  symbol: 'BTC', icon: '₿' },
  { id: 'ethereum',     name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
  { id: 'ripple',       name: 'XRP',      symbol: 'XRP', icon: '✕' },
  { id: 'binancecoin',  name: 'BNB',      symbol: 'BNB', icon: '◈' },
]

export async function GET() {
  try {
    const ids = COINS.map(c => c.id).join(',')
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=lkr,usd&include_24hr_change=true`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) }
    )

    if (!res.ok) {
      return NextResponse.json([], { status: 502 })
    }

    const data = await res.json() as Record<string, {
      lkr: number
      usd: number
      lkr_24h_change: number
    }>

    const result: CryptoPrice[] = COINS.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      icon: coin.icon,
      priceLkr: data[coin.id]?.lkr ?? 0,
      priceUsd: data[coin.id]?.usd ?? 0,
      change24h: data[coin.id]?.lkr_24h_change ?? 0,
    })).filter(c => c.priceLkr > 0)

    return NextResponse.json(result)
  } catch {
    return NextResponse.json([], { status: 502 })
  }
}
