# Trading Initiate — Start a Trade

## Why this branch exists

Buyers need to **choose a watch and start a purchase**. That creates a `Trade` in **`DRAFT`** state. The seller then submits it for authentication (`DRAFT` → `PENDING_AUTH`).

Without this branch, the state machine existed but nothing created trades in the database.

## Endpoints

| Method | Route | Role | Result |
|--------|-------|------|--------|
| `POST` | `/trades` | BUYER | Creates trade with `state: DRAFT` |
| `POST` | `/trades/:id/submit-for-auth` | SELLER | Moves `DRAFT` → `PENDING_AUTH` |

## Verification checklist

- [ ] Login as **buyer**, pick a watch id from `GET /watches`
- [ ] `POST /trades` with `{ "watchId": "..." }` → returns trade with `state: "DRAFT"`
- [ ] Login as **seller** for that watch
- [ ] `POST /trades/:id/submit-for-auth` → returns `state: "PENDING_AUTH"`
- [ ] Second buyer on same watch while non-terminal → `409 Conflict`
- [ ] Buyer on own watch → `403 Forbidden`
- [ ] Buyer calling submit-for-auth → `403 Forbidden`

## Example flow

```bash
# 1. Buyer login
BUYER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@demo.com","password":"password123"}' | jq -r .accessToken)

# 2. Get a watch id
WATCH_ID=$(curl -s "http://localhost:3000/watches?page=1&limit=1" | jq -r .data[0].id)

# 3. Start trade (DRAFT)
curl -s -X POST http://localhost:3000/trades \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"watchId\":\"$WATCH_ID\"}"

# 4. Seller login + submit for auth
SELLER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@demo.com","password":"password123"}' | jq -r .accessToken)

TRADE_ID=<id from step 3>

curl -s -X POST "http://localhost:3000/trades/$TRADE_ID/submit-for-auth" \
  -H "Authorization: Bearer $SELLER_TOKEN"
```
