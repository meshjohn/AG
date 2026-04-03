'use client'

import { useEffect, useRef } from 'react'

export const galleryScroll = {
  z: 0,
  target: 0,
  total: 0
}

export function useScrollDepth(totalDepth: number) {
  const rafRef = useRef<number>(0)

  useEffect(() => {
    galleryScroll.total = totalDepth
    galleryScroll.target = galleryScroll.target || 0

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      galleryScroll.target = Math.max(
        0,
        Math.min(totalDepth, galleryScroll.target + e.deltaY * 0.8)
      )
    }

    let touchStartY = 0
    let lastTouchY = 0

    const onTouchStart = (e: TouchEvent) => {
      // Do NOT preventDefault here, otherwise it swallows the mobile tap/click events
      // and React Three Fiber won't receive the onClick triggers for the paintings.
      touchStartY = e.touches[0].clientY
      lastTouchY = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()  // MUST prevent native scroll — that is what causes the WebGL black screen
      const currentY = e.touches[0].clientY
      const dy = lastTouchY - currentY
      lastTouchY = currentY
      galleryScroll.target = Math.max(
        0,
        Math.min(totalDepth, galleryScroll.target + dy * 1.2)
      )
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    // passive: false is required on both so we can call preventDefault and prevent
    // iOS Safari from triggering its native page scroll (which blacks out WebGL)
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    const animate = () => {
      const diff = galleryScroll.target - galleryScroll.z
      // Smooth lerp — stop RAF'ing tiny updates to save mobile GPU
      if (Math.abs(diff) > 0.01) {
        galleryScroll.z += diff * 0.072
      } else {
        galleryScroll.z = galleryScroll.target
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [totalDepth])

  const jumpTo = (z: number) => {
      galleryScroll.target = z
  }

  return { jumpTo }
}
