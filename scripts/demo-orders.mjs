// Fills the local database with demo orders (all use @example.com addresses):  npm run demo:orders
// Remove them again with:                                                       npm run demo:orders -- --remove
import { randomUUID } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { resolve } from 'node:path'

const db = new DatabaseSync(resolve(process.env.DB_PATH ?? 'data/knjigakrajina.db'))
db.exec('PRAGMA foreign_keys = ON')

if (process.argv.includes('--remove')) {
  const r = db.prepare("DELETE FROM orders WHERE email LIKE '%@example.com'").run()
  console.log(`removed ${r.changes} demo orders`)
  process.exit(0)
}

const books = db.prepare('SELECT id, slug, title, price FROM books WHERE active=1 ORDER BY sort').all()
if (books.length < 3) throw new Error('start the app once first so the books are seeded')
const pick = (...i) => i.map((n) => books[n % books.length])

const person = (first, last, address, postcode, city, phone) => ({ first, last, address, postcode, city, phone, email: `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, 'x') + '@example.com' })
// hours ago, status, buyer, [[bookIndex, qty]...], shipping, note, other delivery address
const demo = [
  [1, 'new', person('Милан', 'Јовановић', 'Булевар ослобођења 45', '21000', 'Нови Сад', '064/111-2233'), [[0, 1]], 'post', 'Молим позвати пре доставе.'],
  [5, 'new', person('Јелена', 'Мартиновић', 'Кнеза Милоша 12', '11000', 'Београд', '063/555-0101'), [[1, 2], [3, 1]], 'post', ''],
  [26, 'new', person('Саша', 'Опачић', 'Војводе Путника 8', '23000', 'Зрењанин', '065/777-8899'), [[2, 1]], 'pickup', 'Преузимам у уторак после 16 часова.'],
  [50, 'shipped', person('Драгана', 'Ковачевић', 'Змај Јовина 3', '21205', 'Сремска Каменица', '064/222-3344'), [[0, 3], [4, 1], [5, 1]], 'post', ''],
  [120, 'done', person('Борко', 'Петровић', 'Светосавска 21', '21000', 'Нови Сад', '062/909-1010'), [[3, 1]], 'pickup', ''],
  [200, 'done', person('Мирјана', 'Гајић', 'Ђуре Јакшића 5', '24000', 'Суботица', '064/333-4455'), [[1, 1], [2, 1]], 'post', 'Књиге су поклон, ако може лепо упаковати.'],
  [300, 'canceled', person('Ратко', 'Лукић', 'Цара Лазара 30', '22000', 'Сремска Митровица', '063/888-9900'), [[4, 2]], 'post', 'Предомислио сам се.'],
]

const insOrder = db.prepare(`INSERT INTO orders(id,created_at,status,first_name,last_name,country,address,city,state,postcode,phone,email,ship_different,
  ship_first_name,ship_last_name,ship_country,ship_address,ship_city,ship_state,ship_postcode,ship_phone,note,shipping_method,total)
  VALUES(?,?,?,?,?,'Србија',?,?,'',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
const insItem = db.prepare('INSERT INTO order_items(id,order_id,book_id,title,price,qty) VALUES(?,?,?,?,?,?)')

db.exec('BEGIN')
for (const [hoursAgo, status, b, lines, shipping, note, other] of demo) {
  const id = randomUUID()
  const items = lines.map(([n, qty]) => ({ book: pick(n)[0], qty }))
  const total = items.reduce((s, i) => s + i.book.price * i.qty, 0)
  const at = new Date(Date.now() - hoursAgo * 3600_000).toISOString().replace(/\.\d+Z$/, 'Z')
  insOrder.run(id, at, status, b.first, b.last, b.address, b.city, b.postcode, b.phone, b.email, other ? 1 : 0,
    other?.first ?? null, other?.last ?? null, other ? 'Босна и Херцеговина' : null, other?.address ?? null, other?.city ?? null, null, other?.postcode ?? null, other?.phone ?? null,
    note, shipping, total)
  for (const i of items) insItem.run(randomUUID(), id, i.book.id, i.book.title, i.book.price, i.qty)
}
db.exec('COMMIT')
console.log(`added ${demo.length} demo orders`)
