"use client";

// ─── GalleryScene ─────────────────────────────────────────────────────────────
// The top-level Three.js scene for the 3D gallery.
// Responsibilities:
//   • Sets up the WebGL Canvas with film-toned renderer settings.
//   • Hosts the CameraRig which drives all camera movement.
//   • Lays out paintings, sculptures, lighting, fog, dust particles, and the back wall.
//   • Delegates input handling to the `galleryScroll` / `galleryLook` / `paintingOrbit`
//     module-level state objects managed by `useScrollDepth`.

import { useRef, useEffect, Suspense, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Text, Preload, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { paintings, Painting } from "@/lib/paintings";
import { FRAME_SPACING, HALL_WIDTH, HALL_HEIGHT, WALL_X } from "@/lib/constants";
import { PaintingFrame } from "./PaintingFrame";
import { Hallway } from "./Hallway";
import { DustParticles } from "./DustParticles";
import { Sculpture } from "./Sculpture";

// Shared interaction state — mutated every frame without causing React re-renders
import { galleryScroll, galleryLook, paintingOrbit, setPaintingActive } from "@/hooks/useScrollDepth";

// ── Scene dimensions ──────────────────────────────────────────────────────────
// Total corridor depth: one slot per painting + 8 extra units for the back wall
const TOTAL_DEPTH = paintings.length * FRAME_SPACING + 8;

// Fog parameters: objects become invisible beyond FOG_FAR world units
const FOG_NEAR = 12;
const FOG_FAR = 60;

// ─── CameraRig ────────────────────────────────────────────────────────────────
interface CameraRigProps {
  activePainting: Painting | null; // Currently focused painting, or null (walk mode)
}

/**
 * Drives all camera behaviour each frame.
 * Two modes:
 *  1. **Walk mode** (`activePainting === null`) — camera follows `galleryScroll.z`
 *     along the corridor with a subtle sway, and `galleryLook.x` steers it
 *     left / right.
 *  2. **Orbit mode** (`activePainting !== null`) — camera orbits the focused
 *     painting on a sphere using `paintingOrbit.yaw` and `paintingOrbit.pitch`.
 *
 * GSAP tweens handle the animated transitions between modes.
 */
function CameraRig({ activePainting }: CameraRigProps) {
  const { camera, size } = useThree();
  const tween = useRef<gsap.core.Tween | null>(null); // current GSAP position tween
  const isAnimating = useRef(false);                  // true during camera transitions
  const lookTarget = useRef(new THREE.Vector3(0, 0, -10)); // where the camera looks
  const hasEntered = useRef(false);                   // prevents running entrance tween twice

  // ── Orbit pivot data (stored when focus tween completes) ─────────────────────
  const focusPaintingWorld = useRef(new THREE.Vector3()); // world position of the painting surface
  const focusRadius        = useRef(5);                   // camera distance from painting (~3 units)
  const focusIsLeft        = useRef(true);                // which wall owns this painting

  // ── Entrance cinematic ────────────────────────────────────────────────────────
  // On first mount the camera starts 5 units behind the entrance and dollies in.
  useEffect(() => {
    if (hasEntered.current) return; // only run once
    hasEntered.current = true;

    camera.position.set(0, 0, 5); // start behind gallery entrance
    isAnimating.current = true;

    // Smoothly push forward to z=0 (gallery threshold)
    gsap.to(camera.position, {
      z: 0,
      duration: 2.2,
      ease: "power2.inOut",
      onComplete: () => {
        isAnimating.current = false;
      },
    });
  }, [camera]);

  // ── Adaptive FOV ──────────────────────────────────────────────────────────────
  // On portrait devices (phones held vertically) widen the FOV so you can still
  // see both walls comfortably. Landscape uses a cinematic 65° FOV.
  useEffect(() => {
    const isPortrait = size.width < size.height;
    const targetFov = isPortrait ? 95 : 65;
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== targetFov) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix(); // must call after changing fov
    }
  }, [camera, size.width, size.height]);

  // ── Focus / unfocus a painting ────────────────────────────────────────────────
  // Runs whenever `activePainting` changes.
  // On focus : tweens the camera to a position in front of the chosen painting.
  // On unfocus: returns camera to its walk-mode position.
  useEffect(() => {
    if (activePainting) {
      isAnimating.current = true;
      setPaintingActive(true); // notify interaction module to switch to orbit mode

      // Calculate the painting's world-space position
      const idx = paintings.indexOf(activePainting);
      const fz = -(idx * FRAME_SPACING + FRAME_SPACING); // Z depth of this frame
      const isLeft = activePainting.wall === "left";
      const px = isLeft ? -WALL_X : WALL_X;              // X of the wall surface

      // Offset camera to stand in front of the painting (opposite side of corridor)
      const camX = isLeft ? px + 3.0 : px - 3.0;

      // On landscape screens shift the camera slightly left/right for a better angle
      const isPortrait = size.width < size.height;
      const shiftMagnitude = isPortrait ? 0 : 1.5;
      const offsetZ = isLeft ? -shiftMagnitude : shiftMagnitude;
      const targetZ = fz + offsetZ;

      // Cache orbit pivot so the orbit formula in useFrame knows the painting centre
      focusPaintingWorld.current.set(px, 0.1, targetZ);
      focusRadius.current = Math.abs(camX - px); // distance camera will orbit at (~3 units)
      focusIsLeft.current = isLeft;

      // Kill any in-progress tween before starting a new one
      tween.current?.kill();

      // Simultaneously tween the look target so the camera gazes at the painting
      gsap.to(lookTarget.current, {
        x: px, y: 0.1, z: targetZ,
        duration: 1.4, ease: "power3.inOut",
      });

      // Tween camera position — onUpdate keeps it looking at the painting mid-flight
      tween.current = gsap.to(camera.position, {
        x: camX, y: 0.1, z: targetZ,
        duration: 1.4, ease: "power3.inOut",
        onUpdate: () => camera.lookAt(lookTarget.current),
        onComplete: () => { isAnimating.current = false; },
      });
    } else {
      // ── Deactivate / return to walk mode ──────────────────────────────────
      setPaintingActive(false);
      tween.current?.kill();

      // Return look target to straight ahead along the corridor
      gsap.to(lookTarget.current, {
        x: 0, y: 0, z: camera.position.z - 10,
        duration: 0.8, ease: "power2.out",
      });

      // Snap scroll position back to where the camera currently is
      tween.current = gsap.to(camera.position, {
        x: 0, y: 0, z: -galleryScroll.z,
        duration: 0.8, ease: "power2.out",
        onUpdate: () => camera.lookAt(lookTarget.current),
        onComplete: () => { isAnimating.current = false; },
      });
    }
  }, [activePainting, camera]);

  // ── Per-frame update ──────────────────────────────────────────────────────────
  useFrame((state) => {
    if (activePainting && !isAnimating.current) {
      // ── Painting orbit mode ────────────────────────────────────────────────
      // Camera sits on a sphere of radius `focusRadius` centred on the painting.
      // Yaw  rotates left/right around the painting's vertical (Y) axis.
      // Pitch rotates up/down.
      // The rest direction from painting → camera is ±X depending on which wall.

      const p   = focusPaintingWorld.current;  // painting world position
      const R   = focusRadius.current;         // orbit radius
      const yaw   = paintingOrbit.yaw;          // smoothed left/right angle (radians)
      const pitch = paintingOrbit.pitch;        // smoothed up/down angle (radians)
      const side  = focusIsLeft.current ? 1 : -1;  // +1 = right of left wall, -1 = left of right wall

      // Convert spherical coordinates to Cartesian offsets from the painting centre
      const xzR = R * Math.cos(pitch);  // horizontal radius at this pitch
      camera.position.set(
        p.x + side * xzR * Math.cos(yaw),  // X: sweep left/right of the painting
        p.y + R   * Math.sin(pitch),       // Y: move up/down
        p.z + xzR * Math.sin(yaw)          // Z: swing along the corridor
      );

      // Always point the camera directly at the painting surface
      camera.lookAt(p);

    } else if (!activePainting && !isAnimating.current) {
      // ── Gallery walk mode ──────────────────────────────────────────────────
      // Lerp camera Z toward the scroll target (galleryScroll.z is already eased)
      camera.position.z += (-galleryScroll.z - camera.position.z) * 0.08;

      // Gentle vertical sway to simulate natural walking motion
      const time = state.clock.elapsedTime;
      camera.position.y = Math.sin(time * 0.4) * 0.025;

      // Lerp X back to 0 (keeps the camera centred between walls)
      camera.position.x += (0 - camera.position.x) * 0.06;

      // Compute the look-at point from the horizontal look angle
      const lookAngle  = galleryLook.x;         // radians, set by drag/hover
      const dist       = 12;                    // how far ahead to aim the look target
      const verticalDip = -Math.abs(lookAngle) * 0.08; // slight dip when looking sideways

      lookTarget.current.set(
        camera.position.x + Math.sin(lookAngle) * dist,   // X shifts with angle
        camera.position.y + verticalDip,                   // slight Y compensation
        camera.position.z - Math.cos(lookAngle) * dist    // Z stays ahead of camera
      );

      camera.lookAt(lookTarget.current);
    }
  });

  // CameraRig renders no geometry — it only mutates the camera
  return null;
}

// ─── HallwayLights ────────────────────────────────────────────────────────────
/**
 * Two warm directional lights that simulate overhead gallery spotlights.
 * One near the entrance and one mid-gallery provide even front lighting
 * so painting textures are clearly visible.
 */
function HallwayLights() {
  return (
    <>
      {/* Fill lights — enough to read paintings clearly while walking */}
      <directionalLight position={[0, HALL_HEIGHT, 10]} intensity={1.6} color="#ffe8c4" />
      <directionalLight position={[0, HALL_HEIGHT, -TOTAL_DEPTH / 2]} intensity={1.6} color="#ffe8c4" />
      <directionalLight position={[0, HALL_HEIGHT, -TOTAL_DEPTH * 0.75]} intensity={1.2} color="#ffd8a8" />
    </>
  );
}

// ─── WallSconce ──────────────────────────────────────────────────────────────────────
/**
 * A bracket-mounted wall fixture: backplate + horizontal arm + glowing bulb.
 * wallNormal: +1 = arm extends toward +X (mounted on left wall)
 *             -1 = arm extends toward -X (mounted on right wall)
 */
function WallSconce({ position, wallNormal }: {
  position: [number, number, number]
  wallNormal: number
}) {
  const ARM = 0.32
  return (
    <group position={position}>
      {/* Backplate against the wall */}
      <mesh>
        <boxGeometry args={[0.04, 0.18, 0.16]} />
        <meshStandardMaterial color="#1a1a24" metalness={0.35} roughness={0.7} />
      </mesh>
      {/* Horizontal arm extending inward */}
      <mesh position={[wallNormal * ARM / 2, 0, 0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, ARM, 8]} />
        <meshStandardMaterial color="#bfa15f" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Glowing bulb at arm tip */}
      <mesh position={[wallNormal * ARM, 0, 0.06]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial
          color="#fff8e0"
          emissive="#fff8e0"
          emissiveIntensity={6}
          roughness={0.3}
        />
      </mesh>
      {/* Diegetic point light from bulb */}
      <pointLight
        position={[wallNormal * ARM, 0, 0.06]}
        color="#ffd580"
        intensity={5}
        distance={10}
        decay={2}
      />
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
interface SceneProps {
  activePainting: Painting | null;
  onPaintingClick: (p: Painting) => void;
}

/**
 * Assembles every 3D element inside the Canvas:
 *  - CameraRig (no mesh, drives camera)
 *  - PerspectiveCamera (default camera definition)
 *  - Fog (atmospheric depth effect)
 *  - Ambient + directional lights
 *  - Hallway geometry (floor, ceiling, walls, trim)
 *  - DustParticles (floating dust motes, paused when a painting is focused)
 *  - PaintingFrame × N (one per artwork, placed on alternating walls)
 *  - Sculpture × M (one every two paintings, alternating sides)
 *  - Back wall quote text with a point light
 *  - Preload (asks Drei to prefetch all textures asynchronously)
 */
function Scene({ activePainting, onPaintingClick }: SceneProps) {
  return (
    <>
      {/* Camera controller — no visible mesh */}
      <CameraRig activePainting={activePainting} />

      {/* Default perspective camera — FOV adjusted dynamically by CameraRig */}
      <PerspectiveCamera makeDefault fov={65} near={0.1} far={120} position={[0, 0, 0]} />

      {/* Dark atmospheric fog that obscures the far end of the corridor */}
      <fog attach="fog" args={["#030508", FOG_NEAR, FOG_FAR]} />

      {/* Very dim ambient fill — sconces & spotlights provide the real illumination */}
      <ambientLight color="#2a3550" intensity={2.4} />
      <HallwayLights />

      {/* Procedurally textured hallway (floor, ceiling, walls, trim, floor strips) */}
      <Hallway length={TOTAL_DEPTH + 10} width={HALL_WIDTH} height={HALL_HEIGHT} />

      {/* Floating dust particles — paused while a painting is in focus */}
      <DustParticles
        boundary={[HALL_WIDTH - 1, HALL_HEIGHT - 1, TOTAL_DEPTH + 10]}
        paused={activePainting !== null}
      />

      {/* ── Painting frames ──────────────────────────────────────────────────── */}
      {paintings.map((p, i) => {
        const isLeft = p.wall === "left";
        const sx = isLeft ? -WALL_X : WALL_X;          // X: which wall
        const sz = -(i * FRAME_SPACING + FRAME_SPACING); // Z: how far into corridor
        return (
          // Suspense lets each texture load independently without blocking the scene
          <Suspense key={p.id} fallback={null}>
            <PaintingFrame
              src={p.src}
              title={p.title}
              position={[sx, 0.1, sz]}
              // Rotate 90° inward so the painting faces the centre of the corridor
              rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]}
              isActive={activePainting?.id === p.id}     // highlight this frame
              isAnyActive={activePainting !== null}       // dim all other frames
              onClick={() => onPaintingClick(p)}
            />
          </Suspense>
        );
      })}

      {/* ── Sculptures ──────────────────────────────────────────────────────── */}
      {/* Placed between every other pair of paintings, alternating left/right */}
      {paintings.slice(0, -1).map((_, i) => {
        if (i % 2 !== 0) return null; // skip odd indices → one sculpture per two frames
        // Position midway between frames i and i+1
        const sz = -(i * FRAME_SPACING + FRAME_SPACING + FRAME_SPACING / 2);
        const sculptureIndex = Math.floor(i / 2);
        const isLeft = sculptureIndex % 2 === 0; // alternate walls
        const sx = isLeft ? -WALL_X + 0.5 : WALL_X - 0.5; // slightly off-wall
        return (
          <Sculpture
            key={`sculpture-${i}`}
            position={[sx, 0, sz]}
          />
        );
      })}

      {/* ── Wall Sconces between paintings ──────────────────────────────────── */}
      {/* Bracket-mounted fixtures at frame midpoints — diegetic light sources */}
      {paintings.slice(0, -1).map((_, i) => {
        const midZ = -(i * FRAME_SPACING + FRAME_SPACING * 1.5)
        const isLeft = i % 2 === 0
        const wallX = isLeft ? -WALL_X : WALL_X
        const wallNormal = isLeft ? 1 : -1
        return (
          <WallSconce
            key={`sconce-${i}`}
            position={[wallX, 0.8, midZ]}
            wallNormal={wallNormal}
          />
        )
      })}

      {/* ── Back wall ────────────────────────────────────────────────────────── */}
      {/* Quote at the very end of the corridor — no harsh back-light */}
      <group position={[0, 0.3, -(TOTAL_DEPTH + 9.9)]}>
        <Text
          position={[0, -0.4, 0.05]}
          fontSize={0.35}
          color="#bfa15f"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          maxWidth={6.2}
          lineHeight={1.4}
        >
          {`"The art of Alaa is a daring journey. It captures the unseen, inviting\nyou to pause, look deeper, and find the extraordinary in the quietest\nmoments."`}
        </Text>
      </group>

      {/* Preload all textures up front so paintings don't pop during scrolling */}
      <Preload all />
    </>
  );
}

// ─── GalleryScene (exported) ──────────────────────────────────────────────────
interface GallerySceneProps {
  activePainting: Painting | null;
  onPaintingClick: (p: Painting) => void;
}

/**
 * Root component exported to the page.
 * Wraps everything in a full-screen `<Canvas>` with production-quality WebGL
 * settings: ACES filmic tone-mapping, high-performance GPU hint, and a capped
 * device pixel ratio of 1.5× to avoid GPU overload on high-DPI screens.
 */
export function GalleryScene({ activePainting, onPaintingClick }: GallerySceneProps) {
  // Start with a safe DPR of 1, and let PerformanceMonitor adjust it
  const [dpr, setDpr] = useState(1);

  return (
    <Canvas
      style={{
        // Pin the canvas to the full viewport so it always fills the screen
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        width: "100%", height: "100%",
        background: "#030508", // fallback colour while WebGL initialises
      }}
      gl={{
        antialias: true,             // smooth edges (MSAA)
        alpha: false,                // opaque canvas — slightly faster compositing
        toneMapping: THREE.ACESFilmicToneMapping, // cinematic film-style tone curve
        toneMappingExposure: 1.7,    // brightened for a well-lit gallery feel
        powerPreference: "high-performance",      // request discrete GPU on laptops
        stencil: false,              // not used — disable to save VRAM
        depth: true,                 // depth buffer required for 3D ordering
      }}
      // Dynamic DPR tracking for huge performance gains on mobile
      dpr={dpr}
      shadows={false}        // no real-time shadows — they would cost too much GPU
      frameloop="always"     // render every frame (not just on interaction)
    >
      {/* Auto-scales resolution down to 1x if framing drops, up to 1.5x if running smoothly. Never goes below 1x to prevent ugly pixelation. */}
      <PerformanceMonitor onIncline={() => setDpr(1.5)} onDecline={() => setDpr(1)} />
      <Scene activePainting={activePainting} onPaintingClick={onPaintingClick} />
    </Canvas>
  );
}

// Export TOTAL_DEPTH so the parent page can pass it to useScrollDepth
export { TOTAL_DEPTH };
export default GalleryScene;
