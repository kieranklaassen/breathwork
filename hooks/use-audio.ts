'use client'

import { useRef } from 'react'

export function useAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)

  const play = (freq: number, dur = 0.2, vol = 0.12) => {
    if (!enabled) return

    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }

    const ctx = ctxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + dur)
  }

  return {
    inhale: () => play(285, 0.4),
    exhale: () => play(396, 0.4),
    hold: () => play(341, 0.2),
    complete: () => {
      play(396, 0.3)
      setTimeout(() => play(528, 0.4), 200)
    },
  }
}
