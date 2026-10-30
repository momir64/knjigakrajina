import { randomBytes } from 'node:crypto'
import { mkdir, realpath, stat, unlink, writeFile } from 'node:fs/promises'
import { join, sep } from 'node:path'
import { MEDIA_KINDS, type MediaKind } from '#lib/media'
import { config } from './env'

// Every path that touches the disk is built here. The rules, in order:
//  1. the folder must be one of MEDIA_KINDS and the file name must match SAFE_NAME - no separators, no "..",
//     no drive letters / NTFS streams, no control characters, only known image extensions;
//  2. the joined path is resolved with realpath() and must still be inside the (real) folder of that kind,
//     so symlinks cannot lead out either;
//  3. uploads never use a client-supplied name or extension: the type is detected from the file's bytes and
//     the final name is generated here; existing files are never overwritten.

const SAFE_NAME = /^[a-z0-9][a-z0-9_-]{0,100}\.(webp|png|jpg|gif|avif)$/i

export const IMAGE_TYPES: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  avif: 'image/avif',
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

export const isMediaKind = (kind: string): kind is MediaKind => (MEDIA_KINDS as readonly string[]).includes(kind)
export const isSafeName = (name: string) => SAFE_NAME.test(name)
export const extensionOf = (name: string) => name.slice(name.lastIndexOf('.') + 1).toLowerCase()

const insideDir = (path: string, dir: string) => path.startsWith(dir.endsWith(sep) ? dir : dir + sep)

/** Absolute path of an existing, regular media file - or null for anything that is not exactly that. */
export async function resolveExisting(kind: string, name: string): Promise<string | null> {
  if (!isMediaKind(kind) || !isSafeName(name)) return null
  try {
    const dir = await realpath(join(config.uploadsDir, kind))
    const file = await realpath(join(dir, name))
    if (!insideDir(file, dir) || !(await stat(file)).isFile()) return null
    return file
  } catch {
    return null
  }
}

/** Image type from the first bytes of a file, never from its name. */
export function sniffImage(b: Uint8Array): keyof typeof IMAGE_TYPES | null {
  const at = (i: number, s: string) => [...s].every((c, j) => b[i + j] === c.charCodeAt(0))
  if (b.length < 12) return null
  if (at(0, 'RIFF') && at(8, 'WEBP')) return 'webp'
  if (b[0] === 0x89 && at(1, 'PNG\r\n') && b[6] === 0x1a && b[7] === 0x0a) return 'png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg'
  if (at(0, 'GIF87a') || at(0, 'GIF89a')) return 'gif'
  if (at(4, 'ftypavif') || at(4, 'ftypavis')) return 'avif'
  return null
}

/** "Ђаво на Папуку!.JPG" -> "djavo-na-papuku"-style base: ASCII letters/digits and dashes only. */
export function baseName(original: string): string {
  const stem = original.replace(/^.*[\\/]/, '').replace(/\.[^.]*$/, '')
  const slug = stem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  return slug || 'image'
}

export class UploadError extends Error {}

/** Stores an uploaded image in uploads/<kind>/ and returns the generated file name (what goes into the database). */
export async function saveUpload(kind: string, original: string, bytes: Uint8Array): Promise<string> {
  if (!isMediaKind(kind)) throw new UploadError('unknown folder')
  if (bytes.length === 0 || bytes.length > MAX_UPLOAD_BYTES) throw new UploadError('bad size')
  const ext = sniffImage(bytes)
  if (!ext) throw new UploadError('not a supported image')

  const dir = join(config.uploadsDir, kind)
  await mkdir(dir, { recursive: true })
  const realDir = await realpath(dir)

  const name = `${baseName(original)}-${randomBytes(4).toString('hex')}.${ext}`
  if (!isSafeName(name)) throw new UploadError('bad name')
  const target = join(realDir, name)
  if (!insideDir(target, realDir)) throw new UploadError('bad path')
  await writeFile(target, bytes, { flag: 'wx' }) // fails instead of overwriting
  return name
}

export async function deleteUpload(kind: string, name: string): Promise<boolean> {
  const file = await resolveExisting(kind, name)
  if (!file) return false
  await unlink(file)
  return true
}
