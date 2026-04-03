import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SculptureProps {
  position: [number, number, number]
  rotation?: [number, number, number]
}

export function Sculpture({ position, rotation = [0, 0, 0] }: SculptureProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
      meshRef.current.rotation.x += delta * 0.2
      // Gentle floating effect
      meshRef.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* Main Pedestal */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 1.2, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Base Accent */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>

      {/* Top Accent */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.05, 32]} />
        <meshStandardMaterial color="#d4af37" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Rotating Abstract Sculpture Piece */}
      <mesh ref={meshRef} position={[0, 1.6, 0]} castShadow>
        <torusKnotGeometry args={[0.25, 0.08, 128, 32]} />
        <meshPhysicalMaterial 
          color="#d4af37"
          metalness={0.8}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </group>
  )
}
