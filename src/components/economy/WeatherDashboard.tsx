import SectionHeader from '@/components/economy/SectionHeader'
import WeatherCard from '@/components/economy/WeatherCard'
import type { CityForecast } from '@/lib/economy/weather-api'

interface WeatherDashboardProps {
  cities: CityForecast[]
}

export default function WeatherDashboard({ cities }: WeatherDashboardProps) {
  return (
    <div>
      <SectionHeader
        title="Live Weather Across Sri Lanka"
        subtitle="8 major cities — updates every 15 minutes"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cities.map((city) => (
          <WeatherCard key={city.name} city={city} />
        ))}
      </div>
    </div>
  )
}
