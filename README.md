# AllChrono Verified Trade Pipeline

Backend-only NestJS API for a luxury watch marketplace: list watches, run trades through authentication → escrow → shipment → release, and maintain an append-only **Passport** history per watch.

**Scope:** API and domain logic only — no frontend. Payments, KYC, shipping, and blockchain are **simulated** in code (see [Stubbed integrations](#stubbed-integrations)).

## Quick start

```bash
cp .env.example .env
npm install
docker compose up -d
npm run migration:run
npm run start:dev
curl http://localhost:3000/health
```

Detailed verification steps: [docs/local-development.md](docs/local-development.md).

## Demo users

| Email | Role | Password |
|-------|------|----------|
| `seller@demo.com` | SELLER | `password123` |
| `buyer@demo.com` | BUYER | `password123` |
| `authenticator@demo.com` | AUTHENTICATOR | `password123` |

## API overview

| Method | Route | Role |
|--------|-------|------|
| `POST` | `/auth/login` | Public |
| `POST` | `/watches` | Seller |
| `GET` | `/watches` | Public |
| `GET` | `/watches/:id` | Public |
| `POST` | `/trades` | Buyer |
| `POST` | `/trades/:id/submit-for-auth` | Seller |
| `POST` | `/trades/:id/authentication-verdict` | Authenticator |
| `POST` | `/trades/:id/fund-escrow` | Buyer (+ `Idempotency-Key`) |
| `POST` | `/trades/:id/mark-shipped` | Seller |
| `POST` | `/trades/:id/mark-delivered` | Public (webhook stub) |
| `POST` | `/trades/:id/release` | Buyer |
| `POST` | `/trades/:id/dispute` | Buyer |
| `GET` | `/trades/:id` | Buyer or Seller (participant) |
| `GET` | `/passport/by-serial/:serial` | Public |

Feature docs: [docs/trading/](docs/trading/) · [docs/passport/](docs/passport/) · [docs/domain/state-machine.md](docs/domain/state-machine.md)

## Tests

```bash
npm test              # unit tests (state machine, hash chain, commission, projections)
npm run test:e2e      # e2e scaffold
npm run build
```

## Key design decisions

1. **Single trade transition service** — All state changes go through `TradeTransitionService` / `EscrowService` with explicit guards, not scattered controller logic. Keeps the state machine enforceable and testable.

2. **Postgres hash chain for Passport** — Append-only `ledger_entries` with SHA-256 links and HMAC signatures instead of an external blockchain or event store. Simple to demo, verify-on-read, and sufficient for the take-home invariant.

3. **Escrow idempotency table** — `fund-escrow` requires `Idempotency-Key`; same key replays the stored response so network retries cannot double-charge. Request hash includes `tradeId` to prevent key reuse across trades.

## Stubbed integrations

| Real-world | Simulation |
|------------|--------------|
| Payment / escrow provider | `escrow_holds` table |
| KYC | Not implemented (demo users in migration) |
| Shipping partner webhook | `POST /trades/:id/mark-delivered` is public, no signature check |
| Blockchain | Postgres append-only ledger + hash verification |

## If I had more time

1. **Integration tests** — Full happy-path Supertest flow from DRAFT → RELEASED with idempotency and passport chain assertions.
2. **Auto-expire / auto-release** — Cron or scheduled job for missed escrow deadlines and dispute windows (currently manual endpoints only).
3. **Refund paths** — `REFUNDED_PRE_SHIP` and `REFUNDED_POST_DELIVERY` transitions with escrow reversal (state machine supports them; endpoints not built).

## Architecture docs

- [ADR 001: TypeORM and module boundaries](docs/adr/001-typeorm-and-module-boundaries.md)
- [ADR 002: Trade orchestration and passport ledger](docs/adr/002-trade-orchestration-and-passport-ledger.md)

## Submission

- **Repository:** private GitHub repo
- **Collaborators to add:** `bbbraihan`, `shusmoy108`, `tanmoyAtb`
- **Backend-only** — frontend intentionally out of scope
