import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { LATTICE_CODES } from '../data/lattice.ts'
import {
  ABSORBER_DRAW_M,
  CORE_H_M,
  GRAPHITE_M,
  USP_TRAVEL_M,
  WATER_COLUMN_M,
  cellXZ,
  displacementBump,
  joltShake,
  topEntryPose,
  uspCenter,
} from '../model.ts'

const FUEL = 0
const RR = 2
const AZ = 3
const AR = 4
const LAR = 5
const USP = 6

const OPEN_X = 0.35
const DUMMY = new THREE.Object3D()

interface RodSlot {
  x: number
  z: number
  kind: number
}

function useSlots(): {
  columns: RodSlot[]
  displacer: RodSlot[]
  auto: RodSlot[]
  usp: RodSlot[]
  fuelOpen: RodSlot[]
} {
  return useMemo(() => {
    const columns: RodSlot[] = []
    const displacer: RodSlot[] = []
    const auto: RodSlot[] = []
    const usp: RodSlot[] = []
    const fuelOpen: RodSlot[] = []
    for (const [col, row, kind] of LATTICE_CODES) {
      const [x, z] = cellXZ(col, row)
      const slot = { x, z, kind }
      columns.push(slot)
      if (kind === FUEL && x > OPEN_X) fuelOpen.push(slot)
      if (kind === RR || kind === AZ || kind === LAR) displacer.push(slot)
      else if (kind === AR) auto.push(slot)
      else if (kind === USP) usp.push(slot)
    }
    return { columns, displacer, auto, usp, fuelOpen }
  }, [])
}

function paint(mesh: THREE.InstancedMesh, slots: RodSlot[], colorFor: (kind: number) => THREE.Color) {
  const color = new THREE.Color()
  slots.forEach((slot, index) => {
    color.copy(colorFor(slot.kind))
    mesh.setColorAt(index, color)
  })
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

function writeStatic(mesh: THREE.InstancedMesh, slots: RodSlot[], y: number) {
  const dummy = new THREE.Object3D()
  slots.forEach((slot, index) => {
    dummy.position.set(slot.x, y, slot.z)
    dummy.scale.set(1, 1, 1)
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(index, dummy.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
}

function writeGraphite(mesh: THREE.InstancedMesh, slots: RodSlot[]) {
  const dummy = new THREE.Object3D()
  const color = new THREE.Color()
  slots.forEach((slot, index) => {
    const shade = 0.5 + 0.5 * Math.sin(slot.x * 3.1 + slot.z * 2.4)
    color.setRGB(0.30 + shade * 0.07, 0.285 + shade * 0.05, 0.255 + shade * 0.035)
    dummy.position.set(slot.x, CORE_H_M / 2, slot.z)
    dummy.scale.set(1, 1, 1)
    dummy.rotation.set(0, 0, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(index, dummy.matrix)
    mesh.setColorAt(index, color)
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

function Lattice({
  timeRef,
  sectionedRef,
  hideBlackRef,
}: {
  timeRef: RefObject<number>
  sectionedRef: RefObject<boolean>
  hideBlackRef: RefObject<boolean>
}) {
  const slots = useSlots()
  const graphiteRef = useRef<THREE.InstancedMesh>(null)
  const fuelRef = useRef<THREE.InstancedMesh>(null)
  const waterRef = useRef<THREE.InstancedMesh>(null)
  const gapRef = useRef<THREE.InstancedMesh>(null)
  const graphiteRodRef = useRef<THREE.InstancedMesh>(null)
  const absorberRef = useRef<THREE.InstancedMesh>(null)
  const autoRef = useRef<THREE.InstancedMesh>(null)
  const uspRef = useRef<THREE.InstancedMesh>(null)
  const floorClip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.08), [])
  const waterMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#6f9eb6', roughness: 0.22, metalness: 0.08, clippingPlanes: [floorClip] }),
    [floorClip],
  )
  const rig = useRef<THREE.Group>(null)
  const staticReady = useRef(false)
  const sectionedApplied = useRef<boolean | null>(null)
  const geometries = useMemo(
    () => ({
      block: new THREE.BoxGeometry(0.22, CORE_H_M, 0.22),
      fuel: new THREE.CylinderGeometry(0.034, 0.034, CORE_H_M, 8),
      water: new THREE.CylinderGeometry(0.05, 0.05, WATER_COLUMN_M, 8),
      gap: new THREE.CylinderGeometry(0.045, 0.045, WATER_COLUMN_M, 8),
      graphite: new THREE.CylinderGeometry(0.062, 0.062, GRAPHITE_M, 8),
      absorber: new THREE.CylinderGeometry(0.055, 0.055, ABSORBER_DRAW_M, 8),
      usp: new THREE.CylinderGeometry(0.05, 0.05, USP_TRAVEL_M, 8),
    }),
    [],
  )
  const materials = useMemo(
    () => ({
      block: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, metalness: 0.02 }),
      fuel: new THREE.MeshStandardMaterial({ color: '#c2cbcf', metalness: 0.66, roughness: 0.34 }),
      gap: new THREE.MeshStandardMaterial({ color: '#8eb6c8', roughness: 0.2, metalness: 0.06, clippingPlanes: [floorClip] }),
      graphite: new THREE.MeshStandardMaterial({ color: '#4a453e', roughness: 0.82, metalness: 0.04, clippingPlanes: [floorClip] }),
      absorber: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.72, roughness: 0.3, clippingPlanes: [floorClip] }),
      auto: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.7, roughness: 0.32, clippingPlanes: [floorClip] }),
      usp: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.64, roughness: 0.36, clippingPlanes: [floorClip] }),
      ring: new THREE.MeshStandardMaterial({ color: '#9a4038', metalness: 0.35, roughness: 0.45, side: THREE.DoubleSide }),
      topRing: new THREE.MeshStandardMaterial({ color: '#9aa3ab', metalness: 0.78, roughness: 0.32, side: THREE.DoubleSide }),
      floor: new THREE.MeshStandardMaterial({ color: '#b7b1a6', roughness: 0.96, metalness: 0.02 }),
    }),
    [floorClip],
  )

  useFrame(() => {
    const graphite = graphiteRef.current
    const fuel = fuelRef.current
    const water = waterRef.current
    const gap = gapRef.current
    const graphiteRod = graphiteRodRef.current
    const absorber = absorberRef.current
    const auto = autoRef.current
    const usp = uspRef.current
    if (!graphite || !fuel || !water || !gap || !graphiteRod || !absorber || !auto || !usp) return
    if (!staticReady.current) {
      writeGraphite(graphite, slots.columns)
      writeStatic(fuel, slots.fuelOpen, CORE_H_M / 2)
      writeStatic(water, slots.displacer, WATER_COLUMN_M / 2)
      const colorFor = (kind: number) => {
      if (kind === AZ) return new THREE.Color('#5c3a36')
      if (kind === AR) return new THREE.Color('#2f4a40')
      if (kind === LAR) return new THREE.Color('#314556')
      if (kind === USP) return new THREE.Color('#8d7344')
      return new THREE.Color('#243833')
      }
      paint(absorber, slots.displacer, colorFor)
      paint(auto, slots.auto, colorFor)
      paint(usp, slots.usp, colorFor)
      staticReady.current = true
    }
    const sectioned = sectionedRef.current ?? true
    if (sectionedApplied.current !== sectioned) {
      slots.columns.forEach((slot, index) => {
        const open = sectioned && slot.x > OPEN_X
        DUMMY.position.set(open ? 0 : slot.x, open ? -40 : CORE_H_M / 2, open ? 0 : slot.z)
        DUMMY.scale.set(open ? 0 : 1, open ? 0 : 1, open ? 0 : 1)
        DUMMY.rotation.set(0, 0, 0)
        DUMMY.updateMatrix()
        graphite.setMatrixAt(index, DUMMY.matrix)
      })
      graphite.instanceMatrix.needsUpdate = true
      fuel.visible = sectioned
      sectionedApplied.current = sectioned
    }
    const hideBlack = hideBlackRef.current ?? false
    absorber.visible = !hideBlack
    auto.visible = !hideBlack
    const time = timeRef.current ?? 0
    const pose = topEntryPose(time)
    const bump = displacementBump(time)
    const shake = joltShake(time)
    if (rig.current) {
      rig.current.position.set(shake.x, shake.y, shake.z)
      rig.current.rotation.set(shake.pitch, 0, shake.roll)
    }
    waterMat.color.setRGB(0.36 + 0.4 * bump, 0.55 - 0.18 * bump, 0.64 - 0.26 * bump)
    const place = (mesh: THREE.InstancedMesh, list: RodSlot[], y: number) => {
      list.forEach((slot, index) => {
        DUMMY.position.set(slot.x, y, slot.z)
        DUMMY.scale.set(1, 1, 1)
        DUMMY.rotation.set(0, 0, 0)
        DUMMY.updateMatrix()
        mesh.setMatrixAt(index, DUMMY.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    place(graphiteRod, slots.displacer, pose.graphiteCenter)
    place(gap, slots.displacer, pose.gapCenter)
    place(absorber, slots.displacer, pose.absorberCenter)
    place(auto, slots.auto, pose.absorberCenter)
    place(usp, slots.usp, uspCenter(time))
  })

  return (
    <group ref={rig}>
      <instancedMesh ref={graphiteRef} args={[geometries.block, materials.block, slots.columns.length]} frustumCulled={false} />
      <instancedMesh ref={fuelRef} args={[geometries.fuel, materials.fuel, Math.max(1, slots.fuelOpen.length)]} frustumCulled={false} />
      <instancedMesh ref={waterRef} args={[geometries.water, waterMat, slots.displacer.length]} frustumCulled={false} />
      <instancedMesh ref={gapRef} args={[geometries.gap, materials.gap, slots.displacer.length]} frustumCulled={false} />
      <instancedMesh ref={graphiteRodRef} args={[geometries.graphite, materials.graphite, slots.displacer.length]} frustumCulled={false} />
      <instancedMesh ref={absorberRef} args={[geometries.absorber, materials.absorber, slots.displacer.length]} frustumCulled={false} />
      <instancedMesh ref={autoRef} args={[geometries.absorber, materials.auto, slots.auto.length]} frustumCulled={false} />
      <instancedMesh ref={uspRef} args={[geometries.usp, materials.usp, slots.usp.length]} frustumCulled={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={materials.ring}>
        <ringGeometry args={[5.86, 5.94, 80]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, CORE_H_M + 0.03, 0]} material={materials.topRing}>
        <ringGeometry args={[5.55, 6.45, 96]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} material={materials.floor}>
        <circleGeometry args={[8.2, 64]} />
      </mesh>
    </group>
  )
}

export function CoreView({
  timeRef,
  sectionedRef,
  hideBlackRef,
}: {
  timeRef: RefObject<number>
  sectionedRef: RefObject<boolean>
  hideBlackRef: RefObject<boolean>
}) {
  return (
    <Canvas
      camera={{ position: [13.5, 10.5, 15.5], fov: 32, near: 0.1, far: 200 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, localClippingEnabled: true }}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0, touchAction: 'none' }}
    >
      <color attach="background" args={['#d8d2c6']} />
      <hemisphereLight args={['#f2efe8', '#6d675e', 0.45]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[18, 26, 12]} intensity={1.45} />
      <directionalLight position={[-14, 10, -8]} intensity={0.4} />
      <Lattice timeRef={timeRef} sectionedRef={sectionedRef} hideBlackRef={hideBlackRef} />
      <OrbitControls
        makeDefault
        target={[0, 3.2, 0]}
        enableDamping
        enableRotate
        enablePan
        enableZoom
        zoomSpeed={1.1}
        panSpeed={1.1}
        minDistance={0.4}
        maxDistance={80}
      />
    </Canvas>
  )
}
