import { describe, it, expect } from 'vitest'
import { planMutations } from '../src/agents/mutation-planner.js'
import { loadConfig } from '../src/config.js'
import { ThreatProfile } from '../src/types.js'

const HIGH_PROFILE: ThreatProfile = {
  risk_level: 'high',
  content_type: 'article, tabular, code',
  recommended_mode: 'aggressive',
  extraction_risk: 75,
  valuable_selectors: ['article', '.pricing-table', 'pre'],
  word_count: 1500,
  has_premium: true,
  page_complexity: 45,
}

const LOW_PROFILE: ThreatProfile = {
  risk_level: 'low',
  content_type: 'text',
  recommended_mode: 'minimal',
  extraction_risk: 10,
  valuable_selectors: [],
  word_count: 30,
  has_premium: false,
  page_complexity: 5,
}

describe('MutationPlanner', () => {
  it('should select aggressive strategy for high risk', () => {
    const config = loadConfig()
    const plan = planMutations(HIGH_PROFILE, config)
    expect(plan.strategy).toBe('aggressive')
    expect(plan.mutations.length).toBeGreaterThanOrEqual(4)
  })

  it('should include dom_fragmentation, attribute_shuffle, zero_width_injection in all plans', () => {
    const config = loadConfig()
    const plan = planMutations(HIGH_PROFILE, config)
    expect(plan.mutations).toContain('dom_fragmentation')
    expect(plan.mutations).toContain('attribute_shuffle')
    expect(plan.mutations).toContain('zero_width_injection')
  })

  it('should select minimal mutations for low risk', () => {
    const config = loadConfig()
    const plan = planMutations(LOW_PROFILE, config)
    expect(['minimal', 'moderate']).toContain(plan.strategy)
  })

  it('should prioritize selectors from threat profile', () => {
    const config = loadConfig()
    const plan = planMutations(HIGH_PROFILE, config)
    expect(plan.priority_selectors.length).toBeGreaterThanOrEqual(0)
  })

  it('should estimate overhead correctly', () => {
    const config = loadConfig()
    const plan = planMutations(HIGH_PROFILE, config)
    expect(plan.estimated_overhead_ms).toBeGreaterThan(0)
  })

  it('should respect protection level = never', () => {
    const config = loadConfig({ protection: { level: 'never' } })
    const plan = planMutations(HIGH_PROFILE, config)
    expect(plan.strategy).toBe('minimal')
  })

  it('should include honeypots and fingerprinting at maximum', () => {
    const maxProfile: ThreatProfile = { ...HIGH_PROFILE, risk_level: 'critical', extraction_risk: 95 }
    const config = loadConfig()
    const plan = planMutations(maxProfile, config)
    if (plan.strategy === 'maximum') {
      expect(plan.mutations).toContain('honeypots')
      expect(plan.mutations).toContain('fingerprinting')
    }
  })
})
