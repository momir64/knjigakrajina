import type { Handle } from '@sveltejs/kit/hooks'
import { config } from '#lib/server/env'

// Parts of the site that must never show up in search engines. Pages also carry <meta name="robots">,
// this header covers everything else (JSON, images, error pages).
const PRIVATE = ['/korpa', '/placanje', '/api']

// Hidden back office: lives under a secret path prefix from ADMIN_PATH (e.g. "/x7k2-office").
// It is never linked, never in the sitemap and not listed in robots.txt (listing it would reveal it).
const ADMIN = config.adminPath

const startsWith = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/')

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url
  const response = await resolve(event)

  const admin = ADMIN !== '' && startsWith(pathname, ADMIN)
  if (admin || PRIVATE.some((p) => startsWith(pathname, p))) {
    response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive')
  }
  if (admin) response.headers.set('cache-control', 'no-store')
  return response
}
