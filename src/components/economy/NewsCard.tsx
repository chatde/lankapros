interface NewsCardProps {
  title: string
  link: string
  pubDate: string
  description: string
  source: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  if (isNaN(then)) return ''

  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const sentimentColors: Record<string, string> = {
  positive: 'bg-[#22c55e]',
  negative: 'bg-[#ef4444]',
  neutral: 'bg-[#888888]',
}

export default function NewsCard({ title, link, pubDate, description, source, sentiment }: NewsCardProps) {
  const relativeTime = getRelativeTime(pubDate)

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl bg-[#161616] border border-[#2a2a2a] p-4 hover:bg-[#1e1e1e] transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1.5 flex-shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${sentimentColors[sentiment]}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-[#ededed] leading-snug">{title}</h3>
            {relativeTime && (
              <span className="text-xs text-[#888888] whitespace-nowrap flex-shrink-0 mt-0.5">
                {relativeTime}
              </span>
            )}
          </div>
          <span className="inline-block mt-1.5 text-[10px] font-medium uppercase tracking-wider text-[#D4A843] bg-[#D4A843]/10 px-1.5 py-0.5 rounded">
            {source}
          </span>
          {description && (
            <p className="mt-1.5 text-xs text-[#888888] line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </a>
  )
}
