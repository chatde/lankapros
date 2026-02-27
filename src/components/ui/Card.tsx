import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export default function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-card border border-border p-4',
        hover && 'hover:bg-card-hover transition-colors cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
