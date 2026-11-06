// Labels and types shared by the back office pages and their loaders.

export const ORDER_STATUSES = {
  new: 'Нова',
  shipped: 'Послата / Спремна за преузимање',
  done: 'Завршена',
  canceled: 'Отказана',
} as const

export type OrderStatus = keyof typeof ORDER_STATUSES

export const isOrderStatus = (s: string): s is OrderStatus => Object.hasOwn(ORDER_STATUSES, s)

export const SHIPPING_LABELS: Record<string, string> = {
  pickup: 'Лично преузимање',
  post: 'Пост експрес',
}

// choices in the book editor
export const BINDINGS = ['Тврд', 'Меки']
export const SCRIPTS = ['Ћирилица', 'Латиница', 'Ћирилица и латиница']

export interface AdminBook {
  id: string
  slug: string
  title: string
  author: string
  price: number
  description: string
  image: string
  weight: string
  length: string
  width: string
  height: string
  pages: string
  binding: string
  script: string
  year: string
  isbn: string
  sort: number
  active: number
}

export interface OrderSummary {
  id: string
  created: string
  status: OrderStatus
  name: string
  city: string
  qty: number
  total: number
}
