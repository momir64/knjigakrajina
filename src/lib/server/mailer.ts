import { Resend } from 'resend'
import type { OrderItem, OrderRow } from './db'
import { config } from './env'

const escape = (s: string | null | undefined) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')

const fmt = (n: number) => `${n.toLocaleString('de-DE')},00 РСД`

let client: Resend | undefined

async function send(to: string[], subject: string, html: string, replyTo?: string): Promise<boolean> {
  if (to.length === 0) return false
  if (!config.resendKey) {
    console.warn(`RESEND_API_KEY not set - email to ${to.join(', ')} not sent:\n${subject}\n${html}`)
    return false
  }
  client ??= new Resend(config.resendKey)
  const { error } = await client.emails.send({ from: config.mailFrom, to, subject, html, ...(replyTo && { replyTo }) })
  if (error) {
    console.error('Resend failed', error)
    return false
  }
  return true
}

const itemsTable = (items: OrderItem[]) =>
  `<table style='border-collapse:collapse'>${items
    .map(
      (i) =>
        `<tr><td style='padding:6px 12px 6px 0'>${escape(i.title)} × ${i.qty}</td>` +
        `<td style='padding:6px 0;text-align:right'>${fmt(i.price * i.qty)}</td></tr>`,
    )
    .join('')}</table>`

function address(o: OrderRow): string {
  const parts = o.ship_different
    ? [`${o.ship_first_name} ${o.ship_last_name}`, o.ship_address, `${o.ship_postcode} ${o.ship_city}`, o.ship_phone]
    : [`${o.first_name} ${o.last_name}`, o.address, `${o.postcode} ${o.city}`, o.phone]
  return parts.map(escape).join('<br>')
}

/** Confirmation to the customer + notification to the shop; the order is already saved, so failures only get logged. */
export async function sendOrderEmails(order: OrderRow, items: OrderItem[], notify: string[]): Promise<void> {
  // the customer never sees an order id; the shop gets a short reference (+ the full UUID) to find it
  const ref = order.id.slice(0, 8)
  const shipping = order.shipping_method === 'pickup' ? 'Лично преузимање' : 'Пост експрес'
  const body =
    `${itemsTable(items)}<p><b>Укупно без поштарине: ${fmt(order.total)}</b><br>` +
    `Пошиљка: ${shipping}<br>Плаћање поузећем</p>`

  await send(
    [order.email],
    'Књига Крајина – потврда наруџбине',
    `<p>Поштовани/а ${escape(order.first_name)}, хвала на наруџбини.</p>${body}` +
      `<p>Адреса испоруке:<br>${address(order)}</p><p>Сњежана Станишић, Нови Сад<br>064/297-3929</p>`,
  )
  await send(
    notify,
    `Нова наруџбина ${ref}`,
    `<p>Нова наруџбина ${ref} – ${escape(order.first_name)} ${escape(order.last_name)}, ` +
      `${escape(order.email)}, ${escape(order.phone)}</p>${body}` +
      `<p>Адреса испоруке:<br>${address(order)}</p><p>Напомена: ${escape(order.note || '-')}</p><p style='color:#888'>ID: ${order.id}</p>`,
    order.email,
  )
}
