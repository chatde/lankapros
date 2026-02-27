import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-black font-bold text-lg">LP</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold">Lanka<span className="text-accent">Pros</span></h1>
          <p className="text-muted text-sm mt-1">Sri Lanka&apos;s Professional Network</p>
        </div>
        {children}
      </div>
    </div>
  )
}
