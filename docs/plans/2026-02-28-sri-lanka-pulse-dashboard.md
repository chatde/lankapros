# Sri Lanka Pulse — Country Tracker Dashboard

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the existing LankaPros Economy tab into "Sri Lanka Pulse" — the most comprehensive free country tracker for any single nation on the internet, with live data, trajectory indicators, weather, news, people demographics, a composite scorecard, compare mode, and time machine slider.

**Architecture:** Next.js 16 App Router with server components for API data fetching (World Bank, IMF, Open-Meteo, RSS/news, currency APIs) and client components for interactive charts (recharts) and real-time features. All APIs are free/no-key. Data cached at appropriate intervals (weather 15min, exchange rates 5min, economic data 24h). New tabs added to the existing economy sub-navigation.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, recharts, existing Supabase auth (economy pages are public — no auth required)

---

## Phase 1: Fix What's Broken (Tasks 1-4)

### Task 1: Fix IMF API — Empty Data for GDP Growth, Inflation, Unemployment, Debt

The IMF DataMapper API returns data keyed by year (1980-2024) but the `fetchIMFForecast` function filters `year >= currentYear - 10` which is `2016`. The real issue: the API **does** have data (verified — values for 1980-2024 exist) but the response structure might differ or the CORS/fetch fails at build time on Vercel.

**Files:**
- Modify: `src/lib/economy/api.ts:36-55` (fetchIMFForecast function)

**Step 1: Debug and fix the IMF fetch**

The IMF API at `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/LKA` returns `{ values: { NGDP_RPCH: { LKA: { "1980": 5.5, ... "2024": 5.0 } } } }`. The issue is the fetch may fail silently on Vercel (CORS or redirect). Add error logging and a fallback to a proxied request.

Replace `fetchIMFForecast` in `src/lib/economy/api.ts`:

```typescript
async function fetchIMFForecast(indicator: string): Promise<TimeSeriesPoint[]> {
  const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}/LKA`

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) return []

    const json = await res.json()
    const values = json?.values?.[indicator]?.LKA
    if (!values || typeof values !== 'object') return []

    const currentYear = new Date().getFullYear()

    return Object.entries(values)
      .map(([year, val]) => ({
        year: parseInt(year),
        value: val as number,
        forecast: parseInt(year) > currentYear - 1,
      }))
      .filter((d) => d.year >= currentYear - 15 && d.year <= currentYear + 5)
      .sort((a, b) => a.year - b.year)
  } catch {
    return []
  }
}
```

Key changes:
- Widen filter from `currentYear - 10` to `currentYear - 15` to get more historical context
- Change forecast cutoff from `> currentYear` to `> currentYear - 1` (2024 data is actual, not forecast)
- Add Accept header for reliable JSON response
- Wrap in try/catch for Vercel build resilience

**Step 2: Run build to verify**

```bash
cd /Volumes/AI-Models/lankapros && npm run build
```

Expected: Build succeeds, `/economy` and `/economy/macro` pages render.

**Step 3: Commit**

```bash
git add src/lib/economy/api.ts
git commit -m "fix: widen IMF data filter and add resilience for Vercel builds"
```

---

### Task 2: Fix Exchange Rates — Client-Side Fetch Failing

The `fetchExchangeRates()` uses `fetch()` with a CDN URL which works server-side but may fail client-side due to CORS or network issues. The `ExchangeRatePanel` and `CurrencyConverter` call this client-side. Fix by adding an API route proxy.

**Files:**
- Create: `src/app/api/economy/exchange-rates/route.ts`
- Modify: `src/lib/economy/api.ts:59-75` (fetchExchangeRates)

**Step 1: Create exchange rates API route**

Create `src/app/api/economy/exchange-rates/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { TRACKED_CURRENCIES } from '@/lib/economy/constants'
import type { ExchangeRate } from '@/lib/economy/types'

export async function GET() {
  try {
    const res = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/lkr.json',
      { next: { revalidate: 300 } }
    )

    if (!res.ok) {
      return NextResponse.json([], { status: 502 })
    }

    const json = await res.json()
    const rates = json.lkr as Record<string, number>
    if (!rates) {
      return NextResponse.json([], { status: 502 })
    }

    const result: ExchangeRate[] = TRACKED_CURRENCIES
      .map((curr) => ({
        currency: curr.name,
        code: curr.code.toUpperCase(),
        rate: rates[curr.code] ? 1 / rates[curr.code] : 0,
        flag: curr.flag,
      }))
      .filter((r) => r.rate > 0)

    return NextResponse.json(result)
  } catch {
    return NextResponse.json([], { status: 502 })
  }
}
```

**Step 2: Update fetchExchangeRates for client-side use**

In `src/lib/economy/api.ts`, update `fetchExchangeRates`:

```typescript
export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  try {
    const res = await fetch('/api/economy/exchange-rates')
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

// Server-side version for SSR (used by overview metrics)
export async function fetchExchangeRatesServer(): Promise<ExchangeRate[]> {
  const url = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/lkr.json'
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const json = await res.json()
    const rates = json.lkr as Record<string, number>
    if (!rates) return []

    return TRACKED_CURRENCIES.map((curr) => ({
      currency: curr.name,
      code: curr.code.toUpperCase(),
      rate: rates[curr.code] ? 1 / rates[curr.code] : 0,
      flag: curr.flag,
    })).filter((r) => r.rate > 0)
  } catch {
    return []
  }
}
```

**Step 3: Update fetchOverviewMetrics to use server version**

In `src/lib/economy/api.ts`, change `fetchOverviewMetrics` to use `fetchExchangeRatesServer()` instead of `fetchExchangeRates()`.

**Step 4: Build and verify**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/app/api/economy/exchange-rates/route.ts src/lib/economy/api.ts
git commit -m "fix: proxy exchange rates through API route for client-side CORS"
```

---

### Task 3: Fix CSE Stock Market API — Proxy Likely Blocked by CSE

The CSE API at `https://www.cse.lk/api` likely blocks requests from Vercel's servers. Add better error handling and a graceful fallback.

**Files:**
- Modify: `src/app/api/economy/cse/route.ts`

**Step 1: Add User-Agent and error handling to CSE proxy**

Update `src/app/api/economy/cse/route.ts` — add a browser-like User-Agent header and better error handling:

```typescript
const CSE_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (compatible; LankaPros/1.0)',
  'Accept': 'application/json',
}
```

Apply this to all three fetch calls (marketSummary, topGainers/topLosers, sectorSummary). Also remove `next: { revalidate: 60 }` from fetch options inside the POST handler since this is a Route Handler (not a server component), and instead use `cache: 'no-store'`.

**Step 2: Build and verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/api/economy/cse/route.ts
git commit -m "fix: add User-Agent to CSE proxy and fix cache config"
```

---

### Task 4: Add Trajectory Arrows to MetricCard

Every metric should show if it's trending up/down/flat. This is the foundation for the "never seen before" feel.

**Files:**
- Modify: `src/components/economy/MetricCard.tsx`
- Modify: `src/lib/economy/types.ts` (add trend type)

**Step 1: Add Trend type**

In `src/lib/economy/types.ts`, add:

```typescript
export type Trend = 'up' | 'down' | 'flat'
```

**Step 2: Update MetricCard with trajectory arrow**

Add `trend` prop to MetricCard:

```typescript
interface MetricCardProps {
  label: string
  value: string
  change?: number
  subtitle?: string
  loading?: boolean
  trend?: Trend
}
```

Add a small animated arrow indicator based on trend:
- `up` = green arrow pointing up with subtle bounce animation
- `down` = red arrow pointing down
- `flat` = yellow horizontal arrow

**Step 3: Add CSS animation for trend arrows**

In `src/app/globals.css`, add:

```css
@keyframes trend-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.animate-trend {
  animation: trend-bounce 2s ease-in-out infinite;
}
```

**Step 4: Update OverviewDashboard to pass trend data**

Calculate trend from the last 2-3 data points for each metric.

**Step 5: Build and verify**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add src/components/economy/MetricCard.tsx src/lib/economy/types.ts src/app/globals.css src/components/economy/OverviewDashboard.tsx
git commit -m "feat: add trajectory arrows to all metric cards"
```

---

## Phase 2: New Data Tabs (Tasks 5-8)

### Task 5: Weather Tab — Live Sri Lanka Weather

Add a Weather tab showing current conditions for major Sri Lankan cities using Open-Meteo API (free, no key).

**Files:**
- Create: `src/app/economy/weather/page.tsx`
- Create: `src/components/economy/WeatherDashboard.tsx`
- Create: `src/components/economy/WeatherCard.tsx`
- Modify: `src/lib/economy/constants.ts` (add tab + city coordinates)
- Create: `src/lib/economy/weather-api.ts`

**Step 1: Add city coordinates to constants**

In `src/lib/economy/constants.ts`, add:

```typescript
export const SRI_LANKA_CITIES = [
  { name: 'Colombo', lat: 6.9271, lon: 79.8612, icon: '🏙️' },
  { name: 'Kandy', lat: 7.2906, lon: 80.6337, icon: '🏔️' },
  { name: 'Galle', lat: 6.0535, lon: 80.2210, icon: '🏖️' },
  { name: 'Jaffna', lat: 9.6615, lon: 80.0255, icon: '🌴' },
  { name: 'Trincomalee', lat: 8.5874, lon: 81.2152, icon: '⛵' },
  { name: 'Anuradhapura', lat: 8.3114, lon: 80.4037, icon: '🏛️' },
  { name: 'Nuwara Eliya', lat: 6.9497, lon: 80.7891, icon: '🍃' },
  { name: 'Batticaloa', lat: 7.7310, lon: 81.6747, icon: '🌊' },
] as const

export const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Moderate drizzle', icon: '🌦️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌧️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  80: { label: 'Slight showers', icon: '🌦️' },
  81: { label: 'Moderate showers', icon: '🌧️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm + hail', icon: '⛈️' },
  99: { label: 'Thunderstorm + heavy hail', icon: '⛈️' },
}
```

Add 'Weather' to `ECONOMY_TABS`:

```typescript
{ label: 'Weather', href: '/economy/weather' },
```

**Step 2: Create weather API module**

Create `src/lib/economy/weather-api.ts`:

```typescript
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
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        timezone: 'Asia/Colombo',
        forecast_days: '7',
      })

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
        next: { revalidate: 900 }, // 15 min cache
      })

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

      return { name: city.name, icon: city.icon, current, forecast }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<CityForecast> => r.status === 'fulfilled')
    .map((r) => r.value)
}
```

**Step 3: Create WeatherCard component**

Create `src/components/economy/WeatherCard.tsx` — shows a single city's current weather with a mini 7-day forecast bar. Use the gold accent color for warm temps, blue for cool. Show weather emoji from WEATHER_CODES map. Include wind speed, humidity, and feels-like.

**Step 4: Create WeatherDashboard component**

Create `src/components/economy/WeatherDashboard.tsx` — grid of 8 WeatherCards. At the top, show a mini map-like layout (just positioned dots) showing relative positions of cities on a stylized Sri Lanka outline using CSS.

**Step 5: Create weather page**

Create `src/app/economy/weather/page.tsx`:

```typescript
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchAllCityWeather } from '@/lib/economy/weather-api'
import WeatherDashboard from '@/components/economy/WeatherDashboard'
import EconomyLoading from '../loading'

export const metadata: Metadata = {
  title: 'Weather | LankaPros Economy',
  description: 'Live weather conditions across Sri Lanka — 8 major cities.',
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
```

**Step 6: Build and verify**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add src/app/economy/weather/ src/components/economy/WeatherCard.tsx src/components/economy/WeatherDashboard.tsx src/lib/economy/weather-api.ts src/lib/economy/constants.ts
git commit -m "feat: add live weather tab with 8 Sri Lankan cities"
```

---

### Task 6: News Pulse Tab — Live Sri Lanka Headlines

Show latest Sri Lanka news headlines from RSS feeds (no API key needed). Add a simple sentiment indicator (positive/negative/neutral) based on keyword matching.

**Files:**
- Create: `src/app/economy/news/page.tsx`
- Create: `src/app/api/economy/news/route.ts`
- Create: `src/components/economy/NewsPulse.tsx`
- Create: `src/components/economy/NewsCard.tsx`
- Modify: `src/lib/economy/constants.ts` (add tab)

**Step 1: Add News tab to constants**

Add to `ECONOMY_TABS`:

```typescript
{ label: 'News', href: '/economy/news' },
```

**Step 2: Create news API route**

Create `src/app/api/economy/news/route.ts` — fetch from multiple Sri Lankan news RSS feeds:

- Ada Derana: `https://www.adaderana.lk/rss.php`
- Daily Mirror: `https://www.dailymirror.lk/RSS_Feeds/breaking-news/108`
- News First: `https://english.newsfirst.lk/feed`

Parse the XML RSS, extract title, link, pubDate, description. Apply simple keyword-based sentiment (positive words: growth, increase, recovery, peace, development; negative: crisis, death, flood, strike, violence; neutral: otherwise). Return last 30 items sorted by date.

Note: Use built-in DOMParser or a simple regex parser for RSS XML — no extra dependency needed. On server (Node), use a simple regex approach to parse XML since DOMParser is browser-only.

**Step 3: Create NewsCard component**

Shows a headline with:
- Sentiment dot (green/red/yellow)
- Source tag (Ada Derana, etc.)
- Relative time ("2h ago")
- Truncated description
- Link opens in new tab

**Step 4: Create NewsPulse component**

Shows a "pulse meter" at the top — a horizontal bar showing the ratio of positive/neutral/negative news today. Below that, a scrollable list of NewsCards. Include a filter for source.

**Step 5: Create news page**

```typescript
// Server component that fetches via the API route internally
```

**Step 6: Build and verify**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add src/app/economy/news/ src/app/api/economy/news/ src/components/economy/NewsPulse.tsx src/components/economy/NewsCard.tsx src/lib/economy/constants.ts
git commit -m "feat: add News Pulse tab with sentiment analysis"
```

---

### Task 7: People Tab — Demographics & Human Development

Show population pyramid, literacy rate, life expectancy, HDI, education metrics using World Bank API.

**Files:**
- Create: `src/app/economy/people/page.tsx`
- Create: `src/components/economy/PeopleDashboard.tsx`
- Create: `src/components/economy/PopulationPyramid.tsx`
- Create: `src/lib/economy/people-api.ts`
- Modify: `src/lib/economy/constants.ts` (add tab + indicators)

**Step 1: Add People tab and World Bank indicators**

Add to `ECONOMY_TABS`:

```typescript
{ label: 'People', href: '/economy/people' },
```

Add to constants:

```typescript
export const WB_PEOPLE_INDICATORS = {
  population: 'SP.POP.TOTL',
  lifeExpectancy: 'SP.DYN.LE00.IN',
  literacy: 'SE.ADT.LITR.ZS',
  birthRate: 'SP.DYN.CBRT.IN',
  deathRate: 'SP.DYN.CDRT.IN',
  urbanPop: 'SP.URB.TOTL.IN.ZS',
  internetUsers: 'IT.NET.USER.ZS',
  mobileSubscriptions: 'IT.CEL.SETS.P2',
  hdi: 'HD.HCI.OVRL', // Human Capital Index
  primaryEnrollment: 'SE.PRM.ENRR',
  povertyRate: 'SI.POV.NAHC', // National poverty headcount
  giniIndex: 'SI.POV.GINI',
} as const
```

**Step 2: Create people API module**

Create `src/lib/economy/people-api.ts` — uses `fetchWorldBank` from `api.ts` (make it exported). Fetches all people indicators in parallel.

**Step 3: Create PopulationPyramid component**

A horizontal bar chart showing male/female population by age group. Use World Bank population age/sex indicators or show a simplified total population timeline.

**Step 4: Create PeopleDashboard**

Grid of MetricCards for key stats + TimeSeriesCharts for population, life expectancy, internet users, urban population, literacy trends. Each with trajectory arrows.

**Step 5: Create people page (server component with Suspense)**

**Step 6: Build and verify**

**Step 7: Commit**

```bash
git commit -m "feat: add People tab with demographics and human development"
```

---

### Task 8: Scorecard Tab — Composite Country Health Score

The crown jewel. A single page that shows an overall "Sri Lanka Pulse Score" — a composite of all tracked indicators, with traffic-light coloring and trajectory arrows for everything.

**Files:**
- Create: `src/app/economy/scorecard/page.tsx`
- Create: `src/components/economy/PulseScore.tsx`
- Create: `src/components/economy/ScorecardGrid.tsx`
- Create: `src/components/economy/PulseAnimation.tsx`
- Create: `src/lib/economy/scorecard.ts`
- Modify: `src/lib/economy/constants.ts` (add tab)

**Step 1: Add Scorecard tab**

Add to `ECONOMY_TABS` as the FIRST item (before Overview):

```typescript
{ label: 'Pulse', href: '/economy/scorecard' },
```

**Step 2: Create scoring logic**

Create `src/lib/economy/scorecard.ts`:

Define a scoring function that takes all available metrics and produces:
- Individual scores per indicator (0-100, where 100 = excellent)
- Overall composite score (weighted average)
- Trend for each (up/down/flat based on last 3 data points)
- Color coding: green (70-100), yellow (40-69), red (0-39)

Scoring rules:
- GDP Growth: >5% = 100, 3-5% = 75, 1-3% = 50, 0-1% = 25, <0% = 0
- Inflation: 2-4% = 100, 4-6% = 75, 6-10% = 50, >10% = 25
- Unemployment: <4% = 100, 4-6% = 75, 6-10% = 50, >10% = 25
- Debt/GDP: <40% = 100, 40-60% = 75, 60-80% = 50, >80% = 25
- Reserves: >6 months imports = 100, 3-6 = 75, 1-3 = 50, <1 = 25
- Tourism: compare to 2018 peak as 100%
- Life Expectancy: >75 = 100, 70-75 = 75, 65-70 = 50, <65 = 25
- Literacy: >95% = 100, 90-95 = 75, 80-90 = 50, <80 = 25

**Step 3: Create PulseAnimation**

A CSS-only animated heartbeat that pulses faster when score is lower (unhealthy = rapid pulse, healthy = steady pulse). Uses the gold accent color. Shows the composite score number in the center.

```css
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.15); }
  30% { transform: scale(1); }
  45% { transform: scale(1.1); }
  60% { transform: scale(1); }
}
```

**Step 4: Create ScorecardGrid**

A grid showing every indicator as a card with:
- Indicator name
- Current value
- Score (0-100) with color bar
- Trend arrow (up/down/flat)
- Sparkline (last 5 data points)

Group by category: Economic, Financial, Social, Infrastructure.

**Step 5: Create PulseScore**

The main component that combines PulseAnimation at top + ScorecardGrid below. Shows the overall pulse score prominently with a label like "Sri Lanka is showing signs of recovery" or "Strong growth trajectory" based on the score.

**Step 6: Create scorecard page**

Server component that fetches ALL data (overview metrics, macro, social, people) and passes to the scorecard calculator.

**Step 7: Build and verify**

**Step 8: Commit**

```bash
git commit -m "feat: add Pulse Scorecard — composite country health score with heartbeat animation"
```

---

## Phase 3: "Never Seen Before" Features (Tasks 9-12)

### Task 9: Country Pulse Header Animation

Add a persistent animated header to the economy layout that shows a subtle heartbeat/pulse effect. The pulse rate is tied to the composite score.

**Files:**
- Create: `src/components/economy/CountryPulseHeader.tsx`
- Modify: `src/app/economy/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Create CountryPulseHeader**

A thin horizontal bar at the top of the economy section showing:
- Left: animated pulse icon + "Sri Lanka Pulse"
- Center: scrolling ticker of key metrics (GDP, USD/LKR, ASPI, Temperature in Colombo)
- Right: last updated timestamp

The ticker scrolls horizontally with CSS animation. The pulse icon uses the heartbeat keyframe.

**Step 2: Add to economy layout**

Place `CountryPulseHeader` above the `EconomyNav` in the layout.

**Step 3: Add ticker scroll CSS**

```css
@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-ticker {
  animation: ticker-scroll 30s linear infinite;
}
```

**Step 4: Build and verify**

**Step 5: Commit**

```bash
git commit -m "feat: add Country Pulse header with live ticker animation"
```

---

### Task 10: Compare Mode — Sri Lanka vs Any Country

Let users compare Sri Lanka against any other country using World Bank data. Dropdown to select a country, side-by-side metric cards and overlaid charts.

**Files:**
- Create: `src/app/economy/compare/page.tsx`
- Create: `src/components/economy/CompareMode.tsx`
- Create: `src/components/economy/CompareChart.tsx`
- Create: `src/app/api/economy/compare/route.ts`
- Modify: `src/lib/economy/constants.ts` (add tab + country list)

**Step 1: Add Compare tab to constants**

```typescript
{ label: 'Compare', href: '/economy/compare' },
```

Add a list of popular comparison countries:

```typescript
export const COMPARE_COUNTRIES = [
  { code: 'IND', name: 'India', flag: '🇮🇳' },
  { code: 'BGD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PAK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'THA', name: 'Thailand', flag: '🇹🇭' },
  { code: 'VNM', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'MYS', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SGP', name: 'Singapore', flag: '🇸🇬' },
  { code: 'IDN', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'PHL', name: 'Philippines', flag: '🇵🇭' },
  { code: 'MMR', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NPL', name: 'Nepal', flag: '🇳🇵' },
  { code: 'MDV', name: 'Maldives', flag: '🇲🇻' },
] as const
```

**Step 2: Create compare API route**

Fetches World Bank data for a given country code and set of indicators. Returns data in same format as Sri Lanka's data.

**Step 3: Create CompareChart**

A dual-line chart showing both countries overlaid on the same axes. Sri Lanka in gold, comparison country in a contrasting color. Legend shows both country names with flags.

**Step 4: Create CompareMode**

Client component with country selector dropdown. Shows side-by-side MetricCards (Sri Lanka left, other country right) and CompareCharts for GDP growth, inflation, unemployment, life expectancy, etc.

**Step 5: Create compare page**

**Step 6: Build and verify**

**Step 7: Commit**

```bash
git commit -m "feat: add Compare Mode — Sri Lanka vs any country"
```

---

### Task 11: Time Machine Slider

Add a time slider to the Overview page that lets users see what every metric looked like at any point in the past 15 years. Drag the slider and all cards update simultaneously.

**Files:**
- Create: `src/components/economy/TimeMachine.tsx`
- Modify: `src/components/economy/OverviewCharts.tsx`
- Modify: `src/components/economy/OverviewDashboard.tsx`
- Modify: `src/app/economy/page.tsx`

**Step 1: Create TimeMachine component**

A styled range slider with year labels. When dragged, emits the selected year. Shows a "time travel" visual — a subtle rewind icon and the selected year displayed prominently.

Styling: gold accent track, dark thumb, year labels below. Current year highlighted.

**Step 2: Update OverviewDashboard to accept a `selectedYear` prop**

When a year is selected (not current), filter the data to show values as of that year. Cards show the historical values with a "in {year}" subtitle.

**Step 3: Update OverviewCharts to manage time machine state**

Add TimeMachine component above the dashboard. Pass selected year down. When not current year, show a reference line on the GDP chart at the selected year.

**Step 4: Fetch more historical data**

Update `fetchOverviewMetrics` to return full time series (not just latest), so the time machine can look up any year.

**Step 5: Build and verify**

**Step 6: Commit**

```bash
git commit -m "feat: add Time Machine slider to Overview — see any year's data"
```

---

### Task 12: Bloomberg Terminal Aesthetic + Deploy

Polish the entire economy section with a Bloomberg Terminal-inspired dark theme. Dense data, monospace numbers, subtle grid lines, green/red for up/down, gold for primary.

**Files:**
- Modify: `src/app/globals.css` (add terminal-style utilities)
- Modify: `src/app/economy/layout.tsx` (add terminal class)
- Modify: `src/components/economy/MetricCard.tsx` (monospace numbers)
- Modify: Various economy components for density

**Step 1: Add terminal CSS utilities**

```css
.font-terminal { font-family: var(--font-mono, 'SF Mono', 'Consolas', monospace); }
.text-terminal-green { color: #00ff88; }
.text-terminal-red { color: #ff4444; }
.border-terminal { border-color: #1a3a1a; }
.bg-terminal { background: #0a0f0a; }
```

**Step 2: Apply monospace to all numeric values in MetricCard**

**Step 3: Increase data density**

Reduce padding, use smaller font sizes for labels, pack more information per card. Add subtle scanline effect (optional — CSS only):

```css
.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.03) 2px,
    rgba(0,0,0,0.03) 4px
  );
  pointer-events: none;
}
```

**Step 4: Final build**

```bash
npm run build
```

**Step 5: Deploy to Vercel**

```bash
cd /Volumes/AI-Models/lankapros && npx vercel --prod
```

**Step 6: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: Bloomberg Terminal aesthetic + deploy Sri Lanka Pulse"
```

---

## Task 13: Update Obsidian Vault

**Files:**
- Modify: `/Volumes/AI-Models/claude/projects/LankaPros.md`
- Modify: `/Volumes/AI-Models/claude/Status Board.md`
- Modify: `/Volumes/AI-Models/claude/Session Handoff.md`

**Step 1: Update LankaPros.md in Obsidian**

Add a section documenting the Economy / Sri Lanka Pulse dashboard:
- All tabs and their data sources
- API endpoints used (all free, no keys)
- Unique features (Pulse Score, Time Machine, Compare Mode, Weather, News)
- Component list

**Step 2: Update Status Board**

Add Sri Lanka Pulse as a feature under LankaPros.

**Step 3: Update Session Handoff**

Document what was completed and any remaining follow-ups.

**Step 4: Commit vault changes**

---

## Task 14: Record Voice Selection for Promo Videos

**Files:**
- Modify: `/Volumes/AI-Models/promo-videos/` (config or script that references voice)

Document that Dad selected `v2-ryan-natural.mp3` (en-GB-RyanNeural with natural style) as the narrator voice for promo videos. Update any voice configuration in the promo-videos project.

---

## Summary

| Phase | Tasks | What It Delivers |
|-------|-------|-----------------|
| 1 | 1-4 | Fix all broken APIs + add trajectory arrows |
| 2 | 5-8 | Weather, News, People, Scorecard tabs |
| 3 | 9-12 | Pulse header, Compare Mode, Time Machine, Bloomberg aesthetic |
| Meta | 13-14 | Obsidian updates + promo voice config |

Total: 14 tasks, ~50 files touched/created.
