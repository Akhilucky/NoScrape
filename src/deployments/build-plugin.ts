import { protect } from '../index.js'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

export interface BuildPluginOptions {
  inputDir: string
  outputDir: string
  pattern?: string
  config?: Record<string, unknown>
}

export async function buildWithProtection(options: BuildPluginOptions): Promise<{
  protectedCount: number
  files: string[]
  results: Array<{ file: string; protection_score: number; human_fidelity: number }>
}> {
  const { inputDir, outputDir, pattern = '**/*.html', config } = options

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const results: Array<{ file: string; protection_score: number; human_fidelity: number }> = []
  const files: string[] = []

  const { glob } = await import('node:fs/promises')

  for await (const entry of glob(pattern, { cwd: inputDir })) {
    const inputPath = join(inputDir, entry as string)
    const outputPath = join(outputDir, entry as string)
    const outputDirname = resolve(outputPath, '..')

    if (!existsSync(outputDirname)) {
      mkdirSync(outputDirname, { recursive: true })
    }

    try {
      const html = readFileSync(inputPath, 'utf-8')
      const result = await protect({ html, config: config as any })

      writeFileSync(outputPath, result.protected_html, 'utf-8')
      files.push(entry as string)
      results.push({
        file: entry as string,
        protection_score: result.evaluation.protection_score,
        human_fidelity: result.evaluation.human_fidelity,
      })
    } catch (err) {
      console.error(`Error processing ${entry}:`, (err as Error).message)
    }
  }

  writeFileSync(
    join(outputDir, 'noscrape-report.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), files, results }, null, 2)
  )

  return {
    protectedCount: files.length,
    files,
    results,
  }
}
