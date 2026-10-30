import { fail, redirect } from '@sveltejs/kit'
import { randomUUID } from 'node:crypto'
import type { Actions, PageServerLoad } from './$types'
import { listAllBooks } from '#lib/server/admin'
import { config } from '#lib/server/env'
import { readSlideForm } from '#lib/server/slide-form'
import { getSlides, setSlides } from '#lib/server/slider'
import { deleteUpload } from '#lib/server/storage'
import { MAX_SLIDES } from '#lib/slider'

const bookChoices = () => listAllBooks().map((b) => ({ slug: b.slug, title: b.title, active: b.active }))

export const load: PageServerLoad = () => ({ books: bookChoices() })

export const actions: Actions = {
  default: async ({ request }) => {
    const list = getSlides()
    if (list.length >= MAX_SLIDES) return fail(422, { errors: { image: `Највише ${MAX_SLIDES} слајдова.` }, values: null })

    const { values, errors, newImage } = await readSlideForm(await request.formData(), bookChoices().map((b) => b.slug))
    if (Object.keys(errors).length) return fail(422, { errors, values: { ...values, image: '' } })

    const id = randomUUID()
    try {
      setSlides([...list, { id, ...values }])
    } catch (e) {
      if (newImage) await deleteUpload('slider', newImage)
      throw e
    }
    redirect(303, `${config.adminPath}/slajder/${id}/?created`)
  },
}
