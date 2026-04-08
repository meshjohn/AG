// ─── Gallery Layout Constants ───────────────────────────────────────────────
// These values define the physical dimensions of the 3D hallway.
// All units are Three.js world units (metres).

/** Distance between each painting frame along the Z-axis (corridor depth). */
export const FRAME_SPACING = 7.5

/** Total width of the hallway (left wall to right wall). */
export const HALL_WIDTH = 7

/** Total height of the hallway (floor to ceiling). */
export const HALL_HEIGHT = 4.5

/**
 * X-coordinate of each gallery wall surface.
 * Paintings are placed flush against this X position on their respective sides.
 * Calculated so frames sit just inside the wall edges with a small inset.
 */
export const WALL_X = HALL_WIDTH / 2 - 0.18
