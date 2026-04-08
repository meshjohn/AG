'use client'

// ─── Filmstrip Component ──────────────────────────────────────────────────────
// An interactive, horizontally scrollable row of painting thumbnails.
// Lives at the bottom of the screen. Users can click a thumbnail to fly the
// 3D camera directly to that painting.

import { useRef, useEffect } from 'react'
import { paintings, Painting } from '@/lib/paintings'
import { FRAME_SPACING } from '@/lib/constants'
import styles from './Filmstrip.module.css'

interface FilmstripProps {
  activePainting: Painting | null           // the currently focused artwork
  onSelect: (p: Painting) => void           // fired when a thumb is clicked
  onJumpTo: (z: number) => void             // fired to sync the 3D camera position
}

export function Filmstrip({ activePainting, onSelect, onJumpTo }: FilmstripProps) {
  // Reference to the main scrollable container
  const stripRef = useRef<HTMLDivElement>(null)
  
  // Keep an array of refs pointing to every individual button/thumbnail DOM node.
  // This allows us to auto-scroll the wrapper to bring active items into view.
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  // When another part of the UI changes the active painting (e.g. keyboard arrows
  // or clicking a 3D frame), we need the filmstrip at the bottom to scroll
  // horizontally so the matching thumbnail is visible.
  useEffect(() => {
    if (!activePainting) return
    
    // Find index of the newly focused artwork
    const idx = paintings.findIndex((p) => p.id === activePainting.id)
    const btn = buttonRefs.current[idx]
    
    // Smoothly scroll the container horizontally to reveal the button
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activePainting])

  return (
    <div ref={stripRef} className={styles.strip}>
      {/* Map over every painting in the library */}
      {paintings.map((p, idx) => (
        <button
          key={p.id}
          // Store a reference to this DOM node for scrolling later
          ref={(el) => { buttonRefs.current[idx] = el }}
          
          // Append the `active` styling class if this is the chosen painting
          className={`${styles.thumb} ${activePainting?.id === p.id ? styles.active : ''}`}
          
          onClick={() => {
            // 1. Tell the parent page to make this the active artwork
            onSelect(p)
            
            // 2. Tell the parent page to jump the 3D camera scroll position 
            //    to precisely match this painting's coordinate in the corridor.
            //    Math: z = index * spacing + initial offset
            onJumpTo(idx * FRAME_SPACING + FRAME_SPACING)
          }}
          title={p.title}
        >
          {/* Display the image. Next.js image linting is disabled as we are 
              using standard <img> tags mapped precisely to Three.js textures */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.src} alt={p.title} className={styles.img} />
          
          {/* Display two-digit painting ID (e.g. "01", "07", "10") */}
          <div className={styles.num}>{String(p.id).padStart(2, '0')}</div>
        </button>
      ))}
    </div>
  )
}
