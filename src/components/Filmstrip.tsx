'use client'

import { paintings } from '@/lib/paintings'
import { Painting } from '@/lib/paintings'
import styles from './Filmstrip.module.css'

interface FilmstripProps {
  activePainting: Painting | null
  onSelect: (p: Painting) => void
}

export function Filmstrip({ activePainting, onSelect }: FilmstripProps) {
  return (
    <div className={styles.strip}>
      {paintings.map((p) => (
        <button
          key={p.id}
          className={`${styles.thumb} ${activePainting?.id === p.id ? styles.active : ''}`}
          onClick={() => onSelect(p)}
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
