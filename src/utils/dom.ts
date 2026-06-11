export function findTextNodes($: any, root: any): string[] {
  const texts: string[] = []
  root.contents().each((_: any, node: any) => {
    if (node.type === 'text' && node.data?.trim()) {
      texts.push(node.data)
    } else if (node.type === 'tag' && !['script', 'style', 'noscript'].includes(node.tagName)) {
      texts.push(...findTextNodes($, $(node)))
    }
  })
  return texts
}

export function splitTextIntoChunks(text: string, chunkSize: number = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }
  return chunks
}

export function computeTextSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()
  const na = norm(a)
  const nb = norm(b)
  if (na.length === 0 && nb.length === 0) return 1
  if (na.length === 0 || nb.length === 0) return 0
  let matches = 0
  let ai = 0
  let bi = 0
  while (ai < na.length && bi < nb.length) {
    if (na[ai] === nb[bi]) { matches++; ai++; bi++ }
    else if (na.length - ai > nb.length - bi) ai++
    else bi++
  }
  return matches / Math.max(na.length, nb.length)
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
