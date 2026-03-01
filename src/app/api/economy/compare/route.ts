import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const WB_BASE = 'https://api.worldbank.org/v2/country'

const ALLOWED_COUNTRIES = new Set([
  'LKA', 'IND', 'BGD', 'PAK', 'THA', 'VNM', 'MYS', 'SGP', 'IDN', 'PHL', 'MMR', 'NPL', 'MDV',
])

interface WorldBankEntry {
  date: string
  value: number | null
}

const COMPARE_INDICATORS = {
  gdpPerCapita: 'NY.GDP.PCAP.CD',
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  inflation: 'FP.CPI.TOTL.ZG',
  lifeExpectancy: 'SP.DYN.LE00.IN',
  unemployment: 'SL.UEM.TOTL.ZS',
  exports: 'NE.EXP.GNFS.CD',
} as const

async function fetchIndicator(country: string, indicator: string) {
  const url = `${WB_BASE}/${country}/indicator/${indicator}?format=json&per_page=20&date=${new Date().getFullYear() - 20}:${new Date().getFullYear()}`
  try {
    const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const json = await res.json()
    if (!json[1]) return []
    return (json[1] as WorldBankEntry[])
      .filter((d) => d.value !== null)
      .map((d) => ({ year: parseInt(d.date), value: d.value as number }))
      .sort((a, b) => a.year - b.year)
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get('country')
  if (!country || !ALLOWED_COUNTRIES.has(country)) {
    return NextResponse.json({ error: 'Invalid country code' }, { status: 400 })
  }

  const entries = Object.entries(COMPARE_INDICATORS)
  const results = await Promise.all(
    entries.map(([, indicator]) => fetchIndicator(country, indicator))
  )

  const data: Record<string, { year: number; value: number }[]> = {}
  entries.forEach(([key], i) => {
    data[key] = results[i]
  })

  return NextResponse.json(data)
}
