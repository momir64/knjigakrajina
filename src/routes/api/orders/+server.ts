import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { createLimiter, readJsonLimited } from '#lib/server/limits'
import { createOrder, getNotifyEmails, UnknownBookError, type NewOrder } from '#lib/server/db'
import { sendOrderEmails } from '#lib/server/mailer'
import type { ShippingMethod } from '#lib/types'

const EMAIL_RE = /^[^@\s<>,;"']+@[^@\s<>,;"']+\.[^@\s<>,;"']+$/
const SHIPPING: ShippingMethod[] = ['pickup', 'post']
const REQUIRED = ['first_name', 'last_name', 'country', 'address', 'city', 'postcode', 'phone', 'email']
const MAX_LEN: Record<string, number> = { email: 254, address: 200, note: 2000 }
const MAX_BODY = 64 * 1024
const MAX_LINES = 30

// The endpoint sends mail to an address the visitor typed, so it is limited per client, per address and overall.
const attempts = createLimiter(30, 10 * 60_000) // every request, so form mistakes are not punished
const perClient = createLimiter(5, 10 * 60_000) // valid orders only
const perEmail = createLimiter(3, 60 * 60_000)
const overall = createLimiter(200, 60 * 60_000)

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  if (!attempts(getClientAddress())) return json({ error: 'too many requests' }, { status: 429 })

  const body = await readJsonLimited(request, MAX_BODY)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ errors: { body: 'invalid' } }, { status: 400 })
  const d = body as Record<string, unknown>
  const g = (k: string) => (typeof d[k] === 'string' || typeof d[k] === 'number' ? String(d[k]).trim() : '')

  const errors: Record<string, string> = {}
  for (const f of REQUIRED) if (!g(f)) errors[f] = 'required'
  for (const f of [...REQUIRED, 'state', 'order_comments']) if (g(f).length > (MAX_LEN[f === 'order_comments' ? 'note' : f] ?? 100)) errors[f] = 'too long'
  if (!errors.email && !EMAIL_RE.test(g('email'))) errors.email = 'invalid'
  const method = d.shipping_method as ShippingMethod
  if (!SHIPPING.includes(method)) errors.shipping_method = 'invalid'

  const rawLines = Array.isArray(d.items) ? d.items.filter((l): l is Record<string, unknown> => !!l && typeof l === 'object') : []
  if (rawLines.length === 0) errors.items = 'empty'
  if (rawLines.length > MAX_LINES) errors.items = 'too many'
  if (Object.keys(errors).length) return json({ errors }, { status: 422 })
  if (!perClient(getClientAddress()) || !perEmail(g('email').toLowerCase()) || !overall('all')) return json({ error: 'too many requests' }, { status: 429 })

  const lines = rawLines.map((l) => ({
    slug: String(l.slug ?? ''),
    qty: Math.max(1, Math.min(Math.trunc(Number(l.qty)) || 1, 99)),
  }))
  const order: NewOrder = {
    first_name: g('first_name'),
    last_name: g('last_name'),
    country: g('country'),
    address: g('address'),
    city: g('city'),
    state: g('state'),
    postcode: g('postcode'),
    phone: g('phone'),
    email: g('email'),
    ship_different: false, // the checkout has no separate delivery address
    ship: {},
    note: g('order_comments'),
    shipping_method: method,
    lines,
  }

  try {
    const saved = createOrder(order)
    // not awaited: the order is already stored, mail trouble must not fail the request
    sendOrderEmails(saved.order, saved.items, getNotifyEmails()).catch((e) => console.error('order email failed', e))
    return json({ total: saved.order.total }, { status: 201 })
  } catch (e) {
    if (e instanceof UnknownBookError) return json({ errors: { items: 'unknown book' } }, { status: 422 })
    throw e
  }
}
