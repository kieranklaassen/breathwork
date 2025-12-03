'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

import {
  type DroneLayerKey,
  type MilestoneMinutes,
  SOUNDSCAPE_CONFIG,
} from '~/libs/soundscape-config'

/**
 * Ambient soundscape hook inspired by Max Richter & Brian Eno
 *
 * Features:
 * - Multiple drone layers with different timbres
 * - Gradual harmonic evolution over time
 * - Generative shimmer notes (Eno-style)
 * - Complex effects chain with modulated filter
 * - Dynamic effects parameters per milestone
 */
export function useSoundscape() {
  const [milestone, setMilestone] = useState<MilestoneMinutes>(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Audio node refs
  const droneSynthsRef = useRef<Map<DroneLayerKey, Tone.Synth>>(new Map())
  const shimmerSynthRef = useRef<Tone.Synth | null>(null)
  const shimmerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Effects chain refs
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const delay1Ref = useRef<Tone.FeedbackDelay | null>(null)
  const delay2Ref = useRef<Tone.FeedbackDelay | null>(null)
  const filterRef = useRef<Tone.Filter | null>(null)
  const filterLFORef = useRef<Tone.LFO | null>(null)
  const chorusRef = useRef<Tone.Chorus | null>(null)
  const compressorRef = useRef<Tone.Compressor | null>(null)
  const masterGainRef = useRef<Tone.Gain | null>(null)

  // Initialize the full effects chain
  const initialize = useCallback(async () => {
    if (isInitialized) return

    try {
      await Tone.start()

      const { effects, volumes } = SOUNDSCAPE_CONFIG

      // Create master gain
      masterGainRef.current = new Tone.Gain(
        Tone.dbToGain(volumes.master)
      ).toDestination()

      // Create compressor (at end of chain, before master)
      compressorRef.current = new Tone.Compressor({
        threshold: effects.compressor.threshold,
        ratio: effects.compressor.ratio,
        attack: effects.compressor.attack,
        release: effects.compressor.release,
      }).connect(masterGainRef.current)

      // Create reverb (long decay for Richter-style space)
      reverbRef.current = new Tone.Reverb({
        decay: effects.reverb.decay,
        wet: effects.reverb.wet,
        preDelay: effects.reverb.preDelay,
      })
      await reverbRef.current.generate()
      reverbRef.current.connect(compressorRef.current)

      // Create chorus (subtle width)
      chorusRef.current = new Tone.Chorus({
        frequency: effects.chorus.frequency,
        depth: effects.chorus.depth,
        wet: effects.chorus.wet,
      })
        .connect(reverbRef.current)
        .start()

      // Create second delay (longer, offset)
      delay2Ref.current = new Tone.FeedbackDelay({
        delayTime: effects.delay2.delayTime,
        feedback: effects.delay2.feedback,
        wet: effects.delay2.wet,
      }).connect(chorusRef.current)

      // Create first delay (tape-style)
      delay1Ref.current = new Tone.FeedbackDelay({
        delayTime: effects.delay.delayTime,
        feedback: effects.delay.feedback,
        wet: effects.delay.wet,
      }).connect(delay2Ref.current)

      // Create filter with LFO modulation
      filterRef.current = new Tone.Filter({
        type: effects.filter.type,
        frequency: effects.filter.frequency,
        Q: effects.filter.Q,
      }).connect(delay1Ref.current)

      // Create LFO for filter modulation (slow breathing movement)
      filterLFORef.current = new Tone.LFO({
        frequency: effects.filterLFO.frequency,
        min: effects.filter.frequency - effects.filterLFO.depth,
        max: effects.filter.frequency + effects.filterLFO.depth,
      })
      filterLFORef.current.connect(filterRef.current.frequency)

      // Create shimmer synth (for generative high notes)
      shimmerSynthRef.current = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: SOUNDSCAPE_CONFIG.shimmer.envelope,
        volume: SOUNDSCAPE_CONFIG.shimmer.volume,
      }).connect(delay1Ref.current)

      setIsInitialized(true)
    } catch (error) {
      console.warn('Soundscape initialization failed:', error)
    }
  }, [isInitialized])

  // Schedule random shimmer notes (Eno-style generative element)
  const scheduleShimmer = useCallback(() => {
    if (!(isPlaying && shimmerSynthRef.current)) return

    const { shimmer } = SOUNDSCAPE_CONFIG
    if (!shimmer.enabled) return

    // Pick random note from scale
    const note = shimmer.notes[Math.floor(Math.random() * shimmer.notes.length)]

    // Play the shimmer
    shimmerSynthRef.current.triggerAttackRelease(note, shimmer.duration)

    // Schedule next shimmer at random interval
    const nextInterval =
      shimmer.minInterval +
      Math.random() * (shimmer.maxInterval - shimmer.minInterval)

    shimmerTimeoutRef.current = setTimeout(scheduleShimmer, nextInterval)
  }, [isPlaying])

  // Start the soundscape
  const start = useCallback(async () => {
    if (!isInitialized) {
      await initialize()
    }

    if (isPlaying || !filterRef.current) return

    // Start filter LFO
    filterLFORef.current?.start()

    // Get initial milestone config
    const config = SOUNDSCAPE_CONFIG.milestones[0]

    // Create and start initial drone layers
    for (const layerKey of config.layers) {
      const layerConfig =
        SOUNDSCAPE_CONFIG.droneLayers[layerKey as DroneLayerKey]
      if (!layerConfig) continue

      const synth = new Tone.Synth({
        oscillator: { type: layerConfig.type },
        envelope: layerConfig.envelope,
        volume: -60, // Start silent
      }).connect(filterRef.current)

      synth.triggerAttack(layerConfig.note)
      synth.volume.rampTo(
        layerConfig.volume,
        SOUNDSCAPE_CONFIG.transitions.fadeIn
      )

      droneSynthsRef.current.set(layerKey as DroneLayerKey, synth)
    }

    setMilestone(0)
    setIsPlaying(true)

    // Start shimmer after initial fade in
    setTimeout(() => {
      scheduleShimmer()
    }, SOUNDSCAPE_CONFIG.transitions.fadeIn * 1000)
  }, [isInitialized, isPlaying, initialize, scheduleShimmer])

  // Evolve to a new milestone
  const evolve = useCallback(
    (newMilestone: MilestoneMinutes) => {
      if (!(isPlaying && filterRef.current)) return
      if (newMilestone <= milestone) return

      const config = SOUNDSCAPE_CONFIG.milestones[newMilestone]
      const currentLayers = Array.from(droneSynthsRef.current.keys())

      // Add new layers
      for (const layerKey of config.layers) {
        if (currentLayers.includes(layerKey as DroneLayerKey)) continue

        const layerConfig =
          SOUNDSCAPE_CONFIG.droneLayers[layerKey as DroneLayerKey]
        if (!layerConfig) continue

        const synth = new Tone.Synth({
          oscillator: { type: layerConfig.type },
          envelope: layerConfig.envelope,
          volume: -60,
        }).connect(filterRef.current)

        synth.triggerAttack(layerConfig.note)
        synth.volume.rampTo(
          layerConfig.volume,
          SOUNDSCAPE_CONFIG.transitions.milestone
        )

        droneSynthsRef.current.set(layerKey as DroneLayerKey, synth)
      }

      // Update effects parameters for this milestone
      if (reverbRef.current) {
        reverbRef.current.wet.rampTo(
          config.effects.reverbWet,
          SOUNDSCAPE_CONFIG.transitions.milestone
        )
      }
      if (delay1Ref.current) {
        delay1Ref.current.wet.rampTo(
          config.effects.delayWet,
          SOUNDSCAPE_CONFIG.transitions.milestone
        )
      }
      if (filterRef.current && filterLFORef.current) {
        // Update filter LFO range
        const depth = SOUNDSCAPE_CONFIG.effects.filterLFO.depth
        filterLFORef.current.min = config.effects.filterFreq - depth
        filterLFORef.current.max = config.effects.filterFreq + depth
      }

      setMilestone(newMilestone)
    },
    [isPlaying, milestone]
  )

  // Stop the soundscape
  const stop = useCallback(() => {
    if (!isPlaying) return

    // Clear shimmer timeout
    if (shimmerTimeoutRef.current) {
      clearTimeout(shimmerTimeoutRef.current)
      shimmerTimeoutRef.current = null
    }

    // Stop filter LFO
    filterLFORef.current?.stop()

    // Fade out all drone synths
    const fadeOut = SOUNDSCAPE_CONFIG.transitions.fadeOut
    droneSynthsRef.current.forEach((synth) => {
      synth.volume.rampTo(-60, fadeOut)
    })

    // Cleanup after fade
    setTimeout(() => {
      droneSynthsRef.current.forEach((synth) => {
        synth.triggerRelease()
        synth.dispose()
      })
      droneSynthsRef.current.clear()
      setMilestone(0)
      setIsPlaying(false)
    }, fadeOut * 1000)
  }, [isPlaying])

  // Resume at a specific milestone
  const resumeAtMilestone = useCallback(
    async (targetMilestone: MilestoneMinutes) => {
      if (isPlaying) return

      await start()

      // Evolve through milestones to reach target
      const milestones: MilestoneMinutes[] = [0, 3, 5, 10, 15, 20, 30]
      let delay = 100

      for (const ms of milestones) {
        if (ms > 0 && ms <= targetMilestone) {
          setTimeout(() => evolve(ms), delay)
          delay += 150
        }
      }
    },
    [isPlaying, start, evolve]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear shimmer timeout
      if (shimmerTimeoutRef.current) {
        clearTimeout(shimmerTimeoutRef.current)
      }

      // Dispose synths
      droneSynthsRef.current.forEach((synth) => {
        synth.triggerRelease()
        synth.dispose()
      })
      droneSynthsRef.current.clear()
      shimmerSynthRef.current?.dispose()

      // Dispose effects
      filterLFORef.current?.dispose()
      filterRef.current?.dispose()
      delay1Ref.current?.dispose()
      delay2Ref.current?.dispose()
      chorusRef.current?.dispose()
      reverbRef.current?.dispose()
      compressorRef.current?.dispose()
      masterGainRef.current?.dispose()
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
