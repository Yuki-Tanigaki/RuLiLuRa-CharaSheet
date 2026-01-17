// src/pages/sheets/divaSheet/defaultDivaState.js
export function defaultDivaState() {
  return {
    version: 1,
    basic: {
      playerName: "",
      name: "",
      age: "",
      gender: "",
      nationality: "",
      divaLevel: 1,
      rank: 1,
      exp: 0,
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
    // HP値に対する補正値
    resources: {
      hpNormalRv: 0,
      hpWoundRv: 0,
    },
    // スキル
    skills: {
      // 可変長（最初は空でOK）
      rows: [],
    },
    // 英雄スキル
    heroSkills: {
      rows: [],
    },
    // 歌姫スキル
    divaSkills: {
      rows: [],
    },
    // 歌姫アクション
    divaActions: {
      rows: [],
    },
    // 歌姫ステータス
    divaStatuses: {
      affinityLevel: 1,
      physicalLoss: 0,
      mentalLoss: 0,
      bondLoss: 0,
      bondGain: 0
    },
    // NG行動
    ngs: {
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
    // ユーザが独自に定義したカタログ
    userCatalog: defaultCatalogState(),
    memo: "",
  };
}
