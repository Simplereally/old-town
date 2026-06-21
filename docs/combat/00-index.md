# Combat System Index

> **Entry point for all combat design documentation in Old Town.** Combat mechanics, weapon identities, and special abilities. This is the gameplay layer above the item inventory.

## Combat Documents

| Doc | Status | What is inside |
|-----|--------|----------------|
| [`signature-mechanics.md`](signature-mechanics.md) | Complete | Unique mechanics for every weapon family |
| [`mechanics-implementation.md`](mechanics-implementation.md) | Complete | Operational rules for every signature mechanic |

## Combat Design Philosophy

Combat in Old Town is not just about bigger numbers. Every weapon family must have a **reason to exist** beyond attack speed and damage stats. A Shortblade and a Sabre should feel different in play, not just in appearance.

**Key principles:**
- **Families have identities.** A Sticker is not a smaller Shortblade. It has a different job.
- **Mechanics are readable.** Players should be able to tell what a weapon does by looking at it.
- **Tiers amplify mechanics.** Higher tiers make the family identity stronger, not just bigger.
- **Tradeoffs are intentional.** Every advantage comes with a cost.

## Related Documents

- [`items/weapons/00-index.md`](../items/weapons/00-index.md) — Weapon inventory
- [`items/weapons/melee.md`](../items/weapons/melee.md) — Melee weapon families
- [`items/weapons/ranged.md`](../items/weapons/ranged.md) — Ranged weapon families
- [`items/weapons/magic.md`](../items/weapons/magic.md) — Magic weapon families
- [`melee-armour-tiers.md`](../melee-armour-tiers.md) — Melee tier system
- [`ranged-tiers.md`](../ranged-tiers.md) — Ranged weapon tier system
- [`magic-tiers.md`](../magic-tiers.md) — Magic tier system
- `POC_SPEC.md` §13 (Combat system)

---

*Last updated: 2026-05-30*
