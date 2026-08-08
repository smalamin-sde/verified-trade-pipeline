# Trade Domain — State Machine & Invariants

Reference for implementation. State names and transitions match the take-home spec exactly.

## Core entities

| Entity | Role |
|--------|------|
| **Watch** | Listed luxury watch (brand, model, price, photos). Links to one Passport. |
| **Passport** | Append-only history for a watch. Hash-chained ledger entries. |
| **Trade** | One purchase lifecycle: one Watch, one Buyer, one Seller. |
| **AuthenticationReport** | Verifier verdict (PASS / FAIL / INCONCLUSIVE) for a Trade. |
| **LedgerEntry** | One row in the Passport chain (AUTHENTICATED, SERVICED, TRANSFERRED, RE_AUTHENTICATED). |

## Trade state machine

### Happy path

```
DRAFT → PENDING_AUTH → AUTH_PASSED → ESCROW_FUNDED → SHIPPED → DELIVERED → RELEASED
```

### All states and allowed transitions

| State | Meaning | Next states |
|-------|---------|---------------|
| DRAFT | Buyer initiated; not yet submitted for auth | PENDING_AUTH, CANCELLED |
| PENDING_AUTH | Queued for authentication; no funds held | AUTH_PASSED, AUTH_FAILED, CANCELLED |
| AUTH_PASSED | Auth PASS; buyer must fund escrow by deadline | ESCROW_FUNDED, EXPIRED |
| AUTH_FAILED | Auth FAIL or INCONCLUSIVE | *(terminal)* |
| ESCROW_FUNDED | Escrow held; seller must ship by SLA | SHIPPED, REFUNDED_PRE_SHIP |
| SHIPPED | In transit with tracking | DELIVERED, LOST_IN_TRANSIT |
| DELIVERED | Delivered; dispute window open | RELEASED, DISPUTED |
| DISPUTED | Buyer disputed; funds held | RELEASED, REFUNDED_POST_DELIVERY |
| RELEASED | Seller paid; passport transferred | *(terminal)* |
| REFUNDED_PRE_SHIP | Refund before ship | *(terminal)* |
| REFUNDED_POST_DELIVERY | Refund after delivery/dispute | *(terminal)* |
| EXPIRED | Buyer missed escrow deadline | *(terminal)* |
| CANCELLED | Cancelled early | *(terminal)* |
| LOST_IN_TRANSIT | Lost in shipping | *(terminal)* |

## Hard invariants (must never break)

1. **One active trade per watch** — at most one non-terminal Trade per Watch.
2. **Seller payout gate** — funds reach seller only via `ESCROW_FUNDED → RELEASED`.
3. **Passport append-only** — no update/delete/reorder; `prev_hash` = SHA-256 of previous entry's canonical JSON.
4. **Role projections** — buyer sees funded amount + dispute deadline; seller sees net payout + commission + shipment SLA; neither sees payment instruments.
5. **Escrow idempotency** — same `Idempotency-Key` + same body → replay original result; same key + different body → 409.
6. **Commission** — fixed 7% of gross; `netPayout = gross × 0.93`.

## Transition → side effects

| Event | Trade transition | Escrow | Passport entry |
|-------|------------------|--------|----------------|
| Submit for auth | DRAFT → PENDING_AUTH | — | — |
| Auth PASS | PENDING_AUTH → AUTH_PASSED | — | AUTHENTICATED |
| Auth FAIL / INCONCLUSIVE | PENDING_AUTH → AUTH_FAILED | — | RE_AUTHENTICATED |
| Fund escrow | AUTH_PASSED → ESCROW_FUNDED | Hold gross | — |
| Mark shipped | ESCROW_FUNDED → SHIPPED | — | — |
| Mark delivered | SHIPPED → DELIVERED | — | — |
| Release | DELIVERED → RELEASED (or DISPUTED → RELEASED) | Credit seller net | TRANSFERRED |
| Dispute | DELIVERED → DISPUTED | — | — |
| Refund pre-ship | ESCROW_FUNDED → REFUNDED_PRE_SHIP | Refund buyer | — |
| Refund post-delivery | DISPUTED → REFUNDED_POST_DELIVERY | Refund buyer | — |

## API → transition map (backend)

| Endpoint | Actor | From state(s) |
|----------|-------|---------------|
| `POST /trades` | Buyer | — (creates DRAFT) |
| `POST /trades/:id/submit-for-auth` | Seller | DRAFT |
| `POST /trades/:id/authentication-verdict` | Authenticator | PENDING_AUTH |
| `POST /trades/:id/fund-escrow` | Buyer | AUTH_PASSED |
| `POST /trades/:id/mark-shipped` | Seller | ESCROW_FUNDED |
| `POST /trades/:id/mark-delivered` | Webhook stub | SHIPPED |
| `POST /trades/:id/release` | Buyer | DELIVERED, DISPUTED |
| `POST /trades/:id/dispute` | Buyer | DELIVERED |
| `GET /trades/:id` | Buyer or Seller | any (role projection) |
| `GET /passport/by-serial/:serial` | Public | — |

## Stubbed integrations (simulated in code)

- Payment / escrow provider → internal ledger tables
- KYC → status field on User
- Shipping partner → `mark-delivered` webhook stub
- Blockchain → Postgres hash chain in Passport module
