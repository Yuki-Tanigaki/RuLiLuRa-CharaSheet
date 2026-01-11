/**
 * アイテムマスター
 *
 * ■ フィールド説明
 *
 * id: number
 *   アイテムID（一意・固定）
 *
 * name: string
 *   アイテム名
 *
 * price: number | null
 *   価格（null の場合は購入不可）
 *
 * memo: string
 *   特記事項・使用条件・効果説明（任意）
 */

export const ITEMS_MASTER = [
  // ---- 食料・水 ----
  { id: 1,  name: "携帯用食料（１日２食分）", price: 1000, memo: "" },
  { id: 2,  name: "食事（1日２食分）", price: 400, memo: "" },
  { id: 3,  name: "水（1日分）", price: 500, memo: "" },

  // ---- 収納・運搬 ----
  { id: 4,  name: "小袋", price: 500, memo: "" },
  { id: 5,  name: "ずた袋", price: 500, memo: "" },
  { id: 6,  name: "リュックサック", price: 2000, memo: "" },
  { id: 7,  name: "水袋", price: 500, memo: "" },

  // ---- 明かり・火 ----
  { id: 8,  name: "ほくち箱（点火用）", price: 500, memo: "" },
  { id: 9,  name: "たいまつ×５", price: 1000, memo: "" },
  { id: 10, name: "ランタン", price: 5000, memo: "" },
  { id: 11, name: "油（ランタン用、10時間）", price: 1000, memo: "" },

  // ---- 移動・探索 ----
  { id: 12, name: "ロープ（10ｍ）", price: 2000, memo: "" },
  { id: 13, name: "フック（鉤爪）", price: 10000, memo: "" },

  // ---- 野営 ----
  { id: 14, name: "毛布", price: 5000, memo: "" },
  { id: 15, name: "寝袋", price: 10000, memo: "" },
  { id: 16, name: "テント（４人用）", price: 30000, memo: "" },

  // ---- 生活・嗜好品 ----
  { id: 17, name: "双眼鏡", price: 30000, memo: "" },
  { id: 18, name: "裁縫キット", price: 500, memo: "" },
  { id: 19, name: "化粧品", price: 5000, memo: "" },
  { id: 20, name: "手鏡", price: 1000, memo: "" },
  { id: 21, name: "楽器", price: 10000, memo: "" },

  // ---- 衣類 ----
  { id: 22, name: "服", price: 3000, memo: "" },
  { id: 23, name: "礼服／ドレス", price: 50000, memo: "" },
  { id: 24, name: "アクセサリー", price: 5000, memo: "" },
  { id: 25, name: "マント", price: 5000, memo: "" },

  // ---- 工具・専門 ----
  { id: 26, name: "工具", price: 1000, memo: "" },
  { id: 27, name: "奏甲用工具", price: 30000, memo: "" },
  { id: 28, name: "七つ道具", price: 5000, memo: "" },

  // ---- 医療 ----
  { id: 29, name: "治療キット", price: 500, memo: "" },
  { id: 30, name: "毒消し", price: 10000, memo: "" },

  // ---- 動物・乗り物 ----
  { id: 31, name: "ウマ", price: 200000, memo: "" },
  { id: 32, name: "伝書バト", price: 30000, memo: "" },
  { id: 33, name: "小船", price: 100000, memo: "" },

  // ---- スキル専用 ----
  { id: 34, name: "偽造身分証明書", price: null, memo: "" },
  { id: 35, name: "ナベ・フライパン", price: null, memo: "" },
  { id: 36, name: "ダイス（２組）", price: null, memo: "" },
  { id: 37, name: "虫メガネ", price: null, memo: "" },
  
  // ---- セット ----
  {
    id: 38,
    name: "冒険者セット",
    price: 12000,
    memo:
      "内容：携帯用食料（１日２食分）×2／ほくち箱（点火用）／毛布×2／水（1日分）／水袋／たいまつ×５／リュックサック／ロープ（10ｍ）",
  },
];

// -------- 取得ユーティリティ --------

/** id -> item */
export function itemById(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;
  return ITEMS_MASTER.find(i => i.id === n) ?? null;
}

/** id -> name（見つからなければ "(unknown)"） */
export function itemNameById(id) {
  return itemById(id)?.name ?? "(unknown)";
}

/** name（完全一致） -> item */
export function itemByName(name) {
  if (!name) return null;
  return ITEMS_MASTER.find(i => i.name === name) ?? null;
}
