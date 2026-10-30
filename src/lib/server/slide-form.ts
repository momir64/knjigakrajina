import { sanitizeHtml } from '#lib/sanitize'
import { MAX_BLURB, NEW_SLIDE_LOOK, type SlideConfig } from '#lib/slider'
import { imageUses } from './slider'
import { deleteUpload, isSafeName, MAX_UPLOAD_BYTES, saveUpload, UploadError } from './storage'

// Reads and validates the slide form. The artwork is the only file; its name never comes from the form:
// a new file goes through saveUpload() (generated name, type from the bytes), otherwise the stored name is kept.

export type SlideValues = Omit<SlideConfig, 'id'>
export type SlideForm = { values: SlideValues; errors: Record<string, string>; newImage?: string }

/** On success `newImage` is the file saved for this request (delete it again if the database write fails). */
export async function readSlideForm(form: FormData, bookSlugs: string[], existing?: SlideConfig): Promise<SlideForm> {
  const text = (k: string) => String(form.get(k) ?? '').trim()
  const errors: Record<string, string> = {}

  const slug = text('slug')
  if (!bookSlugs.includes(slug)) errors.slug = 'Одаберите књигу.'

  const html = sanitizeHtml(text('html'))
  if (!html.replace(/<[^>]*>/g, '').trim()) errors.html = 'Унесите кратак опис.'
  else if (html.length > MAX_BLURB) errors.html = `Опис је предугачак (највише ${MAX_BLURB} знакова).`

  const percent = Number(text('size'))
  if (!/^\d{2,3}$/.test(text('size')) || percent < 50 || percent > 120) errors.size = 'Величина мора бити број од 50 до 120.'

  let image = existing?.image ?? ''
  let newImage: string | undefined
  const file = form.get('image')
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) errors.image = 'Слика је превелика (највише 20 MB).'
    else if (Object.keys(errors).length === 0) {
      // only saved once everything else is valid, so a rejected form leaves no stray file behind
      try {
        newImage = await saveUpload('slider', file.name, new Uint8Array(await file.arrayBuffer()))
        image = newImage
      } catch (e) {
        if (!(e instanceof UploadError)) throw e
        errors.image = 'Подржани су WebP, PNG, JPEG, GIF и AVIF (највише 20 MB).'
      }
    }
  } else if (!existing) {
    errors.image = 'Додајте слику.'
  }

  const values: SlideValues = {
    slug,
    image,
    html,
    active: form.get('active') !== '0',
    k: Number.isFinite(percent) && percent >= 50 && percent <= 120 ? percent / 100 : (existing?.k ?? 1),
    ah: existing?.ah ?? NEW_SLIDE_LOOK.ah,
    ag: existing?.ag ?? NEW_SLIDE_LOOK.ag,
    tlh: existing?.tlh ?? NEW_SLIDE_LOOK.tlh,
    tfs: existing?.tfs ?? NEW_SLIDE_LOOK.tfs,
  }
  return { values, errors, newImage }
}

/** Deletes an artwork file unless another slide still uses it. Only ever touches uploads/slider through deleteUpload(). */
export async function dropArtwork(name: string, exceptSlideId: string) {
  if (name && isSafeName(name) && imageUses(name, exceptSlideId) === 0) await deleteUpload('slider', name)
}
