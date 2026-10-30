import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'
import { createBook } from '#lib/server/admin'
import { readBookForm } from '#lib/server/book-form'
import { config } from '#lib/server/env'
import { deleteUpload } from '#lib/server/storage'

export const actions: Actions = {
  default: async ({ request }) => {
    const { values, errors, newImage } = await readBookForm(await request.formData())
    if (Object.keys(errors).length) return fail(422, { errors, values: { ...values, image: '' } })

    let id: string
    try {
      id = createBook(values)
    } catch (e) {
      if (newImage) await deleteUpload('books', newImage)
      throw e
    }
    redirect(303, `${config.adminPath}/knjige/${id}/?created`)
  },
}
