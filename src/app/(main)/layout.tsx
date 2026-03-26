import Navbar from '@/components/layout/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* pb-20 on mobile to avoid content sitting behind the fixed bottom nav */}
      <main className="mx-auto px-4 py-6 pb-24 md:pb-6 max-w-6xl">
        {children}
      </main>
    </div>
  )
}
