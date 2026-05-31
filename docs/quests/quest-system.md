---
doc_type: authority
canonical_path: docs/quests/quest-system.md
parent_index: docs/quests/00-index.md
root_index: docs/00-index.md
---

Parent: [`Quests Index`](00-index.md)

Authority references:
- `POC_SPEC.md`
- `docs/quests/dialogue-style-guide.md`
- `docs/quests/quest-rewards-and-reclaim.md`
- `docs/content/seed-quests-and-dialogue-manifest.md`
- `docs/content/validation-and-drift-control.md`

# Quest System

Quests bind systems together with voice, errands, secrets, item handoffs, and reasons to revisit people.

## Quest Requirements

Every quest should include at least three of:

- One named NPC with a distinct voice.
- One item handoff.
- One location change.
- One skill interaction.
- One world object interaction.
- One choice or small branch.
- One funny or memorable examine line.
- One unlock that affects future play.
- One reason to revisit the NPC later.

## Tone Rules

Use:

- Broken bells.
- Missing permits.
- Counterfeit beads.
- Rats under bank ledgers.
- Drake smoke in old kilns.
- Grave flowers planted in the wrong soil.
- Ferrymen refusing routes.
- Wardens losing paperwork.
- Shopkeepers blaming each other.

Avoid:

- Chosen-one framing.
- Kingdom-saving stakes at level 1.
- Generic quest names.
- Lore dumps.
- NPCs who only exist to explain systems.

## Dialogue Node Fields

| Field | Meaning |
|-------|---------|
| Node ID | Stable ID |
| Speaker | NPC, player, or system |
| Text | Short line |
| Choices | Optional player choices |
| Conditions | Quest vars, skill levels, inventory |
| Effects | Set var, give item, open shop, start contract |
| Exits | Next node IDs |

Dialogue nodes should be short enough to read while playing. If an NPC needs to explain a system, split it into choices.

