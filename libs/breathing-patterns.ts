export type BreathMethod = 'nose' | 'mouth'

export type BreathingPhaseKey = 'inhale' | 'holdIn' | 'exhale' | 'holdOut'

export interface BreathingPattern {
  name: string
  japanese: string
  subtitle: string
  description: string
  phases: Record<BreathingPhaseKey, number>
  methods: {
    inhale: BreathMethod
    exhale: BreathMethod
  }
  benefits: string[]
  accent: string
  icon: string
}

type BreathingPatternMap = Record<string, BreathingPattern>

export const BREATHING_PATTERNS: BreathingPatternMap = {
  coherent: {
    name: 'Coherent',
    japanese: '調和',
    subtitle: 'Heart synchronization',
    description:
      'Gentle 5-second inhale/exhale cadence aligned with heart rate variability training.',
    phases: {
      inhale: 5000,
      holdIn: 0,
      exhale: 5000,
      holdOut: 0,
    },
    methods: {
      inhale: 'nose',
      exhale: 'nose',
    },
    benefits: ['Balances HRV', 'Improves emotional regulation'],
    accent: '#f8b4c4',
    icon: '🌸',
  },
  box: {
    name: 'Box',
    japanese: '四角',
    subtitle: 'Equal stillness',
    description:
      'Balanced 4-4-4-4 cadence for calm focus and nervous system balance.',
    phases: {
      inhale: 4000,
      holdIn: 4000,
      exhale: 4000,
      holdOut: 4000,
    },
    methods: {
      inhale: 'nose',
      exhale: 'nose',
    },
    benefits: ['Enhances focus', 'Balances parasympathetic response'],
    accent: '#a8d5ba',
    icon: '◻️',
  },
  '4-7-8': {
    name: '4-7-8',
    japanese: '安息',
    subtitle: 'Deep tranquility',
    description:
      'Calming cadence popularized by Dr. Andrew Weil for sleep support.',
    phases: {
      inhale: 4000,
      holdIn: 7000,
      exhale: 8000,
      holdOut: 0,
    },
    methods: {
      inhale: 'nose',
      exhale: 'mouth',
    },
    benefits: ['Reduces anxiety', 'Supports sleep onset'],
    accent: '#c9b8e0',
    icon: '🌙',
  },
  extended: {
    name: 'Extended',
    japanese: '静寂',
    subtitle: 'Long release',
    description: 'Short inhale, longer exhale cadence for calm alertness.',
    phases: {
      inhale: 4000,
      holdIn: 4000,
      exhale: 8000,
      holdOut: 0,
    },
    methods: {
      inhale: 'nose',
      exhale: 'mouth',
    },
    benefits: ['Supports concentration', 'Activates parasympathetic response'],
    accent: '#8ecae6',
    icon: '💨',
  },
  vitality: {
    name: 'Vitality',
    japanese: '活力',
    subtitle: 'Morning awakening',
    description: 'Quick inhale and shorter hold-out to elevate alertness.',
    phases: {
      inhale: 6000,
      holdIn: 0,
      exhale: 2000,
      holdOut: 0,
    },
    methods: {
      inhale: 'nose',
      exhale: 'mouth',
    },
    benefits: ['Boosts energy', 'Improves circulation'],
    accent: '#ffb4a2',
    icon: '☀️',
  },
  drift: {
    name: 'Drift',
    japanese: '眠り',
    subtitle: 'Into rest',
    description: 'Extended exhale and holds to downshift the nervous system.',
    phases: {
      inhale: 4000,
      holdIn: 7000,
      exhale: 8000,
      holdOut: 4000,
    },
    methods: {
      inhale: 'nose',
      exhale: 'nose',
    },
    benefits: ['Reduces stress', 'Promotes deep relaxation'],
    accent: '#b8c0ff',
    icon: '🌊',
  },
}
