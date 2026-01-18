// src/pages/sheets/heroSheet/sections/SkillsSection.jsx
import React from "react";
import { NumCell } from "/src/pages/sheets/components/NumCell.jsx";
import { safeNum } from "/src/common/utils/number.js";
import { encodeCatalogKey } from "/src/common/catalogKey.js";

import { useSkillsSectionLogic } from "./skillsSectionLogic.js";

function BonusPicker({ type, value, draftTargets, locked, selectableSkillRows, setDraftTargets }) {
  const canUse = value > 0;
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
    if (locked) return;

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
        <select
          className="sheet-input"
          value={t0 === "" ? "" : String(t0)}
          onChange={(e) => setAt(0, e.target.value)}
          disabled={locked}
          title={locked ? "確定済みです（変更をクリックすると選び直せます）" : ""}
        >
          <option value="">（未選択）</option>
          {selectableSkillRows.map((r) => (
            <option key={`b0-${r.index}`} value={String(r.index)}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          className="sheet-input"
          value={t1 === "" ? "" : String(t1)}
          onChange={(e) => setAt(1, e.target.value)}
          disabled={locked}
          title={locked ? "確定済みです（変更をクリックすると選び直せます）" : ""}
        >
          <option value="">（未選択）</option>
          {selectableSkillRows.map((r) => (
            <option key={`b1-${r.index}`} value={String(r.index)}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.6 }}>
        ※ 先にスキル欄でスキル名を選択してください。<br />
        ※ 同じスキルは2回選べません。
      </div>
    </div>
  );
}

export function SkillsSection({ model }) {
  const L = useSkillsSectionLogic(model);

  const {
    // model passthrough
    editable,
    isCreate,
    masterSkills,
    rowLabel,

    // derived
    displayRows,
    takenSkillKeys,
    baseSum,
    baseSumOk,

    // create constants
    CREATE_SKILL_COUNT,
    CREATE_BASE_LEVELS,
    CREATE_BASE_SUM_LIMIT,

    // handlers
    updateSkillRow,
    addMasterSkillRow,
    removeSkillRow,
    setBaseLevelAt,
    cancelConfirmedIfRowAffected,

    // bonus
    bonusConfirmed,
    selectableSkillRows,
    draftInt,
    draftDex,
    canUseIntBonus,
    canUseDexBonus,
    canConfirm,
    setDraftTargets,
    confirmBonus,
    editBonus,

    // free item
    createUnlockTargets,
    freeItemPicks,
    freeItemClaims,
    setFreePick,
    claimFreeItem,
    cancelClaimFreeItem,
  } = L;

  // registry.json 由来のカテゴリラベル（無ければ kind をそのまま）
  const categoryLabel = (categoryKey) =>
    String(model?.catalog?.categories?.[String(categoryKey ?? "")]?.label ?? categoryKey ?? "");

  const locked = bonusConfirmed;

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
          ※ createモードではスキル数は <b>{CREATE_SKILL_COUNT}つ固定</b> です。<br />
          ※ 基本Lvは <b>{CREATE_BASE_LEVELS.join(" / ")}</b> から選択できます。<br />
          <span style={{ opacity: 0.9 }}>
            基本Lv合計（ボーナス除外）:{" "}
            <b style={{ color: baseSumOk ? "inherit" : "crimson" }}>
              {baseSum} / {CREATE_BASE_SUM_LIMIT}
            </b>
            {!baseSumOk && <span style={{ marginLeft: 6, color: "crimson" }}>（{CREATE_BASE_SUM_LIMIT}を超えています）</span>}
          </span>
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

              const selfId = row?.id ?? null;
              const selfKey = selfId == null ? "" : `m:${String(selfId)}`;

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
                      // custom は編集しない（過去データ閲覧のみ）
                      <span style={{ opacity: 0.85 }}>{label}</span>
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
                        onCommit={(v) => model.setField(["skills", "rows", i, "level"], v)}
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
              - <b>スキルへの【器用さ】ボーナス</b>：器用さの能力修正がプラスなら、スキル2つまでに修正値を加算できます。
            </div>
            <div style={{ opacity: 0.75 }}>
              ※ ここでは対象を選ぶだけで、Lvは変わりません。<br />
              ※ <b>「ボーナス確定」</b> を押すとスキルLvが反映されます。<br />
              ※ 反映後に変更したい場合は <b>「変更」</b> を押してください。
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <BonusPicker
              type="int"
              value={safeNum(model.intBonusValue, 0)}
              draftTargets={draftInt}
              locked={locked}
              selectableSkillRows={selectableSkillRows}
              setDraftTargets={setDraftTargets}
            />
            <BonusPicker
              type="dex"
              value={safeNum(model.dexBonusValue, 0)}
              draftTargets={draftDex}
              locked={locked}
              selectableSkillRows={selectableSkillRows}
              setDraftTargets={setDraftTargets}
            />
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
                  ? `基本Lv合計（ボーナス除外）が${CREATE_BASE_SUM_LIMIT}以下になるように調整してください`
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
                        {options.map(({ threshold, r }) => {
                          // unlock の reward は { kind, id, name } 前提（name が無ければ表示をフォールバック）
                          const kind = r?.kind;
                          const id = r?.id;
                          const key = encodeCatalogKey(kind, id);
                          if (!key) return null;

                          const cat = categoryLabel(kind);
                          const nm = String(r?.name ?? "(unknown)");

                          return (
                            <option key={`${label}-${key}-${threshold}`} value={key}>
                              {`[${threshold}] ${cat}: ${nm}`}
                            </option>
                          );
                        })}
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
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>※「獲得済み」を押すと取り消して、無料獲得を選び直せます</div>
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
