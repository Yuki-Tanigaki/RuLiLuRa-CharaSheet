// src/data/weaponsMaster.js
// 修正版（あなたが貼ってくれた最新の表に合わせて反映）
//
// 方針:
// - 価格/FP/攻撃回数/対甲/基本命中値など「●」「なし」「特殊」「1/2」が混ざる列は、まず raw のまま保持（string）。
// - 武器スキルは SKILLS_MASTER の id に寄せて skillId で保持（不明/該当なしは null）。
// - 「回避値−10」等は evadeMod に数値で保持（それ以外は 0）。
// - 防具の「防御値２」等は defenseValue に数値で保持（武器は null）。
//
// 依存：skillsMaster.js の SKILLS_MASTER / skillNameById はそのまま利用OK

export const WEAPONS_MASTER = [
  // ---- 接近戦 ----
  {
    id: 1,
    name: "ダガー",
    category: "weapon",
    price: "200",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "白",
    attacks: "1",
    baseHit: "25",
    skillId: 1, // 接近戦
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10−３＋筋力修正",
    requirement: "",
    defenseValue: null
  },
  {
    id: 2,
    name: "拳闘",
    category: "weapon",
    price: "無料",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "白",
    attacks: "1",
    baseHit: "25",
    skillId: 1, // 接近戦
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10−４＋筋力修正",
    requirement: "",
    defenseValue: null
  },
  {
    id: 3,
    name: "ブラスナックル",
    category: "weapon",
    price: "10000",
    fp: "●",
    tl: 2,
    hand: "片",
    range: "白",
    attacks: "1",
    baseHit: "30",
    skillId: 1, // 接近戦
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10−２＋筋力修正",
    requirement: "",
    defenseValue: null
  },

  // ---- 剣技 ----
  {
    id: 4,
    name: "ショートソード",
    category: "weapon",
    price: "10000",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "白",
    attacks: "1",
    baseHit: "40",
    skillId: 2, // 剣技
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10＋筋力修正",
    requirement: "",
    defenseValue: null
  },
  {
    id: 5,
    name: "ロングソード",
    category: "weapon",
    price: "15000",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "白",
    attacks: "1",
    baseHit: "30",
    skillId: 2, // 剣技
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10＋５＋筋力修正",
    requirement: "",
    defenseValue: null
  },
  {
    id: 6,
    name: "グレートソード",
    category: "weapon",
    price: "25000",
    fp: "●",
    tl: 1,
    hand: "両",
    range: "白",
    attacks: "1",
    baseHit: "25",
    skillId: 2, // 剣技
    evadeMod: 0,
    antiArmor: "0",
    damage: "２D10＋６＋筋力修正",
    requirement: "",
    defenseValue: null
  },
  {
    id: 7,
    name: "カタナ",
    category: "weapon",
    price: "購入不可",
    fp: "5",
    tl: 2,
    hand: "片",
    range: "白",
    attacks: "1",
    baseHit: "35",
    skillId: 2, // 剣技
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10＋４＋筋力修正",
    requirement: "",
    defenseValue: null
  },

  // ---- 斧／槌戦闘 ----
  {
    id: 8,
    name: "アクス",
    category: "weapon",
    price: "10000",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "白",
    attacks: "1",
    baseHit: "25",
    skillId: 3, // 斧／槌戦闘
    evadeMod: 0,
    antiArmor: "0",
    damage: "２D10＋筋力修正",
    requirement: "",
    defenseValue: null
  },
  {
    id: 9,
    name: "バトルアクス",
    category: "weapon",
    price: "15000",
    fp: "●",
    tl: 1,
    hand: "両",
    range: "白",
    attacks: "1",
    baseHit: "20",
    skillId: 3, // 斧／槌戦闘
    evadeMod: 0,
    antiArmor: "0",
    damage: "２D10×２−４＋筋力修正",
    requirement: "",
    defenseValue: null
  },
  {
    id: 10,
    name: "ハンマー",
    category: "weapon",
    price: "12000",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "白",
    attacks: "1",
    baseHit: "25",
    skillId: 3, // 斧／槌戦闘
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10×２＋筋力修正",
    requirement: "",
    defenseValue: null
  },
  {
    id: 11,
    name: "棍棒",
    category: "weapon",
    price: "無料",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "白",
    attacks: "1",
    baseHit: "25",
    skillId: 3, // 斧／槌戦闘
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10×２−４＋筋力修正",
    requirement: "",
    defenseValue: null
  },

  // ---- 槍／棒術 ----
  {
    id: 12,
    name: "杖（棒）",
    category: "weapon",
    price: "2000",
    fp: "●",
    tl: 1,
    hand: "両",
    range: "白",
    attacks: "1",
    baseHit: "15",
    skillId: 4, // 槍／棒術
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10−４＋筋力修正",
    requirement: "",
    defenseValue: null
  },
  {
    id: 13,
    name: "ショートスピア",
    category: "weapon",
    price: "12000",
    fp: "●",
    tl: 1,
    hand: "両",
    range: "白",
    attacks: "1",
    baseHit: "40",
    skillId: 4, // 槍／棒術
    evadeMod: 0,
    antiArmor: "0",
    damage: "２Ｄ10−３＋筋力修正",
    requirement: "",
    defenseValue: null
  },
  {
    id: 14,
    name: "ロングスピア",
    category: "weapon",
    price: "15000",
    fp: "●",
    tl: 1,
    hand: "両",
    range: "白",
    attacks: "1",
    baseHit: "35",
    skillId: 4, // 槍／棒術
    evadeMod: 0,
    antiArmor: "0",
    damage: "２Ｄ10＋筋力修正",
    requirement: "",
    defenseValue: null
  },

  // ---- 弓術 ----
  {
    id: 15,
    name: "ショートボウ",
    category: "weapon",
    price: "26000",
    fp: "●",
    tl: 1,
    hand: "両",
    range: "近",
    attacks: "2",
    baseHit: "30",
    skillId: 7, // 弓術
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10＋２",
    requirement: "",
    defenseValue: null
  },
  {
    id: 16,
    name: "ロングボウ",
    category: "weapon",
    price: "32000",
    fp: "●",
    tl: 1,
    hand: "両",
    range: "近",
    attacks: "1",
    baseHit: "25",
    skillId: 7, // 弓術
    evadeMod: 0,
    antiArmor: "0",
    damage: "２D10",
    requirement: "",
    defenseValue: null
  },
  {
    id: 17,
    name: "クロスボウ",
    category: "weapon",
    price: "40000",
    fp: "●",
    tl: 1,
    hand: "両",
    range: "近",
    attacks: "1/2",
    baseHit: "35",
    skillId: 7, // 弓術
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10×３",
    requirement: "",
    defenseValue: null
  },

  // ---- 特殊武器 ----
  {
    id: 18,
    name: "ムチ",
    category: "weapon",
    price: "12000",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "白",
    attacks: "1",
    baseHit: "10",
    skillId: 8, // 特殊武器
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10−１＋筋力修正",
    requirement: "",
    defenseValue: null
  },

  // ---- 拳銃射撃 ----
  {
    id: 19,
    name: "ピストル",
    category: "weapon",
    price: "35000",
    fp: "●",
    tl: 2,
    hand: "片",
    range: "近",
    attacks: "1",
    baseHit: "35",
    skillId: 9, // 拳銃射撃
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10＋４",
    requirement: "現武5",
    defenseValue: null
  },
  {
    id: 20,
    name: "マシンピストル",
    category: "weapon",
    price: "40000",
    fp: "●",
    tl: 3,
    hand: "片",
    range: "近",
    attacks: "2",
    baseHit: "30",
    skillId: 9, // 拳銃射撃
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10＋６",
    requirement: "現武10",
    defenseValue: null
  },
  {
    id: 21,
    name: "対甲ピストル",
    category: "weapon",
    price: "購入不可",
    fp: "5",
    tl: 2,
    hand: "両",
    range: "近",
    attacks: "1",
    baseHit: "10",
    skillId: 9, // 拳銃射撃
    evadeMod: 0,
    antiArmor: "1/2",
    damage: "２D10＋４",
    requirement: "現武10",
    defenseValue: null
  },

  // ---- ライフル射撃 ----
  {
    id: 22,
    name: "ライフル",
    category: "weapon",
    price: "60000",
    fp: "●",
    tl: 2,
    hand: "両",
    range: "長",
    attacks: "1",
    baseHit: "40",
    skillId: 10, // ライフル射撃
    evadeMod: 0,
    antiArmor: "0",
    damage: "３D10",
    requirement: "現武5",
    defenseValue: null
  },
  {
    id: 23,
    name: "狙撃銃",
    category: "weapon",
    price: "300000",
    fp: "●",
    tl: 3,
    hand: "両",
    range: "長",
    attacks: "1",
    baseHit: "45",
    skillId: 10, // ライフル射撃
    evadeMod: 0,
    antiArmor: "0",
    damage: "４D10",
    requirement: "現武20",
    defenseValue: null
  },
  {
    id: 24,
    name: "対甲ライフル",
    category: "weapon",
    price: "購入不可",
    fp: "18",
    tl: 3,
    hand: "両",
    range: "中",
    attacks: "1/2",
    baseHit: "35",
    skillId: 10, // ライフル射撃
    evadeMod: 0,
    antiArmor: "1/2",
    damage: "４D10",
    requirement: "現武15",
    defenseValue: null
  },
  {
    id: 25,
    name: "ショットガン",
    category: "weapon",
    price: "50000",
    fp: "●",
    tl: 2,
    hand: "両",
    range: "近",
    attacks: "1/2",
    baseHit: "30",
    skillId: 10, // ライフル射撃
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10×５",
    requirement: "現武10",
    defenseValue: null
  },

  // ---- 自動小銃射撃 ----
  {
    id: 26,
    name: "サブマシンガン（SMG）",
    category: "weapon",
    price: "80000",
    fp: "●",
    tl: 3,
    hand: "片",
    range: "近",
    attacks: "2",
    baseHit: "30",
    skillId: 11, // 自動小銃射撃
    evadeMod: 0,
    antiArmor: "0",
    damage: "２D10",
    requirement: "現武10",
    defenseValue: null
  },
  {
    id: 27,
    name: "アサルトライフル",
    category: "weapon",
    price: "80000",
    fp: "●",
    tl: 3,
    hand: "両",
    range: "近",
    attacks: "2",
    baseHit: "35",
    skillId: 11, // 自動小銃射撃
    evadeMod: 0,
    antiArmor: "0",
    damage: "２D10＋３",
    requirement: "現武10",
    defenseValue: null
  },
  {
    id: 28,
    name: "重機関銃",
    category: "weapon",
    price: "90000",
    fp: "10",
    tl: 3,
    hand: "両",
    range: "中",
    attacks: "3",
    baseHit: "25",
    skillId: 11, // 自動小銃射撃
    evadeMod: 0,
    antiArmor: "0",
    damage: "２D10＋３",
    requirement: "現武20",
    defenseValue: null
  },

  // ---- ロケット／ミサイル ----
  {
    id: 29,
    name: "ロケットランチャー",
    category: "weapon",
    price: "300000",
    fp: "15",
    tl: 4,
    hand: "両",
    range: "中",
    attacks: "1",
    baseHit: "30",
    skillId: 12, // ロケット／ミサイル
    evadeMod: 0,
    antiArmor: "1",
    damage: "１D10×３（注２）（注３）",
    requirement: "現武15",
    defenseValue: null
  },
  {
    id: 30,
    name: "対戦車ミサイル",
    category: "weapon",
    price: "400000",
    fp: "20",
    tl: 4,
    hand: "両",
    range: "中",
    attacks: "1",
    baseHit: "35",
    skillId: 12, // ロケット／ミサイル
    evadeMod: 0,
    antiArmor: "1",
    damage: "１D10×３（注２）（注３）",
    requirement: "現武15",
    defenseValue: null
  },
  {
    id: 31,
    name: "地対空ミサイル",
    category: "weapon",
    price: "1000000",
    fp: "40",
    tl: 5,
    hand: "両",
    range: "長",
    attacks: "1",
    baseHit: "50",
    skillId: 12, // ロケット／ミサイル
    evadeMod: 0,
    antiArmor: "1",
    damage: "１D10×４（注２）（注３）",
    requirement: "現武15",
    defenseValue: null
  },

  // ---- キャノン ----
  {
    id: 32,
    name: "携帯型無反動砲",
    category: "weapon",
    price: "800000",
    fp: "40",
    tl: 3,
    hand: "両",
    range: "近",
    attacks: "1/2",
    baseHit: "35",
    skillId: 13, // キャノン
    evadeMod: 0,
    antiArmor: "1",
    damage: "１D10×３（注２）",
    requirement: "現武20",
    defenseValue: null
  },

  // ---- 爆発物 ----
  {
    id: 33,
    name: "手榴弾",
    category: "weapon",
    price: "20000",
    fp: "●",
    tl: 2,
    hand: "片",
    range: "近",
    attacks: "1",
    baseHit: "10",
    skillId: 14, // 爆発物
    evadeMod: 0,
    antiArmor: "0",
    damage: "１D10×３（注２）（注３）",
    requirement: "現武5",
    defenseValue: null
  },
  {
    id: 34,
    name: "対甲地雷",
    category: "weapon",
    price: "購入不可",
    fp: "10",
    tl: 2,
    hand: "両",
    range: "近",
    attacks: "特殊",
    baseHit: "0",
    skillId: 14, // 爆発物
    evadeMod: 0,
    antiArmor: "1",
    damage: "１D10×５（注２）（注３）",
    requirement: "現武5",
    defenseValue: null
  },

  // ---- 盾 ----
  {
    id: 35,
    name: "小盾",
    category: "shield",
    price: "4000",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "●",
    attacks: "なし",
    baseHit: "●",
    skillId: null,
    evadeMod: 0,
    antiArmor: "防御値２",
    damage: "",
    requirement: "盾防御10",
    defenseValue: 2
  },
  {
    id: 36,
    name: "盾",
    category: "shield",
    price: "10000",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "●",
    attacks: "なし",
    baseHit: "●",
    skillId: null,
    evadeMod: 0,
    antiArmor: "防御値３",
    damage: "",
    requirement: "盾防御16",
    defenseValue: 3
  },
  {
    id: 37,
    name: "大型の盾",
    category: "shield",
    price: "20000",
    fp: "●",
    tl: 1,
    hand: "片",
    range: "●",
    attacks: "なし",
    baseHit: "●",
    skillId: null,
    evadeMod: -10,
    antiArmor: "防御値６",
    damage: "",
    requirement: "盾防御22",
    defenseValue: 6
  },

  // ---- 防具 ----
  {
    id: 38,
    name: "部分ヨロイ",
    category: "armor",
    price: "5000",
    fp: "●",
    tl: 1,
    hand: "●",
    range: "●",
    attacks: "なし",
    baseHit: "●",
    skillId: null,
    evadeMod: 0,
    antiArmor: "防御値２",
    damage: "",
    requirement: "",
    defenseValue: 2
  },
  {
    id: 39,
    name: "皮ヨロイ",
    category: "armor",
    price: "10000",
    fp: "●",
    tl: 1,
    hand: "●",
    range: "●",
    attacks: "なし",
    baseHit: "●",
    skillId: null,
    evadeMod: 0,
    antiArmor: "防御値３",
    damage: "",
    requirement: "",
    defenseValue: 3
  },
  {
    id: 40,
    name: "鎖かたびら",
    category: "armor",
    price: "30000",
    fp: "●",
    tl: 1,
    hand: "●",
    range: "●",
    attacks: "なし",
    baseHit: "●",
    skillId: null,
    evadeMod: -10,
    antiArmor: "防御値４",
    damage: "",
    requirement: "",
    defenseValue: 4
  },
  {
    id: 41,
    name: "板金ヨロイ",
    category: "armor",
    price: "100000",
    fp: "●",
    tl: 1,
    hand: "●",
    range: "●",
    attacks: "なし",
    baseHit: "●",
    skillId: null,
    evadeMod: -20,
    antiArmor: "防御値６",
    damage: "",
    requirement: "",
    defenseValue: 6
  },
  {
    id: 42,
    name: "甲冑（かっちゅう）",
    category: "armor",
    price: "200000",
    fp: "10",
    tl: 1,
    hand: "●",
    range: "●",
    attacks: "なし",
    baseHit: "●",
    skillId: null,
    evadeMod: -30,
    antiArmor: "防御値８",
    damage: "",
    requirement: "",
    defenseValue: 8
  }
];

// 取得ユーティリティ
export function weaponById(id) {
  return WEAPONS_MASTER.find(w => w.id === id) || null;
}

export function weaponByName(name) {
  return WEAPONS_MASTER.find(w => w.name === name) || null;
}
