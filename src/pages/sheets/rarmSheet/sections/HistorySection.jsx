// src/pages/sheets/rarmSheet/sections/HistorySection.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  loadHistory,
  restoreHistoryItem,
  deleteHistory,
  clearHistory,
  updateHistoryItem,
} from "../../../../lib/versioning.js";

function fmtAt(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso ?? "");
  }
}

function tagsToString(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return "";
  return tags.join(", ");
}

export function HistorySection({ sheetType = "rarm", onRestoreState }) {
  const [list, setList] = useState([]);

  // ★タグ入力のローカル編集状態（id -> string）
  const [tagDraft, setTagDraft] = useState({});

  function reload() {
    const h = loadHistory(sheetType);
    const arr = Array.isArray(h) ? h : [];
    setList(arr);

    // draft が未生成のものだけ埋める（入力途中の値は保持）
    setTagDraft((prev) => {
      const next = { ...(prev ?? {}) };
      for (const it of arr) {
        if (next[it.id] == null) next[it.id] = tagsToString(it.tags);
      }
      return next;
    });
  }

  useEffect(() => {
    reload();
    const onUpdate = () => reload();
    window.addEventListener("rulilura:history-updated", onUpdate);
    return () => window.removeEventListener("rulilura:history-updated", onUpdate);
  }, [sheetType]);

  const items = useMemo(() => (Array.isArray(list) ? list : []).slice(0, 50), [list]);

  function handleRestore(item) {
    if (!onRestoreState) return;

    const restored = restoreHistoryItem(item);
    if (!restored) {
      alert("復元に失敗しました（データが壊れている可能性があります）");
      return;
    }

    const ok = window.confirm("この履歴の状態に復元します。\n現在の編集内容は上書きされます。よろしいですか？");
    if (!ok) return;

    onRestoreState(restored);
  }

  function handleDelete(id) {
    const ok = window.confirm("この履歴を削除します。よろしいですか？");
    if (!ok) return;
    const next = deleteHistory(sheetType, id);
    setList(Array.isArray(next) ? next : []);
  }

  function handleClearAll() {
    const ok = window.confirm("履歴を全削除します。よろしいですか？");
    if (!ok) return;
    clearHistory(sheetType);
    setList([]);
    setTagDraft({});
  }

  function handleSaveTags(id) {
    const raw = tagDraft?.[id] ?? "";
    const next = updateHistoryItem(sheetType, id, { tags: raw });
    setList(Array.isArray(next) ? next : []);
  }

  return (
    <section className="panel history">
      <div
        className="panel-title"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
      >
        <span>履歴</span>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="sheet-btn" onClick={reload}>
            再読込
          </button>
          <button type="button" className="sheet-btn" onClick={handleClearAll} disabled={items.length === 0}>
            全削除
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ opacity: 0.7 }}>履歴がありません（「履歴に保存」を押すと追加されます）</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((it) => {
            const tags = Array.isArray(it.tags) ? it.tags : [];
            const draft = tagDraft?.[it.id] ?? "";

            return (
              <div
                key={it.id}
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 10,
                  padding: 10,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {fmtAt(it.at)}
                  {it.message ? ` / ${it.message}` : ""}
                </div>

                {/* ★タグ表示 */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {tags.length === 0 ? (
                    <span style={{ fontSize: 12, opacity: 0.6 }}>（タグなし）</span>
                  ) : (
                    tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 999,
                          border: "1px solid rgba(0,0,0,0.12)",
                          opacity: 0.85,
                        }}
                      >
                        #{t}
                      </span>
                    ))
                  )}
                </div>

                {/* ★タグ編集 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
                  <input
                    className="sheet-input"
                    value={draft}
                    placeholder="タグ（カンマ区切り）例: ボス戦, 1話, 仮"
                    onChange={(e) => setTagDraft((p) => ({ ...(p ?? {}), [it.id]: e.target.value }))}
                  />
                  <button type="button" className="sheet-btn" onClick={() => handleSaveTags(it.id)}>
                    タグ保存
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="sheet-btn"
                    onClick={() => handleRestore(it)}
                    disabled={!onRestoreState}
                    title={!onRestoreState ? "復元先(setState)が渡されていません" : ""}
                  >
                    復元
                  </button>

                  <button type="button" className="sheet-btn" onClick={() => handleDelete(it.id)}>
                    削除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75, lineHeight: 1.6 }}>
        ※ 最新 {items.length} 件を表示（最大 50 件）
      </div>
    </section>
  );
}
