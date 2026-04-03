import type { Metadata, Viewport } from 'next'
import './globals.css'

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
