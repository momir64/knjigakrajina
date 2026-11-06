# Књига Крајина

Online shop and content site for a small Serbian publisher, [knjigakrajina.com](https://knjigakrajina.com). It replaces
a WordPress/WooCommerce site with a single Node application that is lighter, faster and easier to look after.

Visitors browse the catalogue, fill a cart and place cash-on-delivery orders. The owner manages books, orders, the
home page slider and the price list from a private admin panel. The site text is in Serbian (Cyrillic).

## Stack

- SvelteKit 3 (Svelte 5, TypeScript, SCSS) on Node
- SQLite through the built-in `node:sqlite`, no ORM
- Resend for transactional email
- Only two runtime dependencies: Resend and a hyphenation library

## How it works

**Rendering and SEO.** Public pages are rendered on the server, so the first response already contains the content,
the title and description, a canonical URL, Open Graph tags and JSON-LD (`Organization`, `WebSite` and `Book` with
price). A sitemap and robots file are generated from the database. The cart and checkout live in the browser, since
the cart is kept in local storage, and are excluded from indexing.

**Orders.** The checkout validates input in the browser with the same rules as the server, then sends only book slugs
and quantities. The server looks up the real prices, saves the order and its lines in one transaction and sends two
emails: a confirmation to the customer and a notice to the shop. Mail failures are logged and never fail the order.
The endpoint is the only public write path, so it has a body size cap, field length limits and layered rate limits
(per client, per email address and global).

**Email.** Messages are table-based HTML with inline styles, written with the quirks of Gmail, Outlook and Apple
Mail, each with a plain-text alternative. All customer-supplied text is escaped.

**Admin panel.** The owner manages orders, books, covers, the home page slider, the price list and notification
addresses. It is a separate area of the same app, with no links to it from the public site, no entry in the sitemap
or robots file, and responses that are marked as non-indexable and non-cacheable.

## Security

- **Access control.** A single hook in `hooks.server.ts` guards everything under the admin prefix, including form
  actions and data requests, so a new route cannot be added without protection. Without a valid session, every URL
  there answers like an ordinary 404 page, except the login page.
- **Authentication.** The password is stored as an scrypt hash and compared in constant time. Failed logins are
  throttled per client address. Sessions are random tokens kept server-side, and only their SHA-256 is stored, so a
  leaked database does not contain usable sessions. The cookie is `HttpOnly`, `SameSite=Strict`, `Secure` on https
  and limited to the admin path. Forms also pass SvelteKit's origin check.
- **Uploads.** Client file names are never used for storage. The image type is detected from the file's bytes, only
  raster formats are accepted (no SVG), the name is generated, and existing files are never overwritten. Every path
  is validated against a strict pattern and resolved with `realpath` to make sure it stays inside the intended folder
  (`src/lib/server/storage.ts`). Served files carry `nosniff` and a sandboxing CSP.
- **Injection.** All SQL uses bound parameters. Svelte escapes text output, and the one place where HTML is rendered,
  the book description, goes through an allow-list sanitizer (`src/lib/sanitize.ts`) that restricts tags and link
  schemes.
- **Headers.** A Content-Security-Policy that allows scripts only from the site itself, `X-Frame-Options: DENY`,
  `nosniff`, referrer and permissions policies, and HSTS on https.
- **Dependencies and runtime.** Only two runtime dependencies, with a clean `npm audit`. In production the process
  runs as its own unprivileged user with read-only access to the code and write access to its data and upload
  folders only, under a restricted systemd unit.

## Getting started

Requires Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

The SQLite database is created and filled from `seed/books.json` on first start. Without a Resend key, emails are
printed to the console instead of being sent. `npm run check` runs the type checker.

To enable the admin panel, set `ADMIN_PATH` and `ADMIN_PASSWORD_HASH` in `.env`. The hash is generated with
`npm run admin:password`. If either is missing, the admin panel does not exist. `npm run demo:orders` fills a local
database with sample orders.

## Production

```bash
npm run build
npm start            # node build, reads .env
```

The app runs behind a reverse proxy that terminates TLS. `.env.example` documents the variables for the proxy
setup (`PROTOCOL_HEADER`, `ADDRESS_HEADER`, `HOST`, `BODY_SIZE_LIMIT`).

## Project layout

```
src/routes         pages, the order API, uploads route, sitemap, robots, admin panel
src/lib            shared components, cart store, SEO helpers
src/lib/server     database, auth, mailer, mail templates, storage, rate limiting
src/lib/backoffice admin panel components
src/styles         SCSS
static/            logo, icons, fonts, page images
uploads/           covers and slider art, written at runtime
seed/              initial catalogue
scripts/           admin password helper, demo orders
```
