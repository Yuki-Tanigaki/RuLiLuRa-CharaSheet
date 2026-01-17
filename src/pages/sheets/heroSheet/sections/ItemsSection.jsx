// src/pages/sheets/heroSheet/sections/ItemsSection.jsx
import React, { useMemo, useState } from "react";
import { catalogKeyOf } from "../../common/catalog.js";
import { kindLabel } from "../kindLabel.js";

const ADVENTURER_SET_TOOL_ID = 38;
const ADVENTURER_SET_PRICE_G = 12000;

export function ItemsSection({ model }) {
  const { isCreate, itemsEditable, catalog, inventory, addToInventory, removeFromInventory, setField, moneyG, fp } = model;

  const [itemPicker, setItemPicker] = useState({ kind: "tool", id: "" });

  function isAdventurerSet(item) {
    return item?.kind === "tool" && Number(item?.id) === ADVENTURER_SET_TOOL_ID;
  }

  function grantAdventurerSetContents() {
    // 携帯用食料（１日２食分）×2
    addToInventory("tool", 1, 2);
    // ほくち箱（点火用）
    addToInventory("tool", 8, 1);
    // 毛布×2
    addToInventory("tool", 14, 2);
    // 水（1日分）
    addToInventory("tool", 3, 1);
    // 水袋
    addToInventory("tool", 7, 1);
    // たいまつ×５（※マスター上「たいまつ×５」1個が5本扱い）
    addToInventory("tool", 9, 1);
    // リュックサック
    addToInventory("tool", 6, 1);
    // ロープ（10ｍ）
    addToInventory("tool", 12, 1);
  }

  function buyAdventurerSet() {
    if (moneyG < ADVENTURER_SET_PRICE_G) return;
    setField(["equipment", "moneyG"], (prev) => Math.max(0, (Number(prev) || 0) - ADVENTURER_SET_PRICE_G));
    grantAdventurerSetContents();
  }

  const catalogByKind = useMemo(() => {
    const m = new Map();
    for (const c of catalog) {
      const k = c.kind;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(c);
    }
    for (const [k, arr] of m.entries()) {
      arr.sort((p, q) => String(p.name ?? "").localeCompare(String(q.name ?? ""), "ja"));
      m.set(k, arr);
    }
    return m;
  }, [catalog]);

  const selectedCatalogItem = useMemo(() => {
    const idStr = String(itemPicker.id ?? "");
    if (!idStr) return null;
    return catalog.find((c) => c.kind === itemPicker.kind && String(c.id) === idStr) ?? null;
  }, [catalog, itemPicker]);

  function buyWithMoney(item) {
    if (!item) return;

    // 冒険者セットは「中身を一括追加」
    if (isAdventurerSet(item)) {
      buyAdventurerSet();
      return;
    }

    const price = Number(item.price);
    if (!Number.isFinite(price)) return;
    if (moneyG < price) return;

    setField(["equipment", "moneyG"], (prev) => Math.max(0, (Number(prev) || 0) - price));
    addToInventory(item.kind, item.id, 1);
  }

  function buyWithFp(item) {
    if (!item) return;

    // 「所持品に追加」でもセットは中身を追加（お金は減らさない）
    if (isAdventurerSet(item)) {
      grantAdventurerSetContents();
      return;
    }

    const cost = Number(item.fp);
    if (!Number.isFinite(cost)) return;
    if (fp < cost) return;

    setField(["equipment", "fp"], (prev) => Math.max(0, (Number(prev) || 0) - cost));
    addToInventory(item.kind, item.id, 1);
  }

  function addOwned(item) {
    if (!item) return;
    if (isAdventurerSet(item)) {
      grantAdventurerSetContents();
      return;
    }
    addToInventory(item.kind, item.id, 1);
  }

  return (
    <section className="panel items">
      <div className="panel-title">アイテム欄</div>

      {/* createでは触らない（フリーアイテム獲得はスキル欄側） */}
      {itemsEditable && (
        <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
            <select
              className="sheet-input"
              value={itemPicker.kind}
              onChange={(e) => setItemPicker((p) => ({ ...p, kind: e.target.value, id: "" }))}
            >
              <option value="weapon">武器</option>
              <option value="armor">防具</option>
              <option value="shield">盾</option>
              <option value="tool">道具</option>
            </select>

            <select
              className="sheet-input"
              value={itemPicker.id}
              onChange={(e) => setItemPicker((p) => ({ ...p, id: e.target.value }))}
            >
              <option value="">（選択）</option>
              {(catalogByKind.get(itemPicker.kind) ?? []).map((c) => (
                <option key={catalogKeyOf(c.kind, c.id)} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" className="sheet-btn" onClick={() => addOwned(selectedCatalogItem)} disabled={!selectedCatalogItem}>
              ＋ 所持品に追加
            </button>

            <button
              type="button"
              className="sheet-btn"
              onClick={() => buyWithMoney(selectedCatalogItem)}
              disabled={
                !selectedCatalogItem ||
                selectedCatalogItem.price == null ||
                !Number.isFinite(Number(selectedCatalogItem.price)) ||
                moneyG < Number(selectedCatalogItem.price)
              }
              title={selectedCatalogItem?.price == null ? "購入不可（price が null）" : ""}
            >
              購入（{selectedCatalogItem?.price ?? "—"} G）
            </button>

            <button
              type="button"
              className="sheet-btn"
              onClick={() => buyWithFp(selectedCatalogItem)}
              disabled={
                !selectedCatalogItem ||
                selectedCatalogItem.fp == null ||
                !Number.isFinite(Number(selectedCatalogItem.fp)) ||
                fp < Number(selectedCatalogItem.fp)
              }
              title={selectedCatalogItem?.fp == null ? "購入不可（fp が無い/ null）" : ""}
            >
              購入（{selectedCatalogItem?.fp ?? "—"} FP）
            </button>
          </div>
        </div>
      )}

      {inventory.length === 0 ? (
        <div style={{ opacity: 0.7 }}>{itemsEditable ? "上の操作でアイテムを追加してください" : "—"}</div>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {inventory.map((e) => {
            const def = catalog.find((c) => c.kind === e.kind && String(c.id) === String(e.id)) ?? null;
            const name = def?.name ?? "(unknown)";
            const suffix = e.qty >= 2 ? `（×${e.qty}）` : "";
            return (
              <div
                key={catalogKeyOf(e.kind, e.id)}
                style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ opacity: 0.7, marginRight: 6 }}>[{kindLabel(e.kind)}]</span>
                  {name}
                  {suffix}
                </div>

                {itemsEditable && (
                  <button type="button" className="sheet-btn" onClick={() => removeFromInventory(e.kind, e.id)}>
                    削除
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isCreate && (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75, lineHeight: 1.6 }}>
          ※ create中は「フリーアイテム獲得」以外の操作（購入・追加・削除）は行いません。<br />
          ※ 所持品はフリーアイテム獲得結果の確認用に表示しています。
        </div>
      )}
    </section>
  );
}
