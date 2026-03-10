import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InteractiveGlobe } from '@/components/ui/interactive-globe'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/feed')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="pattern-lotus absolute inset-0 opacity-30" />
        <div className="relative max-w-5xl mx-auto px-4 py-16">
          {/* Globe hero layout: text left, globe right on md+ */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-4">
            {/* Left — copy */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="text-2xl tracking-widest font-serif-display text-accent opacity-60">✦ LP ✦</div>
              </div>
              <h1 className="font-serif-display text-4xl md:text-6xl font-bold mb-4 animate-lk-fade-up">
                Lanka<span className="text-accent">Pros</span>
              </h1>
              <p className="font-serif-display text-2xl md:text-3xl text-accent/70 italic mb-2">Ayubowan!</p>
              <p className="text-lg text-muted max-w-xl mb-8 animate-lk-fade-up-2">
                Sri Lanka&apos;s professional network. Connect, collaborate, and grow your career
                with professionals across the island and the globe.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-accent text-black font-semibold hover:bg-accent-hover transition-colors"
                >
                  Join now — it&apos;s free
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-12 px-8 rounded-lg border border-border text-foreground font-semibold hover:bg-card transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>

            {/* Right — interactive globe */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <p className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-muted whitespace-nowrap">
                  Drag to explore · Sri Lanka connected worldwide
                </p>
                <InteractiveGlobe size={440} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Economy Dashboard CTA */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/economy" className="economy-card block rounded-xl bg-card border border-border p-8 hover:bg-card-hover transition-colors group">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-xl border border-accent/20 bg-accent/8 flex items-center justify-center text-2xl text-accent flex-shrink-0">
              ◈
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="font-serif-display text-2xl font-bold mb-2 italic">Sri Lanka Pulse — Economy Dashboard</h2>
              <p className="text-muted mb-3">
                The most comprehensive free country tracker for Sri Lanka. Live GDP, exchange rates, stock market,
                weather, news sentiment, strategic intelligence, and more — all from public data sources.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs">
                {['Live Data', 'Compare Mode', 'Time Machine', 'Intelligence', 'Weather', 'News', '11 Tabs'].map(tag => (
                  <span key={tag} className="data-tag px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">{tag}</span>
                ))}
              </div>
            </div>
            <span className="text-accent text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Build Your Profile',
              desc: 'Customize your profile with MySpace-style themes. Stand out with unique colors and patterns.',
              icon: '🎨',
            },
            {
              title: 'Grow Your Network',
              desc: 'Connect with professionals across 19 Sri Lankan industries. From IT to Tea & Agriculture.',
              icon: '🤝',
            },
            {
              title: 'Share & Engage',
              desc: 'Post updates, join industry groups, and message connections in real-time.',
              icon: '💬',
            },
          ].map(feature => (
            <div key={feature.title} className="rounded-xl bg-card border border-border p-6 text-center">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Industries */}
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-6">19 Sri Lankan Industries</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {['💻 IT', '🏨 Tourism', '🌿 Agriculture', '👔 Apparel', '🏦 Finance', '📚 Education', '🏥 Healthcare', '🏗️ Construction', '🏭 Manufacturing', '🚢 Logistics', '💎 Gems', '🎬 Media', '📡 Telecom', '🏛️ Government', '⚖️ Legal', '🤝 NGO', '🚀 Startups', '💼 Freelance', '🎨 Arts'].map(ind => (
            <span key={ind} className="px-3 py-1.5 rounded-full bg-card border border-border text-sm">
              {ind}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        <p>&copy; {new Date().getFullYear()} LankaPros. Built for Sri Lankan professionals.</p>
        <div className="mt-3 flex justify-center gap-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
