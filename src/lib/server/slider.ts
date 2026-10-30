import { DEFAULT_SLIDES, MAX_BLURB, MAX_SLIDES, NEW_SLIDE_LOOK, SLIDE_ID, type SlideConfig } from '#lib/slider'
import { db } from './db'
import { isSafeName } from './storage'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
// goes into a style attribute, so only the shapes the site itself uses are accepted
const FONT_SIZE = /^(?:\d{1,2}px|max\(\d{1,2}px, \d{1,2}(?:\.\d{1,3})?vw\))$/

const num = (v: unknown, min: number, max: number, fallback: number) => (typeof v === 'number' && v >= min && v <= max ? v : fallback)

/** One stored entry, checked field by field; anything unusable makes the entry (not the list) drop out. */
function clean(raw: unknown): SlideConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || !SLIDE_ID.test(r.id)) return null
  if (typeof r.slug !== 'string' || !SLUG.test(r.slug) || r.slug.length > 100) return null
  if (typeof r.image !== 'string' || !isSafeName(r.image)) return null
  return {
    id: r.id,
    slug: r.slug,
    image: r.image,
    html: typeof r.html === 'string' ? r.html.slice(0, MAX_BLURB) : '',
    active: r.active !== false,
    k: num(r.k, 0.5, 1.2, 1),
    ah: num(r.ah, 0, 200, NEW_SLIDE_LOOK.ah),
    ag: num(r.ag, 0, 100, NEW_SLIDE_LOOK.ag),
    tlh: num(r.tlh, 0.5, 3, NEW_SLIDE_LOOK.tlh),
    tfs: typeof r.tfs === 'string' && FONT_SIZE.test(r.tfs) ? r.tfs : NEW_SLIDE_LOOK.tfs,
  }
}

export function getSlides(): SlideConfig[] {
  const row = db().prepare("SELECT value FROM settings WHERE key='slider'").get() as { value: string } | undefined
  if (row) {
    try {
      const parsed: unknown = JSON.parse(row.value)
      if (Array.isArray(parsed)) return parsed.map(clean).filter((s): s is SlideConfig => s !== null).slice(0, MAX_SLIDES)
    } catch {
      // damaged value: fall back to the slides the site shipped with
    }
  }
  return structuredClone(DEFAULT_SLIDES)
}

export function setSlides(list: SlideConfig[]) {
  db().prepare("INSERT INTO settings(key,value) VALUES('slider', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(list.slice(0, MAX_SLIDES)))
}

/** how many slides use this artwork file (a file is only deleted when this is 0) */
export const imageUses = (image: string, exceptId = '') => getSlides().filter((s) => s.image === image && s.id !== exceptId).length
