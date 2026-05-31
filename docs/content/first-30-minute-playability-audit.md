---
doc_type: audit
canonical_path: docs/content/first-30-minute-playability-audit.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

# First 30-Minute Playability Audit

> **Audit date:** 2026-05-31  
> **Method:** Compare each canonical starter loop against `content/`, `content/maps/`, and server runtime systems. Be brutally honest.

## Legend

- **Content exists** — All required JSON definitions (items, recipes, NPCs, objects, nodes, quests, dialogue) exist and validate.
- **Map placement exists** — Entities are placed in the runtime region map.
- **Actions route** — The player can send a command and the server routes it to a system that mutates state.
- **Runtime system exists** — The server has a full tick-phase implementation that resolves the loop end-to-end.
- **Playable now?** — Can a player complete this loop without hitting a hard blocker?
- **Blocking gaps** — What is missing that prevents the loop from being playable.

---

## Loop A: Spawn → Counting House → Rats → Shrine → Warden

| Check | Status | Notes |
|-------|--------|-------|
| Content exists | ✅ Yes | All NPCs, objects, creatures, drops, quests exist. |
| Map placement exists | ✅ Yes | Player spawn at Market Bell, Counting House nearby, cellar rats in Sootcellar, Shrine Hearth placed, Warden Steps nearby. |
| Actions route | ⚠️ Partial | Movement works. `attack` on rats works. `talk` on NPCs routes but emits "not yet implemented." `pray` on shrine emits "not yet implemented." |
| Runtime system exists | ⚠️ Partial | Combat/death/drops/respawn fully works. NPC dialogue does NOT work. Favour offering does NOT work. Quest objective progression does NOT work. |
| **Playable now?** | ❌ **No** | A player can walk to the rats and fight them, but cannot talk to quest givers, bank items, pray at the shrine, or progress the quest. |
| **Blocking gaps** | | NPC dialogue runtime (`talk` action), bank runtime (`bank` action), Favour offering (`pray` action), quest objective progression. |

---

## Loop B: Full Penny (Mining → Smithing)

| Check | Status | Notes |
|-------|--------|-------|
| Content exists | ✅ Yes | Penny Copper deposit, Tinstone deposit, pig iron, blackcoal, all tools, recipes, NPCs exist. |
| Map placement exists | ✅ Yes | Foundry Row objects placed, ore nodes exist as resource nodes. |
| Actions route | ✅ Yes | `mine` on rocks → gather loop. `cook`/`use` on furnace → process loop. |
| Runtime system exists | ✅ Yes | Full gather and process loops work: tool validation, level check, success/failure, XP, inventory, depletion, respawn. |
| **Playable now?** | ✅ **Yes** | A player can mine copper/tin, smelt bronze, and smith items. The loop is fully playable. |
| **Blocking gaps** | | None for the core loop. Shop/trade with Osric Penny is not wired, but the loop does not require it. |

---

## Loop C: Full Lath (Woodcutting → Bowcraft)

| Check | Status | Notes |
|-------|--------|-------|
| Content exists | ✅ Yes | Dry trees, oak trees, scrub trees, all tools, recipes, NPCs exist. |
| Map placement exists | ✅ Yes | Oldroad Gate and Lath Yard objects placed. Resource nodes exist. |
| Actions route | ✅ Yes | `woodcut`/`chop` on trees → gather loop. `use` on lath_bow_bench → process loop. |
| Runtime system exists | ✅ Yes | Full gather and process loops work. |
| **Playable now?** | ✅ **Yes** | A player can chop wood and craft bows. The loop is fully playable. |
| **Blocking gaps** | | None for the core loop. Shop/trade with Letha Lath is not wired. |

---

## Loop D: Full Patch (Trapping → Tailoring)

| Check | Status | Notes |
|-------|--------|-------|
| Content exists | ✅ Yes | Traps, hides, all tools, recipes, NPCs exist. |
| Map placement exists | ✅ Yes | Patch Lane objects placed. Resource nodes exist. |
| Actions route | ✅ Yes | `woodcut`/`chop` on trees for trap materials → gather. `use` on patch_tanning_frame → process (but `tan` action is not supported). |
| Runtime system exists | ⚠️ Partial | Trapping content exists but the trapping action (set trap, check trap) is not a supported skilling action. `tan` is unsupported. `use` on the frame works as a generic process, but no trapping-specific recipe exists. |
| **Playable now?** | ❌ **No** | A player can gather wood, but cannot set traps, catch foxes, or tan hides because the specific actions (`tan`, trap mechanics) are not wired. |
| **Blocking gaps** | | Trapping action runtime (set/check trap), `tan` action on tanning frame, `dye` action on dye vat. |

---

## Loop E: Full Chalk (Beadwork → Magic)

| Check | Status | Notes |
|-------|--------|-------|
| Content exists | ✅ Yes | All beads, recipes, NPCs, spells exist. |
| Map placement exists | ✅ Yes | Chalkhouse Court objects placed. |
| Actions route | ⚠️ Partial | `use` on bead stations → process loop. `cast` on spells → spell validation + bead consumption. |
| Runtime system exists | ❌ No | Bead crafting process works. Spellcasting validation works (beads consumed, cooldowns set), but **spell effects do NOT apply** — no damage, no bind, no teleport actually happens. |
| **Playable now?** | ❌ **No** | A player can craft beads but cannot actually cast spells with any effect. Magic combat is impossible. |
| **Blocking gaps** | | Spell effect application (damage, bind, teleport) in `spell-system.ts`. `fire` action on bead kiln, `weave` action on bead loom. |

---

## Loop F: Food and Survival

| Check | Status | Notes |
|-------|--------|-------|
| Content exists | ✅ Yes | Food items, fishing nodes, cooking recipes, campfire exist. |
| Map placement exists | ✅ Yes | River Stoop, Market Kitchen Hearth, fishing nodes. |
| Actions route | ✅ Yes | `fish` on fishing spots → gather (if `fish` is in GATHER_ACTION_IDS... actually `fish` is NOT in `GATHER_ACTION_IDS`). `cook` on hearth → process. `eat` on food → consumable. |
| Runtime system exists | ⚠️ Partial | `cook` works. `eat` works. `fish` action is NOT in `GATHER_ACTION_IDS` — only `woodcut`, `mine`, `chop` are supported. |
| **Playable now?** | ⚠️ Partial | A player can cook and eat food, but cannot fish because the `fish` action is not supported by the skilling system. |
| **Blocking gaps** | | `fish` action needs to be added to `GATHER_ACTION_IDS` in `skilling-system.ts`, or fishing needs its own action handler. |

---

## Loop G: First Dialogue / Quest Route

| Check | Status | Notes |
|-------|--------|-------|
| Content exists | ✅ Yes | 7 quests, 15 dialogue graphs, all quest givers exist. |
| Map placement exists | ✅ Yes | All quest givers placed. Quest objects placed. |
| Actions route | ❌ No | `talk` on NPCs → "not yet implemented." `inspect` on quest objects → "not yet implemented." |
| Runtime system exists | ❌ No | No dialogue engine. No quest objective tracker. No quest completion logic. |
| **Playable now?** | ❌ **No** | A player cannot start or progress any quest. |
| **Blocking gaps** | | Dialogue engine (open, progress, choice), quest objective tracker, quest completion logic, quest reward distribution. |

---

## Summary

| Loop | Playable? | Blocking Gaps |
|------|-----------|---------------|
| A: Spawn → Bank → Rats → Shrine → Warden | ❌ No | Dialogue, bank, Favour, quest |
| B: Full Penny | ✅ Yes | — |
| C: Full Lath | ✅ Yes | — |
| D: Full Patch | ❌ No | Trapping, tan, dye |
| E: Full Chalk | ❌ No | Spell effects, fire, weave |
| F: Food and Survival | ⚠️ Partial | Fish action |
| G: First Dialogue / Quest | ❌ No | Dialogue engine, quest tracker |

**Verdict:** 2 of 7 canonical loops are fully playable. 1 is partially playable. 4 are blocked by missing runtime systems.

---

*Last updated: 2026-05-31*
