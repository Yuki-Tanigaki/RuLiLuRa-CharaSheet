// src/pages/sheets/catalogSheet/CatalogSheet.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useCatalog } from "@/context/CatalogProvider.jsx";
import { useCatalogSheetModel } from "./useCatalogSheetModel.js";

/**
 * 入力ミスを減らすため、型ごとに適した入力UIを使う
 */
function FieldEditor({ field, value, onChange }) {
  const type = String(field.type ?? "string");
  const key = String(field.key ?? "");
  const isMemoLike =
    key === "memo" || (type === "string" && String(value ?? "").length >= 60);

  if (type === "boolean") {
    return (
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span style={{ fontSize: 12, opacity: 0.8 }}>true / false</span>
      </label>
    );
  }

  if (type === "string[]") {
    return (
      <textarea
        className="sheet-input"
        style={{ minHeight: 70, resize: "vertical" }}
        value={Array.isArray(value) ? value.join("\n") : String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder="1行=1要素（またはカンマ区切り）"
      />
    );
  }

  if (type === "number" || type === "int") {
    return (
      <input
        className="sheet-input"
        style={{ width: "100%" }}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (type !== "string") {
    return (
      <textarea
        className="sheet-input"
        style={{
          minHeight: 90,
          resize: "vertical",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
        value={
          value && typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value ?? "")
        }
        onChange={(e) => onChange(e.target.value)}
        placeholder='JSON（例: { "a": 1 }）'
      />
    );
  }

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
      style={{ width: "100%" }}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * 表示用に値を安全に文字列化する
 */
function renderCellValue(v) {
  if (v == null) return "—";
  if (typeof v === "string") return v.trim() === "" ? "—" : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export default function CatalogSheet({ userCatalog, setUserCatalog }) {
  const catalog = useCatalog();
  const m = useCatalogSheetModel({ userCatalog, setUserCatalog });
  const { categories, listMasterRows, listUserRows, addRow, updateRow, removeRow } =
    m;

  const [active, setActive] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active && categories.length > 0) {
      setActive(categories[0].key);
    }
  }, [active, categories]);

  const catDef = useMemo(() => {
    if (!active) return null;
    try {
      return catalog.getCategory(active);
    } catch {
      return null;
    }
  }, [catalog, active]);

  const masterRows = useMemo(() => (active ? listMasterRows(active) : []), [
    listMasterRows,
    active,
  ]);
  const userRows = useMemo(() => (active ? listUserRows(active) : []), [
    listUserRows,
    active,
  ]);

  const idField = String(catDef?.idField || "id");
  const nameField = String(catDef?.nameField || "name");

  const fieldsFromDef = Array.isArray(catDef?.fields) ? catDef.fields : [];

  /**
   * 定義がないカテゴリでも、実データから入力項目を推定して編集できるようにする
   */
  const inferredFields = useMemo(() => {
    if (fieldsFromDef.length > 0) return fieldsFromDef;

    const keys = new Set();
    for (const r of masterRows) {
      if (!r || typeof r !== "object") continue;
      for (const k of Object.keys(r)) keys.add(k);
    }
    keys.delete(idField);
    keys.delete(nameField);

    const list = Array.from(keys).sort((a, b) =>
      String(a).localeCompare(String(b), "ja")
    );

    const guessType = (k) => {
      for (const r of masterRows) {
        const v = r?.[k];
        if (v == null) continue;
        if (typeof v === "boolean") return "boolean";
        if (typeof v === "number") return "number";
        if (Array.isArray(v) && v.every((x) => typeof x === "string"))
          return "string[]";
        if (typeof v === "string") return "string";
        if (typeof v === "object") return "object";
      }
      return "string";
    };

    return list.map((k) => ({
      key: k,
      type: guessType(k),
      required: false,
    }));
  }, [fieldsFromDef, masterRows, idField, nameField]);

  /**
   * フォームの並びを一定にする（id / name + そのカテゴリの属性）
   */
  const editorFields = useMemo(() => {
    const out = [];

    out.push({
      key: nameField,
      type: "string",
      required: true,
      label: nameField,
    });

    const seen = new Set([idField, nameField]);
    for (const f of inferredFields) {
      const k = String(f?.key ?? "");
      if (!k) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(f);
    }
    return out;
  }, [inferredFields, idField, nameField]);

  /**
   * ルールブック表のカラム順を安定化させる
   */
  const masterColumns = useMemo(() => {
    const rows = Array.isArray(masterRows) ? masterRows : [];
    const keySet = new Set();
    for (const r of rows) {
      if (!r || typeof r !== "object") continue;
      for (const k of Object.keys(r)) keySet.add(k);
    }
    keySet.delete(idField);
    keySet.delete(nameField);
    const rest = Array.from(keySet).sort((a, b) =>
      String(a).localeCompare(String(b), "ja")
    );
    return [idField, nameField, ...rest];
  }, [masterRows, idField, nameField]);

  return (
    <div className="page sheet" style={{ padding: 16, overflowX: "hidden" }}>
      <div style={{ fontSize: 18, fontWeight: 900 }}>自作データ編集</div>

      {/* カテゴリ切替 */}
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

      {!catDef ? (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            border: "1px solid rgba(0,0,0,0.2)",
            borderRadius: 10,
          }}
        >
          master 定義が見つかりません: <code>{active || "(empty)"}</code>
        </div>
      ) : (
        <>
          {error && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                border: "1px solid rgba(220,0,0,0.35)",
                borderRadius: 10,
                color: "crimson",
                whiteSpace: "pre-wrap",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 16,
              marginTop: 16,
            }}
          >
            {/* 自作データ（上） */}
            <section className="panel" style={{ padding: 12 }}>
              <div
                className="panel-title"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span>自作データ</span>
                <button
                  type="button"
                  className="sheet-btn primary"
                  onClick={() => {
                    const r = addRow(active);
                    setError(r.message || "");
                  }}
                >
                  ＋ 追加
                </button>
              </div>

              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                件数: {userRows.length}
              </div>

              {userRows.length === 0 ? (
                <div style={{ marginTop: 10, opacity: 0.75 }}>
                  まだありません。
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {userRows.map((row, idx) => (
                    <div
                      key={`${active}-${idx}`}
                      style={{
                        border: "1px solid rgba(0,0,0,0.12)",
                        borderRadius: 12,
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>
                          #{idx + 1} / {row?.[idField]} /{" "}
                          {row?.[nameField] || "(no name)"}
                        </div>
                        <button
                          type="button"
                          className="sheet-btn"
                          onClick={() => {
                            const r = removeRow(active, idx);
                            setError(r.message || "");
                          }}
                        >
                          削除
                        </button>
                      </div>

                      {/* 入力フォーム */}
                      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                        {editorFields.map((f) => {
                          const k = String(f.key);
                          const v = row?.[k];
                          const label = String(f.label ?? k);
                          const type = String(f.type ?? "string");
                          const required = !!f.required;
                          const readOnly = !!f.readOnly;

                          return (
                            <div
                              key={`${active}-${idx}-${k}`}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "180px 1fr",
                                gap: 10,
                                alignItems: "start",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  opacity: 0.85,
                                  paddingTop: 6,
                                }}
                              >
                                {label}
                                {required ? (
                                  <span
                                    style={{ color: "crimson", marginLeft: 6 }}
                                  >
                                    *
                                  </span>
                                ) : null}
                                <div
                                  style={{
                                    fontSize: 11,
                                    opacity: 0.7,
                                    fontWeight: 600,
                                  }}
                                >
                                  {type}
                                </div>
                              </div>

                              {readOnly ? (
                                <input
                                  className="sheet-input"
                                  style={{ width: "100%", opacity: 0.9 }}
                                  value={String(v ?? "")}
                                  readOnly
                                />
                              ) : (
                                <FieldEditor
                                  field={f}
                                  value={v}
                                  onChange={(nextVal) => {
                                    const r = updateRow(active, idx, {
                                      [k]: nextVal,
                                    });
                                    setError(r.message || "");
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ルールブック（下） */}
            <section className="panel" style={{ padding: 12, overflowX: "hidden" }}>
              <div className="panel-title">ルールブック</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                {catDef?.label ?? active} / 件数: {masterRows.length}
              </div>

              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    width: "100%",
                    maxHeight: "60vh",
                    overflowX: "auto",
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                    border: "1px solid rgba(0,0,0,0.3)",
                    borderRadius: 8,
                  }}
                >
                  <table
                    className="sheet-table"
                    style={{
                      width: 1400,
                      tableLayout: "fixed",
                      borderCollapse: "collapse",
                      textAlign: "center",
                    }}
                  >
                    <thead>
                      <tr>
                        {masterColumns.map((col) => (
                          <th
                            key={col}
                            style={{
                              border: "1px solid #111",
                              padding: "6px 8px",
                              width:
                                col === idField
                                  ? 90
                                  : col === nameField
                                  ? 260
                                  : 220,
                            }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {masterRows.map((r, idx) => (
                        <tr key={String(r?.[idField] ?? idx)}>
                          {masterColumns.map((col) => (
                            <td
                              key={col}
                              style={{
                                border: "1px solid #111",
                                padding: "4px 6px",
                                whiteSpace: col === "memo" ? "normal" : "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {renderCellValue(r?.[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
