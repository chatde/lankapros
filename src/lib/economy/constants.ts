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
  { label: 'Intelligence', href: '/economy/intelligence' },
  { label: 'Overview', href: '/economy' },
  { label: 'Exchange Rates', href: '/economy/exchange-rates' },
  { label: 'Stock Market', href: '/economy/stock-market' },
  { label: 'Macro', href: '/economy/macro' },
  { label: 'Social', href: '/economy/social' },
  { label: 'Weather', href: '/economy/weather' },
  { label: 'News', href: '/economy/news' },
] as const

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

// Intelligence indicators for cross-country analysis
export const INTELLIGENCE_INDICATORS = {
  gdpPerCapita: 'NY.GDP.PCAP.CD',
  gdpPerCapitaGrowth: 'NY.GDP.PCAP.KD.ZG',
  exportsGoods: 'NE.EXP.GNFS.CD',
  importsGoods: 'NE.IMP.GNFS.CD',
  fdi: 'BX.KLT.DINV.CD.WD',
  portContainers: 'IS.SHP.GCNW.XQ',
  internetUsers: 'IT.NET.USER.ZS',
  mobileSubscriptions: 'IT.CEL.SETS.P2',
  lifeExpectancy: 'SP.DYN.LE00.IN',
  literacy: 'SE.ADT.LITR.ZS',
  population: 'SP.POP.TOTL',
  urbanPop: 'SP.URB.TOTL.IN.ZS',
  highTechExports: 'TX.VAL.TECH.CD',
  researchSpending: 'GB.XPD.RSDV.GD.ZS',
  easeOfBusiness: 'IC.BUS.DFRN.XQ',
} as const

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
