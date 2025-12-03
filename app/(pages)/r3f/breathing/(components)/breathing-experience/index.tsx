'use client'

import cn from 'clsx'
import gsap from 'gsap'
import { useLayoutEffect, useRef } from 'react'

import type { FrameDriver } from '~/hooks/use-breathing-timer'
import { BREATHING_PATTERNS } from '~/libs/breathing-patterns'
import { useBreathingStore } from '~/libs/breathing-store'

import { BreathingSession } from '../breathing-session'

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

export function BreathingExperience({ driver }: BreathingExperienceProps) {
  const containerRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const patternsRef = useRef<HTMLDivElement>(null)

  const showPatternSelection = useBreathingStore(
    (state) => state.showPatternSelection
  )
  const selectedPattern = useBreathingStore((state) => state.selectedPattern)
  const startPattern = useBreathingStore((state) => state.startPattern)

  // GSAP entrance animations for pattern selection
  useLayoutEffect(() => {
    if (!showPatternSelection) return
    if (!(containerRef.current && headerRef.current && patternsRef.current))
      return

    const header = headerRef.current
    const patterns = patternsRef.current

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      gsap.set(header.children, { opacity: 0, y: 20 })
      gsap.set(patterns.querySelectorAll('button'), {
        opacity: 0,
        y: 30,
        scale: 0.95,
      })

      tl.to(header.children, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
      })

      tl.to(
        patterns.querySelectorAll('button'),
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.08 },
        '-=0.4'
      )
    }, containerRef)

    return () => ctx.revert()
  }, [showPatternSelection])

  const handlePatternClick = (key: string) => {
    startPattern(key)
  }

  // If not showing pattern selection, show the breathing session
  if (!showPatternSelection) {
    return <BreathingSession driver={driver} />
  }

  // Pattern selection view
  return (
    <section
      ref={containerRef}
      className={styles.container}
      aria-label="Choose breathing pattern"
    >
      <header ref={headerRef} className={styles.header}>
        <p className={styles.headerKanji}>息 · BREATH</p>
        <h1 className={styles.headerTitle}>Breathe</h1>
        <p className={styles.headerSubtitle}>Like wind through bamboo</p>
      </header>

      <div className={styles.content}>
        <div className={styles.patternsSection}>
          <div className={styles.sectionTitle}>Choose your pattern</div>
          <div ref={patternsRef} className={styles.patternsGrid}>
            {Object.entries(BREATHING_PATTERNS).map(([key, p]) => (
              <button
                type="button"
                key={key}
                onClick={() => handlePatternClick(key)}
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

        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🌸</div>
          <p className={styles.emptyText}>
            Choose a pattern and let each breath carry you deeper into
            stillness.
          </p>
        </div>
      </div>
    </section>
  )
}
