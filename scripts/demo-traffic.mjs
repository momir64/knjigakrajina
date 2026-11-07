// Fills the local database with made-up page views for the statistics page:  npm run demo:traffic
// Remove them again with:                                                       npm run demo:traffic -- --remove
import { DatabaseSync } from 'node:sqlite'
import { resolve } from 'node:path'

const db = new DatabaseSync(resolve(process.env.DB_PATH ?? 'data/knjigakrajina.db'))
const has = db.prepare("SELECT 1 FROM sqlite_master WHERE name='pageviews'").get()
if (!has) throw new Error('start the app once first so the statistics table is created')

if (process.argv.includes('--remove')) {
  const r = db.prepare("DELETE FROM pageviews WHERE visitor LIKE 'demo%'").run()
  console.log(`removed ${r.changes} demo page views`)
  process.exit(0)
}

// seeded random numbers, so every run gives the same picture
let seed = 20260610
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
const pick = (rows) => {
  let r = rnd() * rows.reduce((s, x) => s + x[0], 0)
  for (const x of rows) if ((r -= x[0]) <= 0) return x
  return rows[0]
}

// weight, country, city
const PLACES = [
  [30, 'RS', 'Novi Sad'],
  [22, 'RS', 'Belgrade'],
  [6, 'RS', 'Nis'],
  [5, 'RS', 'Subotica'],
  [4, 'RS', 'Zrenjanin'],
  [3, 'RS', 'Sremska Mitrovica'],
  [5, 'BA', 'Banja Luka'],
  [3, 'BA', 'Sarajevo'],
  [3, 'HR', 'Zagreb'],
  [2, 'ME', 'Podgorica'],
  [4, 'AT', 'Vienna'],
  [4, 'DE', 'Frankfurt'],
  [2, 'DE', 'Munich'],
  [2, 'CH', 'Zurich'],
  [3, 'US', 'Chicago'],
  [2, 'US', 'New York'],
  [2, 'CA', 'Toronto'],
  [1.5, 'AU', 'Sydney'],
  [1.5, 'GB', 'London'],
  [1, 'SE', 'Stockholm'],
  [1, 'FR', 'Paris'],
]
// weight, type, name, referrer
const SOURCES = [
  [34, 'direct', '', ''],
  [26, 'search', 'Google', 'https://www.google.com/'],
  [14, 'social', 'Facebook', 'https://l.facebook.com/'],
  [8, 'social', 'Instagram', 'https://l.instagram.com/'],
  [4, 'search', 'Bing', 'https://www.bing.com/'],
  [3, 'search', 'DuckDuckGo', 'https://duckduckgo.com/'],
  [4, 'email', 'Gmail', ''],
  [3, 'referral', 'rtv.rs', ''],
  [2, 'referral', 'kupindo.com', ''],
  [2, 'campaign', 'newsletter', ''],
]
const DEVICES = [[58, 'mobile'], [36, 'desktop'], [6, 'tablet']]
const BROWSERS = [[52, 'Chrome'], [20, 'Safari'], [10, 'Firefox'], [8, 'Edge'], [6, 'Samsung Internet'], [4, 'Opera']]
const HOURS = [[1, 0], [0.5, 1], [0.3, 2], [0.2, 3], [0.2, 4], [0.4, 5], [1, 6], [2, 7], [3, 8], [4, 9], [5, 10], [5, 11], [5, 12], [5, 13], [5, 14], [5, 15], [5, 16], [6, 17], [7, 18], [9, 19], [10, 20], [10, 21], [7, 22], [3, 23]]

const books = db.prepare('SELECT slug FROM books WHERE active=1 ORDER BY sort').all().map((b) => `/knjige/${b.slug}/`)
if (books.length === 0) throw new Error('start the app once first so the books are seeded')
const popular = (n) => books[Math.floor(Math.pow(rnd(), 1.8) * Math.min(books.length, n))]

const insert = db.prepare(`INSERT INTO pageviews(ts,day,hour,dow,path,visitor,entry,src_type,src_name,country,city,device,browser)
  VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`)

const DAYS = 120
const now = Date.now()
let count = 0
db.exec('BEGIN')
for (let back = DAYS - 1; back >= 0; back--) {
  const date = new Date(now - back * 86400_000)
  const day = date.toISOString().slice(0, 10)
  const dow = (date.getUTCDay() + 6) % 7 // 0 = Monday
  const growth = 0.55 + ((DAYS - back) / DAYS) * 0.9
  const weekday = [1, 1.05, 1.1, 1.05, 0.95, 0.85, 0.9][dow]
  const visitors = Math.round((9 + rnd() * 9) * growth * weekday * (rnd() < 0.06 ? 3 : 1))
  for (let v = 0; v < visitors; v++) {
    const [, country, city] = pick(PLACES)
    const [, type, name, ref] = pick(SOURCES)
    const [, device] = pick(DEVICES)
    const [, browser] = pick(BROWSERS)
    const [, hour] = pick(HOURS)
    const id = 'demo' + Math.floor(rnd() * 1e12).toString(16).padStart(12, '0')
    const pages = ['/', '/knjige/', popular(12)]
    if (rnd() < 0.35) pages.push(popular(12))
    if (rnd() < 0.16) pages.push('/korpa/')
    if (pages.includes('/korpa/') && rnd() < 0.6) pages.push('/placanje/')
    if (pages.includes('/placanje/') && rnd() < 0.45) pages.push('/placanje/narudzbina-primljena/')
    if (rnd() < 0.1) pages.push('/kontakt/')
    if (rnd() < 0.06) pages.push('/usluge/')
    if (type !== 'direct' || rnd() < 0.5) pages.shift() // many visits start on a book page instead of the home page
    pages.forEach((path, i) => {
      const ts = Math.floor(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8), hour - 1, Math.floor(rnd() * 50) + i) / 1000)
      insert.run(ts, day, hour, dow, path, id, i === 0 ? 1 : 0, i === 0 ? type : 'direct', i === 0 ? name : '', country, city, device, browser)
      count++
    })
  }
}
db.exec('COMMIT')
console.log(`added ${count} demo page views over ${DAYS} days`)
