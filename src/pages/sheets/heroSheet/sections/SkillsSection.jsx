// src/pages/sheets/heroSheet/sections/SkillsSection.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { TextCell } from "../components/TextCell.jsx";
import { NumCell } from "../components/NumCell.jsx";
import { catalogKeyOf, kindLabel, safeNum } from "../heroSheetUtils.js";

const CREATE_SKILL_COUNT = 8;
const CREATE_BASE_LEVELS = [5, 10, 15, 20];
const CREATE_BASE_SUM_LIMIT = 80;

function normalizeIndex(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeTargets(indices, { skillRows, rowLabel }) {
  const set = new Set();
  for (const x of indices) {
    const n = normalizeIndex(x);
    if (n == null) continue;
    if (!skillRows?.[n]) continue;
    const label = rowLabel(skillRows[n]);
    if (!label || label === "—") continue;
    set.add(n);
    if (set.size >= 2) break;
  }
  return Array.from(set);
}

function skillKeyOfRow(row) {
  if (!row) return "";
  if (row.kind === "master") {
    const id = row.id ?? null;
    return id == null ? "" : `m:${String(id)}`;
  }
  // custom
  const name = String(row.name ?? "").trim().toLowerCase();
  return name ? `c:${name}` : "";
}

export function SkillsSection({ model }) {
  const {
    editable,
    isCreate,
    masterSkills,
    skillRows,
    rowLabel,
    intBonusTargets,
    dexBonusTargets,
    intBonusValue,
    dexBonusValue,
    setField,
    createUnlockTargets,
    addToInventory,
    removeFromInventory,
    s,
  } = model;

  const freeItemPicks = s.skills?.freeItemPicks ?? {};
  const freeItemClaims = s.skills?.freeItemClaims ?? {};

  // draft（未確定）と confirmed（確定済み）の二段階にする
  const bonusDraft = s.skills?.bonusDraft ?? { int: [], dex: [] };
  const bonusConfirmed = !!s.skills?.bonusConfirmed;

  const canUseIntBonus = safeNum(intBonusValue, 0) > 0;
  const canUseDexBonus = safeNum(dexBonusValue, 0) > 0;

  // -----------------------------
  // ★重要：create初期化は “入った最初の1回だけ”
  // setField が毎回新しくてもリセットされないようにする
  // -----------------------------
  const didInitCreateRef = useRef(false);

  useEffect(() => {
    if (!isCreate) {
      didInitCreateRef.current = false;
      return;
    }
    if (didInitCreateRef.current) return;
    didInitCreateRef.current = true;

    // rows: 8固定 & baseLevel補完（必要な場合だけ更新）
    setField(["skills", "rows"], (rowsPrev) => {
      const rows0 = Array.isArray(rowsPrev) ? rowsPrev : [];
      let rows = rows0.map((r) => {
        const base = Number(r?.baseLevel);
        const baseLevel = Number.isFinite(base)
          ? base
          : CREATE_BASE_LEVELS.includes(Number(r?.level))
          ? Number(r?.level)
          : 10;
        // level は触らない（確定反映で変える）
        return { ...(r ?? {}), baseLevel };
      });

      if (rows.length < CREATE_SKILL_COUNT) {
        const addN = CREATE_SKILL_COUNT - rows.length;
        rows = [
          ...rows,
          ...Array.from({ length: addN }, () => ({
            kind: "master",
            id: null,
            level: 10,
            baseLevel: 10,
          })),
        ];
      } else if (rows.length > CREATE_SKILL_COUNT) {
        rows = rows.slice(0, CREATE_SKILL_COUNT);
      }

      // “変化がないなら” そのまま返して余計な再レンダーを防ぐ
      const same =
        rows0.length === rows.length &&
        rows0.every((r, i) => {
          const a = r ?? {};
          const b = rows[i] ?? {};
          return (
            a.kind === b.kind &&
            (a.id ?? null) === (b.id ?? null) &&
            String(a.name ?? "") === String(b.name ?? "") &&
            Number(a.level ?? 0) === Number(b.level ?? 0) &&
            Number(a.baseLevel ?? 0) === Number(b.baseLevel ?? 0)
          );
        });

      return same ? rowsPrev : rows;
    });

    // draft の初期形（無ければ作る。既にあるなら触らない）
    setField(["skills", "bonusDraft"], (prev) => {
      if (prev && typeof prev === "object" && (Array.isArray(prev.int) || Array.isArray(prev.dex))) return prev;
      return { int: [], dex: [] };
    });
  }, [isCreate, setField]);

  // -----------------------------
  // 表示用：create時は8行に固定して扱う
  // -----------------------------
  const displayRows = useMemo(() => {
    const rows = Array.isArray(skillRows) ? skillRows : [];
    if (!isCreate) return rows;
    return rows.slice(0, CREATE_SKILL_COUNT);
  }, [skillRows, isCreate]);

  // -----------------------------
  // 「すでに選ばれているスキル」を集計（重複禁止用）
  // - master: id 重複禁止
  // - custom: name(trim/lower) 重複 “警告”
  // -----------------------------
  const takenSkillKeys = useMemo(() => {
    const set = new Set();
    for (const r of displayRows) {
      const key = skillKeyOfRow(r);
      if (key) set.add(key);
    }
    return set;
  }, [displayRows]);

  const duplicateCustomNames = useMemo(() => {
    const counts = new Map();
    for (const r of displayRows) {
      if (r?.kind !== "custom") continue;
      const key = skillKeyOfRow(r);
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const dups = new Set();
    for (const [k, c] of counts.entries()) if (c >= 2) dups.add(k);
    return dups;
  }, [displayRows]);

  // -----------------------------
  // create: baseLevel 合計（= ボーナス除外）を計算
  // -----------------------------
  const baseSum = useMemo(() => {
    if (!isCreate) return 0;
    return displayRows.reduce((acc, r) => acc + safeNum(r?.baseLevel, 0), 0);
  }, [displayRows, isCreate]);

  const baseSumOk = !isCreate || baseSum <= CREATE_BASE_SUM_LIMIT;

  // -----------------------------
  // non-create 用：更新
  // -----------------------------
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

  function addCustomSkillRow() {
    if (isCreate) return;
    setField(["skills", "rows"], (rowsPrev) => {
      const rows = Array.isArray(rowsPrev) ? rowsPrev : [];
      return [...rows, { kind: "custom", name: "", level: 10 }];
    });
  }

  function removeSkillRow(index) {
    if (isCreate) return;
    setField(["skills", "rows"], (rowsPrev) => {
      const rows = Array.isArray(rowsPrev) ? rowsPrev : [];
      return rows.filter((_, i) => i !== index);
    });
    setField(["skills", "intBonusTargets"], (prev) => (Array.isArray(prev) ? prev.filter((x) => x !== index) : []));
    setField(["skills", "dexBonusTargets"], (prev) => (Array.isArray(prev) ? prev.filter((x) => x !== index) : []));
  }

  // -----------------------------
  // create：ベースLv変更（80制限を満たす選択肢だけ許可）
  // - 確定済みなら level も再計算
  // -----------------------------
  function setBaseLevelAt(index, nextBaseLevel) {
    setField(["skills"], (prevSkills) => {
      const p = prevSkills ?? {};
      const rowsPrev = Array.isArray(p.rows) ? p.rows : [];

      // 8行前提で合計評価（不足がある場合にも耐える）
      const baseSumNow = rowsPrev.slice(0, CREATE_SKILL_COUNT).reduce((acc, r, i) => {
        const base = Number.isFinite(Number(r?.baseLevel))
          ? Number(r.baseLevel)
          : CREATE_BASE_LEVELS.includes(Number(r?.level))
          ? Number(r.level)
          : 10;
        return acc + (i === index ? safeNum(nextBaseLevel, 0) : safeNum(base, 0));
      }, 0);

      if (baseSumNow > CREATE_BASE_SUM_LIMIT) {
        // 80超は変更しない（UI側でも disabled するが保険）
        return p;
      }

      const rows = rowsPrev.map((r, i) => {
        if (i !== index) return r;

        const base = nextBaseLevel;

        // 確定済みなら「確定targets」で再計算
        if (!isCreate || !p.bonusConfirmed) return { ...(r ?? {}), baseLevel: base };

        const intSet = new Set((p.intBonusTargets ?? []).map(Number));
        const dexSet = new Set((p.dexBonusTargets ?? []).map(Number));
        const addInt = safeNum(intBonusValue, 0);
        const addDex = safeNum(dexBonusValue, 0);

        let lv = base;
        if (intSet.has(i) && addInt > 0) lv += addInt;
        if (dexSet.has(i) && addDex > 0) lv += addDex;

        return { ...(r ?? {}), baseLevel: base, level: lv };
      });

      return { ...p, rows };
    });
  }

  // -----------------------------
  // “選べる” のはラベル確定済み行だけ（ボーナス選択用）
  // -----------------------------
  const selectableSkillRows = useMemo(() => {
    const rows = Array.isArray(skillRows) ? skillRows : [];
    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const label = rowLabel(rows[i]);
      if (!label || label === "—") continue;
      out.push({ index: i, label });
    }
    return out;
  }, [skillRows, rowLabel]);

  // -----------------------------
  // draft 更新（即時に level を触らない）
  // -----------------------------
  function setDraftTargets(type, indices) {
    const next = normalizeTargets(indices, { skillRows, rowLabel });
    setField(["skills", "bonusDraft"], (prev) => {
      const p = prev && typeof prev === "object" ? { ...prev } : { int: [], dex: [] };
      p[type] = next;
      return p;
    });
  }

  // -----------------------------
  // 確定：draft → confirmed として rows.level を一括反映
  // -----------------------------
  function confirmBonus() {
    if (!isCreate) return;
    if (!baseSumOk) return;

    setField(["skills"], (prevSkills) => {
      const p = prevSkills ?? {};
      const rowsPrev = Array.isArray(p.rows) ? p.rows : [];

      const draftInt = Array.isArray(p.bonusDraft?.int) ? p.bonusDraft.int : [];
      const draftDex = Array.isArray(p.bonusDraft?.dex) ? p.bonusDraft.dex : [];

      const intSet = new Set(draftInt.map(Number));
      const dexSet = new Set(draftDex.map(Number));

      const addInt = safeNum(intBonusValue, 0);
      const addDex = safeNum(dexBonusValue, 0);

      const rows = rowsPrev.map((r, i) => {
        const base = Number.isFinite(Number(r?.baseLevel))
          ? Number(r.baseLevel)
          : CREATE_BASE_LEVELS.includes(Number(r?.level))
          ? Number(r.level)
          : 10;

        let lv = base;
        if (intSet.has(i) && addInt > 0) lv += addInt;
        if (dexSet.has(i) && addDex > 0) lv += addDex;

        return { ...(r ?? {}), baseLevel: base, level: lv };
      });

      return {
        ...p,
        rows,
        intBonusTargets: Array.from(intSet),
        dexBonusTargets: Array.from(dexSet),
        bonusConfirmed: true,
      };
    });
  }

  // -----------------------------
  // 変更：確定解除。rows.level を base に戻す
  // -----------------------------
  function editBonus() {
    if (!isCreate) return;

    setField(["skills"], (prevSkills) => {
      const p = prevSkills ?? {};
      const rowsPrev = Array.isArray(p.rows) ? p.rows : [];

      const rows = rowsPrev.map((r) => {
        const base = Number.isFinite(Number(r?.baseLevel))
          ? Number(r.baseLevel)
          : CREATE_BASE_LEVELS.includes(Number(r?.level))
          ? Number(r.level)
          : 10;
        return { ...(r ?? {}), baseLevel: base, level: base };
      });

      return {
        ...p,
        rows,
        bonusConfirmed: false,
        intBonusTargets: [],
        dexBonusTargets: [],
      };
    });
  }

  // -----------------------------
  // 「スキルを選び直したら戻す」
  // - 確定済みの場合：その行が確定targetsに含まれていたら、確定解除＆Lvをbaseへ戻す＆draftも対象から外す
  // -----------------------------
  function cancelConfirmedIfRowAffected(index) {
    if (!isCreate) return;
    if (!bonusConfirmed) return;

    setField(["skills"], (prevSkills) => {
      const p = prevSkills ?? {};
      const intT = Array.isArray(p.intBonusTargets) ? p.intBonusTargets : [];
      const dexT = Array.isArray(p.dexBonusTargets) ? p.dexBonusTargets : [];
      const hit = intT.includes(index) || dexT.includes(index);
      if (!hit) return p;

      const rowsPrev = Array.isArray(p.rows) ? p.rows : [];
      const rows = rowsPrev.map((r, i) => {
        if (i !== index) return r;
        const base = Number.isFinite(Number(r?.baseLevel))
          ? Number(r.baseLevel)
          : CREATE_BASE_LEVELS.includes(Number(r?.level))
          ? Number(r.level)
          : 10;
        return { ...(r ?? {}), baseLevel: base, level: base };
      });

      const d = p.bonusDraft && typeof p.bonusDraft === "object" ? p.bonusDraft : { int: [], dex: [] };
      const nextDraft = {
        int: (Array.isArray(d.int) ? d.int : []).filter((x) => Number(x) !== index),
        dex: (Array.isArray(d.dex) ? d.dex : []).filter((x) => Number(x) !== index),
      };

      return {
        ...p,
        rows,
        bonusConfirmed: false,
        intBonusTargets: [],
        dexBonusTargets: [],
        bonusDraft: nextDraft,
      };
    });
  }

  function BonusPicker({ type, value, draftTargets }) {
    const canUse = value > 0;
    if (!isCreate) return null;

    if (!canUse) {
      return (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {type === "int" ? "知力" : "器用さ"}修正が＋ではないため、ボーナスはありません。
        </div>
      );
    }

    const t0 = draftTargets?.[0] ?? "";
    const t1 = draftTargets?.[1] ?? "";

    function setAt(pos, v) {
      const next = [t0, t1];
      next[pos] = v === "" ? "" : Number(v);

      const a0 = next[0] === "" ? "" : Number(next[0]);
      const a1 = next[1] === "" ? "" : Number(next[1]);

      const uniq = [];
      if (a0 !== "") uniq.push(a0);
      if (a1 !== "" && a1 !== a0) uniq.push(a1);

      setDraftTargets(type, uniq);
    }

    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 12, opacity: 0.9 }}>
          <b>{type === "int" ? "知力" : "器用さ"}</b>ボーナス：選んだスキル（最大2つ）に <b>+{value}</b>
          <span style={{ marginLeft: 8, opacity: 0.75 }}>（確定ボタンで反映）</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select className="sheet-input" value={t0 === "" ? "" : String(t0)} onChange={(e) => setAt(0, e.target.value)}>
            <option value="">（未選択）</option>
            {selectableSkillRows.map((r) => (
              <option key={`b0-${r.index}`} value={String(r.index)}>
                {r.label}
              </option>
            ))}
          </select>

          <select className="sheet-input" value={t1 === "" ? "" : String(t1)} onChange={(e) => setAt(1, e.target.value)}>
            <option value="">（未選択）</option>
            {selectableSkillRows.map((r) => (
              <option key={`b1-${r.index}`} value={String(r.index)}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.6 }}>
          ※ 先にスキル欄でスキル名を選択/入力してください。<br />
          ※ 同じスキルは2回選べません。
        </div>
      </div>
    );
  }

  // -----------------------------
  // フリーアイテム獲得：取り消し可能にする
  // -----------------------------
  function setFreePick(skillName, catalogKey) {
    setField(["skills", "freeItemPicks"], (prev) => {
      const obj = prev && typeof prev === "object" ? { ...prev } : {};
      obj[skillName] = catalogKey;
      return obj;
    });
  }

  function markClaimed(skillName, catalogKey) {
    setField(["skills", "freeItemClaims"], (prev) => {
      const obj = prev && typeof prev === "object" ? { ...prev } : {};
      obj[skillName] = catalogKey;
      return obj;
    });
  }

  function unmarkClaimed(skillName) {
    setField(["skills", "freeItemClaims"], (prev) => {
      const obj = prev && typeof prev === "object" ? { ...prev } : {};
      if (Object.prototype.hasOwnProperty.call(obj, skillName)) delete obj[skillName];
      return obj;
    });
  }

  function claimFreeItem(skillName) {
    const sn = String(skillName ?? "").trim();
    if (!sn) return;

    const claimedKey = freeItemClaims?.[sn];
    if (claimedKey) return;

    const key = freeItemPicks?.[sn];
    if (!key) return;

    const [kind, idStr] = String(key).split(":");
    const id = Number(idStr);
    if (!kind || !Number.isFinite(id)) return;

    addToInventory(kind, id, 1);
    markClaimed(sn, key);
  }

  function cancelClaimFreeItem(skillName) {
    const sn = String(skillName ?? "").trim();
    if (!sn) return;

    const claimedKey = freeItemClaims?.[sn];
    if (!claimedKey) return;

    const [kind, idStr] = String(claimedKey).split(":");
    const id = Number(idStr);
    if (!kind || !Number.isFinite(id)) return;

    removeFromInventory(kind, id);
    unmarkClaimed(sn);
  }

  const draftInt = Array.isArray(bonusDraft?.int) ? bonusDraft.int : [];
  const draftDex = Array.isArray(bonusDraft?.dex) ? bonusDraft.dex : [];

  const canConfirm =
    isCreate &&
    baseSumOk &&
    !duplicateCustomNames.size &&
    ((canUseIntBonus && draftInt.length > 0) || (canUseDexBonus && draftDex.length > 0));

  return (
    <section className="panel skills">
      <div className="panel-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>スキル欄</span>

        {editable && !isCreate && (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="sheet-btn" onClick={addMasterSkillRow}>
              ＋ マスターから追加
            </button>
            <button type="button" className="sheet-btn" onClick={addCustomSkillRow}>
              ＋ 自由入力で追加
            </button>
          </div>
        )}
      </div>

      {isCreate && (
        <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.85, lineHeight: 1.6 }}>
          ※ createモードではスキル数は <b>8つ固定</b> です。<br />
          ※ 基本Lvは <b>5 / 10 / 15 / 20</b> から選択できます（ボーナス適用後はこの限りではありません）。<br />
          <span style={{ opacity: 0.9 }}>
            基本Lv合計（ボーナス除外）:{" "}
            <b style={{ color: baseSumOk ? "inherit" : "crimson" }}>
              {baseSum} / {CREATE_BASE_SUM_LIMIT}
            </b>
            {!baseSumOk && <span style={{ marginLeft: 6, color: "crimson" }}>（80を超えています）</span>}
          </span>
        </div>
      )}

      {duplicateCustomNames.size > 0 && (
        <div style={{ marginBottom: 8, fontSize: 12, color: "crimson", lineHeight: 1.5 }}>
          ※ 自由入力スキル名が重複しています（同名は選べません）。名称を変更してください。
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

              // 現在行のキー（これ自身は “重複扱い” にしない）
              const selfKey = skillKeyOfRow(row);

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

                          // 重複禁止：他行で使ってるidは選べない（UIでもdisabledだが保険）
                          const nextId = v === "" ? null : Number(v);
                          const nextKey = nextId == null ? "" : `m:${String(nextId)}`;
                          if (nextKey && takenSkillKeys.has(nextKey) && nextKey !== selfKey) return;

                          if (isCreate) cancelConfirmedIfRowAffected(i);
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
                      <TextCell
                        editable={editable}
                        value={row?.name ?? ""}
                        placeholder="自由入力スキル名"
                        onCommit={(v) => {
                          if (isCreate) cancelConfirmedIfRowAffected(i);
                          setField(["skills", "rows", i, "name"], v);
                        }}
                      />
                    )}
                  </td>

                  <td className="num">
                    {!editable ? (
                      lv
                    ) : isCreate ? (
                      <select
                        className="sheet-input"
                        value={String(Number.isFinite(Number(row?.baseLevel)) ? Number(row.baseLevel) : 10)}
                        onChange={(e) => {
                          const base = Number(e.target.value);
                          if (!Number.isFinite(base)) return;
                          setBaseLevelAt(i, base);
                        }}
                      >
                        {CREATE_BASE_LEVELS.map((x) => {
                          // 80制限：この選択肢にしたときに超えるなら disabled
                          const others = baseSum - safeNum(row?.baseLevel, 0);
                          const nextSum = others + x;
                          const disabled = nextSum > CREATE_BASE_SUM_LIMIT;
                          return (
                            <option key={x} value={x} disabled={disabled}>
                              {x}
                            </option>
                          );
                        })}
                      </select>
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

      {isCreate && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>スキルボーナス選択</div>

          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6, marginBottom: 10 }}>
            <div>
              - <b>スキルへの【知力】ボーナス</b>：知力の能力修正がプラスなら、選んだスキル2つまでに修正値を加算できます。
            </div>
            <div>
              - <b>スキルへの【器用さ】ボーナス</b>：器用さの能力修正がプラスなら、同様にスキル2つまでに修正値を加算できます。
            </div>
            <div style={{ opacity: 0.75 }}>
              ※ ここでは対象を選ぶだけで、Lvは変わりません。<br />
              ※ <b>「ボーナス確定」</b> を押すとスキルLvが反映されます。<br />
              ※ 反映後に変更したい場合は <b>「変更」</b> を押してください。
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <BonusPicker type="int" value={safeNum(intBonusValue, 0)} draftTargets={draftInt} />
            <BonusPicker type="dex" value={safeNum(dexBonusValue, 0)} draftTargets={draftDex} />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              className="sheet-btn"
              onClick={confirmBonus}
              disabled={!canConfirm || bonusConfirmed}
              title={
                bonusConfirmed
                  ? "既に確定済みです（変更したい場合は「変更」）"
                  : !baseSumOk
                  ? "基本Lv合計（ボーナス除外）が80以下になるように調整してください"
                  : duplicateCustomNames.size
                  ? "自由入力スキル名の重複を解消してください"
                  : !((canUseIntBonus && draftInt.length > 0) || (canUseDexBonus && draftDex.length > 0))
                  ? "対象を選択してください"
                  : ""
              }
            >
              ボーナス確定
            </button>

            <button
              type="button"
              className="sheet-btn"
              onClick={editBonus}
              disabled={!bonusConfirmed}
              title={!bonusConfirmed ? "まだ確定されていません" : "確定を解除して選び直します"}
            >
              変更
            </button>

            {bonusConfirmed && <span style={{ fontSize: 12, opacity: 0.75, alignSelf: "center" }}>（確定済み）</span>}
          </div>
        </div>
      )}

      {isCreate && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>フリーアイテムの獲得</div>

          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6 }}>
            <div>
              スキル表（SKILLS_MASTER）の <code>unlock</code> を参照し、条件を満たすスキルごとに無料装備を1つ獲得できます。
            </div>
            <div>ルール：1スキルにつき獲得は1つだけ／10以上でも1の欄を選んでOK／条件を満たすスキルごとに1回ずつ実行。</div>
          </div>

          {createUnlockTargets.length === 0 ? (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              ※ 現在の選択スキルに、<code>unlock</code> が定義されたものがありません（または unlock が解釈できません）。
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {createUnlockTargets.map(({ label, level, unlockRows }) => {
                const reached = unlockRows.filter((u) => level >= u.threshold).map((u) => u.threshold);
                if (reached.length === 0) return null;

                const options = [];
                for (const u of unlockRows) {
                  if (level < u.threshold) continue;
                  for (const r of u.rewards) options.push({ threshold: u.threshold, r });
                }

                const picked = freeItemPicks?.[label] ?? "";
                const claimedKey = freeItemClaims?.[label] ?? "";
                const claimed = !!claimedKey;

                return (
                  <div key={label} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700 }}>{label}（現在 {level}）</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>到達: {reached.sort((a, b) => a - b).join(", ")}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 8, alignItems: "center" }}>
                      <select className="sheet-input" value={picked} onChange={(e) => setFreePick(label, e.target.value)}>
                        <option value="">（選択）</option>
                        {options.map(({ threshold, r }) => (
                          <option key={`${label}-${catalogKeyOf(r.kind, r.id)}-${threshold}`} value={catalogKeyOf(r.kind, r.id)}>
                            {`[${threshold}] ${kindLabel(r.kind)}: ${r.name}`}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className="sheet-btn"
                        onClick={() => (claimed ? cancelClaimFreeItem(label) : claimFreeItem(label))}
                        disabled={!claimed && !picked}
                        title={claimed ? "クリックで獲得を取り消して選び直せます" : !picked ? "先に候補を選択してください" : ""}
                      >
                        {claimed ? "獲得済み" : "無料獲得"}
                      </button>
                    </div>

                    {claimed ? (
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                        ※「獲得済み」を押すと取り消して、無料獲得を選び直せます
                      </div>
                    ) : (
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>※ このスキルでの無料獲得は 1つだけ選択してください</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
