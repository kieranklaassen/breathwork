'use client'

import cn from 'clsx'
import { useEffect, useRef, useState } from 'react'

import {
  type FrameDriver,
  useBreathingTimer,
} from '~/hooks/use-breathing-timer'
import { useIdleControls } from '~/hooks/use-idle-controls'
import { useSoundscape } from '~/hooks/use-soundscape'
import { useToneAudio } from '~/hooks/use-tone-audio'
import {
  BREATHING_PATTERNS,
  type BreathingPattern,
} from '~/libs/breathing-patterns'
import {
  type BreathPhase,
  useBreathingStore,
  useIsPlaying,
  useTotalCycleTime,
} from '~/libs/breathing-store'
import type { MilestoneMinutes } from '~/libs/soundscape-config'

import { BreathingWave } from '../breathing-wave'

import styles from './breathing-session.module.css'

type BreathingSessionProps = {
  driver?: FrameDriver
}

const PHASE_LABELS: Record<BreathPhase, string> = {
  ready: 'Begin',
  inhale: 'Breathe in',
  'hold-in': 'Rest',
  exhale: 'Release',
  'hold-out': 'Rest',
}

// Calculate current milestone based on session time (pure function, outside component)
const getCurrentMilestone = (timeMs: number): MilestoneMinutes => {
  const minutes = timeMs / 60000
  if (minutes >= 20) return 20
  if (minutes >= 10) return 10
  if (minutes >= 5) return 5
  return 0
}

export function BreathingSession({ driver }: BreathingSessionProps) {
  const [audioEnabled, setAudioEnabled] = useState(false)
  const audioEnabledRef = useRef(false)
  const lastPhaseRef = useRef<BreathPhase>('ready')

  const { isVisible } = useIdleControls({ idleTimeout: 3000 })

  const isPlaying = useIsPlaying()
  const totalCycleTime = useTotalCycleTime()

  const cycleCount = useBreathingStore((state) => state.cycleCount)
  const sessionTime = useBreathingStore((state) => state.sessionTime)
  const selectedPattern = useBreathingStore((state) => state.selectedPattern)
  const draftPhases = useBreathingStore((state) => state.draftPhases)

  const play = useBreathingStore((state) => state.play)
  const pause = useBreathingStore((state) => state.pause)
  const reset = useBreathingStore((state) => state.reset)
  const setShowPatternSelection = useBreathingStore(
    (state) => state.setShowPatternSelection
  )
  const adjustCycleSpeed = useBreathingStore((state) => state.adjustCycleSpeed)

  const timer = useBreathingTimer({ driver })
  const audio = useToneAudio(audioEnabledRef.current)
  const soundscape = useSoundscape()

  // Handle milestone evolution
  useEffect(() => {
    if (!(audioEnabledRef.current && soundscape.isPlaying)) return

    const currentMilestone = getCurrentMilestone(sessionTime)

    if (currentMilestone > soundscape.milestone) {
      if (currentMilestone === 5) soundscape.evolve(5)
      else if (currentMilestone === 10) soundscape.evolve(10)
      else if (currentMilestone === 20) soundscape.evolve(20)
    }
  }, [sessionTime, soundscape.milestone, soundscape.isPlaying, soundscape])

  // Start/stop soundscape with session playback
  useEffect(() => {
    if (isPlaying && audioEnabledRef.current && !soundscape.isPlaying) {
      soundscape.start()
    } else if (!isPlaying && soundscape.isPlaying) {
      soundscape.stop()
    }
  }, [isPlaying, soundscape])

  const pattern: BreathingPattern =
    BREATHING_PATTERNS[selectedPattern] ?? BREATHING_PATTERNS.coherent

  // Play audio on phase change
  if (timer.phase !== lastPhaseRef.current && audioEnabledRef.current) {
    lastPhaseRef.current = timer.phase
    if (timer.phase === 'inhale') audio.inhale()
    else if (timer.phase === 'exhale') audio.exhale()
    else if (timer.phase !== 'ready') audio.hold()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (isPlaying) {
          pause()
        } else {
          play()
        }
      }
      if (e.code === 'Escape') {
        soundscape.stop()
        reset()
        setShowPatternSelection(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPlaying, pause, play, reset, setShowPatternSelection, soundscape])

  const handleTogglePlayback = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const handleToggleAudio = async () => {
    const newState = !audioEnabledRef.current
    setAudioEnabled(newState)
    audioEnabledRef.current = newState

    // Handle soundscape start/stop based on new audio state
    if (newState && isPlaying) {
      // Audio enabled mid-session: resume soundscape at correct milestone
      const currentMilestone = getCurrentMilestone(sessionTime)
      await soundscape.resumeAtMilestone(currentMilestone)
    } else if (!newState && soundscape.isPlaying) {
      // Audio disabled: stop soundscape
      soundscape.stop()
    }
  }

  const handleChangePattern = () => {
    soundscape.stop()
    reset()
    setShowPatternSelection(true)
  }

  const handleComplete = () => {
    if (sessionTime >= 10000 && audioEnabledRef.current) {
      audio.complete()
    }
    soundscape.stop()
    reset()
    setShowPatternSelection(true)
  }

  const handleSpeedDecrease = () => {
    adjustCycleSpeed(-2000)
  }

  const handleSpeedIncrease = () => {
    adjustCycleSpeed(2000)
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const totalCycleSeconds = Math.round(totalCycleTime / 1000)
  const phaseLabel = PHASE_LABELS[timer.phase] ?? timer.phase
  const accent = pattern.accent || '#f8b4c4'

  return (
    <div
      className={styles.container}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      {/* Main content - always visible */}
      <main className={styles.main}>
        <div className={styles.patternInfo}>
          <span className={styles.patternName}>
            {pattern.name} · {pattern.japanese}
          </span>
        </div>

        <h1 className={styles.phaseLabel} style={{ color: accent }}>
          {phaseLabel}
          {timer.phase === 'inhale' && (
            <span className={styles.methodIcon}>
              {pattern.methods.inhale === 'nose' ? '👃' : '👄'}
            </span>
          )}
          {timer.phase === 'exhale' && (
            <span className={styles.methodIcon}>
              {pattern.methods.exhale === 'nose' ? '👃' : '👄'}
            </span>
          )}
        </h1>

        <div className={styles.waveContainer}>
          <BreathingWave
            phases={{
              inhale: draftPhases.inhale,
              holdIn: draftPhases.holdIn,
              exhale: draftPhases.exhale,
              holdOut: draftPhases.holdOut,
            }}
            currentTime={timer.timeInCycle}
            totalCycle={totalCycleTime}
            phase={timer.phase}
            isActive={timer.isPlaying}
          />
        </div>

        <div className={styles.cycleInfo}>{totalCycleSeconds}s cycle</div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{formatTime(sessionTime)}</div>
            <div className={styles.statLabel}>duration</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{cycleCount}</div>
            <div className={styles.statLabel}>cycles</div>
          </div>
        </div>
      </main>

      {/* Controls - fade in/out based on idle */}
      <div className={cn(styles.controls, isVisible && styles.controlsVisible)}>
        {/* Speed controls */}
        <div className={styles.speedControls}>
          <button
            type="button"
            className={styles.speedButton}
            onClick={handleSpeedDecrease}
            aria-label="Decrease speed"
          >
            −
          </button>
          <span className={styles.speedLabel}>Speed</span>
          <button
            type="button"
            className={styles.speedButton}
            onClick={handleSpeedIncrease}
            aria-label="Increase speed"
          >
            +
          </button>
        </div>

        {/* Main controls */}
        <div className={styles.mainControls}>
          <button
            type="button"
            className={cn(
              styles.controlButton,
              audioEnabled && styles.controlButtonActive
            )}
            onClick={handleToggleAudio}
            aria-label={audioEnabled ? 'Mute audio' : 'Enable audio'}
          >
            {audioEnabled ? '🔔' : '🔕'}
          </button>

          <button
            type="button"
            className={cn(
              styles.playButton,
              isPlaying && styles.playButtonActive
            )}
            onClick={handleTogglePlayback}
            style={{ borderColor: accent }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36a1 1 0 00-1.5.86z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className={styles.controlButton}
            onClick={handleChangePattern}
            aria-label="Change pattern"
          >
            ✕
          </button>
        </div>

        {/* Complete button */}
        {sessionTime > 10000 && (
          <button
            type="button"
            className={styles.completeButton}
            style={{ borderColor: `${accent}40`, color: accent }}
            onClick={handleComplete}
          >
            Complete
          </button>
        )}
      </div>

      {/* Keyboard hints */}
      <footer className={cn(styles.footer, isVisible && styles.footerVisible)}>
        space · play &nbsp;&nbsp; esc · exit
      </footer>
    </div>
  )
}
