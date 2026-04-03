'use client'

import { useEffect, useState, useRef } from 'react'
import styles from './HUD.module.css'
import { galleryScroll } from '@/hooks/useScrollDepth'

interface HUDProps {
  activePainting: string | null
}

export function HUD({ activePainting }: HUDProps) {
  const [showHint, setShowHint] = useState(true)
  const fillRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animFrame: number
    const loop = () => {
      if (galleryScroll.total > 0) {
        const progress = Math.min(galleryScroll.z / galleryScroll.total, 1) || 0
        if (fillRef.current) fillRef.current.style.width = `${progress * 100}%`
        if (labelRef.current) labelRef.current.innerText = `${Math.round(progress * 100)}%`
        
        if (galleryScroll.z > 50 && showHint && hintRef.current) {
          hintRef.current.style.opacity = '0'
        }
      }
      animFrame = requestAnimationFrame(loop)
    }
    animFrame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrame)
  }, [showHint])

  return (
    <>
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoArtist}>Alaa Mansour</span>
          <span className={styles.logoDivider}>·</span>
          <span className={styles.logoSub}>Graphite Exhibitions</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.year}>2026</span>
        </div>
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          <div ref={fillRef} className={styles.progressFill} style={{ width: '0%' }} />
        </div>
        <span ref={labelRef} className={styles.progressLabel}>
          0%
        </span>
      </div>

      <div ref={hintRef} className={`${styles.hint} ${showHint ? styles.hintVisible : ''}`}>
        <div className={styles.hintScroll}>
          <div className={styles.hintWheel} />
        </div>
        <span>Explore Gallery</span>
      </div>

      {activePainting && (
        <div className={styles.activeLabel}>
          <span className={styles.activeLabelText}>
            Esc
            <kbd>ESC</kbd> 
            to return
          </span>
        </div>
      )}

      <div className={styles.corner}>
        <span>Pencil Works Edition</span>
      </div>
    </>
  )
}
