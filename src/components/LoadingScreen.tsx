'use client'

// ─── LoadingScreen Component ──────────────────────────────────────────────────
// Artistic loading screen with animated ornamental lines, floating dust
// particles, an SVG sketch-line background, and a dramatic progress reveal.

import { useEffect, useState, useMemo, useRef } from 'react'
import { paintings } from '@/lib/paintings'
import { useProgress } from '@react-three/drei'
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
  const { progress: currentProgress, active, total } = useProgress()
  const finishedRef = useRef(false)
  const manualProgress = useRef(0)
  const isThreeDone = useRef(false)
  const isManualDone = useRef(false)

  useEffect(() => {
    // 1. Update Three.js status
    // If it started loading things, track its progress. If it's inactive, it's done.
    if (total > 0) {
      isThreeDone.current = (!active && currentProgress >= 100)
    } else {
      isThreeDone.current = !active // If it hasn't found anything to load yet but is inactive
    }

    // Update UI progress bar (Prefer Three.js progress if it's running, otherwise use manual image progress)
    if (total > 0 && currentProgress > manualProgress.current) {
       setProgress(Math.round(currentProgress))
    }

    // Try finishing
    if (isThreeDone.current && isManualDone.current && !finishedRef.current) {
      finishedRef.current = true
      setProgress(100)
      setTimeout(() => {
        setFadeOut(true)
        setTimeout(onDone, 1000)
      }, 500)
    }
  }, [currentProgress, active, total, onDone])

  useEffect(() => {
    // 2. Manual Image Preloader
    // Runs precisely once on mount. Ensures the progress bar reliably animates
    // even if Three.js relies on cached textures.
    let loaded = 0
    const totalImgs = paintings.length

    paintings.forEach((p) => {
      const img = new Image()
      img.onload = img.onerror = () => {
        loaded++
        manualProgress.current = Math.round((loaded / totalImgs) * 100)
        
        // If Threejs hasn't started yet, drive the UI bar with manual progress
        if (total === 0) setProgress(manualProgress.current)

        if (loaded >= totalImgs) {
          isManualDone.current = true
          // If Three.js is already done (or heavily cached), trigger completion
          if (isThreeDone.current && !finishedRef.current) {
            finishedRef.current = true
            setProgress(100)
            setTimeout(() => {
              setFadeOut(true)
              setTimeout(onDone, 1000)
            }, 500)
          }
        }
      }
      img.src = p.src
    })

    // Safety fallback: force enter after 8 seconds no matter what
    const fallback = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true
        setProgress(100)
        setFadeOut(true)
        setTimeout(onDone, 1000)
      }
    }, 8000)

    return () => clearTimeout(fallback)
  }, [total, onDone])

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
