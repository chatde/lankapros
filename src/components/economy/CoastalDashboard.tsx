'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { Loader2 } from 'lucide-react'
import type { CoastalReading } from '@/lib/economy/types'

const COASTAL_CITIES = [
  { name: 'Colombo',     icon: '🏙️', lat: 6.9271, lon: 79.8612 },
  { name: 'Galle',       icon: '🏖️', lat: 6.0535, lon: 80.2210 },
  { name: 'Trincomalee', icon: '⛵', lat: 8.5874, lon: 81.2152 },
  { name: 'Jaffna',      icon: '🌴', lat: 9.6615, lon: 80.0255 },
]

function waveCondition(height: number): { label: string; color: string } {
  if (height < 0.5) return { label: 'Calm', color: 'text-green-400' }
  if (height < 1.0) return { label: 'Slight', color: 'text-green-400' }
  if (height < 1.5) return { label: 'Moderate', color: 'text-amber-400' }
  if (height < 2.5) return { label: 'Rough', color: 'text-orange-400' }
  return { label: 'Very Rough', color: 'text-red-400' }
}

function compassDir(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

export default function CoastalDashboard() {
  const [readings, setReadings] = useState<CoastalReading[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(
          COASTAL_CITIES.map(async city => {
            const res = await fetch(
              `https://marine-api.open-meteo.com/v1/marine?latitude=${city.lat}&longitude=${city.lon}&current=wave_height,sea_surface_temperature,wave_direction,wave_period`,
              { signal: AbortSignal.timeout(8000) }
            )
            if (!res.ok) return null
            const json = await res.json() as {
              current: {
                wave_height: number
                sea_surface_temperature: number
                wave_direction: number
                wave_period: number
              }
            }
            const c = json.current
            return {
              city: city.name,
              icon: city.icon,
              waveHeight: c.wave_height,
              seaTemp: c.sea_surface_temperature,
              waveDirection: c.wave_direction,
              wavePeriod: c.wave_period,
            } satisfies CoastalReading
          })
        )
        setReadings(results.filter((r): r is CoastalReading => r !== null))
        setUpdatedAt(new Date())
      } finally {
        setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {readings.map(r => {
          const condition = waveCondition(r.waveHeight)
          return (
            <Card key={r.city}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.icon}</span>
                  <p className="font-semibold">{r.city}</p>
                </div>
                <span className={`text-xs font-semibold ${condition.color}`}>
                  {condition.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide">Wave Height</p>
                  <p className="text-xl font-bold font-terminal mt-0.5">{r.waveHeight.toFixed(1)}m</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide">Sea Temp</p>
                  <p className="text-xl font-bold font-terminal mt-0.5">{r.seaTemp.toFixed(1)}°C</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide">Direction</p>
                  <p className="text-xl font-bold font-terminal mt-0.5">{compassDir(r.waveDirection)}</p>
                  <p className="text-xs text-muted">{r.waveDirection}°</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide">Period</p>
                  <p className="text-xl font-bold font-terminal mt-0.5">{r.wavePeriod.toFixed(1)}s</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {updatedAt && (
        <p className="text-xs text-muted text-right">
          Updated {updatedAt.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })} · via Open-Meteo Marine · refreshes every 15 min
        </p>
      )}

      <Card className="bg-card/50">
        <p className="text-xs text-muted leading-relaxed">
          🎣 <strong className="text-foreground">For fishermen:</strong> Waves under 1.0m are generally safe for small craft. Conditions above 1.5m require caution. Always check the <strong className="text-foreground">Department of Meteorology Sri Lanka</strong> for official advisories before going to sea.
        </p>
      </Card>
    </div>
  )
}
