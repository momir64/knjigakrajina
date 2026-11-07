import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Book, ShippingMethod } from '#lib/types'
import { config } from './env'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,                 -- UUID
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL,              -- RSD, whole dinars
    description TEXT NOT NULL DEFAULT '',-- HTML
    image TEXT NOT NULL DEFAULT '',      -- file name inside uploads/books/
    weight TEXT NOT NULL DEFAULT '',     -- g
    length TEXT NOT NULL DEFAULT '',     -- cm
    width TEXT NOT NULL DEFAULT '',
    height TEXT NOT NULL DEFAULT '',
    pages TEXT NOT NULL DEFAULT '',
    binding TEXT NOT NULL DEFAULT '',
    script TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT '',
    isbn TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,                 -- UUID
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    status TEXT NOT NULL DEFAULT 'new',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    country TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT '',
    postcode TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    ship_different INTEGER NOT NULL DEFAULT 0,
    ship_first_name TEXT, ship_last_name TEXT, ship_country TEXT, ship_address TEXT,
    ship_city TEXT, ship_state TEXT, ship_postcode TEXT, ship_phone TEXT,
    note TEXT NOT NULL DEFAULT '',
    shipping_method TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cod',
    total INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,                 -- UUID
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    price INTEGER NOT NULL,
    qty INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,         -- SHA-256 of the cookie value
    expires_at INTEGER NOT NULL          -- ms since epoch
);

-- Anonymous page views for the back office statistics. No address, no cookie: "visitor" is a hash that changes every day.
CREATE TABLE IF NOT EXISTS pageviews (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,                 -- seconds since epoch
    day TEXT NOT NULL,                   -- YYYY-MM-DD in shop time (Europe/Belgrade)
    hour INTEGER NOT NULL,               -- 0-23, shop time
    dow INTEGER NOT NULL,                -- 0 = Monday
    path TEXT NOT NULL,
    visitor TEXT NOT NULL,
    entry INTEGER NOT NULL DEFAULT 0,    -- 1 = the page was opened from outside, i.e. a visit starts here
    src_type TEXT NOT NULL DEFAULT 'direct',
    src_name TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',    -- ISO 3166-1 alpha-2, from Cloudflare
    city TEXT NOT NULL DEFAULT '',
    device TEXT NOT NULL DEFAULT '',
    browser TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS pageviews_day ON pageviews(day);
`

const BOOK_COLS = 'id, slug, title, author, price, description, image, weight, length, width, height, pages, binding, script, year, isbn'

const SEED_COLS = ['slug', 'title', 'author', 'price', 'description', 'image', 'weight', 'length', 'width', 'height', 'pages', 'binding', 'script', 'year', 'sort'] as const

export interface OrderRow {
  id: string
  created_at: string
  status: string
  first_name: string
  last_name: string
  country: string
  address: string
  city: string
  state: string
  postcode: string
  phone: string
  email: string
  ship_different: number
  ship_first_name: string | null
  ship_last_name: string | null
  ship_country: string | null
  ship_address: string | null
  ship_city: string | null
  ship_state: string | null
  ship_postcode: string | null
  ship_phone: string | null
  note: string
  shipping_method: ShippingMethod
  payment_method: string
  total: number
}

export interface OrderItem {
  book_id: string
  title: string
  price: number
  qty: number
}

export interface NewOrder {
  first_name: string
  last_name: string
  country: string
  address: string
  city: string
  state: string
  postcode: string
  phone: string
  email: string
  ship_different: boolean
  ship: Record<string, string>
  note: string
  shipping_method: ShippingMethod
  /** slug + quantity as sent by the browser; prices always come from the database */
  lines: { slug: string; qty: number }[]
}

export class UnknownBookError extends Error {}

const plain = <T>(row: unknown) => ({ ...(row as object) }) as T

function open(): DatabaseSync {
  mkdirSync(dirname(config.dbPath), { recursive: true })
  const db = new DatabaseSync(config.dbPath)
  db.exec('PRAGMA foreign_keys = ON')
  db.exec('PRAGMA journal_mode = WAL')
  migrateToUuids(db)
  db.exec(SCHEMA)
  if (!(db.prepare('PRAGMA table_info(books)').all() as { name: string }[]).some((c) => c.name === 'isbn')) {
    db.exec("ALTER TABLE books ADD COLUMN isbn TEXT NOT NULL DEFAULT ''") // added after the first release
  }
  db.exec("UPDATE orders SET status='new' WHERE status='confirmed'") // the "confirmed" step was dropped
  db.exec("DELETE FROM pageviews WHERE ts < CAST(strftime('%s','now') AS INTEGER) - 800 * 86400") // keep about two years

  const { n } = plain<{ n: number }>(db.prepare('SELECT COUNT(*) AS n FROM books').get())
  if (n === 0) seed(db)
  if (!db.prepare("SELECT 1 FROM settings WHERE key='notify_emails'").get()) {
    db.prepare("INSERT INTO settings(key,value) VALUES('notify_emails', ?)").run(JSON.stringify(config.defaultNotify))
  }
  return db
}

/** Databases created before UUID ids (integer primary keys): rebuild the tables, keeping all rows and relations. */
function migrateToUuids(db: DatabaseSync) {
  const idColumn = (db.prepare('PRAGMA table_info(books)').all() as { name: string; type: string }[]).find((c) => c.name === 'id')
  if (!idColumn || idColumn.type.toUpperCase() !== 'INTEGER') return

  db.exec('PRAGMA foreign_keys = OFF') // cannot be changed inside a transaction
  db.exec('BEGIN')
  try {
    for (const t of ['order_items', 'orders', 'books']) db.exec(`ALTER TABLE ${t} RENAME TO ${t}_old`)
    db.exec(SCHEMA)

    const insert = (table: string, row: Record<string, unknown>) => {
      const cols = Object.keys(row)
      db.prepare(`INSERT INTO ${table}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`).run(...(cols.map((c) => row[c]) as never[]))
    }
    const copy = (table: string, map: Map<unknown, string>, fix: (row: Record<string, unknown>) => void = () => {}) => {
      for (const old of db.prepare(`SELECT * FROM ${table}_old ORDER BY id`).all()) {
        const row = { ...old } as Record<string, unknown>
        const id = randomUUID()
        map.set(row.id, id)
        row.id = id
        fix(row)
        insert(table, row)
      }
    }
    const bookIds = new Map<unknown, string>()
    const orderIds = new Map<unknown, string>()
    copy('books', bookIds)
    copy('orders', orderIds)
    copy('order_items', new Map(), (row) => {
      row.order_id = orderIds.get(row.order_id)
      row.book_id = row.book_id == null ? null : (bookIds.get(row.book_id) ?? null)
    })
    for (const t of ['order_items', 'orders', 'books']) db.exec(`DROP TABLE ${t}_old`)
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  } finally {
    db.exec('PRAGMA foreign_keys = ON')
  }
}

function seed(db: DatabaseSync) {
  const books: Record<string, string | number>[] = JSON.parse(readFileSync(config.seedFile, 'utf8'))
  const insert = db.prepare(`INSERT INTO books(id,${SEED_COLS.join(',')}) VALUES(?,${SEED_COLS.map(() => '?').join(',')})`)
  db.exec('BEGIN')
  try {
    for (const b of books) insert.run(randomUUID(), ...SEED_COLS.map((c) => b[c]))
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

// one connection per process (also across dev-server module reloads)
const KEY = Symbol.for('knjigakrajina.db')
const g = globalThis as unknown as Record<symbol, DatabaseSync | undefined>
export const db = () => (g[KEY] ??= open())

export function listBooks(): Book[] {
  return db().prepare(`SELECT ${BOOK_COLS} FROM books WHERE active=1 ORDER BY sort, rowid`).all().map((r) => plain<Book>(r))
}

export function getBook(slug: string): Book | null {
  const row = db().prepare(`SELECT ${BOOK_COLS} FROM books WHERE slug=? AND active=1`).get(slug)
  return row ? plain<Book>(row) : null
}

export function getNotifyEmails(): string[] {
  const row = db().prepare("SELECT value FROM settings WHERE key='notify_emails'").get() as { value: string } | undefined
  return row ? (JSON.parse(row.value) as string[]) : []
}

/** Stores the order and its lines in one transaction; totals are computed from the current book prices. */
export function createOrder(o: NewOrder): { order: OrderRow; items: OrderItem[] } {
  const d = db()
  d.exec('BEGIN')
  try {
    const items: OrderItem[] = []
    let total = 0
    for (const line of o.lines) {
      const b = d.prepare('SELECT id, title, price FROM books WHERE slug=? AND active=1').get(line.slug) as
        | { id: string; title: string; price: number }
        | undefined
      if (!b) throw new UnknownBookError(line.slug)
      items.push({ book_id: b.id, title: b.title, price: b.price, qty: line.qty })
      total += b.price * line.qty
    }
    const s = (k: string) => o.ship[k] ?? ''
    const orderId = randomUUID()
    d.prepare(
        `INSERT INTO orders(id,first_name,last_name,country,address,city,state,postcode,phone,email,ship_different,
           ship_first_name,ship_last_name,ship_country,ship_address,ship_city,ship_state,ship_postcode,ship_phone,
           note,shipping_method,total) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        orderId, o.first_name, o.last_name, o.country, o.address, o.city, o.state, o.postcode, o.phone, o.email,
        o.ship_different ? 1 : 0,
        s('first_name'), s('last_name'), s('country'), s('address'), s('city'), s('state'), s('postcode'), s('phone'),
        o.note, o.shipping_method, total,
      )
    const insertItem = d.prepare('INSERT INTO order_items(id,order_id,book_id,title,price,qty) VALUES(?,?,?,?,?,?)')
    for (const i of items) insertItem.run(randomUUID(), orderId, i.book_id, i.title, i.price, i.qty)
    const order = plain<OrderRow>(d.prepare('SELECT * FROM orders WHERE id=?').get(orderId))
    d.exec('COMMIT')
    return { order, items }
  } catch (e) {
    d.exec('ROLLBACK')
    throw e
  }
}
