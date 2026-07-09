# E65-S02 — ActorRenderer decomposition: materials and armour visuals

## Epic

E65 — Client Architecture: Decomposing the God Files

## Dependency chain

- Depends on: E65-S01
- Blocks: E65-S03

## Objective

Extract the leaf concerns first — material/geometry caching and armour visual application —
per the S01 contract. These have the fewest inbound couplings; they prove the slice
discipline before the hairy clusters.

## Required work

- [ ] Extract the materials/caching cluster to its module (name per S01's table) — pure
      resource management: given specs, return cached materials/geometries; owns disposal
      (coordinate with `RenderResourceRegistry` — the client already has render-resource
      lifecycle machinery; the new module must register through it, not around it).
- [ ] Extract armour visual application per S01's map (how equipment visuals map onto actor
      meshes — post-E49 this should be rig-adjacent; respect the rig's own modules and only
      extract what ActorRenderer still hosts).
- [ ] Migrate the relevant tests (`ActorRenderer.equipment.test.ts`, `lowpoly.test.ts` — move
      what belongs to the new modules, keep integration-level ones against the host); add the
      new modules' focused unit tests.
- [ ] Each extraction is its own green commit; ActorRenderer shrinks by the extracted lines
      (no shim layers left behind — callers import the new modules).
- [ ] Manual visual check: equipment + armour render identically (fixture scene or dev
      spot-check; screenshot pair in story note).

## Acceptance criteria

- [ ] Both modules dependency-clean per the S01 contract (no back-imports into
      ActorRenderer); suite green; no visual diff.
- [ ] Disposal correctness: resource-recovery tests
      (`RenderResourceRecovery.test.ts` area) still pass — leaks are the classic extraction
      casualty here.

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
