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

