'use client'

import { useEffect, useRef } from 'react'
import { Painting } from '@/lib/paintings'
import styles from './DetailPanel.module.css'

interface DetailPanelProps {
  painting: Painting | null
  onClose: () => void
}

export function DetailPanel({ painting, onClose }: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const el = panelRef.current
    if (!el) return

    // Stop touch/wheel events from bubbling up to the window 
    // where they would be swallowed by useScrollDepth's preventDefault
    const stopPropagation = (e: Event) => e.stopPropagation()

    el.addEventListener('touchstart', stopPropagation, { passive: false })
    el.addEventListener('touchmove', stopPropagation, { passive: false })
    el.addEventListener('wheel', stopPropagation, { passive: false })

    return () => {
      el.removeEventListener('touchstart', stopPropagation)
      el.removeEventListener('touchmove', stopPropagation)
      el.removeEventListener('wheel', stopPropagation)
    }
  }, [painting])

  return (
    <div
      className={`${styles.overlay} ${painting ? styles.active : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={panelRef} className={`${styles.panel} ${painting ? styles.panelIn : ''}`}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          <span>✕</span>
        </button>

        {painting && (
          <>
            <div className={styles.imageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={painting.src} alt={painting.title} className={styles.image} />
            </div>
            <div className={styles.meta}>
              <p className={styles.number}>
                {String(painting.id).padStart(2, '0')} / 10
              </p>
              <h2 className={styles.title}>{painting.title}</h2>
              <p className={styles.medium}>
                {painting.medium} &mdash; {painting.year}
              </p>
              <p className={styles.description}>{painting.description}</p>
              <div className={styles.divider} />
              <p className={styles.artist}>Alaa Mansour</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
