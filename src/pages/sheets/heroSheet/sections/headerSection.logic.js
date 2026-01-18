// src/pages/sheets/heroSheet/sections/headerSection.logic.js
import { safeNum, clamp } from "/src/common/utils/number.js";

export const ABILITY_KEYS = [
  { k: "str", label: "筋力" },
  { k: "dex", label: "器用さ" },
  { k: "agi", label: "敏捷" },
  { k: "vit", label: "生命力" },
  { k: "int", label: "知力" },
  { k: "psy", label: "精神力" },
];

export const ABILITY_MIN = 2;
export const ABILITY_MAX = 20;
export const POINT_SUM = 70;
export const REROLL_SUM_MAX = 65;

// -------------------- dice --------------------
export function roll1d10(rng = Math.random) {
  return 1 + Math.floor(rng() * 10);
}
export function roll2d10(rng = Math.random) {
  return roll1d10(rng) + roll1d10(rng);
}
export function rollAbilities2d10(rng = Math.random) {
  const values = {};
  for (const x of ABILITY_KEYS) values[x.k] = roll2d10(rng);
  const sum = calcAbilitySum(values);
  return { values, sum };
}

// -------------------- ability rules --------------------
export function calcAbilitySum(values) {
  let sum = 0;
  for (const x of ABILITY_KEYS) sum += safeNum(values?.[x.k], 0);
  return sum;
}

export function isAbilityValidRange(values) {
  for (const x of ABILITY_KEYS) {
    const v = safeNum(values?.[x.k], 0);
    if (v < ABILITY_MIN) return false;
  }
  return true;
}

export function isPointOk(values) {
  return isAbilityValidRange(values) && calcAbilitySum(values) === POINT_SUM;
}

export function canReroll(sum) {
  return safeNum(sum, 0) <= REROLL_SUM_MAX;
}

export function swapValues(values, aKey, bKey) {
  if (!values) return values;
  if (!aKey || !bKey || aKey === bKey) return values;

  const v = { ...values };
  const va = safeNum(v[aKey], 0);
  const vb = safeNum(v[bKey], 0);
  v[aKey] = vb;
  v[bKey] = va;
  return v;
}

export function clampAbilities(values) {
  const out = {};
  for (const x of ABILITY_KEYS) {
    out[x.k] = clamp(safeNum(values?.[x.k], 0), ABILITY_MIN, ABILITY_MAX);
  }
  return out;
}

// -------------------- derived (mods / HPMP) --------------------

/**
 * 能力修正（SW系によくある「10を基準」）
 * 例: 10→0, 12→+2, 7→-3
 */
export function abilityMod(score) {
  return safeNum(score, 0) - 10;
}

/** abilities から mods を一括生成 */
export function calcAbilityMods(abilities) {
  const a = abilities ?? {};
  return {
    str: abilityMod(a.str),
    dex: abilityMod(a.dex),
    agi: abilityMod(a.agi),
    vit: abilityMod(a.vit),
    int: abilityMod(a.int),
    psy: abilityMod(a.psy),
  };
}

/**
 * HP/MP の基礎値（能力値からの派生）
 * ※もし後でルールが変わるならここだけ変えれば Header 全体が追随する
 */
export function calcHeroHP(abilities) {
  const a = abilities ?? {};
  return {
    hpNormal: safeNum(a.str, 0) + safeNum(a.dex, 0),
    hpWound: safeNum(a.agi, 0) + safeNum(a.vit, 0),
    mp: safeNum(a.int, 0) + safeNum(a.psy, 0),
  };
}

/** state に保存しているRV込みで、Header表示用の値をまとめて計算 */
export function calcShownResources({ hp, resources }) {
  const NormalRV = safeNum(resources?.hpNormalRV, 0);
  const WoundRV = safeNum(resources?.hpWoundRV, 0);
  const MpRV = safeNum(resources?.mpRV, 0);

  const baseNormal = safeNum(hp?.hpNormal, 0);
  const baseWound = safeNum(hp?.hpWound, 0);
  const baseMp = safeNum(hp?.mp, 0);

  return {
    NormalRV,
    WoundRV,
    MpRV,
    baseNormal,
    baseWound,
    baseMp,
    shownNormal: baseNormal + NormalRV,
    shownWound: baseWound + WoundRV,
    shownMp: baseMp + MpRV,
  };
}

// -------------------- actions (use setField) --------------------
export function applyRolledAbilities(setField, rolledValues) {
  if (!setField || !rolledValues) return;
  const v = clampAbilities(rolledValues);
  setField(["abilities"], (prev) => ({
    ...(prev ?? {}),
    method: "roll",
    ...v,
  }));
}

export function calcInitialMoneyFromIntDex(abilities) {
  const i = safeNum(abilities?.int, 0);
  const dx = safeNum(abilities?.dex, 0);
  return Math.max(0, i * dx * 1000);
}

export function setInitialMoney(setField, abilities) {
  if (!setField) return;
  const g = calcInitialMoneyFromIntDex(abilities);
  setField(["equipment", "moneyG"], g);
}

/**
 * HeaderSection が欲しい派生値一式をまとめて返す（テスト用にも便利）
 * - a: abilities
 * - mods: ability修正
 * - hp: HP/MP基礎
 * - res: RV込み表示値
 * - moneyG/fp: equipmentから
 */
export function buildHeaderDerived(state) {
  const s = state ?? {};
  const a = s.abilities ?? {};
  const mods = calcAbilityMods(a);
  const hp = calcHeroHP(a);
  const res = calcShownResources({ hp, resources: s.resources });

  return {
    a,
    mods,
    hp,
    res,
    moneyG: safeNum(s?.equipment?.moneyG, 0),
    fp: safeNum(s?.equipment?.fp, 0),
  };
}
