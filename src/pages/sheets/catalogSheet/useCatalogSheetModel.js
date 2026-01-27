// src/pages/sheets/catalogSheet/useCatalogSheetModel.js
import { useCallback, useMemo } from "react";
import { useCatalog } from "@/context/CatalogProvider.jsx";

export function useCatalogSheetModel({ userCatalog, setUserCatalog }) {
  const catalog = useCatalog();

  if (typeof setUserCatalog !== "function") {
    throw new Error("useCatalogSheetModel: setUserCatalog is required");
  }

  // categories は masterCatalogs から作る（registry.json は読まない）
  // createCatalogService に keys API が無いので、master 側に categoryOrder を持たせるのが理想。
  // ここでは userCatalog のキー + よく使うキーの union を避け、確実に master を列挙できる仕組みが必要。
  // => 仕様に忠実にするため「catalog.listCategoryKeys()」が必要。
  // ただし今は無いので、最低限: masterCatalogs 側に __categoryKeys を入れておく前提で読む。
  const categories = useMemo(() => {
    const keys = catalog.listCategoryKeys?.() ?? [];
    return keys.map((key) => ({ key, def: catalog.getCategory(key) }));
  }, [catalog]);

  function getUserListForKey(categoryKey) {
    const raw = userCatalog?.[categoryKey];
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && Array.isArray(raw.list)) return raw.list;
    return [];
  }

  function setUserListForKey(categoryKey, nextList) {
    setUserCatalog((prev) => {
      const base = prev && typeof prev === "object" ? prev : {};
      return { ...base, [categoryKey]: nextList };
    });
  }

  function asTrimmedString(v) {
    if (v == null) return "";
    return String(v).trim();
  }
  function uniqStrings(xs) {
    const out = [];
    const set = new Set();
    for (const x of xs) {
      const s = asTrimmedString(x);
      if (!s) continue;
      if (set.has(s)) continue;
      set.add(s);
      out.push(s);
    }
    return out;
  }

  function normalizeValueByType(type, raw) {
    const t = String(type ?? "string");
    if (t === "boolean") return !!raw;
    if (t === "number" || t === "int") {
      if (raw === "" || raw == null) return null;
      const n = Number(raw);
      if (!Number.isFinite(n)) return null;
      return t === "int" ? Math.trunc(n) : n;
    }
    if (t === "string[]") {
      if (Array.isArray(raw)) return uniqStrings(raw);
      const s = asTrimmedString(raw);
      if (!s) return [];
      return uniqStrings(s.split(/[,、\n\r\t]+/g));
    }
    if (t === "string") return raw == null ? "" : String(raw);

    // object系: textarea の JSON
    if (raw == null || raw === "") return null;
    if (typeof raw === "object") return raw;
    const s = String(raw);
    try {
      return JSON.parse(s);
    } catch {
      return s;
    }
  }

  function makeBlankValueByType(type) {
    const t = String(type ?? "string");
    if (t === "boolean") return false;
    if (t === "number" || t === "int") return null;
    if (t === "string[]") return [];
    if (t === "string") return "";
    return null;
  }

  function validateAndSummarize(categoryKey) {
    const v = catalog.validateUserCategory(categoryKey);
    const errs = v?.errors ?? [];
    const warns = v?.warnings ?? [];
    if (errs.length === 0 && warns.length === 0) return { ok: true, message: "" };
    const msgs = [...errs.map((e) => `❌ ${e.message}`), ...warns.map((w) => `⚠️ ${w.message}`)];
    return { ok: errs.length === 0, message: msgs.slice(0, 3).join("\n") };
  }

  const listMasterRows = useCallback(
    (categoryKey) => {
      const cat = catalog.getCategory(categoryKey);
      return Array.isArray(cat?.list) ? cat.list : [];
    },
    [catalog]
  );

  const listUserRows = useCallback((categoryKey) => getUserListForKey(categoryKey), [userCatalog]);

  const addRow = useCallback(
    (categoryKey) => {
      try {
        const def = catalog.getCategory(categoryKey);
        const idField = String(def.idField ?? "id");
        const nameField = String(def.nameField ?? "name");
        const fields = Array.isArray(def.fields) ? def.fields : [];

        const id = catalog.nextUserId(categoryKey);

        const row = {};
        for (const f of fields) {
          const k = String(f.key);
          if (k === idField || k === nameField) continue;

          if (Object.prototype.hasOwnProperty.call(f, "default")) {
            const v = f.default;
            row[k] = typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
          } else if (f.required) {
            row[k] = makeBlankValueByType(f.type);
          }
        }

        row[idField] = id;
        row[nameField] = "";

        const list = getUserListForKey(categoryKey);
        setUserListForKey(categoryKey, [...list, row]);

        return validateAndSummarize(categoryKey);
      } catch (e) {
        return { ok: false, message: String(e?.message ?? e) };
      }
    },
    [catalog, userCatalog]
  );

  const updateRow = useCallback(
    (categoryKey, index, patch) => {
      try {
        const def = catalog.getCategory(categoryKey);
        const fields = Array.isArray(def.fields) ? def.fields : [];
        const fieldMap = new Map(fields.map((f) => [String(f.key), f]));

        const list = getUserListForKey(categoryKey);
        if (index < 0 || index >= list.length) return { ok: false, message: `index out of range: ${index}` };

        const cur = list[index] && typeof list[index] === "object" ? list[index] : {};
        const next = { ...cur };

        for (const [k0, rawVal] of Object.entries(patch ?? {})) {
          const k = String(k0);
          const f = fieldMap.get(k);
          next[k] = normalizeValueByType(f?.type ?? "string", rawVal);
        }

        setUserListForKey(categoryKey, list.map((r, i) => (i === index ? next : r)));
        return validateAndSummarize(categoryKey);
      } catch (e) {
        return { ok: false, message: String(e?.message ?? e) };
      }
    },
    [catalog, userCatalog]
  );

  const removeRow = useCallback(
    (categoryKey, index) => {
      const list = getUserListForKey(categoryKey);
      if (index < 0 || index >= list.length) return { ok: false, message: `index out of range: ${index}` };
      setUserListForKey(categoryKey, list.filter((_, i) => i !== index));
      return validateAndSummarize(categoryKey);
    },
    [catalog, userCatalog]
  );

  return { categories, listMasterRows, listUserRows, addRow, updateRow, removeRow };
}
