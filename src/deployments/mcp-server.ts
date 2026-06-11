#!/usr/bin/env node
import { protect } from '../index.js'
import { createServer } from 'node:http'

interface McpRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: Record<string, unknown>
}

interface McpResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: unknown
  error?: { code: number; message: string }
}

const VALID_METHODS = [
  'initialize',
  'protect',
  'analyze',
  'evaluate',
  'listMutations',
  'getStatus',
]

export function createMcpServer(options: { port?: number } = {}) {
  const port = options.port || 3001

  const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method !== 'POST') {
      res.writeHead(405)
      res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Method not allowed' } }))
      return
    }

    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', async () => {
      let request: McpRequest
      try {
        request = JSON.parse(body)
      } catch {
        res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }))
        return
      }

      if (request.jsonrpc !== '2.0') {
        res.end(JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: -32600, message: 'Invalid Request' } }))
        return
      }

      try {
        const response = await handleMethod(request)
        res.end(JSON.stringify(response))
      } catch (err) {
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32603, message: (err as Error).message },
        }))
      }
    })
  })

  async function handleMethod(request: McpRequest): Promise<McpResponse> {
    const { id, method, params } = request

    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            name: 'noscrape',
            version: '0.1.0',
            description: 'Adversarial web proxy that protects against AI scraping',
            methods: VALID_METHODS,
            capabilities: ['html_protection', 'threat_analysis', 'adversarial_evaluation'],
          },
        }

      case 'protect': {
        if (!params || typeof params.html !== 'string') {
          return { jsonrpc: '2.0', id, error: { code: -32602, message: 'html is required' } }
        }
        const result = await protect({
          html: params.html,
          url: params.url as string | undefined,
          headers: params.headers as Record<string, string> | undefined,
        })
        return { jsonrpc: '2.0', id, result }
      }

      case 'analyze': {
        if (!params || typeof params.html !== 'string') {
          return { jsonrpc: '2.0', id, error: { code: -32602, message: 'html is required' } }
        }
        const { analyzeThreat } = await import('../agents/threat-analyst.js')
        const profile = analyzeThreat(params.html, params.url as string | undefined)
        return { jsonrpc: '2.0', id, result: profile }
      }

      case 'evaluate': {
        if (!params || typeof params.original !== 'string' || typeof params.protected !== 'string') {
          return { jsonrpc: '2.0', id, error: { code: -32602, message: 'original and protected are required' } }
        }
        const { evaluateProtection } = await import('../agents/adversarial-evaluator.js')
        const { planMutations } = await import('../agents/mutation-planner.js')
        const { analyzeThreat } = await import('../agents/threat-analyst.js')
        const { loadConfig } = await import('../config.js')

        const profile = analyzeThreat(params.original)
        const config = loadConfig()
        const plan = planMutations(profile, config)
        const evaluation = evaluateProtection(params.original, params.protected, plan, profile)
        return { jsonrpc: '2.0', id, result: evaluation }
      }

      case 'listMutations':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            mutations: [
              { id: 'dom_fragmentation', name: 'DOM Fragmentation', description: 'Break content into visual fragments' },
              { id: 'attribute_shuffle', name: 'Attribute Shuffling', description: 'Reorder HTML attributes' },
              { id: 'zero_width_injection', name: 'Zero Width Injection', description: 'Insert invisible Unicode characters' },
              { id: 'visual_reordering', name: 'Visual Reordering', description: 'Change DOM order preserving visual order' },
              { id: 'semantic_noise', name: 'Semantic Noise', description: 'Inject hidden misleading content' },
              { id: 'honeypots', name: 'Honeypot Elements', description: 'Create invisible links and elements' },
              { id: 'fingerprinting', name: 'Fingerprinting', description: 'Insert invisible identifiers' },
            ],
          },
        }

      case 'getStatus':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            status: 'running',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
          },
        }

      default:
        return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } }
    }
  }

  server.listen(port, () => {
    console.log(`NoScrape MCP Server running on port ${port}`)
  })

  return server
}

const port = parseInt(process.argv[2]?.replace('--port=', '') || process.env.MCP_PORT || '3001', 10)
if (process.argv[1]?.endsWith('mcp-server.js') || process.argv[1]?.endsWith('mcp-server.ts')) {
  createMcpServer({ port })
}
