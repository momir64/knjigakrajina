import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { checkPassword, clearFailures, COOKIE, createSession, isLocked, recordFailure } from '#lib/server/auth'
import { config } from '#lib/server/env'

export const load: PageServerLoad = ({ locals }) => {
  if (locals.admin) redirect(303, `${config.adminPath}/narudzbine/`)
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

export const actions: Actions = {
  default: async ({ request, cookies, url, getClientAddress }) => {
    const who = getClientAddress()
    if (isLocked(who)) return fail(429, { error: 'Превише неуспешних покушаја. Покушајте поново за 15 минута.' })

    const password = String((await request.formData()).get('password') ?? '')
    if (password.length > 200 || !checkPassword(password)) {
      recordFailure(who)
      await sleep(600)
      return fail(401, { error: 'Погрешна лозинка.' })
    }

    clearFailures(who)
    const { token, maxAge } = createSession()
    cookies.set(COOKIE, token, {
      path: config.adminPath, // never sent to the public pages
      httpOnly: true,
      sameSite: 'strict',
      secure: url.protocol === 'https:',
      maxAge,
    })
    redirect(303, `${config.adminPath}/narudzbine/`)
  },
}
