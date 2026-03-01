import { fetchWorldBankForCountry } from './api'
import { WB_COUNTRY, WB_PEOPLE_INDICATORS } from './constants'
import type { TimeSeriesPoint } from './types'

export interface PeopleData {
  population: TimeSeriesPoint[]
  popGrowth: TimeSeriesPoint[]
  lifeExpectancy: TimeSeriesPoint[]
  literacy: TimeSeriesPoint[]
  birthRate: TimeSeriesPoint[]
  deathRate: TimeSeriesPoint[]
  urbanPop: TimeSeriesPoint[]
  internetUsers: TimeSeriesPoint[]
  mobileSubscriptions: TimeSeriesPoint[]
  primaryEnrollment: TimeSeriesPoint[]
  secondaryEnrollment: TimeSeriesPoint[]
  povertyRate: TimeSeriesPoint[]
}

export async function fetchPeopleData(): Promise<PeopleData> {
  const [
    population,
    popGrowth,
    lifeExpectancy,
    literacy,
    birthRate,
    deathRate,
    urbanPop,
    internetUsers,
    mobileSubscriptions,
    primaryEnrollment,
    secondaryEnrollment,
    povertyRate,
  ] = await Promise.all([
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.population),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.popGrowth),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.lifeExpectancy),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.literacy),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.birthRate),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.deathRate),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.urbanPop),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.internetUsers),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.mobileSubscriptions),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.primaryEnrollment),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.secondaryEnrollment),
    fetchWorldBankForCountry(WB_COUNTRY, WB_PEOPLE_INDICATORS.povertyRate),
  ])

  return {
    population,
    popGrowth,
    lifeExpectancy,
    literacy,
    birthRate,
    deathRate,
    urbanPop,
    internetUsers,
    mobileSubscriptions,
    primaryEnrollment,
    secondaryEnrollment,
    povertyRate,
  }
}
