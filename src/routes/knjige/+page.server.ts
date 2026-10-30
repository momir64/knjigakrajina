import type { PageServerLoad } from './$types'
import { listBooks } from '#lib/server/db'

export const load: PageServerLoad = () => ({ books: listBooks() })
