# Darts

> The fastest ranged weapon in Old Town. One-handed, short range, and built for delivering status rather than raw damage. Darts are cheap, disposable, and favoured by alchemists, rogues, and anyone who wants to poison something from five tiles away.

## Dart Family

- **Slot:** Weapon (one-handed)
- **Attack speed:** 3 ticks (fastest ranged)
- **Range:** 5 tiles
- **Hands:** 1H
- **Best for:** Status delivery, rapid poison application, one-handed ranged combat
- **Tradeoff:** Lowest ranged damage in the game, single-target only

### Signature Mechanic: Venom

Each dart has a **15% chance to apply poison** on hit. Poison lasts **3 ticks** and deals **2 damage per tick**.

Darts are not about the hit. They are about what the hit leaves behind.

## Tier Table

| Tier | Item ID | Name | Ranged Attack | Ranged Strength | Notes |
|------|---------|------|-------------|-----------------|-------|
| 0 | `cobbled_dart` | Cobbled Dart | +0 | +0 | Splintered stick, barely a point |
| 1 | `lathwood_dart` | Lathwood Dart | +1 | +0 | Pale cheap wood, first real dart |
| 2 | `bogwood_dart` | Bogwood Dart | +2 | +1 | Dark damp wood, swamp-forged |
| 3 | `bellhorn_dart` | Bellhorn Dart | +3 | +1 | Horn tip, town-forged, canonical |
| 4 | `blackstring_dart` | Blackstring Dart | +4 | +2 | Blackened, tarred tip, aggressive |
| 5 | `warden_yew_dart` | Warden Yew Dart | +5 | +2 | Guard-issue, blue-white, standard |
| 6 | `greenwold_dart` | Greenwold Dart | +6 | +3 | Green tip, forest ranger favourite |
| 7 | `gravebent_dart` | Gravebent Dart | +7 | +3 | Bone-white, crypt-looted, eerie |
| 8 | `blueglass_dart` | Blueglass Dart | +8 | +4 | Blue crystal tip, magical, rare |
| 9 | `carmine_ash_dart` | Carmine Ash Dart | +9 | +4 | Red lacquered, duelist's poison dart |
| 10 | `argentwood_dart` | Argentwood Dart | +10 | +5 | Silver tip, noble, clean poison |
| 11 | `crownhorn_dart` | Crownhorn Dart | +11 | +5 | Gold horn tip, royal, lethal elegance |
| 12 | `starfall_dart` | Starfall Dart | +12 | +6 | Meteor tip, mythic, poison from the sky |

## Design Notes

1. **Darts are the fastest ranged weapon.** At 3 ticks, they attack twice as fast as a Warbow and three times as fast as a Greatbow. The damage is deliberately low to compensate.
2. **Venom is the point.** The 15% poison chance means roughly one in seven darts applies a 6-damage poison over 3 ticks. Over a long fight, the poison adds up.
3. **Single-target only.** Darts cannot hit multiple enemies. They are precision tools for picking off one target at a time.
4. **Cheap and disposable.** Darts are meant to be crafted in bulk and thrown away. They are the ranged equivalent of a cheap dagger.
5. **One-handed freedom.** Because darts are 1H, they can be paired with a shield, a torch, or an off-hand item. This makes them ideal for defensive ranged builds.
6. **Status delivery.** Future dart variants may apply different status effects (slow, bleed, sleep). The base dart family is the poison standard.

## Related Documents

- [`ranged.md`](ranged.md) — All ranged weapons (bows and crossbows)
- [`melee.md`](melee.md) — Melee weapons
- [`magic.md`](magic.md) — Magic weapons (staves)
- [`signature-mechanics.md`](../../combat/signature-mechanics.md) — Weapon signature abilities
- [`ranged-tiers.md`](../../ranged-tiers.md) — Ranged tier system philosophy
- [`misc/ammunition.md`](../misc/ammunition.md) — Ammunition
- [`POC_SPEC.md`](../../POC_SPEC.md) §13 (Combat system)

---

*Total dart weapons defined: 13 (1 family × 13 tiers)*
*Total dart weapons planned: 13 (complete)*
