// src/pages/sheets/common/useBaseSheetModel.js
import { useEffect, useMemo } from "react";
import { useSetField } from "./useSetField.js";
import { normalizeInventory, addQty, removeOne } from "./inventory.js";
import { emptyUserCatalog, loadUserCatalog, saveUserCatalog, normalizeUserCatalog } from "./userCatalog.js";

/**
 * すべてのシート（Hero/Diva/Rarm）の共通 “基底モデル”
 *
 * 返すもの（共通）:
 * - s: state
 * - mode / editable / isCreate
 * - setField(path, valueOrUpdater)
 * - inventory（正規化済み）+ addToInventory/removeFromInventory
 * - userCatalog（必要なら）+ setUserCatalog（永続化込み）
 *
 * options:
 * - sheetType: "hero" | "diva" | "armored" | ...
 * - userCatalogScope: "sheet" | "shared"
 * - enableUserCatalog: boolean（既存移行が済むまで false でもOK）
 */
export function useBaseSheetModel({
  state,
  mode = "view",
  setState,
  sheetType = "unknown",
  userCatalogScope = "sheet",
  enableUserCatalog = true,
} = {}) {
  const s = state ?? {};
  const setField = useSetField(setState);

  const editable = mode === "edit" || mode === "create";
  const isCreate = mode === "create";

  // -----------------------------
  // inventory（共通）
  // -----------------------------
  const inventory = useMemo(() => normalizeInventory(s.inventory), [s.inventory]);

  function addToInventory(kind, id, qty = 1) {
    setField(["inventory"], (prev) => addQty(prev, kind, id, qty));
  }

  function removeFromInventory(kind, id) {
    setField(["inventory"], (prev) => removeOne(prev, kind, id));
  }

  // -----------------------------
  // userCatalog（共通・任意）
  // - 既存移行前は enableUserCatalog=false でも使えるようにしてある
  // - state.userCatalog を“真”とし、初回のみ localStorage から埋める運用
  // -----------------------------
  const userCatalog = useMemo(() => {
    if (!enableUserCatalog) return emptyUserCatalog();
    return normalizeUserCatalog(s.userCatalog ?? emptyUserCatalog());
  }, [s.userCatalog, enableUserCatalog]);

  // 初回：state に userCatalog が無い場合だけ storage からロードして注入
  useEffect(() => {
    if (!enableUserCatalog) return;
    if (s.userCatalog != null) return;
    const loaded = loadUserCatalog({ sheetType, scope: userCatalogScope });
    setField(["userCatalog"], loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableUserCatalog, sheetType, userCatalogScope]);

  function setUserCatalog(nextCatalog) {
    if (!enableUserCatalog) return;
    const normalized = normalizeUserCatalog(nextCatalog);
    setField(["userCatalog"], normalized);
    saveUserCatalog(normalized, { sheetType, scope: userCatalogScope });
  }

  return {
    // base
    s,
    mode,
    editable,
    isCreate,
    setField,

    // inventory
    inventory,
    addToInventory,
    removeFromInventory,

    // user catalog（任意）
    userCatalog,
    setUserCatalog,
  };
}
