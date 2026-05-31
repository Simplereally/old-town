---
doc_type: manifest
canonical_path: docs/content/seed-skills-manifest.md
parent_index: docs/content/00-index.md
root_index: docs/00-index.md
---

Parent: [`Content Translation Index`](00-index.md)

Authority references:
- `docs/skills/skill-system.md`
- `docs/skills/skill-interlocks.md`
- `POC_SPEC.md`

# Seed Skills Manifest

> **25 skills as runtime content candidates.** Every skill listed here must have a `content/skills/{skill_id}.json` entry for the POC. Skills are the foundation of the content graph.

## Skill Table

| skill_id | display_name | category | max_level | combat_flag | starter_unlocks | docs_source | poc_required |
|----------|--------------|----------|-----------|-------------|-----------------|-------------|--------------|
| `arms` | Arms | combat | 99 | yes | Melee weapon access | [`docs/skills/skill-system.md`](../skills/skill-system.md) | yes |
| `might` | Might | combat | 99 | yes | Heavy weapon access, carrying capacity | [`docs/skills/skill-system.md`](../skills/skill-system.md) | yes |
| `guard` | Guard | combat | 99 | yes | Armour access, block quality | [`docs/skills/skill-system.md`](../skills/skill-system.md) | yes |
| `vitality` | Vitality | combat | 99 | yes | Health pool, recovery scaling | [`docs/skills/skill-system.md`](../skills/skill-system.md) | yes |
| `ranged` | Ranged | combat | 99 | yes | Bow, crossbow, thrown weapon access | [`docs/skills/skill-system.md`](../skills/skill-system.md) | yes |
| `magic` | Magic | combat | 99 | yes | Spellcasting, bead use, spell access | [`docs/skills/skill-system.md`](../skills/skill-system.md) | yes |
| `favour` | Favour | combat | 99 | yes | Shrine boons, blessings, protections | [`docs/skills/skill-system.md`](../skills/skill-system.md) | yes |
| `mining` | Mining | gathering | 99 | no | Ore, stone, salt, glass sand access | [`docs/skills/gathering-skills.md`](../skills/gathering-skills.md) | yes |
| `woodcutting` | Woodcutting | gathering | 99 | no | Logs, bow woods, timber access | [`docs/skills/gathering-skills.md`](../skills/gathering-skills.md) | yes |
| `fishing` | Fishing | gathering | 99 | no | Fish, eels, shellfish, pearl access | [`docs/skills/gathering-skills.md`](../skills/gathering-skills.md) | yes |
| `trapping` | Trapping | gathering | 99 | no | Hides, feathers, sinew, small beasts | [`docs/skills/gathering-skills.md`](../skills/gathering-skills.md) | yes |
| `gardening` | Gardening | gathering | 99 | no | Herbs, crops, mushrooms, flowers | [`docs/skills/gathering-skills.md`](../skills/gathering-skills.md) | yes |
| `smithing` | Smithing | production | 99 | no | Melee weapons, metal armour, arrowheads | [`docs/skills/production-skills.md`](../skills/production-skills.md) | yes |
| `bowcraft` | Bowcraft | production | 99 | no | Bows, crossbows, arrows, bolts | [`docs/skills/production-skills.md`](../skills/production-skills.md) | yes |
| `tailoring` | Tailoring | production | 99 | no | Robes, ranged armour, capes, wraps | [`docs/skills/production-skills.md`](../skills/production-skills.md) | yes |
| `handicraft` | Handicraft | production | 99 | no | Jewellery, charms, keepsakes, rings | [`docs/skills/production-skills.md`](../skills/production-skills.md) | no |
| `beadwork` | Beadwork | production | 99 | no | Spell beads, bead pouches, charmwards | [`docs/skills/production-skills.md`](../skills/production-skills.md) | yes |
| `apothecary` | Apothecary | production | 99 | no | Potions, salves, oils, brews, poisons | [`docs/skills/production-skills.md`](../skills/production-skills.md) | yes |
| `cooking` | Cooking | production | 99 | no | Food, combo food, preserves, pies | [`docs/skills/production-skills.md`](../skills/production-skills.md) | yes |
| `carpentry` | Carpentry | production | 99 | no | Homes, workshops, storage, stalls | [`docs/skills/production-skills.md`](../skills/production-skills.md) | no |
| `wayfaring` | Wayfaring | utility | 99 | no | Shortcuts, roads, stamina, climbing | [`docs/skills/utility-skills.md`](../skills/utility-skills.md) | yes |
| `sleight` | Sleight | utility | 99 | no | Pickpocketing, stalls, locks, traps | [`docs/skills/utility-skills.md`](../skills/utility-skills.md) | yes |
| `wardenry` | Wardenry | utility | 99 | no | Bounties, contracts, dangerous creature access | [`docs/skills/utility-skills.md`](../skills/utility-skills.md) | yes |
| `hearthcraft` | Hearthcraft | utility | 99 | no | Fires, candles, camps, bead kiln work | [`docs/skills/utility-skills.md`](../skills/utility-skills.md) | yes |
| `cartography` | Cartography | utility | 99 | no | Maps, surveys, landmarks, route unlocks | [`docs/skills/utility-skills.md`](../skills/utility-skills.md) | yes |

## POC-Required Summary

| Category | POC Required | Post-POC |
|----------|--------------|----------|
| Combat | 7 | 0 |
| Gathering | 5 | 0 |
| Production | 5 | 2 (handicraft, carpentry) |
| Utility | 5 | 0 |
| **Total** | **22** | **2** |

## Design Notes

- All 25 skills share the same 1-99 XP curve. See [`docs/skills/skill-system.md`](../skills/skill-system.md) for the curve table.
- Combat skills are mandatory only for combat progression. A player can ignore any gathering, production, or utility skill and still progress.
- No dead-end skill. Every skill must produce something another skill consumes, or consume something another skill produces.
- Skill IDs are single kebab-case words. No underscores, no camelCase.

## See also

- [`docs/skills/skill-system.md`](../skills/skill-system.md) — Core skill authority
- [`docs/skills/skill-interlocks.md`](../skills/skill-interlocks.md) — Skill economy web
- [`docs/content/content-kind-contracts.md`](content-kind-contracts.md) — Content kind mapping
- [`docs/content/starter-content-manifest.md`](starter-content-manifest.md) — POC content set

---

*Last updated: 2026-05-31*
