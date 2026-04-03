import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Alaa Mansour — Graphite Gallery',
  description: 'An immersive 3D hallway gallery of pencil artworks by Alaa Mansour.',
  openGraph: {
    title: 'Alaa Mansour — Graphite Gallery',
    description: 'Walk through an infinite gallery of intimate graphite portraits.',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
}

// Separate viewport export — required by Next.js 14+ to set the <meta name="viewport"> tag.
// CRITICAL for mobile: prevents iOS Safari pinch-zoom & rubber-band bounce that blacks out WebGL.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#050403',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cormorant.className}>{children}</body>
    </html>
  )
}
