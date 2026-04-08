'use client'

// ─── HUD Component (Heads Up Display) ─────────────────────────────────────────
// The flat UI layer overlaying the 3D canvas.
// Responsible for showing the gallery branding, the scroll progress bar,
// keyboard hint overlays, and audio toggle button.

import { useEffect, useState, useRef, useCallback } from 'react'
import styles from './HUD.module.css'
import { galleryScroll } from '@/hooks/useScrollDepth'
import { paintings } from '@/lib/paintings'

interface HUDProps {
  activePainting: string | null     // Title of currently focused painting
  activePaintingId: number | null   // ID of currently focused painting
}

// ─── Classical Audio Ambience Hook ────────────────────────────────────────────
// Encapsulates the logic to load, play, pause, and fade the background music.
function useAmbience() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // React state handles the toggle UI state
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Keeps track of setInterval timer used for smooth volume fading
  const fadeInterval = useRef<NodeJS.Timeout | null>(null)

  const toggle = useCallback(() => {
    // 1. First run lazy initialisation
    if (!audioRef.current) {
      // Use a universally supported MP3 (Safari sometimes rejects .ogg)
      // Beethoven's Moonlight Sonata (1st Movement) - serene and classy
      const audio = new Audio('https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3')
      audio.crossOrigin = 'anonymous'
      audio.loop = true
      
      // Start muted so we can fade it in
      audio.volume = 0
      audioRef.current = audio
    }

    const audio = audioRef.current
    
    // Clear any existing fade in progress
    if (fadeInterval.current) clearInterval(fadeInterval.current)

    if (isPlaying) {
      // ── Step 2: User requested Pause -> Fade Out ──────────────────────────
      fadeInterval.current = setInterval(() => {
        if (audio.volume > 0.05) {
          // Drop volume by 5% every 50ms
          audio.volume = Math.max(0, audio.volume - 0.05)
        } else {
          // Totally mute and pause
          audio.volume = 0
          audio.pause()
          setIsPlaying(false)
          if (fadeInterval.current) clearInterval(fadeInterval.current)
        }
      }, 50)
      
    } else {
      // ── Step 3: User requested Play -> Fade In ────────────────────────────
      setIsPlaying(true)
      const playPromise = audio.play()
      
      // Browsers often block autoplay or synthetic audio triggers.
      // We must check if the promise was fulfilled before increasing volume.
      if (playPromise !== undefined) {
        playPromise.then(() => {
          fadeInterval.current = setInterval(() => {
            // Cap at 25% volume — we want ambient background, not concert level
            if (audio.volume < 0.25) {
              audio.volume = Math.min(1, audio.volume + 0.02)
            } else {
              // Reached target volume
              if (fadeInterval.current) clearInterval(fadeInterval.current)
            }
          }, 50)
        }).catch(err => {
          // Catch DOMException if browser blocks autoplay
          console.error("Audio playback blocked:", err)
          setIsPlaying(false)
        })
      }
    }
  }, [isPlaying])

  // Cleanup: Stop audio on component dismount so it doesn't play forever
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

// ─── Main HUD component ───────────────────────────────────────────────────────
export function HUD({ activePainting, activePaintingId }: HUDProps) {
  
  // Tracks whether the 'Explore Gallery' scroll-mouse hint is on screen
  const [showHint, setShowHint] = useState(true)
  
  // Direct DOM refs to avoid React state re-renders for the constantly updating progress bar
  const fillRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  
  const { isPlaying, toggle } = useAmbience()

  // ── Progress Bar RAF Loop ───────────────────────────────────────────────────
  // We attach a requestAnimationFrame loop here inside the UI.
  // Because 'galleryScroll.z' updates every frame outside of React, we bypass
  // React state entirely and directly mutate the DOM styles. This gives 60fps
  // smoothness to the UI bar without thrashing the React Virtual DOM renderer.
  useEffect(() => {
    let animFrame: number
    const loop = () => {
      if (galleryScroll.total > 0) {
        
        // 1. Calculate decimal progress 0.00 -> 1.00
        const progress = Math.min(galleryScroll.z / galleryScroll.total, 1) || 0
        
        // 2. Set width of the line via CSS Style
        if (fillRef.current) fillRef.current.style.width = `${progress * 100}%`
        
        // 3. Update the text label (e.g. "45%")
        if (labelRef.current) labelRef.current.innerText = `${Math.round(progress * 100)}%`
        
        // 4. If the user scrolls deep enough (> 50 units), hide the "Scroll to explore" hint forever
        if (galleryScroll.z > 50 && showHint && hintRef.current) {
          hintRef.current.style.opacity = '0'
        }
      }
      animFrame = requestAnimationFrame(loop)
    }
    animFrame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrame)
  }, [showHint])

  // Useful to know where we are in the collection
  const activeIndex =
    activePaintingId !== null
      ? paintings.findIndex((p) => p.id === activePaintingId)
      : -1

  return (
    <>
      {/* ── Top Header Bar ──────────────────────────────────────────────────── */}
      <div className={styles.header}>
        {/* Left Side: Brand Identity */}
        <div className={styles.logo}>
          <span className={styles.logoArtist}>Alaa Mansour</span>
          <span className={styles.logoDivider}>·</span>
          <span className={styles.logoSub}>Graphite Exhibitions</span>
        </div>

        {/* Right Side: Meta Tools */}
        <div className={styles.headerRight}>
          
          {/* Only shown if user is focused on a painting: "04 / 10" indicator */}
          {activePaintingId !== null && activeIndex >= 0 && (
            <span className={styles.counter}>
              {String(activeIndex + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(paintings.length).padStart(2, '0')}
            </span>
          )}
          
          <span className={styles.year}>2026</span>
          
          {/* Audio toggle button using inline SVG icons */}
          <button
            className={`${styles.audioBtn} ${isPlaying ? styles.audioBtnActive : ''}`}
            onClick={toggle}
            aria-label={isPlaying ? 'Mute ambience' : 'Play ambience'}
            title={isPlaying ? 'Mute ambience' : 'Play ambience'}
          >
            {isPlaying ? (
              // Pause / Playing Icon
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
            ) : (
              // Play / Muted Icon
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Top Progress Line ───────────────────────────────────────────────── */}
      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          {/* Note the use of direct `ref={fillRef}` rather than React state width */}
          <div ref={fillRef} className={styles.progressFill} style={{ width: '0%' }} />
        </div>
        <span ref={labelRef} className={styles.progressLabel}>0%</span>
      </div>

      {/* ── Initial Start Hint ──────────────────────────────────────────────── */}
      {/* Floats near the center teaching the user to scroll their mouse wheel.
          Will vanish based on logic inside the RAF loop above. */}
      <div ref={hintRef} className={`${styles.hint} ${showHint ? styles.hintVisible : ''}`}>
        <div className={styles.hintScroll}>
          <div className={styles.hintWheel} />
        </div>
        <span>Explore Gallery</span>
      </div>

      {/* ── Active Painting Helper ──────────────────────────────────────────── */}
      {/* Popping up from the bottom when focused to remind them they can use keyboard */}
      {activePainting && (
        <div className={styles.activeLabel}>
          <span className={styles.activeLabelText}>
            <kbd>ESC</kbd> to return
            <span className={styles.navSep}>·</span>
            <kbd>←</kbd><kbd>→</kbd> browse
          </span>
        </div>
      )}

      {/* ── Watermark Corner ────────────────────────────────────────────────── */}
      <div className={styles.corner}>
        <span>Pencil Works Edition</span>
      </div>
    </>
  )
}
