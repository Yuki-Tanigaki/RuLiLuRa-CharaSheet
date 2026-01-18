// src/common/catalog.js
import config from "/data/registry.json";

// Vite: 指定パスの JSON を “まとめて import” して辞書化
const jsonModules = import.meta.glob("/data/masters/*.json", { eager: true });

function toNumberOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// -------------------------
// 正規化
// -------------------------

// --- requirementSkills の正規化 ---
// 例: { "現世武器知識": 5 } -> { "現世武器知識": 5 }（trim + number化）
function normalizeRequirementSkills(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out = {};
  for (const [k, raw] of Object.entries(v)) {
    const name = String(k ?? "").trim();
    if (!name) continue;

    const n = toNumberOrNull(raw);
    if (n == null) continue;

    out[name] = n;
  }
  return out;
}

// --- itemBonus の正規化 ---
// 例:
// {
//   "1":  [{ "name": "ダガー", "qty": 1 }],
//   "10": [{ "name": "ブラスナックル", "qty": 1 }],
//   "20": []
// }
function normalizeItemBonus(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};

  const out = {};
  for (const [k, rawList] of Object.entries(v)) {
    const th = toNumberOrNull(k);
    if (th == null) continue; // 無効キーは捨てる（ここではエラーにしない）

    const list = Array.isArray(rawList) ? rawList : [];
    const normList = [];

    for (const it of list) {
      const o = it && typeof it === "object" ? it : {};
      const name = String(o.name ?? "").trim();
      if (!name) continue; // name 必須（ここでは捨てるだけ）

      const q0 = toNumberOrNull(o.qty);
      const qty = Math.max(1, Math.trunc(q0 == null ? 1 : q0));

      normList.push({ name, qty });
    }

    out[String(th)] = normList;
  }
  return out;
}

function normalizeValueByType(v, type) {
  switch (type) {
    case "number": {
      const n = toNumberOrNull(v);
      return n == null ? null : n;
    }
    case "boolean":
      return !!v;
    case "string":
      return v == null ? "" : String(v);
    case "string[]":
      return Array.isArray(v) ? v.map((x) => String(x)) : [];

    // --- 専用型 ---
    case "requirementSkills":
      return normalizeRequirementSkills(v);
    case "itemBonus":
      return normalizeItemBonus(v);

    // object系は “objectならそのまま/違えば null”
    default:
      return v && typeof v === "object" ? v : null;
  }
}

function normalizeRow(row, catDef) {
  const src = row && typeof row === "object" ? row : {};
  const out = {};

  for (const f of catDef.fields ?? []) {
    const key = String(f.key);
    const has = Object.prototype.hasOwnProperty.call(src, key);
    const raw = has ? src[key] : undefined;

    if (!has) {
      if (f.required) return null; // 必須が無い行は捨てる
      out[key] = f.default ?? null;
      continue;
    }

    const norm = normalizeValueByType(raw, f.type);

    // required で空扱いなら捨てる（id/name を想定）
    if (f.required) {
      if (f.type === "number") {
        if (norm == null) return null;
      }
      if (f.type === "string") {
        if (!String(norm ?? "").trim()) return null;
      }
    }

    out[key] = norm;
  }

  return out;
}

// -------------------------
// buildCategory
// -------------------------
function buildCategory(categoryKey) {
  const catDef = config?.categories?.[categoryKey];
  if (!catDef) throw new Error(`Unknown masters category: ${categoryKey}`);

  const sourcePath = String(catDef.source || "");
  const mod = jsonModules[sourcePath];
  if (!mod) {
    throw new Error(
      `Masters source not found for "${categoryKey}": ${sourcePath}\n`
    );
  }

  const rawList = mod.default;
  const list0 = Array.isArray(rawList) ? rawList : [];

  const idField = String(catDef.idField || "id");
  const nameField = String(catDef.nameField || "name");

  const list = [];
  const byId = new Map();
  const byName = new Map();

  // 重複検出用
  const seenId = new Set();
  const seenName = new Set();

  // warn を分かりやすくするためにプレフィックス
  const warnPrefix = `[masters:${categoryKey}] (${sourcePath})`;

  for (let i = 0; i < list0.length; i++) {
    const r0 = list0[i];

    const r = normalizeRow(r0, catDef);
    if (!r) continue;

    const id = toNumberOrNull(r[idField]);
    const name = String(r[nameField] ?? "").trim();
    if (id == null || !name) continue;

    // 重複チェック（同一カテゴリ内のみ）
    if (seenId.has(id)) {
      console.warn(`${warnPrefix} duplicate id: ${id} (index=${i})`, r0);
      continue;
    }
    if (seenName.has(name)) {
      console.warn(`${warnPrefix} duplicate name: "${name}" (index=${i})`, r0);
      continue;
    }

    seenId.add(id);
    seenName.add(name);

    const row = { ...r, [idField]: id, [nameField]: name };
    list.push(row);
    byId.set(id, row);
    byName.set(name, row);
  }

  return { categoryKey, catDef, idField, nameField, list, byId, byName };
}

// -------------------------
// キャッシュ & 初回ウォームアップ + 一括検証
// -------------------------
const cache = new Map();
let warmedUp = false;

// 参照検証は “全部作り終わってから 1回だけ”
function warmupAllMasters() {
  if (warmedUp) return;

  // 1) まず全カテゴリを構築（検証しない）
  const keys = Object.keys(config?.categories ?? {});
  for (const k of keys) {
    if (cache.has(k)) continue;
    cache.set(k, buildCategory(k));
  }

  // 2) 全部揃ってから一括検証
  validateAllMastersOnce();

  warmedUp = true;
}

function validateAllMastersOnce() {
  // skill マスター（requirementSkills が参照）
  const skillM = cache.get("skill") ?? null;

  // itemBonus が参照しうるカテゴリ（必要に応じて増やす）
  const BONUS_CATEGORIES = ["tool", "weapon", "armor", "shield"];
  const bonusMasters = BONUS_CATEGORIES.map((k) => cache.get(k)).filter(Boolean);

  // name がどれかに存在するか
  const existsBonusName = (name) => {
    for (const m of bonusMasters) {
      if (m.byName.get(name)) return true;
    }
    return false;
  };

  // 各カテゴリを走査してフィールド検証（必要なものだけ）
  for (const [categoryKey, m] of cache.entries()) {
    const fields = m?.catDef?.fields ?? [];
    const hasReq = fields.some((f) => f.type === "requirementSkills");
    const hasBonus = fields.some((f) => f.type === "itemBonus");

    if (!hasReq && !hasBonus) continue;

    for (let i = 0; i < (m.list?.length ?? 0); i++) {
      const row = m.list[i];

      // --- requirementSkills 検証 ---
      if (hasReq) {
        const req = row?.requirementSkills;
        if (req && typeof req === "object" && !Array.isArray(req)) {
          if (!skillM) {
            throw new Error(
              `[masters:${categoryKey}] requirementSkills validation needs category "skill" but it was not found`
            );
          }
          for (const name of Object.keys(req)) {
            if (!skillM.byName.get(name)) {
              throw new Error(
                `[masters:${categoryKey}] unknown skill in requirementSkills: "${name}" (index=${i})`
              );
            }
          }
        }
      }

      // --- itemBonus 検証 ---
      if (hasBonus) {
        const bonus = row?.itemBonus;
        if (bonus && typeof bonus === "object" && !Array.isArray(bonus)) {
          for (const [th, arr] of Object.entries(bonus)) {
            const list2 = Array.isArray(arr) ? arr : [];
            for (const it of list2) {
              const name = String(it?.name ?? "").trim();
              if (!name) continue; // 正規化で弾いてる想定だが念のため

              if (!existsBonusName(name)) {
                throw new Error(
                  `[masters:${categoryKey}] unknown item in itemBonus: "${name}" (threshold=${th}, index=${i})`
                );
              }
            }
          }
        }
      }
    }
  }
}

export function getMasters(categoryKey) {
  warmupAllMasters(); // 初回に “全部作る + 1回だけ検証”

  const k = String(categoryKey);
  const hit = cache.get(k);
  if (!hit) throw new Error(`Unknown masters category: ${k}`);
  return hit;
}

// -------------------------
// 汎用アクセサ
// -------------------------
export function byId(categoryKey, id) {
  const m = getMasters(categoryKey);
  const n = toNumberOrNull(id);
  if (n == null) return null;
  return m.byId.get(n) ?? null;
}

export function nameById(categoryKey, id, fallback = "(unknown)") {
  const hit = byId(categoryKey, id);
  return hit ? String(hit[getMasters(categoryKey).nameField] ?? fallback) : fallback;
}

export function byName(categoryKey, name) {
  const m = getMasters(categoryKey);
  const nm = String(name ?? "").trim();
  if (!nm) return null;
  return m.byName.get(nm) ?? null;
}

export function all(categoryKey) {
  return getMasters(categoryKey).list;
}
