// src/pages/sheets/catalogSheet/useCatalogSheetModel.js
import { useMemo } from "react";
import config from "/data/registry.json";
import { getMasters } from "/src/common/catalog.js";

// ------------
// helpers
// ------------
function toNumberOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeValueByType(v, type, { multiline = false } = {}) {
  switch (type) {
    case "number":
    case "int": {
      const n = toNumberOrNull(v);
      if (n == null) return null;
      return type === "int" ? Math.trunc(n) : n;
    }
    case "boolean":
      return !!v;
    case "string":
      return v == null ? "" : String(v);
    case "string[]": {
      if (Array.isArray(v)) return v.map((x) => String(x));
      const s = String(v ?? "");
      if (!s.trim()) return [];
      // textarea入力を想定：改行優先、なければカンマ
      const parts = s.includes("\n") ? s.split("\n") : s.split(",");
      return parts.map((x) => x.trim()).filter(Boolean);
    }
    default:
      // object系：JSON文字列なら parse、objectならそのまま
      if (v && typeof v === "object") return v;
      if (typeof v === "string") {
        const s = v.trim();
        if (!s) return {};
        try {
          const obj = JSON.parse(s);
          return obj && typeof obj === "object" ? obj : {};
        } catch {
          return { __raw: s }; // 壊れたJSONを落とさないための退避
        }
      }
      return {};
  }
}

function normalizeRow(row, catDef) {
  const src = row && typeof row === "object" ? row : {};
  const out = {};

  for (const f of catDef.fields ?? []) {
    const key = String(f.key);
    const has = Object.prototype.hasOwnProperty.call(src, key);
    const raw = has ? src[key] : undefined;

    if (!has) {
      if (f.required) return null;
      out[key] = f.default ?? null;
      continue;
    }

    const norm = normalizeValueByType(raw, f.type);

    // required の最低限チェック（id/name想定）
    if (f.required) {
      if (f.type === "number" || f.type === "int") {
        if (norm == null) return null;
      }
      if (f.type === "string") {
        if (!String(norm ?? "").trim()) return null;
      }
    }
    out[key] = norm;
  }

  return out;
}

function ensureUserCatalogShape(uc) {
  const o = uc && typeof uc === "object" ? uc : {};
  const data0 = o.data && typeof o.data === "object" ? o.data : {};
  const out = { version: 1, data: {} };

  const cats = config?.categories ?? {};
  for (const k of Object.keys(cats)) {
    out.data[k] = Array.isArray(data0[k]) ? data0[k] : [];
  }
  return out;
}

function buildNewId({ catKey, catDef, mastersList, userList }) {
  const idField = String(catDef.idField || "id");

  let maxId = 0;
  for (const r of mastersList) {
    const n = toNumberOrNull(r?.[idField]);
    if (n != null) maxId = Math.max(maxId, n);
  }
  for (const r of userList) {
    const n = toNumberOrNull(r?.[idField]);
    if (n != null) maxId = Math.max(maxId, n);
  }
  return maxId + 1;
}

function trimName(v) {
  return String(v ?? "").trim();
}

function validateNoDup({ catDef, mastersList, userList, draftRow, selfIndex = null }) {
  const idField = String(catDef.idField || "id");
  const nameField = String(catDef.nameField || "name");

  const id = toNumberOrNull(draftRow?.[idField]);
  const name = trimName(draftRow?.[nameField]);

  if (id == null) return { ok: false, message: `${idField} が不正です` };
  if (!name) return { ok: false, message: `${nameField} が空です` };

  // master との衝突
  for (const m of mastersList) {
    const mid = toNumberOrNull(m?.[idField]);
    const mname = trimName(m?.[nameField]);
    if (mid != null && mid === id) return { ok: false, message: `master と ${idField} が重複しています（${id}）` };
    if (mname && mname === name) return { ok: false, message: `master と ${nameField} が重複しています（${name}）` };
  }

  // user 内衝突（自分自身は除外）
  for (let i = 0; i < userList.length; i++) {
    if (selfIndex != null && i === selfIndex) continue;
    const u = userList[i];
    const uid = toNumberOrNull(u?.[idField]);
    const uname = trimName(u?.[nameField]);
    if (uid != null && uid === id) return { ok: false, message: `独自データ内で ${idField} が重複しています（${id}）` };
    if (uname && uname === name) return { ok: false, message: `独自データ内で ${nameField} が重複しています（${name}）` };
  }

  return { ok: true, message: "" };
}

// ------------
// main hook
// ------------
export function useCatalogSheetModel({ state, setState }) {
  const categories = useMemo(() => {
    const cats = config?.categories ?? {};
    return Object.keys(cats).map((k) => ({ key: k, def: cats[k] }));
  }, []);

  const userCatalog = useMemo(() => ensureUserCatalogShape(state?.userCatalog), [state?.userCatalog]);

  function setUserCatalog(updater) {
    if (!setState) return;
    setState((prev) => {
      const next = structuredClone(prev);
      const cur = ensureUserCatalogShape(next.userCatalog);
      const updated = typeof updater === "function" ? updater(cur) : updater;
      next.userCatalog = ensureUserCatalogShape(updated);
      return next;
    });
  }

  function listUserRows(catKey) {
    return Array.isArray(userCatalog?.data?.[catKey]) ? userCatalog.data[catKey] : [];
  }

  function listMasterRows(catKey) {
    try {
      return getMasters(catKey)?.list ?? [];
    } catch {
      return [];
    }
  }

  function addRow(catKey) {
    const catDef = config?.categories?.[catKey];
    if (!catDef) return { ok: false, message: "未知カテゴリです" };

    const mastersList = listMasterRows(catKey);
    const userList = listUserRows(catKey);

    const idField = String(catDef.idField || "id");
    const nameField = String(catDef.nameField || "name");

    const nextId = buildNewId({ catKey, catDef, mastersList, userList });

    // fields 定義に沿って初期行を作る
    const base = {};
    for (const f of catDef.fields ?? []) {
      base[f.key] = f.default ?? null;
    }
    base[idField] = nextId;
    base[nameField] = "";

    setUserCatalog((uc) => {
      const next = structuredClone(uc);
      next.data[catKey] = [base, ...(next.data[catKey] ?? [])];
      return next;
    });

    return { ok: true, message: "" };
  }

  function updateRow(catKey, index, patch) {
    const catDef = config?.categories?.[catKey];
    if (!catDef) return { ok: false, message: "未知カテゴリです" };

    const mastersList = listMasterRows(catKey);
    const userList = listUserRows(catKey);

    const srcRow = userList[index];
    if (!srcRow) return { ok: false, message: "行がありません" };

    const merged = { ...(srcRow ?? {}), ...(patch ?? {}) };
    const normalized = normalizeRow(merged, catDef);
    if (!normalized) return { ok: false, message: "必須項目が不足しています" };

    // id/name を明示整形
    const idField = String(catDef.idField || "id");
    const nameField = String(catDef.nameField || "name");
    normalized[idField] = toNumberOrNull(normalized[idField]);
    normalized[nameField] = trimName(normalized[nameField]);

    const v = validateNoDup({ catDef, mastersList, userList, draftRow: normalized, selfIndex: index });
    if (!v.ok) return v;

    setUserCatalog((uc) => {
      const next = structuredClone(uc);
      const arr = Array.isArray(next.data[catKey]) ? next.data[catKey].slice() : [];
      arr[index] = normalized;
      next.data[catKey] = arr;
      return next;
    });

    return { ok: true, message: "" };
  }

  function removeRow(catKey, index) {
    setUserCatalog((uc) => {
      const next = structuredClone(uc);
      const arr = Array.isArray(next.data[catKey]) ? next.data[catKey].slice() : [];
      next.data[catKey] = arr.filter((_, i) => i !== index);
      return next;
    });
  }

  return {
    categories,
    userCatalog,

    listUserRows,
    listMasterRows,

    addRow,
    updateRow,
    removeRow,
  };
}
