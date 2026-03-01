import { NextResponse } from 'next/server'
import { TRACKED_CURRENCIES } from '@/lib/economy/constants'
import type { ExchangeRate } from '@/lib/economy/types'

export async function GET() {
  try {
    const res = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/lkr.json',
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) }
    )

    if (!res.ok) {
      return NextResponse.json([], { status: 502 })
    }

    const json = await res.json()
    const rates = json.lkr as Record<string, number>
    if (!rates) {
      return NextResponse.json([], { status: 502 })
    }

    const result: ExchangeRate[] = TRACKED_CURRENCIES
      .map((curr) => ({
        currency: curr.name,
        code: curr.code.toUpperCase(),
        rate: rates[curr.code] ? 1 / rates[curr.code] : 0,
        flag: curr.flag,
      }))
      .filter((r) => r.rate > 0)

    return NextResponse.json(result)
  } catch {
    return NextResponse.json([], { status: 502 })
  }
}
