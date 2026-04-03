'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Painting, paintings } from '@/lib/paintings'
import { useScrollDepth } from '@/hooks/useScrollDepth'
import { DetailPanel } from '@/components/DetailPanel'
import { HUD } from '@/components/HUD'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Filmstrip } from '@/components/Filmstrip'

const GallerySceneModule = dynamic(
  () => import('@/components/GalleryScene'),
  { ssr: false }
)

// Match GalleryScene's TOTAL_DEPTH: paintings * frame spacing + end buffer
const SCROLL_DEPTH = paintings.length * 7.5 + 8

export default function GalleryPage() {
  const [loaded, setLoaded] = useState(false)
  const [activePainting, setActivePainting] = useState<Painting | null>(null)
  const { jumpTo } = useScrollDepth(SCROLL_DEPTH)

  const handlePaintingClick = useCallback((p: Painting) => {
    setActivePainting(p)
  }, [])

  const handleClose = useCallback(() => {
    setActivePainting(null)
  }, [])

  const handleFilmstripSelect = useCallback((p: Painting) => {
    setActivePainting(p)
  }, [])

  return (
    <main style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: '#050403'
    }}>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}

      {loaded && (
        <>
          <GallerySceneModule
            activePainting={activePainting}
            onPaintingClick={handlePaintingClick}
          />

          <HUD
            activePainting={activePainting?.title ?? null}
          />

          <Filmstrip
            activePainting={activePainting}
            onSelect={handleFilmstripSelect}
          />

          <DetailPanel painting={activePainting} onClose={handleClose} />
        </>
      )}
    </main>
  )
}
