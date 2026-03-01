import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchAllCityWeather } from '@/lib/economy/weather-api'
import WeatherDashboard from '@/components/economy/WeatherDashboard'
import EconomyLoading from '../loading'

export const metadata: Metadata = {
  title: 'Weather | LankaPros Economy',
  description:
    'Live weather conditions across Sri Lanka — 8 major cities, updated every 15 minutes.',
}

async function WeatherContent() {
  const cities = await fetchAllCityWeather()
  return <WeatherDashboard cities={cities} />
}

export default function WeatherPage() {
  return (
    <Suspense fallback={<EconomyLoading />}>
      <WeatherContent />
    </Suspense>
  )
}
