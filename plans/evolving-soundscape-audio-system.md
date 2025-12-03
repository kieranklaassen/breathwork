# Evolving Soundscape Audio System

## Overview

Transform the breathing exercise audio from simple oscillator-based phase tones into an evolving musical soundscape that progresses with session duration. Using Tone.js for synthesis and effects, create a zen/meditative audio experience that starts simple and adds harmonic layers at 5, 10, and 20-minute milestones.

## Problem Statement / Motivation

**Current State:**
- Simple Web Audio API oscillators (`hooks/use-audio.ts:16-26`)
- Three frequencies: inhale (285 Hz), exhale (396 Hz), hold (341 Hz)
- No ambient layer or evolving soundscape
- 0.4s tones that fade out immediately

**User Need:**
- Longer meditation sessions (20+ minutes) feel monotonous with repetitive beeps
- No sense of progression or reward for sustained practice
- Missing ambient "space" that supports deep relaxation
- Current tones are functional but not musical

**Desired State:**
- Ambient drone layer with reverb creates spaciousness
- Musical harmony evolves: 5th → add 3rd → richer layers
- Phase tones blend musically with drone
- Duration-based milestones reward sustained practice
- Maintains zen/chill/bamboo aesthetic

## Proposed Solution

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Audio Engine (Tone.js)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Phase Tones │    │ Ambient     │    │ Effects Chain       │  │
│  │             │    │ Drone       │    │                     │  │
│  │ • Inhale    │    │ • Root      │    │ Reverb → Delay →    │  │
│  │ • Exhale    │    │ • Fifth     │    │ AutoFilter →        │  │
│  │ • Hold      │    │ • Third     │    │ Destination         │  │
│  │ • Complete  │    │ • Octave    │    │                     │  │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘  │
│         │                  │                       │             │
│         └──────────────────┴───────────────────────┘             │
│                            │                                     │
│                      ┌─────▼─────┐                               │
│                      │   Mixer   │                               │
│                      │  Channel  │                               │
│                      └─────┬─────┘                               │
│                            │                                     │
│                      ┌─────▼─────┐                               │
│                      │ Compressor │                              │
│                      └─────┬─────┘                               │
│                            ▼                                     │
│                       Destination                                │
└─────────────────────────────────────────────────────────────────┘
```

### Soundscape Evolution Timeline

| Milestone | Root | Layers | Musical Interval | Effect | Mood |
|-----------|------|--------|------------------|--------|------|
| **0 min** | C2 (65 Hz) | 1 | Root only | Light reverb | Grounding |
| **5 min** | C2 | 2 | + Perfect 5th (G2) | More reverb | Opening |
| **10 min** | C2 | 3 | + Major 3rd (E2) | + Subtle delay | Warmth |
| **20 min** | C2 | 4 | + Octave (C3) | + AutoFilter LFO | Transcendence |

### Phase Tone Frequencies (Relative to Root C2)

| Phase | Note | Frequency | Interval | Character |
|-------|------|-----------|----------|-----------|
| Inhale | G2 | 98 Hz | Perfect 5th | Rising, aspirational |
| Exhale | C2 | 65 Hz | Root | Grounding, release |
| Hold | E2 | 82 Hz | Major 3rd | Warm, stable |
| Complete | C3→G3 | 131→196 Hz | Octave rise | Celebratory |

## Technical Approach

### Phase 1: Tone.js Integration & Foundation

**Tasks:**
1. Install Tone.js as project dependency
2. Create `hooks/use-tone-audio.ts` - new Tone.js-based audio hook
3. Create `libs/soundscape-config.ts` - musical constants and configurations
4. Migrate phase tones from Web Audio oscillators to Tone.Synth

**Files to create:**

```
hooks/use-tone-audio.ts       # Main audio hook using Tone.js
hooks/use-soundscape.ts       # Ambient drone layer management
libs/soundscape-config.ts     # Musical configuration constants
```

**libs/soundscape-config.ts**
```typescript
// Musical constants for zen/bamboo aesthetic
export const SOUNDSCAPE_CONFIG = {
  // Root note for entire soundscape
  root: 'C2', // 65.41 Hz

  // Phase tones (relative to root)
  phaseTones: {
    inhale: 'G2',   // Perfect 5th - rising
    exhale: 'C2',   // Root - grounding
    holdIn: 'E2',   // Major 3rd - stable
    holdOut: 'E2',  // Major 3rd - stable
    complete: ['C3', 'G3'], // Octave rise
  },

  // Milestone layers
  milestones: {
    0: { layers: ['C2'] },
    5: { layers: ['C2', 'G2'] },          // Add 5th
    10: { layers: ['C2', 'G2', 'E2'] },   // Add 3rd
    20: { layers: ['C2', 'G2', 'E2', 'C3'] }, // Add octave
  },

  // Synth envelope for gentle attack/release
  droneEnvelope: {
    attack: 4,
    decay: 0.5,
    sustain: 0.8,
    release: 6,
  },

  // Phase tone envelope (shorter, more percussive)
  phaseEnvelope: {
    attack: 0.1,
    decay: 0.2,
    sustain: 0.3,
    release: 0.5,
  },

  // Effects settings
  effects: {
    reverb: { decay: 8, wet: 0.5 },
    delay: { delayTime: '8n', feedback: 0.2, wet: 0.15 },
    autoFilter: { frequency: 0.1, depth: 0.2, wet: 0.1 },
  },

  // Volume levels (dB)
  volumes: {
    droneLayers: [-12, -15, -18, -21], // Decreasing for each layer
    phaseTones: -6,
    master: -3,
  },

  // Transition durations (seconds)
  transitions: {
    fadeIn: 4,
    fadeOut: 6,
    milestone: 8, // Crossfade duration when adding layers
  },
}
```

### Phase 2: Ambient Drone System

**Tasks:**
1. Create drone layer manager that handles multiple synths
2. Implement milestone detection and layer addition
3. Add smooth crossfade transitions between states

**hooks/use-soundscape.ts (key sections)**
```typescript
'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import * as Tone from 'tone'
import { SOUNDSCAPE_CONFIG } from '~/libs/soundscape-config'

export function useSoundscape() {
  const [milestone, setMilestone] = useState<0 | 5 | 10 | 20>(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // Audio node refs
  const droneSynthsRef = useRef<Tone.Synth[]>([])
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const delayRef = useRef<Tone.PingPongDelay | null>(null)
  const autoFilterRef = useRef<Tone.AutoFilter | null>(null)

  // Initialize effects chain (once per session)
  const initialize = async () => {
    if (isInitialized) return
    await Tone.start()

    // Create effects chain
    reverbRef.current = new Tone.Reverb({
      decay: SOUNDSCAPE_CONFIG.effects.reverb.decay,
      wet: SOUNDSCAPE_CONFIG.effects.reverb.wet,
    })
    await reverbRef.current.generate()

    delayRef.current = new Tone.PingPongDelay({
      ...SOUNDSCAPE_CONFIG.effects.delay,
    })

    autoFilterRef.current = new Tone.AutoFilter({
      ...SOUNDSCAPE_CONFIG.effects.autoFilter,
    })

    // Chain: delay → autoFilter → reverb → destination
    delayRef.current.connect(autoFilterRef.current)
    autoFilterRef.current.connect(reverbRef.current)
    reverbRef.current.toDestination()

    setIsInitialized(true)
  }

  // Start drone at milestone 0
  const start = async () => {
    if (!isInitialized) await initialize()

    const rootSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: SOUNDSCAPE_CONFIG.droneEnvelope,
      volume: SOUNDSCAPE_CONFIG.volumes.droneLayers[0],
    }).connect(delayRef.current!)

    rootSynth.triggerAttack(SOUNDSCAPE_CONFIG.root)
    droneSynthsRef.current = [rootSynth]
    setMilestone(0)
  }

  // Add layer at milestone
  const evolve = (newMilestone: 5 | 10 | 20) => {
    const layers = SOUNDSCAPE_CONFIG.milestones[newMilestone].layers
    const currentLayerCount = droneSynthsRef.current.length

    // Add new layers
    for (let i = currentLayerCount; i < layers.length; i++) {
      const synth = new Tone.Synth({
        oscillator: { type: i % 2 === 0 ? 'sine' : 'triangle' },
        envelope: SOUNDSCAPE_CONFIG.droneEnvelope,
        volume: -60, // Start silent
      }).connect(delayRef.current!)

      synth.triggerAttack(layers[i])
      synth.volume.rampTo(
        SOUNDSCAPE_CONFIG.volumes.droneLayers[i],
        SOUNDSCAPE_CONFIG.transitions.milestone
      )
      droneSynthsRef.current.push(synth)
    }

    // Activate milestone-specific effects
    if (newMilestone >= 10) {
      autoFilterRef.current?.start()
    }

    setMilestone(newMilestone)
  }

  // Stop all audio
  const stop = () => {
    droneSynthsRef.current.forEach((synth) => {
      synth.volume.rampTo(-60, SOUNDSCAPE_CONFIG.transitions.fadeOut)
    })

    setTimeout(() => {
      droneSynthsRef.current.forEach((synth) => {
        synth.triggerRelease()
        synth.dispose()
      })
      droneSynthsRef.current = []
      autoFilterRef.current?.stop()
      setMilestone(0)
    }, SOUNDSCAPE_CONFIG.transitions.fadeOut * 1000)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      droneSynthsRef.current.forEach((s) => s.dispose())
      reverbRef.current?.dispose()
      delayRef.current?.dispose()
      autoFilterRef.current?.dispose()
    }
  }, [])

  return { initialize, start, stop, evolve, milestone, isInitialized }
}
```

### Phase 3: Phase Tones Migration

**Tasks:**
1. Create new Tone.js-based phase tone hook
2. Ensure phase tones harmonize with drone root
3. Keep existing API compatible with `breathing-session/index.tsx`

**hooks/use-tone-audio.ts (key sections)**
```typescript
'use client'

import { useRef, useEffect } from 'react'
import * as Tone from 'tone'
import { SOUNDSCAPE_CONFIG } from '~/libs/soundscape-config'

export function useToneAudio(enabled: boolean) {
  const synthRef = useRef<Tone.Synth | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)

  // Initialize on first use
  const ensureInitialized = async () => {
    if (synthRef.current) return

    await Tone.start()

    reverbRef.current = new Tone.Reverb({
      decay: 2,
      wet: 0.3,
    }).toDestination()
    await reverbRef.current.generate()

    synthRef.current = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: SOUNDSCAPE_CONFIG.phaseEnvelope,
      volume: SOUNDSCAPE_CONFIG.volumes.phaseTones,
    }).connect(reverbRef.current)
  }

  const play = async (note: string, duration: number = 0.4) => {
    if (!enabled) return
    await ensureInitialized()
    synthRef.current?.triggerAttackRelease(note, duration)
  }

  // Cleanup
  useEffect(() => {
    return () => {
      synthRef.current?.dispose()
      reverbRef.current?.dispose()
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
```

### Phase 4: Milestone Integration

**Tasks:**
1. Add milestone detection to breathing-session component
2. Wire soundscape evolution to session time
3. Test transitions don't interfere with phase tones

**Modify `app/(pages)/r3f/breathing/(components)/breathing-session/index.tsx`:**

```typescript
// Add imports
import { useSoundscape } from '~/hooks/use-soundscape'
import { useToneAudio } from '~/hooks/use-tone-audio'

// Replace current useAudio with useToneAudio
const audio = useToneAudio(audioEnabledRef.current)

// Add soundscape
const soundscape = useSoundscape()

// Add milestone detection
useEffect(() => {
  if (!audioEnabledRef.current || !soundscape.isInitialized) return

  const minutes = sessionTime / 60000

  if (minutes >= 20 && soundscape.milestone < 20) {
    soundscape.evolve(20)
  } else if (minutes >= 10 && soundscape.milestone < 10) {
    soundscape.evolve(10)
  } else if (minutes >= 5 && soundscape.milestone < 5) {
    soundscape.evolve(5)
  }
}, [sessionTime, soundscape.milestone, soundscape.isInitialized])

// Start/stop soundscape with session
useEffect(() => {
  if (isPlaying && audioEnabledRef.current) {
    soundscape.start()
  }

  return () => {
    if (!isPlaying) {
      soundscape.stop()
    }
  }
}, [isPlaying])
```

### Phase 5: Polish & Edge Cases

**Tasks:**
1. Handle audio toggle mid-session (resume at correct milestone)
2. Handle tab visibility changes
3. Add performance monitoring
4. Test on mobile devices

**Edge cases to handle:**

```typescript
// Audio toggle: resume at correct milestone
const handleToggleAudio = async () => {
  const newState = !audioEnabledRef.current
  setAudioEnabled(newState)
  audioEnabledRef.current = newState

  if (newState && isPlaying) {
    await soundscape.initialize()
    await soundscape.start()

    // Resume at correct milestone
    const minutes = sessionTime / 60000
    if (minutes >= 20) soundscape.evolve(20)
    else if (minutes >= 10) soundscape.evolve(10)
    else if (minutes >= 5) soundscape.evolve(5)
  } else {
    soundscape.stop()
  }
}

// Tab visibility: pause audio when hidden
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden && isPlaying) {
      Tone.Destination.mute = true
    } else {
      Tone.Destination.mute = false
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [isPlaying])
```

## Acceptance Criteria

### Functional Requirements

- [ ] Ambient drone layer plays when audio is enabled and session is active
- [ ] Drone evolves at 5, 10, and 20-minute milestones with smooth crossfades
- [ ] Phase tones (inhale/exhale/hold) harmonize with drone root note
- [ ] Audio toggle respects current milestone state when re-enabled
- [ ] Session completion plays celebratory tone sequence
- [ ] All audio fades out gracefully (6+ seconds) when session ends

### Non-Functional Requirements

- [ ] Audio latency under 50ms for phase tones
- [ ] No audible clicks or pops during transitions
- [ ] CPU usage stays under 10% during 30-minute session (desktop)
- [ ] Works on Safari iOS (handle AudioContext restrictions)
- [ ] Memory does not grow during extended sessions (proper disposal)

### Quality Gates

- [ ] TypeScript strict mode passes
- [ ] Biome lint passes
- [ ] Manual testing on Chrome, Safari, Firefox
- [ ] Mobile testing on iOS Safari
- [ ] 20+ minute session test without audio glitches

## Dependencies & Prerequisites

**NPM Dependencies:**
```bash
bun add tone
bun add -D @types/tone
```

**Browser Requirements:**
- Web Audio API support (all modern browsers)
- User gesture required before audio context starts

**Existing Code Dependencies:**
- `libs/breathing-store.ts` - sessionTime tracking
- `hooks/use-breathing-timer.ts` - phase detection
- `app/(pages)/r3f/breathing/(components)/breathing-session/index.tsx` - integration point

## Risk Analysis & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Tone.js bundle size (~100KB) | Medium | High | Dynamic import, code splitting |
| iOS Safari audio restrictions | High | Medium | Ensure user gesture, handle suspended context |
| Audio glitches during milestone transition | Medium | Medium | Use crossfade with long overlap |
| Memory leak from undisposed synths | High | Low | Strict cleanup in useEffect returns |
| CPU spike on mobile | Medium | Medium | Limit to 4 drone layers max, use simple waveforms |

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `hooks/use-tone-audio.ts` | Phase tones using Tone.js |
| `hooks/use-soundscape.ts` | Ambient drone layer management |
| `libs/soundscape-config.ts` | Musical constants and configuration |

### Modified Files

| File | Changes |
|------|---------|
| `app/(pages)/r3f/breathing/(components)/breathing-session/index.tsx` | Integrate soundscape, milestone detection |
| `package.json` | Add Tone.js dependency |

### Deprecated (can remove later)

| File | Reason |
|------|--------|
| `hooks/use-audio.ts` | Replaced by use-tone-audio.ts |

## References & Research

### Internal References
- Current audio hook: `hooks/use-audio.ts:8-27`
- Phase change detection: `app/(pages)/r3f/breathing/(components)/breathing-session/index.tsx:68-74`
- Session time tracking: `libs/breathing-store.ts:18` (sessionTime)
- Breathing timer: `hooks/use-breathing-timer.ts`

### External References
- [Tone.js Documentation](https://tonejs.github.io/)
- [Web Audio API Best Practices (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Generative Music in the Browser](https://medium.com/@alexbainter/making-generative-music-in-the-browser-bfb552a26b0b)
- [Musical Intervals Reference](https://en.wikipedia.org/wiki/Interval_(music))

### Sound Design References
- Root: C2 (65.41 Hz) - low, grounding foundation
- Perfect Fifth (G2, 98 Hz) - stable, consonant, "open" feeling
- Major Third (E2, 82 Hz) - warm, pleasant
- Octave (C3, 131 Hz) - reinforces root, adds brightness

---

## Implementation Notes

### Why Tone.js?

Evaluated alternatives:
- **Native Web Audio API**: Too low-level, would require significant boilerplate
- **Howler.js**: Great for file playback, but no synthesis capabilities
- **Pizzicato.js**: Limited synthesis, smaller community

Tone.js provides:
- High-level musical abstractions (notes, intervals)
- Built-in effects (reverb, delay, filter)
- Precise scheduling with Transport
- Active maintenance and good documentation

### Musical Design Philosophy

The soundscape follows "additive harmony" - each milestone adds a consonant interval:
1. **Root alone** (0-5 min): Grounding, stability
2. **Root + 5th** (5-10 min): Openness, the "power chord" feeling
3. **Root + 5th + 3rd** (10-20 min): Full major triad, warmth and resolution
4. **Root + 5th + 3rd + octave** (20+ min): Reinforced foundation, sense of completion

Phase tones use the same harmonic palette so everything sounds "in tune" together.

### Performance Considerations

- Use `sine` and `triangle` waveforms (less CPU than `sawtooth` or `square`)
- Limit to 4 drone layers maximum
- Reuse effects chain (create once, connect multiple synths)
- Dispose of synths properly to prevent memory leaks
- Use `rampTo` for all volume/parameter changes (prevents clicks)
