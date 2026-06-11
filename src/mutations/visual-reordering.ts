import { MutationPlan } from '../types.js'
import { parseHtml } from '../utils/html.js'
import { shuffleArray } from '../utils/dom.js'

const SHUFFLE_THRESHOLDS: Record<string, number> = {
  minimal: 0,
  moderate: 4,
  aggressive: 3,
  maximum: 2,
}

export function applyVisualReordering(html: string, plan: MutationPlan): string {
  const threshold = SHUFFLE_THRESHOLDS[plan.strategy]
  if (threshold === 0) return html

  const { $ } = parseHtml(html)

  const reorderTextNodes = ($root: any) => {
    $root.contents().each((_: any, node: any) => {
      if (node.type === 'tag' && !['script', 'style', 'noscript'].includes(node.tagName)) {
        reorderTextNodes($(node))
      }
    })

    const paragraphs: any[] = []
    $root.children('p, div, section, article, li, blockquote').each((_: any, el: any) => {
      const text = $(el).text().trim()
      if (text.split(/\s+/).length > threshold * 2) {
        paragraphs.push($(el))
      }
    })

    const sentencePattern = /([^.!?]+[.!?])\s*/g

    for (const $p of paragraphs) {
      const text = $p.text()
      const sentences: string[] = []
      let match
      while ((match = sentencePattern.exec(text)) !== null) {
        sentences.push(match[1].trim())
      }
      if (sentences.length < 3) continue

      const htmlContent = $p.html() || ''
      const hasNestedElements = /<[a-z][^>]*>/.test(htmlContent.replace(/<\/?(p|div|span)[^>]*>/g, ''))
      if (hasNestedElements) continue

      const half = Math.floor(sentences.length / 2)
      const firstHalf = sentences.slice(0, half)
      const secondHalf = sentences.slice(half)
      const reordered = [...shuffleArray(secondHalf), ...shuffleArray(firstHalf)]

      $p.html(reordered.join(' '))
    }
  }

  reorderTextNodes($('body'))
  return $.html()
}
