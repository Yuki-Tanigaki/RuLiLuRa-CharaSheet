// src/pages/sheets/common/unlockItems.js

import { normalizeThresholdKey } from "./normalize.js";
import { resolveCatalogRef } from "./catalog.js";

/**
 * Unlock（解放/無料獲得/追加効果）を「シート非依存」で扱うための共通エンジン
 *
 * 目的：
 * - masterスキル / 自作スキル、どちらの unlock でも同じように扱える
 * - unlock の表記ゆれ（キーが "10" / "Lv10" / "10+" 等）を吸収する
 * - unlock の中身の参照（"item:1" や {kind,id} 等）を実在データに解決する（任意）
 *
 * 重要：
 * - このモジュールは状態更新をしない（純粋関数中心）
 * - 「現在Lvの計算」「スキル行の読み方」はシート側アダプタで行う
 */

/**
 * unlock データを内部表現（配列）に正規化する
 *
 * 入力想定：
 * - { "10": [ref, ref], "15": [ref] }
 * - [{ at:10, refs:[ref,ref] }, ...]
 *
 * ref は何でもよい（後で resolve する）
 *
 * 戻り値：
 * - [{ at:number, refs:any[] }] （at 昇順, at重複は結合）
 */
export function normalizeUnlock(unlock) {
  if (!unlock) return [];

  // 配列形式
  if (Array.isArray(unlock)) {
    const acc = [];
    for (const it of unlock) {
      const at = normalizeThresholdKey(it?.at ?? it?.level ?? it?.threshold ?? it?.min ?? null);
      if (at == null) continue;
      const refs = normalizeRefs(it?.refs ?? it?.items ?? it?.unlock ?? it?.list ?? it?.values ?? it);
      if (refs.length === 0) continue;
      acc.push({ at, refs });
    }
    return mergeAndSort(acc);
  }

  // オブジェクト形式（キーが閾値）
  if (typeof unlock === "object") {
    const acc = [];
    for (const [k, v] of Object.entries(unlock)) {
      const at = normalizeThresholdKey(k);
      if (at == null) continue;
      const refs = normalizeRefs(v);
      if (refs.length === 0) continue;
      acc.push({ at, refs });
    }
    return mergeAndSort(acc);
  }

  // その他は無視
  return [];
}

/**
 * 指定レベルまでに解放される参照一覧を返す（解決はしない）
 *
 * options:
 * - includeFuture: true なら future も返す（UIで一覧表示したい場合）
 *
 * 戻り値：
 * - { unlocked: [{at, ref}], future: [{at, ref}] }
 */
export function collectUnlockRefs(unlock, level, options = {}) {
  const rows = normalizeUnlock(unlock);
  const lv = Number(level);
  const cur = Number.isFinite(lv) ? lv : 0;

  const unlocked = [];
  const future = [];

  for (const r of rows) {
    const bucket = r.at <= cur ? unlocked : future;
    for (const ref of r.refs) bucket.push({ at: r.at, ref });
  }

  if (options.includeFuture) return { unlocked, future };
  return { unlocked, future: [] };
}

/**
 * 参照を「実在エントリ」に解決して返す
 *
 * resolve の優先順：
 * 1) options.resolveRef(ref) があればそれを使う
 * 2) options.catalog があれば resolveCatalogRef(ref, catalog) を使う
 * 3) 解決不能なら null
 *
 * ref 形式例：
 * - "item:1"
 * - { kind:"item", id:1 }
 * - { name:"毛布", kind:"item" }
 * - 1（defaultKind が必要）
 *
 * options:
 * - resolveRef: (ref)=>resolved|null
 * - catalog: [{kind,id,name,...}, ...]
 * - defaultKind: kind省略時の補完（resolveCatalogRef に渡す）
 */
export function resolveUnlockRef(ref, options = {}) {
  if (typeof options.resolveRef === "function") {
    try {
      return options.resolveRef(ref) ?? null;
    } catch {
      // fallthrough
    }
  }

  const catalog = options.catalog;
  if (Array.isArray(catalog)) {
    return resolveCatalogRef(ref, catalog, { defaultKind: options.defaultKind ?? null }) ?? null;
  }

  return null;
}

/**
 * 指定レベルまでの解放を「解決済み」で返す（UI表示用）
 *
 * 戻り値：
 * - {
 *    unlocked: [{at, ref, resolved}],  // resolved は catalog の実体（なければ null）
 *    future:   [{at, ref, resolved}],
 *    flat:     [{at, ref, resolved}]   // unlocked のみを refKey で重複排除したもの
 *   }
 *
 * options:
 * - resolveRef / catalog / defaultKind: resolveUnlockRef に渡す
 * - dedupeKey: (x)=>string （既定は kind:id / JSON / String）
 * - includeFuture: boolean
 */
export function collectUnlock(unlock, level, options = {}) {
  const { unlocked, future } = collectUnlockRefs(unlock, level, { includeFuture: true });

  const unlockWithResolved = unlocked.map((x) => ({
    ...x,
    resolved: resolveUnlockRef(x.ref, options),
  }));

  const futureWithResolved = future.map((x) => ({
    ...x,
    resolved: resolveUnlockRef(x.ref, options),
  }));

  const includeFuture = !!options.includeFuture;

  const dedupeKey =
    typeof options.dedupeKey === "function"
      ? options.dedupeKey
      : defaultDedupeKey;

  // unlocked のみを重複排除（同じアイテムが複数ルートで解放されても1個にする等）
  const seen = new Set();
  const flat = [];
  for (const x of unlockWithResolved) {
    const k = dedupeKey(x);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    flat.push(x);
  }

  return {
    unlocked: unlockWithResolved,
    future: includeFuture ? futureWithResolved : [],
    flat,
  };
}

/**
 * 「解放済み(flat)」と「既に取得済み(claims)」から、まだ受け取っていないものを抽出
 *
 * claims 形式例：
 * - { [dedupeKey]: true }
 * - { "item:1": true }
 *
 * 戻り値：
 * - [{ at, ref, resolved }]
 */
export function getUnclaimedUnlock(flatUnlocked, claims, options = {}) {
  const list = Array.isArray(flatUnlocked) ? flatUnlocked : [];
  const c = claims && typeof claims === "object" ? claims : {};

  const dedupeKey =
    typeof options.dedupeKey === "function"
      ? options.dedupeKey
      : defaultDedupeKey;

  return list.filter((x) => !c[dedupeKey(x)]);
}

/** claims に 1件追加した新オブジェクトを返す（純粋） */
export function claimUnlock(claims, item, options = {}) {
  const c = claims && typeof claims === "object" ? claims : {};
  const dedupeKey =
    typeof options.dedupeKey === "function"
      ? options.dedupeKey
      : defaultDedupeKey;

  const k = dedupeKey(item);
  if (!k) return { ...c };
  return { ...c, [k]: true };
}

/** claims から 1件取り消した新オブジェクトを返す（純粋） */
export function unclaimUnlock(claims, item, options = {}) {
  const c = claims && typeof claims === "object" ? claims : {};
  const dedupeKey =
    typeof options.dedupeKey === "function"
      ? options.dedupeKey
      : defaultDedupeKey;

  const k = dedupeKey(item);
  if (!k) return { ...c };
  const next = { ...c };
  delete next[k];
  return next;
}

// ----------------------
// internal helpers
// ----------------------

function normalizeRefs(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => x != null);
  // 1件だけ渡された場合
  return [v];
}

function mergeAndSort(rows) {
  const map = new Map();
  for (const r of rows) {
    const at = Number(r?.at);
    if (!Number.isFinite(at)) continue;
    const refs = normalizeRefs(r?.refs);
    if (refs.length === 0) continue;
    const prev = map.get(at) ?? [];
    map.set(at, prev.concat(refs));
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([at, refs]) => ({ at, refs }));
}

function defaultDedupeKey(x) {
  // resolved があれば kind:id を優先
  const r = x?.resolved;
  const kind = r?.kind ?? r?.type ?? null;
  const id = r?.id ?? null;
  if (kind != null && id != null) return `${String(kind)}:${String(id)}`;

  // ref が "kind:id" っぽければそれを使う
  const ref = x?.ref;
  if (typeof ref === "string") {
    const s = ref.trim();
    if (/^[a-zA-Z_]+\s*:\s*.+$/.test(s)) return s.replace(/\s+/g, "");
  }

  // オブジェクトなら kind/id を拾う
  if (ref && typeof ref === "object") {
    const k2 = ref.kind ?? ref.type ?? null;
    const id2 = ref.id ?? ref.itemId ?? null;
    if (k2 != null && id2 != null) return `${String(k2)}:${String(id2)}`;
  }

  // 最後の手段
  try {
    return JSON.stringify(ref);
  } catch {
    return String(ref ?? "");
  }
}
