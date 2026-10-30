// Home page slider: what is stored (settings key "slider") and the slides the site shipped with.
// The look of a slide (image size, title / author typography) is part of the data so the original slides keep
// exactly their tuned layout; the back office only edits the book, the artwork, the text and the image size.

export interface SlideConfig {
  id: string
  /** book the slide links to (books.slug); the slide drops out while that book is hidden or deleted */
  slug: string
  /** file name inside uploads/slider/ */
  image: string
  /** short blurb, a few tags allowed (see sanitizeHtml) */
  html: string
  active: boolean
  /** image width factor, 1 = the standard width */
  k: number
  /** author line: box height (px) and gap to the description (px); title line-height and font-size */
  ah: number
  ag: number
  tlh: number
  tfs: string
}

export const MAX_SLIDES = 12
export const MAX_BLURB = 3000
export const SLIDE_ID = /^[A-Za-z0-9-]{1,40}$/

/** typography of a slide added in the back office (the one most of the original slides use) */
export const NEW_SLIDE_LOOK = { ah: 55.2, ag: 19, tlh: 1, tfs: 'max(23px, 1.29vw)' } as const

// Order, artwork and image widths as on the live site
// (the slider uses its own short blurbs, not the full product descriptions)
export const DEFAULT_SLIDES: SlideConfig[] = [
  {
    id: 'becarac',
    slug: 'becarac-srba-u-zapadnoj-slavoniji',
    image: 'slide-becarac.webp',
    active: true,
    k: 1,
    ah: 55.2,
    ag: 19,
    tlh: 1,
    tfs: 'max(23px, 1.29vw)',
    html: 'Књига "Бећарац Срба у западној Славонији" има за циљ да широј јавности приближи нематеријалну културну баштину Срба у западној Славонији, јер и данас када се на слављима окупе Славонци, често и радо запјевају бећарац. Велики број расељених присјећа се тако некадашњих времена и завичаја. У томе им се радо придруже и сународници исте судбине, јер су сличне пјесме пјеване широм некадашњих крајишких простора. Бећарац је врста кратке традиционалне лирске народне пјесме коју чине два везана десетерца.',
  },
  {
    id: 'djavo',
    slug: 'djavo-na-papuku',
    image: 'slide-djavo.png',
    active: true,
    k: 1,
    ah: 55.2,
    ag: 19,
    tlh: 1,
    tfs: 'max(23px, 1.29vw)',
    html: 'Човек је дужан завичају!<br>Физичком, духовном и личном; јер то је он, његово биће и душа. И дошла су тако времена када се питамо јесу ли Срби, Славонија, Папук икада и били у истим реченицама и животима. Је ли је то уопште у реалности постојало и да ли је икога више брига? Кажу да тако мора, да време и заборав лече све. Кажу и лажу, јер заборав је ђавоља работа гора и од смрти. Лажу и да се тако једино може напред: у живот и будућност. Јер на крају када човек стигне до те будућности схвати да је све само један круг. Бесконачни плави круг изван кога остају само бајке његовог завичаја и младости!',
  },
  {
    id: 'bastina',
    slug: 'bastina-krajiskih-srba',
    image: 'slide-bastina.webp',
    active: true,
    k: 0.942,
    ah: 36,
    ag: 30,
    tlh: 1.5,
    tfs: 'max(23px, 1.29vw)',
    html: 'Зборником радова „Баштина крајишких Срба“ кроз историјски оквир широј јавности представљена је и приближена материјална и нематеријална културна баштину крајишких Срба. Сазнања о српској култури на подручју Хрватске од 16. вијека до данас учињена су доступнима, те се лако може препознати и издвојити све што је било вриједно у нашој баштини. Ова књига унаприједиће знања и развити свијест о значају његовања и чувања културне баштине крајишких Срба, али и Срба на свим другим просторима.',
  },
  {
    id: 'balade',
    slug: 'antologija-krajiskih-balada',
    image: 'slide-balade.webp',
    active: true,
    k: 0.882,
    ah: 60,
    ag: 15,
    tlh: 1,
    tfs: '23px',
    html: 'Вријеме и прилике у којима се нашао српски народ крајем 20. вијека, учинили су да и поред великих невоља сваке врсте, урадимо много тога из области културне традиције, посебице фолклора и језика, што нисмо стизали у бољим временима. На том плану значајно мјесто као прегалац заузима пјесник Здравко Крстановић. Он је приређивањем више књига записа народних пјесама са простора Војне крајине, расутих по рукописним и штампаним збиркама из 19. вијека, остварио запажене резултате.',
  },
  {
    id: 'poezija',
    slug: 'antologija-srpske-narodne-poezije',
    image: 'slide-poezija.webp',
    active: true,
    k: 0.964,
    ah: 60,
    ag: 15,
    tlh: 1,
    tfs: '23px',
    html: 'Крајем 2020. године из штампе је изашла "Антологија српске лирске народне поезије Крајине", коју је за штампу приредила проф. др Славица Гароња и посветила „25. годишњици егзодуса српског народа из Републике Српске Крајине и Хрватске (1991-1995)“. У врло интересантном уводу је истакнуто: „Надамо се да ће и ова Антологија лирске усмене поезије показати до каквих се висина (семантичких, ритмичких, песничких) винуо српски народ, његов песнички дар и језик, његова чиста есенцијална духовност…“',
  },
]
