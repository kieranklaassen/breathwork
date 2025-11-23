'use client'

import { useEffect, useRef, useState } from 'react'

import { useAudio } from '~/hooks/use-audio'
import type { BreathingPattern } from '~/libs/breathing-patterns'
import type { BreathPhase } from '~/libs/breathing-store'

import { BreathingWave } from '../breathing-wave'

import styles from './zen-mode.module.css'

type ZenModeProps = {
  pattern: BreathingPattern
  audioEnabled: boolean
  onToggleAudio: () => void
  onExit: () => void
  onComplete: (data: { duration: number; cycles: number }) => void
}

const PHASE_LABELS: Record<BreathPhase, string> = {
  ready: 'Begin',
  inhale: 'Breathe in',
  'hold-in': 'Rest',
  exhale: 'Release',
  'hold-out': 'Rest',
}

export function ZenMode({
  pattern,
  audioEnabled,
  onToggleAudio,
  onExit,
  onComplete,
}: ZenModeProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [phase, setPhase] = useState<BreathPhase>('ready')
  const [sessionTime, setSessionTime] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)

  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const sessionStartRef = useRef<number | null>(null)
  const lastPhaseRef = useRef<BreathPhase>('ready')

  const totalCycle =
    pattern.phases.inhale +
    pattern.phases.holdIn +
    pattern.phases.exhale +
    pattern.phases.holdOut
  const audio = useAudio(audioEnabled)

  useEffect(() => {
    if (!isPlaying || totalCycle === 0) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      return
    }

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts - currentTime
      if (!sessionStartRef.current) sessionStartRef.current = ts

      const elapsed = ts - startRef.current
      const cyclePos = elapsed % totalCycle
      const cycles = Math.floor(elapsed / totalCycle)

      setCycleCount(cycles)
      setCurrentTime(cyclePos)
      setSessionTime(ts - sessionStartRef.current)

      let p: BreathPhase = 'inhale'
      if (cyclePos < pattern.phases.inhale) {
        p = 'inhale'
      } else if (cyclePos < pattern.phases.inhale + pattern.phases.holdIn) {
        p = 'hold-in'
      } else if (
        cyclePos <
        pattern.phases.inhale + pattern.phases.holdIn + pattern.phases.exhale
      ) {
        p = 'exhale'
      } else {
        p = 'hold-out'
      }

      if (p !== lastPhaseRef.current) {
        if (p === 'inhale') audio.inhale()
        else if (p === 'exhale') audio.exhale()
        else audio.hold()
        lastPhaseRef.current = p
      }

      setPhase(p)
      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [isPlaying, totalCycle, pattern, audio, currentTime])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying((p) => !p)
      }
      if (e.code === 'Escape') onExit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onExit])

  const handleComplete = () => {
    if (sessionTime >= 10000) {
      audio.complete()
      onComplete({ duration: sessionTime, cycles: cycleCount })
    } else {
      onExit()
    }
  }

  const handleTogglePlay = () => {
    if (!isPlaying) startRef.current = null
    setIsPlaying((p) => !p)
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const phaseLabel = PHASE_LABELS[phase] ?? phase
  const accent = pattern.accent || '#f8b4c4'

  return (
    <div
      className={styles.container}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      {/* Header */}
      <header className={styles.header}>
        <button
          type="button"
          className={styles.audioButton}
          onClick={onToggleAudio}
        >
          {audioEnabled ? '🔔' : '🔕'}
        </button>
        <button type="button" className={styles.closeButton} onClick={onExit}>
          ✕ close
        </button>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.patternInfo}>
          <span className={styles.patternName}>
            {pattern.name} · {pattern.japanese}
          </span>
        </div>

        <h1 className={styles.phaseLabel} style={{ color: accent }}>
          {phaseLabel}
        </h1>

        <div className={styles.waveContainer}>
          <BreathingWave
            phases={{
              inhale: pattern.phases.inhale,
              holdIn: pattern.phases.holdIn,
              exhale: pattern.phases.exhale,
              holdOut: pattern.phases.holdOut,
            }}
            currentTime={currentTime}
            totalCycle={totalCycle}
            phase={phase}
            isActive={isPlaying}
          />
        </div>

        <div className={styles.cycleInfo}>
          {Math.round(totalCycle / 1000)}s cycle
        </div>

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

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.playButton}
            onClick={handleTogglePlay}
            style={{
              borderColor: accent,
              background: isPlaying ? accent : 'transparent',
              color: isPlaying ? '#1a1f2e' : accent,
            }}
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
      </main>

      <footer className={styles.footer}>
        space · play &nbsp;&nbsp; esc · exit
      </footer>
    </div>
  )
}
