import { resolve } from 'node:path'

// .env is read from the working directory (the project root); real environment variables win.
try {
  process.loadEnvFile()
} catch {
  // no .env file
}

const env = process.env
const split = (v: string | undefined) =>
  (v ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

// One path segment of up to 64 URL-safe characters (must also fit src/params.ts). Anything else disables the back
// office instead of guessing.
const wanted = (env.ADMIN_PATH ?? '').replace(/^\/+|\/+$/g, '')
const shape = /^[A-Za-z0-9_-]{1,64}$/
const adminPath = shape.test(wanted) ? '/' + wanted : ''
if (wanted && !adminPath) console.warn('ADMIN_PATH must be one segment of up to 64 letters, digits, "-" or "_" - back office disabled')

export const config = {
  /** public origin, for canonical links, sitemap and JSON-LD (falls back to the request origin) */
  siteUrl: (env.SITE_URL ?? '').replace(/\/$/, ''),
  /** secret path prefix of the hidden back office, e.g. "/x7k2-office-4f9a" ('' = back office disabled) */
  adminPath,
  /** scrypt hash of the back office password, made by `npm run admin:password` ('' = back office disabled) */
  adminPasswordHash: env.ADMIN_PASSWORD_HASH ?? '',
  dbPath: resolve(env.DB_PATH ?? 'data/knjigakrajina.db'),
  uploadsDir: resolve(env.UPLOADS_DIR ?? 'uploads'),
  seedFile: resolve('seed/books.json'),
  resendKey: env.RESEND_API_KEY ?? '',
  mailFrom: env.MAIL_FROM ?? 'onboarding@resend.dev',
  /** only used to seed the notification list; after that the back office manages it */
  defaultNotify: split(env.DEFAULT_NOTIFY_EMAILS),
}

export const adminEnabled = config.adminPath !== '' && config.adminPasswordHash !== ''

/** true for "/<adminPath>" and everything below it */
export const isAdminPath = (pathname: string) =>
  config.adminPath !== '' && (pathname === config.adminPath || pathname.startsWith(config.adminPath + '/'))
