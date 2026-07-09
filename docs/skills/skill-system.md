---
doc_type: authority
canonical_path: docs/skills/skill-system.md
parent_index: docs/skills/00-index.md
system_index: docs/skills/00-index.md
root_index: docs/00-index.md
---

Parent: [`Skills Index`](00-index.md)

Authority references:
- `docs/combat/signature-mechanics.md`
- `docs/combat/mechanics-implementation.md`
- `docs/items/00-index.md`

# Skill System

> **The core authority for Old Town's skill engine.** Twenty-five skills form the backbone of the world's economy, combat, and character progression. Every skill is trained through repeated action, feeds at least one other system, and carries a 1–99 progression curve.
>
> **Rule:** No dead-end skill. Every skill must produce something another skill consumes, or consume something another skill produces.

---

## The 25 Skills

Old Town recognises four skill categories. Each skill has a kebab-case ID used in content definitions, item requirements, and quest prerequisites.

| Category | Skill | ID | Max Level | What It Governs |
|----------|-------|----|-----------|-----------------|
| **Combat** | Arms | `arms` | 99 | Melee accuracy, weapon access, weapon handling |
| **Combat** | Might | `might` | 99 | Melee damage, heavy weapons, carrying capacity |
| **Combat** | Guard | `guard` | 99 | Armour access, damage avoidance, block quality |
| **Combat** | Vitality | `vitality` | 99 | Health pool, survival, recovery scaling |
| **Combat** | Ranged | `ranged` | 99 | Bow, crossbow, thrown weapon accuracy and access |
| **Combat** | Magic | `magic` | 99 | Spellcasting, bead use, spell access |
| **Combat** | Favour | `favour` | 99 | Shrine boons, blessings, protections, oaths |
| **Gathering** | Mining | `mining` | 99 | Ores, stone, salt, glass sand, bead minerals |
| **Gathering** | Woodcutting | `woodcutting` | 99 | Logs, bow woods, carpentry timber, kindling |
| **Gathering** | Fishing | `fishing` | 99 | Fish, eels, shellfish, pearls, river curios |
| **Gathering** | Trapping | `trapping` | 99 | Hides, feathers, sinew, small beasts, trophies |
| **Gathering** | Gardening | `gardening` | 99 | Herbs, crops, mushrooms, flowers, dye plants |
| **Production** | Smithing | `smithing` | 99 | Melee weapons, metal armour, arrowheads, buckles |
| **Production** | Bowcraft | `bowcraft` | 99 | Bows, crossbows, arrows, bolts, thrown parts |
| **Production** | Tailoring | `tailoring` | 99 | Robes, ranged armour, capes, wraps, cloth gear |
| **Production** | Handicraft | `handicraft` | 99 | Jewellery, charms, keepsakes, rings, trophies |
| **Production** | Beadwork | `beadwork` | 99 | Spell beads, bead pouches, charmwards, foci |
| **Production** | Apothecary | `apothecary` | 99 | Potions, salves, oils, brews, poisons, antidotes |
| **Production** | Cooking | `cooking` | 99 | Food, combo food, preserves, pies, stews, teas |
| **Production** | Carpentry | `carpentry` | 99 | Homes, workshops, storage, stalls, furniture |
| **Utility** | Wayfaring | `wayfaring` | 99 | Shortcuts, roads, stamina, climbing, ferries |
| **Utility** | Sleight | `sleight` | 99 | Pickpocketing, stalls, locks, traps, forgery |
| **Utility** | Wardenry | `wardenry` | 99 | Bounties, monster contracts, dangerous creature access |
| **Utility** | Hearthcraft | `hearthcraft` | 99 | Fires, candles, camps, warmth, bead kiln work |
| **Utility** | Cartography | `cartography` | 99 | Maps, surveys, landmarks, route unlocks, hidden places |

*Total skills defined: 25*

---

## XP Curve

> **Tuning placeholder.** The exact XP values and curve shape are subject to simulation and playtest. Do not treat these as final design gospel.

Old Town uses the standard exponential curve. The jump between levels grows steeply after 90. Key milestones are shown below; the full curve is available in `POC_SPEC.md` §15.

| Level | XP Required | Cumulative XP | Notes |
|-------|------------|---------------|-------|
| 1 | 0 | 0 | Starting level |
| 2 | 83 | 83 | First action |
| 10 | 1,154 | 5,018 | Basic tools unlocked |
| 20 | 4,470 | 14,714 | Tier 3 items |
| 30 | 10,612 | 36,373 | Tier 5 items |
| 40 | 22,406 | 78,406 | Tier 7 items |
| 50 | 50,000 | 150,000 | Tier 8 items |
| 60 | 83,000 | 250,000 | Tier 9 items |
| 70 | 140,000 | 400,000 | Tier 10 items |
| 80 | 250,000 | 900,000 | Tier 11 items |
| 90 | 350,000 | 1,300,000 | Tier 12 items |
| 92 | 300,000 | 1,700,000 | Late-game milestone |
| 99 | 1,219,001 | 13,034,431 | Mastery threshold |

**Design note:** The curve is identical for all 25 skills. A player who reaches 99 in every skill will have earned approximately 325,860,775 XP total. There is no separate mastery XP beyond level 99.

---

## Item Equip Requirements

Skill levels gate equipment. The requirement formula differs by equipment type to match the existing tier system.

### Weapons and Armour

| Tier | Cultural Name | Required Level | Example |
|------|---------------|---------------|---------|
| 0 | Cobbled | 1 | `cobbled_sticker` |
| 1 | Pennywrought | 1 | `pennywrought_shortblade` |
| 2 | Pig Iron | 5 | `pig_iron_handaxe` |
| 3 | Bellmetal | 15 | `bellmetal_sabre` |
| 4 | Blackbar | 25 | `blackbar_greatblade` |
| 5 | Wardensteel | 35 | `wardensteel_cudgel` |
| 6 | Greenwold | 45 | `greenwold_spear` |
| 7 | Graveiron | 50 | `graveiron_longblade` |
| 8 | Blueglass | 65 | `blueglass_glaive` |
| 9 | Carmine Steel | 75 | `carmine_steel_maul` |
| 10 | Argent | 85 | `argent_billhook` |
| 11 | Crownsteel | 90 | `crownsteel_fellaxe` |
| 12 | Starfall | 99 | `starfall_greatblade` |

**Design note:** Weapon and armour equip requirements follow the table above. There is no single formula — the values are hand-tuned for gameplay pacing. Tier 7 (Graveiron) is the inflection point where melee equipment becomes elite.

### Gathering Tools

| Tier | Cultural Name | Required Level | Example |
|------|---------------|---------------|---------|
| 0 | Cobbled | 1 | `cobbled_axe` |
| 1 | Pennywrought | 1 | `pennywrought_pickaxe` |
| 2 | Pig Iron | 5 | `pig_iron_axe` |
| 3 | Bellmetal | 15 | `bellmetal_axe` |
| 4 | Blackbar | 25 | `blackbar_axe` |
| 5 | Wardensteel | 35 | `wardensteel_axe` |
| 6 | Greenwold | 45 | `greenwold_axe` |
| 7 | Graveiron | 55 | `graveiron_axe` |
| 8 | Blueglass | 65 | `blueglass_axe` |
| 9 | Carmine Steel | 75 | `carmine_steel_axe` |
| 10 | Argent | 85 | `argent_axe` |
| 11 | Crownsteel | 90 | `crownsteel_axe` |
| 12 | Starfall | 99 | `starfall_axe` |

**Design note:** Gathering tool requirements follow the table above. Tools require slightly more investment than weapons at equivalent tiers — a `graveiron_axe` needs 55 Woodcutting, while a `graveiron_longblade` needs 50 Arms.

### Accessories (Keepsakes)

Accessories use the band system, not the tier system. See `docs/accessory-tiers.md` for band names and equip requirements. All accessories are equippable from level 1; their power is determined by band, not by a hard level gate.

---

## Temporary Boosts

> **Tuning placeholder.** Boost values, durations, and caps are subject to simulation and playtest.

Players can temporarily raise skill levels above their base. Boosts are capped and do not stack beyond the cap.

| Boost Type | Source | Max Boost | Duration | Stacks? |
|------------|--------|-----------|----------|---------|
| **Potion** | Apothecary | +3 | 1 minute | No |
| **Food** | Cooking | +2 | 30 seconds | No |
| **Shrine** | Favour | +2 | 10 minutes | Yes, with potion |
| **Cape** | Handicraft | +1 | Permanent while worn | Yes, with others |
| **Total cap** | — | +5 | — | — |

**Rule:** A player with 50 Arms cannot boost above 55 Arms. A potion and a shrine boost do not stack if both are +2; the higher of the two applies. A cape bonus is always additive after the highest single boost.

---

## Mastery

Reaching level 99 in a skill grants Mastery. Mastery is a status, not a number.

| Mastery Benefit | Description |
|-----------------|-------------|
| **Mastery Keepsake** | A wearable item (cape, trophy, or charm) that grants a +1 boost to the mastered skill while worn. |
| **Emote** | A unique animation unlockable in the emote wheel. |
| **Title** | The player may display the skill title (e.g., "Smith" for Smithing 99). |
| **Guild Access** | Entry to the skill's master guild or workshop. |
| **Recipe Access** | A small number of post-99 recipes or items that require Mastery but not a level beyond 99. |

**Rule:** There is no level 100. Mastery is the end of the numeric track. Post-99 content is cosmetic, social, or convenience-based, not power-based.

---

## Training Methods and Risk/Reward

> **Tuning placeholder.** XP rates and risk/reward ratios are subject to simulation and playtest.

Every skill in Old Town offers multiple training paths. The choice between them is a risk/reward decision, not a railroad.

### AFK vs. Active Training

| Method | XP Rate | Attention | Risk | Best For |
|--------|---------|-----------|------|----------|
| **AFK** | Low (30–50% of max) | Minimal | None | Casual play, secondary tasks |
| **Active** | Medium (70–85% of max) | Moderate | Low | Standard training |
| **Intensive** | High (90–100% of max) | High | High | Dedicated sessions, boost stacking |
| **Tick-perfect** | Extreme (110–120% of max) | Extreme | Very high | Mastery push, competition |

**Rule:** No skill is purely AFK. Even the lowest-attention method requires some interaction (clicking, moving, or reacting to a prompt). Pure AFK is forbidden by design.

### Resource Competition

Higher-tier nodes are scarce. When multiple players compete for the same node:
- The first player to click the node claims it.
- Nodes have a respawn timer that scales with tier (Cobbled: 5 seconds, Starfall: 5 minutes).
- Some nodes are instanced per player (herb patches, farming allotments).
- Some nodes are shared-world and competitive (witchwood trees, starfall ore).

**Risk/Reward:** Competitive nodes yield 20% more XP per action but require waiting or world-hopping. Instanced nodes yield base XP but are always available.

### Random Events and Distractions

While training, players may encounter random events:
- **Stray creature:** A small beast appears. Killing it yields a small XP drop and a minor resource. Ignoring it yields nothing.
- **Node depletion:** A node breaks early, yielding a bonus resource but requiring the player to move.
- **Skill-specific challenge:** A timed prompt (e.g., "Strike the anvil now!" for Smithing) that rewards bonus XP for correct timing.

**Rule:** Random events are opt-in. A player can ignore them without penalty. They exist to break monotony, not to punish.

### Skill Outfits and Training Aids

> **Tuning placeholder.** XP aid values and stack rules are subject to simulation and playtest.

Beyond boosts, certain items increase base XP rate:
- **Skill outfits:** Full sets (head, chest, legs, feet, hands) that grant up to +10% total XP when the full set is worn. Crafted by Handicraft and Tailoring.
- **Training tools:** Special versions of standard tools (e.g., `golden_hammer` for Smithing) that grant +5% XP but degrade after a set number of uses. Crafted by the skill itself at mid-high levels.
- **Skill stations:** Player-owned workshop upgrades (Carpentry) that grant +5% XP in a specific skill while training inside the station.

**Rule:** No single training aid exceeds +15% base XP. They stack with temporary boosts but are multiplicative, not additive.

---

## Combat Level

> **Tuning placeholder.** The exact formula, weights, and bracket sizes are subject to simulation and playtest.

A player's combat level is calculated from their seven combat skills. It is displayed to other players and determines PvP combat brackets.

**Formula:**

Combat Level = floor( DefensiveBase / 4 + MeleePower × 13/40 + RangedPower × 13/40 + MagicPower × 13/40 )

Where:
- DefensiveBase = Defence + Hitpoints + floor(Prayer / 2)
- MeleePower = Attack + Strength
- RangedPower = floor(Ranged / 2) + Ranged
- MagicPower = floor(Magic / 2) + Magic

The final combat level is `floor(DefensiveBase / 4 + max(MeleePower, RangedPower, MagicPower) × 13/40)`.

All internal division uses integer division (fractions are discarded before the final floor).

**How to read it:**
- Defence, Hitpoints, and half of Prayer form the defensive base.
- Attack and Strength form the melee power component.
- Ranged and Magic each contribute 3/2 of their level (ranged and magic are more front-loaded).
- The highest of melee, ranged, or magic power is used — not all three added.

**Example:** A player with 50 Attack, 50 Strength, 50 Defence, 50 Hitpoints, 1 Ranged, 1 Magic, 1 Prayer has combat level:

| Step | Calculation | Result |
|------|-------------|--------|
| DefensiveBase | (50 + 50 + floor(1 / 2)) = 100 + 0 | 100 |
| MeleePower | (50 + 50) | 100 |
| RangedPower | floor(1 / 2) + 1 = 0 + 1 | 1 |
| MagicPower | floor(1 / 2) + 1 = 0 + 1 | 1 |
| Sum before floor | 100 / 4 + max(100, 1, 1) × 13/40 = 25 + 32.5 | 57.5 |
| Final | floor(57.5) | **57** |

**PvP bracket rule:** Players can only attack other players within 10 combat levels of themselves, unless both parties are in a designated PvP zone.

---

## Design Rules for Skills

1. **No dead-end skill.** Every skill must produce at least one of: material output, access output, efficiency output, combat output, economy output, or narrative output. Combat and Utility skills may unlock access or routes rather than producing raw materials.
2. **Content-driven.** Skill requirements, recipes, and unlocks are defined in JSON content files, not hardcoded.
3. **Repeated action XP.** Every skill is trained by doing the action, not by turning in items or completing quests.
4. **1–99 cap.** No skill exceeds level 99. No prestige system. Mastery is the end.
5. **Boost cap +5.** Temporary boosts never exceed +5 total. No skill can be boosted above 99.
6. **Tool requirements.** Every gathering and production action requires a tool. Tools have skill level requirements.
7. **Equip requirements.** Weapons and armour require combat skill levels. Accessories do not.
8. **Interlock first.** When adding a new skill, define its input and output connections before defining its internal mechanics.
9. **Familiar skeleton, Old Town skin.** Skill names are culturally grounded (Favour, Wayfaring) but the mechanics are recognizable to OSRS players.
10. **No non-combat skill is globally mandatory.** A player can ignore any gathering, production, or utility skill and still progress through combat, trade, exploration, and social content. Combat skills are mandatory only for combat progression, not for skilling or other paths. Ignoring a skill means missing synergies and efficiency, not being blocked.

---

## Related Documents

- [`00-index.md`](00-index.md) — Skills navigation hub
- [`combat-skills.md`](combat-skills.md) — Combat skill definitions
- [`gathering-skills.md`](gathering-skills.md) — Gathering skill definitions
- [`production-skills.md`](production-skills.md) — Production skill definitions
- [`utility-skills.md`](utility-skills.md) — Utility skill definitions
- [`skill-interlocks.md`](skill-interlocks.md) — Skill economy web

---

*Total skills defined: 25*
*Last updated: 2026-05-30*
