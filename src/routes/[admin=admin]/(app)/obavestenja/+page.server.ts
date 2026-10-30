import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { setNotifyEmails } from '#lib/server/admin'
import { getNotifyEmails } from '#lib/server/db'
import { config } from '#lib/server/env'
import { sendTestEmail } from '#lib/server/mailer'

const EMAIL_RE = /^[^@\s<>,;]+@[^@\s<>,;]+\.[^@\s<>,;]+$/
const MAX_ADDRESSES = 20

export const load: PageServerLoad = () => ({ emails: getNotifyEmails(), mailConfigured: config.resendKey !== '' })

export const actions: Actions = {
  save: async ({ request }) => {
    const raw = (await request.formData()).getAll('email').map(String)
    const emails = [...new Set(raw.map((e) => e.trim().toLowerCase()).filter(Boolean))]
    const bad = emails.filter((e) => !EMAIL_RE.test(e) || e.length > 254)
    if (bad.length) return fail(422, { error: `Неисправна адреса: ${bad.join(', ')}`, emails: raw.slice(0, MAX_ADDRESSES) })
    if (emails.length > MAX_ADDRESSES) return fail(422, { error: `Највише ${MAX_ADDRESSES} адреса.`, emails: raw.slice(0, MAX_ADDRESSES) })

    setNotifyEmails(emails)
    return { saved: true }
  },
  test: async () => ({ test: await sendTestEmail(getNotifyEmails()) }),
}
