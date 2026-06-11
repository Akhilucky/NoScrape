import { PipelineInput, PipelineOutput } from './types.js'
import { loadConfig } from './config.js'
import { analyzeThreat } from './agents/threat-analyst.js'
import { planMutations } from './agents/mutation-planner.js'
import { applyMutations } from './agents/transformation-engine.js'
import { evaluateProtection } from './agents/adversarial-evaluator.js'

export async function protect(input: PipelineInput): Promise<PipelineOutput> {
  const startTime = performance.now()

  const config = loadConfig(input.config)
  const threatProfile = analyzeThreat(input.html, input.url, input.headers)
  const mutationPlan = planMutations(threatProfile, config)
  const protectedHtml = applyMutations(input.html, mutationPlan)
  const evaluation = evaluateProtection(input.html, protectedHtml, mutationPlan, threatProfile)

  const endTime = performance.now()

  return {
    original_html: input.html,
    protected_html: protectedHtml,
    threat_profile: threatProfile,
    mutation_plan: mutationPlan,
    evaluation,
    processing_time_ms: Math.round(endTime - startTime),
  }
}

export { analyzeThreat } from './agents/threat-analyst.js'
export { planMutations } from './agents/mutation-planner.js'
export { applyMutations } from './agents/transformation-engine.js'
export { evaluateProtection } from './agents/adversarial-evaluator.js'
export { createTrafficInterceptor, startInterceptor } from './agents/traffic-interceptor.js'
export { loadConfig } from './config.js'
export * from './types.js'
