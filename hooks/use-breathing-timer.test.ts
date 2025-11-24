import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useBreathingStore } from '~/libs/breathing-store'

import { useBreathingTimer } from './use-breathing-timer'

declare const resetTime: () => void

const createTestDriver = () => {
  let now = 0
  let callback: FrameRequestCallback | null = null
  let running = false

  const driver = {
    start: vi.fn<(cb: FrameRequestCallback) => () => void>((cb) => {
      callback = cb
      running = true
      callback(now)
      return () => {
        running = false
        callback = null
      }
    }),
  }

  const step = (ms: number) => {
    now += ms
    if (running && callback) {
      callback(now)
    }
  }

  const flush = () => {
    if (running && callback) {
      callback(now)
    }
  }

  const reset = () => {
    now = 0
    callback = null
    running = false
  }

  return {
    driver,
    step,
    flush,
    reset,
  }
}

describe('useBreathingTimer', () => {
  let scheduler: ReturnType<typeof createTestDriver>

  beforeEach(() => {
    scheduler = createTestDriver()
    resetTime()
    scheduler.reset()
    act(() => {
      const initial = useBreathingStore.getInitialState()
      useBreathingStore.setState(initial, true)
    })
  })

  const renderTimer = () =>
    renderHook(() => useBreathingTimer({ driver: scheduler.driver }))

  const startPlayback = () => {
    act(() => {
      useBreathingStore.getState().play()
      scheduler.flush()
    })
  }

  const advance = (ms: number) => {
    act(() => {
      scheduler.step(ms)
    })
  }

  it('should calculate current phase based on elapsed time', () => {
    const { result } = renderTimer()

    startPlayback()

    expect(result.current.phase).toBe('inhale')

    advance(4000)
    expect(result.current.phase).toBe('hold-in')
    expect(useBreathingStore.getState().currentTime).toBeCloseTo(4000)

    advance(4000)
    expect(useBreathingStore.getState().currentTime).toBeCloseTo(8000)
    expect(result.current.phase).toBe('exhale')

    advance(4000)
    expect(result.current.phase).toBe('hold-out')
  })

  it('should increment cycle count when completing a cycle', () => {
    renderTimer()

    startPlayback()

    advance(16000)

    expect(useBreathingStore.getState().cycleCount).toBe(2)
    expect(useBreathingStore.getState().currentPhase).toBe('inhale')
    expect(useBreathingStore.getState().currentTime).toBeLessThan(1)
  })

  it('should maintain position when adjusting cycle speed', () => {
    const { result } = renderTimer()

    startPlayback()

    advance(8000)

    expect(result.current.phase).toBe('exhale')
    expect(useBreathingStore.getState().currentTime).toBeCloseTo(8000)
    const beforeTime = useBreathingStore.getState().currentTime

    act(() => {
      useBreathingStore.getState().adjustCycleSpeed(4000)
    })

    expect(useBreathingStore.getState().totalCycleTime).toBe(20000)
    expect(useBreathingStore.getState().currentTime).toBeCloseTo(beforeTime)
    expect(result.current.phase).toBe('hold-in')
    expect(result.current.cycleProgress).toBeCloseTo(beforeTime / 20000)
  })

  it('should skip zero-duration phases when determining phase', () => {
    const { result } = renderTimer()

    act(() => {
      const store = useBreathingStore.getState()
      store.updateDraftPhase('holdIn', 0)
      store.updateDraftPhase('holdOut', 0)
      store.saveSettings()
    })

    startPlayback()

    advance(4000)
    expect(result.current.phase).toBe('exhale')

    advance(4000)
    expect(result.current.phase).toBe('inhale')
  })

  it('should clamp current time when cycle duration shrinks', () => {
    const { result } = renderTimer()

    startPlayback()
    advance(6000)

    expect(useBreathingStore.getState().currentTime).toBeCloseTo(6000)

    act(() => {
      useBreathingStore.getState().adjustCycleSpeed(-20000)
    })

    act(() => {
      scheduler.flush()
    })

    expect(useBreathingStore.getState().totalCycleTime).toBe(500)
    expect(useBreathingStore.getState().currentTime).toBeLessThan(500)
    expect(result.current.phase).toBe('inhale')
  })

  it('should stop the driver when playback pauses', () => {
    const schedulerWithSpy = createTestDriver()
    const baseStart = schedulerWithSpy.driver.start.getMockImplementation()
    const stopSpy = vi.fn()

    schedulerWithSpy.driver.start.mockImplementation((cb) => {
      const cleanup = baseStart?.(cb)
      return () => {
        stopSpy()
        cleanup?.()
      }
    })

    scheduler = schedulerWithSpy

    const { result } = renderHook(() =>
      useBreathingTimer({ driver: scheduler.driver })
    )

    startPlayback()

    act(() => {
      useBreathingStore.getState().pause()
    })

    act(() => {
      scheduler.flush()
    })

    expect(stopSpy).toHaveBeenCalled()
    expect(result.current.isPlaying).toBe(false)
  })

  it('should ignore non-monotonic frame timestamps', () => {
    renderTimer()

    startPlayback()
    advance(1000)

    const before = useBreathingStore.getState().currentTime

    act(() => {
      scheduler.step(-500)
    })

    expect(useBreathingStore.getState().currentTime).toBeCloseTo(before)
  })

  it('should ignore negative deltas from manual driver frames', () => {
    let frame: FrameRequestCallback | undefined
    const driver = {
      start: vi.fn<(cb: FrameRequestCallback) => () => void>((cb) => {
        frame = cb
        return vi.fn()
      }),
    }

    renderHook(() => useBreathingTimer({ driver }))

    act(() => {
      useBreathingStore.getState().play()
    })

    act(() => {
      frame?.(1000)
    })

    const before = useBreathingStore.getState().currentTime

    act(() => {
      frame?.(500)
    })

    expect(useBreathingStore.getState().currentTime).toBeCloseTo(before)
  })

  it('should ignore frames when playback is paused', () => {
    let frame: FrameRequestCallback | undefined
    const driver = {
      start: vi.fn<(cb: FrameRequestCallback) => () => void>((cb) => {
        frame = cb
        return vi.fn()
      }),
    }

    renderHook(() => useBreathingTimer({ driver }))

    act(() => {
      useBreathingStore.getState().play()
    })

    act(() => {
      frame?.(0)
      frame?.(16)
    })

    const before = useBreathingStore.getState().currentTime

    act(() => {
      useBreathingStore.getState().pause()
    })

    act(() => {
      frame?.(32)
    })

    expect(useBreathingStore.getState().currentTime).toBeCloseTo(before)
  })

  it('should correct mismatched phase state', () => {
    let frame: FrameRequestCallback | undefined
    const driver = {
      start: vi.fn<(cb: FrameRequestCallback) => () => void>((cb) => {
        frame = cb
        return vi.fn()
      }),
    }

    renderHook(() => useBreathingTimer({ driver }))

    act(() => {
      useBreathingStore.getState().play()
      useBreathingStore.setState((state) => ({
        ...state,
        currentPhase: 'hold-in',
      }))
    })

    act(() => {
      frame?.(0)
      frame?.(1)
    })

    expect(useBreathingStore.getState().currentPhase).toBe('inhale')
  })
})
