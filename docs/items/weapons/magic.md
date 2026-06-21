# Magic Weapons

> All magic weapons in Old Town. 6 weapon families (Wand, Staff, Rod, Focus, Primer, Codex), each with 13 tiers (0-12). Every weapon follows the magic tier system defined in [`magic-tiers.md`](../../magic-tiers.md).

## Tier System

| Order | Magic Tier | Shorthand | Speed | Magic Attack | Magic Strength | Notes |
|------|------------|-----------|-------|-------------|----------------|-------|
| 0 | Cobbled | cobbled | 4 ticks | +0 | +0 | Broken stick, literally |
| 1 | Chalkmarked | chalk | 4 ticks | +3 | +2 | Apprentice gear, first real |
| 2 | Tallowbound | tallow | 5 ticks | +6 | +4 | Candlewax seals, smoky |
| 3 | Bellwax | bellwax | 4 ticks | +9 | +6 | Brass clasps, golden wax |
| 4 | Blacksalt | blacksalt | 5 ticks | +12 | +8 | Black robes, salt sigils |
| 5 | Warden Script | warden | 4 ticks | +15 | +10 | Blue-white glyphs, licensed |
| 6 | Greenwold | greenwold | 5 ticks | +18 | +12 | Moss thread, living wood |
| 7 | Gravebound | grave | 4 ticks | +21 | +14 | Bone clasps, grey cloth |
| 8 | Blueglass | blueglass | 4 ticks | +24 | +16 | Blue crystal, polished |
| 9 | Carmine Ink | carmine | 5 ticks | +27 | +18 | Red ink, black vellum |
| 10 | Argent Script | argent | 4 ticks | +30 | +20 | Silver thread, pale robes |
| 11 | Crownvellum | crown | 5 ticks | +33 | +22 | Gold seals, royal scrollwork |
| 12 | Starfall | starfall | 4 ticks | +36 | +24 | Meteor dust, star-black |

**Note:** Attack speed is measured in ticks (600ms = 1 tick). Magic weapons are generally fast (4-5 ticks) but deal low melee damage. Their primary purpose is enabling spellcasting and providing magic bonuses.

## Weapon Families

### Wand

> Fast, one-handed magic weapon. Low melee damage, high magic accuracy. The canonical starter magic weapon.

- **Slot:** Weapon (one-handed)
- **Attack speed:** 4 ticks (fast)
- **Attack range:** 1 tile
- **Hands:** 1H
- **Best for:** Fast spellcasting, training, one-handed magic
- **Tradeoff:** Low melee damage, no bead savings

| Tier | Item ID | Name | Magic Attack | Magic Strength | Notes |
|------|---------|------|-------------|----------------|-------|
| 0 | `cobbled_wand` | Cobbled Wand | +0 | +0 | Twig with a bead glued to it |
| 1 | `chalkmarked_wand` | Chalkmarked Wand | +3 | +2 | First real wand, chalk-tipped |
| 2 | `tallowbound_wand` | Tallowbound Wand | +6 | +4 | Wax-sealed wand, smoky |
| 3 | `bellwax_wand` | Bellwax Wand | +9 | +6 | Brass-clasp wand, golden |
| 4 | `blacksalt_wand` | Blacksalt Wand | +12 | +8 | Black wand, salt sigils |
| 5 | `warden_script_wand` | Warden Script Wand | +15 | +10 | Blue-white wand, licensed |
| 6 | `greenwold_wand` | Greenwold Wand | +18 | +12 | Moss wand, living wood |
| 7 | `gravebound_wand` | Gravebound Wand | +21 | +14 | Bone wand, grey cloth |
| 8 | `blueglass_wand` | Blueglass Wand | +24 | +16 | Blue crystal wand, polished |
| 9 | `carmine_ink_wand` | Carmine Ink Wand | +27 | +18 | Red ink wand, vellum |
| 10 | `argent_script_wand` | Argent Script Wand | +30 | +20 | Silver wand, pale robes |
| 11 | `crownvellum_wand` | Crownvellum Wand | +33 | +22 | Gold wand, royal scrollwork |
| 12 | `starfall_wand` | Starfall Wand | +36 | +24 | Meteor wand, star-black |

### Staff

> Two-handed magic weapon. Provides unlimited elemental beads while equipped. Slower than wand, but saves beads.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 5 ticks
- **Attack range:** 1 tile
- **Hands:** 2H
- **Best for:** Mid-level magic, bead savings, sustained spellcasting
- **Tradeoff:** Cannot use off-hand item or shield
- **Special:** Provides unlimited elemental beads of one type (Gust, Tide, Loam, or Ember) depending on staff type

| Tier | Item ID | Name | Magic Attack | Magic Strength | Notes |
|------|---------|------|-------------|----------------|-------|
| 0 | `cobbled_staff` | Cobbled Staff | +0 | +0 | Stick with a bead on top |
| 1 | `chalkmarked_staff` | Chalkmarked Staff | +4 | +3 | First real staff, chalk-tipped |
| 2 | `tallowbound_staff` | Tallowbound Staff | +8 | +6 | Wax-sealed staff, smoky |
| 3 | `bellwax_staff` | Bellwax Staff | +12 | +9 | Brass-clasp staff, golden |
| 4 | `blacksalt_staff` | Blacksalt Staff | +16 | +12 | Black staff, salt sigils |
| 5 | `warden_script_staff` | Warden Script Staff | +20 | +15 | Blue-white staff, licensed |
| 6 | `greenwold_staff` | Greenwold Staff | +24 | +18 | Moss staff, living wood |
| 7 | `gravebound_staff` | Gravebound Staff | +28 | +21 | Bone staff, grey cloth |
| 8 | `blueglass_staff` | Blueglass Staff | +32 | +24 | Blue crystal staff, polished |
| 9 | `carmine_ink_staff` | Carmine Ink Staff | +36 | +27 | Red ink staff, vellum |
| 10 | `argent_script_staff` | Argent Script Staff | +40 | +30 | Silver staff, pale robes |
| 11 | `crownvellum_staff` | Crownvellum Staff | +44 | +33 | Gold staff, royal scrollwork |
| 12 | `starfall_staff` | Starfall Staff | +48 | +36 | Meteor staff, star-black |

### Rod (Battle Staff)

> Two-handed melee/magic hybrid. Can cast spells and melee attack. Jack of all trades, master of none.

- **Slot:** Weapon (two-handed)
- **Attack speed:** 5 ticks
- **Attack range:** 1 tile
- **Hands:** 2H
- **Best for:** Hybrid combat, spell-and-melee, flexibility
- **Tradeoff:** Lower magic bonuses than staff, lower melee than melee weapons
- **Special:** Provides unlimited elemental beads (weaker than staff, but allows melee)

| Tier | Item ID | Name | Magic Attack | Magic Strength | Melee Attack | Notes |
|------|---------|------|-------------|----------------|-------------|-------|
| 0 | `cobbled_rod` | Cobbled Rod | +0 | +0 | +0 | Heavy stick, barely a weapon |
| 1 | `chalkmarked_rod` | Chalkmarked Rod | +3 | +2 | +3 | First hybrid rod, chalk-tipped |
| 2 | `tallowbound_rod` | Tallowbound Rod | +6 | +4 | +6 | Wax-sealed rod, smoky |
| 3 | `bellwax_rod` | Bellwax Rod | +9 | +6 | +9 | Brass-clasp rod, golden |
| 4 | `blacksalt_rod` | Blacksalt Rod | +12 | +8 | +12 | Black rod, salt sigils |
| 5 | `warden_script_rod` | Warden Script Rod | +15 | +10 | +15 | Blue-white rod, licensed |
| 6 | `greenwold_rod` | Greenwold Rod | +18 | +12 | +18 | Moss rod, living wood |
| 7 | `gravebound_rod` | Gravebound Rod | +21 | +14 | +21 | Bone rod, grey cloth |
| 8 | `blueglass_rod` | Blueglass Rod | +24 | +16 | +24 | Blue crystal rod, polished |
| 9 | `carmine_ink_rod` | Carmine Ink Rod | +27 | +18 | +27 | Red ink rod, vellum |
| 10 | `argent_script_rod` | Argent Script Rod | +30 | +20 | +30 | Silver rod, pale robes |
| 11 | `crownvellum_rod` | Crownvellum Rod | +33 | +22 | +33 | Gold rod, royal scrollwork |
| 12 | `starfall_rod` | Starfall Rod | +36 | +24 | +36 | Meteor rod, star-black |

### Focus (Orb)

> Off-hand magic focus. Boosts magic accuracy and strength. Wielded with a wand or staff for dual magic.

- **Slot:** Off-hand (one-handed)
- **Attack speed:** N/A (off-hand)
- **Hands:** 1H (off-hand)
- **Best for:** Magic accuracy boost, dual-wielding magic
- **Tradeoff:** No melee stats, no bead savings
- **Special:** Must be paired with a wand or rod for full effect

| Tier | Item ID | Name | Magic Attack | Magic Strength | Notes |
|------|---------|------|-------------|----------------|-------|
| 0 | `cobbled_focus` | Cobbled Focus | +0 | +0 | Pebble, barely magical |
| 1 | `chalkmarked_focus` | Chalkmarked Focus | +2 | +1 | Slate bead, first focus |
| 2 | `tallowbound_focus` | Tallowbound Focus | +4 | +2 | Glass bead, smoky |
| 3 | `bellwax_focus` | Bellwax Focus | +6 | +3 | Brass bead, golden |
| 4 | `blacksalt_focus` | Blacksalt Focus | +8 | +4 | Black bead, salt sigils |
| 5 | `warden_script_focus` | Warden Script Focus | +10 | +5 | Blue-white bead, licensed |
| 6 | `greenwold_focus` | Greenwold Focus | +12 | +6 | Green bead, moss |
| 7 | `gravebound_focus` | Gravebound Focus | +14 | +7 | Bone bead, grey |
| 8 | `blueglass_focus` | Blueglass Focus | +16 | +8 | Blue crystal bead, polished |
| 9 | `carmine_ink_focus` | Carmine Ink Focus | +18 | +9 | Red ink bead, vellum |
| 10 | `argent_script_focus` | Argent Script Focus | +20 | +10 | Silver bead, pale |
| 11 | `crownvellum_focus` | Crownvellum Focus | +22 | +11 | Gold bead, royal |
| 12 | `starfall_focus` | Starfall Focus | +24 | +12 | Meteor bead, star-black |

### Primer (Spellbook)

> Low-level spellbook. Holds basic spells. Required for casting. The canonical starter spellbook.

- **Slot:** Off-hand (one-handed) or carried
- **Attack speed:** N/A (spellbook)
- **Hands:** 1H (or carried)
- **Best for:** Holding low-level spells, training, starter magic
- **Tradeoff:** Cannot hold advanced spells, takes up off-hand slot
- **Special:** Required for casting spells. Each Primer holds up to 5 spells.

| Tier | Item ID | Name | Magic Attack | Magic Strength | Notes |
|------|---------|------|-------------|----------------|-------|
| 0 | `cobbled_primer` | Cobbled Primer | +0 | +0 | Scrap paper, illegible |
| 1 | `chalkmarked_primer` | Chalkmarked Primer | +2 | +1 | First real spellbook, chalk |
| 2 | `tallowbound_primer` | Tallowbound Primer | +4 | +2 | Wax-sealed pages, smoky |
| 3 | `bellwax_primer` | Bellwax Primer | +6 | +3 | Brass-bound, golden |
| 4 | `blacksalt_primer` | Blacksalt Primer | +8 | +4 | Black pages, salt sigils |
| 5 | `warden_script_primer` | Warden Script Primer | +10 | +5 | Blue-white glyphs, licensed |
| 6 | `greenwold_primer` | Greenwold Primer | +12 | +6 | Moss pages, living wood |
| 7 | `gravebound_primer` | Gravebound Primer | +14 | +7 | Bone pages, grey cloth |
| 8 | `blueglass_primer` | Blueglass Primer | +16 | +8 | Blue crystal pages, polished |
| 9 | `carmine_ink_primer` | Carmine Ink Primer | +18 | +9 | Red ink, black vellum |
| 10 | `argent_script_primer` | Argent Script Primer | +20 | +10 | Silver pages, pale robes |
| 11 | `crownvellum_primer` | Crownvellum Primer | +22 | +11 | Gold pages, royal scrollwork |
| 12 | `starfall_primer` | Starfall Primer | +24 | +12 | Meteor pages, star-black |

### Codex (Higher Spellbook)

> High-level spellbook. Holds advanced spells. Required for high-tier magic.

- **Slot:** Off-hand (one-handed) or carried
- **Attack speed:** N/A (spellbook)
- **Hands:** 1H (or carried)
- **Best for:** Holding advanced spells, endgame magic
- **Tradeoff:** Requires higher Magic level, takes up off-hand slot
- **Special:** Required for casting advanced spells. Each Codex holds up to 10 spells.

| Tier | Item ID | Name | Magic Attack | Magic Strength | Notes |
|------|---------|------|-------------|----------------|-------|
| 0 | `cobbled_codex` | Cobbled Codex | +0 | +0 | Tattered pages, barely held |
| 1 | `chalkmarked_codex` | Chalkmarked Codex | +3 | +2 | First real codex, chalk |
| 2 | `tallowbound_codex` | Tallowbound Codex | +6 | +4 | Wax-sealed pages, smoky |
| 3 | `bellwax_codex` | Bellwax Codex | +9 | +6 | Brass-bound, golden |
| 4 | `blacksalt_codex` | Blacksalt Codex | +12 | +8 | Black pages, salt sigils |
| 5 | `warden_script_codex` | Warden Script Codex | +15 | +10 | Blue-white glyphs, licensed |
| 6 | `greenwold_codex` | Greenwold Codex | +18 | +12 | Moss pages, living wood |
| 7 | `gravebound_codex` | Gravebound Codex | +21 | +14 | Bone pages, grey cloth |
| 8 | `blueglass_codex` | Blueglass Codex | +24 | +16 | Blue crystal pages, polished |
| 9 | `carmine_ink_codex` | Carmine Ink Codex | +27 | +18 | Red ink, black vellum |
| 10 | `argent_script_codex` | Argent Script Codex | +30 | +20 | Silver pages, pale robes |
| 11 | `crownvellum_codex` | Crownvellum Codex | +33 | +22 | Gold pages, royal scrollwork |
| 12 | `starfall_codex` | Starfall Codex | +36 | +24 | Meteor pages, star-black |

## Magic Weapon Comparison by Playstyle

| Playstyle | Recommended Weapon | Tier | Why |
|-----------|-------------------|------|-----|
| **Fast spellcasting** | Wand | Any | Fast attack speed, one-handed |
| **Bead savings** | Staff | Any | Unlimited elemental beads, sustained casting |
| **Hybrid combat** | Rod | Any | Melee + magic, flexible |
| **Magic accuracy** | Focus + Wand | Any | Dual-wield magic, accuracy boost |
| **Starter magic** | Primer + Wand | Chalkmarked | Cheap, fast, first real magic |
| **Advanced spells** | Codex + Staff | High tier | Holds advanced spells, high magic bonuses |
| **Endgame** | Codex + Wand + Focus | Starfall | Maximum magic accuracy and strength |

## Design Rules

1. **Magic weapons are fast but weak in melee.** They are spellcasting tools, not melee weapons.
2. **Staves provide unlimited elemental beads.** This is their defining advantage.
3. **Rods are hybrids.** They can melee and cast, but are worse at both than dedicated weapons.
4. **Primers and Codices are spellbooks.** They are required for casting spells and provide magic bonuses.
5. **Focus is the off-hand magic item.** It boosts accuracy and strength when paired with a wand.
6. **Never use "magic staff", "spellbook", "orb" as generic names.** Use Staff, Primer, Codex, Focus.
7. **Tiers are cultural, not elemental.** Chalkmarked is apprentice-made. Warden Script is regulated. Starfall is cosmic.
8. **Cobbled is the joke.** Tutorial magic gear should look like literal garbage.
9. **Starfall is the mythic.** It should feel like a different material category.
10. **Magic requires beads.** No beads, no spells. Bead management is core to the magic experience.

## Related Documents

- [`melee.md`](melee.md) — Melee weapons
- [`ranged.md`](ranged.md) — Ranged weapons
- [`magic-tiers.md`](../../magic-tiers.md) — Magic tier system philosophy
- [`items/armour/00-index.md`](../armour/00-index.md) — Armour overview (includes magic armour)
- [`POC_SPEC.md`](../../POC_SPEC.md) §13 (Combat system)

---

*Total magic weapons defined: 78 (6 families × 13 tiers)*
