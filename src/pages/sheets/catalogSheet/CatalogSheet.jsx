// src/pages/sheets/catalogSheet/CatalogSheet.jsx
import React, { useMemo, useState } from "react";
import "../../../styles/catalog_sheet.css"; // 既存のボタン/入力スタイルを流用する想定

/**
 * 独自データ編集用シート（まずは「独自アイテム」だけ）
 *
 * 期待する model API（Hero/Diva/Rarm から同じ形で渡せるように）:
 * - editable: boolean
 * - userCatalog: { items: [] ... }
 * - createUserItem(draft) => id|null
 * - removeUserCatalogEntry(listKey, id)
 *
 * ※ model は useCatalogSheetModel でも、既存 useHeroSheetModel でもOK
 */
export default function CatalogSheet({ model, title = "独自データ管理" }) {
  const { editable, userCatalog, createUserItem, removeUserCatalogEntry } = model ?? {};

  // ---- items ----
  const userItems = useMemo(() => (Array.isArray(userCatalog?.items) ? userCatalog.items : []), [userCatalog]);

  const [draft, setDraft] = useState({ name: "", price: "", fp: "", memo: "" });

  function resetDraft() {
    setDraft({ name: "", price: "", fp: "", memo: "" });
  }

  function onCreate() {
    if (!createUserItem) return;
    const id = createUserItem(draft);
    if (!id) return;
    resetDraft();
  }

  return (
    <div className="sheet-root">
      <div className="sheet-header" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            ここで作った独自データはこのブラウザに保存され、各シートで使用できます。
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: 0.8 }}>
          状態：{editable ? "編集可" : "閲覧のみ"}
        </div>
      </div>

      {/* ===== タブ（今は Items だけ。後で weapons/skills... を追加する） ===== */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button type="button" className="sheet-btn" disabled>
          アイテム
        </button>
        <button type="button" className="sheet-btn" disabled title="後で追加">
          武器（未実装）
        </button>
        <button type="button" className="sheet-btn" disabled title="後で追加">
          スキル（未実装）
        </button>
      </div>

      <hr style={{ margin: "14px 0", opacity: 0.35 }} />

      {/* ===== 独自アイテム作成 ===== */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 800 }}>独自アイテムを作成</div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
            <div style={{ opacity: 0.8 }}>名前</div>
            <input
              className="sheet-input"
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="例：自作ポーション"
              disabled={!editable}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
            <div style={{ opacity: 0.8 }}>価格（G）</div>
            <input
              className="sheet-input"
              value={draft.price}
              onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
              placeholder="空欄=購入不可"
              disabled={!editable}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
            <div style={{ opacity: 0.8 }}>価格（FP）</div>
            <input
              className="sheet-input"
              value={draft.fp}
              onChange={(e) => setDraft((p) => ({ ...p, fp: e.target.value }))}
              placeholder="空欄=購入不可"
              disabled={!editable}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "start" }}>
            <div style={{ opacity: 0.8, paddingTop: 6 }}>メモ</div>
            <textarea
              className="sheet-input"
              style={{ minHeight: 90, resize: "vertical" }}
              value={draft.memo}
              onChange={(e) => setDraft((p) => ({ ...p, memo: e.target.value }))}
              disabled={!editable}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="sheet-btn"
              onClick={onCreate}
              disabled={!editable || !String(draft.name).trim()}
            >
              作成
            </button>
            <button type="button" className="sheet-btn" onClick={resetDraft} disabled={!editable}>
              クリア
            </button>
          </div>
        </div>
      </div>

      <hr style={{ margin: "16px 0", opacity: 0.35 }} />

      {/* ===== 独自アイテム一覧 ===== */}
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 800 }}>独自アイテム一覧</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>件数：{userItems.length}</div>
        </div>

        {userItems.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.8 }}>まだありません。</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {userItems.map((u) => (
              <div
                key={String(u.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 10,
                  alignItems: "center",
                  border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  background: "#fff",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.name}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {u.price != null ? `G:${u.price}` : "G:—"} / {u.fp != null ? `FP:${u.fp}` : "FP:—"}
                  </div>
                  {String(u.memo ?? "").trim() ? (
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8, whiteSpace: "pre-wrap" }}>
                      {u.memo}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="sheet-btn"
                  onClick={() => removeUserCatalogEntry?.("items", u.id)}
                  disabled={!editable}
                  title={!editable ? "編集モードで削除できます" : "削除"}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
