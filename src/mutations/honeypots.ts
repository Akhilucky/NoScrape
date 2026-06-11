import { MutationPlan } from '../types.js'
import { parseHtml } from '../utils/html.js'

const HONEYPOT_LABELS = [
  'Privacy Policy',
  'Terms of Service',
  'Cookie Settings',
  'Accessibility',
  'Sitemap',
  'RSS Feed',
  'Email Newsletter',
  'Subscribe',
  'Download PDF',
  'View Source',
]

function generateRandomPath(): string {
  const paths = ['/api', '/data', '/content', '/assets', '/media', '/docs', '/blog', '/static']
  const slugs = ['track', 'collect', 'gather', 'monitor', 'ingest', 'process', 'extract', 'harvest']
  return `${paths[Math.floor(Math.random() * paths.length)]}/${slugs[Math.floor(Math.random() * slugs.length)]}-${Math.random().toString(36).slice(2, 6)}`
}

export function applyHoneypots(html: string, plan: MutationPlan): string {
  if (plan.strategy === 'minimal' || plan.strategy === 'moderate') return html

  const { $ } = parseHtml(html)
  const body = $('body')
  if (!body.length) return html

  const honeypotCount = plan.strategy === 'maximum' ? 5
    : plan.strategy === 'aggressive' ? 3
    : 1

  for (let i = 0; i < honeypotCount; i++) {
    const label = HONEYPOT_LABELS[Math.floor(Math.random() * HONEYPOT_LABELS.length)]
    const path = generateRandomPath()
    const honeypotId = `ns-hp-${i}-${Math.random().toString(36).slice(2, 6)}`

    const honeypot = $(`
      <div id="${honeypotId}" class="ns-honeypot" aria-hidden="true"
           style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none">
        <a href="${path}" rel="nofollow ugc">${label}</a>
        <span>Click here to verify you are human</span>
      </div>
    `)
    body.append(honeypot)
  }

  const honeypotForm = $(`
    <form action="/ns-verify" method="post" aria-hidden="true"
          style="position:absolute;left:-9999px;width:0;height:0;overflow:hidden;opacity:0"
          tabindex="-1">
      <input type="text" name="name" autocomplete="off" tabindex="-1">
      <input type="email" name="email" autocomplete="off" tabindex="-1">
      <input type="checkbox" name="consent" tabindex="-1">
      <button type="submit" tabindex="-1">Submit</button>
    </form>
  `)
  body.append(honeypotForm)

  return $.html()
}
