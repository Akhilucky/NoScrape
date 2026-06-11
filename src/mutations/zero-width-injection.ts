import { MutationPlan } from '../types.js'
import { parseHtml } from '../utils/html.js'

const ZERO_WIDTH_CHARS = [
  '\u200B',
  '\u200C',
  '\u200D',
  '\uFEFF',
  '\u2060',
  '\u2061',
  '\u2062',
  '\u2063',
  '\u2064',
]

const INJECTION_DENSITY: Record<string, number> = {
  minimal: 0,
  moderate: 0.02,
  aggressive: 0.05,
  maximum: 0.08,
}

export function applyZeroWidthInjection(html: string, plan: MutationPlan): string {
  const density = INJECTION_DENSITY[plan.strategy]
  if (density === 0) return html

  const { $ } = parseHtml(html)

  const injectIntoText = (text: string): string => {
    if (text.length < 10) return text
    const chars = text.split('')
    const injectCount = Math.max(1, Math.floor(chars.length * density))
    const positions = new Set<number>()

    for (let i = 0; i < injectCount; i++) {
      let pos: number
      do {
        pos = Math.floor(Math.random() * chars.length)
      } while (positions.has(pos) || chars[pos] === ' ')
      positions.add(pos)
    }

    for (const pos of [...positions].sort((a, b) => b - a)) {
      const zwc = ZERO_WIDTH_CHARS[Math.floor(Math.random() * ZERO_WIDTH_CHARS.length)]
      text = text.slice(0, pos) + zwc + text.slice(pos)
    }

    return text
  }

  $('p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, span, div').each((_: any, el: any) => {
    const $el = $(el)
    if ($el.children().length > 0) return

    const text = $el.text()
    if (text.length < 20) return

    const mutated = injectIntoText(text)
    if (mutated !== text) {
      $el.text(mutated)
    }
  })

  return $.html()
}
