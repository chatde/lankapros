import { SRI_LANKA_CITIES } from './constants'

export interface CityWeather {
  name: string
  icon: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  weatherCode: number
  isDay: boolean
}

export interface WeatherForecastDay {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
  precipProbability: number
}

export interface CityForecast {
  name: string
  icon: string
  current: CityWeather
  forecast: WeatherForecastDay[]
}

export async function fetchAllCityWeather(): Promise<CityForecast[]> {
  const results = await Promise.allSettled(
    SRI_LANKA_CITIES.map(async (city) => {
      const params = new URLSearchParams({
        latitude: city.lat.toString(),
        longitude: city.lon.toString(),
        current:
          'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        timezone: 'Asia/Colombo',
        forecast_days: '7',
      })

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params}`,
        { next: { revalidate: 900 } }
      )

      if (!res.ok) throw new Error(`Weather fetch failed for ${city.name}`)
      const data = await res.json()

      const current: CityWeather = {
        name: city.name,
        icon: city.icon,
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day === 1,
      }

      const forecast: WeatherForecastDay[] = data.daily.time.map(
        (date: string, i: number) => ({
          date,
          maxTemp: data.daily.temperature_2m_max[i],
          minTemp: data.daily.temperature_2m_min[i],
          weatherCode: data.daily.weather_code[i],
          precipProbability: data.daily.precipitation_probability_max[i],
        })
      )

      return {
        name: city.name as string,
        icon: city.icon as string,
        current,
        forecast,
      } satisfies CityForecast
    })
  )

  return results
    .filter(
      (r): r is PromiseFulfilledResult<CityForecast> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value)
}
