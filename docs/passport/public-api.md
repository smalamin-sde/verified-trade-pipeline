# Passport Public API — Verify by Serial

## Why this branch exists

Anyone should be able to look up a watch's **tamper-proof history** by serial number and see whether the hash chain is valid.

## Endpoint

| Method | Route | Auth | Result |
|--------|-------|------|--------|
| `GET` | `/passport/by-serial/:serial` | Public | Ledger entries + `verified: true/false` |

## Response shape

```json
{
  "serialNumber": "SN-SEED-001",
  "verified": true,
  "entries": [
    {
      "type": "AUTHENTICATED",
      "payload": { "tradeId": "...", "verdict": "PASS" },
      "prevHash": "...",
      "thisHash": "...",
      "signer": "...",
      "createdAt": "2026-08-08T12:00:00.000Z"
    }
  ]
}
```

If any link is broken or tampered, `verified` is `false` (HTTP 200 — not 500).

## Verification checklist

- [ ] Complete a trade through auth PASS (creates `AUTHENTICATED` entry)
- [ ] `GET /passport/by-serial/SN-SEED-001` → `verified: true`, entries listed
- [ ] Unknown serial → `404 Not Found`
- [ ] No auth token required

## Example

```bash
curl -s "http://localhost:3000/passport/by-serial/SN-SEED-001"
```

Use a serial from `watches.serial_number` that has ledger entries (after authentication on a trade).
