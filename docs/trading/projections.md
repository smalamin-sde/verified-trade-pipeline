# Trade Projections — Role-Based Detail

## Why this branch exists

Buyer and seller need different views of the same trade. The buyer cares about **what they paid** and **dispute deadlines**; the seller cares about **payout**, **commission**, and **shipping SLA**.

## Endpoint

| Method | Route | Role | Result |
|--------|-------|------|--------|
| `GET` | `/trades/:id` | BUYER or SELLER (must be participant) | Role-specific projection |

## Field visibility

| Field | Buyer | Seller |
|-------|-------|--------|
| `fundedAmount` | yes | no |
| `escrowDeadline` | yes | no |
| `disputeWindowEnds` | yes | no |
| `disputeReason` | yes | no |
| `netPayout` | no | yes |
| `commissionAmount` | no | yes |
| `shipmentSlaDeadline` | no | yes |
| `trackingNumber` | yes | yes |

## Verification checklist

- [ ] Login as **buyer** on a trade you own → see `fundedAmount`, no `netPayout`
- [ ] Login as **seller** on same trade → see `netPayout` + `commissionAmount`, no `fundedAmount`
- [ ] Wrong user → `403 Forbidden`
- [ ] Unknown trade id → `404 Not Found`

## Example

```bash
BUYER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@demo.com","password":"password123"}' | jq -r .accessToken)

curl -s "http://localhost:3000/trades/TRADE_ID" \
  -H "Authorization: Bearer $BUYER_TOKEN"
```
