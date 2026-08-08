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
