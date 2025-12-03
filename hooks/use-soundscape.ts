'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

import {
  type MilestoneMinutes,
  SOUNDSCAPE_CONFIG,
} from '~/libs/soundscape-config'

/**
 * Hook for managing the ambient drone soundscape layer
 * Handles initialization, milestone-based evolution, and cleanup
 */
export function useSoundscape() {
  const [milestone, setMilestone] = useState<MilestoneMinutes>(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Audio node refs - persist across renders
  const droneSynthsRef = useRef<Tone.Synth[]>([])
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const delayRef = useRef<Tone.PingPongDelay | null>(null)
  const autoFilterRef = useRef<Tone.AutoFilter | null>(null)

  // Initialize effects chain (once per app lifecycle)
  const initialize = useCallback(async () => {
    if (isInitialized) return

    try {
      // Start audio context (requires user gesture)
      await Tone.start()

      // Create reverb for spaciousness
      reverbRef.current = new Tone.Reverb({
        decay: SOUNDSCAPE_CONFIG.effects.reverb.decay,
        wet: SOUNDSCAPE_CONFIG.effects.reverb.wet,
      })
      await reverbRef.current.generate()

      // Create ping-pong delay for depth
      delayRef.current = new Tone.PingPongDelay({
        delayTime: SOUNDSCAPE_CONFIG.effects.delay.delayTime,
        feedback: SOUNDSCAPE_CONFIG.effects.delay.feedback,
        wet: SOUNDSCAPE_CONFIG.effects.delay.wet,
      })

      // Create auto filter for subtle movement (activated at 10+ min milestone)
      autoFilterRef.current = new Tone.AutoFilter({
        frequency: SOUNDSCAPE_CONFIG.effects.autoFilter.frequency,
        depth: SOUNDSCAPE_CONFIG.effects.autoFilter.depth,
        wet: SOUNDSCAPE_CONFIG.effects.autoFilter.wet,
      })

      // Chain: delay → autoFilter → reverb → destination
      delayRef.current.connect(autoFilterRef.current)
      autoFilterRef.current.connect(reverbRef.current)
      reverbRef.current.toDestination()

      setIsInitialized(true)
    } catch (error) {
      console.warn('Soundscape initialization failed:', error)
    }
  }, [isInitialized])

  // Start the ambient drone at milestone 0
  const start = useCallback(async () => {
    if (!isInitialized) {
      await initialize()
    }

    if (isPlaying || !delayRef.current) return

    // Create root drone synth
    const rootSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: SOUNDSCAPE_CONFIG.droneEnvelope,
      volume: -60, // Start silent for fade in
    }).connect(delayRef.current)

    // Trigger and fade in
    rootSynth.triggerAttack(SOUNDSCAPE_CONFIG.root)
    rootSynth.volume.rampTo(
      SOUNDSCAPE_CONFIG.volumes.droneLayers[0],
      SOUNDSCAPE_CONFIG.transitions.fadeIn
    )

    droneSynthsRef.current = [rootSynth]
    setMilestone(0)
    setIsPlaying(true)
  }, [isInitialized, isPlaying, initialize])

  // Add harmonic layers at milestone
  const evolve = useCallback(
    (newMilestone: 5 | 10 | 20) => {
      if (!(isPlaying && delayRef.current)) return
      if (newMilestone <= milestone) return // Don't go backwards

      const layers = SOUNDSCAPE_CONFIG.milestones[newMilestone].layers
      const currentLayerCount = droneSynthsRef.current.length

      // Add new layers with smooth fade in
      for (let i = currentLayerCount; i < layers.length; i++) {
        const note = layers[i]
        // Alternate between sine and triangle for timbral variety
        const oscillatorType = i % 2 === 0 ? 'sine' : 'triangle'

        const synth = new Tone.Synth({
          oscillator: { type: oscillatorType },
          envelope: SOUNDSCAPE_CONFIG.droneEnvelope,
          volume: -60, // Start silent
        }).connect(delayRef.current)

        synth.triggerAttack(note)
        // Smooth fade in over milestone transition duration
        synth.volume.rampTo(
          SOUNDSCAPE_CONFIG.volumes.droneLayers[i],
          SOUNDSCAPE_CONFIG.transitions.milestone
        )

        droneSynthsRef.current.push(synth)
      }

      // Activate auto filter at 10+ minute milestone for subtle movement
      if (newMilestone >= 10 && autoFilterRef.current) {
        autoFilterRef.current.start()
      }

      setMilestone(newMilestone)
    },
    [isPlaying, milestone]
  )

  // Stop all audio with graceful fade out
  const stop = useCallback(() => {
    if (!isPlaying) return

    // Fade out all drone synths
    droneSynthsRef.current.forEach((synth) => {
      synth.volume.rampTo(-60, SOUNDSCAPE_CONFIG.transitions.fadeOut)
    })

    // Stop auto filter
    autoFilterRef.current?.stop()

    // Cleanup after fade completes
    setTimeout(() => {
      droneSynthsRef.current.forEach((synth) => {
        synth.triggerRelease()
        synth.dispose()
      })
      droneSynthsRef.current = []
      setMilestone(0)
      setIsPlaying(false)
    }, SOUNDSCAPE_CONFIG.transitions.fadeOut * 1000)
  }, [isPlaying])

  // Resume at a specific milestone (for audio toggle mid-session)
  const resumeAtMilestone = useCallback(
    async (targetMilestone: MilestoneMinutes) => {
      if (isPlaying) return

      await start()

      // Evolve to target milestone if needed
      if (targetMilestone >= 5) {
        // Small delay to let initial drone establish
        setTimeout(() => {
          if (targetMilestone >= 5) evolve(5)
          if (targetMilestone >= 10) setTimeout(() => evolve(10), 100)
          if (targetMilestone >= 20) setTimeout(() => evolve(20), 200)
        }, 100)
      }
    },
    [isPlaying, start, evolve]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Dispose all synths
      droneSynthsRef.current.forEach((synth) => {
        synth.triggerRelease()
        synth.dispose()
      })
      droneSynthsRef.current = []

      // Dispose effects
      reverbRef.current?.dispose()
      delayRef.current?.dispose()
      autoFilterRef.current?.dispose()
    }
  }, [])

  return {
    initialize,
    start,
    stop,
    evolve,
    resumeAtMilestone,
    milestone,
    isInitialized,
    isPlaying,
  }
}
