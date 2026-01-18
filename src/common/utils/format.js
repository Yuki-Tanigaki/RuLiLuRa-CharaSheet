// src/common/utils/format.js

import { safeNum } from "./number.js";

/**
 * 符号付き数値表示
 *  - 正: "+n"
 *  - 負: "-n"
 *  - 0 : "+0"（デフォルト）
 *
 * options:
 *  - zero: "0" | "+0" | ""  （既定: "0"）
 */
export function fmtSigned(v, options = {}) {
  const n = safeNum(v, 0);
  const zero = options.zero ?? "+0";

  if (n === 0) return zero;
  return n > 0 ? `+${n}` : String(n);
}

/**
 * 数値を桁区切り（ロケール依存）で表示
 *  - 数値化できない場合は空文字
 */
export function fmtNumber(v, locale = undefined) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString(locale);
}

/**
 * クラス名を安全に結合する
 *  - falsy 値（false / null / undefined / ""）は無視
 *
 * 使用例:
 *   joinClass("sheet", editable && "is-edit", disabled && "is-disabled")
 */
export function joinClass(...xs) {
  return xs.filter(Boolean).join(" ");
}

/**
 * 文字列を安全に表示用へ
 *  - null / undefined → ""
 */
export function fmtText(v) {
  if (v == null) return "";
  return String(v);
}
