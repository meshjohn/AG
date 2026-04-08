// ─── Painting Data Types & Collection ───────────────────────────────────────
// This module defines the shape of each artwork and exports the full list
// of paintings displayed in the gallery.

/**
 * Represents a single artwork in the gallery.
 * Each painting is placed on either the left or right wall of the hallway.
 */
export interface Painting {
  /** Unique numeric identifier used for URL state (`?id=`) and ordering. */
  id: number
  /** Display name shown on the title plate below the frame and in the detail panel. */
  title: string
  /** Art medium used, e.g. "Graphite on paper". */
  medium: string
  /** Year the artwork was created. */
  year: string
  /** Short prose description shown in the detail panel. */
  description: string
  /** Public path to the painting image (served from /public/images/). */
  src: string
  /** Which wall the painting hangs on — alternates to create a corridor feel. */
  wall: 'left' | 'right'
}

/**
 * The full ordered collection of artworks in the gallery.
 * The array index determines Z-position in the hallway:
 *   z = -(index * FRAME_SPACING + FRAME_SPACING)
 * Paintings alternate walls to draw the viewer's gaze across the corridor.
 */
export const paintings: Painting[] = [
  {
    id: 1,
    title: 'Two Worlds Apart',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'Two faces meet at a vanishing point — a study in proximity and distance, rendered in fine pencil strokes.',
    src: '/images/painting-01.jpg',
    wall: 'left',   // hangs on the left wall
  },
  {
    id: 2,
    title: 'Interlude',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'A close study of overlapping gazes, where lashes become landscapes and pupils hold entire skies.',
    src: '/images/painting-02.jpg',
    wall: 'right',  // hangs on the right wall
  },
  {
    id: 3,
    title: 'Portrait I',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'A three-quarter view — the subject looks away, carrying something unspoken in the set of her jaw.',
    src: '/images/painting-03.jpg',
    wall: 'left',
  },
  {
    id: 4,
    title: 'Portrait II',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'Direct, unflinching. The eyes carry the weight of the composition and refuse to let you go.',
    src: '/images/painting-04.jpg',
    wall: 'right',
  },
  {
    id: 5,
    title: 'Portrait III',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'A braid falls forward — the texture of woven hair rendered with extraordinary patience.',
    src: '/images/painting-05.jpg',
    wall: 'left',
  },
  {
    id: 6,
    title: 'Reverie',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'Waves of hair frame a face caught in a private moment, softened by the artist\'s delicate hand.',
    src: '/images/painting-06.jpg',
    wall: 'right',
  },
  {
    id: 7,
    title: 'Drift',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'Long straight hair cascades like a waterfall. The figure glances back — an invitation, or a farewell.',
    src: '/images/painting-07.jpg',
    wall: 'left',
  },
  {
    id: 8,
    title: 'Solitude',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'A figure stands alone, back turned, a glass raised — a quiet ceremony performed for no one.',
    src: '/images/painting-08.jpg',
    wall: 'right',
  },
  {
    id: 9,
    title: 'Profile I',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'Side profile with hoop earring catching light. The neck, exposed and elegant, tells its own story.',
    src: '/images/painting-09.jpg',
    wall: 'left',
  },
  {
    id: 10,
    title: 'Profile II',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'A three-quarter turn, earring present again — a signature detail that threads these works together.',
    src: '/images/painting-10.jpg',
    wall: 'right',
  },
]
