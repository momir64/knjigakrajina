import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { deleteBook, getBookById, updateBook } from '#lib/server/admin'
import { dropCover, readBookForm } from '#lib/server/book-form'
import { config } from '#lib/server/env'
import { deleteUpload } from '#lib/server/storage'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const find = (id: string) => {
  const book = UUID.test(id) ? getBookById(id) : null
  if (!book) error(404, 'Not found')
  return book
}

export const load: PageServerLoad = ({ params, url }) => ({ book: find(params.id), created: url.searchParams.has('created') })

export const actions: Actions = {
  save: async ({ params, request }) => {
    const book = find(params.id)
    const { values, errors, newImage } = await readBookForm(await request.formData(), book)
    if (Object.keys(errors).length) return fail(422, { errors, values })

    try {
      updateBook(book.id, values)
    } catch (e) {
      if (newImage) await deleteUpload('books', newImage)
      throw e
    }
    if (newImage) await dropCover(book.image, book.id) // the old cover goes unless another book shares it
    return { saved: true }
  },
  delete: async ({ params }) => {
    const book = find(params.id)
    deleteBook(book.id)
    await dropCover(book.image, book.id)
    redirect(303, `${config.adminPath}/knjige/`)
  },
}
