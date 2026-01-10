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
  const a = state.abilities || {};

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

  // ------------------------------------------------------------
  // equipment: いまは「所持品(items)のみ」＝装備による計算は未実装
  // 旧JSONが混ざっても落ちないように optional で拾う（互換）
  // ------------------------------------------------------------
  const eq = state.equipment || {};

  // 新仕様（所持品のみ）では装備補正はゼロ扱い
  let armorPenalty = 0;
  let shieldBonus = 0;
  let armorDef = 0;
  let shieldDef = 0;

  // 旧仕様データが残っている場合だけ、互換で反映（いらなければこの if ブロック削除OK）
  if (eq.armor || eq.shield) {
    armorPenalty = Number(eq.armor?.evadePenalty) || 0;
    shieldBonus = Number(eq.shield?.evadeBonus) || 0;
    armorDef = Number(eq.armor?.def) || 0;
    shieldDef = Number(eq.shield?.def) || 0;
  }

  const defense = armorDef + shieldDef;

  // skills
  const selected = state.skills?.selected || []; // [{id, base}]
  const baseById = new Map(
    selected.filter(s => s?.id != null).map(s => [s.id, Number(s.base) || 0])
  );

  const intMod = m.int;
  const dexMod = m.dex;

  const intTargets = new Set(state.skills?.intBonusTargets || []);
  const dexTargets = new Set(state.skills?.dexBonusTargets || []);

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
