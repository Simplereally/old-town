import { writeFileSync } from "node:fs";

const TIERS = [
  { id: "cobbled", name: "Cobbled", order: 0, valueMult: 0.2 },
  { id: "chalkmarked", name: "Chalkmarked", order: 1, valueMult: 1.0 },
  { id: "tallowbound", name: "Tallowbound", order: 2, valueMult: 1.8 },
  { id: "bellwax", name: "Bellwax", order: 3, valueMult: 3.0 },
  { id: "blacksalt", name: "Blacksalt", order: 4, valueMult: 5.0 },
  { id: "warden_script", name: "Warden Script", order: 5, valueMult: 8.0 },
  { id: "greenwold", name: "Greenwold", order: 6, valueMult: 12.0 },
  { id: "gravebound", name: "Gravebound", order: 7, valueMult: 18.0 },
  { id: "blueglass", name: "Blueglass", order: 8, valueMult: 26.0 },
  { id: "carmine_ink", name: "Carmine Ink", order: 9, valueMult: 38.0 },
  { id: "argent_script", name: "Argent Script", order: 10, valueMult: 55.0 },
  { id: "crownvellum", name: "Crownvellum", order: 11, valueMult: 80.0 },
  { id: "starfall", name: "Starfall", order: 12, valueMult: 120.0 },
];

const WEAPON_FAMILIES = [
  {
    id: "wand",
    name: "Wand",
    slot: "weapon",
    hands: "1H",
    speed: 4,
    range: 1,
    styles: ["magic"],
    magicAttackPerTier: 3,
    magicStrengthPerTier: 2,
    meleeAttackPerTier: 0,
    weight: 0.5,
    baseValue: 35,
    notes: [
      "Twig with a bead glued to it",
      "First real wand, chalk-tipped",
      "Wax-sealed wand, smoky",
      "Brass-clasp wand, golden",
      "Black wand, salt sigils",
      "Blue-white wand, licensed",
      "Moss wand, living wood",
      "Bone wand, grey cloth",
      "Blue crystal wand, polished",
      "Red ink wand, vellum",
      "Silver wand, pale robes",
      "Gold wand, royal scrollwork",
      "Meteor wand, star-black",
    ],
  },
  {
    id: "staff",
    name: "Staff",
    slot: "weapon",
    hands: "2H",
    speed: 5,
    range: 1,
    styles: ["magic", "crush"],
    magicAttackPerTier: 4,
    magicStrengthPerTier: 3,
    meleeAttackPerTier: 0,
    weight: 1.5,
    baseValue: 55,
    notes: [
      "Stick with a bead on top",
      "First real staff, chalk-tipped",
      "Wax-sealed staff, smoky",
      "Brass-clasp staff, golden",
      "Black staff, salt sigils",
      "Blue-white staff, licensed",
      "Moss staff, living wood",
      "Bone staff, grey cloth",
      "Blue crystal staff, polished",
      "Red ink staff, vellum",
      "Silver staff, pale robes",
      "Gold staff, royal scrollwork",
      "Meteor staff, star-black",
    ],
  },
  {
    id: "rod",
    name: "Rod",
    slot: "weapon",
    hands: "2H",
    speed: 5,
    range: 1,
    styles: ["magic", "crush"],
    magicAttackPerTier: 3,
    magicStrengthPerTier: 2,
    meleeAttackPerTier: 3,
    weight: 2.0,
    baseValue: 45,
    notes: [
      "Heavy stick, barely a weapon",
      "First hybrid rod, chalk-tipped",
      "Wax-sealed rod, smoky",
      "Brass-clasp rod, golden",
      "Black rod, salt sigils",
      "Blue-white rod, licensed",
      "Moss rod, living wood",
      "Bone rod, grey cloth",
      "Blue crystal rod, polished",
      "Red ink rod, vellum",
      "Silver rod, pale robes",
      "Gold rod, royal scrollwork",
      "Meteor rod, star-black",
    ],
  },
  {
    id: "focus",
    name: "Focus",
    slot: "shield",
    hands: "1H",
    speed: undefined,
    range: undefined,
    styles: undefined,
    magicAttackPerTier: 2,
    magicStrengthPerTier: 1,
    meleeAttackPerTier: 0,
    weight: 0.3,
    baseValue: 25,
    notes: [
      "Pebble, barely magical",
      "Slate bead, first focus",
      "Glass bead, smoky",
      "Brass bead, golden",
      "Black bead, salt sigils",
      "Blue-white bead, licensed",
      "Green bead, moss",
      "Bone bead, grey",
      "Blue crystal bead, polished",
      "Red ink bead, vellum",
      "Silver bead, pale",
      "Gold bead, royal",
      "Meteor bead, star-black",
    ],
  },
  {
    id: "primer",
    name: "Primer",
    slot: "shield",
    hands: "1H",
    speed: undefined,
    range: undefined,
    styles: undefined,
    magicAttackPerTier: 2,
    magicStrengthPerTier: 1,
    meleeAttackPerTier: 0,
    weight: 0.6,
    baseValue: 30,
    notes: [
      "Scrap paper, illegible",
      "First real spellbook, chalk",
      "Wax-sealed pages, smoky",
      "Brass-bound, golden",
      "Black pages, salt sigils",
      "Blue-white glyphs, licensed",
      "Moss pages, living wood",
      "Bone pages, grey cloth",
      "Blue crystal pages, polished",
      "Red ink, black vellum",
      "Silver pages, pale robes",
      "Gold pages, royal scrollwork",
      "Meteor pages, star-black",
    ],
  },
  {
    id: "codex",
    name: "Codex",
    slot: "shield",
    hands: "1H",
    speed: undefined,
    range: undefined,
    styles: undefined,
    magicAttackPerTier: 3,
    magicStrengthPerTier: 2,
    meleeAttackPerTier: 0,
    weight: 0.8,
    baseValue: 50,
    notes: [
      "Tattered pages, barely held",
      "First real codex, chalk",
      "Wax-sealed pages, smoky",
      "Brass-bound, golden",
      "Black pages, salt sigils",
      "Blue-white glyphs, licensed",
      "Moss pages, living wood",
      "Bone pages, grey cloth",
      "Blue crystal pages, polished",
      "Red ink, black vellum",
      "Silver pages, pale robes",
      "Gold pages, royal scrollwork",
      "Meteor pages, star-black",
    ],
  },
];

function createWeapon(family, tier) {
  const id = `${tier.id}_${family.id}`;
  const name = `${tier.name} ${family.name}`;
  const magicAttack = family.magicAttackPerTier * tier.order;
  const magicStrength = family.magicStrengthPerTier * tier.order;
  const meleeAttack = family.meleeAttackPerTier * tier.order;
  const value = Math.floor(family.baseValue * tier.valueMult);

  const bonuses = {};
  if (magicAttack > 0) bonuses.magicAttack = magicAttack;
  if (magicStrength > 0) bonuses.magicDamage = magicStrength;
  if (meleeAttack > 0) bonuses.crushAttack = meleeAttack;

  const equipment = {
    slot: family.slot,
    bonuses,
    requirements: tier.order > 0 ? [{ skillId: "magic", level: tier.order }] : [],
  };

  if (family.speed !== undefined) {
    equipment.attackSpeedTicks = family.speed;
    equipment.attackRangeTiles = family.range;
    equipment.allowedStyles = family.styles;
  }

  const visualIdentity = {
    baseColor: tier.id === "cobbled" ? "rust_grey" : "chalk_white",
  };
  if (tier.id === "cobbled") {
    visualIdentity.accents = "rough_wood";
  } else {
    visualIdentity.accents = "slate_beads";
  }

  return {
    id,
    name,
    stackable: false,
    tradeable: true,
    examine: family.notes[tier.order],
    icon: `icon_${id}`,
    model: `model_${id}`,
    value,
    weight: family.weight,
    tier: tier.id,
    tierOrder: tier.order,
    family: family.id,
    category: "magic",
    visualIdentity,
    options: ["wield"],
    equipment,
  };
}

function createArmour(slot, tier) {
  const id = `${tier.id}_${slot.id}`;
  const name = `${tier.name} ${slot.name}`;
  const magicAttack = slot.magicAttackPerTier * tier.order;
  const magicDefence = slot.magicDefencePerTier * tier.order;
  const value = Math.floor(slot.baseValue * tier.valueMult);

  const bonuses = {};
  if (magicAttack > 0) bonuses.magicAttack = magicAttack;
  if (magicDefence > 0) bonuses.magicDefence = magicDefence;

  const visualIdentity = {
    baseColor: tier.id === "cobbled" ? "rust_grey" : "chalk_white",
  };
  if (tier.id === "cobbled") {
    visualIdentity.accents = "ragged_cloth";
  } else {
    visualIdentity.accents = "slate_beads";
  }

  return {
    id,
    name,
    stackable: false,
    tradeable: true,
    examine: slot.notes[tier.order],
    icon: `icon_${id}`,
    model: `model_${id}`,
    value,
    weight: slot.weight,
    tier: tier.id,
    tierOrder: tier.order,
    family: slot.id,
    category: "magic",
    visualIdentity,
    options: ["wear"],
    equipment: {
      slot: slot.slot,
      bonuses,
      requirements: tier.order > 0 ? [{ skillId: "magic", level: tier.order }] : [],
    },
  };
}

const ARMOUR_SLOTS = [
  {
    id: "cowl",
    name: "Cowl",
    slot: "head",
    magicAttackPerTier: 2,
    magicDefencePerTier: 1,
    weight: 0.4,
    baseValue: 20,
    notes: [
      "Ragged cloth, barely a hood",
      "White chalk marks, apprentice hood",
      "Yellowed cloth, wax-sealed",
      "Brass trim, golden wax",
      "Black cloth, salt sigils",
      "Blue-white glyphs, licensed hood",
      "Moss thread, living wood trim",
      "Bone clasps, grey cloth",
      "Blue crystal lenses, polished",
      "Red ink trim, black vellum",
      "Silver thread, pale hood",
      "Gold seals, royal scrollwork",
      "Meteor dust, star-black hood",
    ],
  },
  {
    id: "robe",
    name: "Robe",
    slot: "body",
    magicAttackPerTier: 3,
    magicDefencePerTier: 2,
    weight: 0.8,
    baseValue: 40,
    notes: [
      "Tattered cloth, barely a robe",
      "White chalk lines, apprentice robe",
      "Yellowed cloth, wax-sealed",
      "Brass trim, golden wax",
      "Black cloth, salt sigils",
      "Blue-white glyphs, licensed robe",
      "Moss thread, living wood trim",
      "Bone clasps, grey cloth",
      "Blue crystal trim, polished",
      "Red ink, black vellum",
      "Silver thread, pale robe",
      "Gold seals, royal scrollwork",
      "Meteor dust, star-black robe",
    ],
  },
  {
    id: "wraps",
    name: "Wraps",
    slot: "legs",
    magicAttackPerTier: 2,
    magicDefencePerTier: 1,
    weight: 0.5,
    baseValue: 30,
    notes: [
      "Ragged cloth strips",
      "White chalk marks",
      "Yellowed cloth, wax-sealed",
      "Brass trim, golden wax",
      "Black cloth, salt sigils",
      "Blue-white glyphs, licensed",
      "Moss thread, living wood",
      "Bone toggles, grey cloth",
      "Blue crystal trim, polished",
      "Red ink, black vellum",
      "Silver thread, pale wraps",
      "Gold seals, royal scrollwork",
      "Meteor dust, star-black wraps",
    ],
  },
  {
    id: "cuffs",
    name: "Cuffs",
    slot: "hands",
    magicAttackPerTier: 1,
    magicDefencePerTier: 1,
    weight: 0.2,
    baseValue: 15,
    notes: [
      "Ragged cloth strips",
      "White chalk marks",
      "Yellowed cloth, wax-sealed",
      "Brass trim, golden wax",
      "Black cloth, salt sigils",
      "Blue-white glyphs, licensed",
      "Moss thread, living wood",
      "Bone toggles, grey cloth",
      "Blue crystal trim, polished",
      "Red ink, black vellum",
      "Silver thread, pale cuffs",
      "Gold seals, royal scrollwork",
      "Meteor dust, star-black cuffs",
    ],
  },
  {
    id: "softshoes",
    name: "Softshoes",
    slot: "feet",
    magicAttackPerTier: 1,
    magicDefencePerTier: 1,
    weight: 0.3,
    baseValue: 18,
    notes: [
      "Ragged cloth wrapped around feet",
      "White chalk marks",
      "Yellowed cloth, wax-sealed",
      "Brass trim, golden wax",
      "Black cloth, salt sigils",
      "Blue-white glyphs, licensed",
      "Moss thread, living wood",
      "Bone toggles, grey cloth",
      "Blue crystal trim, polished",
      "Red ink, black vellum",
      "Silver thread, pale shoes",
      "Gold seals, royal scrollwork",
      "Meteor dust, star-black shoes",
    ],
  },
  {
    id: "charmward",
    name: "Charmward",
    slot: "shield",
    magicAttackPerTier: 2,
    magicDefencePerTier: 1,
    weight: 0.6,
    baseValue: 22,
    notes: [
      "Scrap wood, mismatched beads",
      "Slate beads, chalk marks",
      "Glass beads, wax-sealed",
      "Brass beads, golden wax",
      "Black beads, salt sigils",
      "Blue-white beads, licensed",
      "Green beads, moss",
      "Bone beads, grey cloth",
      "Blue crystal beads, polished",
      "Red ink beads, black vellum",
      "Silver beads, pale",
      "Gold beads, royal scrollwork",
      "Meteor beads, star-black",
    ],
  },
];

const weapons = [];
for (const family of WEAPON_FAMILIES) {
  for (const tier of TIERS) {
    weapons.push(createWeapon(family, tier));
  }
}

const armour = [];
for (const slot of ARMOUR_SLOTS) {
  for (const tier of TIERS) {
    armour.push(createArmour(slot, tier));
  }
}

writeFileSync("content/items/magic-weapons.json", JSON.stringify(weapons, null, 2));
writeFileSync("content/items/magic-armour.json", JSON.stringify(armour, null, 2));

console.log(`Generated ${weapons.length} magic weapons and ${armour.length} magic armour items.`);
