# Watches Catalogue

## Why this module exists

Every trade starts with a **listed watch**. Sellers need to publish inventory; buyers need a **public catalogue** to browse before initiating a purchase. This module is the entry point of the AllChrono vertical slice.

| Endpoint | Access | Purpose |
|----------|--------|---------|
| `POST /watches` | Seller (JWT) | Create a new listing |
| `GET /watches` | Public | Paginated catalogue with optional `status` filter |
| `GET /watches/:id` | Public | Single watch detail |

Passport linking: each new listing creates a row in `passports` and sets `watches.passport_id`. See [passport/core.md](../passport/core.md).

## Verification checklist

- [ ] Run migrations: `npm run migration:run`
- [ ] (Optional) Seed 100 demo watches: `npm run seed:watches`
- [ ] Start app: `npm run start:dev`
- [ ] **Public catalogue** — `GET /watches?page=1&limit=10` returns paginated data without a token
- [ ] **Filter by status** — `GET /watches?status=LISTED` returns only listed watches
- [ ] **Watch detail** — `GET /watches/:id` returns one watch (use an `id` from the catalogue response)
- [ ] **Create listing** — login as seller, `POST /watches` with Bearer token returns `201`/watch object
- [ ] **Role guard** — buyer token on `POST /watches` returns `403 Forbidden`
- [ ] **No token on create** — `POST /watches` without auth returns `401 Unauthorized`

## Pagination

Query params:

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `page` | `1` | — | Page number (1-based) |
| `limit` | `20` | `100` | Items per page |
| `status` | — | — | Optional: `LISTED`, `UNLISTED`, `SOLD` |

Response shape:

```json
{
  "data": [ /* watch objects */ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Seed 100 luxury watches (development)

Populates the catalogue with 100 seeded listings for `seller@demo.com` (brands: Rolex, Patek Philippe, AP, Omega, etc.).

```bash
npm run seed:watches
```

Idempotent — skips if 100 seeded watches (`LUX-SEED-*` reference numbers) already exist.

Requires migrations and demo users to be applied first:

```bash
docker compose up -d
npm run migration:run
npm run seed:watches
```
