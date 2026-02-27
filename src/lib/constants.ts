export const INDUSTRIES = [
  { name: 'Information Technology', slug: 'it', icon: '💻' },
  { name: 'Tourism & Hospitality', slug: 'tourism', icon: '🏨' },
  { name: 'Tea & Agriculture', slug: 'agriculture', icon: '🌿' },
  { name: 'Apparel & Textiles', slug: 'apparel', icon: '👔' },
  { name: 'Banking & Finance', slug: 'finance', icon: '🏦' },
  { name: 'Education & Training', slug: 'education', icon: '📚' },
  { name: 'Healthcare & Pharma', slug: 'healthcare', icon: '🏥' },
  { name: 'Construction & Real Estate', slug: 'construction', icon: '🏗️' },
  { name: 'Manufacturing', slug: 'manufacturing', icon: '🏭' },
  { name: 'Shipping & Logistics', slug: 'logistics', icon: '🚢' },
  { name: 'Gems & Jewellery', slug: 'gems', icon: '💎' },
  { name: 'Media & Entertainment', slug: 'media', icon: '🎬' },
  { name: 'Telecommunications', slug: 'telecom', icon: '📡' },
  { name: 'Government & Public Sector', slug: 'government', icon: '🏛️' },
  { name: 'Legal Services', slug: 'legal', icon: '⚖️' },
  { name: 'NGO & Development', slug: 'ngo', icon: '🤝' },
  { name: 'Startups & Entrepreneurship', slug: 'startups', icon: '🚀' },
  { name: 'Freelance & Consulting', slug: 'freelance', icon: '💼' },
  { name: 'Arts & Design', slug: 'arts', icon: '🎨' },
] as const

export const THEME_PATTERNS = [
  { name: 'None', value: 'none' },
  { name: 'Dots', value: 'dots' },
  { name: 'Waves', value: 'waves' },
  { name: 'Batik', value: 'batik' },
  { name: 'Lotus', value: 'lotus' },
  { name: 'Grid', value: 'grid' },
] as const

export const DEFAULT_THEME = {
  accent: '#D4A843',
  bg: '#0f0f0f',
  text: '#ededed',
  pattern: 'none',
} as const

export const NAV_ITEMS = [
  { label: 'Feed', href: '/feed', icon: 'Home' },
  { label: 'Connections', href: '/connections', icon: 'Users' },
  { label: 'Messages', href: '/messages', icon: 'MessageCircle' },
  { label: 'Groups', href: '/groups', icon: 'Users2' },
  { label: 'Notifications', href: '/notifications', icon: 'Bell' },
] as const
