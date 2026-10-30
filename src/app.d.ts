declare module 'hyphen/sr-cyrl' {
  const patterns: { hyphenateHTMLSync(html: string, options?: { hyphenChar?: string; minWordLength?: number }): string }
  export default patterns
}

declare namespace App {
  interface Locals {
    /** true when the request carries a valid back office session (only ever set under ADMIN_PATH) */
    admin: boolean
  }
}
