'use client'

import SectionHeader from './SectionHeader'
import InsightCard from './InsightCard'
import BlindSpotCard from './BlindSpotCard'
import RainfallPatternChart from './RainfallPatternChart'
import BrainDrainChart from './BrainDrainChart'
import TimeSeriesChart from './TimeSeriesChart'
import type { SustainabilityData, EmergingMetric } from '@/lib/economy/sustainability-types'

const AVAILABILITY_COLORS = {
  'available': { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Data Available' },
  'partial': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Partial Data' },
  'research-needed': { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Research Needed' },
}

const SEVERITY_COLORS = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  moderate: 'border-l-yellow-500',
  emerging: 'border-l-blue-500',
}

function EmergingMetricCard({ metric }: { metric: EmergingMetric }) {
  const avail = AVAILABILITY_COLORS[metric.dataAvailability]
  const border = SEVERITY_COLORS[metric.severity]

  return (
    <div className={`rounded-xl bg-[#161616] border border-[#2a2a2a] border-l-4 ${border} p-4`}>
      <div className="flex items-start gap-2">
        <span className="text-lg shrink-0">{metric.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white">{metric.name}</h4>
          <p className="text-xs text-[#aaaaaa] mt-1 leading-relaxed">{metric.description}</p>
          <div className="mt-2">
            <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${avail.bg} ${avail.text}`}>
              {avail.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SustainabilityDashboardProps {
  data: SustainabilityData
}

export default function SustainabilityDashboard({ data }: SustainabilityDashboardProps) {
  const [monsoon, brainDrain, coastal, calorie, groundwater] = data.priorityMetrics

  return (
    <div className="space-y-8">
      {/* Hero */}
      <InsightCard
        title="14 Metrics Nobody Is Watching"
        icon="🔍"
        highlight="14"
        highlightLabel="Blind spots identified by AI analysis"
      >
        Sri Lanka tracks what donors ask it to track and what crises force it to track.
        What it does not track are the slow-moving, compounding variables that determine
        whether the country thrives or slowly degrades over the next 20 years. These metrics
        sit between ministries, between disciplines, or between timescales that humans naturally
        plan around. Five have data available now. Nine more need investment to monitor.
      </InsightCard>

      {/* Priority Metric 1: Monsoon Shift */}
      <SectionHeader title="Priority Metrics" subtitle="5 blind spots with available data — tracked and computed in real-time" />

      {monsoon && (
        <div className="space-y-3">
          <BlindSpotCard metric={monsoon}>
            <RainfallPatternChart data={monsoon.data} />
          </BlindSpotCard>
        </div>
      )}

      {/* Priority Metric 2: Brain Drain */}
      {brainDrain && (
        <BlindSpotCard metric={brainDrain}>
          <BrainDrainChart
            migrationData={brainDrain.data}
            enrollmentData={brainDrain.secondaryData}
          />
        </BlindSpotCard>
      )}

      {/* Priority Metric 3: Coastal Loss */}
      {coastal && (
        <BlindSpotCard metric={coastal}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TimeSeriesChart
              title="Shoreline Retreat Rate (m/year)"
              data={coastal.data}
              format={(v) => `${v.toFixed(1)}m`}
              color="#ef4444"
              source="NARA / Coast Conservation"
            />
            {coastal.secondaryData && coastal.secondaryData.length > 0 && (
              <TimeSeriesChart
                title="Forest Area (% of land)"
                data={coastal.secondaryData}
                format={(v) => `${v.toFixed(1)}%`}
                color="#22c55e"
                source="World Bank"
              />
            )}
          </div>
        </BlindSpotCard>
      )}

      {/* Priority Metric 4: Calorie Dependency */}
      {calorie && (
        <BlindSpotCard metric={calorie}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TimeSeriesChart
              title="Food Imports (% of merchandise imports)"
              data={calorie.data}
              format={(v) => `${v.toFixed(0)}%`}
              color="#f59e0b"
              source="World Bank"
            />
            {calorie.secondaryData && calorie.secondaryData.length > 0 && (
              <TimeSeriesChart
                title="Crop Production Index"
                data={calorie.secondaryData}
                format={(v) => v.toFixed(0)}
                color="#22c55e"
                source="World Bank"
              />
            )}
          </div>
        </BlindSpotCard>
      )}

      {/* Priority Metric 5: Groundwater */}
      {groundwater && (
        <BlindSpotCard metric={groundwater}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TimeSeriesChart
              title="Freshwater per Capita (m³/year)"
              data={groundwater.data}
              format={(v) => v.toFixed(0)}
              color="#3b82f6"
              source="World Bank"
            />
            {groundwater.secondaryData && groundwater.secondaryData.length > 0 && (
              <TimeSeriesChart
                title="Safe Water Access (%)"
                data={groundwater.secondaryData}
                format={(v) => `${v.toFixed(0)}%`}
                color="#22c55e"
                source="World Bank"
              />
            )}
          </div>
        </BlindSpotCard>
      )}

      {/* Emerging Metrics */}
      <SectionHeader title="Emerging Blind Spots" subtitle="9 additional metrics that need investment to monitor — the next frontier" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.emergingMetrics.map((metric) => (
          <EmergingMetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-[#2a2a2a]">
        <p className="text-xs text-[#666666]">
          Last updated: {data.lastUpdated} · Data sources: World Bank, Open-Meteo, FAO, WHO, NARA, published research
        </p>
        <p className="text-xs text-[#555555] mt-1">
          Blind spots identified through AI analysis of public data gaps, cross-referencing published research with active monitoring programs.
        </p>
      </div>
    </div>
  )
}
