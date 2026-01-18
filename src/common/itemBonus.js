// src/pages/sheets/common/itemBonus.js
import { normalizeThresholdKey } from "./normalize.js";

// itemBonus が参照しうる kind（必要なら増やす）
export const DEFAULT_BONUS_KINDS = ["tool", "weapon", "armor", "shield"];

function toQty(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.trunc(n));
}

/**
 * itemBonus を内部表現（配列）に正規化
 *
 * 入力は「オブジェクト形式のみ許可」：
 * {
 *   "10": [{name,qty}],
 *   "20": [{name,qty}],
 * }
 *
 * 戻り値：
 * - [{ at:number, items:[{name,qty}] }]（at 昇順 / at重複は結合）
 */
export function normalizeItemBonus(itemBonus) {
  if (!itemBonus) return [];

  if (Array.isArray(itemBonus)) {
    throw new Error(`[itemBonus] array format is not supported`);
  }

  if (typeof itemBonus !== "object") return [];

  const acc = [];
  for (const [k, v] of Object.entries(itemBonus)) {
    const at = normalizeThresholdKey(k);
    if (at == null) continue;

    const items = normalizeBonusItems(v);
    if (items.length === 0) continue;

    acc.push({ at, items });
  }

  return mergeAndSort(acc);
}

function normalizeBonusItems(v) {
  if (!v) return [];
  if (!Array.isArray(v)) return []; // ここも「配列のみ許す」

  const out = [];
  for (const it of v) {
    const o = it && typeof it === "object" ? it : null;
    const name = String(o?.name ?? "").trim();
    if (!name) continue;
    out.push({ name, qty: toQty(o?.qty) });
  }
  return out;
}

function mergeAndSort(rows) {
  const map = new Map(); // at -> items[]
  for (const r of rows) {
    const at = Number(r?.at);
    if (!Number.isFinite(at)) continue;
    const items = Array.isArray(r?.items) ? r.items : [];
    if (!items.length) continue;

    const prev = map.get(at) ?? [];
    map.set(at, prev.concat(items));
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([at, items]) => ({ at, items }));
}

/**
 * 指定レベルまでに「獲得可能」な itemBonus を展開（解決しない）
 *
 * 戻り値：
 * - { earned: [{at, item:{name,qty}}], future: [{at, item:{name,qty}}] }
 */
export function collectItemBonusItems(itemBonus, level, options = {}) {
  const rows = normalizeItemBonus(itemBonus);
  const lv = Number(level);
  const cur = Number.isFinite(lv) ? lv : 0;

  const earned = [];
  const future = [];

  for (const r of rows) {
    const bucket = r.at <= cur ? earned : future;
    for (const item of r.items) bucket.push({ at: r.at, item });
  }

  if (options.includeFuture) return { earned, future };
  return { earned, future: [] };
}

/**
 * name から catalog エントリを探す（tool/weapon/armor/shield を総当たり）
 */
export function resolveBonusTargetByName(name, catalog, options = {}) {
  const nm = String(name ?? "").trim();
  if (!nm) return null;
  if (!catalog || typeof catalog.list !== "function") return null;

  const bonusKinds = Array.isArray(options.bonusKinds) ? options.bonusKinds : DEFAULT_BONUS_KINDS;

  for (const kind of bonusKinds) {
    const rows = catalog.list(kind);
    for (const e of rows) {
      // 基本は name で一致（master/user とも name を持つ前提）
      const en = String(e?.name ?? "").trim();
      if (en && en === nm) return e;

      // 念のため labelOf がある場合はそれも見る
      if (typeof catalog.labelOf === "function") {
        const lbl = String(catalog.labelOf(kind, e) ?? "").trim();
        if (lbl && lbl === nm) return e;
      }
    }
  }

  return null;
}

/**
 * itemBonus を「解決済み」で返す（UI用）
 *
 * 戻り値：
 * - {
 *    earned: [{at, item:{name,qty}, resolved}],
 *    future: [{at, item:{name,qty}, resolved}],
 *    flat:   [{ resolved, qty }]  // 同一resolvedを qty 合算
 *   }
 */
export function collectItemBonus(itemBonus, level, options = {}) {
  const { earned, future } = collectItemBonusItems(itemBonus, level, { includeFuture: true });
  const includeFuture = !!options.includeFuture;

  const earned2 = earned.map((x) => {
    const resolved = resolveBonusTargetByName(x.item?.name, options.catalog, options);
    if (!resolved && typeof options.onMissing === "function") options.onMissing(String(x.item?.name ?? ""));
    return { ...x, resolved };
  });

  const future2 = future.map((x) => {
    const resolved = resolveBonusTargetByName(x.item?.name, options.catalog, options);
    if (!resolved && typeof options.onMissing === "function") options.onMissing(String(x.item?.name ?? ""));
    return { ...x, resolved };
  });

  // flat：同一 resolved を qty 合算（resolved 無しは落とす）
  const map = new Map(); // __key -> { resolved, qty }
  for (const x of earned2) {
    const r = x.resolved;
    if (!r) continue;
    const key = String(r.__key ?? "");
    if (!key) continue;

    const prev = map.get(key) ?? { resolved: r, qty: 0 };
    prev.qty += toQty(x.item?.qty);
    map.set(key, prev);
  }

  const flat = Array.from(map.values());

  return {
    earned: earned2,
    future: includeFuture ? future2 : [],
    flat,
  };
}
