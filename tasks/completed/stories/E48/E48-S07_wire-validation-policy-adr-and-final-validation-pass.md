# E48-S07 — Wire validation policy ADR and final validation pass

## Epic

E48 — Wire Validation for Server-to-Client Protocol

## Dependency chain

- Depends on: E48-S01 through E48-S06 (all prior stories)
- Blocks: none (terminal story)

## Spec references

- `adrs/ADR-006_s2c-snapshot-delta-spine.md` — existing ADR with "server is trusted" note to be amended
- `TYPE_AUDIT_REPORT.md` — cross-cutting pattern 4 (JSON/network data type assertions)
- `packages/shared/src/protocol/command-schemas.ts` — C2S validation pattern
- `packages/shared/src/protocol/packet-schemas.ts` — S2C validation pattern (from E48-S01)

## Objective

Document the wire validation policy in an ADR. Amend ADR-006's "server is trusted" note. Run the full validation suite and update `TYPE_AUDIT_REPORT.md` to reflect the completed work.

## Required architectural decisions

- **ADR-008.** Create `adrs/ADR-008_wire-validation-policy.md` documenting:
  - All JSON from the wire (WebSocket and HTTP) is `unknown` until validated with Zod.
  - C2S commands are validated by `parseClientCommand` (existing).
  - S2C packets are validated by `parseServerPacket` / `parseTransportServerPacket` (new in E48).
  - DevAuth handshake is validated by `devAuthMessageSchema` (new in E48-S03).
  - Content HTTP response is validated by `parseContentClientRegistries` (new in E48-S05).
  - The server is trusted as the *source* of S2C packets, but the network transport is not trusted — corruption, proxies, or version mismatches can produce malformed data.
  - `decodeServerPacket` and `decodeTransportMessage` remain for trusted round-trip tests only.
  - Debug data schemas use `.passthrough()` to allow forward-compatible debug fields.
- **Amend ADR-006.** Add a note to ADR-006's "Consequences" section: "The 'server is trusted' comment on `decodeServerPacket` referred to the server as the source of truth, not the network transport. ADR-008 establishes the wire validation policy that all JSON from the wire is validated with Zod."

## Implementation checklist

- [X] Create `adrs/ADR-008_wire-validation-policy.md` with the sections: Status, Context, Decision, Consequences, Related.
- [X] Amend `adrs/ADR-006_s2c-snapshot-delta-spine.md` with a note referencing ADR-008.
- [X] Update `TYPE_AUDIT_REPORT.md`:
  - [X] Update cross-cutting pattern 4 status from "PARTIALLY FIXED" to "FIXED".
  - [X] Update Lane 5 finding #27 status from "OPEN" to "FIXED" (if not already done in E48-S06).
  - [X] Update Lane 3 protocol decoder findings to reflect Zod adoption.
- [X] Run the full validation suite:
  - [X] `bun run typecheck`
  - [X] `bun run lint`
  - [X] `bun run test`
  - [X] `bun run content:validate`
- [X] Fix any test failures or lint errors introduced by the epic.
- [X] Verify no `as TransportServerPacket`, `as ServerPacket`, `as TransportClientMessage`, or `as ContentClientRegistries` casts remain in client or server source code (test files may still use `as` for mock construction — that is acceptable).

## Acceptance criteria

- [X] `ADR-008_wire-validation-policy.md` exists and documents the validation policy.
- [X] ADR-006 is amended with a reference to ADR-008.
- [X] `TYPE_AUDIT_REPORT.md` cross-cutting pattern 4 is marked FIXED.
- [X] `TYPE_AUDIT_REPORT.md` Lane 5 finding #27 is marked FIXED.
- [X] `bun run typecheck` passes.
- [X] `bun run lint` passes (no new errors or warnings).
- [X] `bun run test` passes (all tests, no regressions).
- [X] `bun run content:validate` passes.
- [X] No unsafe `as` casts on wire data remain in client or server source (excluding test mocks).

## Validation commands

- [X] `bun run typecheck`
- [X] `bun run lint`
- [X] `bun run test`
- [X] `bun run content:validate`

## Agent completion protocol

- [X] Re-read the objective and acceptance criteria before final validation.
- [X] Run every validation command listed above.
- [X] Mark every completed checkbox in this file as `[X]`.
- [X] Move this story file to `tasks/completed/stories/E48/` only after all criteria pass.
- [X] Update the parent epic checklist if this story completes an ordered item.
- [X] Move the epic file to `tasks/completed/epics/` after all stories are complete.
