// src/pages/sheets/common/useSetField.js
import { useCallback } from "react";

/**
 * 深いパス更新を安全に行うための Hook。
 *
 * - setField(path, valueOrUpdater)
 *   - path: ["skills","rows",0,"level"] のような配列
 *   - valueOrUpdater:
 *       - 値: その値を代入
 *       - 関数(prevValue)=>nextValue: そのパスの現在値を渡して更新
 *
 * 例:
 *   const setField = useSetField(setState);
 *   setField(["basic","name"], "Alice");
 *   setField(["skills","rows"], (rows)=>[...(rows??[]), {kind:"master", id:null, level:10}]);
 */
export function useSetField(setState) {
  return useCallback(
    (path, valueOrUpdater) => {
      if (typeof setState !== "function") return;
      const p = normalizePath(path);

      // パスが空なら「全体更新」として扱う
      if (p.length === 0) {
        setState((prev) => (typeof valueOrUpdater === "function" ? valueOrUpdater(prev) : valueOrUpdater));
        return;
      }

      setState((prev) => {
        const base = clone(prev);
        const next = setByPath(base, p, valueOrUpdater);
        return next;
      });
    },
    [setState]
  );
}

/** path を安全に正規化（文字列化・数値キー維持） */
function normalizePath(path) {
  if (!Array.isArray(path)) return [];
  return path
    .map((x) => {
      // number は配列 index として残す（"0"にしない）
      if (typeof x === "number") return x;
      if (x == null) return "";
      return String(x);
    })
    .filter((x) => x !== "");
}

/** structuredClone があれば使う。なければ JSON clone（関数/Date等は落ちるので注意） */
function clone(v) {
  if (typeof structuredClone === "function") return structuredClone(v);
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    // どうしても無理なら shallow で返す（最悪でも落ちないように）
    if (Array.isArray(v)) return v.slice();
    if (v && typeof v === "object") return { ...v };
    return v;
  }
}

/**
 * base を破壊せずに、path の位置だけを書き換えた新しいオブジェクト/配列を返す。
 * base は clone 済み前提（ただし下層の参照は必要に応じてコピーする）
 */
function setByPath(base, path, valueOrUpdater) {
  const root = base ?? inferContainer(path[0]);

  // ルートの型が path と合わなければ作り直す
  const outRoot = ensureContainer(root, path[0]);

  let cur = outRoot;

  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const isLast = i === path.length - 1;

    if (isLast) {
      const prevValue = cur?.[key];
      const nextValue = typeof valueOrUpdater === "function" ? valueOrUpdater(prevValue) : valueOrUpdater;
      cur[key] = nextValue;
      break;
    }

    const nextKey = path[i + 1];

    // 現在の子
    const child = cur?.[key];

    // 子の型を path に合わせて確保
    const nextChild = ensureContainer(child, nextKey);

    // もし child が既にオブジェクト/配列なら「そのまま使う」のではなく、参照共有を避けるためにコピー
    cur[key] = shallowCopy(nextChild);

    // 次へ
    cur = cur[key];
  }

  return outRoot;
}

/** 次のキーが number なら配列、そうでなければオブジェクトを推定 */
function inferContainer(nextKey) {
  return typeof nextKey === "number" ? [] : {};
}

/** child が適切なコンテナでなければ作る */
function ensureContainer(child, nextKey) {
  const wantArray = typeof nextKey === "number";
  if (wantArray) {
    return Array.isArray(child) ? child : [];
  }
  // object を期待（null/配列/プリミティブなら作り直す）
  return child && typeof child === "object" && !Array.isArray(child) ? child : {};
}

/** 参照共有を避ける shallow copy */
function shallowCopy(v) {
  if (Array.isArray(v)) return v.slice();
  if (v && typeof v === "object") return { ...v };
  return v;
}
