import { MutationPlan } from '../types.js'
import { parseHtml } from '../utils/html.js'
import { loadConfig } from '../config.js'

let globalTrackerCounter = 0

function generateTrackerId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = 'ns_'
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function applyFingerprinting(html: string, plan: MutationPlan): string {
  if (plan.strategy === 'minimal' || plan.strategy === 'moderate') return html

  const { $ } = parseHtml(html)
  const config = loadConfig()
  const trackerId = config.fingerprinting?.tracker_id || generateTrackerId()
  const counter = ++globalTrackerCounter
  const body = $('body')
  if (!body.length) return html

  body.append(`
    <div id="ns-tracker-${counter}" style="display:none" aria-hidden="true"
         data-ns-track="${trackerId}"
         data-ns-visit="${Date.now()}"
         data-ns-strategy="${plan.strategy}">
    </div>
  `)

  body.append(`
    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
         alt="" aria-hidden="true"
         style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0"
         data-ns-beacon="${trackerId}">
  `)

  const cookieName = config.fingerprinting?.cookie_name || '_ns_id'
  const meta = $(`<meta name="noscrape-id" content="${trackerId}">`)
  $('head').append(meta)

  const script = $(`<script aria-hidden="true" type="text/no-execute">
    (function(){
      var id = "${trackerId}";
      var ts = ${Date.now()};
      try {
        localStorage.setItem("${cookieName}", JSON.stringify({id: id, ts: ts}));
      } catch(e){}
    })();
  </script>`)
  $('body').append(script)

  return $.html()
}
