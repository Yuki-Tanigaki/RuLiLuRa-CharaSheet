// src/pages/sheets/heroSheet/useHeroSheetModel.js
import { useEffect, useMemo, useRef } from "react";
import { SKILLS_MASTER, SKILL_ID_EVADE } from "../../../data/skillsMaster.js";
import { HERO_SKILLS_MASTER } from "../../../data/heroSkillsMaster.js";
import { WEAPONS_MASTER } from "../../../data/weaponsMaster.js";
import { ARMORS_MASTER } from "../../../data/armorsMaster.js";
import { SHIELDS_MASTER } from "../../../data/shieldsMaster.js";
import { ITEMS_MASTER } from "../../../data/itemsMaster.js";

import {
  calcHeroDerived,
  fmtSigned,
  safeNum,
  skillLabelFromMaster,
  parseEvadeSkillBonusFromText,
  normalizeRequirement,
  normalizeThresholdKey,
  resolveCatalogRef,
  catalogKeyOf,
} from "./heroSheetUtils.js";

export function useHeroSheetModel({ state, mode, setState }) {
  const s = state;
  const editable = mode === "edit" || mode === "create";
  const isCreate = mode === "create";
  const itemsEditable = editable && !isCreate;

  const d = calcHeroDerived(s);
  const a = s.abilities ?? {};
  const mods = d?.mods ?? {};
  const hp = d?.hp ?? { hpNormal: 0, hpWound: 0, mp: 0 };

  // ---- setField ----
  function setField(path, valueOrFn) {
    if (!setState) return;
    setState((prev) => {
      const next = structuredClone(prev);
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (cur[key] == null || typeof cur[key] !== "object") cur[key] = {};
        cur = cur[key];
      }
      const lastKey = path[path.length - 1];
      const prevVal = cur[lastKey];
      cur[lastKey] = typeof valueOrFn === "function" ? valueOrFn(prevVal) : valueOrFn;
      return next;
    });
  }

  // =========================
  // userCatalog (ブラウザごと)
  // =========================
  const USER_CATALOG_KEY = "rulilura.userCatalog.v1";

  function safeParseJson(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeUserCatalog(uc) {
    const o = uc && typeof uc === "object" ? uc : {};
    const arr = (x) => (Array.isArray(x) ? x : []);
    return {
      items: arr(o.items),
      weapons: arr(o.weapons),
      armors: arr(o.armors),
      shields: arr(o.shields),
      skills: arr(o.skills),
      heroSkills: arr(o.heroSkills),
    };
  }

  function loadUserCatalogFromStorage() {
    return normalizeUserCatalog(safeParseJson(localStorage.getItem(USER_CATALOG_KEY), {}));
  }

  function saveUserCatalogToStorage(uc) {
    try {
      localStorage.setItem(USER_CATALOG_KEY, JSON.stringify(normalizeUserCatalog(uc)));
    } catch {
      // ignore
    }
  }

  const userCatalog = normalizeUserCatalog(s?.userCatalog);

  // state.userCatalog が無い/未初期化なら localStorage から注入（初回のみ）
  const didInitUserCatalog = useRef(false);
  useEffect(() => {
    if (didInitUserCatalog.current) return;
    didInitUserCatalog.current = true;

    const hasAny =
      Array.isArray(s?.userCatalog?.items) ||
      Array.isArray(s?.userCatalog?.weapons) ||
      Array.isArray(s?.userCatalog?.armors) ||
      Array.isArray(s?.userCatalog?.shields) ||
      Array.isArray(s?.userCatalog?.skills) ||
      Array.isArray(s?.userCatalog?.heroSkills);

    if (!hasAny) {
      const loaded = loadUserCatalogFromStorage();
      setField(["userCatalog"], loaded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function uid(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }

  function upsertUserCatalog(nextUc) {
    const normalized = normalizeUserCatalog(nextUc);
    setField(["userCatalog"], normalized);
    saveUserCatalogToStorage(normalized);
  }

  function addUserCatalogEntry(listKey, entry) {
    const key = String(listKey);
    const e = entry && typeof entry === "object" ? entry : {};
    const id = String(e.id ?? uid(`u_${key.slice(0, -1)}`));
    const name = String(e.name ?? "").trim();
    if (!name) return null;

    const next = { ...userCatalog };
    const cur = Array.isArray(next[key]) ? next[key].slice() : [];
    const idx = cur.findIndex((x) => String(x?.id) === id);
    const row = { ...e, id, name };

    if (idx >= 0) cur[idx] = row;
    else cur.unshift(row);

    next[key] = cur;
    upsertUserCatalog(next);
    return id;
  }

  function removeUserCatalogEntry(listKey, id) {
    const key = String(listKey);
    const idStr = String(id);
    const next = { ...userCatalog };
    next[key] = (Array.isArray(next[key]) ? next[key] : []).filter((x) => String(x?.id) !== idStr);
    upsertUserCatalog(next);
  }

  // ItemsSection が使う：独自アイテム作成（最小）
  function createUserItem({ name, price, fp: fpCost, memo }) {
    const entry = {
      id: uid("u_item"),
      name: String(name ?? "").trim(),
      price: price === "" || price == null ? null : Number(price),
      fp: fpCost === "" || fpCost == null ? null : Number(fpCost),
      memo: String(memo ?? "").trim(),
    };
    if (!entry.name) return null;
    if (entry.price != null && !Number.isFinite(entry.price)) entry.price = null;
    if (entry.fp != null && !Number.isFinite(entry.fp)) entry.fp = null;
    return addUserCatalogEntry("items", entry);
  }

  // ---- catalog (masters + userCatalog) ----
  const catalog = useMemo(() => {
    const w = (Array.isArray(WEAPONS_MASTER) ? WEAPONS_MASTER : []).map((x) => ({
      kind: "weapon",
      source: "master",
      ...x,
    }));
    const a2 = (Array.isArray(ARMORS_MASTER) ? ARMORS_MASTER : []).map((x) => ({
      kind: "armor",
      source: "master",
      ...x,
    }));
    const sh = (Array.isArray(SHIELDS_MASTER) ? SHIELDS_MASTER : []).map((x) => ({
      kind: "shield",
      source: "master",
      ...x,
    }));
    const it = (Array.isArray(ITEMS_MASTER) ? ITEMS_MASTER : []).map((x) => ({
      kind: "item",
      source: "master",
      ...x,
    }));

    const uw = userCatalog.weapons.map((x) => ({ kind: "weapon", source: "user", ...x }));
    const ua = userCatalog.armors.map((x) => ({ kind: "armor", source: "user", ...x }));
    const ush = userCatalog.shields.map((x) => ({ kind: "shield", source: "user", ...x }));
    const uit = userCatalog.items.map((x) => ({ kind: "item", source: "user", ...x }));
    const usk = userCatalog.skills.map((x) => ({ kind: "skill", source: "user", ...x }));
    const uhs = userCatalog.heroSkills.map((x) => ({ kind: "heroSkill", source: "user", ...x }));

    return [...w, ...a2, ...sh, ...it, ...uw, ...ua, ...ush, ...uit, ...usk, ...uhs];
  }, [userCatalog]);

  function normalizeInventory(inv) {
    if (!Array.isArray(inv)) return [];
    return inv
      .map((x) =>
        x && typeof x === "object" && "kind" in x && "id" in x
          ? {
              kind: String(x.kind),
              // masterは number、独自は string を許容
              id:
                typeof x.id === "number" && Number.isFinite(x.id)
                  ? x.id
                  : String(x.id),
              qty: Math.max(1, Number(x.qty ?? 1) || 1),
            }
          : null
      )
      .filter(Boolean);
  }

  const inventory = normalizeInventory(s?.equipment?.inventory);
  const moneyG = safeNum(s?.equipment?.moneyG, 0);
  const fp = safeNum(s?.equipment?.fp, 0);

  function defByKindId(kind, id) {
    const k = String(kind);
    if (id == null || String(id).trim() === "") return null;
    const idStr = String(id);
    return catalog.find((c) => c.kind === k && String(c.id) === idStr) ?? null;
  }

  // ---- inventory操作 ----
  function addToInventory(kind, id, qty = 1) {
    setField(["equipment", "inventory"], (prev) => {
      const cur = normalizeInventory(prev);
      const key = catalogKeyOf(kind, id);
      const idx = cur.findIndex((e) => catalogKeyOf(e.kind, e.id) === key);
      if (idx >= 0) {
        const next = cur.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [...cur, { kind, id, qty: Math.max(1, Number(qty) || 1) }];
    });
  }

  function removeFromInventory(kind, id) {
    setField(["equipment", "inventory"], (prev) => {
      const cur = normalizeInventory(prev);
      const key = catalogKeyOf(kind, id);
      return cur.filter((e) => catalogKeyOf(e.kind, e.id) !== key);
    });
  }

  // ---- skills master ----
  const masterSkills = Array.isArray(SKILLS_MASTER) ? SKILLS_MASTER : [];
  const masterById = useMemo(() => {
    const m = new Map();
    for (const sk of masterSkills) {
      const id = sk?.id ?? sk?.skillId;
      const n = Number(id);
      if (Number.isFinite(n)) m.set(n, sk);
    }
    return m;
  }, [masterSkills]);

  // ---- hero skills master ----
  const masterHeroSkills = Array.isArray(HERO_SKILLS_MASTER) ? HERO_SKILLS_MASTER : [];
  const heroMasterById = useMemo(() => {
    const m = new Map();
    for (const sk of masterHeroSkills) {
      const id = sk?.id ?? sk?.skillId;
      const n = Number(id);
      if (Number.isFinite(n)) m.set(n, sk);
    }
    return m;
  }, [masterHeroSkills]);

  const skillRows = s.skills?.rows ?? [];
  const intBonusTargets = Array.isArray(s.skills?.intBonusTargets) ? s.skills.intBonusTargets : [];
  const dexBonusTargets = Array.isArray(s.skills?.dexBonusTargets) ? s.skills.dexBonusTargets : [];

  const intBonusValue = Math.max(0, safeNum(mods.int, 0));
  const dexBonusValue = Math.max(0, safeNum(mods.dex, 0));

  const heroSkillRows = s.heroSkills?.rows ?? [];
  function heroRowLabel(row) {
    if (!row) return "—";
    if (row.kind === "master") {
      const sk = heroMasterById.get(Number(row.id));
      // hero skill master は {id, name} 想定
      return String(sk?.name ?? "").trim() || "—";
    }
    if (row.kind === "custom") return String(row.name ?? "").trim() || "—";
    return "—";
  }

  function rowLabel(row) {
    if (!row) return "—";
    if (row.kind === "master") {
      const sk = masterById.get(Number(row.id));
      return sk ? skillLabelFromMaster(sk) : "—";
    }
    if (row.kind === "custom") return String(row.name ?? "").trim() || "—";
    return "—";
  }

  function rowEffectiveLevel(index) {
    const r = skillRows?.[index];
    if (!r) return 0;
    const baseLv = safeNum(r.level, 0);
    let bonus = 0;
    if (isCreate && intBonusValue > 0 && intBonusTargets.includes(index)) bonus += intBonusValue;
    if (isCreate && dexBonusValue > 0 && dexBonusTargets.includes(index)) bonus += dexBonusValue;
    return baseLv + bonus;
  }

  const skillLevelByName = useMemo(() => {
    const map = new Map();
    const rows = Array.isArray(skillRows) ? skillRows : [];

    function update(name, level) {
      const nm = String(name ?? "").trim();
      if (!nm) return;
      const lv = Number(level);
      const v = Number.isFinite(lv) ? lv : 0;
      map.set(nm, Math.max(map.get(nm) ?? 0, v));
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const eff = rowEffectiveLevel(i);
      if (r?.kind === "master") {
        const id = Number(r?.id);
        if (Number.isFinite(id)) {
          const sk = masterById.get(id);
          update(skillLabelFromMaster(sk), eff);
        }
      } else if (r?.kind === "custom") {
        update(String(r?.name ?? "").trim(), eff);
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillRows, masterById, intBonusTargets, dexBonusTargets, intBonusValue, dexBonusValue, isCreate]);

  function getSkillLevel(name) {
    const nm = String(name ?? "").trim();
    if (!nm) return 0;
    return skillLevelByName.get(nm) ?? 0;
  }

  function requirementPenalty(req) {
    const r = normalizeRequirement(req);
    if (r.length === 0) return { met: true, penalty: 0, name: "", min: 0, lv: 0 };
    const [name, min] = r;
    const lv = getSkillLevel(name);
    const met = lv >= Number(min);
    return { met, penalty: met ? 0 : -20, name, min: Number(min), lv };
  }

  // ---- 回避/武器命中など（必要分だけここに集約） ----
  const eq = s?.equipment?.equipped ?? {};
  const wR = defByKindId("weapon", eq.weaponRightId);
  const wL = defByKindId("weapon", eq.weaponLeftId);
  const ar = defByKindId("armor", eq.armorId);
  const sh = defByKindId("shield", eq.shieldId);

  const meleeMod = safeNum(mods.str) + safeNum(mods.agi);
  const rangedMod = safeNum(mods.dex) + safeNum(mods.int);

  const armorEvadeMod = safeNum(ar?.evadeMod, 0);
  const shieldEvadeMod = safeNum(sh?.evadeMod, 0);
  const shieldEvadeSkillBonus = parseEvadeSkillBonusFromText(sh?.memo);

  const shieldReq = requirementPenalty(sh?.requirement);
  const shieldRequirementPenalty = shieldReq.penalty;

  const evadeSkillValue = useMemo(() => {
    const rows = Array.isArray(skillRows) ? skillRows : [];
    let best = null;
    for (const r of rows) {
      const lv = Number(r?.level);
      const level = Number.isFinite(lv) ? lv : null;
      if (r?.kind === "master") {
        const id = Number(r?.id);
        if (Number.isFinite(id) && id === SKILL_ID_EVADE && level != null) {
          best = best == null ? level : Math.max(best, level);
        }
      } else if (r?.kind === "custom") {
        const nm = String(r?.name ?? "").trim();
        if (nm === "回避" && level != null) best = best == null ? level : Math.max(best, level);
      }
    }
    return best ?? 0;
  }, [skillRows]);

  const evadeRawBase = safeNum(mods.agi) + safeNum(evadeSkillValue) + safeNum(shieldEvadeSkillBonus);
  const evadeMod10Base = Math.floor(evadeRawBase / 10) * 10;
  const evadeMod10 = evadeMod10Base + armorEvadeMod + shieldEvadeMod + shieldRequirementPenalty;

  const equippedWeapons = useMemo(() => {
    if (eq.weaponTwoHanded) return wR ? [{ slot: "両手", w: wR }] : [];
    const list = [];
    if (wR) list.push({ slot: "右手", w: wR });
    if (wL) list.push({ slot: "左手", w: wL });
    return list;
  }, [eq.weaponTwoHanded, wR, wL]);

  const weaponHitRows = useMemo(() => {
    return equippedWeapons.map(({ slot, w }) => {
      const baseHit = safeNum(w?.baseHit, 0);
      const isMelee = (w?.range ?? "") === "白";
      const combatMod = isMelee ? meleeMod : rangedMod;

      const weaponSkillName = String(w?.skill ?? "").trim();
      const weaponSkillLevel = weaponSkillName ? getSkillLevel(weaponSkillName) : 0;

      const req = requirementPenalty(w?.requirement);
      const finalHit = baseHit + combatMod + weaponSkillLevel + req.penalty;

      return { slot, w, baseHit, combatMod, weaponSkillName, weaponSkillLevel, req, finalHit };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equippedWeapons, meleeMod, rangedMod, skillLevelByName]);

  // ---- unlock（フリーアイテム） ----
  function extractUnlockFromSkillMaster(skill) {
    const unlock = skill?.unlock ?? skill?.unlocks ?? skill?.freeUnlock ?? skill?.free ?? null;
    if (!unlock) return [];
    const rows = [];

    if (Array.isArray(unlock)) {
      for (const entry of unlock) {
        if (entry && typeof entry === "object") {
          const th = normalizeThresholdKey(entry.threshold ?? entry.value ?? entry.level ?? entry.req ?? entry.at);
          const list = entry.items ?? entry.rewards ?? entry.reward ?? entry.obtain ?? entry.gain ?? entry.list;
          if (!Number.isFinite(th) || th == null) continue;
          const rewardsRaw = Array.isArray(list) ? list : list != null ? [list] : [];
          const rewards = rewardsRaw.map((x) => resolveCatalogRef(x, catalog)).filter(Boolean);
          if (rewards.length > 0) rows.push({ threshold: th, rewards });
        }
      }
      return rows;
    }

    if (typeof unlock === "object") {
      for (const [k, v] of Object.entries(unlock)) {
        const th = normalizeThresholdKey(k);
        if (!Number.isFinite(th) || th == null) continue;
        const rewardsRaw = Array.isArray(v) ? v : v != null ? [v] : [];
        const rewards = rewardsRaw.map((x) => resolveCatalogRef(x, catalog)).filter(Boolean);
        if (rewards.length > 0) rows.push({ threshold: th, rewards });
      }
      return rows;
    }

    return [];
  }

  function unlockRowsBySkillName(skillName) {
    const nm = String(skillName ?? "").trim();
    if (!nm) return [];
    const hit =
      masterSkills.find((sk) => String(skillLabelFromMaster(sk)).trim() === nm) ??
      masterSkills.find((sk) => String(sk?.name ?? sk?.label ?? sk?.skillName ?? "").trim() === nm) ??
      null;
    if (!hit) return [];
    return extractUnlockFromSkillMaster(hit).slice().sort((p, q) => p.threshold - q.threshold);
  }

  const createUnlockTargets = useMemo(() => {
    if (!isCreate) return [];
    const rows = Array.isArray(skillRows) ? skillRows : [];
    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const label = rowLabel(rows[i]);
      if (!label || label === "—") continue;
      const unlockRows = unlockRowsBySkillName(label);
      if (!unlockRows || unlockRows.length === 0) continue;
      const lv = rowEffectiveLevel(i);
      out.push({ label, level: lv, unlockRows });
    }
    const map = new Map();
    for (const x of out) {
      const prev = map.get(x.label);
      if (!prev || x.level > prev.level) map.set(x.label, x);
    }
    return [...map.values()].sort((p, q) => String(p.label).localeCompare(String(q.label), "ja"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreate, skillRows, intBonusTargets, dexBonusTargets, intBonusValue, dexBonusValue]);

  return {
    // flags
    editable,
    isCreate,
    itemsEditable,

    // base state references
    s,
    a,
    mods,
    hp,
    moneyG,
    fp,
    eq,

    // masters/catalog
    masterSkills,
    masterById,
    catalog,
    defByKindId,

    // skills helpers
    skillRows,
    rowLabel,
    rowEffectiveLevel,
    intBonusTargets,
    dexBonusTargets,
    intBonusValue,
    dexBonusValue,
    skillLevelByName,
    getSkillLevel,
    requirementPenalty,

    // hero skills (for HeroSkillsSection)
    masterHeroSkills,
    heroMasterById,
    heroSkillRows,
    heroRowLabel,

    // combat derived
    ar,
    sh,
    wR,
    wL,
    meleeMod,
    rangedMod,
    evadeRawBase,
    evadeMod10Base,
    evadeMod10,
    weaponHitRows,
    shieldReq,

    // inventory
    inventory,
    addToInventory,
    removeFromInventory,
    setField,

    // unlock/free item
    unlockRowsBySkillName,
    createUnlockTargets,

    // user catalog
    userCatalog,
    createUserItem,
    addUserCatalogEntry,
    removeUserCatalogEntry,

    // format helper re-export if you want
    fmtSigned,
  };
}
