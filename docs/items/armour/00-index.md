# Armour Index

> **Entry point for all armour documentation in Old Town.** This is the canonical index for armour. Navigate to the specific slot you need.

## Armour Slots

> **Counts are intentionally not hand-maintained in this index.** Navigate to the leaf documents for authoritative item tables.

### Melee Armour

| Slot | Doc | Notes |
|------|-----|-------|
| **Head** | [`head.md`](head.md) | Helm (light) and Greathelm (heavy) |
| **Chest** | [`chest.md`](chest.md) | Harness (plate), Hauberk (chain), Platecoat (heavy) |
| **Legs** | [`legs.md`](legs.md) | Chausses |
| **Feet** | [`feet.md`](feet.md) | Sabatons |
| **Hands** | [`hands.md`](hands.md) | Gauntlets |
| **Shield** | [`shield.md`](shield.md) | Ward |

### Magic Armour

| Slot | Doc | Notes |
|------|-----|-------|
| **Head** | [`cowl.md`](cowl.md) | Cowl (cloth hood) |
| **Chest** | [`robe.md`](robe.md) | Robe (cloth torso) |
| **Legs** | [`wraps.md`](wraps.md) | Wraps (cloth legs) |
| **Feet** | [`softshoes.md`](softshoes.md) | Softshoes (cloth feet) |
| **Hands** | [`cuffs.md`](cuffs.md) | Cuffs (cloth hands) |
| **Off-hand** | [`charmward.md`](charmward.md) | Charmward (defensive charm-board) |

### Ranged Armour

| Slot | Doc | Notes |
|------|-----|-------|
| **Head** | [`coif.md`](coif.md) | Coif (cloth hood) |
| **Chest** | [`jerkin.md`](jerkin.md) | Jerkin (light torso) |
| **Legs** | [`chaps.md`](chaps.md) | Chaps (leg coverings) |
| **Feet** | [`treads.md`](treads.md) | Treads (soft boots) |
| **Hands** | [`vambraces.md`](vambraces.md) | Vambraces (arm guards) |
| **Off-hand** | [`buckler.md`](buckler.md) | Buckler (small shield) |

## Armour System Overview

Armour is the secondary vehicle for player identity and power. Unlike weapons (which you actively wield), armour is passive protection that other players see constantly.

**Armour signals:**
- **Cobbled** = broke, lost, or just started
- **Pennywrought** = "I'm trying"
- **Bellmetal** = town-respected, established
- **Blackbar** = aggressive, PvP-ready
- **Wardensteel** = guard-aligned, disciplined
- **Blueglass** = magical, prestige
- **Carmine Steel** = war-tested, dangerous
- **Starfall** = endgame, mythic

## Chest Armour Tradeoff Matrix

| Situation | Harness | Hauberk | Platecoat |
|-----------|---------|---------|-----------|
| **Pure melee combat** | Okay | Good | Best |
| **Hybrid melee/magic** | Okay | Best | Bad |
| **Magic combat** | Good | Best | Bad |
| **Skilling/gathering** | Best | Good | Bad |
| **PvP** | Good | Best | Good |
| **Tanking** | Bad | Good | Best |
| **Run energy** | Best | Good | Bad |
| **Cost** | Cheap | Medium | Expensive |

## The "Full Penny" Set (Melee)

The canonical beginner melee armour set:

- `pennywrought_helm`
- `pennywrought_harness`
- `pennywrought_ward`
- `pennywrought_chausses`
- `pennywrought_sabatons`
- `pennywrought_gauntlets`

Players call this **"full penny"** or **"penny set."** It is the first social milestone.

Total defence: +18 (reasonable for early game)
Total cost: ~300 coins (affordable for beginners)

## The "Full Chalk" Set (Magic)

The canonical beginner magic armour set:

- `chalkmarked_cowl`
- `chalkmarked_robe`
- `chalkmarked_charmward`
- `chalkmarked_wraps`
- `chalkmarked_softshoes`
- `chalkmarked_cuffs`

Players call this **"full chalk"** or **"chalk set."** It is the magic starter milestone.

Total magic defence: +15 (reasonable for early game)
Total cost: ~250 coins (affordable for beginners)

## The "Full Patch" Set (Ranged)

The canonical beginner ranged armour set:

- `patchhide_coif`
- `patchhide_jerkin`
- `patchhide_chaps`
- `patchhide_vambraces`
- `patchhide_treads`
- `patchhide_buckler`

Players call this **"full patch"** or **"patch set."** It is the ranged armour starter milestone.

Total ranged defence: +15 (reasonable for early game)
Total cost: ~250 coins (affordable for beginners)

## Armour Set Bonuses

**Planned feature:** Wearing a full set of the same tier provides a small bonus.

| Set | Bonus | Description |
|-----|-------|-------------|
| **Full Pennywrought** | +1 Defence | "Cheap but reliable" |
| **Full Wardensteel** | +2 Defence, +1 Attack | "Guard discipline" |
| **Full Blackbar** | +3 Attack, -1 Defence | "Aggressive stance" |
| **Full Argent** | +2 Defence, +2 Magic | "Holy protection" |
| **Full Starfall** | +5 Defence, +3 Attack, +3 Magic | "Mythic resonance" |
| **Full Chalkmarked** | +1 Magic | "Apprentice spark" |
| **Full Warden Script** | +2 Magic, +1 Magic Defence | "Licensed caster" |
| **Full Blacksalt** | +3 Magic, -1 Magic Defence | "Aggressive casting" |
| **Full Argent Script** | +2 Magic Defence, +2 Magic | "Holy casting" |
| **Full Patchhide** | +1 Ranged | "Field-tested" |
| **Full Wardenhide** | +2 Ranged, +1 Ranged Defence | "Guard scout" |
| **Full Blackscale** | +3 Ranged, -1 Ranged Defence | "Aggressive stalker" |
| **Full Argentweave** | +2 Ranged Defence, +2 Ranged | "Holy scout" |

## Related Documents

- [`../accessories/00-index.md`](../accessories/00-index.md) — Accessories (capes, amulets, rings, charms, belts, trophies)
- [`../../melee-armour-tiers.md`](../../melee-armour-tiers.md) — Melee tier system philosophy
- [`../../ranged-armour-tiers.md`](../../ranged-armour-tiers.md) — Ranged armour tier system philosophy
- [`../../../POC_SPEC.md`](../../../POC_SPEC.md) §16 (Items, inventory, equipment)

## Design Rules

1. **Never use "platebody," "platelegs," "full helm" as base names.** Old Town owns its own terms: Harness, Chausses, Greathelm, Ward.
2. **Ward is the ownable term for shield.** "Shield" is generic. "Ward" is specific.
3. **Chest has three types for meaningful choice.** Harness (plate), Hauberk (chain), Platecoat (heavy plate). Each has tradeoffs.
4. **Tiers modify the base slot.** The slot defines the silhouette and weight. The tier defines the material and defence.
5. **Cobbled is the joke.** It should look like garbage and have terrible stats.
6. **Starfall is the mythic.** It should feel like a different material category.
7. **Greathelm has a magic penalty.** Enclosed vision reduces magic accuracy.
8. **Platecoat has a run energy penalty.** Heavy plate slows you down.
9. **Sabatons increase run energy.** Better boots help you run longer.
10. **Gauntlets increase attack.** Better grip helps weapon accuracy.
11. **Full set bonuses are small but noticeable.** They reward dedication without making mixed sets useless.

## Related Documents

- [`head.md`](head.md) — Head armour (melee)
- [`chest.md`](chest.md) — Chest armour (melee)
- [`legs.md`](legs.md) — Leg armour (melee)
- [`feet.md`](feet.md) — Foot armour (melee)
- [`hands.md`](hands.md) — Hand armour (melee)
- [`shield.md`](shield.md) — Shield armour (melee)
- [`cowl.md`](cowl.md) — Head armour (magic)
- [`robe.md`](robe.md) — Chest armour (magic)
- [`wraps.md`](wraps.md) — Leg armour (magic)
- [`cuffs.md`](cuffs.md) — Hand armour (magic)
- [`softshoes.md`](softshoes.md) — Foot armour (magic)
- [`charmward.md`](charmward.md) — Off-hand armour (magic)
- [`coif.md`](coif.md) — Head armour (ranged)
- [`jerkin.md`](jerkin.md) — Chest armour (ranged)
- [`chaps.md`](chaps.md) — Leg armour (ranged)
- [`vambraces.md`](vambraces.md) — Hand armour (ranged)
- [`treads.md`](treads.md) — Foot armour (ranged)
- [`buckler.md`](buckler.md) — Off-hand armour (ranged)
- [`melee-armour-tiers.md`](../../melee-armour-tiers.md) — Melee tier system philosophy
- [`ranged-armour-tiers.md`](../../ranged-armour-tiers.md) — Ranged armour tier system philosophy
- [`magic-tiers.md`](../../magic-tiers.md) — Magic tier system philosophy
- [`POC_SPEC.md`](../../../POC_SPEC.md) §16 (Items, inventory, equipment)

---

*This index is navigational; item tables in leaf documents are authoritative.*
