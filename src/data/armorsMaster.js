/**
 * 防具（アーマー）マスター
 *
 * ■ フィールド説明
 *
 * id: number
 *   防具ID（一意・固定）
 *
 * name: string
 *   防具名
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
 * evadeMod: number
 *   回避判定への修正値（通常はマイナス）
 *
 * defenseValue: number
 *   防御値（ダメージ軽減・防御判定などに使用）
 *
 * requirement: string
 *   使用条件（技能値など、表示用）
 *
 * memo: string
 *   特記事項・例外ルール
 */

export const ARMORS_MASTER = [
  // ---- 防具 ----
  {
    id: 1,
    name: "部分ヨロイ",
    price: 5000,
    fp: null,
    tl: 1,
    evadeMod: 0,
    defenseValue: 2,
    requirement: [],
    memo: ""
  },
  {
    id: 2,
    name: "皮ヨロイ",
    price: 10000,
    fp: null,
    tl: 1,
    evadeMod: 0,
    defenseValue: 3,
    requirement: [],
    memo: ""
  },
  {
    id: 3,
    name: "鎖かたびら",
    price: 30000,
    fp: null,
    tl: 1,
    evadeMod: -10,
    defenseValue: 4,
    requirement: [],
    memo: ""
  },
  {
    id: 4,
    name: "板金ヨロイ",
    price: 100000,
    fp: null,
    tl: 1,
    evadeMod: -20,
    defenseValue: 6,
    requirement: [],
    memo: ""
  },
  {
    id: 5,
    name: "甲冑（かっちゅう）",
    price: 200000,
    fp: 10,
    tl: 1,
    evadeMod: -30,
    defenseValue: 8,
    requirement: [],
    memo: ""
  },
];

// -------- 取得ユーティリティ --------

/** id -> armor */
export function armorById(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;
  return ARMORS_MASTER.find(a => a.id === n) ?? null;
}

/** id -> name（見つからなければ "(unknown)"） */
export function armorNameById(id) {
  return armorById(id)?.name ?? "(unknown)";
}

/** name（完全一致） -> weapon */
export function armorByName(name) {
  if (!name) return null;
  return ARMORS_MASTER.find(a => a.name === name) ?? null;
}

/** 技術レベルで絞り込み */
export function armorsByTL(tl) {
  return ARMORS_MASTER.filter(a => a.tl === tl);
}
