import Navbar from '@/components/layout/Navbar'
import EconomyNav from '@/components/economy/EconomyNav'

export const metadata = {
  title: 'Economy | LankaPros',
  description: 'Sri Lanka economic data — GDP, exchange rates, stock market, trade, and more.',
}

export default function EconomyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">Sri Lanka Economy</h1>
          <p className="text-sm text-muted mt-1">Real-time economic data and indicators</p>
        </div>
        <div className="mb-6">
          <EconomyNav />
        </div>
        {children}
      </main>
    </div>
  )
}
