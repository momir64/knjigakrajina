import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { isOrderStatus } from '#lib/admin'
import { deleteOrder, formatDate, getOrder, setOrderStatus } from '#lib/server/admin'
import { config } from '#lib/server/env'
import { sendStatusEmail } from '#lib/server/mailer'
import { isNotifiedStatus } from '#lib/server/mail-templates'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export const load: PageServerLoad = ({ params }) => {
  const found = UUID.test(params.id) ? getOrder(params.id) : null
  if (!found) error(404, 'Not found')
  return { ...found, created: formatDate(found.order.created_at) }
}

export const actions: Actions = {
  status: async ({ params, request }) => {
    const form = await request.formData()
    const status = String(form.get('status') ?? '')
    if (!UUID.test(params.id) || !isOrderStatus(status)) return fail(400, { error: 'Неисправан статус.' })
    const found = getOrder(params.id)
    if (!found || !setOrderStatus(params.id, status)) return fail(404, { error: 'Наруџбина не постоји.' })
    // optional message to the customer, only when the status really changed
    if (form.get('notify') && status !== found.order.status && isNotifiedStatus(status)) {
      const ok = await sendStatusEmail({ ...found.order, status }, found.items, status)
      return { saved: true, mail: ok ? 'sent' : 'failed' }
    }
    return { saved: true }
  },
  delete: ({ params }) => {
    if (UUID.test(params.id)) deleteOrder(params.id)
    redirect(303, `${config.adminPath}/narudzbine/`)
  },
}
