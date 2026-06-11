import { MutationPlan } from '../types.js'
import { parseHtml } from '../utils/html.js'

export function applyAttributeShuffle(html: string, plan: MutationPlan): string {
  if (plan.strategy === 'minimal') return html
  const { $ } = parseHtml(html)

  const shuffleArray = <T>(arr: T[]): T[] => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const shuffleRate = plan.strategy === 'maximum' ? 0.8
    : plan.strategy === 'aggressive' ? 0.5
    : plan.strategy === 'moderate' ? 0.3
    : 0.1

  $('*').each((_: any, el: any) => {
    const $el = $(el)
    const attrs = el.attribs ?? {}
    const attrKeys = Object.keys(attrs)

    if (attrKeys.length < 2) return
    if (Math.random() > shuffleRate) return

    const shuffleKeys = attrKeys.filter(k => !k.startsWith('data-') && k !== 'src' && k !== 'href' && k !== 'style')
    if (shuffleKeys.length < 2) return

    const shuffled = shuffleArray(shuffleKeys)
    for (const key of shuffleKeys) {
      $el.removeAttr(key)
    }
    for (const key of shuffled) {
      $el.attr(key, attrs[key])
    }
  })

  return $.html()
}
