'use client'

import { useEffect, useRef } from 'react'

export const galleryScroll = {
  z: 0,
  target: 0,
  total: 0
}

export const galleryLook = {
  x: 0,
  targetX: 0,
  velocity: 0,     // angular momentum (radians/frame)
  isDragging: false
}

// Orbit state used when a painting is focused
export const paintingOrbit = {
  yaw: 0,   targetYaw: 0,
  pitch: 0, targetPitch: 0,
  velYaw: 0, velPitch: 0,
  isDragging: false,
}

// Toggled by GalleryScene when a painting becomes active/inactive
const _mode = { painting: false }
export function setPaintingActive(active: boolean) {
  _mode.painting = active
  if (!active) {
    // reset orbit smoothly (let easing handle it)
    paintingOrbit.targetYaw = 0
    paintingOrbit.targetPitch = 0
    paintingOrbit.velYaw = 0
    paintingOrbit.velPitch = 0
  }
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
        Math.min(totalDepth, galleryScroll.target + e.deltaY * 0.03)
      )
    }

    let touchStartX = 0
    let touchStartY = 0
    let lastTouchX = 0
    let lastTouchY = 0
    let isTouching = false
    let dragMode: 'idle' | 'scroll' | 'look' = 'idle'

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      lastTouchX = touchStartX
      lastTouchY = touchStartY
      isTouching = true
      // In painting mode, ALL drags orbit — skip classifier
      dragMode = _mode.painting ? 'look' : 'idle'
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouching) return
      e.preventDefault()
      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const dx = currentX - lastTouchX
      const dy = lastTouchY - currentY
      
      if (dragMode === 'idle') {
        const totalDx = Math.abs(currentX - touchStartX)
        const totalDy = Math.abs(currentY - touchStartY)
        if (totalDx > 5 || totalDy > 5) {
          dragMode = totalDx > totalDy * 1.5 ? 'look' : 'scroll'
        }
      }
      
      lastTouchX = currentX
      lastTouchY = currentY
      
      if (dragMode === 'scroll' || dragMode === 'idle') {
        galleryScroll.target = Math.max(
          0,
          Math.min(totalDepth, galleryScroll.target + dy * 0.05)
        )
      }
      
      if (dragMode === 'look') {
        if (_mode.painting) {
          // Orbit around focused painting (dx/dy computed above, before lastTouch update)
          const dYaw   = -dx * 0.008
          const dPitch =  dy * 0.006   // dy = lastTouchY - currentY (positive = swipe up)
          paintingOrbit.velYaw   = dYaw
          paintingOrbit.velPitch = dPitch
          paintingOrbit.targetYaw   = Math.max(-3.14, Math.min(3.14, paintingOrbit.targetYaw   + dYaw))
          paintingOrbit.targetPitch = Math.max(-0.75, Math.min(0.75, paintingOrbit.targetPitch + dPitch))
          paintingOrbit.isDragging = true
        } else {
          const delta = -dx * 0.004
          galleryLook.velocity = delta
          galleryLook.targetX = Math.max(-1.57, Math.min(1.57, galleryLook.targetX + delta))
          galleryLook.isDragging = true
        }
      }
    }

    const onTouchEnd = () => {
      isTouching = false
      dragMode = 'idle'
      galleryLook.isDragging = false
      paintingOrbit.isDragging = false
      // momentum: let velocity carry forward, friction decays in RAF
    }

    let isMouseDown = false
    let lastMouseX = 0

    let lastMouseY = 0

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      isMouseDown = true
      lastMouseX = e.clientX
      lastMouseY = e.clientY
      if (_mode.painting) {
        paintingOrbit.isDragging = true
        paintingOrbit.velYaw = 0
        paintingOrbit.velPitch = 0
      } else {
        galleryLook.isDragging = true
        galleryLook.velocity = 0
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isMouseDown) {
        const dx = e.clientX - lastMouseX
        const dy = e.clientY - lastMouseY
        lastMouseX = e.clientX
        lastMouseY = e.clientY

        if (_mode.painting) {
          // Orbit around focused painting (yaw + pitch)
          const dYaw   = -dx * 0.008
          const dPitch = -dy * 0.006
          paintingOrbit.velYaw   = dYaw
          paintingOrbit.velPitch = dPitch
          paintingOrbit.targetYaw   = Math.max(-3.14, Math.min(3.14, paintingOrbit.targetYaw   + dYaw))
          paintingOrbit.targetPitch = Math.max(-0.75, Math.min(0.75, paintingOrbit.targetPitch + dPitch))
        } else {
          const delta = -dx * 0.004
          galleryLook.velocity = delta
          galleryLook.targetX = Math.max(-1.57, Math.min(1.57, galleryLook.targetX + delta))
        }
      } else if (!_mode.painting) {
        // Hover ambient parallax – subtle steering without clicking
        const norm = (e.clientX / window.innerWidth - 0.5) * 2  // -1 .. +1
        galleryLook.targetX = norm * 0.22
        galleryLook.velocity = 0
      }
    }

    const onMouseUp = () => {
      isMouseDown = false
      galleryLook.isDragging = false
      paintingOrbit.isDragging = false
      // momentum continues; it will decay in the RAF loop
    }

    const onMouseLeave = () => {
      isMouseDown = false
      galleryLook.isDragging = false
      galleryLook.velocity = 0
      // gently return to center when cursor leaves window
      galleryLook.targetX = 0
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mouseleave', onMouseLeave)

    const animate = () => {
      // Scroll easing
      const diffZ = galleryScroll.target - galleryScroll.z
      if (Math.abs(diffZ) > 0.01) {
        galleryScroll.z += diffZ * 0.072
      } else {
        galleryScroll.z = galleryScroll.target
      }

      // Gallery look momentum & easing
      if (!galleryLook.isDragging && Math.abs(galleryLook.velocity) > 0.0001) {
        galleryLook.velocity *= 0.88
        galleryLook.targetX = Math.max(-1.57, Math.min(1.57, galleryLook.targetX + galleryLook.velocity))
      }
      galleryLook.x += (galleryLook.targetX - galleryLook.x) * 0.10

      // Painting orbit momentum & easing
      if (!paintingOrbit.isDragging) {
        if (Math.abs(paintingOrbit.velYaw) > 0.0001) {
          paintingOrbit.velYaw *= 0.85
          paintingOrbit.targetYaw = Math.max(-3.14, Math.min(3.14, paintingOrbit.targetYaw + paintingOrbit.velYaw))
        }
        if (Math.abs(paintingOrbit.velPitch) > 0.0001) {
          paintingOrbit.velPitch *= 0.85
          paintingOrbit.targetPitch = Math.max(-0.75, Math.min(0.75, paintingOrbit.targetPitch + paintingOrbit.velPitch))
        }
      }
      paintingOrbit.yaw   += (paintingOrbit.targetYaw   - paintingOrbit.yaw)   * 0.10
      paintingOrbit.pitch += (paintingOrbit.targetPitch - paintingOrbit.pitch) * 0.10

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [totalDepth])

  const jumpTo = (z: number) => {
      galleryScroll.target = z
  }

  return { jumpTo }
}
