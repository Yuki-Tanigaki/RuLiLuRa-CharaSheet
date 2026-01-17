// src/pages/sheets/divaSheet/sections/SkillsSection.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { NumCell } from "../../components/NumCell.jsx";
import { safeNum } from "../../common/utils/number.js";

import {
  SKILL_ID_ARCHAIA_KNOWLEDGE,
  SKILL_ID_DIVA_ART_KNOWLEDGE,
  SKILL_ID_BUG_KNOWLEDGE,
  SKILL_ID_EVADE,
  SKILL_ID_HIDE,
  SKILL_ID_COOKING,
} from "../../../data/skillsMaster.js";

// 歌姫：create時に固定で受け取るスキル
const DIVA_CREATE_FIXED_SKILLS = [
  { kind: "master", id: SKILL_ID_ARCHAIA_KNOWLEDGE, level: 20 },
  { kind: "master", id: SKILL_ID_DIVA_ART_KNOWLEDGE, level: 15 },
  { kind: "master", id: SKILL_ID_BUG_KNOWLEDGE, level: 15 },
  { kind: "master", id: SKILL_ID_EVADE, level: 10 },
  { kind: "master", id: SKILL_ID_HIDE, level: 5 },
  { kind: "master", id: SKILL_ID_COOKING, level: 5 },
];

function skillKeyOfRow(row) {
  if (!row) return "";
  if (row.kind === "master") {
    const id = row.id ?? null;
    return id == null ? "" : `m:${String(id)}`;
  }
  // custom は今後扱わない（過去データが残っていても重複判定から除外）
  return "";
}

export function SkillsSection({ model }) {
  const { editable, isCreate, masterSkills, skillRows, rowLabel, setField } = model;

  // -----------------------------
  // create初期化は “入った最初の1回だけ”
  // 歌姫は固定スキルを付与する（選択・ポイント・ボーナス・unlock無し）
  // -----------------------------
  const didInitCreateRef = useRef(false);

  useEffect(() => {
    if (!isCreate) {
      didInitCreateRef.current = false;
      return;
    }
    if (didInitCreateRef.current) return;
    didInitCreateRef.current = true;

    setField(["skills", "rows"], (rowsPrev) => {
      const prev = Array.isArray(rowsPrev) ? rowsPrev : [];
      const next = DIVA_CREATE_FIXED_SKILLS.map((r) => ({ ...r }));

      // すでに同一なら更新しない（無駄な再レンダー防止）
      const same =
        prev.length === next.length &&
        prev.every((p, i) => {
          const a = p ?? {};
          const b = next[i] ?? {};
          return a.kind === b.kind && Number(a.id ?? -1) === Number(b.id ?? -2) && Number(a.level ?? 0) === Number(b.level ?? 0);
        });

      return same ? rowsPrev : next;
    });
  }, [isCreate, setField]);

  const displayRows = useMemo(() => {
    const rows = Array.isArray(skillRows) ? skillRows : [];
    return rows;
  }, [skillRows]);

  const takenSkillKeys = useMemo(() => {
    const set = new Set();
    for (const r of displayRows) {
      const key = skillKeyOfRow(r);
      if (key) set.add(key);
    }
    return set;
  }, [displayRows]);

  // non-create 用：更新（歌姫は通常時は増減OK、create時だけ固定）
  function updateSkillRow(index, patch) {
    setField(["skills", "rows"], (rowsPrev) => {
      const rows = Array.isArray(rowsPrev) ? rowsPrev : [];
      return rows.map((r, i) => (i === index ? { ...(r ?? {}), ...patch } : r));
    });
  }

  function addMasterSkillRow() {
    if (isCreate) return;
    setField(["skills", "rows"], (rowsPrev) => {
      const rows = Array.isArray(rowsPrev) ? rowsPrev : [];
      return [...rows, { kind: "master", id: null, level: 10 }];
    });
  }

  function removeSkillRow(index) {
    if (isCreate) return;
    setField(["skills", "rows"], (rowsPrev) => {
      const rows = Array.isArray(rowsPrev) ? rowsPrev : [];
      return rows.filter((_, i) => i !== index);
    });
  }

  return (
    <section className="panel skills">
      <div className="panel-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>スキル欄</span>

        {editable && !isCreate && (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="sheet-btn" onClick={addMasterSkillRow}>
              ＋ 追加
            </button>
          </div>
        )}
      </div>

      {isCreate && (
        <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.85, lineHeight: 1.6 }}>
          ※ 歌姫は create モードでスキルを選びません。<br />
          ※ 下記の <b>固定スキル</b> を受け取ります（編集不可）。
        </div>
      )}

      <table className="sheet-table skills-table">
        <thead>
          <tr>
            <th>スキル</th>
            <th style={{ width: 90 }}>Lv</th>
            {editable && !isCreate && <th style={{ width: 70 }}>操作</th>}
          </tr>
        </thead>

        <tbody>
          {displayRows.length === 0 ? (
            <tr>
              <td colSpan={editable && !isCreate ? 3 : 2} style={{ opacity: 0.7 }}>
                —
              </td>
            </tr>
          ) : (
            displayRows.map((row, i) => {
              const isMaster = row?.kind === "master";
              const label = rowLabel(row);
              const lv = safeNum(row?.level, 0);

              const selfKey = skillKeyOfRow(row);
              const locked = isCreate; // create中は固定（編集不可）

              return (
                <tr key={i}>
                  <td>
                    {!editable || locked ? (
                      label
                    ) : isMaster ? (
                      <select
                        className="sheet-input"
                        value={row?.id ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const nextId = v === "" ? null : Number(v);
                          const nextKey = nextId == null ? "" : `m:${String(nextId)}`;
                          if (nextKey && takenSkillKeys.has(nextKey) && nextKey !== selfKey) return;
                          updateSkillRow(i, { kind: "master", id: nextId });
                        }}
                      >
                        <option value="">（選択）</option>
                        {masterSkills.map((sk) => {
                          const id = sk?.id ?? sk?.skillId;
                          const key = id == null ? "" : `m:${String(id)}`;
                          const disabled = !!(key && takenSkillKeys.has(key) && key !== selfKey);

                          return (
                            <option key={String(id)} value={id} disabled={disabled}>
                              {sk?.name ?? sk?.label ?? sk?.skillName ?? sk?.title ?? String(id)}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <span style={{ opacity: 0.85 }}>{label}</span>
                    )}
                  </td>

                  <td className="num">
                    {!editable || locked ? (
                      lv
                    ) : (
                      <NumCell
                        editable={editable}
                        value={row?.level}
                        min={0}
                        max={99}
                        className="num"
                        onCommit={(v) => setField(["skills", "rows", i, "level"], v)}
                      />
                    )}
                  </td>

                  {editable && !isCreate && (
                    <td className="num">
                      <button type="button" className="sheet-btn" onClick={() => removeSkillRow(i)}>
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
