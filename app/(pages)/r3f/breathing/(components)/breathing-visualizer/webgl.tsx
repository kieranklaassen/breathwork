'use client'

import { useFrame } from '@react-three/fiber'
import type { FC } from 'react'
import { useRef } from 'react'
import type { Mesh } from 'three'
import { Color } from 'three'

import type { BreathPhase } from '~/libs/breathing-store'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export const MIN_SCALE = 0.6
export const MAX_SCALE = 1.0

type PhaseStyle = {
  color: Color
  emissive: Color
  emissiveIntensity: number
  scale: (progress: number) => number
}

const SAKURA = new Color('#f8b4c4')
const MINT = new Color('#a8d5ba')
const LAVENDER = new Color('#c9b8e0')
const SKY = new Color('#8ecae6')
const BASE = new Color('#1a1f2e')

export const PHASE_STYLES: Record<BreathPhase, PhaseStyle> = {
  ready: {
    color: SAKURA.clone().lerp(BASE, 0.5),
    emissive: SAKURA.clone(),
    emissiveIntensity: 0.3,
    scale: () => MIN_SCALE,
  },
  inhale: {
    color: SAKURA.clone(),
    emissive: SAKURA.clone(),
    emissiveIntensity: 0.8,
    scale: (progress: number) => {
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - (-2 * progress + 2) ** 2 / 2
      return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * clamp01(eased)
    },
  },
  'hold-in': {
    color: MINT.clone(),
    emissive: MINT.clone(),
    emissiveIntensity: 0.6,
    scale: () => MAX_SCALE,
  },
  exhale: {
    color: LAVENDER.clone(),
    emissive: LAVENDER.clone(),
    emissiveIntensity: 0.7,
    scale: (progress: number) => {
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - (-2 * progress + 2) ** 2 / 2
      return MAX_SCALE - (MAX_SCALE - MIN_SCALE) * clamp01(eased)
    },
  },
  'hold-out': {
    color: SKY.clone(),
    emissive: SKY.clone(),
    emissiveIntensity: 0.4,
    scale: () => MIN_SCALE,
  },
}

export type BreathingVisualizerWebGLProps = {
  phase: BreathPhase
  phaseProgress: number
  cycleProgress: number
  isPlaying: boolean
}

export const BreathingVisualizerWebGL: FC<BreathingVisualizerWebGLProps> = ({
  phase,
  phaseProgress,
  cycleProgress,
  isPlaying,
}) => {
  const meshRef = useRef<Mesh>(null)
  const innerMeshRef = useRef<Mesh>(null)
  const glowRef = useRef<Mesh>(null)

  const style = PHASE_STYLES[phase] ?? PHASE_STYLES.ready
  const targetScale = style.scale(phaseProgress)
  const rotationY = isPlaying ? clamp01(cycleProgress) * Math.PI * 2 : 0

  useFrame((_, delta) => {
    if (meshRef.current) {
      const s = meshRef.current.scale.x
      const newScale = s + (targetScale - s) * Math.min(1, delta * 4)
      meshRef.current.scale.setScalar(newScale)
      meshRef.current.rotation.y += delta * 0.2
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.1
    }
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y -= delta * 0.3
      innerMeshRef.current.rotation.z = Math.cos(Date.now() * 0.0008) * 0.15
    }
    if (glowRef.current) {
      const glowScale = targetScale * 1.3
      const s = glowRef.current.scale.x
      glowRef.current.scale.setScalar(
        s + (glowScale - s) * Math.min(1, delta * 3)
      )
      glowRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <group rotation={[0, rotationY, 0]}>
      {/* Ambient glow */}
      <ambientLight intensity={0.4} color="#ffffff" />

      {/* Main colored light */}
      <pointLight position={[0, 3, 3]} intensity={1.5} color={style.color} />
      <pointLight position={[-2, -1, 2]} intensity={0.8} color={SAKURA} />
      <pointLight position={[2, -1, -2]} intensity={0.5} color={LAVENDER} />

      {/* Outer glow sphere */}
      <mesh
        ref={glowRef}
        scale={[MIN_SCALE * 1.3, MIN_SCALE * 1.3, MIN_SCALE * 1.3]}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={style.emissive} transparent opacity={0.1} />
      </mesh>

      {/* Main breathing sphere */}
      <mesh
        ref={meshRef}
        name="breathing-sphere"
        scale={[MIN_SCALE, MIN_SCALE, MIN_SCALE]}
        castShadow
        receiveShadow
      >
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial
          color={style.color}
          emissive={style.emissive}
          emissiveIntensity={style.emissiveIntensity}
          roughness={0.2}
          metalness={0.3}
          envMapIntensity={1}
        />
      </mesh>

      {/* Inner core sphere */}
      <mesh
        ref={innerMeshRef}
        scale={[MIN_SCALE * 0.6, MIN_SCALE * 0.6, MIN_SCALE * 0.6]}
      >
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color={style.emissive}
          emissive={style.emissive}
          emissiveIntensity={1.2}
          roughness={0.1}
          metalness={0.5}
          wireframe
        />
      </mesh>

      {/* Particle ring effect */}
      {isPlaying && (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh scale={[targetScale * 1.5, targetScale * 1.5, 0.02]}>
            <torusGeometry args={[1, 0.02, 8, 64]} />
            <meshBasicMaterial
              color={style.emissive}
              transparent
              opacity={0.3 * phaseProgress}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
