import type { LayoutServerLoad } from './$types'
import { config } from '#lib/server/env'

// Only reached for the real secret prefix (hooks.server.ts answers every other prefix with a 404).
export const load: LayoutServerLoad = () => ({ base: config.adminPath })
