---
doc_type: authority
canonical_path: docs/skills/combat-skills.md
parent_index: docs/skills/00-index.md
system_index: docs/skills/00-index.md
root_index: docs/00-index.md
---

Parent: [`Skills Index`](00-index.md)

Authority references:
- `docs/skills/skill-system.md`
- `docs/combat/signature-mechanics.md`
- `docs/combat/mechanics-implementation.md`
- `docs/items/00-index.md`
- `docs/favour/00-index.md`

# Combat Skills

> **The seven combat skills that define every player's fighting capability in Old Town.** Attack, Strength, Defence, Hitpoints, Ranged, Magic, and Favour form the complete combat identity. Each skill is trained through repeated combat action and carries a 1–99 progression curve.
>
> **Rule:** No combat skill is a dead end. Every skill feeds into equipment access, damage calculation, or survival.

---

## Attack

### What Attack Governs

Attack governs melee accuracy and determines which melee weapons a player can equip. Higher Attack means more hits land, and higher tiers of weapons become available.

### How to Train Attack

Attack is trained by dealing melee damage and successfully hitting targets. Every landed melee blow grants XP based on damage dealt.

### Key Unlocks

| Tier | Cultural Name | Required Level | Example Item |
|------|---------------|---------------|--------------|
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

**Example items:** `pennywrought_shortblade`, `bellmetal_sabre`, `graveiron_longblade`, and `starfall_greatblade`.

### Key Milestones

- Level 1: Cobbled and Pennywrought weapons available from the start.
- Level 50: Graveiron tier unlocked. This is the major midgame breakpoint.
- Level 99: Starfall weapons, the highest tier, become available.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Slash** | A sweeping blade attack | "Slash with the graveiron longblade" |
| **Lunge** | A thrusting strike | "Lunge with the bellmetal sabre" |
| **Parry** | Deflect an incoming blow | "Parry the drake's claw" |
| **Riposte** | Counter after a parry | "Riposte with the blueglass glaive" |
| **Cleave** | A wide, heavy swing | "Cleave through the warden's defence" |

---

## Strength

### What Strength Governs

Strength governs melee damage output and heavy weapon scaling. While Attack determines whether you hit, Strength determines how hard. Heavy weapons such as Mauls and Greatblades scale more with Strength than lighter weapons do.

### How to Train Strength

Strength is trained by dealing melee damage. The more damage you deal, the more Strength XP you earn.

### Key Unlocks

Strength uses the same tier scale as Attack, but the unlocks govern damage scaling rather than equip requirements. A player can equip a heavy weapon with sufficient Attack, but the weapon only reaches its full damage potential with sufficient Strength.

| Tier | Cultural Name | Required Level | Example Item |
|------|---------------|---------------|--------------|
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

**Heavy weapon example:** `carmine_steel_maul` requires Strength 75 to reach its full damage scaling.

### Key Milestones

- Level 1: All players deal base melee damage.
- Level 50: Graveiron-tier heavy weapons scale to their midgame potential.
- Level 99: Starfall heavy weapons reach their maximum damage output.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Smash** | A crushing overhead blow | "Smash with the carmine steel maul" |
| **Bludgeon** | A brutal, repeated strike | "Bludgeon the wyrm rib until it cracks" |
| **Heave** | A powerful, slow swing | "Heave the starfall greatblade" |
| **Sunder** | Break armour or bone | "Sunder the blackbar platecoat" |
| **Crush** | Compress and destroy | "Crush the drake's skull" |

---

## Defence

### What Defence Governs

Defence governs armour access and damage avoidance. Higher Defence unlocks heavier armour tiers and improves the chance to block or mitigate incoming damage.

### How to Train Defence

Defence is trained by taking damage and blocking hits. Every hit absorbed or blocked grants Defence XP.

### Key Unlocks

| Tier | Cultural Name | Required Level | Example Item |
|------|---------------|---------------|--------------|
| 0 | Cobbled | 1 | `cobbled_rags` |
| 1 | Pennywrought | 1 | `pennywrought_harness` |
| 2 | Pig Iron | 5 | `pig_iron_hauberk` |
| 3 | Bellmetal | 15 | `bellmetal_platecoat` |
| 4 | Blackbar | 25 | `blackbar_greathelm` |
| 5 | Wardensteel | 35 | `wardensteel_ward` |
| 6 | Greenwold | 45 | `greenwold_chausses` |
| 7 | Graveiron | 50 | `graveiron_platecoat` |
| 8 | Blueglass | 65 | `blueglass_greathelm` |
| 9 | Carmine Steel | 75 | `carmine_steel_hauberk` |
| 10 | Argent | 85 | `argent_platecoat` |
| 11 | Crownsteel | 90 | `crownsteel_ward` |
| 12 | Starfall | 99 | `starfall_greathelm` |

**Example items:** `pennywrought_harness`, `graveiron_platecoat`, and `starfall_greathelm`.

### Key Milestones

- Level 1: Cobbled and Pennywrought armour available from the start.
- Level 50: Graveiron armour unlocked. Major defensive breakpoint.
- Level 99: Starfall armour, the highest tier, becomes available.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Block** | Intercept a blow with shield or weapon | "Block the wyrm's tail lash" |
| **Brace** | Set yourself against impact | "Brace for the drake's charge" |
| **Deflect** | Turn aside a projectile | "Deflect the argent arrow" |
| **Shield** | Hide behind cover | "Shield behind the graveiron ward" |
| **Absorb** | Take damage and endure | "Absorb the blow, defence unbroken" |

---

## Hitpoints

### What Hitpoints Governs

Hitpoints governs health pool and survival. Every player benefits from Hitpoints regardless of equipment choices. Higher Hitpoints means more hit points and faster recovery scaling. New players start at Hitpoints level 1 with 10 HP.

### How to Train Hitpoints

Hitpoints is trained by taking damage and eating food. Survival actions and consumption both contribute to Hitpoints growth.

### Key Milestones

Hitpoints has no equipment requirements. All players benefit from its level automatically. Maximum health equals Hitpoints level × 10.

| Level | Hit Points | Notes |
|-------|-----------|-------|
| 1 | 10 | Starting health for new players |
| 10 | 100 | Early survival threshold |
| 50 | 500 | Midgame durability |
| 99 | 990 | Maximum health pool |

**Rule:** No armour or weapon requires Hitpoints. It is a passive survival skill.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Endure** | Survive damage without faltering | "Endure the drake's fire" |
| **Recover** | Heal through rest or food | "Recover by the hearth fire" |
| **Withstand** | Resist ongoing damage | "Withstand the wyrm's venom" |
| **Resist** | Reduce status effect impact | "Resist the curse of the oldroad" |
| **Survive** | Live through lethal damage | "Survive with a sliver of health" |

---

## Ranged

### What Ranged Governs

Ranged governs bow, crossbow, and thrown weapon accuracy. Higher Ranged means more projectiles hit their mark, and higher tiers of ranged weapons become available.

### How to Train Ranged

Ranged is trained by dealing ranged damage. Every projectile that hits a target grants Ranged XP based on damage dealt.

### Key Unlocks

| Tier | Cultural Name | Required Level | Example Item |
|------|---------------|---------------|--------------|
| 0 | Cobbled | 1 | `cobbled_shortbow` |
| 1 | Pennywrought | 1 | `pennywrought_shortbow` |
| 2 | Pig Iron | 5 | `pig_iron_longbow` |
| 3 | Bellmetal | 15 | `bellmetal_crossbow` |
| 4 | Blackbar | 25 | `blackbar_warbow` |
| 5 | Wardensteel | 35 | `wardensteel_crossbow` |
| 6 | Greenwold | 45 | `greenwold_longbow` |
| 7 | Graveiron | 50 | `graveiron_crossbow` |
| 8 | Blueglass | 65 | `blueglass_warbow` |
| 9 | Carmine Steel | 75 | `carmine_steel_longbow` |
| 10 | Argent | 85 | `argent_crossbow` |
| 11 | Crownsteel | 90 | `crownsteel_warbow` |
| 12 | Starfall | 99 | `starfall_warbow` |

**Example items:** `pennywrought_shortbow`, `graveiron_crossbow`, `starfall_warbow`, and `graveiron_knives` for thrown weapons.

### Key Milestones

- Level 1: Cobbled and Pennywrought ranged weapons available from the start.
- Level 50: Graveiron tier unlocked. Major ranged breakpoint.
- Level 99: Starfall ranged weapons become available.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Nock** | Fit an arrow to the bowstring | "Nock the witchwood arrow" |
| **Draw** | Pull the bowstring back | "Draw the graveiron crossbow" |
| **Loose** | Release the projectile | "Loose the arrow at the drake's eye" |
| **Fling** | Throw a knife or dart | "Fling the blueglass knife" |
| **Volley** | Fire multiple shots rapidly | "Volley into the wyrm's flank" |

---

## Magic

### What Magic Governs

Magic governs spellcasting, bead use, and spell access. Higher Magic unlocks more powerful spells and higher tiers of magic weapons and foci. Beads also require a minimum Magic level to use.

### How to Train Magic

Magic is trained by casting spells and dealing magic damage. Every spell cast and every point of magic damage dealt grants Magic XP.

### Key Unlocks

| Tier | Cultural Name | Required Level | Example Item |
|------|---------------|---------------|--------------|
| 0 | Cobbled | 1 | `cobbled_wand` |
| 1 | Pennywrought | 1 | `pennywrought_wand` |
| 2 | Pig Iron | 5 | `pig_iron_staff` |
| 3 | Bellmetal | 15 | `bellmetal_wand` |
| 4 | Blackbar | 25 | `blackbar_staff` |
| 5 | Wardensteel | 35 | `wardensteel_wand` |
| 6 | Greenwold | 45 | `greenwold_staff` |
| 7 | Graveiron | 50 | `graveiron_staff` |
| 8 | Blueglass | 65 | `blueglass_wand` |
| 9 | Carmine Steel | 75 | `carmine_steel_staff` |
| 10 | Argent | 85 | `argent_wand` |
| 11 | Crownsteel | 90 | `crownsteel_staff` |
| 12 | Starfall | 99 | `starfall_codex` |

**Example items:** `pennywrought_wand`, `graveiron_staff`, and `starfall_codex`.

**Bead requirements:** Beads require a Magic level to use. A tier 7 bead requires Magic 50, matching the Graveiron tier.

### Key Milestones

- Level 1: Basic spells and Cobbled magic weapons available.
- Level 50: Graveiron tier unlocked. Advanced spells and beads become usable.
- Level 99: Starfall magic weapons and the highest tier of beads available.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Invoke** | Call forth a spell | "Invoke the bead of warding" |
| **Channel** | Focus magic through a focus | "Channel through the carmine staff" |
| **Weave** | Combine multiple spell effects | "Weave the ward and the bolt together" |
| **Bind** | Trap a creature in magic | "Bind the drake with graveiron chains" |
| **Unleash** | Release a stored spell | "Unleash the starfall codex's fury" |

---

## Favour

### What Favour Governs

Favour governs shrine boons, blessings, protections, and oaths. It is the spiritual counterpart to the physical combat skills. Higher Favour unlocks stronger shrine effects and more powerful ritual outcomes.

Favour's shrine economy, offerings, rites, boons, wards, and oaths are defined in [`../favour/00-index.md`](../favour/00-index.md).

### How to Train Favour

Favour is trained by completing shrine rituals, burying remains, and using blessings. Every ritual action and every blessing consumed grants Favour XP.

### Key Milestones

Favour has no equipment requirements. All players benefit from its level automatically.

| Level | Unlock | Notes |
|-------|--------|-------|
| 1 | Basic blessings | Simple shrine boons available from the start |
| 25 | Mid-tier boons | Stronger ritual effects and protections |
| 50 | Advanced protections | Major defensive shrine abilities unlocked |
| 99 | Ultimate oath | The highest tier of shrine commitment |

**Favour points:** Favour points are a resource, like Prayer points in other games. Maximum Favour points equal Favour level multiplied by 10. A player with Favour 50 has 500 Favour points.

### Skill Verbs

| Verb | Meaning | Old Town Context |
|------|---------|------------------|
| **Bless** | Grant a shrine boon | "Bless the traveller at the crossroads shrine" |
| **Consecrate** | Sanctify ground or remains | "Consecrate the drake's bones" |
| **Invoke** | Call upon a shrine's power | "Invoke the warden's oath" |
| **Vow** | Swear a binding commitment | "Vow to protect the oldroad" |
| **Sanctify** | Purify an area of corruption | "Sanctify the bellmetal altar" |

---

## Combat Skill Summary

| Skill | ID | Primary Equipment | Equip Requirement |
|-------|----|-------------------|-------------------|
| Attack | `attack` | Melee weapons | Attack level |
| Strength | `strength` | Heavy weapon damage scaling | Strength level for scaling |
| Defence | `defence` | Armour | Defence level |
| Hitpoints | `hitpoints` | None | All players benefit |
| Ranged | `ranged` | Bows, crossbows, thrown weapons | Ranged level |
| Magic | `magic` | Magic weapons, beads, spells | Magic level |
| Favour | `favour` | None | All players benefit |

---

## Design Rules

1. **Combat skills train through combat.** Every combat skill is trained by doing the action, not by turning in items or completing quests.
2. **Attack for access, Strength for damage.** Attack unlocks weapons. Strength unlocks their full damage potential. A player needs both to be effective.
3. **Defence gates armour.** No armour is equippable without sufficient Defence. Heavy armour requires high Defence.
4. **Hitpoints and Favour are universal.** Every player benefits from these skills regardless of build. They have no equipment requirements.
5. **Heavy weapons favour Strength.** Mauls and Greatblades scale more with Strength than with Attack. A player with high Attack but low Strength will hit often but softly.
6. **Beads require Magic.** Every bead has a Magic level requirement. Beads are not usable by non-magic builds.
7. **Favour points are a resource.** Favour level determines maximum points, but points are spent and must be replenished through rituals.
8. **No combat skill is optional for full access.** A player who ignores any combat skill will miss equipment, damage, or survival potential.
9. **Combat level is public.** All seven skills feed into the combat level formula. Combat level determines PvP brackets.
10. **Boost cap applies.** Temporary boosts can raise combat skills, but never above 99 and never more than +5 total.

---

## Related Documents

- [`00-index.md`](00-index.md) — Skills navigation hub
- [`skill-system.md`](skill-system.md) — Core skill engine authority
- [`gathering-skills.md`](gathering-skills.md) — Gathering skill definitions
- [`production-skills.md`](production-skills.md) — Production skill definitions
- [`utility-skills.md`](utility-skills.md) — Utility skill definitions
- [`skill-interlocks.md`](skill-interlocks.md) — Skill economy web
- [`../favour/00-index.md`](../favour/00-index.md) — Favour and shrine economy

---

*Combat skills defined: 7*
*Last updated: 2026-05-30*
