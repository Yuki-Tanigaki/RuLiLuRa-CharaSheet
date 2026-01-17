// src/pages/sheets/heroSheet/heroUnlock.js

import { collectUnlock, getUnclaimedUnlock, claimUnlock, unclaimUnlock } from "../common/unlock.js";
import { catalogKeyOf } from "../common/catalog.js";

/**
 * Heroシートの unlock（無料獲得）を common/unlock.js に接続する “薄いアダプタ”
 *
 * ここでやること：
 * - スキル行（rows）から「スキル定義」と「有効Lv」を用意する（※Hero側の責務）
 * - スキル定義にぶら下がる unlock を common/unlock で評価する（共通）
 * - freeItemPicks/freeItemClaims の形で state に載せられるようにする
 *
 * ここでは UI はやらない（UIは Section 側）。
 */

/**
 * スキル行から「スキル定義」を引くためのユーティリティ
 * - row の形がどうであれ、呼び出し側から resolveSkillDef(row) を渡す想定。
 *
 * resolveSkillDef(row) は以下のどれかを返す想定：
 * - { kind:"skill", id, name, unlock? } （masterでもuserでもOK）
 * - null
 */

/** スキル行の “保存キー” を作る（freeItemPicks のキーに使う） */
export function heroSkillKeyOf({ row, skillDef }) {
  // できれば「skill:id」で固定（名前変更に強い）
  const id = skillDef?.id ?? row?.id ?? null;
  const kind = skillDef?.kind ?? row?.kind ?? "skill";
  const k = catalogKeyOf(kind, id);

  // fallback：名前しか無いケース
  if (k) return `skill:${k}`; // "skill:skill:12" では？と感じるなら下の行に置換OK
  // return k;

  const name = String(skillDef?.name ?? row?.name ?? row?.label ?? "").trim();
  return name ? `skillName:${name}` : `skillRow:${Math.random().toString(36).slice(2)}`;
}

/**
 * 1つのスキルについて unlock 状態を計算
 *
 * 入力：
 * - skillDef.unlock を評価
 * - skillLevel は “有効Lv” を Hero 側の計算で入れる
 *
 * 出力：
 * - { unlocked, flat, unclaimed, future }
 */
export function computeHeroUnlockForSkill({ skillDef, skillLevel, catalog, claims, includeFuture = false }) {
  const unlock = skillDef?.unlock;
  const result = collectUnlock(unlock, skillLevel, {
    catalog,
    includeFuture,
    // dedupeKey は common 側の default（基本 kind:id）で十分
  });

  const unclaimed = getUnclaimedUnlock(result.flat, claims);

  return {
    unlocked: result.unlocked,
    flat: result.flat,
    unclaimed,
    future: result.future,
  };
}

/**
 * Hero全体（skills.rows 全行）の unlock をまとめて計算する
 *
 * options:
 * - resolveSkillDef(row): row→skillDef
 * - getRowEffectiveLevel(row, skillDef): row→有効Lv（create bonus反映済みなど）
 */
export function buildHeroUnlockSummary({
  skillRows,
  catalog,
  claims,
  resolveSkillDef,
  getRowEffectiveLevel,
  includeFuture = false,
} = {}) {
  const rows = Array.isArray(skillRows) ? skillRows : [];
  const c = claims && typeof claims === "object" ? claims : {};

  const out = [];

  for (const row of rows) {
    const skillDef = typeof resolveSkillDef === "function" ? resolveSkillDef(row) : null;
    if (!skillDef) continue;

    const lvl = typeof getRowEffectiveLevel === "function" ? getRowEffectiveLevel(row, skillDef) : 0;

    const u = computeHeroUnlockForSkill({
      skillDef,
      skillLevel: lvl,
      catalog,
      claims: c,
      includeFuture,
    });

    // そのスキル由来で “未受領の解放” があるものだけ欲しいケースが多い
    out.push({
      row,
      skillDef,
      skillLevel: lvl,
      skillKey: heroSkillKeyOf({ row, skillDef }),
      ...u,
    });
  }

  return out;
}

/**
 * freeItemPicks: { [skillKey]: "kind:id" } へ1件セット
 * - pickRef は unlock の item（resolved）または ref を渡してOK
 */
export function setFreePick({ picks, skillKey, pickRef }) {
  const p = picks && typeof picks === "object" ? picks : {};
  const key = normalizePickKey(pickRef);
  if (!skillKey || !key) return { ...p };
  return { ...p, [skillKey]: key };
}

/** freeItemPicks から1件削除 */
export function clearFreePick({ picks, skillKey }) {
  const p = picks && typeof picks === "object" ? picks : {};
  if (!skillKey) return { ...p };
  const next = { ...p };
  delete next[skillKey];
  return next;
}

/**
 * freeItemClaims を 1件 claim（受領済みにする）
 * - item は collectUnlock の flat 要素（{resolved/ref,...}）を渡すのが推奨
 */
export function addClaim({ claims, item }) {
  return claimUnlock(claims, item);
}

/** freeItemClaims を 1件 unclaim（受領取り消し） */
export function removeClaim({ claims, item }) {
  return unclaimUnlock(claims, item);
}

// -----------------
// internal
// -----------------

function normalizePickKey(pickRef) {
  if (!pickRef) return "";

  // collectUnlock の要素なら resolved を優先
  const resolved = pickRef.resolved;
  if (resolved?.kind != null && resolved?.id != null) {
    return `${String(resolved.kind)}:${String(resolved.id)}`;
  }

  // ref が "kind:id" 文字列ならそれ
  if (typeof pickRef === "string") {
    const s = pickRef.trim();
    if (/^[a-zA-Z_]+\s*:\s*.+$/.test(s)) return s.replace(/\s+/g, "");
    return "";
  }

  // オブジェクト {kind,id}
  if (typeof pickRef === "object") {
    const k = pickRef.kind ?? pickRef.type ?? null;
    const id = pickRef.id ?? pickRef.itemId ?? null;
    if (k != null && id != null) return `${String(k)}:${String(id)}`;
  }

  return "";
}
