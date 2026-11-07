import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { RANGES, type Range } from '#lib/analytics'
import { getCardLayout, overview, saveCardLayout } from '#lib/server/analytics'

export const load: PageServerLoad = ({ url }) => {
  const asked = Number(url.searchParams.get('range'))
  const range = (RANGES as readonly number[]).includes(asked) ? (asked as Range) : 30
  return { stats: overview(range), layout: getCardLayout() }
}

export const actions: Actions = {
  // called by the page when a card is moved or collapsed
  layout: async ({ request }) => {
    try {
      const raw = JSON.parse(String((await request.formData()).get('layout')))
      return { layout: saveCardLayout(raw) }
    } catch {
      return fail(400)
    }
  },
}
