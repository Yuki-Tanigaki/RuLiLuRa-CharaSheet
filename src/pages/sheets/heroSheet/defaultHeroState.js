// src/pages/sheets/heroSheet/defaultHeroState.js

export function defaultHeroState() {
  return {
    version: 1,
    basic: {
      playerName: "",
      name: "",
      age: "",
      gender: "",
      nationality: "",
      job: "",
      heroLevel: 1,
      pairExp: 0,
    },
    abilities: {
      method: "point",
      str: 10,
      dex: 10,
      agi: 10,
      vit: 10,
      int: 10,
      psy: 10,
    },
    // HP MP値などに対する補正値
    resources: {
      hpNormalRv: 0,
      hpWoundRv: 0,
      mpRv: 0,
    },
    // スキル
    skills: {
      // 可変長（最初は空でOK）
      rows: [],
      intBonusTargets: [],
      dexBonusTargets: [],
      // create時の「無料獲得」管理
      freeItemPicks: {},   // { [skillName]: "kind:id" }
      freeItemClaims: {},  // { [skillName]: true }
    },
    // 英雄スキル
    heroSkills: {
      rows: [],
    },
    equipment: {
      inventory: [], // [{kind,id,qty}]
      moneyG: 0,
      fp: 0,
      equipped: {
        weaponRightId: null,
        weaponLeftId: null,
        armorId: null,
        shieldId: null,
      },
    },
    memo: "",
  };
}
