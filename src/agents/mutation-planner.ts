import { MutationPlan, MutationType, ThreatProfile } from '../types.js'
import { NoScrapeConfig } from '../types.js'
import { getEnabledMutations } from '../config.js'

const MUTATION_OVERHEADS: Record<MutationType, number> = {
  dom_fragmentation: 5,
  attribute_shuffle: 2,
  zero_width_injection: 3,
  visual_reordering: 8,
  semantic_noise: 4,
  honeypots: 3,
  fingerprinting: 4,
}

const STRATEGY_LEVELS = ['minimal', 'moderate', 'aggressive', 'maximum'] as const

function determineStrategy(
  profile: ThreatProfile,
  config: NoScrapeConfig
): MutationPlan['strategy'] {
  if (config.protection.level === 'always') return 'aggressive'
  if (config.protection.level === 'never') return 'minimal'

  const riskOrder: Record<string, number> = {
    low: 0, moderate: 1, high: 2, critical: 3,
  }
  const levelOrder: Record<string, number> = {
    minimal: 0, moderate: 1, aggressive: 2, maximum: 3,
  }

  const riskIdx = riskOrder[profile.risk_level] ?? 0
  const configIdx = levelOrder[config.protection.level === 'adaptive'
    ? STRATEGY_LEVELS[Math.min(1, riskIdx)]
    : config.protection.level === 'always' ? 'aggressive' : 'minimal'] ?? 0

  return STRATEGY_LEVELS[Math.max(riskIdx, configIdx)]
}

function selectMutations(
  strategy: MutationPlan['strategy'],
  profile: ThreatProfile,
  config: NoScrapeConfig
): MutationType[] {
  const enabled = getEnabledMutations(config, strategy)
  const levelIdx = STRATEGY_LEVELS.indexOf(strategy)

  const base: MutationType[] = []
  if (levelIdx >= 0) base.push('dom_fragmentation', 'attribute_shuffle', 'zero_width_injection')
  if (levelIdx >= 1) base.push('visual_reordering', 'semantic_noise')
  if (levelIdx >= 2) base.push('honeypots')
  if (levelIdx >= 3) base.push('fingerprinting')

  return base.filter(m => enabled.includes(m))
}

function estimateOverhead(mutations: MutationType[]): number {
  return mutations.reduce((total, m) => total + (MUTATION_OVERHEADS[m] ?? 3), 0)
}

export function planMutations(
  profile: ThreatProfile,
  config: NoScrapeConfig
): MutationPlan {
  const strategy = determineStrategy(profile, config)
  const mutations = selectMutations(strategy, profile, config)

  return {
    strategy,
    mutations,
    priority_selectors: profile.valuable_selectors,
    estimated_overhead_ms: estimateOverhead(mutations),
  }
}
