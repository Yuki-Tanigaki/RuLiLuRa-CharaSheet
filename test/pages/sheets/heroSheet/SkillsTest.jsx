// test/pages/sheets/heroSheet/SkillsTest.jsx
import React, { useMemo, useState } from "react";

import { getMasters } from "/src/common/catalog.js";
import { mergeCatalog } from "/src/common/catalogMerge.js";
import { useSetField } from "/src/common/useSetField.js";

import { SkillsSection } from "/src/pages/sheets/heroSheet/sections/SkillsSection.jsx";

// テスト用：自作スキルを追加する（CatalogSheetの userCatalog 形に合わせる）
function makeEmptyUserCatalog() {
  return {
    version: 1,
    data: {
      // registry.json のカテゴリキーに合わせる（全部なくてもOKだが、skillだけは用意）
      skill: [],
    },
  };
}

function nextUserId(masters, userRows) {
  const maxM = Math.max(0, ...(masters ?? []).map((x) => Number(x?.id)).filter(Number.isFinite));
  const maxU = Math.max(0, ...(userRows ?? []).map((x) => Number(x?.id)).filter(Number.isFinite));
  return Math.max(maxM, maxU) + 1;
}

export default function SkillsTest() {
  // masters（skillカテゴリ）
  const mastersSkill = useMemo(() => {
    try {
      return getMasters("skill")?.list ?? [];
    } catch {
      return [];
    }
  }, []);

  // state（最小構成）
  const [state, setState] = useState(() => ({
    version: 1,
    // SkillsSection が参照する領域
    skills: {
      rows: [
        { kind: "master", id: null, level: 10 },
        { kind: "master", id: null, level: 10 },
      ],
      // create系は今回使わないが、存在してもOK
      bonusDraft: { int: [], dex: [] },
      bonusConfirmed: false,
      freeItemPicks: {},
      freeItemClaims: {},
    },
    // 自作データ（CatalogSheetと同じ形：{version, data:{skill:[]}}）
    userCatalog: makeEmptyUserCatalog(),
    // inventory は create 機能で触る可能性があるが、今回は空でOK
    inventory: [],
  }));

  const setField = useSetField(setState);

  // user rows
  const userSkills = useMemo(() => {
    return Array.isArray(state?.userCatalog?.data?.skill) ? state.userCatalog.data.skill : [];
  }, [state?.userCatalog]);

  // master + user をマージ（参照/表示用）
  const catalog = useMemo(() => {
    return mergeCatalog({
      mastersByKind: { skill: mastersSkill },
      userCatalog: { skill: userSkills },
      kindMeta: {
        skill: { idField: "id", nameField: "name" },
      },
      sort: true,
    });
  }, [mastersSkill, userSkills]);

  // SkillsSection は "masterSkills" を select の候補として使う。
  // 現状の SkillsSection は "m:<id>" 前提なので、ここは master のみを渡すのが安全。
  const masterSkills = mastersSkill;

  // rows
  const skillRows = useMemo(() => {
    return Array.isArray(state?.skills?.rows) ? state.skills.rows : [];
  }, [state?.skills]);

  // rowLabel: master/custom を見て label を返す
  const rowLabel = (row) => {
    if (!row) return "—";

    if (row.kind === "master") {
      const id = row.id ?? null;
      if (id == null) return "—";
      // SkillsSection は m: 形式で扱うので、ここも合わせる
      return catalog.labelOf("skill", `m:${String(id)}`);
    }

    // 将来 custom 行を表示したい場合
    if (row.kind === "custom") {
      const name = String(row.name ?? "").trim();
      return name || "—";
    }

    // 互換：row が {id,name} だけ持つような場合
    if (row.id != null) return catalog.labelOf("skill", `m:${String(row.id)}`);

    return "—";
  };

  // テスト用 model（SkillsSection が必要とするものだけ）
  const model = useMemo(() => {
    return {
      // flags
      editable: true,
      isCreate: false,

      // state refs / setter
      s: state,
      setField,

      // masters
      masterSkills,
      rowLabel,
      skillRows,

      // bonus（今回は無し扱い）
      intBonusValue: 0,
      dexBonusValue: 0,

      // create unlock（今回は空）
      createUnlockTargets: [],

      // free item で呼ばれる可能性があるのでダミー（今回は isCreate=false なので実行されない）
      addToInventory: () => {},
      removeFromInventory: () => {},

      // カテゴリラベル表示用（SkillsSection 内で参照される）
      catalog: {
        categories: { skill: { label: "スキル" } },
      },
    };
  }, [state, setField, masterSkills, skillRows, catalog]);

  function addUserSkill() {
    const id = nextUserId(mastersSkill, userSkills);
    const name = `自作スキル${id}`;

    setField(["userCatalog"], (prev) => {
      const base = prev && typeof prev === "object" ? structuredClone(prev) : makeEmptyUserCatalog();
      if (!base.data) base.data = {};
      if (!Array.isArray(base.data.skill)) base.data.skill = [];
      base.data.skill.unshift({
        id,
        name,
        class: [],
        itemBonus: {},
        memo: "",
      });
      return base;
    });
  }

  return (
    <div className="page sheet" style={{ padding: 16, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>SkillsTest</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="sheet-btn" onClick={addUserSkill}>
            ＋ 自作スキル追加
          </button>
          <button type="button" className="sheet-btn" onClick={() => console.log("state", state)}>
            stateをconsole.log
          </button>
        </div>
      </div>

      {/* ここが本体：SkillsSection の動作確認 */}
      <SkillsSection model={model} />

      {/* master + user のマージ結果プレビュー */}
      <section className="panel" style={{ padding: 12 }}>
        <div className="panel-title">master + 自作（マージ結果プレビュー）</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
          master: {mastersSkill.length} / user: {userSkills.length} / merged(list): {catalog.list("skill").length}
        </div>

        <div style={{ marginTop: 10, overflowX: "auto" }}>
          <table className="sheet-table" style={{ width: "max-content", minWidth: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: 90 }}>source</th>
                <th style={{ width: 120 }}>key</th>
                <th style={{ width: 90 }}>id</th>
                <th style={{ width: 260 }}>name</th>
              </tr>
            </thead>
            <tbody>
              {catalog.list("skill").slice(0, 50).map((e) => (
                <tr key={String(e.__key)}>
                  <td>{String(e.__source)}</td>
                  <td>{String(e.__key)}</td>
                  <td>{String(e.id ?? "—")}</td>
                  <td>{String(e.name ?? "—")}</td>
                </tr>
              ))}
              {catalog.list("skill").length > 50 && (
                <tr>
                  <td colSpan={4} style={{ opacity: 0.75 }}>
                    …省略（先頭50件のみ表示）
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75, lineHeight: 1.6 }}>
          ※ source は <b>m=master</b> / <b>u=user</b>。<br />
          ※ SkillsSection の現状 UI は master 行の参照キーが <code>m:&lt;id&gt;</code> 前提なので、
          自作スキル（<code>u:&lt;id&gt;</code>）を「選択肢に混ぜる」のは別改修が必要です（このテストではマージ確認のみ）。
        </div>
      </section>
    </div>
  );
}
