# E60-S04 — Admin commands with audit trail

## Epic

E60 — Observability and Operations Surface

## Dependency chain

- Depends on: E60-S03
- Blocks: none (last story)

## Objective

The minimum operational command set — announce, kick, teleport, item-grant, journal-dump —
authenticated, audited, and executed ON the tick (never mutating world state from the HTTP
context).

## Implementation guidance

- **Execution model**: admin actions enqueue as commands into the tick pipeline, NOT direct
  mutations — reuse the command-buffer path with a synthetic admin origin (study how
  `routeCommand` tags ownership; admin commands carry `{origin:"admin", actor:<token label>}`
  and bypass the per-session spam cap). This keeps E56 replay coherent: journaled admin
  commands replay like any input. If E56 landed, confirm the journal records them; if not,
  marked TODO in E56-S02.
- **Commands**: `announce <text>` (system line to all sessions — reuse/define the system
  chat variant; if E58-S03 landed, its system announce shape is the one); `kick <name>`
  (disconnect via the existing session teardown); `teleport <name> <x> <z> [plane]`
  (validated against collision — refuse into-wall placements); `give <name> <itemId> <qty>`
  (through the normal inventory mutation path, audited via the item audit log with the admin
  actor — `apps/server/src/items/item-audit.ts` idempotency pattern);
  `journal-dump` (E56's `dumpJournalToFile` — close E56-S05's marked TODO).
- **Surface**: `POST /adminz/<cmd>` JSON bodies, gated by `OLD_TOWN_ADMIN_TOKEN` (REQUIRED —
  no token, no admin surface at all, even in dev; the token names the actor for audit).
  Constant-time token compare.
- **Audit**: every accepted admin command → structured log line (Logger) + item-audit rows
  where items move. Rejected commands log too (bad target name, invalid tile).

## Required work

- [ ] Admin command intake → command-buffer injection + the five commands.
- [ ] Token gate + actor labels + audit wiring.
- [ ] Tests: each command end-to-end against a scripted kernel; unauthenticated/wrong-token
      requests rejected without side effects; give-audit rows carry the actor; teleport
      refuses blocked tiles; kick cleans up exactly like a normal disconnect (reuse its test
      helpers).
- [ ] Extend `docs/engine/operations.md` with the command reference + a security note (token
      handling, no default token, never log the token).

## Acceptance criteria

- [ ] All five commands work against a live dev server via curl; audit trail names the actor.
- [ ] World state is only ever touched from inside ticks (review criterion: zero direct
      mutation from HTTP handlers).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
