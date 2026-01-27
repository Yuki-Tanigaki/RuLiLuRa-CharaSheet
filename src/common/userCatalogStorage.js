// src/common/userCatalogStorage.js
//
// S4 準拠：userCatalog の永続化は App のみが責務
// - localStorage を触るのはここだけ
// - Debug / Sheet / Editor から直接触るのは禁止
// - 形式は極力素通し（正規化・検証は catalogService 側）

const STORAGE_KEY = "rulilura.userCatalog.v1";

/**
 * userCatalog を localStorage から読み込む
 * - 破損していたら空オブジェクトを返す
 */
export function loadUserCatalog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return {};
  } catch (e) {
    console.warn("[userCatalogStorage] failed to load, fallback to empty", e);
    return {};
  }
}

/**
 * userCatalog を localStorage に保存する
 * - 例外は握りつぶさず console に出す（App 側で状態は保持される）
 */
export function saveUserCatalog(userCatalog) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userCatalog ?? {}));
  } catch (e) {
    console.error("[userCatalogStorage] failed to save", e);
  }
}

/**
 * デバッグ・将来拡張用
 * - 明示的に userCatalog を消したい場合のみ使用
 */
export function clearUserCatalog() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("[userCatalogStorage] failed to clear", e);
  }
}
