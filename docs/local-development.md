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

## Environment

Copy `.env.example` to `.env` and adjust values if needed:

```bash
cp .env.example .env
```
