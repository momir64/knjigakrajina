import { error } from '@sveltejs/kit'
import { readFile, stat } from 'node:fs/promises'
import type { RequestHandler } from './$types'
import { extensionOf, IMAGE_TYPES, resolveExisting } from '#lib/server/storage'

// Book covers, slider and price-list images live outside the build so the admin can change them at runtime.
// The only paths that reach the disk are /uploads/<books|slider|services>/<safe-name>.<image-ext> (see storage.ts).
export const GET: RequestHandler = async ({ params, request }) => {
  const file = await resolveExisting(params.kind, params.file)
  if (!file) error(404, 'Not found')

  const info = await stat(file)
  const etag = `"${info.size.toString(36)}-${Math.trunc(info.mtimeMs).toString(36)}"`
  const headers = {
    etag,
    'cache-control': 'public, max-age=86400',
    'content-type': IMAGE_TYPES[extensionOf(file)],
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; sandbox",
  }
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers })
  return new Response(new Uint8Array(await readFile(file)), { headers })
}
