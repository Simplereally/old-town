# E64-S03 — Client nudges: hint line and target highlight

## Epic

E64 — First Session: Guided Onboarding

## Dependency chain

- Depends on: E64-S02
- Blocks: E64-S04

## Objective

Just enough visual guidance: a persistent one-line hint for the current step, and a gentle
highlight on the current step's target — both driven entirely by server quest state.

## Implementation guidance

- **Hint source**: quest content grows an optional per-step `hint: {text, target?: {kind:
  "npc"|"object"|"area", id|at}}` (schema addition; generic — any quest may use hints). The
  server already streams quest/varbit state (E46 — find the exact packet the quest UI renders
  from); if step metadata doesn't reach the client, extend that packet with the current
  step's hint payload (server resolves the step; client gets ONLY the active hint — no quest
  logic client-side).
- **Hint line**: a single unobtrusive line — placement per UIManager idiom (near the quest
  tray if E46 built one, else a fixed top-of-screen line — read the current layout and pick;
  screenshot in story note). Hidden whenever no active hinted step.
- **Target highlight**: for `npc`/`object` targets in view: a soft pulse/outline in the
  scene. Investigate the cheapest correct mechanism in the current renderer (an additive
  pulsing marker mesh at the target's tile is likely cheaper and more lo-fi-appropriate than
  a postprocess outline — decide within the art direction, `docs/world/` visual language;
  the old-town-asset-craft skill conventions apply if any asset is authored). For `area`
  targets: a tile-marker at the destination. Client resolves entity position from its
  existing view state (ClientPacketApplier's entity store — read how the client indexes
  entities by server id).
- **Fade-out forever**: highlights and hints render ONLY while the onboarding quest is
  active. The mechanism is generic (any hinted quest), so "forever" is simply "no hinted
  quest active".

## Required work

- [ ] Hint schema + server step-hint resolution into the quest packet + wire registration.
- [ ] Hint line UI + highlight marker (npc/object/area) + lifecycle (appear/move/clear on
      step change) + jsdom/scene tests per existing client test idioms.
- [ ] Tests: hint follows active step; clears on quest end/decline; highlight tracks a
      moving NPC target; nothing renders for hint-less quests/steps.

## Acceptance criteria

- [ ] Whole nudge layer is quest-content-generic (review criterion: zero onboarding-specific
      ids in client code).
- [ ] Visuals sit inside the lo-fi art direction (screenshot review in story note).

## Validation commands

- `bun run test && bun run typecheck && bun run lint`
