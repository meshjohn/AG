'use client'

// ─── PaintingFrame Component ──────────────────────────────────────────────────
// Represents a single piece of artwork hanging on the wall.
// Manages its own hover states, proximity fade-in (reveal), and click events.
// Also includes the 3D frame geometry, gold accent trim, the title plaque beneath,
// and a subtle point light that illuminates the painting.

import { useRef, useState, useCallback, useEffect } from 'react'
import { useTexture, Text } from '@react-three/drei'
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface PaintingFrameProps {
  src: string                            // Image URL
  position: [number, number, number]     // World coordinate
  rotation: [number, number, number]     // Euler rotation (will be turned 90deg left/right)
  title: string                          // Used on the text plaque
  isActive: boolean                      // Is THIS painting currently focused?
  isAnyActive: boolean                   // Is ANY painting currently focused in the gallery?
  onClick: () => void                    // Hook to trigger focus event
}

export function PaintingFrame({
  src,
  position,
  rotation,
  title,
  isActive,
  isAnyActive,
  onClick,
}: PaintingFrameProps) {
  
  // ── DOM / Scene Refs ────────────────────────────────────────────────────────
  const meshRef  = useRef<THREE.Mesh>(null)       // The actual canvas showing the image
  const frameRef  = useRef<THREE.Mesh>(null)      // The dark wooden background border
  const spotRef   = useRef<THREE.SpotLight>(null)  // Per-frame gallery spotlight
  const targetRef = useRef<THREE.Object3D>(null)   // Invisible target the spot aims at
  
  // ── State ───────────────────────────────────────────────────────────────────
  const [hovered, setHovered] = useState(false) // Mouse hover state
  const { camera } = useThree()                 // Gives us access to where the camera currently is

  // Fetch and decode the high-res image into a WebGL texture.
  // Because we used <Suspense> up in GalleryScene, this component pauses rendering 
  // until the texture is fully loaded, preventing black squares.
  const texture = useTexture(src)

  // ── Animation Targets ───────────────────────────────────────────────────────
  // We track "target" and "current" values for lighting.
  // We lerp (smoothly interpolate) `current` towards `target` every frame.
  
  // Emissive: How much the painting itself glows from within
  const targetEmissive = useRef(0.12)
  const currentEmissive = useRef(0.12)
  
  // Light intensity: The strength of the SpotLight sitting over the frame
  const targetGlow = useRef(6.5)
  const currentGlow = useRef(6.5)

  // Reveal effect: Paintings start invisible and fade in as the user walks near them.
  // This saves performance and looks poetic.
  const revealed = useRef(false)
  const revealProgress = useRef(0) // 0 (invisible) to 1 (fully opaque)

  // ── Per-Frame Animation Loop ────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!meshRef.current) return

    // 1. Proximity Check
    // Calculate distance linearly along the Z corridor axis between the camera and this specific frame.
    const dist = Math.abs(camera.position.z - position[2])
    
    // Performance optimisation: If the painting is over 50 units away, skip ALL math.
    // We don't need to animate hover states or fade logic for things miles down the hall.
    if (dist >= 50) return

    // 2. Trigger Reveal Logic
    // If the camera crosses the 22-unit threshold, mark this painting as ready to fade in.
    if (!revealed.current && dist < 22) {
      revealed.current = true
    }

    // 3. Execute Fade-In
    // Increment opacity (0 -> 1). delta is the fraction of a second since last frame.
    if (revealed.current && revealProgress.current < 1) {
      revealProgress.current = Math.min(1, revealProgress.current + delta * 0.65)
    }

    // Apply the opacity to the material
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.opacity = revealProgress.current

    // 4. Emissive / Glow Interpolation
    // If the user hovers over the frame (AND no painting is currently focused/zoomed),
    // increase the inner glow to indicate "clickable".
    targetEmissive.current = hovered && !isAnyActive ? 0.32 : 0.12
    
    // Lerp logic: current += (target - current) * speed
    currentEmissive.current +=
      (targetEmissive.current - currentEmissive.current) * Math.min(delta * 6, 1)
    
    // Apply to mesh
    mat.emissiveIntensity = currentEmissive.current

    // 5. Do the exact same thing for the external PointLight 
    targetGlow.current = hovered ? 11.0 : 6.5
    currentGlow.current +=
      (targetGlow.current - currentGlow.current) * Math.min(delta * 4, 1)
    if (spotRef.current) {
      spotRef.current.intensity = currentGlow.current
    }
  })

  // Link spotlight to its target once on mount
  useEffect(() => {
    if (spotRef.current && targetRef.current) {
      spotRef.current.target = targetRef.current
    }
  }, [])

  // ── Events ──────────────────────────────────────────────────────────────────
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      // Prevent click from bleeding through to the walls behind the frame
      e.stopPropagation() 
      onClick() // Tell GalleryScene to focus this frame
    },
    [onClick]
  )

  // Physical dimensions of the artwork. Note that all of Alaa's work in this 
  // collection is consistently vertical/portrait.
  const FRAME_W = 1.8
  const FRAME_H = 2.2
  const BORDER = 0.08   // Width of the dark wooden backing border

  return (
    // We wrap everything in a group so we can blindly position/rotate it as a single unit
    <group position={position} rotation={rotation}>
      
      {/* ── 1. The dark, thick outer border frame ───────────────────────────── */}
      {/* Positioned slightly backwards on Z (-0.01) */}
      <mesh ref={frameRef} position={[0, 0, -0.01]}>
        <boxGeometry args={[FRAME_W + BORDER * 2, FRAME_H + BORDER * 2, 0.02]} />
        <meshStandardMaterial
          color="#2a2218"
          metalness={0.6}
          roughness={0.4}
          emissive="#c8a84b"
          emissiveIntensity={0.04}
        />
      </mesh>

      {/* ── 2. The inner gold trim / passepartout ──────────────────────────── */}
      {/* Provides a thin metallic line right around the artwork edge */}
      <mesh position={[0, 0, 0.0]}>
        <boxGeometry args={[FRAME_W + BORDER * 1.2, FRAME_H + BORDER * 1.2, 0.02]} />
        <meshStandardMaterial color="#c8a84b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* ── 3. The Canvas (The Image Itself) ────────────────────────────────── */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0.025]}     // Sits furthest forward
        onClick={handleClick}        // Bind React Three Fiber pointer event
        
        // When the mouse pointer hits the 3D polygon, update state & cursor
        onPointerOver={() => {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        // Revert when pointer leaves
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <planeGeometry args={[FRAME_W, FRAME_H]} />
        
        <meshStandardMaterial
          map={texture}              // The high-res NextJS image mapped directly.
          roughness={0.85}           // Matte finish, like graphite paper.
          metalness={0.0}
          emissive="#ffffff"         // White base emissive allows us to make it glow pure white.
          emissiveIntensity={0}      // Overridden per-frame in useFrame.
          transparent                // Must be true to allow the 0 -> 1 reveal fade.
          opacity={0}                // Starts invisible.
        />
      </mesh>


      {/* ── 4. Gallery Spotlight — tight cone, real-museum style ────────────── */}
      {/* Invisible scene-graph object the spotlight tracks */}
      <object3D ref={targetRef} position={[0, 0, 0.025]} />
      {/* angle=0.45 wider beam covers the full canvas; penumbra=0.6 soft edge */}
      <spotLight
        ref={spotRef}
        position={[0, FRAME_H + 0.4, 0.9]}
        angle={0.45}
        penumbra={0.6}
        color="#ffe8c4"
        intensity={6.5}
        distance={12}
        decay={2}
      />

      {/* ── 5. The Title Plaque ──────────────────────────────────────────────── */}
      {/* Sits below the main frame */}
      <group position={[0, -(FRAME_H / 2 + BORDER + 0.16), 0.01]}>
        
        {/* Metal label background */}
        <mesh>
          <planeGeometry args={[1.4, 0.2]} />
          <meshStandardMaterial color="#16120e" roughness={0.9} metalness={0.2} />
        </mesh>
        
        {/* Drei Text system — renders sharp SDF fonts natively in WebGL */}
        <Text
          position={[0, 0, 0.005]}   // Sits just on top of the plate geometry
          fontSize={0.065}
          color="#c8a84b"            // Gold lettering
          anchorX="center"
          anchorY="middle"
          maxWidth={1.3}
          textAlign="center"
        >
          {title.toUpperCase()}
        </Text>
        
      </group>
    </group>
  )
}
