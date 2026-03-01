import type { Metadata } from 'next'
import NewsPulse from '@/components/economy/NewsPulse'

export const metadata: Metadata = {
  title: 'News Pulse | LankaPros Economy',
  description: 'Live Sri Lanka news with sentiment analysis — positive, neutral, and negative headlines.',
}

export default function NewsPage() {
  return <NewsPulse />
}
