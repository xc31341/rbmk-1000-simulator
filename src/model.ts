/**
 * Shared schematic motion for the full rod set.
 * Lengths are the public approximations: core 7 m, pitch 250 mm,
 * graphite displacer about 4.5 m, water columns about 1.25 m,
 * top-entry speed about 0.4 m/s, full travel on the order of 18 s.
 * The reactivity index is not a physical reactivity.
 */

export const SPEED_M_PER_S = 0.4
export const DURATION_S = 18
export const CORE_H_M = 7
export const PITCH_M = 0.25
export const WATER_COLUMN_M = 1.25
export const GRAPHITE_M = 4.5
export const TRAVEL_M = SPEED_M_PER_S * DURATION_S
/**
 * Opening slam, in simulation seconds. The mean travel is still the
 * 0.4 m/s, 18 s reference. This only makes the first motion a jolt.
 */
export const JOLT_S = 0.9
export const JOLT_DROP_M = 1.15
export const DISPLACEMENT_WINDOW_S = JOLT_S
/** Drawn absorber length. Chosen so the schematic travel still covers the core. Not a measurement. */
export const ABSORBER_DRAW_M = TRAVEL_M
/** Published order of magnitude for the shortened bottom rods' travel. */
export const USP_TRAVEL_M = 3.5

const GRAPHITE_BOTTOM_0 = WATER_COLUMN_M
const GRAPHITE_TOP_0 = WATER_COLUMN_M + GRAPHITE_M

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function insertionDepth(t: number): number {
  const time = clamp(t, 0, DURATION_S)
  if (time <= JOLT_S) {
    const u = time / JOLT_S
    return JOLT_DROP_M * (1 - (1 - u) ** 3)
  }
  const rest = (time - JOLT_S) / (DURATION_S - JOLT_S)
  return JOLT_DROP_M + (TRAVEL_M - JOLT_DROP_M) * rest
}

/** Whole-machine shake, in metres and radians. Zero at t = 0, then a short ring. */
export function joltShake(t: number): { x: number; y: number; z: number; roll: number; pitch: number } {
  if (t <= 0) return { x: 0, y: 0, z: 0, roll: 0, pitch: 0 }
  const decay = Math.exp(-t / 0.55)
  return {
    x: 0.45 * decay * Math.sin(t * 34),
    y: -1.15 * decay + 1.35 * decay * Math.sin(t * 40),
    z: 0.38 * decay * Math.cos(t * 31),
    roll: 0.22 * decay * Math.sin(t * 27),
    pitch: 0.16 * decay * Math.cos(t * 29),
  }
}

export function cellXZ(col: number, row: number): [number, number] {
  return [(col - 27.5) * PITCH_M, (row - 27.5) * PITCH_M]
}

export interface TopEntryPose {
  depth: number
  graphiteBottom: number
  graphiteTop: number
  graphiteCenter: number
  absorberBottom: number
  absorberCenter: number
  gapCenter: number
}

export function topEntryPose(t: number): TopEntryPose {
  const depth = insertionDepth(t)
  const graphiteBottom = GRAPHITE_BOTTOM_0 - depth
  const graphiteTop = GRAPHITE_TOP_0 - depth
  return {
    depth,
    graphiteBottom,
    graphiteTop,
    graphiteCenter: (graphiteBottom + graphiteTop) / 2,
    absorberBottom: CORE_H_M - depth,
    absorberCenter: CORE_H_M - depth + ABSORBER_DRAW_M / 2,
    gapCenter: graphiteTop + WATER_COLUMN_M / 2,
  }
}

export function uspCenter(t: number): number {
  const risen = Math.min(insertionDepth(t), USP_TRAVEL_M)
  return -USP_TRAVEL_M / 2 + risen
}

/** Sharp positive spike while the tip plunges, then gone. */
export function displacementBump(t: number): number {
  const time = clamp(t, 0, DURATION_S)
  if (time <= 0 || time >= JOLT_S) return 0
  const u = time / JOLT_S
  return Math.sin(u * Math.PI) ** 2
}

export function absorberTerm(t: number): number {
  const depth = insertionDepth(t)
  return -clamp(depth, 0, CORE_H_M) / CORE_H_M
}

/** Arbitrary units. The same shape for every displacer rod, because they move together. */
export function illustrativeReactivity(t: number): number {
  return displacementBump(t) + absorberTerm(t)
}

export type Phase = 'ready' | 'displacing' | 'inserting' | 'covered'

export function phaseAt(t: number): Phase {
  if (t <= 0.001) return 'ready'
  if (t < DISPLACEMENT_WINDOW_S) return 'displacing'
  if (insertionDepth(t) >= CORE_H_M) return 'covered'
  return 'inserting'
}
