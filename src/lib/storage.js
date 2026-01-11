// src/lib/storage.js
/**
 * キャラクターシート state の永続化ユーティリティ
 * - localStorage 保存/読込
 * - JSON エクスポート（ダウンロード）
 * - JSON インポート（ファイル→オブジェクト）
 *
 * 使い方例：
 *   saveState(state, { sheetType: "hero" })
 *   const s = loadState({ sheetType: "hero" })
 *   exportJson(state, { sheetType: "hero" })
 *   const imported = await importJsonViaPicker()
 */

const KEY_PREFIX = "rulilura.sheet";
const KEY_VERSION = "v1";

// 必要なら増やす
const VALID_SHEET_TYPES = new Set(["hero", "diva", "armored"]);

function normalizeSheetType(sheetType) {
  const t = String(sheetType || "").trim();
  return VALID_SHEET_TYPES.has(t) ? t : "unknown";
}

function storageKey(sheetType) {
  const t = normalizeSheetType(sheetType);
  return `${KEY_PREFIX}.${t}.state.${KEY_VERSION}`;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function safeStringifyJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return null;
  }
}

/** localStorage から state を読む */
export function loadState({ sheetType = "hero" } = {}) {
  try {
    const raw = localStorage.getItem(storageKey(sheetType));
    if (!raw) return null;
    const s = safeParseJson(raw);
    return s ?? null;
  } catch {
    return null;
  }
}

/** localStorage に state を保存する */
export function saveState(state, { sheetType = "hero" } = {}) {
  try {
    const json = safeStringifyJson(state);
    if (json == null) return false;
    localStorage.setItem(storageKey(sheetType), json);
    return true;
  } catch {
    return false;
  }
}

/** localStorage の state を消す */
export function clearState({ sheetType = "hero" } = {}) {
  try {
    localStorage.removeItem(storageKey(sheetType));
    return true;
  } catch {
    return false;
  }
}

/** それっぽいファイル名を作る（ユーザー名等は入れない） */
function buildDefaultFileName({ sheetType = "hero", state } = {}) {
  const t = normalizeSheetType(sheetType);
  const name =
    t === "hero"
      ? String(state?.basic?.name || "").trim()
      : String(state?.basic?.name || "").trim();

  const safeName = name
    ? name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 40)
    : t;

  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${safeName}_${yyyy}${mm}${dd}_${hh}${mi}.json`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "charsheet.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** state を JSON ファイルとしてダウンロード */
export function exportJson(state, { sheetType = "hero", filename } = {}) {
  const json = safeStringifyJson(state);
  if (json == null) return false;

  const file = filename || buildDefaultFileName({ sheetType, state });
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, file);
  return true;
}

/** JSON 文字列から state を復元（バリデーションは最低限） */
export function importJsonText(jsonText) {
  const obj = safeParseJson(String(jsonText ?? ""));
  if (!obj || typeof obj !== "object") return null;

  // 最低限の形だけチェック（壊れたファイル弾き）
  // ※ 厳密な schema 検証は後で validate.js を作って移すのがおすすめ
  if (!("version" in obj)) return obj; // version 無くても受ける（移行のため）
  return obj;
}

/** File を受け取り、JSON を parse して返す */
export async function importJsonFile(file) {
  try {
    if (!(file instanceof File)) return null;
    const text = await file.text();
    return importJsonText(text);
  } catch {
    return null;
  }
}

/**
 * ファイルピッカーを開いて JSON を選ばせて import する
 * - 呼び出し側: const s = await importJsonViaPicker(); if (s) setState(s);
 */
export function importJsonViaPicker() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0] ?? null;
      const s = file ? await importJsonFile(file) : null;
      resolve(s);
    };
    input.click();
  });
}

/**
 * 便利：クリップボードに JSON をコピー（ブラウザ対応次第）
 * - URL共有とは別に「一旦コピーしてDiscordに貼る」などに使える
 */
export async function copyJsonToClipboard(state) {
  const json = safeStringifyJson(state);
  if (!json) return false;
  try {
    await navigator.clipboard.writeText(json);
    return true;
  } catch {
    return false;
  }
}
