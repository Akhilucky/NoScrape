import * as cheerio from 'cheerio'
import { JSDOM } from 'jsdom'

export function parseHtml(html: string) {
  const $ = cheerio.load(html)
  const dom = new JSDOM(html)
  return { $, dom, document: dom.window.document }
}

export function getTextContent(html: string): string {
  const $ = cheerio.load(html)
  return $('body').text().replace(/\s+/g, ' ').trim()
}

export function extractTextBySelector(html: string, selector: string): string {
  const $ = cheerio.load(html)
  const el = $(selector)
  return el.length ? el.text().replace(/\s+/g, ' ').trim() : ''
}

export function extractStructuredContent(html: string): Record<string, string> {
  const $ = cheerio.load(html)
  const content: Record<string, string> = {}
  $('article, [class*="article"], [class*="content"], [class*="body"], section, main').each((_, el) => {
    const $el = $(el)
    const key = $el.attr('id') || $el.attr('class')?.split(' ')[0] || 'unknown'
    content[key] = $el.text().replace(/\s+/g, ' ').trim()
  })
  return content
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export function wrapInFragment(html: string, fragmentAttrs?: Record<string, string>): string {
  const attrs = fragmentAttrs
    ? Object.entries(fragmentAttrs).map(([k, v]) => `${k}="${v}"`).join(' ')
    : ''
  return `<noscrape-fragment ${attrs}>${html}</noscrape-fragment>`
}

export function injectHiddenElement(html: string, content: string): string {
  return html + `\n<div aria-hidden="true" style="display:none">${content}</div>`
}
