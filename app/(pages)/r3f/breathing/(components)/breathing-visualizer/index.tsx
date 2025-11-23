'use client'

import type { FC } from 'react'

import { BreathingCanvas } from '../breathing-canvas'
import styles from './breathing-visualizer.module.css'
import type { BreathingVisualizerWebGLProps } from './webgl'
import { BreathingVisualizerWebGL } from './webgl'

export type BreathingVisualizerProps = BreathingVisualizerWebGLProps

export const BreathingVisualizer: FC<BreathingVisualizerProps> = ({
  phase,
  phaseProgress,
  cycleProgress,
  isPlaying,
}) => {
  const bloomIntensity = isPlaying ? 2 : 1

  return (
    <div className={styles.container} data-testid="breathing-visualizer">
      <BreathingCanvas bloomIntensity={bloomIntensity}>
        <BreathingVisualizerWebGL
          phase={phase}
          phaseProgress={phaseProgress}
          cycleProgress={cycleProgress}
          isPlaying={isPlaying}
        />
      </BreathingCanvas>
      <div className={styles.ring} />
      <div className={styles.ringOuter} />
    </div>
  )
}
