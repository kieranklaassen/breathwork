'use client'

import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

import { SOUNDSCAPE_CONFIG } from '~/libs/soundscape-config'

/**
 * Hook for playing phase tones using Tone.js
 * Replaces the simple oscillator-based useAudio hook with
 * musical tones that harmonize with the ambient drone layer
 */
export function useToneAudio(enabled: boolean) {
  const synthRef = useRef<Tone.Synth | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize audio nodes lazily on first play
  const ensureInitialized = async () => {
    if (isInitializedRef.current) return

    // Start audio context (requires user gesture)
    await Tone.start()

    // Create reverb for spaciousness
    reverbRef.current = new Tone.Reverb({
      decay: 2,
      wet: 0.3,
    }).toDestination()

    // Generate impulse response (required for Tone.Reverb)
    await reverbRef.current.generate()

    // Create synth for phase tones
    synthRef.current = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: SOUNDSCAPE_CONFIG.phaseEnvelope,
      volume: SOUNDSCAPE_CONFIG.volumes.phaseTones,
    }).connect(reverbRef.current)

    isInitializedRef.current = true
  }

  // Play a note with given duration
  const play = async (note: string, duration = 0.4) => {
    if (!enabled) return

    try {
      await ensureInitialized()
      synthRef.current?.triggerAttackRelease(note, duration)
    } catch (error) {
      // Silently fail if audio context isn't ready
      console.warn('Audio playback failed:', error)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synthRef.current?.dispose()
      reverbRef.current?.dispose()
      isInitializedRef.current = false
    }
  }, [])

  return {
    inhale: () => play(SOUNDSCAPE_CONFIG.phaseTones.inhale, 0.4),
    exhale: () => play(SOUNDSCAPE_CONFIG.phaseTones.exhale, 0.4),
    hold: () => play(SOUNDSCAPE_CONFIG.phaseTones.holdIn, 0.2),
    complete: async () => {
      await play(SOUNDSCAPE_CONFIG.phaseTones.complete[0], 0.3)
      setTimeout(() => play(SOUNDSCAPE_CONFIG.phaseTones.complete[1], 0.4), 200)
    },
  }
}
