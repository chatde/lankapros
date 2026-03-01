import Navbar from '@/components/layout/Navbar'
import EconomyNav from '@/components/economy/EconomyNav'
import CountryPulseHeader from '@/components/economy/CountryPulseHeader'

export const metadata = {
  title: 'Economy | LankaPros',
  description: 'Sri Lanka economic data — GDP, exchange rates, stock market, trade, and more.',
}

export default function EconomyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CountryPulseHeader />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <EconomyNav />
        </div>
        {children}
      </main>
    </div>
  )
}
