import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { listAllBooks } from '#lib/server/admin'
import { config } from '#lib/server/env'
import { dropArtwork, readSlideForm } from '#lib/server/slide-form'
import { getSlides, setSlides } from '#lib/server/slider'
import { deleteUpload } from '#lib/server/storage'
import { SLIDE_ID } from '#lib/slider'

const find = (id: string) => {
  const slide = SLIDE_ID.test(id) ? getSlides().find((s) => s.id === id) : undefined
  if (!slide) error(404, 'Not found')
  return slide
}

const bookChoices = () => listAllBooks().map((b) => ({ slug: b.slug, title: b.title, active: b.active }))

export const load: PageServerLoad = ({ params, url }) => ({ slide: find(params.id), books: bookChoices(), created: url.searchParams.has('created') })

export const actions: Actions = {
  save: async ({ params, request }) => {
    const slide = find(params.id)
    const { values, errors, newImage } = await readSlideForm(await request.formData(), bookChoices().map((b) => b.slug), slide)
    if (Object.keys(errors).length) return fail(422, { errors, values })

    try {
      setSlides(getSlides().map((s) => (s.id === slide.id ? { id: slide.id, ...values } : s)))
    } catch (e) {
      if (newImage) await deleteUpload('slider', newImage)
      throw e
    }
    if (newImage) await dropArtwork(slide.image, slide.id) // the old artwork goes unless another slide shares it
    return { saved: true }
  },
  delete: async ({ params }) => {
    const slide = find(params.id)
    setSlides(getSlides().filter((s) => s.id !== slide.id))
    await dropArtwork(slide.image, slide.id)
    redirect(303, `${config.adminPath}/slajder/`)
  },
}
