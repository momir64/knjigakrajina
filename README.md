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
npm start                   # node build, port 3000 (PORT=…); behind a proxy also set ORIGIN=https://knjigakrajina.com
```

The SQLite DB (`data/`) is created and seeded from `seed/books.json` on first start. Without `RESEND_API_KEY` order
emails are only logged to the console. `npm run check` type-checks everything (svelte-check).

## Layout

```
src/routes      pages, POST /api/orders, /uploads/<kind>/<file>, sitemap.xml, robots.txt
src/lib         components (Header, Footer, Slider, Notice, Seo), cart store, types, media URL helpers
src/lib/server  db.ts (schema, queries, orders), mailer.ts (Resend), storage.ts (safe file access), env.ts
src/styles      SCSS
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
  (WebP, PNG, JPEG, GIF, AVIF; no SVG), the name gets a random suffix, size is capped (8 MB) and existing files are
  never overwritten;
- `/uploads/*` only serves images and sets `X-Content-Type-Options: nosniff`.

The upcoming admin must store files only through `saveUpload()` / `deleteUpload()`, never with its own paths.

## SEO / privacy

- Every public page is rendered on the server with its own title, description, canonical URL, Open Graph tags and
  JSON-LD (Organization/WebSite everywhere, Product/Book with price on book pages). `sitemap.xml` lists books.
- Cart, checkout and order pages are client-only, `noindex` and sent with `X-Robots-Tag`.
- Admin (orders, book editing, notification emails) is not built yet. It will live under the secret path prefix from
  `ADMIN_PATH` (e.g. `/x7k2-office`): never linked, not in the sitemap, not named in `robots.txt` (that would reveal
  it), always `X-Robots-Tag: noindex, nofollow, noarchive` + `Cache-Control: no-store`, and behind a login.
  The schema already supports it (`settings.notify_emails` = who gets order notifications).
