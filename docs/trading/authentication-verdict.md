# Authentication Verdict — Expert Check

## Why this branch exists

After a seller submits a trade for authentication (`PENDING_AUTH`), an **authenticator** records whether the watch is genuine. That moves the trade to **`AUTH_PASSED`** (buyer can fund escrow next) or **`AUTH_FAILED`** (terminal).

## Endpoint

| Method | Route | Role | Result |
|--------|-------|------|--------|
| `POST` | `/trades/:id/authentication-verdict` | AUTHENTICATOR | PASS → `AUTH_PASSED`; FAIL/INCONCLUSIVE → `AUTH_FAILED` |

## Side effects

| Verdict | Trade state | Passport ledger entry |
|---------|-------------|------------------------|
| `PASS` | `AUTH_PASSED` | `AUTHENTICATED` |
| `FAIL` | `AUTH_FAILED` | `RE_AUTHENTICATED` |
| `INCONCLUSIVE` | `AUTH_FAILED` | `RE_AUTHENTICATED` |

On PASS, `escrowDeadline` is set on the trade (buyer must fund escrow in time).

## Verification checklist

- [ ] Complete initiate flow first (DRAFT → PENDING_AUTH) — see [initiate.md](./initiate.md)
- [ ] Login as **authenticator@demo.com**
- [ ] `POST /trades/:id/authentication-verdict` with `{ "verdict": "PASS" }` → `state: "AUTH_PASSED"`
- [ ] Check `ledger_entries` has one row with `type = AUTHENTICATED`
- [ ] Check `authentication_reports` has one row for that trade
- [ ] Retry verdict on same trade → `409 Conflict`
- [ ] FAIL verdict → `state: "AUTH_FAILED"`, ledger `RE_AUTHENTICATED`

## Example flow

```bash
# Prerequisites: trade in PENDING_AUTH (buyer create + seller submit-for-auth)

AUTH_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"authenticator@demo.com","password":"password123"}' | jq -r .accessToken)

TRADE_ID=<id from submit-for-auth>

curl -s -X POST "http://localhost:3000/trades/$TRADE_ID/authentication-verdict" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"verdict":"PASS","notes":"Serial matches; movement authentic."}'
```

## Request body

```json
{
  "verdict": "PASS",
  "notes": "Optional inspector notes",
  "photoHashes": ["sha256:abc..."]
}
```

`verdict` is required: `PASS`, `FAIL`, or `INCONCLUSIVE`.
