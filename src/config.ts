import { NoScrapeConfig, MutationType } from './types.js'

const DEFAULT_CONFIG: NoScrapeConfig = {
  mode: 'proxy',
  protection: { level: 'adaptive' },
  mutations: {
    dom_fragmentation: true,
    attribute_shuffle: true,
    zero_width_injection: true,
    visual_reordering: true,
    semantic_noise: true,
    honeypots: true,
    fingerprinting: true,
  },
  evaluation: { enabled: true },
}

export function loadConfig(overrides?: Partial<NoScrapeConfig>): NoScrapeConfig {
  const config: NoScrapeConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG))

  if (overrides) {
    if (overrides.mode) config.mode = overrides.mode
    if (overrides.protection) config.protection = { ...config.protection, ...overrides.protection }
    if (overrides.mutations) config.mutations = { ...config.mutations, ...overrides.mutations }
    if (overrides.evaluation) config.evaluation = { ...config.evaluation, ...overrides.evaluation }
    if (overrides.fingerprinting) config.fingerprinting = { ...config.fingerprinting, ...overrides.fingerprinting }
  }

  return config
}

const MUTATION_ORDER: Record<string, number> = {
  minimal: 0,
  moderate: 1,
  aggressive: 2,
  maximum: 3,
}

export function getEnabledMutations(config: NoScrapeConfig, level: string): MutationType[] {
  const levelIdx = MUTATION_ORDER[level] ?? 0
  const enabled: MutationType[] = []

  if (config.mutations.dom_fragmentation && levelIdx >= 0) enabled.push('dom_fragmentation')
  if (config.mutations.attribute_shuffle && levelIdx >= 0) enabled.push('attribute_shuffle')
  if (config.mutations.zero_width_injection && levelIdx >= 0) enabled.push('zero_width_injection')
  if (config.mutations.visual_reordering && levelIdx >= 1) enabled.push('visual_reordering')
  if (config.mutations.semantic_noise && levelIdx >= 1) enabled.push('semantic_noise')
  if (config.mutations.honeypots && levelIdx >= 2) enabled.push('honeypots')
  if (config.mutations.fingerprinting && levelIdx >= 2) enabled.push('fingerprinting')

  return enabled
}
