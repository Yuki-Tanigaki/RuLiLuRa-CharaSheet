/**
 * 盾マスター
 *
 * ■ フィールド説明
 *
 * id: number
 *   盾ID（一意・固定）
 *
 * name: string
 *   盾名
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
 * grip: "片手"
 *   基本的な持ち方
 *   ※盾は原則として片手装備を前提とする
 *
 * evadeMod: number
 *   回避判定への修正値（正負どちらも可）
 *
 * defenseValue: number
 *   防御値（ダメージ軽減・防御判定などに使用）
 *
 * requirement: string
 *   使用条件
 *
 * memo: string
 *   特記事項・例外ルール
 */

export const SHIELDS_MASTER = [
  // ---- 盾防御 ----
  {
    id: 1,
    name: "小盾",
    price: 4000,
    fp: null,
    tl: 1,
    grip: "片手",
    evadeMod: 0,
    defenseValue: 2,
    requirement: ["盾防御", 10],
    memo: ""
  },
  {
    id: 2,
    name: "盾",
    price: 10000,
    fp: null,
    tl: 1,
    grip: "片手",
    evadeMod: 0,
    defenseValue: 3,
    requirement: ["盾防御", 16],
    memo: "この盾を装備している間は、《回避》スキルに＋５してよい"
  },
  {
    id: 3,
    name: "大型の盾",
    price: 20000,
    fp: null,
    tl: 1,
    grip: "片手",
    evadeMod: -10,
    defenseValue: 6,
    requirement: ["盾防御", 22],
    memo: ""
  },
];

// -------- 取得ユーティリティ --------

/** id -> shield */
export function shieldById(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;
  return SHIELDS_MASTER.find(s => s.id === n) ?? null;
}

/** id -> name（見つからなければ "(unknown)"） */
export function shieldNameById(id) {
  return shieldById(id)?.name ?? "(unknown)";
}

/** name（完全一致） -> weapon */
export function shieldByName(name) {
  if (!name) return null;
  return SHIELDS_MASTER.find(s => s.name === name) ?? null;
}

/** 技術レベルで絞り込み */
export function shieldsByTL(tl) {
  return SHIELDS_MASTER.filter(s => s.tl === tl);
}
