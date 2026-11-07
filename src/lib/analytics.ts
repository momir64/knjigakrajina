// Labels and types shared by the statistics page and its loader.

export const RANGES = [7, 30, 90, 365] as const
export type Range = (typeof RANGES)[number]
export const RANGE_LABELS: Record<Range, string> = { 7: '7 дана', 30: '30 дана', 90: '90 дана', 365: '12 месеци' }

export const SOURCE_TYPES: Record<string, string> = {
  direct: 'Директно',
  search: 'Претраживачи',
  social: 'Друштвене мреже',
  email: 'Имејл',
  referral: 'Други сајтови',
  campaign: 'Кампање',
}

export const DEVICES: Record<string, string> = { desktop: 'Рачунар', mobile: 'Телефон', tablet: 'Таблет' }

// the cards of the statistics page that can be collapsed and reordered, in their default order
export const CARD_IDS = ['history', 'map', 'countries', 'cities', 'sourceTypes', 'sources', 'pages', 'heat', 'devices', 'browsers'] as const
export interface CardLayout {
  order: string[]
  collapsed: string[]
}

/** Keeps only known ids, drops duplicates and appends any card the saved order does not mention. */
export function cleanLayout(raw: unknown): CardLayout {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<CardLayout>
  const known = (v: unknown) => (Array.isArray(v) ? v : []).filter((x, i, all): x is string => typeof x === 'string' && (CARD_IDS as readonly string[]).includes(x) && all.indexOf(x) === i)
  const order = known(r.order)
  return { order: [...order, ...CARD_IDS.filter((id) => !order.includes(id))], collapsed: known(r.collapsed) }
}

export interface Pair {
  now: number
  before: number
}

export interface Stats {
  range: Range
  from: string
  to: string
  live: number
  visitors: Pair
  visits: Pair
  views: Pair
  orders: Pair & { revenue: number }
  daily: { day: string; views: number; visitors: number }[]
  heat: number[][] // [weekday 0 = Monday][hour]
  sources: { name: string; type: string; n: number }[]
  sourceTypes: { type: string; n: number }[]
  countries: { code: string; name: string; v: number }[]
  unknownCountry: number
  cities: { city: string; code: string; v: number }[]
  pages: { path: string; title: string; views: number; v: number }[]
  devices: { name: string; n: number }[]
  browsers: { name: string; n: number }[]
  total: number // page views ever recorded
}
