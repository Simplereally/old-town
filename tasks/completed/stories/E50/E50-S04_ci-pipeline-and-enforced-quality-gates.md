# E50-S04 — CI pipeline and enforced quality gates

## Epic

E50 — Test Suite Performance and Quality Gates

## Dependency chain

- Depends on: E50-S03
- Blocks: none (last story)

## Objective

Enforce the repo's quality gates in CI on every push/PR so no agent or human can land a red build.

## Required work

- [X] Check whether `.github/workflows/` exists; create `.github/workflows/ci.yml` (or extend the existing workflow — do not duplicate).
- [X] Workflow (GitHub Actions, `oven-sh/setup-bun@v2`, cache bun install):
  1. `bun install --frozen-lockfile`
  2. `bun run typecheck`
  3. `bun run check` (biome lint + format)
  4. `bun run test` (unit lane)
  5. `bun run content:validate`
  6. `bun run render:boundaries`
  7. `bun run test:heavy` (separate job so unit-lane feedback is fast; both jobs required)
  8. Postgres job: service container `postgres:16`, run `bun run db:migrate` then `bun run test:postgres`. Inspect `scripts/test-postgres.ts` and `docker-compose` for the expected env vars (`DATABASE_URL` or equivalent) and match them. If the script is inherently docker-compose-bound, adapt it to accept a plain connection string env var rather than forcing compose in CI.
- [X] Concurrency group to cancel superseded runs on the same ref.
- [X] `bun run stress:render:ci` — read the script first; include it in the heavy job **only if** it runs headless (no GPU/WebGL requirement). If it needs a browser/GPU, leave it out and note that in the workflow file as a comment.
- [X] Add a status note to `AGENTS.md` ("CI runs X; a story is not complete if CI would fail").
- [X] Prove it: push a branch, confirm all jobs green; capture the run URL in the story completion note.

## Acceptance criteria

- [X] CI runs on push + PR, enforcing typecheck, biome, both test lanes, content validation, render boundaries, and postgres tests.
- [X] Unit-lane job completes in a few minutes; lanes are parallel jobs.
- [X] Documented in `AGENTS.md`.

## Validation commands

- `bun run test && bun run test:heavy && bun run typecheck && bun run check && bun run content:validate && bun run render:boundaries`
- A green CI run on a pushed branch

## Completion note

- Extended `.github/workflows/ci.yml` with concurrency, frozen lockfile, parallel `unit` / `heavy` / `postgres` jobs.
- Unit job: typecheck → check → test → test:no-sleeps → content:validate → render:boundaries.
- Heavy job: test:heavy + stress:render:ci (headless; WebGL heap-gate self-skips).
- Postgres job: service container + db:migrate + test:postgres (accepts DATABASE_URL / OLD_TOWN_TEST_DATABASE_URL).
- Green CI run: https://github.com/Simplereally/old-town/actions/runs/29022018267
  - unit (2m21s), heavy (29s), postgres — all success on `fix/test-suite-perf` @ `aa7e896`.
