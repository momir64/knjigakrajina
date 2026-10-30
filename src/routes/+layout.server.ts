import type { LayoutServerLoad } from './$types'
import { config, isAdminPath } from '#lib/server/env'

export const load: LayoutServerLoad = ({ url }) => ({
  // canonical origin for canonical links, Open Graph, JSON-LD (set SITE_URL in production)
  origin: config.siteUrl || url.origin,
  // the back office brings its own frame; a plain boolean, so the secret path never reaches the client code
  chrome: !isAdminPath(url.pathname),
})
