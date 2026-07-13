/**
 * Motion curves for the luxury design register (PRD §15/§25) — quality, not
 * decoration. Cubic-bezier arrays are for Motion (`transition: { ease }`);
 * `lenis` is a plain easing function since the scroll library takes one.
 */
export const EASING = {
  /** Entrances — confident deceleration, no bounce. */
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Exits — quick, understated. */
  in: [0.7, 0, 0.84, 0] as [number, number, number, number],
  /** Transitions that start and end at rest (page/route changes). */
  inOut: [0.83, 0, 0.17, 1] as [number, number, number, number],
  /** Lenis smooth-scroll easing (expo-out). */
  lenis: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
} as const;

export const DURATION = {
  fast: 0.2,
  base: 0.3,
  slow: 0.4,
  slower: 0.6,
} as const;
