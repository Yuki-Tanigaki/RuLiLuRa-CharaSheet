// src/pages/sheets/heroSheet/sections/HeaderSection.jsx
import React, { useMemo, useState } from "react";
import { TextCell } from "/src/pages/sheets/components/TextCell.jsx";
import { NumCell } from "/src/pages/sheets/components/NumCell.jsx";
import { safeNum } from "/src/common/utils/number.js";
import { fmtSigned } from "/src/common/utils/format.js";

import {
  ABILITY_KEYS,
  rollAbilities2d10,
  calcAbilitySum,
  isPointOk,
  canReroll as canRerollSum,
  swapValues,
  applyRolledAbilities as applyRolledAbilitiesAction,
  setInitialMoney,
  buildHeaderDerived,
} from "./headerSection.logic.js";

export function HeaderSection({ model, children }) {
  // ✅ model からは「状態と更新手段とモード」だけもらう
  const { s, editable, isCreate, setField } = model;

  // ✅ a/mods/hp/res/moneyG/fp は state から計算して使う
  const derived = useMemo(() => buildHeaderDerived(s), [s]);
  const { a, mods, hp, res, moneyG, fp } = derived;
  const { NormalRV, WoundRV, MpRV, baseNormal, baseWound, baseMp, shownNormal, shownWound, shownMp } = res;

  const abilityKeys = useMemo(() => ABILITY_KEYS, []);
  const abilitySum = useMemo(() => calcAbilitySum(a), [a]);
  const pointOk = useMemo(() => isPointOk(a), [a]);

  const [lastRoll, setLastRoll] = useState(null); // {values:{...}, sum}
  const canReroll = canRerollSum(lastRoll?.sum);

  function doRoll2d10() {
    setLastRoll(rollAbilities2d10());
  }

  function applyRolledAbilities() {
    if (!lastRoll?.values) return;
    applyRolledAbilitiesAction(setField, lastRoll.values);
  }

  const [swapA, setSwapA] = useState("str");
  const [swapB, setSwapB] = useState("dex");

  function swapAbilities() {
    if (swapA === swapB) return;
    if (!lastRoll?.values) return;

    const values = swapValues(lastRoll.values, swapA, swapB);
    const sum = calcAbilitySum(values);
    setLastRoll({ values, sum });
  }

  function setInitialMoneyFromIntDex() {
    setInitialMoney(setField, a);
  }

  return (
    <div className="grid-top" style={{ gridTemplateColumns: "1fr" }}>
      <section className="panel header">
        <div className="header-row">
          <div className="brand">
            <div className="brand-sub">RuLiLuRa / Newestalt</div>
            <div className="brand-title">英雄シート</div>
          </div>
          <div className="header-actions">{children}</div>
        </div>

        <div className="basic-grid">
          <div className="label">プレイヤー名</div>
          <div className="value">
            <TextCell editable={editable} value={s.basic?.playerName} onCommit={(v) => setField(["basic", "playerName"], v)} />
          </div>

          <div className="label">英雄名</div>
          <div className="value big">
            <TextCell editable={editable} value={s.basic?.name} className="big" onCommit={(v) => setField(["basic", "name"], v)} />
          </div>

          <div className="label">英雄レベル</div>
          <div className="value">
            <NumCell editable={editable} value={s.basic?.heroLevel} min={1} max={99} onCommit={(v) => setField(["basic", "heroLevel"], v)} />
          </div>

          <div className="label">ペア経験点</div>
          <div className="value">
            <NumCell editable={editable} value={s.basic?.pairExp} min={0} max={999999} onCommit={(v) => setField(["basic", "pairExp"], v)} />
          </div>

          <div className="label">現世での国籍</div>
          <div className="value">
            <TextCell editable={editable} value={s.basic?.nationality} onCommit={(v) => setField(["basic", "nationality"], v)} />
          </div>

          <div className="label">性別</div>
          <div className="value">
            <TextCell editable={editable} value={s.basic?.gender} onCommit={(v) => setField(["basic", "gender"], v)} />
          </div>

          <div className="label">現世での職業</div>
          <div className="value">
            <TextCell editable={editable} value={s.basic?.job} onCommit={(v) => setField(["basic", "job"], v)} />
          </div>

          <div className="label">年齢</div>
          <div className="value">
            <TextCell editable={editable} value={s.basic?.age} onCommit={(v) => setField(["basic", "age"], v)} />
          </div>
        </div>

        <div className="ability-wrap">
          <table className="sheet-table ability-table">
            <thead>
              <tr>
                <th>能力</th>
                <th>能力値</th>
                <th>能力修正</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>筋力</td>
                <td className="num">
                  <NumCell editable={editable} value={a.str} min={2} max={20} className="num" onCommit={(v) => setField(["abilities", "str"], v)} />
                </td>
                <td>{fmtSigned(mods.str)}</td>
              </tr>
              <tr>
                <td>器用さ</td>
                <td className="num">
                  <NumCell editable={editable} value={a.dex} min={2} max={20} className="num" onCommit={(v) => setField(["abilities", "dex"], v)} />
                </td>
                <td>{fmtSigned(mods.dex)}</td>
              </tr>
              <tr>
                <td>敏捷</td>
                <td className="num">
                  <NumCell editable={editable} value={a.agi} min={2} max={20} className="num" onCommit={(v) => setField(["abilities", "agi"], v)} />
                </td>
                <td>{fmtSigned(mods.agi)}</td>
              </tr>
              <tr>
                <td>生命力</td>
                <td className="num">
                  <NumCell editable={editable} value={a.vit} min={2} max={20} className="num" onCommit={(v) => setField(["abilities", "vit"], v)} />
                </td>
                <td>{fmtSigned(mods.vit)}</td>
              </tr>
              <tr>
                <td>知力</td>
                <td className="num">
                  <NumCell editable={editable} value={a.int} min={2} max={20} className="num" onCommit={(v) => setField(["abilities", "int"], v)} />
                </td>
                <td>{fmtSigned(mods.int)}</td>
              </tr>
              <tr>
                <td>精神力</td>
                <td className="num">
                  <NumCell editable={editable} value={a.psy} min={2} max={20} className="num" onCommit={(v) => setField(["abilities", "psy"], v)} />
                </td>
                <td>{fmtSigned(mods.psy)}</td>
              </tr>
            </tbody>
          </table>

          {/* HP/MP/所持金 */}
          <div className="hp-boxes">
            {/* 通常HP */}
            <div className="circle">
              <div className="circle-label">通常HP</div>

              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <div className="circle-val" style={{ lineHeight: 1 }}>
                  {shownNormal}
                </div>

                {editable && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <NumCell
                      editable={editable}
                      value={NormalRV}
                      min={-999999999}
                      max={999999999}
                      className="num"
                      onCommit={(v) => setField(["resources", "hpNormalRV"], v)}
                    />
                  </div>
                )}
              </div>

              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2, textAlign: "right" }}>
                <span style={{ opacity: 0.7 }}>{baseNormal}</span>{" "}
                <span style={{ opacity: 0.7 }}>{fmtSigned(NormalRV)}</span>
              </div>
            </div>

            {/* 負傷HP */}
            <div className="circle">
              <div className="circle-label">負傷HP</div>

              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <div className="circle-val" style={{ lineHeight: 1 }}>
                  {shownWound}
                </div>

                {editable && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <NumCell
                      editable={editable}
                      value={WoundRV}
                      min={-999999999}
                      max={999999999}
                      className="num"
                      onCommit={(v) => setField(["resources", "hpWoundRV"], v)}
                    />
                  </div>
                )}
              </div>

              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2, textAlign: "right" }}>
                <span style={{ opacity: 0.7 }}>{baseWound}</span>{" "}
                <span style={{ opacity: 0.7 }}>{fmtSigned(WoundRV)}</span>
              </div>
            </div>

            {/* MP */}
            <div className="circle">
              <div className="circle-label">MP</div>

              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <div className="circle-val" style={{ lineHeight: 1 }}>
                  {shownMp}
                </div>

                {editable && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <NumCell
                      editable={editable}
                      value={MpRV}
                      min={-999999999}
                      max={999999999}
                      className="num"
                      onCommit={(v) => setField(["resources", "mpRV"], v)}
                    />
                  </div>
                )}
              </div>

              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2, textAlign: "right" }}>
                <span style={{ opacity: 0.7 }}>{baseMp}</span>{" "}
                <span style={{ opacity: 0.7 }}>{fmtSigned(MpRV)}</span>
              </div>
            </div>

            {/* 所持金 / FP */}
            <div style={{ marginTop: 10, display: "grid", gap: 6, fontSize: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", alignItems: "center", gap: 8 }}>
                <div style={{ opacity: 0.75 }}>所持金</div>
                <div style={{ textAlign: "right" }}>
                  {editable ? (
                    <NumCell
                      editable={editable}
                      value={moneyG}
                      min={0}
                      max={999999999}
                      className="num"
                      onCommit={(v) => setField(["equipment", "moneyG"], v)}
                    />
                  ) : (
                    <span className="num">{safeNum(moneyG).toLocaleString()} G</span>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", alignItems: "center", gap: 8 }}>
                <div style={{ opacity: 0.75 }}>FP</div>
                <div style={{ textAlign: "right" }}>
                  {editable ? (
                    <NumCell editable={editable} value={fp} min={0} max={9999} className="num" onCommit={(v) => setField(["equipment", "fp"], v)} />
                  ) : (
                    <span className="num">{safeNum(fp)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* create時：能力値作成 */}
        {isCreate && editable && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>能力値作成</div>

            <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6 }}>
              <div>## 能力値（ポイント割り振り式）</div>
              <div> - 70ポイントを各能力に割り当て（各能力 2〜20）。</div>
              <div>## 能力値（ランダムロール）</div>
              <div> - 2D10で【筋力】→順に決定。合計が65以下なら振り直し可。</div>
              <div> - なお、能力値のダイス目は自由に交換できる。</div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                合計: <b>{abilitySum}</b>{" "}
                <span style={{ marginLeft: 8, opacity: 0.85 }}>{pointOk ? "（70点 OK）" : "（70点ではない / 範囲外あり）"}</span>
              </div>

              <button type="button" className="sheet-btn" onClick={doRoll2d10}>
                2D10ロール
              </button>

              <button
                type="button"
                className="sheet-btn"
                onClick={applyRolledAbilities}
                disabled={!lastRoll?.values}
                title={!lastRoll?.values ? "先にロールしてください" : ""}
              >
                ロール結果を適用
              </button>

              <button
                type="button"
                className="sheet-btn"
                onClick={doRoll2d10}
                disabled={!lastRoll || !canReroll}
                title={!lastRoll ? "先にロールしてください" : canReroll ? "" : "合計が65以下のときのみ振り直し可"}
              >
                振り直し（合計≤65）
              </button>
            </div>

            {lastRoll && (
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                ロール合計: <b>{lastRoll.sum}</b>{" "}
                <span style={{ opacity: 0.8 }}>
                  （筋{lastRoll.values.str}, 器{lastRoll.values.dex}, 敏{lastRoll.values.agi}, 生{lastRoll.values.vit}, 知{lastRoll.values.int},
                  精{lastRoll.values.psy}）
                </span>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
              <div style={{ fontSize: 12, opacity: 0.85 }}>能力値の交換：</div>
              <select className="sheet-input" value={swapA} onChange={(e) => setSwapA(e.target.value)}>
                {abilityKeys.map((x) => (
                  <option key={x.k} value={x.k}>
                    {x.label}
                  </option>
                ))}
              </select>
              <span style={{ opacity: 0.7 }}>⇄</span>
              <select className="sheet-input" value={swapB} onChange={(e) => setSwapB(e.target.value)}>
                {abilityKeys.map((x) => (
                  <option key={x.k} value={x.k}>
                    {x.label}
                  </option>
                ))}
              </select>
              <button type="button" className="sheet-btn" onClick={swapAbilities}>
                交換する
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <button type="button" className="sheet-btn" onClick={setInitialMoneyFromIntDex}>
                初期所持金を設定（知力×器用さ×1000G）
              </button>
              <span style={{ fontSize: 12, opacity: 0.75, marginLeft: 8 }}>現在: {safeNum(moneyG).toLocaleString()} G</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
