import { fetchWorldBankForCountry } from './api'
import { INTELLIGENCE_INDICATORS, WB_INDICATORS } from './constants'
import type { TimeSeriesPoint } from './types'

export interface CountryMetrics {
  gdpPerCapita: TimeSeriesPoint[]
  exports: TimeSeriesPoint[]
  imports: TimeSeriesPoint[]
  fdi: TimeSeriesPoint[]
  internetUsers: TimeSeriesPoint[]
  lifeExpectancy: TimeSeriesPoint[]
  urbanPop: TimeSeriesPoint[]
  population: TimeSeriesPoint[]
  literacy: TimeSeriesPoint[]
  highTechExports: TimeSeriesPoint[]
  reserves: TimeSeriesPoint[]
  debtToGdp: TimeSeriesPoint[]
  gdpGrowth: TimeSeriesPoint[]
  portContainers: TimeSeriesPoint[]
  tourismArrivals: TimeSeriesPoint[]
}

export interface PeerData {
  code: string
  name: string
  gdpPerCapita: number
  gdpGrowth: number
}

export interface IntelligenceData {
  lka: CountryMetrics
  sgp: CountryMetrics
  peers: PeerData[]
}

async function fetchCountryMetrics(country: string): Promise<CountryMetrics> {
  const [
    gdpPerCapita, exports, imports, fdi, internetUsers,
    lifeExpectancy, urbanPop, population, literacy,
    highTechExports, reserves, debtToGdp, gdpGrowth,
    portContainers, tourismArrivals,
  ] = await Promise.all([
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.gdpPerCapita, 35),
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.exportsGoods, 30),
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.importsGoods, 30),
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.fdi, 30),
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.internetUsers, 30),
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.lifeExpectancy, 30),
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.urbanPop, 30),
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.population, 30),
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.literacy, 30),
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.highTechExports, 30),
    fetchWorldBankForCountry(country, WB_INDICATORS.reserves, 30),
    fetchWorldBankForCountry(country, WB_INDICATORS.debtToGdp, 30),
    fetchWorldBankForCountry(country, WB_INDICATORS.gdpGrowth, 30),
    fetchWorldBankForCountry(country, INTELLIGENCE_INDICATORS.portContainers, 30),
    fetchWorldBankForCountry(country, WB_INDICATORS.tourismArrivals, 30),
  ])

  return {
    gdpPerCapita, exports, imports, fdi, internetUsers,
    lifeExpectancy, urbanPop, population, literacy,
    highTechExports, reserves, debtToGdp, gdpGrowth,
    portContainers, tourismArrivals,
  }
}

const PEER_COUNTRIES = [
  { code: 'IND', name: 'India' },
  { code: 'BGD', name: 'Bangladesh' },
  { code: 'VNM', name: 'Vietnam' },
  { code: 'THA', name: 'Thailand' },
  { code: 'MYS', name: 'Malaysia' },
  { code: 'PHL', name: 'Philippines' },
] as const

async function fetchPeerData(): Promise<PeerData[]> {
  const results = await Promise.all(
    PEER_COUNTRIES.map(async (peer) => {
      const [gdpPc, growth] = await Promise.all([
        fetchWorldBankForCountry(peer.code, INTELLIGENCE_INDICATORS.gdpPerCapita, 5),
        fetchWorldBankForCountry(peer.code, WB_INDICATORS.gdpGrowth, 5),
      ])
      return {
        code: peer.code,
        name: peer.name,
        gdpPerCapita: gdpPc.at(-1)?.value ?? 0,
        gdpGrowth: growth.at(-1)?.value ?? 0,
      }
    })
  )
  return results
}

export async function fetchIntelligenceData(): Promise<IntelligenceData> {
  const [lka, sgp, peers] = await Promise.all([
    fetchCountryMetrics('LKA'),
    fetchCountryMetrics('SGP'),
    fetchPeerData(),
  ])

  return { lka, sgp, peers }
}
