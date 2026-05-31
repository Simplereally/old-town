# Old Town

A browser-first, lo-fi 3D MMO inspired by 2006/2007 OSRS-era primitives, built with
Three.js and Bun/Node. Original assets and content only.

## Engineering invariants

- **Server is authoritative.** The client sends intents; the server decides all truth.
- **Integer world, float renderer.** Gameplay truth is integer tiles, planes, ticks, IDs,
  and bitmasks. Three.js positions are presentational only.
- **600ms tick.** No gameplay sleeps/timeouts — all gameplay time is tick time via queues.
- **Tile bitmask collision.** Movement blocking is directional bitmask flags, not physics.
- **Content-driven.** Items, NPCs, objects, quests, skills, and spells are JSON definitions
  loaded into registries and validated against schemas.

## Architecture map

```txt
apps/
  client/   — Vite + Three.js renderer, input, net, UI
  server/   — tick loop, ECS, systems, net, persistence
packages/
  shared/   — protocol, types, math, content schemas
content/    — JSON definitions (items, NPCs, objects, skills, spells, quests, maps, drops, dialogue)
scripts/
  — task helpers and CI scripts
tools/
  world-editor/      — tile/object/NPC placement, export
  content-validator/ — CLI to validate JSON content against schemas
```

## Prerequisites

- [Bun](https://bun.sh) `>= 1.1`

## Local development

```sh
bun install            # install all workspace dependencies
```

Additional scripts are wired up as the foundation epics land:

| Command                 | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `bun install`           | Install all workspace dependencies                 |
| `bun run typecheck`     | Type-check every workspace                         |
| `bun run format`        | Format the repo in place (Biome)                   |
| `bun run format:check`  | Verify formatting without writing                  |
| `bun run lint`          | Lint the repo (Biome)                              |
| `bun run check`         | Format check + lint + import organize in one pass  |
| `bun run test`          | Run the test suites                                |
| `bun run test:coverage` | Run tests with coverage (E00-S04)                  |

### Formatting & linting

Formatting and linting are handled by a single tool, [Biome](https://biomejs.dev),
configured in `biome.json`:

- **Formatting:** 2-space indent, 100-column width, LF line endings, double quotes,
  always-on semicolons and trailing commas.
- **Import hygiene:** imports are auto-organized/ordered (`organizeImports`), unused
  imports and variables are errors (`noUnusedImports`, `noUnusedVariables`), and type-only
  imports must use `import type` (`useImportType`).
- **Exclusions:** `node_modules`, `dist`, `build`, `out`, `coverage`, `.vite`, `.cache`,
  `*.tsbuildinfo`, and lockfiles are never linted or formatted. The repo `.gitignore` is
  also honored via Biome's VCS integration.

Run `bun run format` before committing, and `bun run check` to verify everything at once.

## Task workflow

Work is organized as a linear epic/story tree under `tasks/`. See
[`tasks/README.md`](tasks/README.md) for execution rules. `POC_SPEC.md` is the
authoritative source of truth for all engine behavior.
