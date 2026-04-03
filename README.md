# Alaa Mansour — Graphite Gallery

An immersive 3D gallery hallway built with **Next.js 14**, **React Three Fiber**, **Three.js**, and **GSAP**.

Walk through a cinematic dark hallway and explore Alaa Mansour's graphite pencil artworks, one by one.

---

## Features

- **Infinite Z-axis hallway** rendered in WebGL with Three.js
- **Smooth scroll navigation** — mouse wheel or touch to walk forward
- **Per-painting spotlights** with warm amber glow
- **Click any frame** → GSAP animates camera to center on it
- **Detail panel** slides in with title, medium, year, and description
- **Filmstrip sidebar** — jump directly to any painting
- **Progress bar** shows how far through the gallery you've walked
- **Loading screen** with animated entrance
- **Keyboard support** — `ESC` to close detail view
- **Mobile friendly** — touch swipe navigation, responsive layout

---

## Tech Stack

| Package              | Role                                             |
| -------------------- | ------------------------------------------------ |
| `next` 14            | App framework                                    |
| `@react-three/fiber` | React renderer for Three.js                      |
| `@react-three/drei`  | Helpers: `useTexture`, `PerspectiveCamera`, etc. |
| `three`              | 3D engine                                        |
| `gsap`               | Camera zoom animation                            |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add your artwork images

Place your `.jpg` images in `/public/images/` named:

```
painting-01.jpg  through  painting-10.jpg
```

The project ships with Alaa's 10 artworks already included.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for production

```bash
npm run build
npm start
```

---

## Customising

### Change paintings metadata

Edit `src/lib/paintings.ts` — update titles, descriptions, year, and medium for each piece.

### Add more paintings

1. Add images to `/public/images/painting-11.jpg`, etc.
2. Extend the `paintings` array in `src/lib/paintings.ts`.
3. The hallway auto-extends.

### Adjust the hallway look

In `src/components/Hallway.tsx`:

- `HALL_WIDTH` / `HALL_HEIGHT` — corridor dimensions
- Light strip color & intensity
- Floor metalness/roughness for more or less reflection

### Change fog depth

In `src/components/GalleryScene.tsx`:

```tsx
<fog attach="fog" args={["#050403", 12, 42]} />
```

Increase `42` for longer sightlines, decrease for more dramatic fade.

### Scroll speed

In `src/hooks/useScrollDepth.ts`:

```ts
targetRef.current + e.deltaY * 0.8; // increase multiplier = faster scroll
```

---

## Deployment

Deploy to **Vercel** in one command:

```bash
npx vercel
```

Or push to GitHub and connect via [vercel.com](https://vercel.com).

---

## Project Structure

```
alaa-gallery/
├── public/
│   └── images/          ← artwork JPEGs
├── src/
│   ├── app/
│   │   ├── layout.tsx   ← root layout + Google Fonts
│   │   ├── page.tsx     ← main page, state orchestration
│   │   └── globals.css  ← CSS reset
│   ├── components/
│   │   ├── GalleryScene.tsx    ← Canvas + 3D scene
│   │   ├── PaintingFrame.tsx   ← individual framed artwork
│   │   ├── Hallway.tsx         ← floor/walls/ceiling geometry
│   │   ├── DetailPanel.tsx     ← slide-in artwork info panel
│   │   ├── HUD.tsx             ← progress bar + header + hints
│   │   ├── Filmstrip.tsx       ← left-side thumbnail strip
│   │   └── LoadingScreen.tsx   ← entrance loading animation
│   ├── hooks/
│   │   └── useScrollDepth.ts   ← scroll → camera Z mapping
│   └── lib/
│       └── paintings.ts        ← artwork metadata array
├── next.config.js
├── tsconfig.json
└── package.json
```

---

_Designed for Alaa Mansour's graphite portrait series — 2026_
