# E64-S04 — First-session acceptance run and polish

## Epic

E64 — First Session: Guided Onboarding

## Dependency chain

- Depends on: E64-S03
- Blocks: none (last story)

## Objective

Prove the ten-minute claim with a real person, fix what the run exposes, and pin the flow.

## Required work

- [ ] **Fresh-eyes playtest**: someone who has NOT built this (or at minimum a genuinely
      fresh character run by the author following ONLY on-screen guidance, if no second human
      is available — say which in the note) plays from character creation to quest complete.
      Record: time, every hesitation point, every hint that was ambiguous.
- [ ] **Polish from findings**: reword hints, adjust highlight visibility, fix step
      granularity (a step nobody understands gets split or re-hinted). Re-run until the
      ≤ 10-minute unaided criterion passes.
- [ ] **Pin it**: an end-to-end integration test driving the ENTIRE first session (spawn →
      greet → every step → reward) via intents — the regression net for "did some future
      change break onboarding". If E56 landed, also record it as a golden journal (the
      highest-value golden the project can have); else marked TODO in E56-S04.
- [ ] **Completion telemetry hook**: log a structured line on quest complete/decline with
      elapsed ticks (Logger) — the retention datum future analytics will want; nothing more.
- [ ] Update `docs/world/starter-town.md` with a short "implemented by quest <id>"
      cross-reference so the doc and content stay linked.

## Acceptance criteria

- [ ] The playtest criterion passes and the transcript of findings + fixes is in the story
      note.
- [ ] E2E first-session test green; onboarding is now regression-protected.

## Validation commands

- `bun run test && bun run typecheck && bun run lint && bun run content:validate`
