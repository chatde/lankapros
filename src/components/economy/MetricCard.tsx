import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import ChangeIndicator from './ChangeIndicator'
import type { Trend } from '@/lib/economy/types'

interface MetricCardProps {
  label: string
  value: string
  change?: number
  subtitle?: string
  loading?: boolean
  trend?: Trend
}

export default function MetricCard({ label, value, change, subtitle, loading, trend }: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-20 bg-border rounded" />
          <div className="h-7 w-28 bg-border rounded" />
          <div className="h-3 w-16 bg-border rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className={cn('text-2xl font-bold mt-1 font-terminal', change !== undefined && change < 0 ? 'text-danger' : 'text-foreground')}>
        {value}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {change !== undefined && <ChangeIndicator value={change} />}
        {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
      </div>
      {trend && (
        <span className={cn(
          'inline-flex items-center text-xs font-medium mt-1',
          trend === 'up' && 'text-success animate-trend-up',
          trend === 'down' && 'text-danger animate-trend-down',
          trend === 'flat' && 'text-muted',
        )}>
          {trend === 'up' && '↑ Rising'}
          {trend === 'down' && '↓ Falling'}
          {trend === 'flat' && '→ Stable'}
        </span>
      )}
    </Card>
  )
}
