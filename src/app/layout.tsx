import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
import './globals.css'

// ─── Global Font Configuration ───────────────────────────────────────────────
// We use Next.js built-in font optimisation. This fetches the Google Font,
// hosts it locally on our server, and preloads it automatically to prevent
// Cumulative Layout Shift (CLS) on initial load.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
})

// ─── Global SEO & Metadata ───────────────────────────────────────────────────
// These values populate the <head> tags on the server side for SEO and
// rich social media sharing cards (OpenGraph).
export const metadata: Metadata = {
  title: 'Alaa Mansour — Graphite Gallery',
  description: 'An immersive 3D hallway gallery of pencil artworks by Alaa Mansour.',
  openGraph: {
    title: 'Alaa Mansour — Graphite Gallery',
    description: 'Walk through an infinite gallery of intimate graphite portraits.',
    type: 'website',
  },
  appleWebApp: {
    capable: true, // Enables full-screen "Save to Home Screen" on iOS
    statusBarStyle: 'black-translucent',
  },
}

// ─── Explicit Viewport Definition ───────────────────────────────────────────
// Separate viewport export — required by Next.js 14+ to set the <meta name="viewport"> tag.
// CRITICAL for mobile WebGL performance:
// `userScalable: false` heavily restricts mobile browsers from their default
// pinch-zoom and rubber-band overscroll behaviours. If the browser tries to
// zoom or bounce the <body> natively, the <Canvas> often turns totally black.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Extends under the iPhone notch
  themeColor: '#050403', // Sets mobile browser UI colour to match our background
}

// ─── Root Application Shell ──────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Apply the preloaded font class to the very root of the DOM */}
      <body className={cormorant.className}>{children}</body>
    </html>
  )
}
