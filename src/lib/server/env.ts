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

export const config = {
  /** public origin, for canonical links, sitemap and JSON-LD (falls back to the request origin) */
  siteUrl: (env.SITE_URL ?? '').replace(/\/$/, ''),
  /** secret path prefix of the hidden back office, e.g. "/x7k2-office" */
  adminPath: (env.ADMIN_PATH ?? '').replace(/\/+$/, ''),
  dbPath: resolve(env.DB_PATH ?? 'data/knjigakrajina.db'),
  uploadsDir: resolve(env.UPLOADS_DIR ?? 'uploads'),
  seedFile: resolve('seed/books.json'),
  resendKey: env.RESEND_API_KEY ?? '',
  mailFrom: env.MAIL_FROM ?? 'onboarding@resend.dev',
  /** only used to seed the notification list; the admin page will manage it later */
  defaultNotify: split(env.DEFAULT_NOTIFY_EMAILS),
}
