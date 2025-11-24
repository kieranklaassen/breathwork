'use client'

import cn from 'clsx'
import gsap from 'gsap'
import { useLayoutEffect, useRef, useState } from 'react'

import { useAudio } from '~/hooks/use-audio'
import {
  type FrameDriver,
  useBreathingTimer,
} from '~/hooks/use-breathing-timer'
import {
  BREATHING_PATTERNS,
  type BreathingPattern,
  type BreathingPhaseKey,
} from '~/libs/breathing-patterns'
import {
  type BreathPhase,
  useBreathingStore,
  useIsPlaying,
  useTotalCycleTime,
} from '~/libs/breathing-store'

import { BreathingVisualizer } from '../breathing-visualizer'
import { BreathingWave } from '../breathing-wave'
import { ZenMode } from '../zen-mode'

import styles from './breathing-experience.module.css'

type BreathingExperienceProps = {
  driver?: FrameDriver
}

const PHASE_COLORS: Record<string, string> = {
  inhale: '#f8b4c4',
  'hold-in': '#a8d5ba',
  exhale: '#c9b8e0',
  'hold-out': '#8ecae6',
}

const PHASE_LABELS: Record<BreathPhase, string> = {
  ready: 'Begin',
  inhale: 'Breathe in',
  'hold-in': 'Rest',
  exhale: 'Release',
  'hold-out': 'Rest',
}

const PHASE_FIELDS: Array<{
  key: BreathingPhaseKey
  label: string
  color: string
}> = [
  { key: 'inhale', label: 'Inhale', color: '#f8b4c4' },
  { key: 'holdIn', label: 'Hold', color: '#a8d5ba' },
  { key: 'exhale', label: 'Exhale', color: '#c9b8e0' },
  { key: 'holdOut', label: 'Hold', color: '#8ecae6' },
]

export function BreathingExperience({ driver }: BreathingExperienceProps) {
  const [sessionStarted, setSessionStarted] = useState(false)
  const [isZenMode, setIsZenMode] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const audioEnabledRef = useRef(false)
  const lastPhaseRef = useRef<BreathPhase>('ready')

  // Animation refs
  const containerRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const patternsRef = useRef<HTMLDivElement>(null)
  const mainCardRef = useRef<HTMLDivElement>(null)

  // GSAP entrance animations
  useLayoutEffect(() => {
    if (
      !(
        containerRef.current &&
        headerRef.current &&
        patternsRef.current &&
        mainCardRef.current
      )
    )
      return

    const header = headerRef.current
    const patterns = patternsRef.current
    const mainCard = mainCardRef.current

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Set initial states
      gsap.set(header.children, { opacity: 0, y: 20 })
      gsap.set(patterns.querySelectorAll('button'), {
        opacity: 0,
        y: 30,
        scale: 0.95,
      })
      gsap.set(mainCard, { opacity: 0, y: 40 })

      // Animate header elements
      tl.to(header.children, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
      })

      // Animate pattern cards with stagger
      tl.to(
        patterns.querySelectorAll('button'),
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.08 },
        '-=0.4'
      )

      // Animate main card
      tl.to(mainCard, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const isPlaying = useIsPlaying()
  const totalCycleTime = useTotalCycleTime()

  const cycleCount = useBreathingStore((state) => state.cycleCount)
  const sessionTime = useBreathingStore((state) => state.sessionTime)
  const selectedPattern = useBreathingStore((state) => state.selectedPattern)
  const draftPhases = useBreathingStore((state) => state.draftPhases)

  const play = useBreathingStore((state) => state.play)
  const pause = useBreathingStore((state) => state.pause)
  const reset = useBreathingStore((state) => state.reset)
  const selectPattern = useBreathingStore((state) => state.selectPattern)
  const adjustPhase = useBreathingStore((state) => state.adjustPhase)
  const adjustCycleSpeed = useBreathingStore((state) => state.adjustCycleSpeed)

  const timer = useBreathingTimer({ driver })
  const audio = useAudio(audioEnabledRef.current)

  const pattern: BreathingPattern =
    BREATHING_PATTERNS[selectedPattern] ?? BREATHING_PATTERNS.coherent

  // Play audio on phase change
  if (timer.phase !== lastPhaseRef.current && audioEnabledRef.current) {
    lastPhaseRef.current = timer.phase
    if (timer.phase === 'inhale') audio.inhale()
    else if (timer.phase === 'exhale') audio.exhale()
    else if (timer.phase !== 'ready') audio.hold()
  }

  const handleTogglePlayback = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const handlePatternSelect = (key: string) => {
    selectPattern(key)
    if (isPlaying) {
      reset()
    }
  }

  const handleAdjustPhase = (key: BreathingPhaseKey, delta: number) => {
    adjustPhase(key, delta * 1000)
  }

  const handleAdjustTotal = (delta: number) => {
    adjustCycleSpeed(delta * 1000)
  }

  const handleToggleAudio = () => {
    setAudioEnabled((prev) => !prev)
    audioEnabledRef.current = !audioEnabledRef.current
  }

  const handleEnterZen = () => {
    setIsZenMode(true)
  }

  const handleExitZen = () => {
    setIsZenMode(false)
  }

  const handleZenComplete = (_data: { duration: number; cycles: number }) => {
    setIsZenMode(false)
    // Could save session data here
  }

  const handleStartSession = () => {
    setSessionStarted(true)
    play()
  }

  const handleEndSession = () => {
    if (sessionTime >= 10000) {
      audio.complete()
    }
    reset()
    setSessionStarted(false)
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const totalCycleSeconds = Math.round(totalCycleTime / 1000)
  const phaseLabel = PHASE_LABELS[timer.phase] ?? timer.phase
  const phaseColor = PHASE_COLORS[timer.phase] ?? '#e8e0e4'

  return (
    <>
      {isZenMode && (
        <ZenMode
          pattern={pattern}
          audioEnabled={audioEnabled}
          onToggleAudio={handleToggleAudio}
          onExit={handleExitZen}
          onComplete={handleZenComplete}
        />
      )}

      <section
        ref={containerRef}
        className={styles.container}
        aria-label="Breathing exercise"
      >
        {/* Header */}
        <header ref={headerRef} className={styles.header}>
          <p className={styles.headerKanji}>息 · BREATH</p>
          <h1 className={styles.headerTitle}>Breathe</h1>
          <p className={styles.headerSubtitle}>Like wind through bamboo</p>
        </header>

        <div className={styles.content}>
          {!sessionStarted ? (
            <>
              {/* Landing: Patterns Grid */}
              <div className={styles.patternsSection}>
                <div className={styles.sectionTitle}>Choose your pattern</div>
                <div ref={patternsRef} className={styles.patternsGrid}>
                  {Object.entries(BREATHING_PATTERNS).map(([key, p]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => handlePatternSelect(key)}
                      className={cn(
                        styles.patternCard,
                        selectedPattern === key && styles.patternCardActive
                      )}
                    >
                      <div className={styles.patternHeader}>
                        <span className={styles.patternIcon}>{p.icon}</span>
                        <span
                          className={styles.patternJapanese}
                          style={{ color: p.accent }}
                        >
                          {p.japanese}
                        </span>
                      </div>
                      <div className={styles.patternName}>{p.name}</div>
                      <div className={styles.patternSubtitle}>{p.subtitle}</div>
                      <div className={styles.patternBar}>
                        {p.phases.inhale > 0 && (
                          <div
                            className={styles.patternBarSegment}
                            style={{
                              flex: p.phases.inhale,
                              background: PHASE_COLORS.inhale,
                            }}
                          />
                        )}
                        {p.phases.holdIn > 0 && (
                          <div
                            className={styles.patternBarSegment}
                            style={{
                              flex: p.phases.holdIn,
                              background: PHASE_COLORS['hold-in'],
                            }}
                          />
                        )}
                        {p.phases.exhale > 0 && (
                          <div
                            className={styles.patternBarSegment}
                            style={{
                              flex: p.phases.exhale,
                              background: PHASE_COLORS.exhale,
                            }}
                          />
                        )}
                        {p.phases.holdOut > 0 && (
                          <div
                            className={styles.patternBarSegment}
                            style={{
                              flex: p.phases.holdOut,
                              background: PHASE_COLORS['hold-out'],
                            }}
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Landing: Start Button */}
              <div className={styles.startSection}>
                <button
                  type="button"
                  className={styles.startButton}
                  onClick={handleStartSession}
                  style={{ borderColor: pattern.accent }}
                >
                  <span className={styles.startButtonText}>
                    Begin {pattern.name}
                  </span>
                  <span className={styles.startButtonSubtext}>
                    {Math.round(totalCycleTime / 1000)}s cycle
                  </span>
                </button>
              </div>

              {/* Landing: Empty State */}
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🌸</div>
                <p className={styles.emptyText}>
                  Choose a pattern and let each breath carry you deeper into
                  stillness.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Session: Quick Stats */}
              {cycleCount > 1 && (
                <div className={styles.statsRow}>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>{cycleCount}</div>
                    <div className={styles.statLabel}>cycles</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue}>
                      {formatTime(sessionTime)}
                    </div>
                    <div className={styles.statLabel}>duration</div>
                  </div>
                </div>
              )}

              {/* Session: Main Breathing Card */}
              <div ref={mainCardRef} className={styles.mainCard}>
                {/* Phase Label */}
                <div className={styles.phaseLabel}>
                  <span
                    className={styles.phaseLabelText}
                    style={{
                      color: isPlaying
                        ? phaseColor
                        : 'rgba(232, 224, 228, 0.6)',
                    }}
                  >
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
                  </span>
                </div>

                {/* Phase Controls */}
                <div className={styles.phaseControls}>
                  {PHASE_FIELDS.map(({ key, label, color }) => {
                    const valueMs = draftPhases[key]
                    const valueSec = Math.round(valueMs / 1000)
                    const isActive =
                      (key === 'inhale' && timer.phase === 'inhale') ||
                      (key === 'holdIn' && timer.phase === 'hold-in') ||
                      (key === 'exhale' && timer.phase === 'exhale') ||
                      (key === 'holdOut' && timer.phase === 'hold-out')

                    return (
                      <div
                        key={key}
                        className={cn(
                          styles.phaseControl,
                          isActive && styles.phaseControlActive
                        )}
                        style={{
                          flex: valueSec > 0 ? valueSec : 0.5,
                          minWidth: valueSec > 0 ? '60px' : '45px',
                          background: isActive ? `${color}15` : undefined,
                          borderColor: isActive ? `${color}40` : undefined,
                        }}
                      >
                        <div
                          className={styles.phaseControlLabel}
                          style={{ color }}
                        >
                          {label}
                        </div>
                        <div className={styles.phaseControlValue}>
                          <button
                            type="button"
                            onClick={() => handleAdjustPhase(key, -1)}
                            className={styles.phaseControlButton}
                            style={{
                              border: `1px solid ${color}50`,
                              background: `${color}10`,
                              color,
                            }}
                          >
                            −
                          </button>
                          <div className={styles.phaseControlNumber}>
                            {valueSec}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAdjustPhase(key, 1)}
                            className={styles.phaseControlButton}
                            style={{
                              border: `1px solid ${color}50`,
                              background: `${color}10`,
                              color,
                            }}
                          >
                            +
                          </button>
                        </div>
                        <div className={styles.phaseControlUnit}>sec</div>
                      </div>
                    )
                  })}
                </div>

                {/* Wave Visualization */}
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

                {/* WebGL Visualizer */}
                <div className={styles.visualizer}>
                  <BreathingVisualizer
                    phase={timer.phase}
                    phaseProgress={timer.phaseProgress}
                    cycleProgress={timer.cycleProgress}
                    isPlaying={timer.isPlaying}
                  />
                </div>

                {/* Total Cycle Controls */}
                <div className={styles.cycleControls}>
                  <button
                    type="button"
                    className={styles.cycleButton}
                    onClick={() => handleAdjustTotal(-2)}
                  >
                    −
                  </button>
                  <div className={styles.cycleInfo}>
                    <div className={styles.cycleTime}>{totalCycleSeconds}s</div>
                    <div className={styles.cycleLabel}>total cycle</div>
                  </div>
                  <button
                    type="button"
                    className={styles.cycleButton}
                    onClick={() => handleAdjustTotal(2)}
                  >
                    +
                  </button>
                </div>

                {/* Session Stats */}
                {sessionTime > 0 && (
                  <div className={styles.sessionStats}>
                    <span>{formatTime(sessionTime)}</span>
                    <span>{cycleCount} cycles</span>
                  </div>
                )}

                {/* Controls */}
                <div className={styles.controls}>
                  <button
                    type="button"
                    className={cn(
                      styles.controlButton,
                      audioEnabled && styles.controlButtonActive
                    )}
                    onClick={handleToggleAudio}
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
                    style={{ borderColor: pattern.accent }}
                  >
                    {isPlaying ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
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
                    onClick={handleEnterZen}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                    </svg>
                  </button>
                </div>

                {/* Complete Session Button */}
                {sessionTime > 10000 && (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className={styles.completeButton}
                      onClick={handleEndSession}
                    >
                      Complete Session
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
