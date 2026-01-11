// src/lib/versioning.js
import { compressToUTF16, decompressFromUTF16 } from "lz-string";

// 旧キー（過去に共通で保存していたもの）
const LEGACY_KEY = "rulilura.history.v1";

// 新キー（シート別）
const KEY_PREFIX = "rulilura.history";
const KEY_VERSION = "v1";

const LIMIT = 50;

// 想定シート種別（必要なら増やせる）
const VALID_TYPES = new Set(["hero", "diva", "armored"]);

function keyOf(sheetType) {
  const t = String(sheetType || "").trim();
  if (!VALID_TYPES.has(t)) return `${KEY_PREFIX}.unknown.${KEY_VERSION}`;
  return `${KEY_PREFIX}.${t}.${KEY_VERSION}`;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function notifyHistoryUpdated() {
  try {
    window.dispatchEvent(new Event("rulilura:history-updated"));
  } catch {
    // no-op
  }
}

function normalizeTags(tags) {
  // tags: string | string[] | null を想定
  if (tags == null) return [];
  const arr = Array.isArray(tags) ? tags : String(tags).split(",");
  const out = [];
  for (const t of arr) {
    const s = String(t ?? "").trim();
    if (!s) continue;
    out.push(s);
  }
  // 重複除去（順序維持）
  return Array.from(new Set(out));
}

function saveHistoryByKey(storageKey, list) {
  localStorage.setItem(storageKey, JSON.stringify(list));
  notifyHistoryUpdated();
}

function loadHistoryByKey(storageKey) {
  return safeParse(localStorage.getItem(storageKey));
}

/** シート別の履歴を読む */
export function loadHistory(sheetType) {
  const list = loadHistoryByKey(keyOf(sheetType));
  // 既存データ互換：tags が無ければ [] に揃える
  if (!Array.isArray(list)) return [];
  return list.map((it) => ({
    ...it,
    tags: normalizeTags(it?.tags),
  }));
}

/** シート別の履歴を保存（list は配列） */
export function saveHistory(sheetType, list) {
  const normalized = (Array.isArray(list) ? list : []).map((it) => ({
    ...it,
    tags: normalizeTags(it?.tags),
  }));
  saveHistoryByKey(keyOf(sheetType), normalized);
}

/**
 * state を履歴にコミット
 * 既存互換のため message は従来通り string。
 * tags を第4引数で追加（任意）
 *
 * @param {object} state
 * @param {string} message
 * @param {"hero"|"diva"|"armored"} sheetType
 * @param {string|string[]} tags
 */
export function commitHistory(state, message = "", sheetType, tags = []) {
  const list = loadHistory(sheetType);
  const item = {
    id: uid(),
    at: new Date().toISOString(),
    message,
    sheetType: VALID_TYPES.has(sheetType) ? sheetType : "unknown",
    tags: normalizeTags(tags),
    stateCompressed: compressToUTF16(JSON.stringify(state)),
  };
  const next = [item, ...list].slice(0, LIMIT);
  saveHistory(sheetType, next);
  return next;
}

/** 履歴アイテムから state を復元 */
export function restoreHistoryItem(item) {
  const json = decompressFromUTF16(item.stateCompressed);
  if (!json) return null;
  return JSON.parse(json);
}

/** シート別の履歴から1件削除 */
export function deleteHistory(sheetType, id) {
  const list = loadHistory(sheetType).filter((x) => x.id !== id);
  saveHistory(sheetType, list);
  return list;
}

/** シート別の履歴を全削除 */
export function clearHistory(sheetType) {
  saveHistory(sheetType, []);
}

/**
 * ★追加：履歴1件を更新（タグ編集などに使う）
 * patch例: { message: "xxx", tags: ["a","b"] }
 */
export function updateHistoryItem(sheetType, id, patch = {}) {
  const list = loadHistory(sheetType);
  const next = list.map((it) => {
    if (it.id !== id) return it;
    const p = patch && typeof patch === "object" ? patch : {};
    const merged = { ...it, ...p };
    if ("tags" in p) merged.tags = normalizeTags(p.tags);
    if ("message" in p) merged.message = String(p.message ?? "");
    return merged;
  });
  saveHistory(sheetType, next);
  return next;
}
