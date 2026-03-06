import type { Metadata } from 'next'
import { Geist, Geist_Mono, DM_Serif_Display } from 'next/font/google'
import { Toaster } from 'sonner'
import CookieConsent from '@/components/CookieConsent'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-dm-serif',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://lankapros.com'),
  title: 'LankaPros - Sri Lanka\'s Professional Network',
  description: 'Connect with Sri Lankan professionals. Build your career, grow your network, and showcase your expertise.',
  keywords: ['Sri Lanka', 'professional network', 'jobs', 'careers', 'LinkedIn alternative', 'LankaPros'],
  openGraph: {
    title: 'LankaPros - Sri Lanka\'s Professional Network',
    description: 'Connect with Sri Lankan professionals. Build your career, grow your network.',
    type: 'website',
    locale: 'en_US',
    siteName: 'LankaPros',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LankaPros - Sri Lanka\'s Professional Network',
    description: 'Connect with Sri Lankan professionals.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dmSerifDisplay.variable} antialiased bg-background text-foreground`}
      >
        <Toaster theme="dark" position="bottom-right" />
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
