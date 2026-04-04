"use client";

import { useRef, useEffect, Suspense } from "react";
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

import { galleryScroll, galleryLook, paintingOrbit, setPaintingActive } from "@/hooks/useScrollDepth";

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

  // Stored when focus tween completes — orbit pivots around these
  const focusPaintingWorld = useRef(new THREE.Vector3());  // world pos of painting surface
  const focusRadius        = useRef(5);                    // camera distance from painting
  const focusIsLeft        = useRef(true);                 // which wall

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
      setPaintingActive(true);

      const idx = paintings.indexOf(activePainting);
      const fz = -(idx * FRAME_SPACING + FRAME_SPACING);
      const isLeft = activePainting.wall === "left";
      const px = isLeft ? -WALL_X : WALL_X;
      const camX = isLeft ? px + 3.0 : px - 3.0;
      const isPortrait = size.width < size.height;
      const shiftMagnitude = isPortrait ? 0 : 1.5;
      const offsetZ = isLeft ? -shiftMagnitude : shiftMagnitude;
      const targetZ = fz + offsetZ;

      // Store orbit pivot info
      focusPaintingWorld.current.set(px, 0.1, targetZ);
      focusRadius.current = Math.abs(camX - px);  // ~5
      focusIsLeft.current = isLeft;

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
      setPaintingActive(false);
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
    if (activePainting && !isAnimating.current) {
      // ── Painting orbit mode ──────────────────────────────────────────────
      // Camera orbits the painting on a sphere of radius `focusRadius`.
      // Yaw  rotates left/right around the painting's vertical (Y) axis.
      // Pitch rotates up/down.
      // The direction from painting→camera at rest is ±X depending on wall.

      const p   = focusPaintingWorld.current;
      const R   = focusRadius.current;
      const yaw   = paintingOrbit.yaw;
      const pitch = paintingOrbit.pitch;
      const side  = focusIsLeft.current ? 1 : -1;  // +1 right-of-left-wall, -1 left-of-right-wall

      // Spherical coords (painting is origin, camera starts at [side*R, 0, 0])
      const xzR = R * Math.cos(pitch);
      camera.position.set(
        p.x + side * xzR * Math.cos(yaw),
        p.y + R   * Math.sin(pitch),
        p.z + xzR * Math.sin(yaw)   // yaw swings along corridor
      );

      // Always look at the painting surface
      camera.lookAt(p);

    } else if (!activePainting && !isAnimating.current) {
      // ── Gallery walk mode ───────────────────────────────────────────────
      camera.position.z += (-galleryScroll.z - camera.position.z) * 0.08;

      const time = state.clock.elapsedTime;
      camera.position.y = Math.sin(time * 0.4) * 0.025;
      camera.position.x += (0 - camera.position.x) * 0.06;

      const lookAngle  = galleryLook.x;
      const dist       = 12;
      const verticalDip = -Math.abs(lookAngle) * 0.08;

      lookTarget.current.set(
        camera.position.x + Math.sin(lookAngle) * dist,
        camera.position.y + verticalDip,
        camera.position.z - Math.cos(lookAngle) * dist
      );

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

      {paintings.map((p, i) => {
        const isLeft = p.wall === "left";
        const sx = isLeft ? -WALL_X : WALL_X;
        const sz = -(i * FRAME_SPACING + FRAME_SPACING);
        return (
          <Suspense key={p.id} fallback={null}>
            <PaintingFrame
              src={p.src}
              title={p.title}
              position={[sx, 0.1, sz]}
              rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]}
              isActive={activePainting?.id === p.id}
              isAnyActive={activePainting !== null}
              onClick={() => onPaintingClick(p)}
            />
          </Suspense>
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
