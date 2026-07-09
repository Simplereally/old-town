# E56-S05 — Time-travel inspection tooling and the RCA runbook

## Epic

E56 — Deterministic Simulation Replay and Incident Time-Travel

## Dependency chain

- Depends on: E56-S04
- Blocks: none (last story)

## Objective

Make replay pleasant enough that it is the DEFAULT first move on any sim bug report.

## Required work

- [ ] `replay.ts` inspection flags:
      `--dump-entity <id>` (full component state at `--until` tick),
      `--watch-entity <id>` (print a line whenever any of its components change, with tick +
      the phase that changed it — wrap phase callbacks in replay mode to attribute writes),
      `--grep-component <name>` (ticks where any entity's `<name>` changed),
      `--trace-item <itemUid>` (every inventory/ground/bank/audit transition of one item — the
      "where did my ingot go" query, joining the item audit log).
- [ ] Incident capture path: kernel `dumpJournalToFile` + fixtures dump wired to a signal
      (SIGUSR2) and to E60's admin surface when that lands (leave a marked TODO with the exact
      hook name if E60 isn't merged yet).
- [ ] `docs/engine/replay-runbook.md`: the five-step RCA flow (get journal dump → replay →
      bisect → watch-entity → fix + golden), with a worked example from a real or staged bug.
      Pairs explicitly with the uc-incident-rca skill: the runbook is the evidence-gathering
      step.
- [ ] Ergonomics pass: replay startup < 2 s for the golden journals; error messages for the
      three common mistakes (missing fixtures, content mismatch, truncated journal) are
      specific and name the fix.

## Acceptance criteria

- [ ] A staged "vanishing item" bug (introduce deliberately in a scratch branch) is diagnosed
      end-to-end using only the runbook in under 10 minutes.
- [ ] All inspection flags covered by at least one test each.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
