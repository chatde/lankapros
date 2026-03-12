import type { Metadata } from 'next'
import CryptoDashboard from '@/components/economy/CryptoDashboard'
import SectionHeader from '@/components/economy/SectionHeader'
import DataSourceTag from '@/components/economy/DataSourceTag'

export const metadata: Metadata = {
  title: 'Crypto in LKR | LankaPros Economy',
  description: 'Live Bitcoin, Ethereum, XRP and BNB prices in Sri Lankan Rupees.',
}

export default function CryptoPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Crypto in LKR"
          subtitle="Live prices for major cryptocurrencies in Sri Lankan Rupees — updates every 5 minutes"
        />
        <DataSourceTag source="CoinGecko" />
      </div>
      <CryptoDashboard />
    </div>
  )
}
