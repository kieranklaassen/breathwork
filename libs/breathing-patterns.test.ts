import { describe, expect, it } from 'vitest'
import { BREATHING_PATTERNS } from './breathing-patterns'

describe('BREATHING_PATTERNS', () => {
  it('should include all expected preset keys', () => {
    expect(Object.keys(BREATHING_PATTERNS).sort()).toEqual([
      '4-7-8',
      'box',
      'calm-focus',
      'coherent',
      'deep-calming',
      'energizing',
      'equal',
      'triangle',
      'wim-hof',
    ])
  })

  it('should ensure each pattern has valid phase durations and methods', () => {
    Object.entries(BREATHING_PATTERNS).forEach(([key, pattern]) => {
      expect(pattern.name).toBeTruthy()
      expect(pattern.description).toBeTruthy()
      expect(pattern.benefits.length).toBeGreaterThan(0)

      const phaseValues = Object.values(pattern.phases)
      phaseValues.forEach((duration) => {
        expect(duration).toBeGreaterThanOrEqual(0)
        expect(duration % 500).toBe(0)
      })

      const total = phaseValues.reduce((sum, value) => sum + value, 0)
      expect(total).toBeGreaterThan(0)

      expect(['nose', 'mouth']).toContain(pattern.methods.inhale)
      expect(['nose', 'mouth']).toContain(pattern.methods.exhale)

      if (key === 'wim-hof') {
        expect(pattern.methods.exhale).toBe('mouth')
      }
    })
  })
})
