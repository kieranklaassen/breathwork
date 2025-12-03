// Musical constants for zen/bamboo aesthetic breathing soundscape
// All frequencies based on C2 root (65.41 Hz) with just intonation ratios

export type MilestoneMinutes = 0 | 5 | 10 | 20

export const SOUNDSCAPE_CONFIG = {
  // Root note for entire soundscape
  root: 'C2', // 65.41 Hz - low, grounding foundation

  // Phase tones (harmonize with drone)
  phaseTones: {
    inhale: 'G2', // Perfect 5th - rising, aspirational
    exhale: 'C2', // Root - grounding, release
    holdIn: 'E2', // Major 3rd - warm, stable
    holdOut: 'E2', // Major 3rd - warm, stable
    complete: ['C3', 'G3'] as const, // Octave rise - celebratory
  },

  // Milestone layers - additive harmony progression
  // Each milestone adds consonant intervals for richer sound
  milestones: {
    0: { layers: ['C2'] }, // Root only - grounding
    5: { layers: ['C2', 'G2'] }, // Add 5th - openness
    10: { layers: ['C2', 'G2', 'E2'] }, // Add 3rd - full triad
    20: { layers: ['C2', 'G2', 'E2', 'C3'] }, // Add octave - transcendence
  } as const,

  // Drone synth envelope - very slow for smooth ambient layer
  droneEnvelope: {
    attack: 4, // 4 second fade in
    decay: 0.5,
    sustain: 0.8, // Sustain at 80%
    release: 6, // 6 second fade out
  },

  // Phase tone envelope - shorter, more percussive but still gentle
  phaseEnvelope: {
    attack: 0.1,
    decay: 0.2,
    sustain: 0.3,
    release: 0.5,
  },

  // Effects settings for zen/ambient aesthetic
  effects: {
    reverb: {
      decay: 8, // Long tail for spaciousness
      wet: 0.5, // 50% wet/dry mix
    },
    delay: {
      delayTime: 0.375, // Dotted eighth note feel
      feedback: 0.2, // Subtle repetition
      wet: 0.15, // Light delay presence
    },
    autoFilter: {
      frequency: 0.1, // Very slow sweep (10 second cycle)
      depth: 0.2, // Subtle modulation
      wet: 0.1, // Light effect
    },
  },

  // Volume levels (dB) - decreasing for each layer to prevent buildup
  volumes: {
    droneLayers: [-12, -15, -18, -21] as const, // Each layer quieter
    phaseTones: -6, // Phase tones audible above drone
    master: -3, // Headroom for mixing
  },

  // Transition durations (seconds)
  transitions: {
    fadeIn: 4, // Initial drone fade in
    fadeOut: 6, // Session end fade out
    milestone: 8, // Crossfade duration when adding layers
  },
} as const

// Type helpers
export type PhaseType = keyof typeof SOUNDSCAPE_CONFIG.phaseTones
export type DroneLayer = (typeof SOUNDSCAPE_CONFIG.milestones)[MilestoneMinutes]['layers'][number]
