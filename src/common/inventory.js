// src/common/inventory.js

import { safeNum } from "./utils/number.js";

/**
 * inventory entry 形式（推奨）
 * { kind: string, id: string|number, qty: number }
 *
 * このモジュールは「純粋関数」だけを提供します。
 * - React や setState は触らない
 * - 受け取った配列は破壊しない（新しい配列を返す）
 */

/** kind/id を正規化してキー化 */
export function invKey(kind, id) {
  const k = String(kind ?? "").trim();
  const v = id == null ? "" : String(id).trim();
  return k && v ? `${k}:${v}` : "";
}

/** qty を 0以上の整数に丸める */
export function normalizeQty(qty) {
  const n = safeNum(qty, 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/**
 * inventory 全体を正規化
 * - 不正要素を除去
 * - kind/id を trim
 * - qty を 0以上整数に
 * - 同一 kind:id を合算
 */
export function normalizeInventory(inv) {
  const list = Array.isArray(inv) ? inv : [];
  const map = new Map();

  for (const e of list) {
    const kind = String(e?.kind ?? "").trim();
    const id = e?.id == null ? "" : String(e.id).trim();
    if (!kind || !id) continue;

    const key = `${kind}:${id}`;
    const qty = normalizeQty(e?.qty ?? 0);
    if (qty <= 0) continue;

    map.set(key, (map.get(key) ?? 0) + qty);
  }

  return Array.from(map.entries()).map(([key, qty]) => {
    const [kind, id] = key.split(":");
    return { kind, id, qty };
  });
}

/** 指定 kind:id の現在数量を返す */
export function getQty(inv, kind, id) {
  const key = invKey(kind, id);
  if (!key) return 0;
  const list = Array.isArray(inv) ? inv : [];
  const hit = list.find((e) => invKey(e?.kind, e?.id) === key);
  return normalizeQty(hit?.qty ?? 0);
}

/**
 * 数量を設定（0なら削除）
 * - 不正 kind/id は無視して元を返す
 */
export function setQty(inv, kind, id, qty) {
  const key = invKey(kind, id);
  if (!key) return Array.isArray(inv) ? inv : [];

  const nextQty = normalizeQty(qty);
  const list = Array.isArray(inv) ? inv : [];

  const next = [];
  let replaced = false;

  for (const e of list) {
    if (invKey(e?.kind, e?.id) !== key) {
      next.push(e);
      continue;
    }
    replaced = true;
    if (nextQty > 0) next.push({ ...e, kind: String(kind).trim(), id: String(id).trim(), qty: nextQty });
    // 0なら入れない（削除）
  }

  if (!replaced && nextQty > 0) {
    next.push({ kind: String(kind).trim(), id: String(id).trim(), qty: nextQty });
  }

  return next;
}

/**
 * 数量を増減（delta）
 * - delta > 0: 追加
 * - delta < 0: 減算（0未満にはならない、0になったら削除）
 */
export function addQty(inv, kind, id, delta = 1) {
  const cur = getQty(inv, kind, id);
  const d = safeNum(delta, 0);
  const nextQty = normalizeQty(cur + d);
  return setQty(inv, kind, id, nextQty);
}

/** 1個減らす（0になったら削除） */
export function removeOne(inv, kind, id) {
  return addQty(inv, kind, id, -1);
}

/** 指定 kind だけ抽出（表示用） */
export function filterByKind(inv, kind) {
  const k = String(kind ?? "").trim();
  if (!k) return [];
  const list = Array.isArray(inv) ? inv : [];
  return list.filter((e) => String(e?.kind ?? "").trim() === k);
}

/** 指定 kind の id 一覧（数値にしたいなら呼び出し側で Number()） */
export function ownedIdsOf(inv, kind) {
  return filterByKind(inv, kind).map((e) => String(e?.id ?? "").trim()).filter(Boolean);
}

/**
 * merge（合算）
 * base + add を合算して返す（正規化してから返す）
 */
export function mergeInventory(base, add) {
  const a = Array.isArray(base) ? base : [];
  const b = Array.isArray(add) ? add : [];
  return normalizeInventory([...a, ...b]);
}
