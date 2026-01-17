// src/pages/sheets/divaSheet/sections/DivaSkillsSection.jsx
import React, { useMemo } from "react";
import { NumCell } from "../../components/NumCell.jsx";

function divaSkillKeyOfRow(row) {
  if (!row) return "";
  // 以後は master のみ扱う（過去データの custom も master 扱いに寄せる）
  const id = row.id ?? null;
  return id == null ? "" : `m:${String(id)}`;
}

export function DivaSkillsSection({ model }) {
  const { editable, isCreate, setField, masterDivaSkills, divaSkillRows, divaRowLabel } = model;

  // createでは何もしない（表示もしない）
  if (isCreate) return null;

  const master = Array.isArray(masterDivaSkills) ? masterDivaSkills : [];
  const rows = Array.isArray(divaSkillRows) ? divaSkillRows : [];

  const takenKeys = useMemo(() => {
    const set = new Set();
    for (const r of rows) {
      const k = divaSkillKeyOfRow(r);
      if (k) set.add(k);
    }
    return set;
  }, [rows]);

  function updateRow(index, patch) {
    setField(["divaSkills", "rows"], (prev) => {
      const cur = Array.isArray(prev) ? prev : [];
      return cur.map((r, i) => (i === index ? { ...(r ?? {}), ...patch } : r));
    });
  }

  function addMasterRow() {
    setField(["divaSkills", "rows"], (prev) => {
      const cur = Array.isArray(prev) ? prev : [];
      return [...cur, { kind: "master", id: null, level: 1 }];
    });
  }

  function removeRow(index) {
    setField(["divaSkills", "rows"], (prev) => {
      const cur = Array.isArray(prev) ? prev : [];
      return cur.filter((_, i) => i !== index);
    });
  }

  return (
    <section className="panel diva-skills">
      <div className="panel-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>歌姫スキル欄</span>

        {editable && (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="sheet-btn" onClick={addMasterRow}>
              ＋ 追加
            </button>
          </div>
        )}
      </div>

      <table className="sheet-table">
        <thead>
          <tr>
            <th>歌姫スキル</th>
            <th style={{ width: 90 }}>Lv</th>
            {editable && <th style={{ width: 70 }}>操作</th>}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={editable ? 3 : 2} style={{ opacity: 0.7 }}>
                —
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              // 過去データで custom が残っていても UI は master として扱う
              const rowAsMaster = { ...(row ?? {}), kind: "master" };

              const label = divaRowLabel(rowAsMaster);
              const selfKey = divaSkillKeyOfRow(rowAsMaster);

              return (
                <tr key={i}>
                  <td>
                    {!editable ? (
                      label
                    ) : (
                      <select
                        className="sheet-input"
                        value={rowAsMaster?.id ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const nextId = v === "" ? null : Number(v);
                          const nextKey = nextId == null ? "" : `m:${String(nextId)}`;

                          // 重複禁止
                          if (nextKey && takenKeys.has(nextKey) && nextKey !== selfKey) return;

                          updateRow(i, { kind: "master", id: nextId, name: undefined });
                        }}
                      >
                        <option value="">（選択）</option>
                        {master.map((sk) => {
                          const id = Number(sk?.id);
                          const key = Number.isFinite(id) ? `m:${String(id)}` : "";
                          const disabled = !!(key && takenKeys.has(key) && key !== selfKey);

                          return (
                            <option key={String(sk?.id)} value={String(sk?.id)} disabled={disabled}>
                              {sk?.name ?? String(sk?.id)}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </td>

                  <td className="num">
                    {!editable ? (
                      Number(rowAsMaster?.level ?? 1) || 1
                    ) : (
                      <NumCell
                        editable={editable}
                        value={rowAsMaster?.level ?? 1}
                        min={0}
                        max={99}
                        className="num"
                        onCommit={(v) => updateRow(i, { level: v })}
                      />
                    )}
                  </td>

                  {editable && (
                    <td className="num">
                      <button type="button" className="sheet-btn" onClick={() => removeRow(i)}>
                        削除
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
}
