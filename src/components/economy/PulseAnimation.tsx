'use client'

interface PulseAnimationProps {
  score: number
  sentiment: string
}

export default function PulseAnimation({ score, sentiment }: PulseAnimationProps) {
  // Higher score = slower (healthy), lower score = faster (stressed)
  const duration = 1 + (score / 100) * 2 // score 100 = 3s, score 0 = 1s

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div
          className="absolute w-40 h-40 rounded-full border-2 border-accent"
          style={{
            animation: `pulse-ring ${duration}s ease-out infinite`,
          }}
        />
        {/* Second ring for depth */}
        <div
          className="absolute w-40 h-40 rounded-full border border-accent/30"
          style={{
            animation: `pulse-ring ${duration}s ease-out infinite`,
            animationDelay: `${duration * 0.3}s`,
          }}
        />
        {/* Inner solid circle */}
        <div
          className="relative w-36 h-36 rounded-full bg-card border-2 border-accent flex flex-col items-center justify-center z-10"
          style={{
            animation: `heartbeat ${duration}s ease-in-out infinite`,
          }}
        >
          <span className="text-4xl font-bold text-accent">{score}</span>
          <span className="text-xs text-muted uppercase tracking-wider mt-1">/ 100</span>
        </div>
      </div>
      {/* Sentiment label */}
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">{sentiment}</p>
        <p className="text-xs text-muted mt-1">Sri Lanka Pulse Score</p>
      </div>
    </div>
  )
}
