'use client'

// ─── Main Page Component ──────────────────────────────────────────────────────
// This is the root page of the Next.js application.
// It acts as the coordinator between the 3D WebGL scene (GalleryScene)
// and the 2D HTML/CSS overlapping UI elements (HUD, DetailPanel, Filmstrip).

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Painting, paintings } from '@/lib/paintings'
import { FRAME_SPACING } from '@/lib/constants'
import { useScrollDepth } from '@/hooks/useScrollDepth'
import { DetailPanel } from '@/components/DetailPanel'
import { HUD } from '@/components/HUD'
import { LoadingScreen } from '@/components/LoadingScreen'
import { Filmstrip } from '@/components/Filmstrip'

// Dynamically import the 3D scene so Next.js doesn't try to render it on the server (SSR).
// Three.js relies heavily on browser APIs (window, document, WebGL), which crash SSR.
const GallerySceneModule = dynamic(
  () => import('@/components/GalleryScene'),
  { ssr: false }
)

// Calculate total scrollable depth.
// We add 8 extra units so the camera can travel slightly past the last frame.
const SCROLL_DEPTH = paintings.length * FRAME_SPACING + 8

export default function GalleryPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [loaded, setLoaded] = useState(false) // true when all image textures have preloaded
  const [activePainting, setActivePainting] = useState<Painting | null>(null) // the currently focused painting
  
  // Wire up the central scroll/look/drag hook.
  // We pass SCROLL_DEPTH down so the hook knows how far we can move.
  const { jumpTo } = useScrollDepth(SCROLL_DEPTH)

  // ── URL State Sync ─────────────────────────────────────────────────────────
  // Feature: Deep-linking.
  // We sync the currently active painting to the URL query string (e.g. ?id=3).

  // 1. On mount: if there's an ?id parameter, immediately open that painting.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      // Find the painting matching this ID
      const p = paintings.find((p) => p.id === parseInt(id, 10))
      if (p) setActivePainting(p)
    }
  }, [])

  // 2. On change: whenever `activePainting` updates, push its ID into the URL bar
  //    using the History API, without triggering a full page reload.
  useEffect(() => {
    if (activePainting) {
      window.history.replaceState(null, '', `?id=${activePainting.id}`)
    } else {
      // If nothing is focused, remove the query param completely
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [activePainting])

  // ── Keyboard Navigation ────────────────────────────────────────────────────
  // Feature: Let users press Left/Right/Up/Down arrow keys to walk from painting to painting.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // (Note: The ESC key handles closing the panel inside DetailPanel already)
      
      // Moving Forward / Next
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault() // stop normal browser page scroll
        setActivePainting((current) => {
          // If no painting is active, start at the first one
          if (!current) return paintings[0]
          
          // Move forward, clamped to the length of the array
          const idx = paintings.indexOf(current)
          return paintings[Math.min(idx + 1, paintings.length - 1)]
        })
      } 
      // Moving Backward / Prev
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setActivePainting((current) => {
          // If we're at the very first painting, un-focus it
          if (!current) return null
          const idx = paintings.indexOf(current)
          return idx === 0 ? null : paintings[idx - 1]
        })
      }
    }
    
    // Attach listener globally to the window
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Event Handlers ─────────────────────────────────────────────────────────
  // We use useCallback so these functions retain the same memory reference across
  // renders, which prevents child components from re-rendering needlessly.

  // Called when the user clicks a 3D frame inside GalleryScene
  const handlePaintingClick = useCallback((p: Painting) => {
    setActivePainting(p)
  }, [])

  // Called when the user clicks the "X", presses ESC, or clicks the backdrop
  const handleClose = useCallback(() => {
    setActivePainting(null)
  }, [])

  // Called when a thumbnail is clicked in the bottom filmstrip UI
  const handleFilmstripSelect = useCallback((p: Painting) => {
    setActivePainting(p)
  }, [])

  // Called by Filmstrip when it needs to warp the 3D camera to a specific Z-depth
  const handleJumpTo = useCallback(
    (z: number) => {
      jumpTo(z)
    },
    [jumpTo]
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={{ 
      width: '100%', height: '100%', 
      overflow: 'hidden',
      background: '#030508'  // matches body, canvas, and loading screen exactly
    }}>
      
      {/* 1. Loading screen — kept mounted until fade is fully complete */}
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}

      {/* 2. Gallery mounts immediately so Canvas can begin painting behind the loading screen */}
      {loaded && (
        <>
          {/* Background Layer: 3D Scene */}
          <GallerySceneModule
            activePainting={activePainting}
            onPaintingClick={handlePaintingClick}
          />

          {/* Foreground UI Layer 1: Heads Up Display (logo, progress bar, audio toggle) */}
          <HUD
            activePainting={activePainting?.title ?? null}
            activePaintingId={activePainting?.id ?? null}
          />

          {/* Foreground UI Layer 2: Thumbnail strip at the bottom */}
          <Filmstrip
            activePainting={activePainting}
            onSelect={handleFilmstripSelect}
            onJumpTo={handleJumpTo}
          />

          {/* Foreground UI Layer 3: Pop-over side panel showing painting details/info */}
          <DetailPanel 
            painting={activePainting} 
            onClose={handleClose} 
          />
        </>
      )}
    </main>
  )
}
