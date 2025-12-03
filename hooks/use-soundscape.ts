'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

import {
  type DroneLayerKey,
  type MilestoneMinutes,
  type ProgressionStage,
  SOUNDSCAPE_CONFIG,
} from '~/libs/soundscape-config'

// Helper to transpose a note by semitones
const transposeNote = (note: string, semitones: number): string => {
  const noteNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
  const match = note.match(/^([A-G][#b]?)(\d+)$/)
  if (!match) return note

  const [, noteName, octaveStr] = match
  const octave = Number.parseInt(octaveStr, 10)

  // Find current note index
  let noteIndex = noteNames.indexOf(noteName)
  if (noteIndex === -1) {
    // Handle enharmonic equivalents
    if (noteName === 'Db') noteIndex = 1
    else if (noteName === 'D#') noteIndex = 3
    else if (noteName === 'Gb') noteIndex = 6
    else if (noteName === 'G#') noteIndex = 8
    else if (noteName === 'A#') noteIndex = 10
    else return note
  }

  // Calculate new position
  const newPosition = noteIndex + semitones
  const newNoteIndex = ((newPosition % 12) + 12) % 12
  const octaveShift = Math.floor(newPosition / 12)

  return `${noteNames[newNoteIndex]}${octave + octaveShift}`
}

/**
 * Lush Ambient Soundscape Hook
 *
 * Inspired by Brian Eno's "Thursday Afternoon" and "Music for Airports"
 * - Pure sine waves for warm, organic tones
 * - Cathedral-like reverb (15s decay)
 * - Dual delay lines for tape loop texture
 * - Slow LFO filter modulation for breathing quality
 * - Subtle tremolo for Eno's "constant motion"
 * - Generative shimmer notes
 */
export function useSoundscape() {
  const [milestone, setMilestone] = useState<MilestoneMinutes>(0)
  const [progressionStage, setProgressionStage] = useState<ProgressionStage>(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Track current transposition for cycle progressions
  const currentTransposeRef = useRef(0)

  // Drone synths - one per layer
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
  const tremoloRef = useRef<Tone.Tremolo | null>(null)
  const compressorRef = useRef<Tone.Compressor | null>(null)
  const masterGainRef = useRef<Tone.Gain | null>(null)

  // Initialize the full cathedral-like effects chain
  const initialize = useCallback(async () => {
    if (isInitialized) return

    try {
      await Tone.start()

      const { effects, volumes } = SOUNDSCAPE_CONFIG

      // Master gain (end of chain)
      masterGainRef.current = new Tone.Gain(
        Tone.dbToGain(volumes.master)
      ).toDestination()

      // Compressor - gentle glue
      compressorRef.current = new Tone.Compressor({
        threshold: effects.compressor.threshold,
        ratio: effects.compressor.ratio,
        attack: effects.compressor.attack,
        release: effects.compressor.release,
      }).connect(masterGainRef.current)

      // Reverb - cathedral-like, very long decay
      // Inspired by Eno's use of EMT 250 / Valhalla VintageVerb
      reverbRef.current = new Tone.Reverb({
        decay: effects.reverb.decay,
        wet: effects.reverb.wet,
        preDelay: effects.reverb.preDelay,
      })
      await reverbRef.current.generate()
      reverbRef.current.connect(compressorRef.current)

      // Tremolo - Eno's "constant motion" technique
      // Very slow, subtle amplitude modulation
      tremoloRef.current = new Tone.Tremolo({
        frequency: effects.tremolo.frequency,
        depth: effects.tremolo.depth,
      })
        .connect(reverbRef.current)
        .start()

      // Chorus - adds width and shimmer
      chorusRef.current = new Tone.Chorus({
        frequency: effects.chorus.frequency,
        depth: effects.chorus.depth,
        wet: effects.chorus.wet,
      })
        .connect(tremoloRef.current)
        .start()

      // Second delay - longer interval for depth
      delay2Ref.current = new Tone.FeedbackDelay({
        delayTime: effects.delay2.delayTime,
        feedback: effects.delay2.feedback,
        wet: effects.delay2.wet,
      }).connect(chorusRef.current)

      // Primary delay - Eno's tape loop style
      delay1Ref.current = new Tone.FeedbackDelay({
        delayTime: effects.delay.delayTime,
        feedback: effects.delay.feedback,
        wet: effects.delay.wet,
      }).connect(delay2Ref.current)

      // Low-pass filter - keeps everything warm
      filterRef.current = new Tone.Filter({
        type: effects.filter.type,
        frequency: effects.filter.frequency,
        Q: effects.filter.Q,
      }).connect(delay1Ref.current)

      // Filter LFO - very slow breathing modulation
      filterLFORef.current = new Tone.LFO({
        frequency: effects.filterLFO.frequency,
        min: effects.filter.frequency - effects.filterLFO.depth,
        max: effects.filter.frequency + effects.filterLFO.depth,
      })
      filterLFORef.current.connect(filterRef.current.frequency)

      // Shimmer synth for generative high notes
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

  // Schedule random shimmer notes - Eno's generative approach
  // Like the bells drifting in "Music for Airports"
  const scheduleShimmer = useCallback(() => {
    if (!(isPlaying && shimmerSynthRef.current)) return

    const { shimmer } = SOUNDSCAPE_CONFIG
    if (!shimmer.enabled) return

    // Pick random note from scale
    const note = shimmer.notes[Math.floor(Math.random() * shimmer.notes.length)]

    // Play the shimmer with long duration
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

    // Start filter LFO for breathing movement
    filterLFORef.current?.start()

    // Get initial milestone config
    const config = SOUNDSCAPE_CONFIG.milestones[0]

    // Create and start initial drone layers with pure sine waves
    for (const layerKey of config.layers) {
      const layerConfig =
        SOUNDSCAPE_CONFIG.droneLayers[layerKey as DroneLayerKey]
      if (!layerConfig) continue

      const synth = new Tone.Synth({
        oscillator: { type: 'sine' }, // Pure sine for warm, organic tone
        envelope: layerConfig.envelope,
        volume: -60, // Start silent
      }).connect(filterRef.current)

      synth.triggerAttack(layerConfig.note)
      synth.volume.rampTo(layerConfig.volume, SOUNDSCAPE_CONFIG.transitions.fadeIn)

      droneSynthsRef.current.set(layerKey as DroneLayerKey, synth)
    }

    setMilestone(0)
    setIsPlaying(true)

    // Start shimmer after initial fade in
    setTimeout(() => {
      scheduleShimmer()
    }, SOUNDSCAPE_CONFIG.transitions.fadeIn * 1000)
  }, [isInitialized, isPlaying, initialize, scheduleShimmer])

  // Evolve to a new milestone - adds layers and opens filter
  const evolve = useCallback(
    (newMilestone: MilestoneMinutes) => {
      if (!(isPlaying && filterRef.current)) return
      if (newMilestone <= milestone) return

      const config = SOUNDSCAPE_CONFIG.milestones[newMilestone]
      const currentLayers = Array.from(droneSynthsRef.current.keys())
      const transitionTime = SOUNDSCAPE_CONFIG.transitions.milestone

      // Add new layers with smooth fade in
      for (const layerKey of config.layers) {
        if (currentLayers.includes(layerKey as DroneLayerKey)) continue

        const layerConfig =
          SOUNDSCAPE_CONFIG.droneLayers[layerKey as DroneLayerKey]
        if (!layerConfig) continue

        const synth = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: layerConfig.envelope,
          volume: -60,
        }).connect(filterRef.current)

        synth.triggerAttack(layerConfig.note)
        synth.volume.rampTo(layerConfig.volume, transitionTime)

        droneSynthsRef.current.set(layerKey as DroneLayerKey, synth)
      }

      // Update effects parameters - opens up the sound
      if (reverbRef.current) {
        reverbRef.current.wet.rampTo(config.effects.reverbWet, transitionTime)
      }
      if (delay1Ref.current) {
        delay1Ref.current.wet.rampTo(config.effects.delayWet, transitionTime)
      }
      if (filterRef.current && filterLFORef.current) {
        // Update filter LFO range - opens up as session progresses
        const depth = SOUNDSCAPE_CONFIG.effects.filterLFO.depth
        filterLFORef.current.min = config.effects.filterFreq - depth
        filterLFORef.current.max = config.effects.filterFreq + depth
      }

      setMilestone(newMilestone)
    },
    [isPlaying, milestone]
  )

  // Progress based on cycle count - creates musical movement
  // Called when cycle count crosses a progression threshold
  const progressCycle = useCallback(
    (cycleCount: number) => {
      if (!(isPlaying && filterRef.current)) return

      const { cycleProgressions, transitions, droneLayers, effects } = SOUNDSCAPE_CONFIG
      const { cyclesPerProgression, rootProgression, layerActivity, effectIntensity } = cycleProgressions

      // Calculate which progression stage we should be at
      const progressionIndex = Math.floor(cycleCount / cyclesPerProgression)
      const newStage = (progressionIndex % rootProgression.length) as ProgressionStage

      // Only progress if we've moved to a new stage
      if (newStage === progressionStage) return

      const transitionTime = transitions.cycleProgression
      const progression = rootProgression[newStage]
      const newLayers = layerActivity[newStage]
      const intensity = effectIntensity[newStage]

      // Calculate semitone shift from current position
      const semitoneShift = progression.semitones - currentTransposeRef.current
      currentTransposeRef.current = progression.semitones

      // Fade out layers not in new configuration
      const currentLayers = Array.from(droneSynthsRef.current.keys())
      for (const layerKey of currentLayers) {
        if (!newLayers.includes(layerKey)) {
          const synth = droneSynthsRef.current.get(layerKey)
          if (synth) {
            synth.volume.rampTo(-60, transitionTime)
            // Dispose after fade
            setTimeout(() => {
              synth.triggerRelease()
              synth.dispose()
              droneSynthsRef.current.delete(layerKey)
            }, transitionTime * 1000)
          }
        }
      }

      // Update existing layers with transposed notes
      for (const layerKey of currentLayers) {
        if (newLayers.includes(layerKey)) {
          const synth = droneSynthsRef.current.get(layerKey)
          if (synth && semitoneShift !== 0) {
            const layerConfig = droneLayers[layerKey]
            const newNote = transposeNote(layerConfig.note, progression.semitones)
            synth.setNote(newNote)
          }
        }
      }

      // Add new layers that aren't currently playing
      for (const layerKey of newLayers) {
        if (!droneSynthsRef.current.has(layerKey as DroneLayerKey)) {
          const layerConfig = droneLayers[layerKey as DroneLayerKey]
          if (!layerConfig) continue

          const transposedNote = transposeNote(layerConfig.note, progression.semitones)
          const synth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: layerConfig.envelope,
            volume: -60,
          }).connect(filterRef.current)

          synth.triggerAttack(transposedNote)
          synth.volume.rampTo(layerConfig.volume, transitionTime)

          droneSynthsRef.current.set(layerKey as DroneLayerKey, synth)
        }
      }

      // Update effects based on intensity multipliers
      if (reverbRef.current) {
        const baseReverb = effects.reverb.wet
        reverbRef.current.wet.rampTo(baseReverb * intensity.reverb, transitionTime)
      }
      if (delay1Ref.current) {
        const baseDelay = effects.delay.wet
        delay1Ref.current.wet.rampTo(baseDelay * intensity.delay, transitionTime)
      }
      if (filterRef.current && filterLFORef.current) {
        const baseFreq = effects.filter.frequency
        const depth = effects.filterLFO.depth
        const newFreq = baseFreq * intensity.filter
        filterLFORef.current.min = newFreq - depth
        filterLFORef.current.max = newFreq + depth
      }

      setProgressionStage(newStage)
    },
    [isPlaying, progressionStage]
  )

  // Stop with long fade out
  const stop = useCallback(() => {
    if (!isPlaying) return

    // Clear shimmer
    if (shimmerTimeoutRef.current) {
      clearTimeout(shimmerTimeoutRef.current)
      shimmerTimeoutRef.current = null
    }

    // Stop LFO
    filterLFORef.current?.stop()

    // Long fade out - 12 seconds
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
      currentTransposeRef.current = 0
      setMilestone(0)
      setProgressionStage(0)
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
      if (shimmerTimeoutRef.current) {
        clearTimeout(shimmerTimeoutRef.current)
      }

      droneSynthsRef.current.forEach((synth) => {
        synth.triggerRelease()
        synth.dispose()
      })
      droneSynthsRef.current.clear()
      shimmerSynthRef.current?.dispose()

      filterLFORef.current?.dispose()
      filterRef.current?.dispose()
      delay1Ref.current?.dispose()
      delay2Ref.current?.dispose()
      chorusRef.current?.dispose()
      tremoloRef.current?.dispose()
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
    progressCycle,
    resumeAtMilestone,
    milestone,
    progressionStage,
    isInitialized,
    isPlaying,
  }
}
