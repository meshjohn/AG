'use client'

// ─── DetailPanel Component ────────────────────────────────────────────────────
// A pop-over information overlay that slides in from the right edge.
// Contains text metadata about the focused painting, a zoomable version of
// the image, and a download action.

import { useEffect, useRef, useState, useCallback } from 'react'
import { Painting } from '@/lib/paintings'
import styles from './DetailPanel.module.css'

interface DetailPanelProps {
  painting: Painting | null  // The artwork to display metadata for, or null if hidden
  onClose: () => void        // Fired when the user dismisses the panel
}

export function DetailPanel({ painting, onClose }: DetailPanelProps) {
  // The main sliding container node
  const panelRef = useRef<HTMLDivElement>(null)
  
  // Tracks whether the user has clicked the image to zoom it in
  // When zoomed, the image fills more space, often obscuring text.
  const [isZoomed, setIsZoomed] = useState(false)

  // ── Auto-reset state ────────────────────────────────────────────────────────
  // Whenever the active painting swaps, we immediately reset the zoom level
  // back to normal so the next painting loads cleanly.
  useEffect(() => {
    setIsZoomed(false)
  }, [painting?.id])

  // ── Keyboard Escape Handler ─────────────────────────────────────────────────
  // We manage the "Escape" key locally to provide a two-step withdrawal:
  // Step 1. First time hitting ESC: If the image is zoomed, un-zoom it.
  // Step 2. Second time hitting ESC: Tell the parent to close the panel entirely.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) setIsZoomed(false)  // step 1
        else onClose()                    // step 2
      }
    }
    
    // Listen directly on window
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey) // cleanup
  }, [onClose, isZoomed])

  // ── Event Propagation Blocker ───────────────────────────────────────────────
  // A crucial bug fix piece:
  // The global 3D scene (GalleryScene / useScrollDepth) binds touch and scroll 
  // listeners to the whole `window` in a completely detached fashion.
  // When a user scrolls text *inside* this panel, we don't want those scroll events
  // bubbling up to the `window` and making the 3D scene fly away silently behind us.
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    
    const stop = (e: Event) => e.stopPropagation()
    
    // By stopping propagation here, `useScrollDepth` never hears these events
    el.addEventListener('touchstart', stop, { passive: false })
    el.addEventListener('touchmove', stop, { passive: false })
    // `wheel` represents mouse-wheels or trackpad two-finger scrolls
    el.addEventListener('wheel', stop, { passive: false })
    
    return () => {
      el.removeEventListener('touchstart', stop)
      el.removeEventListener('touchmove', stop)
      el.removeEventListener('wheel', stop)
    }
  }, [painting])

  // ── Download Action ─────────────────────────────────────────────────────────
  // Initiates an instant download of the raw image source file to the user's hard drive.
  const handleDownload = useCallback(() => {
    if (!painting) return
    
    // Create an invisible hyperlink mimicking user behaviour
    const a = document.createElement('a')
    a.href = painting.src
    // Generate a clean filename: "two-worlds-apart.jpg"
    a.download = `${painting.title.replace(/\s+/g, '-').toLowerCase()}.jpg`
    
    // Trigger it
    a.click()
  }, [painting])

  return (
    // ── Full-screen backdrop ──────────────────────────────────────────────────
    // Clicking on this semi-transparent layer triggers the close action
    <div
      className={`${styles.overlay} ${painting ? styles.active : ''}`}
      onClick={(e) => {
        // e.target is the specific node clicked. e.currentTarget is this outer <div>
        // Ensure they only clicked the backdrop, not something inside the panel!
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* ── Slide-out panel ──────────────────────────────────────────────────── */}
      <div ref={panelRef} className={`${styles.panel} ${painting ? styles.panelIn : ''}`}>
        
        {/* Close Button X */}
        <button className={styles.close} onClick={onClose} aria-label="Close">
          <span>✕</span>
        </button>

        {/* When no painting exists, we render nothing inside */}
        {painting && (
          <>
            {/* 1. High-Res Image Presentation */}
            <div
              className={`${styles.imageWrap} ${isZoomed ? styles.imageWrapZoomed : ''}`}
              onClick={() => setIsZoomed((z) => !z)}
              title={isZoomed ? 'Click to unzoom' : 'Click to zoom'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={painting.src}
                alt={painting.title}
                className={`${styles.image} ${isZoomed ? styles.imageZoomed : ''}`}
                draggable={false} // Disable dragging behaviour so zoom clicks are clean
              />
              <span className={styles.zoomHint}>
                {isZoomed ? '✕ zoom' : '⊕ zoom'}
              </span>
            </div>

            {/* 2. Download bar */}
            <div className={styles.actionBar}>
              <button className={styles.downloadBtn} onClick={handleDownload} aria-label="Download artwork">
                {/* Embedded SVG icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 20h14v-2H5v2zm7-18L5.33 9h4.34V16h4.66V9h4.34z" />
                </svg>
                Download
              </button>
            </div>

            {/* 3. Text & Metadata */}
            <div className={styles.meta}>
              <p className={styles.number}>
                {/* Format ID to two digits: '03' / '10' */}
                {String(painting.id).padStart(2, '0')} / {String(10).padStart(2, '0')}
              </p>
              <h2 className={styles.title}>{painting.title}</h2>
              <p className={styles.medium}>
                {painting.medium} &mdash; {painting.year}
              </p>
              <p className={styles.description}>{painting.description}</p>
              
              {/* Decorative line */}
              <div className={styles.divider} />
              
              <p className={styles.artist}>Alaa Mansour</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
