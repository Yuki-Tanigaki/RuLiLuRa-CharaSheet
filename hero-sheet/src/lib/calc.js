import { SKILL_ID_EVADE } from "../data/skillsMaster.js";

/** ability mod = value - 10 */
export function mod(v) {
  const n = Number(v) || 0;
  return n - 10;
}

export function floorTo10WithNegRule(n) {
  // 1の位切り捨てで10単位化。ただし -1~-10 は -10
  const x = Number(n) || 0;
  if (x < 0 && x > -10) return -10;
  return Math.floor(x / 10) * 10;
}

export function calcDerived(state) {
  const a = state.abilities;

  const m = {
    str: mod(a.str),
    dex: mod(a.dex),
    agi: mod(a.agi),
    vit: mod(a.vit),
    int: mod(a.int),
    psy: mod(a.psy),
  };

  const hp = {
    normal: (Number(a.str) || 0) + (Number(a.dex) || 0),
    wound: (Number(a.agi) || 0) + (Number(a.vit) || 0),
    mp: (Number(a.int) || 0) + (Number(a.psy) || 0),
  };

  const combat = {
    melee: m.str + m.agi,
    ranged: m.dex + m.int,
    resist: m.psy + m.vit,
  };

  // equipment (free input)
  const armorPenalty = Number(state.equipment.armor.evadePenalty) || 0;
  const shieldBonus = Number(state.equipment.shield.evadeBonus) || 0;
  const armorDef = Number(state.equipment.armor.def) || 0;
  const shieldDef = Number(state.equipment.shield.def) || 0;

  const defense = armorDef + shieldDef;

  // skills
  const selected = state.skills.selected; // [{id, base}]
  const baseById = new Map(selected.filter(s => s.id != null).map(s => [s.id, Number(s.base) || 0]));

  const intMod = m.int;
  const dexMod = m.dex;

  const intTargets = new Set(state.skills.intBonusTargets || []);
  const dexTargets = new Set(state.skills.dexBonusTargets || []);

  function finalSkillValue(id) {
    const base = baseById.get(id) ?? 0;
    let bonus = 0;
    if (intMod > 0 && intTargets.has(id)) bonus += intMod;
    if (dexMod > 0 && dexTargets.has(id)) bonus += dexMod;
    return base + bonus;
  }

  const evadeSkill = finalSkillValue(SKILL_ID_EVADE); // 未取得なら0扱い

  const evadeRaw = m.agi + evadeSkill + armorPenalty + shieldBonus;
  const evadeAdj = floorTo10WithNegRule(evadeRaw);

  const money = (Number(a.int) || 0) * (Number(a.dex) || 0) * 1000;

  return {
    mods: m,
    hp,
    combat,
    evade: { raw: evadeRaw, adj: evadeAdj },
    defense,
    money,
    finalSkillValue, // helper
  };
}

// 2D10
export function roll2d10(rng = Math.random) {
  const d1 = 1 + Math.floor(rng() * 10);
  const d2 = 1 + Math.floor(rng() * 10);
  return d1 + d2;
}
