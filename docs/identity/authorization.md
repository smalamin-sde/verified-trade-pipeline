# Authorization — Guards & Roles

## Why this exists

Login (`POST /auth/login`) returns a JWT, but a token alone does not protect the API. Without guards, any client could call future endpoints (create watches, fund escrow, submit auth verdicts) without authentication or role checks.

This branch enforces access control before business logic runs:

| Piece | Purpose |
|-------|---------|
| **`JwtAuthGuard`** | Validates `Authorization: Bearer <token>` on all routes by default |
| **`@Public()`** | Opts a route out of JWT auth (login, health, public catalogue later) |
| **`@Roles(...)`** | Restricts a route to specific roles (e.g. `SELLER`, `AUTHENTICATOR`) |
| **`RolesGuard`** | Reads `@Roles()` metadata and checks the caller's JWT roles |

Both guards are registered globally in `AppModule`, so new controllers are protected by default. Mark public endpoints explicitly with `@Public()`.

## How it works

1. Client sends JWT in the `Authorization` header.
2. `JwtAuthGuard` skips validation if the route is `@Public()`; otherwise Passport JWT strategy validates the token and attaches `req.user`.
3. `RolesGuard` runs next. If no `@Roles()` is set, any authenticated user passes. If roles are required, the user must hold at least one matching role.

## Role enum

- `BUYER` — initiate trades, fund escrow, release/dispute
- `SELLER` — list watches, submit for auth, mark shipped
- `AUTHENTICATOR` — submit authentication verdicts
- `ADMIN` — reserved for admin/stub operations

## Test endpoints (temporary helpers)

| Endpoint | Auth | Role | Purpose |
|----------|------|------|---------|
| `POST /auth/login` | Public | — | Get JWT |
| `GET /auth/me` | JWT required | any | Returns `{ userId, email, roles }` |
| `GET /auth/seller-check` | JWT required | `SELLER` only | Returns 403 for non-sellers |

These helper routes prove guards work; future modules (watches, trades) will use the same `@Roles()` pattern.
