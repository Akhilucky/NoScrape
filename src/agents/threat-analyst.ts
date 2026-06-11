import { ThreatProfile } from '../types.js'
import { parseHtml, countWords, getTextContent } from '../utils/html.js'

const HIGH_VALUE_SELECTORS = [
  'article', '[class*="article"]', '[class*="post"]', '[class*="blog"]',
  '.content', '#content', '.post-content', '.entry-content',
  'main', '[role="main"]',
  'table', '[class*="pricing"]', '[class*="price"]',
  '[class*="documentation"]', '[class*="docs"]', '.documentation',
  '[class*="research"]', '[class*="paper"]',
  'pre', 'code', '[class*="code"]',
]

const HIGH_VALUE_KEYWORDS = [
  'premium', 'exclusive', 'member', 'subscribe', 'pricing', 'price',
  'documentation', 'api', 'guide', 'tutorial', 'research', 'study',
  'analysis', 'report', 'whitepaper', 'ebook', 'course', 'proprietary',
]

function estimateExtractionRisk($: any, textContent: string, wordCount: number): number {
  let risk = 0
  const lower = textContent.toLowerCase()

  if (wordCount > 1000) risk += 25
  else if (wordCount > 300) risk += 15
  else if (wordCount > 100) risk += 8

  const keywordMatches = HIGH_VALUE_KEYWORDS.filter(k => lower.includes(k)).length
  risk += Math.min(keywordMatches * 5, 25)

  const highValueElCount = HIGH_VALUE_SELECTORS.reduce((sum, sel) => sum + $(sel).length, 0)
  if (highValueElCount > 2) risk += 15
  else if (highValueElCount > 0) risk += 8

  const codeBlocks = $('pre, code').length
  if (codeBlocks > 0) risk += Math.min(codeBlocks * 5, 15)

  const tables = $('table').length
  if (tables > 0) risk += Math.min(tables * 8, 15)

  const linkDensity = $('a').length / Math.max($('*').length, 1)
  if (linkDensity < 0.1 && wordCount > 200) risk += 10

  return Math.min(100, risk)
}

function determineMode(risk: number, hasPremium: boolean, wordCount: number): ThreatProfile['recommended_mode'] {
  if (risk >= 70 || hasPremium || wordCount > 2000) return 'maximum'
  if (risk >= 50 || wordCount > 800) return 'aggressive'
  if (risk >= 30 || wordCount > 300) return 'moderate'
  return 'minimal'
}

function determineRiskLevel(risk: number): ThreatProfile['risk_level'] {
  if (risk >= 70) return 'critical'
  if (risk >= 50) return 'high'
  if (risk >= 30) return 'moderate'
  return 'low'
}

function estimateComplexity($: any): number {
  let maxDepth = 0
  const walk = (el: any, depth: number) => {
    if (depth > maxDepth) maxDepth = depth
    $(el).children().each((_: any, child: any) => walk(child, depth + 1))
  }
  $('body').children().each((_: any, child: any) => walk(child, 1))
  return Math.min(100, maxDepth * 5)
}

export function analyzeThreat(html: string, url?: string, headers?: Record<string, string>): ThreatProfile {
  const { $ } = parseHtml(html)
  const textContent = getTextContent(html)
  const wordCount = countWords(textContent)
  const lowerText = textContent.toLowerCase()

  const hasPremium = HIGH_VALUE_KEYWORDS.some(k => lowerText.includes(k))
    || HIGH_VALUE_SELECTORS.some((sel: string) => $(sel).length > 0 && countWords($(sel).text()) > 100)

  const extractionRisk = estimateExtractionRisk($, textContent, wordCount)
  const pageComplexity = estimateComplexity($)

  const contentTypes: string[] = []
  if ($('article').length > 0) contentTypes.push('article')
  if ($('table').length > 0) contentTypes.push('tabular')
  if ($('pre, code').length > 0) contentTypes.push('code')
  if ($('form').length > 0) contentTypes.push('interactive')
  if ($('img').length > 5) contentTypes.push('media-rich')
  const content_type = contentTypes.join(', ') || 'text'

  const valuableSelectors: string[] = []
  const seen = new Set<string>()
  for (const sel of HIGH_VALUE_SELECTORS) {
    $(sel).each((_: any, el: any) => {
      const $el = $(el)
      const text = $el.text().trim()
      if (text.length < 30) return
      const key = $el.attr('class') || $el.attr('id') || sel
      if (seen.has(key)) return
      seen.add(key)
      valuableSelectors.push(sel)
    })
  }

  return {
    risk_level: determineRiskLevel(extractionRisk),
    content_type,
    recommended_mode: determineMode(extractionRisk, hasPremium, wordCount),
    extraction_risk: extractionRisk,
    valuable_selectors: valuableSelectors.slice(0, 10),
    word_count: wordCount,
    has_premium: hasPremium,
    page_complexity: pageComplexity,
  }
}
