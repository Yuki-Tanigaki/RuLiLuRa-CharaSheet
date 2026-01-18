// src/pages/sheets/heroSheet/useHeroSheetModel.js
import { useEffect, useMemo, useState } from "react";

import { safeNum } from "/src/common/utils/number.js";
import { normalizeRequirement, normalizeThresholdKey, labelFromMaster } from "/src/common/normalize.js";
import { all as mastersAll } from "/src/common/catalog.js";
import { mergeCatalog } from "/src/common/catalogMerge.js";
import { normalizeInventory as normalizeInv, addQty } from "/src/common/inventory.js";
import { normalizeItemBonus, resolveBonusTargetByName } from "/src/common/itemBonus.js";

// hero 固有
import { calcHeroDerived } from "./derivatives.js";
import { parseEvadeSkillBonusFromText } from "./combat.js";

export function useHeroSheetModel({ state, mode, setState }) {
  const s = state;
  const editable = mode === "edit" || mode === "create";
  const isCreate = mode === "create";

  const setField = useSetField(setState);

  // ---- derived ----
  const d = useMemo(() => calcHeroDerived(s), [s]);
  const a = s?.abilities ?? {};
  const mods = d?.mods ?? {};
  const hp = d?.hp ?? { hpNormal: 0, hpWound: 0, mp: 0 };

  // =========================
  // userCatalog (shared; read-only)
  // =========================
  const [userCatalog, setUserCatalog] = useState(() => loadUserCatalog({ scope: "shared" }));

  // 別タブ更新: storage event
  // 同一タブ更新: 任意のカスタムイベント（Catalog側で dispatch して運用）
  useEffect(() => {
    function reload() {
      setUserCatalog(loadUserCatalog({ scope: "shared" }));
    }
    function onStorage() {
      reload();
    }
    function onCustom() {
      reload();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("rulilura:userCatalog-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("rulilura:userCatalog-updated", onCustom);
    };
  }, []);

  // ---- catalog (masters + userCatalog() ----
  const catalog = useMemo(() => {
    const mastersByKind = {
      weapon: mastersAll("weapon"),
      armor: mastersAll("armor"),
      shield: mastersAll("shield"),
      tool: mastersAll("tool"),
    };

    // userCatalog 側のキーが（weapons/armors...）なので、mergeCatalog 用に正規化
    const userByKind = {
      weapon: userCatalog?.weapons ?? [],
      armor: userCatalog?.armors ?? [],
      shield: userCatalog?.shields ?? [],
      tool: userCatalog?.tools ?? [],
    };

    return mergeCatalog({
      mastersByKind,
      userCatalog: userByKind,
      sort: true,
    });
  }, [userCatalog]);

  // =========================
  // catalog lookup helper
  // =========================
  function defByKindId(kind, id) {
    if (id == null || String(id).trim() === "") return null;
    return catalog.resolve(String(kind), { id }) ?? null; // source省略→ master優先で検索
  }

  // =========================
  // inventory / money / fp
  // =========================
  const inventory = useMemo(() => normalizeInv(s?.equipment?.inventory), [s?.equipment?.inventory]);
  const moneyG = safeNum(s?.equipment?.moneyG, 0);
  const fp = safeNum(s?.equipment?.fp, 0);

  function addToInventory(kind, id, qty = 1) {
    setField(["equipment", "inventory"], (prev) => addQty(prev, kind, id, qty));
  }

  function removeFromInventory(kind, id) {
    setField(["equipment", "inventory"], (prev) => {
      const cur = normalizeInv(prev);
      const key = `${String(kind)}:${String(id)}`;
      return cur.filter((e) => `${String(e.kind)}:${String(e.id)}` !== key);
    });
  }

  // =========================
  // masters: skills / heroSkills
  // =========================
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

  // =========================
  // skills rows / labels / effective lv
  // =========================
  const skillRows = s?.skills?.rows ?? [];
  const intBonusTargets = Array.isArray(s?.skills?.intBonusTargets) ? s.skills.intBonusTargets : [];
  const dexBonusTargets = Array.isArray(s?.skills?.dexBonusTargets) ? s.skills.dexBonusTargets : [];

  const intBonusValue = Math.max(0, safeNum(mods.int, 0));
  const dexBonusValue = Math.max(0, safeNum(mods.dex, 0));

  function rowLabel(row) {
    if (!row) return "—";
    if (row.kind === "master") {
      const sk = masterById.get(Number(row.id));
      return sk ? labelFromMaster(sk) : "—";
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
          update(labelFromMaster(sk), eff);
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

  // =========================
  // hero skills
  // =========================
  const heroSkillRows = s?.heroSkills?.rows ?? [];

  function heroRowLabel(row) {
    if (!row) return "—";
    if (row.kind === "master") {
      const sk = heroMasterById.get(Number(row.id));
      return String(sk?.name ?? "").trim() || "—";
    }
    if (row.kind === "custom") return String(row.name ?? "").trim() || "—";
    return "—";
  }

  // =========================
  // combat derived
  // =========================
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

  // 装備品の表示
  const equippedWeapons = useMemo(() => {
    const list = [];
    if (wR) list.push({ pos: "right", w: wR, id: eq.weaponRightId });
    if (wL) list.push({ pos: "left", w: wL, id: eq.weaponLeftId });
    return list;
  }, [wR, wL, eq.weaponRightId, eq.weaponLeftId]);

  const weaponHitRows = useMemo(() => {
    return equippedWeapons.map(({ pos, w }) => {
      const baseHit = safeNum(w?.baseHit, 0);
      const isMelee = (w?.range ?? "") === "白";
      const combatMod = isMelee ? meleeMod : rangedMod;

      const weaponSkillName = String(w?.skill ?? "").trim();
      const weaponSkillLevel = weaponSkillName ? getSkillLevel(weaponSkillName) : 0;

      const req = requirementPenalty(w?.requirement);
      const finalHit = baseHit + combatMod + weaponSkillLevel + req.penalty;

      const gripLabel = (w?.grip ?? "") === "両手" ? "両手" : "片手";

      return {
        grip: gripLabel,
        pos,
        w,
        baseHit,
        combatMod,
        weaponSkillName,
        weaponSkillLevel,
        req,
        finalHit,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equippedWeapons, meleeMod, rangedMod, skillLevelByName]);

  // =========================
  // unlock（create時の無料獲得）
  // =========================

  function skillDefByName(skillName) {
    const nm = String(skillName ?? "").trim();
    if (!nm) return null;

    // master（表示ラベル一致優先）
    const m =
      masterSkills.find((sk) => String(labelFromMaster(sk)).trim() === nm) ??
      masterSkills.find((sk) => String(sk?.name ?? sk?.label ?? sk?.skillName ?? "").trim() === nm) ??
      null;
    if (m) return { kind: "skill", source: "master", ...m };

    // user（shared catalog）
    const u = (userCatalog.skills ?? []).find((x) => String(x?.name ?? "").trim() === nm) ?? null;
    if (u) return { kind: "skill", source: "user", ...u };

    return null;
  }

  // ItemsSection から使うので関数として分離
  function unlockRowsBySkillName(skillName) {
    const def = skillDefByName(skillName);
    if (!def?.unlock) return [];

    const rows = normalizeItemBonus(def.unlock);
    const out = [];

    for (const r of rows) {
      const threshold = Number(r.at);
      if (!Number.isFinite(threshold)) continue;

      const rewards = (r.items ?? [])
        .map(({ name, qty }) => {
          const resolved = resolveBonusTargetByName(name, catalog);
          if (!resolved) return null;
          return { resolved, qty: Math.max(1, Math.trunc(Number(qty) || 1)) };
        })
        .filter(Boolean);

      if (rewards.length > 0) out.push({ threshold, rewards });
    }

    return out.slice().sort((p, q) => p.threshold - q.threshold);
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

    // 同名スキルは最大Lvのみ残す
    const map = new Map();
    for (const x of out) {
      const prev = map.get(x.label);
      if (!prev || x.level > prev.level) map.set(x.label, x);
    }

    return [...map.values()].sort((p, q) => String(p.label).localeCompare(String(q.label), "ja"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreate, skillRows, intBonusTargets, dexBonusTargets, intBonusValue, dexBonusValue, userCatalog, catalog]);

  return {
    // flags
    editable,
    isCreate,

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

    // hero skills
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

    // user catalog（read-only）
    userCatalog,
  };
}
