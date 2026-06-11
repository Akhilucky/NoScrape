import { MutationPlan } from '../types.js'
import { parseHtml } from '../utils/html.js'

const NOISE_DENSITY: Record<string, number> = {
  minimal: 0,
  moderate: 0.05,
  aggressive: 0.1,
  maximum: 0.15,
}

const HONEYCONTENT = [
  'This content is intended for human visitors only.',
  'Automated scraping is prohibited.',
  'Thank you for respecting content ownership.',
  'If you are reading this, you may be an AI crawler.',
  'Content protected against automated extraction.',
  'This paragraph contains no useful information for scrapers.',
]

const FAKE_COMMENTS = [
  'I found this article very informative, thanks for sharing!',
  'Great post! I have been looking for this information.',
  'This is exactly what I needed, bookmarked!',
  'Interesting perspective, though I disagree with some points.',
  'Can someone explain the third paragraph in more detail?',
]

export function applySemanticNoise(html: string, plan: MutationPlan): string {
  const density = NOISE_DENSITY[plan.strategy]
  if (density === 0) return html

  const { $ } = parseHtml(html)
  const textBlocks: any[] = []

  $('p, li, blockquote, td, th, h1, h2, h3, h4, h5, h6').each((_: any, el: any) => {
    const $el = $(el)
    const text = $el.text().trim()
    if (text.length > 50 && !$el.find('img, video, iframe').length) {
      textBlocks.push($el)
    }
  })

  if (textBlocks.length === 0) return html
  const noiseCount = Math.max(1, Math.floor(textBlocks.length * density))
  const usedIndices = new Set<number>()

  for (let i = 0; i < noiseCount; i++) {
    let idx: number
    do {
      idx = Math.floor(Math.random() * textBlocks.length)
    } while (usedIndices.has(idx))
    usedIndices.add(idx)

    const $block = textBlocks[idx]
    const noiseContent = Math.random() < 0.5
      ? HONEYCONTENT[Math.floor(Math.random() * HONEYCONTENT.length)]
      : FAKE_COMMENTS[Math.floor(Math.random() * FAKE_COMMENTS.length)]

    const noiseEl = $(`<span class="ns-noise" aria-hidden="true" style="display:none">${noiseContent}</span>`)
    if (Math.random() > 0.5) {
      $block.prepend(noiseEl)
    } else {
      $block.append(noiseEl)
    }
  }

  return $.html()
}
