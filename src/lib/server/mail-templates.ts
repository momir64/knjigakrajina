// All e-mail texts and the shared look, matching the site: warm off-white page (like the back office), white card with a
// soft border and shadow (like the "Ваша наруџбина" box), cream header, gold accent, dark footer.
// Mail clients are picky: table layout, inline styles, no web fonts, no images (SVG is not supported by Gmail).
import type { OrderItem, OrderRow } from './db'

export interface Mail {
  subject: string
  html: string
  text: string
}

const COLORS = {
  page: '#fffdf8', // behind the card
  card: '#ffffff',
  header: '#f8f0e0',
  panel: '#fffdf8', // quiet boxes inside the card
  text: '#333333',
  dark: '#212120',
  accent: '#bc9d77',
  muted: '#2c2a26', // secondary text: between the footer (#37342d) and the headings (#212120)
  line: '#f0e8dd',
  border: '#e8e8e8',
  footer: '#37342d',
  notice: '#4f3933',
}
const SANS = "Raleway, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const SERIF = "Georgia, 'Times New Roman', serif"

const esc = (s: string | null | undefined) =>
  (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')

export const money = (n: number) => `${n.toLocaleString('de-DE')},00 РСД`

const SHOP = { name: 'Књига Крајина', owner: 'Сњежана Станишић, Нови Сад', phone: '064/297-3929', email: 'snjezana.stanisic.ns@gmail.com' }

const shippingLabel = (o: OrderRow) => (o.shipping_method === 'pickup' ? 'Лично преузимање' : 'Пост експрес')
const orderRef = (o: OrderRow) => o.id.slice(0, 8)

function addressLines(o: OrderRow): string[] {
  const l = [`${o.first_name} ${o.last_name}`, o.address, `${o.postcode} ${o.city}`, o.state, o.country, o.phone]
  return l.filter((x): x is string => Boolean(x && x.trim()))
}

// ---- building blocks ------------------------------------------------------

function layout(o: { preheader: string; title: string; body: string }): string {
  return `<!doctype html>
<html lang="sr-RS"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="format-detection" content="telephone=no,address=no,email=no,date=no"><title>${esc(o.title)}</title>
<style>
  /* mail apps turn street addresses, phones and dates into blue underlined links on their own: keep them as plain text. Links we wrote carry an inline colour, which wins over these rules */
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
  u + .mail a { color: inherit; text-decoration: none; }
</style></head>
<body style="margin:0;padding:0;background:${COLORS.page};">
<u></u><div class="mail">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COLORS.page};">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};"><tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:6px;box-shadow:0 8px 18px rgba(0,1,35,0.07);overflow:hidden;">
    <tr><td align="center" style="background:${COLORS.header};padding:30px 24px 22px;border-bottom:3px solid ${COLORS.accent};">
      <div style="font-family:${SERIF};font-size:30px;line-height:34px;color:${COLORS.dark};">Књига Крајина</div>
      <div style="font-family:${SANS};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.muted};padding-top:6px;">Књиге · Лектура · Припрема за штампу</div>
    </td></tr>
    <tr><td style="padding:32px 36px 8px;font-family:${SANS};font-size:16px;line-height:26px;color:${COLORS.text};">${o.body}</td></tr>
    <tr><td style="padding:8px 36px 32px;"></td></tr>
    <tr><td align="center" style="background:${COLORS.footer};padding:26px 24px;font-family:${SANS};font-size:14px;line-height:24px;color:#ffffff;">
      ${esc(SHOP.owner)}<br>${esc(SHOP.phone)} · <a href="mailto:${SHOP.email}" style="color:#ffffff;text-decoration:none;">${SHOP.email}</a><br>
      <a href="https://knjigakrajina.com/" style="color:#ffffff;text-decoration:none;">knjigakrajina.com</a>
    </td></tr>
  </table>
</td></tr></table>
</div>
</body></html>`
}

const h1 = (s: string) => `<h1 style="margin:0 0 14px;font-family:${SANS};font-size:24px;line-height:30px;font-weight:600;color:${COLORS.dark};">${s}</h1>`
const p = (s: string) => `<p style="margin:0 0 16px;">${s}</p>`
const h2 = (s: string) => `<div style="margin:26px 0 8px;font-family:${SANS};font-size:13px;letter-spacing:0.8px;text-transform:uppercase;font-weight:700;color:${COLORS.muted};">${s}</div>`

const box = (inner: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${COLORS.panel};border:1px solid ${COLORS.line};border-left:3px solid ${COLORS.accent};border-radius:4px;padding:14px 18px;font-size:15px;line-height:24px;color:${COLORS.text};">${inner}</td></tr></table>`

function itemsTable(items: OrderItem[], total: number): string {
  const rows = items
    .map(
      (i) => `<tr>
  <td style="padding:12px 0;border-bottom:1px solid ${COLORS.line};font-size:15px;line-height:22px;color:${COLORS.dark};">${esc(i.title)}<br><span style="font-size:13px;color:${COLORS.muted};">${i.qty} × ${money(i.price)}</span></td>
  <td align="right" style="padding:12px 0 12px 16px;border-bottom:1px solid ${COLORS.line};font-size:15px;white-space:nowrap;vertical-align:top;color:${COLORS.dark};">${money(i.price * i.qty)}</td>
</tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COLORS.line};">${rows}
<tr><td style="padding:14px 0 2px;font-size:16px;font-weight:700;color:${COLORS.dark};">Укупно <span style="font-weight:400;font-size:13px;color:${COLORS.muted};">(без поштарине)</span></td>
<td align="right" style="padding:14px 0 2px;font-size:18px;font-weight:700;white-space:nowrap;color:${COLORS.dark};">${money(total)}</td></tr></table>`
}

const itemsText = (items: OrderItem[], total: number) =>
  items.map((i) => `- ${i.title} (${i.qty} × ${money(i.price)}) = ${money(i.price * i.qty)}`).join('\n') + `\nУкупно (без поштарине): ${money(total)}`

const html = (lines: string[]) => lines.map(esc).join('<br>')

const detailsBlock = (o: OrderRow) =>
  h2('Испорука') + box(`${html(addressLines(o))}<br>${esc(shippingLabel(o))} · плаћање поузећем`)

// shop notice: who ordered and where it goes, in one box
function buyerBlock(o: OrderRow): string {
  const own = html([o.address, `${o.postcode} ${o.city}`, o.country])
  const lines = [
    `<b>${esc(o.first_name + ' ' + o.last_name)}</b>`,
    `<a href="mailto:${esc(o.email)}" style="color:${COLORS.notice};">${esc(o.email)}</a>`,
    esc(o.phone),
    own,
  ]
  lines.push('', `${esc(shippingLabel(o))} · плаћање поузећем`)
  return box(lines.join('<br>'))
}

const contact = () => p(`Ако имате питања, јавите нам се на <a href="mailto:${SHOP.email}" style="color:${COLORS.notice};">${SHOP.email}</a> или позовите ${esc(SHOP.phone)}.`)

// ---- order placed -----------------------------------------------------------

/** To the customer, right after checkout. */
export function orderConfirmation(o: OrderRow, items: OrderItem[]): Mail {
  const pickup = o.shipping_method === 'pickup'
  const body =
    h1('Хвала на наруџбини!') +
    p(`Поштовани/а ${esc(o.first_name)}, примили смо вашу наруџбину.${pickup ? ' Јавићемо вам се када књиге буду спремне за преузимање.' : ' Књиге ћемо упаковати и послати што је пре могуће. Плаћање се врши приликом преузимања пошиљке од курира.'}`) +
    h2('Наручено') + itemsTable(items, o.total) +
    detailsBlock(o) +
    `<div style="height:22px"></div>` + contact() + p('Срдачан поздрав,<br>Сњежана Станишић')
  return {
    subject: 'Књига Крајина – потврда наруџбине',
    html: layout({ preheader: 'Хвала на наруџбини – ево прегледа ваших књига.', title: 'Потврда наруџбине', body }),
    text: `Поштовани/а ${o.first_name}, хвала на наруџбини.\n\n${itemsText(items, o.total)}\n\nИспорука: ${shippingLabel(o)}, плаћање поузећем\n${addressLines(o).join('\n')}\n\n${SHOP.owner}, ${SHOP.phone}`,
  }
}

/** To the shop owner(s): everything needed to process the order. */
export function newOrderNotice(o: OrderRow, items: OrderItem[]): Mail {
  const ref = orderRef(o)
  const who = `${o.first_name} ${o.last_name}`
  const body =
    h1(`Нова наруџбина <span style="color:${COLORS.muted};">${esc(ref)}</span>`) +
    p(`${esc(who)} је управо послао/ла наруџбину на вебсајту.`) +
    h2('Наручено') + itemsTable(items, o.total) +
    h2('Купац и испорука') + buyerBlock(o) +
    `<p style="margin:26px 0 0;font-size:12px;color:${COLORS.muted};">ID: ${esc(o.id)}<br>Одговор на ову поруку иде купцу.</p>`
  return {
    subject: `Нова наруџбина ${ref}`,
    html: layout({ preheader: `${who} – ${money(o.total)}`, title: `Нова наруџбина ${ref}`, body }),
    text: `Нова наруџбина ${ref}\n${who}, ${o.email}, ${o.phone}\n\n${itemsText(items, o.total)}\n\nИспорука: ${shippingLabel(o)}\n${addressLines(o).join('\n')}\nID: ${o.id}`,
  }
}

// ---- status changes (sent from the back office when the owner ticks "notify customer") ----------------------

export const NOTIFIED_STATUSES = ['shipped', 'canceled'] as const
export type NotifiedStatus = (typeof NOTIFIED_STATUSES)[number]
export const isNotifiedStatus = (s: string): s is NotifiedStatus => (NOTIFIED_STATUSES as readonly string[]).includes(s)

export function statusUpdate(o: OrderRow, items: OrderItem[], status: NotifiedStatus): Mail {
  const pickup = o.shipping_method === 'pickup'
  const copy: Record<NotifiedStatus, { subject: string; title: string; text: string }> = {
    shipped: {
      subject: pickup ? 'Књига Крајина – наруџбина је спремна за преузимање' : 'Књига Крајина – наруџбина је послата',
      title: pickup ? 'Наруџбина је спремна за преузимање' : 'Наруџбина је послата',
      text: pickup ? 'Ваше књиге су спремне за преузимање. Позовите нас да договоримо термин.' : 'Ваше књиге су послате Пост експресом. Плаћање се врши приликом преузимања пошиљке од курира.',
    },
    canceled: {
      subject: 'Књига Крајина – наруџбина је отказана',
      title: 'Наруџбина је отказана',
      text: 'Ваша наруџбина је отказана. Ако мислите да је у питању грешка или желите поново да наручите, слободно нам се јавите.',
    },
  }
  const c = copy[status]
  const body =
    h1(c.title) + p(`Поштовани/а ${esc(o.first_name)},`) + p(c.text) +
    (status === 'canceled' ? '' : h2('Наруџбина') + itemsTable(items, o.total) + detailsBlock(o) + `<div style="height:22px"></div>`) +
    contact() + p('Срдачан поздрав,<br>Сњежана Станишић')
  return {
    subject: c.subject,
    html: layout({ preheader: c.text, title: c.title, body }),
    text: `Поштовани/а ${o.first_name},\n\n${c.text}\n\n${status === 'canceled' ? '' : itemsText(items, o.total) + '\n\n'}${SHOP.owner}, ${SHOP.phone}`,
  }
}

// ---- back office test -------------------------------------------------------------

export function testMail(): Mail {
  const body =
    h1('Пробна порука') +
    p('Ако читате ову поруку, слање е-поште ради. Обавештења о новим наруџбинама стизаће на ову адресу.') +
    box('Овако ће изгледати поруке које шаље сајт: нова наруџбина, потврда за купца и промена статуса.')
  return {
    subject: 'Књига Крајина – пробна порука',
    html: layout({ preheader: 'Слање е-поште ради.', title: 'Пробна порука', body }),
    text: 'Ово је пробна порука. Обавештења о наруџбинама стизаће на ову адресу.',
  }
}
