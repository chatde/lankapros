interface InsightCardProps {
  title: string
  icon: string
  children: React.ReactNode
  highlight?: string
  highlightLabel?: string
}

export default function InsightCard({ title, icon, children, highlight, highlightLabel }: InsightCardProps) {
  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-5 border-l-4 border-l-[#D4A843]">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0" aria-hidden="true">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white">{title}</h3>
          {highlight && (
            <div className="mt-2">
              <span className="text-3xl font-bold text-[#D4A843]">{highlight}</span>
              {highlightLabel && (
                <span className="text-xs text-[#888888] ml-2 uppercase tracking-wide">{highlightLabel}</span>
              )}
            </div>
          )}
          <div className="mt-2 text-sm text-[#aaaaaa] leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
