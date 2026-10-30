// Book descriptions are HTML typed in the back office and rendered with {@html}. This keeps only a small allow-list
// of tags (the ones the editor's tag guide lists), so even a compromised admin session cannot put a script, an event
// handler, an iframe or a javascript: link into a public page. Everything else is dropped; its text stays.

const VOID = new Set(['br'])
const ALLOWED = new Set(['p', 'br', 'em', 'strong', 'i', 'b', 'a', 'ul', 'ol', 'li', 'blockquote', 'h2', 'h3'])
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g
const HREF = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** only http(s), mailto and site-relative links; entities and control characters are decoded first so they cannot hide a scheme */
function safeHref(raw: string): string | null {
  const href = raw
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16) || 32))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d) || 32))
    .replace(/&(colon|tab|newline);/gi, (_, n) => ({ colon: ':', tab: ' ', newline: ' ' })[n.toLowerCase() as 'colon'])
    .replace(/[\u0000- \u007f-\u009f]/g, '')
  if (/^(https?:\/\/|mailto:)/i.test(href) || /^\/(?!\/)/.test(href)) return href
  return null
}

// elements whose content is code or markup, not text: dropped together with what is inside
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template|textarea|title|svg|math)\b[\s\S]*?(?:<\/\1\s*>|$)/gi

export function sanitizeHtml(source: string): string {
  const html = source.replace(DROP_WITH_CONTENT, '')
  const open: string[] = []
  let out = ''
  let last = 0
  const text = (s: string) => s.replace(/<!--[\s\S]*?(-->|$)/g, '').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  for (const m of html.matchAll(TAG)) {
    out += text(html.slice(last, m.index))
    last = m.index + m[0].length
    const closing = m[1] === '/'
    const name = m[2].toLowerCase()
    if (!ALLOWED.has(name)) continue
    if (closing) {
      const at = open.lastIndexOf(name)
      if (at === -1) continue
      out += open
        .splice(at)
        .reverse()
        .map((t) => `</${t}>`)
        .join('')
      continue
    }
    if (name === 'a') {
      const found = HREF.exec(m[3])
      const href = found ? safeHref(found[1] ?? found[2] ?? found[3] ?? '') : null
      out += href ? `<a href="${escapeAttr(href)}" rel="noopener noreferrer">` : '<a>'
    } else out += `<${name}>`
    if (!VOID.has(name)) open.push(name)
  }
  out += text(html.slice(last))
  return out + open.reverse().map((t) => `</${t}>`).join('')
}
