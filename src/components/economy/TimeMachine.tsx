'use client'

interface TimeMachineProps {
  minYear: number
  maxYear: number
  value: number
  onChange: (year: number) => void
}

export default function TimeMachine({ minYear, maxYear, value, onChange }: TimeMachineProps) {
  const isLive = value === maxYear

  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{'\u{1F570}\u{FE0F}'}</span>
        <span className="text-sm font-medium text-white">Time Machine</span>
        {isLive ? (
          <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
            LIVE
          </span>
        ) : (
          <span className="ml-auto text-2xl font-bold text-[#D4A843] font-mono">{value}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#888888] font-mono w-10">{minYear}</span>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #D4A843 ${((value - minYear) / (maxYear - minYear)) * 100}%, #2a2a2a ${((value - minYear) / (maxYear - minYear)) * 100}%)`,
          }}
        />
        <span className="text-xs text-[#888888] font-mono w-10 text-right">{maxYear}</span>
      </div>
    </div>
  )
}
