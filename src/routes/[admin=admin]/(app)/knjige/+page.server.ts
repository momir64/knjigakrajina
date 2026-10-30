import type { PageServerLoad } from './$types'
import { listAllBooks } from '#lib/server/admin'

export const load: PageServerLoad = () => ({ books: listAllBooks() })
