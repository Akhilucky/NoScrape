import { describe, it, expect } from 'vitest'
import { evaluateProtection } from '../src/agents/adversarial-evaluator.js'
import { applyMutations } from '../src/agents/transformation-engine.js'
import { MutationPlan, ThreatProfile } from '../src/types.js'

const ORIGINAL_HTML = `<!DOCTYPE html>
<html><head><title>Test</title></head><body>
  <article>
    <h1>Protected Research Paper</h1>
    <p>This is premium research content about machine learning algorithms and their applications in natural language processing. The paper presents novel approaches to transformer architecture optimization that significantly improve training efficiency.</p>
    <p>Our experimental results demonstrate a 15% improvement in training efficiency while maintaining model quality. These findings have significant implications for the field of artificial intelligence and deep learning research.</p>
  </article>
</body></html>`

const PLAN: MutationPlan = {
  strategy: 'aggressive',
  mutations: ['dom_fragmentation', 'attribute_shuffle', 'zero_width_injection', 'visual_reordering', 'semantic_noise', 'honeypots', 'fingerprinting'],
  priority_selectors: ['article'],
  estimated_overhead_ms: 29,
}

const PROFILE: ThreatProfile = {
  risk_level: 'high',
  content_type: 'article',
  recommended_mode: 'aggressive',
  extraction_risk: 70,
  valuable_selectors: ['article'],
  word_count: 100,
  has_premium: true,
  page_complexity: 20,
}

describe('AdversarialEvaluator', () => {
  it('should evaluate protection with new output format', () => {
    const protectedHtml = applyMutations(ORIGINAL_HTML, PLAN)
    const evaluation = evaluateProtection(ORIGINAL_HTML, protectedHtml, PLAN, PROFILE)
    expect(evaluation.protection_score).toBeGreaterThanOrEqual(0)
    expect(evaluation.protection_score).toBeLessThanOrEqual(100)
    expect(evaluation.human_fidelity).toBeGreaterThanOrEqual(0)
    expect(evaluation.human_fidelity).toBeLessThanOrEqual(100)
    expect(evaluation.scraper_success_rate).toBeGreaterThanOrEqual(0)
    expect(evaluation.scraper_success_rate).toBeLessThanOrEqual(100)
  })

  it('should test all four extraction methods', () => {
    const protectedHtml = applyMutations(ORIGINAL_HTML, PLAN)
    const evaluation = evaluateProtection(ORIGINAL_HTML, protectedHtml, PLAN, PROFILE)
    const methods = evaluation.extraction_methods.map(m => m.method)
    expect(methods).toContain('simple_dom')
    expect(methods).toContain('html_parsing')
    expect(methods).toContain('headless_browser')
    expect(methods).toContain('llm_reconstruction')
  })

  it('should provide detailed results', () => {
    const protectedHtml = applyMutations(ORIGINAL_HTML, PLAN)
    const evaluation = evaluateProtection(ORIGINAL_HTML, protectedHtml, PLAN, PROFILE)
    expect(evaluation.details.length).toBeGreaterThan(0)
  })

  it('should report degradation rate', () => {
    const protectedHtml = applyMutations(ORIGINAL_HTML, PLAN)
    const evaluation = evaluateProtection(ORIGINAL_HTML, protectedHtml, PLAN, PROFILE)
    expect(evaluation.degradation_rate).toBeGreaterThanOrEqual(0)
    expect(evaluation.degradation_rate).toBeLessThanOrEqual(1)
  })

  it('should generate feedback for improvement', () => {
    const protectedHtml = applyMutations(ORIGINAL_HTML, PLAN)
    const evaluation = evaluateProtection(ORIGINAL_HTML, protectedHtml, PLAN, PROFILE)
    expect(Array.isArray(evaluation.feedback)).toBe(true)
  })
})
