import type { LayoutServerLoad } from './$types'
import { countNewOrders } from '#lib/server/admin'

export const load: LayoutServerLoad = () => ({ newOrders: countNewOrders() })
