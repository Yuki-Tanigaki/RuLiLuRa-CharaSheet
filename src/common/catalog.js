// src/common/catalog.js
// レジストリ駆動カタログローダ / 正規化ユーティリティ（TRPG RuLiLuRa）
//
// 仕様:
// - public 配下の /data/registry.json を取得してカテゴリ定義を読む
// - category.source で指定された JSON を取得し、fields 定義に従って正規化する
// - 同一カテゴリ内の id / name の重複を検出して例外を投げる
// - Vite の base（import.meta.env.BASE_URL）配下でも動作する
//
// Public API:
//   - buildCategory(categoryKey)
//   - buildAllCatalogs()
//   - toNumberOrNull()
//   - countMap()
//   - itemBonus()

/** ---------- URL / fetch ---------- */

/**
 * public 配下のリソース URL を Vite の base に合わせて解決する。
 * 例: base="/RuLiLuRa-CharaSheet/" なら
 *   "/data/registry.json" -> "/RuLiLuRa-CharaSheet/data/registry.json"
 */
function resolvePublicUrl(path) {
  const base = import.meta.env.BASE_URL || "/";
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  return b + path;
}

async function loadJson(path) {
  const url = resolvePublicUrl(path);
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Failed to load json: ${url} (${res.status} ${res.statusText})`);
  }
  return await res.json();
}

/** ---------- registry ---------- */

let _registryCache = null;

/**
 * registry.json を一度だけ取得してキャッシュする。
 */
async function loadRegistry() {
  if (_registryCache) return _registryCache;
  _registryCache = await loadJson("/data/registry.json");
  return _registryCache;
}

/** ---------- basic utils ---------- */

export function toNumberOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function asTrimmedString(v) {
  if (v == null) return "";
  return String(v).trim();
}

function uniqStrings(xs) {
  const out = [];
  const set = new Set();
  for (const x of xs) {
    const s = asTrimmedString(x);
    if (!s) continue;
    if (set.has(s)) continue;
    set.add(s);
    out.push(s);
  }
  return out;
}

// structuredClone fallback（古い環境対策）
function cloneValue(v) {
  if (typeof structuredClone === "function") return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}

/** ---------- type handlers ---------- */

// number: toNumberOrNull
function t_number(v) {
  return toNumberOrNull(v);
}

// boolean: true/false, 0/1, "true"/"false"
function t_boolean(v) {
  if (v === true || v === false) return v;
  if (v == null || v === "") return false;

  if (typeof v === "number") return v !== 0;

  const s = String(v).trim().toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "1") return true;
  if (s === "0") return false;

  return false;
}

// string
function t_string(v) {
  return v == null ? "" : String(v);
}

// string[]: 配列 or 文字列（カンマ/読点/改行などで split）
function t_string_array(v) {
  if (Array.isArray(v)) return uniqStrings(v);

  const s = asTrimmedString(v);
  if (!s) return [];
  const parts = s.split(/[,、\n\r\t]+/g);
  return uniqStrings(parts);
}

/**
 * countMap
 * - 入力はオブジェクトを想定（key:文字列, value:数値相当）
 * - key は trim して空なら捨てる
 * - value は number 化して整数化（trunc）
 * - min 未満は捨てる
 */
export function countMap(v, { min = 1 } = {}) {
  if (!isPlainObject(v)) return {};

  const out = {};
  for (const [k, raw] of Object.entries(v)) {
    const name = asTrimmedString(k);
    if (!name) continue;

    const n0 = toNumberOrNull(raw);
    if (n0 == null) continue;

    const n = Math.trunc(n0);
    if (n < min) continue;

    out[name] = n;
  }
  return out;
}

/**
 * itemBonus
 * 例:
 * {
 *   "1":  [{ "name": "ダガー", "qty": 1 }],
 *   "10": [{ "name": "ブラスナックル", "qty": 1 }],
 *   "20": []
 * }
 *
 * - key は閾値（数値化できないキーは捨てる）
 * - value は配列。要素 {name, qty}
 * - name は trim、空なら捨てる
 * - qty は number 化し、整数化、最低 1
 */
export function itemBonus(v) {
  if (!isPlainObject(v)) return {};

  const out = {};
  for (const [k, rawList] of Object.entries(v)) {
    const th = toNumberOrNull(k);
    if (th == null) continue;

    const list = Array.isArray(rawList) ? rawList : [];
    const normList = [];

    for (const it of list) {
      const o = isPlainObject(it) ? it : {};
      const name = asTrimmedString(o.name);
      if (!name) continue;

      const q0 = toNumberOrNull(o.qty);
      const qty = Math.max(1, Math.trunc(q0 == null ? 1 : q0));

      normList.push({ name, qty });
    }

    out[String(th)] = normList;
  }
  return out;
}

const TYPE_HANDLERS = {
  number: t_number,
  boolean: t_boolean,
  string: t_string,
  "string[]": t_string_array,
  countMap: (v) => countMap(v, { min: 1 }),
  itemBonus,
};

function normalizeByType(type, v) {
  const fn = TYPE_HANDLERS[type];
  if (!fn) return v;
  return fn(v);
}

/** ---------- validation ---------- */

function assertUnique(map, key, what, categoryLabel) {
  if (map.has(key)) {
    throw new Error(`[catalog:${categoryLabel}] duplicated ${what}: ${JSON.stringify(key)}`);
  }
}

/** ---------- builders ---------- */

/**
 * buildCategory(categoryKey)
 *
 * - registry.json の categories[categoryKey] を使って source を取得
 * - fields を type に従って正規化
 * - id / name 重複を検出
 *
 * return:
 * {
 *   key, label, source, idField, nameField,
 *   list, byId(Map), byName(Map)
 * }
 */
export async function buildCategory(categoryKey) {
  const config = await loadRegistry();

  const def = config?.categories?.[categoryKey];
  if (!def) throw new Error(`Unknown categoryKey: ${categoryKey}`);

  const categoryLabel = def.label ?? categoryKey;
  const idField = def.idField ?? "id";
  const nameField = def.nameField ?? "name";
  const source = def.source;

  if (!source) throw new Error(`[catalog:${categoryLabel}] source is missing`);

  const raw = await loadJson(source);
  const rows = Array.isArray(raw) ? raw : [];

  const byId = new Map();
  const byName = new Map();
  const list = [];

  const fieldDefs = Array.isArray(def.fields) ? def.fields : [];

  for (let i = 0; i < rows.length; i++) {
    const r0 = isPlainObject(rows[i]) ? rows[i] : {};
    const out = {};

    for (const f of fieldDefs) {
      const k = f.key;
      const type = f.type;
      const required = !!f.required;
      const hasDefault = Object.prototype.hasOwnProperty.call(f, "default");

      const rawVal = r0[k];

      let val;
      if (rawVal === undefined) {
        if (required && !hasDefault) {
          throw new Error(`[catalog:${categoryLabel}] row#${i} missing required field: ${k}`);
        }
        val = hasDefault ? cloneValue(f.default) : undefined;
      } else {
        val = rawVal;
      }

      if (val !== undefined) {
        out[k] = normalizeByType(type, val);
      }
    }

    const id = out[idField];
    const name = asTrimmedString(out[nameField]);

    if (id == null || !Number.isFinite(Number(id))) {
      throw new Error(`[catalog:${categoryLabel}] row#${i} invalid ${idField}: ${JSON.stringify(id)}`);
    }
    out[idField] = Number(id);

    if (!name) {
      throw new Error(
        `[catalog:${categoryLabel}] row#${i} invalid ${nameField}: ${JSON.stringify(out[nameField])}`
      );
    }
    out[nameField] = name;

    assertUnique(byId, out[idField], idField, categoryLabel);
    assertUnique(byName, out[nameField], nameField, categoryLabel);

    byId.set(out[idField], out);
    byName.set(out[nameField], out);
    list.push(out);
  }

  return {
    key: categoryKey,
    label: categoryLabel,
    source,
    idField,
    nameField,
    list,
    byId,
    byName,
  };
}

/**
 * buildAllCatalogs()
 * - registry.json の categories を全てロードして返す
 *
 * return:
 *   { [categoryKey]: categoryCatalog }
 */
export async function buildAllCatalogs() {
  const config = await loadRegistry();

  const cats = config?.categories ?? {};
  const keys = Object.keys(cats);

  const out = {};
  const results = await Promise.all(keys.map((k) => buildCategory(k)));
  for (const cat of results) out[cat.key] = cat;
  return out;
}
