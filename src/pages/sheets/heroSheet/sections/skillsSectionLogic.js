// src/pages/sheets/heroSheet/sections/skillsSectionLogic.js
import { useEffect, useMemo, useRef, useCallback } from "react";
import { safeNum } from "/src/common/utils/number.js";

export const CREATE_SKILL_COUNT = 8;
export const CREATE_BASE_LEVELS = [5, 10, 15, 20];
export const CREATE_BASE_SUM_LIMIT = 80;

function normalizeIndex(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeTargets(indices, { skillRows, rowLabel }) {
  const set = new Set();
  for (const x of indices) {
    const n = normalizeIndex(x);
    if (n == null) continue;
    if (!skillRows?.[n]) continue;
    const label = rowLabel(skillRows[n]);
    if (!label || label === "—") continue;
    set.add(n);
    if (set.size >= 2) break;
  }
  return Array.from(set);
}

function skillKeyOfRow(row) {
  if (!row) return "";
  if (row.kind === "master") {
    const id = row.id ?? null;
    return id == null ? "" : `m:${String(id)}`;
  }
  // custom
  const name = String(row.name ?? "").trim().toLowerCase();
  return name ? `c:${name}` : "";
}

function ensureCreateRows(rowsPrev) {
  const rows0 = Array.isArray(rowsPrev) ? rowsPrev : [];
  let rows = rows0.map((r) => {
    const base = Number(r?.baseLevel);
    const baseLevel = Number.isFinite(base)
      ? base
      : CREATE_BASE_LEVELS.includes(Number(r?.level))
      ? Number(r?.level)
      : 10;
    return { ...(r ?? {}), baseLevel };
  });

  if (rows.length < CREATE_SKILL_COUNT) {
    const addN = CREATE_SKILL_COUNT - rows.length;
    rows = [
      ...rows,
      ...Array.from({ length: addN }, () => ({
        kind: "master",
        id: null,
        level: 10,
        baseLevel: 10,
      })),
    ];
  } else if (rows.length > CREATE_SKILL_COUNT) {
    rows = rows.slice(0, CREATE_SKILL_COUNT);
  }

  const same =
    rows0.length === rows.length &&
    rows0.every((r, i) => {
      const a = r ?? {};
      const b = rows[i] ?? {};
      return (
        a.kind === b.kind &&
        (a.id ?? null) === (b.id ?? null) &&
        String(a.name ?? "") === String(b.name ?? "") &&
        Number(a.level ?? 0) === Number(b.level ?? 0) &&
        Number(a.baseLevel ?? 0) === Number(b.baseLevel ?? 0)
      );
    });

  return same ? rowsPrev : rows;
}

/**
 * SkillsSection 専用ロジック
 * - UI側は、この hook が返す値だけ見ればよい
 */
export function useSkillsSectionLogic(model) {
  const {
    editable,
    isCreate,
    masterSkills,
    skillRows,
    rowLabel,
    intBonusValue,
    dexBonusValue,
    setField,
    createUnlockTargets,
    addToInventory,
    removeFromInventory,
    s,
  } = model;

  const freeItemPicks = s.skills?.freeItemPicks ?? {};
  const freeItemClaims = s.skills?.freeItemClaims ?? {};

  const bonusDraft = s.skills?.bonusDraft ?? { int: [], dex: [] };
  const bonusConfirmed = !!s.skills?.bonusConfirmed;

  const canUseIntBonus = safeNum(intBonusValue, 0) > 0;
  const canUseDexBonus = safeNum(dexBonusValue, 0) > 0;

  // create初期化は最初の1回だけ
  const didInitCreateRef = useRef(false);
  useEffect(() => {
    if (!isCreate) {
      didInitCreateRef.current = false;
      return;
    }
    if (didInitCreateRef.current) return;
    didInitCreateRef.current = true;

    setField(["skills", "rows"], (rowsPrev) => ensureCreateRows(rowsPrev));

    setField(["skills", "bonusDraft"], (prev) => {
      if (prev && typeof prev === "object" && (Array.isArray(prev.int) || Array.isArray(prev.dex))) return prev;
      return { int: [], dex: [] };
    });
  }, [isCreate, setField]);

  const displayRows = useMemo(() => {
    const rows = Array.isArray(skillRows) ? skillRows : [];
    if (!isCreate) return rows;
    return rows.slice(0, CREATE_SKILL_COUNT);
  }, [skillRows, isCreate]);

  const takenSkillKeys = useMemo(() => {
    const set = new Set();
    for (const r of displayRows) {
      const key = skillKeyOfRow(r);
      if (key) set.add(key);
    }
    return set;
  }, [displayRows]);

  const duplicateCustomNames = useMemo(() => {
    const counts = new Map();
    for (const r of displayRows) {
      if (r?.kind !== "custom") continue;
      const key = skillKeyOfRow(r);
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const dups = new Set();
    for (const [k, c] of counts.entries()) if (c >= 2) dups.add(k);
    return dups;
  }, [displayRows]);

  const baseSum = useMemo(() => {
    if (!isCreate) return 0;
    return displayRows.reduce((acc, r) => acc + safeNum(r?.baseLevel, 0), 0);
  }, [displayRows, isCreate]);

  const baseSumOk = !isCreate || baseSum <= CREATE_BASE_SUM_LIMIT;

  // non-create: rows操作
  const updateSkillRow = useCallback(
    (index, patch) => {
      setField(["skills", "rows"], (rowsPrev) => {
        const rows = Array.isArray(rowsPrev) ? rowsPrev : [];
        return rows.map((r, i) => (i === index ? { ...(r ?? {}), ...patch } : r));
      });
    },
    [setField]
  );

  const addMasterSkillRow = useCallback(() => {
    if (isCreate) return;
    setField(["skills", "rows"], (rowsPrev) => {
      const rows = Array.isArray(rowsPrev) ? rowsPrev : [];
      return [...rows, { kind: "master", id: null, level: 10 }];
    });
  }, [isCreate, setField]);

  const addCustomSkillRow = useCallback(() => {
    if (isCreate) return;
    setField(["skills", "rows"], (rowsPrev) => {
      const rows = Array.isArray(rowsPrev) ? rowsPrev : [];
      return [...rows, { kind: "custom", name: "", level: 10 }];
    });
  }, [isCreate, setField]);

  const removeSkillRow = useCallback(
    (index) => {
      if (isCreate) return;
      setField(["skills", "rows"], (rowsPrev) => {
        const rows = Array.isArray(rowsPrev) ? rowsPrev : [];
        return rows.filter((_, i) => i !== index);
      });
      setField(["skills", "intBonusTargets"], (prev) => (Array.isArray(prev) ? prev.filter((x) => x !== index) : []));
      setField(["skills", "dexBonusTargets"], (prev) => (Array.isArray(prev) ? prev.filter((x) => x !== index) : []));
    },
    [isCreate, setField]
  );

  // create: ボーナス対象として選べる行
  const selectableSkillRows = useMemo(() => {
    const rows = Array.isArray(skillRows) ? skillRows : [];
    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const label = rowLabel(rows[i]);
      if (!label || label === "—") continue;
      out.push({ index: i, label });
    }
    return out;
  }, [skillRows, rowLabel]);

  const setDraftTargets = useCallback(
    (type, indices) => {
      const next = normalizeTargets(indices, { skillRows, rowLabel });
      setField(["skills", "bonusDraft"], (prev) => {
        const p = prev && typeof prev === "object" ? { ...prev } : { int: [], dex: [] };
        p[type] = next;
        return p;
      });
    },
    [setField, skillRows, rowLabel]
  );

  const confirmBonus = useCallback(() => {
    if (!isCreate) return;
    if (!baseSumOk) return;

    setField(["skills"], (prevSkills) => {
      const p = prevSkills ?? {};
      const rowsPrev = Array.isArray(p.rows) ? p.rows : [];

      const draftInt = Array.isArray(p.bonusDraft?.int) ? p.bonusDraft.int : [];
      const draftDex = Array.isArray(p.bonusDraft?.dex) ? p.bonusDraft.dex : [];

      const intSet = new Set(draftInt.map(Number));
      const dexSet = new Set(draftDex.map(Number));

      const addInt = safeNum(intBonusValue, 0);
      const addDex = safeNum(dexBonusValue, 0);

      const rows = rowsPrev.map((r, i) => {
        const base = Number.isFinite(Number(r?.baseLevel))
          ? Number(r.baseLevel)
          : CREATE_BASE_LEVELS.includes(Number(r?.level))
          ? Number(r.level)
          : 10;

        let lv = base;
        if (intSet.has(i) && addInt > 0) lv += addInt;
        if (dexSet.has(i) && addDex > 0) lv += addDex;

        return { ...(r ?? {}), baseLevel: base, level: lv };
      });

      return {
        ...p,
        rows,
        intBonusTargets: Array.from(intSet),
        dexBonusTargets: Array.from(dexSet),
        bonusConfirmed: true,
      };
    });
  }, [isCreate, baseSumOk, setField, intBonusValue, dexBonusValue]);

  const editBonus = useCallback(() => {
    if (!isCreate) return;

    setField(["skills"], (prevSkills) => {
      const p = prevSkills ?? {};
      const rowsPrev = Array.isArray(p.rows) ? p.rows : [];

      const rows = rowsPrev.map((r) => {
        const base = Number.isFinite(Number(r?.baseLevel))
          ? Number(r.baseLevel)
          : CREATE_BASE_LEVELS.includes(Number(r?.level))
          ? Number(r.level)
          : 10;
        return { ...(r ?? {}), baseLevel: base, level: base };
      });

      return {
        ...p,
        rows,
        bonusConfirmed: false,
        intBonusTargets: [],
        dexBonusTargets: [],
      };
    });
  }, [isCreate, setField]);

  const cancelConfirmedIfRowAffected = useCallback(
    (index) => {
      if (!isCreate) return;
      if (!bonusConfirmed) return;

      setField(["skills"], (prevSkills) => {
        const p = prevSkills ?? {};
        const intT = Array.isArray(p.intBonusTargets) ? p.intBonusTargets : [];
        const dexT = Array.isArray(p.dexBonusTargets) ? p.dexBonusTargets : [];
        const hit = intT.includes(index) || dexT.includes(index);
        if (!hit) return p;

        const rowsPrev = Array.isArray(p.rows) ? p.rows : [];
        const rows = rowsPrev.map((r, i) => {
          if (i !== index) return r;
          const base = Number.isFinite(Number(r?.baseLevel))
            ? Number(r.baseLevel)
            : CREATE_BASE_LEVELS.includes(Number(r?.level))
            ? Number(r.level)
            : 10;
          return { ...(r ?? {}), baseLevel: base, level: base };
        });

        const d = p.bonusDraft && typeof p.bonusDraft === "object" ? p.bonusDraft : { int: [], dex: [] };
        const nextDraft = {
          int: (Array.isArray(d.int) ? d.int : []).filter((x) => Number(x) !== index),
          dex: (Array.isArray(d.dex) ? d.dex : []).filter((x) => Number(x) !== index),
        };

        return {
          ...p,
          rows,
          bonusConfirmed: false,
          intBonusTargets: [],
          dexBonusTargets: [],
          bonusDraft: nextDraft,
        };
      });
    },
    [isCreate, bonusConfirmed, setField]
  );

  const setBaseLevelAt = useCallback(
    (index, nextBaseLevel) => {
      setField(["skills"], (prevSkills) => {
        const p = prevSkills ?? {};
        const rowsPrev = Array.isArray(p.rows) ? p.rows : [];

        const baseSumNow = rowsPrev.slice(0, CREATE_SKILL_COUNT).reduce((acc, r, i) => {
          const base = Number.isFinite(Number(r?.baseLevel))
            ? Number(r.baseLevel)
            : CREATE_BASE_LEVELS.includes(Number(r?.level))
            ? Number(r.level)
            : 10;
          return acc + (i === index ? safeNum(nextBaseLevel, 0) : safeNum(base, 0));
        }, 0);

        if (baseSumNow > CREATE_BASE_SUM_LIMIT) return p;

        const rows = rowsPrev.map((r, i) => {
          if (i !== index) return r;

          const base = nextBaseLevel;

          if (!isCreate || !p.bonusConfirmed) return { ...(r ?? {}), baseLevel: base };

          const intSet = new Set((p.intBonusTargets ?? []).map(Number));
          const dexSet = new Set((p.dexBonusTargets ?? []).map(Number));
          const addInt = safeNum(intBonusValue, 0);
          const addDex = safeNum(dexBonusValue, 0);

          let lv = base;
          if (intSet.has(i) && addInt > 0) lv += addInt;
          if (dexSet.has(i) && addDex > 0) lv += addDex;

          return { ...(r ?? {}), baseLevel: base, level: lv };
        });

        return { ...p, rows };
      });
    },
    [setField, isCreate, intBonusValue, dexBonusValue]
  );

  // フリーアイテム（pick/claim）
  const setFreePick = useCallback(
    (skillName, catalogKey) => {
      setField(["skills", "freeItemPicks"], (prev) => {
        const obj = prev && typeof prev === "object" ? { ...prev } : {};
        obj[skillName] = catalogKey;
        return obj;
      });
    },
    [setField]
  );

  const markClaimed = useCallback(
    (skillName, catalogKey) => {
      setField(["skills", "freeItemClaims"], (prev) => {
        const obj = prev && typeof prev === "object" ? { ...prev } : {};
        obj[skillName] = catalogKey;
        return obj;
      });
    },
    [setField]
  );

  const unmarkClaimed = useCallback(
    (skillName) => {
      setField(["skills", "freeItemClaims"], (prev) => {
        const obj = prev && typeof prev === "object" ? { ...prev } : {};
        if (Object.prototype.hasOwnProperty.call(obj, skillName)) delete obj[skillName];
        return obj;
      });
    },
    [setField]
  );

  const claimFreeItem = useCallback(
    (skillName) => {
      const sn = String(skillName ?? "").trim();
      if (!sn) return;

      const claimedKey = freeItemClaims?.[sn];
      if (claimedKey) return;

      const key = freeItemPicks?.[sn];
      if (!key) return;

      const [kind, idStr] = String(key).split(":");
      const id = Number(idStr);
      if (!kind || !Number.isFinite(id)) return;

      addToInventory(kind, id, 1);
      markClaimed(sn, key);
    },
    [freeItemClaims, freeItemPicks, addToInventory, markClaimed]
  );

  const cancelClaimFreeItem = useCallback(
    (skillName) => {
      const sn = String(skillName ?? "").trim();
      if (!sn) return;

      const claimedKey = freeItemClaims?.[sn];
      if (!claimedKey) return;

      const [kind, idStr] = String(claimedKey).split(":");
      const id = Number(idStr);
      if (!kind || !Number.isFinite(id)) return;

      removeFromInventory(kind, id);
      unmarkClaimed(sn);
    },
    [freeItemClaims, removeFromInventory, unmarkClaimed]
  );

  const draftInt = Array.isArray(bonusDraft?.int) ? bonusDraft.int : [];
  const draftDex = Array.isArray(bonusDraft?.dex) ? bonusDraft.dex : [];

  const canConfirm =
    isCreate &&
    baseSumOk &&
    !duplicateCustomNames.size &&
    ((canUseIntBonus && draftInt.length > 0) || (canUseDexBonus && draftDex.length > 0));

  return {
    // constants (UIで使う)
    CREATE_SKILL_COUNT,
    CREATE_BASE_LEVELS,
    CREATE_BASE_SUM_LIMIT,

    // state-like
    freeItemPicks,
    freeItemClaims,
    bonusDraft,
    bonusConfirmed,

    // derived
    displayRows,
    takenSkillKeys,
    duplicateCustomNames,
    baseSum,
    baseSumOk,
    selectableSkillRows,
    draftInt,
    draftDex,
    canUseIntBonus,
    canUseDexBonus,
    canConfirm,

    // handlers
    updateSkillRow,
    addMasterSkillRow,
    addCustomSkillRow,
    removeSkillRow,
    setBaseLevelAt,
    setDraftTargets,
    confirmBonus,
    editBonus,
    cancelConfirmedIfRowAffected,

    // free item handlers
    setFreePick,
    claimFreeItem,
    cancelClaimFreeItem,

    // helper for unlock UI label text
    createUnlockTargets,
    masterSkills,
    rowLabel,
    editable,
    isCreate,
  };
}
