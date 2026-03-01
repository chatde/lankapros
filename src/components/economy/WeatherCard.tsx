import Card from '@/components/ui/Card'
import { WEATHER_CODES } from '@/lib/economy/constants'
import type { CityForecast } from '@/lib/economy/weather-api'

function tempColor(temp: number): string {
  if (temp > 30) return 'text-accent'
  if (temp < 20) return 'text-blue-400'
  return 'text-foreground'
}

function getDayAbbr(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function getWeatherIcon(code: number): string {
  return WEATHER_CODES[code]?.icon ?? '🌡️'
}

function getWeatherLabel(code: number): string {
  return WEATHER_CODES[code]?.label ?? 'Unknown'
}

interface WeatherCardProps {
  city: CityForecast
}

export default function WeatherCard({ city }: WeatherCardProps) {
  const { current, forecast } = city

  return (
    <Card className="flex flex-col gap-3">
      {/* Header: city + weather + temp */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{current.icon}</span>
          <div>
            <h3 className="text-sm font-bold text-foreground">{current.name}</h3>
            <p className="text-xs text-muted">{getWeatherLabel(current.weatherCode)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <span className="text-lg">{getWeatherIcon(current.weatherCode)}</span>
            <span className={`text-2xl font-bold ${tempColor(current.temperature)}`}>
              {Math.round(current.temperature)}°
            </span>
          </div>
        </div>
      </div>

      {/* Details: feels like, humidity, wind */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted">Feels like</p>
          <p className={`text-sm font-semibold ${tempColor(current.feelsLike)}`}>
            {Math.round(current.feelsLike)}°
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Humidity</p>
          <p className="text-sm font-semibold text-foreground">{current.humidity}%</p>
        </div>
        <div>
          <p className="text-xs text-muted">Wind</p>
          <p className="text-sm font-semibold text-foreground">
            {Math.round(current.windSpeed)} km/h
          </p>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="border-t border-border pt-2">
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {forecast.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-muted">{getDayAbbr(day.date)}</span>
              <span className="text-xs">{getWeatherIcon(day.weatherCode)}</span>
              <span className={`text-[10px] font-semibold ${tempColor(day.maxTemp)}`}>
                {Math.round(day.maxTemp)}°
              </span>
              <span className="text-[10px] text-muted">
                {Math.round(day.minTemp)}°
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
