// Lush Ambient Soundscape - Inspired by Brian Eno & Max Richter
// Using pure sine waves, long envelopes, and cathedral-like reverb
// Reference: Eno's "Thursday Afternoon", "Music for Airports", Richter's "Sleep"

export type MilestoneMinutes = 0 | 3 | 5 | 10 | 15 | 20 | 30

// C Dorian mode - melancholic but hopeful
const SCALE = {
  root: 'C',
  mode: 'dorian',
  notes: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'] as const,
}

export const SOUNDSCAPE_CONFIG = {
  scale: SCALE,

  // === DRONE LAYERS ===
  // All sine waves for pure, warm tones (Eno's Thursday Afternoon approach)
  // Very long envelopes create gentle, breathing textures
  droneLayers: {
    // Deep sub - felt more than heard, grounds everything
    sub: {
      note: 'C1',
      type: 'sine' as const,
      volume: -20,
      envelope: {
        attack: 8, // Very slow fade in
        decay: 2,
        sustain: 0.85,
        release: 12, // Long tail
      },
    },
    // Foundation - warm pad base
    foundation: {
      note: 'C2',
      type: 'sine' as const,
      volume: -14,
      envelope: {
        attack: 6,
        decay: 2,
        sustain: 0.8,
        release: 10,
      },
    },
    // Octave double - adds body without changing harmony
    octaveDouble: {
      note: 'C3',
      type: 'sine' as const,
      volume: -18,
      envelope: {
        attack: 7,
        decay: 2,
        sustain: 0.7,
        release: 11,
      },
    },
    // Perfect fifth - open, consonant
    fifth: {
      note: 'G2',
      type: 'sine' as const,
      volume: -16,
      envelope: {
        attack: 7,
        decay: 2,
        sustain: 0.75,
        release: 10,
      },
    },
    // High fifth - shimmer
    highFifth: {
      note: 'G3',
      type: 'sine' as const,
      volume: -20,
      envelope: {
        attack: 9,
        decay: 2,
        sustain: 0.6,
        release: 14,
      },
    },
    // Minor third - Richter's melancholy
    minorThird: {
      note: 'Eb3',
      type: 'sine' as const,
      volume: -19,
      envelope: {
        attack: 8,
        decay: 2,
        sustain: 0.65,
        release: 12,
      },
    },
    // Seventh - jazz/ambient warmth (Bb in dorian)
    seventh: {
      note: 'Bb2',
      type: 'sine' as const,
      volume: -21,
      envelope: {
        attack: 10,
        decay: 2,
        sustain: 0.55,
        release: 15,
      },
    },
    // High seventh - ethereal
    highSeventh: {
      note: 'Bb3',
      type: 'sine' as const,
      volume: -24,
      envelope: {
        attack: 12,
        decay: 3,
        sustain: 0.45,
        release: 18,
      },
    },
    // Ninth - adds subtle tension/color (Eno-esque)
    ninth: {
      note: 'D4',
      type: 'sine' as const,
      volume: -26,
      envelope: {
        attack: 14,
        decay: 3,
        sustain: 0.35,
        release: 20,
      },
    },
  },

  // === MILESTONE PROGRESSION ===
  // Inspired by Eno's gradual layering in "Thursday Afternoon"
  // Each milestone opens up the filter and adds reverb depth
  milestones: {
    0: {
      layers: ['foundation'],
      effects: { reverbWet: 0.5, delayWet: 0.15, filterFreq: 600 },
    },
    3: {
      layers: ['foundation', 'octaveDouble'],
      effects: { reverbWet: 0.55, delayWet: 0.2, filterFreq: 800 },
    },
    5: {
      layers: ['sub', 'foundation', 'octaveDouble', 'fifth'],
      effects: { reverbWet: 0.6, delayWet: 0.25, filterFreq: 1000 },
    },
    10: {
      layers: ['sub', 'foundation', 'octaveDouble', 'fifth', 'highFifth'],
      effects: { reverbWet: 0.65, delayWet: 0.3, filterFreq: 1400 },
    },
    15: {
      layers: [
        'sub',
        'foundation',
        'octaveDouble',
        'fifth',
        'highFifth',
        'minorThird',
      ],
      effects: { reverbWet: 0.7, delayWet: 0.35, filterFreq: 2000 },
    },
    20: {
      layers: [
        'sub',
        'foundation',
        'octaveDouble',
        'fifth',
        'highFifth',
        'minorThird',
        'seventh',
      ],
      effects: { reverbWet: 0.75, delayWet: 0.4, filterFreq: 3000 },
    },
    30: {
      layers: [
        'sub',
        'foundation',
        'octaveDouble',
        'fifth',
        'highFifth',
        'minorThird',
        'seventh',
        'highSeventh',
        'ninth',
      ],
      effects: { reverbWet: 0.8, delayWet: 0.45, filterFreq: 5000 },
    },
  } as const,

  // === SHIMMER NOTES ===
  // Eno-style generative high notes that drift in randomly
  // Like bells in "Music for Airports"
  shimmer: {
    enabled: true,
    notes: ['C5', 'Eb5', 'G5', 'Bb5', 'C6', 'D6'] as const,
    minInterval: 10000, // 10-30 seconds between shimmers
    maxInterval: 30000,
    volume: -28,
    duration: 4,
    envelope: {
      attack: 2, // Very gentle fade in
      decay: 1,
      sustain: 0.3,
      release: 3, // Long tail
    },
  },

  // === PHASE TONES ===
  // Pure sine wave bells/chimes - gentle cues
  phaseTones: {
    inhale: {
      notes: ['G4', 'C5'], // Fifth + octave - aspirational
      volumes: [-10, -16],
      delay: 0.08,
    },
    exhale: {
      notes: ['C4', 'G3'], // Root + fifth below - grounding
      volumes: [-10, -16],
      delay: 0.08,
    },
    holdIn: {
      notes: ['Eb4'], // Minor third - contemplative
      volumes: [-12],
      delay: 0,
    },
    holdOut: {
      notes: ['Bb3'], // Seventh - suspended feeling
      volumes: [-12],
      delay: 0,
    },
    complete: {
      notes: ['C4', 'Eb4', 'G4', 'C5'], // Cm arpeggio
      volumes: [-10, -12, -14, -16],
      delay: 0.2, // Gentle arpeggio
    },
  },

  // Phase tone envelope - soft bell-like quality
  phaseEnvelope: {
    attack: 0.15, // Soft attack
    decay: 0.4,
    sustain: 0.15,
    release: 1.8, // Long release for chime effect
  },

  // === EFFECTS - Cathedral/Hall Sound ===
  // Inspired by Eno's use of EMT 250, Valhalla VintageVerb Medium Hall
  effects: {
    // Main reverb - large cathedral/hall
    // Eno used "Medium Hall with high mix" on Thursday Afternoon
    reverb: {
      decay: 15, // Very long - cathedral-like
      wet: 0.6, // High wet for lush sound
      preDelay: 0.04, // Slight pre-delay for depth
    },

    // Primary delay - Eno's tape loop style
    // Reference: Echoplex at 160ms, 40% feedback
    delay: {
      delayTime: 0.666, // Dotted quarter - creates movement
      feedback: 0.4, // High feedback for trails
      wet: 0.25,
    },

    // Secondary delay - longer, creates depth
    delay2: {
      delayTime: 1.333, // Longer interval
      feedback: 0.3,
      wet: 0.2,
    },

    // Low-pass filter - keeps everything warm
    // Eno: "use eq, delay and spacious reverbs"
    filter: {
      type: 'lowpass' as const,
      frequency: 1200, // Start warm, opens up at milestones
      Q: 0.7, // Gentle slope
    },

    // Very slow LFO for filter - breathing quality
    filterLFO: {
      frequency: 0.03, // ~33 second cycle
      depth: 300, // Subtle movement
    },

    // Chorus - adds width and shimmer
    chorus: {
      frequency: 0.2, // Very slow
      depth: 0.4,
      wet: 0.2,
    },

    // Subtle tremolo - Eno's "constant motion" technique
    tremolo: {
      frequency: 0.08, // Very slow - barely perceptible
      depth: 0.15, // Subtle amplitude modulation
    },

    // Compressor - glues everything together
    compressor: {
      threshold: -20,
      ratio: 2.5, // Gentle compression
      attack: 0.2,
      release: 0.4,
    },
  },

  // === VOLUMES ===
  volumes: {
    master: -6,
    drone: -9,
    shimmer: -20,
    phaseTones: -8,
  },

  // === TRANSITIONS ===
  // Very slow transitions - Eno style
  transitions: {
    fadeIn: 8, // 8 second fade in
    fadeOut: 12, // 12 second fade out
    milestone: 15, // 15 second crossfade between milestones
    shimmerFade: 3,
    cycleProgression: 8, // 8 second crossfade for cycle progressions
  },

  // === CYCLE PROGRESSIONS ===
  // Musical movement every ~10 cycles - like movements in a symphony
  // Inspired by Eno's generative systems and Richter's gradual transformations
  cycleProgressions: {
    cyclesPerProgression: 10, // Change every 10 breath cycles

    // Root note progressions - creates harmonic movement
    // C Dorian → G Dorian → F Dorian → C Dorian (i → v → IV → i feel)
    rootProgression: [
      { root: 'C', semitones: 0 }, // Home key
      { root: 'G', semitones: 7 }, // Fifth - opens up
      { root: 'F', semitones: 5 }, // Fourth - contemplative
      { root: 'Eb', semitones: 3 }, // Minor third - introspective
      { root: 'Bb', semitones: 10 }, // Seventh - suspended
      { root: 'C', semitones: 0 }, // Return home
    ] as const,

    // Which layers are active at each progression stage
    // Creates ebb and flow - not always building
    layerActivity: [
      ['foundation', 'fifth'], // Sparse - just the essentials
      ['foundation', 'octaveDouble', 'fifth', 'highFifth'], // Opening up
      ['sub', 'foundation', 'fifth', 'minorThird'], // Adding color
      ['foundation', 'octaveDouble', 'seventh', 'highSeventh'], // Tension
      ['sub', 'foundation', 'fifth', 'ninth'], // Ethereal
      ['sub', 'foundation', 'octaveDouble', 'fifth', 'highFifth'], // Resolution
    ] as const,

    // Effect intensity at each stage (multipliers)
    effectIntensity: [
      { reverb: 0.8, delay: 0.6, filter: 0.7 }, // Intimate
      { reverb: 1.0, delay: 0.8, filter: 0.9 }, // Opening
      { reverb: 1.1, delay: 1.0, filter: 1.0 }, // Full
      { reverb: 1.2, delay: 1.1, filter: 0.8 }, // Spacious
      { reverb: 1.3, delay: 0.9, filter: 1.1 }, // Ethereal
      { reverb: 1.0, delay: 0.8, filter: 1.0 }, // Return
    ] as const,
  },
} as const

// Type helpers
export type DroneLayerKey = keyof typeof SOUNDSCAPE_CONFIG.droneLayers
export type MilestoneConfig =
  (typeof SOUNDSCAPE_CONFIG.milestones)[MilestoneMinutes]
export type PhaseType = keyof typeof SOUNDSCAPE_CONFIG.phaseTones
export type ProgressionStage = 0 | 1 | 2 | 3 | 4 | 5
