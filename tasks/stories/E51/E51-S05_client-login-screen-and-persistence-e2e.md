# E51-S05 — Client login screen and persistence e2e

## Epic

E51 — Accounts, Login, and Durable Characters

## Dependency chain

- Depends on: E51-S04
- Blocks: none (last story)

## Objective

A minimal login/register screen gating the game canvas, silent token resume, and an end-to-end test proving the whole epic: register → play → disconnect → resume → durable state.

## Implementation guidance

- **UI placement:** the client UI system lives in `apps/client/src/game/ui/` (`UIManager.ts`). Follow its existing panel/DOM conventions — inspect how an existing panel (e.g. settings) is built before writing any DOM code. The login screen is a pre-game overlay, not an in-game panel: game connection/canvas boot must not start until auth succeeds. Find the client bootstrap (`GameEngine.ts` / entry point) and split "create engine" from "connect + spawn" if they're currently fused.
- **Flow:**
  1. On load: token in `localStorage` (`old-town-auth-token`, versioned like `RenderSettings` does) → try `resume` silently; on `invalid_token` fall through to the form.
  2. Form: username, password, [Login] [Register]. Map every S01 error code to a human message. Disable buttons while in flight.
  3. On `AuthResult ok`: store token, proceed to normal connection flow.
  4. Dev mode: when the server runs `OLD_TOWN_AUTH=dev`, keep zero-friction auto-login (client attempts `login` with a dev identity automatically — mirror however the dev client currently identifies itself; `bun run dev` must behave exactly as today).
- **Logout:** a settings-panel button that clears the token and reloads. Keep it trivial.
- **E2E test:** server-side integration test (heavy lane) driving two sequential fake-client connections against a real session manager + memory adapter:
  1. register `alice`, spawn, move to a new tile (tick commands), pick up/receive an item, disconnect.
  2. advance past grace, reconnect with `login`, assert position and inventory match.
  3. reconnect with saved token via `resume` during a fresh grace window, assert same-entity resume.
  Reuse the harness from `multiplayer-loop.integration.test.ts` if one exists — read it first.
- **UI tests:** follow the `UIManager.test.ts` jsdom patterns for the overlay (renders, error mapping, token storage). Don't e2e-test the browser.

## Required work

- [ ] Pre-game auth overlay + token persistence + silent resume + logout.
- [ ] Dev auto-login preserved.
- [ ] Server e2e test as specified.
- [ ] UI unit tests.

## Acceptance criteria

- [ ] Fresh browser: register and play. Refresh: back in game with no form (silent resume).
- [ ] Wrong password shows a friendly error; no console spam.
- [ ] `bun run dev` unchanged for local development.
- [ ] E2E proves durable inventory/position across full disconnect and across resume.

## Validation commands

- `bun run test` and `bun run test:heavy` (post-E50) or `bun run test` (if E50 not yet done)
- `bun run typecheck && bun run lint`
