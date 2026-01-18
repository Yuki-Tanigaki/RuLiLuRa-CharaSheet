// src/common/normalize.js

/**
 * 要件の正規化
 * 想定：["技能名", 10] のような形
 *
 * 許容する入力：
 * - ["回避", 10]
 * - ["回避", "10"]
 * - { name: "回避", min: 10 }
 * - { skill: "回避", level: 10 }
 * - "回避 10" / "回避>=10" / "回避:10"
 *
 * 戻り値：
 * - 条件を解釈できた場合: [name: string, min: number]
 * - 解釈できない場合: []
 */
export function normalizeRequirement(req) {
  if (req == null) return [];

  // 1) 配列形式
  if (Array.isArray(req)) {
    const name = String(req?.[0] ?? "").trim();
    const n = Number(req?.[1]);
    if (!name || !Number.isFinite(n)) return [];
    return [name, n];
  }

  // 2) オブジェクト形式
  if (typeof req === "object") {
    const name =
      String(req.name ?? req.skill ?? req.skillName ?? req.label ?? "").trim();
    const minRaw = req.min ?? req.level ?? req.value ?? req.threshold ?? req.req ?? null;
    const n = Number(minRaw);
    if (!name || !Number.isFinite(n)) return [];
    return [name, n];
  }

  // 3) 文字列形式（ざっくりパース）
  if (typeof req === "string") {
    const s = req.trim();
    if (!s) return [];
    // "回避 10" / "回避:10" / "回避>=10" / "回避 10+" 等を許容
    const m = s.match(/^(.+?)(?:\s*[:>=]+?\s*|\s+)(-?\d+(?:\.\d+)?)\s*\+?\s*$/);
    if (!m) return [];
    const name = String(m[1]).trim();
    const n = Number(m[2]);
    if (!name || !Number.isFinite(n)) return [];
    return [name, n];
  }

  return [];
}

/**
 * 閾値キーを数値に正規化（unlock のキーなど）
 *
 * 許容：
 * - 10
 * - "10"
 * - "Lv10"
 * - "10+"
 * - ">=10"
 *
 * 戻り値：
 * - 数値にできたら number
 * - できなければ null
 */
export function normalizeThresholdKey(k) {
  if (k == null) return null;

  if (typeof k === "number") return Number.isFinite(k) ? k : null;

  const s = String(k).trim();
  if (!s) return null;

  // 先頭/末尾の記号や "Lv" を吸収して、最初に見つかった数値を拾う
  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;

  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

/**
 * マスター要素から「表示ラベル」を作る
 * フィールド揺れ（name/label/title/skillName…）を吸収する。
 *
 * options:
 * - fallback: string（既定: "—"）
 * - keys: string[]（既定: ["name","label","title","skillName","skill_label"]）
 */
export function labelFromMaster(master, options = {}) {
  const fallback = options.fallback ?? "—";
  const keys =
    Array.isArray(options.keys) && options.keys.length
      ? options.keys
      : ["name", "label", "title", "skillName", "skill_label"];

  const m = master && typeof master === "object" ? master : null;
  if (!m) return fallback;

  for (const k of keys) {
    const v = m?.[k];
    const s = v == null ? "" : String(v).trim();
    if (s) return s;
  }

  return fallback;
}
