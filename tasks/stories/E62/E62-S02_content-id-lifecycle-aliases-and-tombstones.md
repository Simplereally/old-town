# E62-S02 — Content-id lifecycle: aliases, tombstones, and load-time resolution

## Epic

E62 — Save and Content Safety

## Dependency chain

- Depends on: E62-S01
- Blocks: E62-S03

## Objective

Saves reference content ids (items in inventories/banks/equipment, quest ids in varbits,
skill ids). Content will rename and remove things. Make both safe, permanently.

## Implementation guidance

- **Lifecycle files**: `content/lifecycle/aliases.json` (`{"old_id": "new_id"}` per content
  kind: items, npcs, objects, quests, skills — keyed sections) and
  `content/lifecycle/tombstones.json` (`{"id": {kind, removedNote, fallback}}`). Zod-schema'd
  like all content; loaded into the registries module so resolution is available wherever
  registries are (`content-loader.ts`).
- **Resolution rules** (applied at snapshot-hydration time, `character-state.ts`, AFTER
  migration): alias chains resolve transitively (a→b→c; cycle detection at content-validate
  time, not runtime); tombstoned item → apply the tombstone's declared fallback. **Fallback
  policy — decide here, document in the file schema**: for items the safe default is replace
  with a `lost-property` placeholder item (a real content item this story adds: untradeable,
  weightless, examine text explains "an item that no longer exists") preserving quantity=1
  per stack — NEVER silently delete, NEVER convert to value (no pricing layer exists). For
  quest ids: freeze the varbit (kept in a quarantine map on the snapshot, preserved on save,
  ignored by the engine). Skills: refuse — removing a skill with earned XP is a design event
  requiring a bespoke migration, tombstone validation rejects it.
- **Unknown id with NO lifecycle entry** (someone deleted content without a tombstone —
  the failure S04 will make hard to ship): same quarantine treatment + `Logger.error` with
  enough context to write the missing tombstone; load MUST still succeed. The quarantined
  original ids persist round-trip, so writing the tombstone later heals retroactively.
- **Registry lookup discipline**: hydration is the ONLY place resolution happens — live
  systems keep asserting valid ids (fail-fast stays; the boundary cleans).

## Required work

- [ ] Lifecycle schemas + loader + validate-time checks (alias targets exist; no cycles; no
      alias+tombstone for the same id; skill tombstones rejected).
- [ ] Hydration resolution: aliases (transitive), item tombstone→placeholder, quest
      quarantine, unknown-id quarantine + logging; placeholder item content + icon.
- [ ] Round-trip preservation of quarantined ids (save after load keeps them).
- [ ] Tests: every rule above; a save containing an aliased, a tombstoned, and an unknown
      item loads correctly and re-saves losslessly.

## Acceptance criteria

- [ ] `bun run content:validate` catches: dangling alias, alias cycle, missing-fallback
      tombstone.
- [ ] The epic-level rename and removal scenarios pass as integration tests.

## Validation commands

- `bun run test && bun run typecheck && bun run lint && bun run content:validate`
