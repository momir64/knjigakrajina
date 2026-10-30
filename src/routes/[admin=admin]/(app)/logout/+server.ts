import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { COOKIE, destroySession } from '#lib/server/auth'
import { config } from '#lib/server/env'

export const POST: RequestHandler = ({ cookies }) => {
  destroySession(cookies.get(COOKIE))
  cookies.delete(COOKIE, { path: config.adminPath })
  redirect(303, config.adminPath + '/')
}
