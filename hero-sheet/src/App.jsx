import React, { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import { SKILLS_MASTER, SKILL_ID_EVADE, skillNameById } from "./data/skillsMaster.js";
import { WEAPONS_MASTER, weaponById } from "./data/weaponsMaster.js";
import { calcDerived, roll2d10 } from "./lib/calc.js";
import { loadState, saveState, exportJson, importJsonFile } from "./lib/storage.js";
import { validateAll } from "./lib/validate.js";

function defaultState() {
  return {
    version: 1,
    basic: { name: "", age: "", gender: "", nationality: "", job: "", heroLevel: 1 },
    abilities: { method: "point", str: 10, dex: 10, agi: 10, vit: 10, int: 10, psy: 10 },
    skills: {
      selected: Array.from({ length: 8 }, () => ({ id: null, base: 10 })),
      intBonusTargets: [],
      dexBonusTargets: []
    },
    equipment: {
      items: [
      ]
    },
    memo: ""
  };
}

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.max(min, Math.min(max, x));
}

export default function App() {
  const [state, setState] = useState(() => loadState() ?? defaultState());
  const fileRef = useRef(null);

  // autosave
  useEffect(() => {
    saveState(state);
  }, [state]);

  const derived = useMemo(() => calcDerived(state), [state]);
  const errors = useMemo(() => validateAll(state), [state]);

  const abilityKeys = [
    ["str", "筋力"],
    ["dex", "器用さ"],
    ["agi", "敏捷"],
    ["vit", "生命力"],
    ["int", "知力"],
    ["psy", "精神力"],
  ];

  const abilitySum = abilityKeys.reduce((acc, [k]) => acc + (Number(state.abilities[k]) || 0), 0);
  const abilityRemain = 70 - abilitySum;

  const intMod = derived.mods.int;
  const dexMod = derived.mods.dex;

  const selectedSkillIds = state.skills.selected.map(s => s.id).filter(id => id != null);
  const selectedSet = new Set(selectedSkillIds);

  const equipmentOptions = useMemo(() => {
    const catLabel = (c) =>
      c === "weapon" ? "武器" :
      c === "armor" ? "防具" :
      c === "shield" ? "盾" : "装備";

    return WEAPONS_MASTER.map(w => ({
      id: w.id,
      category: w.category,
      label: `【${catLabel(w.category)}】${w.name}`
    }));
  }, []);

  function addItemRow() {
    setState(prev => {
      const next = structuredClone(prev);
      next.equipment.items.push({ id: null, qty: 1 });
      return next;
    });
  }

  function removeItemRow(index) {
    setState(prev => {
      const next = structuredClone(prev);
      next.equipment.items.splice(index, 1);
      return next;
    });
  }

  function update(path, value) {
    setState(prev => {
      const next = structuredClone(prev);
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = value;
      return next;
    });
  }

  function setAbilityMethod(method) {
    setState(prev => {
      const next = structuredClone(prev);
      next.abilities.method = method;
      return next;
    });
  }

  function rollAbilities() {
    // 2D10×6。合計<=65なら振り直し可（ここでは1回で生成、判定はUIで）
    setState(prev => {
      const next = structuredClone(prev);
      const vals = abilityKeys.map(() => roll2d10());
      next.abilities.method = "roll";
      abilityKeys.forEach(([k], i) => (next.abilities[k] = vals[i]));
      // ボーナス対象は一旦クリア（能力修正が変わるので）
      next.skills.intBonusTargets = [];
      next.skills.dexBonusTargets = [];
      return next;
    });
  }

  function swapAbilities(i, j) {
    setState(prev => {
      const next = structuredClone(prev);
      const ki = abilityKeys[i][0];
      const kj = abilityKeys[j][0];
      const tmp = next.abilities[ki];
      next.abilities[ki] = next.abilities[kj];
      next.abilities[kj] = tmp;
      return next;
    });
  }

  function setSkillSlot(slotIndex, newId) {
    setState(prev => {
      const next = structuredClone(prev);
      next.skills.selected[slotIndex].id = newId;
      // ボーナス対象に入ってたら外す（別スキルへ変えたので）
      next.skills.intBonusTargets = next.skills.intBonusTargets.filter(id => id !== newId);
      next.skills.dexBonusTargets = next.skills.dexBonusTargets.filter(id => id !== newId);
      return next;
    });
  }

  function toggleBonus(kind, id) {
    setState(prev => {
      const next = structuredClone(prev);
      const key = kind === "int" ? "intBonusTargets" : "dexBonusTargets";
      const otherKey = kind === "int" ? "dexBonusTargets" : "intBonusTargets";

      const arr = next.skills[key];
      const other = next.skills[otherKey];

      const has = arr.includes(id);
      if (has) {
        next.skills[key] = arr.filter(x => x !== id);
        return next;
      }

      // add: size limit 2
      if (arr.length >= 2) return next;

      // if both bonuses are active, must be all different
      if (intMod > 0 && dexMod > 0) {
        if (other.includes(id)) return next;
      }

      next.skills[key] = [...arr, id];
      return next;
    });
  }

  function normalizeBonusTargetsByMods() {
    setState(prev => {
      const next = structuredClone(prev);
      if (intMod <= 0) next.skills.intBonusTargets = [];
      if (dexMod <= 0) next.skills.dexBonusTargets = [];
      return next;
    });
  }

  useEffect(() => {
    normalizeBonusTargetsByMods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intMod, dexMod]);

  const skillPointSum = state.skills.selected.reduce((acc, s) => acc + (Number(s.base) || 0), 0);
  const skillPointRemain = 80 - skillPointSum;

  const rollSum = abilitySum;
  const canReroll = state.abilities.method === "roll" && rollSum <= 65;

  return (
    <div className="container">
      <div className="header no-print">
        <div className="h1">英雄シート（自作システム）</div>
        <div className="btns">
          <button onClick={() => window.print()}>印刷</button>
          <button onClick={() => exportJson(state)}>JSON出力</button>
          <button onClick={() => fileRef.current?.click()}>JSON読込</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const imported = await importJsonFile(f);
                // gender正規化（男/女 でも入ってきたら変換）
                const g = imported?.basic?.gender;
                if (g === "男") imported.basic.gender = "male";
                if (g === "女") imported.basic.gender = "female";
                if (g !== "male" && g !== "female") imported.basic.gender = ""; // それ以外は未選択に

                setState(imported);
              } catch {
                alert("JSONの読み込みに失敗しました");
              } finally {
                e.target.value = "";
              }
            }}
          />
          <button className="primary" onClick={() => setState(defaultState())}>新規</button>
        </div>
      </div>

      <div className="grid">
        {/* LEFT: editor */}
        <div className="card">
          <h2>基本情報</h2>
          <div className="row"><div>名前</div><input value={state.basic.name} onChange={e => update(["basic","name"], e.target.value)} /></div>
          <div className="row"><div>年齢</div><input value={state.basic.age} onChange={e => update(["basic","age"], e.target.value)} /></div>
          <div className="row"><div>性別</div><select value={state.basic.gender} onChange={(e) => update(["basic","gender"], e.target.value)}>
            <option value="">（選択）</option>
            <option value="male">男</option>
            <option value="female">女</option>
            </select>
            </div>
          <div className="row"><div>現世での国籍</div><input value={state.basic.nationality} onChange={e => update(["basic","nationality"], e.target.value)} /></div>
          <div className="row"><div>現世での職業</div><input value={state.basic.job} onChange={e => update(["basic","job"], e.target.value)} /></div>
          <div className="row"><div>英雄レベル</div><input type="number" min="1" value={state.basic.heroLevel} onChange={e => update(["basic","heroLevel"], clamp(e.target.value, 1, 999))} /></div>

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />

          <h2>能力値</h2>
          <div className="btns no-print" style={{ marginBottom: 8 }}>
            <button onClick={() => setAbilityMethod("point")} className={state.abilities.method==="point" ? "primary" : ""}>ポイント割り振り</button>
            <button onClick={() => setAbilityMethod("roll")} className={state.abilities.method==="roll" ? "primary" : ""}>ランダム</button>
            <button onClick={rollAbilities}>2D10で振る</button>
            {canReroll && <button onClick={rollAbilities} className="primary">合計65以下なので振り直し</button>}
          </div>

          {state.abilities.method === "point" && (
            <div className={`small ${abilityRemain === 0 ? "" : "warn"}`}>
              合計: {abilitySum} / 70（残り: {abilityRemain}）
            </div>
          )}
          {state.abilities.method === "roll" && (
            <div className={`small ${canReroll ? "warn" : ""}`}>
              合計: {abilitySum}（{canReroll ? "65以下なので振り直し可" : "振り直し条件なし"}）
            </div>
          )}

          {abilityKeys.map(([k, label], idx) => (
            <div key={k} className="row">
              <div>{label}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={state.abilities[k]}
                  onChange={e => update(["abilities", k], clamp(e.target.value, 2, 20))}
                />
                <div className="small">修正 {derived.mods[k]}</div>
                {state.abilities.method === "roll" && (
                  <div className="no-print" style={{ display: "flex", gap: 6 }}>
                    {idx > 0 && <button onClick={() => swapAbilities(idx, idx - 1)}>↑</button>}
                    {idx < abilityKeys.length - 1 && <button onClick={() => swapAbilities(idx, idx + 1)}>↓</button>}
                  </div>
                )}
              </div>
            </div>
          ))}

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />

          <h2>スキル（8つ / 合計80点）</h2>
          <div className={`small ${skillPointRemain === 0 ? "" : "warn"}`}>
            合計: {skillPointSum} / 80（残り: {skillPointRemain}）
          </div>

          {state.skills.selected.map((slot, i) => {
            const used = new Set(selectedSkillIds.filter((id, idx) => idx !== i)); // 他スロットで使用中
            return (
              <div key={i} className="row">
                <div>スキル{i + 1}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8 }}>
                  <select
                    value={slot.id ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      setSkillSlot(i, v);
                    }}
                  >
                    <option value="">（未選択）</option>
                    {SKILLS_MASTER.map(s => (
                      <option key={s.id} value={s.id} disabled={used.has(s.id)}>
                        {s.id}. {s.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={slot.base}
                    onChange={e => update(["skills","selected", i, "base"], Number(e.target.value))}
                  >
                    {[5,10,15,20].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            );
          })}

          <div className="small" style={{ marginTop: 6 }}>
            ※《回避》未取得の場合、回避スキル値は0として計算します。
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />

          <h2>知力/器用さボーナス</h2>
          <div className="small">
            知力修正: {intMod} / 器用さ修正: {dexMod}
          </div>

          <div className="row">
            <div>知力ボーナス</div>
            <div className="small">
              {intMod > 0 ? "選択スキルから2つ" : "知力修正が+のときのみ"}
            </div>
          </div>
          {intMod > 0 && (
            <BonusPicker
              kind="int"
              selectedSkillIds={selectedSkillIds}
              chosen={state.skills.intBonusTargets}
              otherChosen={state.skills.dexBonusTargets}
              bothActive={intMod > 0 && dexMod > 0}
              onToggle={(id) => toggleBonus("int", id)}
            />
          )}

          <div className="row" style={{ marginTop: 8 }}>
            <div>器用さボーナス</div>
            <div className="small">
              {dexMod > 0 ? "選択スキルから2つ" : "器用さ修正が+のときのみ"}
            </div>
          </div>
          {dexMod > 0 && (
            <BonusPicker
              kind="dex"
              selectedSkillIds={selectedSkillIds}
              chosen={state.skills.dexBonusTargets}
              otherChosen={state.skills.intBonusTargets}
              bothActive={intMod > 0 && dexMod > 0}
              onToggle={(id) => toggleBonus("dex", id)}
            />
          )}

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />

          <h2>所持品（無制限）</h2>

          <div className="btns no-print" style={{ margin: "8px 0" }}>
            <button onClick={addItemRow}>＋所持品を追加</button>
          </div>

          {state.equipment.items.length === 0 && (
            <div className="small">（所持品なし）</div>
          )}

          {state.equipment.items.map((it, idx) => (
            <div key={idx} className="row">
              <div>所持品{idx + 1}</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 60px", gap: 8 }}>
                <select
                  value={it.id ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? null : Number(e.target.value);
                    update(["equipment", "items", idx, "id"], v);
                  }}
                >
                  <option value="">（未選択）</option>
                  {equipmentOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={it.qty ?? 1}
                  onChange={(e) => update(["equipment", "items", idx, "qty"], clamp(e.target.value, 1, 999))}
                />

                <button className="no-print" onClick={() => removeItemRow(idx)}>削除</button>
              </div>
            </div>
          ))}


          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />
          <h2>メモ</h2>
          <textarea rows={4} value={state.memo} onChange={e => update(["memo"], e.target.value)} />

          {errors.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="err" style={{ fontWeight: 700 }}>入力エラー</div>
              <ul className="err" style={{ marginTop: 6 }}>
                {errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
              {errors.length > 20 && <div className="small err">…他 {errors.length - 20} 件</div>}
            </div>
          )}
        </div>

        {/* RIGHT: preview */}
        <div className="card">
          <h2>プレビュー（計算結果）</h2>

          <div className="row"><div>名前</div><div><b>{state.basic.name || "（未入力）"}</b></div></div>
          <div className="row"><div>英雄レベル</div><div>{state.basic.heroLevel}</div></div>

          <div className="kv" style={{ marginTop: 8 }}>
            <div className="item"><b>通常HP</b><div>{derived.hp.normal}</div></div>
            <div className="item"><b>負傷HP</b><div>{derived.hp.wound}</div></div>
            <div className="item"><b>MP</b><div>{derived.hp.mp}</div></div>
            <div className="item"><b>所持金</b><div>{derived.money} G</div></div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />

          <div className="kv">
            <div className="item"><b>白兵</b><div>{derived.combat.melee}</div></div>
            <div className="item"><b>射撃</b><div>{derived.combat.ranged}</div></div>
            <div className="item"><b>抵抗</b><div>{derived.combat.resist}</div></div>
            <div className="item"><b>防御値</b><div>{derived.defense}</div></div>
            <div className="item"><b>回避(元値)</b><div>{derived.evade.raw}</div></div>
            <div className="item"><b>回避(修正)</b><div>{derived.evade.adj}</div></div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />

          <h2>スキル（最終値）</h2>
          <div className="small">
            知力ボーナス: +{Math.max(0, intMod)} / 器用さボーナス: +{Math.max(0, dexMod)}
          </div>
          <div style={{ marginTop: 8 }}>
            {state.skills.selected.map((s, i) => {
              const id = s.id;
              const name = id ? skillNameById(id) : "（未選択）";
              const base = Number(s.base) || 0;
              const final = id ? derived.finalSkillValue(id) : 0;
              const tag = id === SKILL_ID_EVADE ? "（回避計算に使用）" : "";
              return (
                <div key={i} className="row">
                  <div>{i + 1}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div>{name} {tag}</div>
                    <div><b>{final}</b> <span className="small">(基礎{base})</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />

          <h2>所持品</h2>

          {state.equipment.items.length === 0 ? (
            <div className="small">—</div>
          ) : (
            <div style={{ marginTop: 6 }}>
              {state.equipment.items.map((it, i) => {
                const item = it.id ? weaponById(it.id) : null;
                const qty = Number(it.qty) || 1;

                const cat =
                  item?.category === "weapon" ? "武器" :
                  item?.category === "armor" ? "防具" :
                  item?.category === "shield" ? "盾" : "装備";

                // ちょい詳細表示（武器ならダメージ、防具/盾なら防御値など）
                const detail = item
                  ? (item.category === "weapon"
                      ? `命中${item.baseHit} / ダメージ${item.damage}`
                      : `防御${item.defenseValue ?? 0} / 回避${item.evadeMod ?? 0}`)
                  : "";

                return (
                  <div key={i} className="row">
                    <div>{i + 1}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <b>{item?.name ?? "（未選択）"}</b>
                        {item && <span className="small">（{cat}）</span>}
                        {detail && <div className="small">{detail}</div>}
                      </div>
                      <div>x{qty}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />

          <h2>メモ</h2>
          <div style={{ whiteSpace: "pre-wrap" }}>{state.memo || "—"}</div>
        </div>
      </div>
    </div>
  );
}

function BonusPicker({ kind, selectedSkillIds, chosen, otherChosen, bothActive, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 0" }}>
      {selectedSkillIds.map(id => {
        const name = skillNameById(id);
        const checked = chosen.includes(id);
        const disabled = !checked && chosen.length >= 2;
        const blockedByOther = bothActive && otherChosen.includes(id) && !checked;

        return (
          <label key={id} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 999,
            opacity: (disabled || blockedByOther) ? 0.5 : 1
          }}>
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled || blockedByOther}
              onChange={() => onToggle(id)}
            />
            <span>{name}</span>
          </label>
        );
      })}
    </div>
  );
}
