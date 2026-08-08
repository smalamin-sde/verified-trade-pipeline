# Trading Core — Trade Aggregate & State Machine

## Why this branch exists

A **Trade** is the heart of AllChrono — one purchase lifecycle for one watch, one buyer, one seller. Before API endpoints (`POST /trades`, fund escrow, etc.), the domain rules must exist in code:

- What states exist (`DRAFT`, `PENDING_AUTH`, …)
- Which transitions are legal
- Fixed **7% commission** math
- **One active trade per watch** (DB partial unique index)

This branch is **domain only** — no HTTP controllers yet. APIs come in `feat/trading-initiate` and later branches.

## What was added

| Piece | Purpose |
|-------|---------|
| `Trade` entity + migration | Persists trade state, amounts, deadlines |
| `TradeState` / `TradeAction` enums | Spec-accurate state machine |
| `trade-state-machine.ts` | `canTransition`, `getNextState`, `applyTransition` |
| `commission.util.ts` | `gross`, `commission` (7%), `netPayout` (93%) |
| Partial unique index | Enforces one non-terminal trade per watch |

## Verification checklist

- [ ] Run migration: `npm run migration:run`
- [ ] Run unit tests: `npm test -- trade-state-machine` and `npm test -- commission.util`
- [ ] Confirm happy path transitions pass in tests
- [ ] Confirm illegal transition throws `TradeTransitionError`
- [ ] Confirm commission on `10000` → `700` fee, `9300` net

## State storage

Trade status is stored in **`trades.state`** (not `watches.status`). Watch status is listing visibility; trade state is the purchase flow.
