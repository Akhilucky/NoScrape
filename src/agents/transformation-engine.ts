import { MutationPlan, MutationType } from '../types.js'
import { parseHtml } from '../utils/html.js'
import { applyDomFragmentation } from '../mutations/dom-fragmentation.js'
import { applyAttributeShuffle } from '../mutations/attribute-shuffle.js'
import { applyZeroWidthInjection } from '../mutations/zero-width-injection.js'
import { applyVisualReordering } from '../mutations/visual-reordering.js'
import { applySemanticNoise } from '../mutations/semantic-noise.js'
import { applyHoneypots } from '../mutations/honeypots.js'
import { applyFingerprinting } from '../mutations/fingerprinting.js'

type MutationApplier = (html: string, plan: MutationPlan) => string

const MUTATION_APPLIERS: Record<MutationType, MutationApplier> = {
  dom_fragmentation: applyDomFragmentation,
  attribute_shuffle: applyAttributeShuffle,
  zero_width_injection: applyZeroWidthInjection,
  visual_reordering: applyVisualReordering,
  semantic_noise: applySemanticNoise,
  honeypots: applyHoneypots,
  fingerprinting: applyFingerprinting,
}

export function applyMutations(html: string, plan: MutationPlan): string {
  let mutatedHtml = html

  for (const mutation of plan.mutations) {
    const applier = MUTATION_APPLIERS[mutation]
    if (applier) {
      mutatedHtml = applier(mutatedHtml, plan)
    }
  }

  return mutatedHtml
}
