import { Html, Float } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import CareerHeroFallback from './CareerHeroFallback.jsx'
import './CareerHero3D.css'

const pillars = [
  { key: 'resume', label: 'Resume builder', color: '#a64d45', shape: 'document', position: [-2.15, 0.85, 0.2], phase: 0.2, section: 'resume' },
  { key: 'interview', label: 'AI mock interview', color: '#d39a70', shape: 'chat', position: [2.1, 0.55, -0.25], phase: 1.2, section: 'interview' },
  { key: 'test', label: 'Skill assessments', color: '#b87363', shape: 'checklist', position: [1.65, -1.35, 0.4], phase: 2.4, section: 'test' },
  { key: 'mentorship', label: 'Mentorship', color: '#8b433e', shape: 'mentor', position: [-1.7, -1.45, -0.15], phase: 3.1, section: 'mentorship' },
  { key: 'match', label: 'Job matching', color: '#c58468', shape: 'briefcase', position: [0, 1.85, -0.6], phase: 4.2, section: 'match' },
]

function PillarShape({ shape, color }) {
  const material = <meshStandardMaterial color={color} flatShading roughness={0.72} metalness={0.05} />
  if (shape === 'document') return <group rotation={[0, 0, -0.12]}><mesh>{material}<boxGeometry args={[0.85, 1.08, 0.13]} /></mesh><mesh position={[0.1, 0.17, 0.09]}><boxGeometry args={[0.45, 0.045, 0.025]} /><meshBasicMaterial color="#f6eee5" /></mesh><mesh position={[0.04, -0.03, 0.09]}><boxGeometry args={[0.58, 0.045, 0.025]} /><meshBasicMaterial color="#f6eee5" /></mesh><mesh position={[-0.03, -0.23, 0.09]}><boxGeometry args={[0.42, 0.045, 0.025]} /><meshBasicMaterial color="#f6eee5" /></mesh></group>
  if (shape === 'chat') return <group><mesh rotation={[0, 0, 0.12]}>{material}<icosahedronGeometry args={[0.62, 1]} /></mesh><mesh position={[-0.28, -0.48, 0]} rotation={[0, 0, 0.3]}>{material}<coneGeometry args={[0.22, 0.38, 3]} /></mesh></group>
  if (shape === 'checklist') return <group rotation={[0.1, -0.12, 0]}><mesh>{material}<boxGeometry args={[0.95, 0.78, 0.16]} /></mesh><mesh position={[-0.25, 0.16, 0.11]}><boxGeometry args={[0.12, 0.12, 0.035]} /><meshBasicMaterial color="#f6eee5" /></mesh><mesh position={[0.1, 0.16, 0.11]}><boxGeometry args={[0.42, 0.045, 0.035]} /><meshBasicMaterial color="#f6eee5" /></mesh><mesh position={[-0.25, -0.12, 0.11]}><boxGeometry args={[0.12, 0.12, 0.035]} /><meshBasicMaterial color="#f6eee5" /></mesh><mesh position={[0.1, -0.12, 0.11]}><boxGeometry args={[0.5, 0.045, 0.035]} /><meshBasicMaterial color="#f6eee5" /></mesh></group>
  if (shape === 'mentor') return <group><mesh position={[-0.31, 0, 0]}>{material}<sphereGeometry args={[0.3, 12, 8]} /></mesh><mesh position={[0.31, 0.2, 0]}>{material}<sphereGeometry args={[0.3, 12, 8]} /></mesh><mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.045, 0.045, 0.48, 8]} /><meshBasicMaterial color="#f0c5a2" /></mesh></group>
  return <group rotation={[0.08, 0.15, 0]}><mesh>{material}<boxGeometry args={[0.95, 0.62, 0.38]} /></mesh><mesh position={[0, 0.4, 0]}>{material}<torusGeometry args={[0.2, 0.06, 8, 16, Math.PI]} /></mesh><mesh position={[0, 0, 0.21]}><boxGeometry args={[0.28, 0.07, 0.035]} /><meshBasicMaterial color="#f6eee5" /></mesh></group>
}

function Pillar({ item, hovered, setHovered, onSelect, reducedMotion }) {
  const group = useRef()
  useFrame(({ clock }) => {
    if (!group.current) return
    const time = clock.elapsedTime
    group.current.position.y = item.position[1] + (reducedMotion ? 0 : Math.sin(time * 0.72 + item.phase) * 0.08)
    group.current.rotation.y = reducedMotion ? 0 : Math.sin(time * 0.35 + item.phase) * 0.08
  })
  return <Float speed={reducedMotion ? 0 : 1.1} floatIntensity={reducedMotion ? 0 : 0.08} rotationIntensity={0}>
    <group ref={group} position={item.position} scale={hovered ? 1.14 : 1} onPointerOver={(event) => { event.stopPropagation(); setHovered(item.key) }} onPointerOut={() => setHovered(null)} onClick={(event) => { event.stopPropagation(); onSelect(item.section) }}>
      <PillarShape shape={item.shape} color={item.color} />
      {hovered && <Html center distanceFactor={8} position={[0, -0.92, 0]}><button className="pillar-label" onClick={() => onSelect(item.section)}>{item.label}</button></Html>}
    </group>
  </Float>
}

function CameraRig({ reducedMotion }) {
  const { camera, pointer } = useThree()
  const destination = useRef(new THREE.Vector3(0, 0, 5.7))
  const tilt = useRef({ x: 0, y: 0 })
  useEffect(() => {
    if (reducedMotion) return undefined
    const onOrientation = (event) => { tilt.current.x = THREE.MathUtils.clamp((event.gamma || 0) / 45, -1, 1); tilt.current.y = THREE.MathUtils.clamp((event.beta || 0) / 60, -1, 1) }
    window.addEventListener('deviceorientation', onOrientation)
    return () => window.removeEventListener('deviceorientation', onOrientation)
  }, [reducedMotion])
  useFrame(({ clock }) => {
    if (reducedMotion) { camera.position.set(0, 0, 7.4); camera.lookAt(0, 0, 0); return }
    const entrance = THREE.MathUtils.smoothstep(clock.elapsedTime, 0, 2.4)
    const ease = entrance * entrance * (3 - 2 * entrance)
    const targetX = THREE.MathUtils.clamp(pointer.x * 0.22 + tilt.current.x * 0.11, -0.28, 0.28)
    const targetY = THREE.MathUtils.clamp(pointer.y * 0.12 - tilt.current.y * 0.05, -0.18, 0.18)
    destination.current.set(targetX, targetY, THREE.MathUtils.lerp(11.2, 7.4, ease))
    camera.position.lerp(destination.current, 0.045)
    camera.lookAt(targetX * 0.35, targetY * 0.35, 0)
  })
  return null
}

function Cluster({ reducedMotion, onSelect }) {
  const cluster = useRef()
  const [hovered, setHovered] = useState(null)
  useFrame(({ clock }) => {
    if (!cluster.current || reducedMotion || hovered) return
    cluster.current.rotation.y = clock.elapsedTime * 0.075
    cluster.current.rotation.x = Math.sin(clock.elapsedTime * 0.19) * 0.025
  })
  return <group ref={cluster} scale={0.72}>{pillars.map((item) => <Pillar key={item.key} item={item} hovered={hovered === item.key} setHovered={setHovered} onSelect={onSelect} reducedMotion={reducedMotion} />)}<mesh><sphereGeometry args={[0.72, 16, 12]} /><meshStandardMaterial color="#7b3939" roughness={0.45} flatShading /></mesh><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.05, 0.018, 6, 48]} /><meshBasicMaterial color="#c27b62" transparent opacity={0.45} /></mesh></group>
}

export default function CareerHero3D({ onSelect }) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [webglFailed, setWebglFailed] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update(); query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])
  if (webglFailed) return <CareerHeroFallback />
  return <div className={`hero-3d ${reducedMotion ? 'is-static' : ''}`}><Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 9.2], fov: 36 }} fallback={<CareerHeroFallback />} onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', () => setWebglFailed(true), { once: true }) }}><color attach="background" args={['#f7f6f1']} /><ambientLight intensity={1.8} /><directionalLight position={[4, 5, 6]} intensity={2.1} color="#fff5eb" /><Suspense fallback={null}><CameraRig reducedMotion={reducedMotion} /><Cluster reducedMotion={reducedMotion} onSelect={onSelect} /></Suspense></Canvas></div>
}
