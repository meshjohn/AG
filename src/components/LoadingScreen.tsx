'use client'

// ─── LoadingScreen Component ──────────────────────────────────────────────────
// Artistic loading screen with animated ornamental lines, floating dust
// particles, an SVG sketch-line background, and a dramatic progress reveal.

import { useEffect, useState, useMemo } from 'react'
import { paintings } from '@/lib/paintings'
import styles from './LoadingScreen.module.css'

interface LoadingScreenProps {
  onDone: () => void
}

// ── Dust particle data (stable across renders via useMemo) ───────────────────
interface Particle { id: number; x: number; size: number; duration: number; delay: number }

export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [progress, setProgress]   = useState(0)
  const [fadeOut, setFadeOut]     = useState(false)

  // 18 randomised particles — values generated once on mount
  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id:       i,
      x:        Math.random() * 100,          // vw %
      size:     Math.random() * 3 + 1,        // px
      duration: Math.random() * 12 + 8,       // s
      delay:    Math.random() * 10,           // s
    }))
  , [])

  // ── Asset Preloading Logic ─────────────────────────────────────────────────
  useEffect(() => {
    let loaded  = 0
    const total = paintings.length
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      setProgress(100)
      setTimeout(() => {
        setFadeOut(true)
        setTimeout(onDone, 1000)   // matches the longer 1s CSS opacity transition
      }, 500)
    }

    paintings.forEach((p) => {
      const img = new Image()
      img.onload = img.onerror = () => {
        loaded++
        setProgress(Math.round((loaded / total) * 100))
        if (loaded >= total) finish()
      }
      img.src = p.src
    })

    const fallback = setTimeout(finish, 5000)
    return () => clearTimeout(fallback)
  }, [onDone])

  // ── SVG sketch lines (procedural — no external assets) ────────────────────
  // Evenly-spaced diagonal hatching lines that evoke the graphite medium.
  const svgLines = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => {
      const offset = (i / 22) * 200 - 50
      return (
        <line
          key={i}
          x1={`${offset}%`} y1="0%"
          x2={`${offset + 80}%`} y2="100%"
          stroke="rgba(191,161,95,0.18)"
          strokeWidth="0.5"
        />
      )
    })
  , [])

  return (
    <div className={`${styles.screen} ${fadeOut ? styles.fadeOut : ''}`}>

      {/* ── SVG diagonal sketch lines in the background ── */}
      <svg className={styles.canvas} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {svgLines}
      </svg>

      {/* ── Floating amber dust particles ── */}
      {particles.map((p) => (
        <span
          key={p.id}
          className={styles.particle}
          style={{
            left:              `${p.x}vw`,
            bottom:            '-4px',
            width:             `${p.size}px`,
            height:            `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay:    `${p.delay}s`,
          }}
        />
      ))}

      {/* ── Central content ── */}
      <div className={styles.inner}>

        {/* Ornamental header — three lines flanking a diamond */}
        <div className={styles.ornament}>
          <span className={styles.ornamentLine} />
          <span className={styles.ornamentDiamond} />
          <span className={`${styles.ornamentLine}`} />
        </div>

        {/* Artist name */}
        <h1 className={styles.title}>
          <span className={styles.titleAccent}>Graphite Gallery</span>
          Alaa Mansour
        </h1>

        {/* Atmospheric quote */}
        <p className={styles.quote}>
          &ldquo;Every line holds a breath — every mark, a moment suspended in graphite and silence.&rdquo;
        </p>

        {/* Progress bar */}
        <div className={styles.progressArea}>
          <div className={styles.barLabel}>
            <span>Loading collection</span>
            <span className={styles.percentage}>{progress}%</span>
          </div>
          <div className={styles.barContainer}>
            <div className={styles.bar} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Entering message once fully loaded */}
        {progress === 100 && !fadeOut && (
          <p className={styles.enterHint}>Entering the gallery</p>
        )}

      </div>
    </div>
  )
}
