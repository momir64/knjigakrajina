import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { MAX_COLUMNS, MAX_ROWS, type PriceList } from '#lib/pricelist'
import { getPriceList, setPriceList } from '#lib/server/admin'

const MAX_CELL = 120
const MAX_NOTE = 400
const MAX_NOTES = 15

export const load: PageServerLoad = () => ({ sections: getPriceList() })

const count = (v: FormDataEntryValue | null, max: number) => Math.min(Math.max(Math.trunc(Number(v)) || 1, 1), max)

// The stored list decides which sections exist (and their anchors); each section sends how many columns and rows
// it now has, within limits, and the cells are read by index.
export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData()
    const text = (name: string) => String(form.get(name) ?? '').trim()
    const current = getPriceList()
    let bad: string | null = null

    const cell = (name: string) => {
      const v = text(name)
      if (!v || v.length > MAX_CELL) bad ??= `Сва поља морају бити попуњена (највише ${MAX_CELL} знакова).`
      return v
    }
    const range = (n: number) => Array.from({ length: n }, (_, i) => i)

    const next: PriceList = current.map((s, i) => {
      const cols = count(form.get(`s${i}_cols`), MAX_COLUMNS)
      const rows = count(form.get(`s${i}_rows`), MAX_ROWS)
      return {
        id: s.id,
        title: cell(`s${i}_title`),
        headLabel: cell(`s${i}_headLabel`),
        head: range(cols).map((j) => cell(`s${i}_head${j}`)),
        rows: range(rows).map((k) => ({
          label: cell(`s${i}_r${k}_label`),
          values: range(cols).map((j) => cell(`s${i}_r${k}_v${j}`)),
        })),
        notes: text(`s${i}_notes`)
          .split(/\r?\n/)
          .map((n) => n.trim())
          .filter(Boolean),
      }
    })
    for (const s of next) {
      if (s.notes.length > MAX_NOTES || s.notes.some((n) => n.length > MAX_NOTE)) bad ??= 'Напомене су предугачке.'
    }

    if (bad) return fail(422, { error: bad, sections: next })
    setPriceList(next)
    return { saved: true }
  },
}
