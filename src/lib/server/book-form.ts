import type { AdminBook } from '#lib/admin'
import { sanitizeHtml } from '#lib/sanitize'
import { imageUses, nextSort, slugTaken, type BookInput } from './admin'
import { deleteUpload, isSafeName, MAX_UPLOAD_BYTES, saveUpload, UploadError } from './storage'

// Reads and validates the book form. The cover is the only file; its name never comes from the form:
// a new file goes through saveUpload() (generated name, type from the bytes), otherwise the stored name is kept.

const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'dj', е: 'e', ж: 'z', з: 'z', и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm',
  н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ћ: 'c', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'c', џ: 'dz', ш: 's',
  č: 'c', ć: 'c', đ: 'dj', š: 's', ž: 'z',
}

/** "Ђаво на Папуку" -> "djavo-na-papuku" */
export function slugify(title: string): string {
  return [...title.toLowerCase()]
    .map((c) => CYRILLIC[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type BookForm = { values: BookInput; errors: Record<string, string>; newImage?: string }

const TEXT_LIMITS = { author: 200, weight: 30, length: 30, width: 30, height: 30, pages: 30, binding: 60, script: 60, year: 30, isbn: 30 } as const

/** On success `newImage` is the file saved for this request (delete it again if the database write fails). */
export async function readBookForm(form: FormData, existing?: AdminBook): Promise<BookForm> {
  const text = (k: string) => String(form.get(k) ?? '').trim()
  const errors: Record<string, string> = {}

  const title = text('title')
  if (!title) errors.title = 'Наслов је обавезан.'
  else if (title.length > 300) errors.title = 'Наслов је предугачак.'

  const slug = text('slug').toLowerCase() || slugify(title)
  if (!SLUG.test(slug) || slug.length > 100) errors.slug = 'Адреса сме да садржи само мала слова (a-z), цифре и цртице.'
  else if (slugTaken(slug, existing?.id)) errors.slug = 'Друга књига већ користи ову адресу.'

  const price = Number(text('price'))
  if (!/^\d{1,8}$/.test(text('price'))) errors.price = 'Цена мора бити цео број динара.'

  const sort = text('sort') === '' ? (existing?.sort ?? nextSort()) : Number(text('sort'))
  if (!Number.isInteger(sort) || Math.abs(sort) > 1_000_000) errors.sort = 'Редослед мора бити цео број.'

  const description = sanitizeHtml(String(form.get('description') ?? '').trim())
  if (description.length > 50_000) errors.description = 'Опис је предугачак.'

  const fields: Record<string, string> = {}
  for (const [k, max] of Object.entries(TEXT_LIMITS)) {
    fields[k] = text(k)
    if (fields[k].length > max) errors[k] = 'Предугачко.'
  }

  let image = existing?.image ?? ''
  let newImage: string | undefined
  const file = form.get('image')
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) errors.image = 'Слика је превелика (највише 20 MB).'
    else if (Object.keys(errors).length === 0) {
      // only saved once everything else is valid, so a rejected form leaves no stray file behind
      try {
        newImage = await saveUpload('books', file.name, new Uint8Array(await file.arrayBuffer()))
        image = newImage
      } catch (e) {
        if (!(e instanceof UploadError)) throw e
        errors.image = 'Подржани су WebP, PNG, JPEG, GIF и AVIF (највише 20 MB).'
      }
    }
  } else if (!existing) {
    errors.image = 'Додајте корицу.'
  }

  const values: BookInput = {
    slug,
    title,
    price: /^\d{1,8}$/.test(text('price')) ? price : 0,
    description,
    image,
    sort: Number.isInteger(sort) ? sort : 0,
    active: form.get('active') === '0' ? 0 : 1,
    author: fields.author,
    weight: fields.weight,
    length: fields.length,
    width: fields.width,
    height: fields.height,
    pages: fields.pages,
    binding: fields.binding,
    script: fields.script,
    year: fields.year,
    isbn: fields.isbn,
  }
  return { values, errors, newImage }
}

/** Deletes a cover file unless another book still uses it. Only ever touches uploads/books through deleteUpload(). */
export async function dropCover(name: string, exceptBookId: string) {
  if (name && isSafeName(name) && imageUses(name, exceptBookId) === 0) await deleteUpload('books', name)
}
