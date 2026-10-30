import { browser } from '$app/env'
import type { Book, CartItem, ShippingMethod } from './types'

const KEY = 'kk-cart'

function load(): CartItem[] {
  if (!browser) return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? []
  } catch {
    return []
  }
}

const METHOD_KEY = 'kk-ship'
function loadMethod(): ShippingMethod {
  if (!browser) return 'pickup'
  try {
    return localStorage.getItem(METHOD_KEY) === 'post' ? 'post' : 'pickup'
  } catch {
    return 'pickup'
  }
}

export const cart = $state<{ items: CartItem[]; method: ShippingMethod }>({ items: load(), method: loadMethod() })

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart.items))
    localStorage.setItem(METHOD_KEY, cart.method)
  } catch {}
}

export function setMethod(m: ShippingMethod) {
  cart.method = m
  save()
}

export const count = () => cart.items.reduce((n, i) => n + i.qty, 0)
export const subtotal = () => cart.items.reduce((n, i) => n + i.qty * i.price, 0)

export function add(book: Book, qty = 1) {
  const found = cart.items.find((i) => i.slug === book.slug)
  if (found) found.qty += qty
  else cart.items.push({ slug: book.slug, title: book.title, price: book.price, image: book.image, qty })
  save()
}

export function setQty(slug: string, qty: number) {
  const item = cart.items.find((i) => i.slug === slug)
  if (!item) return
  if (qty < 1) return remove(slug)
  item.qty = qty
  save()
}

export function remove(slug: string) {
  cart.items = cart.items.filter((i) => i.slug !== slug)
  save()
}

export function clear() {
  cart.items = []
  save()
}

// "added to cart" bar shown under the header, cleared on navigation
export const notice = $state({ title: '', qty: 0, open: false })

export function showNotice(book: Pick<Book, 'title'>, qty = 1) {
  notice.title = book.title
  notice.qty = qty
  notice.open = true
}

export function hideNotice() {
  notice.open = false
}
