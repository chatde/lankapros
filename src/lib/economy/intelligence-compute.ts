import type { TimeSeriesPoint } from './types'
import type { CountryMetrics, PeerData } from './intelligence-api'
import { formatBillions, formatPercent, formatNumber, calculateTrend } from './format'

// ── Singapore Gap ──────────────────────────────────────────────

export interface GapDataPoint {
  year: number
  lkaValue: number | null
  sgpValue: number | null
  ratio: number | null
}

export interface SingaporeGapResult {
  series: GapDataPoint[]
  sgpMatchYear: number | null
  currentLkaGdpPc: number
  currentSgpGdpPc: number
  gapMultiple: number
  sgpGrowthSinceMatch: number
}

export function computeSingaporeGap(
  lka: CountryMetrics,
  sgp: CountryMetrics
): SingaporeGapResult {
  const lkaMap = new Map(lka.gdpPerCapita.map((d) => [d.year, d.value]))
  const sgpMap = new Map(sgp.gdpPerCapita.map((d) => [d.year, d.value]))

  const allYears = new Set([...lkaMap.keys(), ...sgpMap.keys()])
  const series: GapDataPoint[] = Array.from(allYears)
    .sort((a, b) => a - b)
    .map((year) => {
      const lv = lkaMap.get(year) ?? null
      const sv = sgpMap.get(year) ?? null
      return {
        year,
        lkaValue: lv,
        sgpValue: sv,
        ratio: lv && sv ? sv / lv : null,
      }
    })

  const currentLkaGdpPc = lka.gdpPerCapita.at(-1)?.value ?? 0
  const currentSgpGdpPc = sgp.gdpPerCapita.at(-1)?.value ?? 0
  const gapMultiple = currentLkaGdpPc > 0 ? currentSgpGdpPc / currentLkaGdpPc : 0

  // Find when Singapore was at Sri Lanka's current GDP per capita
  let sgpMatchYear: number | null = null
  let sgpGrowthSinceMatch = 0
  if (currentLkaGdpPc > 0) {
    const sgpSorted = [...sgp.gdpPerCapita].sort((a, b) => a.year - b.year)
    for (let i = 0; i < sgpSorted.length - 1; i++) {
      if (sgpSorted[i].value <= currentLkaGdpPc && sgpSorted[i + 1].value > currentLkaGdpPc) {
        sgpMatchYear = sgpSorted[i].year
        break
      }
    }
    // If SGP always exceeded current LKA, take earliest year
    if (sgpMatchYear === null && sgpSorted.length > 0 && sgpSorted[0].value > currentLkaGdpPc) {
      sgpMatchYear = sgpSorted[0].year
    }
    if (sgpMatchYear !== null) {
      const sgpAtMatch = sgpMap.get(sgpMatchYear) ?? currentLkaGdpPc
      sgpGrowthSinceMatch = sgpAtMatch > 0 ? currentSgpGdpPc / sgpAtMatch : 0
    }
  }

  return { series, sgpMatchYear, currentLkaGdpPc, currentSgpGdpPc, gapMultiple, sgpGrowthSinceMatch }
}

// ── Sector Opportunities ───────────────────────────────────────

export interface Opportunity {
  sector: string
  score: number
  rationale: string
  comparator: string
  icon: string
}

export function computeSectorOpportunities(
  lka: CountryMetrics,
  sgp: CountryMetrics
): Opportunity[] {
  const opportunities: Opportunity[] = []

  // Maritime/Logistics
  const lkaPort = lka.portContainers.at(-1)?.value ?? 0
  const sgpPort = sgp.portContainers.at(-1)?.value ?? 0
  const portRatio = sgpPort > 0 ? (lkaPort / sgpPort) * 100 : 0
  const maritimeScore = Math.min(95, Math.max(40, 95 - portRatio * 0.5))
  opportunities.push({
    sector: 'Maritime & Logistics',
    score: Math.round(maritimeScore),
    rationale: `Sri Lanka handles ${formatNumber(lkaPort)} TEUs vs Singapore's ${formatNumber(sgpPort)}. Colombo sits on the world's busiest shipping lane — massive untapped potential.`,
    comparator: `Singapore handles ${sgpPort > 0 ? (sgpPort / (lkaPort || 1)).toFixed(0) : '?'}x more containers despite being smaller geographically`,
    icon: 'anchor',
  })

  // IT/BPO Services
  const internetPen = lka.internetUsers.at(-1)?.value ?? 0
  const literacyRate = lka.literacy.at(-1)?.value ?? 0
  const itScore = Math.min(92, Math.max(40, (internetPen * 0.4 + literacyRate * 0.5)))
  opportunities.push({
    sector: 'IT & BPO Services',
    score: Math.round(itScore),
    rationale: `${internetPen.toFixed(0)}% internet penetration and ${literacyRate.toFixed(0)}% literacy give Sri Lanka a strong foundation for IT services.`,
    comparator: `India's IT sector grew from $4B to $245B in 20 years with similar demographics`,
    icon: 'code',
  })

  // Tourism
  const tourismLatest = lka.tourismArrivals.at(-1)?.value ?? 0
  const tourismPeak = Math.max(...lka.tourismArrivals.map((d) => d.value), 1)
  const tourismRecovery = tourismPeak > 0 ? (tourismLatest / tourismPeak) * 100 : 0
  const tourismScore = Math.min(90, Math.max(50, 90 - tourismRecovery * 0.3))
  opportunities.push({
    sector: 'Tourism',
    score: Math.round(tourismScore),
    rationale: `Current arrivals at ${formatNumber(tourismLatest)} — ${tourismRecovery.toFixed(0)}% of peak levels. Recovery runway means significant growth ahead.`,
    comparator: `Thailand attracts 40M visitors/year from similar geographic advantages`,
    icon: 'palmtree',
  })

  // Renewable Energy
  const latestExports = lka.exports.at(-1)?.value ?? 0
  const latestImports = lka.imports.at(-1)?.value ?? 0
  const tradeDeficit = latestImports - latestExports
  const energyScore = Math.min(85, Math.max(45, 50 + (tradeDeficit > 0 ? Math.min(35, tradeDeficit / 1e9 * 5) : 0)))
  opportunities.push({
    sector: 'Renewable Energy',
    score: Math.round(energyScore),
    rationale: `Trade deficit of ${formatBillions(tradeDeficit)} driven partly by energy imports. Island geography offers strong solar and wind potential.`,
    comparator: `Vietnam added 16GW of solar in 3 years, cutting energy import dependency by 20%`,
    icon: 'sun',
  })

  // Medical Tourism
  const lifeExp = lka.lifeExpectancy.at(-1)?.value ?? 0
  const medScore = Math.min(80, Math.max(40, lifeExp * 1.1 - 5))
  opportunities.push({
    sector: 'Medical Tourism',
    score: Math.round(Math.min(medScore, 80)),
    rationale: `Life expectancy of ${lifeExp.toFixed(1)} years signals strong healthcare quality. Combined with low costs and English proficiency.`,
    comparator: `Thailand earns $5B/year from medical tourism with life expectancy of 78 years`,
    icon: 'heartpulse',
  })

  // Agriculture Tech
  const lkaExportGrowth = lka.exports.length >= 5
    ? ((lka.exports.at(-1)?.value ?? 0) / (lka.exports.at(-5)?.value ?? 1) - 1) * 100
    : 0
  const agriScore = Math.min(75, Math.max(40, 60 + lkaExportGrowth * 0.1))
  opportunities.push({
    sector: 'Agriculture Tech',
    score: Math.round(agriScore),
    rationale: `Sri Lanka's famous tea, spice, and rubber exports can be revolutionized with precision agriculture and value-added processing.`,
    comparator: `Israel turned arid land into $4B agriculture exports through agritech innovation`,
    icon: 'sprout',
  })

  return opportunities.sort((a, b) => b.score - a.score)
}

// ── Debt Sustainability ────────────────────────────────────────

export interface DebtProjection {
  year: number
  currentPath: number
  accelerated: number
  exportLed: number
}

export function computeDebtSustainability(lka: CountryMetrics): DebtProjection[] {
  const debtData = lka.debtToGdp
  const growthData = lka.gdpGrowth

  if (debtData.length === 0) return []

  const latestDebt = debtData.at(-1)?.value ?? 80
  const latestYear = debtData.at(-1)?.year ?? new Date().getFullYear()

  // Compute average debt change over last 5 years
  const recentDebt = debtData.slice(-5)
  let avgDebtChange = 0
  if (recentDebt.length >= 2) {
    avgDebtChange = (recentDebt.at(-1)!.value - recentDebt[0].value) / (recentDebt.length - 1)
  }

  // Current GDP growth rate
  const recentGrowth = growthData.slice(-3)
  const avgGrowth = recentGrowth.length > 0
    ? recentGrowth.reduce((sum, d) => sum + d.value, 0) / recentGrowth.length
    : 3

  const projections: DebtProjection[] = []

  for (let i = 0; i <= 10; i++) {
    const year = latestYear + i

    // Current trajectory: continue recent debt trend
    const currentPath = Math.max(0, latestDebt + avgDebtChange * i)

    // Accelerated growth (6% GDP growth) — debt falls faster
    const accelGrowthDiff = 6 - avgGrowth
    const accelerated = Math.max(0, latestDebt + (avgDebtChange - accelGrowthDiff * 0.8) * i)

    // Export-led (8% GDP growth) — aggressive debt reduction
    const exportGrowthDiff = 8 - avgGrowth
    const exportLed = Math.max(0, latestDebt + (avgDebtChange - exportGrowthDiff * 1.0) * i)

    projections.push({
      year,
      currentPath: Math.round(currentPath * 10) / 10,
      accelerated: Math.round(accelerated * 10) / 10,
      exportLed: Math.round(exportLed * 10) / 10,
    })
  }

  return projections
}

// ── Human Capital Edge ─────────────────────────────────────────

export interface HumanCapitalInsight {
  metric: string
  lkaValue: number
  sgpHistoricalValue: number | null
  sgpHistoricalYear: number | null
  advantage: boolean
  narrative: string
}

export function computeHumanCapitalEdge(
  lka: CountryMetrics,
  sgp: CountryMetrics
): HumanCapitalInsight[] {
  const currentLkaGdpPc = lka.gdpPerCapita.at(-1)?.value ?? 0
  const insights: HumanCapitalInsight[] = []

  // Find when SGP was at similar GDP per capita
  const sgpSorted = [...sgp.gdpPerCapita].sort((a, b) => a.year - b.year)
  let sgpMatchYear: number | null = null
  for (let i = 0; i < sgpSorted.length - 1; i++) {
    if (sgpSorted[i].value <= currentLkaGdpPc && sgpSorted[i + 1].value > currentLkaGdpPc) {
      sgpMatchYear = sgpSorted[i].year
      break
    }
  }

  function findSgpValueAtYear(data: TimeSeriesPoint[], year: number | null): number | null {
    if (year === null) return null
    const point = data.find((d) => d.year === year)
    if (point) return point.value
    // Find closest year
    const sorted = [...data].sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))
    return sorted[0]?.value ?? null
  }

  // Literacy
  const lkaLit = lka.literacy.at(-1)?.value ?? 0
  const sgpLit = findSgpValueAtYear(sgp.literacy, sgpMatchYear)
  if (lkaLit > 0) {
    const adv = sgpLit !== null ? lkaLit > sgpLit : false
    insights.push({
      metric: 'Literacy Rate',
      lkaValue: lkaLit,
      sgpHistoricalValue: sgpLit,
      sgpHistoricalYear: sgpMatchYear,
      advantage: adv,
      narrative: sgpLit !== null
        ? `Sri Lanka's literacy rate (${lkaLit.toFixed(0)}%) ${adv ? 'exceeds' : 'trails'} Singapore's ${sgpLit.toFixed(0)}% when Singapore was at the same GDP per capita level${sgpMatchYear ? ` in ${sgpMatchYear}` : ''}.`
        : `Sri Lanka's literacy rate stands at ${lkaLit.toFixed(0)}%, a strong foundation for economic development.`,
    })
  }

  // Life Expectancy
  const lkaLife = lka.lifeExpectancy.at(-1)?.value ?? 0
  const sgpLife = findSgpValueAtYear(sgp.lifeExpectancy, sgpMatchYear)
  if (lkaLife > 0) {
    const adv = sgpLife !== null ? lkaLife > sgpLife : false
    insights.push({
      metric: 'Life Expectancy',
      lkaValue: lkaLife,
      sgpHistoricalValue: sgpLife,
      sgpHistoricalYear: sgpMatchYear,
      advantage: adv,
      narrative: sgpLife !== null
        ? `Life expectancy of ${lkaLife.toFixed(1)} years ${adv ? 'surpasses' : 'is behind'} Singapore's ${sgpLife.toFixed(1)} years at the equivalent economic stage${sgpMatchYear ? ` (${sgpMatchYear})` : ''}.`
        : `Sri Lanka's life expectancy of ${lkaLife.toFixed(1)} years reflects strong healthcare fundamentals.`,
    })
  }

  // Internet Users
  const lkaNet = lka.internetUsers.at(-1)?.value ?? 0
  const sgpNet = findSgpValueAtYear(sgp.internetUsers, sgpMatchYear)
  if (lkaNet > 0) {
    const adv = sgpNet !== null ? lkaNet > sgpNet : false
    insights.push({
      metric: 'Internet Penetration',
      lkaValue: lkaNet,
      sgpHistoricalValue: sgpNet,
      sgpHistoricalYear: sgpMatchYear,
      advantage: adv,
      narrative: sgpNet !== null
        ? `Internet penetration at ${lkaNet.toFixed(0)}% ${adv ? 'exceeds' : 'trails'} Singapore's ${sgpNet.toFixed(0)}% at comparable GDP levels${sgpMatchYear ? ` (${sgpMatchYear})` : ''} — digital infrastructure leapfrogging in action.`
        : `Sri Lanka has ${lkaNet.toFixed(0)}% internet penetration, enabling digital economic transformation.`,
    })
  }

  // Urbanization
  const lkaUrb = lka.urbanPop.at(-1)?.value ?? 0
  const sgpUrb = findSgpValueAtYear(sgp.urbanPop, sgpMatchYear)
  if (lkaUrb > 0) {
    insights.push({
      metric: 'Urbanization',
      lkaValue: lkaUrb,
      sgpHistoricalValue: sgpUrb,
      sgpHistoricalYear: sgpMatchYear,
      advantage: false, // Lower urbanization = room to grow
      narrative: sgpUrb !== null
        ? `Urbanization at ${lkaUrb.toFixed(0)}% vs Singapore's ${sgpUrb.toFixed(0)}% — lower urbanization means untapped rural-to-urban productivity gains ahead.`
        : `With ${lkaUrb.toFixed(0)}% urbanization, Sri Lanka has significant room for productivity-boosting urban migration.`,
    })
  }

  return insights
}

// ── Peer Ranking ───────────────────────────────────────────────

export interface PeerRankingRow {
  metric: string
  lkaRank: number
  totalCountries: number
  lkaValue: string
  topCountry: string
  topValue: string
}

export function computePeerRanking(
  lka: CountryMetrics,
  peers: PeerData[]
): PeerRankingRow[] {
  const lkaGdpPc = lka.gdpPerCapita.at(-1)?.value ?? 0
  const lkaGrowth = lka.gdpGrowth.at(-1)?.value ?? 0
  const lkaInternet = lka.internetUsers.at(-1)?.value ?? 0
  const lkaLifeExp = lka.lifeExpectancy.at(-1)?.value ?? 0
  const lkaFdi = lka.fdi.at(-1)?.value ?? 0

  const allCountries = [
    { name: 'Sri Lanka', gdpPerCapita: lkaGdpPc, gdpGrowth: lkaGrowth },
    ...peers.map((p) => ({ name: p.name, gdpPerCapita: p.gdpPerCapita, gdpGrowth: p.gdpGrowth })),
  ]

  const rankings: PeerRankingRow[] = []
  const total = allCountries.length

  // GDP per Capita ranking
  const byGdpPc = [...allCountries].sort((a, b) => b.gdpPerCapita - a.gdpPerCapita)
  const gdpPcRank = byGdpPc.findIndex((c) => c.name === 'Sri Lanka') + 1
  rankings.push({
    metric: 'GDP per Capita',
    lkaRank: gdpPcRank,
    totalCountries: total,
    lkaValue: `$${lkaGdpPc.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    topCountry: byGdpPc[0].name,
    topValue: `$${byGdpPc[0].gdpPerCapita.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
  })

  // GDP Growth ranking
  const byGrowth = [...allCountries].sort((a, b) => b.gdpGrowth - a.gdpGrowth)
  const growthRank = byGrowth.findIndex((c) => c.name === 'Sri Lanka') + 1
  rankings.push({
    metric: 'GDP Growth',
    lkaRank: growthRank,
    totalCountries: total,
    lkaValue: formatPercent(lkaGrowth),
    topCountry: byGrowth[0].name,
    topValue: formatPercent(byGrowth[0].gdpGrowth),
  })

  // Internet penetration (only LKA available in full, use as standalone)
  rankings.push({
    metric: 'Internet Penetration',
    lkaRank: 0, // will show as "N/A" for peer comparison
    totalCountries: total,
    lkaValue: `${lkaInternet.toFixed(0)}%`,
    topCountry: '-',
    topValue: '-',
  })

  // Life Expectancy
  rankings.push({
    metric: 'Life Expectancy',
    lkaRank: 0,
    totalCountries: total,
    lkaValue: `${lkaLifeExp.toFixed(1)} years`,
    topCountry: '-',
    topValue: '-',
  })

  // FDI
  rankings.push({
    metric: 'Foreign Direct Investment',
    lkaRank: 0,
    totalCountries: total,
    lkaValue: formatBillions(lkaFdi),
    topCountry: '-',
    topValue: '-',
  })

  return rankings
}

// ── 90-Day Outlook ─────────────────────────────────────────────

export interface OutlookResult {
  sentiment: 'Recovery Momentum' | 'Cautiously Optimistic' | 'Challenges Ahead'
  gdpTrend: string
  reservesTrend: string
  debtTrend: string
  tradeTrend: string
  narrative: string
}

export function generateOutlook(lka: CountryMetrics): OutlookResult {
  const gdpTrendDir = calculateTrend(lka.gdpGrowth)
  const reservesTrendDir = calculateTrend(lka.reserves)
  const debtTrendDir = calculateTrend(lka.debtToGdp)

  const latestGrowth = lka.gdpGrowth.at(-1)?.value ?? 0
  const prevGrowth = lka.gdpGrowth.at(-2)?.value ?? 0
  const latestReserves = lka.reserves.at(-1)?.value ?? 0
  const latestDebt = lka.debtToGdp.at(-1)?.value ?? 0
  const latestExports = lka.exports.at(-1)?.value ?? 0
  const latestImports = lka.imports.at(-1)?.value ?? 0
  const prevExports = lka.exports.at(-2)?.value ?? 0

  const exportGrowing = latestExports > prevExports
  const tradeBalance = latestExports - latestImports

  // GDP trend text
  const gdpTrend = gdpTrendDir === 'up'
    ? `GDP growth accelerating at ${formatPercent(latestGrowth)}, up from ${formatPercent(prevGrowth)}.`
    : gdpTrendDir === 'down'
    ? `GDP growth decelerating to ${formatPercent(latestGrowth)}, down from ${formatPercent(prevGrowth)}.`
    : `GDP growth stable at ${formatPercent(latestGrowth)}.`

  // Reserves trend
  const reservesTrend = reservesTrendDir === 'up'
    ? `Foreign reserves strengthening at ${formatBillions(latestReserves)}, providing import cover.`
    : reservesTrendDir === 'down'
    ? `Foreign reserves declining to ${formatBillions(latestReserves)} — watch for import cover pressure.`
    : `Foreign reserves steady at ${formatBillions(latestReserves)}.`

  // Debt trend
  const debtTrend = debtTrendDir === 'up'
    ? `Debt-to-GDP rising to ${latestDebt.toFixed(1)}% — restructuring progress needed.`
    : debtTrendDir === 'down'
    ? `Debt-to-GDP declining to ${latestDebt.toFixed(1)}% — fiscal consolidation working.`
    : `Debt-to-GDP holding at ${latestDebt.toFixed(1)}%.`

  // Trade trend
  const tradeTrend = exportGrowing
    ? `Exports ${exportGrowing ? 'expanding' : 'contracting'} to ${formatBillions(latestExports)}. Trade ${tradeBalance >= 0 ? 'surplus' : 'deficit'} of ${formatBillions(Math.abs(tradeBalance))}.`
    : `Trade deficit at ${formatBillions(Math.abs(tradeBalance))}. Export diversification critical.`

  // Overall sentiment
  let positiveSignals = 0
  if (gdpTrendDir === 'up') positiveSignals++
  if (reservesTrendDir === 'up') positiveSignals++
  if (debtTrendDir === 'down') positiveSignals++
  if (exportGrowing) positiveSignals++

  let sentiment: OutlookResult['sentiment']
  if (positiveSignals >= 3) {
    sentiment = 'Recovery Momentum'
  } else if (positiveSignals >= 1) {
    sentiment = 'Cautiously Optimistic'
  } else {
    sentiment = 'Challenges Ahead'
  }

  const narrative = `Sri Lanka's economy shows ${sentiment.toLowerCase()} signals over the near term. ${gdpTrend} ${reservesTrend} ${debtTrend} ${tradeTrend} Key risks include global commodity prices, remittance flows, and the pace of structural reforms. The next 90 days will be shaped by IMF program compliance, tourism season performance, and export market conditions.`

  return { sentiment, gdpTrend, reservesTrend, debtTrend, tradeTrend, narrative }
}
