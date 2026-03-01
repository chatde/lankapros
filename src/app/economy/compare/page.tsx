import type { Metadata } from 'next'
import CompareMode from '@/components/economy/CompareMode'

export const metadata: Metadata = {
  title: 'Compare Mode | LankaPros Economy',
  description: 'Compare Sri Lanka economic indicators against any country.',
}

export default function ComparePage() {
  return <CompareMode />
}
