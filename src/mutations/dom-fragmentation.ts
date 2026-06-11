import { MutationPlan } from '../types.js'
import { parseHtml } from '../utils/html.js'

const CHUNK_SIZES: Record<string, number> = {
  minimal: 10,
  moderate: 5,
  aggressive: 3,
  maximum: 2,
}

export function applyDomFragmentation(html: string, plan: MutationPlan): string {
  const { $ } = parseHtml(html)
  const chunkSize = CHUNK_SIZES[plan.strategy] || 5

  const fragmentTextNodes = ($root: any) => {
    const toProcess: Array<{ parent: any; nodes: any[] }> = []

    $root.contents().each((_: any, node: any) => {
      if (node.type === 'tag' && !['script', 'style', 'noscript', 'br', 'hr'].includes(node.tagName)) {
        fragmentTextNodes($(node))
      }
    })

    $root.contents().each((_: any, node: any) => {
      if (node.type === 'text') {
        const text = node.data ?? ''
        const trimmed = text.trim()
        if (trimmed.length > 30) {
          const words = trimmed.split(/\s+/)
          if (words.length > chunkSize) {
            toProcess.push({ parent: $root, nodes: [node] })
          }
        }
      }
    })

    for (const { parent, nodes } of toProcess) {
      for (const node of nodes) {
        const text = (node as any).data ?? ''
        const words = text.trim().split(/\s+/)
        const chunks: string[] = []
        for (let i = 0; i < words.length; i += chunkSize) {
          chunks.push(words.slice(i, i + chunkSize).join(' '))
        }

        const fragment = $(`<noscrape-fragment>`)
        for (const chunk of chunks) {
          fragment.append(`<span class="ns-frag" style="display:inline">${chunk} </span>`)
        }
        $(node).replaceWith(fragment)
      }
    }
  }

  fragmentTextNodes($('body'))
  return $.html()
}
