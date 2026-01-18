// src/pages/HeaderTest.jsx
import React, { useMemo, useState } from "react";
import { HeaderSection } from "/src/pages/sheets/heroSheet/sections/HeaderSection.jsx";

/**
 * HeaderSection（薄い版）用テスト
 * - model は { s, editable, isCreate, setField } だけ渡す
 * - a/mods/hp/moneyG/fp は HeaderSection 側で state から算出
 */

function makeDefaultState() {
  return {
    version: 1,
    basic: {
      playerName: "",
      name: "",
      age: "",
      gender: "",
      nationality: "",
      job: "",
      heroLevel: 1,
      pairExp: 0,
    },
    abilities: {
      method: "point",
      str: 10,
      dex: 10,
      agi: 10,
      vit: 10,
      int: 10,
      psy: 10,
    },
    resources: {
      hpNormalRV: 0,
      hpWoundRV: 0,
      mpRV: 0,
    },
    equipment: {
      moneyG: 0,
      fp: 0,
    },
  };
}

function setAtPath(obj, path, valueOrFn) {
  const next = structuredClone(obj);
  let cur = next;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  const last = path[path.length - 1];
  const prevVal = cur[last];
  cur[last] = typeof valueOrFn === "function" ? valueOrFn(prevVal) : valueOrFn;
  return next;
}

export default function HeaderTest() {
  const [mode, setMode] = useState("edit"); // "view" | "edit" | "create"
  const [s, setS] = useState(() => makeDefaultState());

  const editable = mode === "edit" || mode === "create";
  const isCreate = mode === "create";

  function setField(path, valueOrFn) {
    setS((prev) => setAtPath(prev, path, valueOrFn));
  }

  const model = useMemo(() => {
    return { s, editable, isCreate, setField };
  }, [s, editable, isCreate]);

  function fillSample() {
    setS((prev) => {
      let next = prev;
      next = setAtPath(next, ["basic"], (b) => ({
        ...(b ?? {}),
        playerName: "PL",
        name: "テスト英雄",
        nationality: "JP",
        job: "テスター",
        age: "??",
        gender: "不詳",
        heroLevel: 3,
        pairExp: 120,
      }));
      next = setAtPath(next, ["abilities"], (a) => ({
        ...(a ?? {}),
        method: "point",
        str: 12,
        dex: 11,
        agi: 9,
        vit: 10,
        int: 14,
        psy: 8,
      }));
      next = setAtPath(next, ["resources"], (r) => ({
        ...(r ?? {}),
        hpNormalRV: 0,
        hpWoundRV: 0,
        mpRV: 0,
      }));
      next = setAtPath(next, ["equipment"], (e) => ({
        ...(e ?? {}),
        moneyG: 12345,
        fp: 7,
      }));
      return next;
    });
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <b>HeaderSection Test</b>

        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ opacity: 0.75 }}>mode</span>
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: "6px 8px" }}>
            <option value="view">view</option>
            <option value="edit">edit</option>
            <option value="create">create</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => setS(makeDefaultState())}
          style={{ padding: "6px 10px", border: "1px solid #111", borderRadius: 8, background: "#fff" }}
        >
          reset
        </button>

        <button
          type="button"
          onClick={fillSample}
          style={{ padding: "6px 10px", border: "1px solid #111", borderRadius: 8, background: "#fff" }}
        >
          fill sample
        </button>
      </div>

      <div className="sheet hero-sheet">
        <HeaderSection model={model}>
          <button type="button" className="sheet-btn">
            ダミーボタン
          </button>
        </HeaderSection>
      </div>

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer" }}>state JSON（確認用）</summary>
        <pre style={{ fontSize: 12, background: "#f7f7f7", padding: 12, borderRadius: 8, overflowX: "auto" }}>
          {JSON.stringify(s, null, 2)}
        </pre>
      </details>
    </div>
  );
}
