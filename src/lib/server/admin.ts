import { randomUUID } from 'node:crypto'
import { DEFAULT_PRICE_LIST, type PriceList } from '#lib/pricelist'
import { isOrderStatus, type AdminBook, type OrderStatus, type OrderSummary } from '#lib/admin'
import { db, type OrderItem, type OrderRow } from './db'

// Queries used by the back office only. Everything user-supplied goes in as bound parameters.

const plain = <T>(row: unknown) => ({ ...(row as object) }) as T

const BELGRADE = new Intl.DateTimeFormat('sr-Cyrl-RS', {
  timeZone: 'Europe/Belgrade',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
/** "2026-10-30T12:00:00Z" -> "30. 10. 2026. 13:00" (always shop time, rendered on the server) */
export const formatDate = (iso: string) => BELGRADE.format(new Date(iso))

// --- orders ---

export const ORDERS_PER_PAGE = 30

export function listOrders(page: number, status: string): { orders: OrderSummary[]; total: number } {
  const where = isOrderStatus(status) ? 'WHERE o.status = ?' : ''
  const args = isOrderStatus(status) ? [status] : []
  const { n } = plain<{ n: number }>(db().prepare(`SELECT COUNT(*) AS n FROM orders o ${where}`).get(...args))
  const rows = db()
    .prepare(
      `SELECT o.id, o.created_at, o.status, o.first_name, o.last_name, o.city, o.total,
              COALESCE((SELECT SUM(qty) FROM order_items WHERE order_id = o.id), 0) AS qty
         FROM orders o ${where} ORDER BY o.created_at DESC, o.rowid DESC LIMIT ? OFFSET ?`,
    )
    .all(...args, ORDERS_PER_PAGE, (page - 1) * ORDERS_PER_PAGE) as Record<string, string | number>[]
  return {
    total: n,
    orders: rows.map((r) => ({
      id: String(r.id),
      created: formatDate(String(r.created_at)),
      status: (isOrderStatus(String(r.status)) ? r.status : 'new') as OrderStatus,
      name: `${r.first_name} ${r.last_name}`,
      city: String(r.city),
      qty: Number(r.qty),
      total: Number(r.total),
    })),
  }
}

export function countNewOrders(): number {
  return plain<{ n: number }>(db().prepare("SELECT COUNT(*) AS n FROM orders WHERE status='new'").get()).n
}

export function getOrder(id: string): { order: OrderRow; items: (OrderItem & { id: string })[] } | null {
  const order = db().prepare('SELECT * FROM orders WHERE id=?').get(id)
  if (!order) return null
  const items = db().prepare('SELECT id, book_id, title, price, qty FROM order_items WHERE order_id=? ORDER BY rowid').all(id)
  return { order: plain<OrderRow>(order), items: items.map((i) => plain<OrderItem & { id: string }>(i)) }
}

export function setOrderStatus(id: string, status: OrderStatus): boolean {
  return Number(db().prepare('UPDATE orders SET status=? WHERE id=?').run(status, id).changes) > 0
}

export function deleteOrder(id: string): boolean {
  return Number(db().prepare('DELETE FROM orders WHERE id=?').run(id).changes) > 0 // lines go with it (CASCADE)
}

// --- books ---

const COLS = 'id, slug, title, author, price, description, image, weight, length, width, height, pages, binding, script, year, isbn, sort, active'

export const listAllBooks = () => db().prepare(`SELECT ${COLS} FROM books ORDER BY sort, rowid`).all().map((r) => plain<AdminBook>(r))

export function getBookById(id: string): AdminBook | null {
  const row = db().prepare(`SELECT ${COLS} FROM books WHERE id=?`).get(id)
  return row ? plain<AdminBook>(row) : null
}

export type BookInput = Omit<AdminBook, 'id'>

export const slugTaken = (slug: string, exceptId = '') =>
  !!db().prepare('SELECT 1 FROM books WHERE slug=? AND id<>?').get(slug, exceptId)

export function createBook(b: BookInput): string {
  const id = randomUUID()
  const cols = Object.keys(b)
  db()
    .prepare(`INSERT INTO books(id, ${cols.join(',')}) VALUES(?, ${cols.map(() => '?').join(',')})`)
    .run(id, ...(Object.values(b) as never[]))
  return id
}

export function updateBook(id: string, b: BookInput): boolean {
  const cols = Object.keys(b)
  const r = db()
    .prepare(`UPDATE books SET ${cols.map((c) => `${c}=?`).join(',')} WHERE id=?`)
    .run(...(Object.values(b) as never[]), id)
  return Number(r.changes) > 0
}

export function deleteBook(id: string): boolean {
  return Number(db().prepare('DELETE FROM books WHERE id=?').run(id).changes) > 0 // order lines keep their title/price
}

/** how many books use this cover file (covers can be shared, so a file is only deleted when this is 0) */
export const imageUses = (image: string, exceptId = '') =>
  plain<{ n: number }>(db().prepare('SELECT COUNT(*) AS n FROM books WHERE image=? AND id<>?').get(image, exceptId)).n

export const nextSort = () => plain<{ n: number }>(db().prepare('SELECT COALESCE(MAX(sort), 0) + 10 AS n FROM books').get()).n

// --- settings ---

export function setNotifyEmails(emails: string[]) {
  db().prepare("INSERT INTO settings(key,value) VALUES('notify_emails', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(emails))
}

// --- price list (services page) ---

export function getPriceList(): PriceList {
  const row = db().prepare("SELECT value FROM settings WHERE key='price_list'").get() as { value: string } | undefined
  try {
    const parsed = row ? (JSON.parse(row.value) as PriceList) : null
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    // damaged value: fall back to the built-in list
  }
  return structuredClone(DEFAULT_PRICE_LIST)
}

export function setPriceList(list: PriceList) {
  db().prepare("INSERT INTO settings(key,value) VALUES('price_list', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(list))
}
