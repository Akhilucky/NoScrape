import express from 'express'
import { protect } from '../index.js'
import { NoScrapeConfig } from '../types.js'

export interface InterceptorOptions {
  port: number
  target?: string
  config?: Partial<NoScrapeConfig>
}

export function createTrafficInterceptor(options: InterceptorOptions) {
  const app = express()

  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'noscrape-interceptor', mode: options.target ? 'proxy' : 'standalone' })
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
        config: options.config,
      })

      res.json(result)
    } catch (err) {
      res.status(500).json({ error: (err as Error).message })
    }
  })

  if (options.target) {
    app.use(async (req, res) => {
      try {
        const targetUrl = new URL(req.originalUrl, options.target)
        const resp = await fetch(targetUrl.toString(), {
          method: req.method as string,
          headers: req.headers as Record<string, string>,
          body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
        })

        const body = await resp.text()
        const contentType = resp.headers.get('content-type') || ''

        if (contentType.includes('text/html') && body.length > 0) {
          try {
            const result = await protect({
              html: body,
              url: req.originalUrl,
              headers: req.headers as Record<string, string>,
              config: options.config,
            })

            res.setHeader('X-Protection-Score', String(result.evaluation.protection_score))
            res.setHeader('X-Human-Fidelity', String(result.evaluation.human_fidelity))
            res.setHeader('Content-Type', contentType)
            res.writeHead(resp.status)
            res.end(result.protected_html)
          } catch {
            res.writeHead(resp.status, Object.fromEntries(resp.headers.entries()))
            res.end(body)
          }
        } else {
          res.writeHead(resp.status, Object.fromEntries(resp.headers.entries()))
          res.end(body)
        }
      } catch (err) {
        res.status(502).json({ error: `Proxy error: ${(err as Error).message}` })
      }
    })
  }

  return app
}

export function startInterceptor(options: InterceptorOptions) {
  const app = createTrafficInterceptor(options)
  const server = app.listen(options.port, () => {
    const mode = options.target ? `proxy mode → ${options.target}` : 'standalone mode'
    console.log(`NoScrape interceptor running on port ${options.port} (${mode})`)
  })
  return server
}
