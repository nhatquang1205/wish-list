# Nina's Little Wish List

A small private wish list. Nina adds a thing, pastes the store link, gives it
hearts. The admin decides what happens to it.

Next.js (App Router) · Tailwind v4 · Postgres.

---

## Two codes, two sides

| Code | Role | Lands on | Can do |
|---|---|---|---|
| `011101` | Nina | `/` | Add, edit and remove wishes. Every new wish is **Wishing**; she cannot change a status. |
| `220826` | Admin | `/admin` | Move any wish between the four statuses. Cannot add or edit. |

Statuses: **Wishing** → **Approved** / **Rejected** → **Done**.

Both codes live in env vars (`NINA_CODE`, `ADMIN_CODE`), so they can be changed
without touching code. The signed cookie carries the role, and both the
middleware and every route handler re-check it — the status endpoint
(`PUT /api/wishes/:id/status`) is the only way a status ever changes, and it
refuses anything but an admin cookie.

## Running it locally

```bash
npm install
npm run dev
```

With no `DATABASE_URL` set, the app runs on an in-memory store: everything works,
but wishes vanish when the dev server restarts. A banner on the page says so.

Copy `.env.example` to `.env.local` and fill it in:

```
DATABASE_URL=postgresql://user:password@host:5432/wishlist?sslmode=require
NINA_CODE=011101
ADMIN_CODE=220826
AUTH_SECRET=$(openssl rand -hex 32)
```

Any Postgres works — Neon, Supabase, Railway, RDS or one running locally. Hosted
ones need `?sslmode=require` on the URL; a local one usually needs nothing.

Then create the table once:

```bash
npm run db:init
```

It is safe to re-run: every statement is `if not exists`, and the tail of
`db/schema.sql` migrates a database that still has the old `bought` / `gifted`
statuses over to `done`.

## Going live

1. **Have the database reachable** from wherever you deploy, with SSL allowed.
2. **Set the env vars** on the host (Production *and* Preview): `DATABASE_URL`,
   `NINA_CODE`, `ADMIN_CODE`, `AUTH_SECRET`, optionally `WISHLIST_TITLE`.
3. **Run the schema once** — `npm run db:init` with those vars in the shell.
4. **Deploy.** `pg` opens a TCP socket, so the route handlers must stay on the
   Node runtime. Only `middleware.ts` runs on the edge, and it touches nothing
   but Web Crypto.

`AUTH_SECRET` signs the login cookie. Changing it logs everyone out; that is the
quickest way to revoke access if a code ever gets shared by accident.

## How it is put together

| Path | What it does |
|---|---|
| `middleware.ts` | Gates every route, and sends each role to its own home |
| `lib/auth.ts` | Codes → roles; signs and verifies the role cookie (Web Crypto, Edge-safe) |
| `lib/session.ts` | The current role, for server components and route handlers |
| `lib/db.ts` | Postgres store (pooled `pg`), with the in-memory dev fallback |
| `lib/types.ts` | The `Wish` shape and the zod validation used by form *and* API |
| `app/page.tsx` | Nina's board |
| `app/admin/page.tsx` | The admin board — status pickers instead of edit buttons |
| `app/api/wishes/…` | GET / POST / PATCH / DELETE, plus `…/status` (admin only) |
| `components/WishBoard.tsx` | Client state, filters, sorting, optimistic updates |
| `db/schema.sql` | The single `wishes` table, plus the status migration |

Tags live in a `text[]` column — at most eight short strings per wish, so a join
table would cost more than it is worth.

## Photos

Nina picks a photo in the form and it uploads straight away to a Backblaze B2
bucket through B2's S3-compatible API ([lib/storage.ts](lib/storage.ts)).

**Only the object key is stored** on the wish — `wishes/<uuid>.<ext>`, which is
unguessable and cacheable forever. The URL the browser loads is rebuilt on every
read as `https://<B2_BUCKET>.<B2_ENDPOINT host>/<key>`, so moving bucket, region
or CDN is a config change with no data migration. `Wish.imagePath` is the stored
key and `Wish.imageUrl` is the derived URL; the form submits the former and the
card renders the latter.

Setup: create a **public** bucket, then an application key scoped to just that
bucket, and set `B2_BUCKET`, `B2_ENDPOINT`, `B2_KEY_ID`, `B2_APP_KEY`. With
those unset the picker simply reports that storage isn't configured — nothing
else breaks.

The upload route ([app/api/upload/route.ts](app/api/upload/route.ts)) is Nina-only
and rejects anything that isn't a JPEG/PNG/WebP/GIF/AVIF/HEIC under 8MB. The
file passes through the server rather than going direct from the browser, which
avoids needing CORS rules on the bucket. A broken or missing image falls back to
a rose-gold letter tile on the card.

Deleting a wish does **not** delete its object from B2 yet — orphans accumulate
if Nina replaces photos often.

## Changing the theme

Every colour is a token in `app/globals.css` under `@theme`.
`app/themes.css` holds three more palettes — Strawberry Milk, Sakura Dream and
Hot Pink Pop — as commented blocks. Paste one over the colour tokens in
`globals.css` and the whole site changes. No component knows about colours.
