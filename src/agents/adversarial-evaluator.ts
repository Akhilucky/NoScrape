import { MutationPlan, ExtractionSnapshot, EvaluationResult, ThreatProfile } from '../types.js'
import { getTextContent, parseHtml } from '../utils/html.js'
import { computeTextSimilarity } from '../utils/dom.js'

function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '')
}

function simpleDomExtraction(html: string): string {
  const $ = parseHtml(stripHtmlComments(html)).$
  $('script, style, noscript, [aria-hidden="true"], [style*="display:none"], [style*="display: none"], .ns-noise, .ns-honeypot, [data-ns-track], [data-ns-beacon]').remove()
  return $('body').text().replace(/\s+/g, ' ').trim()
}

function htmlParsingExtraction(html: string): string {
  const $ = parseHtml(stripHtmlComments(html)).$
  $('[aria-hidden="true"], .ns-noise, .ns-honeypot, [style*="display:none"], [style*="display: none"], script, style, noscript, [data-ns-track], [data-ns-beacon], noscrape-fragment').remove()
  const texts: string[] = []
  $('p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, pre, code, div, span, article, section').each((_: any, el: any) => {
    const text = $(el).text().trim()
    if (text.length > 10 && !$(el).find('p, h1, h2, h3, h4, h5, h6, li').length) {
      texts.push(text)
    }
  })
  return texts.join(' ').replace(/\s+/g, ' ').trim()
}

function headlessBrowserExtraction(html: string): string {
  const $ = parseHtml(stripHtmlComments(html)).$
  $('[style*="display:none"], [style*="display: none"], [aria-hidden="true"], script, style, noscript').remove()
  const visible: string[] = []
  $('*').each((_: any, el: any) => {
    const $el = $(el)
    if ($el.children().length === 0 && $el.text().trim()) {
      const style = $el.attr('style') || ''
      if (!style.includes('display:none') && !style.includes('display: none')) {
        visible.push($el.text().trim())
      }
    }
  })
  return visible.join(' ').replace(/\s+/g, ' ').trim()
}

function llmReconstructionExtraction(html: string): string {
  let cleaned = stripHtmlComments(html)

  const { $ } = parseHtml(cleaned)
  $('script, style, noscript, [aria-hidden="true"], .ns-honeypot').remove()

  $('noscrape-fragment').each((_: any, el: any) => {
    const $el = $(el)
    const text = $el.text()
    $el.replaceWith(text)
  })

  cleaned = $.html()

  cleaned = cleaned.replace(/<div class="ns-prompt[^>]*>[\s\S]*?<\/div>/g, '')

  const $2 = parseHtml(cleaned).$
  $2('*').each((_: any, el: any) => {
    const $el = $2(el)
    const style = $el.attr('style') || ''
    if (style.includes('display:none') || style.includes('display: none')) {
      $el.remove()
    }
  })

  return getTextContent($2.html())
}

function extractOriginalContent(html: string): string {
  const $ = parseHtml(html).$
  return $('body').text().replace(/\s+/g, ' ').trim()
}

function evaluateExtraction(
  method: string,
  extractFn: (html: string) => string,
  originalHtml: string,
  protectedHtml: string
): ExtractionSnapshot {
  const originalText = extractOriginalContent(originalHtml)
  const extractedText = extractFn(protectedHtml)

  const similarity = computeTextSimilarity(originalText, extractedText)
  const originalChars = originalText.replace(/\s+/g, '').length
  const extractedChars = extractedText.replace(/\s+/g, '').length
  const characterPreservation = originalChars > 0 ? extractedChars / originalChars : 0

  return {
    method,
    success: similarity > 0.5,
    extracted_preview: extractedText.slice(0, 200),
    similarity,
    character_preservation: characterPreservation,
  }
}

function generateFeedback(evaluation: EvaluationResult, plan: MutationPlan): string[] {
  const feedback: string[] = []

  if (evaluation.protection_score < 50) {
    feedback.push('Protection score is low. Consider upgrading to a more aggressive strategy.')
    feedback.push('Add zero_width_injection to disrupt text extraction further.')
    if (!plan.mutations.includes('honeypots')) {
      feedback.push('Add honeypot elements to trap automated scrapers.')
    }
    if (!plan.mutations.includes('fingerprinting')) {
      feedback.push('Add fingerprinting to track scraper behavior.')
    }
  } else if (evaluation.protection_score < 75) {
    feedback.push('Protection is moderate. Consider adding visual_reordering and semantic_noise.')
    if (plan.strategy === 'moderate') {
      feedback.push('Upgrade strategy to aggressive for better protection.')
    }
  } else {
    feedback.push('Protection level is good. Current strategy is effective.')
  }

  const weakMethods = evaluation.extraction_methods
    .filter(m => m.success)
    .map(m => m.method)

  if (weakMethods.length > 0) {
    feedback.push(`Weak against: ${weakMethods.join(', ')}. Consider targeted countermeasures.`)
  }

  if (evaluation.scraper_success_rate > 25) {
    feedback.push(`Scraper success rate (${evaluation.scraper_success_rate}%) exceeds target (25%). Increase mutation intensity.`)
  }

  if (evaluation.human_fidelity < 99) {
    feedback.push(`Human fidelity (${evaluation.human_fidelity}%) below target (99%). Some mutations may be too aggressive.`)
  }

  return feedback
}

export function evaluateProtection(
  originalHtml: string,
  protectedHtml: string,
  plan: MutationPlan,
  profile: ThreatProfile
): EvaluationResult {
  const extractionMethods: ExtractionSnapshot[] = [
    evaluateExtraction('simple_dom', simpleDomExtraction, originalHtml, protectedHtml),
    evaluateExtraction('html_parsing', htmlParsingExtraction, originalHtml, protectedHtml),
    evaluateExtraction('headless_browser', headlessBrowserExtraction, originalHtml, protectedHtml),
    evaluateExtraction('llm_reconstruction', llmReconstructionExtraction, originalHtml, protectedHtml),
  ]

  const methods = extractionMethods
  const avgSimilarity = methods.reduce((s, m) => s + m.similarity, 0) / methods.length
  const avgCharPreservation = methods.reduce((s, m) => s + m.character_preservation, 0) / methods.length

  const scraperSuccessRate = Math.round(avgSimilarity * 100)
  const protectionScore = Math.round(100 - (avgCharPreservation * 100))
  const degradationRate = 1 - avgSimilarity

  const successfulMethods = methods.filter(m => !m.success).length
  const recommendation: EvaluationResult['recommendation'] =
    successfulMethods === methods.length ? 'successful'
    : successfulMethods >= 2 ? 'partial'
    : 'failed'

  const details: string[] = methods.map(m =>
    `${m.method}: similarity=${(m.similarity * 100).toFixed(1)}%, char_preservation=${(m.character_preservation * 100).toFixed(1)}%, success=${m.success}`
  )
  details.push(`Overall: protection_score=${protectionScore}, scraper_success_rate=${scraperSuccessRate}%, degradation=${(degradationRate * 100).toFixed(1)}%`)

  const evaluation: EvaluationResult = {
    human_fidelity: 100,
    scraper_success_rate: scraperSuccessRate,
    protection_score: Math.max(0, Math.min(100, protectionScore)),
    extraction_methods: methods,
    degradation_rate: degradationRate,
    recommendation,
    details,
    feedback: [],
  }

  evaluation.feedback = generateFeedback(evaluation, plan)
  evaluation.human_fidelity = Math.max(0, Math.min(100, 100 - Math.round(degradationRate * 10)))

  return evaluation
}
