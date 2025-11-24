import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BREATHING_PATTERNS } from './breathing-patterns'
import {
  type BreathPhase,
  useAdjustedPhases,
  useBreathingStore,
  useCurrentPhase,
  useCurrentTime,
  useIsPlaying,
  useTotalCycleTime,
} from './breathing-store'

const resetStore = () => {
  const initial = useBreathingStore.getInitialState()
  act(() => {
    useBreathingStore.setState(initial, true)
  })
}

describe('useBreathingStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStore()
  })

  afterEach(() => {
    resetStore()
  })

  describe('initial state', () => {
    it('should initialize with ready phase and paused playback', () => {
      const { result } = renderHook(() => useBreathingStore())
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.currentPhase).toBe<'ready'>('ready')
      expect(result.current.cycleCount).toBe(1)
      expect(result.current.selectedPattern).toBe('box')
    })
  })

  describe('playback controls', () => {
    it('should set playing state and start with inhale phase on play', () => {
      const { result } = renderHook(() => useBreathingStore())

      act(() => {
        result.current.play()
      })

      expect(result.current.isPlaying).toBe(true)
      expect(result.current.currentPhase).toBe<'inhale'>('inhale')
    })

    it('should pause playback', () => {
      const { result } = renderHook(() => useBreathingStore())

      act(() => {
        result.current.play()
        result.current.pause()
      })

      expect(result.current.isPlaying).toBe(false)
      expect(result.current.currentPhase).toBe<'inhale' | BreathPhase>('inhale')
    })

    it('should reset state and counters', () => {
      const { result } = renderHook(() => useBreathingStore())

      act(() => {
        result.current.play()
        result.current.setCurrentTime(1200)
        result.current.incrementCycle()
        result.current.updateSessionTime(5000)
        result.current.reset()
      })

      expect(result.current.isPlaying).toBe(false)
      expect(result.current.currentPhase).toBe<'ready'>('ready')
      expect(result.current.currentTime).toBe(0)
      expect(result.current.cycleCount).toBe(1)
      expect(result.current.sessionTime).toBe(0)
      expect(result.current.cycleSpeedAdjustment).toBe(0)
    })
  })

  describe('timing updates', () => {
    it('should update current phase and time', () => {
      const { result } = renderHook(() => useBreathingStore())

      act(() => {
        result.current.setCurrentPhase('exhale')
        result.current.setCurrentTime(2500)
      })

      expect(result.current.currentPhase).toBe<'exhale'>('exhale')
      expect(result.current.currentTime).toBe(2500)
    })

    it('should increment cycle counter and accumulate session time', () => {
      const { result } = renderHook(() => useBreathingStore())

      act(() => {
        result.current.incrementCycle()
        result.current.incrementCycle()
        result.current.updateSessionTime(750)
        result.current.updateSessionTime(1250)
      })

      expect(result.current.cycleCount).toBe(3)
      expect(result.current.sessionTime).toBe(2000)
    })
  })

  describe('pattern selection and drafts', () => {
    it('should switch to selected preset pattern and update drafts', () => {
      const { result } = renderHook(() => useBreathingStore())

      act(() => {
        result.current.selectPattern('4-7-8')
      })

      const preset = BREATHING_PATTERNS['4-7-8']
      expect(result.current.selectedPattern).toBe('4-7-8')
      expect(result.current.customPattern).toBeNull()
      expect(result.current.draftPhases).toEqual(preset.phases)
      expect(result.current.draftMethods).toEqual(preset.methods)
      expect(result.current.settingsSaved).toBe(true)
    })

    it('should modify draft phases and methods without saving', () => {
      const { result } = renderHook(() => useBreathingStore())

      act(() => {
        result.current.updateDraftPhase('inhale', 5000)
        result.current.updateDraftMethod('exhale', 'mouth')
      })

      expect(result.current.draftPhases.inhale).toBe(5000)
      expect(result.current.draftMethods.exhale).toBe('mouth')
      expect(result.current.settingsSaved).toBe(false)
    })

    it('should save custom settings and persist to storage', () => {
      const { result } = renderHook(() => useBreathingStore())

      act(() => {
        result.current.updateDraftPhase('inhale', 6500)
        result.current.updateDraftPhase('exhale', 7200)
        result.current.saveSettings()
      })

      expect(result.current.selectedPattern).toBe('custom')
      expect(result.current.customPattern?.phases.inhale).toBe(6500)
      expect(result.current.settingsSaved).toBe(true)

      const stored = localStorage.getItem('breathing-storage')
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(String(stored)) as {
        state: { customPattern: { phases: { exhale: number } } }
      }
      expect(parsed.state.customPattern.phases.exhale).toBe(7200)
    })
  })

  describe('cycle adjustment', () => {
    it('should adjust total cycle time via speed adjustment within limits', () => {
      const { result } = renderHook(() => useBreathingStore())
      const base = result.current.totalCycleTime

      act(() => {
        result.current.adjustCycleSpeed(500)
      })

      expect(result.current.cycleSpeedAdjustment).toBe(500)
      expect(result.current.totalCycleTime).toBe(base + 500)

      act(() => {
        result.current.adjustCycleSpeed(-2000)
      })

      expect(result.current.totalCycleTime).toBeGreaterThan(0)
    })

    it('should adjust individual phases, clamping between 0 and 10000 ms', () => {
      const { result } = renderHook(() => useBreathingStore())

      act(() => {
        result.current.adjustPhase('inhale', 700)
        result.current.adjustPhase('exhale', -5000)
        result.current.adjustPhase('holdOut', 20000)
      })

      expect(result.current.draftPhases.inhale).toBe(4700)
      expect(result.current.draftPhases.exhale).toBe(0)
      expect(result.current.draftPhases.holdOut).toBe(10000)
      expect(result.current.selectedPattern).toBe('custom')
      expect(result.current.settingsSaved).toBe(false)
    })
  })

  describe('derived selectors', () => {
    it('should compute total cycle time including adjustments', () => {
      const { result } = renderHook(() => useTotalCycleTime())
      expect(result.current).toBe(16000)

      act(() => {
        useBreathingStore.getState().adjustCycleSpeed(1000)
      })

      expect(result.current).toBe(17000)
    })

    it('should provide adjusted phase durations in proportion', () => {
      const { result } = renderHook(() => useAdjustedPhases())

      act(() => {
        useBreathingStore.getState().adjustCycleSpeed(4000)
      })

      expect(result.current.inhale).toBeCloseTo(5000)
      expect(result.current.exhale).toBeCloseTo(5000)
    })

    it('should expose optimized selectors for playing and phase state', () => {
      const isPlayingHook = renderHook(() => useIsPlaying())
      const phaseHook = renderHook(() => useCurrentPhase())
      const timeHook = renderHook(() => useCurrentTime())

      act(() => {
        useBreathingStore.getState().play()
        useBreathingStore.getState().setCurrentTime(1234)
      })

      expect(isPlayingHook.result.current).toBe(true)
      expect(phaseHook.result.current).toBe<'inhale'>('inhale')
      expect(timeHook.result.current).toBe(1234)
    })
  })
})
