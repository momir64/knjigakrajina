import type { RequestHandler } from './$types'
import { listBooks } from '#lib/server/db'
import { config } from '#lib/server/env'

export const GET: RequestHandler = ({ url }) => {
  const origin = config.siteUrl || url.origin
  const paths = ['/', '/knjige/', ...listBooks().map((b) => `/knjige/${b.slug}/`), '/usluge/', '/kontakt/']
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${origin}${p}</loc></url>`).join('\n')}
</urlset>
`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
