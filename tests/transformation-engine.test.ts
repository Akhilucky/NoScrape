import { describe, it, expect } from 'vitest'
import { applyMutations } from '../src/agents/transformation-engine.js'
import { MutationPlan } from '../src/types.js'

const SAMPLE_HTML = `<!DOCTYPE html>
<html><head><title>Test</title></head><body>
  <article id="main">
    <h1>Test Article</h1>
    <p class="content">This is a test paragraph with enough content to trigger fragmentation and other mutations. It contains multiple sentences that should demonstrate the transformation engine working correctly across all mutation types.</p>
    <p>Another paragraph with additional premium content that needs to be protected from automated extraction by AI scrapers and LLM crawlers.</p>
  </article>
</body></html>`

describe('TransformationEngine', () => {
  const aggressivePlan: MutationPlan = {
    strategy: 'aggressive',
    mutations: ['dom_fragmentation', 'attribute_shuffle', 'zero_width_injection', 'visual_reordering', 'semantic_noise', 'honeypots', 'fingerprinting'],
    priority_selectors: ['article'],
    estimated_overhead_ms: 29,
  }

  const minimalPlan: MutationPlan = {
    strategy: 'minimal',
    mutations: ['dom_fragmentation', 'attribute_shuffle', 'zero_width_injection'],
    priority_selectors: [],
    estimated_overhead_ms: 10,
  }

  it('should apply all mutations without errors', () => {
    const result = applyMutations(SAMPLE_HTML, aggressivePlan)
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(SAMPLE_HTML.length)
  })

  it('should preserve original document structure', () => {
    const result = applyMutations(SAMPLE_HTML, aggressivePlan)
    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<h1>Test Article</h1>')
    expect(result).toContain('<article')
  })

  it('should inject noscrape-fragment elements', () => {
    const result = applyMutations(SAMPLE_HTML, aggressivePlan)
    expect(result).toContain('noscrape-fragment')
    expect(result).toContain('ns-frag')
  })

  it('should inject honeypot elements at aggressive+ levels', () => {
    const result = applyMutations(SAMPLE_HTML, aggressivePlan)
    expect(result).toContain('ns-honeypot')
    expect(result).toContain('style="position:absolute;left:-9999px')
  })

  it('should inject fingerprinting elements', () => {
    const result = applyMutations(SAMPLE_HTML, aggressivePlan)
    expect(result).toContain('ns-tracker')
    expect(result).toContain('noscrape-id')
  })

  it('should inject semantic noise elements', () => {
    const result = applyMutations(SAMPLE_HTML, aggressivePlan)
    expect(result).toContain('ns-noise')
  })

  it('should handle minimal mutation plan', () => {
    const result = applyMutations(SAMPLE_HTML, minimalPlan)
    expect(result).toBeTruthy()
    expect(result).toContain('noscrape-fragment')
  })

  it('should handle empty HTML gracefully', () => {
    const result = applyMutations('', aggressivePlan)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})
