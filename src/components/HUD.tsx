'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import styles from './HUD.module.css'
import { galleryScroll } from '@/hooks/useScrollDepth'
import { paintings } from '@/lib/paintings'

interface HUDProps {
  activePainting: string | null
  activePaintingId: number | null
}

// ─── Classical Audio Ambience ────────────────────────────────────────────────
function useAmbience() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const fadeInterval = useRef<NodeJS.Timeout | null>(null)

  const toggle = useCallback(() => {
    if (!audioRef.current) {
      // Use a universally supported MP3 (Safari sometimes rejects .ogg)
      // Beethoven's Moonlight Sonata (1st Movement) - serene and classy
      const audio = new Audio('https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3')
      audio.crossOrigin = 'anonymous'
      audio.loop = true
      audio.volume = 0
      audioRef.current = audio
    }

    const audio = audioRef.current
    if (fadeInterval.current) clearInterval(fadeInterval.current)

    if (isPlaying) {
      // Fade out
      fadeInterval.current = setInterval(() => {
        if (audio.volume > 0.05) {
          audio.volume = Math.max(0, audio.volume - 0.05)
        } else {
          audio.volume = 0
          audio.pause()
          setIsPlaying(false)
          if (fadeInterval.current) clearInterval(fadeInterval.current)
        }
      }, 50)
    } else {
      // Fade in
      setIsPlaying(true)
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          fadeInterval.current = setInterval(() => {
            if (audio.volume < 0.25) {
              audio.volume = Math.min(1, audio.volume + 0.02)
            } else {
              if (fadeInterval.current) clearInterval(fadeInterval.current)
            }
          }, 50)
        }).catch(err => {
          console.error("Audio playback blocked:", err)
          setIsPlaying(false)
        })
      }
    }
  }, [isPlaying])

  useEffect(() => {
    return () => {
      if (fadeInterval.current) clearInterval(fadeInterval.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  return { isPlaying, toggle }
}

// ─── HUD component ───────────────────────────────────────────────────────────
export function HUD({ activePainting, activePaintingId }: HUDProps) {
  const [showHint, setShowHint] = useState(true)
  const fillRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const { isPlaying, toggle } = useAmbience()

  // RAF loop — update progress bar from shared scroll state
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

  const activeIndex =
    activePaintingId !== null
      ? paintings.findIndex((p) => p.id === activePaintingId)
      : -1

  return (
    <>
      {/* Header bar */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoArtist}>Alaa Mansour</span>
          <span className={styles.logoDivider}>·</span>
          <span className={styles.logoSub}>Graphite Exhibitions</span>
        </div>

        <div className={styles.headerRight}>
          {activePaintingId !== null && activeIndex >= 0 && (
            <span className={styles.counter}>
              {String(activeIndex + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(paintings.length).padStart(2, '0')}
            </span>
          )}
          <span className={styles.year}>2026</span>
          <button
            className={`${styles.audioBtn} ${isPlaying ? styles.audioBtnActive : ''}`}
            onClick={toggle}
            aria-label={isPlaying ? 'Mute ambience' : 'Play ambience'}
            title={isPlaying ? 'Mute ambience' : 'Play ambience'}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          <div ref={fillRef} className={styles.progressFill} style={{ width: '0%' }} />
        </div>
        <span ref={labelRef} className={styles.progressLabel}>0%</span>
      </div>

      {/* Scroll hint */}
      <div ref={hintRef} className={`${styles.hint} ${showHint ? styles.hintVisible : ''}`}>
        <div className={styles.hintScroll}>
          <div className={styles.hintWheel} />
        </div>
        <span>Explore Gallery</span>
      </div>

      {/* Active-painting overlay: ESC + arrow navigation hint */}
      {activePainting && (
        <div className={styles.activeLabel}>
          <span className={styles.activeLabelText}>
            <kbd>ESC</kbd> to return
            <span className={styles.navSep}>·</span>
            <kbd>←</kbd><kbd>→</kbd> browse
          </span>
        </div>
      )}

      <div className={styles.corner}>
        <span>Pencil Works Edition</span>
      </div>
    </>
  )
}
