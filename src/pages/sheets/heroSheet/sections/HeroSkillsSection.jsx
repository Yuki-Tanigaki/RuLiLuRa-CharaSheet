// src/pages/sheets/heroSheet/sections/HeroSkillsSection.jsx
import React, { useMemo } from "react";
import { TextCell } from "../components/TextCell.jsx";
import { NumCell } from "../components/NumCell.jsx";

function heroSkillKeyOfRow(row) {
  if (!row) return "";
  if (row.kind === "master") {
    const id = row.id ?? null;
    return id == null ? "" : `m:${String(id)}`;
  }
  const name = String(row.name ?? "").trim().toLowerCase();
  return name ? `c:${name}` : "";
}

export function HeroSkillsSection({ model }) {
  const { editable, isCreate, setField, masterHeroSkills, heroMasterById, heroSkillRows, heroRowLabel } = model;

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
      return [...cur, { kind: "master", id: null, level: 1 }];
    });
  }

  function addCustomRow() {
    setField(["heroSkills", "rows"], (prev) => {
      const cur = Array.isArray(prev) ? prev : [];
      return [...cur, { kind: "custom", name: "", level: 1 }];
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
              ＋ マスターから追加
            </button>
            <button type="button" className="sheet-btn" onClick={addCustomRow}>
              ＋ 自由入力で追加
            </button>
          </div>
        )}
      </div>

      <table className="sheet-table">
        <thead>
          <tr>
            <th>英雄スキル</th>
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
              const isMaster = row?.kind === "master";
              const label = heroRowLabel(row);
              const selfKey = heroSkillKeyOfRow(row);

              return (
                <tr key={i}>
                  <td>
                    {!editable ? (
                      label
                    ) : isMaster ? (
                      <select
                        className="sheet-input"
                        value={row?.id ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const nextId = v === "" ? null : Number(v);
                          const nextKey = nextId == null ? "" : `m:${String(nextId)}`;

                          // 重複禁止
                          if (nextKey && takenKeys.has(nextKey) && nextKey !== selfKey) return;

                          updateRow(i, { kind: "master", id: nextId });
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
                    ) : (
                      <TextCell
                        editable={editable}
                        value={row?.name ?? ""}
                        placeholder="自由入力（英雄スキル名）"
                        onCommit={(v) => updateRow(i, { kind: "custom", name: v })}
                      />
                    )}
                  </td>

                  <td className="num">
                    {!editable ? (
                      Number(row?.level ?? 1) || 1
                    ) : (
                      <NumCell
                        editable={editable}
                        value={row?.level ?? 1}
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
