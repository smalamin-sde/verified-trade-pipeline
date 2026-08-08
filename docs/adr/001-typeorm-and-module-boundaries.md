# ADR 001: TypeORM and module boundaries

**Status:** Accepted

We use **TypeORM + PostgreSQL** with explicit migrations (`synchronize: false`) and split the API into NestJS modules by bounded context: `identity`, `watches`, `passport`, `trading`, `authentication`, and `escrow`. Each module owns its entities and exposes services; `trading` orchestrates cross-module side effects (passport append, escrow hold/release) inside database transactions rather than folding everything into one mega-module or putting business rules in controllers. TypeORM was chosen over Prisma for this take-home because migration SQL stays visible for partial indexes (e.g. one active trade per watch) and enum types, which map directly to the spec’s Postgres-centric invariants.
