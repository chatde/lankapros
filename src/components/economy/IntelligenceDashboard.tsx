'use client'

import type { IntelligenceData } from '@/lib/economy/intelligence-api'
import {
  computeSingaporeGap,
  computeSectorOpportunities,
  computeDebtSustainability,
  computeHumanCapitalEdge,
  computePeerRanking,
  generateOutlook,
} from '@/lib/economy/intelligence-compute'
import { formatBillions } from '@/lib/economy/format'
import SectionHeader from './SectionHeader'
import InsightCard from './InsightCard'
import SingaporeGapChart from './SingaporeGapChart'
import OpportunityMap from './OpportunityMap'
import DebtClock from './DebtClock'
import { cn } from '@/lib/utils'

interface IntelligenceDashboardProps {
  data: IntelligenceData
}

export default function IntelligenceDashboard({ data }: IntelligenceDashboardProps) {
  const { lka, sgp, peers } = data

  const gap = computeSingaporeGap(lka, sgp)
  const opportunities = computeSectorOpportunities(lka, sgp)
  const debtProjections = computeDebtSustainability(lka)
  const humanCapital = computeHumanCapitalEdge(lka, sgp)
  const peerRanking = computePeerRanking(lka, peers)
  const outlook = generateOutlook(lka)

  const gdpPerCapitaStr = gap.currentLkaGdpPc > 0
    ? `$${gap.currentLkaGdpPc.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : 'N/A'

  const latestGrowth = lka.gdpGrowth.at(-1)?.value ?? 0
  const latestReserves = lka.reserves.at(-1)?.value ?? 0
  const latestPop = lka.population.at(-1)?.value ?? 0

  const sentimentColor = outlook.sentiment === 'Recovery Momentum'
    ? 'text-green-400'
    : outlook.sentiment === 'Cautiously Optimistic'
    ? 'text-yellow-400'
    : 'text-red-400'

  return (
    <div className="space-y-8">
      {/* Hero Insight */}
      <InsightCard
        title="Where Sri Lanka Stands"
        icon="\u{1F1F1}\u{1F1F0}"
        highlight={gdpPerCapitaStr}
        highlightLabel="GDP per Capita"
      >
        <p>
          Sri Lanka, a nation of {latestPop > 0 ? `${(latestPop / 1e6).toFixed(1)} million` : 'over 22 million'} people,
          currently produces {gdpPerCapitaStr} per person annually.
          {latestGrowth !== 0 && ` The economy is growing at ${latestGrowth > 0 ? '+' : ''}${latestGrowth.toFixed(1)}%.`}
          {latestReserves > 0 && ` Foreign reserves stand at ${formatBillions(latestReserves)}.`}
          {' '}This intelligence brief analyzes Sri Lanka{"'"}s national trajectory, benchmarks against
          regional success stories, identifies high-potential sectors, and projects debt sustainability
          scenarios — the kind of strategic analysis that shapes policy.
        </p>
      </InsightCard>

      {/* Development Trajectory */}
      <section>
        <SectionHeader
          title="Development Trajectory"
          subtitle="Where Sri Lanka sits among Asian growth stories — and what the data says is possible"
        />
        <div className="space-y-4">
          <InsightCard title="The Path Forward" icon="\u{1F4CA}">
            {gap.sgpMatchYear ? (
              <p>
                Nations like Singapore, Malaysia, and Vietnam have proven that small, strategically-located
                Asian economies can achieve rapid transformation. For context, Singapore was at Sri Lanka{"'"}s
                current GDP per capita ({gdpPerCapitaStr}) in <strong>{gap.sgpMatchYear}</strong> — and grew{' '}
                <strong>{gap.sgpGrowthSinceMatch.toFixed(1)}x</strong> since then. Sri Lanka{"'"}s location on
                the Indian Ocean{"'"}s busiest shipping lane, its {latestPop > 0 ? `${(latestPop / 1e6).toFixed(0)}M` : ''} English-literate
                workforce, and recent economic stabilization create a foundation for similar — though uniquely
                Sri Lankan — growth trajectories.
              </p>
            ) : (
              <p>
                Sri Lanka{"'"}s GDP per capita ({gdpPerCapitaStr}) positions it at a critical inflection point.
                Regional benchmarks like Singapore (${gap.currentSgpGdpPc.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                show the ceiling for small Asian island economies is far higher.
                Sustained structural reforms, export diversification, and human capital investment are the levers.
              </p>
            )}
          </InsightCard>
          <SingaporeGapChart data={gap.series} sgpMatchYear={gap.sgpMatchYear} />
        </div>
      </section>

      {/* Opportunity Map */}
      <section>
        <SectionHeader
          title="Opportunity Map"
          subtitle="Sectors where Sri Lanka has untapped potential, scored 0-100"
        />
        <OpportunityMap opportunities={opportunities} />
      </section>

      {/* Debt Sustainability */}
      <section>
        <SectionHeader
          title="Debt Sustainability"
          subtitle="Three scenarios for the next decade"
        />
        <div className="space-y-4">
          <InsightCard title="Scenario Analysis" icon="\u{1F4C9}">
            <p>
              {debtProjections.length > 0 ? (
                <>
                  Current debt-to-GDP sits at <strong>{debtProjections[0].currentPath}%</strong>.
                  On the current trajectory, debt {
                    debtProjections.at(-1)!.currentPath > debtProjections[0].currentPath
                      ? `rises to ${debtProjections.at(-1)!.currentPath.toFixed(0)}%`
                      : `falls to ${debtProjections.at(-1)!.currentPath.toFixed(0)}%`
                  } by {debtProjections.at(-1)!.year}.
                  With accelerated 6% growth, it could reach {debtProjections.at(-1)!.accelerated.toFixed(0)}%.
                  An export-led 8% growth strategy could bring it to {debtProjections.at(-1)!.exportLed.toFixed(0)}% —
                  {debtProjections.at(-1)!.exportLed < 60
                    ? ' below the IMF-recommended 60% threshold.'
                    : ' still above the IMF-recommended 60% threshold, requiring continued fiscal discipline.'}
                </>
              ) : (
                <>Debt projection data is currently unavailable.</>
              )}
            </p>
          </InsightCard>
          <DebtClock data={debtProjections} />
        </div>
      </section>

      {/* Human Capital Edge */}
      <section>
        <SectionHeader
          title="Sri Lanka's Hidden Edge"
          subtitle="Human capital advantages vs nations at the same stage of development"
        />
        {humanCapital.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {humanCapital.map((insight) => (
              <InsightCard
                key={insight.metric}
                title={insight.metric}
                icon={insight.advantage ? '\u2705' : '\u{1F4CA}'}
                highlight={
                  insight.metric === 'Life Expectancy'
                    ? `${insight.lkaValue.toFixed(1)}y`
                    : `${insight.lkaValue.toFixed(0)}%`
                }
                highlightLabel="Sri Lanka Today"
              >
                <p>{insight.narrative}</p>
              </InsightCard>
            ))}
          </div>
        ) : (
          <InsightCard title="Human Capital" icon="\u{1F4CA}">
            <p>Human capital comparison data is currently being loaded from World Bank sources.</p>
          </InsightCard>
        )}
      </section>

      {/* Peer Ranking */}
      <section>
        <SectionHeader
          title="Regional Ranking"
          subtitle="Sri Lanka vs South & Southeast Asian peers"
        />
        <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left py-3 px-4 text-xs font-medium text-[#888888] uppercase tracking-wide">Metric</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#888888] uppercase tracking-wide">Sri Lanka</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-[#888888] uppercase tracking-wide">Rank</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#888888] uppercase tracking-wide hidden sm:table-cell">Top Peer</th>
              </tr>
            </thead>
            <tbody>
              {peerRanking.map((row) => (
                <tr key={row.metric} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a] transition-colors">
                  <td className="py-3 px-4 text-white font-medium">{row.metric}</td>
                  <td className="py-3 px-4 text-[#D4A843] font-mono">{row.lkaValue}</td>
                  <td className="py-3 px-4 text-center">
                    {row.lkaRank > 0 ? (
                      <span className={cn(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                        row.lkaRank <= 2 ? 'bg-green-500/20 text-green-400' : row.lkaRank <= 4 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400',
                      )}>
                        {row.lkaRank}
                      </span>
                    ) : (
                      <span className="text-[#888888] text-xs">--</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#888888] text-xs hidden sm:table-cell">
                    {row.topCountry !== '-' ? `${row.topCountry}: ${row.topValue}` : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 90-Day Outlook */}
      <section>
        <SectionHeader
          title="90-Day Outlook"
          subtitle="Based on latest data trends"
        />
        <InsightCard
          title={outlook.sentiment}
          icon={
            outlook.sentiment === 'Recovery Momentum' ? '\u{1F7E2}'
            : outlook.sentiment === 'Cautiously Optimistic' ? '\u{1F7E1}'
            : '\u{1F534}'
          }
        >
          <p className={cn('text-base font-semibold mb-3', sentimentColor)}>
            {outlook.sentiment}
          </p>
          <p>{outlook.narrative}</p>
        </InsightCard>
      </section>

      {/* Data Source */}
      <p className="text-xs text-[#555555] text-center pb-4">
        Data: World Bank Open Data &middot; IMF WEO &middot; Updated daily &middot; All analysis computed from real-time indicators &middot; Built for Sri Lanka
      </p>
    </div>
  )
}
