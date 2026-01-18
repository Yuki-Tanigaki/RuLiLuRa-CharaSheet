// src/pages/sheets/heroSheet/combat.js

import { safeNum, clamp } from "/src/common/utils/number.js";
import { normalizeRequirement } from "/src/common/normalize.js";

/**
 * 英雄シートの戦闘系（命中/回避/要件ペナルティ等）を “純粋関数” としてまとめる。
 * - React や state 更新はしない
 * - useHeroSheetModel から呼ぶ想定
 */

/**
 * テキストから「回避 +n」っぽい情報を拾う（盾のメモ等）
 * 例: "回避+2" / "回避 + 2" / "回避：+2" / "回避+２"（全角も一部対応）
 */
export function parseEvadeSkillBonusFromText(text) {
  const s = String(text ?? "");
  if (!s.trim()) return 0;

  // 全角数字を半角に寄せる（最低限）
  const half = s.replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xff10));

  // 回避+2 / 回避 + 2 / 回避:+2 など
  const m = half.match(/回避\s*[:：]?\s*([+\-]\s*\d+)/);
  if (!m) return 0;

  const n = Number(String(m[1]).replace(/\s+/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** 10丸め（例：17→10, 20→20, -3→-10） */
export function roundDownTo10(n) {
  const x = safeNum(n, 0);
  if (x === 0) return 0;
  return Math.floor(x / 10) * 10;
}

/**
 * 回避値を計算
 *
 * inputs:
 * - evadeSkillLv: 「回避」スキル等の有効Lv
 * - agiMod: 敏捷修正（または任意の補正）
 * - shieldTextBonus: 盾メモ等からの回避+（parseEvadeSkillBonusFromText結果）
 * - extra: その他の加算（任意）
 *
 * returns:
 * - { raw, mod10 }
 */
export function calcEvade({ evadeSkillLv = 0, agiMod = 0, shieldTextBonus = 0, extra = 0 } = {}) {
  const raw =
    safeNum(evadeSkillLv, 0) +
    safeNum(agiMod, 0) +
    safeNum(shieldTextBonus, 0) +
    safeNum(extra, 0);

  return { raw, mod10: roundDownTo10(raw) };
}

/**
 * 装備の「必要技能」要件を抽出して正規化
 * - データ形式が揺れてもなるべく拾う
 *
 * returns:
 * - [skillName, minLv] or []
 */
export function getEquipRequirement(def) {
  const d = def ?? {};

  // よくある候補を優先して拾う
  const candidates = [
    d.req,
    d.requirement,
    d.requires,
    d.skillReq,
    d.skill_requirement,
    d.requiredSkill,
    d.required_skill,
    d.requireSkill,
  ];

  for (const c of candidates) {
    const r = normalizeRequirement(c);
    if (r.length === 2) return r;
  }

  // 直接フィールド形式
  const name =
    d.reqSkill ??
    d.req_skill ??
    d.skill ??
    d.skillName ??
    d.requiredSkillName ??
    d.required_skill_name ??
    "";
  const lv =
    d.reqLevel ??
    d.req_level ??
    d.minLevel ??
    d.min_level ??
    d.requiredSkillLevel ??
    d.required_skill_level ??
    null;

  const r2 = normalizeRequirement({ name, min: lv });
  return r2.length === 2 ? r2 : [];
}

/**
 * 要件ペナルティ（英雄ルール）
 * - 要件を満たさない場合の命中ペナルティ（既定: -20）
 * - ここはルールで変わりやすいので、必要なら差し替えてOK
 */
export function calcRequirementPenalty({ required = [], actualLv = 0, penaltyOnFail = -20 } = {}) {
  if (!required || required.length !== 2) return { ok: true, penalty: 0, required: [] };
  const minLv = safeNum(required[1], 0);
  const ok = safeNum(actualLv, 0) >= minLv;
  return { ok, penalty: ok ? 0 : safeNum(penaltyOnFail, -20), required };
}

/**
 * 武器の命中を計算して、表示用の rows を作る
 *
 * inputs:
 * - equippedWeapons: [{ kind:"weapon", id, name? }, ...] みたいな配列（最大2でもOK）
 * - catalogLookup(kind,id): def を返す関数（useHeroSheetModel 側で用意）
 * - getSkillLevelByName(name): スキル有効Lv（同名最大など）を返す関数
 * - mods: { str, dex, agi, int, ... }（能力修正）
 *
 * options:
 * - meleeSkillNames: 近接で参照するスキル名候補
 * - rangedSkillNames: 射撃で参照するスキル名候補
 * - penaltyOnFail: 要件未達時ペナルティ（既定 -20）
 *
 * returns:
 * - [{ slot, name, type, skillName, skillLv, abilityMod, req, reqOk, penalty, hit }, ...]
 */
export function buildWeaponHitRows(
  {
    equippedWeapons = [],
    catalogLookup,
    getSkillLevelByName,
    mods = {},
  } = {},
  options = {}
) {
  const meleeSkillNames = options.meleeSkillNames ?? ["接近戦", "近接戦闘", "白兵"];
  const rangedSkillNames = options.rangedSkillNames ?? ["射撃", "狙撃", "遠隔戦闘"];
  const penaltyOnFail = safeNum(options.penaltyOnFail, -20);

  const lookup =
    typeof catalogLookup === "function"
      ? catalogLookup
      : () => null;

  const getLv =
    typeof getSkillLevelByName === "function"
      ? getSkillLevelByName
      : () => 0;

  const rows = [];
  const weps = Array.isArray(equippedWeapons) ? equippedWeapons : [];

  for (let i = 0; i < weps.length; i++) {
    const wRef = weps[i] ?? {};
    const id = wRef.id ?? wRef.weaponId ?? null;
    const def = lookup("weapon", id) ?? wRef.def ?? null;

    const name = String(def?.name ?? wRef?.name ?? "—");
    const mode = String(def?.mode ?? def?.type ?? def?.attackType ?? "").toLowerCase();
    // ざっくり判定：mode/タグに ranged/shot 等があれば射撃扱い、それ以外は近接
    const isRanged =
      mode.includes("ranged") ||
      mode.includes("shot") ||
      mode.includes("射") ||
      String(def?.category ?? "").includes("射");

    const skillName =
      String(def?.skill ?? def?.skillName ?? "").trim() ||
      (isRanged ? pickFirstExistingSkill(rangedSkillNames, getLv) : pickFirstExistingSkill(meleeSkillNames, getLv)) ||
      (isRanged ? rangedSkillNames[0] : meleeSkillNames[0]);

    const skillLv = safeNum(getLv(skillName), 0);

    // 能力修正：近接=筋力、射撃=器用さ（必要なら調整）
    const abilityMod = isRanged ? safeNum(mods.dex, 0) : safeNum(mods.str, 0);

    const req = getEquipRequirement(def);
    const actualReqLv = req.length === 2 ? safeNum(getLv(req[0]), 0) : 0;
    const reqJudge = calcRequirementPenalty({ required: req, actualLv: actualReqLv, penaltyOnFail });

    // 武器固有の命中補正（あれば）
    const weaponHitBonus =
      safeNum(def?.hitBonus, 0) +
      safeNum(def?.hit, 0) + // データがこういう名前の可能性に保険
      safeNum(def?.accuracy, 0);

    const hit =
      skillLv +
      abilityMod +
      weaponHitBonus +
      reqJudge.penalty;

    rows.push({
      slot: i,
      kind: "weapon",
      id: id == null ? null : String(id),
      name,
      type: isRanged ? "ranged" : "melee",
      skillName,
      skillLv,
      abilityMod,
      weaponHitBonus,
      req, // [name,min]
      reqOk: reqJudge.ok,
      penalty: reqJudge.penalty,
      hit,
    });
  }

  return rows;
}

function pickFirstExistingSkill(candidates, getLv) {
  for (const name of candidates) {
    if (safeNum(getLv(name), 0) > 0) return name;
  }
  return "";
}

/**
 * 盾の回避ボーナス計算（「盾定義」+「メモ」+「任意加算」を合算）
 *
 * inputs:
 * - shieldDef: catalog上の盾定義（null可）
 * - shieldMemo: ユーザーが書いたテキスト（null可）
 *
 * returns:
 * - number
 */
export function calcShieldEvadeBonus({ shieldDef = null, shieldMemo = "" } = {}) {
  const defBonus =
    safeNum(shieldDef?.evadeBonus, 0) +
    safeNum(shieldDef?.evade, 0);

  const memoBonus = parseEvadeSkillBonusFromText(shieldMemo);
  return defBonus + memoBonus;
}

/**
 * 盾の要件（必要技能）を返す（UI表示/判定用）
 * - データに要件が無ければ []
 */
export function getShieldRequirement(shieldDef) {
  return getEquipRequirement(shieldDef);
}

/**
 * 2つの武器を同時装備できるか（両手武器/盾との排他など）
 * ※ ここはプロジェクトの装備仕様に合わせて拡張する前提で “最小” 実装
 *
 * returns:
 * - { ok, reason }
 */
export function validateHandedness({ weaponDefs = [], hasShield = false } = {}) {
  const defs = Array.isArray(weaponDefs) ? weaponDefs : [];
  const twoHanded = defs.some((d) => !!(d?.twoHanded || String(d?.handed ?? "").includes("2") || String(d?.hands ?? "") === "2"));

  if (hasShield && twoHanded) {
    return { ok: false, reason: "両手武器と盾は同時に装備できません。" };
  }

  // 2つ以上の両手武器など、必要ならここで追加
  return { ok: true, reason: "" };
}
