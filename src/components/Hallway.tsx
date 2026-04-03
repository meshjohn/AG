'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

interface HallwayProps {
  length: number
  width: number
  height: number
}

export function Hallway({ length, width, height }: HallwayProps) {
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0e0d0c'
    ctx.fillRect(0, 0, 512, 512)

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(80,70,55,0.15)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * 512
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 512)
      ctx.stroke()
      const y = (i / 8) * 512
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(512, y)
      ctx.stroke()
    }

    // Noise grain
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const brightness = Math.random() * 25
      ctx.fillStyle = `rgba(${brightness + 10},${brightness + 8},${brightness + 5},0.4)`
      ctx.fillRect(x, y, 1, 1)
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(length / 4, 1)
    return tex
  }, [length])

  const wallTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#141210'
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const b = Math.random() * 12
      ctx.fillStyle = `rgba(${b + 8},${b + 7},${b + 5},0.3)`
      ctx.fillRect(x, y, 1, 1)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(length / 5, 1)
    return tex
  }, [length])

  const ceilTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0c0b09'
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [])

  const hw = width / 2
  const hh = height / 2
  const hl = length / 2

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -hh, -hl + length / 2]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.1}
          metalness={0.6}
          color="#1a1814"
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, hh, -hl + length / 2]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial
          map={ceilTexture}
          roughness={1}
          metalness={0}
          color="#0a0908"
        />
      </mesh>

      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-hw, 0, -hl + length / 2]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial
          map={wallTexture}
          roughness={0.95}
          metalness={0}
          color="#161412"
        />
      </mesh>

      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[hw, 0, -hl + length / 2]}>
        <planeGeometry args={[length, height]} />
        <meshStandardMaterial
          map={wallTexture}
          roughness={0.95}
          metalness={0}
          color="#161412"
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0, -length]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#0c0b09" roughness={1} />
      </mesh>

      {/* Floor edge trim strips */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (hw - 0.02), -hh + 0.03, -hl + length / 2]}
        >
          <boxGeometry args={[0.04, 0.06, length]} />
          <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Ceiling edge trim */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (hw - 0.02), hh - 0.03, -hl + length / 2]}
        >
          <boxGeometry args={[0.04, 0.06, length]} />
          <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Recessed floor lighting strip — left */}
      <mesh position={[-hw + 0.3, -hh + 0.01, -hl + length / 2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.06, 0.01, length * 0.95]} />
        <meshStandardMaterial
          color="#f5e6c8"
          emissive="#f5e6c8"
          emissiveIntensity={0.6}
          roughness={1}
        />
      </mesh>

      {/* Recessed floor lighting strip — right */}
      <mesh position={[hw - 0.3, -hh + 0.01, -hl + length / 2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.06, 0.01, length * 0.95]} />
        <meshStandardMaterial
          color="#f5e6c8"
          emissive="#f5e6c8"
          emissiveIntensity={0.6}
          roughness={1}
        />
      </mesh>
    </group>
  )
}
