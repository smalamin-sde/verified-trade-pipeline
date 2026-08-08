# Escrow Funding — Buyer Holds Payment

## Why this branch exists

After authentication passes (`AUTH_PASSED`), the buyer must **fund escrow** before the seller ships. Money is held in a simulated escrow ledger — not sent to the seller yet.

## Endpoint

| Method | Route | Role | Header | Result |
|--------|-------|------|--------|--------|
| `POST` | `/trades/:id/fund-escrow` | BUYER | `Idempotency-Key` (required) | `AUTH_PASSED` → `ESCROW_FUNDED` |

## Idempotency rules

| Case | Result |
|------|--------|
| New key | Funds escrow, returns trade |
| Same key + same trade + same body | Replays stored response (no double charge) |
| Same key + different body | `409 Conflict` |
| Same key + different trade | `409 Conflict` |

## Side effects

- Creates `escrow_holds` row with `status: HELD` and `amount = grossAmount`
- Sets `shipmentSlaDeadline` on the trade
- Stores idempotency record for safe retries

## Buyer fund-escrow flow

```
1. Buyer calls POST /trades/:id/fund-escrow
   Header: Idempotency-Key: fund-001

2. System checks idempotency_records first
   → Key "fund-001" exists?  → Return saved response (STOP)
   → Key not found?          → Continue below

3. In ONE transaction (all or nothing):
   a) trades.state → ESCROW_FUNDED
   b) escrow_holds → new row (money held)
   c) idempotency_records → new row (remember fund-001)
```

### Which table is first?

| Situation | First table touched |
|-----------|---------------------|
| **First request** | `escrow_holds` first, then `idempotency_records` (same transaction) |
| **Retry (same key)** | Only `idempotency_records` is read — nothing new is written |

### Relation between the two tables

**No direct FK** between them. Both link to the **same trade**:

```
trades (id)
   ├── escrow_holds.trade_id         → "money held for this trade"
   └── idempotency_records.trade_id  → "this payment request was processed"
```

| Table | Role |
|-------|------|
| **`escrow_holds`** | Business: buyer's money is locked |
| **`idempotency_records`** | Technical: prevent paying twice on retry |

**Example after one successful fund:**

| escrow_holds | idempotency_records |
|--------------|---------------------|
| trade `abc`, amount `$12,000`, status `HELD` | key `fund-001`, trade `abc`, saved response |

Same trade, different jobs — one holds money, one remembers the request.

## Verification checklist

- [ ] Trade in `AUTH_PASSED` (complete auth verdict flow first)
- [ ] Login as **buyer**
- [ ] `POST /trades/:id/fund-escrow` with `Idempotency-Key: fund-001` → `state: "ESCROW_FUNDED"`
- [ ] Repeat same request with same key → same response, still one `escrow_holds` row
- [ ] Same key on different trade → `409`
- [ ] Seller or missing key → `403` / `400`

## Example

```bash
BUYER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@demo.com","password":"password123"}' | jq -r .accessToken)

TRADE_ID=<trade in AUTH_PASSED>

curl -s -X POST "http://localhost:3000/trades/$TRADE_ID/fund-escrow" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Idempotency-Key: fund-demo-001" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## DB checks

```sql
SELECT state, shipment_sla_deadline FROM trades WHERE id = 'TRADE_ID';
SELECT trade_id, amount, status FROM escrow_holds WHERE trade_id = 'TRADE_ID';
SELECT idempotency_key, trade_id FROM idempotency_records;
```
