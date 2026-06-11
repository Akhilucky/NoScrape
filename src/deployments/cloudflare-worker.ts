import { protect } from '../index.js'

export interface Env {
  NOSCRAPE_CONFIG?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    try {
      const url = new URL(request.url)

      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok', service: 'noscrape' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (url.pathname === '/protect' && request.method === 'POST') {
        const body = await request.json() as { html: string; url?: string; headers?: Record<string, string> }
        if (!body.html) {
          return new Response(JSON.stringify({ error: 'html is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const result = await protect(body)
        return new Response(JSON.stringify(result), {
          headers: {
            'Content-Type': 'application/json',
            'X-Protection-Score': String(result.evaluation.protection_score),
            'X-Human-Fidelity': String(result.evaluation.human_fidelity),
          },
        })
      }

      return new Response('Not found', { status: 404 })
    } catch (err) {
      return new Response(JSON.stringify({ error: (err as Error).message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}
