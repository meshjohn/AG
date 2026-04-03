export interface Painting {
  id: number
  title: string
  medium: string
  year: string
  description: string
  src: string
  wall: 'left' | 'right'
}

export const paintings: Painting[] = [
  {
    id: 1,
    title: 'Two Worlds Apart',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'Two faces meet at a vanishing point — a study in proximity and distance, rendered in fine pencil strokes.',
    src: '/images/painting-01.jpg',
    wall: 'left',
  },
  {
    id: 2,
    title: 'Interlude',
    medium: 'Graphite on paper',
    year: '2026',
    description: 'A close study of overlapping gazes, where lashes become landscapes and pupils hold entire skies.',
    src: '/images/painting-02.jpg',
    wall: 'right',
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
