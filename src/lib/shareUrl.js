// src/lib/shareUrl.js
import { compressToUTF16, decompressFromUTF16 } from "lz-string";

/**
 * state を URL に載せる用に圧縮して返す
 * - URLSearchParams が勝手にエスケープしてくれる前提でOK
 */
export function encodeStateToParam(state) {
  try {
    const json = JSON.stringify(state ?? {});
    return compressToUTF16(json);
  } catch {
    return "";
  }
}

/** URL パラメータから state を復元 */
export function decodeStateFromParam(param) {
  try {
    if (!param) return null;
    const json = decompressFromUTF16(String(param));
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * “今のURL” をベースに、指定 sheetType と state を埋め込んだ共有URLを作る
 * - router の有無に依存しないよう、path は呼び出し側で渡す
 */
export function buildShareUrl({ path, state }) {
  const u = new URL(window.location.href);
  // SPA で #/ ルーティングなら hash を差し替える運用も可
  // ここでは「path をそのまま入れる」想定にしておく
  u.hash = path.startsWith("#") ? path : `#${path}`;

  const encoded = encodeStateToParam(state);
  const hash = u.hash || "#";
  const [hashPath, hashQuery = ""] = hash.split("?");
  const sp = new URLSearchParams(hashQuery);
  if (encoded) sp.set("s", encoded);
  else sp.delete("s");

  u.hash = `${hashPath}?${sp.toString()}`;
  return u.toString();
}

/** hash から s= を読む（#/route?s=... 方式） */
export function readStateParamFromHash() {
  const hash = window.location.hash || "";
  const q = hash.includes("?") ? hash.split("?")[1] : "";
  const sp = new URLSearchParams(q);
  return sp.get("s");
}
