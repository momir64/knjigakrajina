// Serbian Cyrillic -> Latin, letter for letter. Used only for search metadata (meta descriptions, structured data),
// so people who search in Latin letters can find the Cyrillic pages. Nothing visitors read is converted.

const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z', и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm',
  н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š',
}

const isCyr = (c: string | undefined) => !!c && c.toLowerCase() in MAP
const isUpper = (c: string | undefined) => !!c && c !== c.toLowerCase()

export function toLatin(text: string): string {
  const chars = [...text]
  let out = ''
  chars.forEach((c, i) => {
    const lower = c.toLowerCase()
    const latin = MAP[lower]
    if (!latin) return void (out += c)
    if (!isUpper(c)) return void (out += latin)
    // "Љ" in "ЉУБАВ" becomes "LJ", but in "Љубав" it becomes "Lj"
    const shout = latin.length > 1 && (isUpper(chars[i + 1]) && isCyr(chars[i + 1]) || isUpper(chars[i - 1]) && isCyr(chars[i - 1]))
    out += shout ? latin.toUpperCase() : latin[0].toUpperCase() + latin.slice(1)
  })
  return out
}

/** a title for search metadata: Latin, and "Bećarac srba…" instead of shouting when the source is ALL CAPS */
export function latinTitle(text: string): string {
  const latin = toLatin(text)
  return latin === latin.toUpperCase() ? latin.charAt(0) + latin.slice(1).toLowerCase() : latin
}
