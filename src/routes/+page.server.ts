import hyphen from 'hyphen/sr-cyrl'
import type { PageServerLoad } from './$types'
import { listBooks } from '#lib/server/db'
import type { Slide } from '#lib/types'
import { sliderImage } from '#lib/media'

// soft hyphens by Serbian (Cyrillic) hyphenation patterns; the browser only uses them when a line needs breaking
const hyph = (html: string) => hyphen.hyphenateHTMLSync(html, { hyphenChar: '\u00AD', minWordLength: 6 })

// Order, artwork and image widths as on the live site
// (the slider uses its own short blurbs, not the full product descriptions)
const featured: [slug: string, file: string, [k: number, yA: number, yB: number, ah?: number], html: string][] = [
  ['becarac-srba-u-zapadnoj-slavoniji', 'slide-becarac.webp', [1, 16, 16, 55],
    'Књига "Бећарац Срба у западној Славонији" има за циљ да широј јавности приближи нематеријалну културну баштину Срба у западној Славонији, јер и данас када се на слављима окупе Славонци, често и радо запјевају бећарац. Велики број расељених присјећа се тако некадашњих времена и завичаја. У томе им се радо придруже и сународници исте судбине, јер су сличне пјесме пјеване широм некадашњих крајишких простора. Бећарац је врста кратке традиционалне лирске народне пјесме коју чине два везана десетерца.'],
  ['djavo-na-papuku', 'slide-djavo.png', [1, 0, 0, 55],
    'Човек је дужан завичају!<br>Физичком, духовном и личном; јер то је он, његово биће и душа. И дошла су тако времена када се питамо јесу ли Срби, Славонија, Папук икада и били у истим реченицама и животима. Је ли је то уопште у реалности постојало и да ли је икога више брига? Кажу да тако мора, да време и заборав лече све. Кажу и лажу, јер заборав је ђавоља работа гора и од смрти. Лажу и да се тако једино може напред: у живот и будућност. Јер на крају када човек стигне до те будућности схвати да је све само један круг. Бесконачни плави круг изван кога остају само бајке његовог завичаја и младости!'],
  ['bastina-krajiskih-srba', 'slide-bastina.webp', [0.942, 81, 75, 36],
    'Зборником радова „Баштина крајишких Срба“ кроз историјски оквир широј јавности представљена је и приближена материјална и нематеријална културна баштину крајишких Срба. Сазнања о српској култури на подручју Хрватске од 16. вијека до данас учињена су доступнима, те се лако може препознати и издвојити све што је било вриједно у нашој баштини. Ова књига унаприједиће знања и развити свијест о значају његовања и чувања културне баштине крајишких Срба, али и Срба на свим другим просторима.'],
  ['antologija-krajiskih-balada', 'slide-balade.webp', [0.882, 30, 27, 60],
    'Вријеме и прилике у којима се нашао српски народ крајем 20. вијека, учинили су да и поред великих невоља сваке врсте, урадимо много тога из области културне традиције, посебице фолклора и језика, што нисмо стизали у бољим временима. На том плану значајно мјесто као прегалац заузима пјесник Здравко Крстановић. Он је приређивањем више књига записа народних пјесама са простора Војне крајине, расутих по рукописним и штампаним збиркама из 19. вијека, остварио запажене резултате.'],
  ['antologija-srpske-narodne-poezije', 'slide-poezija.webp', [0.964, 4, 13, 60],
    'Крајем 2020. године из штампе је изашла "Антологија српске лирске народне поезије Крајине", коју је за штампу приредила проф. др Славица Гароња и посветила „25. годишњици егзодуса српског народа из Републике Српске Крајине и Хрватске (1991-1995)“. У врло интересантном уводу је истакнуто: „Надамо се да ће и ова Антологија лирске усмене поезије показати до каквих се висина (семантичких, ритмичких, песничких) винуо српски народ, његов песнички дар и језик, његова чиста есенцијална духовност…“'],
]

// title font-size / line-height, author box height and gap to the description, per book (as on the original)
const typo: Record<string, Pick<Slide, 'ah' | 'ag' | 'tlh' | 'tfs'>> = {
  'becarac-srba-u-zapadnoj-slavoniji': { ah: 55.2, ag: 19, tlh: 1, tfs: 'max(23px, 1.29vw)' },
  'djavo-na-papuku': { ah: 55.2, ag: 19, tlh: 1, tfs: 'max(23px, 1.29vw)' },
  'bastina-krajiskih-srba': { ah: 36, ag: 30, tlh: 1.5, tfs: 'max(23px, 1.29vw)' },
  'antologija-krajiskih-balada': { ah: 60, ag: 15, tlh: 1, tfs: '23px' },
  'antologija-srpske-narodne-poezije': { ah: 60, ag: 15, tlh: 1, tfs: '23px' },
}


export const load: PageServerLoad = () => {
  const books = listBooks()
  const slides: Slide[] = featured.map(([slug, file, [k, yA, yB], html]) => {
    const b = books.find((x) => x.slug === slug)
    if (!b) throw new Error(`featured book missing from the database: ${slug}`)
    return { slug, title: b.title, author: b.author, html: hyph(html), image: sliderImage(file), k, yA, yB, ...typo[slug] }
  })
  return { slides }
}
