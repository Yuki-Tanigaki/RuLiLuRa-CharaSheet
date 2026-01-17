// src/pages/sheets/common/userCatalog.js

/**
 * userCatalog（独自データ）を “シート非依存” に扱うための共通ユーティリティ。
 *
 * - 保存先：localStorage
 * - 形式：{ items, weapons, armors, shields, skills, heroSkills }
 * - sheetType/scope でキーを分けられる（例：shared / hero固有 など）
 *
 * 重要：
 * - UI/React 依存なし（純粋関数中心）
 * - ここは「データ管理層」なので、表示文言(kindLabel等)は扱わない
 */

// =====================
// schema / categories
// =====================

export const USER_CATALOG_CATEGORIES = [
  "items",
  "weapons",
  "armors",
  "shields",
  "skills",
  "heroSkills",
];

export function emptyUserCatalog() {
  return {
    items: [],
    weapons: [],
    armors: [],
    shields: [],
    skills: [],
    heroSkills: [],
  };
}

export function normalizeUserCatalog(uc) {
  const o = uc && typeof uc === "object" ? uc : {};
  const arr = (x) => (Array.isArray(x) ? x.filter(Boolean) : []);

  const out = {};
  for (const k of USER_CATALOG_CATEGORIES) out[k] = arr(o[k]);
  return out;
}

// =====================
// storage key
// =====================

const KEY_PREFIX = "rulilura.userCatalog";
const KEY_VERSION = "v1";

function safeSheetType(sheetType) {
  const t = String(sheetType ?? "").trim().toLowerCase();
  return t || "unknown";
}
function safeScope(scope) {
  const s = String(scope ?? "").trim().toLowerCase();
  return s === "shared" ? "shared" : "sheet";
}

/**
 * scope:
 * - "shared": 全シート共通の独自DB（おすすめ：CatalogSheet）
 * - "sheet" : シート別の独自DB（例：heroだけの独自DB）
 */
export function userCatalogStorageKey({ sheetType = "unknown", scope = "sheet" } = {}) {
  const sc = safeScope(scope);
  const t = safeSheetType(sheetType);
  if (sc === "shared") return `${KEY_PREFIX}.shared.${KEY_VERSION}`;
  return `${KEY_PREFIX}.${t}.${KEY_VERSION}`;
}

function safeParseJson(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// =====================
// load / save
// =====================

export function loadUserCatalog({ sheetType = "unknown", scope = "sheet" } = {}) {
  const key = userCatalogStorageKey({ sheetType, scope });
  try {
    const raw = localStorage.getItem(key);
    return normalizeUserCatalog(safeParseJson(raw, emptyUserCatalog()));
  } catch {
    return emptyUserCatalog();
  }
}

export function saveUserCatalog(uc, { sheetType = "unknown", scope = "sheet" } = {}) {
  const key = userCatalogStorageKey({ sheetType, scope });
  try {
    localStorage.setItem(key, JSON.stringify(normalizeUserCatalog(uc)));
  } catch {
    // ignore（容量不足やプライベートモード等）
  }
}

// =====================
// CRUD helpers
// =====================

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function prefixForCategory(category) {
  // "items" -> "u_item"
  const c = String(category ?? "").trim();
  switch (c) {
    case "items":
      return "u_item";
    case "weapons":
      return "u_weapon";
    case "armors":
      return "u_armor";
    case "shields":
      return "u_shield";
    case "skills":
      return "u_skill";
    case "heroSkills":
      return "u_heroSkill";
    default:
      return "u_entry";
  }
}

function normalizeEntry(category, entry) {
  const e = entry && typeof entry === "object" ? entry : {};
  const name = String(e.name ?? "").trim();
  if (!name) return null;

  const id = String(e.id ?? uid(prefixForCategory(category)));

  // entryの中身はカテゴリごとに自由に拡張したいので基本はそのまま保持する
  // ただし id/name は強制的に正規化
  return { ...e, id, name };
}

/**
 * upsert（追加 or 更新）
 * - entry.id が既存と一致すれば更新
 * - 無ければ新規追加（先頭に追加）
 *
 * return: 次の userCatalog（正規化済み）
 */
export function upsertUserCatalogEntry(userCatalog, category, entry) {
  const uc = normalizeUserCatalog(userCatalog);
  const cat = String(category ?? "").trim();

  if (!USER_CATALOG_CATEGORIES.includes(cat)) return uc;

  const row = normalizeEntry(cat, entry);
  if (!row) return uc;

  const cur = Array.isArray(uc[cat]) ? uc[cat].slice() : [];
  const idStr = String(row.id);

  const idx = cur.findIndex((x) => String(x?.id) === idStr);
  if (idx >= 0) {
    cur[idx] = row;
  } else {
    // 新規は先頭（最近作ったものが上）
    cur.unshift(row);
  }

  return { ...uc, [cat]: cur };
}

/**
 * 削除
 * return: 次の userCatalog
 */
export function removeUserCatalogEntry(userCatalog, category, id) {
  const uc = normalizeUserCatalog(userCatalog);
  const cat = String(category ?? "").trim();
  if (!USER_CATALOG_CATEGORIES.includes(cat)) return uc;

  const idStr = String(id ?? "");
  const cur = Array.isArray(uc[cat]) ? uc[cat] : [];
  const next = cur.filter((x) => String(x?.id) !== idStr);

  return { ...uc, [cat]: next };
}

/**
 * name で探す（簡易）
 * - 完全一致（trim後）
 * - 見つからなければ null
 */
export function findUserCatalogEntry(userCatalog, category, name) {
  const uc = normalizeUserCatalog(userCatalog);
  const cat = String(category ?? "").trim();
  if (!USER_CATALOG_CATEGORIES.includes(cat)) return null;

  const nm = String(name ?? "").trim();
  if (!nm) return null;

  const cur = Array.isArray(uc[cat]) ? uc[cat] : [];
  return cur.find((x) => String(x?.name ?? "").trim() === nm) ?? null;
}

/**
 * 便利：カテゴリの配列を安全に取り出す
 */
export function listUserCatalog(userCatalog, category) {
  const uc = normalizeUserCatalog(userCatalog);
  const cat = String(category ?? "").trim();
  if (!USER_CATALOG_CATEGORIES.includes(cat)) return [];
  return Array.isArray(uc[cat]) ? uc[cat] : [];
}
