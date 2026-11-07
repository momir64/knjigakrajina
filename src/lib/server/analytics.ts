import { createHash, randomBytes } from 'node:crypto'
import { listBooks, db } from './db'
import { config } from './env'
import { DEVICES, SOURCE_TYPES, cleanLayout, type CardLayout, type Range, type Stats } from '#lib/analytics'

// Privacy-friendly statistics: no cookies, no stored addresses. A visitor is a hash of the address and browser
// salted with a secret AND the day, so it can count people within one day but cannot follow anybody across days.
// Location comes from the headers Cloudflare adds in front of the app.

const TZ = 'Europe/Belgrade'
const PARTS = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' })
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** day / hour / weekday of an instant in shop time */
export function shopTime(ms: number) {
  const p = Object.fromEntries(PARTS.formatToParts(ms).map((x) => [x.type, x.value]))
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, dow: Math.max(0, WEEKDAYS.indexOf(p.weekday)) }
}

export const shiftDay = (day: string, n: number) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// --- what is recognised as a source --------------------------------------------------------------------------------

type Source = [pattern: RegExp, name: string, type: string]
const SOURCES: Source[] = [
  [/(^|\.)google\.[a-z.]+$/, 'Google', 'search'],
  [/(^|\.)bing\.com$/, 'Bing', 'search'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo', 'search'],
  [/(^|\.)yahoo\.[a-z.]+$/, 'Yahoo', 'search'],
  [/(^|\.)yandex\.[a-z.]+$/, 'Yandex', 'search'],
  [/(^|\.)ecosia\.org$/, 'Ecosia', 'search'],
  [/(^|\.)brave\.com$/, 'Brave', 'search'],
  [/(^|\.)startpage\.com$/, 'Startpage', 'search'],
  [/(^|\.)baidu\.com$/, 'Baidu', 'search'],
  [/(^|\.)(facebook|fb)\.com$/, 'Facebook', 'social'],
  [/(^|\.)instagram\.com$/, 'Instagram', 'social'],
  [/^(t\.co|(.*\.)?(twitter|x)\.com)$/, 'X (Twitter)', 'social'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn', 'social'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube', 'social'],
  [/(^|\.)pinterest\.[a-z.]+$/, 'Pinterest', 'social'],
  [/(^|\.)tiktok\.com$/, 'TikTok', 'social'],
  [/(^|\.)reddit\.com$/, 'Reddit', 'social'],
  [/(^|\.)(telegram\.org|t\.me)$/, 'Telegram', 'social'],
  [/(^|\.)whatsapp\.com$/, 'WhatsApp', 'social'],
  [/^mail\.google\.com$/, 'Gmail', 'email'],
  [/(^|\.)(outlook\.(live|office|office365)\.com|mail\.live\.com)$/, 'Outlook', 'email'],
  [/^mail\.yahoo\.com$/, 'Yahoo Mail', 'email'],
]

// Android apps send "android-app://<package>" instead of a web address
const APPS: Record<string, [string, string]> = {
  'com.google.android.gm': ['Gmail', 'email'],
  'com.google.android.googlequicksearchbox': ['Google', 'search'],
  'com.facebook.katana': ['Facebook', 'social'],
  'com.facebook.orca': ['Facebook', 'social'],
  'com.instagram.android': ['Instagram', 'social'],
  'com.twitter.android': ['X (Twitter)', 'social'],
  'org.telegram.messenger': ['Telegram', 'social'],
  'com.whatsapp': ['WhatsApp', 'social'],
}

const ownHost = (requestUrl: string) => new URL(config.siteUrl || requestUrl).hostname.replace(/^www\./, '')

/** Where the visit came from: a recognised name and type, the bare host of another site, or "direct". */
export function classifySource(referrer: string, utm: string, requestUrl: string): { type: string; name: string; internal: boolean } {
  const tagged = utm.trim().slice(0, 40)
  const known = (key: string) => SOURCES.find(([re]) => re.test(key))
  let url: URL | undefined
  try {
    url = referrer ? new URL(referrer) : undefined
  } catch {
    // not a URL: treated as no referrer
  }
  if (url?.protocol === 'android-app:') {
    const app = APPS[url.hostname]
    if (!tagged) return app ? { name: app[0], type: app[1], internal: false } : { name: 'Android апликација', type: 'referral', internal: false }
  }
  const host = url && /^https?:$/.test(url.protocol) ? url.hostname.toLowerCase().replace(/^www\./, '') : ''
  if (host && host === ownHost(requestUrl) && !tagged) return { type: 'direct', name: '', internal: true }

  if (tagged) {
    const hit = known(tagged.toLowerCase().includes('.') ? tagged.toLowerCase() : tagged.toLowerCase() + '.com') ?? SOURCES.find(([, name]) => name.toLowerCase().startsWith(tagged.toLowerCase()))
    return hit ? { name: hit[1], type: hit[2], internal: false } : { name: tagged, type: 'campaign', internal: false }
  }
  if (!host) return { type: 'direct', name: '', internal: false }
  const hit = known(host)
  return hit ? { name: hit[1], type: hit[2], internal: false } : { name: host.slice(0, 60), type: 'referral', internal: false }
}

// --- who is visiting -----------------------------------------------------------------------------------------------

export const isBot = (ua: string) => !ua || /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|uptime|curl|wget|python|java\/|go-http|axios|node-fetch|facebookexternalhit|whatsapp|telegram|discord|slack/i.test(ua)

export function parseUserAgent(ua: string): { device: string; browser: string } {
  const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop'
  const browser = /edg(e|a|ios)?\//i.test(ua)
    ? 'Edge'
    : /opr\/|opera/i.test(ua)
      ? 'Opera'
      : /samsungbrowser/i.test(ua)
        ? 'Samsung Internet'
        : /firefox|fxios/i.test(ua)
          ? 'Firefox'
          : /chrome|crios/i.test(ua)
            ? 'Chrome'
            : /safari/i.test(ua)
              ? 'Safari'
              : 'Друго'
  return { device, browser }
}

let secret: string | undefined
function visitorSecret() {
  if (secret) return secret
  const row = db().prepare("SELECT value FROM settings WHERE key='analytics_secret'").get() as { value: string } | undefined
  if (row) return (secret = row.value)
  secret = randomBytes(24).toString('hex')
  db().prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('analytics_secret', ?)").run(secret)
  return secret
}

export const visitorId = (ip: string, ua: string, day: string) => createHash('sha256').update(`${visitorSecret()}|${day}|${ip}|${ua}`).digest('hex').slice(0, 16)

export interface Hit {
  path: string
  ip: string
  ua: string
  entry: boolean
  referrer: string
  utm: string
  requestUrl: string
  /** headers added by Cloudflare */
  country: string
  city: string
}

/**
 * Header values arrive as Latin-1 text, so UTF-8 bytes ("Zürich") show up as mojibake ("ZÃ¼rich"); some proxies also
 * percent-encode them. Both are undone here; text that is not valid UTF-8 stays as it came.
 */
export function headerText(value: string): string {
  let text = value
  if (/%[0-9a-f]{2}/i.test(text)) {
    try {
      text = decodeURIComponent(text)
    } catch {
      // not valid percent-encoding: keep it as sent
    }
  }
  if (/[\u0080-\u00ff]/.test(text) && !/[^\u0000-\u00ff]/.test(text)) {
    const utf8 = Buffer.from(text, 'latin1').toString('utf8')
    if (!utf8.includes('\ufffd')) text = utf8
  }
  return text
}

const clean = (s: string, max: number) => s.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max)

export function recordHit(h: Hit) {
  const now = Date.now()
  const t = shopTime(now)
  const { type, name, internal } = h.entry ? classifySource(h.referrer, h.utm, h.requestUrl) : { type: 'direct', name: '', internal: true }
  const { device, browser } = parseUserAgent(h.ua)
  // Kosovo is counted as Serbia (official position of the Republic of Serbia)
  const country = /^[A-Z]{2}$/.test(h.country) && h.country !== 'XX' && h.country !== 'T1' ? (h.country === 'XK' ? 'RS' : h.country) : ''
  const city = headerText(h.city)
  db()
    .prepare('INSERT INTO pageviews(ts,day,hour,dow,path,visitor,entry,src_type,src_name,country,city,device,browser) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(Math.floor(now / 1000), t.day, t.hour, t.dow, h.path, visitorId(h.ip, h.ua, t.day), h.entry && !internal ? 1 : 0, type, name, country, clean(city, 60), device, browser)
}

// --- reading it back -----------------------------------------------------------------------------------------------

type Row = Record<string, string | number | null>
const all = (sql: string, ...args: (string | number)[]) => db().prepare(sql).all(...args) as Row[]
const one = (sql: string, ...args: (string | number)[]) => (db().prepare(sql).get(...args) ?? {}) as Row
const PEOPLE = 'COUNT(DISTINCT day || visitor)'

const REGION = new Intl.DisplayNames(['sr-Cyrl'], { type: 'region' })
function countryName(code: string) {
  try {
    return REGION.of(code) ?? code
  } catch {
    return code
  }
}

const SERBIAN_PAGES: Record<string, string> = {
  '/': 'Почетна',
  '/knjige/': 'Књиге',
  '/kontakt/': 'Контакт',
  '/usluge/': 'Услуге',
  '/korpa/': 'Корпа',
  '/placanje/': 'Плаћање',
  '/placanje/narudzbina-primljena/': 'Наруџбина примљена',
}

function totals(from: string, to: string) {
  const r = one(`SELECT COUNT(*) AS views, ${PEOPLE} AS visitors, COALESCE(SUM(entry),0) AS visits FROM pageviews WHERE day BETWEEN ? AND ?`, from, to)
  return { views: Number(r.views ?? 0), visitors: Number(r.visitors ?? 0), visits: Number(r.visits ?? 0) }
}

export function ordersBetween(from: string, to: string) {
  // created_at is UTC; compare in shop time, with a day of slack on both sides for the query
  const rows = all(`SELECT created_at, status, total FROM orders WHERE created_at >= ? AND created_at <= ?`, shiftDay(from, -1) + 'T00:00:00Z', shiftDay(to, 1) + 'T23:59:59Z')
  let n = 0
  let revenue = 0
  for (const o of rows) {
    const day = shopTime(Date.parse(String(o.created_at))).day
    if (day < from || day > to || o.status === 'canceled') continue
    n++
    revenue += Number(o.total)
  }
  return { n, revenue }
}

export function overview(range: Range): Stats {
  const to = shopTime(Date.now()).day
  const from = shiftDay(to, -(range - 1))
  const prevTo = shiftDay(from, -1)
  const prevFrom = shiftDay(prevTo, -(range - 1))
  const now = totals(from, to)
  const before = totals(prevFrom, prevTo)
  const ord = ordersBetween(from, to)
  const ordBefore = ordersBetween(prevFrom, prevTo)

  const perDay = new Map(all(`SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY day`, from, to).map((r) => [String(r.day), r]))
  const daily = Array.from({ length: range }, (_, i) => {
    const day = shiftDay(from, i)
    const r = perDay.get(day)
    return { day, views: Number(r?.views ?? 0), visitors: Number(r?.visitors ?? 0) }
  })

  const heat = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
  for (const r of all(`SELECT dow, hour, COUNT(*) AS n FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY dow, hour`, from, to)) heat[Number(r.dow)][Number(r.hour)] = Number(r.n)

  const sources = all(`SELECT src_name AS name, src_type AS type, COUNT(*) AS n FROM pageviews WHERE entry=1 AND day BETWEEN ? AND ? GROUP BY src_type, src_name ORDER BY n DESC`, from, to).map((r) => ({
    name: String(r.name) || SOURCE_TYPES.direct,
    type: String(r.type),
    n: Number(r.n),
  }))
  const sourceTypes = all(`SELECT src_type AS type, COUNT(*) AS n FROM pageviews WHERE entry=1 AND day BETWEEN ? AND ? GROUP BY src_type ORDER BY n DESC`, from, to).map((r) => ({ type: String(r.type), n: Number(r.n) }))

  const countries = all(`SELECT country AS code, ${PEOPLE} AS v FROM pageviews WHERE country != '' AND day BETWEEN ? AND ? GROUP BY country ORDER BY v DESC`, from, to).map((r) => ({ code: String(r.code), name: countryName(String(r.code)), v: Number(r.v) }))
  const unknownCountry = Number(one(`SELECT ${PEOPLE} AS v FROM pageviews WHERE country = '' AND day BETWEEN ? AND ?`, from, to).v ?? 0)

  const cities = all(`SELECT city, country AS code, ${PEOPLE} AS v FROM pageviews WHERE city != '' AND day BETWEEN ? AND ? GROUP BY city, country ORDER BY v DESC LIMIT 20`, from, to).map((r) => ({
    city: String(r.city),
    code: String(r.code),
    v: Number(r.v),
  }))

  const titles = new Map(listBooks().map((b) => [`/knjige/${b.slug}/`, b.title]))
  const pages = all(`SELECT path, COUNT(*) AS views, ${PEOPLE} AS v FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY views DESC LIMIT 10`, from, to).map((r) => ({
    path: String(r.path),
    title: SERBIAN_PAGES[String(r.path)] ?? titles.get(String(r.path)) ?? String(r.path),
    views: Number(r.views),
    v: Number(r.v),
  }))

  const devices = all(`SELECT device AS name, ${PEOPLE} AS n FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY device ORDER BY n DESC`, from, to).map((r) => ({ name: DEVICES[String(r.name)] ?? String(r.name), n: Number(r.n) }))
  const browsers = all(`SELECT browser AS name, ${PEOPLE} AS n FROM pageviews WHERE day BETWEEN ? AND ? GROUP BY browser ORDER BY n DESC`, from, to).map((r) => ({ name: String(r.name), n: Number(r.n) }))

  return {
    range,
    from,
    to,
    live: Number(one('SELECT COUNT(DISTINCT visitor) AS n FROM pageviews WHERE ts >= ?', Math.floor(Date.now() / 1000) - 300).n ?? 0),
    visitors: { now: now.visitors, before: before.visitors },
    visits: { now: now.visits, before: before.visits },
    views: { now: now.views, before: before.views },
    orders: { now: ord.n, before: ordBefore.n, revenue: ord.revenue },
    daily,
    heat,
    sources,
    sourceTypes,
    countries,
    unknownCountry,
    cities,
    pages,
    devices,
    browsers,
    total: Number(one('SELECT COUNT(*) AS n FROM pageviews').n ?? 0),
  }
}

/** Order and collapsed state of the statistics cards, shared by everyone who uses the admin. */
export function getCardLayout(): CardLayout {
  const row = db().prepare("SELECT value FROM settings WHERE key='stats_layout'").get() as { value: string } | undefined
  try {
    return cleanLayout(row ? JSON.parse(row.value) : null)
  } catch {
    return cleanLayout(null)
  }
}

export function saveCardLayout(raw: unknown): CardLayout {
  const layout = cleanLayout(raw)
  db().prepare("INSERT INTO settings(key,value) VALUES('stats_layout', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(layout))
  return layout
}
