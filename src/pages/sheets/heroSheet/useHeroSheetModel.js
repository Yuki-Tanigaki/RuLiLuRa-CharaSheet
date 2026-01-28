// src/pages/sheets/heroSheet/useHeroSheetModel.js
import { useMemo } from "react";
import { useCatalog } from "@/context/CatalogProvider.jsx";

/**
 * 最小の数値化（null/""/NaN を 0 などに寄せる）
 */
function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 入れ子 state を安全に更新する小物
 * setField(["a","b","c"], nextOrUpdater)
 */
function useSetField(setState) {
  return (path, nextOrUpdater) => {
    if (!setState) return;

    setState((prev) => {
      const base = prev ?? {};
      const keys = Array.isArray(path) ? path : [path];

      // 現在値を取り出し
      let cur = base;
      for (const k of keys) {
        cur = cur?.[k];
      }

      const nextValue = typeof nextOrUpdater === "function" ? nextOrUpdater(cur) : nextOrUpdater;

      // イミュータブルに shallow copy で差し替え
      const root = Array.isArray(base) ? base.slice() : { ...base };
      let node = root;

      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const isLast = i === keys.length - 1;
        const prevChild = node?.[k];

        if (isLast) {
          node[k] = nextValue;
        } else {
          const nextChild =
            prevChild && typeof prevChild === "object"
              ? Array.isArray(prevChild)
                ? prevChild.slice()
                : { ...prevChild }
              : {};
          node[k] = nextChild;
          node = nextChild;
        }
      }

      return root;
    });
  };
}

/**
 * インベントリの最小正規化
 * 期待する形：[{ kind, id, qty }]
 */
function normalizeInventory(inv) {
  const arr = Array.isArray(inv) ? inv : [];
  const out = [];
  for (const e of arr) {
    const kind = String(e?.kind ?? "").trim();
    const id = e?.id;
    const qty = Math.max(0, Math.trunc(safeNum(e?.qty, 0)));
    if (!kind) continue;
    if (id == null || String(id).trim() === "") continue;
    if (qty <= 0) continue;
    out.push({ kind, id, qty });
  }
  return out;
}

function addQty(inv, kind, id, delta) {
  const cur = normalizeInventory(inv);
  const k = String(kind);
  const i = String(id);
  const d = Math.max(1, Math.trunc(safeNum(delta, 1)));

  const next = cur.slice();
  const idx = next.findIndex((e) => String(e.kind) === k && String(e.id) === i);
  if (idx >= 0) {
    next[idx] = { ...next[idx], qty: next[idx].qty + d };
  } else {
    next.push({ kind: k, id, qty: d });
  }
  return next;
}

function removeEntry(inv, kind, id) {
  const cur = normalizeInventory(inv);
  const k = String(kind);
  const i = String(id);
  return cur.filter((e) => !(String(e.kind) === k && String(e.id) === i));
}

/**
 * useHeroSheetModel（最小版）
 *
 * 目的：
 * - catalog は useCatalog() から読むだけ（master/user の合成は Provider 側で完了している前提）
 * - SheetHub/HeroSheet/各Sectionが必要とする“基本フィールド”だけ返す
 * - あとで combat/unlock/requirementPenalty 等を段階的に戻せるように、形を崩さない
 */
export function useHeroSheetModel({ state, mode = "view", setState }) {
  const s = state ?? {};
  const editable = mode === "edit" || mode === "create";
  const isCreate = mode === "create";

  const setField = useSetField(setState);

  // ✅ 合成済み catalog service
  const catalog = useCatalog();

  // -------------------------
  // (A) カテゴリ取得ヘルパ
  // -------------------------
  function getCategory(key) {
    try {
      return catalog.getCategory(key);
    } catch {
      return null;
    }
  }

  // 「装備」参照用（weapon/armor/shield/tool…）
  // ※あなたの service 側のカテゴリキーに合わせて必要ならここだけ直す
  function defByKindId(kind, id) {
    if (id == null || String(id).trim() === "") return null;

    // service が resolve を提供するならそれを最優先
    if (typeof catalog.resolve === "function") {
      return catalog.resolve(String(kind), { id }) ?? null;
    }

    // 無ければ category の byId / list から探す
    const cat = getCategory(String(kind));
    if (cat?.byId && typeof cat.byId.get === "function") {
      const hit = cat.byId.get(Number(id));
      if (hit) return hit;
    }
    const list = Array.isArray(cat?.list) ? cat.list : Array.isArray(cat?.rows) ? cat.rows : [];
    return list.find((x) => String(x?.id) === String(id)) ?? null;
  }

  // -------------------------
  // (B) スキル（一般/英雄）
  // -------------------------
  // ※カテゴリキーはあなたの新catalog設計に合わせる
  const skillsCat = getCategory("skills");
  const heroSkillsCat = getCategory("heroSkills");

  const masterSkills = useMemo(() => {
    const list = Array.isArray(skillsCat?.list)
      ? skillsCat.list
      : Array.isArray(skillsCat?.rows)
        ? skillsCat.rows
        : [];
    return list;
  }, [skillsCat]);

  const masterById = useMemo(() => {
    if (skillsCat?.byId && typeof skillsCat.byId.get === "function") return skillsCat.byId;
    const m = new Map();
    for (const sk of masterSkills) {
      const id = sk?.id;
      const n = Number(id);
      if (Number.isFinite(n)) m.set(n, sk);
    }
    return m;
  }, [skillsCat, masterSkills]);

  const masterHeroSkills = useMemo(() => {
    const list = Array.isArray(heroSkillsCat?.list)
      ? heroSkillsCat.list
      : Array.isArray(heroSkillsCat?.rows)
        ? heroSkillsCat.rows
        : [];
    return list;
  }, [heroSkillsCat]);

  const heroMasterById = useMemo(() => {
    if (heroSkillsCat?.byId && typeof heroSkillsCat.byId.get === "function") return heroSkillsCat.byId;
    const m = new Map();
    for (const sk of masterHeroSkills) {
      const id = sk?.id;
      const n = Number(id);
      if (Number.isFinite(n)) m.set(n, sk);
    }
    return m;
  }, [heroSkillsCat, masterHeroSkills]);

  // rows の形は旧仕様を踏襲（Sections 側が期待している前提）
  // 例: { kind: "master", id, level } / { kind: "custom", name, level }
  const skillRows = Array.isArray(s?.skills?.rows) ? s.skills.rows : [];
  const heroSkillRows = Array.isArray(s?.heroSkills?.rows) ? s.heroSkills.rows : [];

  function rowLabel(row) {
    if (!row) return "—";
    if (row.kind === "master") {
      const sk = masterById.get(Number(row.id));
      // 最小：name を優先（無ければ label 等）
      return String(sk?.name ?? sk?.label ?? "").trim() || "—";
    }
    if (row.kind === "custom") return String(row.name ?? "").trim() || "—";
    return "—";
  }

  function heroRowLabel(row) {
    if (!row) return "—";
    if (row.kind === "master") {
      const sk = heroMasterById.get(Number(row.id));
      return String(sk?.name ?? "").trim() || "—";
    }
    if (row.kind === "custom") return String(row.name ?? "").trim() || "—";
    return "—";
  }

  // 最小：effective level は「そのまま level」
  // （旧版の create時ボーナス等は後で戻す）
  function rowEffectiveLevel(index) {
    const r = skillRows?.[index];
    if (!r) return 0;
    return safeNum(r.level, 0);
  }

  // 後で戻しやすいように、空配列/0 で置いておく
  const intBonusTargets = Array.isArray(s?.skills?.intBonusTargets) ? s.skills.intBonusTargets : [];
  const dexBonusTargets = Array.isArray(s?.skills?.dexBonusTargets) ? s.skills.dexBonusTargets : [];
  const intBonusValue = 0;
  const dexBonusValue = 0;

  // いったん “名前→最大Lv” だけ作る（武器計算などを戻す時に便利）
  const skillLevelByName = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < skillRows.length; i++) {
      const r = skillRows[i];
      const name = rowLabel(r);
      if (!name || name === "—") continue;
      const lv = rowEffectiveLevel(i);
      map.set(name, Math.max(map.get(name) ?? 0, lv));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillRows, masterById]);

  function getSkillLevel(name) {
    const nm = String(name ?? "").trim();
    if (!nm) return 0;
    return skillLevelByName.get(nm) ?? 0;
  }

  // -------------------------
  // (C) 装備・所持品（最小）
  // -------------------------
  const eq = s?.equipment?.equipped ?? {};
  const inventory = useMemo(() => normalizeInventory(s?.equipment?.inventory), [s?.equipment?.inventory]);
  const moneyG = safeNum(s?.equipment?.moneyG, 0);
  const fp = safeNum(s?.equipment?.fp, 0);

  function addToInventory(kind, id, qty = 1) {
    setField(["equipment", "inventory"], (prev) => addQty(prev, kind, id, qty));
  }

  function removeFromInventory(kind, id) {
    setField(["equipment", "inventory"], (prev) => removeEntry(prev, kind, id));
  }

  // combat / derived は一旦 “空” として返す（Sections 側が参照しても落ちないように）
  const a = s?.abilities ?? {};
  const mods = {};
  const hp = { hpNormal: 0, hpWound: 0, mp: 0 };

  // よく参照されがちな装備定義だけ最小で返す
  const wR = defByKindId("weapon", eq.weaponRightId);
  const wL = defByKindId("weapon", eq.weaponLeftId);
  const ar = defByKindId("armor", eq.armorId);
  const sh = defByKindId("shield", eq.shieldId);

  return {
    // flags
    editable,
    isCreate,

    // base
    s,
    a,
    mods,
    hp,

    // catalog
    catalog,
    defByKindId,

    // skills
    masterSkills,
    masterById,
    skillRows,
    rowLabel,
    rowEffectiveLevel,
    intBonusTargets,
    dexBonusTargets,
    intBonusValue,
    dexBonusValue,
    skillLevelByName,
    getSkillLevel,

    // hero skills
    masterHeroSkills,
    heroMasterById,
    heroSkillRows,
    heroRowLabel,

    // equipment / inventory
    eq,
    inventory,
    moneyG,
    fp,
    addToInventory,
    removeFromInventory,

    // equipped defs (optional)
    wR,
    wL,
    ar,
    sh,

    // updater
    setField,
  };
}
