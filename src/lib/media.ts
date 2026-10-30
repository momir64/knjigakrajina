// Editable content (book covers, slider art) lives in uploads/<kind>/ and is served from /uploads/<kind>/<file>.
// Fixed site images (logo, icon, contact illustration, fonts) are in static/ and are served as they are.
export const MEDIA_KINDS = ['books', 'slider'] as const
export type MediaKind = (typeof MEDIA_KINDS)[number]

export const mediaUrl = (kind: MediaKind, file: string) => `/uploads/${kind}/${encodeURIComponent(file)}`

export const bookImage = (file: string) => mediaUrl('books', file)
export const sliderImage = (file: string) => mediaUrl('slider', file)
