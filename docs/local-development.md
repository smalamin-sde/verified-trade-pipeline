# Local Development

## Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL)

## Verify database connection

1. **Start Postgres**
  ```bash
   docker compose up -d
  ```
2. **Start the app**
  ```bash
   npm run start:dev
  ```
3. **Hit the health endpoint**
  ```bash
   curl http://localhost:3000/health
  ```

### Expected result

If the database connection is stable, the response includes:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" }
  }
}
```

If Postgres is not running or credentials in `.env` are wrong, the app may fail on startup or health will report `"database": { "status": "down" }`.

## Run migrations

After Postgres is up, apply database migrations (includes demo users for auth):

```bash
npm run migration:run
```



## Verify login (JWT auth)

1. **Start the app** (if not already running)
  ```bash
   npm run start:dev
  ```
2. **Login as a demo user**
  ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"seller@demo.com","password":"password123"}'
  ```



### Demo accounts


| Email                    | Role          | Password      |
| ------------------------ | ------------- | ------------- |
| `seller@demo.com`        | SELLER        | `password123` |
| `buyer@demo.com`         | BUYER         | `password123` |
| `authenticator@demo.com` | AUTHENTICATOR | `password123` |




### Expected result

Successful login returns a JWT:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Invalid credentials return `401 Unauthorized`.

## Environment

Copy `.env.example` to `.env` and adjust values if needed:

```bash
cp .env.example .env
```


## Verify guards (JWT + roles)

See [authorization.md](./identity/authorization.md) for why guards exist.

1. **Login and save the token**

   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"seller@demo.com","password":"password123"}' | jq -r .accessToken)
   ```

2. **Protected route — any authenticated user**

   ```bash
   curl -s http://localhost:3000/auth/me \
     -H "Authorization: Bearer $TOKEN"
   ```

   Expected: `{ "userId": "...", "email": "seller@demo.com", "roles": ["SELLER"] }`

3. **Role-restricted route — seller only**

   ```bash
   curl -s http://localhost:3000/auth/seller-check \
     -H "Authorization: Bearer $TOKEN"
   ```

   Expected: `{ "ok": true, "message": "Seller access granted" }`

4. **Wrong role — buyer token on seller route**

   ```bash
   BUYER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"buyer@demo.com","password":"password123"}' | jq -r .accessToken)

   curl -s http://localhost:3000/auth/seller-check \
     -H "Authorization: Bearer $BUYER_TOKEN"
   ```

   Expected: `403 Forbidden` with `"Insufficient role"`

5. **No token**

   ```bash
   curl -s http://localhost:3000/auth/me
   ```

   Expected: `401 Unauthorized`

## Verify watches catalogue

See [catalogue.md](./watches/catalogue.md) for the full checklist.

1. **Seed 100 luxury watches (optional, dev only)**

   ```bash
   npm run seed:watches
   ```

2. **Public paginated catalogue**

   ```bash
   curl -s "http://localhost:3000/watches?page=1&limit=10"
   ```

3. **Watch detail** (replace `:id` with an id from step 2)

   ```bash
   curl -s http://localhost:3000/watches/:id
   ```

4. **Create listing (seller only)**

   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"seller@demo.com","password":"password123"}' | jq -r .accessToken)

   curl -s -X POST http://localhost:3000/watches \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "referenceNumber": "ROLEX-SUB-001",
       "serialNumber": "SN-ROLEX-SUB-001",
       "brand": "Rolex",
       "model": "Submariner Date",
       "askingPrice": 14500,
       "condition": "EXCELLENT",
       "photos": ["https://images.example.com/rolex-sub-1.jpg"]
     }'
   ```

## Verify trade initiation (DRAFT → PENDING_AUTH)

See [initiate.md](./trading/initiate.md) for the full checklist.

```bash
BUYER_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@demo.com","password":"password123"}' | jq -r .accessToken)

WATCH_ID=$(curl -s "http://localhost:3000/watches?page=1&limit=1" | jq -r .data[0].id)

curl -s -X POST http://localhost:3000/trades \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"watchId\":\"$WATCH_ID\"}"
```

## Verify passport linking (watch create)

See [passport/core.md](./passport/core.md). New watches should return a non-null `passportId` after listing.

## Verify authentication verdict (PENDING_AUTH → AUTH_PASSED)

See [authentication-verdict.md](./trading/authentication-verdict.md) for the full checklist.

## Verify escrow funding (AUTH_PASSED → ESCROW_FUNDED)

See [escrow-funding.md](./trading/escrow-funding.md) for the full checklist.

## Verify trade lifecycle (ship → deliver → release)

See [lifecycle.md](./trading/lifecycle.md) for the full checklist.

## Verify trade projections (GET /trades/:id)

See [projections.md](./trading/projections.md) for the full checklist.
