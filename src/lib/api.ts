import type { OrderPayload, OrderResult } from './types'

export async function placeOrder(payload: OrderPayload): Promise<{ ok: boolean; data: OrderResult }> {
  const r = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data: OrderResult = await r.json().catch(() => ({}))
  return { ok: r.ok, data }
}

// 1000 -> "1.000,00 РСД"
export function money(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' РСД'
}
