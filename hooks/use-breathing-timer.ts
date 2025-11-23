'use client'

import { useEffect, useEffectEvent, useRef } from 'react'
import type { BreathingPhaseKey } from '~/libs/breathing-patterns'
import {
  type BreathPhase,
  useAdjustedPhases,
  useBreathingStore,
  useCurrentTime,
  useIsPlaying,
  useTotalCycleTime,
} from '~/libs/breathing-store'

type PhaseInfo = {
  phase: BreathPhase
  elapsed: number
  duration: number
}

const PHASE_SEQUENCE: Array<{ key: BreathingPhaseKey; phase: BreathPhase }> = [
  { key: 'inhale', phase: 'inhale' },
  { key: 'holdIn', phase: 'hold-in' },
  { key: 'exhale', phase: 'exhale' },
  { key: 'holdOut', phase: 'hold-out' },
]

const clampTime = (value: number, total: number) => {
  if (total <= 0) return 0
  if (value < 0) return 0
  if (value >= total) return value % total
  return value
}

const getPhaseInfo = (
  time: number,
  phases: Record<BreathingPhaseKey, number>
): PhaseInfo => {
  let cursor = time

  for (const { key, phase } of PHASE_SEQUENCE) {
    const duration = phases[key]

    if (duration <= 0) {
      continue
    }

    if (cursor < duration) {
      return {
        phase,
        elapsed: cursor,
        duration,
      }
    }

    cursor -= duration
  }

  const inhaleDuration = phases.inhale > 0 ? phases.inhale : 1

  return {
    phase: 'inhale',
    elapsed: 0,
    duration: inhaleDuration,
  }
}

export type FrameDriver = {
  start: (callback: FrameRequestCallback) => () => void
}

type BreathingTimerOptions = {
  driver?: FrameDriver
}

const defaultDriver: FrameDriver = {
  start(callback) {
    let handle: number
    const loop = (timestamp: number) => {
      callback(timestamp)
      handle = requestAnimationFrame(loop)
    }
    handle = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(handle)
  },
}

export function useBreathingTimer(options?: BreathingTimerOptions) {
  const driver = options?.driver ?? defaultDriver

  const isPlaying = useIsPlaying()
  const adjustedPhases = useAdjustedPhases()
  const totalCycleTime = useTotalCycleTime()
  const currentTime = useCurrentTime()

  const storeRef = useRef(useBreathingStore.getState())
  const timeRef = useRef(currentTime)
  const totalRef = useRef(totalCycleTime)
  const phasesRef = useRef(adjustedPhases)
  const lastTimestampRef = useRef<number | null>(null)
  const stopRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const unsubscribe = useBreathingStore.subscribe((state) => {
      storeRef.current = state
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    timeRef.current = currentTime
  }, [currentTime])

  useEffect(() => {
    totalRef.current = totalCycleTime
    timeRef.current = clampTime(timeRef.current, totalCycleTime)
  }, [totalCycleTime])

  useEffect(() => {
    phasesRef.current = adjustedPhases
  }, [adjustedPhases])

  const tick = useEffectEvent((timestamp: number) => {
    const store = storeRef.current
    if (!store.isPlaying) {
      lastTimestampRef.current = null
      return
    }

    if (lastTimestampRef.current === null) {
      lastTimestampRef.current = timestamp
      return
    }

    const difference = timestamp - lastTimestampRef.current
    const delta = difference > 0 ? difference : 0
    lastTimestampRef.current = timestamp

    const total = totalRef.current
    if (total <= 0) {
      return
    }

    timeRef.current += delta

    let completedCycles = 0
    while (timeRef.current >= total) {
      timeRef.current -= total
      completedCycles += 1
    }

    if (completedCycles > 0) {
      for (let index = 0; index < completedCycles; index += 1) {
        store.incrementCycle()
      }
      store.setCurrentPhase('inhale')
    }

    store.updateSessionTime(delta)
    store.setCurrentTime(timeRef.current)

    const { phase } = getPhaseInfo(timeRef.current, phasesRef.current)
    if (store.currentPhase !== phase) {
      store.setCurrentPhase(phase)
    }
  })

  useEffect(() => {
    if (!isPlaying) {
      if (stopRef.current) {
        stopRef.current()
      }
      stopRef.current = null
      lastTimestampRef.current = null
      return
    }

    lastTimestampRef.current = null
    const stop = driver.start(tick)
    stopRef.current = stop

    return () => {
      stop()
      stopRef.current = null
      lastTimestampRef.current = null
    }
  }, [driver, isPlaying, tick])

  const phaseInfo = getPhaseInfo(currentTime, adjustedPhases)

  const cycleProgress =
    totalCycleTime <= 0 ? 0 : Math.min(1, currentTime / totalCycleTime)

  const phaseProgress =
    phaseInfo.duration <= 0
      ? 0
      : Math.min(1, phaseInfo.elapsed / phaseInfo.duration)

  return {
    phase: phaseInfo.phase,
    timeInCycle: currentTime,
    cycleProgress,
    phaseProgress,
    phaseElapsed: phaseInfo.elapsed,
    phaseDuration: phaseInfo.duration,
    phaseRemaining: Math.max(0, phaseInfo.duration - phaseInfo.elapsed),
    isPlaying,
  }
}
