import { NextResponse } from 'next/server'

export const revalidate = 900 // 15 minutes

interface NewsItem {
  title: string
  link: string
  pubDate: string
  description: string
  source: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

const POSITIVE_KEYWORDS = [
  'growth', 'increase', 'recovery', 'peace', 'development', 'improve',
  'success', 'boost', 'rise', 'gain', 'positive', 'progress', 'reform',
  'investment', 'tourism', 'export', 'profit', 'agreement', 'milestone',
]

const NEGATIVE_KEYWORDS = [
  'crisis', 'death', 'flood', 'strike', 'violence', 'protest', 'decline',
  'fall', 'arrest', 'corruption', 'debt', 'shortage', 'inflation', 'poverty',
  'conflict', 'disaster', 'collapse', 'damage',
]

const RSS_FEEDS = [
  { url: 'https://www.adaderana.lk/rss.php', source: 'Ada Derana' },
  { url: 'https://www.dailymirror.lk/RSS_Feeds/breaking-news/108', source: 'Daily Mirror' },
]

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
}

function extractField(itemXml: string, field: string): string {
  // Try CDATA first
  const cdataPattern = new RegExp(`<${field}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${field}>`)
  const cdataMatch = itemXml.match(cdataPattern)
  if (cdataMatch) return cdataMatch[1].trim()

  // Try plain text
  const plainPattern = new RegExp(`<${field}>([\\s\\S]*?)</${field}>`)
  const plainMatch = itemXml.match(plainPattern)
  if (plainMatch) return stripHtml(plainMatch[1].trim())

  return ''
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase()
  let positiveCount = 0
  let negativeCount = 0

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lower.includes(keyword)) positiveCount++
  }
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lower.includes(keyword)) negativeCount++
  }

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 900 },
      headers: { 'User-Agent': 'LankaPros/1.0' },
    })
    if (!res.ok) return []

    const xml = await res.text()
    const items: NewsItem[] = []
    const itemPattern = /<item>([\s\S]*?)<\/item>/g
    let match: RegExpExecArray | null

    while ((match = itemPattern.exec(xml)) !== null) {
      const itemXml = match[1]
      const title = extractField(itemXml, 'title')
      const link = extractField(itemXml, 'link')
      const pubDate = extractField(itemXml, 'pubDate')
      const rawDesc = extractField(itemXml, 'description')
      const description = stripHtml(rawDesc)

      if (!title) continue

      const sentiment = analyzeSentiment(`${title} ${description}`)

      items.push({ title, link, pubDate, description, source, sentiment })
    }

    return items
  } catch {
    return []
  }
}

export async function GET() {
  const results = await Promise.all(
    RSS_FEEDS.map((feed) => fetchFeed(feed.url, feed.source))
  )

  const allItems = results
    .flat()
    .sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime()
      const dateB = new Date(b.pubDate).getTime()
      if (isNaN(dateA) && isNaN(dateB)) return 0
      if (isNaN(dateA)) return 1
      if (isNaN(dateB)) return -1
      return dateB - dateA
    })
    .slice(0, 30)

  return NextResponse.json(allItems)
}
