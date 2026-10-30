// Price list of the services page (editable in the back office; stored as JSON in settings.price_list).
// The back office edits it freely: texts, and how many columns and rows each section has (not the sections).

export interface PriceSection {
  title: string
  /** anchor on the page, e.g. /usluge/#tehnicka_obrada_teksta ('' = none) */
  id: string
  /** label of the first (header) row, e.g. "Број страна" */
  headLabel: string
  head: string[]
  rows: { label: string; values: string[] }[]
  notes: string[]
}

export type PriceList = PriceSection[]

export const MAX_COLUMNS = 10
export const MAX_ROWS = 20

const HEAD = ['1', '1-10', '10-50', '50-100', 'преко 100']

export const DEFAULT_PRICE_LIST: PriceList = [
  {
    title: 'Лектура и коректура',
    id: '',
    headLabel: 'Број лекторских страна',
    head: HEAD,
    rows: [{ label: 'Лектура и коректура', values: ['5', '3', '2,5', '2', '1,5'] }],
    notes: [
      'Једну лекторску страну чини 1800 карактера са проредом.',
      'Цена услуге смањује са са повећањем броја лекторских страна за обраду.',
      'Цене су изражене у еврима, исплата је у динарској противвредности.',
    ],
  },
  {
    title: 'Техничка обрада текста',
    id: 'tehnicka_obrada_teksta',
    headLabel: 'Број страна',
    head: HEAD,
    rows: [
      { label: 'Прелом текста', values: ['2,5', '2,2', '2', '1,5', '1'] },
      { label: 'Прелом текста са сликама', values: ['5', '4', '2,5', '2', '1,8'] },
    ],
    notes: ['Цене се могу кориговати након увида у достављени материјал.', 'Цене су изражене у еврима, исплата је у динарској противвредности.'],
  },
]
