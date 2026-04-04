'use client'

import { useRef, useEffect } from 'react'
import { paintings, Painting } from '@/lib/paintings'
import { FRAME_SPACING } from '@/lib/constants'
import styles from './Filmstrip.module.css'

interface FilmstripProps {
  activePainting: Painting | null
  onSelect: (p: Painting) => void
  onJumpTo: (z: number) => void
}

export function Filmstrip({ activePainting, onSelect, onJumpTo }: FilmstripProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Auto-scroll the strip so the active thumbnail is always visible
  useEffect(() => {
    if (!activePainting) return
    const idx = paintings.findIndex((p) => p.id === activePainting.id)
    const btn = buttonRefs.current[idx]
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activePainting])

  return (
    <div ref={stripRef} className={styles.strip}>
      {paintings.map((p, idx) => (
        <button
          key={p.id}
          ref={(el) => { buttonRefs.current[idx] = el }}
          className={`${styles.thumb} ${activePainting?.id === p.id ? styles.active : ''}`}
          onClick={() => {
            onSelect(p)
            // Jump scroll depth so camera scrolls to this painting
            onJumpTo(idx * FRAME_SPACING + FRAME_SPACING)
          }}
          title={p.title}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.src} alt={p.title} className={styles.img} />
          <div className={styles.num}>{String(p.id).padStart(2, '0')}</div>
        </button>
      ))}
    </div>
  )
}
