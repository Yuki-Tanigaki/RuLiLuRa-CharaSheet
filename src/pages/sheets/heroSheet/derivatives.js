// src/pages/sheets/heroSheet/derivatives.js

import { safeNum } from "/src/common/utils/number.js";

/**
 * 能力修正（SW系によくある「10を基準」）
 * 例: 10→0, 12→+2, 7→-3
 */
export function abilityMod(score) {
  return safeNum(score, 0) - 10;
}

/**
 * HP/MP の基礎値（能力値からの派生）
 */
export function calcHeroHP(abilities) {
  const a = abilities ?? {};
  return {
    hpNormal: safeNum(a.str, 0) + safeNum(a.dex, 0),
    hpWound: safeNum(a.agi, 0) + safeNum(a.vit, 0),
    mp: safeNum(a.int, 0) + safeNum(a.psy, 0),
  };
}

/**
 * 戦闘系の基礎値（能力修正からの派生）
 */
export function calcHeroCombat(abilities) {
  const a = abilities ?? {};
  return {
    melee: abilityMod(a.str) + abilityMod(a.agi),
    ranged: abilityMod(a.dex) + abilityMod(a.int),
    resist: abilityMod(a.psy) + abilityMod(a.vit),
  };
}

/**
 * 所持金の基礎値（能力値からの派生）
 * ※ ルールが変わるならここだけ差し替えればOK
 */
export function calcHeroMoney(abilities) {
  const a = abilities ?? {};
  return safeNum(a.int, 0) * safeNum(a.dex, 0) * 1000;
}

/**
 * HeroSheet の「派生値」まとめ
 * - useHeroSheetModel 側で useMemo して呼ぶ想定
 */
export function calcHeroDerived(state) {
  const a = state?.abilities ?? {};

  return {
    mods: {
      str: abilityMod(a.str),
      dex: abilityMod(a.dex),
      agi: abilityMod(a.agi),
      vit: abilityMod(a.vit),
      int: abilityMod(a.int),
      psy: abilityMod(a.psy),
    },
    hp: calcHeroHP(a),
    combat: calcHeroCombat(a),
    moneyG: calcHeroMoney(a),
  };
}
