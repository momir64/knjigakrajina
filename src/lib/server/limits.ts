// Small in-memory guards for the public endpoints (one Node process, so a Map is enough).

/** at most `max` hits per `windowMs` for each key; returns false when the key is over the limit */
export function createLimiter(max: number, windowMs: number, maxKeys = 10_000) {
  const hits = new Map<string, number[]>()
  return (key: string): boolean => {
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs)
    if (recent.length >= max) {
      hits.set(key, recent)
      return false
    }
    hits.set(key, [...recent, now])
    if (hits.size > maxKeys) for (const [k, v] of hits) if (v.every((t) => t <= now - windowMs)) hits.delete(k)
    if (hits.size > maxKeys) hits.clear() // bounded memory under a flood
    return true
  }
}

/** Reads a JSON body of at most `maxBytes` (the server-wide body limit is large because of cover uploads). */
export async function readJsonLimited(request: Request, maxBytes: number): Promise<unknown | undefined> {
  const declared = Number(request.headers.get('content-length'))
  if (declared > maxBytes || !request.body) return undefined
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return undefined
    }
    chunks.push(value)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return undefined
  }
}
