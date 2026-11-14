import { LATTICE_CODES, LATTICE_COUNTS } from './data/lattice.ts'
import {
  CORE_H_M,
  DURATION_S,
  GRAPHITE_M,
  JOLT_DROP_M,
  JOLT_S,
  PITCH_M,
  SPEED_M_PER_S,
  TRAVEL_M,
  USP_TRAVEL_M,
  WATER_COLUMN_M,
  cellXZ,
  illustrativeReactivity,
  joltShake,
  topEntryPose,
  uspCenter,
} from './model.ts'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

const rods =
  LATTICE_COUNTS.RR + LATTICE_COUNTS.AZ + LATTICE_COUNTS.AR + LATTICE_COUNTS.LAR + LATTICE_COUNTS.USP
const columns = LATTICE_COUNTS.fuel + LATTICE_COUNTS.refl + rods
assert(LATTICE_COUNTS.fuel === 1661, 'fuel channels')
assert(columns === 2488, 'graphite columns')
assert(LATTICE_COUNTS.USP === 24, 'USP')
assert(LATTICE_COUNTS.AR === 12, 'AR')
assert(LATTICE_COUNTS.LAR === 12, 'LAR')
assert(LATTICE_CODES.length === columns, 'lattice rows')
assert(PITCH_M === 0.25, 'pitch')

let maxRadius = 0
for (const [col, row] of LATTICE_CODES) {
  const [x, z] = cellXZ(col, row)
  maxRadius = Math.max(maxRadius, Math.hypot(x, z))
}
assert(maxRadius < 7.2 && maxRadius > 6.5, 'stack radius about 7 m')

const withdrawn = topEntryPose(0)
assert(Math.abs(withdrawn.graphiteBottom - WATER_COLUMN_M) < 1e-9, 'lower water at rest')
assert(Math.abs(withdrawn.graphiteTop - withdrawn.graphiteBottom - GRAPHITE_M) < 1e-9, 'displacer length')
assert(Math.abs(withdrawn.absorberBottom - CORE_H_M) < 1e-9, 'absorber above the core')

const slam = topEntryPose(JOLT_S * 0.5)
assert(slam.depth > SPEED_M_PER_S * JOLT_S * 2, 'opening drop is much faster than 0.4 m/s')
assert(slam.graphiteBottom < WATER_COLUMN_M && slam.graphiteBottom > 0, 'graphite is in the lower water')
assert(slam.absorberBottom > WATER_COLUMN_M + 4, 'absorber still above the lower column')
assert(Math.abs(topEntryPose(JOLT_S).depth - JOLT_DROP_M) < 1e-9, 'jolt ends at the slam depth')
assert(topEntryPose(JOLT_S).depth < topEntryPose(8).depth, 'travel continues after the jolt')
assert(Math.abs(topEntryPose(DURATION_S).depth - TRAVEL_M) < 1e-6, 'full travel still finishes')
assert(illustrativeReactivity(JOLT_S * 0.5) > 0.7, 'the surge spike is positive')
assert(illustrativeReactivity(DURATION_S) < -0.99, 'shared index ends negative')
const still = joltShake(0)
assert(still.x === 0 && still.y === 0 && still.roll === 0, 'no shake before the start')
const hit = joltShake(0.04)
assert(Math.hypot(hit.x, hit.y, hit.z) > 0.05, 'the machine kicks as soon as AZ-5 starts')
assert(Math.abs(TRAVEL_M - SPEED_M_PER_S * DURATION_S) < 1e-9, 'travel product')
assert(Math.abs(uspCenter(0) + USP_TRAVEL_M / 2) < 1e-9, 'USP starts below the core')
assert(uspCenter(DURATION_S) > 0, 'USP has entered the core')

console.log('model invariants ok')
