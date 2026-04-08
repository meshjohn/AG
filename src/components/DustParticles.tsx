'use client'

// ─── DustParticles Component ──────────────────────────────────────────────────
// Renders volumetric floating "dust mote" particles filling the hallway.
// Uses an `InstancedMesh` for vastly superior performance over generating 300 
// individual meshes (1 draw call instead of 300).

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DustParticlesProps {
  count?: number                       // Total number of particle instances to render
  boundary?: [number, number, number]  // X, Y, Z bounding box enclosing all particles
  paused?: boolean                     // Pauses the animation loop (valuable when orbiting paintings)
}

export function DustParticles({
  count = 300,
  boundary = [8, 5, 40],
  paused = false,
}: DustParticlesProps) {
  
  // The master mesh that holds all 300 instances
  const meshRef = useRef<THREE.InstancedMesh>(null)
  
  // A lightweight dummy object used solely to calculate transform matrix math.
  // Instead of recalculating matrix math manually, we place the dummy, ask Three.js
  // what its matrix is, and copy that matrix onto the instance array.
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // ── Particle Initialisation ─────────────────────────────────────────────────
  // Generate random seeds and positions once on mount.
  // We use `useMemo` so we don't recreate this heavy array on a re-render.
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      // Spread X and Y across the boundary box, centered on 0.
      const x = (Math.random() - 0.5) * boundary[0]
      const y = (Math.random() - 0.5) * boundary[1]
      
      // Z goes backward only (0 to -40) because the camera starts at 0.
      const z = -Math.random() * boundary[2]
      
      // Speed multiplier for this specific dust mote
      const speed = 0.04 + Math.random() * 0.12
      
      // Offset phase so they don't all pulsate or drift in sync
      const offset = Math.random() * Math.PI * 2
      
      temp.push({ x, y, z, speed, offset })
    }
    return temp
  }, [count, boundary])

  // ── Animation Loop ──────────────────────────────────────────────────────────
  useFrame((state) => {
    // If the mesh isn't mounted, or the gallery is focused on a painting, do nothing to save CPU.
    if (!meshRef.current || paused) return
    
    // Global continuous time driving the math formulas
    const time = state.clock.elapsedTime

    // For every dust mote:
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      
      // 1. Calculate a gentle drifting offset on X and Y using Sine waves.
      const yDrift = Math.sin(time * p.speed + p.offset) * 0.6
      const xDrift = Math.cos(time * p.speed * 0.5 + p.offset) * 0.3

      // 2. Move the dummy object to this new world coordinate.
      dummy.position.set(p.x + xDrift, p.y + yDrift, p.z)
      
      // 3. Make the dust mote constantly tumble.
      dummy.rotation.y = time * p.speed
      
      // 4. Shrink and grow the dust mote (pulsating effect).
      const scale = 0.6 + Math.sin(time * p.speed + p.offset) * 0.4
      dummy.scale.setScalar(scale)
      
      // 5. Tell the dummy to finalise its new transform matrix.
      dummy.updateMatrix()
      
      // 6. Copy the dummy's finalized matrix into slot `i` of the InstancedMesh map.
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    // IMPORTANT: WebGL won't actually draw the new positions until you set this flag.
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    // frustumCulled={false} means Threejs will keep drawing the particles even if
    // the very central point (0,0,0) is out of frame. Sometimes necessary for InstancedMeshes
    // spread over huge areas.
    <instancedMesh ref={meshRef} count={count} frustumCulled={false}>
      {/* 1 tiny shared icosahedron geometry geometry */}
      <icosahedronGeometry args={[0.012, 0]} />
      
      {/* 1 shared material definition applied identically across all 300 instances */}
      <meshStandardMaterial
        color="#ffe2a1"       // pale yellow
        emissive="#ffe2a1"    // subtly self-illuminated
        emissiveIntensity={0.5}
        roughness={1}
        transparent           // allows opacity
        opacity={0.12}        // VERY faint
        depthWrite={false}    // dust shouldn't block other geometry behind it
      />
    </instancedMesh>
  )
}
