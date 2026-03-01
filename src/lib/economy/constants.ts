// World Bank indicator codes for Sri Lanka (LKA)
export const WB_COUNTRY = 'LKA'
export const WB_INDICATORS = {
  gdp: 'NY.GDP.MKTP.CD',           // GDP current USD
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',  // GDP growth annual %
  inflation: 'FP.CPI.TOTL.ZG',     // Inflation CPI annual %
  debtToGdp: 'GC.DOD.TOTL.GD.ZS',  // Central govt debt % GDP
  exports: 'NE.EXP.GNFS.CD',       // Exports of goods & services
  imports: 'NE.IMP.GNFS.CD',       // Imports of goods & services
  reserves: 'FI.RES.TOTL.CD',      // Total reserves
  unemployment: 'SL.UEM.TOTL.ZS',  // Unemployment total %
  tourismArrivals: 'ST.INT.ARVL',   // International tourism arrivals
  tourismReceipts: 'ST.INT.RCPT.CD', // Tourism receipts current USD
} as const

// IMF WEO indicator codes
export const IMF_INDICATORS = {
  gdpGrowth: 'NGDP_RPCH',
  inflation: 'PCPIPCH',
  unemployment: 'LUR',
  debtToGdp: 'GGXWDG_NGDP',
} as const

// Exchange rate currencies to track
export const TRACKED_CURRENCIES = [
  { code: 'usd', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'eur', name: 'Euro', flag: '🇪🇺' },
  { code: 'gbp', name: 'British Pound', flag: '🇬🇧' },
  { code: 'inr', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'jpy', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'aud', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'cny', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'sgd', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'aed', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'sar', name: 'Saudi Riyal', flag: '🇸🇦' },
] as const

// Economy sub-tab navigation
export const ECONOMY_TABS = [
  { label: 'Overview', href: '/economy' },
  { label: 'Exchange Rates', href: '/economy/exchange-rates' },
  { label: 'Stock Market', href: '/economy/stock-market' },
  { label: 'Macro', href: '/economy/macro' },
  { label: 'Social', href: '/economy/social' },
] as const

// Chart colors
export const CHART_COLORS = {
  primary: '#D4A843',
  primaryFill: 'rgba(212, 168, 67, 0.2)',
  secondary: '#888888',
  success: '#22c55e',
  danger: '#ef4444',
  exports: '#22c55e',
  imports: '#ef4444',
  forecast: '#D4A843',
  forecastFill: 'rgba(212, 168, 67, 0.08)',
  grid: '#2a2a2a',
  tooltip: '#161616',
  tooltipBorder: '#2a2a2a',
  text: '#888888',
} as const
