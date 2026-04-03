'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { paintings, Painting } from '@/lib/paintings'
import { PaintingFrame } from './PaintingFrame'
import { Hallway } from './Hallway'
import { DustParticles } from './DustParticles'

import { galleryScroll } from '@/hooks/useScrollDepth'

const FRAME_SPACING = 7.5
const HALL_WIDTH = 7
const HALL_HEIGHT = 4.5
const WALL_X = HALL_WIDTH / 2 - 0.18
const TOTAL_DEPTH = paintings.length * FRAME_SPACING + 8

// Fog must reach far enough that you never hit pure black
const FOG_NEAR = 12
const FOG_FAR = 60

interface CameraRigProps {
  activePainting: Painting | null
}

function CameraRig({ activePainting }: CameraRigProps) {
  const { camera, size } = useThree()
  const tween = useRef<gsap.core.Tween | null>(null)
  const isAnimating = useRef(false)
  const lookTarget = useRef(new THREE.Vector3(0, 0, -10))

  // Dynamically widen FOV on portrait mobile screens so it doesn't hopelessly zoom in on the side walls
  useEffect(() => {
    const isPortrait = size.width < size.height
    const targetFov = isPortrait ? 95 : 65
    
    if (camera instanceof THREE.PerspectiveCamera) {
      if (camera.fov !== targetFov) {
        camera.fov = targetFov
        camera.updateProjectionMatrix()
      }
    }
  }, [camera, size])

  useEffect(() => {
    if (activePainting) {
      isAnimating.current = true
      const idx = paintings.indexOf(activePainting)
      const fz = -(idx * FRAME_SPACING + FRAME_SPACING)
      const isLeft = activePainting.wall === 'left'
      const px = isLeft ? -WALL_X : WALL_X
      const camX = isLeft ? px + 3.0 : px - 3.0

      tween.current?.kill()
      
      gsap.to(lookTarget.current, {
        x: px,
        y: 0.1,
        z: fz,
        duration: 1.4,
        ease: 'power3.inOut'
      })

      tween.current = gsap.to(camera.position, {
        x: camX,
        y: 0.1,
        z: fz,
        duration: 1.4,
        ease: 'power3.inOut',
        onUpdate: () => {
          camera.lookAt(lookTarget.current)
        },
        onComplete: () => {
          isAnimating.current = false
        },
      })
    } else {
      tween.current?.kill()

      gsap.to(lookTarget.current, {
        x: 0,
        y: 0,
        z: camera.position.z - 10,
        duration: 0.8,
        ease: 'power2.out'
      })

      tween.current = gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: -galleryScroll.z,
        duration: 0.8,
        ease: 'power2.out',
        onUpdate: () => {
          camera.lookAt(lookTarget.current)
        },
        onComplete: () => {
          isAnimating.current = false
        },
      })
    }
  }, [activePainting, camera])

  useFrame((state) => {
    if (!activePainting && !isAnimating.current) {
      camera.position.z += (-galleryScroll.z - camera.position.z) * 0.08

      // Very subtle idle float — capped to not cause nausea on mobile
      const time = state.clock.elapsedTime
      camera.position.y = Math.sin(time * 0.4) * 0.025

      lookTarget.current.set(0, 0, camera.position.z - 10)
      camera.lookAt(lookTarget.current)
    }
  })

  return null
}

function HallwayLights() {
  return (
    <>
      {/* Broad soft lighting replacing 12 expensive point lights */}
      <directionalLight position={[0, HALL_HEIGHT, 10]} intensity={1.5} color="#f8edd5" />
      <directionalLight position={[0, HALL_HEIGHT, -TOTAL_DEPTH / 2]} intensity={1.5} color="#f8edd5" />
    </>
  )
}

interface SceneProps {
  activePainting: Painting | null
  onPaintingClick: (p: Painting) => void
}

function Scene({ activePainting, onPaintingClick }: SceneProps) {
  return (
    <>
      <CameraRig activePainting={activePainting} />

      <PerspectiveCamera makeDefault fov={65} near={0.1} far={120} position={[0, 0, 0]} />

      <fog attach="fog" args={['#050403', FOG_NEAR, FOG_FAR]} />

      <ambientLight color="#221c14" intensity={2.5} />
      <HallwayLights />

      <Hallway
        length={TOTAL_DEPTH + 10}
        width={HALL_WIDTH}
        height={HALL_HEIGHT}
      />

      <DustParticles boundary={[HALL_WIDTH - 1, HALL_HEIGHT - 1, TOTAL_DEPTH + 10]} />

      {paintings.map((painting, i) => {
        const fz = -(i * FRAME_SPACING + FRAME_SPACING)
        const isLeft = painting.wall === 'left'
        const px = isLeft ? -WALL_X : WALL_X
        const ry = isLeft ? Math.PI / 2 : -Math.PI / 2

        return (
          <PaintingFrame
            key={painting.id}
            src={painting.src}
            position={[px, 0.1, fz]}
            rotation={[0, ry, 0]}
            title={painting.title}
            isActive={activePainting?.id === painting.id}
            isAnyActive={activePainting !== null}
            onClick={() => onPaintingClick(painting)}
          />
        )
      })}
    </>
  )
}

interface GallerySceneProps {
  activePainting: Painting | null
  onPaintingClick: (p: Painting) => void
}

export function GalleryScene({ activePainting, onPaintingClick }: GallerySceneProps) {
  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', background: '#050403' }}
      gl={{
        antialias: true,
        alpha: false,              // opaque canvas — no bleed-through from browser bg
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.25,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      dpr={Math.min(window?.devicePixelRatio ?? 1, 1.5)}
      shadows={false}
      frameloop="always"
    >
      <Scene
        activePainting={activePainting}
        onPaintingClick={onPaintingClick}
      />
    </Canvas>
  )
}

export { TOTAL_DEPTH }
export default GalleryScene
