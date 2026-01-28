// src/pages/sheets/catalogSheet/useCatalogSheetModel.js
import { useCallback, useMemo } from "react";
import { useCatalog } from "@/context/CatalogProvider.jsx";

/**
 * 画面での編集体験を優先し、入力値は型に応じて最小限の整形を行う
 */
export function useCatalogSheetModel({ userCatalog, setUserCatalog }) {
  const catalog = useCatalog();

  if (typeof setUserCatalog !== "function") {
    throw new Error("useCatalogSheetModel: setUserCatalog is required");
  }

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

  function listMasterRowsInternal(categoryKey) {
    const cat = catalog.getCategory(categoryKey);
    return Array.isArray(cat?.list) ? cat.list : [];
  }

  /**
   * 衝突を避けるため、ユーザーデータは大きなID帯から採番する
   */
  function nextUserIdFrom90000(categoryKey) {
    const START = 90000;

    const def = catalog.getCategory(categoryKey);
    const idField = String(def?.idField ?? "id");

    const master = listMasterRowsInternal(categoryKey);
    const used = new Set();

    for (const r of master) {
      const v = r?.[idField];
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n)) used.add(n);
    }

    const list = getUserListForKey(categoryKey);
    let maxUser = START - 1;

    for (const r of list) {
      const v = r?.[idField];
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) continue;
      used.add(n);
      if (n >= START && n > maxUser) maxUser = n;
    }

    let cand = Math.max(START, maxUser + 1);
    while (used.has(cand)) cand += 1;
    return cand;
  }

  /**
   * 編集直後に「次状態」を見て、重複などを即時に検出する
   */
  function validateNextList(categoryKey, nextList) {
    try {
      const def = catalog.getCategory(categoryKey);
      const idField = String(def?.idField ?? "id");
      const nameField = String(def?.nameField ?? "name");

      const errs = [];
      const warns = [];

      const idToIdx = new Map();
      const nameToIdx = new Map();

      nextList.forEach((row, i) => {
        const id = row?.[idField];
        const name = asTrimmedString(row?.[nameField]);

        // id 重複は致命的寄り
        if (id != null && id !== "") {
          const key = String(id);
          if (idToIdx.has(key)) {
            errs.push(
              `[${def?.label ?? categoryKey}] duplicated id in user: "${key}" (row#${idToIdx.get(
                key
              )} and row#${i})`
            );
          } else {
            idToIdx.set(key, i);
          }
        }

        // name 重複は警告
        if (name) {
          if (nameToIdx.has(name)) {
            warns.push(
              `[${def?.label ?? categoryKey}] duplicated name in user: "${name}" (row#${nameToIdx.get(
                name
              )} and row#${i})`
            );
          } else {
            nameToIdx.set(name, i);
          }
        }
      });

      if (errs.length === 0 && warns.length === 0) return { ok: true, message: "" };

      const msgs = [
        ...errs.map((m) => `❌ ${m}`),
        ...warns.map((m) => `⚠️ ${m}`),
      ];
      return { ok: errs.length === 0, message: msgs.slice(0, 3).join("\n") };
    } catch (e) {
      return { ok: false, message: String(e?.message ?? e) };
    }
  }

  const listMasterRows = useCallback((categoryKey) => listMasterRowsInternal(categoryKey), [catalog]);

  const listUserRows = useCallback((categoryKey) => getUserListForKey(categoryKey), [userCatalog]);

  const addRow = useCallback(
    (categoryKey) => {
      try {
        const def = catalog.getCategory(categoryKey);
        const idField = String(def.idField ?? "id");
        const nameField = String(def.nameField ?? "name");
        const fields = Array.isArray(def.fields) ? def.fields : [];

        const id = nextUserIdFrom90000(categoryKey);

        const row = {};
        for (const f of fields) {
          const k = String(f.key);
          if (k === idField || k === nameField) continue;

          if (Object.prototype.hasOwnProperty.call(f, "default")) {
            const v = f.default;
            row[k] =
              typeof structuredClone === "function"
                ? structuredClone(v)
                : JSON.parse(JSON.stringify(v));
          } else if (f.required) {
            row[k] = makeBlankValueByType(f.type);
          }
        }

        row[idField] = id;
        row[nameField] = "";

        const list = getUserListForKey(categoryKey);
        const nextList = [...list, row];
        setUserListForKey(categoryKey, nextList);

        return validateNextList(categoryKey, nextList);
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
        const idField = String(def.idField ?? "id");

        const fields = Array.isArray(def.fields) ? def.fields : [];
        const fieldMap = new Map(fields.map((f) => [String(f.key), f]));

        const list = getUserListForKey(categoryKey);
        if (index < 0 || index >= list.length) {
          return { ok: false, message: `index out of range: ${index}` };
        }

        const cur = list[index] && typeof list[index] === "object" ? list[index] : {};
        const nextRow = { ...cur };

        for (const [k0, rawVal] of Object.entries(patch ?? {})) {
          const k = String(k0);
          if (k === idField) continue; // ユーザー側のidは固定
          const f = fieldMap.get(k);
          nextRow[k] = normalizeValueByType(f?.type ?? "string", rawVal);
        }

        const nextList = list.map((r, i) => (i === index ? nextRow : r));
        setUserListForKey(categoryKey, nextList);

        return validateNextList(categoryKey, nextList);
      } catch (e) {
        return { ok: false, message: String(e?.message ?? e) };
      }
    },
    [catalog, userCatalog]
  );

  const removeRow = useCallback(
    (categoryKey, index) => {
      const list = getUserListForKey(categoryKey);
      if (index < 0 || index >= list.length) {
        return { ok: false, message: `index out of range: ${index}` };
      }
      const nextList = list.filter((_, i) => i !== index);
      setUserListForKey(categoryKey, nextList);
      return validateNextList(categoryKey, nextList);
    },
    [catalog, userCatalog]
  );

  return { categories, listMasterRows, listUserRows, addRow, updateRow, removeRow };
}
