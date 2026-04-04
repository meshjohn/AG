'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Painting, paintings } from '@/lib/paintings'
import { FRAME_SPACING } from '@/lib/constants'
import { useScrollDepth } from '@/hooks/useScrollDepth'
import { DetailPanel } from '@/components/DetailPanel'
import { HUD } from '@/components/HUD'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Filmstrip } from '@/components/Filmstrip'

const GallerySceneModule = dynamic(
  () => import('@/components/GalleryScene'),
  { ssr: false }
)

const SCROLL_DEPTH = paintings.length * FRAME_SPACING + 8

export default function GalleryPage() {
  const [loaded, setLoaded] = useState(false)
  const [activePainting, setActivePainting] = useState<Painting | null>(null)
  const { jumpTo } = useScrollDepth(SCROLL_DEPTH)

  // ── URL state sync ─────────────────────────────────────────────────────────
  // On first mount: restore ?id= from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      const p = paintings.find((p) => p.id === parseInt(id, 10))
      if (p) setActivePainting(p)
    }
  }, [])

  // Keep URL in sync with active painting
  useEffect(() => {
    if (activePainting) {
      window.history.replaceState(null, '', `?id=${activePainting.id}`)
    } else {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [activePainting])

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ESC handled by DetailPanel already; skip here
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setActivePainting((current) => {
          if (!current) return paintings[0]
          const idx = paintings.indexOf(current)
          return paintings[Math.min(idx + 1, paintings.length - 1)]
        })
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setActivePainting((current) => {
          if (!current) return null
          const idx = paintings.indexOf(current)
          return idx === 0 ? null : paintings[idx - 1]
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePaintingClick = useCallback((p: Painting) => {
    setActivePainting(p)
  }, [])

  const handleClose = useCallback(() => {
    setActivePainting(null)
  }, [])

  const handleFilmstripSelect = useCallback((p: Painting) => {
    setActivePainting(p)
  }, [])

  const handleJumpTo = useCallback(
    (z: number) => {
      jumpTo(z)
    },
    [jumpTo]
  )

  return (
    <main style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#050403' }}>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}

      {loaded && (
        <>
          <GallerySceneModule
            activePainting={activePainting}
            onPaintingClick={handlePaintingClick}
          />

          <HUD
            activePainting={activePainting?.title ?? null}
            activePaintingId={activePainting?.id ?? null}
          />

          <Filmstrip
            activePainting={activePainting}
            onSelect={handleFilmstripSelect}
            onJumpTo={handleJumpTo}
          />

          <DetailPanel painting={activePainting} onClose={handleClose} />
        </>
      )}
    </main>
  )
}
