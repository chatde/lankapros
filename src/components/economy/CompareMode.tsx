'use client'

import { useState, useCallback } from 'react'
import { COMPARE_COUNTRIES } from '@/lib/economy/constants'
import CompareChart from './CompareChart'

interface DataPoint {
  year: number
  value: number
}

type IndicatorData = Record<string, DataPoint[]>

const INDICATOR_META: {
  key: string
  title: string
  formatter: (v: number) => string
}[] = [
  {
    key: 'gdpPerCapita',
    title: 'GDP per Capita (USD)',
    formatter: (v) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
  },
  {
    key: 'gdpGrowth',
    title: 'GDP Growth (%)',
    formatter: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'inflation',
    title: 'Inflation (%)',
    formatter: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'lifeExpectancy',
    title: 'Life Expectancy (years)',
    formatter: (v) => v.toFixed(1),
  },
  {
    key: 'unemployment',
    title: 'Unemployment (%)',
    formatter: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'exports',
    title: 'Exports (USD)',
    formatter: (v) => {
      if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
      if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`
      return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    },
  },
]

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4 animate-pulse">
      <div className="h-4 w-40 bg-[#2a2a2a] rounded mb-4" />
      <div className="h-[260px] bg-[#1a1a1a] rounded" />
    </div>
  )
}

export default function CompareMode() {
  const [selectedCode, setSelectedCode] = useState<string>('')
  const [lkaData, setLkaData] = useState<IndicatorData | null>(null)
  const [otherData, setOtherData] = useState<IndicatorData | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedCountry = COMPARE_COUNTRIES.find((c) => c.code === selectedCode)

  const handleCountryChange = useCallback(async (code: string) => {
    setSelectedCode(code)
    if (!code) {
      setLkaData(null)
      setOtherData(null)
      return
    }

    setLoading(true)
    try {
      const [lkaRes, otherRes] = await Promise.all([
        fetch('/api/economy/compare?country=LKA'),
        fetch(`/api/economy/compare?country=${code}`),
      ])

      if (lkaRes.ok && otherRes.ok) {
        const [lka, other] = await Promise.all([
          lkaRes.json() as Promise<IndicatorData>,
          otherRes.json() as Promise<IndicatorData>,
        ])
        setLkaData(lka)
        setOtherData(other)
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header + Dropdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Compare Mode</h2>
          <p className="text-sm text-muted mt-1">
            Sri Lanka vs any country — side-by-side economic indicators
          </p>
        </div>
        <select
          value={selectedCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="bg-[#161616] border border-[#2a2a2a] text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#D4A843] min-w-[200px]"
        >
          <option value="">Select a country...</option>
          {COMPARE_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* No country selected */}
      {!selectedCode && (
        <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-12 text-center">
          <p className="text-muted text-lg">Select a country to compare with Sri Lanka</p>
          <p className="text-muted/60 text-sm mt-2">
            Choose from regional peers to see side-by-side economic data
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <>
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="h-6 w-32 bg-[#2a2a2a] rounded animate-pulse" />
            <span className="text-muted text-sm">vs</span>
            <div className="h-6 w-32 bg-[#2a2a2a] rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      )}

      {/* Comparison data */}
      {!loading && selectedCountry && lkaData && otherData && (
        <>
          {/* Country headers */}
          <div className="flex items-center justify-center gap-8 py-2">
            <div className="text-center">
              <span className="text-2xl">{'\u{1F1F1}\u{1F1F0}'}</span>
              <p className="text-sm font-semibold text-foreground mt-1">Sri Lanka</p>
            </div>
            <span className="text-muted text-lg font-light">vs</span>
            <div className="text-center">
              <span className="text-2xl">{selectedCountry.flag}</span>
              <p className="text-sm font-semibold text-foreground mt-1">{selectedCountry.name}</p>
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INDICATOR_META.map((ind) => {
              const lka = lkaData[ind.key] ?? []
              const other = otherData[ind.key] ?? []
              const latestLka = lka.at(-1)
              const latestOther = other.at(-1)

              return (
                <div key={ind.key} className="space-y-2">
                  <CompareChart
                    lkaData={lka}
                    otherData={other}
                    lkaLabel="Sri Lanka"
                    otherLabel={selectedCountry.name}
                    title={ind.title}
                    formatter={ind.formatter}
                  />
                  {/* Latest values */}
                  <div className="flex justify-between px-2 text-xs text-muted">
                    <span>
                      LKA:{' '}
                      <span className="text-foreground font-medium">
                        {latestLka ? ind.formatter(latestLka.value) : 'N/A'}
                      </span>
                      {latestLka && (
                        <span className="ml-1 text-muted/60">({latestLka.year})</span>
                      )}
                    </span>
                    <span>
                      {selectedCountry.code}:{' '}
                      <span className="text-foreground font-medium">
                        {latestOther ? ind.formatter(latestOther.value) : 'N/A'}
                      </span>
                      {latestOther && (
                        <span className="ml-1 text-muted/60">({latestOther.year})</span>
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
