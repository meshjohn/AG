'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Painting } from '@/lib/paintings'
import styles from './DetailPanel.module.css'

interface DetailPanelProps {
  painting: Painting | null
  onClose: () => void
}

export function DetailPanel({ painting, onClose }: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isZoomed, setIsZoomed] = useState(false)

  // Reset zoom whenever the painting changes
  useEffect(() => {
    setIsZoomed(false)
  }, [painting?.id])

  // ESC: first un-zoom, then close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) setIsZoomed(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, isZoomed])

  // Stop touch/wheel from bubbling to the canvas scroll handler
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const stop = (e: Event) => e.stopPropagation()
    el.addEventListener('touchstart', stop, { passive: false })
    el.addEventListener('touchmove', stop, { passive: false })
    el.addEventListener('wheel', stop, { passive: false })
    return () => {
      el.removeEventListener('touchstart', stop)
      el.removeEventListener('touchmove', stop)
      el.removeEventListener('wheel', stop)
    }
  }, [painting])

  const handleDownload = useCallback(() => {
    if (!painting) return
    const a = document.createElement('a')
    a.href = painting.src
    a.download = `${painting.title.replace(/\s+/g, '-').toLowerCase()}.jpg`
    a.click()
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
            {/* Image with click-to-zoom */}
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
                draggable={false}
              />
              <span className={styles.zoomHint}>
                {isZoomed ? '✕ zoom' : '⊕ zoom'}
              </span>
            </div>

            {/* Action bar: download */}
            <div className={styles.actionBar}>
              <button className={styles.downloadBtn} onClick={handleDownload} aria-label="Download artwork">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 20h14v-2H5v2zm7-18L5.33 9h4.34V16h4.66V9h4.34z" />
                </svg>
                Download
              </button>
            </div>

            <div className={styles.meta}>
              <p className={styles.number}>
                {String(painting.id).padStart(2, '0')} / {String(10).padStart(2, '0')}
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
