import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { createOrder, getNotifyEmails, UnknownBookError, type NewOrder } from '#lib/server/db'
import { sendOrderEmails } from '#lib/server/mailer'
import type { ShippingMethod } from '#lib/types'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const SHIPPING: ShippingMethod[] = ['pickup', 'post']
const REQUIRED = ['first_name', 'last_name', 'country', 'address', 'city', 'postcode', 'phone', 'email']
const SHIP_REQUIRED = ['first_name', 'last_name', 'country', 'address', 'city', 'postcode', 'phone']

export const POST: RequestHandler = async ({ request }) => {
  const d: Record<string, unknown> = await request.json().catch(() => ({}))
  const g = (k: string) => String(d[k] ?? '').trim()

  const errors: Record<string, string> = {}
  for (const f of REQUIRED) if (!g(f)) errors[f] = 'required'
  if (!errors.email && !EMAIL_RE.test(g('email'))) errors.email = 'invalid'
  const diff = Boolean(d.ship_different)
  if (diff) for (const f of SHIP_REQUIRED) if (!g(`ship_${f}`)) errors[`ship_${f}`] = 'required'
  const method = d.shipping_method as ShippingMethod
  if (!SHIPPING.includes(method)) errors.shipping_method = 'invalid'

  const rawLines = Array.isArray(d.items) ? (d.items as Record<string, unknown>[]) : []
  if (rawLines.length === 0) errors.items = 'empty'
  if (Object.keys(errors).length) return json({ errors }, { status: 422 })

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
    ship_different: diff,
    ship: Object.fromEntries(['first_name', 'last_name', 'country', 'address', 'city', 'state', 'postcode', 'phone'].map((f) => [f, g(`ship_${f}`)])),
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
