// src/pages/sheets/heroSheet/sections/SideEquipmentSection.jsx
import React, { useMemo } from "react";
import { normalizeRequirement } from "../../common/normalize.js";
import { safeNum } from "../../common/utils/number.js";
import { fmtSigned } from "../../common/utils/format.js";

function renderRequirementText(req) {
  const r = normalizeRequirement(req);
  if (r.length === 0) return "なし";
  const [name, min] = r;
  return `${name} ${min}`;
}

export function SideEquipmentSection({ model }) {
  const {
    editable,
    s,
    eq,
    inventory,
    defByKindId,
    setField,
    weaponHitRows,
    ar,
    sh,
    meleeMod,
    rangedMod,
    evadeRawBase,
    evadeMod10Base,
    evadeMod10,
    shieldReq,
    getSkillLevel,
  } = model;

  const ownedIdsOf = (kind) => inventory.filter((e) => e.kind === kind).map((e) => Number(e.id));
  const ownedWeaponIds = ownedIdsOf("weapon");
  const ownedArmorIds = ownedIdsOf("armor");
  const ownedShieldIds = ownedIdsOf("shield");

  // =========================
  // ・装備はセットするだけ
  // ・通常ルールと矛盾しそうな組み合わせは警告表示
  // =========================

  function equipArmor(armorId) {
    setField(["equipment", "equipped", "armorId"], armorId == null ? null : Number(armorId));
  }

  function equipShield(shieldId) {
    const sid = shieldId == null ? null : Number(shieldId);
    setField(["equipment", "equipped", "shieldId"], sid);
  }

  function equipWeapon(hand, weaponId) {
    const wid = weaponId == null ? null : Number(weaponId);

    if (wid == null) {
      setField(["equipment", "equipped"], (eqPrev) => {
        const eq2 = eqPrev ?? {};
        const next = { ...eq2 };
        if (hand === "right") next.weaponRightId = null;
        else next.weaponLeftId = null;
        return next;
      });
      return;
    }

    setField(["equipment", "equipped"], (eqPrev) => {
      const eq2 = eqPrev ?? {};
      const next = { ...eq2 };
      if (hand === "right") next.weaponRightId = wid;
      else next.weaponLeftId = wid;
      return next;
    });
  }

  // =========================
  // 警告（禁止ではなく表示だけ）
  // =========================
  const equipWarnings = useMemo(() => {
    const warns = [];

    const rightId = eq?.weaponRightId ?? null;
    const leftId = eq?.weaponLeftId ?? null;
    const shieldId = eq?.shieldId ?? null;

    const wRight = defByKindId("weapon", rightId);
    const wLeft = defByKindId("weapon", leftId);

    const rightTwo = (wRight?.grip ?? "") === "両手";
    const leftTwo = (wLeft?.grip ?? "") === "両手";

    // “通常ルールでは”不自然な組み合わせを警告
    if (rightTwo && (leftId != null || shieldId != null)) {
      warns.push("右手の武器が「両手」ですが、左手武器/盾も装備されています（通常ルールでは両手武器中は左手が空きません）。");
    }
    if (leftTwo && shieldId != null) {
      warns.push("左手の武器が「両手」ですが、盾も装備されています（通常ルールでは両手武器中は盾が装備できません）。");
    }
    if (leftId != null && shieldId != null) {
      warns.push("左手に武器と盾が同時に装備されています（通常ルールでは左手は1枠です）。");
    }

    return warns;
  }, [eq, defByKindId]);

  const defenseValue = safeNum(ar?.defenseValue, 0) + safeNum(sh?.defenseValue, 0);
  const resistMod = safeNum(model.mods?.psy) + safeNum(model.mods?.vit);

  // 表示用（武器/盾の詳細で使う）
  const weaponDetails = useMemo(() => weaponHitRows.map((x) => x), [weaponHitRows]);

  return (
    <aside className="side" style={{ alignSelf: "start" }}>
      <div className="panel-title">個人装備</div>

      {equipWarnings.length > 0 && (
        <div
          style={{
            margin: "8px 0 10px",
            padding: 8,
            border: "1px solid rgba(220,0,0,0.35)",
            borderRadius: 10,
            background: "rgba(220,0,0,0.06)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 6, color: "crimson" }}>装備の警告</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "crimson", lineHeight: 1.5 }}>
            {equipWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {editable && (
        <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 8, alignItems: "center" }}>
            <div style={{ opacity: 0.75 }}>右手武器</div>
            <select
              className="sheet-input"
              value={eq.weaponRightId ?? ""}
              onChange={(e) => equipWeapon("right", e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">（なし）</option>
              {ownedWeaponIds.map((id) => {
                const w = defByKindId("weapon", id);
                return (
                  <option key={id} value={id}>
                    {w?.name ?? `(id:${id})`}
                  </option>
                );
              })}
            </select>

            <div style={{ opacity: 0.75 }}>左手武器</div>
            <select
              className="sheet-input"
              value={eq.weaponLeftId ?? ""}
              onChange={(e) => equipWeapon("left", e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">（なし）</option>
              {ownedWeaponIds.map((id) => {
                const w = defByKindId("weapon", id);
                return (
                  <option key={id} value={id}>
                    {w?.name ?? `(id:${id})`}
                  </option>
                );
              })}
            </select>

            <div style={{ opacity: 0.75 }}>防具</div>
            <select
              className="sheet-input"
              value={eq.armorId ?? ""}
              onChange={(e) => equipArmor(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">（なし）</option>
              {ownedArmorIds.map((id) => {
                const a2 = defByKindId("armor", id);
                return (
                  <option key={id} value={id}>
                    {a2?.name ?? `(id:${id})`}
                  </option>
                );
              })}
            </select>

            <div style={{ opacity: 0.75 }}>盾（左手）</div>
            <select
              className="sheet-input"
              value={eq.shieldId ?? ""}
              onChange={(e) => equipShield(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">（なし）</option>
              {ownedShieldIds.map((id) => {
                const s2 = defByKindId("shield", id);
                return (
                  <option key={id} value={id}>
                    {s2?.name ?? `(id:${id})`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      <div className="panel-title" style={{ marginTop: 10 }}>
        武器
      </div>

      <table className="sheet-table" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ width: 52 }}>握り</th>
            <th>名称</th>
            <th style={{ width: 48 }}>射程</th>
            <th style={{ width: 56 }}>回数</th>
            <th style={{ width: 64 }}>基本命中</th>
            <th style={{ width: 72 }}>戦闘修正</th>
            <th style={{ width: 72 }}>武器スキル</th>
            <th style={{ width: 72 }}>最終命中</th>
          </tr>
        </thead>
        <tbody>
          {weaponHitRows.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ opacity: 0.7 }}>
                —
              </td>
            </tr>
          ) : (
            weaponHitRows.map(({ grip, w, baseHit, combatMod, weaponSkillLevel, req, finalHit }, idx) => (
              <tr key={`w-${idx}`}>
                <td>{grip}</td>
                <td>{w?.name ?? "—"}</td>
                <td>{w?.range ?? "—"}</td>
                <td>{w?.attacks ?? "—"}</td>
                <td className="num">{fmtSigned(baseHit)}</td>
                <td className="num">{fmtSigned(combatMod)}</td>
                <td className="num">{weaponSkillLevel}</td>
                <td className="num">
                  {fmtSigned(finalHit)}
                  {!req.met && <span style={{ opacity: 0.75, marginLeft: 6 }}>（要件未達 -20）</span>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 12 }}>
        {weaponDetails.map(({ grip, w, req }, idx) => (
          <div key={`wdetail-${idx}`} style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 6 }}>
            <div style={{ opacity: 0.8 }}>
              <b>{grip}</b>：{w?.name ?? "—"}
            </div>
            <div>ダメージ: {w?.damage ?? "—"}</div>
            <div>
              必要スキル: {renderRequirementText(w?.requirement)}
              {Array.isArray(w?.requirement) && w.requirement.length >= 2 && (
                <span style={{ opacity: 0.8 }}> （所持: {getSkillLevel(String(w.requirement[0] ?? ""))}）</span>
              )}
            </div>
            <div style={{ opacity: 0.85 }}>メモ: {w?.memo || "—"}</div>
            {!req.met && <div style={{ opacity: 0.85 }}>※ 必要スキル値に達していないため、命中に -20 ペナルティ</div>}
          </div>
        ))}
      </div>

      <div className="panel-title" style={{ marginTop: 12 }}>
        防具
      </div>

      <table className="sheet-table" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ width: 52 }}>区分</th>
            <th>名称</th>
            <th style={{ width: 64 }}>回避</th>
            <th style={{ width: 64 }}>防御</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>防具</td>
            <td>{ar?.name ?? "—"}</td>
            <td className="num">{ar ? fmtSigned(ar.evadeMod) : "—"}</td>
            <td className="num">{ar?.defenseValue ?? "—"}</td>
          </tr>
          <tr>
            <td>盾</td>
            <td>
              {sh?.name ?? "—"}
              {!shieldReq.met && sh && <span style={{ opacity: 0.75, marginLeft: 6 }}>（要件未達）</span>}
            </td>
            <td className="num">{sh ? fmtSigned(sh.evadeMod) : "—"}</td>
            <td className="num">{sh?.defenseValue ?? "—"}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 12 }}>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 6 }}>
          <div style={{ opacity: 0.8 }}>
            <b>防具メモ</b>
          </div>
          <div style={{ opacity: 0.85 }}>{ar?.memo || "—"}</div>
        </div>

        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 6 }}>
          <div style={{ opacity: 0.8 }}>
            <b>盾メモ</b>
          </div>
          <div style={{ opacity: 0.85 }}>{sh?.memo || "—"}</div>

          <div style={{ marginTop: 6 }}>
            必要スキル: {renderRequirementText(sh?.requirement)}
            {Array.isArray(sh?.requirement) && sh.requirement.length >= 2 && (
              <span style={{ opacity: 0.8 }}> （所持: {getSkillLevel(String(sh.requirement[0] ?? ""))}）</span>
            )}
          </div>

          {!shieldReq.met && sh && (
            <div style={{ opacity: 0.85 }}>
              ※ 必要スキル値に達していないため、回避(修正)に -20 ペナルティ（盾の本来ペナルティに追加）
            </div>
          )}
        </div>
      </div>

      <div className="panel-title" style={{ marginTop: 12 }}>
        戦闘修正
      </div>

      <table className="sheet-table" style={{ fontSize: 12 }}>
        <tbody>
          <tr>
            <td>白兵</td>
            <td className="num">{fmtSigned(meleeMod)}</td>
          </tr>
          <tr>
            <td>射撃</td>
            <td className="num">{fmtSigned(rangedMod)}</td>
          </tr>
          <tr>
            <td>回避(元値)</td>
            <td className="num">{evadeRawBase}</td>
          </tr>
          <tr>
            <td>回避(修正)</td>
            <td className="num">
              {evadeMod10}
              <span style={{ opacity: 0.75, marginLeft: 6 }}>（丸め後{evadeMod10Base}）</span>
            </td>
          </tr>
          <tr>
            <td>防御値</td>
            <td className="num">{defenseValue}</td>
          </tr>
          <tr>
            <td>抵抗</td>
            <td className="num">{fmtSigned(resistMod)}</td>
          </tr>
        </tbody>
      </table>

      <div className="footer-meta" style={{ marginTop: 10, opacity: 0.6 }}>
        ver {s.version}
      </div>
    </aside>
  );
}
