# ADR 002: Trade orchestration and passport ledger

**Status:** Accepted

**Trade orchestration:** State transitions are centralized in `TradeTransitionService` with a pure `applyTransition` function and role/state guards at the service layer. Escrow funding is isolated in `EscrowService` with an `idempotency_records` table so retries return the original response without a second hold. We did not introduce a message bus or saga framework — a single Postgres transaction per transition is enough for the take-home and keeps failure modes obvious.

**Passport ledger:** Watch history is stored as an append-only hash chain in `ledger_entries`, verified on public read (`GET /passport/by-serial/:serial`). We rejected Redis streams or an external blockchain because the spec asks for tamper detection in Postgres, and verify-on-read gives reviewers a clear `verified: true/false` signal without operational overhead.
