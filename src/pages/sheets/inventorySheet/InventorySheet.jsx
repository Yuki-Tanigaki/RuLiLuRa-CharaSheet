// src/pages/sheets/inventorySheet/InventorySheet.jsx
import React, { useMemo, useState } from "react";
import { useCatalog } from "@/context/CatalogProvider.jsx";

const ADVENTURER_SET_TOOL_ID = 38;
const ADVENTURER_SET_PRICE_G = 12000;

/**
 * 画面内で安定した key を作るための複合キー
 */
function keyOf(categoryKey, id) {
  return `${String(categoryKey ?? "")}:${String(id ?? "")}`;
}

/**
 * 入力値を整数として扱うための補助関数
 */
function clampInt(v, { min = 0 } = {}) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.trunc(n));
}

/**
 * 数値として解釈できる値のみ number を返す
 * 文字列の場合はカンマを除去して解釈する
 */
function safeNumber(v) {
  if (v === "" || v == null) return null;

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const normalized = s.replace(/,/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function InventorySheet({ shared, setShared }) {
  const catalogService = useCatalog();

  /**
   * sharedState 側の inventory を唯一の実体として扱う
   */
  const inv = shared?.inventory ?? { items: [], moneyG: 0, fp: 0 };
  const items = Array.isArray(inv.items) ? inv.items : [];
  const moneyG = clampInt(inv.moneyG, { min: 0 });
  const fp = clampInt(inv.fp, { min: 0 });

  // 購入対象のカテゴリキー（この7個だけ）
  const PURCHASE_CATEGORY_KEYS = new Set([
    "weapon",
    "shield",
    "armor",
    "tool",
    "armament",
    "protection",
    "special",
  ]);

  const categoryKeys = useMemo(() => {
    // masterCatalogs に存在するものだけ残す
    return catalogService
      .listCategoryKeys()
      .filter((k) => PURCHASE_CATEGORY_KEYS.has(String(k)));
  }, [catalogService]);

  const categoryOptions = useMemo(() => {
    const opts = categoryKeys.map((key) => {
      const cat = catalogService.getCategory(key);
      return { key, label: String(cat?.label ?? key) };
    });

    // label でソート（表示は常に label）
    opts.sort((a, b) => a.label.localeCompare(b.label, "ja"));
    return opts;
  }, [catalogService, categoryKeys]);

  // 冒険者セットは tool カテゴリにある前提なので、キーで特定する
  const toolCategoryKey = useMemo(() => {
    return categoryKeys.includes("tool") ? "tool" : null;
  }, [categoryKeys]);

  /**
   * ピッカーの状態（カテゴリキー + id + 数量）
   */
  const [picker, setPicker] = useState(() => ({
    categoryKey: categoryOptions[0]?.key ?? categoryKeys[0] ?? "",
    id: "",
    qty: 1,
  }));

  /**
   * 現在選択中カテゴリの「合成済みリスト」を取得する
   * これにより自作データも候補に含まれる
   */
  const mergedList = useMemo(() => {
    if (!picker.categoryKey) return [];
    return catalogService.getMergedList(picker.categoryKey) ?? [];
  }, [catalogService, picker.categoryKey]);

  /**
   * 表示の安定性のため、候補は名称でソートしておく
   */
  const mergedListSorted = useMemo(() => {
    const arr = [...mergedList];
    arr.sort((p, q) => String(p.name ?? "").localeCompare(String(q.name ?? ""), "ja"));
    return arr;
  }, [mergedList]);

  /**
   * 現在ピッカーで選択しているアイテム定義
   */
  const selectedCatalogItem = useMemo(() => {
    const idStr = String(picker.id ?? "");
    if (!idStr) return null;
    return mergedListSorted.find((c) => String(c.id) === idStr) ?? null;
  }, [mergedListSorted, picker.id]);

  /**
   * 選択中アイテムの memo を表示用に整形する
   * 空文字や空白のみの場合は表示しない
   */
  const selectedMemo = useMemo(() => {
    const s = String(selectedCatalogItem?.memo ?? "").trim();
    return s ? s : "";
  }, [selectedCatalogItem]);

  /**
   * inventory の更新は一箇所に集約し、呼び出し側は「どう変えるか」だけ書く
   */
  const updateInventory = (updater) => {
    setShared((prev) => {
      const cur = prev?.inventory ?? { items: [], moneyG: 0, fp: 0 };
      const nextInv = updater(cur);
      return { ...(prev ?? {}), inventory: nextInv };
    });
  };

  const setMoney = (next) => {
    updateInventory((cur) => ({ ...cur, moneyG: clampInt(next, { min: 0 }) }));
  };

  const setFpValue = (next) => {
    updateInventory((cur) => ({ ...cur, fp: clampInt(next, { min: 0 }) }));
  };

  /**
   * tool カテゴリにおける「1単位あたりの実数量」を取得する
   */
  function unitQtyForInventory(item) {
    const q = Number(item?.qty);
    return Number.isFinite(q) && q > 0 ? Math.trunc(q) : 1;
  }

  /**
   * インベントリは同一（categoryKey, id）を1行にまとめて数量で管理する
   */
  const addToInventory = (categoryKey, id, qty) => {
    const q = clampInt(qty, { min: 1 });
    updateInventory((cur) => {
      const list = Array.isArray(cur.items) ? cur.items : [];
      const idStr = String(id);

      const next = list.map((e) => ({ ...e }));
      const idx = next.findIndex((e) => e.categoryKey === categoryKey && String(e.id) === idStr);

      if (idx >= 0) {
        const prevQty = clampInt(next[idx].qty, { min: 0 });
        next[idx].qty = prevQty + q;
      } else {
        next.push({ categoryKey, id, qty: q });
      }

      return { ...cur, items: next };
    });
  };

  const removeFromInventory = (categoryKey, id) => {
    updateInventory((cur) => {
      const list = Array.isArray(cur.items) ? cur.items : [];
      const idStr = String(id);
      const next = list.filter((e) => !(e.categoryKey === categoryKey && String(e.id) === idStr));
      return { ...cur, items: next };
    });
  };

  /**
   * 数量が 0 以下になった場合は行ごと削除する
   */
  const setQty = (categoryKey, id, nextQty) => {
    const q = clampInt(nextQty, { min: 0 });
    updateInventory((cur) => {
      const list = Array.isArray(cur.items) ? cur.items : [];
      const idStr = String(id);

      const next = [];
      for (const e of list) {
        if (e.categoryKey === categoryKey && String(e.id) === idStr) {
          if (q <= 0) continue;
          next.push({ ...e, qty: q });
        } else {
          next.push(e);
        }
      }

      return { ...cur, items: next };
    });
  };

  /**
   * 冒険者セットの中身を追加する
   */
  const grantAdventurerSetContents = () => {
    const k = toolCategoryKey ?? picker.categoryKey;

    addToInventory(k, 1, 2); // 携帯用食料（１日２食分）×2
    addToInventory(k, 8, 1); // ほくち箱（点火用）
    addToInventory(k, 14, 2); // 毛布×2
    addToInventory(k, 3, 1); // 水（1日分）
    addToInventory(k, 7, 1); // 水袋
    addToInventory(k, 9, 1); // たいまつ×５
    addToInventory(k, 6, 1); // リュックサック
    addToInventory(k, 12, 1); // ロープ（10ｍ）
  };

  /**
   * 冒険者セットかどうかの判定は「道具カテゴリ + id」で行う
   */
  const isAdventurerSet = (categoryKey, item) => {
    if (!item) return false;
    if (!toolCategoryKey) return false;
    return categoryKey === toolCategoryKey && Number(item.id) === ADVENTURER_SET_TOOL_ID;
  };

  const addOwned = (categoryKey, item) => {
    if (!item) return;

    if (isAdventurerSet(categoryKey, item)) {
      grantAdventurerSetContents();
      return;
    }

    const unit = categoryKey === "tool" ? unitQtyForInventory(item) : 1;
    const q = clampInt(picker.qty, { min: 1 }) * unit;
    addToInventory(categoryKey, item.id, q);
  };

  const buyWithMoney = (categoryKey, item) => {
    if (!item) return;

    if (isAdventurerSet(categoryKey, item)) {
      if (moneyG < ADVENTURER_SET_PRICE_G) return;
      setMoney(moneyG - ADVENTURER_SET_PRICE_G);
      grantAdventurerSetContents();
      return;
    }

    const price = safeNumber(item.price);
    if (price == null) return;

    const unitCount = clampInt(picker.qty, { min: 1 });
    const total = price * unitCount;
    if (moneyG < total) return;

    setMoney(moneyG - total);
    const unit = categoryKey === "tool" ? unitQtyForInventory(item) : 1;
    addToInventory(categoryKey, item.id, unitCount * unit);
  };

  const buyWithFp = (categoryKey, item) => {
    if (!item) return;

    // 冒険者セットは FP 購入不可
    if (isAdventurerSet(categoryKey, item)) return;

    const cost = safeNumber(item.fp);
    if (cost == null) return;

    const unitCount = clampInt(picker.qty, { min: 1 });
    const total = cost * unitCount;
    if (fp < total) return;

    setFpValue(fp - total);
    const unit = categoryKey === "tool" ? unitQtyForInventory(item) : 1;
    addToInventory(categoryKey, item.id, unitCount * unit);
  };

  /**
   * 所持品一覧表示のため、参照しやすいように「カテゴリごとの byId Map」を用意する
   */
  const mergedByCategoryKey = useMemo(() => {
    const m = new Map();
    for (const key of categoryKeys) {
      const list = catalogService.getMergedList(key) ?? [];
      const byId = new Map(list.map((x) => [String(x.id), x]));
      m.set(key, { list, byId, label: String(catalogService.getCategory(key)?.label ?? key) });
    }
    return m;
  }, [catalogService, categoryKeys]);

  const priceText = useMemo(() => {
    if (!selectedCatalogItem) return "—";
    if (isAdventurerSet(picker.categoryKey, selectedCatalogItem)) return `${ADVENTURER_SET_PRICE_G} G`;
    const p = safeNumber(selectedCatalogItem.price);
    return p == null ? "—" : `${p} G`;
  }, [selectedCatalogItem, picker.categoryKey, toolCategoryKey]);

  const fpText = useMemo(() => {
    if (!selectedCatalogItem) return "—";
    if (isAdventurerSet(picker.categoryKey, selectedCatalogItem)) return "—";
    const c = safeNumber(selectedCatalogItem.fp);
    return c == null ? "—" : `${c} FP`;
  }, [selectedCatalogItem, picker.categoryKey, toolCategoryKey]);

  const canBuyMoney = useMemo(() => {
    if (!selectedCatalogItem) return false;

    if (isAdventurerSet(picker.categoryKey, selectedCatalogItem)) {
      return moneyG >= ADVENTURER_SET_PRICE_G;
    }

    const p = safeNumber(selectedCatalogItem.price);
    if (p == null) return false;

    const q = clampInt(picker.qty, { min: 1 });
    return moneyG >= p * q;
  }, [selectedCatalogItem, picker.categoryKey, picker.qty, moneyG, toolCategoryKey]);

  const canBuyFp = useMemo(() => {
    if (!selectedCatalogItem) return false;

    // 冒険者セットは FP 購入不可
    if (isAdventurerSet(picker.categoryKey, selectedCatalogItem)) return false;

    const c = safeNumber(selectedCatalogItem.fp);
    if (c == null) return false;

    const q = clampInt(picker.qty, { min: 1 });
    return fp >= c * q;
  }, [selectedCatalogItem, picker.categoryKey, picker.qty, fp, toolCategoryKey]);

  const selectedCategoryLabel = useMemo(() => {
    const cat = picker.categoryKey ? catalogService.getCategory(picker.categoryKey) : null;
    return String(cat?.label ?? picker.categoryKey ?? "");
  }, [catalogService, picker.categoryKey]);

  return (
    <div className="sheet">
      <div className="paper">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0 }}>持ち物シート</h2>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ opacity: 0.75 }}>所持金</span>
              <input
                className="sheet-input"
                type="number"
                value={moneyG}
                min={0}
                onChange={(e) => setMoney(e.target.value)}
                style={{ width: 120 }}
              />
              <span style={{ opacity: 0.75 }}>G</span>
            </label>

            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ opacity: 0.75 }}>FP</span>
              <input
                className="sheet-input"
                type="number"
                value={fp}
                min={0}
                onChange={(e) => setFpValue(e.target.value)}
                style={{ width: 120 }}
              />
            </label>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", margin: "12px 0" }} />

        <section className="panel items">
          <div className="panel-title">追加</div>

          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 90px", gap: 8, alignItems: "center" }}>
              <select
                className="sheet-input"
                value={picker.categoryKey}
                onChange={(e) => setPicker((p) => ({ ...p, categoryKey: e.target.value, id: "" }))}
              >
                {categoryOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select
                className="sheet-input"
                value={picker.id}
                onChange={(e) => setPicker((p) => ({ ...p, id: e.target.value }))}
              >
                <option value="">（選択）</option>
                {mergedListSorted.map((c) => (
                  <option key={keyOf(picker.categoryKey, c.id)} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                className="sheet-input"
                type="number"
                min={1}
                value={picker.qty}
                onChange={(e) => setPicker((p) => ({ ...p, qty: clampInt(e.target.value, { min: 1 }) }))}
                title="数量"
              />
            </div>

            {/* 選択中アイテムの補足情報を表示する（空の場合は表示しない） */}
            {selectedMemo && (
              <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5, paddingLeft: 2 }}>
                {selectedMemo}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className="sheet-btn"
                onClick={() => addOwned(picker.categoryKey, selectedCatalogItem)}
                disabled={!selectedCatalogItem}
              >
                ＋ 所持品に追加
              </button>

              <button
                type="button"
                className="sheet-btn"
                onClick={() => buyWithMoney(picker.categoryKey, selectedCatalogItem)}
                disabled={!canBuyMoney}
                title={`${selectedCategoryLabel} / 価格: ${priceText}`}
              >
                購入（{priceText}）
              </button>

              <button
                type="button"
                className="sheet-btn"
                onClick={() => buyWithFp(picker.categoryKey, selectedCatalogItem)}
                disabled={!canBuyFp}
                title={`${selectedCategoryLabel} / FP: ${fpText}`}
              >
                購入（{fpText}）
              </button>

              {isAdventurerSet(picker.categoryKey, selectedCatalogItem) && (
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  ※ 冒険者セットは中身を一括追加します（G購入: {ADVENTURER_SET_PRICE_G}G）
                </span>
              )}
            </div>
          </div>

          <div className="panel-title" style={{ marginTop: 10 }}>
            所持品一覧
          </div>

          {items.length === 0 ? (
            <div style={{ opacity: 0.7 }}>上の操作でアイテムを追加してください</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {items.map((e) => {
                const catInfo = mergedByCategoryKey.get(e.categoryKey);
                const def = catInfo?.byId?.get(String(e.id)) ?? null;
                const name = def?.name ?? "(unknown)";
                const label = catInfo?.label ?? String(e.categoryKey ?? "");
                const qty = clampInt(e.qty, { min: 1 });

                return (
                  <div
                    key={keyOf(e.categoryKey, e.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 120px 80px",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ opacity: 0.7, marginRight: 6 }}>[{label}]</span>
                      {name}
                    </div>

                    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="sheet-btn"
                        onClick={() => setQty(e.categoryKey, e.id, qty - 1)}
                        title="1減らす（0になったら削除）"
                      >
                        −
                      </button>

                      <input
                        className="sheet-input"
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(ev) => setQty(e.categoryKey, e.id, ev.target.value)}
                        style={{ width: 64, textAlign: "right" }}
                        title="数量"
                      />

                      <button
                        type="button"
                        className="sheet-btn"
                        onClick={() => setQty(e.categoryKey, e.id, qty + 1)}
                        title="1増やす"
                      >
                        ＋
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="button" className="sheet-btn" onClick={() => removeFromInventory(e.categoryKey, e.id)}>
                        削除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
