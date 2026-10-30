import hyphen from 'hyphen/sr-cyrl'
import type { PageServerLoad } from './$types'
import { sanitizeHtml } from '#lib/sanitize'
import { listBooks } from '#lib/server/db'
import { getSlides } from '#lib/server/slider'
import type { Slide } from '#lib/types'
import { sliderImage } from '#lib/media'

// soft hyphens by Serbian (Cyrillic) hyphenation patterns; the browser only uses them when a line needs breaking
const hyph = (html: string) => hyphen.hyphenateHTMLSync(html, { hyphenChar: '­', minWordLength: 6 })

export const load: PageServerLoad = () => {
  const books = listBooks()
  // slides are edited in the back office; one that is switched off, or whose book is hidden or deleted, drops out
  const slides: Slide[] = getSlides().flatMap((s) => {
    const b = books.find((x) => x.slug === s.slug)
    if (!s.active || !b) return []
    return [
      { slug: s.slug, title: b.title, author: b.author, html: hyph(sanitizeHtml(s.html)), image: sliderImage(s.image), k: s.k, ah: s.ah, ag: s.ag, tlh: s.tlh, tfs: s.tfs },
    ]
  })
  return { slides }
}
