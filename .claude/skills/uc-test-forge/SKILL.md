---
name: test-forge
description: Find the most under-tested code, generate a real test suite per unit in parallel, and quality-gate each suite with a judge panel so only tests that run and meaningfully assert behavior are kept. Use this WHENEVER the user wants to add tests, raise coverage, "write tests for this module", backfill missing tests, or harden a service with a test suite — even without the word "workflow". Prefer this over writing tests one file at a time whenever a module or service needs broad coverage.
---

# Test Forge

Run this as a **dynamic workflow** (say "ultracode" / "run a workflow"). Agents generate tests in parallel and a judge panel filters out the junk, so you get a vetted suite rather than a pile of green-but-meaningless tests.

## When to reach for it
Raising coverage across a module/service. For a single function's test, write it inline.

## Inputs to resolve first
- **root** (default `src`) and optional **target** path.
- **framework** (vitest / jest / pytest / go test / …) and the **runner** command (e.g. `npm test`).

## Shape (triage → generate → judge → land)
1. **Triage** — rank units by importance × coverage gap; pick the ~12 highest-leverage. Use a coverage report if one exists, else infer.
2. **Generate** — one agent per unit, **each in its own git worktree** (they write files in parallel and must not collide). Cover happy path + error paths + edges; run the suite and iterate until green. Never weaken assertions to force a pass.
3. **Judge** — 2 independent judges per generated file: does it run green, assert *real* behavior (not tautologies or a mirror of the implementation), and cover edges? Keep only suites that all judges run green with an average score ≥ 6.
4. **Land** — list kept suites (to merge) and units still needing manual attention.

## Guardrails
- Worktree isolation is required because agents write files concurrently.
- Reject tests that just restate the implementation or only hit the happy path.
- A meaningful failing-then-fixed test beats a vacuous passing one.

## When you want it identical every time
Use `.claude/workflows/test-forge.js` (`Run the test-forge workflow with args {"root":"src","framework":"vitest","runner":"npm test"}`).
