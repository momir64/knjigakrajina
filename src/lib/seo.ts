// "<p>Text &hellip;</p>" -> "Text …" cut at a word boundary
export function plainText(html = '', max = 160): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const at = cut.lastIndexOf(' ')
  return cut.slice(0, at > 60 ? at : cut.length).replace(/[\s,;:.„“"]+$/, '') + '…'
}

// make every "/path" inside a JSON-LD object absolute
export function absolutize(value: unknown, origin: string): unknown {
  if (typeof value === 'string') return value.startsWith('/') ? origin + value : value
  if (Array.isArray(value)) return value.map((v) => absolutize(v, origin))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, absolutize(v, origin)]),
    )
  }
  return value
}
