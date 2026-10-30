import type { PageServerLoad } from './$types'
import { getPriceList } from '#lib/server/admin'

export const load: PageServerLoad = () => ({ sections: getPriceList() })
