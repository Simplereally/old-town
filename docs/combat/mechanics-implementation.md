# Combat Mechanics Implementation

> **Purpose:** This document converts every signature weapon mechanic from `signature-mechanics.md` into a complete, implementable rule set. It is the operational design authority that a designer hands to an engineer. Every field below must be present in the engine.
>
> **Rule:** If a mechanic is not defined here, it does not exist in code. No assumptions. No placeholders.

---

## Melee Mechanics

### Sticker — Backstab

- **Trigger condition:** The attacker is positioned on a tile that is behind the target's facing direction, OR the target is currently engaged in combat with another player (has dealt or received damage from a different player within the last 10 ticks).
- **Effect:** The attack deals +15% damage. This is a flat multiplicative bonus applied after accuracy and defence rolls, before damage reduction.
- **Cooldown or proc frequency:** Every qualifying hit. No cooldown. No internal limit.
- **Scaling stat:** The bonus scales with the weapon's tier base damage. It does not scale with any player stat beyond standard Strength contribution.
- **Counterplay:** Targets can prevent Backstab by never turning their back to a Sticker user, by fighting alone (no third-party engagement), or by using a shield to reduce overall incoming damage. In group fights, maintaining facing is difficult, which is the intended risk.
- **PvE behaviour:** Monsters have a fixed facing direction unless they are programmed to turn. Most NPCs turn to face their current target, so Backstab requires a second player or a flank. Against static-facing enemies, Backstab is always active from behind.
- **PvP behaviour:** The engagement check is server-authoritative. If the target has been in combat with any other player within the last 10 ticks, the Sticker user gets the bonus regardless of facing. This punishes players who try to run past a fight.
- **UI feedback:** A small red dagger icon flashes above the target on Backstab hits. The combat log reads "Backstab!" in red text. The damage number is tinted slightly darker.
- **Balance risk:** In large group PvP, every Sticker user gets Backstab on any target already fighting. This could make Stickers mandatory in zergs. Mitigation: the very low base damage means a Sticker without Backstab is worse than a Shortblade.
- **Example item:** Iron Sticker (tier 5, 1H, 4 ticks, 1 tile).

### Shortblade — Reliable

- **Trigger condition:** Every attack roll made with a Shortblade.
- **Effect:** Damage variance is halved. Instead of rolling between 0% and 100% of max hit, the Shortblade rolls between 25% and 75% of max hit. The average damage is identical, but the standard deviation is cut in half.
- **Cooldown or proc frequency:** Passive. Applies to every hit.
- **Scaling stat:** Standard Strength and weapon tier. The mechanic only affects the variance roll, not the max hit calculation.
- **Counterplay:** There is no direct counterplay to Reliable because it is not a proc. However, the lack of burst means a Shortblade user cannot spike-damage through a heal or a shield block. Opponents can time their recovery knowing the damage is predictable.
- **PvE behaviour:** Against monsters with high defence, the floor of 25% means fewer zeroes than other weapons. Against low-defence monsters, the ceiling of 75% means fewer max hits. It is a consistency tool, not a DPS tool.
- **PvP behaviour:** In PvP, Reliable removes the "luck factor" from duels. A Shortblade duel is decided by stats and timing, not by a single 95-damage crit. This is attractive to risk-averse players but boring to gamblers.
- **UI feedback:** Damage numbers from Shortblades are always white (never yellow crit, never grey zero). The combat log does not call out the mechanic; it is silent by design.
- **Balance risk:** If the variance floor is too high, Shortblades become strictly better than Longblades against high-defence targets. The 25% floor must stay below the average expected hit of a Longblade against the same target.
- **Example item:** Steel Shortblade (tier 10, 1H, 5 ticks, 1 tile).

### Longblade — Balanced

- **Trigger condition:** N/A. The Longblade has no signature mechanic. It is the baseline reference weapon.
- **Effect:** No special effect. The Longblade uses standard combat formulas with no bonuses, no penalties, and no procs.
- **Cooldown or proc frequency:** N/A.
- **Scaling stat:** Standard Strength and weapon tier only.
- **Counterplay:** The Longblade has no special weaknesses to exploit, but it also has no special strengths to leverage. It is the "average" against which all other weapons are measured.
- **PvE behaviour:** Performs exactly as expected from its stats. No surprises, no spikes, no utility. It is the training-wheels weapon for learning standard combat.
- **PvP behaviour:** In PvP, the Longblade is predictable. A skilled opponent knows exactly what it can do — which is nothing unexpected. This makes it safe for beginners but outmaneuvered by specialists.
- **UI feedback:** No special UI. The Longblade is visually and audibly the "standard" melee weapon. All feedback is default.
- **Balance risk:** If the Longblade's stats are too high, it becomes the default choice for everyone because it has no tradeoff. It must remain strictly average in raw stats to preserve the identity of other families.
- **Example item:** Steel Longblade (tier 10, 1H, 5 ticks, 1 tile). The canonical "reference" weapon.

### Greatblade — Cleave

- **Trigger condition:** On every successful melee hit, roll a 15% chance. If successful, check for a second valid target adjacent to the primary target (within 1 tile, not the attacker).
- **Effect:** A second attack roll is made against the adjacent target at 50% of the weapon's max hit. This is a separate accuracy and damage roll. It can miss, and it respects the target's defence.
- **Cooldown or proc frequency:** 15% chance per hit. No cooldown. Can chain (two Cleaves in a row are possible, though unlikely).
- **Scaling stat:** The Cleave hit uses 50% of the attacker's max hit, which scales with Strength and weapon tier.
- **Counterplay:** Fight alone. Cleave only triggers if a second target is adjacent to the primary target. In a 1v1, Cleave never procs. Ranged attackers and isolated duelists are immune.
- **PvE behaviour:** Against monster groups (e.g., goblin packs), Cleave is a significant DPS increase. Against single bosses, it is a dead mechanic. This creates a clear niche: Greatblades are for slayer tasks and multi-combat zones.
- **PvP behaviour:** In multi-combat PvP, a Greatblade user can accidentally hit a nearby friend. The Cleave target is the closest adjacent enemy; if multiple exist, pick one at random. This makes Greatblades risky in mixed fights.
- **UI feedback:** A yellow arc animation sweeps from the primary target to the secondary target. The combat log reads "Cleave!" and shows two damage numbers.
- **Balance risk:** If Cleave can hit the same target twice, it becomes a 15% DPS increase even in 1v1. The engine must enforce that the secondary target is a different entity. Also, Cleave hitting friends in PvP could be exploited for griefing; the mechanic should only target enemies.
- **Example item:** Steel Greatblade (tier 10, 2H, 6 ticks, 1 tile).

### Sabre — Slash Frenzy

- **Trigger condition:** The player lands three consecutive melee hits on the same target without missing. The counter resets if the player misses, switches targets, or does not attack for 10 ticks.
- **Effect:** Upon the third consecutive hit, the player gains +10% attack speed for the next 5 ticks (meaning the next 1-2 attacks, depending on base speed). This reduces a 5-tick Sabre to 4 ticks for the duration.
- **Cooldown or proc frequency:** Triggered every third consecutive hit. The speed buff lasts 5 ticks. There is no cooldown between activations; if the player maintains the chain, every third hit re-triggers the buff.
- **Scaling stat:** The speed buff is flat; it does not scale with stats. However, the DPS gain scales with the weapon's base damage because more attacks per tick means more damage output.
- **Counterplay:** Break the chain. Use defence, dodge, or movement to force a miss. Switching targets also resets the counter, so kiting or adding a second melee opponent disrupts the rhythm. High-defence armour makes the third hit less likely to land.
- **PvE behaviour:** Against low-defence monsters, Slash Frenzy is nearly permanent. Against high-defence monsters, the chain breaks often and the mechanic is unreliable. This makes Sabres excellent for training on weak enemies but mediocre for bossing.
- **PvP behaviour:** In PvP, a Sabre user wants to commit to one target and stay in range. A single forced miss (shield block, high defence, or the target stepping away) resets the chain. This rewards patience and punishes greed.
- **UI feedback:** A small flame icon appears above the player's head for the duration of the buff. The attack animation plays slightly faster. The combat log reads "Frenzy!" on activation.
- **Balance risk:** If the buff duration is too long, a Sabre user can maintain infinite speed. The 5-tick duration is intentionally shorter than the time needed to land 3 hits at base speed, so the buff only covers 1-2 attacks before the chain must be rebuilt. Also, if the speed reduction stacks with other haste effects, it could break tick boundaries. Sabre Frenzy must not stack with other attack speed buffs.
- **Example item:** Steel Sabre (tier 10, 1H, 5 ticks, 1 tile).

### Handaxe — Armour Chip

- **Trigger condition:** Every successful hit with a Handaxe against a target wearing armour.
- **Effect:** The target's equipped armour loses 1 durability point. This stacks with every hit. When armour durability reaches zero, the armour piece breaks and is removed from the slot (or becomes cosmetic-only, depending on breakage rules).
- **Cooldown or proc frequency:** Every hit. No cooldown. No chance roll. Guaranteed on every successful hit.
- **Scaling stat:** None. The durability loss is flat. The mechanic's power is in its consistency, not its scaling.
- **Counterplay:** Do not wear armour. Against an unarmoured target, Armour Chip does nothing. Alternatively, use high-defence armour that takes longer to break, or repair armour between fights. In PvP, switching to a spare armour piece after the first breaks is a valid tactic.
- **PvE behaviour:** Against monsters with armour (e.g., armoured skeletons, knights), the Handaxe degrades their protection over a long fight. Against unarmoured monsters (e.g., wolves, goblins), the Handaxe is just a low-damage axe. This makes it a specialist weapon for specific slayer tasks.
- **PvP behaviour:** In extended PvP duels, a Handaxe user can break an opponent's Platecoat in 50-100 hits, depending on the armour's durability. This makes the Handaxe a support weapon in group fights: it softens the target for the team's heavy hitters.
- **UI feedback:** A small chip icon appears on the target's armour slot in the UI (visible to the attacker only). The combat log reads "Armour chipped!" every 5th hit to reduce spam. When armour breaks, a loud crack sound plays and a broken shield icon appears.
- **Balance risk:** If durability values are too low, Handaxes become mandatory in PvP because they destroy gear faster than it can be repaired. If too high, the mechanic is irrelevant. The 1-point-per-hit rate must be tuned against average armour durability (target: 50-100 hits to break a mid-tier piece). Also, Armour Chip must not work on cosmetic or untradeable items.
- **Example item:** Steel Handaxe (tier 10, 1H, 5 ticks, 1 tile).

### Fellaxe — Fell

- **Trigger condition:** The target's current HP is above 50% of their maximum HP.
- **Effect:** The attack deals +25% damage. This is a multiplicative bonus applied after the standard damage roll.
- **Cooldown or proc frequency:** Every hit while the target is above 50% HP. The bonus disappears instantly when the target drops to 50% or below.
- **Scaling stat:** The bonus scales with the weapon's base damage and the attacker's Strength, because it is a percentage of the final damage roll.
- **Counterplay:** Heal above 50% to deny the execute window. Alternatively, burst the Fellaxe user before they can land enough hits. The Fellaxe is slow (6 ticks), so a faster weapon can out-DPS it in the opening phase.
- **PvE behaviour:** Against monsters with large HP pools, Fell is active for the first half of the fight. This makes Fellaxes excellent for opening damage but weak for finishing. Against low-HP monsters, Fell is always active, making it a consistent farming tool.
- **PvP behaviour:** In PvP, a Fellaxe user wants to deal as much damage as possible before the target heals. If the target can heal above 50% repeatedly, Fell becomes a yo-yo mechanic. This creates a healing race: can the target out-heal the 25% bonus?
- **UI feedback:** The damage number is tinted red while Fell is active. When the target drops below 50%, the tint disappears and a small "Fell" debuff icon vanishes from the target's status bar.
- **Balance risk:** If combined with a team that can keep the target above 50% indefinitely (e.g., a healer), Fell becomes a permanent 25% damage buff. This is intended team synergy but must not be exploitable in 1v1. Also, if the 50% threshold is checked after damage application, the last hit that drops the target below 50% still gets the bonus, which is correct and intended.
- **Example item:** Steel Fellaxe (tier 10, 2H, 6 ticks, 1 tile).

### Cudgel — Stagger

- **Trigger condition:** Every third consecutive hit on the same target. The counter resets on miss, target switch, or 10 ticks without attacking.
- **Effect:** The third hit has a 25% chance to stun the target for 1 tick (600ms). A stunned target cannot act, move, or attack during that tick.
- **Cooldown or proc frequency:** 25% chance on every third hit. No additional cooldown. If the stun procs, the counter resets to zero.
- **Scaling stat:** None. The stun duration is flat. The proc chance is flat. The mechanic's value is in the interrupt, not the damage.
- **Counterplay:** Break the chain before the third hit. Use high defence to force misses. Step away during the second hit to reset the counter. In PvP, a shield block on the second or third hit resets the chain. The stun is only 1 tick, so it is a rhythm breaker, not a lockdown.
- **PvE behaviour:** Against spellcasting monsters, Stagger can interrupt a cast if it procs on the tick before the spell fires. Against melee monsters, it delays their next attack by 1 tick. Against bosses, the stun may be immune (boss stun immunity is a separate system).
- **PvP behaviour:** In PvP, Stagger is strongest against slow weapons and casters. A Maul user (7 ticks) loses an entire attack cycle to a 1-tick stun. A crossbow user loses their reload window. Against fast weapons (e.g., Sticker, 4 ticks), the stun is less impactful because they attack again almost immediately.
- **UI feedback:** A white starburst appears above the stunned target's head. The target's animation freezes for 1 tick. The combat log reads "Staggered!" in yellow.
- **Balance risk:** Chain-stunning is the primary risk. If two Cudgel users alternate hits on the same target, they could theoretically maintain a stun lock. The engine must enforce a global stun immunity of at least 3 ticks after any stun ends. Also, Stagger must not work on targets already stunned or on bosses with stun immunity.
- **Example item:** Steel Cudgel (tier 10, 1H, 5 ticks, 1 tile).

### Maul — Crush

- **Trigger condition:** Every successful hit with a Maul.
- **Effect:** The attack ignores 30% of the target's armour defence value. This is applied before the accuracy roll, not as damage penetration. The target's effective defence is reduced by 30% for this attack only.
- **Cooldown or proc frequency:** Passive. Every hit.
- **Scaling stat:** The value of Crush scales with the target's armour defence. Against unarmoured targets, Crush does nothing. Against heavily armoured targets, it is a massive accuracy boost.
- **Counterplay:** Do not wear armour. Against a target with 0 defence, Crush is a dead mechanic. Alternatively, use evasion or dodge mechanics (if they exist) because Crush only affects armour defence, not evasion.
- **PvE behaviour:** Against armoured monsters (e.g., knights, golems), Crush is the most reliable way to land hits. Against unarmoured monsters, the Maul is just a very slow weapon with no advantage. This creates a clear niche: Mauls are for anti-armour tasks.
- **PvP behaviour:** In PvP, a Maul user is the counter to Platecoat wearers. A target in full plate has their defence reduced by 30%, making them vulnerable to the Maul's already high base damage. Against a target in rags, the Maul is overkill and under-speed.
- **UI feedback:** A cracked shield icon appears briefly on the target when hit by a Maul. The combat log reads "Crushed!" in orange. The damage number is slightly larger than normal.
- **Balance risk:** If armour defence values are low, 30% ignore is irrelevant. If they are high, Crush becomes mandatory. The 30% value is tuned against mid-tier armour (defence 50-100), where it provides roughly 15-30 extra accuracy. Also, Crush must not stack with other defence-reduction effects in a way that reduces defence below zero.
- **Example item:** Steel Maul (tier 10, 2H, 7 ticks, 1 tile).

### Spear — Reach

- **Trigger condition:** The attacker is 2 tiles away from the target and initiates a melee attack. OR the target is currently moving toward the attacker (has moved 1 tile closer in the last 2 ticks).
- **Effect:** At 2 tiles, the attack deals normal damage. Against a charging target, the attack deals +10% damage. The Spear can attack from 2 tiles, but the attacker cannot use a shield while attacking at 2-tile range (the shield is unequipped for the attack tick, or the attack is two-handed in posture).
- **Cooldown or proc frequency:** Passive. Every attack at 2 tiles or against a charger.
- **Scaling stat:** The +10% bonus scales with base damage and Strength. The 2-tile range is flat.
- **Counterplay:** Stay at 1 tile. A Spear user at 1 tile is just a weaker Longblade. Alternatively, do not charge directly at a Spear user; approach from the side or stand still. Ranged attackers never trigger the charge bonus.
- **PvE behaviour:** Against monsters that path directly toward the player, the charge bonus is often active. Against static monsters, the 2-tile range is the primary advantage. In corridors, the Spear can attack through a front-line ally.
- **PvP behaviour:** In PvP, the Spear is the anti-charge weapon. A player rushing a Spear user gets punished with +10%. However, a player who stands still and fights at 1 tile denies both the range and the bonus. The shield restriction at 2 tiles makes the Spear user vulnerable to ranged attacks while poking.
- **UI feedback:** A thrust animation extends to 2 tiles. When the charge bonus applies, the damage number is tinted blue. The combat log reads "Reach!" for the bonus.
- **Balance risk:** If the shield restriction is not enforced, Spears become strictly better than Longblades (range + shield). The engine must check that the off-hand is empty or a non-shield item during the 2-tile attack tick. Also, if the charge bonus applies to any movement toward the attacker, kiting back and forth could exploit it. The bonus should only apply to continuous approach over 2 ticks.
- **Example item:** Steel Spear (tier 10, 1H, 5 ticks, 2 tiles).

### Billhook — Hook

- **Trigger condition:** On every successful hit, roll a 20% chance. If successful, the target is within 2 tiles and is not classified as "large" (bosses, giants, certain monsters).
- **Effect:** The target is pulled 1 tile closer to the attacker. This is a forced movement that ignores normal pathing rules. It does not deal extra damage. It does not stun. It simply repositions the target.
- **Cooldown or proc frequency:** 20% chance per hit. No cooldown. Can proc multiple times in a row.
- **Scaling stat:** None. The pull distance is flat. The chance is flat.
- **Counterplay:** Stay at maximum range. A Billhook user must be within 2 tiles to hit, so a ranged attacker at 3+ tiles is immune. Against the Hook itself, there is no direct resistance, but large enemies are immune by classification. In PvP, stepping away after being pulled can re-establish range before the next attack.
- **PvE behaviour:** Against small monsters, Hook prevents flee. A monster trying to run away is pulled back. Against large monsters (bosses), Hook never procs, making the Billhook a slow, weak weapon in boss fights. This is the intended tradeoff.
- **PvP behaviour:** In PvP, Hook is the anti-kite mechanic. A ranged player trying to maintain 3-5 tile distance is pulled to 1 tile, where the Billhook user can continue melee. However, the 20% chance means it is unreliable; the ranged player can often get 2-3 shots off before being pulled.
- **UI feedback:** A chain animation extends from the Billhook to the target and retracts, pulling the target. The target slides 1 tile smoothly over 200ms. The combat log reads "Hooked!" in purple.
- **Balance risk:** If Hook can pull through walls or obstacles, it becomes a teleport exploit. The engine must check that the destination tile is walkable and not blocked. Also, if Hook can pull a player into a multi-combat zone from a single-combat zone, it could be used for griefing. Hook must respect zone boundaries.
- **Example item:** Steel Billhook (tier 10, 2H, 6 ticks, 2 tiles).

### Glaive — Sweep

- **Trigger condition:** Every melee attack with a Glaive. The attack hits all valid targets in a 2-tile arc in front of the attacker (up to 3 targets total, including the primary target).
- **Effect:** The primary target takes normal damage. Up to 2 additional targets in the arc take 60% damage each. Each target gets a separate accuracy and damage roll. The arc is a 120-degree wedge centered on the attacker's facing direction.
- **Cooldown or proc frequency:** Passive. Every attack.
- **Scaling stat:** The secondary hits scale with the same Strength and weapon tier as the primary, but at 60% multiplier.
- **Counterplay:** Fight alone. Sweep only hits multiple targets if they are clustered in the arc. In a 1v1, Sweep is just a normal attack with no bonus. Alternatively, spread out. If allies are not within the 120-degree arc, they are safe.
- **PvE behaviour:** Against monster groups, Sweep is a farming tool. It clears weak enemies efficiently. Against single bosses, it is inferior to a Greatblade because there is no Cleave proc and the base damage is lower. This makes Glaives the weapon of choice for multi-combat slayer tasks.
- **PvP behaviour:** In multi-combat PvP, a Glaive can hit up to 3 enemies at once. However, the 60% damage to secondary targets means it is not a burst weapon. It is area denial and chip damage. In single-combat PvP, it is a bad choice.
- **UI feedback:** A wide arc animation sweeps across the front of the attacker. Up to 3 damage numbers appear. The combat log lists all hits: "Sweep: 24, 15, 12."
- **Balance risk:** If the arc is too wide or the range too long, Glaives become mandatory in every group fight. The 120-degree arc and 2-tile range limit the targets to a realistic cluster. Also, if secondary hits can trigger on-hit effects (e.g., poison, enchantments), Sweep could become a proc machine. Secondary hits must not trigger additional on-hit effects unless explicitly designed.
- **Example item:** Steel Glaive (tier 10, 2H, 6 ticks, 2 tiles).

---

## Ranged Bow Mechanics

### Shortbow — Rapid

- **Trigger condition:** The target is within 3 tiles of the attacker when the attack is initiated.
- **Effect:** Attack speed is increased by 10%. A 5-tick Shortbow attacks in 4 ticks while the target remains within 3 tiles.
- **Cooldown or proc frequency:** Passive. Checked at the start of every attack. If the target moves beyond 3 tiles during the attack tick, the bonus is lost for the next attack.
- **Scaling stat:** The speed bonus is flat. The DPS gain scales with base damage because more attacks per minute means more damage.
- **Counterplay:** Stay beyond 3 tiles. A Shortbow user who cannot close the gap loses the bonus and is left with a low-damage, standard-speed bow. Alternatively, close to melee range (1 tile), where bows cannot fire at all.
- **PvE behaviour:** Against monsters that path close to the player (e.g., melee monsters), Rapid is often active. Against ranged monsters or static casters, the player may need to step forward to trigger it, which puts them at risk.
- **PvP behaviour:** In PvP, Rapid rewards aggressive positioning. A Shortbow user who steps into 3-tile range gets a speed boost but is vulnerable to melee retaliation. This creates a risk-reward dynamic: closer is faster, but closer is deadlier if the opponent has a melee weapon.
- **UI feedback:** A small wind icon appears above the player's head while Rapid is active. The bow draw animation plays slightly faster. The combat log reads "Rapid!" on the first fast shot.
- **Balance risk:** If the 10% speed reduction brings a 5-tick bow to 4.5 ticks, the engine must round. Rounding down to 4 ticks is a 20% speed increase, not 10%. The engine should implement this as a flat tick reduction (5 -> 4) rather than a percentage to avoid rounding exploits. Also, Rapid must not stack with other haste effects.
- **Example item:** Oak Shortbow (tier 5, 2H, 5 ticks, 6 tiles).

### Longbow — Range

- **Trigger condition:** The target is beyond 6 tiles when the attack is initiated.
- **Effect:** Accuracy is increased by 10%. This is a flat additive bonus to the accuracy roll before the defence comparison.
- **Cooldown or proc frequency:** Passive. Checked at the start of every attack.
- **Scaling stat:** The accuracy bonus is flat. Its value scales with the attacker's Ranged level because higher base accuracy benefits more from a percentage increase.
- **Counterplay:** Close the gap. A Longbow user at 5 tiles or less has no bonus and is just a slow bow with no special mechanic. Alternatively, use cover or line-of-sight to force the Longbow user to reposition, wasting ticks.
- **PvE behaviour:** Against monsters that stay at range (e.g., other archers, casters), the Longbow maintains its bonus. Against melee monsters, the player must kite backward to stay beyond 6 tiles, which is difficult in confined spaces.
- **PvP behaviour:** In PvP, the Longbow is the sniper weapon. It rewards maintaining maximum distance. A player who can keep a target at 7-8 tiles gets consistent, accurate shots. If the target closes to 5 tiles, the Longbow user should switch weapons or retreat.
- **UI feedback:** A targeting reticle icon appears above the target when the bonus applies. The arrow trail is slightly longer and brighter. The combat log reads "Range!" on hits.
- **Balance risk:** If the accuracy bonus is too high, Longbows become the default bow for all content because accuracy is universally valuable. The 10% value is tuned to be noticeable but not mandatory. Also, if the 6-tile threshold is checked after the attack lands, a target moving during the projectile flight could cause confusion. The check must be at attack initiation.
- **Example item:** Willow Longbow (tier 10, 2H, 6 ticks, 8 tiles).

### Recurve — Skirmish

- **Trigger condition:** The player moves at least 1 tile between attacks. The movement must occur during the bow's draw or recovery phase, not during the attack tick itself.
- **Effect:** No movement penalty while drawing. Normally, moving while drawing a bow cancels the shot or imposes an accuracy penalty. With a Recurve, the player can step 1 tile between shots without penalty.
- **Cooldown or proc frequency:** Passive. Applies to every shot where movement occurred between the previous shot and the current one.
- **Scaling stat:** None. The mechanic is about mobility, not damage or accuracy.
- **Counterplay:** Predict the movement. A Recurve user stepping between shots follows a pattern. Ranged attackers can lead their shots. Melee attackers can cut off the step direction. Alternatively, corner the Recurve user in a confined space where stepping is impossible.
- **PvE behaviour:** Against slow monsters, Skirmish is irrelevant because the player does not need to move. Against fast monsters or multiple monsters, the ability to step backward while firing maintains distance without losing DPS.
- **PvP behaviour:** In PvP, Skirmish is the kiting mechanic. A Recurve user can maintain a 5-tile orbit around a melee opponent, firing every 5 ticks while stepping. This is strong against slow melee but weak against ranged opponents who do not need to close.
- **UI feedback:** A small boot icon appears briefly when the step occurs. The draw animation does not interrupt when the player moves. The combat log reads "Skirmish!" on the first step-shot of a sequence.
- **Balance risk:** If the step distance is too large, Recurve users become uncatchable. The step is limited to 1 tile per shot. Also, if the no-penalty mechanic allows shooting while running (multiple tiles), it breaks the intended tradeoff. The engine must enforce that only 1 tile of movement is allowed without penalty; further movement cancels the shot.
- **Example item:** Maple Recurve (tier 15, 2H, 5 ticks, 7 tiles).

### Warbow — Heavy

- **Trigger condition:** The target is beyond 6 tiles when the attack is initiated.
- **Effect:** Damage is increased by 20%. Additionally, the arrow applies a small knockback, pushing the target 1 tile away from the attacker (if the tile is walkable). The knockback does not stun but does interrupt movement.
- **Cooldown or proc frequency:** Passive. Every shot beyond 6 tiles.
- **Scaling stat:** The 20% damage bonus scales with base damage and Ranged Strength. The knockback is flat.
- **Counterplay:** Close the gap. At 5 tiles or less, the Warbow is just a very slow bow with no bonus. Alternatively, use a shield or high ranged defence to reduce the chance of being hit, because the knockback only applies on a successful hit.
- **PvE behaviour:** Against monsters that stay at range, Heavy is a consistent damage boost. The knockback can keep melee monsters at bay, but against ranged monsters it is irrelevant. Against charging monsters, the knockback can delay their arrival by 1 tick.
- **PvP behaviour:** In PvP, the Warbow is the anti-charge ranged weapon. A melee player rushing a Warbow user is hit for 20% extra and knocked back 1 tile, delaying their approach. However, the Warbow is the slowest bow (7 ticks), so a faster ranged opponent can out-DPS it at any range.
- **UI feedback:** A heavy thud sound plays on hit. The target slides backward 1 tile over 200ms. The damage number is larger and tinted red. The combat log reads "Heavy shot!" and "Knockback!" separately.
- **Balance risk:** If the knockback can chain (hit -> knockback -> hit -> knockback), a Warbow user can permanently keep a melee opponent at range. The engine must enforce that a target cannot be knocked back more than once every 3 ticks (diminishing returns on displacement). Also, knockback into walls or obstacles must not deal extra damage or cause bugs.
- **Example item:** Yew Warbow (tier 20, 2H, 7 ticks, 8 tiles).

### Quickbow — Proccer

- **Trigger condition:** On every successful hit, roll a 10% chance.
- **Effect:** A second arrow is fired instantly at the same target. This second arrow uses a separate accuracy and damage roll at 80% of the weapon's max hit. It consumes an additional arrow from the quiver.
- **Cooldown or proc frequency:** 10% chance per hit. No cooldown. Can proc on the second arrow (theoretically infinite, but probability makes this astronomically unlikely).
- **Scaling stat:** The second arrow scales with Ranged Strength and weapon tier at 80% multiplier.
- **Counterplay:** The Proccer is ammo-hungry. A Quickbow user running low on arrows cannot sustain the mechanic. In PvP, forcing the opponent to waste arrows (e.g., by using high defence to cause misses) reduces proc opportunities. Also, the low base damage per arrow means the Quickbow is weak against high-defence targets even with procs.
- **PvE behaviour:** Against low-defence monsters, Proccer is a DPS increase. Against high-defence monsters, the second arrow often misses or hits for zero, making the mechanic unreliable. The ammo cost makes it expensive for long grinds.
- **PvP behaviour:** In PvP, a Proccer burst can surprise an opponent. Two arrows in one tick can break through a shield block or a heal timing. However, the 10% chance means it is not reliable burst. It is a lottery mechanic, which is acceptable because the base weapon is already fast (4 ticks).
- **UI feedback:** Two arrow trails appear in quick succession. Two damage numbers pop up. The combat log reads "Double shot!" in yellow. A small sparkle effect plays on the bow.
- **Balance risk:** If the second arrow can also proc, a single lucky roll could fire 3, 4, or more arrows. The engine must cap chain procs at 1 additional arrow per original shot (the second arrow cannot proc again). Also, the ammo consumption must be checked before the second arrow fires; if the quiver is empty, the proc fails silently.
- **Example item:** Ash Quickbow (tier 3, 2H, 4 ticks, 5 tiles).

### Stillbow — First Shot

- **Trigger condition:** The player has not moved, attacked, or been attacked for 3 seconds (5 ticks) before initiating the shot.
- **Effect:** The first arrow deals +25% damage. This is a multiplicative bonus on the damage roll.
- **Cooldown or proc frequency:** Once per stillness period. After the first shot, the bonus is lost until the player is still again for 3 seconds.
- **Scaling stat:** The bonus scales with base damage and Ranged Strength.
- **Counterplay:** Do not let the Stillbow user sit still. Apply pressure, force movement, or attack them to reset the stillness timer. In PvP, a melee rush or ranged harassment prevents the opener. In PvE, monsters that patrol or spawn nearby can disrupt stillness.
- **PvE behaviour:** Against monsters that spawn at range or approach slowly, the Stillbow user can set up a powerful opener. Against fast or multiple monsters, maintaining stillness is impossible. This makes the Stillbow an opener weapon, not a sustained DPS weapon.
- **PvP behaviour:** In PvP, the Stillbow is the ambush weapon. A player hiding around a corner or on high ground can deliver a devastating first shot. However, once the fight starts, the Stillbow is just a slow bow with no bonus. This rewards patience and positioning.
- **UI feedback:** A glowing aura builds around the player during the 3-second stillness period. When the bonus is active, the bow glows and the arrow trail is bright gold. The combat log reads "First Shot!" in large text. The damage number is oversized and gold.
- **Balance risk:** If the stillness timer is too short, the Stillbow becomes a sustained DPS weapon (still for 3 seconds, shoot, still for 3 seconds, shoot). The 3-second duration is intentionally longer than the bow's attack speed, so the player cannot maintain the bonus in active combat. Also, if the bonus applies to every shot after 3 seconds of stillness regardless of combat, it could be used for spawn camping. The stillness must break on any combat action, including being targeted.
- **Example item:** Elder Stillbow (tier 25, 2H, 6 ticks, 9 tiles).

### Starbow — Starfall

- **Trigger condition:** On every successful hit, roll a 15% chance.
- **Effect:** A meteor strikes the target's tile and all tiles within a 2-tile radius. All entities in the radius (enemies and allies) take AOE damage equal to 50% of the weapon's max hit. The primary target takes the normal arrow damage plus the meteor damage.
- **Cooldown or proc frequency:** 15% chance per hit. No cooldown. Can proc multiple times in a row.
- **Scaling stat:** The meteor damage scales with Ranged Strength and weapon tier at 50% multiplier.
- **Counterplay:** Spread out. Starfall hits a 2-tile radius, so clustered groups take massive damage. In PvP, do not stand near the Starbow user's target. In PvE, the Starbow user must be careful not to hit allies. The high risk of friendly fire is the built-in tradeoff.
- **PvE behaviour:** Against monster groups, Starfall is a devastating AOE. Against single bosses, it is just a 15% chance for 50% extra damage on the primary target, which is mediocre. The friendly fire risk makes it dangerous in group PvE unless the team spreads out.
- **PvP behaviour:** In group PvP, a Starbow user can wipe a clustered team. However, the 15% chance means it is not reliable. The primary counterplay is positioning: never let the Starbow user shoot into a crowd. In 1vP, Starfall is just a weak damage proc because the AOE only hits one target.
- **UI feedback:** A bright star appears in the sky above the target, followed by a meteor impact animation. A 2-tile radius circle glows red on the ground. All damage numbers in the radius appear simultaneously. The combat log reads "Starfall!" in large purple text.
- **Balance risk:** Friendly fire is the primary balance lever. If Starfall does not hit allies, it becomes strictly better than every other bow in group content. The 2-tile radius and 50% damage must hit everyone indiscriminately. Also, if the meteor delay is too long, players can step out. If too short, it is unavoidable. A 1-tick delay (600ms) is the target: enough time to react, not enough to escape without prediction.
- **Example item:** Starfall Starbow (tier 30, 2H, 5 ticks, 10 tiles).

---

## Ranged Crossbow Mechanics

### Latchbow — Light

- **Trigger condition:** Passive. Always active while the Latchbow is equipped.
- **Effect:** The Latchbow can be wielded alongside a Buckler (small shield) in the off-hand. No other shield types are permitted. The Buckler provides its normal defence bonuses.
- **Cooldown or proc frequency:** Passive. Always active.
- **Scaling stat:** None. The mechanic is about equipment flexibility, not damage or accuracy.
- **Counterplay:** The Latchbow user gains defence from the Buckler, but a Buckler is weaker than a full shield. A standard crossbow user with a two-handed setup deals more damage. The counterplay is to out-DPS the Latchbow user's reduced offence.
- **PvE behaviour:** Against monsters that deal ranged damage, the Buckler provides some protection without sacrificing the crossbow. Against melee monsters, the Buckler is less effective than a full shield, but the ability to block some damage while firing is unique among crossbows.
- **PvP behaviour:** In PvP, the Latchbow is the defensive crossbow. It trades damage for survivability. A Latchbow user can block some arrows while returning fire, but they lose the damage and range of heavier crossbows.
- **UI feedback:** The Buckler appears in the off-hand slot in the UI. The character model shows a small shield. No special combat log entry; the mechanic is visible in the equipment screen.
- **Balance risk:** If the Buckler's defence is too high, Latchbows become the default crossbow. If too low, the mechanic is irrelevant. The Buckler must be balanced as a "half shield" (roughly 50% of a standard shield's defence). Also, the engine must enforce that only Bucklers can be equipped; attempting to equip a larger shield must fail or unequip the Latchbow.
- **Example item:** Iron Latchbow (tier 5, 2H, 6 ticks, 6 tiles).

### Crossbow — Penetration

- **Trigger condition:** Every successful hit with a standard Crossbow.
- **Effect:** The attack ignores 20% of the target's ranged defence value. This is applied before the accuracy roll.
- **Cooldown or proc frequency:** Passive. Every hit.
- **Scaling stat:** The value scales with the target's ranged defence. Against low-defence targets, Penetration is minor. Against high-defence targets, it is significant.
- **Counterplay:** Do not stack ranged defence. Against a target with 0 ranged defence, Penetration does nothing. Alternatively, use melee range to force the crossbow user to switch weapons or retreat.
- **PvE behaviour:** Against monsters with high ranged defence (e.g., armoured archers, tower guards), Penetration is the most reliable way to land bolts. Against unarmoured monsters, the Crossbow is just a slow, standard ranged weapon.
- **PvP behaviour:** In PvP, the Crossbow is the counter to ranged-tank builds. A player stacking ranged defence to counter bows is still vulnerable to a Crossbow. However, the Crossbow is slow (7 ticks), so a faster bow can out-DPS it even with lower accuracy.
- **UI feedback:** A bolt trail with a cracked-shield particle effect. The combat log reads "Penetrated!" in blue. The damage number is slightly larger.
- **Balance risk:** If ranged defence values are low, 20% ignore is irrelevant. If high, Crossbows become mandatory. The 20% is tuned against mid-tier ranged defence (30-60). Also, Penetration must not stack with other ranged defence-reduction effects below zero.
- **Example item:** Steel Crossbow (tier 10, 2H, 7 ticks, 7 tiles).

### Arbalest — Siege

- **Trigger condition:** The target is wearing armour (has an armour defence value greater than 0).
- **Effect:** Damage is increased by 30%. Additionally, the bolt applies heavy knockback, pushing the target 1 tile away (if walkable). The knockback is stronger than the Warbow's and can interrupt movement.
- **Cooldown or proc frequency:** Passive. Every hit against an armoured target.
- **Scaling stat:** The 30% bonus scales with base damage and Ranged Strength. The knockback is flat.
- **Counterplay:** Remove armour. Against an unarmoured target, the Arbalest is just a very slow crossbow with no bonus. Alternatively, close to melee range, where the Arbalest's slow speed is a massive disadvantage.
- **PvE behaviour:** Against armoured monsters, the Arbalest is devastating. The knockback can keep melee monsters at range indefinitely if the terrain allows. Against unarmoured monsters, it is overkill and under-speed.
- **PvP behaviour:** In PvP, the Arbalest is the anti-armour siege weapon. A player in full plate is knocked back and takes 30% extra damage. However, the 8-tick speed means the target can often close the gap between shots. The Arbalest user needs a front line or a choke point to be effective.
- **UI feedback:** A heavy bolt trail with a dust particle effect. The target slides backward with a heavy thud. The damage number is large and red. The combat log reads "Siege!" and "Heavy knockback!"
- **Balance risk:** If the knockback can chain, an Arbalest user can permanently juggle a melee opponent. The engine must enforce a 3-tick immunity to displacement after any knockback. Also, the 30% damage bonus against armoured targets must be checked against the target's current armour, not their maximum; if they remove armour mid-fight, the bonus disappears.
- **Example item:** Mithril Arbalest (tier 20, 2H, 8 ticks, 8 tiles).

### Crankbow — Crank

- **Trigger condition:** Every 4th shot fired by the Crankbow.
- **Effect:** The 4th shot consumes no ammo from the quiver. However, the 4th shot deals 10% less damage than a normal shot.
- **Cooldown or proc frequency:** Every 4th shot. The counter resets if the player switches weapons or does not fire for 10 ticks.
- **Scaling stat:** The damage reduction is flat (-10%). The ammo savings scale with ammo cost; expensive bolts save more money.
- **Counterplay:** The Crankbow user must maintain a rhythm. Forcing them to switch targets, move, or stop firing resets the counter. In PvP, harassment and pressure disrupt the rhythm. In PvE, monsters that force movement (e.g., area attacks) can reset the counter.
- **PvE behaviour:** In long grinding sessions, the Crankbow saves ammo. Over 100 shots, it saves 25 bolts. This is economically significant for expensive ammo. However, the 10% damage reduction on every 4th shot means the overall DPS is slightly lower than a standard crossbow.
- **PvP behaviour:** In PvP, the ammo savings are less relevant than the damage output. The 10% reduction on every 4th shot is a noticeable DPS loss. The Crankbow is for economy, not for duels.
- **UI feedback:** A small gear icon rotates above the player's head with each shot. On the 4th shot, the gear clicks and the ammo count does not decrease. The combat log reads "Crank! Free shot." The damage number is slightly greyed.
- **Balance risk:** If the free shot can also be the 4th shot of a new cycle (i.e., the counter does not reset), a player could fire 3 shots, wait, fire 1 free shot, repeat, getting infinite free shots at a slow pace. The counter must reset after the free shot, requiring 3 more paid shots before the next free one.
- **Example item:** Steel Crankbow (tier 10, 2H, 5 ticks, 6 tiles).

### Handbow — Duelist

- **Trigger condition:** Passive. Always active while the Handbow is equipped.
- **Effect:** The Handbow can be wielded with any shield (not just Bucklers) because it is a 1-handed crossbow. Additionally, accuracy is increased by 10% when the target is within 3 tiles or less.
- **Cooldown or proc frequency:** Passive. The shield bonus is always active. The accuracy bonus is checked at the start of every shot.
- **Scaling stat:** The accuracy bonus scales with the attacker's base ranged accuracy.
- **Counterplay:** Stay beyond 3 tiles. At 4+ tiles, the Handbow is just a low-damage crossbow with a shield. Alternatively, use high ranged defence to reduce the impact of the accuracy bonus.
- **PvE behaviour:** Against monsters that close to melee range, the Handbow user can block with a shield while firing. Against ranged monsters, the 3-tile accuracy bonus is rarely active, making the Handbow inferior to standard crossbows.
- **PvP behaviour:** In PvP, the Handbow is the close-range duelist weapon. A player with a Handbow and a tower shield can trade shots at 2-3 tiles while blocking melee attacks. However, the low base damage means it loses to heavier crossbows at range.
- **UI feedback:** The shield appears in the off-hand. When the 3-tile bonus applies, a small crosshair icon appears above the target. The combat log reads "Duelist!" on close-range hits.
- **Balance risk:** If the Handbow's base damage is too high, it becomes the best crossbow because it adds shield defence with no meaningful cost. The Handbow must have the lowest base damage of all crossbows to compensate for the shield slot. Also, the 10% accuracy bonus at close range must not make it more accurate than a Longbow at max range.
- **Example item:** Steel Handbow (tier 10, 1H, 6 ticks, 5 tiles).

### Greatbow — Siege

- **Trigger condition:** Every successful hit with a Greatbow.
- **Effect:** Damage is increased by 40%. Additionally, the bolt pierces through the primary target and continues in a straight line to hit a second target behind the first (up to 2 tiles behind). The second target takes 50% damage. Both targets get separate accuracy and damage rolls.
- **Cooldown or proc frequency:** Passive. Every hit.
- **Scaling stat:** The 40% bonus scales with base damage and Ranged Strength. The pierce damage scales at 50%.
- **Counterplay:** Do not stand in a line. The pierce only works if a second target is directly behind the first in the bolt's path. In a 1v1, the pierce is irrelevant. In group fights, spreading out laterally prevents the pierce.
- **PvE behaviour:** Against monster formations (e.g., two goblins in a corridor), the Greatbow hits both. Against single bosses, it is just a 40% damage boost, which is strong but the 9-tick speed makes it slow. The Greatbow is for breaking formations, not for sustained DPS.
- **PvP behaviour:** In group PvP, a Greatbow user can hit two players with one shot. However, the 9-tick speed means they fire very slowly. A team that spreads out laterally is immune to the pierce. The Greatbow is best used from a fortified position where the enemy must approach in a line.
- **UI feedback:** A heavy bolt trail that continues through the first target. Two damage numbers appear in sequence. The combat log reads "Siege! Pierce!" The bolt trail has a dust particle effect.
- **Balance risk:** If the pierce can hit unlimited targets in a line, a Greatbow could wipe an entire team in one shot. The engine must cap the pierce at 1 additional target. Also, the 40% damage bonus is very high; the Greatbow must have the lowest base damage of all crossbows to prevent it from being the default choice. The 9-tick speed is the primary tradeoff.
- **Example item:** Adamant Greatbow (tier 25, 2H, 9 ticks, 9 tiles).

---

## Thrown Weapon Mechanics

### Knives — Fan

- **Trigger condition:** Every attack tick with Throwing Knives.
- **Effect:** The player throws 2 knives per tick. Each knife deals 60% of the weapon's max hit. Each knife gets a separate accuracy and damage roll. Both knives consume ammo.
- **Cooldown or proc frequency:** Passive. Every attack.
- **Scaling stat:** Each knife scales with Ranged Strength and weapon tier at 60% multiplier. The total output is 120% of a normal single-throw weapon, but with higher variance.
- **Counterplay:** High defence. Because each knife is a separate roll, high-defence targets can cause both to miss or hit for zero. Alternatively, close to melee range (1 tile), where thrown weapons have no penalty but the short range of knives (4 tiles) means the attacker is already close.
- **PvE behaviour:** Against low-defence monsters, Fan is a consistent DPS increase. Against high-defence monsters, the individual knives often fail to land, making Fan unreliable. The ammo cost is double that of other thrown weapons.
- **PvP behaviour:** In PvP, Fan creates burst potential. Two knives in one tick can break through a shield block or a heal. However, the 60% damage per knife means each hit is weaker, and high-defence opponents can shrug off both.
- **UI feedback:** Two knife animations fire in quick succession. Two damage numbers appear. The combat log reads "Fan: 12, 8." A small wind effect plays on the throw.
- **Balance risk:** If the two knives can both trigger on-hit effects (e.g., poison, enchantments), Fan becomes a proc machine. The engine must limit on-hit effects to the first knife only, or apply them at reduced chance. Also, the ammo consumption must be checked before the second knife; if the quiver has only 1 knife left, only 1 knife is thrown.
- **Example item:** Iron Throwing Knife (tier 5, 1H, 4 ticks, 4 tiles).

### Darts — Venom

- **Trigger condition:** On every successful hit, roll a 15% chance.
- **Effect:** The target is poisoned for 3 ticks (1.8 seconds), taking 2 damage per tick. Poison damage is true damage (ignores armour and defence). The poison does not stack; reapplying poison refreshes the duration.
- **Cooldown or proc frequency:** 15% chance per hit. No cooldown. Can refresh an existing poison.
- **Scaling stat:** None. The poison damage is flat (2 per tick). The duration is flat (3 ticks). The mechanic's value is in the guaranteed damage, not scaling.
- **Counterplay:** Antipoison potions or spells. Any effect that cleanses poison removes the debuff instantly. Alternatively, out-DPS the Dart user before the poison accumulates. The poison is weak (6 total damage), so it is a chip mechanic, not a kill mechanic.
- **PvE behaviour:** Against monsters with high defence or regeneration, the true damage from poison bypasses their protection. Against low-HP monsters, the poison is overkill. The Dart is a support weapon for softening targets over time.
- **PvP behaviour:** In PvP, Venom is annoying but not deadly. A player taking 2 damage per tick for 3 ticks can ignore it or cleanse it. However, in extended fights or against multiple Dart users, the poison can add up. The real value is the psychological pressure and the forced use of antipoison resources.
- **UI feedback:** A green droplet icon appears above the poisoned target. The target's health bar shows a green segment indicating poison damage. The combat log reads "Poisoned! 2 damage." The damage numbers from poison are small and green.
- **Balance risk:** If poison can stack from multiple sources (e.g., 3 Dart users poisoning the same target), the damage could become oppressive. The engine must enforce that poison from the same source type does not stack; only the most recent application applies. Also, if poison can be applied by every Dart user in a group, a 5-person Dart team could maintain 10 damage per tick indefinitely. A global poison cap of 1 instance per target is required.
- **Example item:** Bronze Dart (tier 1, 1H, 3 ticks, 5 tiles).

### Javelins — Pierce

- **Trigger condition:** Every successful hit with a Javelin.
- **Effect:** The attack ignores 25% of the target's ranged defence. Additionally, on a successful hit, there is a 10% chance to break the target's shield block for the next 2 ticks (the shield provides no defence during this window).
- **Cooldown or proc frequency:** The defence ignore is passive. The shield break is 10% chance per hit, with a 5-tick cooldown after a successful break.
- **Scaling stat:** The defence ignore scales with the target's ranged defence. The shield break is flat.
- **Counterplay:** Do not use a shield. Against a target without a shield, the break mechanic is irrelevant. Alternatively, use high ranged defence to reduce the chance of being hit, because the shield break only applies on a successful hit.
- **PvE behaviour:** Against monsters with shields or high ranged defence, Javelins are the most reliable thrown weapon. Against unarmoured monsters, they are just slow, expensive thrown weapons.
- **PvP behaviour:** In PvP, the shield break is a powerful team tool. A Javelin user can open a window for a melee teammate to land unblocked hits. However, the 10% chance and 5-tick cooldown mean it is not reliable enough to base a strategy on.
- **UI feedback:** A javelin trail with a cracked-shield particle. When the shield breaks, a shield icon shatters above the target. The combat log reads "Pierced!" and "Shield broken!" separately.
- **Balance risk:** If the shield break chance is too high or the cooldown too short, Javelins become mandatory in PvP. The 10% chance and 5-tick cooldown are tuned to be a occasional bonus, not a consistent tactic. Also, the shield break must not work on bosses or NPCs with unbreakable shields.
- **Example item:** Steel Javelin (tier 10, 1H, 6 ticks, 6 tiles).

### Throwing Axes — Hybrid

- **Trigger condition:** Every attack with Throwing Axes.
- **Effect:** Damage scales with the higher of the attacker's Ranged Strength or Melee Strength. The game checks both stats, uses the higher value for the damage calculation, and treats the attack as a ranged attack for all other purposes (range, ammo, defence type).
- **Cooldown or proc frequency:** Passive. Every attack.
- **Scaling stat:** The mechanic scales with the player's higher Strength stat. A player with 80 Melee Strength and 40 Ranged Strength uses 80 for the damage roll. A pure ranger gets no benefit.
- **Counterplay:** The Hybrid mechanic rewards hybrid builds. A pure ranged player using Throwing Axes gets no bonus and is better off with Knives or Darts. The counterplay is to recognize that the Throwing Axe user is likely a melee-trained hybrid and to exploit their lower Ranged accuracy (if they neglected Ranged level).
- **PvE behaviour:** Against monsters weak to melee but resistant to ranged, a hybrid player can use Throwing Axes to apply melee-level damage at range. This is niche but powerful in specific slayer tasks.
- **PvP behaviour:** In PvP, the Throwing Axe is the bridge weapon. A melee player can switch to Throwing Axes to finish a fleeing opponent without losing damage output. However, the 5-tick speed and 5-tile range are mediocre, so it is a situational tool, not a primary weapon.
- **UI feedback:** The damage number is tinted orange to indicate hybrid scaling. The combat log reads "Hybrid!" on the first hit of a combat session. No persistent UI element.
- **Balance risk:** If a player maxes both Melee and Ranged Strength, Throwing Axes become the highest-damage ranged weapon in the game. The engine must ensure that the damage calculation uses the higher stat but does not combine them. Also, the weapon's base damage must be lower than standard ranged weapons to compensate for the hybrid scaling.
- **Example item:** Steel Throwing Axe (tier 10, 1H, 5 ticks, 5 tiles).

---

## Magic Mechanics

### Wand — Efficient

- **Trigger condition:** Every spell cast while a Wand is equipped in the main hand.
- **Effect:** The spell's bead cost is reduced by 1, to a minimum of 1 bead. A spell that costs 3 beads costs 2. A spell that costs 1 bead still costs 1.
- **Cooldown or proc frequency:** Passive. Every spell cast.
- **Scaling stat:** None. The savings are flat. The value scales with the frequency of casting and the cost of spells.
- **Counterplay:** There is no direct counterplay to Efficient because it is a self-buff. However, the Wand has no melee stats and no other bonuses, so a Wand user is vulnerable in melee range. Rushing a Wand user forces them to switch weapons or take unarmed damage.
- **PvE behaviour:** In long grinding sessions, the Wand saves significant bead resources. A spell that costs 2 beads now costs 1, effectively doubling the casting duration per inventory of beads. This makes the Wand the training weapon for economy-minded mages.
- **PvP behaviour:** In PvP, the bead savings are less relevant than burst damage. A Wand user can cast more spells before running out, but they lack the damage bonuses of a Staff or the hybrid options of a Rod.
- **UI feedback:** A small sparkle effect plays on the Wand when a spell is cast. The bead consumption animation shows 1 fewer bead leaving the inventory. The combat log reads "Efficient: -1 bead." This is optional and can be silent to reduce spam.
- **Balance risk:** If high-tier spells cost 1 bead base, the Wand provides no savings on the most expensive spells. This is intended: the Wand is for training, not for endgame burst. However, if a spell costs 2 beads and the Wand reduces it to 1, the savings are 50%, which is massive. The Wand must not be allowed to reduce any spell below 1 bead.
- **Example item:** Willow Wand (tier 5, 1H, 4 ticks).

### Staff — Channel

- **Trigger condition:** Passive. Always active while a Staff is equipped.
- **Effect:** The Staff provides unlimited elemental beads of one type (e.g., unlimited Ember beads for a Fire Staff). The player never runs out of that elemental type. Catalytic beads (Wit, Grave, etc.) are not provided and must still be carried.
- **Cooldown or proc frequency:** Passive. Always active.
- **Scaling stat:** None. The unlimited beads are flat. The value scales with casting frequency and the cost of elemental spells.
- **Counterplay:** The Staff user has unlimited elemental beads but still needs catalytic beads. If the opponent can force the Staff user to cast spells that require catalytic beads (e.g., by being resistant to pure elemental damage), the unlimited supply is irrelevant. Alternatively, rush the Staff user in melee; the Staff has slow melee speed and low damage.
- **PvE behaviour:** In long grinds using pure elemental spells (e.g., Ember Bolt), the Staff eliminates inventory management. The player can cast indefinitely without restocking. However, complex spells still require catalytic beads, so the Staff is not truly infinite for all magic.
- **PvP behaviour:** In PvP, the Staff is the sustained caster's weapon. A Staff user can outlast an opponent in a war of attrition. However, the lack of burst means a Rod or Wand user with better spell selection can win faster.
- **UI feedback:** The Staff glows with the elemental colour (e.g., orange for Fire). The bead inventory UI shows an infinity symbol next to the elemental bead type. The combat log does not call out Channel on every cast; it is silent by design.
- **Balance risk:** If unlimited elemental beads allow infinite casting of high-damage spells, the Staff becomes the only magic weapon. The unlimited supply must be limited to basic elemental beads only. High-tier spells that require catalytic beads must still consume them. Also, the Staff must be locked to one element; a "Universal Staff" that provides all elements would break resource management.
- **Example item:** Oak Fire Staff (tier 10, 2H, 5 ticks).

### Rod — Battlemage

- **Trigger condition:** Passive. Always active while a Rod is equipped.
- **Effect:** The Rod can cast spells AND perform melee attacks. Melee damage scales with the player's Magic level instead of Melee Strength. The melee speed is 5 ticks. The magic bonuses are lower than a Staff but higher than a Wand.
- **Cooldown or proc frequency:** Passive. Always active.
- **Scaling stat:** Melee damage scales with Magic level. Spell accuracy and damage scale with the Rod's magic bonuses, which are mid-tier.
- **Counterplay:** The Rod is a jack of all trades. It does not excel at either magic or melee. A pure melee user out-damages the Rod in close combat. A pure mage out-casts the Rod at range. The counterplay is to force the Rod user into a situation where one of their modes is useless.
- **PvE behaviour:** Against monsters that require both magic and melee (e.g., a monster that phases between ranged and melee immunity), the Rod is the convenience weapon. Against standard monsters, a dedicated weapon is always better.
- **PvP behaviour:** In PvP, the Rod is the adaptive weapon. A Rod user can cast at range and switch to melee if the opponent closes. However, the melee damage is weak compared to a real melee weapon, and the magic is weak compared to a Staff. It is a versatility tool, not a min-max choice.
- **UI feedback:** The Rod has a dual-purpose icon in the equipment screen. When melee attacking, the damage number is tinted purple to indicate Magic scaling. The combat log reads "Battlemage strike!" on melee hits.
- **Balance risk:** If the Magic-level melee scaling is too high, the Rod becomes the best melee weapon for mages, eliminating the need for melee training. The scaling must be set so that a max-Magic, zero-Strength player deals less melee damage with a Rod than a mid-tier Strength player with a real melee weapon. Also, the Rod must not be able to cast spells while in melee range without the normal ranged penalties.
- **Example item:** Maple Rod (tier 15, 2H, 5 ticks).

### Focus — Amplify

- **Trigger condition:** Passive. Always active while a Focus is equipped in the off-hand, paired with a Wand or Rod in the main hand.
- **Effect:** Magic accuracy is increased by 15%. This applies to all spells cast while the Focus is equipped. The Focus does not cast spells, save beads, or provide melee stats.
- **Cooldown or proc frequency:** Passive. Always active.
- **Scaling stat:** The accuracy bonus scales with the player's base magic accuracy. A high-level mage benefits more than a low-level mage.
- **Counterplay:** The Focus user trades off-hand utility for accuracy. They cannot use a shield, a second wand, or any off-hand item. In PvP, a melee rush is effective because the Focus provides no defence. In magic duels, the accuracy boost is meaningful but the lack of defence makes the Focus user a glass cannon.
- **PvE behaviour:** Against high-magic-defence monsters, the 15% accuracy is the difference between consistent hits and frequent splashes. Against low-defence monsters, the Focus is overkill and a shield would be better for survivability.
- **PvP behaviour:** In PvP magic duels, the Focus is the accuracy tool. A Focus + Wand user hits more often but dies faster if the opponent switches to melee. A Focus + Rod user hits often and can melee back, but does neither exceptionally well.
- **UI feedback:** A small lens flare effect appears on the off-hand when a spell is cast. The combat log reads "Amplified!" on spell hits (optional, can be silent to reduce spam).
- **Balance risk:** If the 15% accuracy bonus makes spells hit too consistently, magic becomes the dominant combat style. The 15% is tuned to be noticeable but not game-breaking. Also, the Focus must only work with Wands and Rods; pairing it with a Staff must provide no bonus, or the Staff's already high bonuses would become excessive.
- **Example item:** Crystal Focus (tier 20, off-hand).

### Primer — Basic

- **Trigger condition:** The player attempts to cast a tier 1-3 spell.
- **Effect:** The Primer is required to cast tier 1-3 spells. Without a Primer (or better spellbook), tier 1-3 spells cannot be cast. The Primer holds 5 spell slots (the player can memorize 5 spells and cast them without carrying runes/beads, depending on the magic system implementation).
- **Cooldown or proc frequency:** Passive. Always active while equipped.
- **Scaling stat:** None. The Primer is a gating item, not a scaling item.
- **Counterplay:** The Primer user is limited to 5 spells. If the opponent can force them to use their spell slots (e.g., by dragging out the fight), the Primer user runs out of options. Also, the Primer cannot cast tier 4+ spells, so a Primer user has no access to high-tier magic.
- **PvE behaviour:** The Primer is the early-game magic tool. It allows a new mage to cast basic spells without carrying beads. However, the 5-spell limit means frequent trips to restock or rememorize.
- **PvP behaviour:** In PvP, a Primer user is predictable. They have only 5 spells, so their repertoire is limited. An experienced opponent can anticipate their casts and counter accordingly.
- **UI feedback:** The Primer appears as a small book in the off-hand or main hand. The spell UI shows 5 slots, each filled with a memorized spell. Empty slots are greyed out.
- **Balance risk:** If the Primer's 5 spells are too powerful or too cheap, it becomes the permanent magic weapon. The Primer must be strictly worse than the Codex in terms of spell access. Also, the "holds 5 spells" mechanic must not allow infinite casting without bead cost; the spells still consume beads unless the Wand's Efficient mechanic applies.
- **Example item:** Novice Primer (tier 1, 1H).

### Codex — Advanced

- **Trigger condition:** The player attempts to cast a tier 4-6 spell.
- **Effect:** The Codex is required to cast tier 4-6 spells. Without a Codex, tier 4-6 spells cannot be cast. The Codex holds 10 spell slots. Tier 1-3 spells can be cast with a Codex but at 20% higher bead cost (inefficient compared to a Primer).
- **Cooldown or proc frequency:** Passive. Always active while equipped.
- **Scaling stat:** None. The Codex is a gating item.
- **Counterplay:** The Codex user has access to powerful spells but pays a premium. Forcing a Codex user to burn through their high-tier spells early leaves them with expensive, inefficient low-tier options. Also, the Codex takes a hand slot, so the user cannot wield a shield or a Focus while using it.
- **PvE behaviour:** The Codex is the endgame magic tool. It unlocks the highest-tier spells for bossing and high-level slayer. The 10-spell limit is generous but still requires management on long trips.
- **PvP behaviour:** In PvP, the Codex is the burst weapon. Tier 4-6 spells deal significant damage but cost many beads. A Codex user can deliver 2-3 high-tier spells before needing to restock, making them a glass cannon.
- **UI feedback:** The Codex appears as a large tome. The spell UI shows 10 slots. High-tier spells are highlighted in gold. When casting a tier 1-3 spell with a Codex, a small warning icon appears: "Inefficient."
- **Balance risk:** If the Codex allows casting tier 4-6 spells at the same cost as tier 1-3, it becomes the only magic item. The 20% inefficiency on low-tier spells is a soft penalty that encourages using the right tool for the right tier. Also, the Codex must not be equippable alongside a Primer for "both benefits"; only one spellbook can be active at a time.
- **Example item:** Archmage Codex (tier 30, 1H).

---

## Accessory Mechanics

### Blueglass Lens Ring — Pierce Bonus

- **Trigger condition:** The player is equipped with a Blueglass Lens Ring and is using a ranged weapon (bow, crossbow, or thrown weapon) against a target with active armour defence.
- **Effect:** The attack gains +4% ranged accuracy. This is a flat additive bonus to the accuracy roll before the defence comparison. When paired with a Blueglass Focus Amulet, the bonus stacks to +8% total magic/ranged accuracy.
- **Cooldown or proc frequency:** Passive. Always active while the ring is equipped.
- **Scaling stat:** The accuracy bonus is flat. Its value scales with the attacker's base ranged accuracy because higher base accuracy benefits more from a percentage increase.
- **Counterplay:** The Blueglass Lens Ring provides no melee bonuses and reduces melee speed by 6%. A melee rush forces the wearer to switch rings or take penalties. Alternatively, high ranged defence reduces the impact of the accuracy bonus.
- **PvE behaviour:** Against monsters with high ranged defence (e.g., armoured archers, tower guards), the +4% accuracy is the difference between consistent hits and frequent misses. Against low-defence monsters, the ring is overkill and a melee-focused ring would be better.
- **PvP behaviour:** In PvP, the +4% bonus is within the 15% PvP cap. When stacked with the Blueglass Focus Amulet (+4% magic accuracy), the total +8% is still within cap because the cap applies per-stat, not per-slot. However, the -6% melee speed penalty makes the wearer vulnerable to melee opponents.
- **UI feedback:** A small blue lens flare appears on the ring finger when a ranged attack is initiated. The combat log reads "Focused!" on the first ranged hit of a combat session. No persistent UI element to reduce clutter.
- **Balance risk:** If the +4% accuracy makes ranged weapons too consistent, the ring becomes mandatory for all ranged builds. The -6% melee speed penalty is the primary tradeoff, but if ranged is already dominant, the penalty is irrelevant. The 4% value is tuned to be noticeable but not mandatory.
- **Example item:** Blueglass Lens Ring (band 8, finger-bind, +4% ranged accuracy, -6% melee speed).

### Blacksalt Charm — Venom Duration

- **Trigger condition:** The player is equipped with a Blacksalt Charm and successfully applies poison (e.g., via Dart Venom, poisoned weapon, or poison spell).
- **Effect:** The poison duration is extended by 2 ticks (1.2 seconds). A standard 3-tick poison becomes 5 ticks. The damage per tick remains unchanged (2 damage/tick). The extension applies to all poison sources while the charm is equipped.
- **Cooldown or proc frequency:** Passive. Applies to every poison application while the charm is equipped.
- **Scaling stat:** None. The duration extension is flat. The value scales with poison frequency — a Dart user who applies poison often benefits more than a melee user who applies poison rarely.
- **Counterplay:** Antipoison potions or spells cleanse the extended poison instantly. The extension does not increase damage per tick, so a single antipoison removes all remaining damage. Alternatively, out-DPS the poison user before the extension matters.
- **PvE behaviour:** Against monsters with high HP or regeneration, the 2-tick extension adds 4 total damage per poison application. Over a long fight, this adds up. Against low-HP monsters, the extension is overkill.
- **PvP behaviour:** In PvP, the +2% poison duration is within the 15% PvP cap (the cap applies to the bonus magnitude, not the duration). The extension is annoying but not deadly — it adds 4 damage total. The real value is psychological pressure and forced antipoison consumption.
- **UI feedback:** A small black salt crystal icon appears above the target when poison is applied with the charm equipped. The poison duration bar in the target's status UI shows 5 segments instead of 3. The combat log reads "Blacksalt: poison extended."
- **Balance risk:** If multiple players with Blacksalt Charms poison the same target, the durations do not stack — only the most recent application applies. However, a 5-person Dart team with Blacksalt Charms could maintain near-permanent poison. A global poison cap of 1 instance per target is required, and the charm extension must not bypass this cap.
- **Example item:** Blacksalt Charm (band 4, pocket-luck, +2% poison duration in PvP, -5% magic defence).

### Carmine Thrower's Belt — Fan of Knives Bonus

- **Trigger condition:** The player is equipped with a Carmine Thrower's Belt and is using Throwing Knives (Fan mechanic: 2 knives per tick).
- **Effect:** The Fan of Knives mechanic throws 3 knives per tick instead of 2. Each knife deals 60% of the weapon's max hit (unchanged). The third knife consumes an additional ammo unit. Total damage output increases from 120% to 180% of a normal single-throw weapon, but with triple ammo consumption.
- **Cooldown or proc frequency:** Passive. Always active while the belt is equipped and Throwing Knives are used.
- **Scaling stat:** Each knife scales with Ranged Strength and weapon tier at 60% multiplier. The total output is 180% of a normal single-throw weapon. The value scales with the player's Ranged Strength because more knives means more damage rolls.
- **Counterplay:** The triple ammo consumption is the primary counterplay. A Carmine Thrower's Belt user burns through knives at triple speed. In PvP, forcing the opponent to waste knives (e.g., by using high defence to cause misses) reduces the mechanic's value. Also, the -7% defence in group PvP makes the wearer fragile in multi-combat.
- **PvE behaviour:** Against low-defence monsters, the third knife is a significant DPS increase. Against high-defence monsters, the individual knives often fail to land, making the mechanic unreliable and ammo-wasteful. The belt is for short, intense fights, not long grinds.
- **PvP behaviour:** In PvP duels, the third knife creates burst potential. Three knives in one tick can break through a shield block or a heal timing. However, the -7% defence in group PvP makes the wearer vulnerable in multi-combat. The 15% PvP cap is enforced by the defence penalty.
- **UI feedback:** Three knife animations fire in quick succession. Three damage numbers appear. The combat log reads "Fan: 12, 8, 6." A small red tassel effect plays on the belt when the third knife fires.
- **Balance risk:** If the third knife can trigger on-hit effects (e.g., poison, enchantments), the belt becomes a proc machine. The engine must limit on-hit effects to the first knife only, or apply them at reduced chance. Also, the ammo consumption must be checked before the third knife; if the quiver has only 2 knives left, only 2 knives are thrown.
- **Example item:** Carmine Thrower's Belt (band 9, waist-strap, +5% thrown ammo capacity in duels, -7% defence in group PvP).

### Grave Bead Amulet — Undead Focus

- **Trigger condition:** The player is equipped with a Grave Bead Amulet and is casting spells or using magic weapons against undead targets (skeletons, wights, zombies, vampires, liches).
- **Effect:** Magic accuracy is increased by +3% against undead targets. This applies to all spells and magic weapon attacks. The bonus does not apply to melee or ranged attacks, even if the target is undead.
- **Cooldown or proc frequency:** Passive. Checked at the start of every magic attack against an undead target.
- **Scaling stat:** The accuracy bonus is flat. Its value scales with the attacker's base magic accuracy because higher base accuracy benefits more from a percentage increase.
- **Counterplay:** The Grave Bead Amulet provides no bonus against living targets and reduces magic accuracy by 3% against living targets. A player who switches between undead and living targets is penalized. Alternatively, rush the mage in melee; the amulet provides no defence bonuses.
- **PvE behaviour:** In undead-heavy areas (graveyards, crypts, necromancer towers), the +3% accuracy is the difference between consistent hits and frequent splashes. In mixed areas, the amulet is a liability against living monsters.
- **PvP behaviour:** In PvP, the bonus only applies if the target is undead (e.g., a vampire player or a necromancer with undead transformation). Against living players, the amulet provides -3% magic accuracy. This makes it a niche PvP choice.
- **UI feedback:** A small bone bead icon appears above the target when a spell hits an undead target. The combat log reads "Grave focus!" on the first undead hit of a combat session. No persistent UI element.
- **Balance risk:** If the +3% accuracy makes magic too consistent against undead, the amulet becomes mandatory for undead slayer tasks. The -3% penalty against living targets is the primary tradeoff, but if a player only fights undead, the penalty is irrelevant. The 3% value is tuned to be helpful but not mandatory.
- **Example item:** Grave Bead Amulet (band 7, neck-keep, +3% magic accuracy vs. undead, -3% vs. living).

### Warden Utility Belt — Tool Durability

- **Trigger condition:** The player is equipped with a Warden Utility Belt and is using a gathering or crafting tool (axe, pickaxe, rod, hammer, needle, etc.).
- **Effect:** Tool durability degrades 2% slower. A tool that normally loses 1 durability per use now loses 0.98 durability per use. Over 100 uses, the tool lasts 2 uses longer. This is a small but meaningful economy bonus for skilling players.
- **Cooldown or proc frequency:** Passive. Applies to every tool use while the belt is equipped.
- **Scaling stat:** None. The durability bonus is flat. The value scales with tool use frequency — a player who chops 1000 logs benefits more than a player who chops 10.
- **Counterplay:** The Warden Utility Belt provides no combat bonuses and reduces accuracy against beasts by 6%. A player who switches between skilling and combat must choose between tool efficiency and combat power.
- **PvE behaviour:** In long skilling sessions, the 2% durability savings add up. A high-tier tool that costs 10,000 coins lasts 2% longer, saving ~200 coins per tool. Over hundreds of tools, this is significant.
- **PvP behaviour:** In PvP, the belt provides no bonuses. The -6% accuracy vs. beasts is irrelevant in PvP (beasts are not players). However, the belt takes up a slot that could provide a combat bonus, making it a pure skilling choice.
- **UI feedback:** A small wrench icon appears briefly when a tool is used. The tool durability bar degrades slightly slower. The combat log does not call out the mechanic; it is silent by design to reduce spam.
- **Balance risk:** If the 2% savings stacks with other durability bonuses (e.g., from skills or other items), tool durability could become infinite. The engine must enforce that durability bonuses are additive up to a maximum of 10% total savings. The Warden Utility Belt's 2% is within this limit.
- **Example item:** Warden Utility Belt (band 5, waist-strap, +2% tool durability, -6% accuracy vs. beasts).

### Greenwold Sprig — Forest Foraging

- **Trigger condition:** The player is equipped with a Greenwold Sprig and is in a forest biome (Greenwold, Whisperwood, Thornhollow, etc.).
- **Effect:** Foraging yield is increased by 3%. This applies to woodcutting, herb gathering, mushroom picking, and any other forest-based gathering activity. The bonus does not apply to mining, fishing, or crafting.
- **Cooldown or proc frequency:** Passive. Checked at the start of every foraging action in a forest biome.
- **Scaling stat:** The yield bonus is flat. Its value scales with the base yield of the activity — a high-tier tree that yields 5 logs gives 5.15 logs with the sprig.
- **Counterplay:** The Greenwold Sprig provides no bonus outside forest biomes and reduces combat XP by 4% in towns. A player who spends most of their time in towns or dungeons gains no benefit and takes a penalty.
- **PvE behaviour:** In forest skilling areas, the +3% yield is a consistent economy bonus. Over 1000 logs, the player gains 30 extra logs. This is meaningful for ironman players or economy-focused accounts.
- **PvP behaviour:** In PvP, the sprig provides no bonuses. The -4% combat XP in towns is irrelevant in PvP (PvP does not award XP). However, the slot could be used for a combat charm, making the sprig a pure skilling choice.
- **UI feedback:** A small green leaf icon appears briefly when a foraging action succeeds in a forest. The yield number is tinted green. The combat log reads "Greenwold: +1 extra." This only appears when the bonus yields an extra whole item (not on fractional gains).
- **Balance risk:** If the +3% yield stacks with other yield bonuses (e.g., from skills or potions), foraging could become too efficient. The engine must enforce that yield bonuses are additive up to a maximum of 15% total yield increase. The Greenwold Sprig's 3% is within this limit.
- **Example item:** Greenwold Sprig (band 6, pocket-luck, +3% foraging yield in forests, -4% combat XP in towns).

---

## Balance Rules

The following global constraints apply to all mechanics. No mechanic may violate these rules.

### Chain-Stun Prevention

No target can be stunned more than once every 3 ticks. After any stun ends, the target gains a 3-tick stun immunity. This applies to Stagger, shield breaks, knockback-induced interrupts, and any future stun mechanics. Bosses and certain large monsters have permanent stun immunity.

### Diminishing Returns on Displacement

No target can be forcibly moved (knockback, pull, push) more than once every 3 ticks. After any forced movement, the target gains 3 ticks of displacement immunity. This prevents juggle combos and infinite kiting.

### Proc Stacking Limits

On-hit effects (poison, enchantments, bleed, etc.) do not stack from the same source type. If a target is already poisoned, a new poison application refreshes the duration but does not increase the damage per tick. Multiple Dart users cannot stack poison on the same target beyond a single instance. Different source types (e.g., poison from a Dart and poison from a spell) follow the same rule: only the most recent application applies.

### Attack Speed Buff Caps

Attack speed buffs do not stack. If a player has multiple speed buffs active (e.g., Slash Frenzy + Rapid + a potion), only the highest buff applies. Speed buffs cannot reduce attack speed below 3 ticks. No weapon can attack faster than 3 ticks under any circumstances.

### Defence Reduction Floor

Defence reduction effects (Crush, Penetration, Pierce) cannot reduce a target's effective defence below zero. If multiple effects apply, they are additive up to a maximum of 100% reduction. A target with 0 defence cannot have negative defence.

### AOE Friendly Fire

All AOE mechanics (Cleave, Sweep, Starfall, Siege pierce) must respect friendly fire settings. In non-PvP zones, AOE does not hit allies. In PvP zones, AOE hits all entities in the radius indiscriminately. The engine must check the zone flag before applying AOE damage to non-target entities.

### Ammo Consumption Order

All mechanics that consume extra ammo (Proccer, Fan, free shots) must check ammo availability before firing. If the quiver does not have enough ammo for the extra projectile, the extra projectile does not fire. The primary projectile always consumes ammo first. The free shot from Crankbow is an exception: it consumes no ammo by definition.

### Global Cooldown on Signature Mechanics

No signature mechanic can have a cooldown shorter than the weapon's base attack speed. A mechanic that procs every hit cannot also have a separate cooldown that is shorter than the attack interval. This prevents tick-manipulation exploits.

### Scaling Transparency

All percentage-based scaling must use the final damage roll, not the max hit cap. A "+20% damage" bonus applies to the rolled damage, not to the theoretical maximum. This prevents bonuses from creating impossible damage numbers.

### Tier Consistency

Higher tiers of the same weapon family increase the magnitude of the signature mechanic but do not unlock new mechanics. A tier 5 Sticker has +15% Backstab. A tier 30 Sticker might have +25% Backstab. The mechanic is the same; the numbers grow.

---

## Related Documents

- [`signature-mechanics.md`](./signature-mechanics.md) — Design authority for weapon family identities and philosophy
- [`items/weapons/melee.md`](../items/weapons/melee.md) — Melee weapon inventory and tiers
- [`items/weapons/ranged.md`](../items/weapons/ranged.md) — Ranged weapon inventory and tiers
- [`items/weapons/magic.md`](../items/weapons/magic.md) — Magic weapon inventory and tiers
- [`items/weapons/knives.md`](../items/weapons/knives.md) — Thrown knives
- [`items/weapons/darts.md`](../items/weapons/darts.md) — Thrown darts
- [`items/weapons/javelins.md`](../items/weapons/javelins.md) — Javelins
- [`items/weapons/throwing-axes.md`](../items/weapons/throwing-axes.md) — Throwing axes
- [`POC_SPEC.md`](../../POC_SPEC.md) §13 — Combat system specification

---

*Total mechanics documented: 41 (12 melee + 7 bows + 6 crossbows + 4 thrown + 6 magic + 6 accessory)*
*Last updated: Design authority. Engineers implement from this document.*
