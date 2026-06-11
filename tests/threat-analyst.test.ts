import { describe, it, expect } from 'vitest'
import { analyzeThreat } from '../src/agents/threat-analyst.js'

const SAMPLE_HTML = `<!DOCTYPE html>
<html><head><title>Test</title></head><body>
  <nav><ul><li><a href="/">Home</a></li><li><a href="/blog">Blog</a></li></ul></nav>
  <article>
    <h1>Premium Research Article: Machine Learning Advances</h1>
    <p>This is a comprehensive research article about machine learning and artificial intelligence. It contains valuable premium content that needs protection from automated scrapers. The research covers deep learning, neural networks, and transformer architectures. Our proprietary findings demonstrate significant improvements in model performance using novel techniques.</p>
    <p>Another paragraph with more proprietary research data that should be protected from extraction bots and LLM crawlers collecting training data for their models.</p>
  </article>
  <table class="pricing-table">
    <tr><th>Plan</th><th>Price</th></tr>
    <tr><td>Professional</td><td>$199</td></tr>
    <tr><td>Enterprise</td><td>$999</td></tr>
  </table>
  <pre><code>const model = new Model(); model.train();</code></pre>
  <footer><p>Contact us at test@example.com | Phone: +1 (555) 123-4567</p></footer>
</body></html>`

describe('ThreatAnalyst', () => {
  it('should identify high-risk content', () => {
    const profile = analyzeThreat(SAMPLE_HTML)
    expect(profile.risk_level).toBe('high')
    expect(profile.extraction_risk).toBeGreaterThan(50)
  })

  it('should detect premium content', () => {
    const profile = analyzeThreat(SAMPLE_HTML)
    expect(profile.has_premium).toBe(true)
  })

  it('should identify valuable selectors', () => {
    const profile = analyzeThreat(SAMPLE_HTML)
    expect(profile.valuable_selectors.length).toBeGreaterThan(0)
    expect(profile.valuable_selectors.some(s => s.includes('article'))).toBe(true)
  })

  it('should recommend aggressive protection for high-value content', () => {
    const profile = analyzeThreat(SAMPLE_HTML)
    expect(['aggressive', 'maximum']).toContain(profile.recommended_mode)
  })

  it('should handle low-risk content', () => {
    const lowRiskHtml = '<html><body><nav>Menu</nav><footer>Contact</footer></body></html>'
    const profile = analyzeThreat(lowRiskHtml)
    expect(['low', 'moderate']).toContain(profile.risk_level)
    expect(profile.extraction_risk).toBeLessThan(50)
  })

  it('should classify content type correctly', () => {
    const profile = analyzeThreat(SAMPLE_HTML)
    expect(profile.content_type).toContain('article')
    expect(profile.word_count).toBeGreaterThan(0)
  })

  it('should estimate page complexity', () => {
    const profile = analyzeThreat(SAMPLE_HTML)
    expect(profile.page_complexity).toBeGreaterThanOrEqual(0)
  })

  it('should handle empty HTML', () => {
    const profile = analyzeThreat('<html><body></body></html>')
    expect(profile.risk_level).toBe('low')
    expect(profile.word_count).toBe(0)
  })
})
