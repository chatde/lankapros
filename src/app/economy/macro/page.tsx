import { Suspense } from 'react'
import type { Metadata } from 'next'
import { fetchMacroData } from '@/lib/economy/api'
import MacroCharts from '@/components/economy/MacroCharts'
import EconomyLoading from '../loading'

export const metadata: Metadata = {
  title: 'Macro Economy | LankaPros Economy',
  description: 'Sri Lanka GDP, debt, trade balance, inflation, and foreign reserves.',
}

async function MacroContent() {
  const data = await fetchMacroData()
  return <MacroCharts data={data} />
}

export default function MacroPage() {
  return (
    <Suspense fallback={<EconomyLoading />}>
      <MacroContent />
    </Suspense>
  )
}
