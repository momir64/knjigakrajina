export interface Book {
  id: string
  slug: string
  title: string
  author: string
  /** RSD, whole dinars */
  price: number
  /** HTML */
  description: string
  /** file name inside uploads/books/ */
  image: string
  weight: string
  length: string
  width: string
  height: string
  pages: string
  binding: string
  script: string
  year: string
}

export type ShippingMethod = 'pickup' | 'post'

export interface CartItem {
  slug: string
  title: string
  price: number
  image: string
  qty: number
}

/** One slide of the home page slider (see routes/+page.server.ts) */
export interface Slide {
  slug: string
  title: string
  author: string
  /** description with soft hyphens */
  html: string
  image: string
  k: number
  yA: number
  yB: number
  /** author box height (px), gap to the description (px), title line-height and font-size */
  ah: number
  ag: number
  tlh: number
  tfs: string
}

export interface Address {
  first_name: string
  last_name: string
  country: string
  address: string
  city: string
  state: string
  postcode: string
  phone: string
}

/** What the checkout form posts to /api/orders */
export interface OrderPayload extends Address {
  email: string
  ship_different?: boolean
  shipping_method: ShippingMethod
  order_comments?: string
  items: { slug: string; qty: number }[]
  [shipField: `ship_${string}`]: unknown
}

export interface OrderResult {
  total?: number
  errors?: Record<string, string>
}
