# Књига Крајина

Rewrite of knjigakrajina.com as a single Node app: SvelteKit 3 (Svelte 5, SCSS, TypeScript, server-side rendered) +
SQLite (`node:sqlite`) + Resend.

## Run

```bash
npm install
cp .env.example .env        # add RESEND_API_KEY to send real emails
npm run dev                 # http://localhost:5173
```

Production (needs Node 24+):

```bash
npm run build
npm start                   # node build, port 3000 (PORT=…), reads .env
```

The SQLite DB (`data/`) is created and seeded from `seed/books.json` on first start. Without `RESEND_API_KEY` order
emails are only logged to the console. `npm run check` type-checks everything (svelte-check).

## Deploying

`npm start` is a plain Node server (`adapter-node`, needs Node 24+; run `npm run build` first).

### Behind a Cloudflare Tunnel (cloudflared)

The tunnel connects out to Cloudflare, so the server needs no open port. In `.env` on the server:

```
SITE_URL=https://knjigakrajina.com
HOST=127.0.0.1
PORT=3000
PROTOCOL_HEADER=x-forwarded-proto
ADDRESS_HEADER=cf-connecting-ip
BODY_SIZE_LIMIT=25M
```

and in the cloudflared `config.yml` point the hostnames at it:

```yaml
tunnel: <tunnel id>
credentials-file: <path to the credentials json>
ingress:
  - hostname: knjigakrajina.com
    service: http://127.0.0.1:3000
  - hostname: www.knjigakrajina.com
    service: http://127.0.0.1:3000
  - service: http_status:404
```

Why these values:

- `HOST=127.0.0.1` - only the tunnel (on the same machine) can reach the app. This matters for security: the
  `cf-connecting-ip` header is only trustworthy when requests cannot bypass Cloudflare, otherwise anyone could fake it
  and dodge the login lock and the order limits.
- `PROTOCOL_HEADER=x-forwarded-proto` - Cloudflare terminates https and tells the app; without it SvelteKit rejects form
  posts ("Cross-site POST form submissions are forbidden") and the admin cookie loses its `Secure` flag.
- `ADDRESS_HEADER=cf-connecting-ip` - the real visitor address, used by the back office login lock and the order limits.
  `HOST_HEADER` is not needed, cloudflared passes the original `Host` on.
- `BODY_SIZE_LIMIT=25M` - cover uploads are up to 20 MB, the default limit is 512K (Cloudflare's own request limit is
  100 MB on the free plan, so uploads fit).

Behind another reverse proxy use `PROTOCOL_HEADER=x-forwarded-proto`, `HOST_HEADER=x-forwarded-host` and
`ADDRESS_HEADER=x-forwarded-for` instead. With no proxy at all, set none of them.

## Back office

Hidden admin for orders, books and notification e-mails. It exists only when both variables are set:

```bash
npm run admin:password      # asks for a password (min. 12 chars), prints the ADMIN_PASSWORD_HASH line for .env
# .env: ADMIN_PATH=/office-7f3k9x2m4q   (any single segment; a long random one is safest)
```

It is then at `https://<site>/<ADMIN_PATH>/`. Pages: orders (filter by status, details, change status, delete), books
(edit everything incl. cover, add, hide, delete), the price list of the services page (texts and amounts, add or remove
columns and rows, notes), notification addresses (with a test message).

How it stays hidden and safe:

- No link anywhere, not in `sitemap.xml`, not in `robots.txt`; the secret is never in client code. Any other first
  segment (and every URL when the admin is not configured) answers with the normal 404.
- Responses under the prefix carry `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: no-store`.
- Login: scrypt-hashed password, 5 failed attempts per 15 minutes per address, then locked. Sessions live in the
  database (only a SHA-256 of the token), the cookie is `HttpOnly`, `SameSite=Strict`, `Secure` on https and limited to
  the secret path, 7 days. One gate in `hooks.server.ts` covers pages, form actions and data requests.
- Forms are protected against cross-site posts by SvelteKit's origin check (production) plus the strict cookie.
- Covers go only through `saveUpload()` / `deleteUpload()` (see below); the book form never accepts a file name.
  Descriptions are HTML written by the admin and rendered as-is on the book page.
- Order data is shown as text only (escaped). A forgotten password: generate a new hash and restart.

## Layout

```
src/routes      pages, POST /api/orders, /uploads/<kind>/<file>, sitemap.xml, robots.txt,
                [admin=admin]/ the back office (matches any long random-looking first segment, then the server
                               checks it against ADMIN_PATH)
src/lib         components (Header, Footer, Slider, Notice, Seo), cart store, types, media URL helpers
src/lib/server  db.ts (schema, orders), admin.ts (back office queries), auth.ts (password, sessions, throttle),
                book-form.ts (book form validation), mailer.ts (Resend), storage.ts (safe file access), env.ts
src/lib/backoffice  back office components
scripts/        admin-password.mjs
src/styles      SCSS (admin.scss is only loaded by the back office)
static/         fixed site assets, part of the code: logo, icon, fonts, images/ (contact + services illustrations)
uploads/        editable content, NOT part of the build, written at runtime by the admin:
  books/          book covers            (books.image = file name in here)
  slider/         home page slider art
seed/           books.json, used once to fill an empty database
data/           SQLite database (git-ignored)
```

## Files and path traversal

Every disk path for uploaded content is built in `src/lib/server/storage.ts`, for reading and for writing:

- the folder must be one of `books | slider`, the file name must match a strict pattern (no separators, no
  `..`, no drive letters or NTFS streams, image extensions only);
- the resolved real path (`realpath`, so symlinks too) must stay inside that folder;
- uploads keep nothing from the client but a slug of the original name: the type is detected from the file's bytes
  (WebP, PNG, JPEG, GIF, AVIF; no SVG), the name gets a random suffix, size is capped (20 MB) and existing files are
  never overwritten;
- `/uploads/*` only serves images and sets `X-Content-Type-Options: nosniff`.

The back office stores files only through `saveUpload()` / `deleteUpload()`, never with its own paths.

## Security notes

- All SQL uses bound parameters (the only interpolated parts are fixed column lists written in code).
- Svelte escapes all text; the only `{@html}` is the book description, and it goes through `sanitizeHtml()`
  (`src/lib/sanitize.ts`: tag allow-list, safe links only) both when saved and when rendered.
- Content-Security-Policy (scripts only from the site itself), `X-Frame-Options: DENY`, `nosniff`, referrer and
  permissions policies on every response, HSTS on https; `/uploads/*` additionally sandboxed.
- `POST /api/orders` sends mail to an address the visitor typed, so it has a 64 KB body cap, field length limits and
  rate limits (per client, per e-mail address, overall). Behind a proxy set `ADDRESS_HEADER` or all visitors share one
  client address (see Deploying).

## SEO / privacy

- Every public page is rendered on the server with its own title, description, canonical URL, Open Graph tags and
  JSON-LD (Organization/WebSite everywhere, Product/Book with price on book pages). `sitemap.xml` lists books.
- Cart, checkout and order pages are client-only, `noindex` and sent with `X-Robots-Tag`.
- The back office (see above) is never linked, not in the sitemap, not named in `robots.txt` (that would reveal it),
  and always `noindex` + `no-store`.
