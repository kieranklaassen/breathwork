import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import {
  BREATHING_PATTERNS,
  type BreathingPattern,
  type BreathingPhaseKey,
  type BreathMethod,
} from './breathing-patterns'

export type BreathPhase = 'ready' | 'inhale' | 'hold-in' | 'exhale' | 'hold-out'

type AdjustedPhases = Record<BreathingPhaseKey, number>

interface BreathingState {
  // Playback state
  isPlaying: boolean
  currentPhase: BreathPhase
  currentTime: number
  cycleCount: number
  sessionTime: number

  // Pattern state
  selectedPattern: string
  customPattern: BreathingPattern | null

  // Settings drafts
  draftPhases: AdjustedPhases
  draftMethods: {
    inhale: BreathMethod
    exhale: BreathMethod
  }
  settingsSaved: boolean

  // Adjustments
  cycleSpeedAdjustment: number

  // Derived values
  totalCycleTime: number
  adjustedPhases: AdjustedPhases

  // Actions
  play: () => void
  pause: () => void
  reset: () => void
  setCurrentPhase: (phase: BreathPhase) => void
  setCurrentTime: (time: number) => void
  incrementCycle: () => void
  updateSessionTime: (delta: number) => void
  selectPattern: (patternKey: string) => void
  setCustomPattern: (pattern: BreathingPattern) => void
  updateDraftPhase: (phase: BreathingPhaseKey, value: number) => void
  updateDraftMethod: (type: 'inhale' | 'exhale', method: BreathMethod) => void
  saveSettings: () => void
  adjustCycleSpeed: (delta: number) => void
  adjustPhase: (phase: BreathingPhaseKey, delta: number) => void
}

const STORAGE_KEY = 'breathing-storage'
const DEFAULT_PATTERN_KEY = 'coherent'

const clonePhases = (phases: AdjustedPhases): AdjustedPhases => ({
  inhale: phases.inhale,
  holdIn: phases.holdIn,
  exhale: phases.exhale,
  holdOut: phases.holdOut,
})

type DerivableSnapshot = Pick<
  BreathingState,
  | 'selectedPattern'
  | 'customPattern'
  | 'cycleSpeedAdjustment'
  | 'draftPhases'
  | 'draftMethods'
>

const resolvePattern = (state: DerivableSnapshot): BreathingPattern => {
  if (state.selectedPattern === 'custom') {
    if (state.customPattern) {
      return state.customPattern
    }

    return {
      name: 'Custom',
      japanese: 'カスタム',
      subtitle: 'Your pattern',
      description: 'User-defined pattern',
      phases: state.draftPhases,
      methods: state.draftMethods,
      benefits: ['Personalized breathing'],
      accent: '#f8b4c4',
      icon: '✨',
    }
  }

  return (
    BREATHING_PATTERNS[state.selectedPattern] ??
    BREATHING_PATTERNS[DEFAULT_PATTERN_KEY]
  )
}

const deriveValues = (state: DerivableSnapshot) => {
  const pattern = resolvePattern(state)
  const baseTotal = Object.values(pattern.phases).reduce(
    (sum, value) => sum + value,
    0
  )
  const adjustedTotal = Math.max(500, baseTotal + state.cycleSpeedAdjustment)
  const ratio = baseTotal > 0 ? adjustedTotal / baseTotal : 1

  const adjustedPhases: AdjustedPhases = {
    inhale: Math.max(0, pattern.phases.inhale * ratio),
    holdIn: Math.max(0, pattern.phases.holdIn * ratio),
    exhale: Math.max(0, pattern.phases.exhale * ratio),
    holdOut: Math.max(0, pattern.phases.holdOut * ratio),
  }

  return {
    totalCycleTime: adjustedTotal,
    adjustedPhases,
  }
}

const getInitialBaseState = (): Omit<
  BreathingState,
  | 'totalCycleTime'
  | 'adjustedPhases'
  | 'play'
  | 'pause'
  | 'reset'
  | 'setCurrentPhase'
  | 'setCurrentTime'
  | 'incrementCycle'
  | 'updateSessionTime'
  | 'selectPattern'
  | 'setCustomPattern'
  | 'updateDraftPhase'
  | 'updateDraftMethod'
  | 'saveSettings'
  | 'adjustCycleSpeed'
  | 'adjustPhase'
> => {
  const defaultPattern = BREATHING_PATTERNS[DEFAULT_PATTERN_KEY]

  return {
    isPlaying: false,
    currentPhase: 'ready',
    currentTime: 0,
    cycleCount: 1,
    sessionTime: 0,
    selectedPattern: DEFAULT_PATTERN_KEY,
    customPattern: null,
    draftPhases: clonePhases(defaultPattern.phases),
    draftMethods: { ...defaultPattern.methods },
    settingsSaved: true,
    cycleSpeedAdjustment: 0,
  }
}

type StoreSet = (
  partial:
    | BreathingState
    | Partial<BreathingState>
    | ((state: BreathingState) => BreathingState | Partial<BreathingState>),
  replace?: false,
  actionName?: string
) => void

const toSnapshot = (state: {
  selectedPattern: string
  customPattern: BreathingPattern | null
  cycleSpeedAdjustment: number
  draftPhases: AdjustedPhases
  draftMethods: BreathingState['draftMethods']
}): DerivableSnapshot => ({
  selectedPattern: state.selectedPattern,
  customPattern: state.customPattern,
  cycleSpeedAdjustment: state.cycleSpeedAdjustment,
  draftPhases: state.draftPhases,
  draftMethods: state.draftMethods,
})

const withDerived =
  (
    updater: (state: BreathingState) => Partial<BreathingState>,
    action?: string
  ) =>
  (set: StoreSet) => {
    set(
      (state) => {
        const changes = updater(state)
        const snapshot: DerivableSnapshot = {
          selectedPattern: changes.selectedPattern ?? state.selectedPattern,
          customPattern:
            'customPattern' in changes
              ? (changes.customPattern ?? null)
              : state.customPattern,
          cycleSpeedAdjustment:
            'cycleSpeedAdjustment' in changes
              ? (changes.cycleSpeedAdjustment ?? 0)
              : state.cycleSpeedAdjustment,
          draftPhases:
            (changes.draftPhases as AdjustedPhases | undefined) ??
            state.draftPhases,
          draftMethods:
            (changes.draftMethods as
              | BreathingState['draftMethods']
              | undefined) ?? state.draftMethods,
        }
        const derived = deriveValues(snapshot)
        return { ...changes, ...derived }
      },
      false,
      action
    )
  }

export const useBreathingStore = create<BreathingState>()(
  devtools(
    persist(
      (set) => {
        const setWithAction = set as StoreSet
        const base = getInitialBaseState()
        const initialState: BreathingState = {
          ...base,
          ...deriveValues(toSnapshot(base)),
          play: () =>
            withDerived(
              () => ({ isPlaying: true, currentPhase: 'inhale' }),
              'play'
            )(setWithAction),
          pause: () => setWithAction({ isPlaying: false }, false, 'pause'),
          reset: () =>
            withDerived(() => getInitialBaseState(), 'reset')(setWithAction),
          setCurrentPhase: (phase) =>
            setWithAction({ currentPhase: phase }, false, 'setCurrentPhase'),
          setCurrentTime: (time) =>
            setWithAction({ currentTime: time }, false, 'setCurrentTime'),
          incrementCycle: () =>
            setWithAction(
              (state) => ({ cycleCount: state.cycleCount + 1 }),
              false,
              'incrementCycle'
            ),
          updateSessionTime: (delta) =>
            setWithAction(
              (state) => ({ sessionTime: state.sessionTime + delta }),
              false,
              'updateSessionTime'
            ),
          selectPattern: (patternKey) =>
            withDerived(() => {
              const preset =
                BREATHING_PATTERNS[patternKey] ??
                BREATHING_PATTERNS[DEFAULT_PATTERN_KEY]
              return {
                selectedPattern: patternKey,
                customPattern: null,
                draftPhases: clonePhases(preset.phases),
                draftMethods: { ...preset.methods },
                settingsSaved: true,
                cycleSpeedAdjustment: 0,
              }
            }, 'selectPattern')(setWithAction),
          setCustomPattern: (pattern) =>
            withDerived(
              () => ({
                selectedPattern: 'custom',
                customPattern: pattern,
                draftPhases: clonePhases(pattern.phases),
                draftMethods: { ...pattern.methods },
                settingsSaved: true,
              }),
              'setCustomPattern'
            )(setWithAction),
          updateDraftPhase: (phase, value) =>
            setWithAction(
              (state) => ({
                draftPhases: {
                  ...state.draftPhases,
                  [phase]: Math.max(0, Math.min(10000, value)),
                } as AdjustedPhases,
                settingsSaved: false,
              }),
              false,
              'updateDraftPhase'
            ),
          updateDraftMethod: (type, method) =>
            setWithAction(
              (state) => ({
                draftMethods: {
                  ...state.draftMethods,
                  [type]: method,
                },
                settingsSaved: false,
              }),
              false,
              'updateDraftMethod'
            ),
          saveSettings: () =>
            withDerived((state) => {
              const custom: BreathingPattern = {
                name: 'Custom',
                japanese: 'カスタム',
                subtitle: 'Your pattern',
                description: 'User-defined pattern',
                phases: clonePhases(state.draftPhases),
                methods: { ...state.draftMethods },
                benefits: ['Personalized breathing'],
                accent: '#f8b4c4',
                icon: '✨',
              }

              return {
                selectedPattern: 'custom',
                customPattern: custom,
                settingsSaved: true,
              }
            }, 'saveSettings')(setWithAction),
          adjustCycleSpeed: (delta) =>
            withDerived((state) => {
              const pattern = resolvePattern(state)
              const baseTotal = Object.values(pattern.phases).reduce(
                (sum, value) => sum + value,
                0
              )
              const minAdjustment = -baseTotal + 500
              const nextAdjustment = Math.max(
                minAdjustment,
                state.cycleSpeedAdjustment + delta
              )
              return {
                cycleSpeedAdjustment: nextAdjustment,
              }
            }, 'adjustCycleSpeed')(setWithAction),
          adjustPhase: (phase, delta) =>
            withDerived((state) => {
              const nextValue = Math.max(
                0,
                Math.min(10000, state.draftPhases[phase] + delta)
              )
              return {
                draftPhases: {
                  ...state.draftPhases,
                  [phase]: nextValue,
                } as AdjustedPhases,
                selectedPattern: 'custom',
                settingsSaved: false,
              }
            }, 'adjustPhase')(setWithAction),
        }

        return initialState
      },
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          selectedPattern: state.selectedPattern,
          customPattern: state.customPattern,
          draftPhases: state.draftPhases,
          draftMethods: state.draftMethods,
          cycleSpeedAdjustment: state.cycleSpeedAdjustment,
        }),
        merge: (persisted, current) => {
          const persistedState = (persisted ?? {}) as Partial<BreathingState>
          const merged = {
            ...current,
            ...persistedState,
          }
          const derived = deriveValues(toSnapshot(merged))
          return {
            ...merged,
            ...derived,
          }
        },
      }
    ),
    { name: 'BreathingStore' }
  )
)

export const useIsPlaying = () => useBreathingStore((state) => state.isPlaying)
export const useCurrentPhase = () =>
  useBreathingStore((state) => state.currentPhase)
export const useCurrentTime = () =>
  useBreathingStore((state) => state.currentTime)
export const useTotalCycleTime = () =>
  useBreathingStore((state) => state.totalCycleTime)
export const useAdjustedPhases = () =>
  useBreathingStore((state) => state.adjustedPhases)
