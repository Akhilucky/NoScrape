export interface ThreatProfile {
  risk_level: 'low' | 'moderate' | 'high' | 'critical'
  content_type: string
  recommended_mode: 'minimal' | 'moderate' | 'aggressive' | 'maximum'
  extraction_risk: number
  valuable_selectors: string[]
  word_count: number
  has_premium: boolean
  page_complexity: number
}

export interface MutationPlan {
  strategy: 'minimal' | 'moderate' | 'aggressive' | 'maximum'
  mutations: MutationType[]
  priority_selectors: string[]
  estimated_overhead_ms: number
}

export type MutationType =
  | 'dom_fragmentation'
  | 'attribute_shuffle'
  | 'zero_width_injection'
  | 'visual_reordering'
  | 'semantic_noise'
  | 'honeypots'
  | 'fingerprinting'

export interface MutationConfig {
  dom_fragmentation: boolean
  attribute_shuffle: boolean
  zero_width_injection: boolean
  visual_reordering: boolean
  semantic_noise: boolean
  honeypots: boolean
  fingerprinting: boolean
}

export interface NoScrapeConfig {
  mode: 'proxy' | 'worker' | 'build' | 'mcp'
  protection: {
    level: 'adaptive' | 'always' | 'never'
  }
  mutations: MutationConfig
  evaluation: {
    enabled: boolean
  }
  fingerprinting?: {
    tracker_id?: string
    cookie_name?: string
  }
}

export interface ExtractionSnapshot {
  method: string
  success: boolean
  extracted_preview: string
  similarity: number
  character_preservation: number
}

export interface EvaluationResult {
  human_fidelity: number
  scraper_success_rate: number
  protection_score: number
  extraction_methods: ExtractionSnapshot[]
  degradation_rate: number
  recommendation: 'failed' | 'partial' | 'successful'
  details: string[]
  feedback: string[]
}

export interface PipelineInput {
  html: string
  url?: string
  headers?: Record<string, string>
  config?: Partial<NoScrapeConfig>
}

export interface PipelineOutput {
  original_html: string
  protected_html: string
  threat_profile: ThreatProfile
  mutation_plan: MutationPlan
  evaluation: EvaluationResult
  processing_time_ms: number
}
