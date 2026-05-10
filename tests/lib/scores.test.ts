import { describe, it, expect } from 'vitest'
import { computeAutomationRisk, deriveBottleneckTypes } from '@/lib/scores'

describe('computeAutomationRisk', () => {
  it('returns high risk for high AI capability and low friction', () => {
    const risk = computeAutomationRisk(5, 1, 1, 1)
    expect(risk).toBeGreaterThanOrEqual(4.5)
    expect(risk).toBeLessThanOrEqual(5)
  })

  it('returns low risk for low AI capability and high friction', () => {
    const risk = computeAutomationRisk(1, 5, 5, 5)
    expect(risk).toBeGreaterThanOrEqual(1)
    expect(risk).toBeLessThanOrEqual(1.5)
  })

  it('clamps result between 1 and 5', () => {
    const high = computeAutomationRisk(5, 1, 1, 1)
    const low = computeAutomationRisk(1, 5, 5, 5)
    expect(high).toBeLessThanOrEqual(5)
    expect(low).toBeGreaterThanOrEqual(1)
  })

  it('software dev profile scores higher than healthcare profile', () => {
    const software = computeAutomationRisk(5, 2, 1, 3)
    const healthcare = computeAutomationRisk(3, 5, 3, 5)
    expect(software).toBeGreaterThan(healthcare)
  })
})

describe('deriveBottleneckTypes', () => {
  it('returns empty array when no friction dimension reaches 4', () => {
    expect(deriveBottleneckTypes(3, 3, 3)).toEqual([])
  })

  it('identifies regulation bottleneck', () => {
    expect(deriveBottleneckTypes(4, 1, 1)).toContain('regulation')
  })

  it('identifies physical bottleneck', () => {
    expect(deriveBottleneckTypes(1, 5, 1)).toContain('physical')
  })

  it('identifies trust bottleneck', () => {
    expect(deriveBottleneckTypes(1, 1, 4)).toContain('trust')
  })

  it('identifies multiple bottlenecks', () => {
    const types = deriveBottleneckTypes(5, 5, 5)
    expect(types).toContain('regulation')
    expect(types).toContain('physical')
    expect(types).toContain('trust')
  })
})
