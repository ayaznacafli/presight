# Presight — People Directory

Full-stack user directory: a **React 19** client, a **Fastify** API, and **SQLite** as
the persisted source of truth. Search by name, narrow by nationality and hobbies,
scroll a virtualised list of 25,000 people, and share the exact view via its URL.

```
client/   React + Vite + TanStack Query/Virtual + Tailwind v4
server/   Fastify + node:sqlite + Zod  (layered modules)
```

---

## Quick start

### Option A — Docker (nothing but Docker required)

```bash
docker compose up --build
```

Open **http://localhost:8080**.

The API applies the schema and seeds 25,000 users into a named volume on first
boot, so the first page load already has data. The API is also exposed directly
on **http://localhost:4000** (OpenAPI docs at **/docs**).

```bash
docker compose down      # stop, keep the seeded database
docker compose down -v   # stop and discard the database volume
```

Override the defaults without editing the compose file:

```bash
SEED_USER_COUNT=100000 WEB_PORT=3000 docker compose up --build
```

### Option B — Local (Node ≥ 22.5)

```bash
npm run install:all   # installs client + server
npm run db:seed       # creates server/data/presight.sqlite and seeds it
npm run dev           # API on :4000, client on :5173
```

Open **http://localhost:5173**. Vite proxies `/api` to the API, so there is no
CORS configuration and no environment-specific base URL in the client.

| Command | What it does |
| --- | --- |
| `npm run install:all` | Install dependencies for both packages |
| `npm run db:seed` | Create + seed the SQLite database (no-op if already seeded) |
| `npm run db:reset` | Wipe and re-seed from scratch |
| `npm run dev` | Run API and client together |
| `npm test` | Server test suite (18 tests) |
| `npm run typecheck` | Type-check both packages |
| `npm run build` | Production build of both packages |

> Node 22.5+ is required for the built-in `node:sqlite` module. There is **no
> native dependency to compile** — no `node-gyp`, no build toolchain in Docker.

---

## Data model

```
users(id, avatar, first_name, last_name, age, nationality)
hobbies(id, name UNIQUE)
user_hobbies(user_id, hobby_id)              -- PK(user_id, hobby_id), WITHOUT ROWID
```

Hobbies are a **separate relation rather than a JSON/CSV column**, because the
two hardest requirements both need an index-backed join:

* *"match users who have **all** selected hobbies"* → `GROUP BY … HAVING COUNT(*) = n`
* *"top 20 hobbies **with counts** for the current result set"* → `GROUP BY hobby`

Every sort index carries `id` as a trailing key (`(first_name, id)`, `(age, id)`, …)
so the deterministic `ORDER BY <col>, id` tie-break is served straight from the index.

The seeder is deterministic (mulberry32 PRNG, fixed seed) and uses **Zipf-weighted**
distributions — without that skew every value lands at ≈1/N and the "top 20" list
is meaningless noise. 25,000 users + ~77,000 hobby links seed in **~200 ms**.

---

## API

Base path `/api/v1`. Interactive docs at `/docs`.

### `GET /users`

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `q` | string | `''` | Matches across `first_name` **and** `last_name` |
| `nationalities` | csv / repeated | `[]` | Matches **ANY** of the selected values |
| `hobbies` | csv / repeated | `[]` | Matches users holding **ALL** selected values |
| `sort` | `first_name \| last_name \| age \| nationality` | `first_name` | |
| `order` | `asc \| desc` | `asc` | |
| `limit` | int 1–100 | `30` | |
| `offset` | int ≥ 0 | `0` | |

```jsonc
{
  "data": [
    { "id": 385, "avatar": "https://…", "first_name": "Aiden", "last_name": "White",
      "age": 34, "nationality": "Hungarian", "hobbies": ["Birdwatching", "Gardening", "Piano"] }
  ],
  "meta": { "limit": 30, "offset": 0, "total": 25000,
            "hasMore": true, "nextOffset": 30, "page": 1, "pageCount": 834 }
}
```

`nextOffset` is `null` at the end of the result set — the client's infinite scroll
uses it directly as the next page cursor.

### `GET /facets`

Same filter params, plus `limit` (default `20`).

```jsonc
{
  "hobbies":       [{ "value": "Photography", "count": 8806 }, …],
  "nationalities": [{ "value": "Azerbaijani", "count": 4418 }, …],
  "total": 25000
}
```

Both facet queries are compiled from the **same `WHERE` clause** as the list
query, so counts always describe the result set currently on screen — never the
global dataset. Selecting *Italian* + *Spanish* returns `225 + 192 = 417`, which
is exactly the list's `meta.total`.

### Behaviour worth knowing

* **Text search** splits on whitespace; every token must match `first_name` *or*
  `last_name`, so `ada lov` finds *Ada Lovelace*. `%` and `_` are escaped as literals.
* **Unknown values** short-circuit: an unknown hobby can be held by nobody, so
  ALL-semantics correctly return an empty page rather than silently ignoring it.
* **Case-insensitive** hobby/nationality resolution, so a hand-edited URL still works.
* **Errors** use one envelope — `{ error: { code, message, details, requestId } }` —
  which is what the client's error state renders.

### Facet semantics — a deliberate trade-off

The brief requires facet counts to reflect *"the currently applied text filter and
selected filters"*. Applied literally (as implemented), a facet includes its **own**
dimension in its counts. For hobbies that is exactly the useful behaviour: after
picking *Chess* the list becomes "what else do chess players do", with real counts.

For nationalities (OR semantics) it means the list collapses to just the selected
values. The API stays spec-literal; the **sidebar** handles it in the UI by pinning
selected values that fall out of the top 20 and offering an inline *Clear* action,
so a filter is never impossible to undo.

---

## Client

| Concern | Approach |
| --- | --- |
| Data fetching | TanStack Query — `useInfiniteQuery` for the list, `useQuery` for facets |
| Virtualisation | TanStack Virtual with **lanes**, giving a 1/2/3-column responsive grid |
| URL state | `useSearchParams` — the URL is the single source of truth |
| Styling | Tailwind v4 with semantic CSS-variable tokens (light + dark) |

**URL-synced state.** `q`, `nationalities`, `hobbies`, `sort` and `order` all live in
the query string, and defaults are omitted so a pristine view has a clean URL.
Reload, deep link and browser back/forward all restore the same screen. Typing
*replaces* the history entry (no back-button spam); discrete choices *push*, so
back undoes a filter the way users expect.

```
/?q=an&nationalities=Italian,Spanish&hobbies=Chess&sort=age&order=desc
```

**Virtualisation.** Roughly 30 card elements exist in the DOM at any moment,
regardless of how many pages have loaded — verified in a real browser: after
scrolling through 250 people, the DOM held 32 cards. The next page is requested
two rows before the viewport edge so scrolling never stalls, and skeleton cards
hold the grid's shape while it lands.

**States.**
* *Loading* — skeleton grid on cold load; an indeterminate bar while re-filtering
  (previous results stay on screen so the layout never collapses mid-typing).
* *Empty* — explains that selected hobbies must **all** match, with a clear action.
* *Error* — distinguishes "cannot reach the server" from an API error, shows the
  error code and HTTP status, and offers retry. 4xx responses are not retried.

**Responsive.** Three-column grid on wide screens, two on tablets, one on phones;
the sidebar becomes a slide-over drawer below `lg` with a badge showing the active
filter count. Avatars fall back to initials if the remote image fails.

---

## Project structure

```
server/src/
  app.ts                     composition root — wiring lives here
  config/env.ts              Zod-validated environment, fails fast at boot
  db/
    schema.sql  migrate.ts   idempotent DDL
    seed.ts     cli/         deterministic seeder + CLI entrypoints
  modules/users/
    users.routes.ts          HTTP surface + OpenAPI
    users.service.ts         pagination metadata, orchestration
    users.repository.ts      all SQL; one shared WHERE builder
    users.dto.ts             Zod request contracts
  plugins/                   database lifetime, error envelope
  shared/errors.ts

client/src/
  app/                       providers, router, query client
  lib/api/                   typed fetch layer, query keys
  components/ui/             Avatar, Chip, Spinner
  features/directory/
    components/              page, sidebar, list, card, states
    hooks/                   URL state, queries, debounce, responsive columns
```

Layered on the server (routes → service → repository) and feature-sliced on the
client, so the interesting logic sits in one obvious place in each.

---

## Tests

```bash
npm test
```

18 tests covering the requirements that are easy to get subtly wrong:

* Walking **every** sort field × direction to the end of the result set with no
  duplicates and no gaps, and `nextOffset === null` exactly at the end.
* `id` tie-break ordering when sort values are equal.
* Hobbies ALL vs nationalities ANY, and the two combined with text.
* LIKE metacharacters treated as literals.
* Facet counts equal the list total for the same filter state, and shrink when a
  text filter is applied.
* Seed invariants: 0–10 hobbies per user, deterministic for a given seed.
