# Passport Core — Append-Only Ledger

## Why this branch exists

Each watch gets a **digital passport**: an append-only history log with a hash chain (tamper detection). This branch adds the **internal engine** — no public HTTP route yet (`GET /passport/by-serial/:serial` comes in `feat/passport-public-api`).

## What was built

| Piece | Purpose |
|-------|---------|
| `passports` table | One row per watch serial number |
| `ledger_entries` table | Append-only events (`AUTHENTICATED`, `TRANSFERRED`, etc.) |
| `hash-chain.ts` | SHA-256 links + HMAC signature |
| `PassportService` | Create passport, append entry, verify chain |
| Watch create / seeder | Sets `watches.passport_id` at listing time |

## When `passport_id` is set

- **`POST /watches`** (seller lists a watch) → passport created, `passport_id` linked
- **`npm run seed:watches`** → same for seeded watches
- **Not** at trade completion — trades append rows to `ledger_entries` later

## Verification checklist

- [ ] Set `PASSPORT_SIGNING_KEY` in `.env` (any long random string)
- [ ] Run migration: `npm run migration:run`
- [ ] Create a new watch via API (see below) or re-seed if DB was empty
- [ ] Confirm in TablePlus:

```sql
SELECT w.reference_number, w.serial_number, w.passport_id, p.serial_number AS passport_serial
FROM watches w
JOIN passports p ON p.id = w.passport_id
WHERE w.reference_number = 'ROLEX-PASSPORT-TEST';
```

- [ ] `ledger_entries` should be **empty** until auth/trade branches append events

## Test via API (Postman / curl)

```bash
# 1. Seller login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@demo.com","password":"password123"}' | jq -r .accessToken)

# 2. Create watch — passport linked automatically
curl -s -X POST http://localhost:3000/watches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "referenceNumber": "ROLEX-PASSPORT-TEST",
    "serialNumber": "SN-PASSPORT-TEST-001",
    "brand": "Rolex",
    "model": "Submariner",
    "askingPrice": 12000,
    "condition": "EXCELLENT",
    "photos": ["https://images.example.com/test.jpg"]
  }'
```

Response should include `"passportId": "<uuid>"` (not null).

## Re-seed existing DB

If you already ran `seed:watches` before this branch, those rows have `passport_id = null`. Options:

1. Delete seeded watches and re-run `npm run seed:watches`, or
2. Create new watches via `POST /watches` for testing

## Env

```
PASSPORT_SIGNING_KEY=your-long-random-secret
```

Used to HMAC-sign each ledger entry's hash.
