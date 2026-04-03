'use client'

import { useEffect, useState } from 'react'
import styles from './LoadingScreen.module.css'

interface LoadingScreenProps {
  onDone: () => void
}

export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const duration = 2200
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const p = Math.min(elapsed / duration, 1)
      setProgress(Math.round(p * 100))
      if (p >= 1) {
        clearInterval(timer)
        setTimeout(() => {
          setFadeOut(true)
          setTimeout(onDone, 700) // matches CSS transition duration
        }, 500)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [onDone])

  return (
    // .screen is the correct class (was wrongly .container before — CSS has .screen)
    <div className={`${styles.screen} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Alaa Mansour</h1>
        <p className={styles.subtitle}>Graphite Gallery · 2026</p>

        <div className={styles.barContainer}>
          <div className={styles.bar} style={{ width: `${progress}%` }} />
        </div>

        <p className={styles.percentage}>{progress}%</p>

        {progress === 100 && !fadeOut && (
          <p className={styles.enterHint}>Entering the void</p>
        )}
      </div>
    </div>
  )
}
