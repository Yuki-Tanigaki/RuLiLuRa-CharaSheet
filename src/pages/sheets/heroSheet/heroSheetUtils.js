// src/pages/sheets/heroSheet/heroSheetUtils.js

export function toNumOrNull(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

export function safeNum(v, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

export function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

export function joinClass(...xs) {
  return xs.filter(Boolean).join(" ");
}

/* -----------------------------
 * スキル・装備関連ユーティリティ
 * ----------------------------- */

export function skillLabelFromMaster(skill) {
  return skill?.name ?? skill?.label ?? skill?.skillName ?? skill?.title ?? String(skill?.id ?? "");
}

export function parseEvadeSkillBonusFromText(text) {
  const t = String(text ?? "");
  const m = t.match(/回避.*?[＋+]\s*([0-9]+)/);
  if (!m) return 0;
  return safeNum(m[1]);
}

export function normalizeRequirement(req) {
  if (!Array.isArray(req) || req.length === 0) return [];
  const name = String(req[0] ?? "").trim();
  if (!name) return [];
  return [name, safeNum(req[1])];
}

export function normalizeThresholdKey(k) {
  const n = Number(k);
  return Number.isFinite(n) ? n : null;
}

/* -----------------------------
 * カタログ参照
 * ----------------------------- */

export function kindLabel(kind) {
  switch (kind) {
    case "weapon": return "武器";
    case "armor": return "防具";
    case "shield": return "盾";
    case "item": return "アイテム";
    default: return String(kind ?? "—");
  }
}

export function catalogKeyOf(kind, id) {
  return `${kind}:${String(id)}`;
}

export function resolveCatalogRef(entry, catalog) {
  if (entry == null) return null;
  const sameId = (a, b) => String(a) === String(b);

  if (typeof entry === "string") {
    const name = entry.trim();
    if (!name) return null;
    const hit = catalog.find(c => String(c.name ?? "").trim() === name);
    // return hit ? { kind: hit.kind, id: Number(hit.id), name: hit.name } : null;
    return hit ? { kind: hit.kind, id: hit.id, name: hit.name } : null;
  }

  if (typeof entry === "number") {
    const id = safeNum(entry, NaN);
    if (!Number.isFinite(id)) return null;

    const priority = ["item", "weapon", "armor", "shield"];
    for (const k of priority) {
      // const hit = catalog.find(c => c.kind === k && c.id === id);
      const hit = catalog.find(c => c.kind === k && sameId(c.id, id));
      if (hit) return { kind: hit.kind, id, name: hit.name };
    }
    // const hitAny = catalog.find(c => c.id === id);
    // return hitAny ? { kind: hitAny.kind, id, name: hitAny.name } : null;
    const hitAny = catalog.find(c => sameId(c.id, id));
    return hitAny ? { kind: hitAny.kind, id: hitAny.id, name: hitAny.name } : null;
  }

  if (typeof entry === "object") {
    const kind = String(entry.kind ?? entry.type ?? "").trim();
    // const id = safeNum(entry.id, NaN);

    // if (kind && Number.isFinite(id)) {
    //   const hit = catalog.find(c => c.kind === kind && c.id === id);
    //   if (hit) return { kind, id, name: hit.name };
    // }
    const rawId = entry.id;
    const idNum = typeof rawId === "number" ? rawId : Number(rawId);
    const id = Number.isFinite(idNum) ? idNum : (rawId == null ? null : String(rawId));

    if (kind && id != null && String(id).trim() !== "") {
      const hit = catalog.find(c => c.kind === kind && sameId(c.id, id));
      if (hit) return { kind, id: hit.id, name: hit.name };
    }

    const name = String(entry.name ?? "").trim();
    if (name) {
      const hit = catalog.find(c => c.name === name);
      if (hit) return { kind: hit.kind, id: hit.id, name: hit.name };
    }
  }

  return null;
}

/* -----------------------------
 * 派生値計算（Hero）
 * ----------------------------- */

export function abilityMod(score) {
  return safeNum(score) - 10;
}

export function fmtSigned(n) {
  const x = safeNum(n);
  return x >= 0 ? `+${x}` : `${x}`;
}

export function calcHeroHP(a) {
  return {
    hpNormal: safeNum(a?.str) + safeNum(a?.dex),
    hpWound:  safeNum(a?.agi) + safeNum(a?.vit),
    mp:       safeNum(a?.int) + safeNum(a?.psy),
  };
}

export function calcHeroCombat(a) {
  return {
    melee:  abilityMod(a?.str) + abilityMod(a?.agi),
    ranged: abilityMod(a?.dex) + abilityMod(a?.int),
    resist: abilityMod(a?.psy) + abilityMod(a?.vit),
  };
}

export function calcHeroMoney(a) {
  return safeNum(a?.int) * safeNum(a?.dex) * 1000;
}

export function calcHeroDerived(state) {
  const a = state?.abilities ?? {};
  return {
    mods: {
      str: abilityMod(a.str),
      dex: abilityMod(a.dex),
      agi: abilityMod(a.agi),
      vit: abilityMod(a.vit),
      int: abilityMod(a.int),
      psy: abilityMod(a.psy),
    },
    hp: calcHeroHP(a),
    combat: calcHeroCombat(a),
  };
}
