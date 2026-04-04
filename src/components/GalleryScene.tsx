"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Text, Preload } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { paintings, Painting } from "@/lib/paintings";
import { FRAME_SPACING, HALL_WIDTH, HALL_HEIGHT, WALL_X } from "@/lib/constants";
import { PaintingFrame } from "./PaintingFrame";
import { Hallway } from "./Hallway";
import { DustParticles } from "./DustParticles";
import { Sculpture } from "./Sculpture";

import { galleryScroll } from "@/hooks/useScrollDepth";

const TOTAL_DEPTH = paintings.length * FRAME_SPACING + 8;

const FOG_NEAR = 12;
const FOG_FAR = 60;

interface CameraRigProps {
  activePainting: Painting | null;
}

function CameraRig({ activePainting }: CameraRigProps) {
  const { camera, size } = useThree();
  const tween = useRef<gsap.core.Tween | null>(null);
  const isAnimating = useRef(false);
  const lookTarget = useRef(new THREE.Vector3(0, 0, -10));
  const hasEntered = useRef(false);

  // Entrance cinematic: camera starts at z = +5, dollies in on first mount
  useEffect(() => {
    if (hasEntered.current) return;
    hasEntered.current = true;

    camera.position.set(0, 0, 5);
    isAnimating.current = true;

    gsap.to(camera.position, {
      z: 0,
      duration: 2.2,
      ease: "power2.inOut",
      onComplete: () => {
        isAnimating.current = false;
      },
    });
  }, [camera]);

  // Adapt FOV for portrait vs landscape
  useEffect(() => {
    const isPortrait = size.width < size.height;
    const targetFov = isPortrait ? 95 : 65;
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== targetFov) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);

  // Focus selected painting
  useEffect(() => {
    if (activePainting) {
      isAnimating.current = true;
      const idx = paintings.indexOf(activePainting);
      const fz = -(idx * FRAME_SPACING + FRAME_SPACING);
      const isLeft = activePainting.wall === "left";
      const px = isLeft ? -WALL_X : WALL_X;
      const camX = isLeft ? px + 5.0 : px - 5.0;
      const isPortrait = size.width < size.height;
      const shiftMagnitude = isPortrait ? 0 : 1.5;
      const offsetZ = isLeft ? -shiftMagnitude : shiftMagnitude;
      const targetZ = fz + offsetZ;

      tween.current?.kill();

      gsap.to(lookTarget.current, {
        x: px, y: 0.1, z: targetZ,
        duration: 1.4, ease: "power3.inOut",
      });

      tween.current = gsap.to(camera.position, {
        x: camX, y: 0.1, z: targetZ,
        duration: 1.4, ease: "power3.inOut",
        onUpdate: () => camera.lookAt(lookTarget.current),
        onComplete: () => { isAnimating.current = false; },
      });
    } else {
      tween.current?.kill();

      gsap.to(lookTarget.current, {
        x: 0, y: 0, z: camera.position.z - 10,
        duration: 0.8, ease: "power2.out",
      });

      tween.current = gsap.to(camera.position, {
        x: 0, y: 0, z: -galleryScroll.z,
        duration: 0.8, ease: "power2.out",
        onUpdate: () => camera.lookAt(lookTarget.current),
        onComplete: () => { isAnimating.current = false; },
      });
    }
  }, [activePainting, camera]);

  useFrame((state) => {
    if (!activePainting && !isAnimating.current) {
      camera.position.z += (-galleryScroll.z - camera.position.z) * 0.08;
      const time = state.clock.elapsedTime;
      camera.position.y = Math.sin(time * 0.4) * 0.025;
      lookTarget.current.set(0, 0, camera.position.z - 10);
      camera.lookAt(lookTarget.current);
    }
  });

  return null;
}

function HallwayLights() {
  return (
    <>
      <directionalLight position={[0, HALL_HEIGHT, 10]} intensity={1.5} color="#f8edd5" />
      <directionalLight position={[0, HALL_HEIGHT, -TOTAL_DEPTH / 2]} intensity={1.5} color="#f8edd5" />
    </>
  );
}



interface SceneProps {
  activePainting: Painting | null;
  onPaintingClick: (p: Painting) => void;
}

function Scene({ activePainting, onPaintingClick }: SceneProps) {
  return (
    <>
      <CameraRig activePainting={activePainting} />

      <PerspectiveCamera makeDefault fov={65} near={0.1} far={120} position={[0, 0, 0]} />

      <fog attach="fog" args={["#050403", FOG_NEAR, FOG_FAR]} />

      <ambientLight color="#221c14" intensity={2.5} />
      <HallwayLights />

      <Hallway length={TOTAL_DEPTH + 10} width={HALL_WIDTH} height={HALL_HEIGHT} />

      {/* Dust — paused while a painting is focused */}
      <DustParticles
        boundary={[HALL_WIDTH - 1, HALL_HEIGHT - 1, TOTAL_DEPTH + 10]}
        paused={activePainting !== null}
      />

      {paintings.map((painting, i) => {
        const fz = -(i * FRAME_SPACING + FRAME_SPACING);
        const isLeft = painting.wall === "left";
        const px = isLeft ? -WALL_X : WALL_X;
        const ry = isLeft ? Math.PI / 2 : -Math.PI / 2;

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
        );
      })}

      {/* Sculptures between paintings — one every two frames, alternating variants */}
      {paintings.slice(0, -1).map((_, i) => {
        if (i % 2 !== 0) return null;
        const sz = -(i * FRAME_SPACING + FRAME_SPACING + FRAME_SPACING / 2);
        const sculptureIndex = Math.floor(i / 2);
        const isLeft = sculptureIndex % 2 === 0;
        const sx = isLeft ? -WALL_X + 0.5 : WALL_X - 0.5;
        return (
          <Sculpture
            key={`sculpture-${i}`}
            position={[sx, 0, sz]}
          />
        );
      })}

      {/* Back wall — quote + generative sketch art */}
      <group position={[0, 0.3, -(TOTAL_DEPTH + 9.9)]}>
        <pointLight position={[0, 0.8, 1]} intensity={5} distance={10} color="#ffffff" />
        <Text
          position={[0, -0.4, 0.05]}
          fontSize={0.35}
          color="#d4af37"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          maxWidth={6.2}
          lineHeight={1.4}
        >
          {`"The art of Alaa is a daring journey. It captures the unseen, inviting\nyou to pause, look deeper, and find the extraordinary in the quietest\nmoments."`}
        </Text>
      </group>

      {/* Preload all textures in the background */}
      <Preload all />
    </>
  );
}

interface GallerySceneProps {
  activePainting: Painting | null;
  onPaintingClick: (p: Painting) => void;
}

export function GalleryScene({ activePainting, onPaintingClick }: GallerySceneProps) {
  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        width: "100%", height: "100%",
        background: "#050403",
      }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.25,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      dpr={Math.min(window?.devicePixelRatio ?? 1, 1.5)}
      shadows={false}
      frameloop="always"
    >
      <Scene activePainting={activePainting} onPaintingClick={onPaintingClick} />
    </Canvas>
  );
}

export { TOTAL_DEPTH };
export default GalleryScene;
