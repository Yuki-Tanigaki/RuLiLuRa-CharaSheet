// src/pages/sheets/heroSheet/sections/HeroSkillsSection.jsx
import React, { useMemo } from "react";
import { TextCell } from "/src/pages/sheets/components/TextCell.jsx";

function heroSkillKeyOfRow(row) {
  if (!row) return "";
  // 以後は master のみ扱う（過去データの custom も master 扱いに寄せる）
  const id = row.id ?? null;
  return id == null ? "" : `m:${String(id)}`;
}

export function HeroSkillsSection({ model }) {
  const { editable, isCreate, setField, masterHeroSkills, heroSkillRows, heroRowLabel } = model;

  // createでは何もしない（表示もしない）
  if (isCreate) return null;

  const master = Array.isArray(masterHeroSkills) ? masterHeroSkills : [];
  const rows = Array.isArray(heroSkillRows) ? heroSkillRows : [];

  const takenKeys = useMemo(() => {
    const set = new Set();
    for (const r of rows) {
      const k = heroSkillKeyOfRow(r);
      if (k) set.add(k);
    }
    return set;
  }, [rows]);

  function updateRow(index, patch) {
    setField(["heroSkills", "rows"], (prev) => {
      const cur = Array.isArray(prev) ? prev : [];
      return cur.map((r, i) => (i === index ? { ...(r ?? {}), ...patch } : r));
    });
  }

  function addMasterRow() {
    setField(["heroSkills", "rows"], (prev) => {
      const cur = Array.isArray(prev) ? prev : [];
      // level は廃止。memo を追加
      return [...cur, { kind: "master", id: null, memo: "" }];
    });
  }

  function removeRow(index) {
    setField(["heroSkills", "rows"], (prev) => {
      const cur = Array.isArray(prev) ? prev : [];
      return cur.filter((_, i) => i !== index);
    });
  }

  return (
    <section className="panel hero-skills">
      <div className="panel-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>英雄スキル欄</span>

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
            <th style={{ width: 220 }}>英雄スキル</th>
            <th>メモ</th>
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
              // 過去データで level/custom が残っていても UI は master として扱う
              const rowAsMaster = { ...(row ?? {}), kind: "master" };

              const label = heroRowLabel(rowAsMaster);
              const selfKey = heroSkillKeyOfRow(rowAsMaster);

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

                          // 既存 memo は保持（name/level は使わない）
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

                  <td>
                    {!editable ? (
                      <span style={{ whiteSpace: "pre-wrap" }}>{String(rowAsMaster?.memo ?? "") || "—"}</span>
                    ) : (
                      <TextCell
                        editable={editable}
                        value={rowAsMaster?.memo ?? ""}
                        placeholder="メモ"
                        multiline
                        onCommit={(v) => updateRow(i, { memo: v })}
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
