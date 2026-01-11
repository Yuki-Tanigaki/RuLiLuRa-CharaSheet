/**
 * 武器マスター
 * ■ フィールド説明
 * id: number
 *   武器ID（一意・固定）
 *
 * name: string
 *   武器名
 *
 * price: number | null
 *   価格（null の場合は購入不可）
 *
 * fp: number | null
 *   FP 消費量（null の場合は FP 消費なし）
 *
 * tl: number
 *   技術レベル（Technology Level）
 *
 * grip: "片手" | "両手"
 *   武器の基本的な持ち方
 *   ※一部の武器はルール上「両手で扱うことも可能」だが、
 *     そのような例外は memo に記述し、装備状態側で処理する
 *
 * range: "白" | "近" | "中" | "長"
 *   射程区分
 *
 * attacks: string
 *   攻撃回数・頻度（例: "1/T", "2/T", "1/2T", "特殊"）
 *
 * baseHit: number
 *   基本命中値
 *
 * skill: string
 *   使用スキル名
 *
 * antiArmor: number
 *   対装甲補正（0 / 0.5 / 1 など）
 *
 * damage: string
 *   ダメージ表記（表示用文字列）
 *   例: "1D10 - 3 + {筋力修正}"
 *
 * requirement: string
 *   使用条件
 *
 * memo: string
 *   特記事項・例外ルール
 */

export const WEAPONS_MASTER = [
  // ---- 接近戦 ----
  {
    id: 1,
    name: "ダガー",
    price: 200,
    fp: null,
    tl: 1,
    grip: "片手",
    range: "白",
    attacks: "1/T",
    baseHit: 25,
    skill: "接近戦",
    antiArmor: 0,
    damage: "1D10 - 3 + {筋力修正}",
    requirement: [],
    memo: ""
  },
  {
    id: 2,
    name: "拳闘",
    price: 0,
    fp: null,
    tl: 1,
    grip: "片手",
    range: "白",
    attacks: "1/T",
    baseHit: 25,
    skill: "接近戦",
    antiArmor: 0,
    damage: "1D10 - 4 + {筋力修正}",
    requirement: [],
    memo: ""
  },
  {
    id: 3,
    name: "ブラスナックル",
    price: 10000,
    fp: null,
    tl: 2,
    grip: "片手",
    range: "白",
    attacks: "1/T",
    baseHit: 30,
    skill: "接近戦",
    antiArmor: 0,
    damage: "1D10 - 2 + {筋力修正}",
    requirement: [],
    memo: ""
  },

  // ---- 剣技 ----
  {
    id: 4,
    name: "ショートソード",
    price: 10000,
    fp: null,
    tl: 1,
    grip: "片手",
    range: "白",
    attacks: "1/T",
    baseHit: 40,
    skill: "剣技",
    antiArmor: 0,
    damage: "1D10 + {筋力修正}",
    requirement: [],
    memo: ""
  },
  {
    id: 5,
    name: "ロングソード",
    price: 15000,
    fp: null,
    tl: 1,
    grip: "片手",
    range: "白",
    attacks: "1/T",
    baseHit: 30,
    skill: "剣技",
    antiArmor: 0,
    damage: "1D10 + 5 + {筋力修正}",
    requirement: [],
    memo: ""
  },
  {
    id: 6,
    name: "グレートソード",
    price: 25000,
    fp: null,
    tl: 1,
    grip: "両手",
    range: "白",
    attacks: "1/T",
    baseHit: 25,
    skill: "剣技",
    antiArmor: 0,
    damage: "2D10 + 6 + {筋力修正}",
    requirement: [],
    memo: ""
  },
  {
    id: 7,
    name: "カタナ",
    price: null,
    fp: 5,
    tl: 2,
    grip: "片手",
    range: "白",
    attacks: "1/T",
    baseHit: 35,
    skill: "剣技",
    antiArmor: 0,
    damage: "1D10 + 4 + {筋力修正}",
    requirement: [],
    memo: "両手で扱うことも可能。その場合はダメージに＋４"
  },

  // ---- 斧／槌戦闘 ----
  {
    id: 8,
    name: "アクス",
    price: 10000,
    fp: null,
    tl: 1,
    grip: "片手",
    range: "白",
    attacks: "1/T",
    baseHit: 25,
    skill: "斧／槌戦闘",
    antiArmor: 0,
    damage: "2D10 + {筋力修正}",
    requirement: [],
    memo: ""
  },
  {
    id: 9,
    name: "バトルアクス",
    price: 15000,
    fp: null,
    tl: 1,
    grip: "両手",
    range: "白",
    attacks: "1/T",
    baseHit: 20,
    skill: "斧／槌戦闘",
    antiArmor: 0,
    damage: "2D10 * 2 - 4 + {筋力修正}",
    requirement: [],
    memo: ""
  },
  {
    id: 10,
    name: "ハンマー",
    price: 12000,
    fp: null,
    tl: 1,
    grip: "片手",
    range: "白",
    attacks: "1/T",
    baseHit: 25,
    skill: "斧／槌戦闘",
    antiArmor: 0,
    damage: "1D10 * 2 + {筋力修正}",
    requirement: [],
    memo: ""
  },
  {
    id: 11,
    name: "棍棒",
    price: 0,
    fp: null,
    tl: 1,
    grip: "片手",
    range: "白",
    attacks: "1/T",
    baseHit: 25,
    skill: "斧／槌戦闘",
    antiArmor: 0,
    damage: "1D10 * 2 - 4 + {筋力修正}",
    requirement: [],
    memo: ""
  },

  // ---- 槍／棒術 ----
  {
    id: 12,
    name: "杖（棒）",
    price: 2000,
    fp: null,
    tl: 1,
    grip: "両手",
    range: "白",
    attacks: "1/T",
    baseHit: 15,
    skill: "槍／棒術",
    antiArmor: 0,
    damage: "1D10 - 4 + {筋力修正}",
    requirement: [],
    memo: ""
  },
  {
    id: 13,
    name: "ショートスピア",
    price: 12000,
    fp: null,
    tl: 1,
    grip: "両手",
    range: "白",
    attacks: "1/T",
    baseHit: 40,
    skill: "槍／棒術",
    antiArmor: 0,
    damage: "2D10 - 3 + {筋力修正}",
    requirement: [],
    memo: ""
  },
  {
    id: 14,
    name: "ロングスピア",
    price: 15000,
    fp: null,
    tl: 1,
    grip: "両手",
    range: "白",
    attacks: "1/T",
    baseHit: 35,
    skill: "槍／棒術",
    antiArmor: 0,
    damage: "2D10 + {筋力修正}",
    requirement: [],
    memo: ""
  },

  // ---- 弓術 ----
  {
    id: 15,
    name: "ショートボウ",
    price: 26000,
    fp: null,
    tl: 1,
    grip: "両手",
    range: "近",
    attacks: "2/T",
    baseHit: 30,
    skill: "弓術",
    antiArmor: 0,
    damage: "1D10 + 2",
    requirement: [],
    memo: ""
  },
  {
    id: 16,
    name: "ロングボウ",
    price: 32000,
    fp: null,
    tl: 1,
    grip: "両手",
    range: "近",
    attacks: "1/T",
    baseHit: 25,
    skill: "弓術",
    antiArmor: 0,
    damage: "2D10",
    requirement: [],
    memo: ""
  },
  {
    id: 17,
    name: "クロスボウ",
    price: 40000,
    fp: null,
    tl: 1,
    grip: "両手",
    range: "近",
    attacks: "1/2T",
    baseHit: 35,
    skill: "弓術",
    antiArmor: 0,
    damage: "1D10 * 3",
    requirement: [],
    memo: ""
  },

  // ---- 特殊武器 ----
  {
    id: 18,
    name: "ムチ",
    price: 12000,
    fp: null,
    tl: 1,
    grip: "片手",
    range: "白",
    attacks: "1/T",
    baseHit: 10,
    skill: "特殊武器",
    antiArmor: 0,
    damage: "1D10 - 1 + {筋力修正}",
    requirement: [],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },

  // ---- 拳銃射撃 ----
  {
    id: 19,
    name: "ピストル",
    price: 35000,
    fp: null,
    tl: 2,
    grip: "片手",
    range: "近",
    attacks: "1/T",
    baseHit: 35,
    skill: "拳銃射撃",
    antiArmor: 0,
    damage: "1D10 + 4",
    requirement: ["現世武器知識", 5],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },
  {
    id: 20,
    name: "マシンピストル",
    price: 40000,
    fp: null,
    tl: 3,
    grip: "片手",
    range: "近",
    attacks: "2/T",
    baseHit: 30,
    skill: "拳銃射撃",
    antiArmor: 0,
    damage: "1D10 + 6",
    requirement: ["現世武器知識", 10],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },
  {
    id: 21,
    name: "対甲ピストル",
    price: null,
    fp: 5,
    tl: 2,
    grip: "両手",
    range: "近",
    attacks: "1/T",
    baseHit: 10,
    skill: "拳銃射撃",
    antiArmor: 0.5,
    damage: "2D10 + 4",
    requirement: ["現世武器知識", 10],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },

  // ---- ライフル射撃 ----
  {
    id: 22,
    name: "ライフル",
    price: 60000,
    fp: null,
    tl: 2,
    grip: "両手",
    range: "長",
    attacks: "1/T",
    baseHit: 40,
    skill: "ライフル射撃",
    antiArmor: 0,
    damage: "3D10",
    requirement: ["現世武器知識", 5],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },
  {
    id: 23,
    name: "狙撃銃",
    price: 300000,
    fp: null,
    tl: 3,
    grip: "両手",
    range: "長",
    attacks: "1/T",
    baseHit: 45,
    skill: "ライフル射撃",
    antiArmor: 0,
    damage: "4D10",
    requirement: ["現世武器知識", 20],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },
  {
    id: 24,
    name: "対甲ライフル",
    price: null,
    fp: 18,
    tl: 3,
    grip: "両手",
    range: "中",
    attacks: "1/2T",
    baseHit: 35,
    skill: "ライフル射撃",
    antiArmor: 0.5,
    damage: "4D10",
    requirement: ["現世武器知識", 15],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },
  {
    id: 25,
    name: "ショットガン",
    price: 50000,
    fp: null,
    tl: 2,
    grip: "両手",
    range: "近",
    attacks: "1/2T",
    baseHit: 30,
    skill: "ライフル射撃",
    antiArmor: 0,
    damage: "1D10 * 5",
    requirement: ["現世武器知識", 10],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },

  // ---- 自動小銃射撃 ----
  {
    id: 26,
    name: "サブマシンガン（SMG）",
    price: 80000,
    fp: null,
    tl: 3,
    grip: "片手",
    range: "近",
    attacks: "2/T",
    baseHit: 30,
    skill: "自動小銃射撃",
    antiArmor: 0,
    damage: "2D10",
    requirement: ["現世武器知識", 10],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },
  {
    id: 27,
    name: "アサルトライフル",
    price: 80000,
    fp: null,
    tl: 3,
    grip: "両手",
    range: "近",
    attacks: "2/T",
    baseHit: 35,
    skill: "自動小銃射撃",
    antiArmor: 0,
    damage: "2D10 + 3",
    requirement: ["現世武器知識", 10],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },
  {
    id: 28,
    name: "重機関銃",
    price: 90000,
    fp: 10,
    tl: 3,
    grip: "両手",
    range: "中",
    attacks: "3/T",
    baseHit: 25,
    skill: "自動小銃射撃",
    antiArmor: 0,
    damage: "2D10 + 3",
    requirement: ["現世武器知識", 20],
    memo: "必要スキル値に達していない場合、攻撃は1回しかできません（弾薬の調達、適切な弾込めが行えない）。"
  },

  // ---- ロケット／ミサイル ----
  {
    id: 29,
    name: "ロケットランチャー",
    price: 300000,
    fp: 15,
    tl: 4,
    grip: "両手",
    range: "中",
    attacks: "1/T",
    baseHit: 30,
    skill: "ロケット／ミサイル",
    antiArmor: 1,
    damage: "1D10 * 3",
    requirement: ["現世武器知識", 15],
    memo: "個人戦闘では、目標のマスにいるすべての敵・味方にも命中判定を行います。命中値の算出や命中判定は個々に行ってください。単発使い捨ての武器です。"
  },
  {
    id: 30,
    name: "対戦車ミサイル",
    price: 400000,
    fp: 20,
    tl: 4,
    grip: "両手",
    range: "中",
    attacks: "1/T",
    baseHit: 35,
    skill: "ロケット／ミサイル",
    antiArmor: 1,
    damage: "1D10 * 3",
    requirement: ["現世武器知識", 15],
    memo: "個人戦闘では、目標のマスにいるすべての敵・味方にも命中判定を行います。命中値の算出や命中判定は個々に行ってください。単発使い捨ての武器です。"
  },
  {
    id: 31,
    name: "地対空ミサイル",
    price: 1000000,
    fp: 40,
    tl: 5,
    grip: "両手",
    range: "長",
    attacks: "1/T",
    baseHit: 50,
    skill: "ロケット／ミサイル",
    antiArmor: 1,
    damage: "1D10 * 4",
    requirement: ["現世武器知識", 15],
    memo: "個人戦闘では、目標のマスにいるすべての敵・味方にも命中判定を行います。命中値の算出や命中判定は個々に行ってください。単発使い捨ての武器です。"
  },

  // ---- キャノン ----
  {
    id: 32,
    name: "携帯型無反動砲",
    price: 800000,
    fp: 40,
    tl: 3,
    grip: "両手",
    range: "近",
    attacks: "1/2T",
    baseHit: 35,
    skill: "キャノン",
    antiArmor: 1,
    damage: "1D10 * 3",
    requirement: ["現世武器知識", 20],
    memo: "個人戦闘では、目標のマスにいるすべての敵・味方にも命中判定を行います。命中値の算出や命中判定は個々に行ってください。"
  },

  // ---- 爆発物 ----
  {
    id: 33,
    name: "手榴弾",
    price: 20000,
    fp: null,
    tl: 2,
    grip: "片手",
    range: "近",
    attacks: "1/T",
    baseHit: 10,
    skill: "爆発物",
    antiArmor: 0,
    damage: "1D10 * 3",
    requirement: ["現世武器知識", 5],
    memo: "個人戦闘では、目標のマスにいるすべての敵・味方にも命中判定を行います。命中値の算出や命中判定は個々に行ってください。単発使い捨ての武器です。"
  },
  {
    id: 34,
    name: "対甲地雷",
    price: null,
    fp: 10,
    tl: 2,
    grip: "両手",
    range: "近",
    attacks: "特殊",
    baseHit: 0,
    skill: "爆発物",
    antiArmor: 1,
    damage: "1D10 * 5",
    requirement: ["現世武器知識", 5],
    memo: "個人戦闘では、目標のマスにいるすべての敵・味方にも命中判定を行います。命中値の算出や命中判定は個々に行ってください。単発使い捨ての武器です。"
  },
];

// -------- 取得ユーティリティ --------

/** id -> weapon */
export function weaponById(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;
  return WEAPONS_MASTER.find(w => w.id === n) ?? null;
}

/** id -> name（見つからなければ "(unknown)"） */
export function weaponNameById(id) {
  return weaponById(id)?.name ?? "(unknown)";
}

/** name（完全一致） -> weapon */
export function weaponByName(name) {
  if (!name) return null;
  return WEAPONS_MASTER.find(w => w.name === name) ?? null;
}

/** 技術レベルで絞り込み */
export function weaponsByTL(tl) {
  return WEAPONS_MASTER.filter(w => w.tl === tl);
}