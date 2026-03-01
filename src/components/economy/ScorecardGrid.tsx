import type { IndicatorScore } from '@/lib/economy/scorecard'
import { cn } from '@/lib/utils'

interface ScorecardGridProps {
  indicators: IndicatorScore[]
}

const CATEGORY_ORDER = ['Economic', 'Financial', 'Social', 'Infrastructure'] as const

const colorMap = {
  green: 'bg-success',
  yellow: 'bg-amber-500',
  red: 'bg-danger',
} as const

const colorTextMap = {
  green: 'text-success',
  yellow: 'text-amber-500',
  red: 'text-danger',
} as const

export default function ScorecardGrid({ indicators }: ScorecardGridProps) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: indicators.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            {group.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.items.map((ind) => (
              <div
                key={ind.name}
                className="rounded-xl bg-card border border-border p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted uppercase tracking-wide">{ind.name}</p>
                  <span className={cn(
                    'text-xs font-medium',
                    ind.trend === 'up' && 'text-success',
                    ind.trend === 'down' && 'text-danger',
                    ind.trend === 'flat' && 'text-muted',
                  )}>
                    {ind.trend === 'up' && '\u2191 Rising'}
                    {ind.trend === 'down' && '\u2193 Falling'}
                    {ind.trend === 'flat' && '\u2192 Stable'}
                  </span>
                </div>
                <p className="text-xl font-bold text-foreground">{ind.value}</p>
                {/* Score bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-semibold', colorTextMap[ind.color])}>
                      {ind.score}/100
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', colorMap[ind.color])}
                      style={{ width: `${ind.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
