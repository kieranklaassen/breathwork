'use client'

import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import type { FC, PropsWithChildren } from 'react'

import styles from './breathing-canvas.module.css'

type BreathingCanvasProps = PropsWithChildren<{
  bloomIntensity?: number
}>

export const BreathingCanvas: FC<BreathingCanvasProps> = ({
  children,
  bloomIntensity = 1.5,
}) => {
  return (
    <div className={styles.container}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0a0d14']} />
        <fog attach="fog" args={['#0a0d14', 3, 8]} />

        {children}

        <EffectComposer>
          <Bloom
            intensity={bloomIntensity}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
