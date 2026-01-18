// src/pages/sheets/catalogSheet/CatalogSheet.jsx
import React, { useMemo, useState } from "react";
import config from "/data/registry.json";
import { useCatalogSheetModel } from "./useCatalogSheetModel.js";

function FieldEditor({ field, value, onChange }) {
  const type = String(field.type);
  const key = String(field.key);

  const commonStyle = { width: "100%" };

  // memo は textarea 優先
  const isMemoLike = key === "memo" || (type === "string" && String(value ?? "").length >= 60);

  if (type === "boolean") {
    return (
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span style={{ fontSize: 12, opacity: 0.8 }}>true/false</span>
      </label>
    );
  }

  if (type === "string[]") {
    return (
      <textarea
        className="sheet-input"
        style={{ minHeight: 70, resize: "vertical" }}
        value={Array.isArray(value) ? value.join("\n") : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"1行=1要素（またはカンマ区切り）"}
      />
    );
  }

  if (type === "number" || type === "int") {
    return (
      <input
        className="sheet-input"
        style={commonStyle}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  // object系
  if (type !== "string") {
    return (
      <textarea
        className="sheet-input"
        style={{ minHeight: 90, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        value={value && typeof value === "object" ? JSON.stringify(value, null, 2) : String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder='JSON（例: { "a": 1 }）'
      />
    );
  }

  // string
  if (isMemoLike) {
    return (
      <textarea
        className="sheet-input"
        style={{ minHeight: 90, resize: "vertical" }}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      className="sheet-input"
      style={commonStyle}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function CatalogSheet({ state, setState }) {
  const m = useCatalogSheetModel({ state, setState });
  const { categories, listMasterRows, listUserRows, addRow, updateRow, removeRow } = m;

  const [active, setActive] = useState(categories?.[0]?.key ?? "skill");
  const [error, setError] = useState("");

  const catDef = config?.categories?.[active];
  const masterRows = useMemo(() => listMasterRows(active), [active]);
  const userRows = useMemo(() => listUserRows(active), [active, state?.userCatalog]);

  const idField = String(catDef?.idField || "id");
  const nameField = String(catDef?.nameField || "name");
  const fields = Array.isArray(catDef?.fields) ? catDef.fields : [];

  const masterColumns = useMemo(() => {
    const rows = Array.isArray(masterRows) ? masterRows : [];
    const keySet = new Set();

    for (const r of rows) {
      if (!r || typeof r !== "object") continue;
      for (const k of Object.keys(r)) keySet.add(k);
    }

    // id/name は先頭固定
    keySet.delete(idField);
    keySet.delete(nameField);

    const rest = Array.from(keySet).sort((a, b) => String(a).localeCompare(String(b), "ja"));
    return [idField, nameField, ...rest];
  }, [masterRows, idField, nameField]);

  const renderCellValue = (v) => {
    if (v == null) return "—";
    if (typeof v === "string") return v.trim() === "" ? "—" : v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };

  return (
    <div className="page sheet" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>自作データ編集</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className="sheet-btn"
            onClick={() => {
              setActive(c.key);
              setError("");
            }}
            style={{
              borderRadius: 999,
              opacity: active === c.key ? 1 : 0.75,
              background: active === c.key ? "#111" : "#fff",
              color: active === c.key ? "#fff" : "#111",
            }}
          >
            {c.def?.label ?? c.key}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginTop: 12, padding: 10, border: "1px solid rgba(220,0,0,0.35)", borderRadius: 10, color: "crimson" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginTop: 16 }}>
        {/* Master preview */}
        <section className="panel" style={{ padding: 12 }}>
          <div className="panel-title">ルールブック</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
            {catDef?.label ?? active} / 件数: {masterRows.length}
          </div>

          <div style={{ marginTop: 10 }}>
            {/* 横スクロール領域 */}
            <div
              style={{
                overflowX: "auto",
                overflowY: "visible",
                WebkitOverflowScrolling: "touch",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: 8,
              }}
            >
              {/* max-content にして「列が増えた分だけ横に伸びる」 */}
              <table className="sheet-table" style={{ width: "max-content", minWidth: "100%" }}>
                <thead>
                  <tr>
                    {masterColumns.map((col) => (
                      <th key={col} style={col === idField ? { width: 90 } : col === nameField ? { width: 260 } : undefined}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {masterRows.slice(0, 50).map((r, idx) => (
                    <tr key={String(r?.[idField] ?? idx)}>
                      {masterColumns.map((col) => {
                        const text = renderCellValue(r?.[col]);
                        const isLongText = col === "memo"; // memo だけ折り返し等したいならここを増やす
                        return (
                          <td key={col} style={isLongText ? { whiteSpace: "normal", minWidth: 240 } : undefined}>
                            {text}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {masterRows.length > 50 && (
                    <tr>
                      <td colSpan={masterColumns.length} style={{ opacity: 0.75 }}>
                        …省略（先頭50件のみ表示）
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* User editor */}
        <section className="panel" style={{ padding: 12 }}>
          <div className="panel-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span>独自データ（編集）</span>

            <button
              type="button"
              className="sheet-btn primary"
              onClick={() => {
                const r = addRow(active);
                setError(r.ok ? "" : r.message);
              }}
            >
              ＋ 追加
            </button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>件数: {userRows.length}</div>

          {userRows.length === 0 ? (
            <div style={{ marginTop: 10, opacity: 0.75 }}>まだありません。</div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {userRows.map((row, idx) => (
                <div key={`${active}-${idx}`} style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 800 }}>
                      #{idx + 1} / {row?.[idField]} / {row?.[nameField] || "(no name)"}
                    </div>

                    <button
                      type="button"
                      className="sheet-btn"
                      onClick={() => removeRow(active, idx)}
                    >
                      削除
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                    {fields.map((f) => {
                      const k = String(f.key);
                      const v = row?.[k];

                      return (
                        <div key={`${active}-${idx}-${k}`} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10, alignItems: "start" }}>
                          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85, paddingTop: 6 }}>
                            {k}
                            {f.required ? <span style={{ color: "crimson", marginLeft: 6 }}>*</span> : null}
                            <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>{String(f.type)}</div>
                          </div>

                          <FieldEditor
                            field={f}
                            value={v}
                            onChange={(nextVal) => {
                              const patch = { [k]: nextVal };
                              const r = updateRow(active, idx, patch);
                              setError(r.ok ? "" : r.message);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
