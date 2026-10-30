import type { RequestHandler } from './$types'
import { config } from '#lib/server/env'

export const GET: RequestHandler = ({ url }) => {
  const origin = config.siteUrl || url.origin
  const body = `User-agent: *
Allow: /
Disallow: /korpa/
Disallow: /placanje/
Disallow: /api/

Sitemap: ${origin}/sitemap.xml
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
