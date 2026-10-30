import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { listAllBooks, moveBook } from '#lib/server/admin'

export const load: PageServerLoad = () => ({ books: listAllBooks() })

export const actions: Actions = {
  // moves a book one place up or down in the list (and on the site)
  move: async ({ request }) => {
    const form = await request.formData()
    const id = String(form.get('id') ?? '')
    const dir = form.get('dir') === 'up' ? -1 : form.get('dir') === 'down' ? 1 : 0
    if (dir === 0 || !moveBook(id, dir)) return fail(400, { error: 'Књига није пронађена.' })
    return { moved: id }
  },
}
