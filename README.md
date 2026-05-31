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
bun run dev            # start the server and client for the playable POC
```

`bun run dev` starts both halves of the POC:

- authoritative server: `http://localhost:8080`, WebSocket `ws://localhost:8080/ws`
- Vite client: `http://127.0.0.1:5173`
- server content: loaded from `content/`, validated on boot
- dev character flow: accountless `DevAuth` sessions spawn at the seed region with starter items

Open `http://127.0.0.1:5173` after the command is running. Opening the same URL in two browser
tabs creates two dev sessions, and each tab should see both players once the second tab connects.
Server performance counters are available at `http://localhost:8080/debug/stats`; client render
counters are shown in the dev debug overlay.

Default environment values are checked into `apps/server/.env.example` and
`apps/client/.env.example`. For the root launcher, override these only when needed:

| Variable              | Default                    | Purpose                                      |
| --------------------- | -------------------------- | -------------------------------------------- |
| `PORT`                | `8080`                     | Server HTTP/WebSocket port                   |
| `CLIENT_PORT`         | `5173`                     | Vite client port                             |
| `CLIENT_HOST`         | `127.0.0.1`                | Vite client host                             |
| `VITE_SERVER_URL`     | `ws://localhost:8080/ws`   | Client WebSocket target                      |
| `CONTENT_DIR`         | `content`                  | Runtime content directory                    |
| `TICK_MS`             | `600`                      | Server simulation tick length                |
| `PERSISTENCE_ENABLED` | `false`                    | Accountless dev-character persistence toggle |
| `DEBUG`               | `false`                    | Server debug log toggle                      |
| `LOG_JSON`            | `false`                    | Emit server logs as JSON lines               |

Common startup failures:

- If the client reports connection failure, confirm the server log says it is listening on port
  `8080` and that `VITE_SERVER_URL` ends with `/ws`.
- If a port is already in use, set `PORT=8081` or `CLIENT_PORT=5174` before running `bun run dev`.
  When changing `PORT`, also set `VITE_SERVER_URL=ws://localhost:<PORT>/ws` if you are not using
  the root launcher default.
- If startup aborts during content loading, run `bun run content:validate` and fix the listed JSON
  issue before launching again.
- If persistence should survive refreshes, set `PERSISTENCE_ENABLED=true`; the default keeps local
  runs free of save-file churn.

Additional scripts:

| Command                 | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `bun install`           | Install all workspace dependencies                 |
| `bun run typecheck`     | Type-check every workspace                         |
| `bun run format`        | Format the repo in place (Biome)                   |
| `bun run format:check`  | Verify formatting without writing                  |
| `bun run lint`          | Lint the repo (Biome)                              |
| `bun run check`         | Format check + lint + import organize in one pass  |
| `bun run fix`           | Apply safe Biome fixes, formatting, and imports    |
| `bun run dev`           | Start the local server and client together         |
| `bun run stress:sim`    | Run the simulation stress harness                  |
| `bun run test`          | Run the test suites                                |
| `bun run test:coverage` | Run tests with coverage (E00-S04)                  |

### Formatting & linting

Formatting and linting are handled by a single tool, [Biome](https://biomejs.dev),
configured in `biome.json`:

- **Formatting:** 2-space indent, 100-column width, LF line endings, double quotes,
  always-on semicolons and trailing commas.
- **Import hygiene:** imports are auto-organized by Biome's `assist/source/organizeImports`
  action, unused imports and variables are errors (`noUnusedImports`, `noUnusedVariables`),
  and type-only imports must use `import type` (`useImportType`).
- **Exclusions:** `node_modules`, `dist`, `build`, `out`, `coverage`, `.vite`, `.cache`,
  `*.tsbuildinfo`, and lockfiles are never linted or formatted. The repo `.gitignore` is
  also honored via Biome's VCS integration.

Run `bun run fix` before committing, and `bun run check` to verify everything at once.

## Task workflow

Work is organized as a linear epic/story tree under `tasks/`. See
[`tasks/README.md`](tasks/README.md) for execution rules. `POC_SPEC.md` is the
authoritative source of truth for all engine behavior.
