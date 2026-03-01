import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChangeIndicatorProps {
  value: number
  suffix?: string
}

export default function ChangeIndicator({ value, suffix = '%' }: ChangeIndicatorProps) {
  const isPositive = value > 0
  const isZero = value === 0

  const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown
  const colorClass = isZero ? 'text-muted' : isPositive ? 'text-success' : 'text-danger'

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', colorClass)}>
      <Icon className="h-3 w-3" />
      {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
    </span>
  )
}
