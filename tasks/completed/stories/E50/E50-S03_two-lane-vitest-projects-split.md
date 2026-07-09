# E50-S03 — Two-lane vitest projects split

## Epic

E50 — Test Suite Performance and Quality Gates

## Dependency chain

- Depends on: E50-S02
- Blocks: E50-S04

## Objective

Split tests into an explicit fast lane (default) and heavy lane (integration/perf/render), configured in vitest itself so the split is mechanical, not tribal knowledge.

## Design

Use vitest `projects` (in the root `vitest.config.ts` — locate the existing config first; there may be per-workspace configs, in which case use a root `vitest.workspace.ts`):

- Project `unit` (fast lane): all `*.test.ts` **excluding** the heavy glob list.
- Project `heavy`: an explicit `include` list built from (a) files tagged `// @heavy` in E50-S02, (b) bucket-C perf/render suites from the baseline doc, e.g. `**/*e42s05-perf.test.ts`, `**/multiplayer-loop.integration.test.ts`, plus any `*.integration.test.ts` / `*.perf.test.ts` convention you formalize here.
- Formalize the naming convention: heavy files must be renamed to `*.integration.test.ts` or `*.perf.test.ts` (do the renames in this story; update any imports/references), so the glob IS the tag and the `// @heavy` comments can be deleted.

## Required work

- [X] Inspect current vitest config layout (`rg -ln "defineConfig|defineWorkspace" --glob 'vitest*' --glob '**/vitest*'`) and implement the projects split accordingly.
- [X] Rename heavy files to the convention; verify nothing else references the old filenames (`tasks/` docs may — update them).
- [X] Scripts in root `package.json`:
  - `"test": "vitest run --project unit"`
  - `"test:heavy": "vitest run --project heavy"`
  - `"test:all": "vitest run"`
  - keep `test:watch` on the unit project.
- [X] Tune the unit lane for speed: `pool: "threads"`; try `isolate: false` for the unit project ONLY if the suite passes 3 consecutive full runs with it (module-level state in Three.js/registry tests may forbid it — if it fails, leave `isolate: true` and note why in the baseline doc).
- [X] Update `AGENTS.md` Validation discipline: typical validation becomes `bun run test` (fast) + `bun run test:heavy` before marking a story complete; document the naming convention.
- [X] Update `docs/testing/test-perf-baseline.md` with final lane timings.

## Acceptance criteria

- [X] `bun run test` runs only the unit lane in < 60 s locally; `bun run test:all` runs everything green.
- [X] Heavy membership is determined by filename convention + config glob, with zero magic comments left.
- [X] `AGENTS.md` documents the lanes.

## Validation commands

- `bun run test`
- `bun run test:heavy`
- `bun run test:all`
- `bun run typecheck && bun run lint`

## Completion note

- Unit lane ~50.33s; heavy ~5.09s; test:all ~56s.
- isolate:false kept after 3 consecutive green unit runs.
