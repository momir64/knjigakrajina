import type { PageServerLoad } from './$types'
import { listOrders, ORDERS_PER_PAGE } from '#lib/server/admin'

export const load: PageServerLoad = ({ url }) => {
  const page = Math.max(1, Math.min(Math.trunc(Number(url.searchParams.get('page'))) || 1, 100_000))
  const status = url.searchParams.get('status') ?? ''
  const { orders, total } = listOrders(page, status)
  return { orders, total, page, status, pages: Math.max(1, Math.ceil(total / ORDERS_PER_PAGE)) }
}
