import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { config } from './env'
import { db } from './db'

// Back office login: one shared password (scrypt hash in ADMIN_PASSWORD_HASH), server-side sessions.
//  - the cookie holds a random 256-bit token; only its SHA-256 is stored, so a leaked database is no login;
//  - cookie: HttpOnly, SameSite=Strict, Secure on https, limited to the secret path (public pages never get it);
//  - failed logins are throttled per client address.

export const COOKIE = 'kk_admin'
const SESSION_MS = 7 * 24 * 60 * 60 * 1000

/** ADMIN_PASSWORD_HASH is "scrypt:<salt hex>:<hash hex>", made by scripts/admin-password.mjs (same parameters) */
export function checkPassword(password: string): boolean {
  const [kind, salt, hash] = config.adminPasswordHash.split(':')
  if (kind !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  if (expected.length === 0) return false
  const actual = scryptSync(password, Buffer.from(salt, 'hex'), expected.length, { N: 16384, r: 8, p: 1 })
  return timingSafeEqual(actual, expected)
}

const digest = (token: string) => createHash('sha256').update(token).digest('hex')

export function createSession(): { token: string; maxAge: number } {
  const token = randomBytes(32).toString('base64url')
  const now = Date.now()
  db().prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(now)
  db().prepare('INSERT INTO admin_sessions(token_hash, expires_at) VALUES(?,?)').run(digest(token), now + SESSION_MS)
  return { token, maxAge: SESSION_MS / 1000 }
}

export function isValidSession(token: string | undefined): boolean {
  if (!token || token.length > 100) return false
  const row = db().prepare('SELECT expires_at FROM admin_sessions WHERE token_hash=?').get(digest(token)) as { expires_at: number } | undefined
  return !!row && row.expires_at > Date.now()
}

export function destroySession(token: string | undefined) {
  if (token) db().prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(digest(token))
}

// --- throttling: 5 failures per 15 minutes per address, then locked until the oldest one expires ---
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5
const failures = new Map<string, number[]>()

const recent = (key: string) => {
  const list = (failures.get(key) ?? []).filter((t) => t > Date.now() - WINDOW_MS)
  if (list.length) failures.set(key, list)
  else failures.delete(key)
  return list
}

export const isLocked = (key: string) => recent(key).length >= MAX_FAILURES
export function recordFailure(key: string) {
  failures.set(key, [...recent(key), Date.now()])
  if (failures.size > 10_000) failures.clear() // bounded memory under a flood
}
export const clearFailures = (key: string) => failures.delete(key)
