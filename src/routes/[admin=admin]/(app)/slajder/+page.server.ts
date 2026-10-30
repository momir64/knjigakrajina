import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { plainText } from '#lib/seo.js'
import { listAllBooks } from '#lib/server/admin'
import { getSlides, setSlides } from '#lib/server/slider'
import { MAX_SLIDES, SLIDE_ID } from '#lib/slider'

export const load: PageServerLoad = () => {
  const books = new Map(listAllBooks().map((b) => [b.slug, b]))
  const slides = getSlides().map((s) => {
    const book = books.get(s.slug)
    return {
      id: s.id,
      image: s.image,
      title: book?.title ?? null,
      bookShown: !!book?.active,
      active: s.active,
      text: plainText(s.html, 110),
    }
  })
  return { slides, max: MAX_SLIDES }
}

export const actions: Actions = {
  // moves a slide one place up or down in the rotation
  move: async ({ request }) => {
    const form = await request.formData()
    const id = String(form.get('id') ?? '')
    const dir = form.get('dir') === 'up' ? -1 : form.get('dir') === 'down' ? 1 : 0
    const list = getSlides()
    const at = SLIDE_ID.test(id) ? list.findIndex((s) => s.id === id) : -1
    if (at === -1 || dir === 0) return fail(400, { error: 'Слајд није пронађен.' })
    const to = at + dir
    if (to < 0 || to >= list.length) return { moved: id }
    ;[list[at], list[to]] = [list[to], list[at]]
    setSlides(list)
    return { moved: id }
  },
}
