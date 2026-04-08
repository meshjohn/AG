'use client'

// ─── Scroll & Interaction State (module-level singletons) ────────────────────
// These plain objects are intentionally *outside* React so they can be mutated
// every animation frame without triggering re-renders.  Components read them
// via useFrame / requestAnimationFrame loops.

import { useEffect, useRef } from 'react'

/**
 * Tracks the gallery's Z-scroll position along the corridor.
 *  - `target`  — the desired depth set by wheel / touch input
 *  - `z`       — the smoothed (eased) current depth applied to the camera
 *  - `total`   — total corridor depth, set once on mount
 */
export const galleryScroll = {
  z: 0,       // current eased scroll position
  target: 0,  // raw desired position (updated by input handlers)
  total: 0    // full corridor length (set from GalleryPage)
}

/**
 * Tracks the camera's horizontal look angle while walking the gallery.
 *  - `x`         — smoothed look angle in radians (applied to camera each frame)
 *  - `targetX`   — desired look angle updated by drag/hover input
 *  - `velocity`  — angular momentum that decays over time (gives "swing" feel)
 *  - `isDragging`— true while the user holds the mouse button / finger down
 */
export const galleryLook = {
  x: 0,
  targetX: 0,
  velocity: 0,      // angular momentum (radians/frame)
  isDragging: false
}

/**
 * Orbit state used when a painting is focused.
 * The camera orbits the painting on a sphere; yaw = left/right, pitch = up/down.
 *  - `yaw / pitch`       — smoothed orbit angles read by CameraRig each frame
 *  - `targetYaw/Pitch`   — desired angles updated by drag input
 *  - `velYaw/Pitch`      — angular momentum that decays (inertia after release)
 *  - `isDragging`        — true while the user is actively dragging
 */
export const paintingOrbit = {
  yaw: 0,   targetYaw: 0,
  pitch: 0, targetPitch: 0,
  velYaw: 0, velPitch: 0,
  isDragging: false,
}

// Internal flag that tracks which interaction mode is active.
// Kept private so external code must call `setPaintingActive()`.
const _mode = { painting: false }

/**
 * Called by GalleryScene whenever a painting becomes active or inactive.
 * When deactivated, orbit angles are reset so the camera re-centres.
 */
export function setPaintingActive(active: boolean) {
  _mode.painting = active
  if (!active) {
    // Reset orbit target smoothly — easing in the RAF loop will handle interpolation
    paintingOrbit.targetYaw = 0
    paintingOrbit.targetPitch = 0
    paintingOrbit.velYaw = 0
    paintingOrbit.velPitch = 0
  }
}

// ─── useScrollDepth Hook ─────────────────────────────────────────────────────
/**
 * Wires up all user input (wheel, touch, mouse) to the shared scroll/look state
 * and runs a single requestAnimationFrame loop that applies easing every frame.
 *
 * @param totalDepth  The full Z-depth of the gallery corridor.
 * @returns           `{ jumpTo }` — instantly teleports the scroll target to a Z depth.
 */
export function useScrollDepth(totalDepth: number) {
  // Store the RAF handle so we can cancel it on unmount
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Initialise the total depth and preserve any existing scroll position
    galleryScroll.total = totalDepth
    galleryScroll.target = galleryScroll.target || 0

    // ── Wheel handler ───────────────────────────────────────────────────────
    // Converts mouse-wheel delta into a forward/backward scroll along the corridor.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // Scale deltaY and clamp within [0, totalDepth]
      galleryScroll.target = Math.max(
        0,
        Math.min(totalDepth, galleryScroll.target + e.deltaY * 0.03)
      )
    }

    // ── Touch state ─────────────────────────────────────────────────────────
    let touchStartX = 0    // X position where the touch began
    let touchStartY = 0    // Y position where the touch began
    let lastTouchX = 0     // X position from the previous touchmove event
    let lastTouchY = 0     // Y position from the previous touchmove event
    let isTouching = false // true while at least one finger is on screen
    // 'idle'   = not yet determined which axis the user intends
    // 'scroll' = predominantly vertical → move along corridor
    // 'look'   = predominantly horizontal → rotate camera / orbit painting
    let dragMode: 'idle' | 'scroll' | 'look' = 'idle'

    // Capture the starting touch position and determine the initial drag mode
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      lastTouchX = touchStartX
      lastTouchY = touchStartY
      isTouching = true
      // In painting mode, ALL drags orbit — skip the axis classifier
      dragMode = _mode.painting ? 'look' : 'idle'
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouching) return
      e.preventDefault() // block browser native scroll while we handle it

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const dx = currentX - lastTouchX   // horizontal delta since last frame
      const dy = lastTouchY - currentY   // vertical delta (positive = swipe up = move forward)

      // Determine drag mode on first significant movement
      if (dragMode === 'idle') {
        const totalDx = Math.abs(currentX - touchStartX)
        const totalDy = Math.abs(currentY - touchStartY)
        if (totalDx > 5 || totalDy > 5) {
          // Horizontal swipe → look around; vertical swipe → walk
          dragMode = totalDx > totalDy * 1.5 ? 'look' : 'scroll'
        }
      }

      // Update previous position for next delta calculation
      lastTouchX = currentX
      lastTouchY = currentY

      // Apply scroll (vertical swipe)
      if (dragMode === 'scroll' || dragMode === 'idle') {
        galleryScroll.target = Math.max(
          0,
          Math.min(totalDepth, galleryScroll.target + dy * 0.05)
        )
      }

      // Apply look / orbit (horizontal swipe)
      if (dragMode === 'look') {
        if (_mode.painting) {
          // ── Painting orbit mode ──────────────────────────────────────────
          // dx/dy computed above, before lastTouch update
          const dYaw   = -dx * 0.008            // horizontal drag → yaw (left/right)
          const dPitch =  dy * 0.006            // vertical drag  → pitch (up/down)
          paintingOrbit.velYaw   = dYaw
          paintingOrbit.velPitch = dPitch
          // Clamp yaw to ±π and pitch to ±0.75 rad to prevent flipping
          paintingOrbit.targetYaw   = Math.max(-3.14, Math.min(3.14, paintingOrbit.targetYaw   + dYaw))
          paintingOrbit.targetPitch = Math.max(-0.75, Math.min(0.75, paintingOrbit.targetPitch + dPitch))
          paintingOrbit.isDragging = true
        } else {
          // ── Gallery look mode ────────────────────────────────────────────
          const delta = -dx * 0.004  // smaller sensitivity for walking look
          galleryLook.velocity = delta
          // Clamp to ±90° so the camera never spins past the walls
          galleryLook.targetX = Math.max(-1.57, Math.min(1.57, galleryLook.targetX + delta))
          galleryLook.isDragging = true
        }
      }
    }

    // Release all drag state; momentum velocity will carry forward and decay in RAF
    const onTouchEnd = () => {
      isTouching = false
      dragMode = 'idle'
      galleryLook.isDragging = false
      paintingOrbit.isDragging = false
    }

    // ── Mouse state ──────────────────────────────────────────────────────────
    let isMouseDown = false  // true while left button is held
    let lastMouseX = 0       // previous frame's clientX
    let lastMouseY = 0       // previous frame's clientY

    // Begin a drag — zero out accumulated velocity so movement starts fresh
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return  // only respond to left-click
      isMouseDown = true
      lastMouseX = e.clientX
      lastMouseY = e.clientY
      if (_mode.painting) {
        // Orbit mode: freeze momentum so the user has precise control
        paintingOrbit.isDragging = true
        paintingOrbit.velYaw = 0
        paintingOrbit.velPitch = 0
      } else {
        // Walk mode: freeze look momentum
        galleryLook.isDragging = true
        galleryLook.velocity = 0
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isMouseDown) {
        // ── Active drag ──────────────────────────────────────────────────────
        const dx = e.clientX - lastMouseX  // pixels moved horizontally
        const dy = e.clientY - lastMouseY  // pixels moved vertically
        lastMouseX = e.clientX
        lastMouseY = e.clientY

        if (_mode.painting) {
          // Orbit around the focused painting (yaw + pitch)
          const dYaw   = -dx * 0.008
          const dPitch = -dy * 0.006
          paintingOrbit.velYaw   = dYaw
          paintingOrbit.velPitch = dPitch
          paintingOrbit.targetYaw   = Math.max(-3.14, Math.min(3.14, paintingOrbit.targetYaw   + dYaw))
          paintingOrbit.targetPitch = Math.max(-0.75, Math.min(0.75, paintingOrbit.targetPitch + dPitch))
        } else {
          // Rotate camera left/right in walk mode
          const delta = -dx * 0.004
          galleryLook.velocity = delta
          galleryLook.targetX = Math.max(-1.57, Math.min(1.57, galleryLook.targetX + delta))
        }
      } else if (!_mode.painting) {
        // ── Ambient hover parallax (no click required) ───────────────────────
        // Maps the cursor's X position (-1 to +1) to a gentle steering angle.
        // Gives the gallery a "breathing" feel as the cursor drifts.
        const norm = (e.clientX / window.innerWidth - 0.5) * 2  // normalised -1 .. +1
        galleryLook.targetX = norm * 0.22   // max ±0.22 rad (~12.6°) of ambient parallax
        galleryLook.velocity = 0            // clear drag momentum — this is passive
      }
    }

    // Release drag; velocity will coast and decelerate in the RAF loop
    const onMouseUp = () => {
      isMouseDown = false
      galleryLook.isDragging = false
      paintingOrbit.isDragging = false
    }

    // When the cursor leaves the window entirely, reset everything to centre
    const onMouseLeave = () => {
      isMouseDown = false
      galleryLook.isDragging = false
      galleryLook.velocity = 0
      galleryLook.targetX = 0  // gently return to centre
    }

    // ── Register all event listeners ─────────────────────────────────────────
    // `passive: false` allows `preventDefault()` inside the handlers
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mouseleave', onMouseLeave)

    // ── Animation loop ───────────────────────────────────────────────────────
    // Runs every frame to apply easing to all scroll / look / orbit values.
    // This is intentionally *separate* from the Three.js render loop so it
    // works even if the Canvas is unmounted.
    const animate = () => {
      // ── Scroll easing ──────────────────────────────────────────────────────
      // Smooth the raw target position toward the camera with a lerp factor.
      // Snap to exact value when the difference is negligible to avoid drift.
      const diffZ = galleryScroll.target - galleryScroll.z
      if (Math.abs(diffZ) > 0.01) {
        galleryScroll.z += diffZ * 0.072  // ~7% per frame toward target
      } else {
        galleryScroll.z = galleryScroll.target  // snap to avoid endless micro-movement
      }

      // ── Gallery look: momentum decay + easing ──────────────────────────────
      // After the user releases the mouse, velocity gradually decays (friction).
      // The smoothed `x` value chases `targetX` with a separate lerp.
      if (!galleryLook.isDragging && Math.abs(galleryLook.velocity) > 0.0001) {
        galleryLook.velocity *= 0.88                 // 12% friction per frame
        galleryLook.targetX = Math.max(-1.57, Math.min(1.57, galleryLook.targetX + galleryLook.velocity))
      }
      galleryLook.x += (galleryLook.targetX - galleryLook.x) * 0.10  // apply easing

      // ── Painting orbit: momentum decay + easing ────────────────────────────
      // Same pattern as galleryLook but for both yaw and pitch axes.
      if (!paintingOrbit.isDragging) {
        if (Math.abs(paintingOrbit.velYaw) > 0.0001) {
          paintingOrbit.velYaw *= 0.85  // friction
          paintingOrbit.targetYaw = Math.max(-3.14, Math.min(3.14, paintingOrbit.targetYaw + paintingOrbit.velYaw))
        }
        if (Math.abs(paintingOrbit.velPitch) > 0.0001) {
          paintingOrbit.velPitch *= 0.85  // friction
          paintingOrbit.targetPitch = Math.max(-0.75, Math.min(0.75, paintingOrbit.targetPitch + paintingOrbit.velPitch))
        }
      }
      // Lerp smoothed values toward their targets
      paintingOrbit.yaw   += (paintingOrbit.targetYaw   - paintingOrbit.yaw)   * 0.10
      paintingOrbit.pitch += (paintingOrbit.targetPitch - paintingOrbit.pitch) * 0.10

      rafRef.current = requestAnimationFrame(animate)
    }
    // Kick off the animation loop
    rafRef.current = requestAnimationFrame(animate)

    // ── Cleanup ──────────────────────────────────────────────────────────────
    // Remove all listeners and cancel the RAF when the component unmounts.
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
  }, [totalDepth])  // re-run only if totalDepth changes (never in practice)

  /**
   * Immediately sets the scroll target to the given Z depth.
   * Used by the Filmstrip to warp the camera to a specific painting.
   */
  const jumpTo = (z: number) => {
      galleryScroll.target = z
  }

  return { jumpTo }
}
