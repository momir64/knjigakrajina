import type { LayoutServerLoad } from './$types'
import { config } from '#lib/server/env'

export const load: LayoutServerLoad = ({ url }) => ({
  // canonical origin for canonical links, Open Graph, JSON-LD (set SITE_URL in production)
  origin: config.siteUrl || url.origin,
})
