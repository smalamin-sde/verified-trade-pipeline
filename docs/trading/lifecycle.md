# Trading Lifecycle — Ship, Deliver, Release

## Why this branch exists

After escrow is funded, the trade moves through **shipping → delivery → release** (or dispute). This completes the happy path through seller payout and passport transfer.

## Endpoints

| Method | Route | Actor | From → To |
|--------|-------|-------|-----------|
| `POST` | `/trades/:id/mark-shipped` | SELLER | `ESCROW_FUNDED` → `SHIPPED` |
| `POST` | `/trades/:id/mark-delivered` | Public (webhook stub) | `SHIPPED` → `DELIVERED` |
| `POST` | `/trades/:id/release` | BUYER | `DELIVERED` / `DISPUTED` → `RELEASED` |
| `POST` | `/trades/:id/dispute` | BUYER | `DELIVERED` → `DISPUTED` |

## Side effects

| Event | Escrow | Passport |
|-------|--------|----------|
| Mark shipped | — | — (sets `trackingNumber`) |
| Mark delivered | — | — (opens dispute window) |
| Release | `escrow_holds.status` → `RELEASED` | `TRANSFERRED` entry |
| Dispute | — | — (sets `disputeReason`) |

## Verification checklist

- [ ] Trade in `ESCROW_FUNDED` (fund escrow first)
- [ ] Seller `mark-shipped` with `trackingNumber` → `SHIPPED`
- [ ] Public `mark-delivered` → `DELIVERED`, `disputeWindowEnds` set
- [ ] Buyer `release` → `RELEASED`, escrow released, passport `TRANSFERRED`
- [ ] Alternate: buyer `dispute` inside window → `DISPUTED`

## Happy path (curl)

```bash
# Prerequisites: trade in ESCROW_FUNDED

# 1. Seller ships
SELLER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@demo.com","password":"password123"}' | jq -r .accessToken)

curl -s -X POST "http://localhost:3000/trades/$TRADE_ID/mark-shipped" \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"trackingNumber":"DHL-TRACK-12345"}'

# 2. Shipping webhook (no auth)
curl -s -X POST "http://localhost:3000/trades/$TRADE_ID/mark-delivered"

# 3. Buyer releases payment to seller
BUYER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@demo.com","password":"password123"}' | jq -r .accessToken)

curl -s -X POST "http://localhost:3000/trades/$TRADE_ID/release" \
  -H "Authorization: Bearer $BUYER_TOKEN"
```

## Dispute path

After `mark-delivered`, before `disputeWindowEnds`:

```bash
curl -s -X POST "http://localhost:3000/trades/$TRADE_ID/dispute" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"disputeReason":"Watch condition not as described"}'
```

## DB checks after release

```sql
SELECT state, tracking_number FROM trades WHERE id = 'TRADE_ID';
SELECT status FROM escrow_holds WHERE trade_id = 'TRADE_ID';  -- RELEASED
SELECT type FROM ledger_entries WHERE payload->>'tradeId' = 'TRADE_ID' ORDER BY created_at;
-- expect TRANSFERRED
```
