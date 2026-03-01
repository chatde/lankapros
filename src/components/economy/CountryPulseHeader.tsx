'use client'

const TICKER_METRICS = [
  { label: 'GDP per Capita', value: '$3,800' },
  { label: 'USD/LKR', value: '~325' },
  { label: 'ASPI', value: '~12,400' },
  { label: 'Inflation', value: '~5.2%' },
  { label: 'Growth', value: '~5.0%' },
  { label: 'Reserves', value: '~$5B' },
]

function TickerContent() {
  return (
    <>
      {TICKER_METRICS.map((metric, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          {i > 0 && (
            <span className="text-gold mx-3 text-[8px]">&#9679;</span>
          )}
          <span className="text-muted">{metric.label}</span>
          <span className="text-foreground font-medium font-terminal">{metric.value}</span>
        </span>
      ))}
    </>
  )
}

export default function CountryPulseHeader() {
  return (
    <div
      className="w-full border-b border-border flex items-center justify-between px-4"
      style={{ backgroundColor: '#0d0d0d', height: '40px' }}
    >
      {/* Left: Pulse icon + label */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-gold text-sm"
          style={{ animation: 'heartbeat 1.5s ease-in-out infinite' }}
          aria-hidden="true"
        >
          &#9829;
        </span>
        <span className="text-xs font-semibold text-foreground whitespace-nowrap">
          Sri Lanka Pulse
        </span>
      </div>

      {/* Center: Scrolling ticker */}
      <div className="flex-1 mx-4 overflow-hidden">
        <div className="animate-ticker flex items-center text-xs whitespace-nowrap w-max">
          <TickerContent />
          {/* Duplicate for seamless loop */}
          <span className="text-gold mx-3 text-[8px]">&#9679;</span>
          <TickerContent />
        </div>
      </div>

      {/* Right: Live indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-success" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
        <span className="text-xs text-muted hidden sm:inline">Live</span>
      </div>
    </div>
  )
}
