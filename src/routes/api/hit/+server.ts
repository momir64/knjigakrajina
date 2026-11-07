import type { RequestHandler } from './$types'
import { getBook } from '#lib/server/db'
import { createLimiter, readJsonLimited } from '#lib/server/limits'
import { isBot, recordHit } from '#lib/server/analytics'

// Receives one beacon per page view from the browser (see src/lib/track.ts). Bots mostly do not run scripts, the rest is
// filtered by user agent; only addresses of real pages are accepted, so nobody can fill the table with made-up paths.
const STATIC = new Set(['/', '/knjige/', '/kontakt/', '/usluge/', '/korpa/', '/placanje/', '/placanje/narudzbina-primljena/'])
const perClient = createLimiter(90, 60_000)
const overall = createLimiter(3000, 60_000)

const accepted = (path: string) => {
  if (STATIC.has(path)) return true
  const slug = /^\/knjige\/([^/]{1,150})\/$/.exec(path)?.[1]
  return !!slug && !!getBook(slug)
}

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
  const done = new Response(null, { status: 204 })
  const ip = getClientAddress()
  const ua = request.headers.get('user-agent') ?? ''
  if (isBot(ua) || !perClient(ip) || !overall('all')) return done

  const body = await readJsonLimited(request, 2048)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return done
  const d = body as Record<string, unknown>
  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
  const path = text(d.p, 200)
  if (!accepted(path)) return done

  const h = (name: string) => request.headers.get(name) ?? ''
  recordHit({
    path,
    ip,
    ua,
    entry: d.e === 1,
    referrer: text(d.r, 300),
    utm: text(d.u, 60),
    requestUrl: url.href,
    country: h('cf-ipcountry').toUpperCase(),
    city: h('cf-ipcity'),
  })
  return done
}
