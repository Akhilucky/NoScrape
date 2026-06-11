#!/usr/bin/env node
import express from 'express'
import { protect } from '../index.js'
import { readFileSync, existsSync } from 'node:fs'

export function createProxyServer(options: { port?: number; target?: string; configPath?: string } = {}) {
  const app = express()
  app.use(express.json({ limit: '10mb' }))
  app.use(express.text({ limit: '10mb', type: 'text/html' }))

  let config: Record<string, unknown> | undefined
  if (options.configPath && existsSync(options.configPath)) {
    try {
      config = JSON.parse(readFileSync(options.configPath, 'utf-8'))
    } catch { /* ignore */ }
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'noscrape-proxy' })
  })

  app.post('/protect', async (req, res) => {
    try {
      const html = typeof req.body === 'string' ? req.body : req.body?.html
      if (!html) {
        return res.status(400).json({ error: 'html is required' })
      }

      const result = await protect({
        html,
        url: req.body?.url,
        headers: req.body?.headers,
        config: config as any,
      })

      res.json(result)
    } catch (err) {
      res.status(500).json({ error: (err as Error).message })
    }
  })

  if (options.target) {
    app.use(async (req, res) => {
      try {
        const resp = await fetch(`${options.target}${req.originalUrl}`)
        const html = await resp.text()
        const contentType = resp.headers.get('content-type') || ''

        if (contentType.includes('text/html')) {
          const result = await protect({
            html,
            url: req.originalUrl,
            config: config as any,
          })
          res.set('X-Protection-Score', String(result.evaluation.protection_score))
          res.set('X-Human-Fidelity', String(result.evaluation.human_fidelity))
          res.send(result.protected_html)
        } else {
          res.set('Content-Type', contentType)
          res.send(html)
        }
      } catch (err) {
        res.status(502).json({ error: `Proxy error: ${(err as Error).message}` })
      }
    })
  }

  return app
}

const port = parseInt(process.argv[2]?.replace('--port=', '') || process.env.PORT || '3000', 10)
const target = process.env.PROXY_TARGET
const configPath = process.env.CONFIG_PATH

if (process.argv[1]?.endsWith('reverse-proxy.js') || process.argv[1]?.endsWith('reverse-proxy.ts')) {
  const app = createProxyServer({ port, target, configPath })
  app.listen(port, () => {
    console.log(`NoScrape Reverse Proxy running on port ${port}${target ? ` → ${target}` : ''}`)
  })
}
