'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DustParticlesProps {
  count?: number
  boundary?: [number, number, number]
  paused?: boolean
}

export function DustParticles({
  count = 300,
  boundary = [8, 5, 40],
  paused = false,
}: DustParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * boundary[0]
      const y = (Math.random() - 0.5) * boundary[1]
      const z = -Math.random() * boundary[2]
      const speed = 0.04 + Math.random() * 0.12
      const offset = Math.random() * Math.PI * 2
      temp.push({ x, y, z, speed, offset })
    }
    return temp
  }, [count, boundary])

  const matrix = useMemo(() => new THREE.Matrix4(), [])

  useFrame((state) => {
    if (!meshRef.current || paused) return
    const time = state.clock.elapsedTime

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const yDrift = Math.sin(time * p.speed + p.offset) * 0.6
      const xDrift = Math.cos(time * p.speed * 0.5 + p.offset) * 0.3

      dummy.position.set(p.x + xDrift, p.y + yDrift, p.z)
      dummy.rotation.y = time * p.speed
      const scale = 0.6 + Math.sin(time * p.speed + p.offset) * 0.4
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} count={count} frustumCulled={false}>
      <icosahedronGeometry args={[0.012, 0]} />
      <meshStandardMaterial
        color="#ffe2a1"
        emissive="#ffe2a1"
        emissiveIntensity={0.5}
        roughness={1}
        transparent
        opacity={0.12}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
