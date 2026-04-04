'use client'

import { useRef, useState, useCallback } from 'react'
import { useTexture, Text } from '@react-three/drei'
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface PaintingFrameProps {
  src: string
  position: [number, number, number]
  rotation: [number, number, number]
  title: string
  isActive: boolean
  isAnyActive: boolean
  onClick: () => void
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
  const meshRef = useRef<THREE.Mesh>(null)
  const frameRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const [hovered, setHovered] = useState(false)
  const { camera } = useThree()

  const texture = useTexture(src)

  const targetEmissive = useRef(0.06)
  const currentEmissive = useRef(0.06)
  const targetGlow = useRef(1.5)
  const currentGlow = useRef(1.5)

  // Reveal animation: painting fades in when camera scrolls near
  const revealed = useRef(false)
  const revealProgress = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Skip if painting is far away from camera
    const dist = Math.abs(camera.position.z - position[2])
    if (dist >= 50) return

    // Trigger reveal when camera enters within 22 units
    if (!revealed.current && dist < 22) {
      revealed.current = true
    }

    // Animate reveal opacity (0 → 1 over ~1.5 s)
    if (revealed.current && revealProgress.current < 1) {
      revealProgress.current = Math.min(1, revealProgress.current + delta * 0.65)
    }

    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.opacity = revealProgress.current

    // Emissive hover glow on canvas
    targetEmissive.current = hovered && !isAnyActive ? 0.2 : 0.06
    currentEmissive.current +=
      (targetEmissive.current - currentEmissive.current) * Math.min(delta * 6, 1)
    mat.emissiveIntensity = currentEmissive.current

    // Point-light pulse on hover
    targetGlow.current = hovered ? 3.5 : 1.5
    currentGlow.current +=
      (targetGlow.current - currentGlow.current) * Math.min(delta * 4, 1)
    if (glowRef.current) {
      glowRef.current.intensity = currentGlow.current
    }
  })

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      onClick()
    },
    [onClick]
  )

  const FRAME_W = 1.8
  const FRAME_H = 2.2
  const BORDER = 0.08

  return (
    <group position={position} rotation={rotation}>
      {/* Outer dark frame */}
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

      {/* Inner gold accent */}
      <mesh position={[0, 0, 0.0]}>
        <boxGeometry args={[FRAME_W + BORDER * 1.2, FRAME_H + BORDER * 1.2, 0.02]} />
        <meshStandardMaterial color="#c8a84b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Painting canvas — starts transparent, reveals on approach */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0.025]}
        onClick={handleClick}
        onPointerOver={() => {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <planeGeometry args={[FRAME_W, FRAME_H]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.85}
          metalness={0.0}
          emissive="#ffffff"
          emissiveIntensity={0}
          transparent
          opacity={0}
        />
      </mesh>


      <pointLight
        ref={glowRef}
        position={[0, FRAME_H * 0.8, 0.6]}
        color="#f5e6c8"
        intensity={1.5}
        distance={4.5}
        decay={2}
      />

      {/* Title plate */}
      <group position={[0, -(FRAME_H / 2 + BORDER + 0.16), 0.01]}>
        <mesh>
          <planeGeometry args={[1.4, 0.2]} />
          <meshStandardMaterial color="#16120e" roughness={0.9} metalness={0.2} />
        </mesh>
        <Text
          position={[0, 0, 0.005]}
          fontSize={0.065}
          color="#c8a84b"
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
