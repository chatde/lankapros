'use client'

import type { Opportunity } from '@/lib/economy/intelligence-compute'
import { cn } from '@/lib/utils'

interface OpportunityMapProps {
  opportunities: Opportunity[]
}

const ICON_MAP: Record<string, string> = {
  anchor: '\u2693',
  code: '\u{1F4BB}',
  palmtree: '\u{1F334}',
  sun: '\u2600\uFE0F',
  heartpulse: '\u{1F49A}',
  sprout: '\u{1F331}',
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? '#22c55e' : score >= 55 ? '#eab308' : '#ef4444'
  return (
    <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  )
}

export default function OpportunityMap({ opportunities }: OpportunityMapProps) {
  if (opportunities.length === 0) {
    return (
      <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4">
        <p className="text-sm text-[#888888]">No opportunity data available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {opportunities.map((opp) => (
        <div
          key={opp.sector}
          className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4 hover:border-[#D4A843]/30 transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg" aria-hidden="true">{ICON_MAP[opp.icon] ?? opp.icon}</span>
            <h4 className="text-sm font-bold text-white flex-1">{opp.sector}</h4>
            <span className={cn(
              'text-sm font-bold tabular-nums',
              opp.score >= 75 ? 'text-green-400' : opp.score >= 55 ? 'text-yellow-400' : 'text-red-400',
            )}>
              {opp.score}
            </span>
          </div>
          <ScoreBar score={opp.score} />
          <p className="text-xs text-[#aaaaaa] mt-3 leading-relaxed">{opp.rationale}</p>
          <p className="text-xs text-[#D4A843] mt-2 italic">{opp.comparator}</p>
        </div>
      ))}
    </div>
  )
}
