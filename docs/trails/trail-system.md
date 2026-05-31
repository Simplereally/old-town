---
doc_type: authority
canonical_path: docs/trails/trail-system.md
parent_index: docs/trails/00-index.md
root_index: docs/00-index.md
---

Parent: [`Trails Index`](00-index.md)

Authority references:
- `docs/trails/trail-tiers.md`
- `docs/trails/trail-sources.md`
- `docs/trails/step-types.md`
- `docs/trails/caches-and-rewards.md`
- `docs/ledger/civic-ledger-system.md`
- `docs/quests/quest-system.md`

# Trail System

## Core Identity

A Trail is a single-use item that contains a sequence of 1-7 steps. Each step sends the player to a location, NPC, object, or skill action within the existing world. Completing all steps awards a Cache. The Trail item is consumed upon Cache opening.

## The Ten Questions

Every Trail must answer:

1. **What tier is it?** — Scrap, Chalk, Writ, Grave, Crown, or Starfall.
2. **Where can it come from?** — Monster drop, skilling roll, Warden contract, Cartography survey, quest reward, fishing oddity, woodcutting bark mark, mining sealed stone, or Sleight pickpocket.
3. **How many steps?** — Tier determines step count (1-2 for Scrap, 5-7 for Starfall).
4. **What step types can appear?** — Each tier has a permitted step type pool.
5. **What areas can it use?** — Steps must reference existing districts, landmarks, and routes.
6. **What skill/item/quest requirements can it ask for?** — Steps may require levels, items, or quest completion.
7. **Can it spawn danger?** — Ambush steps begin at Writ tier and escalate upward.
8. **What kind of Cache does it award?** — Cache tier matches Trail tier.
9. **What unique reward identity belongs to this tier?** — Each tier has a distinct cosmetic and item identity.
10. **What makes players want another one?** — The reward pool contains desirable cosmetics, rare utility, and collection log entries.

## OSRS-to-Old-Town Term Mapping

| OSRS Term | Old Town Term | Meaning |
|-----------|---------------|---------|
| Clue Scroll | Trail | The item that contains steps |
| Clue Tier | Trail Tier | Scrap through Starfall |
| Reward Casket | Cache | The container awarded at completion |
| STASH Unit / Hidey-hole | Nook | Buildable local storage for Trail Gear |
| Coordinate Clue | Survey Step | Use Cartography at a landmark |
| Emote Clue | Gesture Step | Perform an emote at a location |
| Cryptic Clue | Riddle Step | Text hint pointing to a location |
| Map Clue | Sketch Step | Crude map drawing of a landmark |
| Challenge Scroll | Phrase Step | Say or select a phrase near an NPC |
| Puzzle Box | Lockbox Step | Small puzzle or object sequence |
| Uri | Trail Fool / Wrong Walker / Bellstruck Stranger | NPC that appears during certain steps |
| Clue Gear | Trail Gear | Cosmetic items worn for Dress Steps |
| Beginner Clue | Scrap Trail | Tier 1, 1-2 steps |
| Easy Clue | Chalk Trail | Tier 2, 2-3 steps |
| Medium Clue | Writ Trail | Tier 3, 3-4 steps |
| Hard Clue | Grave Trail | Tier 4, 3-5 steps |
| Elite Clue | Crown Trail | Tier 5, 4-6 steps |
| Master Clue | Starfall Trail | Tier 6, 5-7 steps |

## Key Rules

1. **Trails are single-use.** Once completed, the Trail item is consumed. The Cache is awarded at the final step.
2. **Trails can be traded.** A player who finds a Trail they cannot complete can sell it. A player who buys a Trail they cannot complete has wasted their coins.
3. **No shop sales.** Tomas Tally does not sell Trails. Marn Lock might trade for them, but never at a fixed price.
4. **Steps use existing systems.** Every step type references a skill, station, NPC, or district that already exists. No Trail invents new content.
5. **Skilling produces Trails.** Mining, Woodcutting, Fishing, Gardening, and other skills have a rare chance to produce a Trail. Combat is not the only source.
6. **Starfall Trails are rare.** A Starfall Trail should feel like a world event. A player might see one per month of regular play.
7. **Trails are not quests.** They have no narrative arc, no permanent state, and no quest journal entry.
8. **Trails are optional.** A player can ignore Trails entirely and experience the full game.
9. **Nooks reduce friction.** Nooks store Trail Gear to reduce bank trips. They do not solve the clue.
10. **No wiki dependency.** Trail steps should be readable without external reference.

## Trail Item Format

A Trail item has these fields:

- trail_id — lowercase snake_case unique identifier
- tier — 1 through 6
- step_count — number of steps (within tier range)
- steps — ordered array of step objects
- source_tag — how the Trail entered the world (drop, skill, contract, etc.)
- required_quests — optional array of quest IDs that must be completed
- required_skills — optional map of skill IDs to minimum levels
- reward_cache_id — the Cache item awarded on completion

## Trail Lifecycle

1. **Acquire** — Player receives a Trail item through combat, skilling, contract, survey, or quest.
2. **Read** — Player reads the Trail to see the first step. The Trail item remains in inventory.
3. **Solve** — Player travels to the step location and performs the required action.
4. **Progress** — The Trail updates to show the next step. Steps are revealed sequentially.
5. **Complete** — After the final step, the Trail is consumed and a Cache is awarded.
6. **Open** — Player opens the Cache to receive rewards.

---

*Last updated: 2026-06-01*
