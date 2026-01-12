// src/pages/sheets/heroSheet/sections/UserCatalogModal.jsx
import React, { useMemo, useState } from "react";

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          maxHeight: "min(84vh, 900px)",
          overflow: "auto",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button type="button" className="sheet-btn" onClick={onClose}>
            閉じる
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

export function UserCatalogModal({ model, open, onClose }) {
  const { editable, userCatalog, createUserItem, removeUserCatalogEntry } = model;

  const userItems = useMemo(() => (Array.isArray(userCatalog?.items) ? userCatalog.items : []), [userCatalog]);
  const [draft, setDraft] = useState({ name: "", price: "", fp: "", memo: "" });

  function resetDraft() {
    setDraft({ name: "", price: "", fp: "", memo: "" });
  }

  function onCreate() {
    const id = createUserItem(draft);
    if (!id) return;
    resetDraft();
  }

  return (
    <Modal open={open} onClose={onClose} title="独自データ管理">
      <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 12 }}>
        ここで作った独自データはこのブラウザに保存され、シートで使用することが可能です。
      </div>

      {/* ---- 独自アイテム作成 ---- */}
      <div style={{ fontWeight: 700, marginBottom: 8 }}>独自アイテムを作成</div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
          <div style={{ opacity: 0.8 }}>名前</div>
          <input
            className="sheet-input"
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            placeholder="例：自作ポーション"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
          <div style={{ opacity: 0.8 }}>価格（G）</div>
          <input
            className="sheet-input"
            value={draft.price}
            onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
            placeholder="空欄=購入不可"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
          <div style={{ opacity: 0.8 }}>価格（FP）</div>
          <input
            className="sheet-input"
            value={draft.fp}
            onChange={(e) => setDraft((p) => ({ ...p, fp: e.target.value }))}
            placeholder="空欄=購入不可"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "start" }}>
          <div style={{ opacity: 0.8, paddingTop: 6 }}>メモ</div>
          <textarea
            className="sheet-input"
            style={{ minHeight: 70, resize: "vertical" }}
            value={draft.memo}
            onChange={(e) => setDraft((p) => ({ ...p, memo: e.target.value }))}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="sheet-btn"
            onClick={onCreate}
            disabled={!String(draft.name).trim()}
          >
            作成
          </button>
          <button type="button" className="sheet-btn" onClick={resetDraft}>
            クリア
          </button>
        </div>
      </div>

      <hr style={{ margin: "16px 0", opacity: 0.4 }} />

      {/* ---- 独自アイテム一覧 ---- */}
      <div style={{ fontWeight: 700, marginBottom: 8 }}>独自アイテム一覧（削除）</div>

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
                gap: 8,
                alignItems: "center",
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {u.price != null ? `G:${u.price}` : "G:—"} / {u.fp != null ? `FP:${u.fp}` : "FP:—"}
                </div>
              </div>

              <button
                type="button"
                className="sheet-btn"
                onClick={() => removeUserCatalogEntry("items", u.id)}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
