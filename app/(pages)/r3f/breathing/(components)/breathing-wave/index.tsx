'use client'

import type { FC } from 'react'

import type { BreathPhase } from '~/libs/breathing-store'

const PHASE_COLORS: Record<string, string> = {
  inhale: '#f8b4c4',
  'hold-in': '#a8d5ba',
  exhale: '#c9b8e0',
  'hold-out': '#8ecae6',
}

type BreathingWaveProps = {
  phases: {
    inhale: number
    holdIn: number
    exhale: number
    holdOut: number
  }
  currentTime: number
  totalCycle: number
  phase: BreathPhase
  isActive: boolean
}

export const BreathingWave: FC<BreathingWaveProps> = ({
  phases,
  currentTime,
  totalCycle,
  phase,
  isActive,
}) => {
  const width = 340
  const height = 100
  const waveTop = 20
  const waveBottom = height - 20
  const waveHeight = waveBottom - waveTop

  if (totalCycle === 0) return null

  const inhaleEnd = phases.inhale / totalCycle
  const holdInEnd = (phases.inhale + phases.holdIn) / totalCycle
  const exhaleEnd = (phases.inhale + phases.holdIn + phases.exhale) / totalCycle

  const inhaleX = inhaleEnd * width
  const holdInX = holdInEnd * width
  const exhaleX = exhaleEnd * width

  const createPath = () => {
    let path = `M 0,${waveBottom}`

    if (phases.inhale > 0) {
      path += ` C ${inhaleX * 0.35},${waveBottom} ${inhaleX * 0.65},${waveTop} ${inhaleX},${waveTop}`
    }

    if (phases.holdIn > 0) {
      path += ` L ${holdInX},${waveTop}`
    }

    if (phases.exhale > 0) {
      const startX = phases.holdIn > 0 ? holdInX : inhaleX
      path += ` C ${startX + (exhaleX - startX) * 0.35},${waveTop} ${startX + (exhaleX - startX) * 0.65},${waveBottom} ${exhaleX},${waveBottom}`
    }

    if (phases.holdOut > 0) {
      path += ` L ${width},${waveBottom}`
    }

    return path
  }

  const getPoint = () => {
    if (!isActive) return { x: 0, y: waveBottom }

    const progress = currentTime / totalCycle
    const x = progress * width
    let y = waveBottom

    if (progress < inhaleEnd) {
      const t = progress / inhaleEnd
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      y = waveBottom - eased * waveHeight
    } else if (progress < holdInEnd) {
      y = waveTop
    } else if (progress < exhaleEnd) {
      const t = (progress - holdInEnd) / (exhaleEnd - holdInEnd)
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
      y = waveTop + eased * waveHeight
    }

    return { x, y }
  }

  const point = getPoint()
  const currentPhaseColor = PHASE_COLORS[phase] || PHASE_COLORS.inhale

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="phaseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={PHASE_COLORS.inhale} />
            <stop
              offset={`${inhaleEnd * 100}%`}
              stopColor={PHASE_COLORS.inhale}
            />
            {phases.holdIn > 0 && (
              <stop
                offset={`${inhaleEnd * 100}%`}
                stopColor={PHASE_COLORS['hold-in']}
              />
            )}
            {phases.holdIn > 0 && (
              <stop
                offset={`${holdInEnd * 100}%`}
                stopColor={PHASE_COLORS['hold-in']}
              />
            )}
            <stop
              offset={`${holdInEnd * 100}%`}
              stopColor={PHASE_COLORS.exhale}
            />
            <stop
              offset={`${exhaleEnd * 100}%`}
              stopColor={PHASE_COLORS.exhale}
            />
            {phases.holdOut > 0 && (
              <stop
                offset={`${exhaleEnd * 100}%`}
                stopColor={PHASE_COLORS['hold-out']}
              />
            )}
            <stop
              offset="100%"
              stopColor={
                phases.holdOut > 0
                  ? PHASE_COLORS['hold-out']
                  : PHASE_COLORS.exhale
              }
            />
          </linearGradient>
        </defs>

        {/* Phase background regions */}
        {phases.inhale > 0 && (
          <rect
            x="0"
            y={waveTop}
            width={inhaleX}
            height={waveHeight}
            fill={PHASE_COLORS.inhale}
            opacity="0.06"
          />
        )}
        {phases.holdIn > 0 && (
          <rect
            x={inhaleX}
            y={waveTop}
            width={holdInX - inhaleX}
            height={waveHeight}
            fill={PHASE_COLORS['hold-in']}
            opacity="0.06"
          />
        )}
        {phases.exhale > 0 && (
          <rect
            x={holdInX}
            y={waveTop}
            width={exhaleX - holdInX}
            height={waveHeight}
            fill={PHASE_COLORS.exhale}
            opacity="0.06"
          />
        )}
        {phases.holdOut > 0 && (
          <rect
            x={exhaleX}
            y={waveTop}
            width={width - exhaleX}
            height={waveHeight}
            fill={PHASE_COLORS['hold-out']}
            opacity="0.06"
          />
        )}

        {/* Wave path */}
        <path
          d={createPath()}
          fill="none"
          stroke="url(#phaseGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Moving dot */}
        {isActive ? (
          <g filter="url(#glow)">
            <circle
              cx={point.x}
              cy={point.y}
              r="14"
              fill={currentPhaseColor}
              opacity="0.2"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill={currentPhaseColor}
              opacity="0.4"
            />
            <circle cx={point.x} cy={point.y} r="4" fill={currentPhaseColor} />
          </g>
        ) : (
          <circle
            cx="0"
            cy={waveBottom}
            r="4"
            fill={PHASE_COLORS.inhale}
            opacity="0.5"
          />
        )}
      </svg>
    </div>
  )
}
