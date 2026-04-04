'use client'

import { useEffect, useState } from 'react'
import { paintings } from '@/lib/paintings'
import styles from './LoadingScreen.module.css'

interface LoadingScreenProps {
  onDone: () => void
}

export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    let loaded = 0
    const total = paintings.length
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      setProgress(100)
      setTimeout(() => {
        setFadeOut(true)
        setTimeout(onDone, 700)
      }, 400)
    }

    // Preload every painting image and track real progress
    paintings.forEach((p) => {
      const img = new Image()
      img.onload = img.onerror = () => {
        loaded++
        setProgress(Math.round((loaded / total) * 100))
        if (loaded >= total) finish()
      }
      img.src = p.src
    })

    // Safety fallback — proceed after 5 s regardless
    const fallback = setTimeout(finish, 5000)
    return () => clearTimeout(fallback)
  }, [onDone])

  return (
    <div className={`${styles.screen} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Alaa Mansour</h1>
        <p className={styles.subtitle}>Graphite Gallery · 2026</p>

        <div className={styles.barContainer}>
          <div className={styles.bar} style={{ width: `${progress}%` }} />
        </div>

        <p className={styles.percentage}>{progress}%</p>

        {progress === 100 && !fadeOut && (
          <p className={styles.enterHint}>Entering the gallery</p>
        )}
      </div>
    </div>
  )
}
