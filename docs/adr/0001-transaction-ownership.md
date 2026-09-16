# ADR 0001: Repositories never commit; routers own the transaction

## Context

`backend/domain/{name}/repository.py` modules perform writes via
`db_session.add()`, `db_session.delete()`, and `db_session.flush()`. None of
them call `db_session.commit()`. The transaction is opened and closed one
layer up, in the router, via `async with db.begin():` — see
`domain.launch.router.create_launch`, `domain.launch.router.delete_launch`,
`domain.day_log.router.create_day_log`, and the `add_remark_to_launch` /
`add_repair_to_launch` endpoints.

`database.session.get_db` yields a session per request and rolls it back on
any unhandled exception or cancellation; it does not commit. Committing is
therefore solely the responsibility of whichever `async with db.begin()`
block is active at the time.

This split is easy to violate without realising it matters, and is exactly
the kind of rule an AI-assisted edit will silently break: a repository
function that calls `commit()` "for convenience," or a new domain that opens
its own `db.begin()` inside a repository function, will still pass tests
that only exercise that one repository in isolation.

## Decision

- Repository functions (`domain/{name}/repository.py`) call `flush()` when
  they need generated IDs or constraint violations to surface before the
  function returns. They never call `commit()`, and never open
  `db.begin()` or `db.begin_nested()` for the purpose of committing.
- Router functions (`domain/{name}/router.py`) open exactly one
  `async with db.begin():` block per request that performs a write, and the
  transaction's boundary is the boundary of that block. If a future
  endpoint needs to call two repositories' write functions as one atomic
  unit, both calls go inside the same router-owned `db.begin()` block — the
  repositories are not changed to know about each other or about
  transactions at all.
- A repository function may still use `db_session.begin_nested()`
  internally as a *savepoint* for its own retry logic (see
  `launch.repository.add_launch`'s collision-retry loop) — this is not an
  exception to the rule, because a savepoint has no independent commit; it
  either rolls back to itself or is released back into the still-open outer
  transaction the router owns.

## Consequences

- A repository function is safe to call from more than one router without
  auditing it for accidental partial commits.
- Read-only endpoints that call multiple repositories' read functions in
  sequence (`winch.router.get_winch_day_data`, `get_export_data`,
  `get_bf_info`) do not need a transaction at all, and don't have one —
  autocommit-per-statement is correct for reads with no write to make atomic.
- No endpoint currently exists that calls two different domains' *write* functions inside one transaction. The rule
  above is written to
  hold in that case too, but it is untested by the current codebase — see
  the note in `docs/diagrams/backend-orchestrated-write-sequence.md` and the
  separate issue it links, filed to close that gap rather than silently
  asserting a pattern the code doesn't yet demonstrate.
- A reviewer (including an AI assistant) checking a new write endpoint has
  one thing to check: does `commit` only ever happen via a router-level
  `db.begin()`, never inside `domain/*/repository.py`. Test fixtures commit
  directly against the session to set up rows (`test_repository.py`,
  `test_router.py` files) — that's expected and out of scope for this rule.
  `grep -rn "\.commit(" backend/domain/ --include='repository.py' --include='router.py'`
  should always return nothing.
