// Ambient soundscape inspired by Max Richter & Brian Eno
// Richter: Minimalist, melancholic, string-like pads with slow evolution
// Eno: Generative, drifting layers, long reverbs, FM textures

export type MilestoneMinutes = 0 | 3 | 5 | 10 | 15 | 20 | 30

// Use Dorian mode for that Richter-esque melancholic but hopeful quality
// C Dorian: C D Eb F G A Bb
const SCALE = {
  root: 'C',
  mode: 'dorian',
  notes: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'] as const,
}

export const SOUNDSCAPE_CONFIG = {
  scale: SCALE,

  // === DRONE LAYERS ===
  // Multiple voice types for rich, evolving texture
  droneLayers: {
    // Layer 0: Deep sub bass - felt more than heard
    sub: {
      note: 'C1',
      type: 'sine' as const,
      volume: -18,
      envelope: { attack: 6, decay: 1, sustain: 0.9, release: 10 },
    },
    // Layer 1: Foundation - warm pad
    foundation: {
      note: 'C2',
      type: 'triangle' as const,
      volume: -12,
      envelope: { attack: 5, decay: 1, sustain: 0.8, release: 8 },
    },
    // Layer 2: Fifth - openness (Eb for minor color, or G for open)
    fifth: {
      note: 'G2',
      type: 'sine' as const,
      volume: -15,
      envelope: { attack: 6, decay: 1, sustain: 0.7, release: 9 },
    },
    // Layer 3: Minor third - Richter's melancholy
    minorThird: {
      note: 'Eb2',
      type: 'triangle' as const,
      volume: -18,
      envelope: { attack: 7, decay: 1, sustain: 0.6, release: 10 },
    },
    // Layer 4: Seventh - jazz/ambient color (Bb for dorian)
    seventh: {
      note: 'Bb2',
      type: 'sine' as const,
      volume: -20,
      envelope: { attack: 8, decay: 1, sustain: 0.5, release: 12 },
    },
    // Layer 5: High octave - brightness, transcendence
    highOctave: {
      note: 'C4',
      type: 'sine' as const,
      volume: -22,
      envelope: { attack: 10, decay: 2, sustain: 0.4, release: 15 },
    },
    // Layer 6: Ninth/Second - Eno-esque tension
    ninth: {
      note: 'D4',
      type: 'sine' as const,
      volume: -24,
      envelope: { attack: 12, decay: 2, sustain: 0.3, release: 18 },
    },
  },

  // === MILESTONE PROGRESSION ===
  // Gradual layering like Richter's "Sleep" - starts minimal, slowly builds
  milestones: {
    0: {
      layers: ['foundation'],
      effects: { reverbWet: 0.4, delayWet: 0.1, filterFreq: 800 },
    },
    3: {
      layers: ['foundation', 'fifth'],
      effects: { reverbWet: 0.5, delayWet: 0.15, filterFreq: 1000 },
    },
    5: {
      layers: ['sub', 'foundation', 'fifth'],
      effects: { reverbWet: 0.55, delayWet: 0.2, filterFreq: 1200 },
    },
    10: {
      layers: ['sub', 'foundation', 'fifth', 'minorThird'],
      effects: { reverbWet: 0.6, delayWet: 0.25, filterFreq: 1500 },
    },
    15: {
      layers: ['sub', 'foundation', 'fifth', 'minorThird', 'seventh'],
      effects: { reverbWet: 0.65, delayWet: 0.3, filterFreq: 2000 },
    },
    20: {
      layers: ['sub', 'foundation', 'fifth', 'minorThird', 'seventh', 'highOctave'],
      effects: { reverbWet: 0.7, delayWet: 0.35, filterFreq: 3000 },
    },
    30: {
      layers: ['sub', 'foundation', 'fifth', 'minorThird', 'seventh', 'highOctave', 'ninth'],
      effects: { reverbWet: 0.75, delayWet: 0.4, filterFreq: 4000 },
    },
  } as const,

  // === SHIMMER NOTES ===
  // Eno-style generative high notes that occasionally drift in
  shimmer: {
    enabled: true,
    notes: ['C5', 'D5', 'Eb5', 'G5', 'A5', 'C6'] as const,
    minInterval: 8000, // Minimum ms between shimmers
    maxInterval: 25000, // Maximum ms between shimmers
    volume: -26,
    duration: 3,
    envelope: { attack: 1.5, decay: 0.5, sustain: 0.3, release: 2 },
  },

  // === PHASE TONES ===
  // Musical cues that harmonize with the dorian soundscape
  phaseTones: {
    inhale: {
      notes: ['G4', 'C5'], // Fifth + octave - rising, aspirational
      volumes: [-8, -14],
      delay: 0.05, // Slight stagger for richness
    },
    exhale: {
      notes: ['C4', 'G3'], // Root + fifth below - grounding
      volumes: [-8, -14],
      delay: 0.05,
    },
    holdIn: {
      notes: ['Eb4'], // Minor third - contemplative
      volumes: [-10],
      delay: 0,
    },
    holdOut: {
      notes: ['Bb3'], // Seventh - suspended, waiting
      volumes: [-10],
      delay: 0,
    },
    complete: {
      notes: ['C4', 'Eb4', 'G4', 'C5'], // Full minor chord ascending
      volumes: [-8, -10, -12, -14],
      delay: 0.15, // Arpeggiated
    },
  },

  // Phase tone envelope - gentle bells/chimes quality
  phaseEnvelope: {
    attack: 0.08,
    decay: 0.3,
    sustain: 0.2,
    release: 1.2,
  },

  // === EFFECTS ===
  effects: {
    // Main reverb - large hall/cathedral
    reverb: {
      decay: 12, // Very long tail like Richter
      wet: 0.5,
      preDelay: 0.03,
    },
    // Tape-style delay - Eno influence
    delay: {
      delayTime: 0.666, // Dotted quarter feel
      feedback: 0.35,
      wet: 0.2,
    },
    // Second delay for complexity
    delay2: {
      delayTime: 1.2, // Longer, offset rhythm
      feedback: 0.25,
      wet: 0.15,
    },
    // Slow filter sweep - breathing quality
    filter: {
      type: 'lowpass' as const,
      frequency: 1200,
      Q: 1,
    },
    // LFO for filter modulation
    filterLFO: {
      frequency: 0.05, // Very slow - 20 second cycle
      depth: 400, // Modulation amount in Hz
    },
    // Chorus for width (subtle)
    chorus: {
      frequency: 0.3,
      depth: 0.3,
      wet: 0.15,
    },
    // Compressor to glue everything
    compressor: {
      threshold: -24,
      ratio: 3,
      attack: 0.1,
      release: 0.3,
    },
  },

  // === VOLUMES ===
  volumes: {
    master: -6,
    drone: -9,
    shimmer: -18,
    phaseTones: -6,
  },

  // === TRANSITIONS ===
  transitions: {
    fadeIn: 6, // Slow fade in
    fadeOut: 10, // Even slower fade out
    milestone: 12, // Very gradual layer additions
    shimmerFade: 2,
  },
} as const

// Type helpers
export type DroneLayerKey = keyof typeof SOUNDSCAPE_CONFIG.droneLayers
export type MilestoneConfig = (typeof SOUNDSCAPE_CONFIG.milestones)[MilestoneMinutes]
export type PhaseType = keyof typeof SOUNDSCAPE_CONFIG.phaseTones
