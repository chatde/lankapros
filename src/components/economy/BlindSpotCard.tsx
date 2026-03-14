'use client'

import { useState } from 'react'
import type { SustainabilityMetric } from '@/lib/economy/sustainability-types'

const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-500/10', border: 'border-l-red-500', text: 'text-red-400', label: 'CRITICAL' },
  high: { bg: 'bg-orange-500/10', border: 'border-l-orange-500', text: 'text-orange-400', label: 'HIGH' },
  moderate: { bg: 'bg-yellow-500/10', border: 'border-l-yellow-500', text: 'text-yellow-400', label: 'MODERATE' },
  emerging: { bg: 'bg-blue-500/10', border: 'border-l-blue-500', text: 'text-blue-400', label: 'EMERGING' },
}

interface BlindSpotCardProps {
  metric: SustainabilityMetric
  children?: React.ReactNode
}

export default function BlindSpotCard({ metric, children }: BlindSpotCardProps) {
  const [expanded, setExpanded] = useState(false)
  const sev = SEVERITY_COLORS[metric.severity]

  return (
    <div className={`rounded-xl bg-[#161616] border border-[#2a2a2a] border-l-4 ${sev.border} overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl shrink-0" aria-hidden="true">{metric.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">{metric.name}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
                  {sev.label}
                </span>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[#D4A843]">{metric.headline}</span>
                <span className="text-xs text-[#888888] ml-2 uppercase tracking-wide">{metric.headlineLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-[#aaaaaa] leading-relaxed">
          {metric.whyItMatters}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-[#D4A843] hover:text-[#c49a38] font-medium uppercase tracking-wide transition-colors"
        >
          {expanded ? '▾ Hide Blind Spot Analysis' : '▸ Why Nobody Is Watching This'}
        </button>

        {expanded && (
          <div className="mt-3 p-3 rounded-lg bg-[#0e0e0e] border border-[#2a2a2a]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#D4A843] mb-1">The Blind Spot</p>
            <p className="text-sm text-[#aaaaaa] leading-relaxed">{metric.blindSpot}</p>
          </div>
        )}

        <div className="mt-1 text-[10px] text-[#666666] uppercase tracking-wide">
          Source: {metric.dataSource}
        </div>
      </div>

      {children && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </div>
  )
}
