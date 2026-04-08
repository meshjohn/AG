'use client'

// ─── Hallway Component ────────────────────────────────────────────────────────
// Renders the architectural shell of the 3D gallery corridor.
// Generates its own procedural textures (Canvas-based) on-the-fly to avoid loading 
// heavy image files over the network. Constructs floors, ceilings, walls, trim, 
// and floor lighting strips.

import { useMemo } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'


interface HallwayProps {
  length: number   // Depth of the z-axis corridor
  width: number    // Span across the x-axis
  height: number   // Span across the y-axis
}

export function Hallway({ length, width, height }: HallwayProps) {

  // ── Procedural Textures ─────────────────────────────────────────────────────
  // We use HTML <canvas> APIs via `document.createElement('canvas')` to draw
  // textures with JS, then turn them into Three.js textures.
  // We wrap these in `useMemo` so they are only computed exactly once on mount.

  // 1. Floor Texture: A dark tiled grid with subtle grain.
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    
    // Base solid colour
    ctx.fillStyle = '#0e0d0c'
    ctx.fillRect(0, 0, 512, 512)

    // Draw subtle translucent grid lines
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

    // Add noise grain by splattering 4000 random white-ish pixel dots
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const brightness = Math.random() * 25
      ctx.fillStyle = `rgba(${brightness + 10},${brightness + 8},${brightness + 5},0.4)`
      ctx.fillRect(x, y, 1, 1)
    }

    const tex = new THREE.CanvasTexture(canvas)
    // Configure texture to repeat cleanly rather than stretch
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    // Number of tile repetitions scales dynamically with corridor length
    tex.repeat.set(length / 4, 1)
    return tex
  }, [length])

  // 2. Wall Texture: Darker, grainier, no grid lines.
  const wallTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    
    ctx.fillStyle = '#1e1b17'
    ctx.fillRect(0, 0, 256, 256)
    
    // Speckle noise
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

  // 3. Ceiling: Pitch black void, flat.
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

  // ── Geometry Helpers ────────────────────────────────────────────────────────
  const hw = width / 2
  const hh = height / 2
  const geoLength = length + 20
  const geoCenterZ = -length / 2 + 5

  // Ceiling coffer lateral beam Z positions — one every 5 units along the corridor
  const cofferLateralZs = useMemo(() => {
    const spacing = 5
    const start = geoCenterZ - geoLength / 2
    const count = Math.ceil(geoLength / spacing) + 1
    return Array.from({ length: count }, (_, i) => start + i * spacing)
  }, [geoLength, geoCenterZ])

  // Dado rail Y heights (from floor at -hh)
  const dadoYs = [-hh + 0.85, -hh + height * 0.64]

  // ── Architecture Render ─────────────────────────────────────────────────────
  return (
    <group>
      {/* 1. Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -hh, geoCenterZ]}>
        <planeGeometry args={[width, geoLength]} />
        {/* Uses MeshReflectorMaterial for a premium glass reflection effect */}
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={256}
          mixBlur={1}
          mixStrength={80}
          roughness={0.15}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0c10"
          metalness={0.8}
          mirror={1}
          map={floorTexture}
        />
      </mesh>

      {/* 2. Ceiling Plane */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, hh, geoCenterZ]}>
        <planeGeometry args={[width, geoLength]} />
        <meshStandardMaterial
          map={ceilTexture}
          roughness={1}
          metalness={0}
          color="#0a0908"
        />
      </mesh>

      {/* 3. Left Wall Plane */}
      {/* Rotated 90 degrees on Y axis to face inwards */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-hw, 0, geoCenterZ]}>
        <planeGeometry args={[geoLength, height]} />
        <meshStandardMaterial
          map={wallTexture}
          roughness={0.95} // Very matte
          metalness={0}
          color="#1e1c18"
        />
      </mesh>

      {/* 4. Right Wall Plane */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[hw, 0, geoCenterZ]}>
        <planeGeometry args={[geoLength, height]} />
        <meshStandardMaterial
          map={wallTexture}
          roughness={0.95}
          metalness={0}
          color="#1e1c18"
        />
      </mesh>

      {/* 5. Back Solid Wall */}
      {/* Closes off the end of the tunnel */}
      <mesh position={[0, 0, -length]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#0c0b09" roughness={1} />
      </mesh>

      {/* ── Accents & Trim ──────────────────────────────────────────────────── */}
      
      {/* 6. Gold baseboard skirting on both floor seams [-1 left, 1 right] */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (hw - 0.02), -hh + 0.03, geoCenterZ]}
        >
          {/* A long, thin box running the length of the corridor */}
          <boxGeometry args={[0.04, 0.06, geoLength]} />
          <meshStandardMaterial color="#bfa15f" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* 7. Gold crown moulding on both ceiling seams */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (hw - 0.02), hh - 0.03, geoCenterZ]}
        >
          <boxGeometry args={[0.04, 0.06, geoLength]} />
          <meshStandardMaterial color="#bfa15f" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* 8. Recessed Glowing Floor Strips */}
      {/* These provide an ambient architectural glow along the floor edge. */}
      {/* Left strip */}
      <mesh position={[-hw + 0.3, -hh + 0.01, geoCenterZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.06, 0.01, geoLength * 0.95]} />
        <meshStandardMaterial
          color="#f5e6c8"
          emissive="#f5e6c8" // It glows!
        emissiveIntensity={1.4}
          roughness={1}
        />
      </mesh>

      {/* Right strip */}
      <mesh position={[hw - 0.3, -hh + 0.01, geoCenterZ]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.06, 0.01, geoLength * 0.95]} />
        <meshStandardMaterial
          color="#f5e6c8"
          emissive="#f5e6c8"
        emissiveIntensity={1.4}
          roughness={1}
        />
      </mesh>

      {/* ── Dado Rails ────────────────────────────────────────────────────────── */}
      {/* Horizontal molding strips on both walls — lower at ~90cm, upper at ~65% height */}
      {([-1, 1] as const).map((side) =>
        dadoYs.map((y, ri) => (
          <mesh key={`dado-${side}-${ri}`} position={[side * (hw - 0.028), y, geoCenterZ]}>
            <boxGeometry args={[0.055, 0.07, geoLength]} />
            <meshStandardMaterial color="#1e1c2a" metalness={0.2} roughness={0.6} />
          </mesh>
        ))
      )}

      {/* ── Ceiling Coffers ───────────────────────────────────────────────────── */}
      {/* Longitudinal beams running the length of the corridor */}
      {([-hw / 2, 0, hw / 2] as const).map((x, i) => (
        <mesh key={`longbeam-${i}`} position={[x, hh - 0.04, geoCenterZ]}>
          <boxGeometry args={[0.07, 0.07, geoLength]} />
          <meshStandardMaterial color="#0d0c11" roughness={0.85} metalness={0.1} />
        </mesh>
      ))}
      {/* Lateral beams crossing the width every 5 units — creates a coffered grid */}
      {cofferLateralZs.map((z, i) => (
        <mesh key={`latbeam-${i}`} position={[0, hh - 0.04, z]}>
          <boxGeometry args={[width + 0.05, 0.07, 0.07]} />
          <meshStandardMaterial color="#0d0c11" roughness={0.85} metalness={0.1} />
        </mesh>
      ))}
    </group>
  )
}
