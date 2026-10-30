import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { sanitizeHtml } from '#lib/sanitize'
import { getBook } from '#lib/server/db'

export const load: PageServerLoad = ({ params }) => {
  const book = getBook(params.slug)
  if (!book) error(404, 'Not found')
  return { book: { ...book, description: sanitizeHtml(book.description) } }
}
