'use client'

import { useEffect, useState } from 'react'
import SectionHeader from '@/components/economy/SectionHeader'
import NewsCard from '@/components/economy/NewsCard'

interface NewsItem {
  title: string
  link: string
  pubDate: string
  description: string
  source: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

type SourceFilter = 'All' | 'Ada Derana' | 'Daily Mirror'
type SentimentFilter = 'All' | 'positive' | 'negative'

export default function NewsPulse() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('All')
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('All')

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/economy/news')
        if (!res.ok) throw new Error('Failed to fetch news')
        const data: NewsItem[] = await res.json()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load news')
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  const positive = items.filter((i) => i.sentiment === 'positive').length
  const negative = items.filter((i) => i.sentiment === 'negative').length
  const total = items.length || 1

  const positivePct = Math.round((positive / total) * 100)
  const negativePct = Math.round((negative / total) * 100)
  const neutralPct = 100 - positivePct - negativePct

  const filtered = items.filter((item) => {
    if (sourceFilter !== 'All' && item.source !== sourceFilter) return false
    if (sentimentFilter !== 'All' && item.sentiment !== sentimentFilter) return false
    return true
  })

  const sourceOptions: SourceFilter[] = ['All', 'Ada Derana', 'Daily Mirror']
  const sentimentOptions: { label: string; value: SentimentFilter }[] = [
    { label: 'All', value: 'All' },
    { label: 'Positive', value: 'positive' },
    { label: 'Negative', value: 'negative' },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <SectionHeader title="News Pulse" subtitle="Loading headlines..." />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4 animate-pulse">
              <div className="h-4 bg-[#2a2a2a] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <SectionHeader title="News Pulse" subtitle="Sri Lanka headlines with sentiment analysis" />
        <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center text-[#888888]">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="News Pulse"
        subtitle="Live Sri Lanka headlines with sentiment analysis"
      />

      {/* Pulse Meter */}
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between text-xs text-[#888888] mb-2">
          <span>Sentiment Overview</span>
          <span>{items.length} headlines</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-[#2a2a2a]">
          {positivePct > 0 && (
            <div
              className="bg-[#22c55e] transition-all duration-500"
              style={{ width: `${positivePct}%` }}
            />
          )}
          {neutralPct > 0 && (
            <div
              className="bg-[#888888] transition-all duration-500"
              style={{ width: `${neutralPct}%` }}
            />
          )}
          {negativePct > 0 && (
            <div
              className="bg-[#ef4444] transition-all duration-500"
              style={{ width: `${negativePct}%` }}
            />
          )}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" />
            <span className="text-[#888888]">Positive {positivePct}%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#888888] inline-block" />
            <span className="text-[#888888]">Neutral {neutralPct}%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block" />
            <span className="text-[#888888]">Negative {negativePct}%</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#888888] mr-1">Source:</span>
        {sourceOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => setSourceFilter(opt)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              sourceFilter === opt
                ? 'bg-[#D4A843]/15 border-[#D4A843] text-[#D4A843]'
                : 'border-[#2a2a2a] text-[#888888] hover:border-[#888888]'
            }`}
          >
            {opt}
          </button>
        ))}

        <span className="text-xs text-[#888888] ml-3 mr-1">Sentiment:</span>
        {sentimentOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSentimentFilter(opt.value)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              sentimentFilter === opt.value
                ? 'bg-[#D4A843]/15 border-[#D4A843] text-[#D4A843]'
                : 'border-[#2a2a2a] text-[#888888] hover:border-[#888888]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-6 text-center text-[#888888] text-sm">
            No headlines match your filters.
          </div>
        ) : (
          filtered.map((item, i) => (
            <NewsCard key={`${item.link}-${i}`} {...item} />
          ))
        )}
      </div>
    </div>
  )
}
