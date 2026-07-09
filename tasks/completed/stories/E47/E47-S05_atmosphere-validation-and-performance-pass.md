# E47-S05 — Atmosphere validation and performance pass

## Epic

E47 — Old Town Audio, Atmosphere, and UI Juice

## Dependency chain

- Depends on: E47-S00, E47-S01, E47-S02, E47-S03, E47-S04
- Blocks: none

## Spec references

- `POC_SPEC.md` §7.1
- `POC_SPEC.md` §7.3
- `apps/client/src/game/renderer/ThreeRenderer.ts`
- `apps/client/src/game/ui/DebugOverlay.ts`

## Objective

Run a final validation pass for E47 using infrastructure that actually exists. Do not cite non-existent spec sections and do not require screenshot tests unless the story also adds screenshot tooling.

## What already exists — verify, do not rebuild

- `POC_SPEC.md` currently ends at §30. Do not cite §31 or §35 unless those sections are added first.
- `ThreeRenderer.debugCounters()` already exposes render counters.
- `DebugOverlay` already displays renderer metrics.
- The normal test stack is Vitest/jsdom. Screenshot tooling is not currently part of the repo.

## Required architectural decisions

- If numeric budgets are used, mark them as E47-local provisional budgets or add them to the spec first.
- Use existing renderer/debug counters before adding new counters.
- Validate audio-source counts, ambience transitions, disposal, and mute/volume behaviour.
- Validate resource disposal for audio, feedback layers, atmosphere resources, and loaded scene resources.
- Manual visual checks are acceptable. Automated screenshots are optional only if tooling is added.
- Do not add vague starter-town prose to the epic as a completion step.

## Implementation checklist

- [X] Remove invalid references to non-existent `POC_SPEC.md` sections.
- [X] Define E47-local provisional budgets or add real spec text before asserting numeric budgets.
- [X] Use existing renderer/debug counters for render checks.
- [X] Add tests for audio manager disposal and active source limits.
- [X] Add tests for ambience transition cleanup.
- [X] Add tests for feedback/selection/atmosphere disposal where feasible.
- [X] Add a region/resource lifecycle test only against the current loading/disposal path.
- [X] Add screenshot tooling explicitly if automated screenshot checks are required; otherwise keep visual checks manual.
- [X] Run a manual E47 pass in `bun run dev`.
- [X] Update the E47 epic checklist and move stories only after all acceptance criteria pass.

## Acceptance criteria

- [X] No fabricated spec references remain.
- [X] Render checks use existing counters or documented E47-local budgets.
- [X] Audio resources do not accumulate across zone changes.
- [X] Outgoing ambience stops after transitions.
- [X] Visual feedback and atmosphere resources dispose cleanly.
- [X] Manual pass covers starter districts, UI audio, packet audio, selection ring, click marker, XP feedback, and atmosphere cycle.
- [X] Any automated screenshot requirement has real tooling or is removed.

## Validation commands

- [X] `bun run test`
- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run content:validate`
- [X] `bun run dev` — full manual E47 pass

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E47/` only after all criteria pass.
- [X] Update the parent epic checklist and move the epic only when all E47 stories are complete.
