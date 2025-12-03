'use client'

import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

import { SOUNDSCAPE_CONFIG } from '~/libs/soundscape-config'

/**
 * Hook for playing phase tones using Tone.js
 * Supports multi-note chords with staggered timing for richness
 */
export function useToneAudio(enabled: boolean) {
  const synthsRef = useRef<Tone.Synth[]>([])
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const delayRef = useRef<Tone.FeedbackDelay | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize audio nodes lazily on first play
  const ensureInitialized = async () => {
    if (isInitializedRef.current) return

    await Tone.start()

    // Create reverb for spaciousness
    reverbRef.current = new Tone.Reverb({
      decay: 3,
      wet: 0.4,
    }).toDestination()
    await reverbRef.current.generate()

    // Create delay for depth
    delayRef.current = new Tone.FeedbackDelay({
      delayTime: 0.25,
      feedback: 0.2,
      wet: 0.15,
    }).connect(reverbRef.current)

    // Create multiple synths for chord capability
    for (let i = 0; i < 4; i++) {
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: SOUNDSCAPE_CONFIG.phaseEnvelope,
        volume: SOUNDSCAPE_CONFIG.volumes.phaseTones,
      }).connect(delayRef.current)
      synthsRef.current.push(synth)
    }

    isInitializedRef.current = true
  }

  // Play a phase tone (single note or chord with stagger)
  const playPhase = async (
    phase: keyof typeof SOUNDSCAPE_CONFIG.phaseTones
  ) => {
    if (!enabled) return

    try {
      await ensureInitialized()

      const config = SOUNDSCAPE_CONFIG.phaseTones[phase]
      const { notes, volumes, delay: stagger } = config

      // Play each note, staggered if delay > 0
      notes.forEach((note, index) => {
        const synth = synthsRef.current[index]
        if (!synth) return

        // Set volume for this note
        synth.volume.value =
          volumes[index] ?? SOUNDSCAPE_CONFIG.volumes.phaseTones

        // Schedule note with stagger
        const triggerTime = Tone.now() + index * stagger
        synth.triggerAttackRelease(note, 0.8, triggerTime)
      })
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const synth of synthsRef.current) {
        synth.dispose()
      }
      synthsRef.current = []
      delayRef.current?.dispose()
      reverbRef.current?.dispose()
      isInitializedRef.current = false
    }
  }, [])

  return {
    inhale: () => playPhase('inhale'),
    exhale: () => playPhase('exhale'),
    hold: () => playPhase('holdIn'),
    complete: () => playPhase('complete'),
  }
}
