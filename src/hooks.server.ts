import { error, redirect } from '@sveltejs/kit'
import type { Handle } from '@sveltejs/kit/hooks'
import { COOKIE, isValidSession } from '#lib/server/auth'
import { adminEnabled, config, isAdminPath } from '#lib/server/env'

// Parts of the site that must never show up in search engines. Pages also carry <meta name="robots">,
// this header covers everything else (JSON, images, error pages).
const PRIVATE = ['/korpa', '/placanje', '/api']

const startsWith = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/')

// Hidden back office: lives under the secret path prefix from ADMIN_PATH. It is never linked, never in the
// sitemap and not listed in robots.txt (listing it would reveal it); responses are noindex and never cached.
const ADMIN_ROUTE = '/[admin=admin]'

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url
  const admin = isAdminPath(pathname)
  event.locals.admin = admin && isValidSession(event.cookies.get(COOKIE))

  if (event.route.id?.startsWith(ADMIN_ROUTE)) {
    // Any other first segment of the right shape, or a disabled back office, is an ordinary 404 page.
    if (!adminEnabled || !admin) error(404, 'Not found')
    // One gate for pages, actions and data requests alike: only the login page is open without a session.
    if (!event.locals.admin && event.route.id !== ADMIN_ROUTE) redirect(303, config.adminPath + '/')
  }

  const response = await resolve(event)

  if (admin || PRIVATE.some((p) => startsWith(pathname, p))) {
    response.headers.set('x-robots-tag', 'noindex, nofollow, noarchive')
  }
  if (admin) response.headers.set('cache-control', 'no-store')
  // hardening for every response (the CSP itself is set by SvelteKit, see vite.config.ts)
  response.headers.set('x-content-type-options', 'nosniff')
  response.headers.set('x-frame-options', 'DENY')
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  if (event.url.protocol === 'https:') response.headers.set('strict-transport-security', 'max-age=31536000')
  return response
}
