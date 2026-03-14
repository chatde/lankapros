import { fetchWorldBank, fetchWorldBankForCountry } from './api'
import { SRI_LANKA_CITIES } from './constants'
import type { TimeSeriesPoint } from './types'
import type { SustainabilityData, SustainabilityMetric, EmergingMetric } from './sustainability-types'

// ── Open-Meteo Historical Rainfall ──────────────────────────────

async function fetchMonthlyRainfall(
  lat: number,
  lon: number,
  startYear: number,
  endYear: number
): Promise<{ year: number; month: number; total: number; rainyDays: number }[]> {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startYear}-01-01&end_date=${endYear}-12-31&daily=precipitation_sum&timezone=Asia/Colombo`
  try {
    const res = await fetch(url, { next: { revalidate: 86400 * 7 } })
    if (!res.ok) return []
    const json = await res.json()
    const dates: string[] = json.daily?.time ?? []
    const precip: (number | null)[] = json.daily?.precipitation_sum ?? []

    const monthly: Record<string, { total: number; rainyDays: number }> = {}
    for (let i = 0; i < dates.length; i++) {
      const key = dates[i].substring(0, 7) // YYYY-MM
      if (!monthly[key]) monthly[key] = { total: 0, rainyDays: 0 }
      const p = precip[i] ?? 0
      monthly[key].total += p
      if (p > 1) monthly[key].rainyDays++
    }

    return Object.entries(monthly).map(([key, val]) => ({
      year: parseInt(key.substring(0, 4)),
      month: parseInt(key.substring(5, 7)),
      total: val.total,
      rainyDays: val.rainyDays,
    }))
  } catch {
    return []
  }
}

function computeMonsoonShiftIndex(
  monthlyData: { year: number; month: number; total: number; rainyDays: number }[]
): TimeSeriesPoint[] {
  // Compute annual "burst ratio": total rain / rainy days
  // Higher = more intense bursts (same rain in fewer days)
  const byYear: Record<number, { totalRain: number; totalRainyDays: number }> = {}
  for (const d of monthlyData) {
    if (!byYear[d.year]) byYear[d.year] = { totalRain: 0, totalRainyDays: 0 }
    byYear[d.year].totalRain += d.total
    byYear[d.year].totalRainyDays += d.rainyDays
  }
  return Object.entries(byYear)
    .map(([year, val]) => ({
      year: parseInt(year),
      value: val.totalRainyDays > 0 ? val.totalRain / val.totalRainyDays : 0,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => a.year - b.year)
}

// ── FAO Food Balance (static fallback) ──────────────────────────

async function fetchFoodImportDependency(): Promise<TimeSeriesPoint[]> {
  // World Bank: food imports as % of merchandise imports
  const data = await fetchWorldBankForCountry('LKA', 'TM.VAL.FOOD.ZS.UN', 30)
  return data
}

// ── Aggregated Fetchers ─────────────────────────────────────────

async function fetchMonsoonShift(): Promise<SustainabilityMetric> {
  // Colombo rainfall — central indicator for southwest monsoon
  const endYear = new Date().getFullYear() - 1
  const startYear = endYear - 24
  const monthly = await fetchMonthlyRainfall(6.9271, 79.8612, startYear, endYear)
  const data = computeMonsoonShiftIndex(monthly)

  const first5 = data.slice(0, 5)
  const last5 = data.slice(-5)
  const avgFirst = first5.reduce((s, d) => s + d.value, 0) / (first5.length || 1)
  const avgLast = last5.reduce((s, d) => s + d.value, 0) / (last5.length || 1)
  const shiftPct = ((avgLast - avgFirst) / avgFirst * 100).toFixed(0)

  return {
    id: 'monsoon-shift',
    name: 'Monsoon Temporal Shift',
    icon: '🌧️',
    severity: 'critical',
    headline: `+${shiftPct}%`,
    headlineLabel: 'Rainfall intensity increase (mm/rainy day)',
    blindSpot: 'Sri Lanka tracks total annual rainfall, but not the temporal microstructure of monsoon delivery. A season that delivers the same total in 15 violent days instead of 60 steady days is catastrophically different for agriculture and reservoirs — but both show the same number.',
    whyItMatters: 'The entire agricultural calendar, hydropower generation (over 1/3 of electricity), and reservoir management depend on predictable monsoon timing. Shorter, more intense bursts mean flooding, topsoil loss, and empty reservoirs between bursts.',
    dataSource: 'Open-Meteo Historical Weather API (Colombo station)',
    data,
  }
}

async function fetchBrainDrain(): Promise<SustainabilityMetric> {
  const [migration, enrollment, researchers] = await Promise.all([
    fetchWorldBankForCountry('LKA', 'SM.POP.NETM', 30),
    fetchWorldBankForCountry('LKA', 'SE.TER.ENRR', 30),
    fetchWorldBankForCountry('LKA', 'SP.POP.SCIE.RD.P6', 30),
  ])

  const latestMigration = migration.at(-1)?.value ?? 0
  const headline = latestMigration < 0
    ? `${Math.abs(latestMigration).toLocaleString()}`
    : `${latestMigration.toLocaleString()}`

  return {
    id: 'brain-drain',
    name: 'Human Capital Flight',
    icon: '✈️',
    severity: 'critical',
    headline,
    headlineLabel: 'Net emigration (5-year period)',
    blindSpot: 'Sri Lanka tracks total emigration, but not the replacement ratio: how many cardiologists trained this year vs how many left? Losing 500 specialists is more structurally damaging than 50,000 unskilled workers. Nobody publishes "years until zero neurologists at current trends."',
    whyItMatters: 'Over 50% of state university graduates emigrate permanently, rising to 80-90% in medicine, engineering, and agriculture. This is capacity destruction — the country loses its ability to solve its own challenges.',
    dataSource: 'World Bank (Net Migration, Tertiary Enrollment, Researchers per Million)',
    data: migration,
    secondaryData: enrollment,
    secondaryLabel: 'Tertiary Enrollment Rate (%)',
  }
}

async function fetchCoastalLoss(): Promise<SustainabilityMetric> {
  const forestArea = await fetchWorldBankForCountry('LKA', 'AG.LND.FRST.ZS', 30)

  // Static curated data: published shoreline retreat rates (m/year) for key segments
  const coastalData: TimeSeriesPoint[] = [
    { year: 2000, value: 0.3 },
    { year: 2005, value: 0.5 },
    { year: 2008, value: 0.7 },
    { year: 2010, value: 0.8 },
    { year: 2012, value: 1.0 },
    { year: 2015, value: 1.3 },
    { year: 2018, value: 1.8 },
    { year: 2020, value: 2.2 },
    { year: 2022, value: 2.8 },
    { year: 2024, value: 3.2 },
  ]

  return {
    id: 'coastal-loss',
    name: 'Coastal Land Loss',
    icon: '🏖️',
    severity: 'high',
    headline: '3.2m/yr',
    headlineLabel: 'Average shoreline retreat (worst segments)',
    blindSpot: 'Sri Lanka tracks sea level at a few tide gauges but does not measure shoreline position change along the entire 1,340km coast. Shoreline retreat can be 10-50x faster than sea level rise due to sediment dynamics and illegal sand mining.',
    whyItMatters: '50% of the population lives in low-lying coastal areas. Some villages lose up to 10m of land annually. Over 50% of mangrove cover destroyed since the 1980s, removing natural coastal defense.',
    dataSource: 'Published NARA studies, Coast Conservation Dept, Sentinel-2 analysis',
    data: coastalData,
    secondaryData: forestArea,
    secondaryLabel: 'Forest Area (% of land)',
  }
}

async function fetchCalorieDependency(): Promise<SustainabilityMetric> {
  const [foodImports, cropIndex] = await Promise.all([
    fetchFoodImportDependency(),
    fetchWorldBankForCountry('LKA', 'AG.PRD.CROP.XD', 30),
  ])

  const latestImport = foodImports.at(-1)?.value ?? 0

  return {
    id: 'calorie-dependency',
    name: 'Calorie Import Dependency',
    icon: '🌾',
    severity: 'high',
    headline: `${latestImport.toFixed(0)}%`,
    headlineLabel: 'Food imports as % of merchandise imports',
    blindSpot: 'The headline says 85% of food is locally produced. But that 85% depends on imported fertilizer, fuel, and seeds. The true food sovereignty — "what % of calories survive if imports stop for 6 months" — is dramatically lower. The 2022 crisis proved it when 6.3M people became food insecure.',
    whyItMatters: 'The 2021 fertilizer ban revealed that "food self-sufficiency" was actually conditional on continuous imports. Nobody computes the full-stack dependency from seed to plate.',
    dataSource: 'World Bank (Food Imports), FAO Food Balance Sheets',
    data: foodImports,
    secondaryData: cropIndex,
    secondaryLabel: 'Crop Production Index',
  }
}

async function fetchGroundwater(): Promise<SustainabilityMetric> {
  const [freshwater, safeWater] = await Promise.all([
    fetchWorldBankForCountry('LKA', 'ER.H2O.INTR.PC', 30),
    fetchWorldBankForCountry('LKA', 'SH.STA.WASH.P5', 30),
  ])

  const latestFreshwater = freshwater.at(-1)?.value ?? 0

  return {
    id: 'groundwater',
    name: 'Groundwater Contamination',
    icon: '💧',
    severity: 'critical',
    headline: `${latestFreshwater.toFixed(0)}`,
    headlineLabel: 'Renewable freshwater per capita (m³/yr)',
    blindSpot: 'Water quality testing happens in one-off academic studies, not as infrastructure. The 176,000+ dug wells in the Rajarata are essentially unmonitored. CKDu has killed thousands, but no real-time groundwater monitoring network exists.',
    whyItMatters: 'CKDu in the North Central, Uva, and Eastern provinces is linked to fluoride and arsenic in dug wells. After 30 years, there is still no unified spatial dataset correlating water chemistry with disease incidence.',
    dataSource: 'World Bank (Freshwater per Capita, Safe Water Access), WHO',
    data: freshwater,
    secondaryData: safeWater,
    secondaryLabel: 'Safe Water Access (%)',
  }
}

// ── Emerging Metrics (no live data yet) ─────────────────────────

const EMERGING_METRICS: EmergingMetric[] = [
  {
    id: 'microplastics',
    name: 'Microplastics in Seafood',
    icon: '🐟',
    severity: 'high',
    description: 'Sri Lanka ranks 5th globally for ocean plastic discharge. 806 particles/kg found in coral tissue. The microplastic-to-seafood dietary exposure pathway is unmeasured.',
    blindSpot: 'Studies are academic snapshots. Nobody measures microplastic concentration in fish at Peliyagoda market or retail seafood.',
    dataAvailability: 'partial',
  },
  {
    id: 'coral-stress',
    name: 'Coral Reef Aragonite Stress',
    icon: '🪸',
    severity: 'high',
    description: 'Aragonite saturation values of 2.98-4.92 across reef sites — near the threshold below which reefs cannot rebuild. No permanent ocean chemistry monitoring stations exist.',
    blindSpot: 'Sri Lanka has zero continuous ocean pH monitoring. The country is flying blind on whether its natural coastal defense is approaching a point of no return.',
    dataAvailability: 'research-needed',
  },
  {
    id: 'endemic-species',
    name: 'Endemic Species Viability',
    icon: '🦎',
    severity: 'critical',
    description: 'Sri Lanka has the highest biodiversity density per area in Asia. 21 of 34 globally confirmed extinct amphibians were Sri Lankan — 62% of world amphibian extinctions on one island.',
    blindSpot: 'Red List updated roughly once per decade. No long-term population monitoring. The country does not know if most endemic species are increasing, declining, or gone.',
    dataAvailability: 'partial',
  },
  {
    id: 'urban-heat',
    name: 'Urban Heat Island (Colombo)',
    icon: '🏙️',
    severity: 'moderate',
    description: 'Urban heat islands amplify warming by 2-5°C in dense areas. Colombo has only 1 ground-level air quality station for 5M+ people. Heat-health impacts are entirely unmeasured.',
    blindSpot: 'National average temperature trends are tracked but not intra-city variation. The 6°C difference between a park and a concrete street is the difference between discomfort and medical emergency.',
    dataAvailability: 'available',
  },
  {
    id: 'renewable-gap',
    name: 'Renewable Energy Intermittency',
    icon: '⚡',
    severity: 'moderate',
    description: 'Government targets 70% renewable by 2030. But hydropower is increasingly unreliable due to erratic monsoons. The gap between installed MW and reliable MW delivered at 7PM on a cloudy day is the real metric.',
    blindSpot: 'Policy targets are stated in installed capacity. Nobody publishes "fossil fuel hours" — hours per month where fossil fuels substitute for unreliable renewables.',
    dataAvailability: 'partial',
  },
  {
    id: 'topsoil-loss',
    name: 'Topsoil Loss Rate',
    icon: '🌱',
    severity: 'high',
    description: 'Central Highlands soil loss measured at 70 tonnes/hectare/year — 100x the natural replacement rate. 11.8% of land under high erosion hazard. A slow-motion agricultural catastrophe.',
    blindSpot: 'Soil erosion studies exist as academic papers, not operational monitoring. No annually updated inventory. No farmer receives "your soil health is declining" notifications.',
    dataAvailability: 'partial',
  },
  {
    id: 'antibiotic-resistance',
    name: 'Antibiotic Resistance in Runoff',
    icon: '🧬',
    severity: 'emerging',
    description: 'Poultry and aquaculture use antibiotics as growth promoters. Agricultural runoff carries resistant organisms into drinking water sources.',
    blindSpot: 'Clinical resistance tracked in hospitals. Nobody tracks the environmental reservoir — water, soil, and food where resistant organisms breed before infecting humans.',
    dataAvailability: 'research-needed',
  },
  {
    id: 'education-mismatch',
    name: 'Education-Employment Mismatch',
    icon: '🎓',
    severity: 'moderate',
    description: 'High youth unemployment while employers report skill shortages. The university system produces graduates on a 4-5 year cycle while the economy shifts faster than curricula.',
    blindSpot: 'Graduation numbers and unemployment tracked separately. Nobody computes field-by-field mismatch: "graduates who stayed" vs "jobs available" by discipline.',
    dataAvailability: 'available',
  },
  {
    id: 'mangrove-carbon',
    name: 'Mangrove Carbon Sink',
    icon: '🌿',
    severity: 'high',
    description: 'Over 50% of mangrove cover lost since the 1980s. Mangroves sequester CO2 at 3-5x the rate of terrestrial forests and provide storm surge protection worth millions per km.',
    blindSpot: 'Loss tracked in hectares. Never computed: the carbon sequestration forfeited, coastal protection removed, fisheries nursery eliminated. Concrete sea walls cost $5K-$15K/meter — clearing mangroves is a catastrophic net loss.',
    dataAvailability: 'available',
  },
]

// ── Main Entry Point ────────────────────────────────────────────

export async function fetchSustainabilityData(): Promise<SustainabilityData> {
  const [monsoon, brainDrain, coastal, calorie, groundwater] = await Promise.all([
    fetchMonsoonShift(),
    fetchBrainDrain(),
    fetchCoastalLoss(),
    fetchCalorieDependency(),
    fetchGroundwater(),
  ])

  return {
    priorityMetrics: [monsoon, brainDrain, coastal, calorie, groundwater],
    emergingMetrics: EMERGING_METRICS,
    lastUpdated: new Date().toISOString().split('T')[0],
  }
}
