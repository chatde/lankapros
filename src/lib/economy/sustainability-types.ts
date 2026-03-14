import type { TimeSeriesPoint } from './types'

export type BlindSpotSeverity = 'critical' | 'high' | 'moderate' | 'emerging'

export type SustainabilityMetricId =
  | 'monsoon-shift'
  | 'brain-drain'
  | 'coastal-loss'
  | 'calorie-dependency'
  | 'groundwater'
  | 'microplastics'
  | 'coral-stress'
  | 'endemic-species'
  | 'urban-heat'
  | 'renewable-gap'
  | 'topsoil-loss'
  | 'antibiotic-resistance'
  | 'education-mismatch'
  | 'mangrove-carbon'

export interface SustainabilityMetric {
  id: SustainabilityMetricId
  name: string
  icon: string
  severity: BlindSpotSeverity
  headline: string
  headlineLabel: string
  blindSpot: string
  whyItMatters: string
  dataSource: string
  data: TimeSeriesPoint[]
  secondaryData?: TimeSeriesPoint[]
  secondaryLabel?: string
}

export interface EmergingMetric {
  id: SustainabilityMetricId
  name: string
  icon: string
  severity: BlindSpotSeverity
  description: string
  blindSpot: string
  dataAvailability: 'available' | 'partial' | 'research-needed'
}

export interface SustainabilityData {
  priorityMetrics: SustainabilityMetric[]
  emergingMetrics: EmergingMetric[]
  lastUpdated: string
}
