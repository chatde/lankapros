'use client'

import type { ScorecardResult } from '@/lib/economy/scorecard'
import PulseAnimation from './PulseAnimation'
import ScorecardGrid from './ScorecardGrid'
import SectionHeader from './SectionHeader'

interface PulseScoreProps {
  scorecard: ScorecardResult
}

export default function PulseScore({ scorecard }: PulseScoreProps) {
  const upCount = scorecard.indicators.filter((i) => i.trend === 'up').length
  const totalCount = scorecard.indicators.length

  return (
    <div className="space-y-6">
      <SectionHeader title="Sri Lanka Pulse Score" />

      <PulseAnimation score={scorecard.overallScore} sentiment={scorecard.sentiment} />

      {/* Summary line */}
      <div className="text-center">
        <p className="text-sm text-muted">
          <span className="text-success font-semibold">{upCount}</span>
          <span>/{totalCount} indicators trending up</span>
        </p>
      </div>

      <ScorecardGrid indicators={scorecard.indicators} />
    </div>
  )
}
