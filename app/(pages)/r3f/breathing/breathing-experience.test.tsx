import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { BREATHING_PATTERNS } from '~/libs/breathing-patterns'
import { useBreathingStore } from '~/libs/breathing-store'

import { BreathingExperience } from './(components)/breathing-experience'

const createTestDriver = () => {
  let now = 0
  let callback: FrameRequestCallback | null = null
  let running = false

  const driver = {
    start: (cb: FrameRequestCallback) => {
      callback = cb
      running = true
      callback(now)
      return () => {
        running = false
        callback = null
      }
    },
  }

  return {
    driver,
    step: (ms: number) => {
      now += ms
      if (running && callback) {
        callback(now)
      }
    },
    flush: () => {
      if (running && callback) {
        callback(now)
      }
    },
  }
}

const resetStore = () => {
  act(() => {
    const initial = useBreathingStore.getInitialState()
    useBreathingStore.setState(initial, true)
  })
}

describe('BreathingExperience', () => {
  beforeEach(() => {
    resetStore()
  })

  afterEach(() => {
    resetStore()
  })

  it('progresses through phases over time', async () => {
    const scheduler = createTestDriver()
    render(<BreathingExperience driver={scheduler.driver} />)

    expect(screen.getByTestId('breathing-visualizer')).toBeInTheDocument()

    const startButton = screen.getByRole('button', { name: /start session/i })
    act(() => {
      scheduler.flush()
    })
    await userEvent.click(startButton)
    act(() => {
      scheduler.flush()
    })

    act(() => {
      scheduler.step(4000)
    })
    expect(screen.getByTestId('phase-heading')).toHaveTextContent(/hold in/i)

    act(() => {
      scheduler.step(4000)
    })
    expect(screen.getByTestId('phase-heading')).toHaveTextContent(/exhale/i)
  })

  it('allows toggling playback state', async () => {
    const scheduler = createTestDriver()
    render(<BreathingExperience driver={scheduler.driver} />)

    const startButton = screen.getByRole('button', { name: /start session/i })
    act(() => {
      scheduler.flush()
    })
    await userEvent.click(startButton)
    act(() => {
      scheduler.flush()
    })
    expect(startButton).toHaveTextContent(/pause session/i)

    await userEvent.click(startButton)
    expect(startButton).toHaveTextContent(/resume session/i)
  })

  it('supports selecting different breathing patterns', async () => {
    const scheduler = createTestDriver()
    render(<BreathingExperience driver={scheduler.driver} />)

    const select = screen.getByRole('combobox', { name: /breathing pattern/i })
    await userEvent.selectOptions(select, '4-7-8')

    expect(
      screen.getByText(BREATHING_PATTERNS['4-7-8'].description, {
        exact: false,
      })
    ).toBeInTheDocument()
  })

  it('lets the user lengthen the cycle while preserving progress', async () => {
    const scheduler = createTestDriver()
    render(<BreathingExperience driver={scheduler.driver} />)

    act(() => {
      scheduler.flush()
    })
    await userEvent.click(
      screen.getByRole('button', { name: /start session/i })
    )
    act(() => {
      scheduler.flush()
    })
    act(() => {
      scheduler.step(8000)
    })

    const progressStat = screen.getByTestId('cycle-progress')
    expect(progressStat).toHaveTextContent('50%')

    await userEvent.click(
      screen.getByRole('button', { name: /lengthen cycle/i })
    )

    expect(progressStat).toHaveTextContent('44%')
    expect(
      screen.getByRole('heading', { name: /hold in/i })
    ).toBeInTheDocument()
  })

  it('allows custom phase adjustments to be saved', async () => {
    const scheduler = createTestDriver()
    render(<BreathingExperience driver={scheduler.driver} />)

    const inhaleInput = screen.getByLabelText(/inhale duration/i)
    await userEvent.clear(inhaleInput)
    await userEvent.type(inhaleInput, '6500')

    await userEvent.click(
      screen.getByRole('button', { name: /save custom pattern/i })
    )

    expect(useBreathingStore.getState().selectedPattern).toBe('custom')
    expect(screen.getByText(/custom pattern active/i)).toBeInTheDocument()
  })
})
