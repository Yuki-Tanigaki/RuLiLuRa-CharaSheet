// src/pages/sheets/common/utils/number.js

/**
 * 値を number に変換できれば number、できなければ null を返す
 * - 空文字 / null / undefined → null
 * - NaN / Infinity → null
 */
export function toNumOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * 値を number に変換できればその値、
 * できなければ fallback を返す
 */
export function safeNum(v, fallback = 0) {
  const n = toNumOrNull(v);
  return n == null ? fallback : n;
}

/**
 * 数値を [min, max] の範囲に収める
 */
export function clamp(n, min, max) {
  const x = safeNum(n, min);
  return Math.min(max, Math.max(min, x));
}
