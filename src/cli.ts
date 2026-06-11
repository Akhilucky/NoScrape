#!/usr/bin/env node
import { program } from 'commander'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { protect, loadConfig } from './index.js'

program
  .name('noscrape')
  .description('NoScrape - adversarial web proxy that protects against AI scraping')
  .version('0.1.0')

program
  .command('start')
  .description('Start the NoScrape interceptor (local proxy)')
  .option('-p, --port <port>', 'Port to listen on', '8080')
  .option('-t, --target <url>', 'Upstream target URL (proxy mode)')
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    const { startInterceptor } = await import('./agents/traffic-interceptor.js')
    let config

    if (options.config && existsSync(options.config)) {
      const { parse } = await import('yaml')
      const raw = readFileSync(options.config, 'utf-8')
      config = parse(raw)
    }

    startInterceptor({
      port: parseInt(options.port, 10),
      target: options.target,
      config,
    })
  })

program
  .command('proxy')
  .description('Start NoScrape as a reverse proxy')
  .option('-p, --port <port>', 'Port to listen on', '8080')
  .option('-t, --target <url>', 'Upstream target URL')
  .option('-c, --config <path>', 'Path to config file')
  .action((options) => {
    const args = ['start']
    if (options.port) args.push('--port', options.port)
    if (options.target) args.push('--target', options.target)
    if (options.config) args.push('--config', options.config)
    program.parse(['node', 'noscrape', ...args], { from: 'user' })
  })

program
  .command('audit <url>')
  .description('Analyze a URL for scraping risk')
  .option('-o, --output <file>', 'Output file for audit report')
  .action(async (url, options) => {
    try {
      console.log(`Fetching ${url}...`)
      const resp = await fetch(url)
      const html = await resp.text()

      const result = await protect({ html, url })

      console.log('\n=== Threat Analysis ===')
      console.log(`Risk Level: ${result.threat_profile.risk_level}`)
      console.log(`Content Type: ${result.threat_profile.content_type}`)
      console.log(`Extraction Risk: ${result.threat_profile.extraction_risk}/100`)
      console.log(`Word Count: ${result.threat_profile.word_count}`)
      console.log(`Premium Content: ${result.threat_profile.has_premium}`)

      console.log('\n=== Mutation Plan ===')
      console.log(`Strategy: ${result.mutation_plan.strategy}`)
      console.log(`Mutations: ${result.mutation_plan.mutations.join(', ')}`)
      console.log(`Est. Overhead: ${result.mutation_plan.estimated_overhead_ms}ms`)

      console.log('\n=== Evaluation ===')
      console.log(`Protection Score: ${result.evaluation.protection_score}/100`)
      console.log(`Human Fidelity: ${result.evaluation.human_fidelity}%`)
      console.log(`Scraper Success Rate: ${result.evaluation.scraper_success_rate}%`)
      console.log(`Recommendation: ${result.evaluation.recommendation}`)

      for (const detail of result.evaluation.details) {
        console.log(`  ${detail}`)
      }

      if (result.evaluation.feedback.length > 0) {
        console.log('\n=== Feedback ===')
        for (const fb of result.evaluation.feedback) {
          console.log(`  * ${fb}`)
        }
      }

      console.log(`\nProcessing Time: ${result.processing_time_ms}ms`)

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(result, null, 2), 'utf-8')
        console.log(`\nAudit report written to ${options.output}`)
      }
    } catch (err) {
      console.error('Audit failed:', (err as Error).message)
      process.exit(1)
    }
  })

program
  .command('benchmark')
  .description('Run performance benchmark')
  .option('-n, --iterations <n>', 'Number of iterations', '20')
  .option('-f, --file <path>', 'HTML file to use for benchmarking')
  .action(async (options) => {
    const iterations = parseInt(options.iterations, 10)
    const defaultHtml = '<html><body><article><h1>Benchmark Test</h1>' +
      '<p>' + 'test content '.repeat(100) + '</p></article></body></html>'
    const html = options.file && existsSync(options.file)
      ? readFileSync(options.file, 'utf-8')
      : defaultHtml

    console.log(`Running ${iterations} iterations...`)
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await protect({ html })
      times.push(performance.now() - start)
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)
    const p50 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.5)]
    const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]

    console.log('\n=== Benchmark Results ===')
    console.log(`Iterations: ${iterations}`)
    console.log(`Average: ${avg.toFixed(2)}ms`)
    console.log(`Min: ${min.toFixed(2)}ms`)
    console.log(`Max: ${max.toFixed(2)}ms`)
    console.log(`P50: ${p50.toFixed(2)}ms`)
    console.log(`P95: ${p95.toFixed(2)}ms`)
    console.log(`Passes (<50ms target): ${times.filter(t => t < 50).length}/${iterations}`)
  })

program
  .command('report')
  .description('Generate a protection report from an audit file')
  .argument('<audit-file>', 'Path to audit JSON file')
  .action((auditFile) => {
    if (!existsSync(auditFile)) {
      console.error(`File not found: ${auditFile}`)
      process.exit(1)
    }
    const data = JSON.parse(readFileSync(auditFile, 'utf-8'))
    console.log('=== NoScrape Protection Report ===')
    console.log(`URL: ${data.url || 'N/A'}`)
    console.log(`Risk Level: ${data.threat_profile?.risk_level || 'N/A'}`)
    console.log(`Strategy: ${data.mutation_plan?.strategy || 'N/A'}`)
    console.log(`Protection Score: ${data.evaluation?.protection_score || 'N/A'}/100`)
    console.log(`Human Fidelity: ${data.evaluation?.human_fidelity || 'N/A'}%`)
    console.log(`Scraper Success Rate: ${data.evaluation?.scraper_success_rate || 'N/A'}%`)
    console.log(`Processing Time: ${data.processing_time_ms || 'N/A'}ms`)
    if (data.evaluation?.feedback?.length) {
      console.log('\nRecommendations:')
      data.evaluation.feedback.forEach((fb: string) => console.log(`  * ${fb}`))
    }
  })

program
  .command('fingerprint')
  .description('Generate a unique fingerprint for tracking scrapers')
  .action(() => {
    const id = 'ns_' + Array.from({ length: 16 }, () =>
      'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
    ).join('')
    console.log(JSON.stringify({
      tracker_id: id,
      generated_at: new Date().toISOString(),
      html_snippet: `<meta name="noscrape-id" content="${id}">`,
    }, null, 2))
  })

program
  .command('protect <html-file>')
  .description('Protect an HTML file (one-shot)')
  .option('-o, --output <file>', 'Output file for protected HTML')
  .option('-j, --json', 'Output full analysis as JSON')
  .action(async (htmlFile, options) => {
    try {
      const html = readFileSync(htmlFile, 'utf-8')
      const result = await protect({ html })

      if (options.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        console.log(`Risk Level: ${result.threat_profile.risk_level}`)
        console.log(`Strategy: ${result.mutation_plan.strategy}`)
        console.log(`Protection Score: ${result.evaluation.protection_score}/100`)
        console.log(`Scraper Success Rate: ${result.evaluation.scraper_success_rate}%`)
        console.log(`Processing Time: ${result.processing_time_ms}ms`)

        if (options.output) {
          writeFileSync(options.output, result.protected_html, 'utf-8')
          console.log(`Protected HTML written to ${options.output}`)
        }
      }
    } catch (err) {
      console.error('Error:', (err as Error).message)
      process.exit(1)
    }
  })

program.parse(process.argv)
