// src/pages/sheets/catalogSheet/useCatalogSheetModel.js
import { useEffect, useMemo, useRef, useState } from "react";
import {
  emptyUserCatalog,
  loadUserCatalog,
  saveUserCatalog,
  normalizeUserCatalog,
  upsertUserCatalogEntry,
  removeUserCatalogEntry,
} from "../common/userCatalog.js";

/**
 * CatalogSheet 用モデル
 *
 * - state を持たない（キャラシ state に依存しない）
 * - localStorage の userCatalog を CRUD する
 * - scope を "shared" / "sheet" で切替できる（将来UIタブ化してもOK）
 *
 * 返すAPIは、既存 UserCatalogModal が期待する形に合わせる：
 * - editable
 * - userCatalog
 * - createUserItem(draft) => id|null
 * - removeUserCatalogEntry(listKey, id)
 * - addUserCatalogEntry(listKey, entry)（将来用）
 *
 * options:
 * - sheetType: "hero" | "diva" | "armored" | ...
 * - scope: "shared" | "sheet"
 * - editable: boolean（CatalogSheetを編集可能にするか）
 */
export function useCatalogSheetModel(options = {}) {
  const sheetType = String(options.sheetType ?? "hero");
  const scope = String(options.scope ?? "shared"); // CatalogSheetは基本 shared 推奨
  const editable = options.editable !== false; // default true

  // local state として userCatalog を持つ（キャラシ state とは独立）
  const [userCatalogState, setUserCatalogState] = useState(() =>
    loadUserCatalog({ sheetType, scope })
  );

  // sheetType/scope が変わったら読み直す（初回＋切替対応）
  useEffect(() => {
    setUserCatalogState(loadUserCatalog({ sheetType, scope }));
  }, [sheetType, scope]);

  // 参照は常に正規化済みを返す
  const userCatalog = useMemo(
    () => normalizeUserCatalog(userCatalogState ?? emptyUserCatalog()),
    [userCatalogState]
  );

  // 初回の save は避けたいのでフラグ
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      return;
    }
    // state が変わったら保存
    saveUserCatalog(userCatalog, { sheetType, scope });
  }, [userCatalog, sheetType, scope]);

  function setUserCatalog(next) {
    const normalized = normalizeUserCatalog(next ?? emptyUserCatalog());
    setUserCatalogState(normalized);
    // 保存は effect に任せる（連打でも軽く）
  }

  // ------- CRUD helpers -------
  function addUserCatalogEntryCompat(listKey, entry) {
    if (!editable) return null;
    const key = String(listKey ?? "").trim();
    if (!key) return null;

    const next = upsertUserCatalogEntry(userCatalog, key, entry);
    setUserCatalog(next);

    // 追加/更新したIDを返す（entry.id が無い場合は upsert 内で採番される）
    // upsert は “同一idなら上書き / 無ければ追加” なので、推定で返す
    const e = entry && typeof entry === "object" ? entry : {};
    const id = String(e.id ?? "").trim();
    if (id) return id;

    // id未指定のとき：最後に追加されたものを推定で返す（確実に返したいなら entry.id を渡す運用にする）
    const arr = Array.isArray(next[key]) ? next[key] : [];
    return arr[arr.length - 1]?.id ?? null;
  }

  function removeUserCatalogEntryCompat(listKey, id) {
    if (!editable) return;
    const key = String(listKey ?? "").trim();
    if (!key) return;

    const next = removeUserCatalogEntry(userCatalog, key, id);
    setUserCatalog(next);
  }

  // ItemsSection 互換：独自アイテム作成（最小）
  function createUserItem(draft) {
    if (!editable) return null;
    const d = draft && typeof draft === "object" ? draft : {};
    const name = String(d.name ?? "").trim();
    if (!name) return null;

    const priceRaw = d.price;
    const fpRaw = d.fp;

    const price =
      priceRaw === "" || priceRaw == null ? null : Number(priceRaw);
    const fp =
      fpRaw === "" || fpRaw == null ? null : Number(fpRaw);

    const entry = {
      // id は upsert が採番する（必要なら draft で id 指定も可能）
      name,
      price: Number.isFinite(price) ? price : null,
      fp: Number.isFinite(fp) ? fp : null,
      memo: String(d.memo ?? "").trim(),
    };

    return addUserCatalogEntryCompat("items", entry);
  }

  return {
    // flags
    editable,

    // data
    userCatalog,

    // operations（現行Modal互換）
    createUserItem,
    removeUserCatalogEntry: removeUserCatalogEntryCompat,

    // 汎用（将来：武器/スキル等も追加するときに使う）
    addUserCatalogEntry: addUserCatalogEntryCompat,
    setUserCatalog,

    // meta
    sheetType,
    scope,
  };
}
