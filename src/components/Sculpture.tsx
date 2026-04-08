import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Sculpture Component ──────────────────────────────────────────────────────
// An ambient decoration placed intermittently between paintings to add visual
// interest and depth to the corridor. Features a slowly rotating, floating ring.

interface SculptureProps {
  position: [number, number, number]   // Where to physically place it in the hallway
  rotation?: [number, number, number]  // Optional initial rotation adjustments
}

export function Sculpture({ position, rotation = [0, 0, 0] }: SculptureProps) {
  // Reference to the abstract top piece so we can rotate it dynamically
  const meshRef = useRef<THREE.Mesh>(null)

  // ── Animation Loop ──────────────────────────────────────────────────────────
  // Runs every single rendered frame.
  useFrame((state, delta) => {
    if (meshRef.current) {
      // 1. Constant rotation on two axes based on elapsed frame time (delta)
      meshRef.current.rotation.y += delta * 0.3
      meshRef.current.rotation.x += delta * 0.2
      
      // 2. Vertical oscillation (floating effect).
      // Math.sin creates a smooth repeating wave going from -1 to 1 based on time.
      meshRef.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05
    }
  })

  return (
    <group position={position} rotation={rotation}>
      
      {/* ── 1. Wide plinth base ──────────────────────────────────────────────── */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.64, 0.08, 0.64]} />
        <meshStandardMaterial color="#1c1b26" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* ── 2. Classical box plinth body ─────────────────────────────────────── */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[0.5, 1.18, 0.5]} />
        <meshStandardMaterial color="#0f0e14" roughness={0.7} metalness={0.15} />
      </mesh>

      {/* ── 3. Gold cap atop the plinth ──────────────────────────────────────── */}
      <mesh position={[0, 1.28, 0]}>
        <boxGeometry args={[0.56, 0.04, 0.56]} />
        <meshStandardMaterial color="#bfa15f" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* ── 4. The floating, animated abstract shape ──────────────────────── */}
      <mesh ref={meshRef} position={[0, 1.6, 0]} castShadow>
        {/* A complex, looping knotted donut shape */}
        <torusKnotGeometry args={[0.25, 0.08, 128, 32]} />
        
        <meshPhysicalMaterial
          color="#bfa15f"
          metalness={0.8}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </group>
  )
}
